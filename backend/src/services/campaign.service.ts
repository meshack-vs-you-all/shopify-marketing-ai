import { prisma } from '../config/database';
import { Campaign, CampaignStatus, CampaignType, Platform } from '@prisma/client';
import { logger } from '../utils/logger';
import { metaAdsService } from './meta-ads.service';
import { klaviyoService } from './klaviyo.service';

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

class CampaignService {

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
   * Immediately sends a newsletter campaign via Klaviyo.
   */
  async sendNow(id: string) {
    const campaign = await this.validateCampaign(id);

    if (campaign.type !== CampaignType.NEWSLETTER) {
      throw new Error('Only newsletter campaigns can be sent.');
    }

    const result = await klaviyoService.sendCampaign(campaign);
    if (!result.success) {
      throw new Error(result.error || 'Failed to send campaign via Klaviyo');
    }

    logger.info(`Campaign ${id} successfully sent via Klaviyo. External ID: ${result.externalId}`);
    return await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.ACTIVE,
        externalId: result.externalId,
        sentAt: new Date(),
      },
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
