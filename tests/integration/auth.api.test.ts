// CODECTI Platform - Auth API Integration Tests

import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { auth } from '../../src/routes/auth';
import { createTestApp } from '../setup/integration';

describe('Auth API Integration', () => {
  let app: Hono;
  
  beforeEach(() => {
    app = createTestApp();
    app.route('/api/auth', auth);
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@codecti.choco.gov.co',
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.token).toBeDefined();
      expect(data.user.email).toBe('admin@codecti.choco.gov.co');
      expect(data.user.role).toBe('admin');
      expect(data.user.name).toBe('Administrador Sistema');
    });

    it('should reject invalid credentials', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@codecti.choco.gov.co',
          password: 'wrongpassword'
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Credenciales inválidas');
      expect(data.user).toBeUndefined();
      expect(data.token).toBeUndefined();
    });

    it('should reject non-existent user', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'nonexistent@codecti.choco.gov.co',
          password: 'password123'
        })
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Credenciales inválidas');
    });

    it('should validate required fields', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@codecti.choco.gov.co'
          // Missing password
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Email y contraseña son requeridos');
    });

    it('should handle empty email', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: '',
          password: 'password123'
        })
      });

      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data.success).toBe(false);
    });

    it('should handle malformed JSON', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json'
      });

      expect(response.status).toBe(500);
    });

    it('should login collaborator user', async () => {
      const response = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'investigador1@codecti.choco.gov.co',
          password: 'password123'
        })
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user.role).toBe('collaborator');
      expect(data.user.name).toBe('Investigador Colaborador');
    });
  });

  describe('POST /api/auth/verify', () => {
    let validToken: string;

    beforeEach(async () => {
      // Get a valid token first
      const loginResponse = await app.request('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'admin@codecti.choco.gov.co',
          password: 'password123'
        })
      });
      
      const loginData = await loginResponse.json();
      validToken = loginData.token;
    });

    it('should verify valid token', async () => {
      const response = await app.request('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${validToken}`
        }
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.user).toBeDefined();
      expect(data.user.email).toBe('admin@codecti.choco.gov.co');
    });

    it('should reject missing token', async () => {
      const response = await app.request('/api/auth/verify', {
        method: 'POST'
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Token no proporcionado');
    });

    it('should reject malformed authorization header', async () => {
      const response = await app.request('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': 'InvalidFormat'
        }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Token no proporcionado');
    });

    it('should reject invalid token', async () => {
      const response = await app.request('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer invalid.token.here'
        }
      });

      expect(response.status).toBe(401);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.message).toContain('Token inválido o expirado');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should always return success', async () => {
      const response = await app.request('/api/auth/logout', {
        method: 'POST'
      });

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toContain('Sesión cerrada exitosamente');
    });

    it('should work with or without token', async () => {
      const responseWithToken = await app.request('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer some.token.here'
        }
      });

      const responseWithoutToken = await app.request('/api/auth/logout', {
        method: 'POST'
      });

      expect(responseWithToken.status).toBe(200);
      expect(responseWithoutToken.status).toBe(200);
    });
  });
});