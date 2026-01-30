import { z } from 'zod';

/**
 * Blog Post creation schema
 */
export const createBlogPostSchema = z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    slug: z.string().min(3).max(255).regex(/^[a-z0-9-]+$/, 'Slug must only contain lowercase letters, numbers, and hyphens'),
    excerpt: z.string().optional(),
    content: z.string().min(10, 'Content must be at least 10 characters'),
    coverImage: z.string().url().optional().or(z.literal('')),
    published: z.boolean().optional().default(false),
    seoTitle: z.string().max(60, 'SEO Title should be under 60 characters').optional(),
    seoDesc: z.string().max(160, 'SEO Description should be under 160 characters').optional(),
    keywords: z.array(z.string()).optional(),
    featuredProductId: z.string().optional(), // Can be ID or handle
});

/**
 * Blog Post update schema
 */
export const updateBlogPostSchema = createBlogPostSchema.partial();

/**
 * Blog Post ID parameter schema
 */
export const blogPostIdSchema = z.object({
    id: z.string().cuid('Invalid Blog Post ID'),
});

/**
 * Blog Post Slug parameter schema
 */
export const blogPostSlugSchema = z.object({
    slug: z.string().min(1),
});

/**
 * Blog Post query parameters schema
 */
export const blogPostQuerySchema = z.object({
    published: z.enum(['true', 'false']).optional(),
    search: z.string().optional(),
    limit: z.preprocess((val) => Number(val), z.number().int().positive().max(100).optional().default(10)),
    offset: z.preprocess((val) => Number(val), z.number().int().nonnegative().optional().default(0)),
});

export type CreateBlogPostInput = z.infer<typeof createBlogPostSchema>;
export type UpdateBlogPostInput = z.infer<typeof updateBlogPostSchema>;
