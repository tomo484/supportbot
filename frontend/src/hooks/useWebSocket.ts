'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Message, ApprovalRequest, ConnectionStatus, WSMessage } from '@/types/chat';

const WS_URL = 'ws://localhost:8000/ws';

export function useWebSocket(sessionId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isTyping, setIsTyping] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout>();

  // WebSocket接続
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionStatus('connecting');
    const ws = new WebSocket(`${WS_URL}/${sessionId}`);

    ws.onopen = () => {
      setConnectionStatus('connected');
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data: WSMessage = JSON.parse(event.data);
      
      switch (data.type) {
        case 'assistant_message':
          setIsTyping(false);
          if (data.content) {
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: data.content as string,
              timestamp: new Date(),
            }]);
          }
          break;

        case 'tool_call':
          // ツール呼び出しの通知（表示はオプション）
          console.log('Tool called:', data.tool_name, data.tool_args);
          break;

        case 'approval_required':
          setIsTyping(false);
          if (data.tool_name && data.tool_args && data.tool_call_id) {
            setApprovalRequest({
              tool_name: data.tool_name,
              tool_args: data.tool_args,
              tool_call_id: data.tool_call_id,
            });
          }
          break;

        case 'done':
          setIsTyping(false);
          break;

        case 'error':
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'system',
            content: `Error: ${data.message}`,
            timestamp: new Date(),
          }]);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnectionStatus('disconnected');
    };

    ws.onclose = () => {
      setConnectionStatus('disconnected');
      setIsTyping(false);
      // 3秒後に再接続を試みる
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    wsRef.current = ws;
  }, [sessionId]);

  // メッセージ送信
  const sendMessage = useCallback((content: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    // ユーザーメッセージを追加
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    }]);

    // WebSocketで送信
    wsRef.current.send(JSON.stringify({
      type: 'user_message',
      content,
    }));

    setIsTyping(true);
  }, []);

  // 承認/拒否
  const handleApproval = useCallback((approved: boolean, reason?: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) return;
    
    wsRef.current.send(JSON.stringify({
      type: 'approval',
      approved,
      reason: reason || '',
    }));

    setApprovalRequest(null);
    setIsTyping(true);
  }, []);

  // 初期接続
  useEffect(() => {
    connect();
    
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      wsRef.current?.close();
    };
  }, [connect]);

  return {
    messages,
    approvalRequest,
    connectionStatus,
    isTyping,
    sendMessage,
    handleApproval,
  };
}

