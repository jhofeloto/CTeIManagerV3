import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { mockDb } from '../utils/mockDb'
import { logger } from '../monitoring/logger'

const publicResources = new Hono()

// Enable CORS for frontend-backend communication
publicResources.use('/*', cors())

// GET /api/public/resources - Get all published resources (public)
publicResources.get('/', async (c) => {
  try {
    const { 
      search = '', 
      type = '', 
      category = '', 
      author = '',
      sort = 'publication_date', 
      order = 'desc',
      limit = '12', 
      offset = '0' 
    } = c.req.query()

    const result = await mockDb.getPublicResources(
      search,
      type,
      category,
      author,
      sort,
      order,
      parseInt(limit),
      parseInt(offset)
    )

    logger.info(
      `Public resources list retrieved`,
      { 
        search, 
        type,
        category,
        author,
        total: result.total,
        returned: result.resources.length 
      },
      'PUBLIC_RESOURCES'
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
      `Error retrieving public resources`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resources'
    }, 500)
  }
})

// GET /api/public/resources/featured - Get featured resources
publicResources.get('/featured', async (c) => {
  try {
    const { limit = '3' } = c.req.query()
    const resources = await mockDb.getFeaturedResources(parseInt(limit))

    logger.info(
      `Featured resources retrieved`,
      { limit: parseInt(limit), returned: resources.length },
      'PUBLIC_RESOURCES'
    )

    return c.json({
      success: true,
      data: resources
    })
  } catch (error) {
    logger.error(
      `Error retrieving featured resources`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving featured resources'
    }, 500)
  }
})

// GET /api/public/resources/categories - Get resource categories (public)
publicResources.get('/categories', async (c) => {
  try {
    const categories = await mockDb.getResourceCategories()

    return c.json({
      success: true,
      data: categories
    })
  } catch (error) {
    logger.error(
      `Error retrieving resource categories`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resource categories'
    }, 500)
  }
})

// GET /api/public/resources/categories/:slug - Get resources by category
publicResources.get('/categories/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const { limit = '5' } = c.req.query()
    
    const resources = await mockDb.getResourcesByCategory(slug, parseInt(limit))

    logger.info(
      `Resources by category retrieved`,
      { categorySlug: slug, limit: parseInt(limit), returned: resources.length },
      'PUBLIC_RESOURCES'
    )

    return c.json({
      success: true,
      data: resources
    })
  } catch (error) {
    logger.error(
      `Error retrieving resources by category`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resources by category'
    }, 500)
  }
})

// GET /api/public/resources/stats - Get public resources statistics
publicResources.get('/stats', async (c) => {
  try {
    const stats = await mockDb.getResourcesStats()

    logger.info(
      `Public resources stats retrieved`,
      {},
      'PUBLIC_RESOURCES'
    )

    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error(
      `Error retrieving public resources stats`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resources statistics'
    }, 500)
  }
})

// GET /api/public/resources/:slug - Get resource by slug (public)
publicResources.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const resource = await mockDb.getPublicResourceBySlug(slug)
    
    if (!resource) {
      return c.json({
        success: false,
        error: 'Resource not found'
      }, 404)
    }

    logger.info(
      `Public resource retrieved by slug`,
      { slug, resourceId: resource.id, resourceTitle: resource.title },
      'PUBLIC_RESOURCES'
    )

    return c.json({
      success: true,
      data: resource
    })
  } catch (error) {
    logger.error(
      `Error retrieving public resource by slug`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving resource'
    }, 500)
  }
})

// POST /api/public/resources/:slug/download - Download resource (track download count)
publicResources.post('/:slug/download', async (c) => {
  try {
    const slug = c.req.param('slug')
    
    const success = await mockDb.downloadResource(slug)
    
    if (!success) {
      return c.json({
        success: false,
        error: 'Resource not found or not available for download'
      }, 404)
    }

    logger.info(
      `Resource download tracked`,
      { slug },
      'PUBLIC_RESOURCES'
    )

    return c.json({
      success: true,
      message: 'Download tracked successfully'
    })
  } catch (error) {
    logger.error(
      `Error tracking resource download`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_RESOURCES'
    )
    
    return c.json({
      success: false,
      error: 'Error tracking download'
    }, 500)
  }
})

export default publicResources