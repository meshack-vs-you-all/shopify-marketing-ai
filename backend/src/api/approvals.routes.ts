import { Router } from 'express';
import { approvalService } from '../services/approval.service';
import { AppError } from '../middleware/errorHandler';

const router = Router();

/**
 * GET /api/approvals
 * Get all pending approvals
 */
router.get('/', async (req, res, next) => {
  try {
    const approvals = await approvalService.getPendingApprovals();
    res.json({ approvals });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/approvals/:id/approve
 * Approve a request
 */
router.post('/:id/approve', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approvedBy } = req.body;

    if (!approvedBy) {
      throw new AppError('approvedBy is required', 400);
    }

    const approval = await approvalService.approve(id, approvedBy);
    res.json({ approval, message: 'Request approved successfully' });
  } catch (error: any) {
    next(error);
  }
});

/**
 * POST /api/approvals/:id/reject
 * Reject a request
 */
router.post('/:id/reject', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectedBy, reason } = req.body;

    if (!rejectedBy || !reason) {
      throw new AppError('rejectedBy and reason are required', 400);
    }

    const approval = await approvalService.reject(id, rejectedBy, reason);
    res.json({ approval, message: 'Request rejected' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

