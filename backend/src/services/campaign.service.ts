import { prisma } from '../config/database';
import { Campaign, CampaignStatus, CampaignType, Platform } from '@prisma/client';
import { logger } from '../utils/logger';

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
        // Set platform default based on type
        platform: data.type === CampaignType.NEWSLETTER ? Platform.EMAIL : Platform.META
      }
    });
  }

  /**
   * Get draft by ID
   */
  async getCampaign(id: string) {
    return await prisma.campaign.findUnique({
      where: { id },
      include: {
        emailList: true, // Helper to see list info
        adSets: true,
        metrics: true
      }
    });
  }

  /**
   * Update content fields dynamically
   */
  async updateContent(id: string, data: UpdateContentDTO) {
    return await prisma.campaign.update({
      where: { id },
      data: {
        ...data,
      }
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
      data: updateData
    });
  }

  /**
   * Finalize / Mark Ready
   * For Newsletter: this might trigger immediate send or schedule
   */
  async finalize(id: string) {
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) throw new Error('Campaign not found');

    // Validation
    if (campaign.type === CampaignType.NEWSLETTER) {
      if (!campaign.emailListId) throw new Error('Audience (Email List) is required');
      if (!campaign.subject || !campaign.htmlContent) throw new Error('Content (Subject & Body) is required');
    } else if (campaign.type === CampaignType.META_AD) {
      // Logic for Meta Ad readiness
      if (!campaign.primaryText || !campaign.headline) throw new Error('Ad Copy (Primary Text & Headline) is required');
    }

    // Update status
    return await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.PENDING } // READY doesn't exist in Prisma enum, using PENDING
    });
  }

  /**
   * Alias for createDraft to match route expectation
   */
  async createCampaign(data: any) {
    return this.createDraft(data);
  }

  /**
   * Get campaign metrics stub
   */
  async getCampaignMetrics(id: string) {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { metrics: true }
    });
    return campaign?.metrics || [];
  }

  /**
   * Optimize campaign stub
   */
  async optimizeCampaign(id: string) {
    logger.info(`Optimizing campaign ${id}`);
    return { success: true, message: 'Optimization logic not yet implemented' };
  }

  /**
   * Deploy campaign stub
   */
  async deployCampaign(id: string) {
    logger.info(`Deploying campaign ${id}`);
    const campaign = await prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.ACTIVE }
    });
    return campaign;
  }

  /**
   * Trigger Send (Newsletter specific)
   * This bridges to the existing BullMQ worker but using the generic ID
   */
  async sendNow(id: string) {
    const { emailQueue, EMAIL_QUEUE_NAME } = require('../workers/queues');

    // Ensure it's ready or draft
    const campaign = await this.finalize(id);

    if (campaign.type !== CampaignType.NEWSLETTER) {
      throw new Error('Only newsletters can be "sent" directly');
    }

    // Add to queue with unified flag
    await emailQueue.add(EMAIL_QUEUE_NAME, {
      campaignId: id,
      isUnified: true
    });

    logger.info(`Unified Campaign ${id} queued for sending`);
    return campaign;
  }
}

export const campaignService = new CampaignService();
