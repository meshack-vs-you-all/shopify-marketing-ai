''''use client';
import { WizardData } from '@/hooks/useCampaignWizard';
import { api } from '@/lib/api';
import { SparklesIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
    generating: string | null;
    setGenerating: (field: string | null) => void;
    setError: (error: string | null) => void;
}

export default function NewsletterContent({ data, updateData, generating, setGenerating, setError }: Props) {
    const generate = async (field: 'subject' | 'body') => {
        try {
            setGenerating(field);
            setError(null);

            const res = await api.generateEmailContent({
                type: field,
                subject: data.subject || 'A marketing email',
                campaignType: 'promotional',
                model: 'gemini-1.5-flash'
            });

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
        <div className="space-y-6">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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

            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
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
    );
}
''''