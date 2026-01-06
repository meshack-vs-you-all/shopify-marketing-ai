'use client';

import { Card } from '@/components/Card';

export default function GeneralSettingsPage() {
    return (
        <div className="space-y-6">
            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Workspace Information</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Workspace Name</label>
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
                                Glowify Default Workspace
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Primary Domain</label>
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
                                glowifybabystores.com
                            </div>
                            <p className="mt-1 text-xs text-gray-400">Used for email links and tracking.</p>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Localization</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Timezone</label>
                            <select disabled className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 text-gray-500">
                                <option>UTC (Coordinated Universal Time)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Currency</label>
                            <select disabled className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-50 text-gray-500">
                                <option>USD ($)</option>
                            </select>
                            <p className="mt-1 text-xs text-gray-400">Synced from your Shopify store settings.</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
