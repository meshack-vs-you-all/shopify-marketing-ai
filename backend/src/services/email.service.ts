import { SESClient, SendRawEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromEmail?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface SendResult {
  messageId: string;
  success: boolean;
  error?: string;
}

/**
 * SES Email Service
 * Handles sending emails via Amazon SES
 */
class SESService {
  private sesClient: SESClient;
  private defaultFromEmail: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';

    // Initialize SES Client
    // Credentials are automatically loaded from env vars:
    // AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
    this.sesClient = new SESClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    this.defaultFromEmail = process.env.SES_FROM_EMAIL || '';

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      logger.warn('AWS SES credentials missing. Email sending will fail.');
    }
  }

  /**
   * Send a marketing email
   */
  async sendMarketingEmail(options: EmailOptions): Promise<SendResult> {
    try {
      const from = options.fromEmail || this.defaultFromEmail;

      if (!from) {
        throw new Error('From email address is required');
      }

      // Use Nodemailer to generate the raw MIME message
      const transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'unix',
        buffer: true
      });

      const mailOptions = {
        from: from,
        to: options.to,
        cc: options.cc,
        bcc: options.bcc,
        replyTo: options.replyTo,
        subject: options.subject,
        html: options.htmlBody,
        text: options.textBody || this.stripHtml(options.htmlBody),
        attachments: options.attachments
      };

      const info = await transporter.sendMail(mailOptions);
      const rawMessage = info.message.toString();

      // Send via SES
      const command = new SendRawEmailCommand({
        RawMessage: {
          Data: Buffer.from(rawMessage)
        },
        Source: from,
        // Destinations are optional for SendRawEmail if provided in headers,
        // but explicitly providing them is good practice for logging/verification logic
        // However, standard MIME headers are usually enough for SES to route.
      });

      const response = await this.sesClient.send(command);

      logger.info('Email sent successfully', {
        messageId: response.MessageId,
        recipient: options.to
      });

      return {
        success: true,
        messageId: response.MessageId || 'unknown'
      };

    } catch (error: any) {
      logger.error('Error sending email via SES', {
        error: error.message,
        recipient: options.to,
        stack: error.stack
      });

      return {
        success: false,
        messageId: '',
        error: error.message
      };
    }
  }

  /**
   * Simple HTML stripper for fallback text body
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }
}

export const emailService = new SESService();
export default emailService;
