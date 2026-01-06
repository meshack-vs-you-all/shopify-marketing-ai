'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import apiClient from '@/lib/api';

export default function SystemSettingsPage() {
    const [system, setSystem] = useState<any>(null);

    useEffect(() => {
        apiClient.get('/api/settings/system')
            .then(res => setSystem(res.data))
            .catch(console.error);
    }, []);

    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Environment Information</h2>
                <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-sm space-y-2 overflow-x-auto">
                    {system ? (
                        <pre>{JSON.stringify(system, null, 2)}</pre>
                    ) : (
                        <p className="text-gray-500">Loading system info...</p>
                    )}
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Feature Flags</h2>
                <div className="space-y-2">
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">New Campaign Wizard</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ENABLED</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">AWS SES Integration</span>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">ENABLED</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium">Billing Integration</span>
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">DISABLED</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}
