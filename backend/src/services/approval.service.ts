import { prisma } from '../config/database';
import { ApprovalStatus, ApprovalType } from '@prisma/client';
import { logger } from '../utils/logger';
import { campaignService } from './campaign.service';

/**
 * Approval Workflow Service
 * Manages human-in-the-loop approval workflows
 */
class ApprovalService {
  /**
   * Get pending approvals
   */
  async getPendingApprovals(): Promise<any[]> {
    return await prisma.approval.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: { campaign: true },
      orderBy: { requestedAt: 'desc' },
    });
  }

  /**
   * Approve a request
   */
  async approve(approvalId: string, approvedBy: string): Promise<any> {
    try {
      const approval = await prisma.approval.findUnique({
        where: { id: approvalId },
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      if (approval.status !== ApprovalStatus.PENDING) {
        throw new Error(`Approval is already ${approval.status}`);
      }

      // Update approval
      const updated = await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.APPROVED,
          approvedBy,
          approvedAt: new Date(),
        },
      });

      // Execute the approved action
      await this.executeApprovedAction(approval);

      logger.info('Approval granted', { approvalId, type: approval.type });

      return updated;
    } catch (error: any) {
      logger.error('Error approving request', { error: error.message, approvalId });
      throw error;
    }
  }

  /**
   * Reject a request
   */
  async reject(approvalId: string, rejectedBy: string, reason: string): Promise<any> {
    try {
      const approval = await prisma.approval.findUnique({
        where: { id: approvalId },
      });

      if (!approval) {
        throw new Error('Approval not found');
      }

      if (approval.status !== ApprovalStatus.PENDING) {
        throw new Error(`Approval is already ${approval.status}`);
      }

      const updated = await prisma.approval.update({
        where: { id: approvalId },
        data: {
          status: ApprovalStatus.REJECTED,
          rejectedBy,
          rejectedAt: new Date(),
          rejectionReason: reason,
        },
      });

      logger.info('Approval rejected', { approvalId, reason });

      return updated;
    } catch (error: any) {
      logger.error('Error rejecting request', { error: error.message, approvalId });
      throw error;
    }
  }

  /**
   * Execute the action after approval
   */
  private async executeApprovedAction(approval: any): Promise<void> {
    const requestData = approval.requestData as any;

    switch (approval.type) {
      case ApprovalType.CAMPAIGN_CREATION:
        if (approval.campaignId) {
          await campaignService.deployCampaign(approval.campaignId);
        }
        break;

      case ApprovalType.BUDGET_INCREASE:
        // TODO: Implement budget increase
        logger.info('Budget increase approved', { approvalId: approval.id });
        break;

      case ApprovalType.CAMPAIGN_PAUSE:
        // TODO: Implement campaign pause
        logger.info('Campaign pause approved', { approvalId: approval.id });
        break;

      default:
        logger.warn('Unknown approval type', { type: approval.type });
    }
  }

  /**
   * Check if action requires approval
   */
  shouldRequireApproval(type: ApprovalType, data: any): boolean {
    // Auto-approve if feature flag is enabled
    if (process.env.ENABLE_AUTO_APPROVAL === 'true') {
      return false;
    }

    // Check thresholds
    switch (type) {
      case ApprovalType.BUDGET_INCREASE:
        const threshold = parseFloat(process.env.AUTO_APPROVAL_THRESHOLD || '20');
        const increasePercent = data.increasePercent || 0;
        return increasePercent > threshold;

      case ApprovalType.CAMPAIGN_CREATION:
        // Always require approval for new campaigns
        return true;

      case ApprovalType.CAMPAIGN_DELETE:
        // Always require approval for deletion
        return true;

      default:
        return false;
    }
  }

  /**
   * Create approval request
   */
  async createApproval(params: {
    type: ApprovalType;
    entityType: string;
    entityId: string;
    campaignId?: string;
    requestData: any;
    requestedBy?: string;
  }): Promise<any> {
    return await prisma.approval.create({
      data: {
        type: params.type,
        status: ApprovalStatus.PENDING,
        entityType: params.entityType,
        entityId: params.entityId,
        campaignId: params.campaignId,
        requestData: params.requestData,
        requestedBy: params.requestedBy || 'system',
      },
    });
  }
}

export const approvalService = new ApprovalService();
export default approvalService;

