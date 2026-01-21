/**
 * AI Post Composer Unit Tests
 * Tests for AI caption generation service
 */

import { AIPostComposerService } from '../../../src/services/ai-post-composer.service';

// Mock the AI service
jest.mock('../../../src/services/ai.service', () => ({
    default: {
        generateWithFallback: jest.fn(),
    },
    aiService: {
        generateWithFallback: jest.fn(),
    },
}));

import aiService from '../../../src/services/ai.service';

describe('AIPostComposerService', () => {
    let composer: any;

    beforeEach(() => {
        // Create instance directly using the class
        const AIPostComposerServiceClass = require('../../../src/services/ai-post-composer.service').default?.constructor
            || function () { return require('../../../src/services/ai-post-composer.service').aiPostComposerService; };
        composer = require('../../../src/services/ai-post-composer.service').aiPostComposerService;
        jest.clearAllMocks();
    });

    describe('generateCaptions', () => {
        it('should generate captions with all sections', async () => {
            (aiService.generateWithFallback as jest.Mock).mockResolvedValueOnce({
                content: `
1. SHORT CAPTION:
Check out our amazing new product! ✨

2. MEDIUM CAPTION:
Introducing our latest collection! Made with premium materials and designed for everyday luxury. Shop now and transform your style. 🛍️

3. LONG CAPTION:
We're so excited to share our newest creation with you! Every detail has been carefully considered to bring you the perfect blend of style and comfort.

Whether you're looking for something special for yourself or searching for the perfect gift, this is it. Made from sustainable materials and crafted with love.

Don't miss out - tap the link in bio to explore the full collection! 💫

4. HASHTAGS:
#shopping #newproduct #sustainable #luxury #fashion #style #quality #musthave #trending #shopnow

5. TITLE OPTIONS:
- Discover Your New Favorite ✨
- Luxury Meets Everyday Style
- The Collection Everyone's Talking About
        `,
            });

            const result = await composer.generateCaptions({
                promptHints: 'New sustainable fashion collection',
                tone: 'luxury',
                length: 'medium',
                includeHashtags: true,
                platform: 'instagram',
            });

            expect(result.captionShort).toBeTruthy();
            expect(result.captionMedium).toBeTruthy();
            expect(result.captionLong).toBeTruthy();
            expect(result.hashtags.length).toBeGreaterThan(0);
            expect(result.titleOptions.length).toBeGreaterThan(0);
        });

        it('should return fallback response when AI fails', async () => {
            (aiService.generateWithFallback as jest.Mock).mockRejectedValueOnce(
                new Error('API limit exceeded')
            );

            const result = await composer.generateCaptions({
                productInfo: {
                    name: 'Test Product',
                    description: 'A great product',
                },
                tone: 'friendly',
                length: 'short',
                includeHashtags: true,
            });

            // Should return fallback captions
            expect(result.captionShort).toBeTruthy();
            expect(result.captionShort).toContain('Test Product');
            expect(result.hashtags).toBeTruthy();
        });

        it('should use product info in prompt', async () => {
            (aiService.generateWithFallback as jest.Mock).mockResolvedValueOnce({
                content: `
SHORT CAPTION: Get your hands on Product XYZ!

MEDIUM CAPTION: Product XYZ is here and it's amazing.

LONG CAPTION: Introducing Product XYZ - the best thing ever.

HASHTAGS: #productxyz #new

TITLE OPTIONS:
- Meet Product XYZ
        `,
            });

            await composer.generateCaptions({
                productInfo: {
                    name: 'Product XYZ',
                    description: 'An amazing product for everyone',
                    price: 49.99,
                },
                tone: 'playful',
                length: 'medium',
                includeHashtags: true,
            });

            // Verify the prompt included product info
            expect(aiService.generateWithFallback).toHaveBeenCalledWith(
                expect.objectContaining({
                    prompt: expect.stringContaining('Product XYZ'),
                })
            );
        });
    });

    describe('generateProductCaptions', () => {
        it('should generate captions for a product', async () => {
            (aiService.generateWithFallback as jest.Mock).mockResolvedValueOnce({
                content: `
SHORT CAPTION: New arrival!
MEDIUM CAPTION: Check out this amazing product.
LONG CAPTION: We're excited to introduce...
HASHTAGS: #new #product
TITLE OPTIONS:
- New Arrival
        `,
            });

            const result = await composer.generateProductCaptions(
                'Summer Dress',
                'Beautiful floral summer dress',
                { price: 79.99, tone: 'casual' }
            );

            expect(result.captionShort).toBeTruthy();
            expect(result.captionMedium).toBeTruthy();
        });
    });

    describe('generateFromPrompt', () => {
        it('should generate captions from a simple text prompt', async () => {
            (aiService.generateWithFallback as jest.Mock).mockResolvedValueOnce({
                content: `
SHORT CAPTION: Sale ends today!
MEDIUM CAPTION: Don't miss our biggest sale of the year.
LONG CAPTION: Our mega sale is coming to an end...
HASHTAGS: #sale #discount
TITLE OPTIONS:
- Last Chance Sale
        `,
            });

            const result = await composer.generateFromPrompt(
                'End of season sale announcement',
                { tone: 'casual', platform: 'facebook' }
            );

            expect(result.captionShort).toBeTruthy();
        });
    });
});
