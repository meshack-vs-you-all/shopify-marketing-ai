import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../../src/middleware/auth';
import { AppError } from '../../../src/middleware/errorHandler';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-prod';

describe('Authentication Middleware (JWT)', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      ip: '127.0.0.1',
    };
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should pass authentication with a valid Bearer token', () => {
    const token = jwt.sign({ userId: 'user-123' }, JWT_SECRET);
    mockRequest.headers = { authorization: `Bearer ${token}` };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalledWith();
    expect((mockRequest as any).user).toEqual({ userId: 'user-123' });
  });

  it('should fail authentication when no Authorization header is provided', () => {
    mockRequest.headers = {};

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('No token provided');
  });

  it('should fail authentication when Authorization header does not start with Bearer', () => {
    mockRequest.headers = { authorization: 'Basic xyz' };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('No token provided');
  });

  it('should fail authentication with an invalid/malformed token', () => {
    mockRequest.headers = { authorization: 'Bearer invalid-token-here' };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid token');
  });

  it('should fail authentication with an expired token', () => {
    const expiredToken = jwt.sign({ userId: 'user-123' }, JWT_SECRET, { expiresIn: '-1s' });
    mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

    authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    const error = (nextFunction as jest.Mock).mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe('Invalid token');
  });
});
