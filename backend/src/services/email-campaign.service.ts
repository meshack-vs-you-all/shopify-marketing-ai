import { parse } from 'csv-parse';
import fs from 'fs';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { CampaignStatus, DeliveryStatus, SubscriberStatus } from '@prisma/client';
import { Queue } from 'bullmq';

import { emailQueue } from '../workers/queues';
import { welcomeEmailService } from './welcome-email.service';

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

  async addSubscriber(params: AddSubscriberParams & { triggerWelcomeEmail?: boolean }) {
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

    const subscriber = await prisma.subscriber.create({
      data: {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        listId: params.listId,
        importSource: params.importSource
      }
    });

    // Trigger welcome email for new subscribers (default: enabled)
    if (params.triggerWelcomeEmail !== false) {
      try {
        await welcomeEmailService.triggerWelcomeEmail(subscriber.id);
        logger.info('Welcome email queued for new subscriber', { subscriberId: subscriber.id });
      } catch (error: any) {
        logger.warn('Failed to queue welcome email', { subscriberId: subscriber.id, error: error.message });
      }
    }

    return subscriber;
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
    // 1. Fetch Legacy Email Campaigns
    const campaigns = await prisma.emailCampaign.findMany();

    const legacySent = campaigns.reduce((acc, c) => acc + c.sentCount, 0);
    const legacyDelivered = campaigns.reduce((acc, c) => acc + c.deliveredCount, 0);
    const legacyOpened = campaigns.reduce((acc, c) => acc + c.openCount, 0);
    const legacyClicked = campaigns.reduce((acc, c) => acc + c.clickCount, 0);

    // 2. Fetch Unified Campaigns (Type=NEWSLETTER)
    const unifiedEmailCampaigns = await prisma.campaign.findMany({
      where: { type: 'NEWSLETTER', status: { not: 'DRAFT' } } // Only count active/sent
    });

    const unifiedSent = unifiedEmailCampaigns.reduce((acc, c) => acc + c.sentCount, 0);
    // Unified 'impressions' roughly maps to 'opens' for emails in our model
    const unifiedOpened = unifiedEmailCampaigns.reduce((acc, c) => acc + c.impressions, 0);
    const unifiedClicked = unifiedEmailCampaigns.reduce((acc, c) => acc + c.clicks, 0);
    // Failed count
    const unifiedFailed = unifiedEmailCampaigns.reduce((acc, c) => acc + c.failedCount, 0);

    // 3. Aggregate
    const totalSent = legacySent + unifiedSent;
    const totalOpened = legacyOpened + unifiedOpened;
    const totalClicked = legacyClicked + unifiedClicked;
    // Estimate delivered for Unified (Sent - Failed)
    const unifiedDelivered = unifiedSent - unifiedFailed;
    const totalDelivered = legacyDelivered + (unifiedDelivered > 0 ? unifiedDelivered : 0);

    // Calculate Rates
    const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0;
    const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;
    const clickRate = totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0;

    // 4. Recent Activity (Merge & Sort)
    const recentLegacy = await prisma.emailCampaign.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { emailList: true }
    });

    const recentUnified = await prisma.campaign.findMany({
      where: { type: 'NEWSLETTER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { emailList: true }
    });

    // Map unified to match legacy shape for frontend compatibility if needed, 
    // or just return as is (Frontend expects 'name', 'status', 'sentCount')
    const mappedUnified = recentUnified.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      subject: c.subject,
      sentCount: c.sentCount,
      openCount: c.impressions,
      clickCount: c.clicks,
      createdAt: c.createdAt,
      emailList: c.emailList,
      isUnified: true
    }));

    // Combine and sort
    const allRecent = [...recentLegacy, ...mappedUnified]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Meta Campaigns (for separate stats if needed)
    const metaCampaigns = await prisma.campaign.findMany({ where: { type: 'META_AD' } });

    return {
      overview: {
        totalCampaigns: campaigns.length + unifiedEmailCampaigns.length,
        totalSent,
        avgDeliveryRate: parseFloat(deliveryRate.toFixed(2)),
        avgOpenRate: parseFloat(openRate.toFixed(2)),
        avgClickRate: parseFloat(clickRate.toFixed(2)),
      },
      meta: {
        total: metaCampaigns.length,
        draft: metaCampaigns.filter(c => c.status === 'DRAFT').length,
        ready: metaCampaigns.filter(c => c.status === CampaignStatus.PENDING || c.status === 'SCHEDULED').length,
      },
      recentCampaigns: allRecent,
    };
  }
}

export const emailCampaignService = new EmailCampaignService();
export default emailCampaignService;
