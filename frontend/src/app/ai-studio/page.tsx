'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    SparklesIcon,
    PhotoIcon,
    DocumentTextIcon,
    MegaphoneIcon,
    TagIcon,
    EnvelopeIcon,
    ClipboardDocumentCheckIcon,
    ArrowPathIcon,
    CurrencyDollarIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    ShoppingBagIcon,
    RocketLaunchIcon,
} from '@heroicons/react/24/outline';

// Fallback models if OpenRouter unavailable
const FALLBACK_MODELS = [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', type: 'text', provider: 'anthropic' },
    { id: 'openai/gpt-4.1', name: 'GPT-4.1', type: 'text', provider: 'openai' },
    { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1 Mini', type: 'text', provider: 'openai' },
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', type: 'text', provider: 'google' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', type: 'text', provider: 'meta' },
];

const CAMPAIGN_TYPES = [
    { id: 'newsletter', name: 'Weekly Newsletter', icon: EnvelopeIcon, description: 'Regular updates with featured products' },
    { id: 'promotion', name: 'Flash Sale', icon: CurrencyDollarIcon, description: 'Limited-time promotional offer' },
    { id: 'product_launch', name: 'Product Launch', icon: RocketLaunchIcon, description: 'New product announcement' },
    { id: 'seasonal', name: 'Seasonal Campaign', icon: SparklesIcon, description: 'Holiday or seasonal promotion' },
];

const TONES = ['Professional', 'Casual', 'Friendly', 'Urgent', 'Luxury'];

interface ShopifyProduct {
    id: string;
    title: string;
    description: string;
    handle: string;
    vendor: string;
    product_type: string;
    tags: string[];
    variants: Array<{ price: string; compare_at_price?: string }>;
    images: Array<{ src: string }>;
}

interface NewsletterResult {
    subject: string;
    preheader: string;
    htmlBody: string;
    textBody: string;
    ctaText: string;
    heroImagePrompt?: string;
    seoMeta?: { title: string; description: string; keywords: string[] };
    generationMeta: { model: string; productsUsed: number; timestamp: string };
}

export default function AIStudioPage() {
    const [loading, setLoading] = useState(false);
    const [productsLoading, setProductsLoading] = useState(true);
    const [shopifyProducts, setShopifyProducts] = useState<ShopifyProduct[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [newsletter, setNewsletter] = useState<NewsletterResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [usingMockData, setUsingMockData] = useState(false);

    // Dynamic models from OpenRouter
    const [availableModels, setAvailableModels] = useState<any[]>(FALLBACK_MODELS);
    const [modelsLoading, setModelsLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        campaignType: 'newsletter' as 'newsletter' | 'promotion' | 'product_launch' | 'seasonal',
        model: 'anthropic/claude-3.5-sonnet',
        tone: 'Friendly',
        seoOptimized: true,
        includeHeroImage: true,
        customInstructions: '',
    });

    // Load products and models on mount
    useEffect(() => {
        loadProducts();
        loadModels();
    }, []);

    const loadProducts = async () => {
        setProductsLoading(true);
        try {
            const response = await api.getShopifyProducts(20);
            setShopifyProducts(response.data.products || []);
            setUsingMockData(response.data.useMockData || false);
        } catch (err) {
            console.warn('Failed to load Shopify products');
            setShopifyProducts([]);
        } finally {
            setProductsLoading(false);
        }
    };

    const loadModels = async () => {
        setModelsLoading(true);
        try {
            const response = await api.getAIModels();
            if (response.data.models?.length > 0) {
                const textModels = response.data.models
                    .filter((m: any) => m.capabilities?.includes('text') || !m.capabilities)
                    .slice(0, 20);
                setAvailableModels(textModels);
            }
        } catch (err) {
            console.warn('Failed to load OpenRouter models, using fallbacks');
        } finally {
            setModelsLoading(false);
        }
    };

    const toggleProductSelection = (productId: string) => {
        setSelectedProducts(prev =>
            prev.includes(productId)
                ? prev.filter(id => id !== productId)
                : [...prev, productId]
        );
    };

    const handleGenerateNewsletter = async () => {
        setLoading(true);
        setError(null);
        setNewsletter(null);

        try {
            // Build products array from selected IDs
            const products = selectedProducts.map(id => {
                const product = shopifyProducts.find(p => p.id === id);
                if (!product) return null;
                return {
                    id: product.id,
                    title: product.title,
                    description: product.description || '',
                    price: product.variants?.[0]?.price || '0',
                    compareAtPrice: product.variants?.[0]?.compare_at_price,
                    imageUrl: product.images?.[0]?.src,
                };
            }).filter(Boolean);

            const response = await api.generateNewsletter({
                campaignType: formData.campaignType,
                products: products as any,
                tone: formData.tone.toLowerCase() as any,
                seoOptimized: formData.seoOptimized,
                includeHeroImage: formData.includeHeroImage,
                customInstructions: formData.customInstructions || undefined,
                model: formData.model,
            });

            setNewsletter(response.data.newsletter);
        } catch (err: any) {
            console.error('Newsletter generation failed:', err);
            setError(err.response?.data?.error || err.message || 'Generation failed');
        } finally {
            setLoading(false);
        }
    };

    const selectedCampaignType = CAMPAIGN_TYPES.find(t => t.id === formData.campaignType);

    return (
        <ProtectedRoute>
            <div className="space-y-8 animate-fade-in pb-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                                AI Campaign Studio
                            </span>
                            <SparklesIcon className="w-6 h-6 text-indigo-500 animate-pulse" />
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Generate complete, send-ready marketing campaigns in one click.
                        </p>
                    </div>
                    {usingMockData && (
                        <div className="flex items-center gap-2 text-amber-600 text-sm">
                            <ExclamationTriangleIcon className="w-4 h-4" />
                            <span>Using demo products (Shopify not connected)</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Configuration */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Campaign Type Selection */}
                        <Card className="bg-white/50 backdrop-blur-sm border-indigo-50 ring-1 ring-indigo-100 dark:bg-gray-800/50 dark:border-gray-700 dark:ring-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Campaign Type</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {CAMPAIGN_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setFormData({ ...formData, campaignType: type.id as any })}
                                        className={`p-3 rounded-lg border text-left transition-all ${formData.campaignType === type.id
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 ring-2 ring-indigo-200 dark:ring-indigo-500/30'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                            }`}
                                    >
                                        <type.icon className={`w-5 h-5 mb-1 ${formData.campaignType === type.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">{type.name}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{type.description}</div>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        {/* AI Model & Tone */}
                        <Card className="bg-white/50 backdrop-blur-sm border-indigo-50 ring-1 ring-indigo-100 dark:bg-gray-800/50 dark:border-gray-700 dark:ring-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">AI Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Model</label>
                                    <select
                                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3"
                                        value={formData.model}
                                        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                                    >
                                        {availableModels.map((m) => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>

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

                                {/* Options */}
                                <div className="space-y-2">
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.seoOptimized}
                                            onChange={(e) => setFormData({ ...formData, seoOptimized: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">SEO Optimized</span>
                                    </label>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={formData.includeHeroImage}
                                            onChange={(e) => setFormData({ ...formData, includeHeroImage: e.target.checked })}
                                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">Generate Hero Image Prompt</span>
                                    </label>
                                </div>
                            </div>
                        </Card>

                        {/* Custom Instructions */}
                        <Card className="bg-white/50 backdrop-blur-sm border-indigo-50 ring-1 ring-indigo-100 dark:bg-gray-800/50 dark:border-gray-700 dark:ring-0">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Instructions</h3>
                            <textarea
                                rows={3}
                                placeholder="E.g., Include a 20% discount code SUMMER20, mention free shipping over $50..."
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-3 text-sm"
                                value={formData.customInstructions}
                                onChange={(e) => setFormData({ ...formData, customInstructions: e.target.value })}
                            />
                        </Card>
                    </div>

                    {/* Middle Column: Product Selection */}
                    <div className="lg:col-span-1">
                        <Card className="h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <ShoppingBagIcon className="w-5 h-5 text-indigo-500" />
                                    Select Products
                                </h3>
                                <span className="text-sm text-gray-500">{selectedProducts.length} selected</span>
                            </div>

                            {productsLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <ArrowPathIcon className="w-6 h-6 animate-spin text-gray-400" />
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                                    {shopifyProducts.map(product => (
                                        <button
                                            key={product.id}
                                            onClick={() => toggleProductSelection(product.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selectedProducts.includes(product.id)
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 ring-1 ring-indigo-200'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            <div className="w-12 h-12 rounded-md bg-gray-100 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                {product.images?.[0]?.src ? (
                                                    <img src={product.images[0].src} alt={product.title} className="w-full h-full object-cover" />
                                                ) : (
                                                    <PhotoIcon className="w-6 h-6 m-3 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{product.title}</div>
                                                <div className="text-xs text-gray-500">${product.variants?.[0]?.price || '0'}</div>
                                            </div>
                                            {selectedProducts.includes(product.id) && (
                                                <CheckCircleIcon className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </div>

                    {/* Right Column: Generate & Results */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Generate Button */}
                        <Card className="bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                            <div className="text-center py-4">
                                <h3 className="text-xl font-bold mb-2">Ready to Generate</h3>
                                <p className="text-indigo-100 text-sm mb-4">
                                    {selectedCampaignType?.name} • {selectedProducts.length} products • {formData.tone} tone
                                </p>
                                <Button
                                    onClick={handleGenerateNewsletter}
                                    disabled={loading || selectedProducts.length === 0}
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-8 py-3 rounded-full shadow-lg font-semibold flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <ArrowPathIcon className="w-5 h-5 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <SparklesIcon className="w-5 h-5" />
                                            Generate Complete Newsletter
                                        </>
                                    )}
                                </Button>
                                {selectedProducts.length === 0 && (
                                    <p className="text-indigo-200 text-xs mt-2">Select at least one product</p>
                                )}
                            </div>
                        </Card>

                        {/* Error Display */}
                        {error && (
                            <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
                                <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    <span>{error}</span>
                                </div>
                            </Card>
                        )}

                        {/* Results */}
                        {newsletter && (
                            <Card className="animate-fade-in">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <CheckCircleIcon className="w-5 h-5 text-green-500" />
                                    Newsletter Generated
                                </h3>

                                <div className="space-y-4">
                                    {/* Subject & Preheader */}
                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Subject Line</div>
                                        <div className="font-medium text-gray-900 dark:text-white">{newsletter.subject}</div>
                                    </div>

                                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Preheader</div>
                                        <div className="text-sm text-gray-700 dark:text-gray-300">{newsletter.preheader}</div>
                                    </div>

                                    {/* CTA */}
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4">
                                        <div className="text-xs text-indigo-600 uppercase tracking-wider mb-1">Call to Action</div>
                                        <div className="font-medium text-indigo-700 dark:text-indigo-300">{newsletter.ctaText}</div>
                                    </div>

                                    {/* Hero Image Prompt */}
                                    {newsletter.heroImagePrompt && (
                                        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-4">
                                            <div className="text-xs text-pink-600 uppercase tracking-wider mb-1">Hero Image Prompt</div>
                                            <div className="text-sm text-pink-700 dark:text-pink-300">{newsletter.heroImagePrompt}</div>
                                        </div>
                                    )}

                                    {/* SEO Meta */}
                                    {newsletter.seoMeta && (
                                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                                            <div className="text-xs text-green-600 uppercase tracking-wider mb-1">SEO Keywords</div>
                                            <div className="flex flex-wrap gap-1">
                                                {newsletter.seoMeta.keywords.map((kw, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 text-xs rounded-full">{kw}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* HTML Preview Toggle */}
                                    <details className="group">
                                        <summary className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                                            View Full HTML Body
                                        </summary>
                                        <div className="mt-2 bg-gray-900 rounded-lg p-4 max-h-[400px] overflow-y-auto">
                                            <pre className="text-xs text-gray-300 whitespace-pre-wrap">{newsletter.htmlBody}</pre>
                                        </div>
                                    </details>

                                    {/* Generation Meta */}
                                    <div className="text-xs text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        Generated with {newsletter.generationMeta.model} • {newsletter.generationMeta.productsUsed} products
                                    </div>
                                </div>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
