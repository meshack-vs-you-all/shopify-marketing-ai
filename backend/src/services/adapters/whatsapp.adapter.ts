/**
 * WhatsApp Cloud API Adapter (Stub/Optional)
 * 
 * Note: Marketing templates require Meta pre-approval before use.
 * This adapter provides basic template message sending capabilities.
 * 
 * @see https://developers.facebook.com/docs/whatsapp/cloud-api
 */

import { logger } from '../../utils/logger';
import {
    PublishResult,
    graphApiRequest,
    withRetry,
} from './base.adapter';

export interface WhatsAppTemplateParams {
    phoneNumberId: string;
    accessToken: string;
    recipientPhone: string; // E.164 format (e.g., +1234567890)
    templateName: string;
    languageCode?: string;
    headerParams?: string[];
    bodyParams?: string[];
    buttonParams?: Array<{ type: string; value: string }>;
}

export interface WhatsAppMessageResult extends PublishResult {
    messageId?: string;
    recipientPhone?: string;
}

/**
 * WhatsApp Cloud API Adapter
 * 
 * IMPORTANT: Marketing templates must be pre-approved by Meta.
 * This adapter is provided as optional/stub for future implementation.
 */
export class WhatsAppAdapter {
    private accessToken: string;
    private phoneNumberId: string;

    constructor(accessToken?: string, phoneNumberId?: string) {
        this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || '';
        this.phoneNumberId = phoneNumberId || process.env.META_WHATSAPP_PHONE_ID || '';
    }

    /**
     * Check if WhatsApp is configured
     */
    isConfigured(): boolean {
        return !!(this.accessToken && this.phoneNumberId);
    }

    /**
     * Send a template message
     * 
     * Note: Template must be approved by Meta before use
     */
    async sendTemplateMessage(params: WhatsAppTemplateParams): Promise<WhatsAppMessageResult> {
        const {
            phoneNumberId,
            accessToken,
            recipientPhone,
            templateName,
            languageCode = 'en',
            headerParams,
            bodyParams,
        } = params;

        logger.info('Sending WhatsApp template message', {
            templateName,
            recipientPhone: recipientPhone.slice(-4).padStart(recipientPhone.length, '*'),
        });

        // Build template components
        const components: any[] = [];

        if (headerParams && headerParams.length > 0) {
            components.push({
                type: 'header',
                parameters: headerParams.map(param => ({
                    type: 'text',
                    text: param,
                })),
            });
        }

        if (bodyParams && bodyParams.length > 0) {
            components.push({
                type: 'body',
                parameters: bodyParams.map(param => ({
                    type: 'text',
                    text: param,
                })),
            });
        }

        return withRetry(
            async () => {
                const response = await graphApiRequest<{
                    messages: Array<{ id: string }>;
                }>(
                    `${phoneNumberId}/messages`,
                    'POST',
                    accessToken,
                    {
                        messaging_product: 'whatsapp',
                        to: recipientPhone,
                        type: 'template',
                        template: {
                            name: templateName,
                            language: {
                                code: languageCode,
                            },
                            components: components.length > 0 ? components : undefined,
                        },
                    }
                );

                if (!response.success) {
                    return {
                        success: false,
                        error: response.error?.message,
                        recipientPhone,
                    };
                }

                const messageId = response.data?.messages?.[0]?.id;

                logger.info('WhatsApp template message sent', { messageId, templateName });

                return {
                    success: true,
                    messageId,
                    postId: messageId,
                    recipientPhone,
                    rawResponse: response.data,
                };
            },
            { operationName: 'WhatsApp template message' }
        );
    }

    /**
     * Get message templates (for listing available templates)
     */
    async getMessageTemplates(
        businessAccountId: string,
        accessToken?: string
    ): Promise<{
        success: boolean;
        templates?: Array<{
            name: string;
            status: string;
            category: string;
            language: string;
        }>;
        error?: string;
    }> {
        const token = accessToken || this.accessToken;

        const response = await graphApiRequest<{
            data: Array<{
                name: string;
                status: string;
                category: string;
                language: string;
            }>;
        }>(
            `${businessAccountId}/message_templates`,
            'GET',
            token,
            undefined,
            { fields: 'name,status,category,language' }
        );

        if (!response.success) {
            return {
                success: false,
                error: response.error?.message,
            };
        }

        return {
            success: true,
            templates: response.data?.data?.filter(t => t.status === 'APPROVED') || [],
        };
    }

    /**
     * Stub: Send marketing message (not implemented - requires approved template)
     */
    async sendMarketingMessage(): Promise<WhatsAppMessageResult> {
        logger.warn('WhatsApp marketing messages require pre-approved templates. Use sendTemplateMessage instead.');

        return {
            success: false,
            error: 'WhatsApp marketing messages require pre-approved templates. Please use the sendTemplateMessage method with an approved template name.',
        };
    }
}

export const whatsappAdapter = new WhatsAppAdapter();
export default whatsappAdapter;
