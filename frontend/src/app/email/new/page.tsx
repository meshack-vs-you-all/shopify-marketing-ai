'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';

export default function NewNewsletterPage() {
    const [lists, setLists] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const router = useRouter();
    const { register, handleSubmit, setValue, watch } = useForm();
    const currentSubject = watch('subject');

    const generateContent = async (type: 'subject' | 'body') => {
        try {
            setGenerating(type);
            const selectedModel = localStorage.getItem('ai_model') || 'gemini-1.5-flash';
            const res = await api.generateEmailContent({
                type,
                subject: currentSubject, // Pass subject for body generation context
                campaignType: 'promotional', // Default for now
                model: selectedModel
            });

            if (type === 'subject') {
                // API returns array of variations, pick first or join
                // checking structure from backend: { result: [strings] } for subject
                const result = res.data.result;
                const value = Array.isArray(result) ? result[0] : result;
                setValue('subject', value);
            } else {
                // Backend returns string (HTML)
                setValue('htmlContent', res.data.result);
            }
        } catch (err) {
            alert('Failed to generate content');
            console.error(err);
        } finally {
            setGenerating(null);
        }
    };

    useEffect(() => {
        loadLists();
    }, []);

    const loadLists = async () => {
        try {
            const res = await api.getLists();
            setLists(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            setSubmitting(true);

            // 1. Create Campaign
            const campaignRes = await api.createEmailCampaign({
                name: data.subject, // Use subject as internal name for now
                subject: data.subject,
                htmlContent: data.htmlContent,
                listId: data.listId
            });

            const campaignId = campaignRes.data.id;

            // 2. Send Immediately (since UI says "Send")
            await api.sendEmailCampaign(campaignId);

            alert('Newsletter queued for sending!');
            router.push('/email/dashboard');
        } catch (err) {
            alert('Failed to send newsletter');
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="md:flex md:items-center md:justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Create Newsletter</h1>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                <div className="bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6 border border-cream-200">
                    <div className="md:grid md:grid-cols-3 md:gap-6">
                        <div className="md:col-span-1">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Audience & Content</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Choose who receives this email and what it says.
                            </p>
                        </div>

                        <div className="mt-5 md:mt-0 md:col-span-2 space-y-6">

                            {/* List Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Recipient List</label>
                                <select
                                    {...register('listId', { required: true })}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md border"
                                >
                                    <option value="">Select a list...</option>
                                    {lists.map((list) => (
                                        <option key={list.id} value={list.id}>
                                            {list.name} ({list._count?.subscribers || 0} subscribers)
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Subject Line</label>
                                    <button
                                        type="button"
                                        onClick={() => generateContent('subject')}
                                        disabled={generating === 'subject'}
                                        className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
                                    >
                                        {generating === 'subject' ? 'Generating...' : '✨ Generate with AI'}
                                    </button>
                                </div>
                                <input
                                    {...register('subject', { required: true })}
                                    type="text"
                                    className="mt-1 focus:ring-primary-500 focus:border-primary-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md p-2 border"
                                    placeholder="e.g. Big Summer Sale!"
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Email Content (HTML)
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => generateContent('body')}
                                        disabled={generating === 'body'}
                                        className="text-xs text-primary-600 hover:text-primary-800 flex items-center gap-1"
                                    >
                                        {generating === 'body' ? 'Generating...' : '✨ Generate with AI'}
                                    </button>
                                </div>
                                <div className="mt-1">
                                    <textarea
                                        {...register('htmlContent', { required: true })}
                                        rows={12}
                                        className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border font-mono"
                                        placeholder="<h1>Hello!</h1><p>Welcome to our newsletter.</p>"
                                    />
                                    <p className="mt-2 text-sm text-gray-500">
                                        Supports basic HTML.
                                    </p>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 mr-3"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                        {submitting ? 'Sending...' : (
                            <>
                                <PaperAirplaneIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                                Send Newsletter
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
