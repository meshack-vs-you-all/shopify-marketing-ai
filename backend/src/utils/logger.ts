import winston from 'winston';
import { randomUUID } from 'crypto';

// Correlation ID storage (using AsyncLocalStorage would be better for real apps)
let currentCorrelationId: string | null = null;

export const setCorrelationId = (id?: string) => {
  currentCorrelationId = id || randomUUID();
  return currentCorrelationId;
};

export const getCorrelationId = () => currentCorrelationId;

export const clearCorrelationId = () => {
  currentCorrelationId = null;
};

// Production format: pure JSON for log aggregators
const productionFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
  winston.format.errors({ stack: true }),
  winston.format((info) => {
    if (currentCorrelationId) {
      info.correlationId = currentCorrelationId;
    }
    return info;
  })(),
  winston.format.json()
);

// Development format: human-readable with colors
const developmentFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, correlationId, ...meta }) => {
    let msg = `${timestamp} [${level}]`;
    if (correlationId) msg += ` [${correlationId.substring(0, 8)}]`;
    msg += `: ${message}`;
    if (Object.keys(meta).length > 0 && meta.service === undefined) {
      msg += ` ${JSON.stringify(meta)}`;
    }
    return msg;
  })
);

const isProduction = process.env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: isProduction ? productionFormat : productionFormat, // Use JSON in both for consistency
  defaultMeta: { service: 'shopify-marketing-ai' },
  transports: [
    // Console: use human-readable in dev, JSON in prod
    new winston.transports.Console({
      format: isProduction ? productionFormat : developmentFormat,
    }),
    // Write all logs with level 'error' and below to error.log
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    // Write all logs to combined.log (always JSON for parsing)
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: productionFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Create logs directory if it doesn't exist
import { existsSync, mkdirSync } from 'fs';
if (!existsSync('logs')) {
  mkdirSync('logs');
}
