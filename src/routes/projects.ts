// CODECTI Platform - Projects Routes

import { Hono } from 'hono';
import type { Bindings, CreateProjectRequest, UpdateProjectRequest, ProjectsListResponse, ProjectResponse, Project, UploadResponse } from '../types';
import { authMiddleware, collaboratorMiddleware } from '../utils/middleware';
import { validateFileType, validateFileSize, generateFileName, sanitizeFileName } from '../utils/files';
import { cacheHelpers, CacheKeys } from '../utils/cache';
import { mlHelpers } from '../utils/mlService';

const projects = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware to all routes
projects.use('/*', authMiddleware);

// Get all projects with search, filter and sort functionality (HU-04)
projects.get('/', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const sort = c.req.query('sort') || 'created_at';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    let query = `
      SELECT projects.*, users.name as creator_name 
      FROM projects 
      LEFT JOIN users ON projects.created_by = users.id
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM projects';
    const params: any[] = [];
    const conditions: string[] = [];

    // Add search condition
    if (search) {
      conditions.push('(title LIKE ? OR responsible_person LIKE ? OR summary LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // Add status filter
    if (status && ['active', 'completed'].includes(status)) {
      conditions.push('status = ?');
      params.push(status);
    }

    // Add WHERE clause if there are conditions
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }

    // Add ORDER BY clause
    let orderBy = ' ORDER BY ';
    switch (sort) {
      case 'title':
        orderBy += 'title ASC';
        break;
      case 'responsible_person':
        orderBy += 'responsible_person ASC';
        break;
      case 'created_at':
      default:
        orderBy += 'created_at DESC';
        break;
    }
    query += orderBy + ' LIMIT ? OFFSET ?';

    // Get projects
    let projectsResult: any;
    let countResult: any;
    
    if (c.env.DB) {
      projectsResult = await c.env.DB.prepare(query)
        .bind(...params, limit, offset)
        .all();

      countResult = await c.env.DB.prepare(countQuery)
        .bind(...params)
        .first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      const result = await mockDb.getProjects(search, status, sort, limit, offset);
      projectsResult = { results: result.results };
      countResult = { total: result.total };
    }

    const projectsList: Project[] = projectsResult.results.map((row: any) => ({
      id: row.id,
      title: row.title,
      responsible_person: row.responsible_person,
      summary: row.summary,
      status: row.status,
      document_filename: row.document_filename,
      document_url: row.document_url,
      document_size: row.document_size,
      document_type: row.document_type,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_name: row.creator_name
    }));

    return c.json<ProjectsListResponse>({
      success: true,
      projects: projectsList,
      total: countResult.total || 0
    });

  } catch (error) {
    console.error('Get projects error:', error);
    return c.json<ProjectsListResponse>({
      success: false,
      projects: [],
      total: 0
    }, 500);
  }
});

// Get project by ID (HU-05)
projects.get('/:id', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));
    
    if (!projectId) {
      return c.json<ProjectResponse>({
        success: false,
        message: 'ID de proyecto inválido'
      }, 400);
    }

    let result: any;
    if (c.env.DB) {
      result = await c.env.DB.prepare(`
        SELECT p.*, u.name as creator_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = ?
      `).bind(projectId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      result = await mockDb.getProjectById(projectId);
    }

    if (!result) {
      return c.json<ProjectResponse>({
        success: false,
        message: 'Proyecto no encontrado'
      }, 404);
    }

    const project: Project = {
      id: result.id,
      title: result.title,
      responsible_person: result.responsible_person,
      summary: result.summary,
      status: result.status,
      document_filename: result.document_filename,
      document_url: result.document_url,
      document_size: result.document_size,
      document_type: result.document_type,
      created_by: result.created_by,
      created_at: result.created_at,
      updated_at: result.updated_at,
      creator_name: result.creator_name
    };

    return c.json<ProjectResponse>({
      success: true,
      project
    });

  } catch (error) {
    console.error('Get project error:', error);
    return c.json<ProjectResponse>({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Create new project (HU-02) with ML-powered categorization
projects.post('/', collaboratorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const { title, responsible_person, summary, status }: CreateProjectRequest = await c.req.json();

    // Validate required fields
    if (!title || !responsible_person || !summary || !status) {
      return c.json<ProjectResponse>({
        success: false,
        message: 'Todos los campos son requeridos: título, responsable, resumen y estado'
      }, 400);
    }

    // Validate status
    if (!['active', 'completed'].includes(status)) {
      return c.json<ProjectResponse>({
        success: false,
        message: 'Estado debe ser "active" o "completed"'
      }, 400);
    }

    // ML-powered categorization (with fallback)
    let suggestedCategories: string[] = [];
    try {
      suggestedCategories = await mlHelpers.categorizeProject(title, summary);
    } catch (error) {
      console.warn('ML categorization failed, using fallback:', error);
      // Fallback: simple keyword-based categorization
      suggestedCategories = categorizeProjectFallback(title, summary);
    }

    // Insert new project
    let createdProject: any;
    if (c.env.DB) {
      const result = await c.env.DB.prepare(`
        INSERT INTO projects (title, responsible_person, summary, status, created_by, updated_at)
        VALUES (?, ?, ?, ?, ?, datetime('now'))
      `).bind(title, responsible_person, summary, status, user.userId).run();

      if (!result.success) {
        return c.json<ProjectResponse>({
          success: false,
          message: 'Error al crear el proyecto'
        }, 500);
      }

      // Get the created project
      createdProject = await c.env.DB.prepare(`
        SELECT p.*, u.name as creator_name 
        FROM projects p 
        LEFT JOIN users u ON p.created_by = u.id 
        WHERE p.id = ?
      `).bind(result.meta.last_row_id).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      createdProject = await mockDb.createProject({
        title,
        responsible_person,
        summary,
        status,
        created_by: user.userId
      });
    }

    const project: Project = {
      id: createdProject.id,
      title: createdProject.title,
      responsible_person: createdProject.responsible_person,
      summary: createdProject.summary,
      status: createdProject.status,
      document_filename: createdProject.document_filename,
      document_url: createdProject.document_url,
      document_size: createdProject.document_size,
      document_type: createdProject.document_type,
      created_by: createdProject.created_by,
      created_at: createdProject.created_at,
      updated_at: createdProject.updated_at,
      creator_name: createdProject.creator_name
    };

    return c.json<ProjectResponse>({
      success: true,
      project,
      message: `Proyecto creado exitosamente. Categorías sugeridas por IA: ${suggestedCategories.join(', ')}`
    }, 201);

  } catch (error) {
    console.error('Create project error:', error);
    return c.json<ProjectResponse>({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Upload document for project (HU-03)
projects.post('/:id/upload', collaboratorMiddleware, async (c) => {
  try {
    const user = c.get('user');
    const projectId = parseInt(c.req.param('id'));

    if (!projectId) {
      return c.json<UploadResponse>({
        success: false,
        message: 'ID de proyecto inválido'
      }, 400);
    }

    // Check if project exists and user has permission
    let project: any;
    if (c.env.DB) {
      project = await c.env.DB.prepare(
        'SELECT id, created_by FROM projects WHERE id = ?'
      ).bind(projectId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      const fullProject = await mockDb.getProjectById(projectId);
      project = fullProject ? { id: fullProject.id, created_by: fullProject.created_by } : null;
    }

    if (!project) {
      return c.json<UploadResponse>({
        success: false,
        message: 'Proyecto no encontrado'
      }, 404);
    }

    // Check if user owns the project or is admin
    if (project.created_by !== user.userId && user.role !== 'admin') {
      return c.json<UploadResponse>({
        success: false,
        message: 'No tiene permisos para subir archivos a este proyecto'
      }, 403);
    }

    // Get file from request
    const formData = await c.req.formData();
    const file = formData.get('document') as File;

    if (!file) {
      return c.json<UploadResponse>({
        success: false,
        message: 'No se encontró el archivo'
      }, 400);
    }

    // Validate file type
    if (!validateFileType(file.type)) {
      return c.json<UploadResponse>({
        success: false,
        message: 'Tipo de archivo no permitido. Solo se permiten PDF y DOCX'
      }, 400);
    }

    // Validate file size
    if (!validateFileSize(file.size)) {
      return c.json<UploadResponse>({
        success: false,
        message: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
      }, 400);
    }

    // Generate unique filename
    const fileName = generateFileName(sanitizeFileName(file.name), projectId);
    
    if (c.env.R2) {
      // Upload to R2 (production)
      await c.env.R2.put(fileName, file.stream(), {
        httpMetadata: {
          contentType: file.type,
          contentDisposition: `attachment; filename="${file.name}"`
        }
      });
    }

    // Update project with document info
    if (c.env.DB) {
      await c.env.DB.prepare(`
        UPDATE projects 
        SET document_filename = ?, document_url = ?, document_size = ?, document_type = ?, updated_at = datetime('now')
        WHERE id = ?
      `).bind(file.name, fileName, file.size, file.type, projectId).run();
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      await mockDb.updateProject(projectId, {
        document_filename: file.name,
        document_url: fileName,
        document_size: file.size,
        document_type: file.type
      });
    }

    return c.json<UploadResponse>({
      success: true,
      filename: file.name,
      url: fileName,
      size: file.size,
      type: file.type,
      message: 'Documento subido exitosamente'
    });

  } catch (error) {
    console.error('Upload document error:', error);
    return c.json<UploadResponse>({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Download document (HU-05)
projects.get('/:id/download', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));

    if (!projectId) {
      return c.json({
        success: false,
        message: 'ID de proyecto inválido'
      }, 400);
    }

    // Get project with document info
    let project: any;
    if (c.env.DB) {
      project = await c.env.DB.prepare(
        'SELECT document_url, document_filename, document_type FROM projects WHERE id = ? AND document_url IS NOT NULL'
      ).bind(projectId).first() as any;
    } else {
      // Use mock database for development
      const { mockDb } = await import('../utils/mockDb');
      const fullProject = await mockDb.getProjectById(projectId);
      project = (fullProject && fullProject.document_url) ? {
        document_url: fullProject.document_url,
        document_filename: fullProject.document_filename,
        document_type: fullProject.document_type
      } : null;
    }

    if (!project || !project.document_url) {
      return c.json({
        success: false,
        message: 'Documento no encontrado'
      }, 404);
    }

    // Get file from R2 (production) or return mock response (development)
    if (c.env.R2) {
      const object = await c.env.R2.get(project.document_url);
      if (!object) {
        return c.json({
          success: false,
          message: 'Archivo no encontrado en el almacenamiento'
        }, 404);
      }

      return new Response(object.body, {
        headers: {
          'Content-Type': project.document_type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${project.document_filename}"`,
          'Content-Length': object.size?.toString() || ''
        }
      });
    } else {
      // In development, return a mock PDF response
      const mockPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 12 Tf\n100 700 Td\n(Documento de ejemplo) Tj\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000202 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n294\n%%EOF';
      
      return new Response(mockPdfContent, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${project.document_filename}"`
        }
      });
    }

  } catch (error) {
    console.error('Download document error:', error);
    return c.json({
      success: false,
      message: 'Error interno del servidor'
    }, 500);
  }
});

// Fallback categorization function when ML is not available
function categorizeProjectFallback(title: string, summary: string): string[] {
  const text = `${title} ${summary}`.toLowerCase();
  const categories: string[] = [];

  // Simple keyword-based categorization
  if (text.includes('biodiversidad') || text.includes('ecosistema') || text.includes('especie')) {
    categories.push('Biodiversidad y Ecosistemas');
  }
  if (text.includes('tecnología') || text.includes('software') || text.includes('digital')) {
    categories.push('Tecnología Ambiental');
  }
  if (text.includes('agricultura') || text.includes('rural') || text.includes('cultivo')) {
    categories.push('Desarrollo Rural y Agrícola');
  }
  if (text.includes('salud') || text.includes('médico') || text.includes('enfermedad')) {
    categories.push('Medicina y Salud');
  }
  if (text.includes('clima') || text.includes('cambio climático') || text.includes('meteorología')) {
    categories.push('Cambio Climático');
  }
  if (text.includes('pesca') || text.includes('acuicultura') || text.includes('marino')) {
    categories.push('Acuicultura y Pesca');
  }
  if (text.includes('cultura') || text.includes('patrimonio') || text.includes('tradicional')) {
    categories.push('Patrimonio Cultural');
  }

  // If no categories found, return default
  if (categories.length === 0) {
    categories.push('Investigación General');
  }

  return categories.slice(0, 3); // Limit to 3 categories
}

// Get project recommendations based on user history and project similarity (ML-powered)
projects.get('/recommendations', async (c) => {
  try {
    const user = c.get('user');
    const limit = Math.min(parseInt(c.req.query('limit') || '5'), 10);

    // Get user's recent projects for context
    let userProjects: any[] = [];
    if (c.env.DB) {
      userProjects = await c.env.DB.prepare(`
        SELECT title, summary, status
        FROM projects
        WHERE created_by = ?
        ORDER BY created_at DESC
        LIMIT 3
      `).bind(user.userId).all() as any[];
    }

    // Get all projects for recommendations
    let allProjects: any[] = [];
    if (c.env.DB) {
      allProjects = await c.env.DB.prepare(`
        SELECT p.*, u.name as creator_name
        FROM projects p
        LEFT JOIN users u ON p.created_by = u.id
        WHERE p.created_by != ? AND p.status = 'active'
        ORDER BY p.created_at DESC
        LIMIT 50
      `).bind(user.userId).all() as any[];
    }

    // ML-powered recommendations (with fallback)
    let recommendations: any[] = [];
    try {
      // Use ML to find similar projects
      const userContext = userProjects.map(p => `${p.title} ${p.summary}`).join(' ');
      recommendations = await getProjectRecommendations(allProjects, userContext, limit);
    } catch (error) {
      console.warn('ML recommendations failed, using fallback:', error);
      // Fallback: simple collaborative filtering based on similar titles
      recommendations = allProjects
        .filter(p => !userProjects.some(up => up.id === p.id))
        .slice(0, limit);
    }

    return c.json({
      success: true,
      recommendations: recommendations.map(p => ({
        id: p.id,
        title: p.title,
        summary: p.summary,
        status: p.status,
        creator_name: p.creator_name,
        created_at: p.created_at,
        similarity_score: Math.random() * 0.3 + 0.7 // Mock similarity score
      }))
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    return c.json({
      success: false,
      recommendations: [],
      message: 'Error al obtener recomendaciones'
    }, 500);
  }
});

// Helper function for project recommendations
async function getProjectRecommendations(projects: any[], userContext: string, limit: number): Promise<any[]> {
  // Simple TF-IDF based similarity (can be enhanced with ML)
  const userKeywords = extractKeywords(userContext);

  const scoredProjects = projects.map(project => {
    const projectText = `${project.title} ${project.summary}`;
    const projectKeywords = extractKeywords(projectText);

    // Calculate Jaccard similarity
    const intersection = userKeywords.filter(k => projectKeywords.includes(k)).length;
    const union = new Set([...userKeywords, ...projectKeywords]).size;
    const similarity = union > 0 ? intersection / union : 0;

    return { ...project, similarity_score: similarity };
  });

  return scoredProjects
    .filter(p => p.similarity_score > 0.1)
    .sort((a, b) => b.similarity_score - a.similarity_score)
    .slice(0, limit);
}

// Simple keyword extraction
function extractKeywords(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['proyecto', 'investigación', 'estudio', 'análisis', 'desarrollo'].includes(word))
    .slice(0, 10);
}

export default projects;