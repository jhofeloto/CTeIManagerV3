// Middleware de Cache para Hono
// Implementa cache HTTP con soporte para diferentes estrategias

import type { Context, Next } from 'hono';
import { globalCache, CacheKeys } from './cache';

export interface CacheOptions {
  ttl?: number;                    // TTL en segundos
  keyGenerator?: (c: Context) => string;  // Generador de keys personalizado
  cacheHeaders?: boolean;          // Incluir headers de cache en response
  varyByUser?: boolean;            // Cache diferente por usuario
  varyByQuery?: string[];          // Cache diferente por parámetros de query
  strategy?: 'memory' | 'kv' | 'auto';  // Estrategia de cache
}

export interface CacheHeaders {
  'Cache-Control'?: string;
  'X-Cache-Status'?: string;
  'X-Cache-TTL'?: string;
  'X-Cache-Key'?: string;
}

// Cache strategies
export const CacheStrategies = {
  // Cache agresivo - para datos estáticos
  AGGRESSIVE: {
    ttl: 3600, // 1 hora
    strategy: 'auto' as const,
    cacheHeaders: true
  },

  // Cache moderado - para datos que cambian frecuentemente
  MODERATE: {
    ttl: 300, // 5 minutos
    strategy: 'auto' as const,
    cacheHeaders: true
  },

  // Cache conservador - para datos muy dinámicos
  CONSERVATIVE: {
    ttl: 60, // 1 minuto
    strategy: 'memory' as const,
    cacheHeaders: false
  },

  // Sin cache - para datos en tiempo real
  NO_CACHE: {
    ttl: 0,
    strategy: 'memory' as const,
    cacheHeaders: false
  }
} as const;

// Middleware de cache para GET requests
export const cacheMiddleware = (options: CacheOptions = {}) => {
  const {
    ttl = CacheStrategies.MODERATE.ttl,
    keyGenerator,
    cacheHeaders = true,
    varyByUser = false,
    varyByQuery = [],
    strategy = 'auto'
  } = options;

  return async (c: Context, next: Next) => {
    // Solo aplicar cache a GET requests
    if (c.req.method !== 'GET') {
      return await next();
    }

    // Generar key de cache
    const cacheKey = generateCacheKey(c, keyGenerator, varyByUser, varyByQuery);

    // Verificar si existe en cache
    const cachedResponse = await globalCache.get(cacheKey);

    if (cachedResponse) {
      // Retornar respuesta cacheada
      if (cacheHeaders) {
        c.header('X-Cache-Status', 'HIT');
        c.header('X-Cache-Key', cacheKey);
        c.header('X-Cache-TTL', ttl.toString());
      }

      return c.json(cachedResponse);
    }

    // Ejecutar el siguiente middleware/handler
    await next();

    // Solo cachear respuestas exitosas (2xx)
    if (c.res.status >= 200 && c.res.status < 300) {
      try {
        const responseData = await c.res.json();
        await globalCache.set(cacheKey, responseData, ttl);

        if (cacheHeaders) {
          c.header('X-Cache-Status', 'MISS');
          c.header('X-Cache-Key', cacheKey);
          c.header('X-Cache-TTL', ttl.toString());
        }
      } catch (error) {
        // Si no se puede parsear como JSON, no cachear
        console.warn('Cannot cache non-JSON response:', error);
      }
    }
  };
};

// Middleware de cache para rutas específicas
export const createCacheMiddleware = (routePattern: string, options: CacheOptions = {}) => {
  return cacheMiddleware({
    ...CacheStrategies.MODERATE,
    ...options,
    keyGenerator: (c) => `${routePattern}:${generateCacheKey(c)}`
  });
};

// Middleware para invalidar cache
export const invalidateCache = async (pattern: string) => {
  // Nota: En una implementación completa, usaríamos un patrón de búsqueda
  // Para simplicidad, invalidamos keys específicas conocidas
  const keysToInvalidate = [
    CacheKeys.PROJECTS,
    CacheKeys.PUBLIC_STATS,
    CacheKeys.ANALYTICS,
    CacheKeys.HEALTH_CHECK
  ].filter(key => key.includes(pattern));

  for (const key of keysToInvalidate) {
    await globalCache.delete(key);
  }
};

// Middleware para cache con headers HTTP estándar
export const httpCacheMiddleware = (ttl: number = 300) => {
  return async (c: Context, next: Next) => {
    const cacheKey = generateCacheKey(c);

    // Verificar cache
    const cachedResponse = await globalCache.get(cacheKey);

    if (cachedResponse) {
      // Headers de cache HIT
      c.header('Cache-Control', `public, max-age=${ttl}`);
      c.header('X-Cache-Status', 'HIT');
      c.header('X-Cache-Age', Math.floor((Date.now() - (cachedResponse as any).timestamp) / 1000).toString());

      return c.json(cachedResponse);
    }

    await next();

    // Solo cachear respuestas exitosas
    if (c.res.status >= 200 && c.res.status < 300) {
      const responseData = await c.res.json();
      await globalCache.set(cacheKey, responseData, ttl);

      // Headers de cache MISS
      c.header('Cache-Control', `public, max-age=${ttl}`);
      c.header('X-Cache-Status', 'MISS');
      c.header('Last-Modified', new Date().toUTCString());
    }
  };
};

// Generar key de cache
function generateCacheKey(
  c: Context,
  keyGenerator?: (c: Context) => string,
  varyByUser: boolean = false,
  varyByQuery: string[] = []
): string {
  if (keyGenerator) {
    return keyGenerator(c);
  }

  const url = new URL(c.req.url);
  let key = `${c.req.method}:${url.pathname}`;

  // Agregar parámetros de query si es necesario
  if (varyByQuery.length > 0) {
    const queryParams: string[] = [];
    varyByQuery.forEach(param => {
      const value = url.searchParams.get(param);
      if (value) queryParams.push(`${param}=${value}`);
    });
    if (queryParams.length > 0) {
      key += `?${queryParams.sort().join('&')}`;
    }
  }

  // Agregar user ID si es necesario
  if (varyByUser) {
    const user = c.get('user');
    if (user) {
      key += `:user:${user.userId}`;
    }
  }

  return key;
}

// Middleware para métricas de cache
export const cacheMetricsMiddleware = async (c: Context, next: Next) => {
  const startTime = Date.now();

  await next();

  const processingTime = Date.now() - startTime;
  const cacheStatus = c.res.headers.get('X-Cache-Status');

  // Log de métricas de cache
  if (cacheStatus) {
    console.log(`Cache ${cacheStatus} - ${c.req.method} ${c.req.path} - ${processingTime}ms`);
  }
};

// Funciones helper para casos de uso comunes
export const cacheHelpers = {
  // Cache para proyectos públicos
  publicProjects: (options?: Partial<CacheOptions>) =>
    cacheMiddleware({
      ttl: 600, // 10 minutos
      cacheHeaders: true,
      ...options
    }),

  // Cache para estadísticas
  publicStats: (options?: Partial<CacheOptions>) =>
    cacheMiddleware({
      ttl: 1800, // 30 minutos
      cacheHeaders: true,
      ...options
    }),

  // Cache para analytics (más agresivo)
  analytics: (options?: Partial<CacheOptions>) =>
    cacheMiddleware({
      ttl: 3600, // 1 hora
      cacheHeaders: true,
      ...options
    }),

  // Cache para health checks
  healthCheck: (options?: Partial<CacheOptions>) =>
    cacheMiddleware({
      ttl: 60, // 1 minuto
      cacheHeaders: false,
      ...options
    })
};