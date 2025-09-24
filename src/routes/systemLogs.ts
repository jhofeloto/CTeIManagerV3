// CODECTI Platform - System Logs API Routes
// API para acceso y análisis del sistema de logs

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { authMiddleware, adminMiddleware } from '../utils/middleware';
import { systemLogger, type LogFilter } from '../monitoring/systemLogger';

const systemLogs = new Hono<{ Bindings: Bindings }>();

// Aplicar middlewares de autenticación y admin
systemLogs.use('/*', authMiddleware);
systemLogs.use('/*', adminMiddleware);

// Obtener logs del sistema con filtros avanzados
systemLogs.get('/', async (c) => {
  try {
    // Extraer parámetros de filtro
    const filter: LogFilter = {
      level: c.req.query('level') ? c.req.query('level')?.split(',') : undefined,
      component: c.req.query('component') ? c.req.query('component')?.split(',') : undefined,
      search: c.req.query('search') || undefined,
      startDate: c.req.query('startDate') || undefined,
      endDate: c.req.query('endDate') || undefined,
      userId: c.req.query('userId') || undefined,
      hasErrors: c.req.query('hasErrors') === 'true',
      limit: c.req.query('limit') ? parseInt(c.req.query('limit')!) : 100,
      offset: c.req.query('offset') ? parseInt(c.req.query('offset')!) : 0
    };

    const result = systemLogger.getLogs(filter);
    
    // Log de acceso al sistema de logs
    systemLogger.info(
      `System logs accessed - ${result.total} logs found`,
      'SYSTEM_LOGS',
      { filter, resultCount: result.logs.length },
      { 
        userId: c.get('user')?.id?.toString(),
        requestId: c.get('requestId')
      }
    );

    return c.json({
      success: true,
      data: {
        logs: result.logs,
        total: result.total,
        metrics: result.metrics,
        filter
      }
    });

  } catch (error) {
    systemLogger.error('Failed to retrieve system logs', 'SYSTEM_LOGS', error, {
      userId: c.get('user')?.id?.toString(),
      requestId: c.get('requestId')
    });

    return c.json({
      success: false,
      message: 'Error al obtener los logs del sistema'
    }, 500);
  }
});

// Obtener métricas específicas del sistema
systemLogs.get('/metrics', async (c) => {
  try {
    const timeframe = c.req.query('timeframe') || '24h';
    
    // Calcular fecha de inicio según timeframe
    let startDate: string | undefined;
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
    }

    const filter: LogFilter = { startDate };
    const result = systemLogger.getLogs(filter);

    return c.json({
      success: true,
      data: {
        timeframe,
        startDate,
        metrics: result.metrics,
        totalLogs: result.total
      }
    });

  } catch (error) {
    systemLogger.error('Failed to retrieve system metrics', 'SYSTEM_LOGS', error, {
      userId: c.get('user')?.id?.toString(),
      requestId: c.get('requestId')
    });

    return c.json({
      success: false,
      message: 'Error al obtener métricas del sistema'
    }, 500);
  }
});

// Exportar logs para análisis externo
systemLogs.get('/export', async (c) => {
  try {
    const format = c.req.query('format') || 'json';
    const timeframe = c.req.query('timeframe') || '24h';
    
    // Calcular filtro de tiempo
    let startDate: string | undefined;
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
    }

    const filter: LogFilter = { startDate, limit: 5000 }; // Límite alto para export
    const exportData = systemLogger.exportLogs(filter);

    // Log de exportación
    systemLogger.info(
      `System logs exported - format: ${format}, timeframe: ${timeframe}`,
      'SYSTEM_LOGS',
      { format, timeframe, startDate },
      { 
        userId: c.get('user')?.id?.toString(),
        requestId: c.get('requestId')
      }
    );

    if (format === 'json') {
      c.header('Content-Type', 'application/json');
      c.header('Content-Disposition', `attachment; filename="system_logs_${timeframe}_${new Date().toISOString().split('T')[0]}.json"`);
      return c.body(exportData);
    }

    return c.json({
      success: false,
      message: 'Formato de exportación no soportado'
    }, 400);

  } catch (error) {
    systemLogger.error('Failed to export system logs', 'SYSTEM_LOGS', error, {
      userId: c.get('user')?.id?.toString(),
      requestId: c.get('requestId')
    });

    return c.json({
      success: false,
      message: 'Error al exportar logs del sistema'
    }, 500);
  }
});

// Limpiar logs antiguos
systemLogs.delete('/cleanup', async (c) => {
  try {
    const daysToKeep = c.req.query('days') ? parseInt(c.req.query('days')!) : 7;
    
    if (daysToKeep < 1 || daysToKeep > 365) {
      return c.json({
        success: false,
        message: 'El número de días debe estar entre 1 y 365'
      }, 400);
    }

    const removedCount = systemLogger.clearOldLogs(daysToKeep);

    systemLogger.info(
      `System logs cleanup completed - ${removedCount} logs removed`,
      'SYSTEM_LOGS',
      { daysToKeep, removedCount },
      { 
        userId: c.get('user')?.id?.toString(),
        requestId: c.get('requestId')
      }
    );

    return c.json({
      success: true,
      data: {
        removedCount,
        daysToKeep,
        message: `Se eliminaron ${removedCount} logs antiguos`
      }
    });

  } catch (error) {
    systemLogger.error('Failed to cleanup system logs', 'SYSTEM_LOGS', error, {
      userId: c.get('user')?.id?.toString(),
      requestId: c.get('requestId')
    });

    return c.json({
      success: false,
      message: 'Error al limpiar logs del sistema'
    }, 500);
  }
});

// Obtener componentes disponibles para filtrado
systemLogs.get('/components', async (c) => {
  try {
    const result = systemLogger.getLogs({ limit: 10000 }); // Obtener muchos logs para análisis
    const components = new Set<string>();
    
    result.logs.forEach(log => {
      if (log.component) {
        components.add(log.component);
      }
    });

    return c.json({
      success: true,
      data: {
        components: Array.from(components).sort(),
        count: components.size
      }
    });

  } catch (error) {
    systemLogger.error('Failed to get log components', 'SYSTEM_LOGS', error, {
      userId: c.get('user')?.id?.toString(),
      requestId: c.get('requestId')
    });

    return c.json({
      success: false,
      message: 'Error al obtener componentes de logs'
    }, 500);
  }
});

// Análisis de errores frecuentes
systemLogs.get('/error-analysis', async (c) => {
  try {
    const timeframe = c.req.query('timeframe') || '24h';
    
    // Calcular fecha de inicio
    let startDate: string | undefined;
    const now = new Date();
    
    switch (timeframe) {
      case '1h':
        startDate = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
        break;
      case '6h':
        startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000).toISOString();
        break;
      case '24h':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
    }

    const result = systemLogger.getLogs({ 
      startDate, 
      hasErrors: true,
      limit: 1000 
    });

    // Análisis de patrones de errores
    const errorPatterns = new Map<string, { count: number; components: Set<string>; lastOccurrence: string }>();
    const componentErrors = new Map<string, number>();
    
    result.logs.forEach(log => {
      if (log.level === 'ERROR' || log.level === 'CRITICAL') {
        // Agrupar por mensaje similar
        const key = log.message.replace(/\d+/g, 'N').replace(/[a-f0-9]{8,}/g, 'ID'); // Normalizar IDs y números
        
        if (!errorPatterns.has(key)) {
          errorPatterns.set(key, { count: 0, components: new Set(), lastOccurrence: log.timestamp });
        }
        
        const pattern = errorPatterns.get(key)!;
        pattern.count++;
        pattern.components.add(log.component);
        if (log.timestamp > pattern.lastOccurrence) {
          pattern.lastOccurrence = log.timestamp;
        }

        // Contar errores por componente
        componentErrors.set(log.component, (componentErrors.get(log.component) || 0) + 1);
      }
    });

    // Convertir a arrays ordenados
    const topErrorPatterns = Array.from(errorPatterns.entries())
      .map(([message, data]) => ({
        message,
        count: data.count,
        components: Array.from(data.components),
        lastOccurrence: data.lastOccurrence
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const topComponentErrors = Array.from(componentErrors.entries())
      .map(([component, count]) => ({ component, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return c.json({
      success: true,
      data: {
        timeframe,
        totalErrors: result.total,
        topErrorPatterns,
        topComponentErrors,
        analysis: {
          criticalErrorsFound: result.logs.filter(log => log.level === 'CRITICAL').length,
          mostActiveErrorComponent: topComponentErrors[0]?.component || 'N/A',
          errorTrend: 'stable' // Esto podría calcularse comparando con períodos anteriores
        }
      }
    });

  } catch (error) {
    systemLogger.error('Failed to perform error analysis', 'SYSTEM_LOGS', error, {
      userId: c.get('user')?.id?.toString(),
      requestId: c.get('requestId')
    });

    return c.json({
      success: false,
      message: 'Error al realizar análisis de errores'
    }, 500);
  }
});

export default systemLogs;