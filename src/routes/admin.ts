// Rutas de administrador (solo ADMIN)
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import { Bindings, APIResponse, JWTPayload } from '../types/index';

const adminRoutes = new Hono<{ Bindings: Bindings; Variables: { user?: JWTPayload } }>();

// Aplicar middleware de autenticación y rol de admin
adminRoutes.use('/*', authMiddleware);
adminRoutes.use('/*', requireRole('ADMIN'));

// ===== GESTIÓN DE USUARIOS =====

// Listar todos los usuarios
adminRoutes.get('/users', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const role = c.req.query('role') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, email, full_name, role, created_at, updated_at
      FROM users
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (full_name LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (role) {
      query += ` AND role = ?`;
      params.push(role);
    }

    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const users = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (full_name LIKE ? OR email LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }

    if (role) {
      countQuery += ` AND role = ?`;
      countParams.push(role);
    }

    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const total = totalResult?.total || 0;

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        users: users.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Actualizar usuario (cambiar rol principalmente)
adminRoutes.put('/users/:id', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const body = await c.req.json<{ role?: string; full_name?: string }>();

    const updateFields: string[] = [];
    const params: any[] = [];

    if (body.role && ['ADMIN', 'INVESTIGATOR', 'COMMUNITY'].includes(body.role)) {
      updateFields.push('role = ?');
      params.push(body.role);
    }

    if (body.full_name) {
      updateFields.push('full_name = ?');
      params.push(body.full_name);
    }

    if (updateFields.length === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'No hay campos válidos para actualizar' 
      }, 400);
    }

    params.push(userId);

    const result = await c.env.DB.prepare(`
      UPDATE users 
      SET ${updateFields.join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `).bind(...params).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al actualizar el usuario' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Eliminar usuario
adminRoutes.delete('/users/:id', async (c) => {
  try {
    const currentUser = c.get('user')!;
    const userId = parseInt(c.req.param('id'));

    // Evitar que el admin se elimine a sí mismo
    if (userId === currentUser.userId) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'No puedes eliminar tu propio usuario' 
      }, 400);
    }

    const result = await c.env.DB.prepare(
      'DELETE FROM users WHERE id = ?'
    ).bind(userId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al eliminar el usuario' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== GESTIÓN GLOBAL DE PROYECTOS =====

// Listar todos los proyectos (públicos y privados)
adminRoutes.get('/projects', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const is_public = c.req.query('is_public');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.introduction, 
        p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
        u.full_name as owner_name, u.email as owner_email
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR u.full_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (is_public !== undefined && is_public !== '') {
      query += ` AND p.is_public = ?`;
      params.push(parseInt(is_public));
    }

    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const projects = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total
    let countQuery = 'SELECT COUNT(*) as total FROM projects p JOIN users u ON p.owner_id = u.id WHERE 1=1';
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR u.full_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (is_public !== undefined && is_public !== '') {
      countQuery += ` AND p.is_public = ?`;
      countParams.push(parseInt(is_public));
    }

    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const total = totalResult?.total || 0;

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        projects: projects.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo todos los proyectos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Eliminar cualquier proyecto
adminRoutes.delete('/projects/:id', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));

    const result = await c.env.DB.prepare(
      'DELETE FROM projects WHERE id = ?'
    ).bind(projectId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al eliminar el proyecto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Proyecto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando proyecto (admin):', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Cambiar estado de publicación de cualquier proyecto
adminRoutes.post('/projects/:id/publish', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));
    const { is_public } = await c.req.json<{ is_public: boolean }>();

    const result = await c.env.DB.prepare(`
      UPDATE projects 
      SET is_public = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(is_public ? 1 : 0, projectId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al actualizar el estado del proyecto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: `Proyecto ${is_public ? 'publicado' : 'despublicado'} exitosamente`
    });

  } catch (error) {
    console.error('Error actualizando estado del proyecto (admin):', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== GESTIÓN DE CATEGORÍAS DE PRODUCTOS =====

// Listar todas las categorías de productos
adminRoutes.get('/product-categories', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT code, name, description, category_group, impact_weight, created_at
      FROM product_categories 
      ORDER BY category_group, impact_weight DESC, name
    `).all();

    return c.json<APIResponse<{ categories: any[] }>>({
      success: true,
      data: { categories: categories.results }
    });

  } catch (error) {
    console.error('Error obteniendo categorías:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Crear nueva categoría de producto
adminRoutes.post('/product-categories', async (c) => {
  try {
    const body = await c.req.json<{
      code: string;
      name: string;
      description?: string;
      category_group: string;
      impact_weight: number;
    }>();

    // Validar campos requeridos
    if (!body.code || !body.name || !body.category_group || body.impact_weight === undefined) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Código, nombre, grupo de categoría y peso de impacto son requeridos' 
      }, 400);
    }

    // Verificar que el código no exista
    const existing = await c.env.DB.prepare(
      'SELECT code FROM product_categories WHERE code = ?'
    ).bind(body.code).first();

    if (existing) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'El código de categoría ya existe' 
      }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO product_categories (code, name, description, category_group, impact_weight)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      body.code,
      body.name,
      body.description || null,
      body.category_group,
      body.impact_weight
    ).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al crear la categoría' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Categoría creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando categoría:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Actualizar categoría de producto
adminRoutes.put('/product-categories/:code', async (c) => {
  try {
    const code = c.req.param('code');
    const body = await c.req.json<{
      name?: string;
      description?: string;
      category_group?: string;
      impact_weight?: number;
    }>();

    // Verificar que la categoría existe
    const existing = await c.env.DB.prepare(
      'SELECT code FROM product_categories WHERE code = ?'
    ).bind(code).first();

    if (!existing) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Categoría no encontrada' 
      }, 404);
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (body.name) {
      updateFields.push('name = ?');
      params.push(body.name);
    }

    if (body.description !== undefined) {
      updateFields.push('description = ?');
      params.push(body.description || null);
    }

    if (body.category_group) {
      updateFields.push('category_group = ?');
      params.push(body.category_group);
    }

    if (body.impact_weight !== undefined) {
      updateFields.push('impact_weight = ?');
      params.push(body.impact_weight);
    }

    if (updateFields.length === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'No hay campos válidos para actualizar' 
      }, 400);
    }

    params.push(code);

    const result = await c.env.DB.prepare(`
      UPDATE product_categories 
      SET ${updateFields.join(', ')}
      WHERE code = ?
    `).bind(...params).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al actualizar la categoría' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Categoría actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Eliminar categoría de producto
adminRoutes.delete('/product-categories/:code', async (c) => {
  try {
    const code = c.req.param('code');

    // Verificar si hay productos usando esta categoría
    const productsUsingCategory = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM products WHERE product_type = ?'
    ).bind(code).first<{ count: number }>();

    if (productsUsingCategory && productsUsingCategory.count > 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: `No se puede eliminar la categoría. Hay ${productsUsingCategory.count} producto(s) usando esta categoría` 
      }, 400);
    }

    const result = await c.env.DB.prepare(
      'DELETE FROM product_categories WHERE code = ?'
    ).bind(code).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al eliminar la categoría' 
      }, 500);
    }

    if (result.changes === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Categoría no encontrada' 
      }, 404);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Categoría eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando categoría:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== ESTADÍSTICAS GLOBALES =====

// Dashboard completo de administrador
adminRoutes.get('/dashboard/stats', async (c) => {
  try {
    // Estadísticas de usuarios
    const userStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'ADMIN' THEN 1 END) as admins,
        COUNT(CASE WHEN role = 'INVESTIGATOR' THEN 1 END) as investigators,
        COUNT(CASE WHEN role = 'COMMUNITY' THEN 1 END) as community
      FROM users
    `).first();

    // Estadísticas de proyectos
    const projectStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_projects,
        COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_projects
      FROM projects
    `).first();

    // Estadísticas de productos
    const productStats = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_products,
        COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_products
      FROM products
    `).first();

    // Productos por tipo
    const productsByType = await c.env.DB.prepare(`
      SELECT product_type, COUNT(*) as count 
      FROM products 
      GROUP BY product_type
      ORDER BY count DESC
    `).all();

    // Actividad reciente (proyectos creados en los últimos 30 días)
    const recentActivity = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as recent_projects
      FROM projects 
      WHERE created_at >= date('now', '-30 days')
    `).first();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        users: userStats,
        projects: projectStats,
        products: productStats,
        productsByType: Object.fromEntries(
          productsByType.results.map((item: any) => [item.product_type, item.count])
        ),
        recentActivity
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de admin:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

export { adminRoutes };