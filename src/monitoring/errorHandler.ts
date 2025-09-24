// CODECTI Platform - Error Handler

interface ErrorEntry {
  id: string;
  timestamp: string;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  component: string;
  userId?: string;
  requestId?: string;
  metadata?: any;
  resolved: boolean;
}

class ErrorMonitor {
  private errors: ErrorEntry[] = [];
  private maxErrors = 500;

  logError(
    error: Error | string, 
    severity: ErrorEntry['severity'] = 'medium',
    component: string = 'Unknown',
    metadata?: any
  ) {
    const errorMessage = error instanceof Error ? error.message : error;
    const stack = error instanceof Error ? error.stack : undefined;

    const entry: ErrorEntry = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      message: errorMessage,
      stack,
      severity,
      component,
      metadata,
      resolved: false,
      requestId: this.generateRequestId()
    };

    this.errors.unshift(entry);

    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Auto-escalate based on severity
    if (severity === 'critical') {
      console.error(`🔥 CRITICAL ERROR in ${component}:`, errorMessage, metadata);
    } else if (severity === 'high') {
      console.error(`🚨 HIGH SEVERITY ERROR in ${component}:`, errorMessage);
    }

    return entry.id;
  }

  getErrors(options: {
    severity?: string;
    component?: string;
    search?: string;
    resolved?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    let filteredErrors = [...this.errors];

    // Filter by severity
    if (options.severity) {
      filteredErrors = filteredErrors.filter(error => error.severity === options.severity);
    }

    // Filter by component
    if (options.component) {
      filteredErrors = filteredErrors.filter(error => error.component === options.component);
    }

    // Filter by resolved status
    if (options.resolved !== undefined) {
      filteredErrors = filteredErrors.filter(error => error.resolved === options.resolved);
    }

    // Filter by search term
    if (options.search) {
      const searchTerm = options.search.toLowerCase();
      filteredErrors = filteredErrors.filter(error =>
        error.message.toLowerCase().includes(searchTerm) ||
        error.component.toLowerCase().includes(searchTerm)
      );
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;
    
    const stats = this.getErrorStats();
    
    return {
      errors: filteredErrors.slice(offset, offset + limit),
      total: filteredErrors.length,
      stats
    };
  }

  getErrorStats() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const recentErrors = this.errors.filter(error => 
      new Date(error.timestamp) > lastHour
    );
    
    const dailyErrors = this.errors.filter(error => 
      new Date(error.timestamp) > last24Hours
    );

    const severityCount = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errors.length,
      unresolved: this.errors.filter(e => !e.resolved).length,
      lastHour: recentErrors.length,
      last24Hours: dailyErrors.length,
      bySeverity: severityCount
    };
  }

  resolveError(errorId: string, userId?: string) {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      error.metadata = {
        ...error.metadata,
        resolvedBy: userId,
        resolvedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  clearErrors(severity?: ErrorEntry['severity']) {
    if (severity) {
      this.errors = this.errors.filter(error => error.severity !== severity);
    } else {
      this.errors = [];
    }
  }

  private generateErrorId(): string {
    return 'err_' + Math.random().toString(36).substring(2, 15);
  }

  private generateRequestId(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

export const errorMonitor = new ErrorMonitor();

// Middleware function for Hono
export const errorHandlerMiddleware = () => {
  return async (c: any, next: any) => {
    try {
      await next();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const stack = error instanceof Error ? error.stack : undefined;
      
      // Log the error
      errorMonitor.logError(
        error,
        'high',
        'Middleware',
        {
          path: c.req.path,
          method: c.req.method,
          userAgent: c.req.header('User-Agent')
        }
      );
      
      // Return error response
      return c.json({
        success: false,
        message: 'Error interno del servidor',
        error: errorMessage
      }, 500);
    }
  };
};