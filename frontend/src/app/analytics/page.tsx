'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    ChartBarIcon,
    EnvelopeIcon,
    MegaphoneIcon,
    ArrowTrendingUpIcon,
    UsersIcon,
    CursorArrowRaysIcon
} from '@heroicons/react/24/outline';

interface AnalyticsData {
    campaigns: {
        total: number;
        active: number;
        draft: number;
    };
    email: {
        totalSent: number;
        avgOpenRate: number;
        avgClickRate: number;
    };
    lists: {
        total: number;
        totalSubscribers: number;
    };
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch real data from multiple endpoints
            const [campaignsRes, emailStatsRes, listsRes] = await Promise.all([
                api.getCampaigns().catch(() => ({ data: { campaigns: [] } })),
                api.getDashboardStats().catch(() => ({ data: { overview: {} } })),
                api.getLists().catch(() => ({ data: [] })),
            ]);

            const campaigns = campaignsRes.data.campaigns || [];
            const emailStats = emailStatsRes.data.overview || {};
            const lists = listsRes.data || [];

            setData({
                campaigns: {
                    total: campaigns.length,
                    active: campaigns.filter((c: any) => c.status === 'ACTIVE').length,
                    draft: campaigns.filter((c: any) => c.status === 'DRAFT').length,
                },
                email: {
                    totalSent: emailStats.totalSent || 0,
                    avgOpenRate: emailStats.avgOpenRate || 0,
                    avgClickRate: emailStats.avgClickRate || 0,
                },
                lists: {
                    total: lists.length,
                    totalSubscribers: lists.reduce((acc: number, l: any) => acc + (l._count?.subscribers || 0), 0),
                },
            });
        } catch (err: any) {
            setError('Failed to load analytics data');
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ title, value, subtitle, icon: Icon, color }: any) => (
        <Card className="p-6">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon className="h-6 w-6 text-white" />
                </div>
            </div>
        </Card>
    );

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Overview of your marketing performance
                    </p>
                </div>

                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <Card key={i} className="animate-pulse p-6">
                                <div className="h-24 bg-gray-100 rounded" />
                            </Card>
                        ))}
                    </div>
                ) : error ? (
                    <Card className="p-6 text-center">
                        <p className="text-red-600">{error}</p>
                    </Card>
                ) : data ? (
                    <>
                        {/* Campaign Stats */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaigns</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard
                                    title="Total Campaigns"
                                    value={data.campaigns.total}
                                    subtitle="All time"
                                    icon={MegaphoneIcon}
                                    color="bg-blue-500"
                                />
                                <StatCard
                                    title="Active Campaigns"
                                    value={data.campaigns.active}
                                    subtitle="Currently running"
                                    icon={ArrowTrendingUpIcon}
                                    color="bg-green-500"
                                />
                                <StatCard
                                    title="Draft Campaigns"
                                    value={data.campaigns.draft}
                                    subtitle="Pending launch"
                                    icon={ChartBarIcon}
                                    color="bg-amber-500"
                                />
                            </div>
                        </div>

                        {/* Email Stats */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Email Performance</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <StatCard
                                    title="Emails Sent"
                                    value={data.email.totalSent.toLocaleString()}
                                    subtitle="Total delivered"
                                    icon={EnvelopeIcon}
                                    color="bg-purple-500"
                                />
                                <StatCard
                                    title="Open Rate"
                                    value={`${data.email.avgOpenRate.toFixed(1)}%`}
                                    subtitle="Average across campaigns"
                                    icon={CursorArrowRaysIcon}
                                    color="bg-indigo-500"
                                />
                                <StatCard
                                    title="Click Rate"
                                    value={`${data.email.avgClickRate.toFixed(1)}%`}
                                    subtitle="Average CTR"
                                    icon={CursorArrowRaysIcon}
                                    color="bg-pink-500"
                                />
                            </div>
                        </div>

                        {/* Audience Stats */}
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Audience</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <StatCard
                                    title="Email Lists"
                                    value={data.lists.total}
                                    subtitle="Audience segments"
                                    icon={UsersIcon}
                                    color="bg-teal-500"
                                />
                                <StatCard
                                    title="Total Subscribers"
                                    value={data.lists.totalSubscribers.toLocaleString()}
                                    subtitle="Across all lists"
                                    icon={UsersIcon}
                                    color="bg-cyan-500"
                                />
                            </div>
                        </div>

                        {/* Coming Soon Notice */}
                        <Card className="p-6 bg-gradient-to-r from-primary-50 to-accent-50 border-primary-100">
                            <div className="flex items-center gap-3">
                                <ChartBarIcon className="h-8 w-8 text-primary-600" />
                                <div>
                                    <h3 className="font-medium text-gray-900">Advanced Analytics Coming Soon</h3>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Detailed performance trends, ROI tracking, and AI-powered insights are in development.
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </>
                ) : null}
            </div>
        </ProtectedRoute>
    );
}