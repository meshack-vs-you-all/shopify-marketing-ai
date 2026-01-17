/**
 * AI Services Module
 * 
 * Exports all AI-related services and utilities.
 */

// Interfaces
export * from './ai-provider.interface';

// Providers
export { OpenRouterProvider, createOpenRouterProvider } from './openrouter.provider';

// Configuration
export {
    TASK_CONFIGS,
    ECONOMY_TASK_CONFIGS,
    PREMIUM_TASK_CONFIGS,
    getTaskConfig,
    getModelChain,
    classifyTask,
    CONTENT_TYPE_TO_TASK,
} from './task-router.config';

// Services
export { CostController, costController } from './cost-controller';
export type { CostLimits, UsageRecord, BudgetStatus, UsageSummary } from './cost-controller';

export { ModelRegistry } from './model-registry';
export type { ModelRecommendation, ModelFilters } from './model-registry';
