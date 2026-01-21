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
    enableFollowUp?: boolean;
    followUpDelayMs?: number; // Default 3 days
    useAI?: boolean; // Use AI for personalization
    storeName?: string; // Store name for placeholders
}

export interface WelcomeEmailResult {
    success: boolean;
    jobId?: string;
    followUpJobId?: string;
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

const DEFAULT_FOLLOWUP_SUBJECT = 'How are things going? 👋';
const DEFAULT_FOLLOWUP_HTML = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
  </style>
</head>
<body>
  <p>Hi {{firstName}},</p>
  <p>Just checking in to see if you've had a chance to browse our latest collection at {{storeName}}.</p>
  <p>Don't forget your 10% discount is still waiting for you!</p>
  <p style="text-align: center; margin: 30px 0;">
    <a href="{{shopUrl}}" class="cta">Visit Store</a>
  </p>
  <p style="font-size: 14px; color: #666;">
    <a href="{{unsubscribeUrl}}">Unsubscribe</a>
  </p>
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
                    isFollowUp: false,
                },
                jobOptions
            );

            const scheduledFor = delayMs > 0 ? new Date(Date.now() + delayMs) : undefined;
            let followUpJobId: string | undefined;

            // Queue Follow-Up (Drip)
            if (config?.enableFollowUp !== false) { // Default to true if undefined for now, or use config
                // For safety, let's strictly check config. In this case, I'll enable valid defaults.
                // P1 requirement: Welcome -> Day 3 follow up.
                const isFollowUpEnabled = config?.enableFollowUp ?? true; // Enable by default for growth

                if (isFollowUpEnabled) {
                    const followUpDelay = config?.followUpDelayMs || 259200000; // 3 days default
                    const followUpJob = await emailQueue.add(
                        'send-welcome-email',
                        {
                            subscriberId,
                            listId: subscriber.listId,
                            useAI: config?.useAI ?? false,
                            storeName: config?.storeName || 'Our Store',
                            isFollowUp: true,
                        },
                        { delay: followUpDelay }
                    );
                    followUpJobId = followUpJob.id;
                    logger.info('Follow-up email queued', { subscriberId, jobId: followUpJobId, delay: followUpDelay });
                }
            }

            logger.info('Welcome email queued', {
                subscriberId,
                jobId: job.id,
                delay: delayMs,
                scheduledFor
            });

            return {
                success: true,
                jobId: job.id,
                followUpJobId,
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
        options: { useAI?: boolean; storeName?: string; isFollowUp?: boolean }
    ): Promise<{ success: boolean; messageId?: string; error?: string }> {
        try {
            const subscriber = await prisma.subscriber.findUnique({
                where: { id: subscriberId },
                include: { list: true }
            });

            if (!subscriber) {
                throw new Error('Subscriber not found');
            }

            // Check if still subscribed before sending follow-up
            if (options.isFollowUp && subscriber.status !== SubscriberStatus.SUBSCRIBED) {
                logger.info('Skipping follow-up for unsubscribed user', { subscriberId });
                return { success: true, messageId: 'SKIPPED_UNSUBSCRIBED' };
            }

            const config = this.configs.get(subscriber.listId);

            let subject = options.isFollowUp ? DEFAULT_FOLLOWUP_SUBJECT : (config?.subject || DEFAULT_WELCOME_SUBJECT);
            let htmlBody = options.isFollowUp ? DEFAULT_FOLLOWUP_HTML : (config?.htmlTemplate || DEFAULT_WELCOME_HTML);

            // AI-enhanced personalization
            if (options.useAI) {
                try {
                    const promptType = options.isFollowUp ? 'follow-up' : 'welcome';
                    const prompt = options.isFollowUp
                        ? `Generate a friendly follow-up email for ${subscriber.firstName || 'subscriber'} 3 days after joining. Ask if they've seen the collection. Return JSON { "subject": "...", "body": "..." }`
                        : `Generate a warm welcome email for ${subscriber.firstName || 'new subscriber'} with a 10% discount. Return JSON { "subject": "...", "body": "..." }`;

                    const aiResult = await aiService.generateWithFallback({
                        prompt,
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
                logger.info(options.isFollowUp ? 'Follow-up email sent' : 'Welcome email sent', { subscriberId, messageId: result.messageId });
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
