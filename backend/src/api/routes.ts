import { Router } from 'express';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import campaignsRoutes from './campaigns.routes';
import approvalsRoutes from './approvals.routes';
import emailCampaignsRoutes from './email-campaigns.routes';
import campaignWizardRoutes from './campaigns.wizard.routes';
import aiRoutes from './ai.routes';

import authRoutes from './auth.routes';

import settingsRoutes from './settings.routes';
import shopifyRoutes from './shopify.routes';
import promptTemplatesRoutes from './prompt-templates.routes';
import accountRoutes from './account.routes';
import shopifyWebhooksRoutes from './shopify-webhooks.routes';
import metaPublishingRoutes from './meta-publishing.routes';

import unsubscribeRoutes from './unsubscribe.routes';
import blogRoutes from './blog.routes';

const router: Router = Router();

// Health check (no authentication required)
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'shopify-marketing-ai-api' });
});

// Auth Routes (Public)
router.use('/auth', authRoutes);

// Unsubscribe (Public)
router.use('/unsubscribe', unsubscribeRoutes);

// Blog Routes (Public Reads / Protected Writes)
router.use('/blog', blogRoutes);

// AI Routes (protected)
// AI Routes (temporarily public for testing)
router.use('/ai', aiRoutes);

// Shopify Webhooks (Public, but HMAC verified)
router.use('/webhooks/shopify', shopifyWebhooksRoutes);

// Protected Routes
router.use('/campaigns', authenticate, campaignsRoutes);
router.use('/email-campaigns', authenticate, emailCampaignsRoutes);
router.use('/campaigns/wizard', authenticate, campaignWizardRoutes);
router.use('/approvals', authenticate, approvalsRoutes);
router.use('/settings', authenticate, settingsRoutes);
router.use('/shopify', shopifyRoutes);
router.use('/prompt-templates', authenticate, promptTemplatesRoutes);
router.use('/account', accountRoutes); // Auth handled internally per route
router.use('/meta', authenticate, metaPublishingRoutes); // Meta Publishing routes

// Analytics endpoint (placeholder)
router.get('/analytics', async (req, res) => {
  res.json({ message: 'Analytics endpoint - coming soon' });
});

export default router;


