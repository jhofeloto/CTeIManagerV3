// CODECTI Platform - Public Routes (No Authentication Required)
// HU-08: Portal Público de Proyectos

import { Hono } from 'hono';
import type { Bindings, Project, ProjectsListResponse } from '../types';
import { logger } from '../monitoring/logger';

const publicRoutes = new Hono<{ Bindings: Bindings }>();

// GET /api/public/projects - Lista pública de proyectos (sin autenticación)
publicRoutes.get('/projects', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const area = c.req.query('area') || '';
    const institution = c.req.query('institution') || '';
    const sort = c.req.query('sort') || 'created_at';
    const order = c.req.query('order') || 'desc';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '12');
    const offset = (page - 1) * limit;

    // Log public access
    logger.info('PUBLIC_API_ACCESS', {
      endpoint: '/api/public/projects',
      params: { search, status, area, institution, sort, order, page, limit },
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || 'unknown'
    });

    // Build public query - only show approved/active projects
    let query = `
      SELECT 
        p.id,
        p.title,
        p.summary,
        p.description,
        p.objectives,
        p.status,
        p.start_date,
        p.end_date,
        p.budget,
        p.institution,
        p.research_area,
        p.keywords,
        p.created_at,
        p.updated_at,
        u.name as responsible_name
      FROM projects p
      LEFT JOIN users u ON p.responsible = u.email
      WHERE p.status != 'draft'
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM projects p 
      WHERE p.status != 'draft'
    `;
    
    const params: any[] = [];
    const conditions: string[] = [];

    // Search functionality
    if (search) {
      conditions.push(`(
        p.title LIKE ? OR 
        p.summary LIKE ? OR 
        p.keywords LIKE ? OR 
        p.research_area LIKE ? OR
        p.institution LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    // Status filter
    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    // Research area filter
    if (area) {
      conditions.push('p.research_area LIKE ?');
      params.push(`%${area}%`);
    }

    // Institution filter
    if (institution) {
      conditions.push('p.institution LIKE ?');
      params.push(`%${institution}%`);
    }

    // Add conditions to queries
    if (conditions.length > 0) {
      const whereClause = ` AND ${conditions.join(' AND ')}`;
      query += whereClause;
      countQuery += whereClause;
    }

    // Sorting
    const validSorts = ['created_at', 'title', 'start_date', 'end_date', 'status'];
    const validOrders = ['asc', 'desc'];
    
    if (validSorts.includes(sort)) {
      const sortOrder = validOrders.includes(order) ? order : 'desc';
      query += ` ORDER BY p.${sort} ${sortOrder.toUpperCase()}`;
    }

    // Pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    let result: any;
    let total = 0;

    // Execute queries based on environment
    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const [projectsResult, countResult] = await Promise.all([
        c.env.DB.prepare(query).bind(...params).all(),
        c.env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()
      ]);
      
      result = {
        projects: projectsResult.results || [],
        total: (countResult as any)?.total || 0
      };
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      result = await mockDb.getPublicProjects(search, status, area, institution, sort, order, limit, offset);
    }

    const projects = result.projects.map((project: any) => ({
      id: project.id,
      title: project.title,
      summary: project.summary,
      description: project.description,
      objectives: project.objectives,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      budget: project.budget,
      institution: project.institution,
      researchArea: project.research_area,
      keywords: project.keywords ? project.keywords.split(',').map((k: string) => k.trim()) : [],
      responsibleName: project.responsible_name,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      // Public projects don't include sensitive info like documents
      documentsCount: 0, // We'll count if needed
      isPublic: true
    }));

    const totalPages = Math.ceil(result.total / limit);

    logger.info('PUBLIC_PROJECTS_SERVED', {
      count: projects.length,
      total: result.total,
      page,
      search: search || 'none',
      filters: { status, area, institution }
    });

    return c.json<ProjectsListResponse>({
      success: true,
      projects,
      total: result.total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    });

  } catch (error) {
    console.error('Error loading public projects:', error);
    
    logger.error('PUBLIC_PROJECTS_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return c.json({
      success: false,
      message: 'Error al cargar proyectos públicos',
      projects: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }, 500);
  }
});

// GET /api/public/projects/:id - Detalle público de proyecto específico
publicRoutes.get('/projects/:id', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));
    
    if (!projectId || isNaN(projectId)) {
      return c.json({
        success: false,
        message: 'ID de proyecto inválido'
      }, 400);
    }

    logger.info('PUBLIC_PROJECT_DETAIL_ACCESS', {
      projectId,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || 'unknown'
    });

    // Query for public project details (no auth required, but exclude sensitive data)
    let project: any = null;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare(`
        SELECT 
          p.*,
          u.name as responsible_name,
          u.institution as responsible_institution
        FROM projects p
        LEFT JOIN users u ON p.responsible = u.email
        WHERE p.id = ? AND p.status != 'draft'
      `).bind(projectId).first();
      
      project = result;
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      project = await mockDb.getPublicProjectById(projectId);
    }

    if (!project) {
      logger.warn('PUBLIC_PROJECT_NOT_FOUND', { projectId });
      
      return c.json({
        success: false,
        message: 'Proyecto no encontrado o no disponible públicamente'
      }, 404);
    }

    // Format project for public consumption (remove sensitive data)
    const publicProject = {
      id: project.id,
      title: project.title,
      summary: project.summary,
      description: project.description,
      objectives: project.objectives,
      methodology: project.methodology,
      expectedResults: project.expected_results,
      status: project.status,
      startDate: project.start_date,
      endDate: project.end_date,
      budget: project.budget,
      institution: project.institution,
      researchArea: project.research_area,
      keywords: project.keywords ? project.keywords.split(',').map((k: string) => k.trim()) : [],
      responsibleName: project.responsible_name,
      responsibleInstitution: project.responsible_institution,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      // Public view - no document access, no email, no sensitive data
      isPublic: true,
      hasDocuments: !!project.document_url
    };

    logger.info('PUBLIC_PROJECT_DETAIL_SERVED', {
      projectId: project.id,
      title: project.title
    });

    return c.json({
      success: true,
      project: publicProject
    });

  } catch (error) {
    console.error('Error loading public project details:', error);
    
    logger.error('PUBLIC_PROJECT_DETAIL_ERROR', {
      projectId: c.req.param('id'),
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return c.json({
      success: false,
      message: 'Error al cargar los detalles del proyecto'
    }, 500);
  }
});

// GET /api/public/stats - Estadísticas públicas del ecosistema CTeI
publicRoutes.get('/stats', async (c) => {
  try {
    logger.info('PUBLIC_STATS_ACCESS', {
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || 'unknown'
    });

    let stats: any = {};

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const queries = await Promise.all([
        // Total projects (public)
        c.env.DB.prepare("SELECT COUNT(*) as count FROM projects WHERE status != 'draft'").first(),
        // Active projects
        c.env.DB.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'active'").first(),
        // Completed projects
        c.env.DB.prepare("SELECT COUNT(*) as count FROM projects WHERE status = 'completed'").first(),
        // Research areas
        c.env.DB.prepare(`
          SELECT research_area, COUNT(*) as count 
          FROM projects 
          WHERE status != 'draft' AND research_area IS NOT NULL
          GROUP BY research_area 
          ORDER BY count DESC 
          LIMIT 10
        `).all(),
        // Institutions
        c.env.DB.prepare(`
          SELECT institution, COUNT(*) as count 
          FROM projects 
          WHERE status != 'draft' AND institution IS NOT NULL
          GROUP BY institution 
          ORDER BY count DESC 
          LIMIT 10
        `).all(),
        // Total researchers (public profiles only)
        c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE is_active = 1").first(),
        // Budget total (for public projects)
        c.env.DB.prepare("SELECT SUM(budget) as total FROM projects WHERE status != 'draft' AND budget > 0").first()
      ]);

      stats = {
        totalProjects: (queries[0] as any)?.count || 0,
        activeProjects: (queries[1] as any)?.count || 0,
        completedProjects: (queries[2] as any)?.count || 0,
        researchAreas: queries[3].results || [],
        topInstitutions: queries[4].results || [],
        totalResearchers: (queries[5] as any)?.count || 0,
        totalBudget: (queries[6] as any)?.total || 0
      };
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      stats = await mockDb.getPublicStats();
    }

    logger.info('PUBLIC_STATS_SERVED', {
      totalProjects: stats.totalProjects,
      activeProjects: stats.activeProjects
    });

    return c.json({
      success: true,
      stats: {
        overview: {
          totalProjects: stats.totalProjects,
          activeProjects: stats.activeProjects,
          completedProjects: stats.completedProjects,
          totalResearchers: stats.totalResearchers,
          totalBudget: stats.totalBudget
        },
        breakdown: {
          byResearchArea: stats.researchAreas,
          byInstitution: stats.topInstitutions
        },
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error loading public stats:', error);
    
    logger.error('PUBLIC_STATS_ERROR', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    return c.json({
      success: false,
      message: 'Error al cargar estadísticas públicas'
    }, 500);
  }
});

export default publicRoutes;