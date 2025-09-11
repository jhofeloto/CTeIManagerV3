// Utilidades JWT para autenticación
import { JWTPayload } from '../types/index';

const JWT_SECRET = 'ctei-manager-secret-key-2024'; // En producción usar variable de entorno
const JWT_ALGORITHM = 'HS256';

// Función para codificar en base64url
function base64urlEscape(str: string): string {
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Función para decodificar de base64url
function base64urlUnescape(str: string): string {
  str += new Array(5 - str.length % 4).join('=');
  return str.replace(/\-/g, '+').replace(/_/g, '/');
}

// Función para firmar con HMAC-SHA256
async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(data)
  );

  return base64urlEscape(btoa(String.fromCharCode(...new Uint8Array(signature))));
}

// Función para verificar firma HMAC-SHA256
async function verify(data: string, signature: string, secret: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const binarySignature = Uint8Array.from(
      atob(base64urlUnescape(signature)),
      c => c.charCodeAt(0)
    );

    return await crypto.subtle.verify(
      'HMAC',
      key,
      binarySignature,
      new TextEncoder().encode(data)
    );
  } catch {
    return false;
  }
}

export async function generateJWT(payload: Omit<JWTPayload, 'exp'>): Promise<string> {
  const header = {
    alg: JWT_ALGORITHM,
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const fullPayload: JWTPayload = {
    ...payload,
    exp: now + (24 * 60 * 60) // 24 horas
  };

  const encodedHeader = base64urlEscape(btoa(JSON.stringify(header)));
  const encodedPayload = base64urlEscape(btoa(JSON.stringify(fullPayload)));
  const data = `${encodedHeader}.${encodedPayload}`;
  
  const signature = await sign(data, JWT_SECRET);
  
  return `${data}.${signature}`;
}

export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    const data = `${encodedHeader}.${encodedPayload}`;

    const isValid = await verify(data, signature, JWT_SECRET);
    if (!isValid) {
      return null;
    }

    const payload: JWTPayload = JSON.parse(atob(base64urlUnescape(encodedPayload)));
    
    // Verificar expiración
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  // Implementación simple de hash para el ejemplo
  // En producción usar bcrypt o similar
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'salt-ctei-manager');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computedHash = await hashPassword(password);
  return computedHash === hash;
}