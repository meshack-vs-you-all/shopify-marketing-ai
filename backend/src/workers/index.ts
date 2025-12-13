import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { campaignService } from '../services/campaign.service';
import { prisma } from '../config/database';
import { CampaignStatus } from '@prisma/client';

// Initialize Redis connection
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

/**
 * Worker for processing background jobs
 */
const worker = new Worker(
  'campaign-jobs',
  async (job) => {
    logger.info(`Processing job: ${job.name}`, { jobId: job.id, data: job.data });

    try {
      switch (job.name) {
        case 'sync-campaign-metrics':
          await syncCampaignMetrics(job.data.campaignId);
          break;

        case 'optimize-campaign':
          await optimizeCampaign(job.data.campaignId);
          break;

        case 'check-approvals':
          await checkPendingApprovals();
          break;

        default:
          logger.warn('Unknown job type', { jobName: job.name });
      }

      logger.info(`Job completed: ${job.name}`, { jobId: job.id });
    } catch (error: any) {
      logger.error(`Job failed: ${job.name}`, { jobId: job.id, error: error.message });
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: {
      count: 100,
      age: 24 * 3600, // 24 hours
    },
    removeOnFail: {
      count: 1000,
    },
  }
);

/**
 * Sync campaign metrics from platform
 */
async function syncCampaignMetrics(campaignId: string): Promise<void> {
  try {
    await campaignService.getCampaignMetrics(campaignId);
    logger.info('Campaign metrics synced', { campaignId });
  } catch (error: any) {
    logger.error('Error syncing campaign metrics', { campaignId, error: error.message });
    throw error;
  }
}

/**
 * Optimize campaign based on performance
 */
async function optimizeCampaign(campaignId: string): Promise<void> {
  try {
    const optimization = await campaignService.optimizeCampaign(campaignId);
    
    // Execute recommended actions if auto-approval is enabled
    if (process.env.ENABLE_AUTO_APPROVAL === 'true') {
      for (const action of optimization.actions) {
        if (action.type === 'PAUSE_CAMPAIGN') {
          await prisma.campaign.update({
            where: { id: campaignId },
            data: { status: CampaignStatus.PAUSED },
          });
          logger.info('Campaign auto-paused due to poor performance', { campaignId });
        }
      }
    }

    logger.info('Campaign optimized', { campaignId, recommendations: optimization.recommendations.length });
  } catch (error: any) {
    logger.error('Error optimizing campaign', { campaignId, error: error.message });
    throw error;
  }
}

/**
 * Check for pending approvals and send notifications
 */
async function checkPendingApprovals(): Promise<void> {
  try {
    const approvals = await prisma.approval.findMany({
      where: { status: 'PENDING' },
      include: { campaign: true },
    });

    if (approvals.length > 0) {
      logger.info('Pending approvals found', { count: approvals.length });
      // TODO: Send notification (email/Slack)
    }
  } catch (error: any) {
    logger.error('Error checking approvals', { error: error.message });
    throw error;
  }
}

// Worker event handlers
worker.on('completed', (job) => {
  logger.info(`Job ${job.id} completed successfully`);
});

worker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed`, { error: err.message });
});

worker.on('error', (err) => {
  logger.error('Worker error', { error: err.message });
});

logger.info('🚀 Background worker started');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing worker');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing worker');
  await worker.close();
  await connection.quit();
  process.exit(0);
});

export default worker;

