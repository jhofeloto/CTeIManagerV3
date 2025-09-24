// Sistema de Cache Multi-Nivel para Choco Inventa
// Implementa cache en memoria + Cloudflare KV + base de datos

import type { KVNamespace } from '@cloudflare/workers-types';

export interface CacheConfig {
  memoryTTL: number;    // TTL para cache en memoria (segundos)
  kvTTL: number;        // TTL para Cloudflare KV (segundos)
  enableMetrics: boolean; // Habilitar métricas de cache
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
  totalRequests: number;
}

export class MultiLevelCache {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0,
    totalRequests: 0
  };
  private config: CacheConfig;
  private kv: KVNamespace | null = null;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      memoryTTL: 300,      // 5 minutos por defecto
      kvTTL: 3600,         // 1 hora por defecto
      enableMetrics: true,
      ...config
    };

    // Cleanup automático cada 60 segundos
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000);
  }

  // Inicializar con KV namespace (se llama desde el contexto de Hono)
  initializeKV(kv: KVNamespace) {
    this.kv = kv;
  }

  // Obtener valor del cache
  async get<T>(key: string): Promise<T | null> {
    this.metrics.totalRequests++;

    // 1. Verificar cache en memoria primero
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      memoryEntry.hits++;
      this.metrics.hits++;
      this.updateHitRate();
      return memoryEntry.data;
    }

    // 2. Verificar cache en KV
    if (this.kv) {
      try {
        const kvData = await this.kv.get(key);
        if (kvData) {
          const parsedData = JSON.parse(kvData);
          if (this.isValid(parsedData)) {
            // Actualizar cache en memoria
            this.setMemoryCache(key, parsedData.data, parsedData.ttl);
            this.metrics.hits++;
            this.updateHitRate();
            return parsedData.data;
          } else {
            // Dato expirado, eliminar de KV
            await this.kv.delete(key);
          }
        }
      } catch (error) {
        console.warn('Error accessing KV cache:', error);
      }
    }

    // 3. Cache miss
    this.metrics.misses++;
    this.updateHitRate();
    return null;
  }

  // Establecer valor en cache
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    const finalTTL = ttl || this.config.memoryTTL;

    // 1. Siempre establecer en cache de memoria
    this.setMemoryCache(key, data, finalTTL);
    this.metrics.sets++;

    // 2. Establecer en KV si está disponible
    if (this.kv) {
      try {
        const cacheEntry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          ttl: finalTTL,
          hits: 0
        };

        await this.kv.put(key, JSON.stringify(cacheEntry), {
          expirationTtl: this.config.kvTTL
        });
      } catch (error) {
        console.warn('Error setting KV cache:', error);
      }
    }
  }

  // Eliminar del cache
  async delete(key: string): Promise<void> {
    // Eliminar de memoria
    this.memoryCache.delete(key);

    // Eliminar de KV
    if (this.kv) {
      try {
        await this.kv.delete(key);
      } catch (error) {
        console.warn('Error deleting from KV cache:', error);
      }
    }

    this.metrics.deletes++;
  }

  // Limpiar cache completo
  async clear(): Promise<void> {
    this.memoryCache.clear();

    if (this.kv) {
      // Nota: En producción, listar y eliminar todas las keys
      // Por simplicidad, solo limpiamos memoria por ahora
    }
  }

  // Obtener métricas de cache
  getMetrics(): CacheMetrics {
    return { ...this.metrics };
  }

  // Limpiar entradas expiradas
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now - entry.timestamp > entry.ttl * 1000) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.memoryCache.delete(key));
  }

  // Establecer en cache de memoria
  private setMemoryCache<T>(key: string, data: T, ttl: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      hits: 0
    };

    this.memoryCache.set(key, entry);
  }

  // Verificar si una entrada es válida
  private isValid(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    return (now - entry.timestamp) < (entry.ttl * 1000);
  }

  // Actualizar hit rate
  private updateHitRate(): void {
    if (this.config.enableMetrics && this.metrics.totalRequests > 0) {
      this.metrics.hitRate = (this.metrics.hits / this.metrics.totalRequests) * 100;
    }
  }

  // Destruir el cache (limpiar intervalos)
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Instancia global del cache
export const globalCache = new MultiLevelCache();

// Cache keys para diferentes tipos de datos
export const CacheKeys = {
  PROJECTS: 'projects:list',
  PROJECT: (id: string) => `projects:${id}`,
  USERS: 'users:list',
  USER: (id: string) => `users:${id}`,
  NEWS: 'news:list',
  NEWS_ARTICLE: (id: string) => `news:${id}`,
  EVENTS: 'events:list',
  EVENT: (id: string) => `events:${id}`,
  RESOURCES: 'resources:list',
  RESOURCE: (id: string) => `resources:${id}`,
  ANALYTICS: 'analytics:overview',
  PUBLIC_STATS: 'public:stats',
  HEALTH_CHECK: 'health:status'
} as const;

// Funciones helper para cache con TTL predefinido
export const cacheHelpers = {
  // Cache para datos que cambian frecuentemente (5 minutos)
  short: <T>(key: string, data: T) => globalCache.set(key, data, 300),

  // Cache para datos moderadamente estables (1 hora)
  medium: <T>(key: string, data: T) => globalCache.set(key, data, 3600),

  // Cache para datos estables (24 horas)
  long: <T>(key: string, data: T) => globalCache.set(key, data, 86400),

  // Cache para datos semi-permanentes (1 semana)
  permanent: <T>(key: string, data: T) => globalCache.set(key, data, 604800)
};