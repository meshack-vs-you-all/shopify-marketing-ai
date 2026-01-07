import { Router } from 'express';
import { authService } from '../services/auth.service';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validation';
import { registerSchema, loginSchema } from '../../../shared/schemas/auth.schema';

const router: Router = Router();

router.post('/register', validateBody(registerSchema), async (req, res, next) => {
    try {
        const result = await authService.register(req.body);
        res.status(201).json(result);
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const result = await authService.login(req.body);
        res.json(result);
    } catch (error: any) {
        res.status(401).json({ error: error.message });
    }
});

router.get('/me', authenticate, async (req, res) => {
    // Use user id from token to fetch profile (or just return what we have)
    res.json({ userId: (req as any).user.userId });
});

export default router;
