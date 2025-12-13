import { z } from 'zod';

/**
 * Approval ID parameter schema
 */
export const approvalIdSchema = z.object({
  id: z.string().min(1, 'Approval ID is required'),
});

/**
 * Approve request schema
 */
export const approveRequestSchema = z.object({
  approvedBy: z.string().min(1, 'Approved by is required'),
});

/**
 * Reject request schema
 */
export const rejectRequestSchema = z.object({
  rejectedBy: z.string().min(1, 'Rejected by is required'),
  reason: z.string().min(1, 'Rejection reason is required'),
});

