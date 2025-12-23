'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import Link from 'next/link';
import {
    PaperAirplaneIcon,
    SparklesIcon,
    DocumentTextIcon,
    UsersIcon,
    CalendarIcon,
    EyeIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/Card';

const TEMPLATES = [
    {
        id: 'product-launch',
        name: 'Product Launch',
        subject: 'Introducing [Product Name]',
        body: `<h1>Meet our latest innovation</h1>
<p>We are thrilled to announce the arrival of [Product Name]. It's been a long journey, but it's finally here.</p>
<p><strong>Key Features:</strong></p>
<ul>
    <li>Feature 1: Amazing performance</li>
    <li>Feature 2: Stunning design</li>
    <li>Feature 3: Unbeatable value</li>
</ul>
<p><a href="#">Shop Now</a></p>`
    },
    {
        id: 'weekly-update',
        name: 'Weekly Update',
        subject: 'This Week\'s Highlights',
        body: `<h1>Weekly Round-up</h1>
<p>Here's what happened this week at [Company Name].</p>
<h2>Top Stories</h2>
<p>We've been busy working on [Project X] and the results are looking great.</p>
<h2>Community Spotlight</h2>
<p>Big thanks to [User] for their amazing contribution!</p>`
    },
    {
        id: 'flash-sale',
        name: 'Flash Sale',
        subject: '⚡ 48-Hour Flash Sale!',
        body: `<h1>Flash Sale Alert!</h1>
<p>Get <strong>20% OFF</strong> everything for the next 48 hours only.</p>
<p>Use code: <strong>FLASH20</strong></p>
<p><a href="#" style="background-color: #000; color: #fff; padding: 10px 20px; text-decoration: none;">Shop the Sale</a></p>`
    }
];

const AI_MODELS = [
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Fast)' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro (Smarter)' },
];

export default function NewNewsletterPage() {
    const [lists, setLists] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [generating, setGenerating] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState('gemini-1.5-flash');
    const [showPreview, setShowPreview] = useState(false);

    const router = useRouter();
    const { register, handleSubmit, setValue, watch, getValues } = useForm();

    const currentSubject = watch('subject');
    const currentBody = watch('htmlContent');
    const currentListId = watch('listId');

    const selectedListDetails = lists.find(l => l.id === currentListId);

    const generateContent = async (type: 'subject' | 'body') => {
        try {
            setGenerating(type);
            const res = await api.generateEmailContent({
                type,
                subject: currentSubject,
                campaignType: 'promotional',
                model: selectedModel
            });

            if (type === 'subject') {
                const result = res.data.result;
                const value = Array.isArray(result) ? result[0] : result;
                setValue('subject', value);
            } else {
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

    const handleTemplateLoad = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const templateId = e.target.value;
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            setValue('subject', template.subject);
            setValue('htmlContent', template.body);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            setSubmitting(true);
            const campaignRes = await api.createEmailCampaign({
                name: data.subject,
                subject: data.subject,
                htmlContent: data.htmlContent,
                listId: data.listId
            });

            const campaignId = campaignRes.data.id;
            await api.sendEmailCampaign(campaignId);

            console.log('Newsletter queued for sending!');
            router.push('/email/dashboard');
        } catch (err) {
            console.error('Failed to send newsletter', err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 font-display">Create Campaign</h1>
                    <p className="text-gray-500 mt-1">Design and schedule your next email blast.</p>
                </div>
                <div className="flex gap-3">
                    <select
                        onChange={handleTemplateLoad}
                        className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block p-2.5"
                    >
                        <option value="">Load Template...</option>
                        {TEMPLATES.map(t => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <div className="space-y-6">
                            {/* Models & AI Config */}
                            <div className="flex justify-end">
                                <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-1.5 rounded-full border border-purple-100">
                                    <SparklesIcon className="w-4 h-4 text-purple-600" />
                                    <span className="text-xs font-medium text-purple-700">AI Model:</span>
                                    <select
                                        value={selectedModel}
                                        onChange={(e) => setSelectedModel(e.target.value)}
                                        className="bg-transparent border-none p-0 text-xs font-semibold text-purple-800 focus:ring-0 cursor-pointer"
                                    >
                                        {AI_MODELS.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Subject */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Subject Line</label>
                                    <button
                                        type="button"
                                        onClick={() => generateContent('subject')}
                                        disabled={generating === 'subject'}
                                        className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
                                    >
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        {generating === 'subject' ? 'Thinking...' : 'Generate Idea'}
                                    </button>
                                </div>
                                <input
                                    {...register('subject', { required: true })}
                                    type="text"
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    placeholder="e.g. Big Summer Sale!"
                                />
                            </div>

                            {/* Body */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Email Content (HTML)</label>
                                    <button
                                        type="button"
                                        onClick={() => generateContent('body')}
                                        disabled={generating === 'body'}
                                        className="text-xs font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 px-2 py-1 rounded transition-colors flex items-center gap-1.5"
                                    >
                                        <SparklesIcon className="w-3.5 h-3.5" />
                                        {generating === 'body' ? 'Writing...' : 'Enhance Content'}
                                    </button>
                                </div>
                                <textarea
                                    {...register('htmlContent', { required: true })}
                                    rows={15}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm font-mono text-gray-600 leading-relaxed"
                                    placeholder="<h1>Hello!</h1>"
                                />
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Sidebar / Configuration */}
                <div className="space-y-6">
                    <Card>
                        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Audience</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium text-gray-700">Recipient List</label>
                                    <Link href="/email/lists" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                                        Manage Lists
                                    </Link>
                                </div>
                                <select
                                    {...register('listId', { required: true })}
                                    className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                >
                                    <option value="">Select a list...</option>
                                    {lists.map((list) => (
                                        <option key={list.id} value={list.id}>
                                            {list.name} ({list._count?.subscribers || 0})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedListDetails && (
                                <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-3">
                                    <UsersIcon className="w-5 h-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-blue-900">
                                            {selectedListDetails._count?.subscribers || 0} Recipients
                                        </p>
                                        <p className="text-xs text-blue-700 mt-0.5">
                                            Will receive this campaign immediately.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Preview & Actions */}
                    <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 space-y-4">
                        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Review & Send</h3>

                        {/* Live Preview Toggle (Visual only for now) */}
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                                <EyeIcon className="w-4 h-4" />
                                <span>Preview Mode</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowPreview(!showPreview)}
                                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${showPreview ? 'bg-primary-600' : 'bg-gray-200'}`}
                            >
                                <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${showPreview ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                        </div>

                        {showPreview && (
                            <div className="animate-fade-in p-3 bg-white border border-gray-200 rounded-lg shadow-sm text-xs">
                                <p className="font-bold text-gray-900 mb-1">Preview Summary</p>
                                <div className="space-y-1 text-gray-600">
                                    <p><span className="font-medium">Subject:</span> {currentSubject || '(No subject)'}</p>
                                    <p><span className="font-medium">To:</span> {selectedListDetails?.name || '...'} ({selectedListDetails?._count?.subscribers || 0})</p>
                                </div>
                            </div>
                        )}

                        <div className="pt-2 grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                disabled={true}
                                className="col-span-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-400 bg-gray-50 cursor-not-allowed"
                                title="Scheduling coming soon"
                            >
                                <CalendarIcon className="w-4 h-4" />
                                Schedule
                            </button>

                            <button
                                onClick={handleSubmit(onSubmit)}
                                disabled={submitting}
                                className="col-span-1 flex items-center justify-center gap-2 px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                            >
                                {submitting ? 'Sending...' : (
                                    <>
                                        <PaperAirplaneIcon className="w-4 h-4" />
                                        Send
                                    </>
                                )}
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-full text-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
