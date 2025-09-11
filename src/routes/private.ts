// Rutas privadas (requieren autenticación)
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import { Bindings, APIResponse, JWTPayload, CreateProjectRequest, UpdateProjectRequest, CreateProductRequest, UpdateProductRequest, AddCollaboratorRequest } from '../types/index';

const privateRoutes = new Hono<{ Bindings: Bindings; Variables: { user?: JWTPayload } }>();

// Aplicar middleware de autenticación a todas las rutas
privateRoutes.use('/*', authMiddleware);

// ===== RUTAS DE USUARIO =====

// Obtener perfil del usuario actual
privateRoutes.get('/profile', async (c) => {
  try {
    const user = c.get('user')!;
    
    const userProfile = await c.env.DB.prepare(`
      SELECT id, email, full_name, role, created_at, updated_at
      FROM users 
      WHERE id = ?
    `).bind(user.userId).first();

    if (!userProfile) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }, 404);
    }

    return c.json<APIResponse<any>>({
      success: true,
      data: userProfile
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== RUTAS DE PROYECTOS =====

// Obtener proyectos del usuario
privateRoutes.get('/projects', async (c) => {
  try {
    const user = c.get('user')!;
    
    let query: string;
    let params: any[] = [user.userId];

    if (user.role === 'ADMIN') {
      // Admins pueden ver todos los proyectos
      query = `
        SELECT 
          p.id, p.title, p.abstract, p.keywords, p.introduction, 
          p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
          p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
          p.budget, p.project_code,
          u.full_name as owner_name
        FROM projects p 
        JOIN users u ON p.owner_id = u.id 
        ORDER BY p.created_at DESC
      `;
      params = [];
    } else {
      // Investigadores ven sus proyectos + colaboraciones
      query = `
        SELECT DISTINCT
          p.id, p.title, p.abstract, p.keywords, p.introduction, 
          p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
          p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
          p.budget, p.project_code,
          u.full_name as owner_name
        FROM projects p 
        JOIN users u ON p.owner_id = u.id 
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.owner_id = ? OR pc.user_id = ?
        ORDER BY p.created_at DESC
      `;
      params = [user.userId, user.userId];
    }

    const projects = await c.env.DB.prepare(query).bind(...params).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { projects: projects.results }
    });

  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Crear nuevo proyecto
privateRoutes.post('/projects', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const body: CreateProjectRequest = await c.req.json();
    const { 
      title, abstract, keywords, introduction, methodology,
      start_date, end_date, institution, funding_source, budget, project_code, status = 'ACTIVE'
    } = body;

    if (!title || !abstract) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Título y resumen son requeridos' 
      }, 400);
    }

    // Validar fechas
    if (start_date && end_date && new Date(end_date) <= new Date(start_date)) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'La fecha de fin debe ser posterior a la fecha de inicio' 
      }, 400);
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO projects (
        title, abstract, keywords, introduction, methodology, owner_id,
        status, start_date, end_date, institution, funding_source, budget, project_code
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title, abstract, keywords || null, introduction || null, methodology || null, user.userId,
      status, start_date || null, end_date || null, institution || null, 
      funding_source || null, budget || null, project_code || null
    ).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al crear el proyecto' 
      }, 500);
    }

    return c.json<APIResponse<{ id: number }>>({
      success: true,
      data: { id: result.meta.last_row_id as number },
      message: 'Proyecto creado exitosamente'
    }, 201);

  } catch (error) {
    console.error('Error creando proyecto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Actualizar proyecto
privateRoutes.put('/projects/:id', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));
    const body: UpdateProjectRequest = await c.req.json();

    // Verificar propiedad del proyecto (excepto admins)
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(
        'SELECT owner_id FROM projects WHERE id = ?'
      ).bind(projectId).first<{ owner_id: number }>();

      if (!project || project.owner_id !== user.userId) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para editar este proyecto' 
        }, 403);
      }
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (body.title !== undefined) {
      updateFields.push('title = ?');
      params.push(body.title);
    }
    if (body.abstract !== undefined) {
      updateFields.push('abstract = ?');
      params.push(body.abstract);
    }
    if (body.keywords !== undefined) {
      updateFields.push('keywords = ?');
      params.push(body.keywords);
    }
    if (body.introduction !== undefined) {
      updateFields.push('introduction = ?');
      params.push(body.introduction);
    }
    if (body.methodology !== undefined) {
      updateFields.push('methodology = ?');
      params.push(body.methodology);
    }
    // Nuevos campos Fase 1
    if (body.status !== undefined) {
      updateFields.push('status = ?');
      params.push(body.status);
    }
    if (body.start_date !== undefined) {
      updateFields.push('start_date = ?');
      params.push(body.start_date);
    }
    if (body.end_date !== undefined) {
      updateFields.push('end_date = ?');
      params.push(body.end_date);
    }
    if (body.institution !== undefined) {
      updateFields.push('institution = ?');
      params.push(body.institution);
    }
    if (body.funding_source !== undefined) {
      updateFields.push('funding_source = ?');
      params.push(body.funding_source);
    }
    if (body.budget !== undefined) {
      updateFields.push('budget = ?');
      params.push(body.budget);
    }
    if (body.project_code !== undefined) {
      updateFields.push('project_code = ?');
      params.push(body.project_code);
    }

    if (updateFields.length === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'No hay campos para actualizar' 
      }, 400);
    }

    params.push(projectId);

    const result = await c.env.DB.prepare(`
      UPDATE projects 
      SET ${updateFields.join(', ')}, updated_at = datetime('now')
      WHERE id = ?
    `).bind(...params).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al actualizar el proyecto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Proyecto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando proyecto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Publicar/despublicar proyecto
privateRoutes.post('/projects/:id/publish', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));
    const { is_public } = await c.req.json<{ is_public: boolean }>();

    // Verificar propiedad del proyecto (excepto admins)
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(
        'SELECT owner_id FROM projects WHERE id = ?'
      ).bind(projectId).first<{ owner_id: number }>();

      if (!project || project.owner_id !== user.userId) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para modificar este proyecto' 
        }, 403);
      }
    }

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
    console.error('Error actualizando estado del proyecto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Eliminar proyecto
privateRoutes.delete('/projects/:id', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));

    // Verificar propiedad del proyecto (excepto admins)
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(
        'SELECT owner_id FROM projects WHERE id = ?'
      ).bind(projectId).first<{ owner_id: number }>();

      if (!project || project.owner_id !== user.userId) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para eliminar este proyecto' 
        }, 403);
      }
    }

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
    console.error('Error eliminando proyecto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== RUTAS DE PRODUCTOS =====

// Crear producto para un proyecto
privateRoutes.post('/projects/:projectId/products', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const body: CreateProductRequest = await c.req.json();
    const { 
      product_code, product_type, description, doi, url, publication_date, 
      journal, impact_factor, metadata, file_url 
    } = body;

    if (!product_code || !product_type || !description) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Código, tipo y descripción del producto son requeridos' 
      }, 400);
    }

    // Verificar que el tipo de producto existe
    const categoryExists = await c.env.DB.prepare(
      'SELECT code FROM product_categories WHERE code = ?'
    ).bind(product_type).first();

    if (!categoryExists) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Tipo de producto no válido' 
      }, 400);
    }

    // Verificar que el proyecto existe y el usuario tiene permisos
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(`
        SELECT p.owner_id, pc.can_add_products FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR (pc.user_id = ? AND pc.can_add_products = 1))
      `).bind(user.userId, projectId, user.userId, user.userId).first();

      if (!project) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Proyecto no encontrado o sin permisos para añadir productos' 
        }, 404);
      }
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO products (
        project_id, product_code, product_type, description,
        doi, url, publication_date, journal, impact_factor, metadata, file_url
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId, product_code, product_type, description,
      doi || null, url || null, publication_date || null, journal || null,
      impact_factor || null, metadata || null, file_url || null
    ).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al crear el producto' 
      }, 500);
    }

    return c.json<APIResponse<{ id: number }>>({
      success: true,
      data: { id: result.meta.last_row_id as number },
      message: 'Producto creado exitosamente'
    }, 201);

  } catch (error) {
    console.error('Error creando producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener productos de un proyecto
privateRoutes.get('/projects/:projectId/products', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));

    // Verificar acceso al proyecto
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(`
        SELECT p.id FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ? OR p.is_public = 1)
      `).bind(projectId, user.userId, user.userId).first();

      if (!project) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Proyecto no encontrado o sin permisos' 
        }, 404);
      }
    }

    const products = await c.env.DB.prepare(`
      SELECT id, project_id, product_code, product_type, description, 
             is_public, created_at, updated_at
      FROM products 
      WHERE project_id = ?
      ORDER BY created_at DESC
    `).bind(projectId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { products: products.results }
    });

  } catch (error) {
    console.error('Error obteniendo productos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Añadir colaborador a proyecto
privateRoutes.post('/projects/:projectId/collaborators', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const body: AddCollaboratorRequest = await c.req.json();
    const { user_id, collaboration_role, can_edit_project = false, can_add_products = true, can_manage_team = false, role_description } = body;

    // Verificar que el proyecto existe y el usuario tiene permisos
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(
        'SELECT owner_id FROM projects WHERE id = ?'
      ).bind(projectId).first<{ owner_id: number }>();

      if (!project || project.owner_id !== user.userId) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para añadir colaboradores a este proyecto' 
        }, 403);
      }
    }

    // Verificar que el usuario a añadir existe
    const collaboratorUser = await c.env.DB.prepare(
      'SELECT id, role FROM users WHERE id = ?'
    ).bind(user_id).first();

    if (!collaboratorUser) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }, 404);
    }

    // Insertar colaborador
    const result = await c.env.DB.prepare(`
      INSERT INTO project_collaborators (
        project_id, user_id, collaboration_role, can_edit_project, 
        can_add_products, can_manage_team, role_description
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(projectId, user_id, collaboration_role, can_edit_project ? 1 : 0, 
            can_add_products ? 1 : 0, can_manage_team ? 1 : 0, role_description || null).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al añadir colaborador' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Colaborador añadido exitosamente'
    }, 201);

  } catch (error) {
    console.error('Error añadiendo colaborador:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Listar colaboradores de un proyecto
privateRoutes.get('/projects/:projectId/collaborators', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));

    // Verificar acceso al proyecto
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(`
        SELECT p.id FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ? OR p.is_public = 1)
      `).bind(projectId, user.userId, user.userId).first();

      if (!project) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Proyecto no encontrado o sin permisos' 
        }, 404);
      }
    }

    const collaborators = await c.env.DB.prepare(`
      SELECT 
        pc.project_id, pc.user_id, pc.collaboration_role, pc.can_edit_project,
        pc.can_add_products, pc.can_manage_team, pc.role_description, pc.added_at,
        u.full_name, u.email, u.role as user_role
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
      ORDER BY pc.added_at DESC
    `).bind(projectId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { collaborators: collaborators.results }
    });

  } catch (error) {
    console.error('Error obteniendo colaboradores:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Dashboard stats privadas
privateRoutes.get('/dashboard/stats', async (c) => {
  try {
    const user = c.get('user')!;
    
    let projectsQuery: string;
    let productsQuery: string;
    let params: any[] = [];

    if (user.role === 'ADMIN') {
      // Estadísticas globales para admins
      projectsQuery = 'SELECT COUNT(*) as total, COUNT(CASE WHEN is_public = 1 THEN 1 END) as public FROM projects';
      productsQuery = 'SELECT COUNT(*) as total, COUNT(CASE WHEN is_public = 1 THEN 1 END) as public FROM products';
    } else {
      // Estadísticas del usuario para investigadores
      projectsQuery = `
        SELECT COUNT(*) as total, COUNT(CASE WHEN is_public = 1 THEN 1 END) as public 
        FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.owner_id = ? OR pc.user_id = ?
      `;
      productsQuery = `
        SELECT COUNT(*) as total, COUNT(CASE WHEN pr.is_public = 1 THEN 1 END) as public
        FROM products pr
        JOIN projects p ON pr.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.owner_id = ? OR pc.user_id = ?
      `;
      params = [user.userId, user.userId];
    }

    const [projectStats, productStats] = await Promise.all([
      c.env.DB.prepare(projectsQuery).bind(...params).first(),
      c.env.DB.prepare(productsQuery).bind(...params).first()
    ]);

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        projects: projectStats,
        products: productStats
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

export { privateRoutes };