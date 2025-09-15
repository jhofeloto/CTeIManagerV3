-- =============================================
-- MIGRACIÓN 0005: INTEGRACIÓN DE MONITOREO ESTRATÉGICO
-- Extensión orgánica de estructuras existentes para Fase 1
-- Fecha: 2024-09-12
-- =============================================

-- VERIFICACIÓN PREVIA: Asegurar que las migraciones anteriores se ejecutaron
-- Esta migración extiende tablas existentes sin modificar datos actuales

-- 1. LÍNEAS DE ACCIÓN DEPARTAMENTALES (Nueva tabla independiente)
CREATE TABLE IF NOT EXISTS action_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT 'Chocó CTeI',
    priority INTEGER CHECK(priority IN (1,2,3,4,5)) DEFAULT 3,
    start_date TEXT,
    end_date TEXT,
    responsible_user_id INTEGER,
    status TEXT CHECK(status IN ('PLANNING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')) DEFAULT 'PLANNING',
    budget DECIMAL(15,2),
    kpi_targets TEXT, -- JSON: {"projects": 10, "products": 25, "budget_execution": 0.85}
    color_code TEXT DEFAULT '#3B82F6',
    icon TEXT DEFAULT 'fas fa-flag',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (responsible_user_id) REFERENCES users(id)
);

-- 2. EXTENDER TABLA PROJECTS EXISTENTE (añadir campos de monitoreo)
-- SQLite no permite DEFAULT con funciones en ALTER TABLE, usaremos valores constantes
ALTER TABLE projects ADD COLUMN action_line_id INTEGER;
ALTER TABLE projects ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN last_activity_date TEXT;
ALTER TABLE projects ADD COLUMN risk_level TEXT CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW';
ALTER TABLE projects ADD COLUMN next_milestone_date TEXT;
ALTER TABLE projects ADD COLUMN next_milestone_description TEXT;

-- Actualizar valores por defecto para proyectos existentes
UPDATE projects SET last_activity_date = updated_at WHERE last_activity_date IS NULL;

-- 3. EXTENDER PRODUCT_CATEGORIES EXISTENTE (añadir categorías de experiencias)
-- Insertar nuevas categorías de experiencias en la tabla existente
INSERT OR REPLACE INTO product_categories (code, name, description, category_group, impact_weight, required_fields, created_at) VALUES 
-- EXPERIENCIAS Y DIVULGACIÓN - Nueva categoría para cumplir requerimiento
('EXPERIENCE_COMMUNITY', 'Experiencia Comunitaria', 'Experiencia de trabajo directo con comunidades locales del Chocó', 'EXPERIENCE', 2.0, '{"community_name": true, "participants": true, "location": true, "duration": true, "methodology": false}', datetime('now')),
('EXPERIENCE_FIELD', 'Experiencia de Campo', 'Trabajo de campo y experiencias en terreno para investigación aplicada', 'EXPERIENCE', 2.5, '{"location": true, "methodology": true, "findings": false, "photos": false, "conditions": false}', datetime('now')),
('EXPERIENCE_INNOVATION', 'Experiencia de Innovación', 'Procesos de innovación tecnológica y desarrollo de soluciones', 'EXPERIENCE', 3.0, '{"innovation_type": true, "impact": true, "replicability": true, "stakeholders": false}', datetime('now')),
('EXPERIENCE_COLLABORATION', 'Experiencia de Colaboración', 'Colaboraciones interinstitucionales y trabajo en redes de conocimiento', 'EXPERIENCE', 2.5, '{"institutions": true, "collaboration_type": true, "outcomes": true, "duration": false}', datetime('now')),
('EXPERIENCE_METHOD', 'Experiencia Metodológica', 'Desarrollo y aplicación de metodologías innovadoras de investigación', 'EXPERIENCE', 2.8, '{"methodology_name": true, "application_context": true, "effectiveness": false, "validation": false}', datetime('now')),
('EXPERIENCE_LEARNING', 'Lección Aprendida', 'Documentación de lecciones aprendidas y sistematización de experiencias', 'EXPERIENCE', 2.2, '{"context": true, "lesson": true, "recommendations": true, "applicability": false}', datetime('now')),
('CASE_STUDY', 'Estudio de Caso', 'Análisis detallado y documentación de casos específicos de investigación', 'EXPERIENCE', 3.2, '{"case_description": true, "analysis_method": true, "conclusions": true, "transferability": false}', datetime('now')),
('BEST_PRACTICE', 'Buena Práctica', 'Documentación y sistematización de mejores prácticas implementadas', 'EXPERIENCE', 2.7, '{"practice_description": true, "implementation": true, "results": true, "transferability": true}', datetime('now')),
('KNOWLEDGE_TRANSFER', 'Transferencia de Conocimiento', 'Procesos de transferencia de conocimiento a comunidades y organizaciones', 'EXPERIENCE', 2.4, '{"target_audience": true, "transfer_method": true, "impact_assessment": false, "sustainability": false}', datetime('now')),
('PARTICIPATORY_RESEARCH', 'Investigación Participativa', 'Experiencias de investigación con participación comunitaria activa', 'EXPERIENCE', 2.9, '{"participants": true, "participation_level": true, "outcomes": true, "empowerment": false}', datetime('now'));

-- 4. TABLA DE HITOS/MILESTONES (Integrada con projects existente)
CREATE TABLE IF NOT EXISTS project_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    target_date TEXT NOT NULL,
    completed_date TEXT,
    status TEXT CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'OVERDUE')) DEFAULT 'PENDING',
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    priority INTEGER CHECK(priority IN (1,2,3,4,5)) DEFAULT 3,
    deliverable_type TEXT, -- 'PRODUCT', 'REPORT', 'PRESENTATION', 'OTHER'
    deliverable_id INTEGER, -- Si está relacionado a un producto específico
    created_by INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (deliverable_id) REFERENCES products(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 5. EXTENDER USUARIOS EXISTENTE (roles de monitoreo)
ALTER TABLE users ADD COLUMN monitoring_role TEXT CHECK(monitoring_role IN ('COORDINATOR', 'EVALUATOR', 'OBSERVER'));
ALTER TABLE users ADD COLUMN last_login TEXT;
ALTER TABLE users ADD COLUMN notification_preferences TEXT;

-- Establecer preferencias por defecto para usuarios existentes
UPDATE users SET notification_preferences = '{"email": true, "dashboard": true, "frequency": "weekly"}' WHERE notification_preferences IS NULL;

-- 6. TABLA DE MÉTRICAS CALCULADAS (Cache para performance)
CREATE TABLE IF NOT EXISTS calculated_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type TEXT NOT NULL, -- 'PROJECT', 'ACTION_LINE', 'USER', 'SYSTEM'
    entity_id INTEGER NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    calculation_date TEXT DEFAULT (datetime('now')),
    is_current BOOLEAN DEFAULT 1,
    metadata TEXT, -- JSON con detalles del cálculo
    UNIQUE(entity_type, entity_id, metric_name, is_current)
);

-- 7. SISTEMA DE ALERTAS (Integrado con usuarios existentes)
CREATE TABLE IF NOT EXISTS system_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT CHECK(alert_type IN ('PROJECT_OVERDUE', 'MILESTONE_APPROACHING', 'LOW_PROGRESS', 'BUDGET_ALERT', 'COLLABORATION_REQUEST', 'SYSTEM_UPDATE', 'EXPERIENCE_PENDING')) NOT NULL,
    severity TEXT CHECK(severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
    target_user_id INTEGER NOT NULL,
    related_project_id INTEGER,
    related_product_id INTEGER,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    is_read BOOLEAN DEFAULT 0,
    is_resolved BOOLEAN DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    read_at TEXT,
    resolved_at TEXT,
    FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (related_product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- =============================================
-- ÍNDICES OPTIMIZADOS PARA PERFORMANCE
-- =============================================

-- Índices para action_lines
CREATE INDEX IF NOT EXISTS idx_action_lines_status ON action_lines(status);
CREATE INDEX IF NOT EXISTS idx_action_lines_department ON action_lines(department);
CREATE INDEX IF NOT EXISTS idx_action_lines_priority ON action_lines(priority);

-- Índices para projects (nuevos campos)
CREATE INDEX IF NOT EXISTS idx_projects_action_line ON projects(action_line_id);
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_projects_risk ON projects(risk_level);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity_date);

-- Índices para project_milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON project_milestones(target_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_priority ON project_milestones(priority);

-- Índices para calculated_metrics
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_entity ON calculated_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_current ON calculated_metrics(is_current);
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_name ON calculated_metrics(metric_name);

-- Índices para system_alerts
CREATE INDEX IF NOT EXISTS idx_alerts_user ON system_alerts(target_user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON system_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON system_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON system_alerts(severity);

-- =============================================
-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- =============================================

-- Trigger: Actualizar progreso de proyecto basado en milestones completados
CREATE TRIGGER IF NOT EXISTS update_project_progress_from_milestones
AFTER UPDATE OF progress_percentage, status ON project_milestones
BEGIN
    -- Actualizar progreso general del proyecto
    UPDATE projects 
    SET progress_percentage = COALESCE((
        SELECT AVG(progress_percentage) 
        FROM project_milestones 
        WHERE project_id = NEW.project_id
    ), 0),
    last_activity_date = datetime('now'),
    updated_at = datetime('now')
    WHERE id = NEW.project_id;
    
    -- Actualizar próximo milestone si este se completó
    UPDATE projects 
    SET next_milestone_date = (
        SELECT MIN(target_date) 
        FROM project_milestones 
        WHERE project_id = NEW.project_id AND status != 'COMPLETED'
    ),
    next_milestone_description = (
        SELECT name 
        FROM project_milestones 
        WHERE project_id = NEW.project_id AND status != 'COMPLETED'
        ORDER BY target_date ASC LIMIT 1
    )
    WHERE id = NEW.project_id;
END;

-- Trigger: Generar alertas automáticas por fechas vencidas
CREATE TRIGGER IF NOT EXISTS generate_overdue_alerts_milestones
AFTER UPDATE OF status ON project_milestones
WHEN NEW.status = 'OVERDUE' AND OLD.status != 'OVERDUE'
BEGIN
    INSERT OR IGNORE INTO system_alerts (
        alert_type, severity, target_user_id, related_project_id, title, message, action_url
    )
    SELECT 
        'MILESTONE_APPROACHING', 'HIGH', p.owner_id, p.id,
        'Hito Vencido: ' || NEW.name,
        'El hito "' || NEW.name || '" del proyecto "' || p.title || '" ha superado su fecha límite sin completarse.',
        '/dashboard/projects/' || p.id || '/timeline'
    FROM projects p
    WHERE p.id = NEW.project_id;
END;

-- Trigger: Actualizar métricas de línea de acción cuando cambia un proyecto
CREATE TRIGGER IF NOT EXISTS update_action_line_metrics_on_project_change
AFTER UPDATE OF progress_percentage, status ON projects
WHEN NEW.action_line_id IS NOT NULL
BEGIN
    -- Marcar métricas anteriores como no actuales
    UPDATE calculated_metrics 
    SET is_current = 0 
    WHERE entity_type = 'ACTION_LINE' AND entity_id = NEW.action_line_id AND is_current = 1;
    
    -- Insertar nuevas métricas actualizadas
    INSERT INTO calculated_metrics (entity_type, entity_id, metric_name, metric_value, is_current, metadata)
    VALUES 
    ('ACTION_LINE', NEW.action_line_id, 'total_projects', 
     (SELECT COUNT(*) FROM projects WHERE action_line_id = NEW.action_line_id), 1,
     '{"last_updated": "' || datetime('now') || '", "trigger": "project_update"}'),
    ('ACTION_LINE', NEW.action_line_id, 'active_projects', 
     (SELECT COUNT(*) FROM projects WHERE action_line_id = NEW.action_line_id AND status = 'ACTIVE'), 1,
     '{"last_updated": "' || datetime('now') || '", "trigger": "project_update"}'),
    ('ACTION_LINE', NEW.action_line_id, 'avg_progress', 
     COALESCE((SELECT AVG(progress_percentage) FROM projects WHERE action_line_id = NEW.action_line_id AND status = 'ACTIVE'), 0), 1,
     '{"last_updated": "' || datetime('now') || '", "trigger": "project_update"}'),
    ('ACTION_LINE', NEW.action_line_id, 'total_products', 
     (SELECT COUNT(DISTINCT prod.id) FROM products prod JOIN projects p ON prod.project_id = p.id WHERE p.action_line_id = NEW.action_line_id), 1,
     '{"last_updated": "' || datetime('now') || '", "trigger": "project_update"}'),
    ('ACTION_LINE', NEW.action_line_id, 'total_experiences', 
     (SELECT COUNT(DISTINCT prod.id) FROM products prod JOIN projects p ON prod.project_id = p.id JOIN product_categories pc ON prod.product_code = pc.code WHERE p.action_line_id = NEW.action_line_id AND pc.category_group = 'EXPERIENCE'), 1,
     '{"last_updated": "' || datetime('now') || '", "trigger": "project_update"}');
     
    -- Actualizar fecha de actualización de la línea de acción
    UPDATE action_lines 
    SET updated_at = datetime('now') 
    WHERE id = NEW.action_line_id;
END;

-- Trigger: Actualizar last_activity_date cuando se actualiza un proyecto
CREATE TRIGGER IF NOT EXISTS update_project_last_activity
AFTER UPDATE ON projects
BEGIN
    UPDATE projects 
    SET last_activity_date = datetime('now')
    WHERE id = NEW.id AND (
        NEW.title != OLD.title OR 
        NEW.abstract != OLD.abstract OR 
        NEW.status != OLD.status OR
        NEW.progress_percentage != OLD.progress_percentage
    );
END;

-- Trigger: Actualizar usuarios last_login (se usará desde el backend)
CREATE TRIGGER IF NOT EXISTS update_user_last_login
AFTER UPDATE OF last_login ON users
BEGIN
    UPDATE users 
    SET updated_at = datetime('now')
    WHERE id = NEW.id;
END;

-- =============================================
-- DATOS INICIALES - LÍNEAS DE ACCIÓN PARA CHOCÓ
-- =============================================

-- Insertar líneas de acción específicas para el departamento del Chocó
-- Basadas en el Plan de Ciencia, Tecnología e Innovación departamental
INSERT OR REPLACE INTO action_lines (code, name, description, department, priority, start_date, end_date, status, kpi_targets, color_code, icon) VALUES 
('LA001', 'Biodiversidad y Conservación', 'Investigación, conservación y uso sostenible de la biodiversidad chocoana. Incluye estudios de ecosistemas del Pacífico, especies endémicas, servicios ecosistémicos y estrategias de conservación participativa con comunidades locales.', 'Chocó CTeI', 5, '2024-01-01', '2026-12-31', 'ACTIVE', 
 '{"projects": 15, "products": 40, "experiences": 20, "communities": 10, "species_studied": 50, "conservation_areas": 5}', '#10B981', 'fas fa-leaf'),

('LA002', 'Gestión Integral del Agua', 'Investigación y gestión integral del recurso hídrico en el Chocó. Incluye calidad del agua, tecnologías de tratamiento, saneamiento básico rural, gestión de cuencas y adaptación al cambio climático relacionada con recursos hídricos.', 'Chocó CTeI', 5, '2024-01-01', '2025-12-31', 'ACTIVE', 
 '{"projects": 12, "products": 30, "experiences": 15, "technologies": 8, "communities_served": 25, "water_quality_studies": 20}', '#3B82F6', 'fas fa-tint'),

('LA003', 'Tecnologías Sostenibles', 'Desarrollo de tecnologías apropiadas para el contexto chocoano. Incluye energías renovables, tecnologías de información y comunicación, innovación en materiales locales y soluciones tecnológicas de bajo impacto ambiental.', 'Chocó CTeI', 4, '2024-01-01', '2027-12-31', 'ACTIVE', 
 '{"projects": 10, "products": 25, "experiences": 12, "prototypes": 6, "patents": 2, "tech_transfers": 4}', '#8B5CF6', 'fas fa-microchip'),

('LA004', 'Fortalecimiento del Tejido Social', 'Desarrollo comunitario y fortalecimiento organizacional. Incluye educación popular, salud intercultural, participación ciudadana, liderazgo comunitario y construcción de capacidades locales para el desarrollo endógeno.', 'Chocó CTeI', 4, '2024-01-01', '2026-06-30', 'ACTIVE', 
 '{"projects": 18, "products": 35, "experiences": 25, "communities": 30, "leaders_trained": 100, "organizations_strengthened": 20}', '#F59E0B', 'fas fa-users'),

('LA005', 'Economía Territorial y Circular', 'Promoción de modelos económicos territoriales basados en la economía circular. Incluye cadenas productivas locales, aprovechamiento sostenible de residuos, emprendimiento comunitario y desarrollo de mercados locales.', 'Chocó CTeI', 3, '2024-06-01', '2026-12-31', 'PLANNING', 
 '{"projects": 8, "products": 20, "experiences": 15, "enterprises_supported": 12, "jobs_created": 50, "circular_initiatives": 6}', '#EF4444', 'fas fa-recycle'),

('LA006', 'Patrimonio Cultural e Identidad', 'Preservación y valorización del patrimonio cultural afrocolombiano e indígena del Chocó. Incluye saberes ancestrales, tradiciones orales, medicina tradicional, arte y cultura, y procesos de memoria histórica.', 'Chocó CTeI', 3, '2024-01-01', '2025-12-31', 'ACTIVE', 
 '{"projects": 6, "products": 15, "experiences": 18, "archives": 8, "cultural_events": 10, "elders_interviewed": 50}', '#EC4899', 'fas fa-landmark'),

('LA007', 'Seguridad Alimentaria y Nutricional', 'Investigación aplicada para mejorar la seguridad alimentaria en el Chocó. Incluye sistemas productivos locales, plantas alimenticias nativas, técnicas de conservación de alimentos y programas nutricionales comunitarios.', 'Chocó CTeI', 4, '2024-03-01', '2026-12-31', 'PLANNING', 
 '{"projects": 7, "products": 18, "experiences": 12, "food_systems": 5, "nutrition_programs": 8, "native_species": 20}', '#22C55E', 'fas fa-seedling');

-- =============================================
-- INICIALIZACIÓN DE MÉTRICAS BASE
-- =============================================

-- Crear métricas iniciales para el sistema general
INSERT OR REPLACE INTO calculated_metrics (entity_type, entity_id, metric_name, metric_value, is_current, metadata)
VALUES 
('SYSTEM', 0, 'total_action_lines', 
 (SELECT COUNT(*) FROM action_lines), 1,
 '{"calculation_date": "' || datetime('now') || '", "type": "baseline"}'),
('SYSTEM', 0, 'active_action_lines', 
 (SELECT COUNT(*) FROM action_lines WHERE status = 'ACTIVE'), 1,
 '{"calculation_date": "' || datetime('now') || '", "type": "baseline"}'),
('SYSTEM', 0, 'total_projects_with_action_lines', 
 (SELECT COUNT(*) FROM projects WHERE action_line_id IS NOT NULL), 1,
 '{"calculation_date": "' || datetime('now') || '", "type": "baseline"}');

-- Crear métricas iniciales para cada línea de acción
INSERT OR REPLACE INTO calculated_metrics (entity_type, entity_id, metric_name, metric_value, is_current, metadata)
SELECT 'ACTION_LINE', al.id, 'baseline_setup', 1, 1,
       '{"setup_date": "' || datetime('now') || '", "department": "' || al.department || '"}'
FROM action_lines al;

-- =============================================
-- VERIFICACIÓN DE INTEGRIDAD
-- =============================================

-- Verificar que todas las tablas se crearon correctamente
-- Esta consulta debe devolver al menos 7 filas (las nuevas tablas + extensiones)
-- SELECT name FROM sqlite_master WHERE type='table' AND name IN ('action_lines', 'project_milestones', 'calculated_metrics', 'system_alerts');

-- Verificar que los nuevos campos se añadieron a projects
-- PRAGMA table_info(projects);

-- Verificar que las nuevas categorías de experiencias se insertaron
-- SELECT COUNT(*) FROM product_categories WHERE category_group = 'EXPERIENCE';

-- =============================================
-- NOTAS DE MIGRACIÓN
-- =============================================

-- 1. Esta migración es EXTENSIVA, no destructiva
-- 2. Todos los datos existentes se preservan
-- 3. Las nuevas funcionalidades son opcionales inicialmente
-- 4. Los triggers se activan solo cuando se usan las nuevas funcionalidades
-- 5. Los índices mejoran el performance sin afectar funcionalidad existente
-- 6. Las líneas de acción se pueden asignar gradualmente a proyectos existentes

-- PRÓXIMOS PASOS DESPUÉS DE ESTA MIGRACIÓN:
-- 1. Verificar que la migración se ejecutó sin errores
-- 2. Comprobar que los datos existentes no se afectaron
-- 3. Probar la creación de milestones en proyectos existentes
-- 4. Asignar líneas de acción a algunos proyectos de prueba
-- 5. Verificar que los triggers funcionan correctamente

-- FIN DE MIGRACIÓN 0005