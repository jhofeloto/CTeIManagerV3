// Pool de Conexiones para D1 Database
// Optimiza el rendimiento mediante reutilización de conexiones

import type { D1Database } from '@cloudflare/workers-types';

export interface DatabasePoolConfig {
  maxConnections: number;
  maxIdleTime: number; // Tiempo máximo que una conexión puede estar idle (ms)
  acquireTimeout: number; // Timeout para adquirir una conexión (ms)
  enableMetrics: boolean;
}

export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  waitingRequests: number;
  acquiredPerSecond: number;
  releasedPerSecond: number;
  timeouts: number;
}

export class D1ConnectionPool {
  private connections: D1Database[] = [];
  private activeConnections: Set<D1Database> = new Set();
  private waitingQueue: Array<{
    resolve: (conn: D1Database) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }> = [];

  private stats = {
    acquired: 0,
    released: 0,
    timeouts: 0,
    created: 0,
    destroyed: 0
  };

  private config: DatabasePoolConfig;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private lastStatsReset = Date.now();

  constructor(config: Partial<DatabasePoolConfig> = {}) {
    this.config = {
      maxConnections: 5, // Máximo de conexiones concurrentes
      maxIdleTime: 30000, // 30 segundos máximo idle
      acquireTimeout: 5000, // 5 segundos timeout
      enableMetrics: true,
      ...config
    };

    // Cleanup automático cada 10 segundos
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, 10000);
  }

  // Obtener una conexión del pool
  async acquire(): Promise<D1Database> {
    const startTime = Date.now();

    // 1. Intentar obtener una conexión idle
    if (this.connections.length > 0) {
      const connection = this.connections.pop()!;
      this.activeConnections.add(connection);
      this.stats.acquired++;
      this.updateMetrics();
      return connection;
    }

    // 2. Verificar si podemos crear una nueva conexión
    if (this.activeConnections.size < this.config.maxConnections) {
      const connection = await this.createConnection();
      this.activeConnections.add(connection);
      this.stats.acquired++;
      this.updateMetrics();
      return connection;
    }

    // 3. Hacer cola si todas las conexiones están activas
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.waitingQueue = this.waitingQueue.filter(item => item !== queueItem);
        this.stats.timeouts++;
        reject(new Error(`Timeout acquiring database connection after ${this.config.acquireTimeout}ms`));
      }, this.config.acquireTimeout);

      const queueItem = { resolve, reject, timeout };
      this.waitingQueue.push(queueItem);
    });
  }

  // Liberar una conexión de vuelta al pool
  release(connection: D1Database): void {
    // Remover de conexiones activas
    this.activeConnections.delete(connection);

    // Verificar si hay solicitudes esperando
    if (this.waitingQueue.length > 0) {
      const waitingItem = this.waitingQueue.shift()!;
      clearTimeout(waitingItem.timeout);
      this.activeConnections.add(connection);
      waitingItem.resolve(connection);
      return;
    }

    // Devolver al pool de conexiones idle
    if (this.connections.length < this.config.maxConnections) {
      this.connections.push(connection);
      this.stats.released++;
      this.updateMetrics();
    } else {
      // Pool lleno, destruir la conexión
      this.destroyConnection(connection);
      this.stats.destroyed++;
    }
  }

  // Obtener estadísticas del pool
  getStats(): PoolStats {
    const now = Date.now();
    const timeElapsed = (now - this.lastStatsReset) / 1000; // en segundos

    return {
      totalConnections: this.connections.length + this.activeConnections.size,
      activeConnections: this.activeConnections.size,
      idleConnections: this.connections.length,
      waitingRequests: this.waitingQueue.length,
      acquiredPerSecond: timeElapsed > 0 ? this.stats.acquired / timeElapsed : 0,
      releasedPerSecond: timeElapsed > 0 ? this.stats.released / timeElapsed : 0,
      timeouts: this.stats.timeouts
    };
  }

  // Cerrar el pool y todas las conexiones
  async close(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // Destruir todas las conexiones idle
    for (const connection of this.connections) {
      await this.destroyConnection(connection);
    }
    this.connections = [];

    // Forzar liberación de conexiones activas (en producción, esperar a que terminen)
    for (const connection of this.activeConnections) {
      await this.destroyConnection(connection);
    }
    this.activeConnections.clear();

    // Rechazar todas las solicitudes pendientes
    for (const item of this.waitingQueue) {
      clearTimeout(item.timeout);
      item.reject(new Error('Database pool closed'));
    }
    this.waitingQueue = [];
  }

  // Crear una nueva conexión D1
  private async createConnection(): Promise<D1Database> {
    // Nota: En Cloudflare Workers, las conexiones D1 se obtienen del entorno
    // Esta es una implementación simplificada
    this.stats.created++;
    return this.getD1Connection();
  }

  // Destruir una conexión
  private async destroyConnection(connection: D1Database): Promise<void> {
    // En D1, las conexiones no necesitan limpieza explícita
    // pero podemos hacer cleanup si es necesario
  }

  // Limpiar conexiones idle antiguas
  private cleanupIdleConnections(): void {
    const now = Date.now();
    const maxIdleTime = this.config.maxIdleTime;

    this.connections = this.connections.filter(conn => {
      // En una implementación real, tendríamos timestamps de las conexiones
      // Por simplicidad, eliminamos conexiones antiguas periódicamente
      return Math.random() > 0.1; // Mantener 90% de las conexiones
    });
  }

  // Obtener conexión D1 del entorno (implementación específica)
  protected getD1Connection(): D1Database {
    // Esta función debería ser implementada por el usuario
    // para obtener la conexión D1 del entorno de Cloudflare Workers
    throw new Error('getD1Connection must be implemented by the user');
  }

  // Actualizar métricas
  private updateMetrics(): void {
    if (this.config.enableMetrics) {
      // Resetear métricas cada hora
      const now = Date.now();
      if (now - this.lastStatsReset > 3600000) {
        this.stats.acquired = 0;
        this.stats.released = 0;
        this.lastStatsReset = now;
      }
    }
  }
}

// Pool global para la aplicación
export class GlobalD1Pool extends D1ConnectionPool {
  private d1Connection: D1Database | null = null;

  constructor(config?: Partial<DatabasePoolConfig>) {
    super(config);
  }

  // Inicializar con conexión D1
  initialize(connection: D1Database): void {
    this.d1Connection = connection;
  }

  // Obtener conexión D1 del entorno
  protected getD1Connection(): D1Database {
    if (!this.d1Connection) {
      throw new Error('D1 connection not initialized. Call initialize() first.');
    }
    return this.d1Connection;
  }
}

// Middleware para usar el pool en Hono
export const createDatabaseMiddleware = (pool: D1ConnectionPool) => {
  return async (c: any, next: any) => {
    // Obtener conexión del pool
    const connection = await pool.acquire();

    // Agregar conexión al contexto de Hono
    c.set('db', connection);

    // Ejecutar el siguiente middleware
    await next();

    // Liberar conexión de vuelta al pool
    pool.release(connection);
  };
};

// Funciones helper para consultas comunes
export const dbHelpers = {
  // Ejecutar consulta con pool
  async query<T>(
    pool: D1ConnectionPool,
    sql: string,
    params: any[] = []
  ): Promise<T> {
    const connection = await pool.acquire();
    try {
      const result = await connection.prepare(sql).bind(...params).all();
      return result as T;
    } finally {
      pool.release(connection);
    }
  },

  // Ejecutar consulta que modifica datos
  async execute(
    pool: D1ConnectionPool,
    sql: string,
    params: any[] = []
  ): Promise<void> {
    const connection = await pool.acquire();
    try {
      await connection.prepare(sql).bind(...params).run();
    } finally {
      pool.release(connection);
    }
  },

  // Transacción con pool
  async transaction<T>(
    pool: D1ConnectionPool,
    operations: (connection: D1Database) => Promise<T>
  ): Promise<T> {
    const connection = await pool.acquire();
    try {
      // Nota: D1 no soporta transacciones nativas como SQL tradicional
      // Esta es una implementación simplificada
      const result = await operations(connection);
      return result;
    } finally {
      pool.release(connection);
    }
  }
};