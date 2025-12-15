import { describe, it, expect, jest, beforeAll, afterAll } from '@jest/globals';
import { CampaignStatus } from '@prisma/client';

// Define mocks first
const mockPrisma = {
  emailCampaign: {
    findUnique: jest.fn<any>(),
    update: jest.fn<any>(),
    findMany: jest.fn<any>(),
    create: jest.fn<any>()
  },
  emailDeliveryLog: {
    create: jest.fn<any>()
  },
  emailList: {
    create: jest.fn<any>(),
    findMany: jest.fn<any>()
  },
  subscriber: {
    findMany: jest.fn<any>(),
    create: jest.fn<any>(),
    findUnique: jest.fn<any>(),
    update: jest.fn<any>()
  }
};

// Mock modules
jest.mock('@aws-sdk/client-ses');
jest.mock('nodemailer');
jest.mock('../src/utils/logger');
jest.mock('../src/config/database', () => ({
  prisma: mockPrisma
}));
jest.mock('bullmq', () => ({
  Worker: class {
    constructor() {}
    on() {}
    close() {}
  },
  Queue: class {
    constructor() {}
    add() {}
  }
}));

// Import modules AFTER mocks
import emailService from '../src/services/email.service';
import { emailWorker } from '../src/workers/email.worker';
import { emailCampaignService } from '../src/services/email-campaign.service';

describe('Email Service', () => {
  it('should be defined', () => {
    expect(emailService).toBeDefined();
  });
});

describe('Email Worker', () => {
    it('should be defined', () => {
        expect(emailWorker).toBeDefined();
    });
});

describe('Email Campaign Service', () => {
  it('should create a campaign', async () => {
    const campaignData = {
      name: 'Test Campaign',
      subject: 'Hello',
      htmlContent: '<p>Hi</p>',
      listId: 'list_123'
    };

    mockPrisma.emailCampaign.create.mockResolvedValue({
      id: 'camp_123',
      ...campaignData,
      status: CampaignStatus.DRAFT
    });

    const result = await emailCampaignService.createCampaign(campaignData);
    expect(result).toHaveProperty('id', 'camp_123');
    expect(result.status).toBe(CampaignStatus.DRAFT);
    expect(mockPrisma.emailCampaign.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Test Campaign',
        status: CampaignStatus.DRAFT
      })
    });
  });

  it('should get campaign analytics', async () => {
    mockPrisma.emailCampaign.findUnique.mockResolvedValue({
      id: 'camp_123',
      sentCount: 100,
      deliveredCount: 90,
      openCount: 45,
      clickCount: 10,
      failedCount: 10
    });

    const analytics = await emailCampaignService.getCampaignAnalytics('camp_123');
    expect(analytics).toEqual({
      sent: 100,
      delivered: 90,
      opened: 45,
      clicked: 10,
      failed: 10,
      openRate: 50, // (45/90)*100
      clickRate: 22.22222222222222 // (10/45)*100
    });
  });
});
