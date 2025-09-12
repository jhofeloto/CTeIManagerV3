# 🔄 FASE 1 REVISADA: INTEGRACIÓN ORGÁNICA CON ARQUITECTURA EXISTENTE

## 🎯 PRINCIPIOS DE INTEGRACIÓN

### **✅ USAR ESTRUCTURAS EXISTENTES:**
- **Proyectos** → Extender con campos de monitoreo y líneas de acción
- **Productos** → Añadir categoría "EXPERIENCIAS" y mejorar seguimiento
- **Usuarios** → Ampliar roles y responsabilidades existentes
- **product_categories** → Ampliar con nuevas categorías de experiencias

### **✅ MANTENER ARQUITECTURA ACTUAL:**
- **Mismo patrón de tablas** existente
- **Mismas relaciones** proyecto-usuario-producto
- **Misma estructura de permisos** y autenticación
- **Mismas convenciones** de nomenclatura y diseño

---

## 🗄️ MIGRACIÓN INTEGRADA: 0005_strategic_monitoring_integration.sql

```sql
-- =============================================
-- FASE 1: INTEGRACIÓN DE MONITOREO ESTRATÉGICO
-- Extensión orgánica de estructuras existentes
-- =============================================

-- 1. LÍNEAS DE ACCIÓN (Nueva tabla independiente)
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

-- 2. EXTENDER TABLA PROJECTS (añadir campos de monitoreo)
ALTER TABLE projects ADD COLUMN action_line_id INTEGER REFERENCES action_lines(id);
ALTER TABLE projects ADD COLUMN progress_percentage DECIMAL(5,2) DEFAULT 0.0;
ALTER TABLE projects ADD COLUMN last_activity_date TEXT DEFAULT (datetime('now'));
ALTER TABLE projects ADD COLUMN risk_level TEXT CHECK(risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'LOW';
ALTER TABLE projects ADD COLUMN next_milestone_date TEXT;
ALTER TABLE projects ADD COLUMN next_milestone_description TEXT;

-- 3. EXTENDER PRODUCT_CATEGORIES (añadir categoría experiencias)
INSERT OR REPLACE INTO product_categories VALUES 
-- EXPERIENCIAS Y DIVULGACIÓN
('EXPERIENCE_COMMUNITY', 'Experiencia Comunitaria', 'Experiencia de trabajo con comunidades locales', 'EXPERIENCE', 2.0, '{"community_name": true, "participants": true, "location": true, "duration": true}', datetime('now')),
('EXPERIENCE_FIELD', 'Experiencia de Campo', 'Trabajo de campo y experiencias en terreno', 'EXPERIENCE', 2.5, '{"location": true, "methodology": true, "findings": false, "photos": false}', datetime('now')),
('EXPERIENCE_INNOVATION', 'Experiencia de Innovación', 'Procesos de innovación y desarrollo tecnológico', 'EXPERIENCE', 3.0, '{"innovation_type": true, "impact": true, "replicability": true}', datetime('now')),
('EXPERIENCE_COLLABORATION', 'Experiencia de Colaboración', 'Colaboraciones interinstitucionales y redes', 'EXPERIENCE', 2.5, '{"institutions": true, "collaboration_type": true, "outcomes": true}', datetime('now')),
('EXPERIENCE_METHOD', 'Experiencia Metodológica', 'Desarrollo y aplicación de metodologías innovadoras', 'EXPERIENCE', 2.8, '{"methodology_name": true, "application_context": true, "effectiveness": false}', datetime('now')),
('EXPERIENCE_LEARNING', 'Lección Aprendida', 'Documentación de lecciones aprendidas y buenas prácticas', 'EXPERIENCE', 2.2, '{"context": true, "lesson": true, "recommendations": true}', datetime('now')),
('CASE_STUDY', 'Estudio de Caso', 'Análisis detallado de casos específicos', 'EXPERIENCE', 3.2, '{"case_description": true, "analysis_method": true, "conclusions": true}', datetime('now')),
('BEST_PRACTICE', 'Buena Práctica', 'Documentación de mejores prácticas implementadas', 'EXPERIENCE', 2.7, '{"practice_description": true, "implementation": true, "results": true, "transferability": true}', datetime('now'));

-- 4. TABLA DE ACTIVIDADES/HITOS (Integrada con projects existente)
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
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (deliverable_id) REFERENCES products(id) ON DELETE SET NULL
);

-- 5. EXTENDER USUARIOS (roles de monitoreo)
ALTER TABLE users ADD COLUMN monitoring_role TEXT CHECK(monitoring_role IN ('COORDINATOR', 'EVALUATOR', 'OBSERVER')) DEFAULT NULL;
ALTER TABLE users ADD COLUMN last_login TEXT;
ALTER TABLE users ADD COLUMN notification_preferences TEXT; -- JSON con preferencias

-- 6. TABLA DE MÉTRICAS CALCULADAS (Cache de métricas para performance)
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
    alert_type TEXT CHECK(alert_type IN ('PROJECT_OVERDUE', 'MILESTONE_APPROACHING', 'LOW_PROGRESS', 'BUDGET_ALERT', 'COLLABORATION_REQUEST', 'SYSTEM_UPDATE')) NOT NULL,
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

-- ÍNDICES OPTIMIZADOS
CREATE INDEX IF NOT EXISTS idx_projects_action_line ON projects(action_line_id);
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_projects_risk ON projects(risk_level);
CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON project_milestones(target_date);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_entity ON calculated_metrics(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_calculated_metrics_current ON calculated_metrics(is_current);
CREATE INDEX IF NOT EXISTS idx_alerts_user ON system_alerts(target_user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_unread ON system_alerts(is_read);

-- TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- Trigger: Actualizar progreso de proyecto basado en milestones
CREATE TRIGGER IF NOT EXISTS update_project_progress
AFTER UPDATE OF progress_percentage ON project_milestones
BEGIN
    UPDATE projects 
    SET progress_percentage = (
        SELECT AVG(progress_percentage) 
        FROM project_milestones 
        WHERE project_id = NEW.project_id
    ),
    last_activity_date = datetime('now'),
    updated_at = datetime('now')
    WHERE id = NEW.project_id;
END;

-- Trigger: Generar alertas automáticas por fechas vencidas
CREATE TRIGGER IF NOT EXISTS generate_overdue_alerts
AFTER UPDATE OF status ON project_milestones
WHEN NEW.status = 'OVERDUE' AND OLD.status != 'OVERDUE'
BEGIN
    INSERT OR IGNORE INTO system_alerts (
        alert_type, severity, target_user_id, related_project_id, title, message, action_url
    )
    SELECT 
        'MILESTONE_APPROACHING', 'HIGH', p.owner_id, p.id,
        'Hito Vencido: ' || NEW.name,
        'El hito "' || NEW.name || '" del proyecto "' || p.title || '" ha superado su fecha límite.',
        '/dashboard/projects/' || p.id || '/timeline'
    FROM projects p
    WHERE p.id = NEW.project_id;
END;

-- Trigger: Actualizar métricas de línea de acción cuando cambia un proyecto
CREATE TRIGGER IF NOT EXISTS update_action_line_metrics
AFTER UPDATE OF progress_percentage, status ON projects
WHEN NEW.action_line_id IS NOT NULL
BEGIN
    -- Actualizar métricas de la línea de acción
    INSERT OR REPLACE INTO calculated_metrics (entity_type, entity_id, metric_name, metric_value, is_current)
    VALUES 
    ('ACTION_LINE', NEW.action_line_id, 'total_projects', 
     (SELECT COUNT(*) FROM projects WHERE action_line_id = NEW.action_line_id), 1),
    ('ACTION_LINE', NEW.action_line_id, 'active_projects', 
     (SELECT COUNT(*) FROM projects WHERE action_line_id = NEW.action_line_id AND status = 'ACTIVE'), 1),
    ('ACTION_LINE', NEW.action_line_id, 'avg_progress', 
     (SELECT AVG(progress_percentage) FROM projects WHERE action_line_id = NEW.action_line_id AND status = 'ACTIVE'), 1),
    ('ACTION_LINE', NEW.action_line_id, 'total_products', 
     (SELECT COUNT(DISTINCT prod.id) FROM products prod JOIN projects p ON prod.project_id = p.id WHERE p.action_line_id = NEW.action_line_id), 1);
     
    -- Actualizar fecha de actualización de la línea de acción
    UPDATE action_lines 
    SET updated_at = datetime('now') 
    WHERE id = NEW.action_line_id;
END;

-- DATOS INICIALES - Líneas de Acción para Chocó (Consistente con requerimiento)
INSERT OR REPLACE INTO action_lines (code, name, description, department, priority, start_date, end_date, status, kpi_targets, color_code, icon) VALUES 
('LA001', 'Biodiversidad y Conservación', 'Investigación, conservación y uso sostenible de la biodiversidad chocoana y ecosistemas del Pacífico', 'Chocó CTeI', 5, '2024-01-01', '2026-12-31', 'ACTIVE', 
 '{"projects": 15, "products": 40, "experiences": 20, "communities": 10}', '#10B981', 'fas fa-leaf'),
('LA002', 'Gestión del Agua', 'Investigación y gestión integral del recurso hídrico, calidad del agua y tecnologías de saneamiento', 'Chocó CTeI', 5, '2024-01-01', '2025-12-31', 'ACTIVE', 
 '{"projects": 12, "products": 30, "experiences": 15, "technologies": 8}', '#3B82F6', 'fas fa-tint'),
('LA003', 'Tecnologías Sostenibles', 'Desarrollo de tecnologías apropiadas, energías renovables y soluciones de bajo impacto ambiental', 'Chocó CTeI', 4, '2024-01-01', '2027-12-31', 'ACTIVE', 
 '{"projects": 10, "products": 25, "experiences": 12, "prototypes": 6}', '#8B5CF6', 'fas fa-solar-panel'),
('LA004', 'Fortalecimiento Social', 'Desarrollo comunitario, educación popular, salud intercultural y organización social', 'Chocó CTeI', 4, '2024-01-01', '2026-06-30', 'ACTIVE', 
 '{"projects": 18, "products": 35, "experiences": 25, "communities": 30}', '#F59E0B', 'fas fa-users'),
('LA005', 'Economía Territorial', 'Economía circular, cadenas productivas locales, emprendimiento y desarrollo económico endógeno', 'Chocó CTeI', 3, '2024-06-01', '2026-12-31', 'PLANNING', 
 '{"projects": 8, "products": 20, "experiences": 15, "enterprises": 12}', '#EF4444', 'fas fa-seedling'),
('LA006', 'Patrimonio e Identidad', 'Preservación del patrimonio cultural, saberes ancestrales e identidad afrocolombiana e indígena', 'Chocó CTeI', 3, '2024-01-01', '2025-12-31', 'ACTIVE', 
 '{"projects": 6, "products": 15, "experiences": 18, "archives": 8}', '#EC4899', 'fas fa-landmark');

-- TRIGGER INICIAL: Calcular métricas base para líneas de acción existentes
INSERT OR REPLACE INTO calculated_metrics (entity_type, entity_id, metric_name, metric_value, is_current)
SELECT 'ACTION_LINE', al.id, 'baseline_setup', 1, 1
FROM action_lines al;
```

---

## 🔧 EXTENSIONES A APIs EXISTENTES (NO NUEVAS RUTAS)

### **1. Extender src/routes/admin.ts (Usar rutas existentes)**

```typescript
// EXTENDER ruta existente /admin/projects
adminRoutes.get('/projects', async (c) => {
  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const search = c.req.query('search') || '';
    const is_public = c.req.query('is_public') || '';
    const action_line = c.req.query('action_line') || ''; // NUEVO
    const risk_level = c.req.query('risk_level') || '';   // NUEVO
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.owner_id, p.is_public, 
        p.created_at, p.updated_at, p.status, p.start_date, p.end_date, 
        p.institution, p.funding_source, p.budget, p.project_code,
        -- NUEVOS CAMPOS INTEGRADOS
        p.progress_percentage, p.last_activity_date, p.risk_level,
        p.next_milestone_date, p.next_milestone_description,
        u.full_name as owner_name, u.email as owner_email,
        al.name as action_line_name, al.code as action_line_code, al.color_code as action_line_color,
        COUNT(DISTINCT pm.id) as milestone_count,
        COUNT(DISTINCT CASE WHEN pm.status = 'COMPLETED' THEN pm.id END) as completed_milestones,
        COUNT(DISTINCT prod.id) as product_count
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      LEFT JOIN products prod ON p.id = prod.project_id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    if (search) {
      query += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR u.full_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (is_public !== '') {
      query += ` AND p.is_public = ?`;
      params.push(is_public);
    }

    // NUEVOS FILTROS INTEGRADOS
    if (action_line) {
      query += ` AND p.action_line_id = ?`;
      params.push(action_line);
    }

    if (risk_level) {
      query += ` AND p.risk_level = ?`;
      params.push(risk_level);
    }

    query += ` GROUP BY p.id ORDER BY p.last_activity_date DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const projects = await c.env.DB.prepare(query).bind(...params).all();

    // Contar total (con mismos filtros)
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      WHERE 1=1
    `;
    const countParams: any[] = [];

    if (search) {
      countQuery += ` AND (p.title LIKE ? OR p.abstract LIKE ? OR u.full_name LIKE ?)`;
      const searchTerm = `%${search}%`;
      countParams.push(searchTerm, searchTerm, searchTerm);
    }

    if (is_public !== '') {
      countQuery += ` AND p.is_public = ?`;
      countParams.push(is_public);
    }

    if (action_line) {
      countQuery += ` AND p.action_line_id = ?`;
      countParams.push(action_line);
    }

    if (risk_level) {
      countQuery += ` AND p.risk_level = ?`;
      countParams.push(risk_level);
    }

    const totalResult = await c.env.DB.prepare(countQuery).bind(...countParams).first<{ total: number }>();
    const total = totalResult?.total || 0;
    const totalPages = Math.ceil(total / limit);

    // AÑADIR: Obtener líneas de acción para filtros
    const actionLines = await c.env.DB.prepare(`
      SELECT id, code, name, color_code FROM action_lines ORDER BY priority DESC, name ASC
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        projects: projects.results,
        pagination: {
          current_page: page,
          total_pages: totalPages,
          total_items: total,
          items_per_page: limit
        },
        // NUEVOS DATOS PARA FILTROS
        action_lines: actionLines.results,
        filters: {
          action_line,
          risk_level,
          is_public,
          search
        }
      }
    });

  } catch (error) {
    console.error('Error loading projects:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// NUEVA ruta para dashboard de monitoreo (integrada con datos existentes)
adminRoutes.get('/monitoring/overview', async (c) => {
  try {
    // Métricas generales (usando tablas existentes)
    const systemMetrics = await c.env.DB.prepare(`
      SELECT 
        COUNT(DISTINCT p.id) as total_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'ACTIVE' THEN p.id END) as active_projects,
        COUNT(DISTINCT CASE WHEN p.status = 'COMPLETED' THEN p.id END) as completed_projects,
        COUNT(DISTINCT prod.id) as total_products,
        COUNT(DISTINCT CASE WHEN prod.product_code LIKE '%EXPERIENCE%' THEN prod.id END) as total_experiences,
        COUNT(DISTINCT u.id) as total_researchers,
        AVG(p.progress_percentage) as avg_project_progress,
        COUNT(DISTINCT CASE WHEN p.risk_level IN ('HIGH', 'CRITICAL') THEN p.id END) as high_risk_projects
      FROM projects p
      LEFT JOIN products prod ON p.id = prod.project_id
      LEFT JOIN users u ON p.owner_id = u.id OR EXISTS(
        SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = u.id
      )
    `).first();

    // Métricas por línea de acción (usando calculated_metrics cache)
    const actionLineMetrics = await c.env.DB.prepare(`
      SELECT 
        al.*,
        COALESCE(cm_projects.metric_value, 0) as project_count,
        COALESCE(cm_active.metric_value, 0) as active_projects,
        COALESCE(cm_progress.metric_value, 0) as avg_progress,
        COALESCE(cm_products.metric_value, 0) as product_count
      FROM action_lines al
      LEFT JOIN calculated_metrics cm_projects ON al.id = cm_projects.entity_id 
        AND cm_projects.entity_type = 'ACTION_LINE' AND cm_projects.metric_name = 'total_projects' AND cm_projects.is_current = 1
      LEFT JOIN calculated_metrics cm_active ON al.id = cm_active.entity_id 
        AND cm_active.entity_type = 'ACTION_LINE' AND cm_active.metric_name = 'active_projects' AND cm_active.is_current = 1
      LEFT JOIN calculated_metrics cm_progress ON al.id = cm_progress.entity_id 
        AND cm_progress.entity_type = 'ACTION_LINE' AND cm_progress.metric_name = 'avg_progress' AND cm_progress.is_current = 1
      LEFT JOIN calculated_metrics cm_products ON al.id = cm_products.entity_id 
        AND cm_products.entity_type = 'ACTION_LINE' AND cm_products.metric_name = 'total_products' AND cm_products.is_current = 1
      WHERE al.status = 'ACTIVE'
      ORDER BY al.priority DESC
    `).all();

    // Alertas recientes (usando sistema integrado)
    const recentAlerts = await c.env.DB.prepare(`
      SELECT sa.*, u.full_name as user_name, p.title as project_title
      FROM system_alerts sa
      JOIN users u ON sa.target_user_id = u.id
      LEFT JOIN projects p ON sa.related_project_id = p.id
      WHERE sa.is_resolved = 0
      ORDER BY sa.severity DESC, sa.created_at DESC
      LIMIT 20
    `).all();

    // Proyectos que requieren atención
    const attentionProjects = await c.env.DB.prepare(`
      SELECT p.*, u.full_name as owner_name, al.name as action_line_name,
             COUNT(pm.id) as total_milestones,
             COUNT(CASE WHEN pm.status = 'OVERDUE' THEN 1 END) as overdue_milestones,
             COUNT(CASE WHEN pm.target_date <= date('now', '+7 days') AND pm.status != 'COMPLETED' THEN 1 END) as upcoming_milestones
      FROM projects p
      JOIN users u ON p.owner_id = u.id
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      WHERE p.status = 'ACTIVE' AND (
        p.risk_level IN ('HIGH', 'CRITICAL') OR
        p.progress_percentage < 30 OR
        p.last_activity_date <= date('now', '-30 days')
      )
      GROUP BY p.id
      ORDER BY p.risk_level DESC, overdue_milestones DESC, p.progress_percentage ASC
      LIMIT 15
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        system_metrics: systemMetrics,
        action_line_metrics: actionLineMetrics.results,
        recent_alerts: recentAlerts.results,
        attention_projects: attentionProjects.results,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error loading monitoring overview:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// NUEVA ruta para gestión de líneas de acción
adminRoutes.get('/action-lines', async (c) => {
  try {
    const actionLines = await c.env.DB.prepare(`
      SELECT 
        al.*,
        u.full_name as responsible_name,
        COALESCE(cm_projects.metric_value, 0) as project_count,
        COALESCE(cm_active.metric_value, 0) as active_projects,
        COALESCE(cm_products.metric_value, 0) as product_count,
        COALESCE(cm_progress.metric_value, 0) as avg_progress
      FROM action_lines al
      LEFT JOIN users u ON al.responsible_user_id = u.id
      LEFT JOIN calculated_metrics cm_projects ON al.id = cm_projects.entity_id 
        AND cm_projects.entity_type = 'ACTION_LINE' AND cm_projects.metric_name = 'total_projects' AND cm_projects.is_current = 1
      LEFT JOIN calculated_metrics cm_active ON al.id = cm_active.entity_id 
        AND cm_active.entity_type = 'ACTION_LINE' AND cm_active.metric_name = 'active_projects' AND cm_active.is_current = 1
      LEFT JOIN calculated_metrics cm_products ON al.id = cm_products.entity_id 
        AND cm_products.entity_type = 'ACTION_LINE' AND cm_products.metric_name = 'total_products' AND cm_products.is_current = 1
      LEFT JOIN calculated_metrics cm_progress ON al.id = cm_progress.entity_id 
        AND cm_progress.entity_type = 'ACTION_LINE' AND cm_progress.metric_name = 'avg_progress' AND cm_progress.is_current = 1
      ORDER BY al.priority DESC, al.name ASC
    `).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: actionLines.results
    });

  } catch (error) {
    console.error('Error loading action lines:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});
```

### **2. Extender src/routes/private.ts (Usando rutas existentes)**

```typescript
// EXTENDER ruta existente /me/projects
privateRoutes.get('/projects', async (c) => {
  try {
    const user = c.get('user')!;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.introduction, p.methodology,
        p.owner_id, p.is_public, p.created_at, p.updated_at, p.status, 
        p.start_date, p.end_date, p.institution, p.funding_source, p.budget, p.project_code,
        -- NUEVOS CAMPOS INTEGRADOS
        p.progress_percentage, p.last_activity_date, p.risk_level,
        p.next_milestone_date, p.next_milestone_description,
        al.name as action_line_name, al.code as action_line_code, al.color_code as action_line_color,
        COUNT(DISTINCT pm.id) as milestone_count,
        COUNT(DISTINCT CASE WHEN pm.status = 'COMPLETED' THEN pm.id END) as completed_milestones,
        COUNT(DISTINCT CASE WHEN pm.status = 'OVERDUE' THEN pm.id END) as overdue_milestones,
        COUNT(DISTINCT prod.id) as product_count,
        COUNT(DISTINCT CASE WHEN pc.code LIKE '%EXPERIENCE%' THEN prod.id END) as experience_count
      FROM projects p 
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      LEFT JOIN project_milestones pm ON p.id = pm.project_id
      LEFT JOIN products prod ON p.id = prod.project_id
      LEFT JOIN product_categories pc ON prod.product_code = pc.code
      WHERE (p.owner_id = ? OR EXISTS (
        SELECT 1 FROM project_collaborators pc2 WHERE pc2.project_id = p.id AND pc2.user_id = ?
      ))
    `;
    
    const params: any[] = [user.userId, user.userId];

    if (search) {
      query += ` AND (p.title LIKE ? OR p.abstract LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }
    
    if (status) {
      query += ` AND p.status = ?`;
      params.push(status);
    }
    
    query += ` GROUP BY p.id ORDER BY p.last_activity_date DESC, p.updated_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const projects = await c.env.DB.prepare(query).bind(...params).all();

    // Obtener alertas del usuario relacionadas con sus proyectos
    const userAlerts = await c.env.DB.prepare(`
      SELECT sa.*, p.title as project_title
      FROM system_alerts sa
      LEFT JOIN projects p ON sa.related_project_id = p.id
      WHERE sa.target_user_id = ? AND sa.is_read = 0
      ORDER BY sa.severity DESC, sa.created_at DESC
      LIMIT 10
    `).bind(user.userId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        projects: projects.results,
        user_alerts: userAlerts.results,
        pagination: {
          current_page: page,
          items_per_page: limit
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo proyectos:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// NUEVA ruta: Timeline integrado del proyecto
privateRoutes.get('/projects/:id/timeline', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));

    // Verificar acceso (usando lógica existente)
    const project = await c.env.DB.prepare(`
      SELECT p.*, al.name as action_line_name, al.color_code,
             CASE 
               WHEN p.owner_id = ? THEN 1 
               WHEN EXISTS(SELECT 1 FROM project_collaborators pc WHERE pc.project_id = p.id AND pc.user_id = ?) THEN 1
               ELSE 0 
             END as has_access
      FROM projects p
      LEFT JOIN action_lines al ON p.action_line_id = al.id
      WHERE p.id = ?
    `).bind(user.userId, user.userId, projectId).first<any>();

    if (!project || !project.has_access) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Proyecto no encontrado o sin acceso' 
      }, 404);
    }

    // Obtener milestones del proyecto
    const milestones = await c.env.DB.prepare(`
      SELECT pm.*, 
             prod.description as deliverable_description,
             pc.name as deliverable_category
      FROM project_milestones pm
      LEFT JOIN products prod ON pm.deliverable_id = prod.id
      LEFT JOIN product_categories pc ON prod.product_code = pc.code
      WHERE pm.project_id = ?
      ORDER BY pm.target_date ASC
    `).bind(projectId).all();

    // Obtener productos/experiencias del proyecto
    const products = await c.env.DB.prepare(`
      SELECT prod.*, pc.name as category_name, pc.category_group, pc.impact_weight
      FROM products prod
      JOIN product_categories pc ON prod.product_code = pc.code
      WHERE prod.project_id = ?
      ORDER BY prod.created_at DESC
    `).bind(projectId).all();

    return c.json<APIResponse<any>>({
      success: true,
      data: {
        project,
        milestones: milestones.results,
        products: products.results
      }
    });

  } catch (error) {
    console.error('Error loading project timeline:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// NUEVA ruta: Crear milestone integrado con productos
privateRoutes.post('/projects/:id/milestones', async (c) => {
  try {
    const user = c.get('user')!;
    const projectId = parseInt(c.req.param('id'));
    const data = await c.req.json();

    // Verificar acceso de edición (usando lógica existente)
    const hasAccess = await c.env.DB.prepare(`
      SELECT 1 FROM projects p
      LEFT JOIN project_collaborators pc ON p.id = pc.project_id
      WHERE p.id = ? AND (p.owner_id = ? OR (pc.user_id = ? AND pc.can_edit_project = 1))
    `).bind(projectId, user.userId, user.userId).first();

    if (!hasAccess) {
      return c.json<APIResponse>({ 
        success: false, 
        error: 'Sin permisos para editar este proyecto' 
      }, 403);
    }

    const { name, description, target_date, priority = 3, deliverable_type, deliverable_id } = data;

    const result = await c.env.DB.prepare(`
      INSERT INTO project_milestones 
      (project_id, name, description, target_date, priority, deliverable_type, deliverable_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(projectId, name, description, target_date, priority, deliverable_type, deliverable_id).run();

    // Actualizar next_milestone en el proyecto si es el más próximo
    await c.env.DB.prepare(`
      UPDATE projects 
      SET next_milestone_date = ?,
          next_milestone_description = ?,
          updated_at = datetime('now')
      WHERE id = ? AND (next_milestone_date IS NULL OR next_milestone_date > ?)
    `).bind(target_date, name, projectId, target_date).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: { id: result.meta.last_row_id, ...data }
    });

  } catch (error) {
    console.error('Error creating milestone:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});

// NUEVA ruta: Marcar alerta como leída (integrado con usuarios)
privateRoutes.put('/alerts/:id/read', async (c) => {
  try {
    const user = c.get('user')!;
    const alertId = parseInt(c.req.param('id'));

    await c.env.DB.prepare(`
      UPDATE system_alerts 
      SET is_read = 1, read_at = datetime('now')
      WHERE id = ? AND target_user_id = ?
    `).bind(alertId, user.userId).run();

    return c.json<APIResponse<any>>({
      success: true,
      data: { message: 'Alerta marcada como leída' }
    });

  } catch (error) {
    console.error('Error marking alert as read:', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: 'Error interno del servidor' 
    }, 500);
  }
});
```

---

## 🎨 EXTENSIONES AL FRONTEND EXISTENTE

### **1. Extender public/static/dashboard.js (NO crear nuevo archivo)**

```javascript
// AÑADIR AL FINAL DEL ARCHIVO EXISTENTE dashboard.js

// ===== EXTENSIONES DE MONITOREO INTEGRADO =====

// Extender función existente loadUserProjects para incluir nuevos datos
async function loadUserProjectsEnhanced(page = 1) {
    const container = document.getElementById('projectsContainer');
    const paginationContainer = document.getElementById('projectsPagination');
    
    try {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '6'
        });

        const response = await axios.get(`${API_BASE}/me/projects?${params.toString()}`);
        
        if (response.data.success) {
            const { projects, user_alerts } = response.data.data;
            
            // Renderizar proyectos con información de monitoreo
            renderEnhancedProjectsGrid(projects);
            
            // Mostrar alertas del usuario si existen
            if (user_alerts && user_alerts.length > 0) {
                showUserAlerts(user_alerts);
            }

        } else {
            throw new Error(response.data.error || 'Error al cargar proyectos');
        }
        
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
                <p class="text-destructive">Error al cargar proyectos</p>
                <button 
                    onclick="loadUserProjectsEnhanced()" 
                    class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                >
                    <i class="fas fa-retry mr-2"></i>
                    Reintentar
                </button>
            </div>
        `;
    }
}

// Nueva función: Renderizar proyectos con información de monitoreo
function renderEnhancedProjectsGrid(projects) {
    const container = document.getElementById('projectsContainer');
    
    if (projects.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-8">
                <i class="fas fa-project-diagram text-4xl text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground mb-4">Aún no tienes proyectos</p>
                <button 
                    onclick="showCreateProjectModal()" 
                    class="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Crear Primer Proyecto
                </button>
            </div>
        `;
        return;
    }

    let html = '';
    projects.forEach(project => {
        // Determinar estado de riesgo
        const riskConfig = {
            'LOW': { color: 'green', icon: 'fas fa-shield-alt', label: 'Bajo Riesgo' },
            'MEDIUM': { color: 'yellow', icon: 'fas fa-exclamation-triangle', label: 'Riesgo Medio' },
            'HIGH': { color: 'orange', icon: 'fas fa-exclamation-triangle', label: 'Alto Riesgo' },
            'CRITICAL': { color: 'red', icon: 'fas fa-skull-crossbones', label: 'Riesgo Crítico' }
        };
        
        const risk = riskConfig[project.risk_level] || riskConfig.LOW;
        const progress = project.progress_percentage || 0;
        const isOverdue = project.overdue_milestones > 0;
        
        // Estado del proyecto
        const statusConfig = {
            'DRAFT': { color: 'bg-muted text-muted-foreground', icon: 'fas fa-edit', label: 'Borrador' },
            'ACTIVE': { color: 'bg-primary text-primary-foreground', icon: 'fas fa-play', label: 'Activo' },
            'REVIEW': { color: 'bg-accent text-accent-foreground', icon: 'fas fa-eye', label: 'En Revisión' },
            'COMPLETED': { color: 'bg-chart-1 text-white', icon: 'fas fa-check', label: 'Completado' },
            'SUSPENDED': { color: 'bg-destructive text-destructive-foreground', icon: 'fas fa-pause', label: 'Suspendido' }
        };
        
        const status = statusConfig[project.status] || statusConfig.DRAFT;
        
        html += `
            <div class="bg-card rounded-lg shadow-lg border border-border p-6 hover:shadow-xl transition-all duration-200">
                <!-- Header con línea de acción -->
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold mb-2 line-clamp-2">${project.title}</h3>
                        ${project.action_line_name ? `
                            <div class="flex items-center mb-2">
                                <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${project.action_line_color};"></div>
                                <span class="text-sm text-muted-foreground">${project.action_line_name}</span>
                            </div>
                        ` : ''}
                        <span class="px-2 py-1 rounded text-xs font-medium ${status.color}">
                            <i class="${status.icon} mr-1"></i>
                            ${status.label}
                        </span>
                    </div>
                    <div class="flex flex-col items-end space-y-1">
                        <span class="px-2 py-1 rounded-full text-xs bg-${risk.color}-100 text-${risk.color}-700">
                            <i class="${risk.icon} mr-1"></i>
                            ${risk.label}
                        </span>
                        ${isOverdue ? `
                            <span class="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">
                                <i class="fas fa-clock mr-1"></i>
                                Vencido
                            </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Progreso -->
                <div class="mb-4">
                    <div class="flex justify-between text-sm mb-1">
                        <span>Progreso</span>
                        <span>${progress.toFixed(1)}%</span>
                    </div>
                    <div class="w-full bg-muted rounded-full h-2">
                        <div class="h-2 rounded-full transition-all duration-300 ${
                            progress >= 80 ? 'bg-green-500' : 
                            progress >= 50 ? 'bg-blue-500' : 
                            progress >= 20 ? 'bg-yellow-500' : 'bg-red-500'
                        }" style="width: ${progress}%;"></div>
                    </div>
                </div>

                <!-- Métricas -->
                <div class="grid grid-cols-3 gap-3 mb-4 text-center">
                    <div class="bg-muted/50 rounded p-2">
                        <div class="text-sm font-semibold">${project.milestone_count || 0}</div>
                        <div class="text-xs text-muted-foreground">Hitos</div>
                    </div>
                    <div class="bg-muted/50 rounded p-2">
                        <div class="text-sm font-semibold">${project.product_count || 0}</div>
                        <div class="text-xs text-muted-foreground">Productos</div>
                    </div>
                    <div class="bg-muted/50 rounded p-2">
                        <div class="text-sm font-semibold">${project.experience_count || 0}</div>
                        <div class="text-xs text-muted-foreground">Experiencias</div>
                    </div>
                </div>

                <!-- Próximo hito -->
                ${project.next_milestone_date ? `
                    <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                        <div class="text-xs text-blue-600 font-medium mb-1">Próximo Hito</div>
                        <div class="text-sm text-blue-800">${project.next_milestone_description}</div>
                        <div class="text-xs text-blue-600 mt-1">
                            <i class="fas fa-calendar mr-1"></i>
                            ${formatDate(project.next_milestone_date)}
                        </div>
                    </div>
                ` : ''}

                <!-- Acciones -->
                <div class="flex space-x-2">
                    <button 
                        onclick="viewProjectTimeline(${project.id})" 
                        class="flex-1 bg-primary text-primary-foreground px-3 py-2 rounded text-sm hover:opacity-90"
                        title="Ver timeline del proyecto"
                    >
                        <i class="fas fa-timeline mr-1"></i>
                        Timeline
                    </button>
                    <button 
                        onclick="viewProject(${project.id})" 
                        class="px-3 py-2 bg-secondary text-secondary-foreground rounded text-sm hover:opacity-90"
                        title="Ver detalles"
                    >
                        <i class="fas fa-eye"></i>
                    </button>
                    <button 
                        onclick="editProject(${project.id})" 
                        class="px-3 py-2 bg-accent text-accent-foreground rounded text-sm hover:opacity-90"
                        title="Editar proyecto"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Nueva función: Mostrar alertas del usuario
function showUserAlerts(alerts) {
    // Crear contenedor de alertas si no existe
    let alertContainer = document.getElementById('userAlertsContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'userAlertsContainer';
        alertContainer.className = 'mb-6';
        
        // Insertar antes del contenedor de proyectos
        const projectsSection = document.querySelector('[data-section="projects"]');
        if (projectsSection) {
            projectsSection.parentNode.insertBefore(alertContainer, projectsSection);
        }
    }

    let html = `
        <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div class="flex items-center mb-3">
                <i class="fas fa-bell text-yellow-600 mr-2"></i>
                <h3 class="font-semibold text-yellow-800">Alertas Pendientes (${alerts.length})</h3>
                <button onclick="dismissAllAlerts()" class="ml-auto text-yellow-600 hover:text-yellow-800">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="space-y-2">
    `;

    alerts.slice(0, 5).forEach(alert => {
        const severityConfig = {
            'LOW': 'text-blue-700 bg-blue-100',
            'MEDIUM': 'text-yellow-700 bg-yellow-100',
            'HIGH': 'text-orange-700 bg-orange-100',
            'CRITICAL': 'text-red-700 bg-red-100'
        };

        const severityClass = severityConfig[alert.severity] || severityConfig.MEDIUM;

        html += `
            <div class="flex items-start justify-between p-3 bg-white rounded border">
                <div class="flex-1">
                    <div class="flex items-center mb-1">
                        <span class="px-2 py-1 rounded text-xs font-medium ${severityClass}">
                            ${alert.severity}
                        </span>
                        ${alert.project_title ? `
                            <span class="ml-2 text-sm text-muted-foreground">${alert.project_title}</span>
                        ` : ''}
                    </div>
                    <h4 class="font-medium text-sm">${alert.title}</h4>
                    <p class="text-sm text-muted-foreground">${alert.message}</p>
                </div>
                <div class="flex space-x-1 ml-3">
                    ${alert.action_url ? `
                        <a href="${alert.action_url}" class="text-blue-600 hover:text-blue-800">
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                    ` : ''}
                    <button onclick="markAlertAsRead(${alert.id})" class="text-gray-600 hover:text-gray-800">
                        <i class="fas fa-check"></i>
                    </button>
                </div>
            </div>
        `;
    });

    html += `
            </div>
            ${alerts.length > 5 ? `
                <div class="mt-3 text-center">
                    <button onclick="showAllAlerts()" class="text-yellow-700 hover:text-yellow-900 text-sm">
                        Ver todas las alertas (${alerts.length})
                    </button>
                </div>
            ` : ''}
        </div>
    `;

    alertContainer.innerHTML = html;
}

// Nueva función: Ver timeline del proyecto
async function viewProjectTimeline(projectId) {
    try {
        const response = await axios.get(`${API_BASE}/me/projects/${projectId}/timeline`);
        
        if (response.data.success) {
            const { project, milestones, products } = response.data.data;
            showProjectTimelineModal(project, milestones, products);
        } else {
            showToast('Error al cargar timeline del proyecto', 'error');
        }
    } catch (error) {
        console.error('Error loading project timeline:', error);
        showToast('Error al cargar timeline del proyecto', 'error');
    }
}

// Nueva función: Modal de timeline del proyecto
function showProjectTimelineModal(project, milestones, products) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Separar productos por categoría
    const productsByCategory = {};
    products.forEach(product => {
        const group = product.category_group || 'OTHER';
        if (!productsByCategory[group]) productsByCategory[group] = [];
        productsByCategory[group].push(product);
    });
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <!-- Header -->
            <div class="p-6 border-b border-border">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold mb-2">${project.title}</h3>
                        ${project.action_line_name ? `
                            <div class="flex items-center mb-2">
                                <div class="w-3 h-3 rounded-full mr-2" style="background-color: ${project.color_code};"></div>
                                <span class="text-sm text-muted-foreground">${project.action_line_name}</span>
                            </div>
                        ` : ''}
                        <div class="flex items-center space-x-4">
                            <span class="text-sm">
                                <strong>Progreso:</strong> ${project.progress_percentage || 0}%
                            </span>
                            <span class="text-sm">
                                <strong>Riesgo:</strong> ${project.risk_level || 'BAJO'}
                            </span>
                        </div>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <!-- Hitos -->
                    <div>
                        <h4 class="text-lg font-semibold mb-4">
                            <i class="fas fa-flag-checkered mr-2 text-primary"></i>
                            Hitos del Proyecto
                        </h4>
                        ${milestones.length > 0 ? `
                            <div class="space-y-3">
                                ${milestones.map(milestone => `
                                    <div class="border border-border rounded-lg p-4 ${
                                        milestone.status === 'COMPLETED' ? 'bg-green-50 border-green-200' :
                                        milestone.status === 'OVERDUE' ? 'bg-red-50 border-red-200' :
                                        'bg-card'
                                    }">
                                        <div class="flex justify-between items-start mb-2">
                                            <h5 class="font-medium">${milestone.name}</h5>
                                            <span class="px-2 py-1 rounded text-xs ${
                                                milestone.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                milestone.status === 'OVERDUE' ? 'bg-red-100 text-red-700' :
                                                milestone.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }">
                                                ${milestone.status}
                                            </span>
                                        </div>
                                        ${milestone.description ? `
                                            <p class="text-sm text-muted-foreground mb-2">${milestone.description}</p>
                                        ` : ''}
                                        <div class="text-xs text-muted-foreground">
                                            <i class="fas fa-calendar mr-1"></i>
                                            Meta: ${formatDate(milestone.target_date)}
                                            ${milestone.completed_date ? ` | Completado: ${formatDate(milestone.completed_date)}` : ''}
                                        </div>
                                        ${milestone.deliverable_description ? `
                                            <div class="mt-2 p-2 bg-muted/50 rounded text-sm">
                                                <strong>Entregable:</strong> ${milestone.deliverable_description}
                                                ${milestone.deliverable_category ? ` (${milestone.deliverable_category})` : ''}
                                            </div>
                                        ` : ''}
                                        <!-- Barra de progreso -->
                                        <div class="mt-3">
                                            <div class="flex justify-between text-xs mb-1">
                                                <span>Progreso</span>
                                                <span>${milestone.progress_percentage || 0}%</span>
                                            </div>
                                            <div class="w-full bg-muted rounded-full h-1.5">
                                                <div class="h-1.5 rounded-full ${
                                                    milestone.status === 'COMPLETED' ? 'bg-green-500' :
                                                    milestone.status === 'OVERDUE' ? 'bg-red-500' :
                                                    'bg-blue-500'
                                                }" style="width: ${milestone.progress_percentage || 0}%;"></div>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="text-center py-8 text-muted-foreground">
                                <i class="fas fa-flag text-4xl mb-4"></i>
                                <p>No hay hitos definidos</p>
                                <button onclick="createMilestone(${project.id})" class="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded">
                                    Crear Primer Hito
                                </button>
                            </div>
                        `}
                    </div>
                    
                    <!-- Productos y Experiencias -->
                    <div>
                        <h4 class="text-lg font-semibold mb-4">
                            <i class="fas fa-cubes mr-2 text-accent"></i>
                            Productos y Experiencias
                        </h4>
                        ${Object.keys(productsByCategory).length > 0 ? `
                            <div class="space-y-4">
                                ${Object.entries(productsByCategory).map(([category, categoryProducts]) => `
                                    <div class="border border-border rounded-lg p-4">
                                        <h5 class="font-medium mb-3 text-primary">
                                            ${category === 'EXPERIENCE' ? 'Experiencias' : 
                                              category === 'PUBLICATION' ? 'Publicaciones' :
                                              category === 'SOFTWARE' ? 'Software' :
                                              category === 'PATENT' ? 'Propiedad Intelectual' :
                                              category === 'DATABASE' ? 'Datos y Colecciones' :
                                              category === 'TRAINING' ? 'Formación' :
                                              'Otros Productos'} (${categoryProducts.length})
                                        </h5>
                                        <div class="space-y-2">
                                            ${categoryProducts.map(product => `
                                                <div class="bg-muted/50 rounded p-3">
                                                    <div class="flex justify-between items-start mb-1">
                                                        <span class="font-medium text-sm">${product.category_name}</span>
                                                        <span class="px-2 py-1 rounded text-xs bg-primary/10 text-primary">
                                                            Peso: ${product.impact_weight}
                                                        </span>
                                                    </div>
                                                    <p class="text-sm text-muted-foreground">${product.description}</p>
                                                    <div class="text-xs text-muted-foreground mt-1">
                                                        <i class="fas fa-calendar mr-1"></i>
                                                        ${formatDate(product.created_at)}
                                                    </div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="text-center py-8 text-muted-foreground">
                                <i class="fas fa-cubes text-4xl mb-4"></i>
                                <p>No hay productos registrados</p>
                                <button onclick="createProduct(${project.id})" class="mt-2 bg-accent text-accent-foreground px-4 py-2 rounded">
                                    Agregar Producto
                                </button>
                            </div>
                        `}
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="p-6 border-t border-border">
                <div class="flex justify-between items-center">
                    <div class="text-sm text-muted-foreground">
                        Última actualización: ${formatDate(project.last_activity_date || project.updated_at)}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="createMilestone(${project.id})" class="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:opacity-90">
                            <i class="fas fa-plus mr-1"></i>
                            Nuevo Hito
                        </button>
                        <button onclick="editProject(${project.id})" class="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
                            <i class="fas fa-edit mr-1"></i>
                            Editar Proyecto
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Nueva función: Marcar alerta como leída
async function markAlertAsRead(alertId) {
    try {
        await axios.put(`${API_BASE}/me/alerts/${alertId}/read`);
        
        // Recargar alertas
        loadUserProjectsEnhanced();
        showToast('Alerta marcada como leída', 'success');
        
    } catch (error) {
        console.error('Error marking alert as read:', error);
        showToast('Error al marcar alerta como leída', 'error');
    }
}

// Reemplazar la función loadUserProjects existente
if (typeof loadUserProjects === 'function') {
    loadUserProjects = loadUserProjectsEnhanced;
}

// Inicializar extensiones al cargar el dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Solo ejecutar si estamos en el dashboard de usuario
    if (window.location.pathname === '/dashboard' && document.getElementById('projectsContainer')) {
        // Reemplazar carga de proyectos con versión mejorada
        loadUserProjectsEnhanced();
    }
});
```

---

## 📋 CÓMO PROCEDER CON LA FASE 1

### **🎯 PASOS DE IMPLEMENTACIÓN PROGRESIVA:**

#### **PASO 1: Preparación (1-2 horas)**
1. ✅ **Backup de la base de datos actual**
2. ✅ **Commit del código actual a git**
3. ✅ **Crear migración 0005_strategic_monitoring_integration.sql**

#### **PASO 2: Base de Datos (2-3 horas)**
1. ✅ **Ejecutar migración en desarrollo local**
2. ✅ **Verificar integridad de datos existentes**
3. ✅ **Probar triggers y relaciones**
4. ✅ **Poblar datos de líneas de acción para Chocó**

#### **PASO 3: Backend APIs (4-6 horas)**
1. ✅ **Extender rutas admin.ts existentes** (no crear nuevas)
2. ✅ **Extender rutas private.ts existentes** (no crear nuevas)
3. ✅ **Probar endpoints con Postman/curl**
4. ✅ **Verificar autenticación y permisos**

#### **PASO 4: Frontend Integration (4-6 horas)**
1. ✅ **Extender dashboard.js existente** (no crear nuevo archivo)
2. ✅ **Integrar con APIs extendidas**
3. ✅ **Probar flujos de usuario**
4. ✅ **Verificar responsive design**

#### **PASO 5: Testing y Ajustes (2-3 horas)**
1. ✅ **Testing completo de funcionalidades**
2. ✅ **Ajustes de UX y performance**
3. ✅ **Commit final y documentación**

### **✅ VENTAJAS DE ESTA APROXIMACIÓN:**

1. **🔄 INTEGRACIÓN ORGÁNICA:**
   - Usa estructuras existentes (proyectos, productos, usuarios)
   - No rompe funcionalidad actual
   - Extiende sin duplicar

2. **📊 CONSISTENCIA ARQUITECTURAL:**
   - Mismo patrón de base de datos
   - Mismas convenciones de API
   - Mismo design system frontend

3. **🎯 EXPERIENCIAS COMO PRODUCTOS:**
   - Nueva categoría 'EXPERIENCE' en product_categories
   - Usa misma estructura de divulgación
   - Aprovecha sistema de metadatos existente

4. **⚡ IMPLEMENTACIÓN RÁPIDA:**
   - Extiende funcionalidad existente
   - No requiere refactoring mayor
   - Aprovecha código y UI existente

### **🚀 RESULTADO ESPERADO:**

Al completar la Fase 1, la plataforma tendrá:

- ✅ **Sistema de líneas de acción** integrado con proyectos existentes
- ✅ **Monitoreo en tiempo real** usando estructuras actuales  
- ✅ **Dashboard mejorado** con información de seguimiento
- ✅ **Experiencias documentadas** como productos CTeI
- ✅ **Sistema de alertas** integrado con usuarios actuales
- ✅ **Timeline de proyectos** con hitos y progreso

**¿Te parece bien proceder con esta aproximación integrada? ¿Quieres que comience con algún paso específico?**

<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"id": "1", "priority": "high", "content": "Revisar Fase 1 para integraci\u00f3n con estructuras existentes", "status": "completed"}, {"id": "2", "priority": "high", "content": "Ajustar arquitectura para usar proyectos/productos/usuarios existentes", "status": "completed"}, {"id": "3", "priority": "high", "content": "Implementar categor\u00eda 'experiencias' en productos existentes", "status": "completed"}, {"id": "4", "priority": "medium", "content": "Definir plan de implementaci\u00f3n progresivo", "status": "completed"}]