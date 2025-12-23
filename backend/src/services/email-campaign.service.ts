import { parse } from 'csv-parse';
import fs from 'fs';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { CampaignStatus, DeliveryStatus, SubscriberStatus } from '@prisma/client';
import { Queue } from 'bullmq';

// Email queue for background job processing
const emailQueue = new Queue('email-campaigns', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

interface AddSubscriberParams {
  email: string;
  firstName?: string;
  lastName?: string;
  listId: string;
  importSource?: string;
}

interface CreateListParams {
  name: string;
  description?: string;
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

  async deleteList(listId: string) {
    return prisma.emailList.delete({
      where: { id: listId }
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

  /**
   * Get global dashboard metrics
   */
  async getDashboardMetrics() {
    const campaigns = await prisma.emailCampaign.findMany();

    const totalSent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const totalDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
    const totalOpened = campaigns.reduce((acc, c) => acc + c.openCount, 0);
    const totalClicked = campaigns.reduce((acc, c) => acc + c.clickCount, 0);

    // Calculate Rates
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    // Generic Campaign Stats (Meta & New Newsletters)
    const unifiedCampaigns = await prisma.campaign.findMany();
    const metaCampaigns = unifiedCampaigns.filter(c => c.type === 'META_AD');

    // Merge new newsletters into email stats if desired, or keep separate. 
    // For now, let's just add Meta stats.

    return {
      overview: {
        totalCampaigns: campaigns.length, // Legacy Email
        totalSent,
        avgDeliveryRate: parseFloat(deliveryRate.toFixed(2)),
        avgOpenRate: parseFloat(openRate.toFixed(2)),
        avgClickRate: parseFloat(clickRate.toFixed(2)),
      },
      meta: {
        total: metaCampaigns.length,
        draft: metaCampaigns.filter(c => c.status === 'DRAFT').length,
        ready: metaCampaigns.filter(c => c.status === 'READY' || c.status === 'SCHEDULED').length,
      },
      recentCampaigns: await prisma.emailCampaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { emailList: true }
      }),
      recentUnified: await prisma.campaign.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' }
      })
    };
  }
}

export const emailCampaignService = new EmailCampaignService();
export default emailCampaignService;
