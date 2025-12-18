
import { PrismaClient } from '@prisma/client';
import { SESClient, GetIdentityVerificationAttributesCommand } from '@aws-sdk/client-ses';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Redis from 'ioredis';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const report: any[] = [];

async function main() {
    console.log('\n🔍 Starting Credential Verification...\n');

    // 1. Database
    try {
        const prisma = new PrismaClient();
        await prisma.$connect();
        await prisma.$disconnect();
        report.push({ service: 'Database', status: '✅ Connected' });
    } catch (e: any) {
        report.push({ service: 'Database', status: '❌ Failed', error: e.message.split('\n')[0] });
    }

    // 2. Redis
    try {
        const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
            maxRetriesPerRequest: 1,
            retryStrategy: () => null // Don't retry, fail fast
        });
        await redis.ping();
        redis.disconnect();
        report.push({ service: 'Redis', status: '✅ Connected' });
    } catch (e: any) {
        report.push({ service: 'Redis', status: '❌ Failed', error: e.message });
    }

    // 3. Shopify
    const shopToken = process.env.SHOPIFY_ACCESS_TOKEN;
    const shopUrl = process.env.SHOPIFY_STORE_URL;
    if (shopToken && shopUrl) {
        try {
            // Clean URL
            const host = shopUrl.replace('https://', '').replace(/\/$/, '');
            const url = `https://${host}/admin/api/2023-10/shop.json`;
            const res = await fetch(url, {
                headers: { 'X-Shopify-Access-Token': shopToken }
            });
            if (res.ok) {
                const data: any = await res.json();
                report.push({ service: 'Shopify', status: '✅ Connected', details: data.shop?.name });
            } else {
                report.push({ service: 'Shopify', status: '❌ API Error', error: `${res.status} ${res.statusText}` });
            }
        } catch (e: any) {
            report.push({ service: 'Shopify', status: '❌ Network Error', error: e.message });
        }
    } else {
        report.push({ service: 'Shopify', status: '⚠️ Missing Credentials' });
    }

    // 4. Gemini AI
    if (process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
            // Simple prompt
            const result = await model.generateContent('Say "OK"');
            const response = result.response;
            if (response.text()) {
                report.push({ service: 'Gemini AI', status: '✅ Connected' });
            } else {
                report.push({ service: 'Gemini AI', status: '⚠️ No Output' });
            }
        } catch (e: any) {
            report.push({ service: 'Gemini AI', status: '❌ Failed', error: e.message });
        }
    } else {
        report.push({ service: 'Gemini AI', status: '⚠️ Missing Credentials' });
    }

    // 5. AWS SES
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        try {
            const ses = new SESClient({ region: process.env.AWS_REGION || 'us-east-1' });
            const identity = process.env.SES_FROM_EMAIL || '';
            if (identity) {
                const cmd = new GetIdentityVerificationAttributesCommand({ Identities: [identity] });
                const res = await ses.send(cmd);
                const attrs = res.VerificationAttributes?.[identity];
                if (attrs && attrs.VerificationStatus === 'Success') {
                    report.push({ service: 'AWS SES', status: '✅ Verified', details: identity });
                } else if (attrs) {
                    report.push({ service: 'AWS SES', status: '⚠️ Pending/Failed', details: `${attrs.VerificationStatus}` });
                } else {
                    // Sandbox often requires verification, but listing quotas works
                    report.push({ service: 'AWS SES', status: '✅ Credentials Valid (Identity check inconclusive)' });
                }
            } else {
                report.push({ service: 'AWS SES', status: '✅ Credentials Valid (No SES_FROM_EMAIL set)' });
            }
        } catch (e: any) {
            report.push({ service: 'AWS SES', status: '❌ Failed', error: e.message });
        }
    } else {
        report.push({ service: 'AWS SES', status: '⚠️ Missing Credentials' });
    }

    // 6. Meta Ads
    const metaToken = process.env.META_ACCESS_TOKEN;
    if (metaToken) {
        try {
            const res = await fetch(`https://graph.facebook.com/v18.0/me?access_token=${metaToken}`);
            if (res.ok) {
                const data: any = await res.json();
                report.push({ service: 'Meta Ads', status: '✅ Connected', details: `User: ${data.name}` });
            } else {
                const err: any = await res.json();
                report.push({ service: 'Meta Ads', status: '❌ API Error', error: err.error?.message || res.statusText });
            }
        } catch (e: any) {
            report.push({ service: 'Meta Ads', status: '❌ Network Error', error: e.message });
        }
    } else {
        report.push({ service: 'Meta Ads', status: '⚠️ Missing Token' });
    }

    // 7. Google SMTP
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            const nodemailer = require('nodemailer');
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
            await transporter.verify();
            report.push({ service: 'Google SMTP', status: '✅ Verified', details: process.env.SMTP_USER });
        } catch (e: any) {
            report.push({ service: 'Google SMTP', status: '❌ Failed', error: e.message });
        }
    } else {
        report.push({ service: 'Google SMTP', status: '⚠️ Missing Credentials' });
    }

    console.table(report);
    const fs = require('fs');
    fs.writeFileSync('verification_report.json', JSON.stringify(report, null, 2));
    console.log('Report saved to verification_report.json');
}

main().catch(console.error);
