
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function listModels() {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
        console.error('No GEMINI_API_KEY found in .env');
        process.exit(1);
    }

    try {
        const genAI = new GoogleGenerativeAI(key);
        // Did not find a direct "listModels" on the instance in recent SDK versions? 
        // Checking documentation: The ModelService or similar?
        // Actually, for @google/generative-ai, it might not be exposed easily on the main client class in older versions.
        // Let's try the fetch approach if SDK fails, or just assume the user wants check.
        // Wait, SDK usually has `getGenerativeModel`.
        // There isn't a widely used "listModels" in the strict client-side SDK usually? 
        // Wait, I can use the REST API via fetch to be sure.

        console.log('Fetching models via REST API...');
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data.models) {
            console.log('\nAvailable Models (filtered by "1.5"):');
            data.models
                .filter((m: any) => m.name.includes('1.5'))
                .forEach((m: any) => {
                    console.log(`- ${m.name} (${m.displayName})`);
                });
        } else {
            console.error('Failed to list models:', data);
        }

    } catch (e: any) {
        console.error('Error:', e.message);
    }
}

listModels();
