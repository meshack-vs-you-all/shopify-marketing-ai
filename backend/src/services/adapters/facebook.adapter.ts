/**
 * Facebook Pages Adapter
 * Handles publishing posts and photos to Facebook Pages via Graph API
 */

import { logger } from '../../utils/logger';
import {
    PublishResult,
    graphApiRequest,
    withRetry,
    checkScopes,
} from './base.adapter';

const REQUIRED_SCOPES = ['pages_manage_posts', 'pages_read_engagement'];

export interface FacebookPostParams {
    pageId: string;
    pageAccessToken: string;
    message: string;
    mediaUrls?: string[];
    link?: string;
    scheduled_publish_time?: number; // Unix timestamp for scheduling
}

export interface FacebookPostResult extends PublishResult {
    type: 'text' | 'photo' | 'link';
}

/**
 * Facebook Pages Adapter
 */
export class FacebookAdapter {
    private accessToken: string;

    constructor(accessToken?: string) {
        this.accessToken = accessToken || process.env.META_ACCESS_TOKEN || '';
    }

    /**
     * Check if the app has required permissions for Facebook publishing
     */
    async validateScopes(pageAccessToken?: string): Promise<{
        valid: boolean;
        missingScopes: string[];
        message: string;
    }> {
        const token = pageAccessToken || this.accessToken;
        const result = await checkScopes(token, REQUIRED_SCOPES);

        if (!result.hasAllScopes) {
            return {
                valid: false,
                missingScopes: result.missingScopes,
                message: `Missing required scopes: ${result.missingScopes.join(', ')}. Please update your Meta app permissions.`,
            };
        }

        return {
            valid: true,
            missingScopes: [],
            message: 'All required permissions are granted.',
        };
    }

    /**
     * Publish a text post to a Facebook Page
     */
    async publishTextPost(params: FacebookPostParams): Promise<FacebookPostResult> {
        const { pageId, pageAccessToken, message, scheduled_publish_time } = params;

        logger.info('Publishing text post to Facebook Page', { pageId });

        return withRetry(
            async () => {
                const body: Record<string, any> = { message };

                if (scheduled_publish_time) {
                    body.scheduled_publish_time = scheduled_publish_time;
                    body.published = false;
                }

                const response = await graphApiRequest<{ id: string; post_id?: string }>(
                    `${pageId}/feed`,
                    'POST',
                    pageAccessToken,
                    body
                );

                if (!response.success) {
                    return {
                        success: false,
                        error: response.error?.message,
                        type: 'text' as const,
                    };
                }

                logger.info('Facebook text post published', {
                    postId: response.data?.id || response.data?.post_id,
                    pageId,
                });

                return {
                    success: true,
                    postId: response.data?.id || response.data?.post_id,
                    type: 'text' as const,
                    rawResponse: response.data,
                };
            },
            { operationName: 'Facebook text post publish' }
        );
    }

    /**
     * Publish a photo post to a Facebook Page
     */
    async publishPhotoPost(params: FacebookPostParams): Promise<FacebookPostResult> {
        const { pageId, pageAccessToken, message, mediaUrls, scheduled_publish_time } = params;

        if (!mediaUrls || mediaUrls.length === 0) {
            return {
                success: false,
                error: 'At least one media URL is required for photo posts',
                type: 'photo' as const,
            };
        }

        logger.info('Publishing photo post to Facebook Page', { pageId, mediaCount: mediaUrls.length });

        return withRetry(
            async () => {
                const body: Record<string, any> = {
                    url: mediaUrls[0], // For now, use first image
                    caption: message,
                };

                if (scheduled_publish_time) {
                    body.scheduled_publish_time = scheduled_publish_time;
                    body.published = false;
                }

                const response = await graphApiRequest<{ id: string; post_id?: string }>(
                    `${pageId}/photos`,
                    'POST',
                    pageAccessToken,
                    body
                );

                if (!response.success) {
                    return {
                        success: false,
                        error: response.error?.message,
                        type: 'photo' as const,
                    };
                }

                logger.info('Facebook photo post published', {
                    postId: response.data?.id || response.data?.post_id,
                    pageId,
                });

                return {
                    success: true,
                    postId: response.data?.id || response.data?.post_id,
                    type: 'photo' as const,
                    rawResponse: response.data,
                };
            },
            { operationName: 'Facebook photo post publish' }
        );
    }

    /**
     * Publish a link post to a Facebook Page
     */
    async publishLinkPost(params: FacebookPostParams): Promise<FacebookPostResult> {
        const { pageId, pageAccessToken, message, link, scheduled_publish_time } = params;

        if (!link) {
            return {
                success: false,
                error: 'Link URL is required for link posts',
                type: 'link' as const,
            };
        }

        logger.info('Publishing link post to Facebook Page', { pageId, link });

        return withRetry(
            async () => {
                const body: Record<string, any> = {
                    message,
                    link,
                };

                if (scheduled_publish_time) {
                    body.scheduled_publish_time = scheduled_publish_time;
                    body.published = false;
                }

                const response = await graphApiRequest<{ id: string }>(
                    `${pageId}/feed`,
                    'POST',
                    pageAccessToken,
                    body
                );

                if (!response.success) {
                    return {
                        success: false,
                        error: response.error?.message,
                        type: 'link' as const,
                    };
                }

                logger.info('Facebook link post published', {
                    postId: response.data?.id,
                    pageId,
                });

                return {
                    success: true,
                    postId: response.data?.id,
                    type: 'link' as const,
                    rawResponse: response.data,
                };
            },
            { operationName: 'Facebook link post publish' }
        );
    }

    /**
     * Main publish method - determines the right method based on content
     */
    async publish(params: FacebookPostParams): Promise<FacebookPostResult> {
        if (params.mediaUrls && params.mediaUrls.length > 0) {
            return this.publishPhotoPost(params);
        } else if (params.link) {
            return this.publishLinkPost(params);
        } else {
            return this.publishTextPost(params);
        }
    }

    /**
     * Get pages the user manages
     */
    async getPages(userAccessToken?: string): Promise<{
        success: boolean;
        pages?: Array<{
            id: string;
            name: string;
            accessToken: string;
            picture?: string;
        }>;
        error?: string;
    }> {
        const token = userAccessToken || this.accessToken;

        const response = await graphApiRequest<{
            data: Array<{
                id: string;
                name: string;
                access_token: string;
                picture?: { data?: { url?: string } };
            }>;
        }>(
            'me/accounts',
            'GET',
            token,
            undefined,
            { fields: 'id,name,access_token,picture' }
        );

        if (!response.success) {
            return {
                success: false,
                error: response.error?.message,
            };
        }

        return {
            success: true,
            pages: response.data?.data?.map(page => ({
                id: page.id,
                name: page.name,
                accessToken: page.access_token,
                picture: page.picture?.data?.url,
            })) || [],
        };
    }
}

export const facebookAdapter = new FacebookAdapter();
export default facebookAdapter;
