-- Migración 0004 Step 2: Índices y datos iniciales

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