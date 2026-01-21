/**
 * Facebook Adapter Unit Tests
 * Tests for the Facebook Pages API adapter with mocked Graph API responses
 */

import { FacebookAdapter } from '../../../src/services/adapters/facebook.adapter';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('FacebookAdapter', () => {
    let adapter: FacebookAdapter;

    beforeEach(() => {
        adapter = new FacebookAdapter('test_access_token');
        mockFetch.mockReset();
    });

    describe('publishTextPost', () => {
        it('should successfully publish a text post', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: '1234567890_post_id' }),
            });

            const result = await adapter.publishTextPost({
                pageId: 'page_123',
                pageAccessToken: 'page_token',
                message: 'Hello World!',
            });

            expect(result.success).toBe(true);
            expect(result.postId).toBe('1234567890_post_id');
            expect(result.type).toBe('text');

            // Verify the API was called correctly
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toContain('page_123/feed');
            expect(options.method).toBe('POST');
        });

        it('should handle API errors gracefully', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: {
                        message: 'Invalid OAuth access token',
                        code: 190,
                        type: 'OAuthException',
                    },
                }),
            });

            const result = await adapter.publishTextPost({
                pageId: 'page_123',
                pageAccessToken: 'invalid_token',
                message: 'Test',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid OAuth');
        });
    });

    describe('publishPhotoPost', () => {
        it('should successfully publish a photo post', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'photo_post_id' }),
            });

            const result = await adapter.publishPhotoPost({
                pageId: 'page_123',
                pageAccessToken: 'page_token',
                message: 'Check out this photo!',
                mediaUrls: ['https://example.com/image.jpg'],
            });

            expect(result.success).toBe(true);
            expect(result.postId).toBe('photo_post_id');
            expect(result.type).toBe('photo');

            // Verify photos endpoint was used
            const [url] = mockFetch.mock.calls[0];
            expect(url).toContain('page_123/photos');
        });

        it('should fail without media URLs', async () => {
            const result = await adapter.publishPhotoPost({
                pageId: 'page_123',
                pageAccessToken: 'page_token',
                message: 'No photo here',
                mediaUrls: [],
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('media URL');
        });
    });

    describe('getPages', () => {
        it('should return connected pages', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: 'page_1',
                            name: 'My Store',
                            access_token: 'page_token_1',
                            picture: { data: { url: 'https://example.com/pic.jpg' } },
                        },
                        {
                            id: 'page_2',
                            name: 'Another Page',
                            access_token: 'page_token_2',
                        },
                    ],
                }),
            });

            const result = await adapter.getPages();

            expect(result.success).toBe(true);
            expect(result.pages).toHaveLength(2);
            expect(result.pages?.[0].name).toBe('My Store');
            expect(result.pages?.[0].accessToken).toBe('page_token_1');
        });
    });

    describe('validateScopes', () => {
        it('should return valid when all scopes are granted', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        { permission: 'pages_manage_posts', status: 'granted' },
                        { permission: 'pages_read_engagement', status: 'granted' },
                    ],
                }),
            });

            const result = await adapter.validateScopes();

            expect(result.valid).toBe(true);
            expect(result.missingScopes).toHaveLength(0);
        });

        it('should return missing scopes when not all are granted', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        { permission: 'pages_read_engagement', status: 'granted' },
                        { permission: 'pages_manage_posts', status: 'declined' },
                    ],
                }),
            });

            const result = await adapter.validateScopes();

            expect(result.valid).toBe(false);
            expect(result.missingScopes).toContain('pages_manage_posts');
        });
    });
});
