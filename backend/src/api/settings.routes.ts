import { Router } from 'express';
import { metaService } from '../services/meta.service';
import { emailService } from '../services/email.service';
import { logger } from '../utils/logger';

const router: Router = Router();

/**
 * GET /api/settings/integrations
 * Check status of all third-party integrations (Meta, Email, Shopify)
 */
router.get('/integrations', async (req, res) => {
    try {
        // 1. Meta Ads Status
        const metaConnected = await metaService.testConnection();
        const metaStatus = {
            connected: metaConnected,
            accountId: process.env.META_AD_ACCOUNT_ID || null,
            message: metaConnected ? 'Active' : 'Invalid Access Token or Network Error'
        };

        // 2. Email Service Status
        const emailConnection = await emailService.verifyConnection();
        const emailStatus = {
            ses: {
                connected: emailConnection.ses,
                region: process.env.AWS_REGION || 'us-east-1',
                sendingDomain: process.env.SES_FROM_EMAIL ? process.env.SES_FROM_EMAIL.split('@')[1] : null,
                identity: process.env.SES_FROM_EMAIL || null
            },
            smtp: {
                connected: emailConnection.smtp,
                host: process.env.SMTP_HOST || null
            }
        };

        // 3. Shopify Status (Environment Check)
        const shopifyStatus = {
            connected: !!(process.env.SHOPIFY_ACCESS_TOKEN && process.env.SHOPIFY_STORE_URL),
            shopUrl: process.env.SHOPIFY_STORE_URL || null
        };

        // 4. Google Ads (Placeholder)
        const googleStatus = {
            connected: false, // Not implemented yet
            message: 'Not configured'
        };

        res.json({
            meta: metaStatus,
            email: emailStatus,
            shopify: shopifyStatus,
            google: googleStatus
        });

    } catch (error: any) {
        logger.error('Error fetching integration status', error);
        res.status(500).json({ error: 'Failed to fetch integration status' });
    }
});

/**
 * GET /api/settings/system
 * Get system environment information
 */
router.get('/system', (req, res) => {
    res.json({
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0', // Could pull from package.json
        nodeVersion: process.version,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        serverTime: new Date().toISOString()
    });
});

export default router;
