'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import apiClient from '@/lib/api';

export default function AuthSettingsPage() {
    const [status, setStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStatus() {
            try {
                const res = await apiClient.get('/api/settings/integrations');
                setStatus(res.data);
            } catch (err) {
                console.error('Failed to fetch auth status', err);
            } finally {
                setLoading(false);
            }
        }
        fetchStatus();
    }, []);

    if (loading) {
        return <div className="p-6 text-center text-gray-500">Loading integration status...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Meta (Facebook/Instagram) */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-xl mr-4">
                            📘
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Meta (Facebook & Instagram)</h2>
                            <p className="text-sm text-gray-500">Manage connection to Meta Ads Manager</p>
                        </div>
                    </div>
                    {status?.meta?.connected ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">CONNECTED</span>
                    ) : (
                        <span className="px-3 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">DISCONNECTED</span>
                    )}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                            <p className="mt-1 text-sm font-medium text-gray-900">{status?.meta?.message}</p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Ad Account ID</label>
                            <p className="mt-1 text-sm font-mono text-gray-600">{status?.meta?.accountId || 'Not Configured'}</p>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button variant="outline" size="sm" disabled>Reconnect Meta (Coming Soon)</Button>
                    </div>
                </div>
            </Card>

            {/* Shopify */}
            <Card>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-xl mr-4">
                            🛍️
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Shopify Store</h2>
                            <p className="text-sm text-gray-500">Sync products and orders</p>
                        </div>
                    </div>
                    {status?.shopify?.connected ? (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-bold">CONNECTED</span>
                    ) : (
                        <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs rounded-full font-bold">NOT CONFIGURED</span>
                    )}
                </div>

                <div className="border-t border-gray-100 pt-4 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider">Store URL</label>
                        <p className="mt-1 text-sm font-medium text-gray-900">{status?.shopify?.shopUrl || 'N/A'}</p>
                        <p className="mt-1 text-xs text-gray-400">To disconnect, uninstall the app from your Shopify Admin.</p>
                    </div>
                </div>
            </Card>

            {/* Google Ads */}
            <Card>
                <div className="flex items-center justify-between">
                    <div className="flex items-center opacity-60">
                        <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 text-xl mr-4">
                            🔍
                        </div>
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">Google Ads</h2>
                            <p className="text-sm text-gray-500">Upcoming integration</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>Coming Soon</Button>
                </div>
            </Card>
        </div>
    );
}
