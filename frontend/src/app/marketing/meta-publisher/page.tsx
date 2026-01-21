'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { api } from '@/lib/api';

type PlatformType = 'instagram' | 'facebook';
type ToneType = 'professional' | 'casual' | 'playful' | 'luxury' | 'friendly';
type LengthType = 'short' | 'medium' | 'long';

interface MetaAccount {
    id: string;
    type: 'FACEBOOK_PAGE' | 'INSTAGRAM_BUSINESS' | 'WHATSAPP_BUSINESS';
    externalId: string;
    name: string;
    picture?: string;
    isActive: boolean;
}

interface GeneratedCaptions {
    short: string;
    medium: string;
    long: string;
    hashtags: string[];
    title_options: string[];
}

export default function MetaPublisherPage() {
    // State
    const [accounts, setAccounts] = useState<MetaAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [publishing, setPublishing] = useState(false);
    const [generating, setGenerating] = useState(false);

    // Form state
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [platform, setPlatform] = useState<PlatformType>('instagram');
    const [mediaUrl, setMediaUrl] = useState('');
    const [caption, setCaption] = useState('');
    const [scheduleAt, setScheduleAt] = useState('');

    // AI generation state
    const [promptHints, setPromptHints] = useState('');
    const [tone, setTone] = useState<ToneType>('friendly');
    const [length, setLength] = useState<LengthType>('medium');
    const [includeHashtags, setIncludeHashtags] = useState(true);
    const [generatedCaptions, setGeneratedCaptions] = useState<GeneratedCaptions | null>(null);

    // Status
    const [status, setStatus] = useState<{ connected: boolean; message: string } | null>(null);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    // Load accounts on mount
    useEffect(() => {
        loadAccounts();
        loadStatus();
    }, []);

    async function loadAccounts() {
        try {
            const res = await api.getMetaAccounts();
            setAccounts(res.data.accounts || []);
        } catch (err: any) {
            console.error('Failed to load accounts', err);
        } finally {
            setLoading(false);
        }
    }

    async function loadStatus() {
        try {
            const res = await api.getMetaStatus();
            setStatus({ connected: res.data.connected, message: res.data.message });
        } catch (err: any) {
            setStatus({ connected: false, message: 'Failed to check status' });
        }
    }

    async function syncAccounts() {
        setLoading(true);
        try {
            await api.syncMetaAccounts();
            await loadAccounts();
            setSuccess('Accounts synced successfully!');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to sync accounts');
        } finally {
            setLoading(false);
        }
    }

    async function generateCaptions() {
        setGenerating(true);
        setError('');

        try {
            const res = await api.generateMetaCaptions({
                prompt_hints: promptHints,
                tone,
                length,
                include_hashtags: includeHashtags,
                platform,
                creative: false,
            });

            setGeneratedCaptions(res.data.captions ? {
                short: res.data.captions.short,
                medium: res.data.captions.medium,
                long: res.data.captions.long,
                hashtags: res.data.hashtags || [],
                title_options: res.data.title_options || [],
            } : null);

            // Auto-select medium caption
            if (res.data.captions?.medium) {
                setCaption(res.data.captions.medium + (includeHashtags && res.data.hashtags?.length ? '\n\n' + res.data.hashtags.join(' ') : ''));
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to generate captions');
        } finally {
            setGenerating(false);
        }
    }

    function selectCaption(captionText: string) {
        let fullCaption = captionText;
        if (includeHashtags && generatedCaptions?.hashtags?.length) {
            fullCaption += '\n\n' + generatedCaptions.hashtags.join(' ');
        }
        setCaption(fullCaption);
    }

    async function publishPost() {
        if (!selectedAccount) {
            setError('Please select an account');
            return;
        }
        if (!caption.trim()) {
            setError('Please enter a caption');
            return;
        }

        setPublishing(true);
        setError('');
        setSuccess('');

        try {
            const target = accounts.find(a => a.id === selectedAccount)?.type === 'INSTAGRAM_BUSINESS'
                ? 'instagram'
                : 'facebook';

            const res = await api.createMetaPost({
                target,
                account_id: selectedAccount,
                media: mediaUrl ? [mediaUrl] : [],
                caption,
                schedule_at: scheduleAt || null,
                idempotency_key: crypto.randomUUID(),
            });

            if (res.data.success) {
                setSuccess(
                    res.data.scheduled_id
                        ? `Post scheduled! ID: ${res.data.scheduled_id}`
                        : `Post published! ID: ${res.data.published_id || res.data.post_id}`
                );
                // Reset form
                setCaption('');
                setMediaUrl('');
                setScheduleAt('');
                setGeneratedCaptions(null);
            } else {
                setError(res.data.error || 'Failed to publish');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to publish post');
        } finally {
            setPublishing(false);
        }
    }

    // Filter accounts by platform
    const filteredAccounts = accounts.filter(account => {
        if (platform === 'instagram') return account.type === 'INSTAGRAM_BUSINESS';
        if (platform === 'facebook') return account.type === 'FACEBOOK_PAGE';
        return true;
    });

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Meta Publisher</h1>
                <p className="text-gray-600">Create and publish posts to Instagram and Facebook</p>
            </div>

            {/* Connection Status */}
            <Card padding="md" className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-sm text-gray-600">{status?.message || 'Checking connection...'}</span>
                    </div>
                    <button
                        onClick={syncAccounts}
                        disabled={loading}
                        className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        {loading ? 'Syncing...' : 'Sync Accounts'}
                    </button>
                </div>
            </Card>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                    {success}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column: Compose */}
                <div className="space-y-6">
                    {/* Platform & Account Selection */}
                    <Card padding="md">
                        <h3 className="font-semibold mb-4">1. Select Platform & Account</h3>

                        <div className="space-y-4">
                            {/* Platform Toggle */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => { setPlatform('instagram'); setSelectedAccount(''); }}
                                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${platform === 'instagram'
                                            ? 'border-pink-500 bg-pink-50 text-pink-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    📸 Instagram
                                </button>
                                <button
                                    onClick={() => { setPlatform('facebook'); setSelectedAccount(''); }}
                                    className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors ${platform === 'facebook'
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    👍 Facebook
                                </button>
                            </div>

                            {/* Account Dropdown */}
                            <select
                                value={selectedAccount}
                                onChange={(e) => setSelectedAccount(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Select an account...</option>
                                {filteredAccounts.map(account => (
                                    <option key={account.id} value={account.id}>
                                        {account.name} ({account.type.replace('_', ' ')})
                                    </option>
                                ))}
                            </select>

                            {filteredAccounts.length === 0 && !loading && (
                                <p className="text-sm text-gray-500">
                                    No {platform} accounts connected. Click "Sync Accounts" to fetch from Meta.
                                </p>
                            )}
                        </div>
                    </Card>

                    {/* Media */}
                    <Card padding="md">
                        <h3 className="font-semibold mb-4">2. Add Media (Optional)</h3>

                        <div>
                            <label className="block text-sm text-gray-600 mb-2">Image/Video URL</label>
                            <input
                                type="url"
                                value={mediaUrl}
                                onChange={(e) => setMediaUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Enter a publicly accessible URL for your image or video
                            </p>
                        </div>

                        {mediaUrl && (
                            <div className="mt-4">
                                <img
                                    src={mediaUrl}
                                    alt="Preview"
                                    className="max-w-full h-40 object-cover rounded-lg border"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                            </div>
                        )}
                    </Card>

                    {/* AI Caption Generator */}
                    <Card padding="md">
                        <h3 className="font-semibold mb-4">3. Generate AI Captions</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-gray-600 mb-2">Topic/Product Description</label>
                                <textarea
                                    value={promptHints}
                                    onChange={(e) => setPromptHints(e.target.value)}
                                    placeholder="Describe what this post is about... e.g., 'New summer collection launch, beach vibes, sustainable fashion'"
                                    rows={2}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Tone</label>
                                    <select
                                        value={tone}
                                        onChange={(e) => setTone(e.target.value as ToneType)}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="friendly">Friendly</option>
                                        <option value="professional">Professional</option>
                                        <option value="casual">Casual</option>
                                        <option value="playful">Playful</option>
                                        <option value="luxury">Luxury</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm text-gray-600 mb-2">Length</label>
                                    <select
                                        value={length}
                                        onChange={(e) => setLength(e.target.value as LengthType)}
                                        className="w-full p-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="short">Short</option>
                                        <option value="medium">Medium</option>
                                        <option value="long">Long</option>
                                    </select>
                                </div>
                            </div>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={includeHashtags}
                                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                                    className="w-4 h-4 text-blue-600 rounded"
                                />
                                <span className="text-sm text-gray-700">Include hashtags</span>
                            </label>

                            <button
                                onClick={generateCaptions}
                                disabled={generating || !promptHints.trim()}
                                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                            >
                                {generating ? '✨ Generating...' : '✨ Generate AI Captions'}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Caption & Preview */}
                <div className="space-y-6">
                    {/* Generated Captions */}
                    {generatedCaptions && (
                        <Card padding="md">
                            <h3 className="font-semibold mb-4">AI Generated Options</h3>

                            <div className="space-y-3">
                                {[
                                    { label: 'Short', text: generatedCaptions.short },
                                    { label: 'Medium', text: generatedCaptions.medium },
                                    { label: 'Long', text: generatedCaptions.long },
                                ].map(({ label, text }) => (
                                    <div
                                        key={label}
                                        onClick={() => selectCaption(text)}
                                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${caption.startsWith(text.slice(0, 50))
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-gray-500 uppercase">{label}</span>
                                            <span className="text-xs text-gray-400">{text.length} chars</span>
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-3">{text}</p>
                                    </div>
                                ))}
                            </div>

                            {generatedCaptions.hashtags.length > 0 && (
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs font-medium text-gray-500 uppercase mb-2">Suggested Hashtags</p>
                                    <div className="flex flex-wrap gap-1">
                                        {generatedCaptions.hashtags.map((tag, i) => (
                                            <span key={i} className="px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Caption Editor */}
                    <Card padding="md">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold">4. Edit Caption</h3>
                            <span className={`text-xs ${caption.length > 2200 ? 'text-red-500' : 'text-gray-500'}`}>
                                {caption.length}/2200
                            </span>
                        </div>

                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            placeholder="Write your caption here..."
                            rows={8}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        />
                    </Card>

                    {/* Schedule */}
                    <Card padding="md">
                        <h3 className="font-semibold mb-4">5. Schedule (Optional)</h3>

                        <input
                            type="datetime-local"
                            value={scheduleAt}
                            onChange={(e) => setScheduleAt(e.target.value)}
                            min={new Date().toISOString().slice(0, 16)}
                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Leave empty to publish immediately
                        </p>
                    </Card>

                    {/* Publish Button */}
                    <button
                        onClick={publishPost}
                        disabled={publishing || !selectedAccount || !caption.trim()}
                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg rounded-xl hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg"
                    >
                        {publishing ? 'Publishing...' : scheduleAt ? '📅 Schedule Post' : '🚀 Publish Now'}
                    </button>
                </div>
            </div>
        </div>
    );
}
