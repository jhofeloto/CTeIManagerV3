-- Migración 0012: Añadir líneas de acción por defecto
-- Fecha: 2024-09-25
-- Descripción: Crear tabla de líneas de acción e insertar valores por defecto

-- Crear tabla de líneas de acción
CREATE TABLE IF NOT EXISTS action_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'fas fa-road',
    color TEXT DEFAULT '#3B82F6',
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Crear tabla de relación proyecto-líneas de acción
CREATE TABLE IF NOT EXISTS project_action_lines (
    project_id INTEGER NOT NULL,
    action_line_id INTEGER NOT NULL,
    assigned_by INTEGER,
    assigned_at TEXT DEFAULT (datetime('now')),
    status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED')),
    PRIMARY KEY (project_id, action_line_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (action_line_id) REFERENCES action_lines(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

-- Insertar líneas de acción por defecto
INSERT OR IGNORE INTO action_lines (name, description, icon, color, display_order) VALUES
('Mentalidad y cultura innovadora', 'Fomentar una cultura organizacional que promueva la innovación, el emprendimiento y la creatividad en todos los niveles de la organización.', 'fas fa-brain', '#8B5CF6', 1),
('Servicios de apoyo', 'Desarrollar servicios de apoyo técnico, financiero y administrativo para facilitar el desarrollo de proyectos de innovación.', 'fas fa-handshake', '#10B981', 2),
('Instrumentos de financiación', 'Crear y gestionar instrumentos financieros específicos para proyectos de ciencia, tecnología e innovación.', 'fas fa-coins', '#F59E0B', 3),
('Expansión de mercados', 'Apoyar la internacionalización y expansión de mercados para productos y servicios innovadores colombianos.', 'fas fa-globe', '#3B82F6', 4),
('Oportunidades e inversión', 'Identificar y promover oportunidades de inversión en proyectos de alto impacto científico y tecnológico.', 'fas fa-chart-line', '#EF4444', 5);

-- Asignar líneas de acción a proyectos existentes (al menos una por proyecto)
INSERT OR IGNORE INTO project_action_lines (project_id, action_line_id, assigned_by, status)
SELECT
    p.id as project_id,
    al.id as action_line_id,
    1 as assigned_by, -- Admin user
    CASE WHEN (p.id % 5) = 0 THEN 'COMPLETED'
         WHEN (p.id % 3) = 0 THEN 'IN_PROGRESS'
         ELSE 'PENDING' END as status
FROM projects p
CROSS JOIN action_lines al
WHERE al.id <= (p.id % 5) + 1; -- Al menos 1 línea por proyecto, hasta 5 máximo

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_action_lines_active ON action_lines(is_active);
CREATE INDEX IF NOT EXISTS idx_project_action_lines_status ON project_action_lines(status);
CREATE INDEX IF NOT EXISTS idx_project_action_lines_project ON project_action_lines(project_id);