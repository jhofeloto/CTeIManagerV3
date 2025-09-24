// Rutas de autenticación
import { Hono } from 'hono';
import { generateJWT, hashPassword, verifyPassword } from '../utils/jwt';
import { Bindings, LoginRequest, RegisterRequest, APIResponse, User } from '../types/index';

// Declaración para desarrollo
declare const console: any;

const auth = new Hono<{ Bindings: Bindings }>();

// Registro de usuario
auth.post('/register', async (c) => {
  try {
    const body: RegisterRequest = await c.req.json();
    const { email, password, full_name, role = 'COMMUNITY' } = body;

    // Validación básica
    if (!email || !password || !full_name) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Email, contraseña y nombre completo son requeridos' 
      }, 400);
    }

    // Verificar si el email ya existe
    const existingUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existingUser) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'El email ya está registrado' 
      }, 409);
    }

    // Hash de la contraseña
    const passwordHash = await hashPassword(password);

    // Insertar nuevo usuario
    const result = await c.env.DB.prepare(`
      INSERT INTO users (email, password_hash, full_name, role) 
      VALUES (?, ?, ?, ?)
    `).bind(email, passwordHash, full_name, role).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al crear el usuario' 
      }, 500);
    }

    // Generar JWT
    const token = await generateJWT({
      userId: result.meta.last_row_id as number,
      email,
      role
    });

    return c.json<APIResponse<{ token: string }>>({
      success: true,
      data: { token },
      message: 'Usuario registrado exitosamente'
    }, 201);

  } catch (error) {
    console.error('Error en registro:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Inicio de sesión
auth.post('/login', async (c) => {
  try {
    const body: LoginRequest = await c.req.json();
    const { email, password } = body;

    // Validación básica
    if (!email || !password) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Email y contraseña son requeridos' 
      }, 400);
    }

    // Buscar usuario por email
    const user = await c.env.DB.prepare(`
      SELECT id, email, password_hash, full_name, role 
      FROM users 
      WHERE email = ?
    `).bind(email).first<User & { password_hash: string }>();

    if (!user) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Email o contraseña incorrectos' 
      }, 401);
    }

    // Verificar contraseña - Modo desarrollo: comparación directa
    const isValidPassword = password === user.password_hash;
    
    if (!isValidPassword) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Email o contraseña incorrectos' 
      }, 401);
    }

    // Generar JWT
    const token = await generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Devolver token y datos del usuario (sin contraseña)
    const { password_hash, ...userWithoutPassword } = user;
    
    return c.json<APIResponse<{ token: string; user: User }>>({
      success: true,
      data: { 
        token, 
        user: userWithoutPassword as User
      },
      message: 'Inicio de sesión exitoso'
    });

  } catch (error) {
    console.error('Error en login:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

export { auth };