import { Router } from 'express';
import { prisma } from '../config/database';
import { campaignService } from '../services/campaign.service';
import { approvalService } from '../services/approval.service';
import { aiRateLimiter } from '../middleware/rateLimiter';
import { AppError } from '../middleware/errorHandler';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import {
  createCampaignSchema,
  updateCampaignSchema,
  campaignIdSchema,
  campaignQuerySchema,
} from '../../../shared/schemas/campaign.schema';

const router = Router();

/**
 * GET /api/campaigns
 * Get all campaigns
 */
router.get('/', validateQuery(campaignQuerySchema), async (req, res, next) => {
  try {
    const { platform, status, limit, offset } = req.query;
    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(platform && { platform: platform as any }),
        ...(status && { status: status as any }),
      },
      include: {
        adSets: {
          include: {
            ads: true,
          },
        },
        _count: {
          select: {
            approvals: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit as number,
      skip: offset as number,
    });

    res.json({ campaigns, pagination: { limit, offset, total: campaigns.length } });
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/campaigns/:id
 * Get campaign details
 */
router.get('/:id', validateParams(campaignIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        adSets: {
          include: {
            ads: true,
            metrics: {
              orderBy: { date: 'desc' },
              take: 30,
            },
          },
        },
        metrics: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        approvals: {
          where: { status: 'PENDING' },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    res.json({ campaign });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/campaigns
 * Create a new campaign
 */
router.post('/', aiRateLimiter, validateBody(createCampaignSchema), async (req, res, next) => {
  try {
    const {
      platform,
      productIds,
      budget,
      dailyBudget,
      objective,
      targetAudience,
      autoApprove,
    } = req.body;

    const result = await campaignService.createCampaign({
      platform,
      productIds,
      budget,
      dailyBudget,
      objective,
      targetAudience,
      autoApprove: autoApprove ?? false,
    });

    res.status(201).json(result);
  } catch (error: any) {
    next(error);
  }
});

/**
 * GET /api/campaigns/:id/metrics
 * Get campaign performance metrics
 */
router.get('/:id/metrics', validateParams(campaignIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const metrics = await campaignService.getCampaignMetrics(id);
    res.json(metrics);
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/campaigns/:id/optimize
 * Get optimization recommendations
 */
router.post('/:id/optimize', aiRateLimiter, validateParams(campaignIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    const optimization = await campaignService.optimizeCampaign(id);
    res.json(optimization);
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/campaigns/:id/deploy
 * Deploy campaign to platform
 */
router.post('/:id/deploy', validateParams(campaignIdSchema), async (req, res, next) => {
  try {
    const { id } = req.params;
    await campaignService.deployCampaign(id);
    res.json({ message: 'Campaign deployed successfully' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

