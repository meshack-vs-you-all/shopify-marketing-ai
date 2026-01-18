/**
 * Account Management API Routes
 * 
 * Handles account deletion for GDPR compliance (B4 requirement)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * DELETE /api/account
 * Delete user account and all associated data (GDPR compliance)
 */
router.delete('/', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        logger.info('Starting account deletion', { userId, email: user.email });

        // Delete in order (respecting foreign key constraints):
        // 1. AI Usage Logs (if userId tracked)
        await prisma.aIUsageLog.deleteMany({
            where: { userId },
        });

        // 2. Audit Logs
        await prisma.auditLog.deleteMany({
            where: { userId },
        });

        // 3. Approvals (requestedBy)
        await prisma.approval.updateMany({
            where: { requestedBy: userId },
            data: { requestedBy: null },
        });

        await prisma.approval.updateMany({
            where: { approvedBy: userId },
            data: { approvedBy: null },
        });

        // 4. Delete the user
        await prisma.user.delete({
            where: { id: userId },
        });

        logger.info('Account deleted successfully', { userId });

        res.json({
            success: true,
            message: 'Account and all associated data have been permanently deleted',
            deletedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error('Failed to delete account', { error: error.message });
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

/**
 * GET /api/account/data
 * Export user data (GDPR data portability)
 */
router.get('/data', authenticate, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                // Exclude sensitive fields like passwordHash, googleId
            },
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get related data
        const auditLogs = await prisma.auditLog.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });

        const aiUsage = await prisma.aIUsageLog.findMany({
            where: { userId },
            orderBy: { timestamp: 'desc' },
            take: 100,
        });

        res.json({
            user,
            auditLogs,
            aiUsage,
            exportedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        logger.error('Failed to export account data', { error: error.message });
        res.status(500).json({ error: 'Failed to export data' });
    }
});

export default router;
