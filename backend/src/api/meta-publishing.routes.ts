/**
 * Meta Publishing API Routes
 * 
 * Endpoints for publishing content to Instagram, Facebook, and WhatsApp.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import metaPublishingService from '../services/meta-publishing.service';
import aiPostComposerService from '../services/ai-post-composer.service';

const router = Router();

// Validation schemas
const createPostSchema = z.object({
    target: z.enum(['instagram', 'facebook', 'whatsapp']),
    account_id: z.string().min(1),
    media: z.array(z.string().url()).default([]),
    caption: z.string().min(1).max(2200),
    schedule_at: z.string().datetime().optional().nullable(),
    campaign_id: z.string().optional(),
    idempotency_key: z.string().uuid().optional(),
    ai_generate: z.object({
        product_info: z.object({
            name: z.string(),
            description: z.string(),
            price: z.number().optional(),
        }).optional(),
        tone: z.enum(['professional', 'casual', 'playful', 'luxury', 'friendly']).optional(),
        length: z.enum(['short', 'medium', 'long']).optional(),
    }).optional(),
});

const generateCaptionsSchema = z.object({
    prompt_hints: z.string().optional(),
    product_info: z.object({
        name: z.string(),
        description: z.string(),
        price: z.number().optional(),
    }).optional(),
    tone: z.enum(['professional', 'casual', 'playful', 'luxury', 'friendly']).default('friendly'),
    length: z.enum(['short', 'medium', 'long']).default('medium'),
    include_hashtags: z.boolean().default(true),
    platform: z.enum(['instagram', 'facebook']).default('instagram'),
    creative: z.boolean().default(false),
});

/**
 * POST /api/meta/post
 * Create a scheduled or immediate post
 */
router.post('/post', async (req: Request, res: Response) => {
    try {
        const validation = createPostSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten(),
            });
        }

        const data = validation.data;

        logger.info('Create post request', { target: data.target, accountId: data.account_id });

        const result = await metaPublishingService.createPost({
            target: data.target,
            accountId: data.account_id,
            media: data.media,
            caption: data.caption,
            scheduleAt: data.schedule_at ? new Date(data.schedule_at) : null,
            campaignId: data.campaign_id,
            idempotencyKey: data.idempotency_key,
            aiGenerate: data.ai_generate ? {
                productInfo: data.ai_generate.product_info,
                tone: data.ai_generate.tone,
                length: data.ai_generate.length,
            } : undefined,
        });

        if (!result.success) {
            return res.status(400).json(result);
        }

        res.status(200).json({
            success: true,
            post_id: result.postId,
            published_id: result.publishedId,
            scheduled_id: result.scheduledId,
            ai_captions: result.aiCaptions,
        });
    } catch (error: any) {
        logger.error('Error creating post', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/meta/accounts
 * Get connected pages/IG accounts
 */
router.get('/accounts', async (req: Request, res: Response) => {
    try {
        const accounts = await metaPublishingService.getConnectedAccounts();

        res.json({
            success: true,
            accounts,
        });
    } catch (error: any) {
        logger.error('Error fetching accounts', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/meta/accounts/sync
 * Sync accounts from Meta API
 */
router.post('/accounts/sync', async (req: Request, res: Response) => {
    try {
        const accessToken = req.body.access_token || process.env.META_ACCESS_TOKEN;

        if (!accessToken) {
            return res.status(400).json({
                success: false,
                error: 'Access token required',
            });
        }

        const result = await metaPublishingService.syncAccounts(accessToken);

        res.json({
            success: true,
            synced: result.synced,
            errors: result.errors,
        });
    } catch (error: any) {
        logger.error('Error syncing accounts', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/meta/test-publish
 * Test publication flow (dev-only with mocks)
 */
router.post('/test-publish', async (req: Request, res: Response) => {
    const isDev = process.env.NODE_ENV !== 'production';

    if (!isDev) {
        return res.status(403).json({
            success: false,
            error: 'Test endpoint only available in development mode',
        });
    }

    try {
        const { target = 'instagram', account_id, media = [], caption = 'Test post' } = req.body;

        logger.info('Test publish request', { target, isDev: true });

        // In dev mode, return mock success
        res.json({
            success: true,
            mock: true,
            post_id: `test_${Date.now()}`,
            published_id: `mock_${target}_${Date.now()}`,
            message: 'This is a mock response. In production, this would publish to Meta.',
            request: { target, account_id, media, caption },
        });
    } catch (error: any) {
        logger.error('Error in test publish', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * POST /api/meta/generate-captions
 * Generate AI captions without publishing
 */
router.post('/generate-captions', async (req: Request, res: Response) => {
    try {
        const validation = generateCaptionsSchema.safeParse(req.body);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: 'Validation failed',
                details: validation.error.flatten(),
            });
        }

        const data = validation.data;

        logger.info('Generate captions request', { tone: data.tone, platform: data.platform });

        const result = await aiPostComposerService.generateCaptions({
            promptHints: data.prompt_hints,
            productInfo: data.product_info,
            tone: data.tone,
            length: data.length,
            includeHashtags: data.include_hashtags,
            platform: data.platform,
        }, { creative: data.creative });

        res.json({
            success: true,
            captions: {
                short: result.captionShort,
                medium: result.captionMedium,
                long: result.captionLong,
            },
            hashtags: result.hashtags,
            title_options: result.titleOptions,
        });
    } catch (error: any) {
        logger.error('Error generating captions', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/meta/validate-scopes
 * Check if required permissions are available
 */
router.get('/validate-scopes', async (req: Request, res: Response) => {
    try {
        const target = (req.query.target as 'instagram' | 'facebook') || 'instagram';

        const result = await metaPublishingService.validateScopes(target);

        res.json({
            success: true,
            valid: result.valid,
            missing_scopes: result.missingScopes,
            message: result.message,
        });
    } catch (error: any) {
        logger.error('Error validating scopes', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

/**
 * GET /api/meta/status
 * Check Meta API connection status
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const connection = await metaPublishingService.testConnection();

        // Also check scopes
        const instagramScopes = await metaPublishingService.validateScopes('instagram');
        const facebookScopes = await metaPublishingService.validateScopes('facebook');

        res.json({
            success: true,
            connected: connection.connected,
            message: connection.message,
            scopes: {
                instagram: {
                    valid: instagramScopes.valid,
                    missing: instagramScopes.missingScopes,
                },
                facebook: {
                    valid: facebookScopes.valid,
                    missing: facebookScopes.missingScopes,
                },
            },
        });
    } catch (error: any) {
        logger.error('Error checking status', { error: error.message });
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

export default router;
