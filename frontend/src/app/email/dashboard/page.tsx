'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { PlusIcon, UserGroupIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';

interface EmailCampaign {
    id: string;
    name: string;
    subject: string;
    status: string;
    sentAt?: string;
    sentCount: number;
    openCount: number;
    deliveredCount: number;
    emailList?: { name: string };
}

interface EmailList {
    id: string;
    name: string;
    _count?: { subscribers: number };
}

export default function EmailDashboard() {
    const [stats, setStats] = useState({
        subscribers: 0,
        campaigns: 0,
        sent: 0,
        openRate: 0,
    });
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [listsRes, campaignsRes] = await Promise.all([
                api.getLists(),
                api.getEmailCampaigns()
            ]);

            const lists: EmailList[] = listsRes.data;
            const emailCampaigns: EmailCampaign[] = campaignsRes.data;

            // Calculate real stats
            const totalSubscribers = lists.reduce((sum, list) => sum + (list._count?.subscribers || 0), 0);
            const sentCampaigns = emailCampaigns.filter(c => c.status !== 'DRAFT');
            const totalSent = emailCampaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0);
            const totalOpened = emailCampaigns.reduce((sum, c) => sum + (c.openCount || 0), 0);
            const totalDelivered = emailCampaigns.reduce((sum, c) => sum + (c.deliveredCount || 0), 0);
            const avgOpenRate = totalDelivered > 0 ? ((totalOpened / totalDelivered) * 100) : 0;

            setStats({
                subscribers: totalSubscribers,
                campaigns: sentCampaigns.length,
                sent: totalSent,
                openRate: Math.round(avgOpenRate * 10) / 10
            });

            setCampaigns(emailCampaigns.slice(0, 5));
        } catch (error) {
            console.error('Failed to load stats', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return 'Not sent';
        return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'COMPLETED': return 'bg-green-100 text-green-800';
            case 'SENDING': return 'bg-blue-100 text-blue-800';
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'FAILED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Marketing</h1>
                <div className="flex space-x-3">
                    <Link
                        href="/email/lists"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        Manage Lists
                    </Link>
                    <Link
                        href="/email/new"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                        Create Newsletter
                    </Link>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Subscribers" value={stats.subscribers.toLocaleString()} icon={UserGroupIcon} color="bg-blue-500" />
                <StatCard title="Campaigns Sent" value={stats.campaigns} icon={PaperAirplaneIcon} color="bg-green-500" />
                <StatCard title="Emails Delivered" value={stats.sent.toLocaleString()} icon={PaperAirplaneIcon} color="bg-indigo-500" />
                <StatCard title="Avg. Open Rate" value={`${stats.openRate}%`} icon={ChartIcon} color="bg-purple-500" />
            </div>

            {/* Recent Campaigns */}
            <div className="bg-white shadow rounded-lg overflow-hidden border border-cream-200">
                <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Campaigns</h3>
                </div>
                {loading ? (
                    <div className="px-4 py-8 text-center text-gray-500">Loading...</div>
                ) : campaigns.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                        No campaigns yet. <Link href="/email/new" className="text-primary-600 hover:underline">Create your first newsletter</Link>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-200">
                        {campaigns.map((campaign) => (
                            <li key={campaign.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex flex-col">
                                        <p className="text-sm font-medium text-primary-600 truncate">{campaign.subject}</p>
                                        <p className="text-sm text-gray-500">{formatDate(campaign.sentAt)} · {campaign.emailList?.name || 'Unknown list'}</p>
                                    </div>
                                    <div className="flex items-center space-x-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                            {campaign.status}
                                        </span>
                                        {campaign.deliveredCount > 0 && (
                                            <div className="text-sm text-gray-500">
                                                Open Rate: <span className="font-semibold text-gray-900">
                                                    {Math.round((campaign.openCount / campaign.deliveredCount) * 100)}%
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: any) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg border border-cream-200">
            <div className="p-5">
                <div className="flex items-center">
                    <div className="flex-shrink-0">
                        <div className={`rounded-md p-3 ${color} bg-opacity-10`}>
                            <Icon className={`h-6 w-6 text-${color.split('-')[1]}-600`} aria-hidden="true" />
                        </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                        <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
                            <dd>
                                <div className="text-lg font-medium text-gray-900">{value}</div>
                            </dd>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ChartIcon(props: any) {
    return (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M6 16.5v2.25a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0024 18.75V7.5a2.25 2.25 0 00-2.25-2.25h-5.85m-8.1 0V4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.75a2.25 2.25 0 00-2.25-2.25h-1.5a2.25 2.25 0 00-2.25 2.25v2.625" />
        </svg>
    );
}
