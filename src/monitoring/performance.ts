// CODECTI Platform - Performance Monitor

interface PerformanceMetric {
  timestamp: string;
  metric: string;
  value: number;
  unit: string;
  category: 'response_time' | 'memory' | 'cpu' | 'network' | 'database';
  metadata?: any;
}

interface SystemMetrics {
  timestamp: string;
  responseTime: {
    avg: number;
    min: number;
    max: number;
    p95: number;
  };
  requests: {
    total: number;
    successful: number;
    failed: number;
    ratePerMinute: number;
  };
  errors: {
    total: number;
    ratePerMinute: number;
  };
  uptime: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private requestTimes: number[] = [];
  private requestCount = 0;
  private errorCount = 0;
  private startTime = Date.now();

  recordMetric(
    metric: string,
    value: number,
    unit: string,
    category: PerformanceMetric['category'],
    metadata?: any
  ) {
    const entry: PerformanceMetric = {
      timestamp: new Date().toISOString(),
      metric,
      value,
      unit,
      category,
      metadata
    };

    this.metrics.unshift(entry);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(0, this.maxMetrics);
    }
  }

  recordRequestTime(responseTime: number) {
    this.requestTimes.push(responseTime);
    this.requestCount++;

    // Keep only last 100 request times for calculations
    if (this.requestTimes.length > 100) {
      this.requestTimes = this.requestTimes.slice(-100);
    }

    this.recordMetric('response_time', responseTime, 'ms', 'response_time');
  }

  recordError() {
    this.errorCount++;
    this.recordMetric('error_count', this.errorCount, 'count', 'network');
  }

  getSystemMetrics(): SystemMetrics {
    const now = Date.now();
    const uptime = now - this.startTime;

    // Calculate response time statistics
    const responseTimes = this.requestTimes.length > 0 ? this.requestTimes : [0];
    const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    // Calculate 95th percentile
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedTimes.length * 0.95);
    const p95ResponseTime = sortedTimes[p95Index] || 0;

    // Calculate rates per minute
    const minutesUptime = uptime / (1000 * 60);
    const requestRate = minutesUptime > 0 ? this.requestCount / minutesUptime : 0;
    const errorRate = minutesUptime > 0 ? this.errorCount / minutesUptime : 0;

    return {
      timestamp: new Date().toISOString(),
      responseTime: {
        avg: Math.round(avgResponseTime * 100) / 100,
        min: minResponseTime,
        max: maxResponseTime,
        p95: p95ResponseTime
      },
      requests: {
        total: this.requestCount,
        successful: this.requestCount - this.errorCount,
        failed: this.errorCount,
        ratePerMinute: Math.round(requestRate * 100) / 100
      },
      errors: {
        total: this.errorCount,
        ratePerMinute: Math.round(errorRate * 100) / 100
      },
      uptime
    };
  }

  getMetrics(options: {
    category?: PerformanceMetric['category'];
    metric?: string;
    limit?: number;
    since?: Date;
  } = {}) {
    let filteredMetrics = [...this.metrics];

    // Filter by category
    if (options.category) {
      filteredMetrics = filteredMetrics.filter(m => m.category === options.category);
    }

    // Filter by metric name
    if (options.metric) {
      filteredMetrics = filteredMetrics.filter(m => m.metric === options.metric);
    }

    // Filter by timestamp
    if (options.since) {
      filteredMetrics = filteredMetrics.filter(m => 
        new Date(m.timestamp) > options.since!
      );
    }

    // Apply limit
    if (options.limit) {
      filteredMetrics = filteredMetrics.slice(0, options.limit);
    }

    return filteredMetrics;
  }

  clearMetrics() {
    this.metrics = [];
    this.requestTimes = [];
    this.requestCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  // Middleware function to automatically track request performance
  createMiddleware() {
    return async (c: any, next: any) => {
      const startTime = Date.now();
      
      try {
        await next();
        const responseTime = Date.now() - startTime;
        this.recordRequestTime(responseTime);
      } catch (error) {
        const responseTime = Date.now() - startTime;
        this.recordRequestTime(responseTime);
        this.recordError();
        throw error;
      }
    };
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Middleware function for Hono  
export const performanceMiddleware = () => {
  return performanceMonitor.createMiddleware();
};