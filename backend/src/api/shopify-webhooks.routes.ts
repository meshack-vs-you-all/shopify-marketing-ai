/**
 * Shopify Webhook Handlers
 * 
 * Handles Shopify webhooks for transactional emails (A5 requirement)
 */

import { Router, Request, Response } from 'express';
import { logger } from '../utils/logger';
import { emailQueue } from '../workers/queues';
import crypto from 'crypto';

const router = Router();

// Shopify webhook secret for HMAC verification
const SHOPIFY_WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || '';

// Webhook topics to register
export const REQUIRED_WEBHOOKS = [
    'orders/create',
    'orders/fulfilled',
    'checkouts/create',
    'checkouts/update',
    'customers/create',
    'customers/update',
    'products/create',
    'products/update',
    'products/delete',
    'shop/update',
    'app/uninstalled',
    'refunds/create'
];

/**
 * Verify Shopify webhook HMAC signature
 */
function verifyShopifyWebhook(req: Request): boolean {
    if (!SHOPIFY_WEBHOOK_SECRET) {
        logger.warn('SHOPIFY_WEBHOOK_SECRET not set, skipping verification');
        return true; // Allow in development
    }

    const hmacHeader = req.get('X-Shopify-Hmac-Sha256');
    if (!hmacHeader) {
        return false;
    }

    const body = (req as any).rawBody || JSON.stringify(req.body);
    const hash = crypto
        .createHmac('sha256', SHOPIFY_WEBHOOK_SECRET)
        .update(body, 'utf8')
        .digest('base64');

    return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmacHeader));
}

/**
 * POST /api/webhooks/shopify/orders/create
 * Triggered when a new order is created
 */
router.post('/orders/create', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) {
            logger.warn('Invalid Shopify webhook signature');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const order = req.body;
        logger.info('Received order created webhook', {
            orderId: order.id,
            email: order.email,
            totalPrice: order.total_price,
        });

        // Queue order confirmation email
        if (order.email) {
            await emailQueue.add('send-transactional-email', {
                type: 'order_confirmation',
                to: order.email,
                data: {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
                    totalPrice: order.total_price,
                    currency: order.currency,
                    lineItems: order.line_items?.map((item: any) => ({
                        title: item.title,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            });

            logger.info('Order confirmation email queued', { orderId: order.id, email: order.email });
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing order created webhook', { error: error.message });
        // Return 200 to prevent Shopify retries for processing errors
        res.status(200).json({ received: true, error: error.message });
    }
});

/**
 * POST /api/webhooks/shopify/orders/fulfilled
 * Triggered when an order is fulfilled
 */
router.post('/orders/fulfilled', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const order = req.body;
        logger.info('Received order fulfilled webhook', { orderId: order.id });

        if (order.email) {
            await emailQueue.add('send-transactional-email', {
                type: 'order_shipped',
                to: order.email,
                data: {
                    orderId: order.id,
                    orderNumber: order.order_number,
                    customerName: `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim(),
                    trackingNumber: order.fulfillments?.[0]?.tracking_number,
                    trackingUrl: order.fulfillments?.[0]?.tracking_url,
                    carrier: order.fulfillments?.[0]?.tracking_company,
                },
            });

            logger.info('Shipping notification email queued', { orderId: order.id });
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing order fulfilled webhook', { error: error.message });
        res.status(200).json({ received: true, error: error.message });
    }
});

/**
 * POST /api/webhooks/shopify/checkouts/create
 * Triggered when a checkout is created (for abandoned cart emails)
 */
router.post('/checkouts/create', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const checkout = req.body;
        logger.info('Received checkout created webhook', {
            checkoutId: checkout.id,
            email: checkout.email,
        });

        // Queue abandoned cart email with delay (e.g., 1 hour)
        if (checkout.email && !checkout.completed_at) {
            const ABANDONED_CART_DELAY = parseInt(process.env.ABANDONED_CART_DELAY_MS || '3600000'); // 1 hour default

            await emailQueue.add(
                'send-transactional-email',
                {
                    type: 'abandoned_cart',
                    to: checkout.email,
                    checkoutId: checkout.id,
                    data: {
                        checkoutUrl: checkout.abandoned_checkout_url,
                        customerName: `${checkout.billing_address?.first_name || ''}`.trim(),
                        lineItems: checkout.line_items?.map((item: any) => ({
                            title: item.title,
                            quantity: item.quantity,
                            price: item.price,
                            imageUrl: item.image_url,
                        })),
                        subtotal: checkout.subtotal_price,
                    },
                },
                { delay: ABANDONED_CART_DELAY }
            );

            logger.info('Abandoned cart email queued', {
                checkoutId: checkout.id,
                delayMs: ABANDONED_CART_DELAY,
            });
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing checkout webhook', { error: error.message });
        res.status(200).json({ received: true, error: error.message });
    }
});

/**
 * POST /api/webhooks/shopify/customers/create
 * Triggered when a new customer is created
 */
router.post('/customers/create', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const customer = req.body;
        logger.info('Received customer created webhook', {
            customerId: customer.id,
            email: customer.email,
        });

        // Queue welcome email if customer has email and accepts marketing
        if (customer.email && customer.accepts_marketing) {
            await emailQueue.add('send-transactional-email', {
                type: 'shopify_welcome',
                to: customer.email,
                data: {
                    customerId: customer.id,
                    firstName: customer.first_name,
                    lastName: customer.last_name,
                },
            });

            logger.info('Shopify customer welcome email queued', { customerId: customer.id });
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing customer webhook', { error: error.message });
        res.status(200).json({ received: true, error: error.message });
    }
});

/**
 * POST /api/webhooks/shopify/products/create
 * Triggered when a new product is created
 */
router.post('/products/create', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const product = req.body;
        logger.info('Received product created webhook', {
            productId: product.id,
            title: product.title,
        });

        // Trigger any automation for new products (e.g. generate draft campaign)
        // For now, we just log it as ready for future implementation
        logger.info('New product detected - ready for campaign automation', {
            productId: product.id,
            title: product.title,
            handle: product.handle
        });

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing product create webhook', { error: error.message });
        res.status(200).json({ received: true, error: error.message });
    }
});

/**
 * POST /api/webhooks/shopify/products/update
 * Triggered when a product is updated (e.g. price drop)
 */
router.post('/products/update', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const product = req.body;
        logger.info('Received product update webhook', {
            productId: product.id,
            title: product.title,
        });

        // Check for price drops or inventory changes here
        // Future implementation: Logic to detect price drop > 10% and trigger alert

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing product update webhook', { error: error.message });
        res.status(200).json({ received: true, error: error.message });
    }
});

/**
 * POST /api/webhooks/shopify/customers/update
 * Triggered when customer data changes
 */
router.post('/customers/update', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

        const customer = req.body;
        logger.info('Received customer update webhook', { id: customer.id, email: customer.email });

        // Compliance: Handle marketing opt-out
        // If customer exists in our DB and has revoked consent in Shopify, we must unsubscribe them
        if (customer.email && !customer.accepts_marketing) {
            // TODO: Update local DB subscriber status to UNSUBSCRIBED
            // await prisma.subscriber.updateMany({
            //   where: { email: customer.email },
            //   data: { status: 'UNSUBSCRIBED' }
            // });
            logger.info('Customer opted out of marketing in Shopify - sync required', { email: customer.email });
        }

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing customer update', { error: error.message });
        res.status(200).json({ received: true });
    }
});

/**
 * POST /api/webhooks/shopify/customers/redact
 * Mandatory GDPR endpoint
 */
router.post('/customers/redact', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

        const payload = req.body;
        logger.info('Received customer redact request (GDPR)', {
            shop_domain: payload.shop_domain,
            customer: payload.customer
        });

        // 1. Erase PII for this customer from DB
        // 2. Remove from mailing lists
        // await prisma.subscriber.deleteMany({ where: { email: payload.customer.email } });

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing customer redact', { error: error.message });
        res.status(200).json({ received: true });
    }
});

/**
 * POST /api/webhooks/shopify/shop/update
 * Keep store settings in sync
 */
router.post('/shop/update', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

        const shop = req.body;
        logger.info('Received shop update webhook', { domain: shop.domain });

        // Update local store configuration if needed
        // e.g. currency, timezone, contact email

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing shop update', { error: error.message });
        res.status(200).json({ received: true });
    }
});

/**
 * POST /api/webhooks/shopify/app/uninstalled
 * Mandatory cleanup hook
 */
router.post('/app/uninstalled', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

        const payload = req.body;
        logger.warn('App uninstalled by shop', { domain: payload.domain });

        // 1. Mark store as inactive
        // 2. Cancel all pending jobs for this store
        // 3. Clear sensitive tokens

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing app uninstall', { error: error.message });
        res.status(200).json({ received: true });
    }
});

/**
 * POST /api/webhooks/shopify/checkouts/update
 * Restart abandoned cart timer
 */
router.post('/checkouts/update', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

        const checkout = req.body;
        // Logic: Cancel existing 'abandoned_cart' job for this checkout ID if exists,
        // then schedule a new one? Or relies on the worker to check 'updated_at'?
        // For now, simpler to just log support.
        logger.info('Received checkout update - activity detected', { id: checkout.id });

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing checkout update', { error: error.message });
        res.status(200).json({ received: true });
    }
});

/**
 * POST /api/webhooks/shopify/products/delete
 * Catalog hygiene
 */
router.post('/products/delete', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

        const payload = req.body;
        logger.info('Product deleted', { id: payload.id });

        // Remove from any active campaigns or recommendations

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing product delete', { error: error.message });
        res.status(200).json({ received: true });
    }
});

/**
 * POST /api/webhooks/shopify/refunds/create
 * Post-purchase care
 */
router.post('/refunds/create', async (req: Request, res: Response) => {
    try {
        if (!verifyShopifyWebhook(req)) return res.status(401).json({ error: 'Unauthorized' });

        const refund = req.body;
        logger.info('Refund created', { order_id: refund.order_id, refund_id: refund.id });

        // Trigger "Refund Processed" email if configured

        res.status(200).json({ received: true });
    } catch (error: any) {
        logger.error('Error processing refund create', { error: error.message });
        res.status(200).json({ received: true });
    }
});

export default router;
