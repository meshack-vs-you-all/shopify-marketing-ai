'use client';

import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { useAuth } from '@/components/AuthProvider';

export default function AccountSettingsPage() {
    const { user, logout } = useAuth();

    return (
        <div className="space-y-6">
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
                <h2 className="text-lg font-medium text-gray-900 mb-4">Security</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Role</label>
                        <div className="mt-1 inline-block px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                            {user?.role || 'Admin'}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-sm font-medium text-gray-900 mb-2">Session Management</h3>
                        <p className="text-sm text-gray-600 mb-3">
                            Sign out of your account on this device.
                        </p>
                        <Button variant="outline" onClick={logout} className="text-red-600 border-red-200 hover:bg-red-50">
                            Sign Out
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}
