// CODECTI Platform - Monitoring API Integration Tests

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import monitoring from '../../src/routes/monitoring';
import { auth } from '../../src/routes/auth';
import { createTestApp, createAuthenticatedRequest, createAuthHeaders } from '../setup/integration';

describe('Monitoring API Integration', () => {
  let app: Hono;
  let adminToken: string;
  let collaboratorToken: string;
  
  beforeEach(async () => {
    try {
      app = createTestApp();
      app.route('/api/auth', auth);
      app.route('/api/monitoring', monitoring);

      // Get admin token
      adminToken = await createAuthenticatedRequest(app, 'admin');

      // Get collaborator token
      collaboratorToken = await createAuthenticatedRequest(app, 'collaborator');
    } catch (error) {
      console.error('Login error:', error);
      // Set empty tokens to avoid undefined errors in tests
      adminToken = '';
      collaboratorToken = '';
    }
  });

  describe('Public Health Endpoints', () => {
    describe('GET /api/monitoring/health', () => {
      it('should return health status', async () => {
        const response = await app.request('/api/monitoring/health');

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.status).toBe('ok');
        expect(data.timestamp).toBeDefined();
        expect(data.uptime).toBeGreaterThanOrEqual(0);
      });

      it('should not require authentication', async () => {
        const response = await app.request('/api/monitoring/health');
        expect(response.status).toBe(200);
      });
    });

    describe('GET /api/monitoring/ready', () => {
      it('should return readiness status', async () => {
        const response = await app.request('/api/monitoring/ready');

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.ready).toBeDefined();
        expect(data.status).toBeDefined();
        expect(data.timestamp).toBeDefined();
      });
    });

    describe('GET /api/monitoring/alive', () => {
      it('should return liveness status', async () => {
        const response = await app.request('/api/monitoring/alive');

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.alive).toBe(true);
        expect(data.timestamp).toBeDefined();
        expect(data.pid).toBeDefined();
      });
    });
  });

  describe('Admin Monitoring Endpoints', () => {
    describe('GET /api/monitoring/admin/status', () => {
      it('should return system status for admin', async () => {
        const response = await app.request('/api/monitoring/admin/status', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.status).toBeDefined();
        expect(data.data.checks).toBeDefined();
        expect(data.data.metrics).toBeDefined();
        expect(Array.isArray(data.data.checks)).toBe(true);
      });

      it('should reject non-admin users', async () => {
        const response = await app.request('/api/monitoring/admin/status', {
          headers: {
            'Authorization': `Bearer ${collaboratorToken}`
          }
        });

        expect(response.status).toBe(403);
        
        const data = await response.json();
        expect(data.success).toBe(false);
        expect(data.message).toContain('privilegios de administrador');
      });

      it('should reject unauthenticated requests', async () => {
        const response = await app.request('/api/monitoring/admin/status');

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/monitoring/admin/metrics', () => {
      it('should return metrics for admin', async () => {
        const response = await app.request('/api/monitoring/admin/metrics', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.data.logs).toBeDefined();
        expect(data.data.errors).toBeDefined();
        expect(data.data.timestamp).toBeDefined();
      });

      it('should reject non-admin users', async () => {
        const response = await app.request('/api/monitoring/admin/metrics', {
          headers: {
            'Authorization': `Bearer ${collaboratorToken}`
          }
        });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/monitoring/admin/logs', () => {
      it('should return logs for admin', async () => {
        const response = await app.request('/api/monitoring/admin/logs', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(Array.isArray(data.data.logs)).toBe(true);
        expect(data.data.total).toBeDefined();
        expect(data.data.filters).toBeDefined();
      });

      it('should support query parameters', async () => {
        const response = await app.request('/api/monitoring/admin/logs?level=INFO&limit=10&search=test', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.data.filters.level).toBe('INFO');
        expect(data.data.filters.limit).toBe(10);
        expect(data.data.filters.search).toBe('test');
      });

      it('should reject non-admin users', async () => {
        const response = await app.request('/api/monitoring/admin/logs', {
          headers: {
            'Authorization': `Bearer ${collaboratorToken}`
          }
        });

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/monitoring/admin/errors', () => {
      it('should return errors for admin', async () => {
        const response = await app.request('/api/monitoring/admin/errors', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(Array.isArray(data.data.errors)).toBe(true);
        expect(data.data.stats).toBeDefined();
        expect(data.data.filters).toBeDefined();
      });

      it('should support filtering parameters', async () => {
        const response = await app.request('/api/monitoring/admin/errors?severity=critical&resolved=false&limit=5', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.data.filters.severity).toBe('critical');
        expect(data.data.filters.resolved).toBe(false);
        expect(data.data.filters.limit).toBe(5);
      });
    });

    describe('PATCH /api/monitoring/admin/errors/:id/resolve', () => {
      it('should handle error resolution', async () => {
        const errorId = 'test-error-id';
        
        const response = await app.request(`/api/monitoring/admin/errors/${errorId}/resolve`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        // Could be 200 (resolved) or 404 (not found) depending on if error exists
        expect([200, 404]).toContain(response.status);
        
        const data = await response.json();
        expect(data.success).toBeDefined();
        expect(data.message).toBeDefined();
      });

      it('should reject non-admin users', async () => {
        const response = await app.request('/api/monitoring/admin/errors/test/resolve', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${collaboratorToken}`
          }
        });

        expect(response.status).toBe(403);
      });
    });

    describe('DELETE /api/monitoring/admin/logs/cleanup', () => {
      it('should cleanup old logs', async () => {
        const response = await app.request('/api/monitoring/admin/logs/cleanup?hours=24', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('24 horas');
      });

      it('should use default hours if not specified', async () => {
        const response = await app.request('/api/monitoring/admin/logs/cleanup', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('168 horas'); // 7 days default
      });
    });

    describe('DELETE /api/monitoring/admin/errors/cleanup', () => {
      it('should cleanup old errors', async () => {
        const response = await app.request('/api/monitoring/admin/errors/cleanup?days=7', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('7 días');
      });
    });

    describe('GET /api/monitoring/admin/logs/export', () => {
      it('should export logs as JSON', async () => {
        const response = await app.request('/api/monitoring/admin/logs/export?format=json', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/json');
        expect(response.headers.get('Content-Disposition')).toContain('attachment');
        expect(response.headers.get('Content-Disposition')).toContain('.json');
      });

      it('should export logs as CSV', async () => {
        const response = await app.request('/api/monitoring/admin/logs/export?format=csv', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('text/csv');
        expect(response.headers.get('Content-Disposition')).toContain('attachment');
        expect(response.headers.get('Content-Disposition')).toContain('.csv');
      });

      it('should default to JSON format', async () => {
        const response = await app.request('/api/monitoring/admin/logs/export', {
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        expect(response.headers.get('Content-Type')).toBe('application/json');
      });
    });

    describe('POST /api/monitoring/admin/health-check', () => {
      it('should force health check execution', async () => {
        const response = await app.request('/api/monitoring/admin/health-check', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.data).toBeDefined();
        expect(data.message).toContain('Health check ejecutado exitosamente');
      });
    });

    describe('POST /api/monitoring/admin/test-load', () => {
      it('should generate test load data', async () => {
        const response = await app.request('/api/monitoring/admin/test-load', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`
          }
        });

        expect(response.status).toBe(200);
        
        const data = await response.json();
        expect(data.success).toBe(true);
        expect(data.message).toContain('Datos de prueba generados');
      });

      it('should reject non-admin users', async () => {
        const response = await app.request('/api/monitoring/admin/test-load', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${collaboratorToken}`
          }
        });

        expect(response.status).toBe(403);
      });
    });
  });
});