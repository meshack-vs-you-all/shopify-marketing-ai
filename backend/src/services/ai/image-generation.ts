
import { logger } from '../../utils/logger';
import axios from 'axios';

// 1. Interface for any image generation provider
export interface ImageGenerationProvider {
  generate(params: ImageGenerationParams): Promise<string>;
}

export interface ImageGenerationParams {
  prompt: string;
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:5';
  negativePrompt?: string;
  stylePreset?: string;
  model?: string; // Optional model override
}

// Helper to extract URL from markdown or text
function extractUrl(text: string): string | null {
  const urlMatch = text.match(/https?:\/\/[^\s\)]+/);
  return urlMatch ? urlMatch[0] : null;
}

// --- PROVIDERS ---

// 2. Placeholder Provider (Default)
export class PlaceholderProvider implements ImageGenerationProvider {
  async generate(params: ImageGenerationParams): Promise<string> {
    const dimensions = {
      '1:1': { width: 512, height: 512 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '4:5': { width: 512, height: 640 },
    };
    const { width, height } = dimensions[params.aspectRatio || '1:1'];

    const text = `AI Image (${params.prompt.substring(0, 20)}...)`;
    const placeholderUrl = `https://placehold.co/${width}x${height}/1a1a2e/eee?text=${encodeURIComponent(text)}`;

    logger.info('Using PlaceholderProvider for image generation.', { prompt: params.prompt });
    return placeholderUrl;
  }
}

// 3. Stability AI Provider
export class StabilityAIProvider implements ImageGenerationProvider {
  private apiKey: string;
  private apiHost: string = 'https://api.stability.ai';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Stability AI API key is required.');
    }
    this.apiKey = apiKey;
  }

  async generate(params: ImageGenerationParams): Promise<string> {
    logger.info('Generating image with Stability AI...', { prompt: params.prompt });

    const response = await axios.post(
      `${this.apiHost}/v1/generation/stable-diffusion-v1-6/text-to-image`,
      {
        text_prompts: [
          { text: params.prompt, weight: 1 },
          { text: params.negativePrompt || 'blurry, bad quality, ugly, deformed', weight: -1 },
        ],
        cfg_scale: 7,
        height: this.getDimension(params.aspectRatio, 'height'),
        width: this.getDimension(params.aspectRatio, 'width'),
        steps: 30,
        samples: 1,
        style_preset: params.stylePreset || 'photographic',
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }
    );

    const artifact = response.data.artifacts[0];
    // Note: This returns a base64 string. For real use, you'd upload this to a cloud storage (e.g., S3)
    // and return the URL. For now, we return the base64 data URI.
    const imageUrl = `data:image/png;base64,${artifact.base64}`;
    logger.info(`Stability AI image generated successfully (returning data URI).`);
    return imageUrl;
  }

  private getDimension(aspectRatio: ImageGenerationParams['aspectRatio'] = '1:1', side: 'width' | 'height'): number {
    const dimensions = {
      '1:1': { width: 512, height: 512 },
      '16:9': { width: 1024, height: 576 },
      '9:16': { width: 576, height: 1024 },
      '4:5': { width: 512, height: 640 },
    };
    return dimensions[aspectRatio][side];
  }
}

// 4. OpenRouter Provider
export class OpenRouterImageProvider implements ImageGenerationProvider {
  private apiKey: string;
  private apiHost: string = 'https://openrouter.ai/api/v1';
  private siteUrl: string;
  private siteName: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenRouter API key is required.');
    }
    this.apiKey = apiKey;
    this.siteUrl = process.env.APP_URL || 'https://shopify-marketing-ai.app';
    this.siteName = process.env.APP_NAME || 'Shopify Marketing AI';
  }

  async generate(params: ImageGenerationParams): Promise<string> {
    logger.info('Generating image with OpenRouter...', { prompt: params.prompt, model: params.model });

    // Use a widely available model if not specified.
    const model = params.model || 'openai/gpt-5-image-mini';

    try {
      // OpenRouter image generation uses /chat/completions for multimodal models
      const response = await axios.post(
        `${this.apiHost}/chat/completions`,
        {
          model: model,
          messages: [
            { role: 'user', content: params.prompt }
          ],
          max_tokens: 1000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': this.siteUrl,
            'X-Title': this.siteName,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      // Check for structured image response (e.g. GPT-5 Image models)
      if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        const message = data.choices[0].message;

        // Custom OpenRouter/OpenAI Image format in chat completion
        if (message.images && Array.isArray(message.images) && message.images.length > 0) {
          const imageObj = message.images[0];
          if (imageObj.image_url && imageObj.image_url.url) {
            logger.info('OpenRouter image generation successful (structured field)');
            return imageObj.image_url.url;
          }
        }

        // Fallback: Check content string for markdown or raw URL
        const content = message.content;
        if (content) {
          const url = extractUrl(content);
          if (url) {
            logger.info('OpenRouter image generation successful (extracted from content)');
            return url;
          }
        }

        logger.warn('No URL found in image generation response', { response: 'HIDDEN_BASE64' });
        return `https://placehold.co/512x512/ff0000/ffffff?text=${encodeURIComponent('Generation Failed')}`;
      } else {
        throw new Error('No content returned from OpenRouter');
      }

    } catch (error: any) {
      logger.error('OpenRouter image generation failed', {
        error: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }

  private getResolution(aspectRatio: ImageGenerationParams['aspectRatio'] = '1:1'): string {
    return '1024x1024';
  }
}
