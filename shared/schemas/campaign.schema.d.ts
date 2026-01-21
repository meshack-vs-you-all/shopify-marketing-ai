import { z } from 'zod';
/**
 * Campaign creation schema
 */
export declare const createCampaignSchema: z.ZodObject<{
    platform: z.ZodEnum<["META", "GOOGLE_ADS", "EMAIL"]>;
    productIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    budget: z.ZodNumber;
    dailyBudget: z.ZodOptional<z.ZodNumber>;
    objective: z.ZodString;
    targetAudience: z.ZodOptional<z.ZodObject<{
        ageMin: z.ZodOptional<z.ZodNumber>;
        ageMax: z.ZodOptional<z.ZodNumber>;
        genders: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
        interests: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        locations: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        description: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description?: string | undefined;
        ageMin?: number | undefined;
        ageMax?: number | undefined;
        genders?: number[] | undefined;
        interests?: string[] | undefined;
        locations?: string[] | undefined;
    }, {
        description?: string | undefined;
        ageMin?: number | undefined;
        ageMax?: number | undefined;
        genders?: number[] | undefined;
        interests?: string[] | undefined;
        locations?: string[] | undefined;
    }>>;
    autoApprove: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    platform: "META" | "GOOGLE_ADS" | "EMAIL";
    budget: number;
    objective: string;
    autoApprove: boolean;
    dailyBudget?: number | undefined;
    targetAudience?: {
        description?: string | undefined;
        ageMin?: number | undefined;
        ageMax?: number | undefined;
        genders?: number[] | undefined;
        interests?: string[] | undefined;
        locations?: string[] | undefined;
    } | undefined;
    productIds?: string[] | undefined;
}, {
    platform: "META" | "GOOGLE_ADS" | "EMAIL";
    budget: number;
    objective: string;
    dailyBudget?: number | undefined;
    targetAudience?: {
        description?: string | undefined;
        ageMin?: number | undefined;
        ageMax?: number | undefined;
        genders?: number[] | undefined;
        interests?: string[] | undefined;
        locations?: string[] | undefined;
    } | undefined;
    productIds?: string[] | undefined;
    autoApprove?: boolean | undefined;
}>;
/**
 * Campaign update schema
 */
export declare const updateCampaignSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING", "ACTIVE", "PAUSED", "ARCHIVED"]>>;
    budget: z.ZodOptional<z.ZodNumber>;
    dailyBudget: z.ZodOptional<z.ZodNumber>;
    objective: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED" | undefined;
    name?: string | undefined;
    budget?: number | undefined;
    dailyBudget?: number | undefined;
    objective?: string | undefined;
}, {
    status?: "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED" | undefined;
    name?: string | undefined;
    budget?: number | undefined;
    dailyBudget?: number | undefined;
    objective?: string | undefined;
}>;
/**
 * Campaign ID parameter schema
 */
export declare const campaignIdSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
/**
 * Approval request schema
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
/**
 * Campaign query parameters schema
 */
export declare const campaignQuerySchema: z.ZodObject<{
    platform: z.ZodOptional<z.ZodEnum<["META", "GOOGLE_ADS", "EMAIL"]>>;
    status: z.ZodOptional<z.ZodEnum<["DRAFT", "PENDING", "ACTIVE", "PAUSED", "ARCHIVED"]>>;
    limit: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodNumber>>, number, unknown>;
    offset: z.ZodEffects<z.ZodDefault<z.ZodOptional<z.ZodNumber>>, number, unknown>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED" | undefined;
    platform?: "META" | "GOOGLE_ADS" | "EMAIL" | undefined;
}, {
    limit?: unknown;
    status?: "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "ARCHIVED" | undefined;
    platform?: "META" | "GOOGLE_ADS" | "EMAIL" | undefined;
    offset?: unknown;
}>;
//# sourceMappingURL=campaign.schema.d.ts.map