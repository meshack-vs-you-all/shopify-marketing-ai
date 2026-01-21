/**
 * AI Post Composer Service
 * 
 * Generates AI-powered captions for social media posts using OpenRouter.
 * Supports multiple tones, lengths, and includes hashtag generation.
 */

import { logger } from '../utils/logger';
import aiService from './ai.service';

export interface ComposerParams {
    promptHints?: string;
    productInfo?: {
        name: string;
        description: string;
        price?: number;
        imageUrl?: string;
    };
    tone: 'professional' | 'casual' | 'playful' | 'luxury' | 'friendly';
    length: 'short' | 'medium' | 'long';
    includeHashtags: boolean;
    platform?: 'instagram' | 'facebook';
    customInstructions?: string;
}

export interface ComposerResult {
    captionShort: string;      // 1-2 lines (~100 chars)
    captionMedium: string;     // 2-3 lines (~200 chars)
    captionLong: string;       // 3-5 lines (~400 chars)
    hashtags: string[];        // 5-10 relevant hashtags
    titleOptions: string[];    // 3 A/B title variations
    rawContent?: string;       // Raw AI response for debugging
}

/**
 * Temperature settings based on use case:
 * - 0.2 for production (deterministic, stable)
 * - 0.7 for creative drafts (more variety)
 */
const TEMPERATURE_PRODUCTION = 0.2;
const TEMPERATURE_CREATIVE = 0.7;

class AIPostComposerService {
    /**
     * Generate AI-powered captions for social media posts
     */
    async generateCaptions(
        params: ComposerParams,
        options: { creative?: boolean } = {}
    ): Promise<ComposerResult> {
        const { creative = false } = options;

        logger.info('Generating AI captions', {
            tone: params.tone,
            length: params.length,
            hasProduct: !!params.productInfo,
            platform: params.platform,
        });

        const prompt = this.buildPrompt(params);
        const systemPrompt = this.getSystemPrompt(params.platform);

        try {
            const response = await aiService.generateWithFallback({
                prompt,
                systemPrompt,
                taskType: params.length === 'long' ? 'product_description' : 'marketing_copy',
                temperature: creative ? TEMPERATURE_CREATIVE : TEMPERATURE_PRODUCTION,
                maxTokens: 1000,
            });

            // Parse the AI response
            const result = this.parseResponse(response.content);

            logger.info('AI captions generated successfully', {
                hashtagCount: result.hashtags.length,
                titleOptionsCount: result.titleOptions.length,
            });

            return result;
        } catch (error: any) {
            logger.error('Failed to generate AI captions', { error: error.message });

            // Return fallback response
            return this.getFallbackResponse(params);
        }
    }

    /**
     * Generate captions specifically for a product
     */
    async generateProductCaptions(
        productName: string,
        productDescription: string,
        options: {
            price?: number;
            tone?: ComposerParams['tone'];
            platform?: 'instagram' | 'facebook';
            includeHashtags?: boolean;
        } = {}
    ): Promise<ComposerResult> {
        return this.generateCaptions({
            productInfo: {
                name: productName,
                description: productDescription,
                price: options.price,
            },
            tone: options.tone || 'friendly',
            length: 'medium',
            includeHashtags: options.includeHashtags ?? true,
            platform: options.platform || 'instagram',
        });
    }

    /**
     * Generate captions from a simple text prompt
     */
    async generateFromPrompt(
        promptText: string,
        options: {
            tone?: ComposerParams['tone'];
            platform?: 'instagram' | 'facebook';
        } = {}
    ): Promise<ComposerResult> {
        return this.generateCaptions({
            promptHints: promptText,
            tone: options.tone || 'casual',
            length: 'medium',
            includeHashtags: true,
            platform: options.platform || 'instagram',
        });
    }

    /**
     * Build the prompt for the AI model
     */
    private buildPrompt(params: ComposerParams): string {
        const parts: string[] = [];

        parts.push('Generate social media post captions with the following requirements:\n');

        // Platform context
        if (params.platform) {
            parts.push(`Platform: ${params.platform === 'instagram' ? 'Instagram' : 'Facebook'}`);
            if (params.platform === 'instagram') {
                parts.push('Note: Instagram captions can be up to 2,200 characters. Use line breaks for readability.');
            }
        }

        // Tone
        parts.push(`Tone: ${this.getToneDescription(params.tone)}`);

        // Product info
        if (params.productInfo) {
            parts.push('\nProduct Information:');
            parts.push(`- Name: ${params.productInfo.name}`);
            parts.push(`- Description: ${params.productInfo.description}`);
            if (params.productInfo.price) {
                parts.push(`- Price: $${params.productInfo.price.toFixed(2)}`);
            }
        }

        // Custom hints
        if (params.promptHints) {
            parts.push(`\nContext/Topic: ${params.promptHints}`);
        }

        // Custom instructions
        if (params.customInstructions) {
            parts.push(`\nAdditional Instructions: ${params.customInstructions}`);
        }

        // Output format
        parts.push('\n\nPlease provide the following in a structured format:');
        parts.push('1. SHORT CAPTION: A punchy 1-2 line caption (~100 characters)');
        parts.push('2. MEDIUM CAPTION: A 2-3 line caption with more detail (~200 characters)');
        parts.push('3. LONG CAPTION: A 3-5 line caption with storytelling (~400 characters)');
        parts.push('4. HASHTAGS: 5-10 relevant hashtags (include niche and popular mix)');
        parts.push('5. TITLE OPTIONS: 3 different hook/title variations for A/B testing');

        if (!params.includeHashtags) {
            parts.push('\nNote: Skip the hashtags section.');
        }

        return parts.join('\n');
    }

    /**
     * Get system prompt based on platform
     */
    private getSystemPrompt(platform?: 'instagram' | 'facebook'): string {
        const base = 'You are an expert social media copywriter who creates engaging, conversion-focused content.';

        if (platform === 'instagram') {
            return `${base} You specialize in Instagram content that drives engagement through compelling hooks, emojis, and strategic hashtag usage. Your captions tell stories and create emotional connections.`;
        } else if (platform === 'facebook') {
            return `${base} You create Facebook posts that encourage comments and shares. You understand the Facebook algorithm and write content that sparks conversation.`;
        }

        return base;
    }

    /**
     * Get tone description for prompt
     */
    private getToneDescription(tone: ComposerParams['tone']): string {
        const descriptions: Record<ComposerParams['tone'], string> = {
            professional: 'Professional, polished, and authoritative. Use industry terminology appropriately.',
            casual: 'Casual and conversational. Use everyday language and relatable expressions.',
            playful: 'Fun, energetic, and witty. Use emojis, wordplay, and humor.',
            luxury: 'Elegant, sophisticated, and exclusive. Evoke premium quality and aspiration.',
            friendly: 'Warm, approachable, and personable. Like talking to a trusted friend.',
        };

        return descriptions[tone];
    }

    /**
     * Parse AI response into structured format
     */
    private parseResponse(content: string): ComposerResult {
        const result: ComposerResult = {
            captionShort: '',
            captionMedium: '',
            captionLong: '',
            hashtags: [],
            titleOptions: [],
            rawContent: content,
        };

        // Try to extract sections
        const lines = content.split('\n');
        let currentSection = '';
        let sectionContent: string[] = [];

        for (const line of lines) {
            const lowerLine = line.toLowerCase().trim();

            // Detect section headers
            if (lowerLine.includes('short caption') || lowerLine.match(/^1\.\s*short/i)) {
                if (currentSection && sectionContent.length) {
                    this.assignSection(result, currentSection, sectionContent);
                }
                currentSection = 'short';
                sectionContent = [];
            } else if (lowerLine.includes('medium caption') || lowerLine.match(/^2\.\s*medium/i)) {
                if (currentSection && sectionContent.length) {
                    this.assignSection(result, currentSection, sectionContent);
                }
                currentSection = 'medium';
                sectionContent = [];
            } else if (lowerLine.includes('long caption') || lowerLine.match(/^3\.\s*long/i)) {
                if (currentSection && sectionContent.length) {
                    this.assignSection(result, currentSection, sectionContent);
                }
                currentSection = 'long';
                sectionContent = [];
            } else if (lowerLine.includes('hashtag') || lowerLine.match(/^4\.\s*hashtag/i)) {
                if (currentSection && sectionContent.length) {
                    this.assignSection(result, currentSection, sectionContent);
                }
                currentSection = 'hashtags';
                sectionContent = [];
            } else if (lowerLine.includes('title option') || lowerLine.match(/^5\.\s*title/i)) {
                if (currentSection && sectionContent.length) {
                    this.assignSection(result, currentSection, sectionContent);
                }
                currentSection = 'titles';
                sectionContent = [];
            } else if (line.trim()) {
                sectionContent.push(line.trim());
            }
        }

        // Assign last section
        if (currentSection && sectionContent.length) {
            this.assignSection(result, currentSection, sectionContent);
        }

        // Fallback: if parsing failed, use the whole content
        if (!result.captionShort && !result.captionMedium && !result.captionLong) {
            const cleanContent = content.replace(/\*\*/g, '').trim();
            result.captionMedium = cleanContent.slice(0, 500);
            result.captionShort = cleanContent.slice(0, 150);
            result.captionLong = cleanContent;
        }

        return result;
    }

    /**
     * Assign parsed content to result sections
     */
    private assignSection(
        result: ComposerResult,
        section: string,
        content: string[]
    ): void {
        const text = content.join('\n').replace(/^[-*•]\s*/gm, '').trim();

        switch (section) {
            case 'short':
                result.captionShort = text;
                break;
            case 'medium':
                result.captionMedium = text;
                break;
            case 'long':
                result.captionLong = text;
                break;
            case 'hashtags':
                // Extract hashtags from text
                const hashtagMatches = text.match(/#\w+/g) || [];
                result.hashtags = hashtagMatches.map(h => h.toLowerCase());
                // If no hashtags found with #, try splitting by space/comma
                if (result.hashtags.length === 0) {
                    result.hashtags = text
                        .split(/[,\s]+/)
                        .map(h => h.replace(/^#/, ''))
                        .filter(h => h.length > 1)
                        .map(h => `#${h.toLowerCase()}`);
                }
                break;
            case 'titles':
                // Extract title options
                result.titleOptions = content
                    .map(line => line.replace(/^[\d\.\-\*•]+\s*/, '').trim())
                    .filter(line => line.length > 0);
                break;
        }
    }

    /**
     * Get fallback response when AI fails
     */
    private getFallbackResponse(params: ComposerParams): ComposerResult {
        const productName = params.productInfo?.name || 'our product';

        return {
            captionShort: `✨ Check out ${productName}! Link in bio.`,
            captionMedium: `✨ Discover ${productName} - your new favorite! Quality meets style in every detail. Tap the link to learn more! 🛍️`,
            captionLong: `✨ Introducing ${productName}!\n\nWe're excited to share this with you. Every detail has been carefully crafted for quality and style.\n\nWhether you're looking for something special for yourself or a gift for someone you love, this is it!\n\n👉 Tap the link in bio to shop now!`,
            hashtags: ['#shopping', '#newproduct', '#lifestyle', '#quality', '#shopnow'],
            titleOptions: [
                `Meet ${productName} ✨`,
                `Why Everyone Loves ${productName}`,
                `${productName} Is Here! 🎉`,
            ],
        };
    }
}

export const aiPostComposerService = new AIPostComposerService();
export default aiPostComposerService;
