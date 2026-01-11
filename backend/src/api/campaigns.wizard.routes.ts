import { Router } from 'express';
import { campaignService } from '../services/campaign.service';
import { authenticate } from '../middleware/auth';
import { emailQueue, EMAIL_QUEUE_NAME } from '../workers/queues';

const router: Router = Router();
router.use(authenticate);

// 1. Create Draft
router.post('/draft', async (req, res) => {
    try {
        const { type, name } = req.body;
        const campaign = await campaignService.createDraft({ type, name });
        res.json(campaign);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Step Data
router.get('/:id', async (req, res) => {
    try {
        const campaign = await campaignService.getCampaign(req.params.id);
        if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
        res.json(campaign);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update Audience
router.put('/:id/audience', async (req, res) => {
    try {
        const updated = await campaignService.setAudience(req.params.id, req.body);
        res.json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Update Content
router.put('/:id/content', async (req, res) => {
    try {
        const updated = await campaignService.updateContent(req.params.id, req.body);
        res.json(updated);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Finalize / Mark Ready
router.post('/:id/finalize', async (req, res) => {
    try {
        const updated = await campaignService.finalize(req.params.id);
        res.json(updated);
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

// 6. Send (Newsletter Only)
router.post('/:id/send', async (req, res) => {
    try {
        // Finalize first implies validation
        // Then queue
        await campaignService.finalize(req.params.id);

        // Add to shared email worker queue
        // We add a 'source' flag or just rely on ID lookup strategy
        await emailQueue.add(EMAIL_QUEUE_NAME, { campaignId: req.params.id, isUnified: true });

        res.json({ success: true, message: 'Campaign queued' });
    } catch (err: any) {
        res.status(400).json({ error: err.message });
    }
});

export default router;
