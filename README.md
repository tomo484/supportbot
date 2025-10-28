# Customer Support Agent

Swiss Airlines向けのAIカスタマーサポートチャットボット。フライト、ホテル、レンタカー、エクスカーションの検索・予約・変更・キャンセルをサポートします。

## 技術スタック

### バックエンド
- **Python 3.12+**
- **FastAPI**: WebSocketベースのリアルタイムAPI
- **LangGraph**: ステートフルな会話エージェント
- **LangChain**: LLMオーケストレーション
- **SQLite**: 予約データベース

### フロントエンド
- **Next.js**: ReactベースのモダンなチャットUI
- **WebSocket**: リアルタイム双方向通信

## プロジェクト構造

```
customersupport/
├── backend/
│   ├── main.py              # FastAPI + WebSocketサーバー
│   ├── chatbot.py           # 既存のチャットボットロジック（API化）
│   ├── db.py                # データベース操作
│   └── tool/                # チャットボットツール群
│       ├── flights.py
│       ├── hotels.py
│       ├── carrental.py
│       ├── exection.py
│       ├── company-policy.py
│       └── utils.py
├── frontend/                # Next.jsアプリケーション
│   ├── app/
│   │   ├── page.tsx         # チャットUI
│   │   └── layout.tsx
│   └── package.json
├── .env                     # 環境変数（APIキー）
├── requirements.txt         # Python依存関係
└── README.md
```

## セットアップ

### 1. バックエンドのセットアップ

```bash
# 仮想環境の作成とアクティベート
python3 -m venv .venv
source .venv/bin/activate

# 依存パッケージのインストール
pip install -r requirements.txt
```

### 2. 環境変数の設定

`.env`ファイルに以下を設定:

```env
OPENAI_API_KEY=your_openai_api_key
TAVILY_API_KEY=your_tavily_api_key
```

### 3. バックエンドの起動

```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 4. フロントエンドのセットアップと起動

```bash
cd frontend
pnpm install
pnpm dev
```

ブラウザで `http://localhost:3000` にアクセス

## API仕様

### WebSocket エンドポイント

**`ws://localhost:8000/ws/{session_id}`**

#### クライアント → サーバー

```json
{
  "type": "message",
  "content": "What time is my flight?",
  "passenger_id": "3442 587242"
}
```

または、sensitive_toolsの承認時:

```json
{
  "type": "approval",
  "approved": true,
  "reason": "optional rejection reason"
}
```

#### サーバー → クライアント

通常のメッセージ:
```json
{
  "type": "message",
  "content": "Your flight is at 3:00 PM...",
  "role": "assistant"
}
```

承認リクエスト（sensitive_tools実行前）:
```json
{
  "type": "approval_request",
  "tool_name": "update_ticket_to_new_flight",
  "tool_args": {...},
  "message": "Do you approve this action?"
}
```

エラー:
```json
{
  "type": "error",
  "message": "Error description"
}
```

## 主な機能

### チャットボット機能
- ✅ フライト情報の検索・確認
- ✅ フライトの変更・キャンセル
- ✅ ホテルの検索・予約・変更・キャンセル
- ✅ レンタカーの検索・予約・変更・キャンセル
- ✅ エクスカーション（観光）の検索・予約
- ✅ 会社ポリシーの検索
- ✅ Web検索（Tavily）

### セキュリティ機能
- **Safe Tools**: 検索・情報取得（自動実行）
- **Sensitive Tools**: 予約変更・キャンセル（ユーザー承認が必要）

## 開発

### バックエンドの開発

既存の`chatbot.py`のロジックを最大限活用。`part_1_graph`をそのままWebSocket経由で利用します。

### フロントエンドの開発

シンプルなチャットUIを実装:
- メッセージ送信フォーム
- メッセージ履歴表示
- 承認ダイアログ（sensitive_tools用）

## 今後の拡張

- [ ] Redis統合（セッション永続化・パフォーマンス向上）
- [ ] ユーザー認証
- [ ] 複数言語対応
- [ ] 音声入力対応
- [ ] チャット履歴のエクスポート

## ライセンス

MIT

