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
  dryRun?: boolean; // If true, do not send, just verify logic
}

export interface SendResult {
  messageId: string;
  provider: 'SES' | 'SMTP' | 'DRY-RUN';
  success: boolean;
  error?: string;
}

export interface ConnectionStatus {
  ses: boolean;
  smtp: boolean;
  details?: any;
}

/**
 * SES Email Service with Robust SMTP Fallback
 * Default: Try SES
 * Fallback: Try SMTP (Gmail/Google Workspace)
 */
class EmailService {
  private sesClient: SESClient | null = null;
  private defaultFromEmail: string;
  private smtpTransporter: nodemailer.Transporter | null = null;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';

    // 1. Initialize SES (Primary)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
    } else {
      logger.warn('AWS SES credentials missing. SES will be unavailable.');
    }

    this.defaultFromEmail = process.env.SES_FROM_EMAIL || process.env.SMTP_FROM_EMAIL || '';

    // 2. Initialize SMTP (Fallback)
    if (process.env.SMTP_HOST) {
      this.smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
  }

  /**
   * Verify connections to configured providers
   */
  async verifyConnection(): Promise<ConnectionStatus> {
    const status: ConnectionStatus = { ses: false, smtp: false };

    // Check SES
    if (this.sesClient) {
      try {
        // SES doesn't have a simple "ping", but we assume initialized client is 'ready' 
        // if credentials were valid format. A real check would send a test email, 
        // but for now we mark true if client exists.
        status.ses = true;
      } catch (err) {
        logger.error('SES check failed', err);
      }
    }

    // Check SMTP
    if (this.smtpTransporter) {
      try {
        await this.smtpTransporter.verify();
        status.smtp = true;
        logger.info('SMTP connection verified');
      } catch (err: any) {
        logger.error('SMTP verify failed', err);
        status.details = err.message;
      }
    }

    return status;
  }

  /**
   * Send a marketing email with fallback logic
   */
  async sendMarketingEmail(options: EmailOptions): Promise<SendResult> {
    const from = options.fromEmail || this.defaultFromEmail;

    if (!from) {
      return { success: false, messageId: '', provider: 'SES', error: 'From email address is required' };
    }

    // --- DRY RUN ---
    if (options.dryRun === true) {
      logger.info(`[DRY-RUN] Would send email to: ${options.to} via SES/SMTP`);
      return {
        success: true,
        messageId: 'dry-run-id',
        provider: 'DRY-RUN'
      };
    }

    // --- ATTEMPT 1: SES (Primary - Switched by Request) ---
    if (this.sesClient) {
      try {
        const result = await this.sendViaSES(options, from);
        return {
          success: true,
          messageId: result.MessageId || 'unknown',
          provider: 'SES'
        };
      } catch (sesError: any) {
        logger.warn('Failed to send via SES (Primary). Attempting fallback to SMTP...', { error: sesError.message });
        // Proceed to fallback...
      }
    }

    // --- ATTEMPT 2: SMTP (Fallback) ---
    if (this.smtpTransporter) {
      try {
        const info = await this.sendViaSMTP(options, from);
        return {
          success: true,
          messageId: info.messageId,
          provider: 'SMTP'
        };
      } catch (smtpError: any) {
        logger.error('Failed to send via SMTP (Fallback)', { error: smtpError.message });

        return {
          success: false,
          messageId: '',
          provider: 'SES', // default to SES for error reporting context if both fail
          error: `SES Failed. SMTP Failed: ${smtpError.message}`
        };
      }
    }

    // If we reach here, neither worked
    return {
      success: false,
      messageId: '',
      provider: 'SES', // defaulted
      error: 'No email providers configured or all failed.'
    };
  }

  /**
   * Helper: Send via AWS SES
   */
  private async sendViaSES(options: EmailOptions, from: string) {
    if (!this.sesClient) throw new Error('SES Client not initialized');

    // Build raw message using Nodemailer (it's good at MIME)
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

    const command = new SendRawEmailCommand({
      RawMessage: { Data: Buffer.from(rawMessage) },
      Source: from,
    });

    return await this.sesClient.send(command);
  }

  /**
   * Helper: Send via I SMTP
   */
  private async sendViaSMTP(options: EmailOptions, from: string) {
    if (!this.smtpTransporter) throw new Error('SMTP Config missing');

    const mailOptions = {
      from: from,
      to: options.to,
      subject: options.subject,
      html: options.htmlBody,
      text: options.textBody || this.stripHtml(options.htmlBody),
      attachments: options.attachments
    };

    return await this.smtpTransporter.sendMail(mailOptions);
  }

  /**
   * Simple HTML stripper for fallback text body
   */
  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }
}

export const emailService = new EmailService();
export default emailService;
