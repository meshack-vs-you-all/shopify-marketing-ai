'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface Approval {
    id: string;
    type: string;
    status: string;
    entityType: string;
    entityId: string;
    requestedBy: string | null;
    requestedAt: string;
    requestData: any;
    campaignId: string | null;
}

export default function ApprovalsPage() {
    const [approvals, setApprovals] = useState<Approval[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        loadApprovals();
    }, []);

    const loadApprovals = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.getApprovals();
            setApprovals(response.data.approvals || []);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load approvals');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            setActionLoading(id);
            await api.approveRequest(id, { approvedBy: 'current-user' });
            await loadApprovals();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to approve');
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        try {
            setActionLoading(id);
            await api.rejectRequest(id, { rejectedBy: 'current-user', reason });
            await loadApprovals();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to reject');
        } finally {
            setActionLoading(null);
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            CAMPAIGN_CREATION: 'New Campaign',
            BUDGET_INCREASE: 'Budget Increase',
            BUDGET_DECREASE: 'Budget Decrease',
            CAMPAIGN_PAUSE: 'Pause Campaign',
            CAMPAIGN_DELETE: 'Delete Campaign',
            AD_CREATION: 'New Ad',
            CONTENT_GENERATION: 'AI Content',
        };
        return labels[type] || type;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Approvals</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Review and approve pending requests
                        </p>
                    </div>
                    <Button variant="outline" onClick={loadApprovals} disabled={loading}>
                        Refresh
                    </Button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                        <span className="text-red-700">{error}</span>
                    </div>
                )}

                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i} className="animate-pulse">
                                <div className="h-20 bg-gray-100 rounded" />
                            </Card>
                        ))}
                    </div>
                ) : approvals.length === 0 ? (
                    <Card className="text-center py-12">
                        <CheckCircleIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">All caught up!</h3>
                        <p className="text-gray-500 mt-1">No pending approvals at the moment.</p>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {approvals.map((approval) => (
                            <Card key={approval.id} className="p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 bg-amber-50 rounded-lg">
                                            <ClockIcon className="h-6 w-6 text-amber-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">
                                                {getTypeLabel(approval.type)}
                                            </h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {approval.entityType} • Requested {formatDate(approval.requestedAt)}
                                            </p>
                                            {approval.requestData?.details && (
                                                <p className="text-sm text-gray-600 mt-2 bg-gray-50 px-3 py-2 rounded">
                                                    {JSON.stringify(approval.requestData.details)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleReject(approval.id)}
                                            disabled={actionLoading === approval.id}
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <XCircleIcon className="h-4 w-4 mr-1" />
                                            Reject
                                        </Button>
                                        <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() => handleApprove(approval.id)}
                                            disabled={actionLoading === approval.id}
                                        >
                                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                                            {actionLoading === approval.id ? 'Processing...' : 'Approve'}
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}