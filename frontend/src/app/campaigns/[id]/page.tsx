'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    ArrowLeftIcon,
    ChartBarIcon,
    CurrencyDollarIcon,
    EyeIcon,
    CursorArrowRaysIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface Campaign {
    id: string;
    name: string;
    platform: string;
    status: string;
    budget: number;
    dailyBudget: number | null;
    impressions: number;
    clicks: number;
    spend: number;
    revenue: number;
    roas: number | null;
    createdAt: string;
}

export default function CampaignDetailPage() {
    const { id } = useParams();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadCampaign(id as string);
        }
    }, [id]);

    const loadCampaign = async (campaignId: string) => {
        try {
            setLoading(true);
            const response = await api.getCampaign(campaignId);
            setCampaign(response.data.campaign);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load campaign');
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

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-800';
            case 'PAUSED': return 'bg-yellow-100 text-yellow-800';
            case 'DRAFT': return 'bg-gray-100 text-gray-800';
            case 'COMPLETED': return 'bg-blue-100 text-blue-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <ProtectedRoute>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/campaigns">
                        <Button variant="outline" size="sm">
                            <ArrowLeftIcon className="h-4 w-4 mr-2" />
                            Back to Campaigns
                        </Button>
                    </Link>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        <Card className="animate-pulse p-6">
                            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
                            <div className="h-4 bg-gray-200 rounded w-1/2" />
                        </Card>
                    </div>
                ) : error ? (
                    <Card className="p-6 text-center">
                        <p className="text-red-600">{error}</p>
                        <Link href="/campaigns">
                            <Button variant="outline" className="mt-4">Return to Campaigns</Button>
                        </Link>
                    </Card>
                ) : campaign ? (
                    <>
                        {/* Header */}
                        <Card className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                                    <div className="flex items-center gap-3 mt-2">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                                            {campaign.status}
                                        </span>
                                        <span className="text-sm text-gray-500">{campaign.platform}</span>
                                        <span className="text-sm text-gray-500">
                                            Created {new Date(campaign.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Budget</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(campaign.budget)}</p>
                                </div>
                            </div>
                        </Card>

                        {/* Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <EyeIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Impressions</p>
                                        <p className="text-xl font-bold">{campaign.impressions.toLocaleString()}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <CursorArrowRaysIcon className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Clicks</p>
                                        <p className="text-xl font-bold">{campaign.clicks.toLocaleString()}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <CurrencyDollarIcon className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Spend</p>
                                        <p className="text-xl font-bold">{formatCurrency(campaign.spend)}</p>
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-amber-100 rounded-lg">
                                        <ChartBarIcon className="h-5 w-5 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">ROAS</p>
                                        <p className="text-xl font-bold">
                                            {campaign.roas ? `${campaign.roas.toFixed(2)}x` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Revenue */}
                        <Card className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Performance Summary</h2>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-500">Total Revenue</p>
                                    <p className="text-2xl font-bold text-green-600">{formatCurrency(campaign.revenue)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">CTR</p>
                                    <p className="text-2xl font-bold">
                                        {campaign.impressions > 0
                                            ? `${((campaign.clicks / campaign.impressions) * 100).toFixed(2)}%`
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </>
                ) : (
                    <Card className="p-6 text-center">
                        <p className="text-gray-500">Campaign not found</p>
                    </Card>
                )}
            </div>
        </ProtectedRoute>
    );
}