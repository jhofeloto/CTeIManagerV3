-- ================================
-- HU-17: Sistema de Notificaciones y Comunicación Inteligente
-- Migración de base de datos para el sistema completo
-- ================================

-- Tabla de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read_status BOOLEAN NOT NULL DEFAULT false,
  delivery_method TEXT NOT NULL DEFAULT '["in_app"]', -- JSON array: in_app, email, push, sms
  related_entity_type TEXT, -- projects, events, publications, users, etc.
  related_entity_id INTEGER,
  action_url TEXT,
  scheduled_for DATETIME,
  delivered_at DATETIME,
  read_at DATETIME,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tabla de conversaciones para mensajería
CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  type TEXT NOT NULL DEFAULT 'direct' CHECK (type IN ('direct', 'group', 'broadcast')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'closed')),
  participants TEXT NOT NULL, -- JSON array de user IDs
  last_message_id INTEGER,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'video', 'audio', 'link')),
  attachments TEXT, -- JSON array de archivos adjuntos
  reply_to_id INTEGER,
  read_status BOOLEAN NOT NULL DEFAULT false,
  read_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- Tabla de preferencias de notificaciones por usuario
CREATE TABLE IF NOT EXISTS notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  push_enabled BOOLEAN NOT NULL DEFAULT true,
  sms_enabled BOOLEAN NOT NULL DEFAULT false,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  frequency TEXT NOT NULL DEFAULT 'immediate' CHECK (frequency IN ('immediate', 'hourly', 'daily', 'weekly')),
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '07:00',
  categories TEXT NOT NULL DEFAULT '{}', -- JSON object con preferencias por categoría
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de plantillas de notificaciones (para administradores)
CREATE TABLE IF NOT EXISTS notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('email', 'push', 'sms', 'in_app')),
  variables TEXT, -- JSON array de variables disponibles
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de historial de entregas de notificaciones
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER NOT NULL,
  delivery_method TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed')),
  error_message TEXT,
  delivered_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(id) ON DELETE CASCADE
);

-- ================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================

-- Índices para notificaciones
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read_status ON notifications(read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_status);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);

-- Índices para conversaciones
CREATE INDEX IF NOT EXISTS idx_conversations_participants ON conversations(participants);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);

-- Índices para mensajes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_read_status ON messages(read_status);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);

-- Índices para preferencias
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Índices para plantillas
CREATE INDEX IF NOT EXISTS idx_notification_templates_name ON notification_templates(name);
CREATE INDEX IF NOT EXISTS idx_notification_templates_type ON notification_templates(type);
CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON notification_templates(is_active);

-- Índices para entregas
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification_id ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_status ON notification_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_method ON notification_deliveries(delivery_method);

-- ================================
-- DATOS DE EJEMPLO PARA TESTING
-- ================================

-- Plantillas de notificación predeterminadas
INSERT OR IGNORE INTO notification_templates (name, subject, body, type, variables, created_by) VALUES 
  (
    'welcome_user',
    'Bienvenido a CODECTI Chocó',
    'Hola {{user_name}}, bienvenido a la plataforma CODECTI. Estamos emocionados de tenerte con nosotros.',
    'email',
    '["user_name", "platform_name"]',
    1
  ),
  (
    'project_assigned',
    'Nuevo proyecto asignado',
    'Se te ha asignado el proyecto "{{project_name}}". Puedes ver los detalles en: {{project_url}}',
    'in_app',
    '["user_name", "project_name", "project_url"]',
    1
  ),
  (
    'event_reminder',
    'Recordatorio de evento',
    'No olvides que tienes el evento "{{event_name}}" programado para {{event_date}} a las {{event_time}}.',
    'email',
    '["user_name", "event_name", "event_date", "event_time"]',
    1
  ),
  (
    'publication_approved',
    'Publicación aprobada',
    'Tu publicación "{{publication_title}}" ha sido aprobada y ya está disponible para la comunidad.',
    'in_app',
    '["user_name", "publication_title", "publication_url"]',
    1
  ),
  (
    'system_maintenance',
    'Mantenimiento programado del sistema',
    'El sistema estará en mantenimiento el {{maintenance_date}} de {{start_time}} a {{end_time}}.',
    'email',
    '["maintenance_date", "start_time", "end_time"]',
    1
  );

-- Preferencias predeterminadas para usuario administrador
INSERT OR IGNORE INTO notification_preferences (
  user_id, 
  email_enabled, 
  push_enabled, 
  sms_enabled, 
  in_app_enabled, 
  frequency, 
  categories
) VALUES (
  1, 
  true, 
  true, 
  false, 
  true, 
  'immediate',
  '{"projects": true, "events": true, "publications": true, "messages": true, "system": true}'
);

-- Notificaciones de ejemplo para testing
INSERT OR IGNORE INTO notifications (
  user_id, 
  title, 
  message, 
  type, 
  priority, 
  delivery_method,
  related_entity_type,
  created_by
) VALUES 
  (
    1, 
    'Bienvenido a CODECTI',
    'Tu cuenta ha sido creada exitosamente. Explora las funcionalidades de la plataforma.',
    'success',
    'medium',
    '["in_app", "email"]',
    'system',
    1
  ),
  (
    1,
    'Nuevo proyecto disponible',
    'Se ha publicado un nuevo proyecto de investigación en Inteligencia Artificial.',
    'info',
    'medium',
    '["in_app"]',
    'projects',
    1
  ),
  (
    1,
    'Evento próximo',
    'Recordatorio: Seminario de Innovación Tecnológica mañana a las 2:00 PM.',
    'warning',
    'high',
    '["in_app", "email"]',
    'events',
    1
  );

-- Conversación de ejemplo
INSERT OR IGNORE INTO conversations (title, type, participants, created_by) VALUES 
  (
    'Equipo de Desarrollo CODECTI',
    'group',
    '[1, 2, 3]',
    1
  );

-- Mensajes de ejemplo
INSERT OR IGNORE INTO messages (conversation_id, sender_id, content, message_type) VALUES 
  (
    1,
    1,
    '¡Hola equipo! Bienvenidos al sistema de mensajería de CODECTI. Aquí podremos coordinar nuestros proyectos.',
    'text'
  ),
  (
    1,
    1,
    'El sistema de notificaciones ya está funcionando correctamente. ¿Alguna pregunta?',
    'text'
  );