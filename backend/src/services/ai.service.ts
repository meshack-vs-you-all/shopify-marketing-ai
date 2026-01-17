/**
 * Multi-Model AI Service
 * 
 * Unified AI service that supports multiple providers (OpenRouter, Gemini)
 * with task-based model routing, cost controls, and fallback chains.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../utils/logger';
import {
  ImageGenerationProvider,
  ImageGenerationParams,
  PlaceholderProvider,
  StabilityAIProvider,
} from './ai/image-generation';
import {
  AIProvider,
  GenerationRequest,
  GenerationResponse,
  TaskType,
} from './ai';
import {
  OpenRouterProvider,
  createOpenRouterProvider,
} from './ai/openrouter.provider';
import {
  getTaskConfig,
  getModelChain,
  classifyTask,
} from './ai/task-router.config';
import {
  costController,
  UsageRecord,
} from './ai/cost-controller';

/**
 * AI Content Generation Service
 * 
 * Supports multi-model architecture via OpenRouter while maintaining
 * backward compatibility with direct Gemini integration.
 */
class AIService {
  private genAI!: GoogleGenerativeAI;
  private legacyModel: string = process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
  private imageProvider!: ImageGenerationProvider;

  // Multi-model providers
  private openRouterProvider: OpenRouterProvider | null = null;
  private useOpenRouter: boolean = false;

  constructor() {
    // Initialize legacy Gemini provider
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.genAI = new GoogleGenerativeAI(geminiApiKey);
      logger.info('Google Gemini service initialized (legacy provider).');
    } else {
      logger.warn('GEMINI_API_KEY not found. Legacy Gemini provider disabled.');
    }

    // Initialize OpenRouter provider
    this.openRouterProvider = createOpenRouterProvider();
    if (this.openRouterProvider) {
      logger.info('OpenRouter provider initialized.');
    }

    // Determine which provider to use by default
    const aiProvider = process.env.AI_PROVIDER || 'gemini';
    this.useOpenRouter = aiProvider === 'openrouter' && this.openRouterProvider !== null;
    logger.info(`Default AI provider: ${this.useOpenRouter ? 'OpenRouter' : 'Gemini'}`);

    // Initialize Image Generation Provider
    this.initializeImageProvider();
  }

  private initializeImageProvider() {
    const providerType = process.env.IMAGE_GENERATION_PROVIDER || 'placeholder';
    logger.info(`Initializing image generation with provider: ${providerType}`);

    switch (providerType) {
      case 'stability':
        const stabilityApiKey = process.env.STABILITY_API_KEY;
        if (stabilityApiKey) {
          this.imageProvider = new StabilityAIProvider(stabilityApiKey);
          logger.info('Stability AI provider initialized.');
        } else {
          logger.error('STABILITY_API_KEY is missing. Falling back to placeholder provider.');
          this.imageProvider = new PlaceholderProvider();
        }
        break;
      case 'placeholder':
      default:
        this.imageProvider = new PlaceholderProvider();
        break;
    }
  }

  /**
   * Generate content using the multi-model architecture
   * Falls back through model chain if primary fails
   */
  private async generateWithFallback(params: {
    prompt: string;
    systemPrompt?: string;
    taskType: TaskType;
    model?: string;
    temperature?: number;
    maxTokens?: number;
  }): Promise<GenerationResponse> {
    const config = getTaskConfig(params.taskType);
    const modelChain = params.model ? [params.model] : getModelChain(params.taskType);

    const request: GenerationRequest = {
      prompt: params.prompt,
      systemPrompt: params.systemPrompt,
      model: modelChain[0],
      temperature: params.temperature ?? config.temperature,
      maxTokens: params.maxTokens ?? config.maxTokens,
    };

    // Check budget before proceeding
    const budget = await costController.checkBudget();
    if (!budget.allowed) {
      throw new Error(`AI budget exceeded: ${budget.warning}`);
    }

    // Try each model in the chain
    let lastError: Error | null = null;

    for (const model of modelChain) {
      try {
        request.model = model;

        if (this.useOpenRouter && this.openRouterProvider) {
          const response = await this.openRouterProvider.generate(request);

          // Record usage for cost tracking
          if (response.cost) {
            await costController.recordUsage({
              model: response.model,
              taskType: params.taskType,
              promptTokens: response.usage.promptTokens,
              completionTokens: response.usage.completionTokens,
              cost: response.cost.totalCost,
              timestamp: new Date(),
            });
          }

          return response;
        } else {
          // Fall back to legacy Gemini
          return await this.generateWithGemini(request);
        }
      } catch (error: any) {
        lastError = error;
        logger.warn(`Model ${model} failed, trying next in chain`, {
          error: error.message,
          taskType: params.taskType
        });

        // If this is a rate limit or temporary error, try next model
        if (error.response?.status === 429 || error.response?.status === 503) {
          continue;
        }

        // For other errors, still try fallback if available
        continue;
      }
    }

    // All models failed
    throw lastError || new Error('All models in fallback chain failed');
  }

  /**
   * Generate using legacy Gemini provider
   */
  private async generateWithGemini(request: GenerationRequest): Promise<GenerationResponse> {
    if (!this.genAI) {
      throw new Error('Gemini provider not configured');
    }

    const startTime = Date.now();
    const modelName = request.model.includes('/')
      ? request.model.split('/').pop()! // Extract model name from openrouter format
      : request.model;

    const model = this.genAI.getGenerativeModel({ model: this.legacyModel });

    const fullPrompt = request.systemPrompt
      ? `${request.systemPrompt}\n\n${request.prompt}`
      : request.prompt;

    const result = await model.generateContent(fullPrompt, {
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 2048,
      }
    } as any);

    const content = result.response.text() || '';
    const latencyMs = Date.now() - startTime;

    return {
      content,
      model: this.legacyModel,
      usage: {
        promptTokens: 0, // Gemini doesn't provide token counts directly
        completionTokens: 0,
        totalTokens: 0,
      },
      finishReason: 'stop',
      latencyMs,
    };
  }

  /**
   * Generate ad copy using multi-model architecture
   */
  async generateAdCopy(params: {
    productName: string;
    productDescription: string;
    targetAudience: string;
    platform: 'meta' | 'google';
    tone?: 'professional' | 'casual' | 'luxury' | 'friendly';
    numberOfVariations?: number;
    model?: string;
  }): Promise<{
    headlines: string[];
    descriptions: string[];
    callToActions: string[];
  }> {
    try {
      const prompt = this.buildAdCopyPrompt(params);
      const systemPrompt = 'You are an expert copywriter specializing in high-converting ad copy for e-commerce. Generate compelling, action-oriented ad copy that drives clicks and conversions.';

      const response = await this.generateWithFallback({
        prompt,
        systemPrompt,
        taskType: 'marketing_copy',
        model: params.model,
        temperature: 0.8,
        maxTokens: 1000,
      });

      return this.parseAdCopyResponse(response.content, params.numberOfVariations || 3);
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
    model?: string;
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

      const systemPrompt = 'You are an expert e-commerce copywriter specializing in product descriptions that convert visitors into customers.';

      const response = await this.generateWithFallback({
        prompt,
        systemPrompt,
        taskType: 'product_description',
        model: params.model,
        temperature: 0.7,
        maxTokens: 500,
      });

      return response.content;
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
    model?: string;
    customPrompt?: string;
    context?: string;
  }): Promise<string[]> {
    try {
      const prompt = this.buildEmailSubjectPrompt(params);
      const systemPrompt = 'You are an expert email marketer. Generate compelling subject lines that maximize open rates.';

      const response = await this.generateWithFallback({
        prompt,
        systemPrompt,
        taskType: 'email_subject',
        model: params.model,
        temperature: 0.9,
        maxTokens: 300,
      });

      return this.parseListResponse(response.content, params.numberOfVariations || 5);
    } catch (error: any) {
      console.error('CRITICAL AI ERROR:', error);
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
    model?: string;
    customPrompt?: string;
    context?: string;
  }): Promise<string> {
    try {
      const prompt = this.buildEmailBodyPrompt(params);
      const systemPrompt = 'You are an expert email copywriter. Write engaging, conversion-focused email content.';

      const response = await this.generateWithFallback({
        prompt,
        systemPrompt,
        taskType: 'email_body',
        model: params.model,
        temperature: 0.8,
        maxTokens: 800,
      });

      return response.content;
    } catch (error: any) {
      console.error('CRITICAL AI ERROR (BODY):', error);
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
    model?: string;
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

      const systemPrompt = 'You are a marketing analytics expert. Provide data-driven recommendations for campaign optimization.';

      const response = await this.generateWithFallback({
        prompt,
        systemPrompt,
        taskType: 'performance_analysis',
        model: params.model,
        temperature: 0.6,
        maxTokens: 1000,
      });

      return this.parseAnalysisResponse(response.content);
    } catch (error: any) {
      logger.error('Error analyzing performance', { error: error.message, params });
      throw new Error(`Failed to analyze performance: ${error.message}`);
    }
  }

  /**
   * Generate an image using the configured provider.
   */
  async generateImage(params: ImageGenerationParams): Promise<string> {
    try {
      if (!this.imageProvider) {
        throw new Error('Image generation provider is not initialized.');
      }
      return await this.imageProvider.generate(params);
    } catch (error: any) {
      logger.error('Error generating image via provider', { error: error.message, params });
      // Fallback to placeholder if the provider fails
      try {
        return await new PlaceholderProvider().generate(params);
      } catch (fallbackError: any) {
        logger.error('Fallback placeholder provider also failed', { error: fallbackError.message });
        // As a final resort, return a hardcoded URL
        return 'https://placehold.co/512x512/ff0000/ffffff?text=Error';
      }
    }
  }

  /**
   * Get available models from OpenRouter
   */
  async getAvailableModels() {
    if (this.openRouterProvider) {
      return await this.openRouterProvider.listModels();
    }
    return [];
  }

  /**
   * Check if OpenRouter is configured and healthy
   */
  async healthCheck(): Promise<{ openrouter: boolean; gemini: boolean }> {
    const openrouter = this.openRouterProvider
      ? await this.openRouterProvider.healthCheck()
      : false;
    const gemini = !!this.genAI;
    return { openrouter, gemini };
  }

  /**
   * Get current usage summary
   */
  async getUsageSummary() {
    return costController.getUsageSummary();
  }

  /**
   * Get current budget status
   */
  async getBudgetStatus() {
    return costController.checkBudget();
  }

  // ============================================
  // Private helper methods
  // ============================================

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

    if (params.context) prompt += `\nContext/Topic: ${params.context}`;
    if (params.productName) prompt += `\nProduct: ${params.productName}`;
    if (params.discount) prompt += `\nDiscount: ${params.discount}% off`;
    if (params.customPrompt) prompt += `\n\nCustom Instructions: ${params.customPrompt}`;

    prompt += '\n\nMake them compelling, personalized, and optimized for open rates. Return as a numbered list.';

    return prompt;
  }

  private buildEmailBodyPrompt(params: any): string {
    let prompt = `Write an email body for a ${params.emailType} email.\n\nSubject: ${params.subject}\n`;

    if (params.context) prompt += `Context/Topic: ${params.context}\n`;
    if (params.customerName) prompt += `Recipient: ${params.customerName}\n`;
    if (params.productName) prompt += `Product: ${params.productName}\n`;
    if (params.productDescription) prompt += `Product Description: ${params.productDescription}\n`;
    if (params.discount) prompt += `Discount: ${params.discount}% off\n`;
    if (params.customPrompt) prompt += `\nCustom Instructions: ${params.customPrompt}\n`;

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
