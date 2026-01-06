import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Configuration from environment
const GLOBAL_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 min default
const GLOBAL_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX || '100');
const API_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_API_MAX || '50');
const AI_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_AI_MAX || '20');

// Key generator: Use user ID if authenticated, otherwise IP
const keyGenerator = (req: Request): string => {
  // Check for authenticated user (assuming JWT middleware sets req.user)
  const userId = (req as any).user?.userId;
  if (userId) return `user:${userId}`;
  return req.ip || 'unknown';
};

// Skip health checks from rate limiting
const skipHealthChecks = (req: Request): boolean => {
  return req.path === '/health' || req.path === '/api/health';
};

export const rateLimiter = rateLimit({
  windowMs: GLOBAL_WINDOW_MS,
  max: GLOBAL_MAX_REQUESTS,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator,
  skip: skipHealthChecks,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later.',
      retryAfter: Math.ceil(GLOBAL_WINDOW_MS / 1000),
    });
  },
});

// Stricter rate limiter for API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: GLOBAL_WINDOW_MS,
  max: API_MAX_REQUESTS,
  keyGenerator,
  message: 'Too many API requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiter for AI endpoints (cost control)
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: AI_MAX_REQUESTS,
  keyGenerator,
  message: 'AI request limit exceeded. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
