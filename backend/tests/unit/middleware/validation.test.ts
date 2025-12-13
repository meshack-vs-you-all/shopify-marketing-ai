import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validateBody, validateQuery, validateParams } from '../../../src/middleware/validation';
import { AppError } from '../../../src/middleware/errorHandler';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    nextFunction = jest.fn();
  });

  describe('validateBody', () => {
    const schema = z.object({
      name: z.string().min(1),
      age: z.number().int().positive(),
    });

    it('should pass validation with valid body', () => {
      mockRequest.body = { name: 'Test', age: 25 };
      const middleware = validateBody(schema);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body).toEqual({ name: 'Test', age: 25 });
    });

    it('should fail validation with invalid body', () => {
      mockRequest.body = { name: '', age: -5 };
      const middleware = validateBody(schema);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
    });

    it('should fail validation with missing required fields', () => {
      mockRequest.body = { name: 'Test' };
      const middleware = validateBody(schema);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('validateQuery', () => {
    const schema = z.object({
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
    });

    it('should pass validation with valid query', () => {
      mockRequest.query = { page: '1', limit: '10' };
      const middleware = validateQuery(schema);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.query).toEqual({ page: 1, limit: 10 });
    });

    it('should fail validation with invalid query', () => {
      mockRequest.query = { page: '-1', limit: '200' };
      const middleware = validateQuery(schema);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
    });
  });

  describe('validateParams', () => {
    const schema = z.object({
      id: z.string().min(1),
    });

    it('should pass validation with valid params', () => {
      mockRequest.params = { id: '123' };
      const middleware = validateParams(schema);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.params).toEqual({ id: '123' });
    });

    it('should fail validation with invalid params', () => {
      mockRequest.params = { id: '' };
      const middleware = validateParams(schema);

      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      const error = (nextFunction as jest.Mock).mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
    });
  });
});

