import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { mockDb } from '../utils/mockDb'
import { logger } from '../monitoring/logger'

const resources = new Hono()

// JWT middleware for authentication
resources.use('/*', jwt({
  secret: 'your-secret-key',
  cookie: 'auth-token'
}))

// GET /api/admin/resources - Get all resources with admin features
resources.get('/', async (c) => {
  try {
    const { 
      search = '', 
      type = '', 
      category = '', 
      status = '',
      author = '',
      sort = 'created_at', 
      order = 'desc',
      limit = '10', 
      offset = '0' 
    } = c.req.query()

    const result = await mockDb.getResources(
      search,
      type,
      category,
      status,
      author,
      sort,
      order,
      parseInt(limit),
      parseInt(offset)
    )

    logger.info(
      `Admin resources list retrieved`,
      { 
        search, 
        type,
        category, 
        status,
        author,
        total: result.total,
        returned: result.resources.length,
        userId: c.get('jwtPayload')?.userId
      },
      'RESOURCES'
    )

    return c.json({
      success: true,
      data: result,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit))
      }
    })
  } catch (error) {
    logger.error(
      `Error retrieving admin resources`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resources'
    }, 500)
  }
})

// GET /api/admin/resources/stats - Get resources statistics
resources.get('/stats', async (c) => {
  try {
    const stats = await mockDb.getResourcesStats()

    logger.info(
      `Resources stats retrieved`,
      { userId: c.get('jwtPayload')?.userId },
      'RESOURCES'
    )

    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error(
      `Error retrieving resources stats`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resources statistics'
    }, 500)
  }
})

// GET /api/admin/resources/categories - Get resource categories
resources.get('/categories', async (c) => {
  try {
    const categories = await mockDb.getResourceCategories()

    return c.json({
      success: true,
      data: categories
    })
  } catch (error) {
    logger.error(
      `Error retrieving resource categories`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resource categories'
    }, 500)
  }
})

// GET /api/admin/resources/:id - Get resource by ID
resources.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    const resource = await mockDb.getResourceById(id)
    
    if (!resource) {
      return c.json({
        success: false,
        error: 'Resource not found'
      }, 404)
    }

    logger.info(
      `Resource retrieved by ID`,
      { 
        resourceId: id, 
        resourceTitle: resource.title,
        userId: c.get('jwtPayload')?.userId
      },
      'RESOURCES'
    )

    return c.json({
      success: true,
      data: resource
    })
  } catch (error) {
    logger.error(
      `Error retrieving resource`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resource'
    }, 500)
  }
})

// POST /api/admin/resources - Create new resource
resources.post('/', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const data = await c.req.json()

    // Validation
    const requiredFields = [
      'title', 'description', 'summary', 'type', 'category_id',
      'author', 'author_institution', 'language', 'publication_date'
    ]
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return c.json({
          success: false,
          error: `Field '${field}' is required`
        }, 400)
      }
    }

    // Convert and validate data
    const resourceData = {
      ...data,
      created_by: payload.userId,
      creator_name: payload.name || 'Admin',
      is_featured: Boolean(data.is_featured),
      is_public: Boolean(data.is_public),
      category_id: parseInt(data.category_id),
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      status: data.status || 'draft'
    }

    const resource = await mockDb.createResource(resourceData)

    logger.info(
      `New resource created`,
      { 
        resourceId: resource.id, 
        resourceTitle: resource.title,
        type: resource.type,
        category: resource.category_name,
        status: resource.status,
        userId: payload.userId
      },
      'RESOURCES'
    )

    return c.json({
      success: true,
      data: resource,
      message: 'Resource created successfully'
    }, 201)
  } catch (error) {
    logger.error(
      `Error creating resource`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error creating resource'
    }, 500)
  }
})

// PUT /api/admin/resources/:id - Update resource
resources.put('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const id = parseInt(c.req.param('id'))
    const data = await c.req.json()

    // Validation
    const requiredFields = [
      'title', 'description', 'summary', 'type', 'category_id',
      'author', 'author_institution', 'language', 'publication_date'
    ]
    
    for (const field of requiredFields) {
      if (!data[field]) {
        return c.json({
          success: false,
          error: `Field '${field}' is required`
        }, 400)
      }
    }

    // Convert and validate data
    const resourceData = {
      ...data,
      is_featured: Boolean(data.is_featured),
      is_public: Boolean(data.is_public),
      category_id: parseInt(data.category_id),
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      tags: Array.isArray(data.tags) ? data.tags : []
    }

    const resource = await mockDb.updateResource(id, resourceData)
    
    if (!resource) {
      return c.json({
        success: false,
        error: 'Resource not found'
      }, 404)
    }

    logger.info(
      `Resource updated`,
      { 
        resourceId: id, 
        resourceTitle: resource.title,
        type: resource.type,
        status: resource.status,
        userId: payload.userId
      },
      'RESOURCES'
    )

    return c.json({
      success: true,
      data: resource,
      message: 'Resource updated successfully'
    })
  } catch (error) {
    logger.error(
      `Error updating resource`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error updating resource'
    }, 500)
  }
})

// DELETE /api/admin/resources/:id - Delete resource
resources.delete('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const id = parseInt(c.req.param('id'))

    const success = await mockDb.deleteResource(id)
    
    if (!success) {
      return c.json({
        success: false,
        error: 'Resource not found'
      }, 404)
    }

    logger.warn(
      `Resource deleted`,
      { 
        resourceId: id,
        userId: payload.userId
      },
      'RESOURCES'
    )

    return c.json({
      success: true,
      message: 'Resource deleted successfully'
    })
  } catch (error) {
    logger.error(
      `Error deleting resource`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error deleting resource'
    }, 500)
  }
})

export default resources