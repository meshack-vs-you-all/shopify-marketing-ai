import { validateEnv } from '../../../src/config/validateEnv';

describe('Environment Validation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.API_KEY = 'test-api-key';
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    // Should not throw
    expect(() => validateEnv()).not.toThrow();
  });

  it('should fail if DATABASE_URL is missing', () => {
    delete process.env.DATABASE_URL;
    process.env.API_KEY = 'test-api-key';
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    // Mock process.exit to prevent actual exit
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => validateEnv()).toThrow('process.exit called');
    exitSpy.mockRestore();
  });

  it('should fail if API_KEY is missing', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    delete process.env.API_KEY;
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token';
    process.env.OPENAI_API_KEY = 'test-openai-key';

    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    expect(() => validateEnv()).toThrow('process.exit called');
    exitSpy.mockRestore();
  });

  it('should use default values for optional variables', () => {
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.API_KEY = 'test-api-key';
    process.env.SHOPIFY_ACCESS_TOKEN = 'test-token';
    process.env.OPENAI_API_KEY = 'test-openai-key';
    delete process.env.REDIS_URL;

    // Should not throw and use default REDIS_URL
    expect(() => validateEnv()).not.toThrow();
  });
});

