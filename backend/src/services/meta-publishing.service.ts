/**
 * Meta Publishing Service
 * 
 * Orchestrates publishing to Instagram, Facebook, and WhatsApp platforms.
 * Handles scheduling, retries, and database persistence.
 */

import { PrismaClient, MetaPostStatus, MetaAccountType, MetaMediaType } from '@prisma/client';
import { logger } from '../utils/logger';
import { facebookAdapter, instagramAdapter, whatsappAdapter } from './adapters';
import aiPostComposerService, { ComposerParams, ComposerResult } from './ai-post-composer.service';

const prisma = new PrismaClient();

export interface CreatePostParams {
    target: 'instagram' | 'facebook' | 'whatsapp';
    accountId: string;
    media: string[];
    caption: string;
    scheduleAt?: Date | null;
    campaignId?: string;
    idempotencyKey?: string;
    aiGenerate?: {
        productInfo?: ComposerParams['productInfo'];
        tone?: ComposerParams['tone'];
        length?: ComposerParams['length'];
    };
}

export interface PublishResponse {
    success: boolean;
    postId?: string;
    publishedId?: string;
    scheduledId?: string;
    error?: string;
    aiCaptions?: ComposerResult;
}

export interface ConnectedAccount {
    id: string;
    type: MetaAccountType;
    externalId: string;
    name: string;
    picture?: string;
    isActive: boolean;
}

class MetaPublishingService {
    /**
     * Create and optionally publish a post
     */
    async createPost(params: CreatePostParams): Promise<PublishResponse> {
        const { target, accountId, media, idempotencyKey } = params;
        let { caption, scheduleAt } = params;

        logger.info('Creating Meta post', { target, accountId, mediaCount: media.length });

        // Check for idempotency
        if (idempotencyKey) {
            const existingPost = await prisma.metaPost.findUnique({
                where: { idempotencyKey },
            });

            if (existingPost) {
                logger.info('Duplicate request detected via idempotency key', { idempotencyKey });
                return {
                    success: true,
                    postId: existingPost.id,
                    publishedId: existingPost.externalId || undefined,
                    scheduledId: existingPost.scheduledAt ? existingPost.id : undefined,
                };
            }
        }

        // Get account details
        const account = await prisma.metaAccount.findUnique({
            where: { id: accountId },
        });

        if (!account) {
            return { success: false, error: 'Account not found' };
        }

        if (!account.isActive) {
            return { success: false, error: 'Account is not active' };
        }

        // Handle AI caption generation
        let aiCaptions: ComposerResult | undefined;
        if (params.aiGenerate || caption.startsWith('AI_GENERATE:')) {
            try {
                const aiParams = this.parseAIGenerateCaption(caption, params.aiGenerate);
                aiCaptions = await aiPostComposerService.generateCaptions({
                    ...aiParams,
                    platform: target === 'whatsapp' ? 'facebook' : target,
                });

                // Use medium caption as default
                caption = aiCaptions.captionMedium;

                // Append hashtags for Instagram
                if (target === 'instagram' && aiCaptions.hashtags.length > 0) {
                    caption += '\n\n' + aiCaptions.hashtags.join(' ');
                }
            } catch (error: any) {
                logger.error('AI caption generation failed', { error: error.message });
                // Continue with original caption if AI fails
            }
        }

        // Determine media type
        const mediaType = this.detectMediaType(media);

        // Create post record
        const post = await prisma.metaPost.create({
            data: {
                accountId,
                caption,
                mediaUrls: media,
                mediaType,
                status: scheduleAt ? MetaPostStatus.SCHEDULED : MetaPostStatus.PENDING,
                scheduledAt: scheduleAt,
                campaignId: params.campaignId,
                idempotencyKey,
                aiGenerated: !!aiCaptions,
                aiModel: aiCaptions ? 'openrouter' : undefined,
                aiPromptHints: params.aiGenerate ? params.aiGenerate : undefined,
            },
        });

        // If scheduled for later, return the scheduled post
        if (scheduleAt && scheduleAt > new Date()) {
            logger.info('Post scheduled for later', { postId: post.id, scheduleAt });
            return {
                success: true,
                postId: post.id,
                scheduledId: post.id,
                aiCaptions,
            };
        }

        // Publish immediately
        const publishResult = await this.publishPost(post.id);

        return {
            ...publishResult,
            aiCaptions,
        };
    }

    /**
     * Publish a pending/scheduled post
     */
    async publishPost(postId: string): Promise<PublishResponse> {
        const post = await prisma.metaPost.findUnique({
            where: { id: postId },
            include: { account: true },
        });

        if (!post) {
            return { success: false, error: 'Post not found' };
        }

        if (post.status === MetaPostStatus.PUBLISHED) {
            return { success: true, postId: post.id, publishedId: post.externalId || undefined };
        }

        // Update status to publishing
        await prisma.metaPost.update({
            where: { id: postId },
            data: { status: MetaPostStatus.PUBLISHING },
        });

        try {
            let result: { success: boolean; postId?: string; error?: string };

            switch (post.account.type) {
                case MetaAccountType.INSTAGRAM_BUSINESS:
                    result = await this.publishToInstagram(post);
                    break;
                case MetaAccountType.FACEBOOK_PAGE:
                    result = await this.publishToFacebook(post);
                    break;
                case MetaAccountType.WHATSAPP_BUSINESS:
                    result = { success: false, error: 'WhatsApp publishing requires template messages' };
                    break;
                default:
                    result = { success: false, error: 'Unknown account type' };
            }

            // Update post with result
            await prisma.metaPost.update({
                where: { id: postId },
                data: {
                    status: result.success ? MetaPostStatus.PUBLISHED : MetaPostStatus.FAILED,
                    externalId: result.postId,
                    publishedAt: result.success ? new Date() : null,
                    lastError: result.error,
                    retryCount: { increment: result.success ? 0 : 1 },
                },
            });

            return {
                success: result.success,
                postId: post.id,
                publishedId: result.postId,
                error: result.error,
            };
        } catch (error: any) {
            logger.error('Publish failed', { postId, error: error.message });

            await prisma.metaPost.update({
                where: { id: postId },
                data: {
                    status: MetaPostStatus.FAILED,
                    lastError: error.message,
                    retryCount: { increment: 1 },
                },
            });

            return { success: false, postId: post.id, error: error.message };
        }
    }

    /**
     * Publish to Instagram using two-step container flow
     */
    private async publishToInstagram(post: any): Promise<{ success: boolean; postId?: string; error?: string }> {
        const mediaUrl = post.mediaUrls[0];

        if (!mediaUrl) {
            return { success: false, error: 'No media URL provided' };
        }

        // Determine media type for Instagram
        let mediaType: 'IMAGE' | 'VIDEO' | 'REELS' | 'CAROUSEL_ALBUM' = 'IMAGE';
        if (post.mediaType === MetaMediaType.VIDEO) {
            mediaType = 'VIDEO';
        } else if (post.mediaType === MetaMediaType.REEL) {
            mediaType = 'REELS';
        } else if (post.mediaType === MetaMediaType.CAROUSEL && post.mediaUrls.length > 1) {
            mediaType = 'CAROUSEL_ALBUM';
        }

        const result = await instagramAdapter.publish({
            igUserId: post.account.externalId,
            accessToken: post.account.accessToken,
            caption: post.caption,
            mediaUrl,
            mediaType,
            carouselItems: mediaType === 'CAROUSEL_ALBUM'
                ? post.mediaUrls.map((url: string) => ({ mediaUrl: url, mediaType: 'IMAGE' as const }))
                : undefined,
        });

        // Store container IDs for reference
        if (result.containerId) {
            await prisma.metaPost.update({
                where: { id: post.id },
                data: { containerIds: [result.containerId] },
            });
        }

        return {
            success: result.success,
            postId: result.postId,
            error: result.error,
        };
    }

    /**
     * Publish to Facebook Page
     */
    private async publishToFacebook(post: any): Promise<{ success: boolean; postId?: string; error?: string }> {
        const result = await facebookAdapter.publish({
            pageId: post.account.externalId,
            pageAccessToken: post.account.accessToken,
            message: post.caption,
            mediaUrls: post.mediaUrls.length > 0 ? post.mediaUrls : undefined,
        });

        return {
            success: result.success,
            postId: result.postId,
            error: result.error,
        };
    }

    /**
     * Get all connected accounts
     */
    async getConnectedAccounts(): Promise<ConnectedAccount[]> {
        const accounts = await prisma.metaAccount.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });

        return accounts.map(account => ({
            id: account.id,
            type: account.type,
            externalId: account.externalId,
            name: account.name,
            picture: (account.metadata as any)?.picture,
            isActive: account.isActive,
        }));
    }

    /**
     * Sync accounts from Meta (fetch from API and save to database)
     */
    async syncAccounts(accessToken: string): Promise<{ synced: number; errors: string[] }> {
        const errors: string[] = [];
        let synced = 0;

        // Sync Facebook Pages
        try {
            const pagesResult = await facebookAdapter.getPages(accessToken);
            if (pagesResult.success && pagesResult.pages) {
                for (const page of pagesResult.pages) {
                    await prisma.metaAccount.upsert({
                        where: {
                            type_externalId: {
                                type: MetaAccountType.FACEBOOK_PAGE,
                                externalId: page.id,
                            },
                        },
                        create: {
                            type: MetaAccountType.FACEBOOK_PAGE,
                            externalId: page.id,
                            name: page.name,
                            accessToken: page.accessToken,
                            metadata: { picture: page.picture },
                            isActive: true,
                        },
                        update: {
                            name: page.name,
                            accessToken: page.accessToken,
                            metadata: { picture: page.picture },
                        },
                    });
                    synced++;
                }
            }
        } catch (error: any) {
            errors.push(`Facebook Pages: ${error.message}`);
        }

        // Sync Instagram Business accounts
        try {
            const igResult = await instagramAdapter.getInstagramAccounts(accessToken);
            if (igResult.success && igResult.accounts) {
                for (const account of igResult.accounts) {
                    await prisma.metaAccount.upsert({
                        where: {
                            type_externalId: {
                                type: MetaAccountType.INSTAGRAM_BUSINESS,
                                externalId: account.id,
                            },
                        },
                        create: {
                            type: MetaAccountType.INSTAGRAM_BUSINESS,
                            externalId: account.id,
                            name: account.username,
                            accessToken, // Use parent token for IG accounts
                            metadata: {
                                picture: account.profilePicture,
                                followersCount: account.followersCount,
                            },
                            isActive: true,
                        },
                        update: {
                            name: account.username,
                            metadata: {
                                picture: account.profilePicture,
                                followersCount: account.followersCount,
                            },
                        },
                    });
                    synced++;
                }
            }
        } catch (error: any) {
            errors.push(`Instagram: ${error.message}`);
        }

        logger.info('Account sync completed', { synced, errorCount: errors.length });

        return { synced, errors };
    }

    /**
     * Validate that required scopes are present
     */
    async validateScopes(target: 'instagram' | 'facebook', accessToken?: string): Promise<{
        valid: boolean;
        missingScopes: string[];
        message: string;
    }> {
        const token = accessToken || process.env.META_ACCESS_TOKEN;

        if (!token) {
            return {
                valid: false,
                missingScopes: [],
                message: 'No access token configured. Please set META_ACCESS_TOKEN in environment variables.',
            };
        }

        if (target === 'instagram') {
            return instagramAdapter.validateScopes(token);
        } else {
            return facebookAdapter.validateScopes(token);
        }
    }

    /**
     * Parse AI_GENERATE caption string into params
     */
    private parseAIGenerateCaption(
        caption: string,
        aiGenerate?: CreatePostParams['aiGenerate']
    ): ComposerParams {
        const params: ComposerParams = {
            tone: aiGenerate?.tone || 'friendly',
            length: aiGenerate?.length || 'medium',
            includeHashtags: true,
            productInfo: aiGenerate?.productInfo,
        };

        // Parse AI_GENERATE string if present
        if (caption.startsWith('AI_GENERATE:')) {
            const config = caption.replace('AI_GENERATE:', '').trim();
            const parts = config.split(';').map(p => p.trim());

            for (const part of parts) {
                const [key, value] = part.split('=').map(s => s.trim());

                switch (key) {
                    case 'product':
                        params.productInfo = { name: value, description: '' };
                        break;
                    case 'tone':
                        params.tone = value as ComposerParams['tone'];
                        break;
                    case 'length':
                        params.length = value as ComposerParams['length'];
                        break;
                    case 'include_hashtags':
                        params.includeHashtags = value.toLowerCase() === 'true';
                        break;
                }
            }
        }

        return params;
    }

    /**
     * Detect media type from URLs
     */
    private detectMediaType(mediaUrls: string[]): MetaMediaType {
        if (mediaUrls.length === 0) {
            return MetaMediaType.IMAGE; // Default
        }

        if (mediaUrls.length > 1) {
            return MetaMediaType.CAROUSEL;
        }

        const url = mediaUrls[0].toLowerCase();

        if (url.includes('.mp4') || url.includes('.mov') || url.includes('video')) {
            return MetaMediaType.VIDEO;
        }

        return MetaMediaType.IMAGE;
    }

    /**
     * Test connection to Meta API
     */
    async testConnection(): Promise<{ connected: boolean; message: string }> {
        const token = process.env.META_ACCESS_TOKEN;

        if (!token) {
            return { connected: false, message: 'META_ACCESS_TOKEN not configured' };
        }

        try {
            const response = await fetch(
                `https://graph.facebook.com/v19.0/me?access_token=${token}`
            );
            const data = await response.json() as { error?: { message: string }; name?: string; id?: string };

            if (data.error) {
                return { connected: false, message: data.error.message };
            }

            return { connected: true, message: `Connected as: ${data.name || data.id}` };
        } catch (error: any) {
            return { connected: false, message: error.message };
        }
    }
}

export const metaPublishingService = new MetaPublishingService();
export default metaPublishingService;
