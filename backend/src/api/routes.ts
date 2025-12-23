import { Router } from 'express';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import campaignsRoutes from './campaigns.routes';
import approvalsRoutes from './approvals.routes';
import emailCampaignsRoutes from './email-campaigns.routes';
import campaignWizardRoutes from './campaigns.wizard.routes';

import authRoutes from './auth.routes';

const router = Router();

// Health check (no authentication required)
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'shopify-marketing-ai-api' });
});

// Auth Routes (Public)
router.use('/auth', authRoutes);

// Protected Routes
router.use('/campaigns', authenticate, campaignsRoutes);
router.use('/email-campaigns', authenticate, emailCampaignsRoutes);
router.use('/campaigns/wizard', authenticate, campaignWizardRoutes);
router.use('/approvals', authenticate, approvalsRoutes);

// Analytics endpoint (placeholder)
router.get('/analytics', async (req, res) => {
  res.json({ message: 'Analytics endpoint - coming soon' });
});

export default router;

