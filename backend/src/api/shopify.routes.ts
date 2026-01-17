/**
 * Shopify Routes
 * 
 * API endpoints for Shopify store data access.
 * Used by AI Studio to fetch products for newsletter generation.
 */

import { Router, Request, Response } from 'express';
import { shopifyService } from '../services/shopify.service';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/shopify/products
 * Fetch products for AI Studio product selector
 */
router.get('/products', async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 50;
        const products = await shopifyService.getProducts(limit);

        res.json({
            products,
            count: products.length,
            useMockData: shopifyService.isUsingMockData(),
        });
    } catch (error: any) {
        logger.error('Failed to fetch products', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

/**
 * GET /api/shopify/products/:id
 * Fetch a single product by ID
 */
router.get('/products/:id', async (req: Request, res: Response) => {
    try {
        const product = await shopifyService.getProduct(req.params.id);
        res.json({ product });
    } catch (error: any) {
        logger.error('Failed to fetch product', { error: error.message, id: req.params.id });
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

/**
 * GET /api/shopify/collections
 * Fetch all collections
 */
router.get('/collections', async (req: Request, res: Response) => {
    try {
        const collections = await shopifyService.getCollections();
        res.json({
            collections,
            count: collections.length,
            useMockData: shopifyService.isUsingMockData(),
        });
    } catch (error: any) {
        logger.error('Failed to fetch collections', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch collections' });
    }
});

/**
 * GET /api/shopify/analytics
 * Fetch store analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
    try {
        const analytics = await shopifyService.getStoreAnalytics();
        res.json(analytics);
    } catch (error: any) {
        logger.error('Failed to fetch analytics', { error: error.message });
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

/**
 * GET /api/shopify/status
 * Check Shopify connection status
 */
router.get('/status', async (req: Request, res: Response) => {
    try {
        const status = await shopifyService.testConnection();
        res.json(status);
    } catch (error: any) {
        logger.error('Failed to check Shopify status', { error: error.message });
        res.status(500).json({ error: 'Failed to check status' });
    }
});

export default router;
