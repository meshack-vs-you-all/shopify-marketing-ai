/**
 * AI Provider Abstraction Layer
 * 
 * Defines interfaces for AI providers enabling multi-model support
 * and provider switching without changing application code.
 */

export interface AIProviderConfig {
    apiKey: string;
    baseUrl?: string;
    timeout?: number;
    maxRetries?: number;
}

export interface GenerationRequest {
    prompt: string;
    systemPrompt?: string;
    model: string;
    temperature?: number;
    maxTokens?: number;
    stopSequences?: string[];
    seed?: number; // For reproducibility in consistent tasks
}

export interface TokenUsage {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
}

export interface CostBreakdown {
    promptCost: number;
    completionCost: number;
    totalCost: number;
}

export interface GenerationResponse {
    content: string;
    model: string;
    usage: TokenUsage;
    cost?: CostBreakdown;
    finishReason: 'stop' | 'length' | 'error';
    latencyMs: number;
}

export interface ModelPricing {
    prompt: number;     // $ per 1M tokens
    completion: number; // $ per 1M tokens
}

export interface ModelInfo {
    id: string;
    name: string;
    provider: string;
    contextLength: number;
    pricing: ModelPricing;
    capabilities: string[];
    speed: 'fast' | 'medium' | 'slow';
    quality: 'economy' | 'standard' | 'premium';
}

export interface AIProvider {
    name: string;

    /**
     * Generate content using the specified model
     */
    generate(request: GenerationRequest): Promise<GenerationResponse>;

    /**
     * List available models from this provider
     */
    listModels(): Promise<ModelInfo[]>;

    /**
     * Estimate cost for a generation request
     */
    estimateCost(model: string, promptTokens: number, completionTokens: number): number;

    /**
     * Check if the provider is properly configured and accessible
     */
    healthCheck(): Promise<boolean>;
}

/**
 * Task types for model selection routing
 */
export type TaskType =
    | 'marketing_copy'
    | 'ad_headline'
    | 'product_description'
    | 'email_subject'
    | 'email_body'
    | 'bulk_generation'
    | 'performance_analysis'
    | 'consistent_task'
    | 'general';

/**
 * Configuration for a specific task type
 */
export interface TaskConfig {
    primaryModel: string;
    fallbackChain: string[];
    temperature: number;
    maxTokens: number;
    costCap: number; // Max $ per request
    requiresConsistency?: boolean;
}

/**
 * Settings for consistent/repeatable tasks
 */
export interface ConsistencyConfig {
    lockModelVersion: boolean;
    useDeterministicSeed: boolean;
    seedStrategy: 'task_id' | 'content_hash' | 'custom';
    promptVersion?: string;
}
