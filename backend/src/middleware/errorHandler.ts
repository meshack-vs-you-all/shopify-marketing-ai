import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

export interface IAppError extends Error {
  statusCode?: number;
  code?: string;
}

export const errorHandler = (
  err: IAppError | ZodError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation error',
      details: err.errors,
    });
  }

  // Handle known application errors
  const appError = err as IAppError;
  const statusCode = appError.statusCode || 500;
  const message = err.message || 'Internal server error';

  // Don't leak error details in production
  const errorResponse: any = {
    error: message,
  };

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.details = (err as any).details;
  }

  res.status(statusCode).json(errorResponse);
};

export class AppError extends Error implements IAppError {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

