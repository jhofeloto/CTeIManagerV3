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

export { privateRoutes };