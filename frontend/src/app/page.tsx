'use client';

import { useEffect, useRef, useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import ChatMessage from '@/components/ChatMessage';
import MessageInput from '@/components/MessageInput';
import ApprovalDialog from '@/components/ApprovalDialog';
import ConnectionStatus from '@/components/ConnectionStatus';

export default function Home() {
  const [sessionId] = useState(() => `session-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    approvalRequest,
    connectionStatus,
    isTyping,
    sendMessage,
    handleApproval,
  } = useWebSocket(sessionId);

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, approvalRequest, isTyping]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">
            ✈️ Swiss Airlines Support Agent
          </h1>
          <ConnectionStatus status={connectionStatus} />
        </div>
      </header>

      {/* メッセージエリア */}
      <main className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 mt-8">
              <p className="text-lg mb-2">👋 Welcome to Swiss Airlines Support</p>
              <p className="text-sm">Ask me anything about your flight, hotel, or car rental!</p>
            </div>
          )}

          {messages.map((message) => (
            <ChatMessage key={message.id} message={message} />
          ))}

          {/* 承認ダイアログ */}
          {approvalRequest && (
            <ApprovalDialog
              request={approvalRequest}
              onApprove={() => handleApproval(true)}
              onReject={(reason) => handleApproval(false, reason)}
            />
          )}

          {/* タイピングインジケーター */}
          {isTyping && !approvalRequest && (
            <div className="flex justify-start mb-4">
              <div className="bg-gray-200 rounded-lg px-4 py-2">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* 入力エリア */}
      <MessageInput
        onSend={sendMessage}
        disabled={connectionStatus !== 'connected' || !!approvalRequest}
      />
    </div>
  );
}


