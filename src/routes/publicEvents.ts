import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt } from 'hono/jwt'
import { mockDb } from '../utils/mockDb'
import { logger } from '../monitoring/logger'

const publicEvents = new Hono()

// Enable CORS for frontend-backend communication
publicEvents.use('/*', cors())

// GET /api/events - Get all published events (public)
publicEvents.get('/', async (c) => {
  try {
    const { 
      search = '', 
      category = '', 
      type = '',
      location = '',
      upcoming = '',
      featured = '',
      sort = 'start_date', 
      order = 'asc',
      limit = '12', 
      offset = '0' 
    } = c.req.query()

    const result = await mockDb.getPublicEvents(
      search,
      category,
      type,
      location,
      upcoming === 'true',
      featured === 'true',
      sort,
      order,
      parseInt(limit),
      parseInt(offset)
    )

    logger.info(
      `Public events list retrieved`,
      { 
        search, 
        category, 
        type,
        location,
        upcoming: upcoming === 'true',
        featured: featured === 'true',
        total: result.total,
        returned: result.events.length 
      },
      'PUBLIC_EVENTS'
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
      `Error retrieving public events`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving events'
    }, 500)
  }
})

// GET /api/events/featured - Get featured events
publicEvents.get('/featured', async (c) => {
  try {
    const { limit = '3' } = c.req.query()
    const events = await mockDb.getFeaturedEvents(parseInt(limit))

    logger.info(
      `Featured events retrieved`,
      { limit: parseInt(limit), returned: events.length },
      'PUBLIC_EVENTS'
    )

    return c.json({
      success: true,
      data: events
    })
  } catch (error) {
    logger.error(
      `Error retrieving featured events`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving featured events'
    }, 500)
  }
})

// GET /api/events/upcoming - Get upcoming events
publicEvents.get('/upcoming', async (c) => {
  try {
    const { limit = '5' } = c.req.query()
    const events = await mockDb.getUpcomingEvents(parseInt(limit))

    logger.info(
      `Upcoming events retrieved`,
      { limit: parseInt(limit), returned: events.length },
      'PUBLIC_EVENTS'
    )

    return c.json({
      success: true,
      data: events
    })
  } catch (error) {
    logger.error(
      `Error retrieving upcoming events`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving upcoming events'
    }, 500)
  }
})

// GET /api/events/categories - Get event categories (public)
publicEvents.get('/categories', async (c) => {
  try {
    const categories = await mockDb.getEventCategories()

    return c.json({
      success: true,
      data: categories
    })
  } catch (error) {
    logger.error(
      `Error retrieving event categories`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving event categories'
    }, 500)
  }
})

// GET /api/events/categories/:slug - Get events by category
publicEvents.get('/categories/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const { limit = '5' } = c.req.query()
    
    const events = await mockDb.getEventsByCategory(slug, parseInt(limit))

    logger.info(
      `Events by category retrieved`,
      { categorySlug: slug, limit: parseInt(limit), returned: events.length },
      'PUBLIC_EVENTS'
    )

    return c.json({
      success: true,
      data: events
    })
  } catch (error) {
    logger.error(
      `Error retrieving events by category`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving events by category'
    }, 500)
  }
})

// GET /api/events/stats - Get public events statistics
publicEvents.get('/stats', async (c) => {
  try {
    const stats = await mockDb.getEventsStats()

    logger.info(
      `Public events stats retrieved`,
      {},
      'PUBLIC_EVENTS'
    )

    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    logger.error(
      `Error retrieving public events stats`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving events statistics'
    }, 500)
  }
})

// GET /api/events/:slug - Get event by slug (public)
publicEvents.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug')
    const event = await mockDb.getPublicEventBySlug(slug)
    
    if (!event) {
      return c.json({
        success: false,
        error: 'Event not found'
      }, 404)
    }

    logger.info(
      `Public event retrieved by slug`,
      { slug, eventId: event.id, eventTitle: event.title },
      'PUBLIC_EVENTS'
    )

    return c.json({
      success: true,
      data: event
    })
  } catch (error) {
    logger.error(
      `Error retrieving public event by slug`,
      { error: error instanceof Error ? error.message : 'Unknown error' },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error retrieving event'
    }, 500)
  }
})

// POST /api/events/:slug/register - Register for event (requires authentication)
publicEvents.post('/:slug/register', jwt({
  secret: 'your-secret-key',
  cookie: 'auth-token'
}), async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const slug = c.req.param('slug')
    const data = await c.req.json()

    // Find event by slug
    const event = await mockDb.getEventBySlug(slug)
    if (!event) {
      return c.json({
        success: false,
        error: 'Event not found'
      }, 404)
    }

    // Validation
    const requiredFields = ['participant_name', 'participant_email']
    for (const field of requiredFields) {
      if (!data[field]) {
        return c.json({
          success: false,
          error: `Field '${field}' is required`
        }, 400)
      }
    }

    const registrationData = {
      event_id: event.id,
      user_id: payload.userId,
      participant_name: data.participant_name,
      participant_email: data.participant_email,
      participant_phone: data.participant_phone,
      participant_institution: data.participant_institution,
      dietary_requirements: data.dietary_requirements,
      accessibility_needs: data.accessibility_needs,
      additional_notes: data.additional_notes
    }

    const registration = await mockDb.registerForEvent(registrationData)
    
    if (!registration) {
      return c.json({
        success: false,
        error: 'Unable to register for event. Event may be full, registration closed, or you may already be registered.'
      }, 400)
    }

    logger.info(
      `User registered for event`,
      { 
        eventId: event.id,
        eventTitle: event.title,
        registrationId: registration.id,
        participantName: registration.participant_name,
        userId: payload.userId
      },
      'PUBLIC_EVENTS'
    )

    return c.json({
      success: true,
      data: registration,
      message: 'Registration successful! You will receive a confirmation email shortly.'
    }, 201)
  } catch (error) {
    logger.error(
      `Error registering for event`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error registering for event'
    }, 500)
  }
})

// GET /api/events/:slug/registration-status - Check if user is registered (requires authentication)
publicEvents.get('/:slug/registration-status', jwt({
  secret: 'your-secret-key',
  cookie: 'auth-token'
}), async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const slug = c.req.param('slug')

    // Find event by slug
    const event = await mockDb.getEventBySlug(slug)
    if (!event) {
      return c.json({
        success: false,
        error: 'Event not found'
      }, 404)
    }

    const registration = await mockDb.getUserEventRegistration(payload.userId, event.id)

    return c.json({
      success: true,
      data: {
        is_registered: !!registration,
        registration: registration || null,
        can_register: !registration && event.current_participants < event.max_participants && 
                     new Date() >= new Date(event.registration_start) && 
                     new Date() <= new Date(event.registration_end) &&
                     event.status === 'published'
      }
    })
  } catch (error) {
    logger.error(
      `Error checking event registration status`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error checking registration status'
    }, 500)
  }
})

// DELETE /api/events/:slug/registration - Cancel event registration (requires authentication)
publicEvents.delete('/:slug/registration', jwt({
  secret: 'your-secret-key',
  cookie: 'auth-token'
}), async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const slug = c.req.param('slug')

    // Find event by slug
    const event = await mockDb.getEventBySlug(slug)
    if (!event) {
      return c.json({
        success: false,
        error: 'Event not found'
      }, 404)
    }

    const registration = await mockDb.getUserEventRegistration(payload.userId, event.id)
    if (!registration) {
      return c.json({
        success: false,
        error: 'Registration not found'
      }, 404)
    }

    const success = await mockDb.cancelEventRegistration(registration.id)
    
    if (!success) {
      return c.json({
        success: false,
        error: 'Unable to cancel registration'
      }, 400)
    }

    logger.info(
      `User cancelled event registration`,
      { 
        eventId: event.id,
        eventTitle: event.title,
        registrationId: registration.id,
        userId: payload.userId
      },
      'PUBLIC_EVENTS'
    )

    return c.json({
      success: true,
      message: 'Registration cancelled successfully'
    })
  } catch (error) {
    logger.error(
      `Error cancelling event registration`,
      {
        userId: c.get('jwtPayload')?.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      'PUBLIC_EVENTS'
    )
    
    return c.json({
      success: false,
      error: 'Error cancelling registration'
    }, 500)
  }
})

export default publicEvents