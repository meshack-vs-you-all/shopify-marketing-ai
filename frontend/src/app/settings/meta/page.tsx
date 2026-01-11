'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import apiClient from '@/lib/api';

export default function MetaSettingsPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await apiClient.get('/api/settings/integrations');
                setStatus(res.data?.meta);
            } catch (err) {
                console.error('Failed to fetch meta status', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading Meta configuration...</div>;
    }

    const isConnected = status?.connected;

    return (
        <Card padding="none">
            <div className="p-6 border-b border-gray-100">
                <h2 className="text-xl font-bold">Meta Ads Settings</h2>
                <p className="text-sm text-gray-500">
                    Manage your connection to Meta and view key configuration details.
                </p>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                        <p className="font-medium text-gray-900">Connection Status</p>
                        <p className="text-sm text-gray-500">{status?.message}</p>
                    </div>
                    {isConnected ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">CONNECTED</span>
                    ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">DISCONNECTED</span>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Account ID</label>
                        <p className="mt-1 text-sm font-mono text-gray-900">{status?.accountId || 'Not Configured'}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Instagram Account</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{status?.instagramAccount || 'Not Connected'}</p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Facebook Page</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{status?.facebookPage || 'Not Connected'}</p>
                    </div>
                </div>
            </div>
        </Card>
    );
}
