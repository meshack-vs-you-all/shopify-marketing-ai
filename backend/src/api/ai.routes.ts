/**
 * AI Routes
 * 
 * Endpoints for AI model discovery, generation, and settings management.
 * Part of the OpenRouter multi-model architecture.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { aiService } from '../services/ai.service';
import { costController } from '../services/ai/cost-controller';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { ModelRegistry } from '../services/ai/model-registry';
import { createOpenRouterProvider } from '../services/ai/openrouter.provider';
import { newsletterGeneratorService } from '../services/newsletter-generator.service';

const router = Router();

// Verbose logging flag - disabled in production
const VERBOSE_AI_LOGGING = process.env.AI_VERBOSE_LOGGING === 'true' &&
    process.env.NODE_ENV !== 'production';

/**
 * Middleware: Verbose AI logging for development
 */
function verboseLog(action: string, data: any) {
    if (VERBOSE_AI_LOGGING) {
        logger.info(`[AI-VERBOSE] ${action}`, data);
    }
}

// ============================================
// Model Discovery Endpoints
// ============================================

/**
 * GET /api/ai/models
 * Fetch all available models from OpenRouter
 */
router.get('/models', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const models = await aiService.getAvailableModels();

        // Normalize and categorize models for frontend
        const categorized = models.map(m => ({
            id: m.id,
            name: m.name,
            provider: m.provider,
            contextLength: m.contextLength,
            pricing: m.pricing,
            capabilities: m.capabilities,
            speed: m.speed,
            quality: m.quality,
            tags: generateTags(m),
        }));

        verboseLog('Models fetched', { count: models.length });

        res.json({
            models: categorized,
            count: categorized.length,
            cached: true, // Models are cached in provider
        });
    } catch (error: any) {
        logger.error('Failed to fetch models', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch available models' });
    }
});

/**
 * GET /api/ai/models/recommended
 * Get model recommendations for a specific task
 */
router.get('/models/recommended/:taskType', async (req: Request, res: Response) => {
    try {
        const { taskType } = req.params;
        const budget = parseFloat(req.query.budget as string) || undefined;

        const provider = createOpenRouterProvider();
        if (!provider) {
            return res.status(503).json({ error: 'OpenRouter not configured' });
        }

        const registry = new ModelRegistry(provider);
        await registry.refreshModels();

        const recommendations = registry.recommendForTask(taskType as any, budget);

        verboseLog('Recommendations generated', { taskType, count: recommendations.length });

        res.json({ recommendations, taskType });
    } catch (error: any) {
        logger.error('Failed to get recommendations', { error: error.message });
        res.status(500).json({ error: 'Failed to get model recommendations' });
    }
});

// ============================================
// AI Settings Endpoints
// ============================================

/**
 * GET /api/ai/settings
 * Get current AI settings
 */
router.get('/settings', async (req: Request, res: Response) => {
    try {
        let settings = await prisma.aISettings.findUnique({
            where: { id: 'default' },
        });

        // Return defaults if no settings exist
        if (!settings) {
            settings = {
                id: 'default',
                defaultModel: 'anthropic/claude-3.5-sonnet',
                defaultTemperature: 0.7,
                defaultMaxTokens: 2048,
                dailyBudgetLimit: 50,
                monthlyBudgetLimit: 500,
                perRequestLimit: 1,
                taskOverrides: {},
                enabledModels: [],
                enableFallbacks: true,
                enableCostTracking: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as any;
        }

        res.json(settings);
    } catch (error: any) {
        logger.error('Failed to get AI settings', { error: error.message });
        res.status(500).json({ error: 'Failed to load AI settings' });
    }
});

/**
 * PUT /api/ai/settings
 * Update AI settings
 */
router.put('/settings', async (req: Request, res: Response) => {
    try {
        const {
            defaultModel,
            defaultTemperature,
            defaultMaxTokens,
            dailyBudgetLimit,
            monthlyBudgetLimit,
            perRequestLimit,
            taskOverrides,
            enabledModels,
            enableFallbacks,
            enableCostTracking,
        } = req.body;

        const settings = await prisma.aISettings.upsert({
            where: { id: 'default' },
            update: {
                ...(defaultModel && { defaultModel }),
                ...(defaultTemperature !== undefined && { defaultTemperature }),
                ...(defaultMaxTokens !== undefined && { defaultMaxTokens }),
                ...(dailyBudgetLimit !== undefined && { dailyBudgetLimit }),
                ...(monthlyBudgetLimit !== undefined && { monthlyBudgetLimit }),
                ...(perRequestLimit !== undefined && { perRequestLimit }),
                ...(taskOverrides && { taskOverrides }),
                ...(enabledModels && { enabledModels }),
                ...(enableFallbacks !== undefined && { enableFallbacks }),
                ...(enableCostTracking !== undefined && { enableCostTracking }),
            },
            create: {
                id: 'default',
                defaultModel: defaultModel || 'anthropic/claude-3.5-sonnet',
                defaultTemperature: defaultTemperature ?? 0.7,
                defaultMaxTokens: defaultMaxTokens ?? 2048,
                dailyBudgetLimit: dailyBudgetLimit ?? 50,
                monthlyBudgetLimit: monthlyBudgetLimit ?? 500,
                perRequestLimit: perRequestLimit ?? 1,
                taskOverrides: taskOverrides || {},
                enabledModels: enabledModels || [],
                enableFallbacks: enableFallbacks ?? true,
                enableCostTracking: enableCostTracking ?? true,
            },
        });

        // Update cost controller with new limits
        await costController.updateLimits({
            dailyLimit: Number(settings.dailyBudgetLimit),
            monthlyLimit: Number(settings.monthlyBudgetLimit),
            perRequestLimit: Number(settings.perRequestLimit),
        });

        verboseLog('Settings updated', settings);

        res.json(settings);
    } catch (error: any) {
        logger.error('Failed to update AI settings', { error: error.message });
        res.status(500).json({ error: 'Failed to update AI settings' });
    }
});

// ============================================
// Usage & Budget Endpoints
// ============================================

/**
 * GET /api/ai/usage
 * Get usage summary and budget status
 */
router.get('/usage', async (req: Request, res: Response) => {
    try {
        const [usage, budget] = await Promise.all([
            costController.getUsageSummary(),
            costController.checkBudget(),
        ]);

        res.json({
            usage,
            budget,
            limits: costController.getLimits(),
        });
    } catch (error: any) {
        logger.error('Failed to get usage', { error: error.message });
        res.status(500).json({ error: 'Failed to get usage data' });
    }
});

// ============================================
// Generation Endpoints
// ============================================

/**
 * POST /api/ai/generate
 * General-purpose AI generation with model selection
 */
router.post('/generate', async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const { taskType, prompt, model, temperature, maxTokens } = req.body;

        if (!taskType || !prompt) {
            return res.status(400).json({ error: 'taskType and prompt are required' });
        }

        // Check budget before proceeding
        const budget = await costController.checkBudget();
        if (!budget.allowed) {
            verboseLog('Generation blocked - budget exceeded', budget);
            return res.status(402).json({
                error: 'AI budget exceeded',
                budget,
            });
        }

        verboseLog('Generation starting', { taskType, model, budget });

        let result;
        let usedModel = model;
        let fallbackUsed = false;

        // Route to appropriate generation method based on task type
        switch (taskType) {
            case 'email_subject':
                result = await aiService.generateEmailSubjectLines({
                    emailType: req.body.emailType || 'newsletter',
                    productName: req.body.productName,
                    discount: req.body.discount,
                    numberOfVariations: req.body.numberOfVariations,
                    model,
                    customPrompt: prompt,
                    context: req.body.context,
                });
                break;

            case 'email_body':
                result = await aiService.generateEmailBody({
                    emailType: req.body.emailType || 'newsletter',
                    subject: req.body.subject || 'Newsletter',
                    productName: req.body.productName,
                    productDescription: req.body.productDescription,
                    discount: req.body.discount,
                    customerName: req.body.customerName,
                    tone: req.body.tone,
                    model,
                    customPrompt: prompt,
                    context: req.body.context,
                });
                break;

            case 'marketing_copy':
            case 'ad_headline':
                result = await aiService.generateAdCopy({
                    productName: req.body.productName || 'Product',
                    productDescription: req.body.productDescription || prompt,
                    targetAudience: req.body.targetAudience || 'general audience',
                    platform: req.body.platform || 'meta',
                    tone: req.body.tone,
                    numberOfVariations: req.body.numberOfVariations,
                    model,
                });
                break;

            case 'product_description':
                result = await aiService.generateProductDescription({
                    productName: req.body.productName || 'Product',
                    currentDescription: prompt,
                    keyFeatures: req.body.keyFeatures || [],
                    targetAudience: req.body.targetAudience || 'general audience',
                    seoKeywords: req.body.seoKeywords,
                    model,
                });
                break;

            default:
                return res.status(400).json({ error: `Unknown task type: ${taskType}` });
        }

        const latencyMs = Date.now() - startTime;

        verboseLog('Generation complete', {
            taskType,
            model: usedModel,
            latencyMs,
            fallbackUsed,
        });

        res.json({
            result,
            meta: {
                taskType,
                model: usedModel,
                fallbackUsed,
                latencyMs,
            },
        });
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        logger.error('Generation failed', { error: error.message, latencyMs });
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/ai/generate/newsletter
 * Generate a complete newsletter with all components in one action
 * Integrates Shopify products and SEO optimization
 */
router.post('/generate/newsletter', async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const {
            campaignType,
            campaignName,
            productIds,
            products,
            tone,
            seoOptimized,
            includeHeroImage,
            customInstructions,
            model,
        } = req.body;

        if (!campaignType) {
            return res.status(400).json({ error: 'campaignType is required' });
        }

        // Check budget before proceeding
        const budget = await costController.checkBudget();
        if (!budget.allowed) {
            verboseLog('Newsletter generation blocked - budget exceeded', budget);
            return res.status(402).json({
                error: 'AI budget exceeded',
                budget,
            });
        }

        verboseLog('Newsletter generation starting', { campaignType, productIds, tone });

        const newsletter = await newsletterGeneratorService.generateNewsletter({
            campaignType,
            campaignName,
            productIds,
            products,
            tone,
            seoOptimized,
            includeHeroImage,
            customInstructions,
            model,
        });

        const latencyMs = Date.now() - startTime;

        verboseLog('Newsletter generation complete', {
            campaignType,
            latencyMs,
            productsUsed: newsletter.generationMeta.productsUsed,
        });

        res.json({
            newsletter,
            meta: {
                latencyMs,
                ...newsletter.generationMeta,
            },
        });
    } catch (error: any) {
        const latencyMs = Date.now() - startTime;
        logger.error('Newsletter generation failed', { error: error.message, latencyMs });
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/ai/health
 * Check AI service health
 */
router.get('/health', async (req: Request, res: Response) => {
    try {
        const health = await aiService.healthCheck();

        res.json({
            status: health.openrouter ? 'ok' : 'degraded',
            providers: health,
            timestamp: new Date().toISOString(),
        });
    } catch (error: any) {
        res.status(500).json({
            status: 'error',
            error: error.message,
        });
    }
});

// ============================================
// Helper Functions
// ============================================

function generateTags(model: any): string[] {
    const tags: string[] = [];

    // Quality tags
    if (model.quality === 'premium') tags.push('premium');
    if (model.quality === 'economy') tags.push('cheap');

    // Speed tags
    if (model.speed === 'fast') tags.push('fast');

    // Context tags
    if (model.contextLength > 100000) tags.push('long-context');

    // Cost tags
    const avgCost = (model.pricing.prompt + model.pricing.completion) / 2;
    if (avgCost < 1) tags.push('budget-friendly');
    if (avgCost > 10) tags.push('expensive');

    // Provider tags
    if (model.id.includes('claude')) tags.push('creative');
    if (model.id.includes('gpt-4')) tags.push('versatile');
    if (model.id.includes('llama')) tags.push('open-source');

    return tags;
}

export default router;
