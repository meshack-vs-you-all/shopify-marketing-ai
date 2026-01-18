/**
 * Unsubscribe Handler
 * 
 * Handles user unsubscribe requests (P0 compliance requirement)
 * Updates subscriber status to UNSUBSCRIBED
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

/**
 * GET /api/unsubscribe
 * Handles unsubscribe link clicks
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { id, signature } = req.query;

        if (!id || typeof id !== 'string') {
            return res.status(400).send('Invalid unsubscribe link');
        }

        // Ideally verify signature here, but for now trusting ID (P0 level)
        // Future P2: Add HMAC signature verification to unsubscribe links

        const subscriber = await prisma.subscriber.update({
            where: { id },
            data: { status: 'UNSUBSCRIBED' }
        });

        logger.info('Subscriber Unsubscribed', { subscriberId: id, email: subscriber.email });

        // Serve a simple confirmation page
        res.send(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Unsubscribed</title>
                <style>
                    body { font-family: -apple-system, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f9fafb; }
                    .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; }
                    h1 { color: #111827; margin-bottom: 10px; }
                    p { color: #6b7280; margin-bottom: 20px; }
                    .btn { display: inline-block; background: #e5e7eb; color: #374151; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: 500; }
                    .btn:hover { background: #d1d5db; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Unsubscribed</h1>
                    <p>You have been successfully removed from our mailing list.</p>
                    <p>We're sorry to see you go!</p>
                </div>
            </body>
            </html>
        `);

    } catch (error: any) {
        logger.error('Unsubscribe failed', { error: error.message });
        res.status(500).send('An error occurred while processing your request.');
    }
});

export default router;
