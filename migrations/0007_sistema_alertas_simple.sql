-- Migración simplificada del Sistema de Alertas Fase 2B

-- Tabla de tipos de alertas
CREATE TABLE IF NOT EXISTS alert_types (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'PERFORMANCE', 'RISK', 'OPPORTUNITY', 'COMPLIANCE'
  severity_level INTEGER DEFAULT 3, -- 1=CRÍTICO, 2=ALTO, 3=MEDIO, 4=BAJO, 5=INFO
  color_code TEXT DEFAULT '#666666',
  icon TEXT DEFAULT 'fas fa-exclamation',
  threshold_config TEXT, -- JSON con configuraciones de umbral
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de alertas del sistema
CREATE TABLE IF NOT EXISTS alerts_v2 (
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
  
  -- Metadatos y contexto (como TEXT para compatibilidad)
  context_data TEXT, -- JSON con datos del contexto
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

-- Insertar tipos de alertas básicos
INSERT OR IGNORE INTO alert_types (code, name, description, category, severity_level, color_code, icon, threshold_config) VALUES
-- Alertas de Performance
('PROJECT_DELAY', 'Proyecto con Retraso', 'Proyecto que no ha mostrado actividad en el tiempo esperado', 'PERFORMANCE', 2, '#FF4444', 'fas fa-clock', '{"days_without_activity": 30}'),
('LOW_PRODUCTIVITY', 'Baja Productividad', 'Línea de acción o investigador con productividad por debajo del promedio', 'PERFORMANCE', 3, '#FF8C00', 'fas fa-chart-line-down', '{"min_products_per_month": 1}'),

-- Alertas de Riesgo
('RESEARCHER_OVERLOAD', 'Investigador Sobrecargado', 'Investigador con demasiados proyectos activos', 'RISK', 3, '#FFA500', 'fas fa-user-clock', '{"max_active_projects": 5}'),

-- Alertas de Oportunidad
('HIGH_IMPACT_OPPORTUNITY', 'Oportunidad de Alto Impacto', 'Proyecto o línea con potencial de crecimiento significativo', 'OPPORTUNITY', 4, '#32CD32', 'fas fa-rocket', '{"impact_score": 80}'),

-- Alertas de Cumplimiento
('DATA_QUALITY_ISSUE', 'Problema de Calidad de Datos', 'Datos incompletos o inconsistentes detectados', 'COMPLIANCE', 3, '#B8860B', 'fas fa-database', '{"completeness_threshold": 80}');

-- Crear índices básicos
CREATE INDEX IF NOT EXISTS idx_alerts_v2_status ON alerts_v2(status);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_entity ON alerts_v2(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_detected_at ON alerts_v2(detected_at);

-- Insertar algunas alertas de ejemplo
INSERT OR IGNORE INTO alerts_v2 (alert_type_id, entity_type, entity_id, title, message, severity_level, priority_score, context_data, recommended_actions) VALUES
(1, 'SYSTEM', NULL, 'Sistema de Alertas Fase 2B Activado', 'El sistema de alertas inteligentes ha sido implementado y está funcionando correctamente.', 5, 90, '{"deployment_version": "2B", "feature": "alerts_system"}', '["monitor_performance", "configure_thresholds", "train_users"]'),
(2, 'SYSTEM', NULL, 'Análisis de Productividad Programado', 'El sistema realizará un análisis automático de productividad en las próximas 24 horas.', 4, 70, '{"analysis_type": "productivity", "scheduled_for": "24h"}', '["prepare_reports", "review_metrics", "notify_stakeholders"]'),
(3, 'SYSTEM', NULL, 'Bienvenida al Sistema de Alertas', 'El nuevo sistema de alertas permitirá identificar proactivamente riesgos y oportunidades.', 5, 85, '{"welcome_message": true, "system_status": "operational"}', '["explore_dashboard", "configure_notifications", "review_documentation"]');