'use client';
import { WizardData } from '../page';
import { useState } from 'react';
import { api } from '@/lib/api';
import { SparklesIcon, ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
}

export default function Step3Content({ data, updateData }: Props) {
    const [generating, setGenerating] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const generate = async (field: 'subject' | 'body') => {
        try {
            setGenerating(field);
            setError(null);

            // Call Unified AI Endpoint
            const res = await api.generateEmailContent({
                type: field,
                subject: data.subject || 'A marketing email', // Context for body generation
                campaignType: 'promotional',
                model: 'gemini-1.5-flash'
            });

            // Handle response format
            // API usually returns { result: string | string[] }
            const content = res.data.result;
            const value = Array.isArray(content) ? content[0] : content;

            if (field === 'subject') {
                updateData({ subject: value });
            } else {
                updateData({ htmlContent: value });
            }
        } catch (err) {
            console.error('AI Gen Error:', err);
            setError('Failed to generate content. Please try again.');
        } finally {
            setGenerating(null);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 font-display">Craft Content</h2>
                <p className="text-gray-500 text-sm mt-1">Write compelling copy or let AI handle the heavy lifting.</p>
            </div>

            {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md flex items-center gap-2 text-sm">
                    <ExclamationCircleIcon className="w-5 h-5" />
                    {error}
                </div>
            )}

            {data.type === 'NEWSLETTER' ? (
                <div className="space-y-6">
                    {/* Subject Line */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="emailSubject" className="block text-sm font-semibold text-gray-700">Subject Line</label>
                            <button
                                type="button"
                                onClick={() => generate('subject')}
                                disabled={!!generating}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50"
                            >
                                <SparklesIcon className={`w-3.5 h-3.5 ${generating === 'subject' ? 'animate-spin' : ''}`} />
                                {generating === 'subject' ? 'Thinking...' : 'Generate Idea'}
                            </button>
                        </div>
                        <input
                            id="emailSubject"
                            type="text"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5 px-3"
                            value={data.subject || ''}
                            onChange={(e) => updateData({ subject: e.target.value })}
                            placeholder="e.g. You won't believe this offer..."
                        />
                    </div>

                    {/* Email Body */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex justify-between items-center mb-2">
                            <label htmlFor="emailBody" className="block text-sm font-semibold text-gray-700">Email Body (HTML)</label>
                            <button
                                type="button"
                                onClick={() => generate('body')}
                                disabled={!!generating}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50"
                            >
                                <SparklesIcon className={`w-3.5 h-3.5 ${generating === 'body' ? 'animate-spin' : ''}`} />
                                {generating === 'body' ? 'Writing...' : 'Enhance Content'}
                            </button>
                        </div>
                        <textarea
                            id="emailBody"
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono h-64"
                            value={data.htmlContent || ''}
                            onChange={(e) => updateData({ htmlContent: e.target.value })}
                            placeholder="<h1>Hello World</h1>"
                        />
                        <p className="text-xs text-gray-400 mt-2 text-right">Supports HTML & Inline CSS</p>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Meta Ads UI (kept simple but cleaner) */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3 text-sm text-blue-900">
                        <div className="shrink-0 text-2xl">💡</div>
                        <div>
                            <p className="font-medium">Meta Ad Best Practices</p>
                            <ul className="list-disc ml-4 mt-1 space-y-0.5 text-xs text-blue-800">
                                <li>Keep Primary Text under 125 characters.</li>
                                <li>Headlines should be punchy (under 40 chars).</li>
                                <li>Use high-quality creatives (1080x1080).</li>
                            </ul>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Primary Text</label>
                        <textarea
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm h-24"
                            value={data.primaryText || ''}
                            onChange={(e) => updateData({ primaryText: e.target.value })}
                            placeholder="The main text shown above or below the image..."
                        />
                        <div className="flex justify-end mt-1">
                            <span className={`text-xs ${(data.primaryText || '').length > 125 ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                                {(data.primaryText || '').length} / 125 recommended
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Headline</label>
                            <input
                                type="text"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                                value={data.headline || ''}
                                onChange={(e) => updateData({ headline: e.target.value })}
                                placeholder="Chat with us"
                            />
                        </div>
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Description (Optional)</label>
                            <input
                                type="text"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm"
                                value={data.description || ''}
                                onChange={(e) => updateData({ description: e.target.value })}
                                placeholder="Details below headline"
                            />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Creative URL</label>
                        <div className="relative rounded-md shadow-sm">
                            <input
                                type="text"
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm pl-3 pr-10"
                                value={data.creativeUrl || ''}
                                onChange={(e) => updateData({ creativeUrl: e.target.value })}
                                placeholder="https://..."
                            />
                            {data.creativeUrl && (
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
