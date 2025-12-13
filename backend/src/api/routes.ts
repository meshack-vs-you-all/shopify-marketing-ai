import { Router } from 'express';
import { logger } from '../utils/logger';
import campaignsRoutes from './campaigns.routes';
import approvalsRoutes from './approvals.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'shopify-marketing-ai-api' });
});

// API routes
router.use('/campaigns', campaignsRoutes);
router.use('/approvals', approvalsRoutes);

// Analytics endpoint (placeholder)
router.get('/analytics', async (req, res) => {
  res.json({ message: 'Analytics endpoint - coming soon' });
});

export default router;

