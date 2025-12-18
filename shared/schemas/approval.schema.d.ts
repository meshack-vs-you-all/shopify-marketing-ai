import { z } from 'zod';
/**
 * Approval ID parameter schema
 */
export declare const approvalIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Approve request schema
 */
export declare const approveRequestSchema: z.ZodObject<{
    approvedBy: z.ZodString;
}, "strip", z.ZodTypeAny, {
    approvedBy: string;
}, {
    approvedBy: string;
}>;
/**
 * Reject request schema
 */
export declare const rejectRequestSchema: z.ZodObject<{
    rejectedBy: z.ZodString;
    reason: z.ZodString;
}, "strip", z.ZodTypeAny, {
    rejectedBy: string;
    reason: string;
}, {
    rejectedBy: string;
    reason: string;
}>;
//# sourceMappingURL=approval.schema.d.ts.map