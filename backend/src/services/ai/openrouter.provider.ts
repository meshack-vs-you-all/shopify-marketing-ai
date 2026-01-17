/**
 * OpenRouter AI Provider
 * 
 * Implements the AIProvider interface for OpenRouter's unified AI gateway.
 * Supports 100+ models from multiple providers (OpenAI, Anthropic, Meta, Google, etc.)
 */

import axios, { AxiosInstance } from 'axios';
import {
    AIProvider,
    GenerationRequest,
    GenerationResponse,
    ModelInfo,
    ModelPricing
} from './ai-provider.interface';
import { logger } from '../../utils/logger';

export interface OpenRouterConfig {
    apiKey: string;
    siteUrl?: string;
    siteName?: string;
    timeout?: number;
}

export class OpenRouterProvider implements AIProvider {
    name = 'openrouter';

    private client: AxiosInstance;
    private modelsCache: ModelInfo[] = [];
    private modelsCacheTime = 0;
    private readonly CACHE_TTL = 3600000; // 1 hour

    constructor(private config: OpenRouterConfig) {
        this.client = axios.create({
            baseURL: 'https://openrouter.ai/api/v1',
            headers: {
                'Authorization': `Bearer ${config.apiKey}`,
                'HTTP-Referer': config.siteUrl || 'https://shopify-marketing-ai.app',
                'X-Title': config.siteName || 'Shopify Marketing AI',
                'Content-Type': 'application/json',
            },
            timeout: config.timeout || 120000, // 2 min for long generations
        });
    }

    /**
     * Generate content using the specified model via OpenRouter
     */
    async generate(request: GenerationRequest): Promise<GenerationResponse> {
        const startTime = Date.now();

        try {
            const messages = [];

            // Add system prompt if provided
            if (request.systemPrompt) {
                messages.push({ role: 'system', content: request.systemPrompt });
            }

            // Add user prompt
            messages.push({ role: 'user', content: request.prompt });

            const response = await this.client.post('/chat/completions', {
                model: request.model,
                messages,
                temperature: request.temperature ?? 0.7,
                max_tokens: request.maxTokens ?? 2048,
                stop: request.stopSequences,
                seed: request.seed,
            });

            const data = response.data;
            const latencyMs = Date.now() - startTime;

            // Extract usage information
            const usage = data.usage || {};
            const promptTokens = usage.prompt_tokens || 0;
            const completionTokens = usage.completion_tokens || 0;

            // Calculate cost if pricing available
            const pricing = await this.getModelPricing(request.model);
            const cost = pricing ? {
                promptCost: promptTokens * pricing.prompt / 1_000_000,
                completionCost: completionTokens * pricing.completion / 1_000_000,
                totalCost: (promptTokens * pricing.prompt + completionTokens * pricing.completion) / 1_000_000,
            } : undefined;

            const content = data.choices?.[0]?.message?.content || '';
            const finishReason = this.mapFinishReason(data.choices?.[0]?.finish_reason);

            logger.debug('OpenRouter generation completed', {
                model: request.model,
                promptTokens,
                completionTokens,
                latencyMs,
                cost: cost?.totalCost,
            });

            return {
                content,
                model: data.model || request.model,
                usage: {
                    promptTokens,
                    completionTokens,
                    totalTokens: promptTokens + completionTokens,
                },
                cost,
                finishReason,
                latencyMs,
            };
        } catch (error: any) {
            const latencyMs = Date.now() - startTime;

            logger.error('OpenRouter generation failed', {
                error: error.message,
                model: request.model,
                status: error.response?.status,
                latencyMs,
            });

            // Provide more context for common errors
            if (error.response?.status === 401) {
                throw new Error('OpenRouter API key is invalid or expired');
            }
            if (error.response?.status === 429) {
                throw new Error('OpenRouter rate limit exceeded. Please try again later.');
            }
            if (error.response?.status === 402) {
                throw new Error('OpenRouter credit balance insufficient');
            }

            throw error;
        }
    }

    /**
     * List all available models from OpenRouter
     */
    async listModels(): Promise<ModelInfo[]> {
        // Return cached models if still valid
        if (this.modelsCache.length > 0 && Date.now() - this.modelsCacheTime < this.CACHE_TTL) {
            return this.modelsCache;
        }

        try {
            const response = await this.client.get('/models');

            this.modelsCache = response.data.data.map((m: any) => this.mapModelInfo(m));
            this.modelsCacheTime = Date.now();

            logger.info(`Loaded ${this.modelsCache.length} models from OpenRouter`);

            return this.modelsCache;
        } catch (error: any) {
            logger.error('Failed to fetch OpenRouter models', { error: error.message });

            // Return cached models if available, even if stale
            if (this.modelsCache.length > 0) {
                return this.modelsCache;
            }

            throw error;
        }
    }

    /**
     * Estimate cost for a generation request
     */
    estimateCost(model: string, promptTokens: number, completionTokens: number): number {
        const modelInfo = this.modelsCache.find(m => m.id === model);
        if (!modelInfo) return 0;

        return (promptTokens * modelInfo.pricing.prompt +
            completionTokens * modelInfo.pricing.completion) / 1_000_000;
    }

    /**
     * Check if OpenRouter is accessible and API key is valid
     */
    async healthCheck(): Promise<boolean> {
        try {
            await this.client.get('/models', { timeout: 5000 });
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get a specific model's information
     */
    async getModel(modelId: string): Promise<ModelInfo | undefined> {
        const models = await this.listModels();
        return models.find(m => m.id === modelId);
    }

    /**
     * Get pricing for a specific model
     */
    private async getModelPricing(modelId: string): Promise<ModelPricing | undefined> {
        const models = await this.listModels();
        return models.find(m => m.id === modelId)?.pricing;
    }

    /**
     * Map OpenRouter model data to our ModelInfo interface
     */
    private mapModelInfo(rawModel: any): ModelInfo {
        const id = rawModel.id;
        const provider = id.split('/')[0];

        // Parse pricing (OpenRouter returns as string in $/token)
        const promptPrice = parseFloat(rawModel.pricing?.prompt || '0') * 1_000_000;
        const completionPrice = parseFloat(rawModel.pricing?.completion || '0') * 1_000_000;

        // Determine quality tier based on model characteristics
        const quality = this.determineQuality(id, promptPrice + completionPrice);

        // Determine speed based on context length and model type
        const speed = this.determineSpeed(rawModel.context_length, id);

        return {
            id,
            name: rawModel.name || id,
            provider,
            contextLength: rawModel.context_length || 4096,
            pricing: {
                prompt: promptPrice,
                completion: completionPrice,
            },
            capabilities: rawModel.architecture?.modality?.split('+') || ['text'],
            speed,
            quality,
        };
    }

    /**
     * Determine quality tier based on model ID and pricing
     */
    private determineQuality(modelId: string, avgPrice: number): 'economy' | 'standard' | 'premium' {
        // Premium models
        if (
            modelId.includes('gpt-4') ||
            modelId.includes('claude-3.5') ||
            modelId.includes('claude-3-opus')
        ) {
            return 'premium';
        }

        // Standard models
        if (
            modelId.includes('claude-3-sonnet') ||
            modelId.includes('claude-3-haiku') ||
            modelId.includes('llama-3.1-70b') ||
            modelId.includes('mixtral') ||
            modelId.includes('gemini-2')
        ) {
            return 'standard';
        }

        // Economy based on price
        if (avgPrice < 1) {
            return 'economy';
        }

        return 'standard';
    }

    /**
     * Determine speed tier based on context length and model characteristics
     */
    private determineSpeed(contextLength: number, modelId: string): 'fast' | 'medium' | 'slow' {
        // Fast models
        if (
            modelId.includes('flash') ||
            modelId.includes('haiku') ||
            modelId.includes('mini') ||
            modelId.includes('8b')
        ) {
            return 'fast';
        }

        // Slow models (large context or very large models)
        if (contextLength > 100000 || modelId.includes('opus') || modelId.includes('405b')) {
            return 'slow';
        }

        return 'medium';
    }

    /**
     * Map OpenRouter finish reasons to our standard format
     */
    private mapFinishReason(reason: string | undefined): 'stop' | 'length' | 'error' {
        if (reason === 'stop' || reason === 'end_turn') return 'stop';
        if (reason === 'length' || reason === 'max_tokens') return 'length';
        return 'error';
    }
}

/**
 * Create OpenRouter provider from environment variables
 */
export function createOpenRouterProvider(): OpenRouterProvider | null {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        logger.warn('OPENROUTER_API_KEY not set. OpenRouter provider will not be available.');
        return null;
    }

    return new OpenRouterProvider({
        apiKey,
        siteUrl: process.env.APP_URL || 'https://shopify-marketing-ai.app',
        siteName: process.env.APP_NAME || 'Shopify Marketing AI',
        timeout: parseInt(process.env.OPENROUTER_TIMEOUT || '120000', 10),
    });
}
