import '@shopify/shopify-api/adapters/node';
import { shopifyApi, LATEST_API_VERSION } from '@shopify/shopify-api';
import { REQUIRED_WEBHOOKS } from '../src/api/shopify-webhooks.routes';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.join(__dirname, '../.env') });

async function registerWebhooks() {
    console.log('🚀 Registering Shopify Webhooks...');

    const API_URL = process.env.API_URL;
    const STORE_URL = process.env.SHOPIFY_STORE_URL;
    const ACCESS_TOKEN = process.env.SHOPIFY_ACCESS_TOKEN;

    if (!API_URL || !STORE_URL || !ACCESS_TOKEN) {
        console.error('❌ Missing environment variables: API_URL, SHOPIFY_STORE_URL, or SHOPIFY_ACCESS_TOKEN');
        process.exit(1);
    }

    // Initialize simplified client for webhook registration
    const shopify = shopifyApi({
        apiKey: process.env.SHOPIFY_API_KEY || 'key',
        apiSecretKey: process.env.SHOPIFY_API_SECRET || 'secret',
        scopes: [],
        hostName: API_URL.replace('https://', ''),
        apiVersion: LATEST_API_VERSION,
        isEmbeddedApp: false,
    });

    const session = shopify.session.customAppSession(STORE_URL);
    session.accessToken = ACCESS_TOKEN;

    const client = new shopify.clients.Rest({ session });

    // Iterate and register
    for (const topic of REQUIRED_WEBHOOKS) {
        const address = `${API_URL}/api/webhooks/shopify/${topic}`;
        console.log(`\nRegistering ${topic} -> ${address}`);

        try {
            const webhook: any = {
                topic: topic,
                address: address,
                format: 'json',
            };

            // Note: In older API versions this endpoint might differ or require wrapping in { webhook: ... }
            // For 2024+ versions, POST /admin/api/ver/webhooks.json with { webhook: ... }

            const response = await client.post({
                path: 'webhooks',
                data: { webhook },
                type: 'application/json',
            });

            console.log(`✅ Success: ${topic}`, (response.body as any).webhook?.id);
        } catch (error: any) {
            // Check if already exists error
            if (error.response?.body?.errors?.address?.includes('for this topic has already been taken')) {
                console.log(`⚠️ Already registered: ${topic}`);
            } else {
                console.error(`❌ Failed: ${topic}`, JSON.stringify(error.response?.body || error.message));
            }
        }
    }

    console.log('\n✨ Webhook Registration Complete');
}

registerWebhooks();
