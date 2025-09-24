// CODECTI Platform - Alert Manager

interface Alert {
  id: string;
  timestamp: string;
  type: 'performance' | 'error' | 'security' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  resolved: boolean;
  metadata?: any;
}

interface AlertRule {
  id: string;
  type: Alert['type'];
  condition: string;
  threshold: number;
  enabled: boolean;
}

class AlertManager {
  private alerts: Alert[] = [];
  private rules: AlertRule[] = [];
  private maxAlerts = 200;

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'high_response_time',
        type: 'performance',
        condition: 'avg_response_time > threshold',
        threshold: 5000, // 5 seconds
        enabled: true
      },
      {
        id: 'high_error_rate',
        type: 'error',
        condition: 'error_rate > threshold',
        threshold: 10, // 10%
        enabled: true
      },
      {
        id: 'memory_usage',
        type: 'system',
        condition: 'memory_usage > threshold',
        threshold: 85, // 85%
        enabled: true
      }
    ];
  }

  createAlert(
    type: Alert['type'],
    severity: Alert['severity'],
    title: string,
    message: string,
    metadata?: any
  ): string {
    const alert: Alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      type,
      severity,
      title,
      message,
      resolved: false,
      metadata
    };

    this.alerts.unshift(alert);

    // Keep only the most recent alerts
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }

    // Log critical alerts
    if (severity === 'critical') {
      console.error(`🚨 CRITICAL ALERT: ${title}`, message, metadata);
    }

    return alert.id;
  }

  getAlerts(options: {
    type?: Alert['type'];
    severity?: Alert['severity'];
    resolved?: boolean;
    limit?: number;
    offset?: number;
  } = {}) {
    let filteredAlerts = [...this.alerts];

    // Filter by type
    if (options.type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === options.type);
    }

    // Filter by severity
    if (options.severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === options.severity);
    }

    // Filter by resolved status
    if (options.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === options.resolved);
    }

    // Apply pagination
    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return {
      alerts: filteredAlerts.slice(offset, offset + limit),
      total: filteredAlerts.length,
      stats: this.getAlertStats()
    };
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      alert.metadata = {
        ...alert.metadata,
        resolvedAt: new Date().toISOString()
      };
      return true;
    }
    return false;
  }

  getAlertStats() {
    const now = new Date();
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentAlerts = this.alerts.filter(alert => 
      new Date(alert.timestamp) > lastHour
    );

    const severityCount = this.alerts.reduce((acc, alert) => {
      acc[alert.severity] = (acc[alert.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.alerts.length,
      unresolved: this.alerts.filter(a => !a.resolved).length,
      lastHour: recentAlerts.length,
      bySeverity: severityCount
    };
  }

  // Check metrics against alert rules
  checkMetrics(metrics: any) {
    this.rules.forEach(rule => {
      if (!rule.enabled) return;

      try {
        let shouldAlert = false;
        let alertMessage = '';

        switch (rule.id) {
          case 'high_response_time':
            if (metrics.responseTime?.avg > rule.threshold) {
              shouldAlert = true;
              alertMessage = `Average response time (${metrics.responseTime.avg}ms) exceeds threshold (${rule.threshold}ms)`;
            }
            break;

          case 'high_error_rate':
            const errorRate = metrics.requests?.total > 0 
              ? (metrics.requests.failed / metrics.requests.total) * 100 
              : 0;
            if (errorRate > rule.threshold) {
              shouldAlert = true;
              alertMessage = `Error rate (${errorRate.toFixed(1)}%) exceeds threshold (${rule.threshold}%)`;
            }
            break;

          case 'memory_usage':
            // Memory check would be implemented here if available
            break;
        }

        if (shouldAlert) {
          this.createAlert(
            rule.type,
            'medium',
            `Rule Triggered: ${rule.id}`,
            alertMessage,
            { rule: rule.id, metrics }
          );
        }
      } catch (error) {
        console.error(`Error checking alert rule ${rule.id}:`, error);
      }
    });
  }

  clearAlerts(type?: Alert['type'], severity?: Alert['severity']) {
    if (type || severity) {
      this.alerts = this.alerts.filter(alert => {
        if (type && alert.type !== type) return true;
        if (severity && alert.severity !== severity) return true;
        return false;
      });
    } else {
      this.alerts = [];
    }
  }

  private generateAlertId(): string {
    return 'alert_' + Math.random().toString(36).substring(2, 15);
  }
}

export const alertManager = new AlertManager();