-- Migración 0004 Final: Sistema de Alertas Fase 2B
-- Creamos tablas con nombres únicos para evitar conflictos

-- Tabla de alertas avanzadas del sistema
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

-- Insertar tipos de alertas predefinidos
INSERT OR IGNORE INTO alert_types (code, name, description, category, severity_level, color_code, icon, threshold_config) VALUES
-- Alertas de Performance
('PROJECT_DELAY', 'Proyecto con Retraso', 'Proyecto que no ha mostrado actividad en el tiempo esperado', 'PERFORMANCE', 2, '#FF4444', 'fas fa-clock', '{"days_without_activity": 30}'),
('LOW_PRODUCTIVITY', 'Baja Productividad', 'Línea de acción o investigador con productividad por debajo del promedio', 'PERFORMANCE', 3, '#FF8C00', 'fas fa-chart-line-down', '{"min_products_per_month": 1}'),
('MILESTONE_OVERDUE', 'Hito Vencido', 'Hito de proyecto que ha pasado su fecha límite', 'PERFORMANCE', 2, '#DC143C', 'fas fa-flag', '{"days_overdue": 1}'),

-- Alertas de Riesgo
('BUDGET_OVERRUN', 'Sobrecosto Presupuestario', 'Proyecto que está excediendo el presupuesto planificado', 'RISK', 2, '#FF0000', 'fas fa-dollar-sign', '{"budget_percentage": 90}'),
('RESEARCHER_OVERLOAD', 'Investigador Sobrecargado', 'Investigador con demasiados proyectos activos', 'RISK', 3, '#FFA500', 'fas fa-user-clock', '{"max_active_projects": 5}'),
('RESOURCE_SHORTAGE', 'Escasez de Recursos', 'Línea de acción con recursos insuficientes', 'RISK', 3, '#FF6347', 'fas fa-exclamation-triangle', '{"resource_threshold": 20}'),

-- Alertas de Oportunidad
('HIGH_IMPACT_OPPORTUNITY', 'Oportunidad de Alto Impacto', 'Proyecto o línea con potencial de crecimiento significativo', 'OPPORTUNITY', 4, '#32CD32', 'fas fa-rocket', '{"impact_score": 80}'),
('COLLABORATION_OPPORTUNITY', 'Oportunidad de Colaboración', 'Posible sinergia entre proyectos o investigadores', 'OPPORTUNITY', 4, '#00CED1', 'fas fa-handshake', '{"similarity_threshold": 0.7}'),
('FUNDING_OPPORTUNITY', 'Oportunidad de Financiación', 'Convocatoria o financiación disponible para el proyecto', 'OPPORTUNITY', 3, '#4169E1', 'fas fa-coins', '{"match_percentage": 70}'),

-- Alertas de Cumplimiento
('REPORT_DUE', 'Reporte Pendiente', 'Reporte o entregable próximo a vencerse', 'COMPLIANCE', 3, '#DAA520', 'fas fa-file-alt', '{"days_until_due": 7}'),
('COMPLIANCE_VIOLATION', 'Violación de Cumplimiento', 'Incumplimiento de políticas o regulaciones', 'COMPLIANCE', 1, '#8B0000', 'fas fa-shield-alt', '{}'),
('DATA_QUALITY_ISSUE', 'Problema de Calidad de Datos', 'Datos incompletos o inconsistentes detectados', 'COMPLIANCE', 3, '#B8860B', 'fas fa-database', '{"completeness_threshold": 80}');

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_alerts_v2_status ON alerts_v2(status);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_severity ON alerts_v2(severity_level);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_entity ON alerts_v2(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_detected_at ON alerts_v2(detected_at);
CREATE INDEX IF NOT EXISTS idx_alerts_v2_priority ON alerts_v2(priority_score DESC);

-- Generar alertas de ejemplo basadas en datos reales
-- Alerta por investigadores sobrecargados (más de 3 proyectos)
INSERT INTO alerts_v2 (alert_type_id, entity_type, entity_id, title, message, severity_level, priority_score, context_data, affected_metrics, recommended_actions)
SELECT 
  at.id,
  'USER',
  u.id,
  'Investigador ' || u.full_name || ' está sobrecargado',
  'El investigador tiene ' || project_count || ' proyectos activos, lo que excede el límite recomendado de 3 proyectos.',
  3,
  65 + (project_count * 5), -- Prioridad basada en número de proyectos
  '{"project_count": ' || project_count || ', "threshold": 3, "excess": ' || (project_count - 3) || '}',
  '["productivity_per_project", "quality_risk", "burnout_probability"]',
  '["redistribute_projects", "assign_support_staff", "extend_deadlines", "provide_additional_resources"]'
FROM (
  SELECT 
    u.id,
    u.full_name,
    COUNT(p.id) as project_count
  FROM users u
  JOIN projects p ON u.id = p.owner_id
  WHERE u.role IN ('INVESTIGATOR', 'ADMIN') AND p.status = 'ACTIVE'
  GROUP BY u.id, u.full_name
  HAVING COUNT(p.id) > 3
) user_projects
JOIN alert_types at ON at.code = 'RESEARCHER_OVERLOAD';

-- Alerta por líneas de acción con baja productividad (menos de 2 proyectos)
INSERT INTO alerts_v2 (alert_type_id, entity_type, entity_id, title, message, severity_level, priority_score, context_data, affected_metrics, recommended_actions)
SELECT 
  at.id,
  'ACTION_LINE',
  al.id,
  'Línea de Acción "' || al.name || '" con baja actividad',
  'La línea de acción solo tiene ' || COALESCE(project_count, 0) || ' proyectos activos, por debajo del mínimo recomendado de 2.',
  3,
  55 - (COALESCE(project_count, 0) * 10), -- Menor prioridad si tiene algunos proyectos
  '{"project_count": ' || COALESCE(project_count, 0) || ', "threshold": 2, "deficit": ' || (2 - COALESCE(project_count, 0)) || ', "budget_allocation": ' || COALESCE(al.budget, 0) || '}',
  '["utilization_rate", "strategic_impact", "resource_efficiency"]',
  '["launch_new_projects", "reallocate_resources", "merger_consideration", "strategic_review"]'
FROM action_lines al
LEFT JOIN (
  SELECT 
    action_line_id,
    COUNT(*) as project_count
  FROM projects 
  WHERE status = 'ACTIVE'
  GROUP BY action_line_id
) p ON al.id = p.action_line_id
JOIN alert_types at ON at.code = 'LOW_PRODUCTIVITY'
WHERE al.status = 'ACTIVE' AND COALESCE(project_count, 0) < 2;

-- Alerta de oportunidad por alto impacto (proyectos con muchos productos)
INSERT INTO alerts_v2 (alert_type_id, entity_type, entity_id, title, message, severity_level, priority_score, context_data, affected_metrics, recommended_actions)
SELECT 
  at.id,
  'PROJECT',
  p.id,
  'Proyecto "' || p.title || '" muestra alto potencial',
  'El proyecto ha generado ' || product_count || ' productos, indicando alto potencial de impacto y posibles oportunidades de expansión.',
  4,
  75 + (product_count * 3), -- Mayor prioridad por más productos
  '{"product_count": ' || product_count || ', "threshold": 3, "growth_indicator": "high", "impact_potential": "significant"}',
  '["productivity_rate", "innovation_index", "collaboration_potential"]',
  '["increase_funding", "expand_team", "seek_partnerships", "scale_operations", "international_collaboration"]'
FROM projects p
JOIN (
  SELECT 
    project_id,
    COUNT(*) as product_count
  FROM products
  GROUP BY project_id
) prod ON p.id = prod.project_id
JOIN alert_types at ON at.code = 'HIGH_IMPACT_OPPORTUNITY'
WHERE p.status = 'ACTIVE' AND product_count >= 3;

-- Alerta por problemas de calidad de datos (proyectos sin información completa)
INSERT INTO alerts_v2 (alert_type_id, entity_type, entity_id, title, message, severity_level, priority_score, context_data, affected_metrics, recommended_actions)
SELECT 
  at.id,
  'PROJECT',
  p.id,
  'Proyecto "' || p.title || '" tiene información incompleta',
  'El proyecto carece de información crítica: ' || missing_fields || '. Esto afecta la calidad de los reportes y análisis.',
  3,
  45 + (missing_count * 5), -- Prioridad basada en campos faltantes
  '{"missing_fields": "' || missing_fields || '", "missing_count": ' || missing_count || ', "completeness_score": ' || (100 - missing_count * 20) || '}',
  '["data_quality", "reporting_accuracy", "analysis_reliability"]',
  '["complete_missing_data", "data_validation", "contact_investigator", "set_completion_deadline"]'
FROM (
  SELECT 
    p.id,
    p.title,
    CASE 
      WHEN p.start_date IS NULL AND p.end_date IS NULL AND p.budget IS NULL AND p.institution IS NULL THEN 4
      WHEN (p.start_date IS NULL) + (p.end_date IS NULL) + (p.budget IS NULL) + (p.institution IS NULL) = 3 THEN 3
      WHEN (p.start_date IS NULL) + (p.end_date IS NULL) + (p.budget IS NULL) + (p.institution IS NULL) = 2 THEN 2
      ELSE 1
    END as missing_count,
    CASE 
      WHEN p.start_date IS NULL AND p.end_date IS NULL AND p.budget IS NULL AND p.institution IS NULL THEN 'fecha_inicio, fecha_fin, presupuesto, institución'
      WHEN p.start_date IS NULL AND p.end_date IS NULL AND p.budget IS NULL THEN 'fecha_inicio, fecha_fin, presupuesto'
      WHEN p.start_date IS NULL AND p.end_date IS NULL THEN 'fecha_inicio, fecha_fin'
      WHEN p.start_date IS NULL THEN 'fecha_inicio'
      WHEN p.end_date IS NULL THEN 'fecha_fin'
      WHEN p.budget IS NULL THEN 'presupuesto'
      WHEN p.institution IS NULL THEN 'institución'
      ELSE 'otros'
    END as missing_fields
  FROM projects p
  WHERE p.status = 'ACTIVE'
    AND (p.start_date IS NULL OR p.end_date IS NULL OR p.budget IS NULL OR p.institution IS NULL)
) incomplete_projects
JOIN alert_types at ON at.code = 'DATA_QUALITY_ISSUE'
WHERE missing_count >= 2;