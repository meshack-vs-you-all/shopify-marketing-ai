import { logger } from '../utils/logger';

/**
 * Meta (Facebook/Instagram) Ads API Service
 * Handles campaign creation, management, and performance tracking
 */
class MetaService {
  private accessToken: string;
  private adAccountId: string;
  private apiVersion: string = 'v18.0';
  private baseUrl: string = 'https://graph.facebook.com';

  constructor() {
    this.accessToken = process.env.META_ACCESS_TOKEN || '';
    this.adAccountId = process.env.META_AD_ACCOUNT_ID || '';

    if (!this.accessToken || !this.adAccountId) {
      logger.warn('Meta Ads credentials not configured');
    }
  }

  /**
   * Create a new campaign
   */
  async createCampaign(params: {
    name: string;
    objective: string;
    status: string;
    specialAdCategories?: string[];
  }): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.adAccountId}/campaigns`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          name: params.name,
          objective: params.objective,
          status: params.status,
          special_ad_categories: params.specialAdCategories || [],
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      logger.info('Meta campaign created', { campaignId: data.id, name: params.name });
      return data;
    } catch (error: any) {
      logger.error('Error creating Meta campaign', { error: error.message, params });
      throw new Error(`Failed to create Meta campaign: ${error.message}`);
    }
  }

  /**
   * Create an ad set
   */
  async createAdSet(params: {
    campaignId: string;
    name: string;
    dailyBudget?: number;
    lifetimeBudget?: number;
    billingEvent: string;
    optimizationGoal: string;
    bidAmount?: number;
    targeting: any;
    status: string;
  }): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.adAccountId}/adsets`;
      
      const body: any = {
        access_token: this.accessToken,
        campaign_id: params.campaignId,
        name: params.name,
        billing_event: params.billingEvent,
        optimization_goal: params.optimizationGoal,
        targeting: params.targeting,
        status: params.status,
      };

      if (params.dailyBudget) {
        body.daily_budget = params.dailyBudget * 100; // Convert to cents
      }
      if (params.lifetimeBudget) {
        body.lifetime_budget = params.lifetimeBudget * 100;
      }
      if (params.bidAmount) {
        body.bid_amount = params.bidAmount * 100;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      logger.info('Meta ad set created', { adSetId: data.id, name: params.name });
      return data;
    } catch (error: any) {
      logger.error('Error creating Meta ad set', { error: error.message, params });
      throw new Error(`Failed to create Meta ad set: ${error.message}`);
    }
  }

  /**
   * Create an ad creative
   */
  async createAdCreative(params: {
    name: string;
    objectStorySpec: any;
  }): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.adAccountId}/adcreatives`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          name: params.name,
          object_story_spec: params.objectStorySpec,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      logger.info('Meta ad creative created', { creativeId: data.id });
      return data;
    } catch (error: any) {
      logger.error('Error creating Meta ad creative', { error: error.message });
      throw new Error(`Failed to create Meta ad creative: ${error.message}`);
    }
  }

  /**
   * Create an ad
   */
  async createAd(params: {
    adSetId: string;
    creativeId: string;
    name: string;
    status: string;
  }): Promise<any> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${this.adAccountId}/ads`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          adset_id: params.adSetId,
          creative: { creative_id: params.creativeId },
          name: params.name,
          status: params.status,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      logger.info('Meta ad created', { adId: data.id, name: params.name });
      return data;
    } catch (error: any) {
      logger.error('Error creating Meta ad', { error: error.message, params });
      throw new Error(`Failed to create Meta ad: ${error.message}`);
    }
  }

  /**
   * Get campaign insights (performance metrics)
   */
  async getCampaignInsights(campaignId: string, dateRange?: { since: string; until: string }): Promise<any> {
    try {
      let url = `${this.baseUrl}/${this.apiVersion}/${campaignId}/insights`;
      
      const params = new URLSearchParams({
        access_token: this.accessToken,
        fields: 'impressions,clicks,spend,actions,ctr,cpc,cpp',
        level: 'campaign',
      });

      if (dateRange) {
        params.append('time_range', JSON.stringify({
          since: dateRange.since,
          until: dateRange.until,
        }));
      }

      url += `?${params.toString()}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.data?.[0] || {};
    } catch (error: any) {
      logger.error('Error fetching Meta campaign insights', { error: error.message, campaignId });
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }
  }

  /**
   * Update campaign status (pause/resume)
   */
  async updateCampaignStatus(campaignId: string, status: 'ACTIVE' | 'PAUSED'): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/${campaignId}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: this.accessToken,
          status: status,
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      logger.info('Meta campaign status updated', { campaignId, status });
      return data.success || true;
    } catch (error: any) {
      logger.error('Error updating Meta campaign status', { error: error.message, campaignId });
      throw new Error(`Failed to update campaign status: ${error.message}`);
    }
  }

  /**
   * Test connection to Meta API
   */
  async testConnection(): Promise<boolean> {
    try {
      const url = `${this.baseUrl}/${this.apiVersion}/me?access_token=${this.accessToken}`;
      const response = await fetch(url);
      const data = await response.json();
      return !data.error;
    } catch (error) {
      logger.error('Meta connection test failed', { error });
      return false;
    }
  }
}

export const metaService = new MetaService();
export default metaService;

