import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';
import { emailService } from '../services/email.service';
import { CampaignStatus, DeliveryStatus, EmailCampaign } from '@prisma/client';
import pLimit from 'p-limit';

const connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

// SES Rate Limiting: 14 emails/sec is standard sandbox limit, can be increased.
// We use p-limit to control concurrency within the worker.
const RATE_LIMIT = parseInt(process.env.SES_RATE_LIMIT || '14', 10);
const limit = pLimit(RATE_LIMIT);

interface EmailJobData {
  campaignId: string;
}

/**
 * Worker to process email campaigns
 * It fetches the campaign, iterates over subscribers, and sends emails.
 * For very large lists, this should be split into batches, but for this implementation
 * we process the whole list in one job with concurrency control.
 */
export const emailWorker = new Worker<EmailJobData>(
  'email-sending',
  async (job: Job<EmailJobData>) => {
    const { campaignId } = job.data;
    logger.info(`Starting email campaign sending`, { campaignId });

    try {
      // Fetch campaign to check existence and list ID
      const campaign = await prisma.emailCampaign.findUnique({
        where: { id: campaignId },
        include: { emailList: true }
      });

      if (!campaign || !campaign.emailList) {
        throw new Error('Campaign or Email List not found');
      }

      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.SENDING }
      });

      const BATCH_SIZE = 100;
      let processedCount = 0;
      let sentCount = 0;
      let failedCount = 0;
      let cursor: string | undefined;

      // Process subscribers in batches using cursor-based pagination
      while (true) {
        const subscribers = await prisma.subscriber.findMany({
          take: BATCH_SIZE,
          skip: cursor ? 1 : 0,
          cursor: cursor ? { id: cursor } : undefined,
          where: {
            listId: campaign.listId,
            status: 'SUBSCRIBED'
          },
          orderBy: { id: 'asc' }
        });

        if (subscribers.length === 0) {
          break;
        }

        const batchPromises = subscribers.map(subscriber => {
          return limit(async () => {
            try {
              // Replace variables in content (basic personalization)
              const htmlBody = (campaign.htmlContent || '')
                .replace('{{firstName}}', subscriber.firstName || '')
                .replace('{{email}}', subscriber.email);

              const result = await emailService.sendMarketingEmail({
                to: subscriber.email,
                subject: campaign.subject,
                htmlBody: htmlBody,
                textBody: campaign.textContent || undefined,
                fromEmail: process.env.SES_FROM_EMAIL
              });

              // Log delivery
              await prisma.emailDeliveryLog.create({
                data: {
                  campaignId: campaign.id,
                  subscriberId: subscriber.id,
                  status: result.success ? DeliveryStatus.SENT : DeliveryStatus.FAILED,
                  messageId: result.messageId,
                  errorMessage: result.error
                }
              });

              if (result.success) sentCount++;
              else failedCount++;

            } catch (err: any) {
              logger.error(`Failed to send to ${subscriber.email}`, { error: err.message });
              failedCount++;

              await prisma.emailDeliveryLog.create({
                data: {
                  campaignId: campaign.id,
                  subscriberId: subscriber.id,
                  status: DeliveryStatus.FAILED,
                  errorMessage: err.message
                }
              });
            }
          });
        });

        await Promise.all(batchPromises);
        processedCount += subscribers.length;
        cursor = subscribers[subscribers.length - 1].id;

        // Update progress periodically
        await prisma.emailCampaign.update({
          where: { id: campaignId },
          data: {
            sentCount: { increment: sentCount },
            failedCount: { increment: failedCount }
          }
        });

        // Reset local counters since we already incremented db
        sentCount = 0;
        failedCount = 0;
      }

      // Final status update
      await prisma.emailCampaign.update({
         where: { id: campaignId },
         data: { status: CampaignStatus.COMPLETED }
      });

      logger.info(`Campaign completed`, { campaignId, processed: processedCount });

    } catch (error: any) {
      logger.error(`Campaign worker failed`, { campaignId, error: error.message });
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.FAILED }
      });
      throw error;
    }
  },
  {
    connection,
    concurrency: 1, // Process one campaign at a time per worker instance, but send emails in parallel
    limiter: {
      max: 1,
      duration: 1000
    }
  }
);
