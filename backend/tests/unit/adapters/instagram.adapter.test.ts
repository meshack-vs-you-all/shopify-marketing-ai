/**
 * Instagram Adapter Unit Tests
 * Tests for the Instagram Content Publishing adapter with mocked Graph API responses
 */

import { InstagramAdapter } from '../../../src/services/adapters/instagram.adapter';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('InstagramAdapter', () => {
    let adapter: InstagramAdapter;

    beforeEach(() => {
        adapter = new InstagramAdapter('test_access_token');
        mockFetch.mockReset();
    });

    describe('createMediaContainer', () => {
        it('should successfully create an image container', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'container_123' }),
            });

            const result = await adapter.createMediaContainer({
                igUserId: 'ig_user_123',
                accessToken: 'ig_token',
                caption: 'Test caption',
                mediaUrl: 'https://example.com/image.jpg',
                mediaType: 'IMAGE',
            });

            expect(result.success).toBe(true);
            expect(result.containerId).toBe('container_123');

            // Verify the API was called correctly
            expect(mockFetch).toHaveBeenCalledTimes(1);
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toContain('ig_user_123/media');
            expect(options.method).toBe('POST');

            const body = JSON.parse(options.body);
            expect(body.image_url).toBe('https://example.com/image.jpg');
            expect(body.caption).toBe('Test caption');
        });

        it('should create a video container with correct media type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'video_container_123' }),
            });

            const result = await adapter.createMediaContainer({
                igUserId: 'ig_user_123',
                accessToken: 'ig_token',
                caption: 'Video caption',
                mediaUrl: 'https://example.com/video.mp4',
                mediaType: 'VIDEO',
            });

            expect(result.success).toBe(true);
            expect(result.containerId).toBe('video_container_123');

            const [, options] = mockFetch.mock.calls[0];
            const body = JSON.parse(options.body);
            expect(body.video_url).toBe('https://example.com/video.mp4');
            expect(body.media_type).toBe('VIDEO');
        });

        it('should handle API errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                json: async () => ({
                    error: {
                        message: 'Media URL is invalid',
                        code: 100,
                    },
                }),
            });

            const result = await adapter.createMediaContainer({
                igUserId: 'ig_user_123',
                accessToken: 'ig_token',
                caption: 'Test',
                mediaUrl: 'invalid-url',
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('invalid');
        });
    });

    describe('publishContainer', () => {
        it('should successfully publish a ready container', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'published_post_123' }),
            });

            const result = await adapter.publishContainer(
                'ig_user_123',
                'container_123',
                'ig_token'
            );

            expect(result.success).toBe(true);
            expect(result.postId).toBe('published_post_123');

            // Verify media_publish endpoint was called
            const [url, options] = mockFetch.mock.calls[0];
            expect(url).toContain('ig_user_123/media_publish');

            const body = JSON.parse(options.body);
            expect(body.creation_id).toBe('container_123');
        });
    });

    describe('checkContainerStatus', () => {
        it('should return FINISHED status when container is ready', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'container_123',
                    status_code: 'FINISHED',
                }),
            });

            const status = await adapter.checkContainerStatus('container_123', 'ig_token');

            expect(status.id).toBe('container_123');
            expect(status.status_code).toBe('FINISHED');
        });

        it('should return IN_PROGRESS for processing containers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    id: 'container_123',
                    status_code: 'IN_PROGRESS',
                }),
            });

            const status = await adapter.checkContainerStatus('container_123', 'ig_token');

            expect(status.status_code).toBe('IN_PROGRESS');
        });
    });

    describe('full publish flow', () => {
        it('should complete the full container → publish workflow', async () => {
            // Mock container creation
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'container_456' }),
            });

            // Mock publish
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({ id: 'ig_post_789' }),
            });

            const result = await adapter.publish({
                igUserId: 'ig_user_123',
                accessToken: 'ig_token',
                caption: 'Full flow test',
                mediaUrl: 'https://example.com/image.jpg',
                mediaType: 'IMAGE',
            });

            expect(result.success).toBe(true);
            expect(result.postId).toBe('ig_post_789');
            expect(result.containerId).toBe('container_456');
            expect(mockFetch).toHaveBeenCalledTimes(2);
        });
    });

    describe('getInstagramAccounts', () => {
        it('should return connected Instagram Business accounts', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: async () => ({
                    data: [
                        {
                            id: 'page_1',
                            instagram_business_account: {
                                id: 'ig_123',
                                username: 'mystore',
                                name: 'My Store',
                                profile_picture_url: 'https://example.com/pic.jpg',
                                followers_count: 1000,
                            },
                        },
                    ],
                }),
            });

            const result = await adapter.getInstagramAccounts();

            expect(result.success).toBe(true);
            expect(result.accounts).toHaveLength(1);
            expect(result.accounts?.[0].username).toBe('mystore');
            expect(result.accounts?.[0].followersCount).toBe(1000);
        });
    });
});
