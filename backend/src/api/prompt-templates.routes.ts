/**
 * PromptTemplate CRUD API Routes
 * 
 * Allows managing prompt templates without code changes (A4 requirement)
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const createTemplateSchema = z.object({
    name: z.string().min(1).max(255),
    version: z.string().default('1.0.0'),
    template: z.string().min(1),
    taskType: z.string().min(1),
    isActive: z.boolean().default(true),
});

const updateTemplateSchema = z.object({
    name: z.string().min(1).max(255).optional(),
    version: z.string().optional(),
    template: z.string().min(1).optional(),
    taskType: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
});

/**
 * GET /api/prompt-templates
 * List all prompt templates with optional filters
 */
router.get('/', async (req: Request, res: Response) => {
    try {
        const { taskType, isActive } = req.query;

        const where: any = {};
        if (taskType) where.taskType = taskType;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const templates = await prisma.promptTemplate.findMany({
            where,
            orderBy: [{ taskType: 'asc' }, { name: 'asc' }, { version: 'desc' }],
        });

        res.json({ templates, count: templates.length });
    } catch (error: any) {
        logger.error('Failed to list prompt templates', { error: error.message });
        res.status(500).json({ error: 'Failed to list templates' });
    }
});

/**
 * GET /api/prompt-templates/:id
 * Get a single prompt template by ID
 */
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const template = await prisma.promptTemplate.findUnique({
            where: { id },
        });

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({ template });
    } catch (error: any) {
        logger.error('Failed to get prompt template', { error: error.message });
        res.status(500).json({ error: 'Failed to get template' });
    }
});

/**
 * POST /api/prompt-templates
 * Create a new prompt template
 */
router.post('/', async (req: Request, res: Response) => {
    try {
        const parsed = createTemplateSchema.parse(req.body);

        // Check for duplicate name+version
        const existing = await prisma.promptTemplate.findUnique({
            where: {
                name_version: {
                    name: parsed.name,
                    version: parsed.version,
                },
            },
        });

        if (existing) {
            return res.status(409).json({ error: 'Template with this name and version already exists' });
        }

        const template = await prisma.promptTemplate.create({
            data: parsed,
        });

        logger.info('Prompt template created', { id: template.id, name: template.name });
        res.status(201).json({ template });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Failed to create prompt template', { error: error.message });
        res.status(500).json({ error: 'Failed to create template' });
    }
});

/**
 * PUT /api/prompt-templates/:id
 * Update an existing prompt template
 */
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const parsed = updateTemplateSchema.parse(req.body);

        const existing = await prisma.promptTemplate.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const template = await prisma.promptTemplate.update({
            where: { id },
            data: parsed,
        });

        logger.info('Prompt template updated', { id: template.id });
        res.json({ template });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({ error: 'Validation failed', details: error.errors });
        }
        logger.error('Failed to update prompt template', { error: error.message });
        res.status(500).json({ error: 'Failed to update template' });
    }
});

/**
 * DELETE /api/prompt-templates/:id
 * Soft delete a prompt template (set isActive = false)
 */
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { hard } = req.query;

        const existing = await prisma.promptTemplate.findUnique({
            where: { id },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Template not found' });
        }

        if (hard === 'true') {
            // Hard delete
            await prisma.promptTemplate.delete({
                where: { id },
            });
            logger.info('Prompt template hard deleted', { id });
            res.json({ success: true, message: 'Template permanently deleted' });
        } else {
            // Soft delete
            await prisma.promptTemplate.update({
                where: { id },
                data: { isActive: false },
            });
            logger.info('Prompt template soft deleted', { id });
            res.json({ success: true, message: 'Template deactivated' });
        }
    } catch (error: any) {
        logger.error('Failed to delete prompt template', { error: error.message });
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
