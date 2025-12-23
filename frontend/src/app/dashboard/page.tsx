'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import {
    ChartBarIcon,
    MegaphoneIcon,
    EnvelopeIcon,
    CurrencyDollarIcon,
    ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        revenue: 0,
        activeCampaigns: 0,
        emailsSent: 0
    });
    const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
    const [recentEmails, setRecentEmails] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [campaignsRes, emailsRes] = await Promise.all([
                api.getCampaigns({ limit: 5 }),
                api.getEmailCampaigns()
            ]);

            const campaigns = campaignsRes.data.campaigns || [];
            const emails = emailsRes.data || [];

            // Calculate aggregate stats
            const revenue = campaigns.reduce((sum: number, c: any) => sum + (c.revenue || 0), 0);
            const activeCount = campaigns.filter((c: any) => c.status === 'ACTIVE' || c.status === 'READY' || c.status === 'SCHEDULED').length;
            const emailCount = emails.reduce((sum: number, e: any) => sum + (e.sentCount || 0), 0);

            setStats({
                revenue,
                activeCampaigns: activeCount,
                emailsSent: emailCount
            });

            setRecentCampaigns(campaigns.slice(0, 3));
            setRecentEmails(emails.slice(0, 3));

        } catch (err) {
            console.error('Failed to load dashboard data', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    return (
        <ProtectedRoute>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
                        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
                    </div>
                    <div className="flex space-x-3">
                        <Link href="/campaigns/new">
                            <Button variant="primary">
                                <MegaphoneIcon className="w-5 h-5 mr-2" />
                                New Ad Campaign
                            </Button>
                        </Link>
                        <Link href="/email/new">
                            <Button variant="outline">
                                <EnvelopeIcon className="w-5 h-5 mr-2" />
                                New Newsletter
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="bg-gradient-to-br from-primary-50 to-white border-primary-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-primary-100 rounded-lg">
                                <CurrencyDollarIcon className="w-6 h-6 text-primary-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.revenue)}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <MegaphoneIcon className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Active/Ready Campaigns</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.activeCampaigns}</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-lg">
                                <EnvelopeIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Emails Sent</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.emailsSent.toLocaleString()}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Recent Activity Split */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Ads */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                <MegaphoneIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Recent Ads
                            </h2>
                            <Link href="/campaigns" className="text-sm text-primary-600 hover:text-primary-700">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {recentCampaigns.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No recent campaigns</p>
                            ) : (
                                recentCampaigns.map(c => (
                                    <div key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                                        <div>
                                            <p className="font-medium text-gray-900">{c.name}</p>
                                            <p className="text-xs text-gray-500">{c.platform} • {c.status}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">{formatCurrency(c.revenue)}</p>
                                            <p className="text-xs text-green-600">ROAS: {c.roas?.toFixed(2) || '0.00'}x</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Recent Emails */}
                    <Card>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                <EnvelopeIcon className="w-5 h-5 mr-2 text-gray-500" />
                                Recent Newsletters
                            </h2>
                            <Link href="/email/dashboard" className="text-sm text-primary-600 hover:text-primary-700">View All</Link>
                        </div>
                        <div className="space-y-4">
                            {recentEmails.length === 0 ? (
                                <p className="text-gray-500 text-sm text-center py-4">No recent emails</p>
                            ) : (
                                recentEmails.map(e => (
                                    <div key={e.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition">
                                        <div>
                                            <p className="font-medium text-gray-900">{e.subject}</p>
                                            <p className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleDateString()}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold">{e.sentCount || 0} Sent</p>
                                            <p className="text-xs text-gray-500">Open Rate: {e.openRate || 0}%</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </ProtectedRoute>
    );
}
