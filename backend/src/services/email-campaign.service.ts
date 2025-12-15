import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { CampaignStatus, DeliveryStatus, SubscriberStatus } from '@prisma/client';
import { Queue } from 'bullmq';

// Queue for email sending jobs
const emailQueue = new Queue('email-sending', {
  connection: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
});

interface CreateListParams {
  name: string;
  description?: string;
}

interface AddSubscriberParams {
  email: string;
  firstName?: string;
  lastName?: string;
  listId: string;
}

interface CreateCampaignParams {
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  listId: string;
  scheduledAt?: Date;
}

/**
 * Email Campaign Service
 * Manages lists, subscribers, and campaign orchestration
 */
class EmailCampaignService {

  // --- Lists & Subscribers ---

  async createList(params: CreateListParams) {
    return prisma.emailList.create({
      data: params
    });
  }

  async getLists() {
    return prisma.emailList.findMany({
      include: {
        _count: {
          select: { subscribers: true }
        }
      }
    });
  }

  async addSubscriber(params: AddSubscriberParams) {
    // Check if subscriber already exists in this list
    const existing = await prisma.subscriber.findUnique({
      where: {
        email_listId: {
          email: params.email,
          listId: params.listId
        }
      }
    });

    if (existing) {
      if (existing.status !== SubscriberStatus.SUBSCRIBED) {
        return prisma.subscriber.update({
          where: { id: existing.id },
          data: { status: SubscriberStatus.SUBSCRIBED }
        });
      }
      return existing;
    }

    return prisma.subscriber.create({
      data: params
    });
  }

  async getSubscribers(listId: string) {
    return prisma.subscriber.findMany({
      where: { listId }
    });
  }

  // --- Campaigns ---

  async createCampaign(params: CreateCampaignParams) {
    return prisma.emailCampaign.create({
      data: {
        ...params,
        status: CampaignStatus.DRAFT
      }
    });
  }

  async getCampaign(id: string) {
    return prisma.emailCampaign.findUnique({
      where: { id },
      include: {
        emailList: true,
        _count: {
          select: { deliveryLogs: true }
        }
      }
    });
  }

  async getCampaigns() {
    return prisma.emailCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        emailList: true
      }
    });
  }

  /**
   * Schedule or Send a campaign
   */
  async sendCampaign(campaignId: string) {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId },
      include: { emailList: true }
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === CampaignStatus.SENDING || campaign.status === CampaignStatus.COMPLETED) {
      throw new Error('Campaign is already active or completed');
    }

    // Update status to PENDING/SENDING
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: {
        status: CampaignStatus.PENDING, // Worker will pick it up
        sentAt: new Date()
      }
    });

    // Enqueue job for the worker
    await emailQueue.add('process-campaign', {
      campaignId: campaign.id
    });

    logger.info(`Campaign ${campaignId} queued for sending`);
    return { success: true, message: 'Campaign queued' };
  }

  /**
   * Get campaign analytics
   */
  async getCampaignAnalytics(campaignId: string) {
    const campaign = await prisma.emailCampaign.findUnique({
      where: { id: campaignId }
    });

    if (!campaign) return null;

    return {
      sent: campaign.sentCount,
      delivered: campaign.deliveredCount,
      opened: campaign.openCount,
      clicked: campaign.clickCount,
      failed: campaign.failedCount,
      openRate: campaign.deliveredCount > 0 ? (campaign.openCount / campaign.deliveredCount) * 100 : 0,
      clickRate: campaign.openCount > 0 ? (campaign.clickCount / campaign.openCount) * 100 : 0
    };
  }
}

export const emailCampaignService = new EmailCampaignService();
export default emailCampaignService;
