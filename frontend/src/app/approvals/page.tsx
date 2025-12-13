'use client';

import { useEffect, useState } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const response = await api.getApprovals();
      setApprovals(response.data.approvals || []);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    const approvedBy = prompt('Enter your name:');
    if (!approvedBy) return;

    try {
      await api.approveRequest(id, { approvedBy });
      loadApprovals();
      router.push('/campaigns');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to approve request');
    }
  };

  const handleReject = async (id: string) => {
    const rejectedBy = prompt('Enter your name:');
    if (!rejectedBy) return;
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    try {
      await api.rejectRequest(id, { rejectedBy, reason });
      loadApprovals();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to reject request');
    }
  };

  const getTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <ProtectedRoute>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Pending Approvals</h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-600">Loading approvals...</p>
          </div>
        )}

        {!loading && approvals.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600">No pending approvals</p>
          </div>
        )}

        {!loading && approvals.length > 0 && (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {getTypeLabel(approval.type)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Requested: {new Date(approval.requestedAt).toLocaleString()}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-semibold rounded-full">
                    PENDING
                  </span>
                </div>

                {approval.requestData && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(approval.requestData, null, 2)}
                    </pre>
                  </div>
                )}

                <div className="flex space-x-4">
                  <button
                    onClick={() => handleApprove(approval.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(approval.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

