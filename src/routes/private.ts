// Rutas privadas (requieren autenticación)
import { Hono } from 'hono';
import { authMiddleware, requireRole } from '../middleware/auth';
import { Bindings, APIResponse, JWTPayload, CreateProjectRequest, UpdateProjectRequest, CreateProductRequest, UpdateProductRequest, AddCollaboratorRequest, AddProductAuthorRequest } from '../types/index';

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

// Obtener proyectos del usuario (SIMPLIFICADO)
privateRoutes.get('/projects', async (c) => {
  try {
    const user = c.get('user')!;
    const status = c.req.query('status');
    
    let query: string;
    let params: any[] = [];
    let whereConditions: string[] = [];

    if (user.role === 'ADMIN') {
      // Admins pueden ver todos los proyectos - consulta con columnas existentes
      query = `
        SELECT 
          p.id, p.title, p.abstract, p.keywords, p.introduction, 
          p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
          p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
          p.budget, p.project_code,
          u.full_name as owner_name, u.email as owner_email
        FROM projects p 
        JOIN users u ON p.owner_id = u.id
      `;
    } else {
      // Investigadores ven solo sus proyectos
      query = `
        SELECT 
          p.id, p.title, p.abstract, p.keywords, p.introduction, 
          p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
          p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
          p.budget, p.project_code,
          u.full_name as owner_name, u.email as owner_email
        FROM projects p 
        JOIN users u ON p.owner_id = u.id
      `;
      whereConditions.push('p.owner_id = ?');
      params.push(user.userId);
    }

    // Aplicar filtro de status si existe
    if (status) {
      whereConditions.push('p.status = ?');
      params.push(status);
    }

    // Agregar WHERE si hay condiciones
    if (whereConditions.length > 0) {
      query += ` WHERE ${whereConditions.join(' AND ')}`;
    }
    
    query += ' ORDER BY p.updated_at DESC';

    console.log('🔍 Query ejecutada:', query);
    console.log('🔍 Parámetros:', params);

    const projects = await c.env.DB.prepare(query).bind(...params).all();

    console.log('🔍 Proyectos encontrados:', projects.results?.length || 0);

    return c.json<APIResponse<any>>({
      success: true,
      data: { projects: projects.results }
    });

  } catch (error) {
    console.error('❌ Error obteniendo proyectos:', error);
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

// Verificar permisos de edición para un proyecto
privateRoutes.get('/projects/:id/permissions', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));

    const project = await c.env.DB.prepare(`
      SELECT id, owner_id, title, status
      FROM projects 
      WHERE id = ?
    `).bind(projectId).first<{
      id: number;
      owner_id: number;
      title: string;
      status: string;
    }>();

    if (!project) {
      return c.json<APIResponse>({
        success: false,
        error: 'Proyecto no encontrado'
      }, 404);
    }

    const canEdit = user.role === 'ADMIN' || project.owner_id === user.userId;
    const canView = true; // Todos pueden ver proyectos públicos/privados según lógica de negocio

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        projectId: project.id,
        projectTitle: project.title,
        canEdit,
        canView,
        isOwner: project.owner_id === user.userId,
        userRole: user.role,
        projectStatus: project.status
      }
    });

  } catch (error) {
    console.error('Error verificando permisos:', error);
    return c.json<APIResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, 500);
  }
});

// Obtener proyecto individual para edición
privateRoutes.get('/projects/:id', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));

    // Verificar acceso al proyecto (excepto admins)
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(
        'SELECT owner_id FROM projects WHERE id = ?'
      ).bind(projectId).first<{ owner_id: number }>();

      if (!project || project.owner_id !== user.userId) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para acceder a este proyecto' 
        }, 403);
      }
    }

    // Obtener datos completos del proyecto
    const project = await c.env.DB.prepare(`
      SELECT 
        p.*,
        u.full_name as owner_name,
        u.email as owner_email
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      WHERE p.id = ?
    `).bind(projectId).first();

    if (!project) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Proyecto no encontrado' 
      }, 404);
    }

    return c.json<APIResponse>({
      success: true,
      data: project
    });

  } catch (error) {
    console.error('Error obteniendo proyecto:', error);
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

    // Verificar que el proyecto existe y permisos
    const projectCheck = await c.env.DB.prepare(
      'SELECT id, owner_id, title FROM projects WHERE id = ?'
    ).bind(projectId).first<{ id: number; owner_id: number; title: string }>();

    if (!projectCheck) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Proyecto no encontrado' 
      }, 404);
    }

    // Verificar permisos de edición (excepto admins)
    if (user.role !== 'ADMIN' && projectCheck.owner_id !== user.userId) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'No tienes permiso para editar este proyecto',
        details: `Solo el propietario puede editar este proyecto`
      }, 403);
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
    if (body.is_public !== undefined) {
      updateFields.push('is_public = ?');
      params.push(body.is_public ? 1 : 0);
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
    // Campos de monitoreo estratégico
    if (body.action_line_id !== undefined) {
      updateFields.push('action_line_id = ?');
      params.push(body.action_line_id);
    }
    if (body.progress_percentage !== undefined) {
      updateFields.push('progress_percentage = ?');
      params.push(body.progress_percentage);
    }
    // risk_level field removed - column doesn't exist in current schema

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
    
    // Mejores mensajes de error específicos para debugging
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Detalles del error:', {
      projectId,
      userId: user.userId,
      updateFields: updateFields.length,
      errorMessage
    });
    
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
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
        doi, url, publication_date, journal, impact_factor, metadata, file_url,
        creator_id, last_editor_id
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      projectId, product_code, product_type, description,
      doi || null, url || null, publication_date || null, journal || null,
      impact_factor || null, metadata || null, file_url || null,
      user.userId, user.userId
    ).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al crear el producto' 
      }, 500);
    }

    const productId = result.meta.last_row_id as number;

    // Insertar el creador como autor principal
    await c.env.DB.prepare(`
      INSERT INTO product_authors (
        product_id, user_id, author_role, author_order, 
        contribution_type, added_by
      ) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      productId, user.userId, 'AUTHOR', 1, 
      'Autor principal del producto', user.userId
    ).run();

    // Si se especificaron autores adicionales
    if (body.authors && Array.isArray(body.authors)) {
      for (const author of body.authors) {
        if (author.user_id !== user.userId) { // No duplicar al creador
          await c.env.DB.prepare(`
            INSERT INTO product_authors (
              product_id, user_id, author_role, author_order, 
              contribution_type, added_by
            ) 
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            productId, author.user_id, author.author_role, author.author_order,
            author.contribution_type || null, user.userId
          ).run();
        }
      }
    }

    return c.json<APIResponse<{ id: number }>>({
      success: true,
      data: { id: productId },
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

// Asociar producto existente a un proyecto
privateRoutes.post('/projects/:projectId/products/:productId', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const productId = parseInt(c.req.param('productId'));

    // Verificar que el proyecto existe y el usuario tiene permisos
    const projectCheck = await c.env.DB.prepare(
      'SELECT id, owner_id, title FROM projects WHERE id = ?'
    ).bind(projectId).first<{ id: number; owner_id: number; title: string }>();

    if (!projectCheck) {
      return c.json<APIResponse>({
        success: false,
        error: 'Proyecto no encontrado'
      }, 404);
    }

    // Verificar permisos
    if (user.role !== 'ADMIN' && projectCheck.owner_id !== user.userId) {
      // También verificar si es colaborador con permisos
      const collaborator = await c.env.DB.prepare(`
        SELECT can_add_products FROM project_collaborators 
        WHERE project_id = ? AND user_id = ? AND can_add_products = 1
      `).bind(projectId, user.userId).first<{ can_add_products: number }>();

      if (!collaborator) {
        return c.json<APIResponse>({
          success: false,
          error: 'No tienes permisos para asociar productos a este proyecto'
        }, 403);
      }
    }

    // Verificar que el producto existe
    const productCheck = await c.env.DB.prepare(
      'SELECT id, description FROM products WHERE id = ?'
    ).bind(productId).first<{ id: number; description: string }>();

    if (!productCheck) {
      return c.json<APIResponse>({
        success: false,
        error: 'Producto no encontrado'
      }, 404);
    }

    // Verificar si ya está asociado
    const existingAssociation = await c.env.DB.prepare(
      'SELECT project_id FROM products WHERE id = ? AND project_id = ?'
    ).bind(productId, projectId).first();

    if (existingAssociation) {
      return c.json<APIResponse>({
        success: false,
        error: 'El producto ya está asociado a este proyecto'
      }, 400);
    }

    // Asociar producto al proyecto (actualizar el project_id)
    const result = await c.env.DB.prepare(`
      UPDATE products 
      SET project_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(projectId, productId).run();

    if (!result.success) {
      return c.json<APIResponse>({
        success: false,
        error: 'Error al asociar el producto al proyecto'
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Producto asociado exitosamente al proyecto'
    });

  } catch (error) {
    console.error('Error asociando producto:', error);
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
      SELECT 
        p.id, p.project_id, p.product_code, p.product_type, p.description, 
        p.is_public, p.created_at, p.updated_at, p.doi, p.url, 
        p.publication_date, p.journal, p.impact_factor, p.citation_count,
        p.metadata, p.file_url, p.creator_id, p.last_editor_id, p.published_at, p.published_by,
        creator.full_name as creator_name, creator.email as creator_email,
        editor.full_name as last_editor_name,
        publisher.full_name as publisher_name,
        pc.name as category_name, pc.category_group, pc.impact_weight
      FROM products p
      LEFT JOIN users creator ON p.creator_id = creator.id
      LEFT JOIN users editor ON p.last_editor_id = editor.id  
      LEFT JOIN users publisher ON p.published_by = publisher.id
      LEFT JOIN product_categories pc ON p.product_type = pc.code
      WHERE p.project_id = ?
      ORDER BY p.created_at DESC
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

// Buscar productos para asociar a proyecto  
privateRoutes.get('/private/products/search', async (c) => {
  try {
    const user = c.get('user')!;
    const query = c.req.query('q') || '';

    if (query.length < 2) {
      return c.json<APIResponse>({
        success: true,
        data: []
      });
    }

    // Buscar productos que el usuario puede ver
    const products = await c.env.DB.prepare(`
      SELECT pr.id, pr.product_code, pr.description as title, pr.product_type as type, pr.project_id
      FROM products pr
      JOIN projects p ON pr.project_id = p.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE (
        p.owner_id = ? OR 
        pc.user_id = ? OR 
        pr.is_public = 1 OR
        ? = 'ADMIN'
      ) AND (
        pr.product_code LIKE ? OR 
        pr.description LIKE ?
      )
      ORDER BY pr.created_at DESC
      LIMIT 20
    `).bind(
      user.userId, 
      user.userId, 
      user.userId, 
      user.role,
      `%${query}%`, 
      `%${query}%`
    ).all();

    return c.json<APIResponse>({
      success: true,
      data: products.results
    });

  } catch (error) {
    console.error('Error buscando productos:', error);
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

// Remover colaborador de un proyecto
privateRoutes.delete('/projects/:projectId/collaborators/:userId', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const userId = parseInt(c.req.param('userId'));

    // Verificar que el proyecto existe y el usuario tiene permisos
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(`
        SELECT p.owner_id, pc.can_manage_team FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR (pc.user_id = ? AND pc.can_manage_team = 1))
      `).bind(user.userId, projectId, user.userId, user.userId).first();

      if (!project) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para gestionar colaboradores en este proyecto' 
        }, 403);
      }
    }

    // Remover colaborador
    const result = await c.env.DB.prepare(`
      DELETE FROM project_collaborators 
      WHERE project_id = ? AND user_id = ?
    `).bind(projectId, userId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al remover colaborador' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Colaborador removido exitosamente'
    });

  } catch (error) {
    console.error('Error removiendo colaborador:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Añadir autor a un producto
privateRoutes.post('/projects/:projectId/products/:productId/authors', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const productId = parseInt(c.req.param('productId'));
    const body: AddProductAuthorRequest = await c.req.json();
    const { user_id, author_role, author_order, contribution_type } = body;

    // Verificar permisos sobre el producto
    if (user.role !== 'ADMIN') {
      const canEdit = await c.env.DB.prepare(`
        SELECT 1 FROM products pr
        JOIN projects p ON pr.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE pr.id = ? AND pr.project_id = ? 
        AND (pr.creator_id = ? OR p.owner_id = ? OR (pc.user_id = ? AND pc.can_add_products = 1))
      `).bind(user.userId, productId, projectId, user.userId, user.userId, user.userId).first();

      if (!canEdit) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para gestionar autores de este producto' 
        }, 403);
      }
    }

    // Verificar que el usuario a añadir existe
    const authorUser = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(user_id).first();

    if (!authorUser) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Usuario no encontrado' 
      }, 404);
    }

    // Insertar autor (UPSERT - actualizar si ya existe)
    const result = await c.env.DB.prepare(`
      INSERT OR REPLACE INTO product_authors (
        product_id, user_id, author_role, author_order, 
        contribution_type, added_by, added_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(productId, user_id, author_role, author_order, contribution_type || null, user.userId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al añadir autor al producto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Autor añadido exitosamente al producto'
    }, 201);

  } catch (error) {
    console.error('Error añadiendo autor al producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Listar autores de un producto
privateRoutes.get('/projects/:projectId/products/:productId/authors', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const productId = parseInt(c.req.param('productId'));

    // Verificar acceso al producto
    if (user.role !== 'ADMIN') {
      const product = await c.env.DB.prepare(`
        SELECT pr.id FROM products pr
        JOIN projects p ON pr.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE pr.id = ? AND pr.project_id = ? 
        AND (p.owner_id = ? OR pc.user_id = ? OR p.is_public = 1 OR pr.creator_id = ?)
      `).bind(productId, projectId, user.userId, user.userId, user.userId).first();

      if (!product) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Producto no encontrado o sin permisos' 
        }, 404);
      }
    }

    const authors = await c.env.DB.prepare(`
      SELECT 
        pa.product_id, pa.user_id, pa.author_role, pa.author_order,
        pa.contribution_type, pa.added_at,
        u.full_name, u.email, u.role as user_role,
        adder.full_name as added_by_name
      FROM product_authors pa
      JOIN users u ON pa.user_id = u.id
      LEFT JOIN users adder ON pa.added_by = adder.id
      WHERE pa.product_id = ?
      ORDER BY pa.author_order, pa.added_at
    `).bind(productId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { authors: authors.results }
    });

  } catch (error) {
    console.error('Error obteniendo autores del producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Remover autor de un producto
privateRoutes.delete('/projects/:projectId/products/:productId/authors/:userId', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const productId = parseInt(c.req.param('productId'));
    const authorUserId = parseInt(c.req.param('userId'));

    // Verificar permisos - no se puede remover al creador del producto
    const product = await c.env.DB.prepare(
      'SELECT creator_id FROM products WHERE id = ? AND project_id = ?'
    ).bind(productId, projectId).first<{ creator_id: number }>();

    if (!product) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Producto no encontrado' 
      }, 404);
    }

    if (product.creator_id === authorUserId) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'No se puede remover al creador del producto' 
      }, 400);
    }

    // Verificar permisos de edición
    if (user.role !== 'ADMIN') {
      const canEdit = await c.env.DB.prepare(`
        SELECT 1 FROM products pr
        JOIN projects p ON pr.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE pr.id = ? AND (pr.creator_id = ? OR p.owner_id = ? OR (pc.user_id = ? AND pc.can_add_products = 1))
      `).bind(user.userId, productId, user.userId, user.userId, user.userId).first();

      if (!canEdit) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para gestionar autores de este producto' 
        }, 403);
      }
    }

    // Remover autor
    const result = await c.env.DB.prepare(`
      DELETE FROM product_authors 
      WHERE product_id = ? AND user_id = ?
    `).bind(productId, authorUserId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al remover autor del producto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Autor removido exitosamente del producto'
    });

  } catch (error) {
    console.error('Error removiendo autor del producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Publicar/despublicar producto individual
privateRoutes.post('/projects/:projectId/products/:productId/publish', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const productId = parseInt(c.req.param('productId'));
    const { is_public } = await c.req.json<{ is_public: boolean }>();

    // Verificar permisos sobre el producto
    if (user.role !== 'ADMIN') {
      const canPublish = await c.env.DB.prepare(`
        SELECT pr.creator_id, p.owner_id FROM products pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.id = ? AND pr.project_id = ?
        AND (pr.creator_id = ? OR p.owner_id = ?)
      `).bind(productId, projectId, user.userId, user.userId).first();

      if (!canPublish) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Solo el creador del producto o el dueño del proyecto pueden publicar/despublicar' 
        }, 403);
      }
    }

    // Actualizar estado de publicación
    const updateFields = [`is_public = ?`, `last_editor_id = ?`];
    const params = [is_public ? 1 : 0, user.userId];

    if (is_public) {
      updateFields.push(`published_at = datetime('now')`, `published_by = ?`);
      params.push(user.userId);
    }

    const result = await c.env.DB.prepare(`
      UPDATE products 
      SET ${updateFields.join(', ')}, updated_at = datetime('now')
      WHERE id = ? AND project_id = ?
    `).bind(...params, productId, projectId).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al actualizar el estado del producto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: `Producto ${is_public ? 'publicado' : 'despublicado'} exitosamente`
    });

  } catch (error) {
    console.error('Error actualizando estado del producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Dashboard stats privadas (CON MONITOREO)
privateRoutes.get('/dashboard/stats', async (c) => {
  try {
    const user = c.get('user')!;
    
    let projectsQuery: string;
    let productsQuery: string;
    let milestonesQuery: string;
    let alertsQuery: string;
    let params: any[] = [];

    if (user.role === 'ADMIN') {
      // Estadísticas globales para admins
      projectsQuery = `
        SELECT 
          COUNT(*) as total, 
          COUNT(CASE WHEN is_public = 1 THEN 1 END) as public,
          COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as active,
          0 as at_risk,
          ROUND(AVG(COALESCE(progress_percentage, 0)), 2) as avg_progress
        FROM projects
      `;
      productsQuery = 'SELECT COUNT(*) as total, COUNT(CASE WHEN is_public = 1 THEN 1 END) as public FROM products';
      milestonesQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed,
          COUNT(CASE WHEN target_date < date('now') AND status != 'COMPLETED' THEN 1 END) as overdue
        FROM project_milestones
      `;
      alertsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_resolved = 0 THEN 1 END) as unresolved,
          COUNT(CASE WHEN alert_type = 'MILESTONE_OVERDUE' AND is_resolved = 0 THEN 1 END) as overdue_milestones
        FROM system_alerts
      `;
    } else {
      // Estadísticas del usuario para investigadores
      projectsQuery = `
        SELECT 
          COUNT(*) as total, 
          COUNT(CASE WHEN p.is_public = 1 THEN 1 END) as public,
          COUNT(CASE WHEN p.status = 'ACTIVE' THEN 1 END) as active,
          0 as at_risk,
          ROUND(AVG(COALESCE(p.progress_percentage, 0)), 2) as avg_progress
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
      milestonesQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN pm.status = 'COMPLETED' THEN 1 END) as completed,
          COUNT(CASE WHEN pm.target_date < date('now') AND pm.status != 'COMPLETED' THEN 1 END) as overdue
        FROM project_milestones pm
        JOIN projects p ON pm.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.owner_id = ? OR pc.user_id = ?
      `;
      alertsQuery = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN sa.is_resolved = 0 THEN 1 END) as unresolved
        FROM system_alerts sa
        JOIN projects p ON sa.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.owner_id = ? OR pc.user_id = ?
      `;
      params = [user.userId, user.userId];
    }

    const [projectStats, productStats, milestoneStats, alertStats] = await Promise.all([
      c.env.DB.prepare(projectsQuery).bind(...params).first(),
      c.env.DB.prepare(productsQuery).bind(...params).first(),
      c.env.DB.prepare(milestonesQuery).bind(...params).first(),
      c.env.DB.prepare(alertsQuery).bind(...params).first()
    ]);

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        projects: projectStats,
        products: productStats,
        milestones: milestoneStats,
        alerts: alertStats
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

// Actualizar producto
privateRoutes.put('/projects/:projectId/products/:productId', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const productId = parseInt(c.req.param('productId'));
    const body: UpdateProductRequest = await c.req.json();

    // Verificar permisos sobre el producto
    if (user.role !== 'ADMIN') {
      const canEdit = await c.env.DB.prepare(`
        SELECT pr.creator_id, p.owner_id FROM products pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.id = ? AND pr.project_id = ?
        AND (pr.creator_id = ? OR p.owner_id = ?)
      `).bind(productId, projectId, user.userId, user.userId).first();

      if (!canEdit) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Solo el creador del producto o el dueño del proyecto pueden editar productos' 
        }, 403);
      }
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    if (body.product_code !== undefined) {
      updateFields.push('product_code = ?');
      params.push(body.product_code);
    }
    if (body.product_type !== undefined) {
      // Verificar que el tipo de producto existe
      const categoryExists = await c.env.DB.prepare(
        'SELECT code FROM product_categories WHERE code = ?'
      ).bind(body.product_type).first();

      if (!categoryExists) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Tipo de producto no válido' 
        }, 400);
      }
      updateFields.push('product_type = ?');
      params.push(body.product_type);
    }
    if (body.description !== undefined) {
      updateFields.push('description = ?');
      params.push(body.description);
    }
    if (body.doi !== undefined) {
      updateFields.push('doi = ?');
      params.push(body.doi);
    }
    if (body.url !== undefined) {
      updateFields.push('url = ?');
      params.push(body.url);
    }
    if (body.publication_date !== undefined) {
      updateFields.push('publication_date = ?');
      params.push(body.publication_date);
    }
    if (body.journal !== undefined) {
      updateFields.push('journal = ?');
      params.push(body.journal);
    }
    if (body.impact_factor !== undefined) {
      updateFields.push('impact_factor = ?');
      params.push(body.impact_factor);
    }
    if (body.metadata !== undefined) {
      updateFields.push('metadata = ?');
      params.push(body.metadata);
    }
    if (body.file_url !== undefined) {
      updateFields.push('file_url = ?');
      params.push(body.file_url);
    }

    if (updateFields.length === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'No hay campos para actualizar' 
      }, 400);
    }

    // Agregar editor y actualizar timestamp
    updateFields.push('last_editor_id = ?', 'updated_at = datetime(\'now\')');
    params.push(user.userId);

    // Agregar WHERE clause parameters
    params.push(productId, projectId);

    const result = await c.env.DB.prepare(`
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = ? AND project_id = ?
    `).bind(...params).run();

    if (!result.success || result.meta.changes === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Producto no encontrado o no se pudo actualizar' 
      }, 404);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Producto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Eliminar producto
privateRoutes.delete('/projects/:projectId/products/:productId', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const productId = parseInt(c.req.param('productId'));

    // Verificar permisos sobre el producto
    if (user.role !== 'ADMIN') {
      const canDelete = await c.env.DB.prepare(`
        SELECT pr.creator_id, p.owner_id FROM products pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.id = ? AND pr.project_id = ?
        AND (pr.creator_id = ? OR p.owner_id = ?)
      `).bind(productId, projectId, user.userId, user.userId).first();

      if (!canDelete) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Solo el creador del producto o el dueño del proyecto pueden eliminar productos' 
        }, 403);
      }
    }

    // Eliminar producto (CASCADE eliminará autores automáticamente)
    const result = await c.env.DB.prepare(
      'DELETE FROM products WHERE id = ? AND project_id = ?'
    ).bind(productId, projectId).run();

    if (!result.success || result.meta.changes === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Producto no encontrado o no se pudo eliminar' 
      }, 404);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Producto eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando producto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener todos los productos del usuario actual
privateRoutes.get('/products', async (c) => {
  try {
    const user = c.get('user')!;
    
    console.log('🔍 Obteniendo productos para usuario ID:', user.userId);
    
    let query: string;
    let params: any[] = [];
    
    if (user.role === 'ADMIN') {
      // Los administradores pueden ver todos los productos
      query = `
        SELECT 
          pr.id, pr.product_code, pr.product_type, pr.description, pr.doi, pr.url,
          pr.publication_date, pr.journal, pr.impact_factor, pr.citation_count,
          pr.is_public, pr.created_at, pr.updated_at,
          p.title as project_title, p.id as project_id,
          u.full_name as creator_name, u.email as creator_email,
          pc.name as category_name, pc.category_group, pc.impact_weight
        FROM products pr
        JOIN projects p ON pr.project_id = p.id
        JOIN users u ON pr.creator_id = u.id
        LEFT JOIN product_categories pc ON pr.product_type = pc.code
        ORDER BY pr.updated_at DESC
      `;
    } else {
      // Los investigadores solo ven sus productos y proyectos donde son colaboradores
      query = `
        SELECT 
          pr.id, pr.product_code, pr.product_type, pr.description, pr.doi, pr.url,
          pr.publication_date, pr.journal, pr.impact_factor, pr.citation_count,
          pr.is_public, pr.created_at, pr.updated_at,
          p.title as project_title, p.id as project_id,
          u.full_name as creator_name, u.email as creator_email,
          pc.name as category_name, pc.category_group, pc.impact_weight
        FROM products pr
        JOIN projects p ON pr.project_id = p.id
        JOIN users u ON pr.creator_id = u.id
        LEFT JOIN product_categories pc ON pr.product_type = pc.code
        LEFT JOIN project_collaborators pcol ON p.id = pcol.project_id AND pcol.user_id = ?
        WHERE pr.creator_id = ? OR p.owner_id = ? OR pcol.user_id = ?
        ORDER BY pr.updated_at DESC
      `;
      params = [user.userId, user.userId, user.userId, user.userId];
    }
    
    console.log('🔍 Ejecutando query:', query);
    console.log('🔍 Parámetros:', params);
    
    const products = await c.env.DB.prepare(query).bind(...params).all();
    
    console.log('🔍 Productos encontrados:', products.results.length);
    
    return c.json<APIResponse<any>>({
      success: true,
      data: { products: products.results }
    });
    
  } catch (error) {
    console.error('❌ Error obteniendo productos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== RUTAS DE MONITOREO ESTRATÉGICO (NIVEL USUARIO) =====

// Obtener líneas de acción disponibles
privateRoutes.get('/action-lines', async (c) => {
  try {
    const actionLines = await c.env.DB.prepare(`
      SELECT 
        id, code, name, description, department, priority, 
        status, color_code, created_at
      FROM action_lines 
      WHERE status = 'ACTIVE'
      ORDER BY priority DESC, name ASC
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { action_lines: actionLines.results }
    });

  } catch (error) {
    console.error('Error obteniendo líneas de acción:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener timeline personal del usuario
privateRoutes.get('/timeline', async (c) => {
  try {
    const user = c.get('user')!;
    const limit = parseInt(c.req.query('limit') || '50');
    const offset = parseInt(c.req.query('offset') || '0');

    let timelineQuery: string;
    let params: any[] = [];

    if (user.role === 'ADMIN') {
      // Timeline global para admins
      timelineQuery = `
        SELECT 
          'project' as event_type,
          p.id as entity_id,
          p.title as event_title,
          'Proyecto ' || CASE 
            WHEN p.created_at = p.updated_at THEN 'creado'
            ELSE 'actualizado'
          END as event_description,
          p.updated_at as event_date,
          u.full_name as user_name,
          al.name as action_line_name,
          al.color_code as action_line_color
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN action_lines al ON p.action_line_id = al.id
        
        UNION ALL
        
        SELECT 
          'milestone' as event_type,
          pm.id as entity_id,
          pm.title as event_title,
          CASE 
            WHEN pm.status = 'COMPLETED' THEN 'Milestone completado'
            WHEN pm.target_date < date('now') THEN 'Milestone vencido'
            ELSE 'Milestone programado'
          END as event_description,
          COALESCE(pm.completion_date, pm.target_date) as event_date,
          u.full_name as user_name,
          al.name as action_line_name,
          al.color_code as action_line_color
        FROM project_milestones pm
        JOIN projects p ON pm.project_id = p.id
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN action_lines al ON p.action_line_id = al.id
        
        ORDER BY event_date DESC
        LIMIT ? OFFSET ?
      `;
      params = [limit, offset];
    } else {
      // Timeline personal para investigadores
      timelineQuery = `
        SELECT 
          'project' as event_type,
          p.id as entity_id,
          p.title as event_title,
          'Proyecto ' || CASE 
            WHEN p.created_at = p.updated_at THEN 'creado'
            ELSE 'actualizado'
          END as event_description,
          p.updated_at as event_date,
          u.full_name as user_name,
          al.name as action_line_name,
          al.color_code as action_line_color
        FROM projects p
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        LEFT JOIN action_lines al ON p.action_line_id = al.id
        WHERE p.owner_id = ? OR pc.user_id = ?
        
        UNION ALL
        
        SELECT 
          'milestone' as event_type,
          pm.id as entity_id,
          pm.title as event_title,
          CASE 
            WHEN pm.status = 'COMPLETED' THEN 'Milestone completado'
            WHEN pm.target_date < date('now') THEN 'Milestone vencido'
            ELSE 'Milestone programado'
          END as event_description,
          COALESCE(pm.completion_date, pm.target_date) as event_date,
          u.full_name as user_name,
          al.name as action_line_name,
          al.color_code as action_line_color
        FROM project_milestones pm
        JOIN projects p ON pm.project_id = p.id
        JOIN users u ON p.owner_id = u.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        LEFT JOIN action_lines al ON p.action_line_id = al.id
        WHERE p.owner_id = ? OR pc.user_id = ?
        
        ORDER BY event_date DESC
        LIMIT ? OFFSET ?
      `;
      params = [user.userId, user.userId, user.userId, user.userId, limit, offset];
    }

    const timeline = await c.env.DB.prepare(timelineQuery).bind(...params).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { timeline: timeline.results }
    });

  } catch (error) {
    console.error('Error obteniendo timeline:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener milestones de un proyecto
privateRoutes.get('/projects/:projectId/milestones', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));

    // Verificar acceso al proyecto
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(`
        SELECT p.id FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
      `).bind(projectId, user.userId, user.userId).first();

      if (!project) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'Proyecto no encontrado o sin permisos' 
        }, 404);
      }
    }

    const milestones = await c.env.DB.prepare(`
      SELECT 
        id, project_id, title, description,
        target_date, status, completion_date, progress_percentage,
        created_at, updated_at
      FROM project_milestones 
      WHERE project_id = ?
      ORDER BY progress_percentage ASC, target_date ASC
    `).bind(projectId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { milestones: milestones.results }
    });

  } catch (error) {
    console.error('Error obteniendo milestones:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Crear milestone para un proyecto
privateRoutes.post('/projects/:projectId/milestones', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const { 
      milestone_title, 
      milestone_description, 
      due_date, 
      milestone_order = 1 
    } = await c.req.json();

    if (!milestone_title || !due_date) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Título y fecha límite son requeridos' 
      }, 400);
    }

    // Verificar permisos sobre el proyecto
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(`
        SELECT p.owner_id, pc.can_edit_project FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR (pc.user_id = ? AND pc.can_edit_project = 1))
      `).bind(user.userId, projectId, user.userId, user.userId).first();

      if (!project) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para añadir milestones a este proyecto' 
        }, 403);
      }
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO project_milestones (
        project_id, milestone_title, milestone_description, 
        due_date, milestone_order
      ) 
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      projectId, milestone_title, milestone_description || null, 
      due_date, milestone_order
    ).run();

    if (!result.success) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Error al crear milestone' 
      }, 500);
    }

    // Actualizar próximo milestone en el proyecto
    await c.env.DB.prepare(`
      UPDATE projects 
      SET 
        next_milestone_date = (
          SELECT MIN(target_date) 
          FROM project_milestones 
          WHERE project_id = ? AND status != 'COMPLETED'
        ),
        next_milestone_description = (
          SELECT title 
          FROM project_milestones 
          WHERE project_id = ? AND status != 'COMPLETED'
          ORDER BY target_date ASC, progress_percentage ASC 
          LIMIT 1
        )
      WHERE id = ?
    `).bind(projectId, projectId, projectId).run();

    return c.json<APIResponse<{ id: number }>>({
      success: true,
      data: { id: result.meta.last_row_id as number },
      message: 'Milestone creado exitosamente'
    }, 201);

  } catch (error) {
    console.error('Error creando milestone:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Completar/marcar milestone
privateRoutes.put('/projects/:projectId/milestones/:milestoneId/complete', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const milestoneId = parseInt(c.req.param('milestoneId'));
    const { status } = await c.req.json<{ status: string }>();

    // Verificar permisos sobre el proyecto
    if (user.role !== 'ADMIN') {
      const project = await c.env.DB.prepare(`
        SELECT p.owner_id, pc.can_edit_project FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR (pc.user_id = ? AND pc.can_edit_project = 1))
      `).bind(user.userId, projectId, user.userId, user.userId).first();

      if (!project) {
        return c.json<APIResponse>({ 
          success: false, 
          error: 'No tienes permiso para modificar milestones de este proyecto' 
        }, 403);
      }
    }

    // Actualizar milestone
    const result = await c.env.DB.prepare(`
      UPDATE project_milestones 
      SET 
        status = ?, 
        completion_date = CASE WHEN ? = 'COMPLETED' THEN datetime('now') ELSE NULL END,
        updated_at = datetime('now')
      WHERE id = ? AND project_id = ?
    `).bind(status, status, milestoneId, projectId).run();

    if (!result.success || result.meta.changes === 0) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Milestone no encontrado' 
      }, 404);
    }

    // Recalcular progreso del proyecto
    const progressResult = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_milestones,
        COUNT(CASE WHEN status = 'COMPLETED' THEN 1 END) as completed_milestones
      FROM project_milestones 
      WHERE project_id = ?
    `).bind(projectId).first();

    if (progressResult) {
      const totalMilestones = progressResult.total_milestones as number;
      const completedMilestones = progressResult.completed_milestones as number;
      const progressPercentage = totalMilestones > 0 
        ? Math.round((completedMilestones / totalMilestones) * 100) 
        : 0;

      // Actualizar progreso del proyecto
      await c.env.DB.prepare(`
        UPDATE projects 
        SET 
          progress_percentage = ?,
          next_milestone_date = (
            SELECT MIN(target_date) 
            FROM project_milestones 
            WHERE project_id = ? AND status != 'COMPLETED'
          ),
          next_milestone_description = (
            SELECT title 
            FROM project_milestones 
            WHERE project_id = ? AND status != 'COMPLETED'
            ORDER BY target_date ASC, progress_percentage ASC 
            LIMIT 1
          )
        WHERE id = ?
      `).bind(progressPercentage, projectId, projectId, projectId).run();
    }

    return c.json<APIResponse>({
      success: true,
      message: `Milestone ${status === 'COMPLETED' ? 'completado' : 'actualizado'} exitosamente`
    });

  } catch (error) {
    console.error('Error actualizando milestone:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Actualizar proyecto con línea de acción y monitoreo
privateRoutes.put('/projects/:id/monitoring', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));
    const { action_line_id, progress_percentage } = await c.req.json();

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

    if (action_line_id !== undefined) {
      updateFields.push('action_line_id = ?');
      params.push(action_line_id);
    }
    // risk_level field removed - column doesn't exist in current schema
    if (progress_percentage !== undefined) {
      updateFields.push('progress_percentage = ?');
      params.push(progress_percentage);
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
        error: 'Error al actualizar el monitoreo del proyecto' 
      }, 500);
    }

    return c.json<APIResponse>({
      success: true,
      message: 'Monitoreo del proyecto actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando monitoreo del proyecto:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener alertas personales del usuario
privateRoutes.get('/alerts', async (c) => {
  try {
    const user = c.get('user')!;
    const limit = parseInt(c.req.query('limit') || '20');
    const only_unresolved = c.req.query('only_unresolved') === 'true';

    let alertQuery: string;
    let params: any[] = [];

    if (user.role === 'ADMIN') {
      // Todas las alertas para admins
      alertQuery = `
        SELECT 
          sa.id, sa.alert_type, sa.message, sa.severity, sa.project_id,
          sa.is_resolved, sa.resolved_at, sa.created_at,
          p.title as project_title,
          al.name as action_line_name
        FROM system_alerts sa
        LEFT JOIN projects p ON sa.project_id = p.id
        LEFT JOIN action_lines al ON p.action_line_id = al.id
      `;
      
      if (only_unresolved) {
        alertQuery += ' WHERE sa.is_resolved = 0';
      }
      
      alertQuery += ' ORDER BY sa.created_at DESC LIMIT ?';
      params = [limit];
    } else {
      // Alertas de los proyectos del usuario
      alertQuery = `
        SELECT 
          sa.id, sa.alert_type, sa.message, sa.severity, sa.project_id,
          sa.is_resolved, sa.resolved_at, sa.created_at,
          p.title as project_title,
          al.name as action_line_name
        FROM system_alerts sa
        JOIN projects p ON sa.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id
        LEFT JOIN action_lines al ON p.action_line_id = al.id
        WHERE (p.owner_id = ? OR pc.user_id = ?)
      `;
      
      params.push(user.userId, user.userId);
      
      if (only_unresolved) {
        alertQuery += ' AND sa.is_resolved = 0';
      }
      
      alertQuery += ' ORDER BY sa.created_at DESC LIMIT ?';
      params.push(limit);
    }

    const alerts = await c.env.DB.prepare(alertQuery).bind(...params).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { alerts: alerts.results }
    });

  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== SISTEMA DE GESTIÓN DE ARCHIVOS PARA INVESTIGADORES =====

// Subir archivo para proyecto o producto
privateRoutes.post('/projects/:projectId/upload', async (c) => {
  try {
    const { projectId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar permisos sobre el proyecto (ADMIN tiene acceso completo)
    if (user.role !== 'ADMIN') {
      const projectAccess = await c.env.DB.prepare(`
        SELECT p.*, pc.can_add_products, pc.can_edit_project
        FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
      `).bind(user.userId, projectId, user.userId, user.userId).first();
      
      if (!projectAccess) {
        return c.json({ success: false, error: 'No tienes permisos para subir archivos a este proyecto' }, 403);
      }
    }
    
    // Verificar que el proyecto existe (para ADMIN)
    const project = await c.env.DB.prepare(`
      SELECT id FROM projects WHERE id = ?
    `).bind(projectId).first();
    
    if (!project) {
      return c.json({ success: false, error: 'Proyecto no encontrado' }, 404);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const fileType = (formData.get('type') as string) || 'project';
    
    if (!file) {
      return c.json({ success: false, error: 'No se proporcionó ningún archivo' }, 400);
    }
    
    // Validaciones de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain'];
    const maxSize = 15 * 1024 * 1024; // 15MB
    
    if (!allowedTypes.includes(file.type)) {
      return c.json({ 
        success: false, 
        error: 'Tipo de archivo no permitido. Permitidos: PDF, JPG, PNG, WebP, TXT' 
      }, 400);
    }
    
    if (file.size > maxSize) {
      return c.json({ 
        success: false, 
        error: 'El archivo no puede superar 15MB' 
      }, 400);
    }
    
    // Generar nombre único
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `project-${projectId}-${timestamp}-${randomId}.${extension}`;
    
    let fileUrl;
    let fullPath;
    
    if (c.env.R2) {
      // Usar R2 en producción
      fullPath = `projects/${fileName}`;
      const arrayBuffer = await file.arrayBuffer();
      await c.env.R2.put(fullPath, arrayBuffer, {
        httpMetadata: {
          contentType: file.type,
        },
        customMetadata: {
          originalName: file.name,
          uploadedBy: user.userId.toString(),
          projectId: projectId,
          uploadedAt: new Date().toISOString(),
        },
      });
      fileUrl = `/api/files/r2/${fullPath}`;
    } else {
      // Almacenamiento simulado para desarrollo local
      fullPath = `local/${fileName}`;
      fileUrl = `/api/files/local/${fileName}`;
      console.log(`📁 Archivo simulado guardado: ${fileName} (${file.size} bytes, tipo: ${file.type})`);
    }
    
    // Registrar en base de datos
    await c.env.DB.prepare(`
      INSERT INTO files (
        filename, original_name, file_path, file_url, file_type, 
        file_size, mime_type, entity_type, entity_id, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      fileName,
      file.name,
      fullPath,
      fileUrl,
      fileType,
      file.size,
      file.type,
      'project',
      projectId,
      user.userId,
      new Date().toISOString()
    ).run();
    
    return c.json({
      success: true,
      data: {
        file_url: fileUrl,
        filename: fileName,
        original_name: file.name,
        file_size: file.size,
        message: 'Archivo subido exitosamente'
      }
    });
    
  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Subir archivo para producto específico
privateRoutes.post('/projects/:projectId/products/:productId/upload', async (c) => {
  try {
    const { projectId, productId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar permisos sobre el producto (ADMIN tiene acceso completo)
    let productAccess;
    if (user.role === 'ADMIN') {
      // ADMIN puede acceder a cualquier producto
      productAccess = await c.env.DB.prepare(`
        SELECT pr.*, p.owner_id, 1 as has_permission
        FROM products pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.id = ? AND pr.project_id = ?
      `).bind(productId, projectId).first();
    } else {
      productAccess = await c.env.DB.prepare(`
        SELECT pr.*, p.owner_id, pc.can_add_products,
               (pr.creator_id = ? OR p.owner_id = ? OR pc.user_id = ?) as has_permission
        FROM products pr
        JOIN projects p ON pr.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE pr.id = ? AND pr.project_id = ?
      `).bind(user.userId, user.userId, user.userId, user.userId, productId, projectId).first();
    }
    
    if (!productAccess || !productAccess.has_permission) {
      return c.json({ success: false, error: 'No tienes permisos para subir archivos a este producto' }, 403);
    }
    
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return c.json({ success: false, error: 'No se proporcionó ningún archivo' }, 400);
    }
    
    // Validaciones específicas para productos
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 'image/jpg', 'image/png', 
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    const maxSize = 20 * 1024 * 1024; // 20MB para productos
    
    if (!allowedTypes.includes(file.type)) {
      return c.json({ 
        success: false, 
        error: 'Tipo de archivo no permitido para productos CTeI' 
      }, 400);
    }
    
    if (file.size > maxSize) {
      return c.json({ success: false, error: 'El archivo no puede superar 20MB' }, 400);
    }
    
    if (!c.env.R2) {
      return c.json({ success: false, error: 'Almacenamiento no disponible' }, 500);
    }
    
    // Generar nombre único
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `product-${productId}-${timestamp}-${randomId}.${extension}`;
    const fullPath = `products/${fileName}`;
    
    // Subir a R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.R2.put(fullPath, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.userId.toString(),
        productId: productId,
        projectId: projectId,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    const fileUrl = `/api/admin/files/products/${fileName}`;
    
    // Registrar en base de datos
    await c.env.DB.prepare(`
      INSERT INTO files (
        filename, original_name, file_path, file_url, file_type, 
        file_size, mime_type, entity_type, entity_id, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      fileName,
      file.name,
      fullPath,
      fileUrl,
      'product',
      file.size,
      file.type,
      'product',
      productId,
      user.userId,
      new Date().toISOString()
    ).run();
    
    // Actualizar el producto con la URL del archivo principal
    await c.env.DB.prepare(`
      UPDATE products SET file_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND project_id = ?
    `).bind(fileUrl, productId, projectId).run();
    
    return c.json({
      success: true,
      data: {
        file_url: fileUrl,
        filename: fileName,
        original_name: file.name,
        file_size: file.size,
        message: 'Archivo del producto subido exitosamente'
      }
    });
    
  } catch (error) {
    console.error('Error subiendo archivo del producto:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});



// Listar archivos de un producto
privateRoutes.get('/projects/:projectId/products/:productId/files', async (c) => {
  try {
    const { projectId, productId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar acceso (ADMIN tiene acceso completo)
    let hasAccess;
    if (user.role === 'ADMIN') {
      // ADMIN puede acceder a cualquier producto
      hasAccess = await c.env.DB.prepare(`
        SELECT 1 FROM products pr
        JOIN projects p ON pr.project_id = p.id
        WHERE pr.id = ? AND pr.project_id = ?
      `).bind(productId, projectId).first();
    } else {
      hasAccess = await c.env.DB.prepare(`
        SELECT 1 FROM products pr
        JOIN projects p ON pr.project_id = p.id
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE pr.id = ? AND pr.project_id = ? AND (p.owner_id = ? OR pc.user_id = ?)
      `).bind(user.userId, productId, projectId, user.userId, user.userId).first();
    }
    
    if (!hasAccess) {
      return c.json({ success: false, error: 'No tienes acceso a este producto' }, 403);
    }
    
    const files = await c.env.DB.prepare(`
      SELECT f.*, u.full_name as uploaded_by_name
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.entity_type = 'product' AND f.entity_id = ?
      ORDER BY f.uploaded_at DESC
    `).bind(productId).all();
    
    return c.json({
      success: true,
      data: files.results
    });
    
  } catch (error) {
    console.error('Error listando archivos del producto:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Eliminar archivo (solo el creador o propietario del proyecto)
privateRoutes.delete('/files/:fileId', async (c) => {
  try {
    const { fileId } = c.req.param();
    const user = c.get('user')!;
    
    // Obtener información del archivo y verificar permisos
    const fileInfo = await c.env.DB.prepare(`
      SELECT f.*, p.owner_id, pr.creator_id as product_creator
      FROM files f
      LEFT JOIN projects p ON (f.entity_type = 'project' AND f.entity_id = p.id)
      LEFT JOIN products pr ON (f.entity_type = 'product' AND f.entity_id = pr.id)
      WHERE f.id = ?
    `).bind(fileId).first();
    
    if (!fileInfo) {
      return c.json({ success: false, error: 'Archivo no encontrado' }, 404);
    }
    
    // Verificar permisos
    const canDelete = fileInfo.uploaded_by === user.userId || 
                     fileInfo.owner_id === user.userId || 
                     fileInfo.product_creator === user.userId ||
                     user.role === 'ADMIN';
    
    if (!canDelete) {
      return c.json({ success: false, error: 'No tienes permisos para eliminar este archivo' }, 403);
    }
    
    // Eliminar de R2
    if (c.env.R2) {
      try {
        await c.env.R2.delete(fileInfo.file_path as string);
      } catch (error) {
        console.warn('Error eliminando de R2:', error);
      }
    }
    
    // Eliminar de base de datos
    await c.env.DB.prepare(`DELETE FROM files WHERE id = ?`).bind(fileId).run();
    
    return c.json({
      success: true,
      data: { message: 'Archivo eliminado exitosamente' }
    });
    
  } catch (error) {
    console.error('Error eliminando archivo:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// ===== SISTEMA DE SCORING Y EVALUACIÓN AUTOMATIZADA =====

// Calcular score de un proyecto específico
privateRoutes.post('/projects/:projectId/calculate-score', async (c) => {
  try {
    const { projectId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar permisos - admins pueden acceder a todos los proyectos
    let project;
    if (user.role === 'ADMIN') {
      // Los administradores pueden acceder a cualquier proyecto
      project = await c.env.DB.prepare(`
        SELECT p.*
        FROM projects p
        WHERE p.id = ?
      `).bind(projectId).first();
    } else {
      // Los investigadores solo pueden acceder a sus proyectos o aquellos donde colaboran
      project = await c.env.DB.prepare(`
        SELECT p.*, pc.can_edit_project
        FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
      `).bind(user.userId, projectId, user.userId, user.userId).first();
    }
    
    if (!project) {
      return c.json({ success: false, error: 'Proyecto no encontrado o sin permisos' }, 404);
    }
    
    // Obtener criterios de scoring activos
    const criteria = await c.env.DB.prepare(`
      SELECT * FROM scoring_criteria WHERE is_active = 1 ORDER BY weight DESC
    `).all();
    
    // Calcular scores por categoría
    const scores = await calculateProjectScores(c.env.DB, projectId, criteria.results);
    
    // Generar recomendaciones
    const recommendations = generateRecommendations(scores, project);
    
    // Determinar categoría de evaluación
    const category = determineEvaluationCategory(scores.total_score);
    
    // Marcar scores anteriores como no actuales
    await c.env.DB.prepare(`
      UPDATE project_scores SET is_current = 0 WHERE project_id = ?
    `).bind(projectId).run();
    
    // Guardar nuevo score
    await c.env.DB.prepare(`
      INSERT INTO project_scores (
        project_id, completeness_score, collaboration_score, productivity_score,
        impact_score, innovation_score, timeline_score, total_score,
        evaluation_category, recommendations, last_calculated_at, is_current
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
    `).bind(
      projectId,
      scores.completeness_score,
      scores.collaboration_score,
      scores.productivity_score,
      scores.impact_score,
      scores.innovation_score,
      scores.timeline_score,
      scores.total_score,
      category,
      JSON.stringify(recommendations)
    ).run();
    
    // Generar alertas si es necesario
    await generateProjectAlerts(c.env.DB, projectId, scores, project);
    
    return c.json({
      success: true,
      data: {
        scores,
        category,
        recommendations,
        message: 'Score calculado exitosamente'
      }
    });
    
  } catch (error) {
    console.error('Error calculando score:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Obtener score actual de un proyecto
privateRoutes.get('/projects/:projectId/score', async (c) => {
  try {
    const { projectId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar acceso al proyecto - admins pueden acceder a todos
    let hasAccess;
    if (user.role === 'ADMIN') {
      // Los administradores pueden acceder a cualquier proyecto
      hasAccess = await c.env.DB.prepare(`
        SELECT 1 FROM projects WHERE id = ?
      `).bind(projectId).first();
    } else {
      // Los investigadores solo pueden acceder a sus proyectos o aquellos donde colaboran
      hasAccess = await c.env.DB.prepare(`
        SELECT 1 FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
      `).bind(user.userId, projectId, user.userId, user.userId).first();
    }
    
    if (!hasAccess) {
      return c.json({ success: false, error: 'No tienes acceso a este proyecto' }, 403);
    }
    
    // Obtener score actual
    const score = await c.env.DB.prepare(`
      SELECT * FROM project_scores WHERE project_id = ? AND is_current = 1
    `).bind(projectId).first();
    
    if (!score) {
      return c.json({ success: false, error: 'No hay score calculado para este proyecto' }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...score,
        recommendations: score.recommendations ? JSON.parse(score.recommendations as string) : []
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo score:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Obtener alertas activas de un proyecto
privateRoutes.get('/projects/:projectId/alerts', async (c) => {
  try {
    const { projectId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar acceso
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
    `).bind(user.userId, projectId, user.userId, user.userId).first();
    
    if (!hasAccess) {
      return c.json({ success: false, error: 'No tienes acceso a este proyecto' }, 403);
    }
    
    const alerts = await c.env.DB.prepare(`
      SELECT * FROM project_alerts 
      WHERE project_id = ? AND status = 'ACTIVE'
      ORDER BY severity DESC, triggered_at DESC
    `).bind(projectId).all();
    
    return c.json({
      success: true,
      data: alerts.results
    });
    
  } catch (error) {
    console.error('Error obteniendo alertas:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Reconocer una alerta
privateRoutes.put('/alerts/:alertId/acknowledge', async (c) => {
  try {
    const { alertId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar que el usuario tiene acceso a la alerta
    const alert = await c.env.DB.prepare(`
      SELECT a.*, p.owner_id, pc.user_id as collaborator_id
      FROM project_alerts a
      JOIN projects p ON a.project_id = p.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE a.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
    `).bind(user.userId, alertId, user.userId, user.userId).first();
    
    if (!alert) {
      return c.json({ success: false, error: 'Alerta no encontrada o sin permisos' }, 404);
    }
    
    // Actualizar alerta
    await c.env.DB.prepare(`
      UPDATE project_alerts 
      SET status = 'ACKNOWLEDGED', acknowledged_by = ?, acknowledged_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(user.userId, alertId).run();
    
    return c.json({
      success: true,
      data: { message: 'Alerta reconocida exitosamente' }
    });
    
  } catch (error) {
    console.error('Error reconociendo alerta:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Calcular scores masivos para todos los proyectos del usuario
privateRoutes.post('/projects/calculate-all-scores', async (c) => {
  try {
    const user = c.get('user')!;
    
    // Obtener todos los proyectos del usuario
    const projects = await c.env.DB.prepare(`
      SELECT DISTINCT p.id FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.owner_id = ? OR pc.user_id = ?
    `).bind(user.userId, user.userId).all();
    
    const criteria = await c.env.DB.prepare(`
      SELECT * FROM scoring_criteria WHERE is_active = 1 ORDER BY weight DESC
    `).all();
    
    let processedCount = 0;
    const results = [];
    
    for (const project of projects.results) {
      try {
        const scores = await calculateProjectScores(c.env.DB, project.id as number, criteria.results);
        const category = determineEvaluationCategory(scores.total_score);
        
        // Marcar scores anteriores como no actuales
        await c.env.DB.prepare(`
          UPDATE project_scores SET is_current = 0 WHERE project_id = ?
        `).bind(project.id).run();
        
        // Guardar nuevo score
        await c.env.DB.prepare(`
          INSERT INTO project_scores (
            project_id, completeness_score, collaboration_score, productivity_score,
            impact_score, innovation_score, timeline_score, total_score,
            evaluation_category, last_calculated_at, is_current
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
        `).bind(
          project.id,
          scores.completeness_score,
          scores.collaboration_score,
          scores.productivity_score,
          scores.impact_score,
          scores.innovation_score,
          scores.timeline_score,
          scores.total_score,
          category
        ).run();
        
        processedCount++;
        results.push({ project_id: project.id, total_score: scores.total_score, category });
        
      } catch (error) {
        console.error(`Error procesando proyecto ${project.id}:`, error);
      }
    }
    
    return c.json({
      success: true,
      data: {
        processed_count: processedCount,
        total_projects: projects.results.length,
        results,
        message: `${processedCount} proyectos procesados exitosamente`
      }
    });
    
  } catch (error) {
    console.error('Error en cálculo masivo:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// ===== FUNCIONES AUXILIARES PARA SCORING =====

async function calculateProjectScores(db: any, projectId: number, criteria: any[]) {
  // Obtener datos del proyecto
  const project = await db.prepare(`
    SELECT p.*, COUNT(DISTINCT pc.user_id) as collaborator_count,
           COUNT(DISTINCT pr.id) as product_count
    FROM projects p
    LEFT JOIN project_collaborators pc ON p.id = pc.project_id
    LEFT JOIN products pr ON p.id = pr.project_id
    WHERE p.id = ?
    GROUP BY p.id
  `).bind(projectId).first();
  
  if (!project) throw new Error('Proyecto no encontrado');
  
  // 1. Score de Completitud (0-100)
  let completeness = 0;
  if (project.title && project.title.length > 10) completeness += 20;
  if (project.abstract && project.abstract.length > 50) completeness += 20;
  if (project.methodology && project.methodology.length > 100) completeness += 15;
  if (project.keywords && project.keywords.length > 0) completeness += 10;
  if (project.introduction && project.introduction.length > 100) completeness += 15;
  if (project.start_date) completeness += 10;
  if (project.budget && project.budget > 0) completeness += 10;
  
  // 2. Score de Colaboración (0-100)
  const collabCount = project.collaborator_count || 0;
  let collaboration = Math.min(collabCount * 20, 80); // Máximo 80 por colaboradores
  if (collabCount >= 5) collaboration += 20; // Bonus por red amplia
  
  // 3. Score de Productividad (0-100)
  const productCount = project.product_count || 0;
  let productivity = Math.min(productCount * 15, 85); // Máximo 85 por productos
  if (productCount >= 10) productivity += 15; // Bonus por alta productividad
  
  // 4. Score de Impacto (0-100) - Simulado por ahora
  const impact = Math.min(50 + (productCount * 10), 100);
  
  // 5. Score de Innovación (0-100) - Basado en diversidad de productos
  const innovation = Math.min(30 + (productCount * 8), 100);
  
  // 6. Score de Timeline (0-100)
  const now = new Date();
  const updated = new Date(project.updated_at);
  const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
  let timeline = Math.max(100 - (daysSinceUpdate * 2), 0); // Penalizar inactividad
  
  // Calcular score total ponderado
  const criteriaWeights = criteria.reduce((acc: any, c: any) => {
    acc[c.criterion_name] = c.weight;
    return acc;
  }, {});
  
  const total_score = Math.round(
    (completeness * (criteriaWeights.completeness || 0.25)) +
    (collaboration * (criteriaWeights.collaboration || 0.20)) +
    (productivity * (criteriaWeights.productivity || 0.25)) +
    (impact * (criteriaWeights.impact || 0.15)) +
    (innovation * (criteriaWeights.innovation || 0.10)) +
    (timeline * (criteriaWeights.timeline || 0.05))
  );
  
  return {
    completeness_score: Math.round(completeness),
    collaboration_score: Math.round(collaboration),
    productivity_score: Math.round(productivity),
    impact_score: Math.round(impact),
    innovation_score: Math.round(innovation),
    timeline_score: Math.round(timeline),
    total_score: Math.min(total_score, 100)
  };
}

function generateRecommendations(scores: any, project: any) {
  const recommendations = [];
  
  if (scores.completeness_score < 60) {
    recommendations.push({
      category: 'completeness',
      priority: 'HIGH',
      title: 'Mejorar Completitud del Proyecto',
      description: 'Completa la información faltante: metodología, introducción, presupuesto y fechas.',
      actions: ['Añadir metodología detallada', 'Completar introducción', 'Definir presupuesto']
    });
  }
  
  if (scores.collaboration_score < 40) {
    recommendations.push({
      category: 'collaboration',
      priority: 'MEDIUM',
      title: 'Ampliar Red de Colaboración',
      description: 'Considera invitar más colaboradores para enriquecer el proyecto.',
      actions: ['Invitar colaboradores externos', 'Contactar otras instituciones', 'Formar alianzas estratégicas']
    });
  }
  
  if (scores.productivity_score < 50) {
    recommendations.push({
      category: 'productivity',
      priority: 'HIGH',
      title: 'Incrementar Productividad',
      description: 'El proyecto necesita generar más productos CTeI.',
      actions: ['Crear más productos', 'Establecer metas de productividad', 'Optimizar flujo de trabajo']
    });
  }
  
  if (scores.timeline_score < 70) {
    recommendations.push({
      category: 'timeline',
      priority: 'MEDIUM',
      title: 'Activar Proyecto',
      description: 'El proyecto muestra poca actividad reciente.',
      actions: ['Actualizar información', 'Registrar avances', 'Definir próximos hitos']
    });
  }
  
  return recommendations;
}

function determineEvaluationCategory(totalScore: number): string {
  if (totalScore >= 85) return 'EXCELENTE';
  if (totalScore >= 70) return 'BUENO';
  if (totalScore >= 50) return 'REGULAR';
  return 'NECESITA_MEJORA';
}

async function generateProjectAlerts(db: any, projectId: number, scores: any, project: any) {
  const alerts = [];
  
  // Alerta por score bajo
  if (scores.total_score < 50) {
    alerts.push({
      type: 'LOW_SCORE',
      severity: 'HIGH',
      title: 'Score Bajo del Proyecto',
      message: `El proyecto tiene un score de ${scores.total_score}/100, lo que indica necesidad de mejoras.`,
      action: 'Revisar recomendaciones y implementar mejoras sugeridas'
    });
  }
  
  // Alerta por inactividad
  if (scores.timeline_score < 50) {
    alerts.push({
      type: 'NO_ACTIVITY',
      severity: 'MEDIUM',
      title: 'Proyecto Inactivo',
      message: 'El proyecto no muestra actividad reciente.',
      action: 'Actualizar el progreso del proyecto y registrar nuevas actividades'
    });
  }
  
  // Alerta por oportunidad de mejora
  if (scores.collaboration_score < 40 && scores.productivity_score > 70) {
    alerts.push({
      type: 'IMPROVEMENT_OPPORTUNITY',
      severity: 'LOW',
      title: 'Oportunidad de Colaboración',
      message: 'El proyecto es productivo pero podría beneficiarse de más colaboradores.',
      action: 'Considerar invitar colaboradores para ampliar el impacto'
    });
  }
  
  // Insertar alertas en la base de datos
  for (const alert of alerts) {
    try {
      await db.prepare(`
        INSERT INTO project_alerts (
          project_id, alert_type, severity, title, message, action_required
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        projectId, alert.type, alert.severity, alert.title, alert.message, alert.action
      ).run();
    } catch (error) {
      console.error('Error insertando alerta:', error);
    }
  }
}

// ===== GESTIÓN DE ARCHIVOS PARA PROYECTOS =====

// Subir archivo a un proyecto
privateRoutes.post('/projects/:projectId/files', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    
    // Verificar acceso al proyecto
    const project = await c.env.DB.prepare(`
      SELECT p.id, p.owner_id, pc.user_id as collaborator_id
      FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ?)
    `).bind(user.userId, projectId, user.userId, user.userId).first();

    if (!project) {
      return c.json<APIResponse>({
        success: false,
        error: 'Proyecto no encontrado o sin permisos para subir archivos'
      }, 404);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string || 'document';
    
    if (!file) {
      return c.json<APIResponse>({
        success: false,
        error: 'No se proporcionó ningún archivo'
      }, 400);
    }

    // Validar tipo de archivo
    const allowedTypes = [
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain', 'text/csv',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif'
    ];

    if (!allowedTypes.includes(file.type)) {
      return c.json<APIResponse>({
        success: false,
        error: 'Tipo de archivo no permitido'
      }, 400);
    }

    // Validar tamaño (50MB máximo)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json<APIResponse>({
        success: false,
        error: 'El archivo es demasiado grande (máximo 50MB)'
      }, 400);
    }

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${randomId}.${extension}`;
    const filePath = `projects/${fileName}`;

    // Subir a R2
    await c.env.R2.put(filePath, await file.arrayBuffer(), {
      customMetadata: {
        originalName: file.name,
        uploadedBy: user.userId.toString(),
        projectId: projectId.toString(),
        fileType: fileType,
        uploadedAt: new Date().toISOString(),
      },
    });

    // Registrar en base de datos
    const insertResult = await c.env.DB.prepare(`
      INSERT INTO files (
        filename, original_name, file_path, file_url, file_type, 
        file_size, mime_type, entity_type, entity_id, uploaded_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      fileName,
      file.name,
      filePath,
      `/api/private/files/download/${fileName}`,
      fileType,
      file.size,
      file.type,
      'project',
      projectId.toString(),
      user.userId
    ).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        fileId: insertResult.meta.last_row_id,
        fileName: fileName,
        originalName: file.name,
        fileUrl: `/api/private/files/download/${fileName}`,
        size: file.size,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Error subiendo archivo:', error);
    return c.json<APIResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, 500);
  }
});

// Obtener archivos de un proyecto
privateRoutes.get('/projects/:projectId/files', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    
    // Verificar acceso al proyecto (ADMIN tiene acceso completo)
    let project;
    if (user.role === 'ADMIN') {
      // ADMIN puede acceder a cualquier proyecto
      project = await c.env.DB.prepare(`
        SELECT p.id, p.owner_id, null as collaborator_id
        FROM projects p
        WHERE p.id = ?
      `).bind(projectId).first();
    } else {
      project = await c.env.DB.prepare(`
        SELECT p.id, p.owner_id, pc.user_id as collaborator_id
        FROM projects p
        LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
        WHERE p.id = ? AND (p.owner_id = ? OR pc.user_id = ? OR p.is_public = 1)
      `).bind(user.userId, projectId, user.userId, user.userId).first();
    }

    if (!project) {
      return c.json<APIResponse>({
        success: false,
        error: 'Proyecto no encontrado o sin permisos'
      }, 404);
    }

    const files = await c.env.DB.prepare(`
      SELECT 
        f.id, f.filename, f.original_name, f.file_url, f.file_type, 
        f.file_size, f.mime_type, f.uploaded_at,
        u.full_name as uploaded_by_name, u.email as uploaded_by_email
      FROM files f
      LEFT JOIN users u ON f.uploaded_by = u.id
      WHERE f.entity_type = 'project' AND f.entity_id = ?
      ORDER BY f.uploaded_at DESC
    `).bind(projectId.toString()).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: { files: files.results }
    });

  } catch (error) {
    console.error('Error obteniendo archivos:', error);
    return c.json<APIResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, 500);
  }
});

// Descargar archivo
privateRoutes.get('/files/download/:filename', async (c) => {
  try {
    const { filename } = c.req.param();
    
    // Verificar que el archivo existe en la base de datos
    const fileRecord = await c.env.DB.prepare(`
      SELECT f.*, p.owner_id, pc.user_id as collaborator_id
      FROM files f
      LEFT JOIN projects p ON f.entity_type = 'project' AND CAST(f.entity_id AS INTEGER) = p.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE f.filename = ?
    `).bind(filename).first();

    if (!fileRecord) {
      return c.text('Archivo no encontrado', 404);
    }

    // Verificar permisos
    const user = c.get('user')!;
    const hasAccess = user.role === 'ADMIN' || 
                      fileRecord.uploaded_by === user.userId ||
                      fileRecord.owner_id === user.userId ||
                      fileRecord.collaborator_id === user.userId;

    if (!hasAccess) {
      return c.text('Sin permisos para acceder al archivo', 403);
    }

    // Obtener archivo de R2
    const object = await c.env.R2.get(fileRecord.file_path);
    
    if (!object) {
      return c.text('Archivo no encontrado en el almacenamiento', 404);
    }

    return new Response(object.body, {
      headers: {
        'Content-Type': fileRecord.mime_type,
        'Content-Disposition': `inline; filename="${fileRecord.original_name}"`,
        'Content-Length': fileRecord.file_size.toString(),
      },
    });

  } catch (error) {
    console.error('Error descargando archivo:', error);
    return c.text('Error interno del servidor', 500);
  }
});

// Eliminar archivo
privateRoutes.delete('/projects/:projectId/files/:fileId', requireRole('INVESTIGATOR', 'ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('projectId'));
    const fileId = parseInt(c.req.param('fileId'));
    
    // Verificar que el archivo pertenece al proyecto y el usuario tiene permisos
    const file = await c.env.DB.prepare(`
      SELECT f.*, p.owner_id, pc.user_id as collaborator_id
      FROM files f
      LEFT JOIN projects p ON f.entity_type = 'project' AND CAST(f.entity_id AS INTEGER) = p.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE f.id = ? AND f.entity_id = ? AND f.entity_type = 'project'
    `).bind(user.userId, fileId, projectId.toString()).first();

    if (!file) {
      return c.json<APIResponse>({
        success: false,
        error: 'Archivo no encontrado'
      }, 404);
    }

    // Verificar permisos de eliminación
    const canDelete = user.role === 'ADMIN' || 
                      file.uploaded_by === user.userId ||
                      file.owner_id === user.userId;

    if (!canDelete) {
      return c.json<APIResponse>({
        success: false,
        error: 'Sin permisos para eliminar este archivo'
      }, 403);
    }

    // Eliminar de R2
    await c.env.R2.delete(file.file_path);
    
    // Eliminar de base de datos
    await c.env.DB.prepare('DELETE FROM files WHERE id = ?').bind(fileId).run();

    return c.json<APIResponse>({
      success: true,
      data: { message: 'Archivo eliminado correctamente' }
    });

  } catch (error) {
    console.error('Error eliminando archivo:', error);
    return c.json<APIResponse>({
      success: false,
      error: 'Error interno del servidor'
    }, 500);
  }
});

// ===== SISTEMA DE SCORING PARA PRODUCTOS CIENTÍFICOS =====

// Calcular score de un producto específico
privateRoutes.post('/products/:productId/calculate-score', async (c) => {
  try {
    const { productId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar acceso al producto
    const product = await c.env.DB.prepare(`
      SELECT pr.*, p.owner_id 
      FROM products pr
      LEFT JOIN projects p ON pr.project_id = p.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE pr.id = ? AND (p.owner_id = ? OR pc.user_id = ? OR pr.creator_id = ?)
    `).bind(user.userId, productId, user.userId, user.userId, user.userId).first();
    
    if (!product) {
      return c.json({ success: false, error: 'Producto no encontrado o sin acceso' }, 404);
    }
    
    // Calcular scores del producto
    const scores = await calculateProductScores(c.env.DB, parseInt(productId), product);
    const category = determineProductEvaluationCategory(scores.total_score);
    
    // Marcar scores anteriores como no actuales (si existe tabla)
    try {
      await c.env.DB.prepare(`
        UPDATE product_scores SET is_current = 0 WHERE product_id = ?
      `).bind(productId).run();
    } catch (e) {
      // Tabla no existe, continuar sin error
    }
    
    // Intentar guardar score (crear tabla si no existe)
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS product_scores (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          completeness_score DECIMAL(5,2) DEFAULT 0,
          impact_score DECIMAL(5,2) DEFAULT 0,
          quality_score DECIMAL(5,2) DEFAULT 0,
          novelty_score DECIMAL(5,2) DEFAULT 0,
          total_score DECIMAL(5,2) DEFAULT 0,
          evaluation_category TEXT DEFAULT 'REGULAR',
          recommendations TEXT,
          last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          is_current BOOLEAN DEFAULT 1,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
        )
      `).run();
      
      await c.env.DB.prepare(`
        INSERT INTO product_scores (
          product_id, completeness_score, impact_score, quality_score, 
          novelty_score, total_score, evaluation_category, recommendations, 
          last_calculated_at, is_current
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 1)
      `).bind(
        productId,
        scores.completeness_score,
        scores.impact_score,
        scores.quality_score,
        scores.novelty_score,
        scores.total_score,
        category,
        JSON.stringify(scores.recommendations || [])
      ).run();
      
    } catch (e) {
      console.warn('Error guardando product score:', e);
    }
    
    return c.json({
      success: true,
      data: {
        scores,
        category,
        message: 'Score de producto calculado exitosamente'
      }
    });
    
  } catch (error) {
    console.error('Error calculando score de producto:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Obtener score actual de un producto
privateRoutes.get('/products/:productId/score', async (c) => {
  try {
    const { productId } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar acceso
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 FROM products pr
      LEFT JOIN projects p ON pr.project_id = p.id
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id AND pc.user_id = ?
      WHERE pr.id = ? AND (p.owner_id = ? OR pc.user_id = ? OR pr.creator_id = ?)
    `).bind(user.userId, productId, user.userId, user.userId, user.userId).first();
    
    if (!hasAccess) {
      return c.json({ success: false, error: 'Sin acceso al producto' }, 403);
    }
    
    // Intentar obtener score (la tabla podría no existir)
    let score;
    try {
      score = await c.env.DB.prepare(`
        SELECT * FROM product_scores WHERE product_id = ? AND is_current = 1
      `).bind(productId).first();
    } catch (e) {
      // Tabla no existe
      return c.json({ success: false, error: 'No hay score calculado para este producto' }, 404);
    }
    
    if (!score) {
      return c.json({ success: false, error: 'No hay score calculado para este producto' }, 404);
    }
    
    return c.json({
      success: true,
      data: {
        ...score,
        recommendations: score.recommendations ? JSON.parse(score.recommendations as string) : []
      }
    });
    
  } catch (error) {
    console.error('Error obteniendo score de producto:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Funciones auxiliares para scoring de productos
async function calculateProductScores(db: any, productId: number, product: any) {
  // 1. Score de Completitud (0-100)
  let completeness = 0;
  if (product.description && product.description.trim().length > 0) completeness += 25;
  if (product.product_type && product.product_type.trim().length > 0) completeness += 20;
  if (product.doi && product.doi.trim().length > 0) completeness += 20;
  if (product.publication_date) completeness += 15;
  if (product.journal_name && product.journal_name.trim().length > 0) completeness += 20;
  
  // 2. Score de Impacto (0-100)
  let impact = 20; // Base score
  if (product.doi && product.doi.trim().length > 0) impact += 30; // Tiene DOI
  if (product.impact_factor && product.impact_factor > 0) {
    impact += Math.min(product.impact_factor * 10, 30); // Factor de impacto
  }
  if (product.citations && product.citations > 0) {
    impact += Math.min(product.citations * 2, 20); // Citaciones
  }
  
  // 3. Score de Calidad (0-100) - Basado en journal y tipo
  let quality = 40; // Base score
  if (product.journal_name && product.journal_name.includes('International')) quality += 20;
  if (product.product_type === 'JOURNAL_ARTICLE') quality += 20;
  if (product.product_type === 'BOOK') quality += 15;
  if (product.product_type === 'PATENT') quality += 20;
  
  // 4. Score de Novedad (0-100) - Basado en fecha y tipo
  let novelty = 50; // Base score
  if (product.publication_date) {
    const pubDate = new Date(product.publication_date);
    const now = new Date();
    const monthsDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff <= 12) novelty += 30; // Publicado en último año
    else if (monthsDiff <= 24) novelty += 20; // Publicado en últimos 2 años
    else if (monthsDiff <= 36) novelty += 10; // Publicado en últimos 3 años
  }
  
  // Score total ponderado
  const total_score = Math.round(
    (completeness * 0.30) +
    (impact * 0.35) +
    (quality * 0.25) +
    (novelty * 0.10)
  );
  
  // Generar recomendaciones
  const recommendations = [];
  if (completeness < 70) recommendations.push('Completa la información básica del producto (descripción, tipo, DOI)');
  if (impact < 50) recommendations.push('Considera publicar en journals con mayor factor de impacto');
  if (!product.doi) recommendations.push('Obtén un DOI para el producto para mejorar su visibilidad');
  if (quality < 60) recommendations.push('Apunta a publicaciones en journals internacionales reconocidos');
  
  return {
    completeness_score: Math.min(Math.round(completeness), 100),
    impact_score: Math.min(Math.round(impact), 100),
    quality_score: Math.min(Math.round(quality), 100),
    novelty_score: Math.min(Math.round(novelty), 100),
    total_score: Math.min(total_score, 100),
    recommendations
  };
}

function determineProductEvaluationCategory(totalScore: number): string {
  if (totalScore >= 85) return 'EXCELENTE';
  if (totalScore >= 70) return 'BUENO';
  if (totalScore >= 50) return 'REGULAR';
  return 'NECESITA_MEJORA';
}

// ===== SISTEMA DE LÍNEAS DE ACCIÓN =====

// Obtener todas las líneas de acción
privateRoutes.get('/action-lines', async (c) => {
  try {
    const user = c.get('user')!;
    
    // Solo usuarios autenticados pueden ver las líneas de acción
    const actionLines = await c.env.DB.prepare(`
      SELECT id, name, description, icon, color, is_active, display_order
      FROM action_lines 
      WHERE is_active = 1 
      ORDER BY display_order ASC, name ASC
    `).all();

    return c.json({
      success: true,
      data: actionLines.results
    });

  } catch (error) {
    console.error('Error obteniendo líneas de acción:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Obtener línea de acción por ID
privateRoutes.get('/action-lines/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user')!;
    
    const actionLine = await c.env.DB.prepare(`
      SELECT id, name, description, icon, color, is_active, display_order, created_at, updated_at
      FROM action_lines 
      WHERE id = ?
    `).bind(id).first();

    if (!actionLine) {
      return c.json({ success: false, error: 'Línea de acción no encontrada' }, 404);
    }

    return c.json({
      success: true,
      data: actionLine
    });

  } catch (error) {
    console.error('Error obteniendo línea de acción:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Crear nueva línea de acción (solo ADMIN)
privateRoutes.post('/action-lines', requireRole('ADMIN'), async (c) => {
  try {
    const user = c.get('user')!;
    const body = await c.req.json();
    
    const { name, description, icon, color, display_order } = body;
    
    // Validaciones
    if (!name || !description) {
      return c.json({ 
        success: false, 
        error: 'Nombre y descripción son obligatorios' 
      }, 400);
    }

    // Verificar que el nombre no exista
    const existing = await c.env.DB.prepare(`
      SELECT id FROM action_lines WHERE name = ?
    `).bind(name).first();

    if (existing) {
      return c.json({ 
        success: false, 
        error: 'Ya existe una línea de acción con ese nombre' 
      }, 409);
    }

    // Insertar nueva línea de acción
    const result = await c.env.DB.prepare(`
      INSERT INTO action_lines (name, description, icon, color, display_order)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      name,
      description,
      icon || 'fas fa-cog',
      color || '#3B82F6',
      display_order || 0
    ).run();

    // Obtener la línea de acción creada
    const newActionLine = await c.env.DB.prepare(`
      SELECT id, name, description, icon, color, is_active, display_order, created_at, updated_at
      FROM action_lines 
      WHERE id = ?
    `).bind(result.meta.last_row_id).first();

    return c.json({
      success: true,
      data: newActionLine,
      message: 'Línea de acción creada exitosamente'
    });

  } catch (error) {
    console.error('Error creando línea de acción:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Actualizar línea de acción (solo ADMIN)
privateRoutes.put('/action-lines/:id', requireRole('ADMIN'), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user')!;
    const body = await c.req.json();
    
    const { name, description, icon, color, display_order, is_active } = body;
    
    // Verificar que la línea de acción existe
    const existing = await c.env.DB.prepare(`
      SELECT id FROM action_lines WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({ 
        success: false, 
        error: 'Línea de acción no encontrada' 
      }, 404);
    }

    // Verificar que el nombre no esté en uso por otra línea de acción
    if (name) {
      const nameConflict = await c.env.DB.prepare(`
        SELECT id FROM action_lines WHERE name = ? AND id != ?
      `).bind(name, id).first();

      if (nameConflict) {
        return c.json({ 
          success: false, 
          error: 'Ya existe otra línea de acción con ese nombre' 
        }, 409);
      }
    }

    // Actualizar línea de acción
    await c.env.DB.prepare(`
      UPDATE action_lines 
      SET 
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        display_order = COALESCE(?, display_order),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name,
      description, 
      icon,
      color,
      display_order,
      is_active,
      id
    ).run();

    // Obtener la línea de acción actualizada
    const updatedActionLine = await c.env.DB.prepare(`
      SELECT id, name, description, icon, color, is_active, display_order, created_at, updated_at
      FROM action_lines 
      WHERE id = ?
    `).bind(id).first();

    return c.json({
      success: true,
      data: updatedActionLine,
      message: 'Línea de acción actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando línea de acción:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

// Eliminar línea de acción (solo ADMIN)
privateRoutes.delete('/action-lines/:id', requireRole('ADMIN'), async (c) => {
  try {
    const { id } = c.req.param();
    const user = c.get('user')!;
    
    // Verificar que la línea de acción existe
    const existing = await c.env.DB.prepare(`
      SELECT id, name FROM action_lines WHERE id = ?
    `).bind(id).first();

    if (!existing) {
      return c.json({ 
        success: false, 
        error: 'Línea de acción no encontrada' 
      }, 404);
    }

    // Verificar si hay proyectos asociados
    const associatedProjects = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM projects WHERE action_line_id = ?
    `).bind(id).first();

    if (associatedProjects && associatedProjects.count > 0) {
      return c.json({ 
        success: false, 
        error: `No se puede eliminar la línea de acción. Hay ${associatedProjects.count} proyecto(s) asociado(s)` 
      }, 400);
    }

    // Eliminar línea de acción
    await c.env.DB.prepare(`
      DELETE FROM action_lines WHERE id = ?
    `).bind(id).run();

    return c.json({
      success: true,
      message: `Línea de acción "${existing.name}" eliminada exitosamente`
    });

  } catch (error) {
    console.error('Error eliminando línea de acción:', error);
    return c.json({ success: false, error: 'Error interno del servidor' }, 500);
  }
});

export { privateRoutes };