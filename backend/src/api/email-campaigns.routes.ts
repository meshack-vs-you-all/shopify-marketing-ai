import { Router } from 'express';
import { emailCampaignService } from '../services/email-campaign.service';
import { aiService } from '../services/ai.service';
// Shopify service is loaded dynamically to avoid tsx ESM crash when credentials are missing
import { logger } from '../utils/logger';
import { authenticate } from '../middleware/auth';
import multer from 'multer';

// Lazy-loaded shopify service
let shopifyServiceInstance: any = null;
async function getShopifyService() {
  if (!shopifyServiceInstance) {
    try {
      const { shopifyService } = await import('../services/shopify.service');
      shopifyServiceInstance = shopifyService;
    } catch (e: any) {
      logger.warn('Shopify service not available: ' + e.message);
      return null;
    }
  }
  return shopifyServiceInstance;
}

const upload = multer({ dest: 'uploads/' });

const router: Router = Router();

// Apply authentication to all email campaign routes
router.use(authenticate);

router.get('/dashboard-stats', async (req, res) => {
  try {
    const stats = await emailCampaignService.getDashboardMetrics();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Lists ---

router.get('/lists', async (req, res) => {
  try {
    const lists = await emailCampaignService.getLists();
    res.json(lists);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lists', async (req, res) => {
  try {
    const list = await emailCampaignService.createList(req.body);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/lists/:listId', async (req, res) => {
  try {
    await emailCampaignService.deleteList(req.params.listId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Subscribers ---

router.post('/lists/:listId/subscribers', async (req, res) => {
  try {
    const subscriber = await emailCampaignService.addSubscriber({
      ...req.body,
      listId: req.params.listId
    });
    res.json(subscriber);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/lists/:listId/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) throw new Error('No file uploaded');
    const result = await emailCampaignService.importSubscribersFromCsv(req.params.listId, req.file.path);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/lists/:listId/subscribers', async (req, res) => {
  try {
    const subscribers = await emailCampaignService.getSubscribers(req.params.listId);
    res.json(subscribers);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- Campaigns ---

router.get('/', async (req, res) => {
  try {
    const campaigns = await emailCampaignService.getCampaigns();
    res.json(campaigns);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const campaign = await emailCampaignService.createCampaign(req.body);
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const campaign = await emailCampaignService.getCampaign(req.params.id);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/send', async (req, res) => {
  try {
    const result = await emailCampaignService.sendCampaign(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/:id/analytics', async (req, res) => {
  try {
    const analytics = await emailCampaignService.getCampaignAnalytics(req.params.id);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- AI Generation & Shopify Integration ---

router.post('/generate', async (req, res) => {
  try {
    const {
      type, // 'subject' | 'body'
      productId,
      campaignType,
      tone,
      discount,
      model,
      customPrompt,
      context
    } = req.body;

    let productDetails: any = {};
    if (productId) {
      try {
        const shopifyService = await getShopifyService();
        if (shopifyService) {
          productDetails = await shopifyService.getProduct(productId);
        }
      } catch (err) {
        logger.warn(`Could not fetch product ${productId}`, err);
      }
    }

    // Merge product details with request body, allowing explicit body params to override
    const params = {
      emailType: campaignType || 'newsletter',
      productName: productDetails.title || req.body.productName,
      productDescription: productDetails.body_html || req.body.productDescription,
      discount,
      tone,
      model,
      customPrompt,
      context,
      customerName: req.body.customerName,
      subject: req.body.subject, // Required for 'body' generation
    };

    let result;
    if (type === 'subject') {
      result = await aiService.generateEmailSubjectLines(params);
    } else {
      result = await aiService.generateEmailBody(params as any);
    }

    res.json({ result });
  } catch (error: any) {
    logger.error('Failed to generate content', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-ad-copy', async (req, res) => {
  try {
    const result = await aiService.generateAdCopy(req.body);
    res.json(result);
  } catch (error: any) {
    logger.error('Failed to generate ad copy', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-product-description', async (req, res) => {
  try {
    const result = await aiService.generateProductDescription(req.body);
    res.json({ result });
  } catch (error: any) {
    logger.error('Failed to generate product description', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, aspectRatio, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const imageUrl = await aiService.generateImage({
      prompt,
      aspectRatio,
      model
    });

    res.json({ imageUrl });
  } catch (error: any) {
    logger.error('Failed to generate image', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/shopify/products', async (req, res) => {
  try {
    const shopifyService = await getShopifyService();
    if (!shopifyService) {
      return res.status(503).json({ error: 'Shopify not configured' });
    }
    const products = await shopifyService.getProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shopify/collections', async (req, res) => {
  try {
    const shopifyService = await getShopifyService();
    if (!shopifyService) {
      return res.status(503).json({ error: 'Shopify not configured' });
    }
    const collections = await shopifyService.getCollections();
    res.json(collections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- System & SMTP Verification ---

router.get('/verify-connection', async (req, res) => {
  try {
    const { emailService } = require('../services/email.service');
    const status = await emailService.verifyConnection();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/test-smtp', async (req, res) => {
  try {
    const { email, dryRun, subject, htmlBody } = req.body;
    const { emailService } = require('../services/email.service');

    // First verify connection
    const connectionStatus = await emailService.verifyConnection();

    // Attempt to send a test email
    const result = await emailService.sendMarketingEmail({
      to: email || (req as any).user?.email || 'test@example.com',
      subject: subject || 'Test Email - Shopify Marketing AI',
      htmlBody: htmlBody || `
        <h1>Test Email</h1>
        <p>This is a test email from your Shopify Marketing AI instance.</p>
        <p><strong>Connection Status:</strong></p>
        <pre>${JSON.stringify(connectionStatus, null, 2)}</pre>
        <p>Use this to verify that your SMTP or SES settings are correct.</p>
      `,
      textBody: 'Test Email - Connection Status: ' + JSON.stringify(connectionStatus),
      dryRun: dryRun === true
    });

    res.json({
      connection: connectionStatus,
      sendResult: result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
