"""
FastAPI + WebSocket server for Customer Support Agent
最小限の実装: 既存のchatbot.pyロジックをWebSocket経由で公開
"""
import os
import sys
import uuid
import json
from typing import Dict
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

# Import from chatbot.py
from chatbot import part_1_graph, sensitive_tool_names

app = FastAPI(title="Customer Support Agent API")

# CORS設定（Next.jsからのアクセス許可）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3002"],  # Next.jsのデフォルトポート
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# セッション管理（シンプルにインメモリ）
sessions: Dict[str, dict] = {}


@app.get("/")
async def root():
    """ヘルスチェック"""
    return {"status": "ok", "message": "Customer Support Agent API"}


@app.websocket("/ws/{session_id}")
async def websocket_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocketエンドポイント
    - メッセージ送受信
    - sensitive_tools承認フロー
    """
    await websocket.accept()
    
    # セッション初期化
    if session_id not in sessions:
        sessions[session_id] = {
            "thread_id": str(uuid.uuid4()),
            "passenger_id": "3442 587242",  # デフォルト乗客ID
        }
    
    session = sessions[session_id]
    config = {
        "configurable": {
            "passenger_id": session["passenger_id"],
            "thread_id": session["thread_id"],
        }
    }
    
    try:
        while True:
            # クライアントからのメッセージを受信
            data = await websocket.receive_json()
            message_type = data.get("type")
            
            if message_type == "user_message":
                # ユーザーメッセージを処理
                user_message = data.get("content")
                await handle_user_message(websocket, user_message, config)
                
            elif message_type == "approval":
                # 承認/拒否を処理
                approved = data.get("approved")
                reason = data.get("reason", "")
                await handle_approval(websocket, approved, reason, config)
                
    except WebSocketDisconnect:
        # セッションは保持（再接続可能）
        pass


async def handle_user_message(websocket: WebSocket, user_message: str, config: dict):
    """ユーザーメッセージを処理"""
    try:
        # グラフを実行
        events = part_1_graph.stream(
            {"messages": ("user", user_message)}, 
            config, 
            stream_mode="values"
        )
        
        # イベントをストリーミング送信
        for event in events:
            if "messages" in event and event["messages"]:
                last_message = event["messages"][-1]
                
                # AIメッセージを送信
                if hasattr(last_message, 'content') and last_message.content:
                    await websocket.send_json({
                        "type": "assistant_message",
                        "content": last_message.content
                    })
                
                # ツール呼び出しがある場合
                if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                    for tool_call in last_message.tool_calls:
                        await websocket.send_json({
                            "type": "tool_call",
                            "tool_name": tool_call["name"],
                            "tool_args": tool_call["args"]
                        })
        
        # 承認待ちかチェック
        snapshot = part_1_graph.get_state(config)
        if snapshot.next:
            # sensitive_toolsの承認待ち
            last_message = snapshot.values["messages"][-1]
            if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                tool_call = last_message.tool_calls[0]
                await websocket.send_json({
                    "type": "approval_required",
                    "tool_name": tool_call["name"],
                    "tool_args": tool_call["args"],
                    "tool_call_id": tool_call["id"]
                })
        else:
            # 会話完了
            await websocket.send_json({
                "type": "done"
            })
            
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })


async def handle_approval(websocket: WebSocket, approved: bool, reason: str, config: dict):
    """承認/拒否を処理"""
    from langchain_core.messages import ToolMessage
    
    try:
        snapshot = part_1_graph.get_state(config)
        if not snapshot.next:
            await websocket.send_json({
                "type": "error",
                "message": "No pending approval"
            })
            return
        
        last_message = snapshot.values["messages"][-1]
        tool_call_id = last_message.tool_calls[0]["id"]
        
        if approved:
            # 承認: グラフを続行
            result = part_1_graph.invoke(None, config)
        else:
            # 拒否: 理由をツールメッセージとして送信
            result = part_1_graph.invoke(
                {
                    "messages": [
                        ToolMessage(
                            tool_call_id=tool_call_id,
                            content=f"API call denied by user. Reasoning: '{reason}'. Continue assisting, accounting for the user's input.",
                        )
                    ]
                },
                config,
            )
        
        # 結果を送信
        if "messages" in result and result["messages"]:
            last_message = result["messages"][-1]
            if hasattr(last_message, 'content') and last_message.content:
                await websocket.send_json({
                    "type": "assistant_message",
                    "content": last_message.content
                })
        
        # 再度承認待ちかチェック
        snapshot = part_1_graph.get_state(config)
        if snapshot.next:
            last_message = snapshot.values["messages"][-1]
            if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
                tool_call = last_message.tool_calls[0]
                await websocket.send_json({
                    "type": "approval_required",
                    "tool_name": tool_call["name"],
                    "tool_args": tool_call["args"],
                    "tool_call_id": tool_call["id"]
                })
        else:
            await websocket.send_json({
                "type": "done"
            })
            
    except Exception as e:
        await websocket.send_json({
            "type": "error",
            "message": str(e)
        })


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

