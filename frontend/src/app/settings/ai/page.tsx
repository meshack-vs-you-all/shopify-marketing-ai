'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import {
    CpuChipIcon,
    CurrencyDollarIcon,
    Cog6ToothIcon,
    CheckCircleIcon,
    XCircleIcon,
    ExclamationTriangleIcon,
    ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface AISettings {
    id: string;
    defaultModel: string;
    defaultTemperature: number;
    defaultMaxTokens: number;
    dailyBudgetLimit: number;
    monthlyBudgetLimit: number;
    perRequestLimit: number;
    taskOverrides: Record<string, any>;
    enabledModels: string[];
    enableFallbacks: boolean;
    enableCostTracking: boolean;
}

interface Model {
    id: string;
    name: string;
    provider: string;
    contextLength: number;
    pricing: { prompt: number; completion: number };
    quality: string;
    speed: string;
    tags: string[];
}

interface UsageData {
    usage: {
        daily: number;
        monthly: number;
        byModel: Record<string, number>;
    };
    budget: {
        allowed: boolean;
        dailyUsed: number;
        dailyRemaining: number;
        monthlyUsed: number;
        monthlyRemaining: number;
        warning?: string;
    };
}

const TASK_TYPES = [
    { id: 'marketing_copy', name: 'Marketing Copy', description: 'Persuasive marketing content' },
    { id: 'ad_headline', name: 'Ad Headlines', description: 'Short, punchy ad headlines' },
    { id: 'email_subject', name: 'Email Subjects', description: 'Email subject lines' },
    { id: 'email_body', name: 'Email Body', description: 'Email content generation' },
    { id: 'product_description', name: 'Product Descriptions', description: 'SEO product descriptions' },
    { id: 'bulk_generation', name: 'Bulk Generation', description: 'Cost-effective bulk content' },
];

export default function AiSettingsPage() {
    const [settings, setSettings] = useState<AISettings | null>(null);
    const [models, setModels] = useState<Model[]>([]);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [health, setHealth] = useState<{ openrouter: boolean } | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'general' | 'models' | 'tasks' | 'budget'>('general');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [settingsRes, modelsRes, usageRes, healthRes] = await Promise.all([
                api.getAISettings(),
                api.getAIModels().catch(() => ({ data: { models: [] } })),
                api.getAIUsage(),
                api.getAIHealth(),
            ]);

            setSettings(settingsRes.data);
            setModels(modelsRes.data.models || []);
            setUsage(usageRes.data);
            setHealth(healthRes.data.providers);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async (updates: Partial<AISettings>) => {
        if (!settings) return;
        setSaving(true);
        try {
            const res = await api.updateAISettings(updates);
            setSettings(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const toggleModel = (modelId: string) => {
        if (!settings) return;
        const enabled = settings.enabledModels.includes(modelId)
            ? settings.enabledModels.filter(m => m !== modelId)
            : [...settings.enabledModels, modelId];
        saveSettings({ enabledModels: enabled });
    };

    const formatCost = (cost: number) => `$${cost.toFixed(4)}`;

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex items-center justify-center h-64">
                    <ArrowPathIcon className="w-8 h-8 animate-spin text-indigo-500" />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="space-y-6 pb-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Configuration</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">
                            Manage models, costs, and generation settings
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        {health && (
                            <div className="flex items-center gap-2 text-sm">
                                <span className={`flex items-center gap-1 ${health.openrouter ? 'text-green-600' : 'text-gray-400'}`}>
                                    {health.openrouter ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                                    OpenRouter
                                </span>
                            </div>
                        )}
                        <Button onClick={loadData} variant="secondary" size="sm">
                            <ArrowPathIcon className="w-4 h-4 mr-1" />
                            Refresh
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'general', name: 'General', icon: Cog6ToothIcon },
                            { id: 'models', name: 'Models', icon: CpuChipIcon },
                            { id: 'tasks', name: 'Task Overrides', icon: Cog6ToothIcon },
                            { id: 'budget', name: 'Budget', icon: CurrencyDollarIcon },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                <tab.icon className="w-5 h-5 mr-2" />
                                {tab.name}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* General Tab */}
                {activeTab === 'general' && settings && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-lg font-medium mb-4">Default Model</h3>
                            <select
                                value={settings.defaultModel}
                                onChange={(e) => saveSettings({ defaultModel: e.target.value })}
                                className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                disabled={saving}
                            >
                                {models.length > 0 ? models.map(m => (
                                    <option key={m.id} value={m.id}>{m.name} ({m.provider})</option>
                                )) : (
                                    <option value={settings.defaultModel}>{settings.defaultModel}</option>
                                )}
                            </select>
                            <p className="text-sm text-gray-500 mt-2">
                                Used when no task-specific model is configured
                            </p>
                        </Card>

                        <Card>
                            <h3 className="text-lg font-medium mb-4">Generation Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">
                                        Temperature: {settings.defaultTemperature}
                                    </label>
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.1"
                                        value={settings.defaultTemperature}
                                        onChange={(e) => saveSettings({ defaultTemperature: parseFloat(e.target.value) })}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>Deterministic</span>
                                        <span>Creative</span>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Tokens</label>
                                    <input
                                        type="number"
                                        value={settings.defaultMaxTokens}
                                        onChange={(e) => saveSettings({ defaultMaxTokens: parseInt(e.target.value) })}
                                        className="w-full rounded-lg border-gray-300"
                                        min="100"
                                        max="4096"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="text-lg font-medium mb-4">Feature Toggles</h3>
                            <div className="space-y-4">
                                <label className="flex items-center justify-between">
                                    <span>Enable Fallback Chain</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.enableFallbacks}
                                        onChange={(e) => saveSettings({ enableFallbacks: e.target.checked })}
                                        className="rounded text-indigo-600"
                                    />
                                </label>
                                <label className="flex items-center justify-between">
                                    <span>Track Costs</span>
                                    <input
                                        type="checkbox"
                                        checked={settings.enableCostTracking}
                                        onChange={(e) => saveSettings({ enableCostTracking: e.target.checked })}
                                        className="rounded text-indigo-600"
                                    />
                                </label>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Models Tab */}
                {activeTab === 'models' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-600">
                                {models.length} models available • {settings?.enabledModels.length || 0} enabled
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {models.slice(0, 30).map((model) => {
                                const isEnabled = settings?.enabledModels.includes(model.id);
                                return (
                                    <div
                                        key={model.id}
                                        onClick={() => toggleModel(model.id)}
                                        className="cursor-pointer"
                                    >
                                        <Card className={`transition-all hover:shadow-md ${isEnabled ? 'ring-2 ring-indigo-500' : 'opacity-75'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium truncate">{model.name}</h4>
                                                    <p className="text-sm text-gray-500">{model.provider}</p>
                                                </div>
                                                <div className={`w-5 h-5 rounded-full ${isEnabled ? 'bg-indigo-500' : 'bg-gray-300'}`}>
                                                    {isEnabled && <CheckCircleIcon className="w-5 h-5 text-white" />}
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-1">
                                                {model.tags.slice(0, 3).map((tag: string) => (
                                                    <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-500">
                                                ${(model.pricing.prompt / 1000000).toFixed(4)}/1K in •
                                                ${(model.pricing.completion / 1000000).toFixed(4)}/1K out
                                            </div>
                                        </Card>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Tasks Tab */}
                {activeTab === 'tasks' && settings && (
                    <div className="space-y-4">
                        {TASK_TYPES.map((task) => {
                            const override = settings.taskOverrides?.[task.id];
                            return (
                                <Card key={task.id}>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-medium">{task.name}</h4>
                                            <p className="text-sm text-gray-500">{task.description}</p>
                                        </div>
                                        {override?.model && (
                                            <span className="text-sm bg-indigo-50 text-indigo-700 px-2 py-1 rounded">
                                                {override.model}
                                            </span>
                                        )}
                                    </div>
                                    <div className="mt-4 grid grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Model Override</label>
                                            <select
                                                value={override?.model || ''}
                                                onChange={(e) => {
                                                    const newOverrides = { ...settings.taskOverrides };
                                                    if (e.target.value) {
                                                        newOverrides[task.id] = { ...override, model: e.target.value };
                                                    } else {
                                                        delete newOverrides[task.id];
                                                    }
                                                    saveSettings({ taskOverrides: newOverrides });
                                                }}
                                                className="w-full text-sm rounded border-gray-300"
                                            >
                                                <option value="">Use default</option>
                                                {settings.enabledModels.map(id => (
                                                    <option key={id} value={id}>{id.split('/')[1]}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Budget Tab */}
                {activeTab === 'budget' && settings && usage && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                            <h3 className="text-lg font-medium mb-4">Budget Limits</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Daily Limit ($)</label>
                                    <input
                                        type="number"
                                        value={settings.dailyBudgetLimit}
                                        onChange={(e) => saveSettings({ dailyBudgetLimit: parseFloat(e.target.value) })}
                                        className="w-full rounded-lg border-gray-300"
                                        step="1"
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Monthly Limit ($)</label>
                                    <input
                                        type="number"
                                        value={settings.monthlyBudgetLimit}
                                        onChange={(e) => saveSettings({ monthlyBudgetLimit: parseFloat(e.target.value) })}
                                        className="w-full rounded-lg border-gray-300"
                                        step="10"
                                        min="10"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Per-Request Limit ($)</label>
                                    <input
                                        type="number"
                                        value={settings.perRequestLimit}
                                        onChange={(e) => saveSettings({ perRequestLimit: parseFloat(e.target.value) })}
                                        className="w-full rounded-lg border-gray-300"
                                        step="0.1"
                                        min="0.1"
                                    />
                                </div>
                            </div>
                        </Card>

                        <Card>
                            <h3 className="text-lg font-medium mb-4">Current Usage</h3>
                            {usage.budget.warning && (
                                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                                    <ExclamationTriangleIcon className="w-5 h-5" />
                                    {usage.budget.warning}
                                </div>
                            )}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Daily</span>
                                        <span>${usage.budget.dailyUsed.toFixed(2)} / ${settings.dailyBudgetLimit}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full"
                                            style={{ width: `${Math.min(100, (usage.budget.dailyUsed / settings.dailyBudgetLimit) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>Monthly</span>
                                        <span>${usage.budget.monthlyUsed.toFixed(2)} / ${settings.monthlyBudgetLimit}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-indigo-600 h-2 rounded-full"
                                            style={{ width: `${Math.min(100, (usage.budget.monthlyUsed / settings.monthlyBudgetLimit) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {Object.keys(usage.usage.byModel).length > 0 && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-medium mb-2">Usage by Model</h4>
                                    <div className="space-y-2">
                                        {Object.entries(usage.usage.byModel).map(([model, cost]) => (
                                            <div key={model} className="flex justify-between text-sm">
                                                <span className="truncate">{model}</span>
                                                <span className="font-medium">${(cost as number).toFixed(4)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
