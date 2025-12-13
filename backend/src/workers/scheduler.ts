import cron from 'node-cron';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

// Initialize Redis and Queue
const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

const queue = new Queue('campaign-jobs', { connection });

/**
 * Scheduled Tasks
 * Runs periodic jobs for campaign management
 */

// Sync campaign metrics every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  logger.info('Running scheduled task: Sync campaign metrics');
  
  try {
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const campaign of activeCampaigns) {
      await queue.add('sync-campaign-metrics', {
        campaignId: campaign.id,
      });
    }

    logger.info(`Scheduled sync completed for ${activeCampaigns.length} campaigns`);
  } catch (error: any) {
    logger.error('Error in scheduled sync', { error: error.message });
  }
});

// Optimize campaigns daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Running scheduled task: Optimize campaigns');
  
  try {
    const activeCampaigns = await prisma.campaign.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    for (const campaign of activeCampaigns) {
      await queue.add('optimize-campaign', {
        campaignId: campaign.id,
      });
    }

    logger.info(`Scheduled optimization completed for ${activeCampaigns.length} campaigns`);
  } catch (error: any) {
    logger.error('Error in scheduled optimization', { error: error.message });
  }
});

// Check pending approvals every hour
cron.schedule('0 * * * *', async () => {
  logger.info('Running scheduled task: Check pending approvals');
  
  try {
    await queue.add('check-approvals', {});
  } catch (error: any) {
    logger.error('Error checking approvals', { error: error.message });
  }
});

logger.info('📅 Scheduler started - tasks will run on schedule');

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing scheduler');
  await connection.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing scheduler');
  await connection.quit();
  process.exit(0);
});

