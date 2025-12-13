import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { logger } from '../utils/logger';

/**
 * API Key Authentication Middleware
 * Validates API key from request header
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get API key from header
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      throw new AppError('API key is required. Please provide x-api-key header.', 401, 'UNAUTHORIZED');
    }

    // Get expected API key from environment
    const expectedApiKey = process.env.API_KEY;

    if (!expectedApiKey) {
      logger.error('API_KEY environment variable not set');
      throw new AppError('Server configuration error', 500, 'CONFIG_ERROR');
    }

    // Validate API key
    if (apiKey !== expectedApiKey) {
      logger.warn('Invalid API key attempt', { ip: req.ip });
      throw new AppError('Invalid API key', 401, 'UNAUTHORIZED');
    }

    // Add user info to request (for future multi-user support)
    (req as any).user = {
      apiKey,
      authenticated: true,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional authentication - doesn't fail if no API key provided
 * Useful for public endpoints that can work with or without auth
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.headers['x-api-key'] as string;
  const expectedApiKey = process.env.API_KEY;

  if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
    (req as any).user = {
      apiKey,
      authenticated: true,
    };
  }

  next();
};

