// Middleware de autenticación
import { Context, Next } from 'hono';
import { verifyJWT } from '../utils/jwt';
import { JWTPayload, Bindings } from '../types/index';

export async function authMiddleware(c: Context<{ Bindings: Bindings; Variables: { user?: JWTPayload } }>, next: Next) {
  const authorization = c.req.header('Authorization');
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Token de autorización requerido' }, 401);
  }

  const token = authorization.slice(7); // Remover 'Bearer '
  
  try {
    const payload = await verifyJWT(token);
    
    if (!payload) {
      return c.json({ success: false, error: 'Token inválido o expirado' }, 401);
    }

    // Almacenar los datos del usuario en el contexto
    c.set('user', payload);
    
    await next();
  } catch (error) {
    return c.json({ success: false, error: 'Error de autenticación' }, 401);
  }
}

export function requireRole(...allowedRoles: string[]) {
  return async function(c: Context<{ Bindings: Bindings; Variables: { user?: JWTPayload } }>, next: Next) {
    const user = c.get('user');
    
    if (!user) {
      return c.json({ success: false, error: 'Usuario no autenticado' }, 401);
    }

    if (!allowedRoles.includes(user.role)) {
      return c.json({ 
        success: false, 
        error: `Acceso denegado. Roles permitidos: ${allowedRoles.join(', ')}` 
      }, 403);
    }

    await next();
  };
}