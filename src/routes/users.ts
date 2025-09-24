// CODECTI Platform - User Management Routes

import { Hono } from 'hono';
import type { Bindings, User, CreateUserRequest, UpdateUserRequest, UsersListResponse, UserResponse } from '../types';
import { authMiddleware, adminMiddleware } from '../utils/middleware';
import { hashPassword } from '../utils/auth';

const users = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware to all routes
users.use('/*', authMiddleware);

// Apply admin middleware to all routes (only admins can manage users)
users.use('/*', adminMiddleware);

// Get all users with search and filter functionality
users.get('/', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const role = c.req.query('role') || '';
    const status = c.req.query('status') || '';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, name, role, institution, created_at, is_active 
      FROM users
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const params: any[] = [];
    const conditions: string[] = [];

    // Add search condition
    if (search) {
      conditions.push('(name LIKE ? OR email LIKE ? OR institution LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add role filter
    if (role && ['admin', 'collaborator', 'researcher'].includes(role)) {
      conditions.push('role = ?');
      params.push(role);
    }

    // Add status filter
    if (status) {
      if (status === 'active') {
        conditions.push('is_active = 1');
      } else if (status === 'inactive') {
        conditions.push('is_active = 0');
      }
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Add ORDER BY clause
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';

    // Get users
    let usersResult: any;
    let countResult: any;
    
    if (c.env.DB) {
      usersResult = await c.env.DB.prepare(query)
        .bind(...params, limit, offset)
        .all();

      countResult = await c.env.DB.prepare(countQuery)
        .bind(...params)
        .first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      const result = await mockDb.getUsers(search, role, status, limit, offset);
      usersResult = { results: result.results };
      countResult = { total: result.total };
    }

    const usersList: User[] = usersResult.results.map((row: any) => ({
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      institution: row.institution,
      created_at: row.created_at,
      is_active: row.is_active
    }));

    return c.json<UsersListResponse>({
      success: true,
      users: usersList,
      total: countResult.total || 0
    });

  } catch (error) {
    console.error('Get users error:', error);
    return c.json<UsersListResponse>({
      success: false,
      users: [],
      total: 0,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Get user by ID
users.get('/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    
    if (!userId) {
      return c.json<UserResponse>({
        success: false,
        message: 'ID de usuario inválido'
      }, 400);
    }

    let user: any;
    if (c.env.DB) {
      user = await c.env.DB.prepare(`
        SELECT id, email, name, role, institution, created_at, is_active 
        FROM users 
        WHERE id = ?
      `).bind(userId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      user = await mockDb.getUserById(userId);
    }

    if (!user) {
      return c.json<UserResponse>({
        success: false,
        message: 'Usuario no encontrado'
      }, 404);
    }

    const userData: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      institution: user.institution,
      created_at: user.created_at,
      is_active: user.is_active
    };

    return c.json<UserResponse>({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('Get user error:', error);
    return c.json<UserResponse>({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Create new user
users.post('/', async (c) => {
  try {
    const { name, email, institution, password, role }: CreateUserRequest = await c.req.json();

    // Validate required fields
    if (!name || !email || !institution || !password || !role) {
      return c.json<UserResponse>({
        success: false,
        message: 'Todos los campos son requeridos: nombre, email, institución, contraseña y rol'
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json<UserResponse>({
        success: false,
        message: 'Formato de email inválido'
      }, 400);
    }

    // Validate password length
    if (password.length < 6) {
      return c.json<UserResponse>({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      }, 400);
    }

    // Validate role
    if (!['admin', 'collaborator', 'researcher'].includes(role)) {
      return c.json<UserResponse>({
        success: false,
        message: 'Rol debe ser "admin", "collaborator" o "researcher"'
      }, 400);
    }

    // Check if user already exists
    let existingUser: any;
    if (c.env.DB) {
      existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(email).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      existingUser = await mockDb.getUserByEmail(email);
    }

    if (existingUser) {
      return c.json<UserResponse>({
        success: false,
        message: 'Ya existe un usuario con este email'
      }, 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    let createdUser: any;
    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        INSERT INTO users (name, email, institution, password_hash, role, is_active, created_at) 
        VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
      `).bind(name, email, institution, passwordHash, role).run();
      
      if (!result.success) {
        return c.json<UserResponse>({
          success: false,
          message: 'Error al crear el usuario'
        }, 500);
      }

      // Get the created user
      createdUser = await c.env.DB.prepare(`
        SELECT id, email, name, role, institution, created_at, is_active 
        FROM users 
        WHERE id = ?
      `).bind(result.meta.last_row_id).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      createdUser = await mockDb.createUser({
        name,
        email,
        institution,
        password_hash: passwordHash,
        role: role as 'admin' | 'collaborator' | 'researcher'
      });
    }

    const userData: User = {
      id: createdUser.id,
      email: createdUser.email,
      name: createdUser.name,
      role: createdUser.role,
      institution: createdUser.institution,
      created_at: createdUser.created_at,
      is_active: createdUser.is_active
    };

    return c.json<UserResponse>({
      success: true,
      user: userData,
      message: 'Usuario creado exitosamente'
    }, 201);

  } catch (error) {
    console.error('Create user error:', error);
    return c.json<UserResponse>({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Update user
users.put('/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { name, email, institution, role, is_active }: UpdateUserRequest = await c.req.json();
    
    if (!userId) {
      return c.json<UserResponse>({
        success: false,
        message: 'ID de usuario inválido'
      }, 400);
    }

    // Validate required fields
    if (!name || !email || !institution || !role) {
      return c.json<UserResponse>({
        success: false,
        message: 'Los campos nombre, email, institución y rol son requeridos'
      }, 400);
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json<UserResponse>({
        success: false,
        message: 'Formato de email inválido'
      }, 400);
    }

    // Validate role
    if (!['admin', 'collaborator', 'researcher'].includes(role)) {
      return c.json<UserResponse>({
        success: false,
        message: 'Rol debe ser "admin", "collaborator" o "researcher"'
      }, 400);
    }

    // Check if user exists
    let existingUser: any;
    if (c.env.DB) {
      existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE id = ?'
      ).bind(userId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      existingUser = await mockDb.getUserById(userId);
    }

    if (!existingUser) {
      return c.json<UserResponse>({
        success: false,
        message: 'Usuario no encontrado'
      }, 404);
    }

    // Check if email is already used by another user
    if (c.env.DB) {
      const emailCheck = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ? AND id != ?'
      ).bind(email, userId).first() as any;
      
      if (emailCheck) {
        return c.json<UserResponse>({
          success: false,
          message: 'El email ya está en uso por otro usuario'
        }, 409);
      }
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      const emailCheck = await mockDb.getUserByEmail(email);
      if (emailCheck && emailCheck.id !== userId) {
        return c.json<UserResponse>({
          success: false,
          message: 'El email ya está en uso por otro usuario'
        }, 409);
      }
    }

    // Update user
    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET name = ?, email = ?, institution = ?, role = ?, is_active = ?
        WHERE id = ?
      `).bind(name, email, institution, role, is_active ? 1 : 0, userId).run();
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      await mockDb.updateUser(userId, {
        name,
        email,
        institution,
        role,
        is_active
      });
    }

    // Get updated user
    let updatedUser: any;
    if (c.env.DB) {
      updatedUser = await c.env.DB.prepare(`
        SELECT id, email, name, role, institution, created_at, is_active 
        FROM users 
        WHERE id = ?
      `).bind(userId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      updatedUser = await mockDb.getUserById(userId);
    }

    const userData: User = {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      institution: updatedUser.institution,
      created_at: updatedUser.created_at,
      is_active: updatedUser.is_active
    };

    return c.json<UserResponse>({
      success: true,
      user: userData,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Update user error:', error);
    return c.json<UserResponse>({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Reset user password
users.post('/:id/reset-password', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { new_password } = await c.req.json();
    
    if (!userId) {
      return c.json({
        success: false,
        message: 'ID de usuario inválido'
      }, 400);
    }

    if (!new_password || new_password.length < 6) {
      return c.json({
        success: false,
        message: 'La nueva contraseña debe tener al menos 6 caracteres'
      }, 400);
    }

    // Check if user exists
    let existingUser: any;
    if (c.env.DB) {
      existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE id = ?'
      ).bind(userId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      existingUser = await mockDb.getUserById(userId);
    }

    if (!existingUser) {
      return c.json({
        success: false,
        message: 'Usuario no encontrado'
      }, 404);
    }

    // Hash new password
    const passwordHash = await hashPassword(new_password);

    // Update password
    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET password_hash = ?
        WHERE id = ?
      `).bind(passwordHash, userId).run();
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      await mockDb.resetUserPassword(userId, passwordHash);
    }

    return c.json({
      success: true,
      message: 'Contraseña restablecida exitosamente'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Delete user (soft delete - set is_active to false)
users.delete('/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const currentUser = c.get('user');
    
    if (!userId) {
      return c.json({
        success: false,
        message: 'ID de usuario inválido'
      }, 400);
    }

    // Prevent admin from deleting themselves
    if (userId === currentUser.userId) {
      return c.json({
        success: false,
        message: 'No puedes eliminar tu propia cuenta'
      }, 400);
    }

    // Check if user exists
    let existingUser: any;
    if (c.env.DB) {
      existingUser = await c.env.DB.prepare(
        'SELECT id FROM users WHERE id = ?'
      ).bind(userId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      existingUser = await mockDb.getUserById(userId);
    }

    if (!existingUser) {
      return c.json({
        success: false,
        message: 'Usuario no encontrado'
      }, 404);
    }

    // Soft delete (deactivate user)
    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE users 
        SET is_active = 0
        WHERE id = ?
      `).bind(userId).run();
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      await mockDb.deactivateUser(userId);
    }

    return c.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return c.json({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

export default users;