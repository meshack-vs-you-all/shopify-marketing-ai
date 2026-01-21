/**
 * Base Meta Adapter Interface
 * Common types and utilities for all Meta platform adapters
 */

import { logger } from '../../utils/logger';

export interface MetaApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: number;
        type?: string;
        fbTraceId?: string;
    };
}

export interface PublishResult {
    success: boolean;
    postId?: string;
    containerId?: string;
    error?: string;
    rawResponse?: any;
}

export const META_API_VERSION = 'v19.0';
export const META_GRAPH_BASE_URL = 'https://graph.facebook.com';

/**
 * Exponential backoff retry with rate limit handling
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
        operationName?: string;
    } = {}
): Promise<T> {
    const { maxRetries = 3, baseDelayMs = 1000, maxDelayMs = 30000, operationName = 'operation' } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Check if it's a rate limit error (429) or server error (5xx)
            const statusCode = error.response?.status || error.statusCode;
            const isRetryable = statusCode === 429 || (statusCode >= 500 && statusCode < 600);

            if (!isRetryable || attempt === maxRetries) {
                logger.error(`${operationName} failed after ${attempt + 1} attempts`, {
                    error: error.message,
                    statusCode,
                });
                throw error;
            }

            // Calculate delay with exponential backoff + jitter
            const delay = Math.min(
                baseDelayMs * Math.pow(2, attempt) + Math.random() * 1000,
                maxDelayMs
            );

            logger.warn(`${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
                error: error.message,
                statusCode,
            });

            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError || new Error('All retry attempts failed');
}

/**
 * Make a Graph API request with proper error handling
 */
export async function graphApiRequest<T = any>(
    endpoint: string,
    method: 'GET' | 'POST' | 'DELETE',
    accessToken: string,
    body?: Record<string, any>,
    queryParams?: Record<string, string>
): Promise<MetaApiResponse<T>> {
    const url = new URL(`${META_GRAPH_BASE_URL}/${META_API_VERSION}/${endpoint}`);

    // Add query params
    if (queryParams) {
        Object.entries(queryParams).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });
    }

    // Always include access token
    url.searchParams.append('access_token', accessToken);

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url.toString(), options);
        const data = await response.json() as { error?: { message?: string; code?: number; type?: string; fbtrace_id?: string } } & T;

        if (!response.ok || data.error) {
            // Redact access token from logs
            const sanitizedUrl = url.toString().replace(/access_token=[^&]+/, 'access_token=REDACTED');

            logger.error('Graph API error', {
                endpoint: sanitizedUrl,
                method,
                statusCode: response.status,
                error: data.error,
            });

            return {
                success: false,
                error: {
                    message: data.error?.message || 'Unknown Graph API error',
                    code: data.error?.code,
                    type: data.error?.type,
                    fbTraceId: data.error?.fbtrace_id,
                },
            };
        }

        return {
            success: true,
            data: data as T,
        };
    } catch (error: any) {
        logger.error('Graph API request failed', {
            endpoint,
            method,
            error: error.message,
        });

        return {
            success: false,
            error: {
                message: error.message || 'Network error',
            },
        };
    }
}

/**
 * Check if required scopes are available
 */
export async function checkScopes(
    accessToken: string,
    requiredScopes: string[]
): Promise<{ hasAllScopes: boolean; missingScopes: string[]; grantedScopes: string[] }> {
    const response = await graphApiRequest<{ data: Array<{ permission: string; status: string }> }>(
        'me/permissions',
        'GET',
        accessToken
    );

    if (!response.success) {
        return {
            hasAllScopes: false,
            missingScopes: requiredScopes,
            grantedScopes: [],
        };
    }

    const grantedScopes = response.data?.data
        ?.filter(p => p.status === 'granted')
        ?.map(p => p.permission) || [];

    const missingScopes = requiredScopes.filter(scope => !grantedScopes.includes(scope));

    return {
        hasAllScopes: missingScopes.length === 0,
        missingScopes,
        grantedScopes,
    };
}
