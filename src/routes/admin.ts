// Rutas de administrador (solo ADMIN)
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import { hashPassword } from '../utils/jwt';
import { Bindings, APIResponse, JWTPayload } from '../types/index';

const adminRoutes = new Hono<{ Bindings: Bindings; Variables: { user?: JWTPayload } }>();

// Aplicar middleware de autenticación y rol de admin
adminRoutes.use('/*', authMiddleware);
adminRoutes.use('/*', requireRole('ADMIN'));

// ===== GESTIÓN DE CONFIGURACIÓN =====

// Obtener configuración actual del sitio
adminRoutes.get('/site-config', async (c) => {
  try {
    // Obtener configuración almacenada en KV o D1
    const logoUrl = await c.env.KV?.get('site_logo_url') || null;
    const siteName = await c.env.KV?.get('site_name') || 'CTeI-Manager';
    
    const response: APIResponse<any> = {
      success: true,
      data: {
        logo_url: logoUrl,
        site_name: siteName
      }
    };
    return c.json(response);
  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    const response: APIResponse<null> = {
      success: false,
      error: 'Error al obtener la configuración del sitio'
    };
    return c.json(response, 500);
  }
});

// Actualizar logo del sitio
adminRoutes.post('/upload-logo', async (c) => {
  try {
    const formData = await c.req.formData();
    const logoFile = formData.get('logo') as File;
    
    if (!logoFile) {
      const response: APIResponse<null> = {
        success: false,
        error: 'No se proporcionó ningún archivo de logo'
      };
      return c.json(response, 400);
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(logoFile.type)) {
      const response: APIResponse<null> = {
        success: false,
        error: 'Solo se permiten archivos JPG y PNG'
      };
      return c.json(response, 400);
    }

    // Validar tamaño (máximo 2MB)
    if (logoFile.size > 2 * 1024 * 1024) {
      const response: APIResponse<null> = {
        success: false,
        error: 'El archivo no puede superar 2MB'
      };
      return c.json(response, 400);
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = logoFile.name.split('.').pop();
    const fileName = `logo-${timestamp}.${extension}`;
    
    // Subir a R2 Storage de Cloudflare
    if (c.env.R2) {
      const arrayBuffer = await logoFile.arrayBuffer();
      
      // Eliminar logo anterior si existe
      const oldLogoUrl = await c.env.KV?.get('site_logo_url');
      if (oldLogoUrl) {
        try {
          const oldFileName = oldLogoUrl.split('/').pop();
          if (oldFileName && oldFileName.startsWith('logo-')) {
            await c.env.R2.delete(`logos/${oldFileName}`);
          }
        } catch (error) {
          console.warn('Error eliminando logo anterior:', error);
        }
      }
      
      // Subir nuevo logo
      await c.env.R2.put(`logos/${fileName}`, arrayBuffer, {
        httpMetadata: {
          contentType: logoFile.type,
        },
      });
      
      // Construir URL del logo
      const logoUrl = `/api/admin/logo/${fileName}`;
      
      // Guardar URL en KV para persistencia
      await c.env.KV?.put('site_logo_url', logoUrl);
      
      const response: APIResponse<any> = {
        success: true,
        data: {
          logo_url: logoUrl,
          message: 'Logo actualizado exitosamente'
        }
      };
      return c.json(response);
    } else {
      // Fallback: guardar como base64 en KV si no hay R2
      const arrayBuffer = await logoFile.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const dataUrl = `data:${logoFile.type};base64,${base64}`;
      
      // Eliminar logo anterior
      await c.env.KV?.delete('site_logo_url');
      
      // Guardar nuevo logo
      await c.env.KV?.put('site_logo_url', dataUrl);
      
      const response: APIResponse<any> = {
        success: true,
        data: {
          logo_url: dataUrl,
          message: 'Logo actualizado exitosamente (almacenado como base64)'
        }
      };
      return c.json(response);
    }
  } catch (error) {
    console.error('Error subiendo logo:', error);
    const response: APIResponse<null> = {
      success: false,
      error: 'Error al subir el logo'
    };
    return c.json(response, 500);
  }
});

// Servir logo desde R2
adminRoutes.get('/logo/:fileName', async (c) => {
  try {
    const fileName = c.req.param('fileName');
    
    if (c.env.R2) {
      const object = await c.env.R2.get(`logos/${fileName}`);
      
      if (!object) {
        return c.notFound();
      }
      
      const headers = new Headers();
      headers.set('Content-Type', object.httpMetadata?.contentType || 'image/jpeg');
      headers.set('Cache-Control', 'public, max-age=31536000'); // Cache por 1 año
      
      return new Response(object.body, { headers });
    } else {
      return c.notFound();
    }
  } catch (error) {
    console.error('Error sirviendo logo:', error);
    return c.notFound();
  }
});

// Eliminar logo actual
adminRoutes.delete('/logo', async (c) => {
  try {
    const logoUrl = await c.env.KV?.get('site_logo_url');
    
    if (logoUrl && c.env.R2) {
      // Eliminar de R2 si es una URL de archivo
      if (logoUrl.startsWith('/api/admin/logo/')) {
        const fileName = logoUrl.split('/').pop();
        if (fileName) {
          await c.env.R2.delete(`logos/${fileName}`);
        }
      }
    }
    
    // Eliminar referencia en KV
    await c.env.KV?.delete('site_logo_url');
    
    const response: APIResponse<any> = {
      success: true,
      data: {
        message: 'Logo eliminado exitosamente'
      }
    };
    return c.json(response);
  } catch (error) {
    console.error('Error eliminando logo:', error);
    const response: APIResponse<null> = {
      success: false,
      error: 'Error al eliminar el logo'
    };
    return c.json(response, 500);
  }
});

// ===== GESTIÓN DE PRODUCTOS =====

// Listar todos los productos (para administrador)
adminRoutes.get('/products', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const category = c.req.query('category') || '';
    const projectId = c.req.query('project_id') || '';
    const isPublic = c.req.query('is_public');
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        pr.id, pr.project_id, pr.product_code, pr.product_type, pr.description,
        pr.is_public, pr.created_at, pr.updated_at, pr.doi, pr.url, pr.publication_date,
        pr.journal, pr.impact_factor, pr.citation_count, pr.file_url,
        p.title as project_title, p.abstract as project_abstract,
        pc.name as category_name, pc.category_group as category_group, pc.impact_weight,
        u.full_name as owner_name, u.email as owner_email
      FROM products pr
      JOIN projects p ON pr.project_id = p.id
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search) {
      query += ` AND (pr.description LIKE ? OR pr.product_code LIKE ? OR p.title LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      query += ` AND pr.product_type = ?`;
      params.push(category);
    }

    if (projectId) {
      query += ` AND pr.project_id = ?`;
      params.push(parseInt(projectId));
    }

    if (isPublic !== undefined) {
      query += ` AND pr.is_public = ?`;
      params.push(isPublic === 'true' ? 1 : 0);
    }

    query += ` ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const products = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total para paginación
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM products pr 
      JOIN projects p ON pr.project_id = p.id 
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (pr.description LIKE ? OR pr.product_code LIKE ? OR p.title LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (category) {
      countQuery += ` AND pr.product_type = ?`;
      countParams.push(category);
    }

    if (projectId) {
      countQuery += ` AND pr.project_id = ?`;
      countParams.push(parseInt(projectId));
    }

    if (isPublic !== undefined) {
      countQuery += ` AND pr.is_public = ?`;
      countParams.push(isPublic === 'true' ? 1 : 0);
    }

    const totalCount = await c.env.DB.prepare(countQuery).bind(...countParams).first();
    const total = totalCount?.total || 0;

    return c.json<APIResponse<{ products: any[]; pagination: any }>>({
      success: true,
      data: {
        products: products.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener productos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener producto específico
adminRoutes.get('/products/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));

    const product = await c.env.DB.prepare(`
      SELECT 
        pr.id, pr.project_id, pr.product_code, pr.product_type, pr.description,
        pr.is_public, pr.created_at, pr.updated_at, pr.doi, pr.url, pr.publication_date,
        pr.journal, pr.impact_factor, pr.citation_count, pr.file_url,
        p.title as project_title, p.abstract as project_abstract,
        pc.name as category_name, pc.category_group as category_group, pc.impact_weight,
        u.full_name as owner_name, u.email as owner_email
      FROM products pr
      JOIN projects p ON pr.project_id = p.id
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE pr.id = ?
    `).bind(productId).first();

    if (!product) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Producto no encontrado' 
      }, 404);
    }

    return c.json<APIResponse>({
      success: true,
      data: product
    });

  } catch (error) {
    console.error('Error al obtener producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Actualizar visibilidad de producto
adminRoutes.put('/products/:id/visibility', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    const { is_public } = await c.req.json();

    const result = await c.env.DB.prepare(`
      UPDATE products 
      SET is_public = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `).bind(is_public ? 1 : 0, productId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al actualizar producto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: `Producto ${is_public ? 'publicado' : 'hecho privado'} exitosamente`
    });

  } catch (error) {
    console.error('Error al actualizar visibilidad:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Eliminar producto (solo admin)
adminRoutes.delete('/products/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));

    // Verificar que el producto existe
    const product = await c.env.DB.prepare('SELECT id FROM products WHERE id = ?').bind(productId).first();
    
    if (!product) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Producto no encontrado' 
      }, 404);
    }

    // Eliminar el producto
    const result = await c.env.DB.prepare('DELETE FROM products WHERE id = ?').bind(productId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al eliminar producto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

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

// Cambiar contraseña de usuario (solo admin)
adminRoutes.put('/users/:id/password', async (c) => {
  try {
    const userId = parseInt(c.req.param('id'));
    const { new_password } = await c.req.json<{ new_password: string }>();

    if (!new_password || new_password.length < 6) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'La nueva contraseña debe tener al menos 6 caracteres' 
      }, 400);
    }

    // Verificar que el usuario existe
    const user = await c.env.DB.prepare('SELECT id, email, full_name FROM users WHERE id = ?').bind(userId).first();
    
    if (!user) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }, 404);
    }

    // Hash de la nueva contraseña usando la misma función que auth
    const password_hash = await hashPassword(new_password);

    // Actualizar contraseña
    const result = await c.env.DB.prepare(`
      UPDATE users 
      SET password_hash = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(password_hash, userId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al actualizar la contraseña' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: `Contraseña actualizada exitosamente para ${user.full_name} (${user.email})`
    });

  } catch (error) {
    console.error('Error actualizando contraseña:', error);
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
    const action_line = c.req.query('action_line') || ''; // NUEVO: Filtro por línea de acción
    const risk_level = c.req.query('risk_level') || '';   // NUEVO: Filtro por nivel de riesgo
    const status = c.req.query('status') || '';           // NUEVO: Filtro por estado
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.introduction, 
        p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
        p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
        p.budget, p.project_code,
        -- NUEVOS CAMPOS INTEGRADOS DE MONITOREO
        p.action_line_id, p.progress_percentage, p.last_activity_date, p.risk_level,
        p.next_milestone_date, p.next_milestone_description,
        u.full_name as owner_name, u.email as owner_email,
        al.name as action_line_name, al.code as action_line_code, 
        al.color_code as action_line_color, al.priority as action_line_priority,
        COUNT(DISTINCT pm.id) as milestone_count,
        COUNT(DISTINCT CASE WHEN pm.status = 'COMPLETED' THEN pm.id END) as completed_milestones,
        COUNT(DISTINCT CASE WHEN pm.status = 'OVERDUE' THEN pm.id END) as overdue_milestones,
        COUNT(DISTINCT prod.id) as product_count,
        COUNT(DISTINCT CASE WHEN pc.category_group = 'EXPERIENCE' THEN prod.id END) as experience_count
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      LEFT JOIN products prod ON p.id = prod.project_id
      LEFT JOIN product_categories pc ON prod.product_code = pc.code
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (search) {
      query += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR u.full_name LIKE ? OR al.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (is_public !== undefined && is_public !== '') {
      query += ` AND p.is_public = ?`;
      params.push(parseInt(is_public));
    }

    // NUEVOS FILTROS INTEGRADOS
    if (action_line) {
      query += ` AND p.action_line_id = ?`;
      params.push(parseInt(action_line));
    }

    if (risk_level) {
      query += ` AND p.risk_level = ?`;
      params.push(risk_level);
    }

    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }

    query += ` GROUP BY p.id ORDER BY p.last_activity_date DESC, p.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const projects = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total (con mismos filtros)
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR u.full_name LIKE ? OR al.name LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (is_public !== undefined && is_public !== '') {
      countQuery += ` AND p.is_public = ?`;
      countParams.push(parseInt(is_public));
    }

    if (action_line) {
      countQuery += ` AND p.action_line_id = ?`;
      countParams.push(parseInt(action_line));
    }

    if (risk_level) {
      countQuery += ` AND p.risk_level = ?`;
      countParams.push(risk_level);
    }

    if (status) {
      countQuery += ` AND p.status = ?`;
      countParams.push(status);
    }

    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const total = totalResult?.total || 0;

    // AÑADIR: Obtener líneas de acción para filtros
    const actionLines = await c.env.DB.prepare(`
      SELECT id, code, name, color_code, status, priority 
      FROM action_lines 
      ORDER BY priority DESC, name ASC
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        projects: projects.results,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        // NUEVOS DATOS PARA FILTROS Y UI
        action_lines: actionLines.results,
        filters: {
          action_line,
          risk_level,
          status,
          is_public,
          search
        },
        summary: {
          total_projects: total,
          high_risk_projects: projects.results?.filter((p: any) => ['HIGH', 'CRITICAL'].includes(p.risk_level)).length || 0,
          projects_with_overdue: projects.results?.filter((p: any) => p.overdue_milestones > 0).length || 0
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

// ===== GESTIÓN DE LÍNEAS DE ACCIÓN =====

// Listar todas las líneas de acción
adminRoutes.get('/action-lines', async (c) => {
  try {
    const actionLines = await c.env.DB.prepare(`
      SELECT 
        al.*,
        u.full_name as responsible_name,
        COALESCE(cm_projects.metric_value, 0) as project_count,
        COALESCE(cm_active.metric_value, 0) as active_projects,
        COALESCE(cm_products.metric_value, 0) as product_count,
        COALESCE(cm_experiences.metric_value, 0) as experience_count,
        COALESCE(cm_progress.metric_value, 0) as avg_progress
      FROM action_lines al
      LEFT JOIN users u ON al.responsible_user_id = u.id
      LEFT JOIN calculated_metrics cm_projects ON al.id = cm_projects.entity_id 
        AND cm_projects.entity_type = 'ACTION_LINE' AND cm_projects.metric_name = 'total_projects' AND cm_projects.is_current = 1
      LEFT JOIN calculated_metrics cm_active ON al.id = cm_active.entity_id 
        AND cm_active.entity_type = 'ACTION_LINE' AND cm_active.metric_name = 'active_projects' AND cm_active.is_current = 1
      LEFT JOIN calculated_metrics cm_products ON al.id = cm_products.entity_id 
        AND cm_products.entity_type = 'ACTION_LINE' AND cm_products.metric_name = 'total_products' AND cm_products.is_current = 1
      LEFT JOIN calculated_metrics cm_experiences ON al.id = cm_experiences.entity_id 
        AND cm_experiences.entity_type = 'ACTION_LINE' AND cm_experiences.metric_name = 'total_experiences' AND cm_experiences.is_current = 1
      LEFT JOIN calculated_metrics cm_progress ON al.id = cm_progress.entity_id 
        AND cm_progress.entity_type = 'ACTION_LINE' AND cm_progress.metric_name = 'avg_progress' AND cm_progress.is_current = 1
      ORDER BY al.priority DESC, al.name ASC
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: actionLines.results
    });

  } catch (error) {
    console.error('Error loading action lines:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Crear nueva línea de acción
adminRoutes.post('/action-lines', async (c) => {
  try {
    const data = await c.req.json();
    const { 
      code, name, description, priority = 3, start_date, end_date, 
      responsible_user_id, budget, kpi_targets, color_code = '#3B82F6', 
      icon = 'fas fa-flag' 
    } = data;

    const result = await c.env.DB.prepare(`
      INSERT INTO action_lines 
      (code, name, description, priority, start_date, end_date, responsible_user_id, budget, kpi_targets, color_code, icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      code, name, description, priority, start_date, end_date, 
      responsible_user_id, budget, JSON.stringify(kpi_targets), color_code, icon
    ).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    });

  } catch (error) {
    console.error('Error creating action line:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: error.message.includes('UNIQUE constraint') ? 'El código ya existe' : 'Error interno del servidor' 
    }, 400);
  }
});

// Actualizar línea de acción
adminRoutes.put('/action-lines/:id', async (c) => {
  try {
    const actionLineId = parseInt(c.req.param('id'));
    const data = await c.req.json();
    const { 
      name, description, priority, start_date, end_date, 
      responsible_user_id, budget, kpi_targets, color_code, 
      icon, status 
    } = data;

    await c.env.DB.prepare(`
      UPDATE action_lines 
      SET name = ?, description = ?, priority = ?, start_date = ?, end_date = ?,
          responsible_user_id = ?, budget = ?, kpi_targets = ?, color_code = ?,
          icon = ?, status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name, description, priority, start_date, end_date,
      responsible_user_id, budget, JSON.stringify(kpi_targets), color_code,
      icon, status, actionLineId
    ).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: { message: 'Línea de acción actualizada correctamente' }
    });

  } catch (error) {
    console.error('Error updating action line:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== DASHBOARD DE MONITOREO EN TIEMPO REAL =====

// Dashboard de monitoreo general
adminRoutes.get('/monitoring/overview', async (c) => {
  try {
    // Métricas generales del sistema
    const systemMetrics = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'ACTIVE' THEN p.id END) as active_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' THEN p.id END) as completed_projects,
        COUNT(DISTINCT prod.id) as total_products,
        COUNT(DISTINCT CASE WHEN pc.category_group = 'EXPERIENCE' THEN prod.id END) as total_experiences,
        COUNT(DISTINCT u.id) as total_researchers,
        AVG(p.progress_percentage) as avg_project_progress,
        COUNT(DISTINCT CASE WHEN p.risk_level IN ('HIGH', 'CRITICAL') THEN p.id END) as high_risk_projects,
        COUNT(DISTINCT pm.id) as total_milestones,
        COUNT(DISTINCT CASE WHEN pm.status = 'OVERDUE' THEN pm.id END) as overdue_milestones
      FROM projects p
      LEFT JOIN products prod ON p.id = prod.project_id
      LEFT JOIN product_categories pc ON prod.product_code = pc.code
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      LEFT JOIN users u ON p.owner_id = u.id OR EXISTS(
        SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = u.id
      )
    `).first();

    // Métricas por línea de acción (usando calculated_metrics cache)
    const actionLineMetrics = await c.env.DB.prepare(`
      SELECT 
        al.*,
        COALESCE(cm_projects.metric_value, 0) as project_count,
        COALESCE(cm_active.metric_value, 0) as active_projects,
        COALESCE(cm_progress.metric_value, 0) as avg_progress,
        COALESCE(cm_products.metric_value, 0) as product_count,
        COALESCE(cm_experiences.metric_value, 0) as experience_count
      FROM action_lines al
      LEFT JOIN calculated_metrics cm_projects ON al.id = cm_projects.entity_id 
        AND cm_projects.entity_type = 'ACTION_LINE' AND cm_projects.metric_name = 'total_projects' AND cm_projects.is_current = 1
      LEFT JOIN calculated_metrics cm_active ON al.id = cm_active.entity_id 
        AND cm_active.entity_type = 'ACTION_LINE' AND cm_active.metric_name = 'active_projects' AND cm_active.is_current = 1
      LEFT JOIN calculated_metrics cm_progress ON al.id = cm_progress.entity_id 
        AND cm_progress.entity_type = 'ACTION_LINE' AND cm_progress.metric_name = 'avg_progress' AND cm_progress.is_current = 1
      LEFT JOIN calculated_metrics cm_products ON al.id = cm_products.entity_id 
        AND cm_products.entity_type = 'ACTION_LINE' AND cm_products.metric_name = 'total_products' AND cm_products.is_current = 1
      LEFT JOIN calculated_metrics cm_experiences ON al.id = cm_experiences.entity_id 
        AND cm_experiences.entity_type = 'ACTION_LINE' AND cm_experiences.metric_name = 'total_experiences' AND cm_experiences.is_current = 1
      WHERE al.status = 'ACTIVE'
      ORDER BY al.priority DESC
    `).all();

    // Alertas recientes
    const recentAlerts = await c.env.DB.prepare(`
      SELECT sa.*, u.full_name as user_name, p.title as project_title
      FROM system_alerts sa
      JOIN users u ON sa.target_user_id = u.id
      LEFT JOIN projects p ON sa.related_project_id = p.id
      WHERE sa.is_resolved = 0
      ORDER BY 
        CASE sa.severity 
          WHEN 'CRITICAL' THEN 4
          WHEN 'HIGH' THEN 3
          WHEN 'MEDIUM' THEN 2
          ELSE 1
        END DESC, sa.created_at DESC
      LIMIT 20
    `).all();

    // Proyectos que requieren atención
    const attentionProjects = await c.env.DB.prepare(`
      SELECT p.*, u.full_name as owner_name, al.name as action_line_name, al.color_code,
             COUNT(pm.id) as total_milestones,
             COUNT(CASE WHEN pm.status = 'OVERDUE' THEN 1 END) as overdue_milestones,
             COUNT(CASE WHEN pm.target_date <= date('now', '+7 days') AND pm.status != 'COMPLETED' THEN 1 END) as upcoming_milestones,
             MAX(CASE WHEN pm.status = 'OVERDUE' THEN pm.target_date END) as oldest_overdue_date
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      WHERE p.status = 'ACTIVE' AND (
        p.risk_level IN ('HIGH', 'CRITICAL') OR
        p.progress_percentage < 30 OR
        p.last_activity_date <= date('now', '-30 days') OR
        EXISTS(SELECT 1 FROM project_milestones pm2 WHERE pm2.project_id = p.id AND pm2.status = 'OVERDUE')
      )
      GROUP BY p.id
      ORDER BY 
        CASE p.risk_level 
          WHEN 'CRITICAL' THEN 4
          WHEN 'HIGH' THEN 3
          WHEN 'MEDIUM' THEN 2
          ELSE 1
        END DESC, 
        overdue_milestones DESC, 
        p.progress_percentage ASC
      LIMIT 15
    `).all();

    // Tendencias recientes (últimos 30 días)
    const recentTrends = await c.env.DB.prepare(`
      SELECT 
        DATE(p.created_at) as date,
        COUNT(*) as projects_created
      FROM projects p
      WHERE DATE(p.created_at) >= DATE('now', '-30 days')
      GROUP BY DATE(p.created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        system_metrics: systemMetrics,
        action_line_metrics: actionLineMetrics.results,
        recent_alerts: recentAlerts.results,
        attention_projects: attentionProjects.results,
        recent_trends: recentTrends.results,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error loading monitoring overview:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Estadísticas en tiempo real para gráficos
adminRoutes.get('/monitoring/real-time-stats', async (c) => {
  try {
    const timeframe = c.req.query('timeframe') || '30'; // días

    // Progreso de proyectos en el tiempo
    const projectProgress = await c.env.DB.prepare(`
      SELECT 
        DATE(p.created_at) as date,
        COUNT(*) as projects_created,
        COUNT(CASE WHEN p.status = 'COMPLETED' THEN 1 END) as projects_completed,
        AVG(p.progress_percentage) as avg_progress
      FROM projects p
      WHERE DATE(p.created_at) >= DATE('now', '-' || ? || ' days')
      GROUP BY DATE(p.created_at)
      ORDER BY date ASC
    `).bind(timeframe).all();

    // Producción de productos por categoría
    const productionTrend = await c.env.DB.prepare(`
      SELECT 
        strftime('%Y-%m', prod.created_at) as month,
        pc.category_group,
        COUNT(*) as count
      FROM products prod
      JOIN product_categories pc ON prod.product_code = pc.code
      WHERE DATE(prod.created_at) >= DATE('now', '-' || ? || ' days')
      GROUP BY month, pc.category_group
      ORDER BY month ASC
    `).bind(timeframe).all();

    // Distribución de estado de proyectos
    const statusDistribution = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count
      FROM projects
      GROUP BY status
    `).all();

    // Distribución de riesgo
    const riskDistribution = await c.env.DB.prepare(`
      SELECT risk_level, COUNT(*) as count
      FROM projects
      GROUP BY risk_level
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        project_progress: projectProgress.results,
        production_trend: productionTrend.results,
        status_distribution: statusDistribution.results,
        risk_distribution: riskDistribution.results,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error loading real-time stats:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Resolver alerta
adminRoutes.put('/alerts/:id/resolve', async (c) => {
  try {
    const alertId = parseInt(c.req.param('id'));
    const currentUser = c.get('user')!;

    await c.env.DB.prepare(`
      UPDATE system_alerts 
      SET is_resolved = 1, resolved_at = datetime('now'), is_read = 1, read_at = datetime('now')
      WHERE id = ?
    `).bind(alertId).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: { message: 'Alerta resuelta correctamente' }
    });

  } catch (error) {
    console.error('Error resolving alert:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Actualizar nivel de riesgo de proyecto
adminRoutes.put('/projects/:id/risk-level', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));
    const { risk_level } = await c.req.json();

    await c.env.DB.prepare(`
      UPDATE projects 
      SET risk_level = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(risk_level, projectId).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: { message: 'Nivel de riesgo actualizado correctamente' }
    });

  } catch (error) {
    console.error('Error updating project risk level:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

export { adminRoutes };