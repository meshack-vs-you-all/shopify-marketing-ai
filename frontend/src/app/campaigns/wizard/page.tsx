'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    EnvelopeIcon,
    MegaphoneIcon,
    CheckCircleIcon,
    ArrowRightIcon,
    ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface WizardData {
    id?: string;
    type: 'NEWSLETTER' | 'META_AD' | null;
    name: string;
    // Audience
    emailListId?: string;
    targetAudience?: any;
    // Content
    subject?: string;
    htmlContent?: string;
    headline?: string;
    primaryText?: string;
    description?: string;
    cta?: string;
}

const STEPS = [
    { id: 1, name: 'Campaign Type' },
    { id: 2, name: 'Audience' },
    { id: 3, name: 'Content' },
    { id: 4, name: 'Preview & Launch' },
];

export default function CampaignWizardPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lists, setLists] = useState<any[]>([]);
    const [data, setData] = useState<WizardData>({
        type: null,
        name: '',
    });

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        try {
            const res = await api.getLists();
            setLists(res.data || []);
        } catch (err) {
            console.error('Failed to load lists', err);
        }
    };

    const updateData = (updates: Partial<WizardData>) => {
        setData(prev => ({ ...prev, ...updates }));
    };

    const nextStep = async () => {
        setError(null);

        // Validation
        if (currentStep === 1 && !data.type) {
            setError('Please select a campaign type');
            return;
        }
        if (currentStep === 1 && !data.name.trim()) {
            setError('Please enter a campaign name');
            return;
        }

        // Create draft on step 1 completion
        if (currentStep === 1 && !data.id) {
            try {
                setLoading(true);
                const res = await api.createCampaignDraft({ type: data.type!, name: data.name });
                updateData({ id: res.data.id });
            } catch (err: any) {
                setError(err.response?.data?.error || 'Failed to create campaign');
                return;
            } finally {
                setLoading(false);
            }
        }

        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    const finalize = async () => {
        if (!data.id) return;

        try {
            setLoading(true);
            if (data.type === 'NEWSLETTER') {
                await api.sendCampaignWizard(data.id);
                alert('Campaign sent successfully!');
            } else {
                await api.finalizeCampaign(data.id);
                alert('Campaign saved successfully!');
            }
            router.push('/campaigns');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to finalize campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ProtectedRoute>
            <div className="max-w-4xl mx-auto py-8 px-4">
                <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                {/* Step Indicator */}
                <nav className="mb-8">
                    <ol className="flex items-center justify-between">
                        {STEPS.map((step, idx) => (
                            <li key={step.id} className="flex items-center">
                                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${step.id < currentStep
                                        ? 'bg-green-500 border-green-500 text-white'
                                        : step.id === currentStep
                                            ? 'border-primary-500 text-primary-500'
                                            : 'border-gray-300 text-gray-400'
                                    }`}>
                                    {step.id < currentStep ? (
                                        <CheckCircleIcon className="w-6 h-6" />
                                    ) : (
                                        <span>{step.id}</span>
                                    )}
                                </div>
                                <span className={`ml-2 text-sm font-medium ${step.id === currentStep ? 'text-primary-600' : 'text-gray-500'
                                    }`}>
                                    {step.name}
                                </span>
                                {idx < STEPS.length - 1 && (
                                    <div className="flex-1 mx-4 h-0.5 bg-gray-200" />
                                )}
                            </li>
                        ))}
                    </ol>
                </nav>

                {/* Step Content */}
                <Card className="p-6 min-h-[400px]">
                    {/* Step 1: Type Selection */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Choose Campaign Type</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => updateData({ type: 'NEWSLETTER' })}
                                    className={`p-6 border-2 rounded-xl text-left transition-all ${data.type === 'NEWSLETTER'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <EnvelopeIcon className="h-8 w-8 text-primary-500 mb-3" />
                                    <h3 className="font-semibold">Email Newsletter</h3>
                                    <p className="text-sm text-gray-500 mt-1">Send email campaigns to your subscribers</p>
                                </button>
                                <button
                                    onClick={() => updateData({ type: 'META_AD' })}
                                    className={`p-6 border-2 rounded-xl text-left transition-all ${data.type === 'META_AD'
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <MegaphoneIcon className="h-8 w-8 text-primary-500 mb-3" />
                                    <h3 className="font-semibold">Meta Ad Campaign</h3>
                                    <p className="text-sm text-gray-500 mt-1">Create Facebook & Instagram ads</p>
                                </button>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => updateData({ name: e.target.value })}
                                    placeholder="Enter campaign name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Audience */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Select Audience</h2>
                            {data.type === 'NEWSLETTER' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email List</label>
                                    <select
                                        value={data.emailListId || ''}
                                        onChange={(e) => updateData({ emailListId: e.target.value })}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select a list</option>
                                        {lists.map(list => (
                                            <option key={list.id} value={list.id}>
                                                {list.name} ({list._count?.subscribers || 0} subscribers)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-6 rounded-lg text-center">
                                    <p className="text-gray-600">Meta audience targeting will be configured after campaign creation.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Content */}
                    {currentStep === 3 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Campaign Content</h2>
                            {data.type === 'NEWSLETTER' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Subject Line</label>
                                        <input
                                            type="text"
                                            value={data.subject || ''}
                                            onChange={(e) => updateData({ subject: e.target.value })}
                                            placeholder="Enter email subject"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                                        <textarea
                                            value={data.htmlContent || ''}
                                            onChange={(e) => updateData({ htmlContent: e.target.value })}
                                            placeholder="Enter email content (HTML supported)"
                                            rows={8}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Headline</label>
                                        <input
                                            type="text"
                                            value={data.headline || ''}
                                            onChange={(e) => updateData({ headline: e.target.value })}
                                            placeholder="Ad headline"
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Primary Text</label>
                                        <textarea
                                            value={data.primaryText || ''}
                                            onChange={(e) => updateData({ primaryText: e.target.value })}
                                            placeholder="Main ad copy"
                                            rows={4}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Preview */}
                    {currentStep === 4 && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-semibold">Review & Launch</h2>
                            <div className="bg-gray-50 p-6 rounded-lg space-y-4">
                                <div>
                                    <span className="text-sm text-gray-500">Campaign Name</span>
                                    <p className="font-medium">{data.name}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Type</span>
                                    <p className="font-medium">{data.type === 'NEWSLETTER' ? 'Email Newsletter' : 'Meta Ad'}</p>
                                </div>
                                {data.type === 'NEWSLETTER' && (
                                    <div>
                                        <span className="text-sm text-gray-500">Subject</span>
                                        <p className="font-medium">{data.subject || 'Not set'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Navigation */}
                <div className="flex justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1 || loading}
                    >
                        <ArrowLeftIcon className="h-4 w-4 mr-2" />
                        Back
                    </Button>

                    {currentStep < 4 ? (
                        <Button onClick={nextStep} disabled={loading}>
                            {loading ? 'Saving...' : 'Next'}
                            <ArrowRightIcon className="h-4 w-4 ml-2" />
                        </Button>
                    ) : (
                        <Button
                            variant="primary"
                            onClick={finalize}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {loading ? 'Processing...' : data.type === 'NEWSLETTER' ? 'Send Campaign' : 'Create Campaign'}
                        </Button>
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}