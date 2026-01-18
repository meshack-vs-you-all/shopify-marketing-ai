/**
 * Newsletter Generator Service
 * 
 * Orchestrates end-to-end newsletter generation with:
 * - Shopify product integration
 * - SEO optimization
 * - Complete email structure (subject, preheader, body, CTA)
 * - GeneratedContent persistence
 */

import { aiService } from './ai.service';
import { shopifyService } from './shopify.service';
import { logger } from '../utils/logger';
import { prisma } from '../config/database';

export interface NewsletterProduct {
    id: string;
    title: string;
    description: string;
    price: string;
    compareAtPrice?: string;
    imageUrl?: string;
    handle?: string;
}

export interface NewsletterRequest {
    campaignType: 'newsletter' | 'promotion' | 'product_launch' | 'seasonal';
    campaignName?: string;
    productIds?: string[];
    products?: NewsletterProduct[];
    tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'luxury';
    seoOptimized?: boolean;
    includeHeroImage?: boolean;
    customInstructions?: string;
    model?: string;
}

export interface NewsletterResponse {
    subject: string;
    preheader: string;
    htmlBody: string;
    textBody: string;
    ctaText: string;
    ctaUrl?: string;
    heroImagePrompt?: string;
    seoMeta?: {
        title: string;
        description: string;
        keywords: string[];
    };
    generationMeta: {
        model: string;
        productsUsed: number;
        timestamp: string;
        generatedContentId?: string;
    };
}

class NewsletterGeneratorService {
    /**
     * Generate a complete newsletter with all components
     * Persists to GeneratedContent for audit trail
     */
    async generateNewsletter(request: NewsletterRequest): Promise<NewsletterResponse> {
        logger.info('Starting newsletter generation', { campaignType: request.campaignType });

        // Step 1: Fetch products if IDs provided but not full products
        let products = request.products || [];
        if (request.productIds && request.productIds.length > 0 && products.length === 0) {
            products = await this.fetchProducts(request.productIds);
        }

        // Step 2: Build comprehensive prompt
        const prompt = this.buildNewsletterPrompt(request, products);

        // Step 3: Generate content via AI
        const response = await aiService.generateWithFallback({
            prompt,
            systemPrompt: this.getSystemPrompt(request.seoOptimized),
            taskType: 'email_body',
            model: request.model,
            temperature: 0.7,
            maxTokens: 4096,
        });

        // Step 4: Parse structured response
        const parsed = this.parseNewsletterResponse(response.content);

        // Step 5: Generate hero image prompt if requested
        let heroImagePrompt: string | undefined;
        if (request.includeHeroImage && products.length > 0) {
            heroImagePrompt = this.generateImagePrompt(request.campaignType, products);
        }

        // Step 6: Build SEO meta if requested
        let seoMeta: NewsletterResponse['seoMeta'] | undefined;
        if (request.seoOptimized) {
            seoMeta = this.extractSEOMeta(parsed, products);
        }

        // Step 7: Persist to GeneratedContent (A3 requirement)
        let generatedContentId: string | undefined;
        try {
            const savedContent = await prisma.generatedContent.create({
                data: {
                    type: 'EMAIL_BODY',
                    platform: 'EMAIL',
                    prompt: prompt,
                    model: response.model || 'unknown',
                    content: JSON.stringify({
                        subject: parsed.subject,
                        preheader: parsed.preheader,
                        htmlBody: parsed.htmlBody,
                        textBody: parsed.textBody,
                        ctaText: parsed.ctaText,
                        heroImagePrompt,
                        seoMeta,
                    }),
                    metadata: {
                        campaignType: request.campaignType,
                        campaignName: request.campaignName,
                        productsUsed: products.length,
                        productIds: request.productIds,
                        tone: request.tone,
                        seoOptimized: request.seoOptimized,
                    },
                    status: 'GENERATED',
                },
            });
            generatedContentId = savedContent.id;
            logger.info('Generated content persisted', { id: savedContent.id });
        } catch (error: any) {
            logger.warn('Failed to persist generated content', { error: error.message });
            // Non-blocking: continue even if persistence fails
        }

        return {
            ...parsed,
            heroImagePrompt,
            seoMeta,
            generationMeta: {
                model: response.model || 'unknown',
                productsUsed: products.length,
                timestamp: new Date().toISOString(),
                generatedContentId,
            },
        };
    }

    private async fetchProducts(productIds: string[]): Promise<NewsletterProduct[]> {
        const products: NewsletterProduct[] = [];
        for (const id of productIds) {
            try {
                const product = await shopifyService.getProduct(id);
                if (product) {
                    products.push({
                        id: product.id,
                        title: product.title,
                        description: product.description || product.body_html?.replace(/<[^>]*>/g, '') || '',
                        price: product.variants?.[0]?.price || '0',
                        compareAtPrice: product.variants?.[0]?.compare_at_price,
                        imageUrl: product.images?.[0]?.src,
                        handle: product.handle,
                    });
                }
            } catch (error) {
                logger.warn('Failed to fetch product', { id, error });
            }
        }
        return products;
    }

    private getSystemPrompt(seoOptimized?: boolean): string {
        const seoInstructions = seoOptimized
            ? `
- Use SEO-friendly language with natural keyword integration
- Structure content with clear headings (H1, H2, H3 hierarchy)
- Include action-oriented CTAs with power words
- Optimize for readability and engagement metrics`
            : '';

        return `You are an expert email marketing copywriter for e-commerce brands.

Generate a complete, production-ready marketing email that:
- Captures attention immediately
- Highlights product benefits, not just features
- Creates urgency without being pushy
- Includes clear, compelling calls-to-action
- Is mobile-friendly and scannable
${seoInstructions}

CRITICAL: Respond in the exact JSON format specified. Do not include markdown code blocks.`;
    }

    private buildNewsletterPrompt(request: NewsletterRequest, products: NewsletterProduct[]): string {
        const productSection = products.length > 0
            ? `

Featured Products:
${products.map((p, i) => `
${i + 1}. ${p.title}
   Price: $${p.price}${p.compareAtPrice ? ` (was $${p.compareAtPrice})` : ''}
   Description: ${p.description.substring(0, 200)}...
`).join('')}`
            : '';

        const campaignTypeDescriptions: Record<string, string> = {
            newsletter: 'Weekly newsletter with updates, tips, and featured products',
            promotion: 'Limited-time promotional offer or sale announcement',
            product_launch: 'New product introduction and launch announcement',
            seasonal: 'Seasonal campaign (holiday, summer, back-to-school, etc.)',
        };

        return `Generate a complete marketing email for: ${campaignTypeDescriptions[request.campaignType] || 'marketing campaign'}

Campaign Type: ${request.campaignType}
Tone: ${request.tone || 'friendly'}
${request.customInstructions ? `Custom Instructions: ${request.customInstructions}` : ''}
${productSection}

Respond with a JSON object containing these exact fields:
{
  "subject": "Compelling email subject line (50 chars max)",
  "preheader": "Preview text that complements the subject (100 chars max)",
  "htmlBody": "Complete HTML email body with inline styles, product callouts, and CTA buttons",
  "textBody": "Plain text version of the email",
  "ctaText": "Primary call-to-action button text"
}`;
    }

    private parseNewsletterResponse(content: string): Omit<NewsletterResponse, 'heroImagePrompt' | 'seoMeta' | 'generationMeta'> {
        try {
            // Try to extract JSON from the response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    subject: parsed.subject || 'Your Weekly Update',
                    preheader: parsed.preheader || 'Check out what\'s new this week',
                    htmlBody: parsed.htmlBody || this.generateFallbackHTML(content),
                    textBody: parsed.textBody || content.replace(/<[^>]*>/g, ''),
                    ctaText: parsed.ctaText || 'Shop Now',
                };
            }
        } catch (error) {
            logger.warn('Failed to parse newsletter response as JSON', { error });
        }

        // Fallback: treat the content as the email body
        return {
            subject: 'Your Weekly Update',
            preheader: 'Check out what\'s new this week',
            htmlBody: this.generateFallbackHTML(content),
            textBody: content.replace(/<[^>]*>/g, ''),
            ctaText: 'Shop Now',
        };
    }

    private generateFallbackHTML(content: string): string {
        return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .cta { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  ${content}
  <a href="#" class="cta">Shop Now</a>
</body>
</html>`;
    }

    private generateImagePrompt(campaignType: string, products: NewsletterProduct[]): string {
        const productNames = products.slice(0, 3).map(p => p.title).join(', ');

        const typePrompts: Record<string, string> = {
            newsletter: `Professional product showcase featuring ${productNames}. Clean, modern aesthetic with soft lighting. E-commerce marketing style.`,
            promotion: `Vibrant sale announcement banner featuring ${productNames}. Bold colors, dynamic composition. Flash sale energy.`,
            product_launch: `Premium product hero shot of ${productNames}. Studio lighting, minimalist background. Launch announcement style.`,
            seasonal: `Seasonal marketing banner featuring ${productNames}. Festive, on-brand aesthetic. High-end e-commerce style.`,
        };

        return typePrompts[campaignType] || typePrompts.newsletter;
    }

    private extractSEOMeta(
        parsed: Omit<NewsletterResponse, 'heroImagePrompt' | 'seoMeta' | 'generationMeta'>,
        products: NewsletterProduct[]
    ): NewsletterResponse['seoMeta'] {
        const productKeywords = products.flatMap(p =>
            p.title.toLowerCase().split(' ').filter(w => w.length > 3)
        );

        return {
            title: parsed.subject,
            description: parsed.preheader,
            keywords: [...new Set(productKeywords)].slice(0, 10),
        };
    }
}

export const newsletterGeneratorService = new NewsletterGeneratorService();
export default newsletterGeneratorService;
