
import express from 'express';
import request from 'supertest';
import crypto from 'crypto';
import { Queue } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import shopifyWebhooksRoutes from '../src/api/shopify-webhooks.routes';
import { welcomeEmailService } from '../src/services/welcome-email.service';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';

// Load environment
dotenv.config({ path: path.join(__dirname, '../.env') });

const prisma = new PrismaClient();

// Mock Config
const SHOPIFY_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET || 'test_secret';
process.env.SHOPIFY_WEBHOOK_SECRET = SHOPIFY_SECRET;

// Setup Queue for verification
const emailQueue = new Queue('email-queue', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    }
});

async function runSimulation() {
    console.log('🚀 Starting Production Logic Simulation...\n');

    // 1. Setup Validation Server
    const app = express();
    // Use raw body for HMAC verification as expected by the route
    app.use('/api/webhooks/shopify', bodyParser.raw({ type: 'application/json' }), shopifyWebhooksRoutes);

    // 2. Test Shopify Webhook (Order Create)
    console.log('🧪 Test 1: Shopify Order Creation Webhook');
    const orderPayload = JSON.stringify({
        id: 12345,
        email: 'test@example.com',
        customer: { first_name: 'Test', last_name: 'User' }
    });
    const hmac = crypto.createHmac('sha256', SHOPIFY_SECRET).update(orderPayload).digest('base64');

    try {
        const res = await request(app)
            .post('/api/webhooks/shopify/orders/create')
            .set('X-Shopify-Topic', 'orders/create')
            .set('X-Shopify-Hmac-Sha256', hmac)
            .set('Content-Type', 'application/json')
            .send(orderPayload);

        if (res.status === 200) {
            console.log('✅ Webhook received and verified (200 OK)');
        } else {
            console.error(`❌ Webhook failed: ${res.status} - ${res.text}`);
        }

        // Verify Job in Queue
        // We might need to wait a split second for the job to be added
        await new Promise(r => setTimeout(r, 1000));
        const jobs = await emailQueue.getJobs(['waiting', 'active', 'delayed']);
        const orderJob = jobs.find(j => j.name === 'send-transactional-email' && j.data.type === 'order_confirmation');

        if (orderJob) {
            console.log('✅ Transactional Email Job Queued:', orderJob.id);
        } else {
            console.warn('⚠️ No transactional email job found (Redis might be empty or job processed already if worker running)');
        }

    } catch (e: any) {
        console.error('❌ Webhook Test Error:', e.message);
    }

    // 3. Test Drip Campaign Logic
    console.log('\n🧪 Test 2: Drip Campaign (Welcome + Follow-up)');
    // Need a dummy subscriber
    const subscriberId = 'simulated-sub-123';
    // We mock the DB call inside or just assume the service queues it.
    // Actually, `welcomeEmailService.triggerWelcomeEmail` attempts DB fetch. 
    // We should create a real dummy subscriber if we want strict testing, 
    // but the service might fail if ID doesn't exist.
    // Let's rely on unit logic: check if we can add to queue directly to verify "followUp" logic implies 2 jobs?
    // No, `triggerWelcomeEmail` is the logic we want to test.

    // Let's create a temp subscriber
    let tempSubscriber;
    try {
        const list = await prisma.list.findFirst();
        if (list) {
            tempSubscriber = await prisma.subscriber.create({
                data: {
                    email: `sim_${Date.now()}@test.com`,
                    listId: list.id,
                    status: 'SUBSCRIBED'
                }
            });
            console.log('   Created temp subscriber:', tempSubscriber.id);

            await welcomeEmailService.triggerWelcomeEmail(tempSubscriber.id, {
                listId: list.id,
                enableFollowUp: true,
                followUpDelayMs: 500 // Short delay for visibility or standard
            });

            await new Promise(r => setTimeout(r, 1000));
            const jobs2 = await emailQueue.getJobs(['waiting', 'delayed']);
            const welcomeJob = jobs2.find(j => j.name === 'send-welcome-email' && j.data.subscriberId === tempSubscriber.id && !j.data.isFollowUp);
            const followUpJob = jobs2.find(j => j.name === 'send-welcome-email' && j.data.subscriberId === tempSubscriber.id && j.data.isFollowUp);

            if (welcomeJob) console.log('✅ Immediate Welcome Email Queued');
            else console.error('❌ Immediate Welcome Email MISSING');

            if (followUpJob) console.log('✅ Follow-up Drip Email Queued (Delayed)');
            else console.error('❌ Follow-up Drip Email MISSING');

            // Cleanup
            await prisma.subscriber.delete({ where: { id: tempSubscriber.id } });

        } else {
            console.warn('⚠️ No List found in DB, skipping Drip Test integration part.');
        }

    } catch (e: any) {
        console.error('❌ Drip Test Error:', e.message);
        if (tempSubscriber) await prisma.subscriber.delete({ where: { id: tempSubscriber.id } });
    }

    console.log('\n✨ Simulation Complete');
    await prisma.$disconnect();
    await emailQueue.close();
}

runSimulation();
