// CODECTI Platform - Sistema Completo de Logs
// Sistema avanzado de logging para mantenimiento y actualización del sistema

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  data?: any;
  component: string;
  userId?: string;
  requestId?: string;
  sessionId?: string;
  userAgent?: string;
  ip?: string;
  method?: string;
  path?: string;
  duration?: number;
  status?: number;
  errorStack?: string;
  tags?: string[];
}

interface LogMetrics {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  criticalCount: number;
  lastError?: LogEntry;
  averageResponseTime?: number;
  topErrors: Array<{ message: string; count: number; lastOccurrence: string }>;
  activeUsers: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
}

interface LogFilter {
  level?: string[];
  component?: string[];
  search?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  hasErrors?: boolean;
  limit?: number;
  offset?: number;
}

class SystemLogger {
  private logs: LogEntry[] = [];
  private maxLogs = 5000; // Mantener más logs para mejor análisis
  private errorCache: Map<string, { count: number; lastOccurrence: string }> = new Map();

  // Generar ID único para cada log
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  // Logging principal con contexto completo
  log(level: LogEntry['level'], message: string, options: {
    data?: any;
    component: string;
    userId?: string;
    requestId?: string;
    sessionId?: string;
    userAgent?: string;
    ip?: string;
    method?: string;
    path?: string;
    duration?: number;
    status?: number;
    errorStack?: string;
    tags?: string[];
  }) {
    const logId = this.generateLogId();
    const timestamp = new Date().toISOString();
    
    const entry: LogEntry = {
      id: logId,
      timestamp,
      level,
      message,
      ...options
    };

    // Agregar al cache de errores para métricas
    if (level === 'ERROR' || level === 'CRITICAL') {
      const errorKey = `${options.component}:${message}`;
      const cached = this.errorCache.get(errorKey);
      this.errorCache.set(errorKey, {
        count: (cached?.count || 0) + 1,
        lastOccurrence: timestamp
      });
    }

    this.logs.unshift(entry);
    
    // Mantener límite de logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log a consola con formato mejorado
    this.logToConsole(entry);

    return logId;
  }

  // Métodos de conveniencia con contexto automático
  debug(message: string, component: string, data?: any, context?: Partial<LogEntry>) {
    return this.log('DEBUG', message, { component, data, ...context });
  }

  info(message: string, component: string, data?: any, context?: Partial<LogEntry>) {
    return this.log('INFO', message, { component, data, ...context });
  }

  warn(message: string, component: string, data?: any, context?: Partial<LogEntry>) {
    return this.log('WARN', message, { component, data, ...context });
  }

  error(message: string, component: string, error?: any, context?: Partial<LogEntry>) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    return this.log('ERROR', message, { 
      component, 
      data: errorData,
      errorStack: error?.stack,
      ...context 
    });
  }

  critical(message: string, component: string, error?: any, context?: Partial<LogEntry>) {
    const errorData = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error;

    return this.log('CRITICAL', message, { 
      component, 
      data: errorData,
      errorStack: error?.stack,
      tags: ['critical-alert', ...(context?.tags || [])],
      ...context 
    });
  }

  // Logging específico para requests HTTP
  httpRequest(method: string, path: string, options: {
    userId?: string;
    requestId: string;
    sessionId?: string;
    userAgent?: string;
    ip?: string;
    status?: number;
    duration?: number;
    data?: any;
  }) {
    const level = this.getHttpLogLevel(options.status);
    const message = `${method} ${path}${options.status ? ` - ${options.status}` : ''}${options.duration ? ` (${options.duration}ms)` : ''}`;
    
    return this.log(level, message, {
      component: 'HTTP',
      method,
      path,
      ...options
    });
  }

  // Logging específico para base de datos
  database(operation: string, table: string, options: {
    duration?: number;
    affectedRows?: number;
    error?: any;
    query?: string;
    userId?: string;
    requestId?: string;
  }) {
    const level = options.error ? 'ERROR' : 'INFO';
    const message = `DB ${operation} on ${table}${options.duration ? ` (${options.duration}ms)` : ''}${options.affectedRows ? ` - ${options.affectedRows} rows` : ''}`;
    
    return this.log(level, message, {
      component: 'DATABASE',
      data: {
        operation,
        table,
        query: options.query,
        affectedRows: options.affectedRows,
        error: options.error
      },
      duration: options.duration,
      userId: options.userId,
      requestId: options.requestId,
      errorStack: options.error?.stack
    });
  }

  // Logging de autenticación
  auth(action: string, email?: string, options: {
    success: boolean;
    reason?: string;
    userId?: string;
    sessionId?: string;
    ip?: string;
    userAgent?: string;
    requestId?: string;
  }) {
    const level = options.success ? 'INFO' : 'WARN';
    const message = `Auth ${action}${email ? ` for ${email}` : ''} - ${options.success ? 'Success' : 'Failed'}${options.reason ? ` (${options.reason})` : ''}`;
    
    return this.log(level, message, {
      component: 'AUTH',
      data: {
        action,
        email,
        success: options.success,
        reason: options.reason
      },
      tags: [options.success ? 'auth-success' : 'auth-failure'],
      ...options
    });
  }

  // Obtener logs con filtros avanzados
  getLogs(filter: LogFilter = {}): { logs: LogEntry[]; total: number; metrics: LogMetrics } {
    let filteredLogs = [...this.logs];

    // Filtro por level
    if (filter.level && filter.level.length > 0) {
      filteredLogs = filteredLogs.filter(log => filter.level!.includes(log.level));
    }

    // Filtro por component
    if (filter.component && filter.component.length > 0) {
      filteredLogs = filteredLogs.filter(log => filter.component!.includes(log.component));
    }

    // Filtro por búsqueda de texto
    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        log.component.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }

    // Filtro por rango de fechas
    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
    }

    // Filtro por usuario
    if (filter.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    // Filtro solo errores
    if (filter.hasErrors) {
      filteredLogs = filteredLogs.filter(log => log.level === 'ERROR' || log.level === 'CRITICAL');
    }

    // Paginación
    const total = filteredLogs.length;
    const offset = filter.offset || 0;
    const limit = filter.limit || 100;
    const paginatedLogs = filteredLogs.slice(offset, offset + limit);

    // Calcular métricas
    const metrics = this.calculateMetrics(filteredLogs);

    return {
      logs: paginatedLogs,
      total,
      metrics
    };
  }

  // Calcular métricas del sistema
  calculateMetrics(logs: LogEntry[] = this.logs): LogMetrics {
    const totalLogs = logs.length;
    const errorCount = logs.filter(log => log.level === 'ERROR').length;
    const warningCount = logs.filter(log => log.level === 'WARN').length;
    const criticalCount = logs.filter(log => log.level === 'CRITICAL').length;

    const lastError = logs.find(log => log.level === 'ERROR' || log.level === 'CRITICAL');

    // Calcular tiempo promedio de respuesta
    const httpLogs = logs.filter(log => log.component === 'HTTP' && log.duration);
    const averageResponseTime = httpLogs.length > 0 
      ? httpLogs.reduce((sum, log) => sum + (log.duration || 0), 0) / httpLogs.length 
      : undefined;

    // Top errores
    const topErrors = Array.from(this.errorCache.entries())
      .map(([key, data]) => ({
        message: key.split(':')[1] || key,
        count: data.count,
        lastOccurrence: data.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Usuarios activos (últimos 30 minutos)
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const activeUsers = new Set(
      logs
        .filter(log => log.timestamp >= thirtyMinutesAgo && log.userId)
        .map(log => log.userId)
    ).size;

    // Salud del sistema
    let systemHealth: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (criticalCount > 0) {
      systemHealth = 'critical';
    } else if (errorCount > 10 || warningCount > 50) {
      systemHealth = 'warning';
    }

    return {
      totalLogs,
      errorCount,
      warningCount,
      criticalCount,
      lastError,
      averageResponseTime,
      topErrors,
      activeUsers,
      systemHealth
    };
  }

  // Exportar logs para análisis externo
  exportLogs(filter: LogFilter = {}): string {
    const { logs } = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  // Limpiar logs antiguos
  clearOldLogs(daysToKeep: number = 7) {
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000).toISOString();
    const initialCount = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);
    
    const removedCount = initialCount - this.logs.length;
    this.info(`Cleaned ${removedCount} old logs (keeping ${daysToKeep} days)`, 'SYSTEM');
    
    return removedCount;
  }

  // Utilidades privadas
  private getHttpLogLevel(status?: number): LogEntry['level'] {
    if (!status) return 'INFO';
    if (status >= 500) return 'ERROR';
    if (status >= 400) return 'WARN';
    return 'INFO';
  }

  private logToConsole(entry: LogEntry) {
    const colors = {
      DEBUG: '\x1b[36m', // Cyan
      INFO: '\x1b[32m',  // Green  
      WARN: '\x1b[33m',  // Yellow
      ERROR: '\x1b[31m', // Red
      CRITICAL: '\x1b[41m\x1b[37m' // Red background, white text
    };
    const reset = '\x1b[0m';
    
    const color = colors[entry.level];
    const prefix = `${color}[${entry.level}]${reset}`;
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();
    const component = entry.component ? `[${entry.component}]` : '';
    
    console.log(`${prefix} ${timestamp} ${component} ${entry.message}`);
    
    if (entry.data && entry.level !== 'INFO') {
      console.log('  Data:', entry.data);
    }
    
    if (entry.errorStack) {
      console.log('  Stack:', entry.errorStack);
    }
  }
}

// Instancia singleton
export const systemLogger = new SystemLogger();

// Middleware para logging automático de requests
export const systemLoggingMiddleware = () => {
  return async (c: any, next: any) => {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const method = c.req.method;
    const path = c.req.path;
    const userAgent = c.req.header('User-Agent');
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    
    // Obtener userId si está autenticado
    const authHeader = c.req.header('Authorization');
    let userId: string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        // Esto sería implementado según tu sistema de JWT
        // userId = extractUserIdFromToken(authHeader);
      } catch (e) {
        // Ignore token errors for logging
      }
    }

    systemLogger.info(`${method} ${path} - Started`, 'HTTP', null, {
      requestId,
      method,
      path,
      userAgent,
      ip,
      userId
    });
    
    try {
      await next();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      const status = c.res.status;
      
      systemLogger.httpRequest(method, path, {
        requestId,
        userAgent,
        ip,
        userId,
        status,
        duration
      });
      
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      systemLogger.error(
        `${method} ${path} - Error (${duration}ms)`,
        'HTTP',
        error,
        {
          requestId,
          method,
          path,
          userAgent,
          ip,
          userId,
          duration
        }
      );
      
      throw error;
    }
  };
};

// Exportar tipos para uso externo
export type { LogEntry, LogMetrics, LogFilter };