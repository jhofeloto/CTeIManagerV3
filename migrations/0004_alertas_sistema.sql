-- Migración 0004: Sistema de Alertas Proactivas y Análisis de Riesgos
-- Fase 2B - Sistema Departamental de Ciencias del Chocó

-- Tabla de tipos de alertas disponibles
CREATE TABLE IF NOT EXISTS alert_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL, -- Ej: 'PROJECT_DELAY', 'BUDGET_OVERRUN', 'LOW_PRODUCTIVITY'
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'PERFORMANCE', 'RISK', 'OPPORTUNITY', 'COMPLIANCE'
  severity_level INTEGER DEFAULT 3, -- 1=CRÍTICO, 2=ALTO, 3=MEDIO, 4=BAJO, 5=INFO
  color_code TEXT DEFAULT '#FFA500',
  icon TEXT DEFAULT 'fas fa-exclamation-triangle',
  is_active BOOLEAN DEFAULT 1,
  auto_detection BOOLEAN DEFAULT 1, -- Si se detecta automáticamente
  threshold_config TEXT, -- JSON con configuración de umbrales
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alertas activas del sistema
CREATE TABLE IF NOT EXISTS system_alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_type_id INTEGER NOT NULL,
  entity_type TEXT NOT NULL, -- 'PROJECT', 'PRODUCT', 'USER', 'ACTION_LINE', 'SYSTEM'
  entity_id INTEGER, -- ID de la entidad afectada (nullable para alertas del sistema)
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity_level INTEGER NOT NULL, -- 1=CRÍTICO, 2=ALTO, 3=MEDIO, 4=BAJO, 5=INFO
  priority_score INTEGER DEFAULT 50, -- Puntaje calculado automáticamente (0-100)
  status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'
  detection_method TEXT DEFAULT 'AUTO', -- 'AUTO', 'MANUAL', 'EXTERNAL'
  auto_resolve BOOLEAN DEFAULT 0, -- Si se puede resolver automáticamente
  
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
  action_data TEXT, -- JSON con datos adicionales de la acción
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (alert_id) REFERENCES system_alerts(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Tabla de configuración de notificaciones por usuario
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  alert_category TEXT NOT NULL, -- 'PERFORMANCE', 'RISK', 'OPPORTUNITY', 'COMPLIANCE'
  min_severity_level INTEGER DEFAULT 3, -- Nivel mínimo de severidad para notificar
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

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity_level);
CREATE INDEX IF NOT EXISTS idx_system_alerts_entity ON system_alerts(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_system_alerts_detected_at ON system_alerts(detected_at);
CREATE INDEX IF NOT EXISTS idx_system_alerts_priority ON system_alerts(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id ON alert_history(alert_id);
CREATE INDEX IF NOT EXISTS idx_user_notification_prefs_user ON user_notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_risk_rules_active ON risk_analysis_rules(is_active, next_execution_at);

-- Insertar tipos de alertas predefinidos
INSERT OR IGNORE INTO alert_types (code, name, description, category, severity_level, color_code, icon, threshold_config) VALUES
-- Alertas de Performance
('PROJECT_DELAY', 'Proyecto con Retraso', 'Proyecto que no ha mostrado actividad en el tiempo esperado', 'PERFORMANCE', 2, '#FF4444', 'fas fa-clock', '{"days_without_activity": 30, "milestone_delay_days": 7}'),
('LOW_PRODUCTIVITY', 'Baja Productividad', 'Línea de acción o investigador con productividad por debajo del promedio', 'PERFORMANCE', 3, '#FF8C00', 'fas fa-chart-line-down', '{"min_products_per_month": 1, "productivity_threshold": 0.5}'),
('MILESTONE_OVERDUE', 'Hito Vencido', 'Hito de proyecto que ha pasado su fecha límite', 'PERFORMANCE', 2, '#DC143C', 'fas fa-flag', '{"days_overdue": 1}'),

-- Alertas de Riesgo
('BUDGET_OVERRUN', 'Sobrecosto Presupuestario', 'Proyecto que está excediendo el presupuesto planificado', 'RISK', 2, '#FF0000', 'fas fa-dollar-sign', '{"budget_percentage": 90, "variance_threshold": 15}'),
('RESEARCHER_OVERLOAD', 'Investigador Sobrecargado', 'Investigador con demasiados proyectos activos', 'RISK', 3, '#FFA500', 'fas fa-user-clock', '{"max_active_projects": 5, "workload_threshold": 120}'),
('RESOURCE_SHORTAGE', 'Escasez de Recursos', 'Línea de acción con recursos insuficientes', 'RISK', 3, '#FF6347', 'fas fa-exclamation-triangle', '{"resource_threshold": 20}'),

-- Alertas de Oportunidad
('HIGH_IMPACT_OPPORTUNITY', 'Oportunidad de Alto Impacto', 'Proyecto o línea con potencial de crecimiento significativo', 'OPPORTUNITY', 4, '#32CD32', 'fas fa-rocket', '{"impact_score": 80, "growth_rate": 25}'),
('COLLABORATION_OPPORTUNITY', 'Oportunidad de Colaboración', 'Posible sinergia entre proyectos o investigadores', 'OPPORTUNITY', 4, '#00CED1', 'fas fa-handshake', '{"similarity_threshold": 0.7}'),
('FUNDING_OPPORTUNITY', 'Oportunidad de Financiación', 'Convocatoria o financiación disponible para el proyecto', 'OPPORTUNITY', 3, '#4169E1', 'fas fa-coins', '{"match_percentage": 70}'),

-- Alertas de Cumplimiento
('REPORT_DUE', 'Reporte Pendiente', 'Reporte o entregable próximo a vencerse', 'COMPLIANCE', 3, '#DAA520', 'fas fa-file-alt', '{"days_until_due": 7}'),
('COMPLIANCE_VIOLATION', 'Violación de Cumplimiento', 'Incumplimiento de políticas o regulaciones', 'COMPLIANCE', 1, '#8B0000', 'fas fa-shield-alt', '{}'),
('DATA_QUALITY_ISSUE', 'Problema de Calidad de Datos', 'Datos incompletos o inconsistentes detectados', 'COMPLIANCE', 3, '#B8860B', 'fas fa-database', '{"completeness_threshold": 80, "consistency_threshold": 90}');

-- Insertar reglas de análisis de riesgos predefinidas
INSERT OR IGNORE INTO risk_analysis_rules (rule_code, name, description, category, entity_type, condition_sql, alert_type_code, execution_frequency) VALUES
-- Reglas para proyectos
('detect_inactive_projects', 'Detectar Proyectos Inactivos', 'Identifica proyectos sin actividad reciente', 'PROJECT_HEALTH', 'PROJECT', 
 'SELECT id FROM projects WHERE status = "ACTIVE" AND (last_activity_date IS NULL OR last_activity_date < date("now", "-30 days"))', 
 'PROJECT_DELAY', 'DAILY'),

('detect_overdue_milestones', 'Detectar Hitos Vencidos', 'Identifica hitos que han pasado su fecha límite', 'TIMELINE', 'PROJECT', 
 'SELECT project_id FROM project_milestones WHERE due_date < date("now") AND status != "COMPLETED"', 
 'MILESTONE_OVERDUE', 'DAILY'),

('detect_budget_overruns', 'Detectar Sobrecostos', 'Identifica proyectos que exceden el presupuesto', 'BUDGET', 'PROJECT', 
 'SELECT id FROM projects WHERE budget > 0 AND (spent_amount / budget) > 0.9', 
 'BUDGET_OVERRUN', 'WEEKLY'),

-- Reglas para investigadores
('detect_researcher_overload', 'Detectar Sobrecarga de Investigadores', 'Identifica investigadores con demasiados proyectos', 'PRODUCTIVITY', 'USER', 
 'SELECT owner_id FROM projects WHERE status = "ACTIVE" GROUP BY owner_id HAVING COUNT(*) > 5', 
 'RESEARCHER_OVERLOAD', 'WEEKLY'),

('detect_low_productivity', 'Detectar Baja Productividad', 'Identifica investigadores con baja productividad', 'PRODUCTIVITY', 'USER', 
 'SELECT u.id FROM users u LEFT JOIN projects p ON u.id = p.owner_id WHERE u.role = "INVESTIGATOR" AND u.created_at < date("now", "-6 months") GROUP BY u.id HAVING COUNT(p.id) < 2', 
 'LOW_PRODUCTIVITY', 'MONTHLY'),

-- Reglas para líneas de acción
('detect_underperforming_lines', 'Detectar Líneas con Bajo Rendimiento', 'Identifica líneas de acción con pocos proyectos o productos', 'PRODUCTIVITY', 'ACTION_LINE', 
 'SELECT al.id FROM action_lines al LEFT JOIN projects p ON al.id = p.action_line_id WHERE al.status = "ACTIVE" GROUP BY al.id HAVING COUNT(p.id) < 2', 
 'LOW_PRODUCTIVITY', 'MONTHLY');

-- Insertar preferencias de notificación por defecto para administradores
INSERT OR IGNORE INTO user_notification_preferences (user_id, alert_category, min_severity_level, email_enabled, web_push_enabled) 
SELECT id, 'PERFORMANCE', 2, 1, 1 FROM users WHERE role = 'ADMIN'
UNION ALL
SELECT id, 'RISK', 1, 1, 1 FROM users WHERE role = 'ADMIN'
UNION ALL
SELECT id, 'OPPORTUNITY', 3, 1, 1 FROM users WHERE role = 'ADMIN'
UNION ALL
SELECT id, 'COMPLIANCE', 2, 1, 1 FROM users WHERE role = 'ADMIN';