// チャット関連の型定義
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface ToolCall {
  tool_name: string;
  tool_args: Record<string, any>;
}

export interface ApprovalRequest {
  tool_name: string;
  tool_args: Record<string, any>;
  tool_call_id: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'connecting';

// WebSocketメッセージタイプ
export interface WSMessage {
  type: 'user_message' | 'assistant_message' | 'tool_call' | 'approval_required' | 'approval' | 'done' | 'error';
  content?: string;
  tool_name?: string;
  tool_args?: Record<string, any>;
  tool_call_id?: string;
  approved?: boolean;
  reason?: string;
  message?: string;
}


