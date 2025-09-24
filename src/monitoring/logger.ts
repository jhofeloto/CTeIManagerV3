// CODECTI Platform - Logger

interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  data?: any;
  component?: string;
  userId?: string;
  requestId?: string;
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 1000;

  log(level: LogEntry['level'], message: string, data?: any, component?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      component,
      requestId: this.generateRequestId()
    };

    this.logs.unshift(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Also log to console in development
    const logMethod = level.toLowerCase() as keyof Console;
    if (console[logMethod]) {
      (console[logMethod] as Function)(`[${level}] ${component || 'CODECTI'}: ${message}`, data);
    }
  }

  debug(message: string, data?: any, component?: string) {
    this.log('DEBUG', message, data, component);
  }

  info(message: string, data?: any, component?: string) {
    this.log('INFO', message, data, component);
  }

  warn(message: string, data?: any, component?: string) {
    this.log('WARN', message, data, component);
  }

  error(message: string, data?: any, component?: string) {
    this.log('ERROR', message, data, component);
  }

  getLogs(options: {
    level?: string;
    component?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    let filteredLogs = [...this.logs];

    // Filter by level
    if (options.level) {
      filteredLogs = filteredLogs.filter(log => log.level === options.level);
    }

    // Filter by component
    if (options.component) {
      filteredLogs = filteredLogs.filter(log => log.component === options.component);
    }

    // Filter by search term
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        (log.component && log.component.toLowerCase().includes(searchTerm))
      );
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    
    return {
      logs: filteredLogs.slice(offset, offset + limit),
      total: filteredLogs.length
    };
  }

  clearLogs() {
    this.logs = [];
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

export const logger = new Logger();

// Middleware function for Hono
export const loggingMiddleware = () => {
  return async (c: any, next: any) => {
    const startTime = Date.now();
    const method = c.req.method;
    const path = c.req.path;
    
    logger.info(`${method} ${path} - Started`, null, 'HTTP');
    
    try {
      await next();
      const endTime = Date.now();
      const duration = endTime - startTime;
      const status = c.res.status;
      
      logger.info(
        `${method} ${path} - ${status} (${duration}ms)`,
        { method, path, status, duration },
        'HTTP'
      );
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      logger.error(
        `${method} ${path} - Error (${duration}ms)`,
        { method, path, duration, error },
        'HTTP'
      );
      throw error;
    }
  };
};