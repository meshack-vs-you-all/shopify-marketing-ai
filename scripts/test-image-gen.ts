
import dotenv from 'dotenv';
import path from 'path';
import { OpenRouterImageProvider } from '../backend/src/services/ai/image-generation';

// Load environment variables
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

async function main() {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        console.error('SERVER ERROR: OPENROUTER_API_KEY is not set in .env');
        process.exit(1);
    }

    console.log('Using OpenRouter API Key:', apiKey.substring(0, 10) + '...');

    const provider = new OpenRouterImageProvider(apiKey);

    console.log('Generating image with OpenRouterImageProvider...');
    try {
        const imageUrl = await provider.generate({
            prompt: 'A futuristic eco-friendly sneaker floating in a minimal studio',
            aspectRatio: '1:1',
            // model: 'openai/gpt-5-image-mini', // relying on default verification
        });

        console.log('Test Complete.');
        console.log('Result URL:', imageUrl);
    } catch (error: any) {
        console.error('FAILED: Image generation failed.');
        console.error(error.message);
        if (error.response) {
            console.error('Response data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

main().catch(console.error);
