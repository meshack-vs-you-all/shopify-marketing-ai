import OpenAI from 'openai';
import { logger } from '../utils/logger';

/**
 * AI Content Generation Service
 * Uses OpenAI GPT-4 to generate marketing content
 */
class AIService {
  private client: OpenAI;
  private model: string = 'gpt-4-turbo-preview';

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      logger.warn('OpenAI API key not configured');
      return;
    }

    this.client = new OpenAI({
      apiKey,
      organization: process.env.OPENAI_ORG_ID,
    });
  }

  /**
   * Generate ad copy for Meta/Google Ads
   */
  async generateAdCopy(params: {
    productName: string;
    productDescription: string;
    targetAudience: string;
    platform: 'meta' | 'google';
    tone?: 'professional' | 'casual' | 'luxury' | 'friendly';
    numberOfVariations?: number;
  }): Promise<{
    headlines: string[];
    descriptions: string[];
    callToActions: string[];
  }> {
    try {
      const prompt = this.buildAdCopyPrompt(params);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert copywriter specializing in high-converting ad copy for e-commerce. Generate compelling, action-oriented ad copy that drives clicks and conversions.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseAdCopyResponse(content, params.numberOfVariations || 3);
    } catch (error: any) {
      logger.error('Error generating ad copy', { error: error.message, params });
      throw new Error(`Failed to generate ad copy: ${error.message}`);
    }
  }

  /**
   * Generate product description
   */
  async generateProductDescription(params: {
    productName: string;
    currentDescription: string;
    keyFeatures: string[];
    targetAudience: string;
    seoKeywords?: string[];
  }): Promise<string> {
    try {
      const prompt = `Rewrite and enhance this product description to be more compelling and SEO-optimized:

Product: ${params.productName}
Current Description: ${params.currentDescription}
Key Features: ${params.keyFeatures.join(', ')}
Target Audience: ${params.targetAudience}
${params.seoKeywords ? `SEO Keywords to include: ${params.seoKeywords.join(', ')}` : ''}

Requirements:
- Highlight benefits, not just features
- Use persuasive language
- Include SEO keywords naturally
- Keep it concise (150-200 words)
- Make it scannable with short paragraphs
- Include a clear call-to-action`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert e-commerce copywriter specializing in product descriptions that convert visitors into customers.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('Error generating product description', { error: error.message, params });
      throw new Error(`Failed to generate product description: ${error.message}`);
    }
  }

  /**
   * Generate email subject lines
   */
  async generateEmailSubjectLines(params: {
    emailType: 'promotional' | 'abandoned_cart' | 'welcome' | 'newsletter';
    productName?: string;
    discount?: number;
    numberOfVariations?: number;
  }): Promise<string[]> {
    try {
      const prompt = this.buildEmailSubjectPrompt(params);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert email marketer. Generate compelling subject lines that maximize open rates.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseListResponse(content, params.numberOfVariations || 5);
    } catch (error: any) {
      logger.error('Error generating email subject lines', { error: error.message, params });
      throw new Error(`Failed to generate email subjects: ${error.message}`);
    }
  }

  /**
   * Generate email body content
   */
  async generateEmailBody(params: {
    emailType: 'promotional' | 'abandoned_cart' | 'welcome' | 'newsletter';
    subject: string;
    productName?: string;
    productDescription?: string;
    discount?: number;
    customerName?: string;
    tone?: 'professional' | 'casual' | 'friendly';
  }): Promise<string> {
    try {
      const prompt = this.buildEmailBodyPrompt(params);

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an expert email copywriter. Write engaging, conversion-focused email content.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8,
        max_tokens: 800,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('Error generating email body', { error: error.message, params });
      throw new Error(`Failed to generate email body: ${error.message}`);
    }
  }

  /**
   * Analyze campaign performance and provide recommendations
   */
  async analyzePerformanceAndRecommend(params: {
    campaignMetrics: any;
    currentSpend: number;
    currentRevenue: number;
    roas: number;
    targetRoas: number;
  }): Promise<{
    analysis: string;
    recommendations: string[];
    suggestedActions: string[];
  }> {
    try {
      const prompt = `Analyze this marketing campaign performance and provide recommendations:

Current Metrics:
- Spend: $${params.currentSpend}
- Revenue: $${params.currentRevenue}
- ROAS: ${params.roas}x
- Target ROAS: ${params.targetRoas}x

Campaign Details:
${JSON.stringify(params.campaignMetrics, null, 2)}

Provide:
1. A brief analysis of performance
2. 3-5 specific recommendations
3. Suggested actions (e.g., "increase budget by 20%", "pause underperforming ads", "test new creative")`;

      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a marketing analytics expert. Provide data-driven recommendations for campaign optimization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.6,
        max_tokens: 1000,
      });

      const content = response.choices[0]?.message?.content || '';
      return this.parseAnalysisResponse(content);
    } catch (error: any) {
      logger.error('Error analyzing performance', { error: error.message, params });
      throw new Error(`Failed to analyze performance: ${error.message}`);
    }
  }

  // Helper methods
  private buildAdCopyPrompt(params: any): string {
    return `Generate ${params.numberOfVariations || 3} variations of ad copy for:

Product: ${params.productName}
Description: ${params.productDescription}
Platform: ${params.platform}
Target Audience: ${params.targetAudience}
Tone: ${params.tone || 'professional'}

For each variation, provide:
- 1 headline (${params.platform === 'meta' ? '40 characters max' : '30 characters max'})
- 1 description (${params.platform === 'meta' ? '125 characters max' : '90 characters max'})
- 1 call-to-action button text

Format as JSON with arrays: {headlines: [], descriptions: [], callToActions: []}`;
  }

  private buildEmailSubjectPrompt(params: any): string {
    let prompt = `Generate ${params.numberOfVariations || 5} email subject lines for a ${params.emailType} email.`;
    
    if (params.productName) prompt += `\nProduct: ${params.productName}`;
    if (params.discount) prompt += `\nDiscount: ${params.discount}% off`;
    
    prompt += '\n\nMake them compelling, personalized, and optimized for open rates. Return as a numbered list.';
    
    return prompt;
  }

  private buildEmailBodyPrompt(params: any): string {
    let prompt = `Write an email body for a ${params.emailType} email.\n\nSubject: ${params.subject}\n`;
    
    if (params.customerName) prompt += `Recipient: ${params.customerName}\n`;
    if (params.productName) prompt += `Product: ${params.productName}\n`;
    if (params.productDescription) prompt += `Product Description: ${params.productDescription}\n`;
    if (params.discount) prompt += `Discount: ${params.discount}% off\n`;
    
    prompt += `Tone: ${params.tone || 'friendly'}\n\nMake it engaging, conversion-focused, and include a clear call-to-action.`;
    
    return prompt;
  }

  private parseAdCopyResponse(content: string, count: number): any {
    try {
      // Try to parse as JSON first
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parse from text format
      const headlines: string[] = [];
      const descriptions: string[] = [];
      const callToActions: string[] = [];
      
      // Simple parsing logic (can be improved)
      const lines = content.split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.toLowerCase().includes('headline')) {
          const match = line.match(/headline[:\-]?\s*(.+)/i);
          if (match) headlines.push(match[1].trim());
        } else if (line.toLowerCase().includes('description')) {
          const match = line.match(/description[:\-]?\s*(.+)/i);
          if (match) descriptions.push(match[1].trim());
        } else if (line.toLowerCase().includes('cta') || line.toLowerCase().includes('call')) {
          const match = line.match(/(?:cta|call[-\s]to[-\s]action)[:\-]?\s*(.+)/i);
          if (match) callToActions.push(match[1].trim());
        }
      });
      
      return {
        headlines: headlines.slice(0, count),
        descriptions: descriptions.slice(0, count),
        callToActions: callToActions.slice(0, count),
      };
    } catch (error) {
      logger.error('Error parsing ad copy response', { error, content });
      // Return default structure
      return {
        headlines: ['Check out our amazing product!'],
        descriptions: ['Discover the perfect solution for your needs.'],
        callToActions: ['Shop Now'],
      };
    }
  }

  private parseListResponse(content: string, count: number): string[] {
    const items: string[] = [];
    const lines = content.split('\n').filter(line => line.trim());
    
    lines.forEach(line => {
      // Match numbered lists (1., 2., etc.) or bullet points
      const match = line.match(/^[\d\-\*•]\s*(.+)/);
      if (match) {
        items.push(match[1].trim());
      } else if (line.trim() && items.length < count) {
        items.push(line.trim());
      }
    });
    
    return items.slice(0, count);
  }

  private parseAnalysisResponse(content: string): any {
    const recommendations: string[] = [];
    const suggestedActions: string[] = [];
    
    const lines = content.split('\n').filter(line => line.trim());
    let currentSection = '';
    
    lines.forEach(line => {
      if (line.toLowerCase().includes('recommendation')) {
        currentSection = 'recommendations';
      } else if (line.toLowerCase().includes('action') || line.toLowerCase().includes('suggest')) {
        currentSection = 'actions';
      } else if (line.match(/^[\d\-\*•]/)) {
        const match = line.match(/^[\d\-\*•]\s*(.+)/);
        if (match) {
          if (currentSection === 'recommendations') {
            recommendations.push(match[1].trim());
          } else if (currentSection === 'actions') {
            suggestedActions.push(match[1].trim());
          }
        }
      }
    });
    
    return {
      analysis: content.split('\n\n')[0] || content,
      recommendations: recommendations.length > 0 ? recommendations : ['Monitor performance closely', 'Test new creative variations'],
      suggestedActions: suggestedActions.length > 0 ? suggestedActions : ['Review campaign settings'],
    };
  }
}

export const aiService = new AIService();
export default aiService;

