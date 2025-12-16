import { parse } from 'csv-parse';
import fs from 'fs';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { CampaignStatus, DeliveryStatus, SubscriberStatus } from '@prisma/client';
import { Queue } from 'bullmq';

interface AddSubscriberParams {
  email: string;
  firstName?: string;
  lastName?: string;
  listId: string;
  importSource?: string;
}

// ...

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

  async importSubscribersFromCsv(listId: string, filePath: string) {
    const results: any[] = [];
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse({ columns: true, trim: true }))
        .on('data', (data) => results.push(data))
        .on('error', (error) => reject(error))
        .on('end', async () => {
          let count = 0;
          try {
            for (const row of results) {
              if (row.email) {
                await this.addSubscriber({
                  email: row.email,
                  firstName: row.firstName || row.first_name,
                  lastName: row.lastName || row.last_name,
                  listId,
                  importSource: 'csv'
                });
                count++;
              }
            }
            // Clean up file
            fs.unlinkSync(filePath);
            resolve({ count });
          } catch (err) {
            reject(err);
          }
        });
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
