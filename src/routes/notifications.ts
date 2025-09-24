import { Hono } from 'hono'
import { jwt } from 'hono/jwt'
import { 
  Notification, 
  Message, 
  Conversation, 
  NotificationPreference,
  NotificationTemplate,
  CommunicationStats,
  CreateNotificationRequest,
  CreateMessageRequest,
  CreateConversationRequest,
  UpdateNotificationPreferenceRequest,
  CreateNotificationTemplateRequest
} from '../types'

type Bindings = {
  DB: D1Database
}

const notifications = new Hono<{ Bindings: Bindings }>()

// Middleware de autenticación JWT
notifications.use('/*', jwt({ 
  secret: process.env.JWT_SECRET || 'codecti-secret-key-2024',
  cookie: 'codecti-token'
}))

// ================================
// NOTIFICACIONES - CRUD OPERATIONS
// ================================

// Obtener todas las notificaciones del usuario
notifications.get('/notifications', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub
    const { page = '1', limit = '20', unread_only = 'false' } = c.req.query()

    let query = `
      SELECT 
        n.id,
        n.user_id,
        n.title,
        n.message,
        n.type,
        n.priority,
        n.read_status,
        n.delivery_method,
        n.related_entity_type,
        n.related_entity_id,
        n.action_url,
        n.scheduled_for,
        n.delivered_at,
        n.read_at,
        n.created_at,
        n.updated_at
      FROM notifications n
      WHERE n.user_id = ?
    `

    const params = [userId]

    if (unread_only === 'true') {
      query += ' AND n.read_status = false'
    }

    query += ' ORDER BY n.created_at DESC LIMIT ? OFFSET ?'
    params.push(limit, ((parseInt(page) - 1) * parseInt(limit)).toString())

    const { results } = await c.env.DB.prepare(query).bind(...params).all()

    // Contar total de notificaciones
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?'
    const countParams = [userId]

    if (unread_only === 'true') {
      countQuery += ' AND read_status = false'
    }

    const { results: countResult } = await c.env.DB.prepare(countQuery).bind(...countParams).all()
    const total = countResult[0]?.total || 0

    return c.json({
      success: true,
      data: results,
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total,
        total_pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Error getting notifications:', error)
    return c.json({ success: false, error: 'Error al obtener notificaciones' }, 500)
  }
})

// Crear nueva notificación
notifications.post('/notifications', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const createdBy = payload?.sub
    const body = await c.req.json() as CreateNotificationRequest

    const { results } = await c.env.DB.prepare(`
      INSERT INTO notifications (
        user_id, title, message, type, priority, delivery_method,
        related_entity_type, related_entity_id, action_url, 
        scheduled_for, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      body.user_id,
      body.title,
      body.message,
      body.type,
      body.priority || 'medium',
      JSON.stringify(body.delivery_method || ['in_app']),
      body.related_entity_type,
      body.related_entity_id,
      body.action_url,
      body.scheduled_for,
      createdBy
    ).run()

    const notificationId = results.meta?.last_row_id

    return c.json({
      success: true,
      message: 'Notificación creada exitosamente',
      data: { id: notificationId }
    }, 201)
  } catch (error) {
    console.error('Error creating notification:', error)
    return c.json({ success: false, error: 'Error al crear notificación' }, 500)
  }
})

// Marcar notificación como leída
notifications.patch('/notifications/:id/read', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub
    const notificationId = c.req.param('id')

    await c.env.DB.prepare(`
      UPDATE notifications 
      SET read_status = true, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run()

    return c.json({
      success: true,
      message: 'Notificación marcada como leída'
    })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return c.json({ success: false, error: 'Error al marcar notificación' }, 500)
  }
})

// Marcar todas las notificaciones como leídas
notifications.patch('/notifications/mark-all-read', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub

    await c.env.DB.prepare(`
      UPDATE notifications 
      SET read_status = true, read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND read_status = false
    `).bind(userId).run()

    return c.json({
      success: true,
      message: 'Todas las notificaciones marcadas como leídas'
    })
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return c.json({ success: false, error: 'Error al marcar todas las notificaciones' }, 500)
  }
})

// Eliminar notificación
notifications.delete('/notifications/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub
    const notificationId = c.req.param('id')

    await c.env.DB.prepare(`
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `).bind(notificationId, userId).run()

    return c.json({
      success: true,
      message: 'Notificación eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error deleting notification:', error)
    return c.json({ success: false, error: 'Error al eliminar notificación' }, 500)
  }
})

// ================================
// MENSAJERÍA - CRUD OPERATIONS
// ================================

// Obtener conversaciones del usuario
notifications.get('/conversations', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub
    const { page = '1', limit = '20' } = c.req.query()

    const { results } = await c.env.DB.prepare(`
      SELECT 
        c.id,
        c.title,
        c.type,
        c.status,
        c.participants,
        c.last_message_id,
        c.created_by,
        c.created_at,
        c.updated_at,
        COUNT(m.id) as message_count,
        COUNT(CASE WHEN m.read_status = false AND m.sender_id != ? THEN 1 END) as unread_count
      FROM conversations c
      LEFT JOIN messages m ON c.id = m.conversation_id
      WHERE c.participants LIKE '%' || ? || '%'
      GROUP BY c.id
      ORDER BY c.updated_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, userId, limit, (parseInt(page) - 1) * parseInt(limit)).all()

    return c.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error getting conversations:', error)
    return c.json({ success: false, error: 'Error al obtener conversaciones' }, 500)
  }
})

// Crear nueva conversación
notifications.post('/conversations', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const createdBy = payload?.sub
    const body = await c.req.json() as CreateConversationRequest

    const { results } = await c.env.DB.prepare(`
      INSERT INTO conversations (
        title, type, participants, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      body.title,
      body.type || 'direct',
      JSON.stringify(body.participants),
      createdBy
    ).run()

    const conversationId = results.meta?.last_row_id

    return c.json({
      success: true,
      message: 'Conversación creada exitosamente',
      data: { id: conversationId }
    }, 201)
  } catch (error) {
    console.error('Error creating conversation:', error)
    return c.json({ success: false, error: 'Error al crear conversación' }, 500)
  }
})

// Obtener mensajes de una conversación
notifications.get('/conversations/:id/messages', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub
    const conversationId = c.req.param('id')
    const { page = '1', limit = '50' } = c.req.query()

    // Verificar que el usuario participa en la conversación
    const { results: conversationCheck } = await c.env.DB.prepare(`
      SELECT participants FROM conversations WHERE id = ?
    `).bind(conversationId).all()

    if (!conversationCheck.length) {
      return c.json({ success: false, error: 'Conversación no encontrada' }, 404)
    }

    const participants = JSON.parse(conversationCheck[0].participants as string)
    if (!participants.includes(userId)) {
      return c.json({ success: false, error: 'No autorizado para ver esta conversación' }, 403)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT 
        m.id,
        m.conversation_id,
        m.sender_id,
        m.content,
        m.message_type,
        m.attachments,
        m.reply_to_id,
        m.read_status,
        m.read_at,
        m.created_at,
        m.updated_at,
        u.name as sender_name,
        u.email as sender_email
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = ?
      ORDER BY m.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(conversationId, limit, (parseInt(page) - 1) * parseInt(limit)).all()

    return c.json({
      success: true,
      data: results.reverse() // Mostrar mensajes más antiguos primero
    })
  } catch (error) {
    console.error('Error getting messages:', error)
    return c.json({ success: false, error: 'Error al obtener mensajes' }, 500)
  }
})

// Enviar mensaje
notifications.post('/conversations/:id/messages', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const senderId = payload?.sub
    const conversationId = c.req.param('id')
    const body = await c.req.json() as CreateMessageRequest

    // Verificar que el usuario participa en la conversación
    const { results: conversationCheck } = await c.env.DB.prepare(`
      SELECT participants FROM conversations WHERE id = ?
    `).bind(conversationId).all()

    if (!conversationCheck.length) {
      return c.json({ success: false, error: 'Conversación no encontrada' }, 404)
    }

    const participants = JSON.parse(conversationCheck[0].participants as string)
    if (!participants.includes(senderId)) {
      return c.json({ success: false, error: 'No autorizado para enviar mensajes' }, 403)
    }

    // Crear el mensaje
    const { results } = await c.env.DB.prepare(`
      INSERT INTO messages (
        conversation_id, sender_id, content, message_type, 
        attachments, reply_to_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      conversationId,
      senderId,
      body.content,
      body.message_type || 'text',
      JSON.stringify(body.attachments || []),
      body.reply_to_id
    ).run()

    const messageId = results.meta?.last_row_id

    // Actualizar última actividad de la conversación
    await c.env.DB.prepare(`
      UPDATE conversations 
      SET last_message_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(messageId, conversationId).run()

    return c.json({
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: { id: messageId }
    }, 201)
  } catch (error) {
    console.error('Error sending message:', error)
    return c.json({ success: false, error: 'Error al enviar mensaje' }, 500)
  }
})

// ================================
// PREFERENCIAS DE NOTIFICACIONES
// ================================

// Obtener preferencias del usuario
notifications.get('/preferences', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM notification_preferences WHERE user_id = ?
    `).bind(userId).all()

    // Si no existen preferencias, crear las predeterminadas
    if (!results.length) {
      const defaultPreferences = {
        email_enabled: true,
        push_enabled: true,
        sms_enabled: false,
        in_app_enabled: true,
        frequency: 'immediate',
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
        categories: {
          projects: true,
          events: true,
          publications: true,
          messages: true,
          system: true
        }
      }

      await c.env.DB.prepare(`
        INSERT INTO notification_preferences (
          user_id, email_enabled, push_enabled, sms_enabled, 
          in_app_enabled, frequency, quiet_hours_start, 
          quiet_hours_end, categories, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).bind(
        userId,
        defaultPreferences.email_enabled,
        defaultPreferences.push_enabled,
        defaultPreferences.sms_enabled,
        defaultPreferences.in_app_enabled,
        defaultPreferences.frequency,
        defaultPreferences.quiet_hours_start,
        defaultPreferences.quiet_hours_end,
        JSON.stringify(defaultPreferences.categories)
      ).run()

      return c.json({
        success: true,
        data: defaultPreferences
      })
    }

    return c.json({
      success: true,
      data: results[0]
    })
  } catch (error) {
    console.error('Error getting preferences:', error)
    return c.json({ success: false, error: 'Error al obtener preferencias' }, 500)
  }
})

// Actualizar preferencias
notifications.patch('/preferences', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub
    const body = await c.req.json() as UpdateNotificationPreferenceRequest

    await c.env.DB.prepare(`
      UPDATE notification_preferences SET
        email_enabled = ?,
        push_enabled = ?,
        sms_enabled = ?,
        in_app_enabled = ?,
        frequency = ?,
        quiet_hours_start = ?,
        quiet_hours_end = ?,
        categories = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `).bind(
      body.email_enabled,
      body.push_enabled,
      body.sms_enabled,
      body.in_app_enabled,
      body.frequency,
      body.quiet_hours_start,
      body.quiet_hours_end,
      JSON.stringify(body.categories),
      userId
    ).run()

    return c.json({
      success: true,
      message: 'Preferencias actualizadas exitosamente'
    })
  } catch (error) {
    console.error('Error updating preferences:', error)
    return c.json({ success: false, error: 'Error al actualizar preferencias' }, 500)
  }
})

// ================================
// TEMPLATES DE NOTIFICACIONES (ADMIN)
// ================================

// Obtener plantillas (solo admin)
notifications.get('/templates', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userRole = payload?.role

    if (userRole !== 'admin') {
      return c.json({ success: false, error: 'No autorizado' }, 403)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM notification_templates 
      ORDER BY name ASC
    `).all()

    return c.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error getting templates:', error)
    return c.json({ success: false, error: 'Error al obtener plantillas' }, 500)
  }
})

// Crear plantilla (solo admin)
notifications.post('/templates', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userRole = payload?.role
    const createdBy = payload?.sub

    if (userRole !== 'admin') {
      return c.json({ success: false, error: 'No autorizado' }, 403)
    }

    const body = await c.req.json() as CreateNotificationTemplateRequest

    const { results } = await c.env.DB.prepare(`
      INSERT INTO notification_templates (
        name, subject, body, type, variables, 
        created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).bind(
      body.name,
      body.subject,
      body.body,
      body.type,
      JSON.stringify(body.variables || []),
      createdBy
    ).run()

    return c.json({
      success: true,
      message: 'Plantilla creada exitosamente',
      data: { id: results.meta?.last_row_id }
    }, 201)
  } catch (error) {
    console.error('Error creating template:', error)
    return c.json({ success: false, error: 'Error al crear plantilla' }, 500)
  }
})

// ================================
// ESTADÍSTICAS DE COMUNICACIÓN (ADMIN)
// ================================

// Obtener estadísticas de comunicación
notifications.get('/stats', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userRole = payload?.role

    if (userRole !== 'admin') {
      return c.json({ success: false, error: 'No autorizado' }, 403)
    }

    // Estadísticas de notificaciones
    const { results: notificationStats } = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN read_status = false THEN 1 END) as unread_notifications,
        COUNT(CASE WHEN delivered_at IS NOT NULL THEN 1 END) as delivered_notifications,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_notifications
      FROM notifications
    `).all()

    // Estadísticas de mensajes
    const { results: messageStats } = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_messages,
        COUNT(CASE WHEN DATE(created_at) = DATE('now') THEN 1 END) as today_messages,
        COUNT(DISTINCT conversation_id) as active_conversations
      FROM messages
    `).all()

    // Usuarios más activos
    const { results: activeUsers } = await c.env.DB.prepare(`
      SELECT 
        u.name,
        u.email,
        COUNT(m.id) as messages_sent
      FROM users u
      LEFT JOIN messages m ON u.id = m.sender_id
      WHERE m.created_at >= DATE('now', '-7 days')
      GROUP BY u.id, u.name, u.email
      ORDER BY messages_sent DESC
      LIMIT 10
    `).all()

    // Tipos de notificaciones más comunes
    const { results: notificationTypes } = await c.env.DB.prepare(`
      SELECT 
        type,
        COUNT(*) as count
      FROM notifications
      WHERE created_at >= DATE('now', '-30 days')
      GROUP BY type
      ORDER BY count DESC
    `).all()

    const stats: CommunicationStats = {
      total_notifications: notificationStats[0]?.total_notifications || 0,
      unread_notifications: notificationStats[0]?.unread_notifications || 0,
      delivered_notifications: notificationStats[0]?.delivered_notifications || 0,
      total_messages: messageStats[0]?.total_messages || 0,
      active_conversations: messageStats[0]?.active_conversations || 0,
      daily_activity: {
        notifications_today: notificationStats[0]?.today_notifications || 0,
        messages_today: messageStats[0]?.today_messages || 0
      },
      top_notification_types: notificationTypes,
      active_users: activeUsers
    }

    return c.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting communication stats:', error)
    return c.json({ success: false, error: 'Error al obtener estadísticas' }, 500)
  }
})

// ================================
// ENDPOINTS DE UTILIDAD
// ================================

// Obtener contador de notificaciones no leídas
notifications.get('/unread-count', async (c) => {
  try {
    const payload = c.get('jwtPayload')
    const userId = payload?.sub

    const { results } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM notifications
      WHERE user_id = ? AND read_status = false
    `).bind(userId).all()

    return c.json({
      success: true,
      data: { unread_count: results[0]?.count || 0 }
    })
  } catch (error) {
    console.error('Error getting unread count:', error)
    return c.json({ success: false, error: 'Error al obtener contador' }, 500)
  }
})

// Búsqueda de usuarios para mensajería
notifications.get('/users/search', async (c) => {
  try {
    const { q } = c.req.query()
    
    if (!q || q.length < 2) {
      return c.json({ success: false, error: 'Query debe tener al menos 2 caracteres' }, 400)
    }

    const { results } = await c.env.DB.prepare(`
      SELECT id, name, email, avatar_url
      FROM users
      WHERE name LIKE ? OR email LIKE ?
      LIMIT 10
    `).bind(`%${q}%`, `%${q}%`).all()

    return c.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Error searching users:', error)
    return c.json({ success: false, error: 'Error al buscar usuarios' }, 500)
  }
})

export { notifications }