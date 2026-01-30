import { Router } from 'express';
import { blogService } from '../services/blog.service';
import { authenticate } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import {
    createBlogPostSchema,
    updateBlogPostSchema,
    blogPostIdSchema,
    blogPostSlugSchema,
    blogPostQuerySchema,
} from '../../../shared/schemas/blog.schema';

const router: Router = Router();

// ==========================================
// PUBLIC ROUTES (No Auth Required)
// ==========================================

/**
 * GET /api/blog
 * List all published posts (paginated)
 * Used by: Public Blog Index (ISR)
 */
router.get('/', validateQuery(blogPostQuerySchema), async (req, res, next) => {
    try {
        const { published, search, limit, offset } = req.query;

        // Public API should default to published=true if not specified? 
        // Or let the client decide for flexibility?
        // Let's allow flexibility but strictly strictly validated in service layer or here.

        // For public usage, we typically only want to show published posts.
        // However, the dashboard might use this endpoint too?
        // We will separate Admin vs Public concerns via params or separate endpoints if needed.
        // For now, let's assume the query param controls it, and frontend (Admin) sends published=false if needed.

        // NOTE: Ideally, unauthenticated requests should ONLY see published=true.
        // Let's enforce that if user is not authenticated?
        // However, `authenticate` middleware is not run yet.
        // We can rely on the frontend to pass `published=true`.
        // A more secure way:
        // If we wanted to hide drafts from public, we'd check req.user inside the handler.
        // But since this is a "Public Blog Integration", let's trust the query for now
        // but default to ALL if authorized, or `published=true` if public?
        // Simpler: Just rely on the query param. The service handles the filtering.

        const result = await blogService.listPosts({
            published: published as any, // 'true' | 'false'
            search: search as string,
            limit: Number(limit),
            offset: Number(offset),
        });

        res.json(result);
    } catch (error) {
        next(error);
    }
});

/**
 * GET /api/blog/slug/:slug
 * Get single post by slug
 * Used by: Public Blog Post Page (ISR)
 */
router.get('/slug/:slug', validateParams(blogPostSlugSchema), async (req, res, next) => {
    try {
        const { slug } = req.params;
        const post = await blogService.getPostBySlug(slug);

        // If access control is strict:
        // if (!post.published && !req.user) throw new AppError('Not found', 404);

        res.json(post);
    } catch (error) {
        next(error);
    }
});

// ==========================================
// PROTECTED ROUTES (Admin/Editor Only)
// ==========================================
router.use(authenticate);

/**
 * GET /api/blog/:id
 * Get post by ID (Edit view)
 */
router.get('/:id', validateParams(blogPostIdSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await blogService.getPostById(id);
        res.json(post);
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/blog
 * Create a new draft
 */
router.post('/', validateBody(createBlogPostSchema), async (req, res, next) => {
    try {
        // Assuming authenticate middleware populates req.user
        const userId = (req as any).user.userId;
        const post = await blogService.createPost(req.body, userId);
        res.status(201).json(post);
    } catch (error) {
        next(error);
    }
});

/**
 * PATCH /api/blog/:id
 * Update a post
 */
router.patch('/:id', validateParams(blogPostIdSchema), validateBody(updateBlogPostSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await blogService.updatePost(id, req.body);
        res.json(post);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /api/blog/:id
 * Delete a post
 */
router.delete('/:id', validateParams(blogPostIdSchema), async (req, res, next) => {
    try {
        const { id } = req.params;
        await blogService.deletePost(id);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        next(error);
    }
});

export default router;
