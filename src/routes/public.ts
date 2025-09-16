// Rutas públicas (sin autenticación)
import { Hono } from 'hono';
import { Bindings, APIResponse, Project, Product } from '../types/index';

const publicRoutes = new Hono<{ Bindings: Bindings }>();

// Obtener todos los proyectos públicos
publicRoutes.get('/projects', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.introduction, 
        p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
        p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
        p.budget, p.project_code,
        u.full_name as owner_name, u.email as owner_email
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.is_public = 1
    `;
    
    const params: any[] = [];
    
    if (search) {
      query += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR p.keywords LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const projects = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM projects WHERE is_public = 1`;
    const countParams: any[] = [];
    
    if (search) {
      countQuery += ` AND (title LIKE ? OR abstract LIKE ? OR keywords LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }
    
    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const total = totalResult?.total || 0;

    return c.json<APIResponse<{ projects: any[]; pagination: any }>>({
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
    console.error('Error obteniendo proyectos públicos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener un proyecto público específico
publicRoutes.get('/projects/:id', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));

    const project = await c.env.DB.prepare(`
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.introduction, 
        p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
        p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
        p.budget, p.project_code,
        u.full_name as owner_name, u.email as owner_email
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.id = ? AND p.is_public = 1
    `).bind(projectId).first();

    if (!project) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Proyecto no encontrado o no es público' 
      }, 404);
    }

    // Obtener productos públicos del proyecto con información de categoría
    const products = await c.env.DB.prepare(`
      SELECT 
        pr.id, pr.project_id, pr.product_code, pr.product_type, pr.description, 
        pr.is_public, pr.created_at, pr.updated_at, pr.doi, pr.url, 
        pr.publication_date, pr.journal, pr.impact_factor, pr.citation_count, 
        pr.file_url,
        pc.name as category_name, pc.category_group, pc.impact_weight
      FROM products pr 
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      WHERE pr.project_id = ? AND pr.is_public = 1
      ORDER BY pr.created_at DESC
    `).bind(projectId).all();

    // Obtener colaboradores del proyecto con roles detallados
    const collaborators = await c.env.DB.prepare(`
      SELECT 
        u.id, u.full_name, u.email, u.role,
        pc.collaboration_role, pc.role_description
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
      ORDER BY u.full_name
    `).bind(projectId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        ...project,
        products: products.results,
        collaborators: collaborators.results
      }
    });

  } catch (error) {
    console.error('Error obteniendo proyecto público:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener todos los productos públicos
publicRoutes.get('/products', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const type = c.req.query('type') || '';
    const search = c.req.query('search') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        pr.id, pr.project_id, pr.product_code, pr.product_type, 
        pr.description, pr.is_public, pr.created_at, pr.updated_at,
        pr.doi, pr.url, pr.publication_date, pr.journal, pr.impact_factor, 
        pr.citation_count, pr.file_url,
        p.title as project_title, p.abstract as project_abstract,
        pc.name as category_name, pc.category_group, pc.impact_weight
      FROM products pr 
      JOIN projects p ON pr.project_id = p.id 
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      WHERE pr.is_public = 1
    `;
    
    const params: any[] = [];
    
    if (type) {
      query += ` AND pr.product_type = ?`;
      params.push(type);
    }
    
    if (search) {
      query += ` AND (pr.product_code LIKE ? OR pr.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    query += ` ORDER BY pr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const products = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total para paginación
    let countQuery = `SELECT COUNT(*) as total FROM products pr JOIN projects p ON pr.project_id = p.id WHERE pr.is_public = 1`;
    const countParams: any[] = [];
    
    if (type) {
      countQuery += ` AND pr.product_type = ?`;
      countParams.push(type);
    }
    
    if (search) {
      countQuery += ` AND (pr.product_code LIKE ? OR pr.description LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm);
    }
    
    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const total = totalResult?.total || 0;

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
    console.error('Error obteniendo productos públicos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener un producto público específico con detalles completos
publicRoutes.get('/products/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));

    // Obtener información detallada del producto
    const product = await c.env.DB.prepare(`
      SELECT 
        pr.id, pr.project_id, pr.product_code, pr.product_type, 
        pr.description, pr.is_public, pr.created_at, pr.updated_at,
        pr.doi, pr.url, pr.publication_date, pr.journal, pr.impact_factor, 
        pr.citation_count, pr.file_url, pr.creator_id, pr.last_editor_id, pr.published_by,
        p.title as project_title, p.abstract as project_abstract, p.owner_id as project_owner_id,
        pc.name as category_name, pc.description as category_description, 
        pc.category_group, pc.impact_weight,
        creator.full_name as creator_name, creator.email as creator_email,
        editor.full_name as last_editor_name, editor.email as last_editor_email,
        publisher.full_name as published_by_name, publisher.email as published_by_email
      FROM products pr 
      JOIN projects p ON pr.project_id = p.id 
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      LEFT JOIN users creator ON pr.creator_id = creator.id
      LEFT JOIN users editor ON pr.last_editor_id = editor.id
      LEFT JOIN users publisher ON pr.published_by = publisher.id
      WHERE pr.id = ? AND pr.is_public = 1
    `).bind(productId).first();

    if (!product) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Producto no encontrado o no es público' 
      }, 404);
    }

    // Obtener autores del producto con sus roles
    const authors = await c.env.DB.prepare(`
      SELECT 
        pa.author_role, pa.contribution_type, pa.author_order,
        u.id as user_id, u.full_name, u.email, u.role as user_role
      FROM product_authors pa
      JOIN users u ON pa.user_id = u.id
      WHERE pa.product_id = ?
      ORDER BY pa.author_order ASC, pa.author_role ASC
    `).bind(productId).all();

    // Obtener información del proyecto asociado si es público
    const projectInfo = await c.env.DB.prepare(`
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.owner_id, p.status, p.institution,
        u.full_name as owner_name, u.email as owner_email
      FROM projects p
      LEFT JOIN users u ON p.owner_id = u.id
      WHERE p.id = ? AND p.is_public = 1
    `).bind(product.project_id).first();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        ...product,
        authors: authors.results,
        project: projectInfo || null
      }
    });

  } catch (error) {
    console.error('Error obteniendo producto público:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener categorías de productos
publicRoutes.get('/product-categories', async (c) => {
  try {
    const categories = await c.env.DB.prepare(`
      SELECT code, name, description, category_group, impact_weight
      FROM product_categories 
      ORDER BY category_group, impact_weight DESC
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

// Obtener instituciones
publicRoutes.get('/institutions', async (c) => {
  try {
    const institutions = await c.env.DB.prepare(`
      SELECT id, name, short_name, type, country, city, website
      FROM institutions 
      ORDER BY name
    `).all();

    return c.json<APIResponse<{ institutions: any[] }>>({
      success: true,
      data: { institutions: institutions.results }
    });

  } catch (error) {
    console.error('Error obteniendo instituciones:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener estadísticas públicas
publicRoutes.get('/stats', async (c) => {
  try {
    // Contar proyectos públicos
    const projectsCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM projects WHERE is_public = 1'
    ).first<{ count: number }>();

    // Contar productos públicos
    const productsCount = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM products WHERE is_public = 1'
    ).first<{ count: number }>();

    // Productos por categoría con nombres descriptivos
    const productsByCategory = await c.env.DB.prepare(`
      SELECT 
        pr.product_type, 
        pc.name as category_name, 
        pc.category_group,
        COUNT(*) as count 
      FROM products pr
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      WHERE pr.is_public = 1 
      GROUP BY pr.product_type, pc.name, pc.category_group
      ORDER BY count DESC
    `).all();

    // Proyectos por estado
    const projectsByStatus = await c.env.DB.prepare(`
      SELECT status, COUNT(*) as count 
      FROM projects 
      WHERE is_public = 1 
      GROUP BY status
    `).all();

    // Investigadores activos (con proyectos públicos)
    const activeInvestigators = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT owner_id) as count 
      FROM projects 
      WHERE is_public = 1
    `).first<{ count: number }>();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        totalProjects: projectsCount?.count || 0,
        totalProducts: productsCount?.count || 0,
        activeInvestigators: activeInvestigators?.count || 0,
        productsByCategory: productsByCategory.results.map((item: any) => ({
          code: item.product_type,
          name: item.category_name || item.product_type,
          group: item.category_group,
          count: item.count
        })),
        projectsByStatus: Object.fromEntries(
          projectsByStatus.results.map((item: any) => [item.status, item.count])
        )
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas públicas:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// Obtener configuración pública del sitio (logo, etc.)
publicRoutes.get('/site-config', async (c) => {
  try {
    // Obtener configuración del sitio desde KV storage
    const config = await c.env.KV?.get('site-config', 'json') || {};
    
    return c.json<APIResponse<any>>({
      success: true,
      data: {
        logo_url: config.logo_url || null,
        logo_filename: config.logo_filename || null,
        site_name: config.site_name || 'CODECTI CHOCÓ'
      }
    });

  } catch (error) {
    console.error('Error obteniendo configuración pública del sitio:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// ===== RUTA DE PRUEBA TEMPORAL PARA TESTING =====
publicRoutes.get('/test-generate-token', async (c) => {
  try {
    // Generar token para usuario investigador (ID 2) para testing
    const testUser = {
      userId: 2,
      email: "investigador@demo.com",
      role: "INVESTIGATOR"
    };
    
    const { generateJWT } = await import('../utils/jwt');
    const token = await generateJWT(testUser);
    
    return c.json({
      success: true,
      data: { 
        token,
        user: testUser,
        message: 'Token de prueba generado para Dr. Investigador Demo'
      }
    });
    
  } catch (error) {
    console.error('Error generando token de prueba:', error);
    return c.json({ 
      success: false, 
      error: 'Error generando token de prueba' 
    }, 500);
  }
});

export { publicRoutes };