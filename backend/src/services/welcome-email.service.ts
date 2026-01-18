/**
 * Welcome Email Service
 * 
 * Handles automated welcome emails for new subscribers with:
 * - Immediate or delayed sending options
 * - AI-powered personalization
 * - BullMQ queue integration
 */

import { prisma } from '../config/database';
import { emailQueue } from '../workers/queues';
import { aiService } from './ai.service';
import { emailService } from './email.service';
import { logger } from '../utils/logger';
import { SubscriberStatus } from '@prisma/client';

export interface WelcomeEmailConfig {
    listId: string;
    subject?: string;
    htmlTemplate?: string;
    delayMs?: number; // Delay in milliseconds (e.g., 24 hours = 86400000)
    useAI?: boolean;
    storeName?: string;
}

export interface WelcomeEmailResult {
    success: boolean;
    jobId?: string;
    subscriberId: string;
    scheduledFor?: Date;
    error?: string;
}

const DEFAULT_WELCOME_SUBJECT = 'Welcome to {{storeName}}! 🎉';
const DEFAULT_WELCOME_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; padding: 20px 0; }
    .content { padding: 20px 0; }
    .cta { display: inline-block; background: #4F46E5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }
    .footer { text-align: center; padding: 20px 0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Welcome, {{firstName}}! 🎉</h1>
  </div>
  <div class="content">
    <p>Thank you for subscribing to {{storeName}}!</p>
    <p>You're now part of our community. Here's what you can expect:</p>
    <ul>
      <li>✨ Exclusive deals and early access to sales</li>
      <li>📦 New product announcements</li>
      <li>💡 Tips and inspiration</li>
    </ul>
    <p>As a thank you, enjoy <strong>10% off</strong> your first order!</p>
    <p style="text-align: center;">
      <a href="{{shopUrl}}" class="cta">Shop Now</a>
    </p>
  </div>
  <div class="footer">
    <p>You received this email because you subscribed to {{storeName}}.</p>
    <p><a href="{{unsubscribeUrl}}">Unsubscribe</a></p>
  </div>
</body>
</html>
`;

class WelcomeEmailService {
    private configs: Map<string, WelcomeEmailConfig> = new Map();

    /**
     * Configure welcome email for a specific list
     */
    setConfig(listId: string, config: Partial<WelcomeEmailConfig>) {
        const existing = this.configs.get(listId) || { listId };
        this.configs.set(listId, { ...existing, ...config, listId });
        logger.info('Welcome email config set', { listId });
    }

    /**
     * Get config for a list
     */
    getConfig(listId: string): WelcomeEmailConfig | undefined {
        return this.configs.get(listId);
    }

    /**
     * Trigger welcome email for a new subscriber
     * Called when a subscriber is added to a list
     */
    async triggerWelcomeEmail(
        subscriberId: string,
        options?: { delayMs?: number; immediate?: boolean }
    ): Promise<WelcomeEmailResult> {
        try {
            const subscriber = await prisma.subscriber.findUnique({
                where: { id: subscriberId },
                include: { list: true }
            });

            if (!subscriber) {
                return { success: false, subscriberId, error: 'Subscriber not found' };
            }

            if (subscriber.status !== SubscriberStatus.SUBSCRIBED) {
                return { success: false, subscriberId, error: 'Subscriber not active' };
            }

            const config = this.configs.get(subscriber.listId);
            const delayMs = options?.delayMs ?? config?.delayMs ?? 0;

            // Queue the welcome email
            const jobOptions: any = {};
            if (delayMs > 0 && !options?.immediate) {
                jobOptions.delay = delayMs;
            }

            const job = await emailQueue.add(
                'send-welcome-email',
                {
                    subscriberId,
                    listId: subscriber.listId,
                    useAI: config?.useAI ?? false,
                    storeName: config?.storeName || 'Our Store',
                },
                jobOptions
            );

            const scheduledFor = delayMs > 0 ? new Date(Date.now() + delayMs) : undefined;

            logger.info('Welcome email queued', {
                subscriberId,
                jobId: job.id,
                delay: delayMs,
                scheduledFor
            });

            return {
                success: true,
                jobId: job.id,
                subscriberId,
                scheduledFor
            };
        } catch (error: any) {
            logger.error('Failed to trigger welcome email', { subscriberId, error: error.message });
            return { success: false, subscriberId, error: error.message };
        }
    }

    /**
     * Send welcome email immediately (called by worker)
     */
    async sendWelcomeEmail(
        subscriberId: string,
        options: { useAI?: boolean; storeName?: string }
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const subscriber = await prisma.subscriber.findUnique({
                where: { id: subscriberId },
                include: { list: true }
            });

            if (!subscriber) {
                throw new Error('Subscriber not found');
            }

            const config = this.configs.get(subscriber.listId);
            let subject = config?.subject || DEFAULT_WELCOME_SUBJECT;
            let htmlBody = config?.htmlTemplate || DEFAULT_WELCOME_HTML;

            // AI-enhanced personalization
            if (options.useAI) {
                try {
                    const aiResult = await aiService.generateWithFallback({
                        prompt: `Generate a warm, personalized welcome email for ${subscriber.firstName || 'new subscriber'} who just subscribed to ${options.storeName || 'our store'}. 
                        Keep it concise, friendly, and include a 10% discount offer.
                        Return JSON: { "subject": "...", "body": "..." }`,
                        taskType: 'email_subject',
                        maxTokens: 1024,
                    });

                    const parsed = JSON.parse(aiResult.content.match(/\{[\s\S]*\}/)?.[0] || '{}');
                    if (parsed.subject) subject = parsed.subject;
                    if (parsed.body) htmlBody = this.wrapInTemplate(parsed.body);
                } catch (aiError) {
                    logger.warn('AI personalization failed, using default template', { error: aiError });
                }
            }

            // Replace placeholders
            subject = this.replacePlaceholders(subject, subscriber, options.storeName);
            htmlBody = this.replacePlaceholders(htmlBody, subscriber, options.storeName);

            const result = await emailService.sendMarketingEmail({
                to: subscriber.email,
                subject,
                htmlBody,
            });

            if (result.success) {
                logger.info('Welcome email sent', { subscriberId, messageId: result.messageId });
            }

            return result;
        } catch (error: any) {
            logger.error('Failed to send welcome email', { subscriberId, error: error.message });
            return { success: false, error: error.message };
        }
    }

    private replacePlaceholders(content: string, subscriber: any, storeName?: string): string {
        return content
            .replace(/\{\{firstName\}\}/g, subscriber.firstName || 'there')
            .replace(/\{\{lastName\}\}/g, subscriber.lastName || '')
            .replace(/\{\{email\}\}/g, subscriber.email)
            .replace(/\{\{storeName\}\}/g, storeName || 'Our Store')
            .replace(/\{\{shopUrl\}\}/g, process.env.SHOPIFY_STORE_URL ? `https://${process.env.SHOPIFY_STORE_URL}` : '#')
            .replace(/\{\{unsubscribeUrl\}\}/g, `${process.env.API_URL}/unsubscribe?id=${subscriber.id}`);
    }

    private wrapInTemplate(body: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
  </style>
</head>
<body>
  ${body}
</body>
</html>`;
    }
}

export const welcomeEmailService = new WelcomeEmailService();
export default welcomeEmailService;
