/**
 * Instagram Content Publishing Adapter
 * Handles the two-step container → publish workflow for Instagram Business accounts
 * 
 * Flow:
 * 1. Create a media container with POST /{ig-user-id}/media
 * 2. Wait for container to be ready (poll status)
 * 3. Publish the container with POST /{ig-user-id}/media_publish
 * 
 * @see https://developers.facebook.com/docs/instagram-platform/content-publishing
 */

import { logger } from '../../utils/logger';
import {
    PublishResult,
    graphApiRequest,
    withRetry,
    checkScopes,
} from './base.adapter';

const REQUIRED_SCOPES = [
    'instagram_content_publish',
    'instagram_basic',
    'pages_read_engagement',
];

export type InstagramMediaType = 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';

export interface InstagramPostParams {
    igUserId: string;
    accessToken: string;
    caption: string;
    mediaUrl: string;
    mediaType?: InstagramMediaType;
    coverUrl?: string; // For reels/videos
    shareToFeed?: boolean; // For reels
    carouselItems?: Array<{ mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO' }>;
}

export interface InstagramPostResult extends PublishResult {
    containerId?: string;
    status?: 'FINISHED' | 'IN_PROGRESS' | 'ERROR';
}

export interface ContainerStatus {
    id: string;
    status_code: 'FINISHED' | 'IN_PROGRESS' | 'ERROR' | 'EXPIRED';
    status?: string;
}

/**
 * Instagram Content Publishing Adapter
 */
export class InstagramAdapter {
    private accessToken: string;

    constructor(accessToken?: string) {
        this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || '';
    }

    /**
     * Check if the app has required permissions for Instagram publishing
     */
    async validateScopes(accessToken?: string): Promise<{
        valid: boolean;
        missingScopes: string[];
        message: string;
    }> {
        const token = accessToken || this.accessToken;
        const result = await checkScopes(token, REQUIRED_SCOPES);

        if (!result.hasAllScopes) {
            return {
                valid: false,
                missingScopes: result.missingScopes,
                message: `Missing required scopes: ${result.missingScopes.join(', ')}. Please submit your app for review to get instagram_content_publish permission.`,
            };
        }

        return {
            valid: true,
            missingScopes: [],
            message: 'All required permissions are granted.',
        };
    }

    /**
     * Step 1: Create a media container
     */
    async createMediaContainer(params: InstagramPostParams): Promise<{
        success: boolean;
        containerId?: string;
        error?: string;
    }> {
        const { igUserId, accessToken, caption, mediaUrl, mediaType = 'IMAGE' } = params;

        logger.info('Creating Instagram media container', { igUserId, mediaType });

        const body: Record<string, any> = {
            caption,
        };

        // Set the appropriate field based on media type
        if (mediaType === 'IMAGE') {
            body.image_url = mediaUrl;
        } else if (mediaType === 'VIDEO' || mediaType === 'REELS') {
            body.video_url = mediaUrl;
            body.media_type = mediaType === 'REELS' ? 'REELS' : 'VIDEO';

            if (params.coverUrl) {
                body.cover_url = params.coverUrl;
            }
            if (mediaType === 'REELS' && params.shareToFeed !== undefined) {
                body.share_to_feed = params.shareToFeed;
            }
        } else if (mediaType === 'CAROUSEL_ALBUM') {
            // For carousel, we need to create child containers first
            return this.createCarouselContainer(params);
        }

        const response = await graphApiRequest<{ id: string }>(
            `${igUserId}/media`,
            'POST',
            accessToken,
            body
        );

        if (!response.success) {
            logger.error('Failed to create Instagram container', {
                error: response.error,
                igUserId,
            });
            return {
                success: false,
                error: response.error?.message,
            };
        }

        logger.info('Instagram container created', { containerId: response.data?.id });

        return {
            success: true,
            containerId: response.data?.id,
        };
    }

    /**
     * Create carousel container (multiple images/videos)
     */
    private async createCarouselContainer(params: InstagramPostParams): Promise<{
        success: boolean;
        containerId?: string;
        error?: string;
    }> {
        const { igUserId, accessToken, caption, carouselItems } = params;

        if (!carouselItems || carouselItems.length < 2) {
            return {
                success: false,
                error: 'Carousel requires at least 2 items',
            };
        }

        // Step 1: Create child containers
        const childContainerIds: string[] = [];

        for (const item of carouselItems) {
            const body: Record<string, any> = {
                is_carousel_item: true,
            };

            if (item.mediaType === 'IMAGE') {
                body.image_url = item.mediaUrl;
            } else {
                body.video_url = item.mediaUrl;
                body.media_type = 'VIDEO';
            }

            const response = await graphApiRequest<{ id: string }>(
                `${igUserId}/media`,
                'POST',
                accessToken,
                body
            );

            if (!response.success) {
                return {
                    success: false,
                    error: `Failed to create carousel item: ${response.error?.message}`,
                };
            }

            childContainerIds.push(response.data!.id);
        }

        // Step 2: Create the parent carousel container
        const carouselResponse = await graphApiRequest<{ id: string }>(
            `${igUserId}/media`,
            'POST',
            accessToken,
            {
                media_type: 'CAROUSEL',
                children: childContainerIds.join(','),
                caption,
            }
        );

        if (!carouselResponse.success) {
            return {
                success: false,
                error: `Failed to create carousel container: ${carouselResponse.error?.message}`,
            };
        }

        return {
            success: true,
            containerId: carouselResponse.data?.id,
        };
    }

    /**
     * Step 2: Check container status (poll until ready)
     */
    async checkContainerStatus(containerId: string, accessToken: string): Promise<ContainerStatus> {
        const response = await graphApiRequest<ContainerStatus>(
            containerId,
            'GET',
            accessToken,
            undefined,
            { fields: 'id,status_code,status' }
        );

        if (!response.success) {
            return {
                id: containerId,
                status_code: 'ERROR',
                status: response.error?.message,
            };
        }

        return response.data!;
    }

    /**
     * Wait for container to be ready (polling with timeout)
     */
    async waitForContainerReady(
        containerId: string,
        accessToken: string,
        options: { maxWaitMs?: number; pollIntervalMs?: number } = {}
    ): Promise<{ ready: boolean; status: ContainerStatus }> {
        const { maxWaitMs = 60000, pollIntervalMs = 3000 } = options;
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitMs) {
            const status = await this.checkContainerStatus(containerId, accessToken);

            if (status.status_code === 'FINISHED') {
                return { ready: true, status };
            }

            if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
                return { ready: false, status };
            }

            // Still in progress, wait and poll again
            await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
        }

        // Timeout
        return {
            ready: false,
            status: {
                id: containerId,
                status_code: 'ERROR',
                status: 'Container processing timeout',
            },
        };
    }

    /**
     * Step 3: Publish the container
     */
    async publishContainer(
        igUserId: string,
        containerId: string,
        accessToken: string
    ): Promise<PublishResult> {
        logger.info('Publishing Instagram container', { igUserId, containerId });

        return withRetry(
            async () => {
                const response = await graphApiRequest<{ id: string }>(
                    `${igUserId}/media_publish`,
                    'POST',
                    accessToken,
                    { creation_id: containerId }
                );

                if (!response.success) {
                    return {
                        success: false,
                        error: response.error?.message,
                        containerId,
                    };
                }

                logger.info('Instagram post published', { postId: response.data?.id, containerId });

                return {
                    success: true,
                    postId: response.data?.id,
                    containerId,
                    rawResponse: response.data,
                };
            },
            { operationName: 'Instagram container publish' }
        );
    }

    /**
     * Full publish flow: create container → wait → publish
     */
    async publish(params: InstagramPostParams): Promise<InstagramPostResult> {
        // Step 1: Create container
        const containerResult = await this.createMediaContainer(params);

        if (!containerResult.success || !containerResult.containerId) {
            return {
                success: false,
                error: containerResult.error || 'Failed to create container',
            };
        }

        const containerId = containerResult.containerId;

        // Step 2: Wait for container to be ready (for videos/reels)
        if (params.mediaType === 'VIDEO' || params.mediaType === 'REELS') {
            const waitResult = await this.waitForContainerReady(containerId, params.accessToken);

            if (!waitResult.ready) {
                const statusCode = waitResult.status.status_code === 'EXPIRED' ? 'ERROR' : waitResult.status.status_code;
                return {
                    success: false,
                    error: `Container not ready: ${waitResult.status.status}`,
                    containerId,
                    status: statusCode as 'FINISHED' | 'IN_PROGRESS' | 'ERROR',
                };
            }
        }

        // Step 3: Publish
        const publishResult = await this.publishContainer(
            params.igUserId,
            containerId,
            params.accessToken
        );

        return {
            ...publishResult,
            containerId,
            status: publishResult.success ? 'FINISHED' : 'ERROR',
        };
    }

    /**
     * Get Instagram Business accounts linked to the user
     */
    async getInstagramAccounts(accessToken?: string): Promise<{
        success: boolean;
        accounts?: Array<{
            id: string;
            username: string;
            name?: string;
            profilePicture?: string;
            followersCount?: number;
        }>;
        error?: string;
    }> {
        const token = accessToken || this.accessToken;

        // First get pages, then get Instagram accounts linked to each page
        const pagesResponse = await graphApiRequest<{
            data: Array<{
                id: string;
                instagram_business_account?: {
                    id: string;
                    username: string;
                    name?: string;
                    profile_picture_url?: string;
                    followers_count?: number;
                };
            }>;
        }>(
            'me/accounts',
            'GET',
            token,
            undefined,
            { fields: 'id,instagram_business_account{id,username,name,profile_picture_url,followers_count}' }
        );

        if (!pagesResponse.success) {
            return {
                success: false,
                error: pagesResponse.error?.message,
            };
        }

        const accounts = pagesResponse.data?.data
            ?.filter(page => page.instagram_business_account)
            ?.map(page => ({
                id: page.instagram_business_account!.id,
                username: page.instagram_business_account!.username,
                name: page.instagram_business_account!.name,
                profilePicture: page.instagram_business_account!.profile_picture_url,
                followersCount: page.instagram_business_account!.followers_count,
            })) || [];

        return {
            success: true,
            accounts,
        };
    }
}

export const instagramAdapter = new InstagramAdapter();
export default instagramAdapter;
