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
  provider: 'SES_API' | 'SES_SMTP' | 'SMTP' | 'DRY-RUN' | 'NONE';
  success: boolean;
  error?: string;
}

export interface ConnectionStatus {
  sesApi: boolean;
  sesSmtp: boolean;
  smtp: boolean;
  details?: any;
}

/**
 * Email Service with robust provider fallback.
 * Priority:
 * 1. AWS SES API
 * 2. Amazon SES SMTP
 * 3. Generic SMTP (e.g., Gmail)
 */
class EmailService {
  private sesClient: SESClient | null = null;
  private sesSmtpTransporter: nodemailer.Transporter | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;
  private defaultFromEmail: string;

  constructor() {
    const region = process.env.AWS_REGION || 'us-east-1';

    // 1. Initialize SES API Client (Primary)
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.sesClient = new SESClient({
        region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      });
    } else {
      logger.warn('AWS SES API credentials missing. SES API will be unavailable.');
    }

    // 2. Initialize SES SMTP Transporter (Secondary)
    if (process.env.SES_SMTP_HOST && process.env.SES_SMTP_USER && process.env.SES_SMTP_PASS) {
        const port = parseInt(process.env.SES_SMTP_PORT || '587');
        this.sesSmtpTransporter = nodemailer.createTransport({
            host: process.env.SES_SMTP_HOST,
            port: port,
            secure: port === 465, // true for 465, false for other ports like 587 (STARTTLS)
            auth: {
                user: process.env.SES_SMTP_USER,
                pass: process.env.SES_SMTP_PASS
            }
        });
    } else {
        logger.info('Amazon SES SMTP credentials missing. SES SMTP will be unavailable.');
    }

    // 3. Initialize Generic SMTP Transporter (Fallback)
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      const port = parseInt(process.env.SMTP_PORT || '587');
      this.smtpTransporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    } else {
        logger.info('Generic SMTP credentials missing. Fallback SMTP will be unavailable.');
    }

    this.defaultFromEmail = process.env.SES_FROM_EMAIL || process.env.SMTP_USER || '';
  }

  async verifyConnection(): Promise<ConnectionStatus> {
    const status: ConnectionStatus = { sesApi: false, sesSmtp: false, smtp: false };

    if (this.sesClient) {
        status.sesApi = true; // Assuming client initializes if creds are set
    }

    if (this.sesSmtpTransporter) {
        try {
            await this.sesSmtpTransporter.verify();
            status.sesSmtp = true;
            logger.info('SES SMTP connection verified');
        } catch (err: any) {
            logger.error('SES SMTP verify failed', err.message);
        }
    }

    if (this.smtpTransporter) {
      try {
        await this.smtpTransporter.verify();
        status.smtp = true;
        logger.info('Generic SMTP connection verified');
      } catch (err: any) {
        logger.error('Generic SMTP verify failed', err.message);
        status.details = err.message;
      }
    }

    return status;
  }

  async sendMarketingEmail(options: EmailOptions): Promise<SendResult> {
    const from = options.fromEmail || this.defaultFromEmail;
    if (!from) {
      return { success: false, messageId: '', provider: 'NONE', error: 'From email address is required' };
    }

    if (options.dryRun === true) {
      logger.info(`[DRY-RUN] Would send email to: ${options.to}`);
      return { success: true, messageId: 'dry-run-id', provider: 'DRY-RUN' };
    }

    // --- ATTEMPT 1: SES API ---
    if (this.sesClient) {
      try {
        const result = await this.sendViaSESAPI(options, from);
        return { success: true, messageId: result.MessageId || 'unknown', provider: 'SES_API' };
      } catch (error: any) {
        logger.warn('Failed to send via SES API. Falling back...', { error: error.message });
      }
    }

    // --- ATTEMPT 2: SES SMTP ---
    if (this.sesSmtpTransporter) {
        try {
            const info = await this.sendViaTransporter(options, from, this.sesSmtpTransporter);
            return { success: true, messageId: info.messageId, provider: 'SES_SMTP' };
        } catch (error: any) {
            logger.warn('Failed to send via SES SMTP. Falling back...', { error: error.message });
        }
    }

    // --- ATTEMPT 3: Generic SMTP ---
    if (this.smtpTransporter) {
      try {
        const info = await this.sendViaTransporter(options, from, this.smtpTransporter);
        return { success: true, messageId: info.messageId, provider: 'SMTP' };
      } catch (error: any) {
        logger.error('Failed to send via Generic SMTP', { error: error.message });
        return { success: false, messageId: '', provider: 'NONE', error: `All email providers failed. Final error: ${error.message}` };
      }
    }

    return { success: false, messageId: '', provider: 'NONE', error: 'No email providers configured or all failed.' };
  }

  private async sendViaSESAPI(options: EmailOptions, from: string) {
    if (!this.sesClient) throw new Error('SES Client not initialized');
    const rawMessage = await this.buildRawMessage(options, from);
    const command = new SendRawEmailCommand({ RawMessage: { Data: Buffer.from(rawMessage) }, Source: from });
    return await this.sesClient.send(command);
  }

  private async sendViaTransporter(options: EmailOptions, from: string, transporter: nodemailer.Transporter) {
    const mailOptions = {
      from,
      to: options.to,
      cc: options.cc,
      bcc: options.bcc,
      replyTo: options.replyTo,
      subject: options.subject,
      html: options.htmlBody,
      text: options.textBody || this.stripHtml(options.htmlBody),
      attachments: options.attachments,
    };
    return await transporter.sendMail(mailOptions);
  }

  private async buildRawMessage(options: EmailOptions, from: string): Promise<string> {
      const transporter = nodemailer.createTransport({ streamTransport: true, newline: 'unix', buffer: true });
      const mailOptions = {
        from,
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
    return info.message.toString();
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>?/gm, '');
  }
}

export const emailService = new EmailService();
export default emailService;
