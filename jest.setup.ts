/**
 * Jest setup file - runs before all tests
 * Sets NODE_ENV to 'test', configures environment, and mocks global dependencies
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';

// Jest timeout
jest.setTimeout(10000);

// Suppress console logs in tests
global.console.log = jest.fn();
global.console.warn = jest.fn();
