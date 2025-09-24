// CODECTI Platform - Test Setup

import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';

// Global test configuration
beforeAll(async () => {
  console.log('🧪 Iniciando suite de pruebas CODECTI Platform');
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-key';
});

afterAll(async () => {
  console.log('✅ Suite de pruebas completada');
});

beforeEach(async () => {
  // Reset any global state before each test
});

afterEach(async () => {
  // Cleanup after each test
});

// Mock console.error in tests to avoid noise
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    if (!args[0]?.toString().includes('[Test Error]')) {
      originalError(...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
});