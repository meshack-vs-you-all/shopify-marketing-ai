'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import apiClient from '@/lib/api';

export default function EmailSettingsPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await apiClient.get('/api/settings/integrations');
                setStatus(res.data?.email);
            } catch (err) {
                console.error('Failed to fetch email status', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading email configuration...</div>;
    }

    const isSesConnected = status?.ses?.connected;
    const isSmtpConnected = status?.smtp?.connected;

    return (
        <div className="space-y-6">
            {/* Primary Sending Method */}
            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Amazon SES (Simple Email Service)</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                            <p className="font-medium text-gray-900">Connection Status</p>
                            <p className="text-sm text-gray-500">AWS Region: {status?.ses?.region}</p>
                        </div>
                        {isSesConnected ? (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">VERIFIED</span>
                        ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">FAILED</span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Verified Identity</label>
                            <p className="mt-1 text-sm font-mono text-gray-900">{status?.ses?.identity || 'None'}</p>
                            <p className="mt-1 text-xs text-gray-400">All campaigns must come from this address.</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Sending Domain</label>
                            <p className="mt-1 text-sm font-medium text-gray-900">{status?.ses?.sendingDomain || 'N/A'}</p>
                        </div>
                    </div>

                    {!isSesConnected && (
                        <div className="bg-yellow-50 p-3 rounded text-sm text-yellow-800">
                            ⚠️ AWS Credentials are missing or invalid in backend configuration.
                        </div>
                    )}
                </div>
            </Card>

            {/* Fallback Method */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">SMTP Fallback</h2>
                    {isSmtpConnected ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded font-medium">Active</span>
                    ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">Inactive</span>
                    )}
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    Used if SES delivery fails. Currently configured host: <strong>{status?.smtp?.host || 'None'}</strong>
                </p>
            </Card>

            <div className="flex justify-end">
                <Button variant="outline" disabled>Request SES Production Access</Button>
            </div>
        </div>
    );
}
