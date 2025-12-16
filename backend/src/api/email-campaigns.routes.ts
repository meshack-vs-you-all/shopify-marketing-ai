import { Router } from 'express';
import { emailCampaignService } from '../services/email-campaign.service';
import { aiService } from '../services/ai.service';
import { shopifyService } from '../services/shopify.service';
import { logger } from '../utils/logger';
import multer from 'multer';

const upload = multer({ dest: 'uploads/' });

const router = Router();

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
      campaignType, // 'promotional', 'newsletter', etc.
      tone,
      discount
    } = req.body;

    let productDetails = {};
    if (productId) {
      productDetails = await shopifyService.getProduct(productId);
    }

    let result;
    if (type === 'subject') {
      result = await aiService.generateEmailSubjectLines({
        emailType: campaignType || 'promotional',
        productName: (productDetails as any).title,
        discount,
        numberOfVariations: 5
      });
    } else if (type === 'body') {
      result = await aiService.generateEmailBody({
        emailType: campaignType || 'promotional',
        subject: req.body.subject || 'Special Offer',
        productName: (productDetails as any).title,
        productDescription: (productDetails as any).body_html?.replace(/<[^>]*>?/gm, ''),
        discount,
        tone
      });
    }

    res.json({ result });
  } catch (error: any) {
    logger.error('Error generating email content', { error: error.message });
    res.status(500).json({ error: error.message });
  }
});

router.get('/shopify/products', async (req, res) => {
  try {
    const products = await shopifyService.getProducts();
    res.json(products);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/shopify/collections', async (req, res) => {
  try {
    const collections = await shopifyService.getCollections();
    res.json(collections);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
