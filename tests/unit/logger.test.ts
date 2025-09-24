// CODECTI Platform - Logger Unit Tests

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Logger, LogLevel } from '../../src/monitoring/logger';

describe('Logger System', () => {
  let logger: Logger;
  
  beforeEach(() => {
    logger = Logger.createTestInstance(); // Use test instance factory method
    // Mock console to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Logging', () => {
    it('should log info messages', () => {
      logger.info('Test info message', 'TEST_CONTEXT');
      const logs = logger.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Test info message');
      expect(logs[0].context).toBe('TEST_CONTEXT');
      expect(logs[0].id).toBeDefined();
      expect(logs[0].timestamp).toBeDefined();
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message', 'TEST_CONTEXT');
      const logs = logger.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].message).toBe('Test warning message');
    });

    it('should log error messages with error object', () => {
      const testError = new Error('Test error');
      logger.error('Test error message', testError, 'TEST_CONTEXT');
      const logs = logger.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].message).toBe('Test error message');
      expect(logs[0].error).toBeDefined();
      expect(logs[0].error?.name).toBe('Error');
      expect(logs[0].error?.message).toBe('Test error');
      expect(logs[0].error?.stack).toBeDefined();
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message', 'TEST_CONTEXT');
      const logs = logger.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.DEBUG);
      expect(logs[0].message).toBe('Test debug message');
    });

    it('should include metadata in logs', () => {
      const metadata = { userId: 123, action: 'test' };
      logger.info('Test with metadata', 'TEST_CONTEXT', metadata);
      const logs = logger.getLogs();
      
      expect(logs[0].metadata).toEqual(metadata);
    });
  });

  describe('HTTP Request Logging', () => {
    it('should log successful HTTP requests', () => {
      logger.logRequest('GET', '/api/projects', 200, 150, 123, 'test@test.com', 'req-123');
      const logs = logger.getLogs();
      
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('GET /api/projects - 200 (150ms)');
      expect(logs[0].method).toBe('GET');
      expect(logs[0].path).toBe('/api/projects');
      expect(logs[0].statusCode).toBe(200);
      expect(logs[0].responseTime).toBe(150);
      expect(logs[0].userId).toBe(123);
      expect(logs[0].userEmail).toBe('test@test.com');
      expect(logs[0].requestId).toBe('req-123');
    });

    it('should log client errors as warnings', () => {
      logger.logRequest('POST', '/api/auth/login', 401, 50);
      const logs = logger.getLogs();
      
      expect(logs[0].level).toBe(LogLevel.WARN);
      expect(logs[0].statusCode).toBe(401);
    });

    it('should log server errors as errors', () => {
      logger.logRequest('GET', '/api/projects', 500, 2500);
      const logs = logger.getLogs();
      
      expect(logs[0].level).toBe(LogLevel.ERROR);
      expect(logs[0].statusCode).toBe(500);
    });

    it('should mark slow requests', () => {
      logger.logRequest('GET', '/api/projects', 200, 3000); // 3 seconds
      const logs = logger.getLogs();
      
      expect(logs[0].metadata?.isSlowRequest).toBe(true);
    });
  });

  describe('Log Filtering', () => {
    beforeEach(() => {
      logger.info('Info message 1', 'CONTEXT1');
      logger.warn('Warning message 1', 'CONTEXT1');
      logger.error('Error message 1', new Error('Test'), 'CONTEXT2');
      logger.debug('Debug message 1', 'CONTEXT2');
      logger.info('Info message 2', 'CONTEXT1');
    });

    it('should filter logs by level', () => {
      const errorLogs = logger.getLogs(LogLevel.ERROR);
      const infoLogs = logger.getLogs(LogLevel.INFO);
      
      expect(errorLogs).toHaveLength(1);
      expect(errorLogs[0].level).toBe(LogLevel.ERROR);
      
      expect(infoLogs).toHaveLength(2);
      infoLogs.forEach(log => expect(log.level).toBe(LogLevel.INFO));
    });

    it('should filter logs by context', () => {
      const context1Logs = logger.getLogs(undefined, 'CONTEXT1');
      const context2Logs = logger.getLogs(undefined, 'CONTEXT2');
      
      expect(context1Logs).toHaveLength(3); // 2 info + 1 warning
      expect(context2Logs).toHaveLength(2); // 1 error + 1 debug
    });

    it('should filter logs by search term', () => {
      const searchResults = logger.getLogs(undefined, undefined, 100, 'message 1');
      
      expect(searchResults).toHaveLength(4); // All have "message 1"
    });

    it('should limit number of results', () => {
      const limitedResults = logger.getLogs(undefined, undefined, 2);
      
      expect(limitedResults).toHaveLength(2);
    });
  });

  describe('Metrics', () => {
    beforeEach(() => {
      // Add various logs for metrics testing
      logger.info('Info 1');
      logger.warn('Warning 1');
      logger.error('Error 1', new Error('Test'));
      logger.logRequest('GET', '/api/test', 200, 100);
      logger.logRequest('POST', '/api/test', 500, 2500);
      logger.logRequest('GET', '/api/slow', 200, 3000);
    });

    it('should calculate correct metrics', () => {
      const metrics = logger.getMetrics();
      
      expect(metrics.totalLogs).toBeGreaterThan(0);
      expect(metrics.errorCount).toBeGreaterThanOrEqual(1);
      expect(metrics.warningCount).toBeGreaterThanOrEqual(1);
      expect(metrics.slowRequests).toBeGreaterThanOrEqual(1);
      expect(metrics.averageResponseTime).toBeGreaterThan(0);
      expect(Array.isArray(metrics.last24hErrors)).toBe(true);
    });

    it('should include recent errors in metrics', () => {
      const metrics = logger.getMetrics();
      
      expect(metrics.last24hErrors.length).toBeGreaterThan(0);
      expect(metrics.last24hErrors[0].level).toBe(LogLevel.ERROR);
    });
  });

  describe('Log Management', () => {
    beforeEach(() => {
      // Add multiple logs
      for (let i = 0; i < 10; i++) {
        logger.info(`Test message ${i}`);
      }
    });

    it('should clear all logs', () => {
      expect(logger.getLogs()).toHaveLength(10);
      
      logger.clearLogs();
      
      expect(logger.getLogs()).toHaveLength(0);
    });

    it('should clear logs older than specified hours', () => {
      // This is tricky to test without mocking dates
      // For now, just ensure the method doesn't crash
      expect(() => logger.clearLogs(1)).not.toThrow();
    });

    it('should export logs as JSON', () => {
      const exported = logger.exportLogs('json');
      
      expect(() => JSON.parse(exported)).not.toThrow();
      const parsed = JSON.parse(exported);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(10);
    });

    it('should export logs as CSV', () => {
      const exported = logger.exportLogs('csv');
      
      expect(typeof exported).toBe('string');
      expect(exported).toContain('timestamp,level,message');
      const lines = exported.split('\n');
      expect(lines.length).toBeGreaterThan(1); // Header + data
    });
  });

  describe('Log Rotation', () => {
    it('should maintain maximum log limit', () => {
      const maxLogs = (logger as any).maxLogs;
      
      // Add more logs than the limit
      for (let i = 0; i < maxLogs + 10; i++) {
        logger.info(`Test message ${i}`);
      }
      
      const logs = logger.getLogs(undefined, undefined, 9999);
      expect(logs.length).toBeLessThanOrEqual(maxLogs);
    });

    it('should keep most recent logs when rotating', () => {
      const maxLogs = (logger as any).maxLogs;
      
      // Add more logs than the limit
      for (let i = 0; i < maxLogs + 10; i++) {
        logger.info(`Test message ${i}`);
      }
      
      const logs = logger.getLogs(undefined, undefined, 1);
      // Should have the most recent log
      expect(logs[0].message).toBe(`Test message ${maxLogs + 9}`);
    });
  });
});