'use client';

import { useState } from 'react';
import type { ApprovalRequest } from '@/types/chat';

interface ApprovalDialogProps {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function ApprovalDialog({ request, onApprove, onReject }: ApprovalDialogProps) {
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const handleReject = () => {
    if (showRejectForm) {
      onReject(rejectReason);
      setRejectReason('');
      setShowRejectForm(false);
    } else {
      setShowRejectForm(true);
    }
  };

  return (
    <div className="flex justify-center mb-4">
      <div className="max-w-[80%] w-full bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
        <div className="flex items-center mb-2">
          <span className="text-2xl mr-2">⚠️</span>
          <h3 className="text-lg font-semibold text-yellow-900">Approval Required</h3>
        </div>
        
        <div className="bg-white rounded p-3 mb-3">
          <div className="text-sm font-semibold text-gray-700 mb-2">
            Tool: <span className="text-blue-600">{request.tool_name}</span>
          </div>
          <div className="text-sm text-gray-600">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(request.tool_args, null, 2)}
            </pre>
          </div>
        </div>

        {showRejectForm ? (
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for rejection:
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Explain why you're rejecting this action..."
            />
          </div>
        ) : null}

        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            ✓ Approve
          </button>
          <button
            onClick={handleReject}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            ✗ {showRejectForm ? 'Submit Rejection' : 'Reject'}
          </button>
          {showRejectForm && (
            <button
              onClick={() => {
                setShowRejectForm(false);
                setRejectReason('');
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


