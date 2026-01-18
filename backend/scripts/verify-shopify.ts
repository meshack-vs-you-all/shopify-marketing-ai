
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// import { shopifyService } from '../src/services/shopify.service';

async function verifyShopify() {
    console.log('Verifying Shopify Integration...');
    // Dynamic import to ensure process.env is populated first
    const { shopifyService } = await import('../src/services/shopify.service');

    console.log('Store URL:', process.env.SHOPIFY_STORE_URL ? 'Set' : 'Missing');
    console.log('Access Token:', process.env.SHOPIFY_ACCESS_TOKEN ? 'Set' : 'Missing');

    try {
        const status = await shopifyService.testConnection();
        console.log('Connection Status:', status);

        if (status.connected && !status.useMockData) {
            console.log('SUCCESS: Connected to real Shopify store!');

            console.log('Fetching sample products...');
            const products = await shopifyService.getProducts(5);
            console.log(`Retrieved ${products.length} products.`);
            if (products.length > 0) {
                console.log('Sample Product:', products[0].title);
            }
        } else {
            console.log('WARNING: Still using mock data or connection failed.');
        }
    } catch (error) {
        console.error('ERROR during verification:', error);
    }
}

verifyShopify();
