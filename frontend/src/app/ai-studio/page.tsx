'use client';

import { useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
import {
    SparklesIcon,
    PhotoIcon,
    DocumentTextIcon,
    MegaphoneIcon,
    TagIcon,
    EnvelopeIcon,
    ClipboardDocumentCheckIcon,
    ArrowPathIcon
} from '@heroicons/react/24/outline';

const MODELS = [
    { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite (Stable)', type: 'text' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash (Standard)', type: 'text' },
    { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Fast/Limits)', type: 'text' },
    { id: 'imagen-3.0', name: 'Imagen 3.0 (High Quality)', type: 'image' }
];

const TONES = ['Professional', 'Casual', 'Friendly', 'Urgent', 'Luxury', 'Witty'];

type TabMode = 'email' | 'ad' | 'product' | 'image';

export default function AIStudioPage() {
    const [activeTab, setActiveTab] = useState<TabMode>('email');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null); // Can be string or object
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);

    // Consolidated Form State
    const [formData, setFormData] = useState({
        // Common
        model: 'gemini-flash-lite-latest',
        tone: 'Friendly',

        // Email
        emailType: 'newsletter',
        context: '',
        customPrompt: '',

        // Ad Copy
        platform: 'meta', // meta, google
        productName: '',
        productDescription: '',
        targetAudience: '',

        // Product
        keyFeatures: '',
        seoKeywords: '',

        // Image
        prompt: '',
        aspectRatio: '1:1'
    });

    const handleGenerate = async () => {
        setLoading(true);
        setResult(null);
        setGeneratedImage(null);

        try {
            let response;
            if (activeTab === 'email') {
                response = await api.generateEmailContent({
                    type: formData.emailType === 'subject' ? 'subject' : 'body',
                    campaignType: formData.emailType === 'subject' ? undefined : formData.emailType,
                    context: formData.context,
                    customPrompt: formData.customPrompt,
                    tone: formData.tone.toLowerCase(),
                    model: formData.model
                });
                const resData = response.data;
                setResult(Array.isArray(resData.result) ? resData.result.join('\n') : resData.result);

            } else if (activeTab === 'ad') {
                response = await api.generateAdCopy({
                    productName: formData.productName,
                    productDescription: formData.productDescription,
                    targetAudience: formData.targetAudience,
                    platform: formData.platform,
                    tone: formData.tone.toLowerCase(),
                    model: formData.model
                });
                setResult(response.data); // Validates Ad Copy specific structure

            } else if (activeTab === 'product') {
                response = await api.generateProductDescription({
                    productName: formData.productName,
                    currentDescription: formData.productDescription,
                    keyFeatures: formData.keyFeatures.split(',').map(s => s.trim()).filter(Boolean),
                    targetAudience: formData.targetAudience,
                    seoKeywords: formData.seoKeywords.split(',').map(s => s.trim()).filter(Boolean),
                    model: formData.model
                });
                setResult(response.data.result);

            } else if (activeTab === 'image') {
                response = await api.generateImage({
                    prompt: formData.prompt,
                    aspectRatio: formData.aspectRatio,
                    model: formData.model === 'imagen-3.0' ? undefined : formData.model
                });
                setGeneratedImage(response.data.imageUrl);
            }
        } catch (error: any) {
            console.error('Generation failed:', error);
            setResult(`Error: ${error.response?.data?.error || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const renderTextResult = () => {
        if (!result) return null;

        if (typeof result === 'string') {
            return (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 min-h-[200px] whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed">
                    {result}
                </div>
            );
        }

        // Handle Ad Copy JSON structure
        if (result.headlines) {
            return (
                <div className="space-y-6">
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Headlines</h4>
                        <div className="space-y-2">
                            {result.headlines.map((h: string, i: number) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm">
                                    {h}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-2">Descriptions</h4>
                        <div className="space-y-2">
                            {result.descriptions.map((d: string, i: number) => (
                                <div key={i} className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 text-sm">
                                    {d}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }
        return <pre>{JSON.stringify(result, null, 2)}</pre>;
    };

    return (
        <div className="space-y-8 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            AI Content Studio
                        </span>
                        <SparklesIcon className="w-6 h-6 text-indigo-500 animate-pulse" />
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Generate email copy, ad variations, and product descriptions powered by Gemini 1.5.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {[
                        { id: 'email', name: 'Email Marketing', icon: EnvelopeIcon },
                        { id: 'ad', name: 'Ad Copy', icon: MegaphoneIcon },
                        { id: 'product', name: 'Product Descriptions', icon: TagIcon },
                        { id: 'image', name: 'Visuals', icon: PhotoIcon },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => { setActiveTab(tab.id as TabMode); setResult(null); setGeneratedImage(null); }}
                            className={`
                                flex items-center whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'}
                            `}
                        >
                            <tab.icon className={`mr-2 h-5 w-5 ${activeTab === tab.id ? 'text-indigo-500' : 'text-gray-400'}`} />
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white/50 backdrop-blur-sm border-indigo-50 ring-1 ring-indigo-100 dark:bg-gray-800/50 dark:border-gray-700 dark:ring-0">
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuration</h3>
                                <div className="space-y-4">
                                    <div>
                                        <label htmlFor="aiModelSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Model</label>
                                        <select
                                            id="aiModelSelect"
                                            name="aiModelSelect"
                                            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                            value={formData.model}
                                            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                        >
                                            {MODELS.filter(m => activeTab === 'image' ? (m.type === 'image' || m.id === 'imagen-3.0') : m.type === 'text').map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {activeTab !== 'image' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tone</label>
                                            <div className="flex flex-wrap gap-2">
                                                {TONES.map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => setFormData({ ...formData, tone: t })}
                                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${formData.tone === t
                                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500/30 dark:text-indigo-300'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'
                                                            }`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'image' && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aspect Ratio</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {['1:1', '16:9', '9:16'].map(ratio => (
                                                    <button
                                                        key={ratio}
                                                        onClick={() => setFormData({ ...formData, aspectRatio: ratio })}
                                                        className={`px-3 py-2 rounded-md text-sm font-medium border text-center transition-colors ${formData.aspectRatio === ratio
                                                            ? 'bg-pink-50 border-pink-200 text-pink-700'
                                                            : 'bg-white border-gray-200 text-gray-600'
                                                            }`}
                                                    >
                                                        {ratio}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Input/Output Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="min-h-[600px] flex flex-col relative overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-b from-gray-50/50 to-transparent dark:from-gray-800/50">

                            {/* EMAIL FORM */}
                            {activeTab === 'email' && (
                                <div className="space-y-4">
                                    <label htmlFor="emailTypeSelect" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Type</label>
                                    <select
                                        id="emailTypeSelect"
                                        name="emailTypeSelect"
                                        className="w-full rounded-lg border-gray-300 p-2"
                                        value={formData.emailType}
                                        onChange={(e) => setFormData({ ...formData, emailType: e.target.value })}
                                    >
                                        <option value="newsletter">Newsletter Body</option>
                                        <option value="subject">Subject Lines</option>
                                        <option value="promotional">Promotional Blast</option>
                                        <option value="welcome">Welcome Email</option>
                                        <option value="abandoned_cart">Abandoned Cart Recovery</option>
                                    </select>

                                    <label htmlFor="emailContextInput" className="sr-only">Main Topic</label>
                                    <input
                                        id="emailContextInput"
                                        name="emailContextInput"
                                        type="text"
                                        placeholder="Main Topic / Context (e.g. Summer Sale)"
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.context}
                                        onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                                    />

                                    <label htmlFor="emailCustomPrompt" className="sr-only">Custom Instructions</label>
                                    <textarea
                                        id="emailCustomPrompt"
                                        name="emailCustomPrompt"
                                        rows={3}
                                        placeholder="Custom instructions..."
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.customPrompt}
                                        onChange={(e) => setFormData({ ...formData, customPrompt: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* AD COPY FORM */}
                            {activeTab === 'ad' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="adPlatformSelect" className="block text-sm font-medium text-gray-700">Platform</label>
                                            <select
                                                id="adPlatformSelect"
                                                name="adPlatformSelect"
                                                className="w-full rounded-lg border-gray-300 p-2"
                                                value={formData.platform}
                                                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                            >
                                                <option value="meta">Meta (Facebook/Instagram)</option>
                                                <option value="google">Google Ads</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor="adProductNameInput" className="block text-sm font-medium text-gray-700">Product Name</label>
                                            <input
                                                id="adProductNameInput"
                                                name="adProductNameInput"
                                                type="text"
                                                className="w-full rounded-lg border-gray-300 p-2"
                                                value={formData.productName}
                                                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <label htmlFor="adProductDescription" className="sr-only">Product Description</label>
                                    <textarea
                                        id="adProductDescription"
                                        name="adProductDescription"
                                        rows={3}
                                        placeholder="Product Description..."
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.productDescription}
                                        onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                                    />

                                    <label htmlFor="adTargetAudience" className="sr-only">Target Audience</label>
                                    <input
                                        id="adTargetAudience"
                                        name="adTargetAudience"
                                        type="text"
                                        placeholder="Target Audience (e.g. Busy moms, Tech enthusiasts)"
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.targetAudience}
                                        onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* PRODUCT FORM */}
                            {activeTab === 'product' && (
                                <div className="space-y-4">
                                    <label htmlFor="prodNameInput" className="sr-only">Product Name</label>
                                    <input
                                        id="prodNameInput"
                                        name="prodNameInput"
                                        type="text"
                                        placeholder="Product Name"
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.productName}
                                        onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                                    />

                                    <label htmlFor="prodDescInput" className="sr-only">Current Description</label>
                                    <textarea
                                        id="prodDescInput"
                                        name="prodDescInput"
                                        rows={3}
                                        placeholder="Current Draft / Rough Notes..."
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.productDescription}
                                        onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
                                    />

                                    <label htmlFor="prodFeaturesInput" className="sr-only">Key Features</label>
                                    <input
                                        id="prodFeaturesInput"
                                        name="prodFeaturesInput"
                                        type="text"
                                        placeholder="Key Features (comma separated)"
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.keyFeatures}
                                        onChange={(e) => setFormData({ ...formData, keyFeatures: e.target.value })}
                                    />

                                    <label htmlFor="prodSeoInput" className="sr-only">SEO Keywords</label>
                                    <input
                                        id="prodSeoInput"
                                        name="prodSeoInput"
                                        type="text"
                                        placeholder="SEO Keywords (comma separated)"
                                        className="w-full rounded-lg border-gray-300 p-3"
                                        value={formData.seoKeywords}
                                        onChange={(e) => setFormData({ ...formData, seoKeywords: e.target.value })}
                                    />
                                </div>
                            )}

                            {/* VISUALS FORM */}
                            {activeTab === 'image' && (
                                <>
                                    <label htmlFor="imagePromptInput" className="sr-only">Image Prompt</label>
                                    <textarea
                                        id="imagePromptInput"
                                        name="imagePromptInput"
                                        rows={4}
                                        placeholder="Describe your image..."
                                        className="w-full rounded-lg border-gray-300 p-3 focus:ring-pink-500"
                                        value={formData.prompt}
                                        onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
                                    />
                                </>
                            )}

                            <div className="mt-6 flex justify-end">
                                <Button
                                    onClick={handleGenerate}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all font-medium flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="w-5 h-5" />
                                            Generate
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* RESULTS AREA */}
                        <div className="flex-1 p-6 bg-gray-50/30 dark:bg-gray-900/30 overflow-y-auto">
                            {(result || generatedImage) ? (
                                <div className="animate-fade-in">
                                    <div className="flex items-center justify-between mb-2">
                                        <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Generated Output</h3>
                                    </div>
                                    {generatedImage ? (
                                        <div className="flex justify-center bg-gray-900 rounded-lg p-2">
                                            {generatedImage.includes('PLACEHOLDER') ? (
                                                <div className="text-center p-8 text-gray-400">
                                                    <PhotoIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                                    <p>Image Generation Placeholder</p>
                                                </div>
                                            ) : (
                                                <img src={generatedImage} alt="Generated" className="max-w-full h-auto rounded" />
                                            )}
                                        </div>
                                    ) : renderTextResult()}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                                    <SparklesIcon className="w-12 h-12 mb-4" />
                                    <p>Select a tool and start generating</p>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
