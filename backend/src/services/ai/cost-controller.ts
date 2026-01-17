/**
 * Cost Controller
 * 
 * Manages AI usage budgets, tracks spending, and enforces limits.
 * Provides model downgrade logic when budget is exceeded.
 */

import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

export interface CostLimits {
    dailyLimit: number;       // $ per day
    monthlyLimit: number;     // $ per month
    perRequestLimit: number;  // $ per single request
    warningThreshold: number; // % of limit to trigger warning (e.g., 0.8)
}

export interface UsageRecord {
    model: string;
    taskType: string;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    timestamp: Date;
    requestId?: string;
}

export interface BudgetStatus {
    allowed: boolean;
    dailyUsed: number;
    dailyRemaining: number;
    monthlyUsed: number;
    monthlyRemaining: number;
    warning?: string;
}

export interface UsageSummary {
    daily: number;
    monthly: number;
    byModel: Record<string, number>;
    byTaskType: Record<string, number>;
}

const DEFAULT_LIMITS: CostLimits = {
    dailyLimit: 50,
    monthlyLimit: 500,
    perRequestLimit: 1,
    warningThreshold: 0.8,
};

export class CostController {
    private limits: CostLimits = DEFAULT_LIMITS;

    constructor(customLimits?: Partial<CostLimits>) {
        if (customLimits) {
            this.limits = { ...DEFAULT_LIMITS, ...customLimits };
        }
    }

    /**
     * Update cost limits
     */
    async updateLimits(newLimits: Partial<CostLimits>): Promise<void> {
        this.limits = { ...this.limits, ...newLimits };

        // Persist to database settings if available
        try {
            await prisma.aISettings.upsert({
                where: { id: 'default' },
                update: {
                    dailyBudgetLimit: newLimits.dailyLimit ?? this.limits.dailyLimit,
                    monthlyBudgetLimit: newLimits.monthlyLimit ?? this.limits.monthlyLimit,
                    perRequestLimit: newLimits.perRequestLimit ?? this.limits.perRequestLimit,
                },
                create: {
                    id: 'default',
                    dailyBudgetLimit: this.limits.dailyLimit,
                    monthlyBudgetLimit: this.limits.monthlyLimit,
                    perRequestLimit: this.limits.perRequestLimit,
                },
            });
        } catch (error) {
            // AISettings table might not exist yet during migration
            logger.debug('Could not persist cost limits to database', { error });
        }
    }

    /**
     * Load limits from database settings
     */
    async loadLimits(): Promise<void> {
        try {
            const settings = await prisma.aISettings.findUnique({
                where: { id: 'default' },
            });

            if (settings) {
                this.limits = {
                    dailyLimit: Number(settings.dailyBudgetLimit),
                    monthlyLimit: Number(settings.monthlyBudgetLimit),
                    perRequestLimit: Number(settings.perRequestLimit),
                    warningThreshold: this.limits.warningThreshold,
                };
            }
        } catch (error) {
            // Table might not exist yet
            logger.debug('Could not load cost limits from database', { error });
        }
    }

    /**
     * Check if budget allows for a new request
     */
    async checkBudget(): Promise<BudgetStatus> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        const dailyUsed = await this.getDailyUsage(today);
        const monthlyUsed = await this.getMonthlyUsage(monthStart);

        const dailyRemaining = Math.max(0, this.limits.dailyLimit - dailyUsed);
        const monthlyRemaining = Math.max(0, this.limits.monthlyLimit - monthlyUsed);
        const remaining = Math.min(dailyRemaining, monthlyRemaining);

        let warning: string | undefined;

        if (dailyUsed >= this.limits.dailyLimit) {
            warning = 'Daily budget exhausted';
        } else if (monthlyUsed >= this.limits.monthlyLimit) {
            warning = 'Monthly budget exhausted';
        } else if (dailyUsed >= this.limits.dailyLimit * this.limits.warningThreshold) {
            warning = `Daily budget ${(dailyUsed / this.limits.dailyLimit * 100).toFixed(0)}% consumed`;
        } else if (monthlyUsed >= this.limits.monthlyLimit * this.limits.warningThreshold) {
            warning = `Monthly budget ${(monthlyUsed / this.limits.monthlyLimit * 100).toFixed(0)}% consumed`;
        }

        return {
            allowed: remaining > 0,
            dailyUsed,
            dailyRemaining,
            monthlyUsed,
            monthlyRemaining,
            warning,
        };
    }

    /**
     * Check if a specific request cost is within limits
     */
    async canAffordRequest(estimatedCost: number): Promise<{ allowed: boolean; reason?: string }> {
        if (estimatedCost > this.limits.perRequestLimit) {
            return {
                allowed: false,
                reason: `Estimated cost $${estimatedCost.toFixed(4)} exceeds per-request limit $${this.limits.perRequestLimit}`,
            };
        }

        const budget = await this.checkBudget();

        if (!budget.allowed) {
            return {
                allowed: false,
                reason: budget.warning || 'Budget exceeded',
            };
        }

        if (estimatedCost > Math.min(budget.dailyRemaining, budget.monthlyRemaining)) {
            return {
                allowed: false,
                reason: `Estimated cost $${estimatedCost.toFixed(4)} exceeds remaining budget`,
            };
        }

        return { allowed: true };
    }

    /**
     * Record usage after a successful generation
     */
    async recordUsage(record: UsageRecord): Promise<void> {
        try {
            await prisma.aIUsageLog.create({
                data: {
                    model: record.model,
                    taskType: record.taskType,
                    promptTokens: record.promptTokens,
                    completionTokens: record.completionTokens,
                    cost: record.cost,
                    timestamp: record.timestamp,
                },
            });

            logger.debug('Recorded AI usage', {
                model: record.model,
                cost: record.cost,
                taskType: record.taskType,
            });
        } catch (error) {
            // Don't fail the request if logging fails
            logger.error('Failed to record AI usage', { error, record });
        }
    }

    /**
     * Get usage summary for dashboard
     */
    async getUsageSummary(): Promise<UsageSummary> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

        try {
            const [daily, monthly, byModel, byTaskType] = await Promise.all([
                this.getDailyUsage(today),
                this.getMonthlyUsage(monthStart),
                this.getUsageByModel(monthStart),
                this.getUsageByTaskType(monthStart),
            ]);

            return { daily, monthly, byModel, byTaskType };
        } catch (error) {
            logger.error('Failed to get usage summary', { error });
            return { daily: 0, monthly: 0, byModel: {}, byTaskType: {} };
        }
    }

    /**
     * Get current limits
     */
    getLimits(): CostLimits {
        return { ...this.limits };
    }

    /**
     * Helper: Get total daily usage
     */
    private async getDailyUsage(date: Date): Promise<number> {
        try {
            const result = await prisma.aIUsageLog.aggregate({
                _sum: { cost: true },
                where: { timestamp: { gte: date } },
            });
            return Number(result._sum.cost) || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Helper: Get total monthly usage
     */
    private async getMonthlyUsage(monthStart: Date): Promise<number> {
        try {
            const result = await prisma.aIUsageLog.aggregate({
                _sum: { cost: true },
                where: { timestamp: { gte: monthStart } },
            });
            return Number(result._sum.cost) || 0;
        } catch (error) {
            return 0;
        }
    }

    /**
     * Helper: Get usage grouped by model
     */
    private async getUsageByModel(since: Date): Promise<Record<string, number>> {
        try {
            const results = await prisma.aIUsageLog.groupBy({
                by: ['model'],
                _sum: { cost: true },
                where: { timestamp: { gte: since } },
            });

            return results.reduce((acc, r) => {
                acc[r.model] = Number(r._sum.cost) || 0;
                return acc;
            }, {} as Record<string, number>);
        } catch (error) {
            return {};
        }
    }

    /**
     * Helper: Get usage grouped by task type
     */
    private async getUsageByTaskType(since: Date): Promise<Record<string, number>> {
        try {
            const results = await prisma.aIUsageLog.groupBy({
                by: ['taskType'],
                _sum: { cost: true },
                where: { timestamp: { gte: since } },
            });

            return results.reduce((acc, r) => {
                acc[r.taskType] = Number(r._sum.cost) || 0;
                return acc;
            }, {} as Record<string, number>);
        } catch (error) {
            return {};
        }
    }
}

// Default singleton instance
export const costController = new CostController();
