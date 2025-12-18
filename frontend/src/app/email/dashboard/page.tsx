'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import {
    EnvelopeIcon,
    PaperAirplaneIcon,
    CursorArrowRaysIcon,
    EyeIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
    overview: {
        totalCampaigns: number;
        totalSent: number;
        avgDeliveryRate: number;
        avgOpenRate: number;
        avgClickRate: number;
    };
    recentCampaigns: any[];
}

export default function EmailDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const res = await api.getDashboardStats();
            setStats(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading dashboard...</div>;
    }

    const overview = stats?.overview || {
        totalCampaigns: 0,
        totalSent: 0,
        avgDeliveryRate: 0,
        avgOpenRate: 0,
        avgClickRate: 0
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
                    <p className="text-gray-500 dark:text-gray-400">Campaign performance and engagement overview.</p>
                </div>
                <div className="flex gap-3">
                    <Link href="/email/lists">
                        <span className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Manage Lists
                        </span>
                    </Link>
                    <Link href="/email/new">
                        <span className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
                            <PaperAirplaneIcon className="w-4 h-4 mr-2" />
                            New Campaign
                        </span>
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Sent"
                    value={overview.totalSent.toLocaleString()}
                    subtitle="Emails successfully sent"
                    icon={PaperAirplaneIcon}
                    color="text-blue-600 bg-blue-100"
                />
                <StatCard
                    title="Avg. Delivery Rate"
                    value={`${overview.avgDeliveryRate}%`}
                    subtitle="Target: >95%"
                    icon={EnvelopeIcon}
                    color="text-emerald-600 bg-emerald-100"
                />
                <StatCard
                    title="Avg. Open Rate"
                    value={`${overview.avgOpenRate}%`}
                    subtitle="Industry avg: ~20%"
                    icon={EyeIcon}
                    color="text-purple-600 bg-purple-100"
                />
                <StatCard
                    title="Avg. Click Rate"
                    value={`${overview.avgClickRate}%`}
                    subtitle="Industry avg: ~2%"
                    icon={CursorArrowRaysIcon}
                    color="text-amber-600 bg-amber-100"
                />
            </div>

            {/* Charts / Recent Activity Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Campaigns List */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Campaigns</h3>
                        <Link href="/email/campaigns" className="text-sm text-indigo-600 hover:text-indigo-800">View All</Link>
                    </div>
                    <Card className="p-0 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Campaign</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">List</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sent</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                    {stats?.recentCampaigns.map((campaign) => (
                                        <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{campaign.name}</div>
                                                <div className="text-xs text-gray-500">{new Date(campaign.createdAt).toLocaleDateString()}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${campaign.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                        campaign.status === 'SENDING' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {campaign.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.emailList?.name || 'Unknown List'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {campaign.sentCount}
                                            </td>
                                        </tr>
                                    ))}
                                    {stats?.recentCampaigns.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                                No campaigns yet.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Quick Actions / Integration Status */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Total Campaigns</span>
                                <span className="font-bold text-gray-900 dark:text-white">{overview.totalCampaigns}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                <span className="text-sm text-gray-600 dark:text-gray-300">Bounce Rate</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {(overview.totalSent > 0 ? ((overview.totalSent - overview.totalSent * (overview.avgDeliveryRate / 100)) / overview.totalSent * 100).toFixed(1) : 0)}%
                                </span>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-bold">AI Content Studio</h3>
                                <p className="text-indigo-100 text-sm mt-1">Generate engaging emails in seconds.</p>
                            </div>
                            <ChartBarIcon className="w-8 h-8 text-indigo-200" />
                        </div>
                        <Link href="/ai-studio">
                            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg text-sm font-bold transition-all">
                                Open Studio
                            </button>
                        </Link>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, subtitle, icon: Icon, color }: any) {
    return (
        <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
                    <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                </div>
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </Card>
    );
}
