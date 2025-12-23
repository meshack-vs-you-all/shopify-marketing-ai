'use client';

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/components/AuthProvider';

export default function SettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h2>
                <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 sm:gap-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">First Name</label>
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
                                {user?.firstName || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Last Name</label>
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
                                {user?.lastName || 'N/A'}
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-gray-700">Email Address</label>
                            <div className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
                                {user?.email || 'N/A'}
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Account Actions</h2>
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        Sign out of your account on this device.
                    </p>
                    <Button variant="outline" onClick={logout} className="text-red-600 border-red-200 hover:bg-red-50">
                        Sign Out
                    </Button>
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">System Integrations</h2>
                <div className="space-y-4">
                    {/* Email */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">📧</span>
                            <div>
                                <p className="font-medium text-gray-900">Email Marketing (AWS SES)</p>
                                <p className="text-xs text-green-700">Active & Ready</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-bold">CONNECTED</span>
                    </div>

                    {/* Shopify */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-100">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🛍️</span>
                            <div>
                                <p className="font-medium text-gray-900">Shopify Store</p>
                                <p className="text-xs text-green-700">connected-shop.myshopify.com</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full font-bold">CONNECTED</span>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">📘</span>
                            <div>
                                <p className="font-medium text-gray-900">Meta Ads Manager</p>
                                <p className="text-xs text-yellow-700">Requires Access Token</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded-full font-bold">PENDING</span>
                    </div>

                    {/* Google */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center">
                            <span className="text-2xl mr-3">🔍</span>
                            <div>
                                <p className="font-medium text-gray-900">Google Ads</p>
                                <p className="text-xs text-gray-500">Not configured</p>
                            </div>
                        </div>
                        <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full font-bold">INACTIVE</span>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">AI Configuration</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <label htmlFor="aiModelSelect" className="font-medium text-gray-800">Active Model</label>
                                <p className="text-sm text-gray-500">Selected for all generation tasks</p>
                            </div>
                            <select
                                id="aiModelSelect"
                                name="aiModelSelect"
                                className="block w-48 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                                value={typeof window !== 'undefined' ? localStorage.getItem('ai_model') || 'gemini-flash-lite-latest' : 'gemini-flash-lite-latest'}
                                onChange={(e) => {
                                    localStorage.setItem('ai_model', e.target.value);
                                    window.location.reload(); // Quick refresh to update UI
                                }}
                            >
                                <option value="gemini-flash-lite-latest">Gemini Flash Lite (Stable)</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Standard)</option>
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Fast/Limits)</option>
                            </select>
                        </div>
                        <div className="flex justify-end">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">
                                {typeof window !== 'undefined' ? (localStorage.getItem('ai_model') || 'gemini-flash-lite-latest') : 'gemini-flash-lite-latest'}
                            </span>
                        </div>
                    </div>
                </Card>

                <Card>
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Subscription Plan</h2>
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="font-medium text-gray-800">Professional Plan</p>
                            <p className="text-sm text-gray-500">$49/month</p>
                        </div>
                        <Button variant="outline" size="sm">Manage Billing</Button>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">1,250 / 5,000 EMAILS SENT</p>
                </Card>
            </div>

            <Card>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
                    <Button variant="primary" size="sm">Save Changes</Button>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="notifyCampaignComplete" className="font-medium text-gray-800">Campaign Completed</label>
                            <p className="text-sm text-gray-500">Get notified when a campaign finishes sending.</p>
                        </div>
                        <input
                            id="notifyCampaignComplete"
                            name="notifyCampaignComplete"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            defaultChecked
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <label htmlFor="notifyWeeklyReport" className="font-medium text-gray-800">Weekly Performance Report</label>
                            <p className="text-sm text-gray-500">Summary of ad spend and ROAS delivered Mondays.</p>
                        </div>
                        <input
                            id="notifyWeeklyReport"
                            name="notifyWeeklyReport"
                            type="checkbox"
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            defaultChecked
                        />
                    </div>
                </div>
            </Card>
            {/* Developer Resources - Visible to Admins/Devs */}
            <Card>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Developer Resources</h2>
                <div className="bg-gray-900 text-gray-300 rounded-lg p-4 font-mono text-sm space-y-2">
                    <div className="flex justify-between border-b border-gray-700 pb-2">
                        <span>API Status</span>
                        <span className="text-green-400">ONLINE (v1.0.0)</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-700 py-2">
                        <span>Background Worker</span>
                        <span className="text-green-400">ACTIVE</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-700 py-2">
                        <span>Environment</span>
                        <span className="text-blue-400">DEVELOPMENT</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span>Frontend Version</span>
                        <span>v0.8.2-beta</span>
                    </div>
                </div>
                <div className="mt-4">
                    <Button variant="outline" className="text-xs">View API Documentation</Button>
                </div>
            </Card>
        </div>
    );
}
