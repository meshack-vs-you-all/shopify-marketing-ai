import dotenv from 'dotenv';
// Load environment variables immediately
dotenv.config();

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import { enforceHttps, securityHeaders } from './middleware/security';
import { validateEnv } from './config/validateEnv';
import apiRoutes from './api/routes';
import './workers/email.worker'; // Initialize email worker

// Validate environment variables before starting
validateEnv();

const app: Express = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// HTTPS enforcement (first - before any other middleware)
app.use(enforceHttps);

// Security middleware
app.use(helmet());
app.use(securityHeaders);
app.use(cors({
  origin: [
    process.env.CORS_ORIGIN || '',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'https://marketing.glowifybabystores.com',
    'http://localhost:3001'
  ].filter(Boolean),
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimiter);

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });
  next();
});

// Health check - detailed
app.get('/health', async (req, res) => {
  const health: {
    status: 'ok' | 'degraded';
    timestamp: string;
    uptime: number;
    services: {
      database: 'connected' | 'disconnected';
      redis: 'connected' | 'disconnected';
    };
  } = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'disconnected',
      redis: 'disconnected'
    }
  };

  // Check database
  try {
    const { prisma } = await import('./config/database');
    await prisma.$queryRaw`SELECT 1`;
    health.services.database = 'connected';
  } catch {
    health.status = 'degraded';
  }

  // Check Redis (optional, only if ioredis is initialized elsewhere)
  try {
    const Redis = (await import('ioredis')).default;
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      connectTimeout: 2000,
      maxRetriesPerRequest: 1
    });
    await redis.ping();
    health.services.redis = 'connected';
    await redis.quit();
  } catch {
    health.status = 'degraded';
  }

  res.status(health.status === 'ok' ? 200 : 503).json(health);
});

// API routes
app.use('/api', apiRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server - bind to 0.0.0.0 for Railway/Docker compatibility
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
