import { Queue } from 'bullmq';

export const EMAIL_QUEUE_NAME = 'email-sending';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});
