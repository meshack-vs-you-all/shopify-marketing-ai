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
