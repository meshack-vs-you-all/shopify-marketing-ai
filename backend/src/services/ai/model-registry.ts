/**
 * Model Registry
 * 
 * Manages available models, provides recommendations,
 * and handles model discovery from OpenRouter.
 */

import { OpenRouterProvider } from './openrouter.provider';
import { ModelInfo, TaskType } from './ai-provider.interface';
import { getTaskConfig } from './task-router.config';
import { logger } from '../../utils/logger';

export interface ModelRecommendation {
    model: ModelInfo;
    score: number;
    reasons: string[];
    estimatedCostPer1K: number;
}

export interface ModelFilters {
    provider?: string;
    quality?: 'economy' | 'standard' | 'premium';
    speed?: 'fast' | 'medium' | 'slow';
    maxPricePerMillion?: number;
    capabilities?: string[];
    search?: string;
}

export class ModelRegistry {
    private models: ModelInfo[] = [];
    private enabledModels: Set<string> = new Set();
    private lastRefresh: Date | null = null;

    constructor(private provider: OpenRouterProvider) { }

    /**
     * Refresh model list from OpenRouter
     */
    async refreshModels(): Promise<void> {
        try {
            this.models = await this.provider.listModels();
            this.lastRefresh = new Date();

            // If no enabled models set, enable recommended ones by default
            if (this.enabledModels.size === 0) {
                this.enableDefaultModels();
            }

            logger.info(`Model registry refreshed with ${this.models.length} models`);
        } catch (error) {
            logger.error('Failed to refresh model registry', { error });
            throw error;
        }
    }

    /**
     * Get all models, optionally filtered
     */
    getModels(filters?: ModelFilters): ModelInfo[] {
        let filtered = [...this.models];

        if (filters?.provider) {
            filtered = filtered.filter(m => m.provider === filters.provider);
        }

        if (filters?.quality) {
            filtered = filtered.filter(m => m.quality === filters.quality);
        }

        if (filters?.speed) {
            filtered = filtered.filter(m => m.speed === filters.speed);
        }

        if (filters?.maxPricePerMillion) {
            filtered = filtered.filter(m =>
                (m.pricing.prompt + m.pricing.completion) / 2 <= filters.maxPricePerMillion!
            );
        }

        if (filters?.capabilities?.length) {
            filtered = filtered.filter(m =>
                filters.capabilities!.every(c => m.capabilities.includes(c))
            );
        }

        if (filters?.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(m =>
                m.id.toLowerCase().includes(searchLower) ||
                m.name.toLowerCase().includes(searchLower) ||
                m.provider.toLowerCase().includes(searchLower)
            );
        }

        return filtered;
    }

    /**
     * Get only enabled models
     */
    getEnabledModels(): ModelInfo[] {
        return this.models.filter(m => this.enabledModels.has(m.id));
    }

    /**
     * Get a specific model by ID
     */
    getModel(modelId: string): ModelInfo | undefined {
        return this.models.find(m => m.id === modelId);
    }

    /**
     * Enable a model for use
     */
    enableModel(modelId: string): void {
        this.enabledModels.add(modelId);
    }

    /**
     * Disable a model
     */
    disableModel(modelId: string): void {
        this.enabledModels.delete(modelId);
    }

    /**
     * Check if a model is enabled
     */
    isModelEnabled(modelId: string): boolean {
        return this.enabledModels.has(modelId);
    }

    /**
     * Get recommended models for a task type
     */
    recommendForTask(taskType: TaskType, budget?: number): ModelRecommendation[] {
        const taskConfig = getTaskConfig(taskType);
        const maxBudget = budget ?? taskConfig.costCap;

        // Get task-specific preferences
        const prefs = this.getTaskPreferences(taskType);

        return this.models
            .filter(m => prefs.qualities.includes(m.quality))
            .filter(m => m.contextLength >= prefs.minContext)
            .filter(m => this.estimateCostPer1K(m) <= maxBudget * 10) // rough filter
            .map(m => ({
                model: m,
                score: this.calculateScore(m, taskType, prefs),
                reasons: this.generateReasons(m, taskType, prefs),
                estimatedCostPer1K: this.estimateCostPer1K(m),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
    }

    /**
     * Get all unique providers
     */
    getProviders(): string[] {
        return [...new Set(this.models.map(m => m.provider))].sort();
    }

    /**
     * Get model statistics
     */
    getStats(): {
        total: number;
        enabled: number;
        byProvider: Record<string, number>;
        byQuality: Record<string, number>;
    } {
        const byProvider: Record<string, number> = {};
        const byQuality: Record<string, number> = {};

        for (const model of this.models) {
            byProvider[model.provider] = (byProvider[model.provider] || 0) + 1;
            byQuality[model.quality] = (byQuality[model.quality] || 0) + 1;
        }

        return {
            total: this.models.length,
            enabled: this.enabledModels.size,
            byProvider,
            byQuality,
        };
    }

    /**
     * Set enabled models from a list
     */
    setEnabledModels(modelIds: string[]): void {
        this.enabledModels = new Set(modelIds);
    }

    /**
     * Get enabled model IDs
     */
    getEnabledModelIds(): string[] {
        return [...this.enabledModels];
    }

    /**
     * Enable default recommended models
     */
    private enableDefaultModels(): void {
        const defaultModels = [
            'anthropic/claude-3.5-sonnet',
            'anthropic/claude-3-haiku',
            'openai/gpt-4.1',
            'openai/gpt-4.1-mini',
            'meta-llama/llama-3.1-70b-instruct',
            'meta-llama/llama-3.1-8b-instruct',
            'google/gemini-2.0-flash',
            'mistralai/mixtral-8x7b-instruct',
        ];

        for (const modelId of defaultModels) {
            if (this.models.some(m => m.id === modelId)) {
                this.enabledModels.add(modelId);
            }
        }
    }

    /**
     * Get task-specific model preferences
     */
    private getTaskPreferences(taskType: TaskType): {
        qualities: Array<'economy' | 'standard' | 'premium'>;
        minContext: number;
        preferFast: boolean;
    } {
        const presets: Record<string, {
            qualities: Array<'economy' | 'standard' | 'premium'>;
            minContext: number;
            preferFast: boolean;
        }> = {
            marketing_copy: { qualities: ['premium', 'standard'], minContext: 8000, preferFast: false },
            ad_headline: { qualities: ['standard', 'economy'], minContext: 2000, preferFast: true },
            product_description: { qualities: ['premium', 'standard'], minContext: 4000, preferFast: false },
            email_subject: { qualities: ['premium', 'standard'], minContext: 2000, preferFast: true },
            email_body: { qualities: ['premium', 'standard'], minContext: 32000, preferFast: false },
            bulk_generation: { qualities: ['economy', 'standard'], minContext: 4000, preferFast: true },
            performance_analysis: { qualities: ['premium', 'standard'], minContext: 8000, preferFast: false },
            consistent_task: { qualities: ['standard'], minContext: 4000, preferFast: true },
            general: { qualities: ['standard', 'economy'], minContext: 4000, preferFast: false },
        };

        return presets[taskType] || presets.general;
    }

    /**
     * Calculate recommendation score for a model
     */
    private calculateScore(
        model: ModelInfo,
        taskType: TaskType,
        prefs: { qualities: string[]; minContext: number; preferFast: boolean }
    ): number {
        let score = 50;

        // Quality bonus
        if (model.quality === 'premium') score += 25;
        else if (model.quality === 'standard') score += 15;

        // Speed bonus (especially for short content tasks)
        if (prefs.preferFast && model.speed === 'fast') score += 20;
        else if (model.speed === 'fast') score += 10;

        // Context length bonus for long-form tasks
        if (taskType === 'email_body' && model.contextLength > 100000) score += 15;

        // Cost efficiency bonus
        const avgCost = (model.pricing.prompt + model.pricing.completion) / 2;
        if (avgCost < 0.5) score += 15;
        else if (avgCost < 2) score += 10;
        else if (avgCost < 5) score += 5;

        // Bonus for well-known reliable models
        if (model.id.includes('claude') || model.id.includes('gpt-4')) score += 5;

        return score;
    }

    /**
     * Generate human-readable recommendation reasons
     */
    private generateReasons(
        model: ModelInfo,
        taskType: TaskType,
        prefs: { qualities: string[]; minContext: number; preferFast: boolean }
    ): string[] {
        const reasons: string[] = [];

        if (model.quality === 'premium') {
            reasons.push('High quality output');
        }

        if (model.speed === 'fast') {
            reasons.push('Fast response time');
        }

        if (model.contextLength > 100000) {
            reasons.push('Large context window');
        }

        const avgCost = (model.pricing.prompt + model.pricing.completion) / 2;
        if (avgCost < 1) {
            reasons.push('Cost effective');
        }

        if (taskType === 'marketing_copy' && model.id.includes('claude')) {
            reasons.push('Excellent for persuasive writing');
        }

        if (taskType === 'performance_analysis' && model.id.includes('gpt-4')) {
            reasons.push('Strong structured output');
        }

        return reasons.length > 0 ? reasons : ['Compatible with task requirements'];
    }

    /**
     * Estimate cost per 1000 output tokens
     */
    private estimateCostPer1K(model: ModelInfo): number {
        // Assume 500 prompt tokens per 1000 completion tokens
        return (500 * model.pricing.prompt + 1000 * model.pricing.completion) / 1_000_000;
    }
}
