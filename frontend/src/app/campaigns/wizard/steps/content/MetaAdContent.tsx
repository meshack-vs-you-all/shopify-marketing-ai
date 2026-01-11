''''use client';
import { WizardData } from '@/hooks/useCampaignWizard';
import { useState } from 'react';
import { api } from '@/lib/api';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface Props {
    data: WizardData;
    updateData: (data: Partial<WizardData>) => void;
    generating: string | null;
    setGenerating: (field: string | null) => void;
    setError: (error: string | null) => void;
}

export default function MetaAdContent({ data, updateData, generating, setGenerating, setError }: Props) {
    const [prompt, setPrompt] = useState('A futuristic cityscape at sunset, with flying cars and neon signs, in a photorealistic style.');

    const generateImage = async () => {
        try {
            setGenerating('image');
            setError(null);
            const res = await api.generateImage({ prompt, provider: 'stability' });
            const imageUrl = res.data.url;
            updateData({ creativeUrl: imageUrl });
        } catch (err) {
            console.error('AI Image Gen Error:', err);
            setError('Failed to generate image. Please try again.');
        } finally {
            setGenerating(null);
        }
    };

    return (
        <div className="space-y-6">
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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ad Creative</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                    <div>
                        <textarea
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm h-24 font-mono text-xs"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Enter a detailed prompt for the image..."
                        />
                        <button
                            type="button"
                            onClick={generateImage}
                            disabled={!!generating}
                            className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {generating === 'image' ? 'Generating...' : 'Generate Image'}
                        </button>
                    </div>
                    <div className="flex items-center justify-center">
                        {generating === 'image' ? (
                            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center">Generating...</div>
                        ) : data.creativeUrl ? (
                            <img src={data.creativeUrl} alt="Generated creative" className="w-48 h-48 object-cover rounded-lg" />
                        ) : (
                            <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">No Image</div>
                        )}
                    </div>
                </div>
                <div className="relative rounded-md shadow-sm mt-4">
                    <input
                        type="text"
                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500 sm:text-sm pl-3 pr-10"
                        value={data.creativeUrl || ''}
                        onChange={(e) => updateData({ creativeUrl: e.target.value })}
                        placeholder="Or paste an image URL..."
                    />
                    {data.creativeUrl && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <CheckCircleIcon className="h-5 w-5 text-green-500" aria-hidden="true" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
''''