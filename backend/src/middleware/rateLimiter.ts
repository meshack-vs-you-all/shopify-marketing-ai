import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      error: 'Too many requests',
      message: 'Please try again later.',
    });
  },
});

// Stricter rate limiter for API endpoints
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many API requests, please try again later.',
});

// Very strict rate limiter for AI endpoints (cost control)
export const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit AI requests to 20 per hour
  message: 'AI request limit exceeded. Please try again later.',
});

