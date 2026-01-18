
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function verifyAIStudio() {
    console.log('Verifying AI Studio & Shopify Integration...');

    // Dynamic import to ensure process.env is populated first
    const { newsletterGeneratorService } = await import('../src/services/newsletter-generator.service');
    const { shopifyService } = await import('../src/services/shopify.service');

    try {
        // 1. Fetch real products first to get an ID
        console.log('Fetching products from Shopify...');
        const products = await shopifyService.getProducts(1);

        if (products.length === 0) {
            console.error('FAILED: No products found in store to test with.');
            return;
        }

        const testProduct = products[0];
        console.log(`Testing with product: ${testProduct.title} (ID: ${testProduct.id})`);

        // 2. Generate newsletter using this real product
        console.log('\nGenerating newsletter with real product data...');
        const result = await newsletterGeneratorService.generateNewsletter({
            campaignType: 'product_launch',
            productIds: [testProduct.id.toString()],
            model: 'google/gemini-pro', // Using default/available model
            tone: 'friendly'
        });

        console.log('\nSUCCESS: Newsletter Generated!');
        console.log('Subject:', result.subject);
        console.log('\nGenerated Content includes product name?', result.htmlBody.includes(testProduct.title) || result.textBody.includes(testProduct.title));

    } catch (error) {
        console.error('ERROR during verification:', error);
    }
}

verifyAIStudio();
