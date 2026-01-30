import { prisma } from '../config/database';
import { BlogPost, User } from '@prisma/client';
import { logger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import {
    CreateBlogPostInput,
    UpdateBlogPostInput,
    blogPostQuerySchema,
} from '../../../shared/schemas/blog.schema';

// Helper type for query params
type BlogPostQueryParams = {
    published?: 'true' | 'false';
    search?: string;
    limit?: number;
    offset?: number;
};

class BlogService {
    /**
     * Create a new blog post
     */
    async createPost(data: CreateBlogPostInput, authorId: string) {
        logger.info(`Creating blog post: ${data.title}`);

        // Check slug uniqueness
        const existing = await prisma.blogPost.findUnique({
            where: { slug: data.slug },
        });
        if (existing) {
            throw new AppError('Slug already exists', 400);
        }

        return await prisma.blogPost.create({
            data: {
                ...data,
                authorId,
                publishedAt: data.published ? new Date() : null,
            },
        });
    }

    /**
     * Update a blog post
     */
    async updatePost(id: string, data: UpdateBlogPostInput) {
        logger.info(`Updating blog post: ${id}`);

        const existing = await prisma.blogPost.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new AppError('Blog post not found', 404);
        }

        // Check slug uniqueness if changing
        if (data.slug && data.slug !== existing.slug) {
            const slugExists = await prisma.blogPost.findUnique({
                where: { slug: data.slug },
            });
            if (slugExists) {
                throw new AppError('Slug already exists', 400);
            }
        }

        // Handle publishing date update
        let publishedAt = existing.publishedAt;
        if (data.published === true && !existing.published) {
            publishedAt = new Date();
        } else if (data.published === false) {
            publishedAt = null;
        }

        return await prisma.blogPost.update({
            where: { id },
            data: {
                ...data,
                publishedAt,
            },
        });
    }

    /**
     * Get single post by slug (Public view)
     */
    async getPostBySlug(slug: string) {
        const post = await prisma.blogPost.findUnique({
            where: { slug },
            include: {
                author: {
                    select: { firstName: true, lastName: true, avatar: true },
                },
            },
        });

        if (!post) {
            throw new AppError('Post not found', 404);
        }

        return post;
    }

    /**
     * Get single post by ID (Admin view)
     */
    async getPostById(id: string) {
        const post = await prisma.blogPost.findUnique({
            where: { id },
            include: {
                author: {
                    select: { firstName: true, lastName: true, avatar: true },
                },
            },
        });

        if (!post) {
            throw new AppError('Post not found', 404);
        }

        return post;
    }

    /**
     * List posts with filtering and pagination
     */
    async listPosts(params: BlogPostQueryParams) {
        const { published, search, limit = 10, offset = 0 } = params;

        const where: any = {};

        if (published === 'true') {
            where.published = true;
        } else if (published === 'false') {
            where.published = false;
        }

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
                { keywords: { has: search } },
            ];
        }

        const [posts, total] = await Promise.all([
            prisma.blogPost.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    author: {
                        select: { firstName: true, lastName: true },
                    },
                },
            }),
            prisma.blogPost.count({ where }),
        ]);

        return { posts, total, limit, offset };
    }

    /**
     * Delete a post
     */
    async deletePost(id: string) {
        const existing = await prisma.blogPost.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError('Post not found', 404);
        }
        return await prisma.blogPost.delete({ where: { id } });
    }
}

export const blogService = new BlogService();
