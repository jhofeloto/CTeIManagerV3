// CODECTI Platform - Monitoring Routes

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { authMiddleware, adminMiddleware } from '../utils/middleware';
import { logger } from '../monitoring/logger';
import { errorMonitor } from '../monitoring/errorHandler';
import { healthChecker } from '../health/healthCheck';
import { performanceMonitor } from '../monitoring/performance';
import { alertManager } from '../monitoring/alerts';

const monitoring = new Hono<{ Bindings: Bindings }>();

// Health check público (para load balancers)
monitoring.get('/health', async (c) => {
  try {
    const health = await healthChecker.quickHealthCheck(c.env);
    
    if (health.status === 'ok') {
      return c.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: health.uptime
      });
    } else {
      return c.json({
        status: 'error',
        timestamp: new Date().toISOString(),
        uptime: health.uptime
      }, 503);
    }
  } catch (error) {
    return c.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    }, 503);
  }
});

// Readiness check
monitoring.get('/ready', async (c) => {
  try {
    const health = await healthChecker.getSystemHealth(c.env);
    
    if (health.status === 'critical') {
      return c.json({
        ready: false,
        status: health.status,
        timestamp: health.timestamp
      }, 503);
    }
    
    return c.json({
      ready: true,
      status: health.status,
      timestamp: health.timestamp
    });
  } catch (error) {
    return c.json({
      ready: false,
      error: 'Readiness check failed',
      timestamp: new Date().toISOString()
    }, 503);
  }
});

// Liveness probe
monitoring.get('/alive', async (c) => {
  return c.json({
    alive: true,
    timestamp: new Date().toISOString(),
    pid: process.pid || 'unknown'
  });
});

// === RUTAS PROTEGIDAS (SOLO ADMIN) ===
monitoring.use('/admin/*', authMiddleware);
monitoring.use('/admin/*', adminMiddleware);

// Estado completo del sistema
monitoring.get('/admin/status', async (c) => {
  try {
    const systemHealth = await healthChecker.getSystemHealth(c.env);
    return c.json({
      success: true,
      data: systemHealth
    });
  } catch (error) {
    logger.error('Failed to get system status', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener estado del sistema'
    }, 500);
  }
});

// Métricas del sistema
monitoring.get('/admin/metrics', async (c) => {
  try {
    const logMetrics = logger.getLogs({ limit: 100 });
    const errorStats = errorMonitor.getErrorStats();
    
    return c.json({
      success: true,
      data: {
        logs: logMetrics,
        errors: errorStats,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Failed to get metrics', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener métricas'
    }, 500);
  }
});

// Obtener logs del sistema
monitoring.get('/admin/logs', async (c) => {
  try {
    const level = c.req.query('level') as any;
    const context = c.req.query('context');
    const limit = parseInt(c.req.query('limit') || '100');
    const search = c.req.query('search');
    
    const logs = logger.getLogs({
      level,
      component: context,
      search,
      limit,
      offset: 0
    });
    
    return c.json({
      success: true,
      data: {
        logs,
        total: logs.length,
        filters: { level, context, limit, search }
      }
    });
  } catch (error) {
    logger.error('Failed to get logs', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener logs'
    }, 500);
  }
});

// Obtener errores del sistema
monitoring.get('/admin/errors', async (c) => {
  try {
    const severity = c.req.query('severity');
    const resolved = c.req.query('resolved');
    const limit = parseInt(c.req.query('limit') || '50');
    const search = c.req.query('search');
    
    const filters = {
      severity,
      resolved: resolved ? resolved === 'true' : undefined,
      limit,
      search
    };
    
    const errors = errorMonitor.getErrors(filters);
    const stats = errorMonitor.getErrorStats();
    
    return c.json({
      success: true,
      data: {
        errors,
        stats,
        filters
      }
    });
  } catch (error) {
    logger.error('Failed to get errors', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener errores'
    }, 500);
  }
});

// Marcar error como resuelto
monitoring.patch('/admin/errors/:id/resolve', async (c) => {
  try {
    const errorId = c.req.param('id');
    const resolved = errorMonitor.resolveError(errorId);
    
    if (resolved) {
      return c.json({
        success: true,
        message: 'Error marcado como resuelto'
      });
    } else {
      return c.json({
        success: false,
        message: 'Error no encontrado'
      }, 404);
    }
  } catch (error) {
    logger.error('Failed to resolve error', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al resolver error'
    }, 500);
  }
});

// Limpiar logs antiguos
monitoring.delete('/admin/logs/cleanup', async (c) => {
  try {
    const hours = parseInt(c.req.query('hours') || '168'); // 7 días por defecto
    logger.clearLogs(hours);
    
    return c.json({
      success: true,
      message: `Logs más antiguos de ${hours} horas eliminados`
    });
  } catch (error) {
    logger.error('Failed to cleanup logs', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al limpiar logs'
    }, 500);
  }
});

// Limpiar errores antiguos
monitoring.delete('/admin/errors/cleanup', async (c) => {
  try {
    const days = parseInt(c.req.query('days') || '30'); // 30 días por defecto
    errorMonitor.clearOldErrors(days);
    
    return c.json({
      success: true,
      message: `Errores más antiguos de ${days} días eliminados`
    });
  } catch (error) {
    logger.error('Failed to cleanup errors', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al limpiar errores'
    }, 500);
  }
});

// Exportar logs
monitoring.get('/admin/logs/export', async (c) => {
  try {
    const format = c.req.query('format') || 'json';
    const exportData = logger.exportLogs(format as 'json' | 'csv');
    
    const contentType = format === 'csv' 
      ? 'text/csv' 
      : 'application/json';
    
    const filename = `codecti-logs-${new Date().toISOString().split('T')[0]}.${format}`;
    
    return new Response(exportData, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    });
  } catch (error) {
    logger.error('Failed to export logs', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al exportar logs'
    }, 500);
  }
});

// Forzar health check
monitoring.post('/admin/health-check', async (c) => {
  try {
    const health = await healthChecker.getSystemHealth(c.env);
    
    return c.json({
      success: true,
      data: health,
      message: 'Health check ejecutado exitosamente'
    });
  } catch (error) {
    logger.error('Failed to run health check', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al ejecutar health check'
    }, 500);
  }
});

// Test de carga (generar datos de prueba)
monitoring.post('/admin/test-load', async (c) => {
  try {
    const user = c.get('user');
    
    // Generar logs de prueba
    logger.info('Test load initiated', 'TEST_LOAD', { userId: user.userId });
    
    for (let i = 0; i < 10; i++) {
      logger.info(`Test log entry ${i + 1}`, 'LOAD_TEST');
      
      // Simular métricas de performance
      performanceMonitor.recordRequest(Math.random() * 1000 + 100, Math.random() > 0.9);
      
      if (i % 3 === 0) {
        logger.warn(`Test warning ${i + 1}`, 'LOAD_TEST');
      }
      
      if (i % 7 === 0) {
        logger.error(`Test error ${i + 1}`, new Error(`Test error ${i + 1}`), 'LOAD_TEST');
      }
    }
    
    return c.json({
      success: true,
      message: 'Datos de prueba generados exitosamente'
    });
  } catch (error) {
    logger.error('Failed to generate test load', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al generar datos de prueba'
    }, 500);
  }
});

// Performance metrics endpoint
monitoring.get('/admin/performance', async (c) => {
  try {
    const report = performanceMonitor.getPerformanceReport();
    const health = performanceMonitor.getPerformanceHealth();
    const summary = performanceMonitor.getSummary();
    
    return c.json({
      success: true,
      data: {
        report,
        health,
        summary
      }
    });
  } catch (error) {
    logger.error('Failed to get performance metrics', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener métricas de performance'
    }, 500);
  }
});

// Slow requests endpoint
monitoring.get('/admin/performance/slow-requests', async (c) => {
  try {
    const threshold = parseInt(c.req.query('threshold') || '2000');
    const slowRequests = performanceMonitor.getSlowRequests(threshold);
    
    return c.json({
      success: true,
      data: {
        threshold,
        requests: slowRequests
      }
    });
  } catch (error) {
    logger.error('Failed to get slow requests', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener requests lentos'
    }, 500);
  }
});

// Alerts endpoint
monitoring.get('/admin/alerts', async (c) => {
  try {
    const type = c.req.query('type');
    const severity = c.req.query('severity');
    const resolved = c.req.query('resolved');
    const limit = parseInt(c.req.query('limit') || '50');
    
    const filters = { type, severity, limit };
    if (resolved !== undefined) {
      (filters as any).resolved = resolved === 'true';
    }
    
    const alerts = alertManager.getAlerts(filters);
    const stats = alertManager.getAlertStats();
    const activeAlerts = alertManager.getActiveAlerts();
    
    return c.json({
      success: true,
      data: {
        alerts,
        stats,
        activeAlerts: activeAlerts.slice(0, 10), // Top 10 active alerts
        filters
      }
    });
  } catch (error) {
    logger.error('Failed to get alerts', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener alertas'
    }, 500);
  }
});

// Resolve alert
monitoring.patch('/admin/alerts/:id/resolve', async (c) => {
  try {
    const alertId = c.req.param('id');
    const resolved = alertManager.resolveAlert(alertId);
    
    if (resolved) {
      return c.json({
        success: true,
        message: 'Alerta resuelta exitosamente'
      });
    } else {
      return c.json({
        success: false,
        message: 'Alerta no encontrada o ya resuelta'
      }, 404);
    }
  } catch (error) {
    logger.error('Failed to resolve alert', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al resolver alerta'
    }, 500);
  }
});

// Alert rules endpoint
monitoring.get('/admin/alerts/rules', async (c) => {
  try {
    const rules = alertManager.getRules();
    
    return c.json({
      success: true,
      data: rules
    });
  } catch (error) {
    logger.error('Failed to get alert rules', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al obtener reglas de alertas'
    }, 500);
  }
});

// Toggle alert rule
monitoring.patch('/admin/alerts/rules/:id/toggle', async (c) => {
  try {
    const ruleId = c.req.param('id');
    const { enabled } = await c.req.json();
    
    const success = alertManager.toggleRule(ruleId, enabled);
    
    if (success) {
      return c.json({
        success: true,
        message: `Regla ${enabled ? 'habilitada' : 'deshabilitada'} exitosamente`
      });
    } else {
      return c.json({
        success: false,
        message: 'Regla no encontrada'
      }, 404);
    }
  } catch (error) {
    logger.error('Failed to toggle alert rule', error as Error, 'MONITORING');
    return c.json({
      success: false,
      message: 'Error al cambiar estado de regla'
    }, 500);
  }
});

export default monitoring;