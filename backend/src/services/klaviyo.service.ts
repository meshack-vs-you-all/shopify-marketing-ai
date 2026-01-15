import { Campaign, EmailList } from '@prisma/client';
import { getEnv } from '../config/validateEnv';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

const KLAVIYO_API_KEY = process.env.KLAVIYO_API_KEY || '';
const API_URL = 'https://a.klaviyo.com/api';

interface KlaviyoCampaign {
  id: string;
  attributes: {
    name: string;
    status: string;
  };
}

/**
 * Klaviyo Service
 * NOTE: This service is currently disabled pending Klaviyo API integration.
 * Email sending is handled directly via email.service.ts (SES/SMTP).
 * To enable Klaviyo, set KLAVIYO_API_KEY in environment and configure email lists with externalId.
 */
class KlaviyoService {
  private async makeApiRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT', body?: any) {
    if (!KLAVIYO_API_KEY) {
      logger.warn('Klaviyo API key not configured, skipping API call');
      throw new Error('Klaviyo integration not configured');
    }

    const headers = {
      Authorization: `Klaviyo-API-Key ${KLAVIYO_API_KEY}`,
      accept: 'application/json',
      'content-type': 'application/json',
      revision: '2024-02-15',
    };

    const url = `${API_URL}/${endpoint}`;
    logger.info(`Making Klaviyo API call to ${url}`);

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`Klaviyo API error: ${response.status} ${errorText}`);
      throw new Error(`Klaviyo API request failed: ${errorText}`);
    }

    return response.json();
  }

  async sendCampaign(dbCampaign: Campaign): Promise<{ success: boolean; externalId?: string; error?: string }> {
    try {
      const emailList = await this.findEmailList(dbCampaign.emailListId!)
      // Use externalId field which stores the Klaviyo List ID
      if (!emailList || !emailList.externalId) {
        throw new Error(`Klaviyo List ID (externalId) not found for email list ${dbCampaign.emailListId}`);
      }
      // 1. Create a campaign in Klaviyo
      const createData = {
        data: {
          type: 'campaign',
          attributes: {
            name: dbCampaign.name,
            audiences: {
              included: [emailList.externalId], // Use externalId
            },
            send_strategy: {
              method: 'immediate',
            },
          },
        },
      };

      const klaviyoCampaign = (await this.makeApiRequest('campaigns', 'POST', createData)) as { data: KlaviyoCampaign };
      const klaviyoCampaignId = klaviyoCampaign.data.id;
      logger.info(`Created Klaviyo campaign with ID: ${klaviyoCampaignId}`);

      // 2. Create the campaign message (the email content)
      const messageData = {
        data: {
          type: 'campaign-message',
          attributes: {
            channel: 'email',
            label: 'Primary email content',
            content: {
              subject: dbCampaign.subject || 'Your Campaign Subject',
              from_email: 'noreply@glowify.com',
              from_name: 'Glowify',
              html: dbCampaign.htmlContent || '<p>This is your email content.</p>',
              plain_text: dbCampaign.textContent || 'This is your email content.'
            },
          },
          relationships: {
            campaign: {
              data: {
                type: 'campaign',
                id: klaviyoCampaignId,
              },
            },
          },
        },
      };

      await this.makeApiRequest('campaign-messages', 'POST', messageData);
      logger.info(`Added content to Klaviyo campaign ${klaviyoCampaignId}`);

      // 3. Send the campaign
      await this.makeApiRequest(`campaigns/${klaviyoCampaignId}/send-jobs`, 'POST');
      logger.info(`Successfully queued campaign ${dbCampaign.id} for sending via Klaviyo.`);

      return { success: true, externalId: klaviyoCampaignId };
    } catch (err: any) {
      logger.error(`Failed to send campaign via Klaviyo:`, err);
      return { success: false, error: err.message };
    }
  }

  async findEmailList(listId: string): Promise<EmailList | null> {
    return prisma.emailList.findUnique({ where: { id: listId } });
  }
}

export const klaviyoService = new KlaviyoService();
