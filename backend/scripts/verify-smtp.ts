import dotenv from 'dotenv';
import emailService from '../src/services/email.service';
import { logger } from '../src/utils/logger';

// Load env vars
dotenv.config();

async function testSMTP() {
    console.log('Testing SMTP Configuration...');
    console.log('Host:', process.env.SMTP_HOST);
    console.log('User:', process.env.SMTP_USER);

    try {
        const status = await emailService.verifyConnection();
        console.log('Connection Status:', status);

        if (!status.smtp) {
            console.error('SMTP Connection Failed. Aborting send test.');
            process.exit(1);
        }

        console.log('Sending test email...');
        const result = await emailService.sendMarketingEmail({
            to: process.env.SMTP_FROM_EMAIL || 'test@example.com', // Send to self for safety
            subject: 'SMTP Verification Test',
            htmlBody: '<h1>It works!</h1><p>This is a test email from the local dev environment.</p>',
            textBody: 'It works! This is a test email from the local dev environment.'
        });

        console.log('Send Result:', result);
    } catch (error) {
        console.error('Test Failed:', error);
    }
}

testSMTP();
