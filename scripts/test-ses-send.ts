import 'dotenv/config'; // Load .env
import { emailService } from '../backend/src/services/email.service';
import { logger } from '../backend/src/utils/logger';

// Mock logger to see output in console directly if utils/logger is complex
logger.info = console.log;
logger.error = console.error;
logger.warn = console.warn;

async function testSend() {
    console.log('📧 Sending Test Email via SES...');

    const testRecipient = 'success@simulator.amazonses.com'; // AWS SES Simulator Success Address

    try {
        const result = await emailService.sendMarketingEmail({
            to: testRecipient,
            fromEmail: process.env.SES_FROM_EMAIL || 'marketing@example.com',
            subject: 'SES Integration Verification Test',
            htmlBody: '<h1>Integration Works!</h1><p>This is a test email from the local development environment.</p>',
            textBody: 'Integration Works! This is a test email.'
        });

        if (result.success) {
            console.log('\n✅ Email Sent Successfully!');
            console.log(`   Message ID: ${result.messageId}`);
            console.log(`   Recipient: ${testRecipient}`);
        } else {
            console.error('\n❌ Email Send Failed.');
            console.error(`   Error: ${result.error}`);
        }
    } catch (err) {
        console.error('\n❌ Unexpected Error:', err);
    }
}

testSend();
