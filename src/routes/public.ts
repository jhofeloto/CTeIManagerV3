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

    // Obtener productos públicos del proyecto
    const products = await c.env.DB.prepare(`
      SELECT id, project_id, product_code, product_type, description, 
             is_public, created_at, updated_at
      FROM products 
      WHERE project_id = ? AND is_public = 1
      ORDER BY created_at DESC
    `).bind(projectId).all();

    // Obtener colaboradores del proyecto
    const collaborators = await c.env.DB.prepare(`
      SELECT u.id, u.full_name, u.email, u.role
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
        p.title as project_title, p.abstract as project_abstract
      FROM products pr 
      JOIN projects p ON pr.project_id = p.id 
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

    // Productos por tipo
    const productsByType = await c.env.DB.prepare(`
      SELECT product_type, COUNT(*) as count 
      FROM products 
      WHERE is_public = 1 
      GROUP BY product_type
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
        productsByType: Object.fromEntries(
          productsByType.results.map((item: any) => [item.product_type, item.count])
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

export { publicRoutes };