import { prisma } from '../config/database';
import { Campaign, CampaignStatus, CampaignType, Platform, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { metaAdsService } from './meta-ads.service';
import { emailService } from './email.service';

export interface CreateDraftDTO {
  type: CampaignType;
  name: String;
}

export interface UpdateContentDTO {
  // Newsletter
  subject?: string;
  htmlContent?: string;
  textContent?: string;

  // Meta
  headline?: string;
  primaryText?: string;
  description?: string;
  creativeUrl?: string;
}

export interface SetAudienceDTO {
  emailListId?: string;
  targetAudience?: any; // JSON
}

/**
 * DTO for creating a full campaign (used by /api/campaigns POST)
 */
export interface CreateCampaignDTO {
  platform: 'META' | 'GOOGLE_ADS' | 'EMAIL';
  productIds?: string[];
  budget: number;
  dailyBudget?: number;
  objective: string;
  targetAudience?: {
    ageMin?: number;
    ageMax?: number;
    genders?: number[];
    interests?: string[];
    locations?: string[];
    description?: string;
  };
  autoApprove?: boolean;
}

class CampaignService {

  /**
   * Create a full campaign with all parameters
   */
  async createCampaign(data: CreateCampaignDTO): Promise<{ campaign: Campaign; requiresApproval: boolean }> {
    logger.info(`Creating campaign: platform=${data.platform}, objective=${data.objective}`);

    // Determine campaign type based on platform
    const type = data.platform === 'EMAIL' ? CampaignType.NEWSLETTER : CampaignType.META_AD;
    const platform = data.platform === 'EMAIL' ? Platform.EMAIL :
      data.platform === 'GOOGLE_ADS' ? Platform.GOOGLE_ADS : Platform.META;

    // Generate campaign name based on objective and date
    const campaignName = `${data.objective} - ${new Date().toLocaleDateString()}`;

    const campaign = await prisma.campaign.create({
      data: {
        name: campaignName,
        type,
        platform,
        status: data.autoApprove ? CampaignStatus.PENDING : CampaignStatus.DRAFT,
        budget: new Prisma.Decimal(data.budget),
        dailyBudget: data.dailyBudget ? new Prisma.Decimal(data.dailyBudget) : undefined,
        objective: data.objective,
        targetAudience: data.targetAudience ? data.targetAudience : undefined,
      },
    });

    logger.info(`Campaign created: id=${campaign.id}, name=${campaign.name}`);

    return {
      campaign,
      requiresApproval: !data.autoApprove,
    };
  }

  /**
   * Create a generic campaign draft
   */
  async createDraft(data: CreateDraftDTO) {
    logger.info(`Creating campaign draft: type=${data.type}, name=${data.name}`);
    return await prisma.campaign.create({
      data: {
        name: String(data.name),
        type: data.type,
        status: CampaignStatus.DRAFT,
        platform: data.type === CampaignType.NEWSLETTER ? Platform.EMAIL : Platform.META,
      },
    });
  }

  /**
   * Get draft by ID
   */
  async getCampaign(id: string) {
    return await prisma.campaign.findUnique({
      where: { id },
      include: {
        emailList: true,
        adSets: true,
        metrics: true,
      },
    });
  }

  /**
   * Update content fields dynamically
   */
  async updateContent(id: string, data: UpdateContentDTO) {
    return await prisma.campaign.update({
      where: { id },
      data: { ...data },
    });
  }

  /**
   * Set Audience
   */
  async setAudience(id: string, data: SetAudienceDTO) {
    const updateData: any = {};
    if (data.emailListId !== undefined) updateData.emailListId = data.emailListId;
    if (data.targetAudience !== undefined) updateData.targetAudience = data.targetAudience;

    return await prisma.campaign.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Deploy campaign to its target platform (Meta, Google, or send email)
   */
  async deployCampaign(id: string): Promise<Campaign> {
    const campaign = await this.validateCampaign(id);
    logger.info(`Deploying campaign ${id} to platform: ${campaign.platform}`);

    if (campaign.type === CampaignType.META_AD) {
      const result = await metaAdsService.publishCampaign(campaign);
      if (!result.success) {
        await this.updateCampaignStatus(id, CampaignStatus.FAILED);
        throw new Error(result.error || 'Failed to deploy to Meta');
      }
      return await prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.ACTIVE,
          externalId: result.adId,
        },
      });
    } else if (campaign.type === CampaignType.NEWSLETTER) {
      // Send newsletter via email service
      return await this.sendNewsletter(campaign);
    }

    throw new Error(`Unsupported campaign type: ${campaign.type}`);
  }

  /**
   * Finalize and prepare a campaign for its action (send, publish, etc.)
   */
  async finalize(id: string) {
    const campaign = await this.validateCampaign(id);

    if (campaign.type === CampaignType.META_AD) {
      const result = await metaAdsService.publishCampaign(campaign);
      if (!result.success) {
        throw new Error(result.error || 'Failed to publish to Meta');
      }
      return await prisma.campaign.update({
        where: { id },
        data: { status: CampaignStatus.ACTIVE, externalId: result.adId },
      });
    } else {
      // For newsletters, we just mark as PENDING. The actual send is a separate step.
      return await prisma.campaign.update({
        where: { id },
        data: { status: CampaignStatus.PENDING },
      });
    }
  }

  /**
   * Validates that a campaign has all the required fields to be finalized or sent.
   */
  async validateCampaign(id: string): Promise<Campaign> {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new Error('Campaign not found');

    if (campaign.type === CampaignType.NEWSLETTER) {
      if (!campaign.emailListId) throw new Error('Audience (Email List) is required');
      if (!campaign.subject || !campaign.htmlContent) throw new Error('Content (Subject & Body) is required');
    } else if (campaign.type === CampaignType.META_AD) {
      if (!campaign.primaryText || !campaign.headline) throw new Error('Ad Copy (Primary Text & Headline) is required');
      if (!campaign.creativeUrl) throw new Error('An ad creative (image) is required');
    }
    return campaign;
  }

  /**
   * Send a newsletter campaign via the email service (SES/SMTP)
   */
  private async sendNewsletter(campaign: Campaign): Promise<Campaign> {
    if (!campaign.emailListId) {
      throw new Error('Email list is required for newsletter campaigns');
    }

    // Get subscribers from the email list
    const subscribers = await prisma.subscriber.findMany({
      where: {
        listId: campaign.emailListId,
        status: 'SUBSCRIBED',
      },
    });

    if (subscribers.length === 0) {
      throw new Error('No active subscribers in the email list');
    }

    logger.info(`Sending newsletter to ${subscribers.length} subscribers`);

    let sentCount = 0;
    let failedCount = 0;

    // Send emails to all subscribers
    for (const subscriber of subscribers) {
      try {
        const result = await emailService.sendMarketingEmail({
          to: subscriber.email,
          subject: campaign.subject || 'Newsletter',
          htmlBody: campaign.htmlContent || '',
          textBody: campaign.textContent || undefined,
        });

        // Log delivery
        await prisma.emailDeliveryLog.create({
          data: {
            campaignId: campaign.id,
            subscriberId: subscriber.id,
            status: result.success ? 'SENT' : 'FAILED',
            messageId: result.messageId || null,
            errorMessage: result.error || null,
          },
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }
      } catch (error: any) {
        logger.error(`Failed to send to ${subscriber.email}:`, error.message);
        failedCount++;

        await prisma.emailDeliveryLog.create({
          data: {
            campaignId: campaign.id,
            subscriberId: subscriber.id,
            status: 'FAILED',
            errorMessage: error.message,
          },
        });
      }
    }

    logger.info(`Newsletter sent: ${sentCount} successful, ${failedCount} failed`);

    // Update campaign with results
    return await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: failedCount === subscribers.length ? CampaignStatus.FAILED : CampaignStatus.ACTIVE,
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    });
  }

  /**
   * Immediately sends a newsletter campaign
   */
  async sendNow(id: string) {
    const campaign = await this.validateCampaign(id);

    if (campaign.type !== CampaignType.NEWSLETTER) {
      throw new Error('Only newsletter campaigns can be sent.');
    }

    return await this.sendNewsletter(campaign);
  }

  /**
   * Update campaign status
   */
  private async updateCampaignStatus(id: string, status: CampaignStatus): Promise<Campaign> {
    return await prisma.campaign.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Get campaign metrics stub
   */
  async getCampaignMetrics(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { metrics: true },
    });
    return campaign?.metrics || [];
  }

  /**
   * Optimize campaign stub
   */
  async optimizeCampaign(id: string) {
    logger.info(`Optimizing campaign ${id}`);
    return {
      success: true,
      message: 'Optimization logic not yet implemented',
      actions: [] as any[],
      recommendations: [] as any[],
    };
  }
}

export const campaignService = new CampaignService();
