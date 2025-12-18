"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rejectRequestSchema = exports.approveRequestSchema = exports.approvalIdSchema = void 0;
const zod_1 = require("zod");
/**
 * Approval ID parameter schema
 */
exports.approvalIdSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Approval ID is required'),
});
/**
 * Approve request schema
 */
exports.approveRequestSchema = zod_1.z.object({
    approvedBy: zod_1.z.string().min(1, 'Approved by is required'),
});
/**
 * Reject request schema
 */
exports.rejectRequestSchema = zod_1.z.object({
    rejectedBy: zod_1.z.string().min(1, 'Rejected by is required'),
    reason: zod_1.z.string().min(1, 'Rejection reason is required'),
});
//# sourceMappingURL=approval.schema.js.map