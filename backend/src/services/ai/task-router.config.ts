/**
 * Task Router Configuration
 * 
 * Defines optimal models and settings for each task type.
 * Includes fallback chains and cost caps for budget control.
 */

import { TaskType, TaskConfig } from './ai-provider.interface';

/**
 * Default task configurations mapping task types to optimal models
 */
export const TASK_CONFIGS: Record<TaskType, TaskConfig> = {
    /**
     * Marketing Copy - needs creativity and persuasion
     * Primary: Claude excels at nuanced, persuasive writing
     */
    marketing_copy: {
        primaryModel: 'anthropic/claude-3.5-sonnet',
        fallbackChain: ['openai/gpt-4.1', 'google/gemini-2.0-flash'],
        temperature: 0.8,
        maxTokens: 1500,
        costCap: 0.10,
    },

    /**
     * Ad Headlines - short, punchy, high volume
     * Primary: GPT-4-mini is fast and cost-effective for short content
     */
    ad_headline: {
        primaryModel: 'openai/gpt-4.1-mini',
        fallbackChain: ['anthropic/claude-3-haiku', 'meta-llama/llama-3.1-8b-instruct'],
        temperature: 0.9,
        maxTokens: 200,
        costCap: 0.02,
    },

    /**
     * Product Descriptions - needs SEO awareness and conversion focus
     * Primary: Claude for balanced creativity and structure
     */
    product_description: {
        primaryModel: 'anthropic/claude-3.5-sonnet',
        fallbackChain: ['openai/gpt-4.1', 'google/gemini-2.0-flash'],
        temperature: 0.7,
        maxTokens: 800,
        costCap: 0.08,
    },

    /**
     * Email Subject Lines - high creativity for open rates
     * Primary: GPT-4 excels at catchy, varied outputs
     */
    email_subject: {
        primaryModel: 'openai/gpt-4.1',
        fallbackChain: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4.1-mini'],
        temperature: 0.9,
        maxTokens: 300,
        costCap: 0.05,
    },

    /**
     * Email Body - long-form content needs large context
     * Primary: Claude's large context ideal for emails
     */
    email_body: {
        primaryModel: 'anthropic/claude-3.5-sonnet',
        fallbackChain: ['openai/gpt-4.1', 'google/gemini-2.0-flash'],
        temperature: 0.8,
        maxTokens: 2000,
        costCap: 0.15,
    },

    /**
     * Bulk Generation - cost-sensitive, high volume
     * Primary: Llama 70B offers great quality at low cost
     */
    bulk_generation: {
        primaryModel: 'meta-llama/llama-3.1-70b-instruct',
        fallbackChain: ['google/gemini-2.0-flash', 'mistralai/mixtral-8x7b-instruct'],
        temperature: 0.7,
        maxTokens: 1000,
        costCap: 0.03,
    },

    /**
     * Performance Analysis - needs structured output
     * Primary: GPT-4 best at structured JSON output
     */
    performance_analysis: {
        primaryModel: 'openai/gpt-4.1',
        fallbackChain: ['anthropic/claude-3.5-sonnet', 'google/gemini-2.0-flash'],
        temperature: 0.3,
        maxTokens: 1500,
        costCap: 0.10,
    },

    /**
     * Consistent/Repeatable Tasks - deterministic output required
     * Temperature fixed at 0, single model, no fallbacks
     */
    consistent_task: {
        primaryModel: 'openai/gpt-4.1-mini',
        fallbackChain: [], // No fallbacks for consistency
        temperature: 0,
        maxTokens: 1000,
        costCap: 0.05,
        requiresConsistency: true,
    },

    /**
     * General purpose - balanced defaults
     */
    general: {
        primaryModel: 'google/gemini-2.0-flash',
        fallbackChain: ['anthropic/claude-3-haiku', 'openai/gpt-4.1-mini'],
        temperature: 0.7,
        maxTokens: 2048,
        costCap: 0.05,
    },
};

/**
 * Get configuration for a specific task type
 */
export function getTaskConfig(taskType: TaskType): TaskConfig {
    return TASK_CONFIGS[taskType] || TASK_CONFIGS.general;
}

/**
 * Get the complete fallback chain including primary model
 */
export function getModelChain(taskType: TaskType): string[] {
    const config = getTaskConfig(taskType);
    return [config.primaryModel, ...config.fallbackChain];
}

/**
 * Economy mode configurations - use cheaper models
 */
export const ECONOMY_TASK_CONFIGS: Partial<Record<TaskType, TaskConfig>> = {
    marketing_copy: {
        primaryModel: 'meta-llama/llama-3.1-70b-instruct',
        fallbackChain: ['google/gemini-2.0-flash', 'mistralai/mixtral-8x7b-instruct'],
        temperature: 0.8,
        maxTokens: 1500,
        costCap: 0.03,
    },
    email_subject: {
        primaryModel: 'google/gemini-2.0-flash',
        fallbackChain: ['meta-llama/llama-3.1-8b-instruct'],
        temperature: 0.9,
        maxTokens: 300,
        costCap: 0.01,
    },
    email_body: {
        primaryModel: 'meta-llama/llama-3.1-70b-instruct',
        fallbackChain: ['google/gemini-2.0-flash'],
        temperature: 0.8,
        maxTokens: 2000,
        costCap: 0.05,
    },
};

/**
 * Premium mode configurations - use highest quality models
 */
export const PREMIUM_TASK_CONFIGS: Partial<Record<TaskType, TaskConfig>> = {
    marketing_copy: {
        primaryModel: 'anthropic/claude-3.5-sonnet',
        fallbackChain: ['openai/gpt-4.1', 'anthropic/claude-3-opus'],
        temperature: 0.8,
        maxTokens: 2000,
        costCap: 0.25,
    },
    ad_headline: {
        primaryModel: 'openai/gpt-4.1',
        fallbackChain: ['anthropic/claude-3.5-sonnet'],
        temperature: 0.9,
        maxTokens: 300,
        costCap: 0.10,
    },
};

/**
 * Map content types to task types for automatic routing
 */
export const CONTENT_TYPE_TO_TASK: Record<string, TaskType> = {
    'ad_copy': 'marketing_copy',
    'headline': 'ad_headline',
    'product': 'product_description',
    'email_subject': 'email_subject',
    'email_body': 'email_body',
    'newsletter': 'email_body',
    'promotional': 'email_body',
    'welcome': 'email_body',
    'abandoned_cart': 'email_body',
    'analysis': 'performance_analysis',
    'bulk': 'bulk_generation',
};

/**
 * Classify a request into a task type based on context
 */
export function classifyTask(context: {
    contentType?: string;
    isBulk?: boolean;
    requiresConsistency?: boolean;
}): TaskType {
    if (context.requiresConsistency) {
        return 'consistent_task';
    }

    if (context.isBulk) {
        return 'bulk_generation';
    }

    if (context.contentType && CONTENT_TYPE_TO_TASK[context.contentType]) {
        return CONTENT_TYPE_TO_TASK[context.contentType];
    }

    return 'general';
}
