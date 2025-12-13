import { prisma } from '../config/database';
import { shopifyService } from './shopify.service';
import { metaService } from './meta.service';
import { aiService } from './ai.service';
import { logger } from '../utils/logger';
import { Platform, CampaignStatus, ApprovalType, ApprovalStatus } from '@prisma/client';

/**
 * Campaign Management Service
 * Orchestrates campaign creation, optimization, and management
 */
class CampaignService {
  /**
   * Create a new marketing campaign automatically
   */
  async createCampaign(params: {
    platform: Platform;
    productIds?: string[];
    budget: number;
    dailyBudget?: number;
    objective: string;
    targetAudience?: any;
    autoApprove?: boolean;
  }): Promise<{
    campaign: any;
    approval?: any;
  }> {
    try {
      // 1. Get product data from Shopify
      let products: any[] = [];
      if (params.productIds && params.productIds.length > 0) {
        products = await Promise.all(
          params.productIds.map(id => shopifyService.getProduct(id))
        );
      } else {
        // Get top products if none specified
        products = await shopifyService.getTopProducts(5);
      }

      if (products.length === 0) {
        throw new Error('No products found to create campaign for');
      }

      // 2. Generate AI content for ads
      const product = products[0]; // Use first product for now
      const adCopy = await aiService.generateAdCopy({
        productName: product.title || product.name,
        productDescription: product.body_html || product.description || '',
        targetAudience: params.targetAudience?.description || 'General audience',
        platform: params.platform === Platform.META ? 'meta' : 'google',
        numberOfVariations: 3,
      });

      // 3. Create campaign in database
      const campaign = await prisma.campaign.create({
        data: {
          platform: params.platform,
          name: `${product.title || 'Product'} Campaign`,
          status: CampaignStatus.DRAFT,
          budget: params.budget,
          dailyBudget: params.dailyBudget,
          objective: params.objective,
          targetAudience: params.targetAudience || {},
        },
      });

      // 4. Create approval if needed
      let approval = null;
      if (!params.autoApprove) {
        approval = await prisma.approval.create({
          data: {
            type: ApprovalType.CAMPAIGN_CREATION,
            status: ApprovalStatus.PENDING,
            entityType: 'campaign',
            entityId: campaign.id,
            campaignId: campaign.id,
            requestData: {
              campaign: {
                id: campaign.id,
                name: campaign.name,
                budget: campaign.budget,
                platform: campaign.platform,
              },
              products: products.map(p => ({
                id: p.id,
                title: p.title || p.name,
              })),
              adCopy: {
                headlines: adCopy.headlines,
                descriptions: adCopy.descriptions,
              },
            },
          },
        });
      }

      // 5. If auto-approved, create campaign in platform
      if (params.autoApprove || !approval) {
        await this.deployCampaign(campaign.id, {
          products,
          adCopy,
        });
      }

      logger.info('Campaign created', { campaignId: campaign.id, platform: params.platform });

      return { campaign, approval };
    } catch (error: any) {
      logger.error('Error creating campaign', { error: error.message, params });
      throw new Error(`Failed to create campaign: ${error.message}`);
    }
  }

  /**
   * Deploy campaign to the advertising platform
   */
  async deployCampaign(campaignId: string, options?: {
    products?: any[];
    adCopy?: any;
  }): Promise<void> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { adSets: { include: { ads: true } } },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      if (campaign.platform === Platform.META) {
        await this.deployMetaCampaign(campaign, options);
      } else if (campaign.platform === Platform.GOOGLE_ADS) {
        await this.deployGoogleCampaign(campaign, options);
      }

      // Update campaign status
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: CampaignStatus.ACTIVE },
      });

      logger.info('Campaign deployed', { campaignId, platform: campaign.platform });
    } catch (error: any) {
      logger.error('Error deploying campaign', { error: error.message, campaignId });
      throw error;
    }
  }

  /**
   * Deploy to Meta platform
   */
  private async deployMetaCampaign(campaign: any, options?: any): Promise<void> {
    try {
      // Create Meta campaign
      const metaCampaign = await metaService.createCampaign({
        name: campaign.name,
        objective: campaign.objective || 'CONVERSIONS',
        status: 'PAUSED', // Start paused, activate after approval
        specialAdCategories: [],
      });

      // Update campaign with external ID
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { externalId: metaCampaign.id },
      });

      // Create ad set
      const adSet = await metaService.createAdSet({
        campaignId: metaCampaign.id,
        name: `${campaign.name} - Ad Set 1`,
        dailyBudget: Number(campaign.dailyBudget || campaign.budget / 30),
        billingEvent: 'IMPRESSIONS',
        optimizationGoal: 'OFFSITE_CONVERSIONS',
        targeting: campaign.targetAudience || {
          age_min: 18,
          age_max: 65,
          genders: [1, 2], // All genders
        },
        status: 'PAUSED',
      });

      // Save ad set to database
      const dbAdSet = await prisma.adSet.create({
        data: {
          campaignId: campaign.id,
          name: adSet.name,
          status: CampaignStatus.DRAFT,
          budget: campaign.dailyBudget || campaign.budget / 30,
          externalId: adSet.id,
          targeting: campaign.targetAudience,
        },
      });

      // Create ads if ad copy provided
      if (options?.adCopy) {
        const headlines = options.adCopy.headlines || [];
        const descriptions = options.adCopy.descriptions || [];
        const ctas = options.adCopy.callToActions || ['Shop Now'];

        for (let i = 0; i < Math.min(headlines.length, 3); i++) {
          // Create ad creative
          const creative = await metaService.createAdCreative({
            name: `${campaign.name} - Creative ${i + 1}`,
            objectStorySpec: {
              page_id: process.env.META_PAGE_ID || '', // Need to set this
              link_data: {
                message: descriptions[i] || '',
                link: options.products?.[0]?.url || '',
                name: headlines[i] || '',
                call_to_action: {
                  type: ctas[i] || 'LEARN_MORE',
                },
              },
            },
          });

          // Create ad
          const ad = await metaService.createAd({
            adSetId: adSet.id,
            creativeId: creative.id,
            name: `${campaign.name} - Ad ${i + 1}`,
            status: 'PAUSED',
          });

          // Save to database
          await prisma.ad.create({
            data: {
              adSetId: dbAdSet.id,
              name: ad.name,
              status: CampaignStatus.DRAFT,
              creativeType: 'IMAGE',
              headline: headlines[i],
              description: descriptions[i],
              callToAction: ctas[i],
              externalId: ad.id,
              aiGenerated: true,
              aiModel: 'gpt-4',
            },
          });
        }
      }
    } catch (error: any) {
      logger.error('Error deploying Meta campaign', { error: error.message });
      throw error;
    }
  }

  /**
   * Deploy to Google Ads platform
   */
  private async deployGoogleCampaign(campaign: any, options?: any): Promise<void> {
    // TODO: Implement Google Ads deployment
    logger.info('Google Ads deployment not yet fully implemented', { campaignId: campaign.id });
  }

  /**
   * Get campaign performance metrics
   */
  async getCampaignMetrics(campaignId: string): Promise<any> {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          metrics: {
            orderBy: { date: 'desc' },
            take: 30, // Last 30 days
          },
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Fetch latest metrics from platform
      if (campaign.externalId) {
        if (campaign.platform === Platform.META) {
          const insights = await metaService.getCampaignInsights(campaign.externalId);
          
          // Update database with latest metrics
          await this.updateCampaignMetrics(campaignId, {
            impressions: insights.impressions || 0,
            clicks: insights.clicks || 0,
            spend: parseFloat(insights.spend || 0),
            // Extract conversions from actions
            conversions: insights.actions?.find((a: any) => a.action_type === 'purchase')?.value || 0,
          });
        }
      }

      // Re-fetch from database
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { metrics: { orderBy: { date: 'desc' }, take: 30 } },
      });

      return {
        campaign: updatedCampaign,
        summary: {
          totalImpressions: updatedCampaign?.impressions || 0,
          totalClicks: updatedCampaign?.clicks || 0,
          totalSpend: updatedCampaign?.spend || 0,
          totalRevenue: updatedCampaign?.revenue || 0,
          roas: updatedCampaign?.roas || 0,
          ctr: updatedCampaign?.clicks && updatedCampaign?.impressions
            ? (updatedCampaign.clicks / updatedCampaign.impressions) * 100
            : 0,
        },
      };
    } catch (error: any) {
      logger.error('Error fetching campaign metrics', { error: error.message, campaignId });
      throw error;
    }
  }

  /**
   * Update campaign metrics in database
   */
  private async updateCampaignMetrics(
    campaignId: string,
    metrics: {
      impressions: number;
      clicks: number;
      conversions: number;
      spend: number;
      revenue?: number;
    }
  ): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    await prisma.campaignMetric.upsert({
      where: {
        campaignId_date: {
          campaignId,
          date: today,
        },
      },
      update: {
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        spend: metrics.spend,
        revenue: metrics.revenue || 0,
      },
      create: {
        campaignId,
        date: today,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        spend: metrics.spend,
        revenue: metrics.revenue || 0,
      },
    });

    // Update campaign totals
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        spend: metrics.spend,
        revenue: metrics.revenue || 0,
        roas: metrics.revenue && metrics.spend
          ? metrics.revenue / metrics.spend
          : null,
      },
    });
  }

  /**
   * Optimize campaign based on performance
   */
  async optimizeCampaign(campaignId: string): Promise<{
    recommendations: string[];
    actions: any[];
  }> {
    try {
      const metrics = await this.getCampaignMetrics(campaignId);
      const campaign = metrics.campaign;

      // Get AI recommendations
      const analysis = await aiService.analyzePerformanceAndRecommend({
        campaignMetrics: metrics,
        currentSpend: Number(campaign.spend),
        currentRevenue: Number(campaign.revenue),
        roas: Number(campaign.roas || 0),
        targetRoas: 3.0, // Default target ROAS
      });

      // Determine actions based on recommendations
      const actions: any[] = [];

      // Example: If ROAS is below target, suggest pausing
      if (campaign.roas && campaign.roas < 2.0) {
        actions.push({
          type: 'PAUSE_CAMPAIGN',
          reason: 'Low ROAS',
          campaignId,
        });
      }

      // Example: If CTR is high, suggest increasing budget
      const ctr = metrics.summary.ctr;
      if (ctr > 2.0 && campaign.status === CampaignStatus.ACTIVE) {
        actions.push({
          type: 'INCREASE_BUDGET',
          reason: 'High CTR',
          campaignId,
          suggestedIncrease: 20, // 20%
        });
      }

      return {
        recommendations: analysis.recommendations,
        actions,
      };
    } catch (error: any) {
      logger.error('Error optimizing campaign', { error: error.message, campaignId });
      throw error;
    }
  }
}

export const campaignService = new CampaignService();
export default campaignService;

