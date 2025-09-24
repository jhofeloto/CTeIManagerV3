// CODECTI Platform - Authentication Middleware

import { Context, Next } from 'hono';
import type { Bindings, JWTPayload } from '../types';
import { verifyJWT } from './auth';
import { JWT_SECRET } from '../routes/auth';

// Extend Hono's context to include user data
declare module 'hono' {
  interface ContextVariableMap {
    user: JWTPayload;
  }
}

export const authMiddleware = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({
        success: false,
        message: 'Token de autorización requerido'
      }, 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyJWT(token, JWT_SECRET);

    if (!payload) {
      return c.json({
        success: false,
        message: 'Token inválido o expirado'
      }, 401);
    }

    // Verify user still exists and is active
    let user: any;
    if (c.env.DB) {
      user = await c.env.DB.prepare(
        'SELECT id FROM users WHERE id = ? AND is_active = 1'
      ).bind(payload.userId).first();
    } else {
      // Use mock database for development
      const { mockDb } = await import('./mockDb');
      user = await mockDb.getUserById(payload.userId);
    }

    if (!user) {
      return c.json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      }, 401);
    }

    // Set user data in context
    c.set('user', payload);
    
    await next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return c.json({
      success: false,
      message: 'Error de autorización'
    }, 500);
  }
};

export const adminMiddleware = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const user = c.get('user');
  
  if (!user || user.role !== 'admin') {
    return c.json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de administrador.'
    }, 403);
  }

  await next();
};

export const collaboratorMiddleware = async (c: Context<{ Bindings: Bindings }>, next: Next) => {
  const user = c.get('user');
  
  if (!user || (user.role !== 'admin' && user.role !== 'collaborator')) {
    return c.json({
      success: false,
      message: 'Acceso denegado. Se requieren privilegios de colaborador o administrador.'
    }, 403);
  }

  await next();
};