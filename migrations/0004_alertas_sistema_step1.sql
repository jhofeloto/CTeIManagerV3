-- Migración 0004 Step 1: Crear tablas principales del sistema de alertas

-- Tabla de alertas activas del sistema
CREATE TABLE IF NOT EXISTS system_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL, -- 'PROJECT', 'PRODUCT', 'USER', 'ACTION_LINE', 'SYSTEM'
  entity_id INTEGER, -- ID de la entidad afectada
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity_level INTEGER NOT NULL, -- 1=CRÍTICO, 2=ALTO, 3=MEDIO, 4=BAJO, 5=INFO
  priority_score INTEGER DEFAULT 50, -- Puntaje calculado automáticamente (0-100)
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'
  detection_method TEXT DEFAULT 'AUTO', -- 'AUTO', 'MANUAL', 'EXTERNAL'
  auto_resolve BOOLEAN DEFAULT 0,
  
  -- Metadatos y contexto
  context_data TEXT, -- JSON con datos del contexto
  affected_metrics TEXT, -- JSON con métricas afectadas
  recommended_actions TEXT, -- JSON con acciones recomendadas
  
  -- Seguimiento temporal
  detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at DATETIME,
  resolved_at DATETIME,
  dismissed_at DATETIME,
  
  -- Responsables y asignación
  assigned_to_user_id INTEGER,
  created_by_user_id INTEGER,
  acknowledged_by_user_id INTEGER,
  resolved_by_user_id INTEGER,
  
  -- Configuración de notificaciones
  notification_sent BOOLEAN DEFAULT 0,
  notification_count INTEGER DEFAULT 0,
  last_notification_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (alert_type_id) REFERENCES alert_types(id),
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  FOREIGN KEY (acknowledged_by_user_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by_user_id) REFERENCES users(id)
);

-- Tabla para el historial de alertas
CREATE TABLE IF NOT EXISTS alert_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- 'CREATED', 'ACKNOWLEDGED', 'ASSIGNED', 'RESOLVED', 'DISMISSED', 'UPDATED'
  previous_status TEXT,
  new_status TEXT,
  user_id INTEGER,
  notes TEXT,
  action_data TEXT, -- JSON con datos adicionales
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (alert_id) REFERENCES system_alerts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de configuración de notificaciones por usuario
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  alert_category TEXT NOT NULL, -- 'PERFORMANCE', 'RISK', 'OPPORTUNITY', 'COMPLIANCE'
  min_severity_level INTEGER DEFAULT 3,
  email_enabled BOOLEAN DEFAULT 1,
  web_push_enabled BOOLEAN DEFAULT 1,
  notification_frequency TEXT DEFAULT 'IMMEDIATE', -- 'IMMEDIATE', 'HOURLY', 'DAILY', 'WEEKLY'
  quiet_hours_start TIME DEFAULT '22:00:00',
  quiet_hours_end TIME DEFAULT '08:00:00',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, alert_category)
);

-- Tabla de reglas de análisis de riesgos
CREATE TABLE IF NOT EXISTS risk_analysis_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  rule_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'PROJECT_HEALTH', 'PRODUCTIVITY', 'BUDGET', 'TIMELINE', 'QUALITY'
  entity_type TEXT NOT NULL, -- 'PROJECT', 'PRODUCT', 'USER', 'ACTION_LINE'
  
  -- Configuración de la regla
  condition_sql TEXT NOT NULL, -- Query SQL para detectar la condición
  threshold_config TEXT, -- JSON con umbrales configurables
  alert_type_code TEXT NOT NULL, -- Referencia a alert_types.code
  
  -- Configuración de ejecución
  is_active BOOLEAN DEFAULT 1,
  execution_frequency TEXT DEFAULT 'HOURLY', -- 'REAL_TIME', 'HOURLY', 'DAILY', 'WEEKLY'
  last_execution_at DATETIME,
  next_execution_at DATETIME,
  
  -- Metadatos
  created_by_user_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);