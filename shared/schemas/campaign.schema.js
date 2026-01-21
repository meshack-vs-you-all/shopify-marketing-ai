"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.campaignQuerySchema = exports.rejectRequestSchema = exports.approveRequestSchema = exports.campaignIdSchema = exports.updateCampaignSchema = exports.createCampaignSchema = void 0;
const zod_1 = require("zod");
/**
 * Campaign creation schema
 */
exports.createCampaignSchema = zod_1.z.object({
    platform: zod_1.z.enum(['META', 'GOOGLE_ADS', 'EMAIL'], {
        errorMap: () => ({ message: 'Platform must be META, GOOGLE_ADS, or EMAIL' }),
    }),
    productIds: zod_1.z.array(zod_1.z.string()).optional(),
    budget: zod_1.z.number().positive('Budget must be a positive number'),
    dailyBudget: zod_1.z.number().positive('Daily budget must be a positive number').optional(),
    objective: zod_1.z.string().min(1, 'Objective is required'),
    targetAudience: zod_1.z.object({
        ageMin: zod_1.z.number().int().min(18).max(65).optional(),
        ageMax: zod_1.z.number().int().min(18).max(65).optional(),
        genders: zod_1.z.array(zod_1.z.number().int()).optional(),
        interests: zod_1.z.array(zod_1.z.string()).optional(),
        locations: zod_1.z.array(zod_1.z.string()).optional(),
        description: zod_1.z.string().optional(),
    }).optional(),
    autoApprove: zod_1.z.boolean().optional().default(false),
});
/**
 * Campaign update schema
 */
exports.updateCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    status: zod_1.z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
    budget: zod_1.z.number().positive().optional(),
    dailyBudget: zod_1.z.number().positive().optional(),
    objective: zod_1.z.string().min(1).optional(),
});
/**
 * Campaign ID parameter schema
 */
exports.campaignIdSchema = zod_1.z.object({
    id: zod_1.z.string().min(1, 'Campaign ID is required'),
});
/**
 * Approval request schema
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
/**
 * Campaign query parameters schema
 */
exports.campaignQuerySchema = zod_1.z.object({
    platform: zod_1.z.enum(['META', 'GOOGLE_ADS', 'EMAIL']).optional(),
    status: zod_1.z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'PAUSED', 'ARCHIVED']).optional(),
    limit: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().positive().max(100).optional().default(50)),
    offset: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().nonnegative().optional().default(0)),
});
//# sourceMappingURL=campaign.schema.js.map