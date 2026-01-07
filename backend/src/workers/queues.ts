import { Queue } from 'bullmq';

export const EMAIL_QUEUE_NAME = 'email-sending';

// Parse REDIS_URL to extract connection details
const parseRedisUrl = (url: string) => {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port || '6379')
  };
};

const redisConnection = process.env.REDIS_URL
  ? parseRedisUrl(process.env.REDIS_URL)
  : { host: process.env.REDIS_HOST || 'localhost', port: parseInt(process.env.REDIS_PORT || '6379') };

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection
});
