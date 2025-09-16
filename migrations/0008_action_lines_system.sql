-- Migración 0008: Sistema de Líneas de Acción
-- Crear tabla para gestionar líneas de acción estratégicas

-- Tabla principal de líneas de acción
CREATE TABLE IF NOT EXISTS action_lines (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT DEFAULT 'fas fa-cog',
    color TEXT DEFAULT '#3B82F6',
    is_active INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Agregar campo action_line_id a la tabla projects
ALTER TABLE projects ADD COLUMN action_line_id INTEGER REFERENCES action_lines(id);

-- Insertar líneas de acción predefinidas
INSERT INTO action_lines (name, description, icon, color, display_order) VALUES 
('Mentalidad y Cultura', 'Fomentar cultura de emprendimiento e innovación', 'fas fa-brain', '#8B5CF6', 1),
('Servicios de Apoyo', 'Incubadoras y asistencia empresarial', 'fas fa-handshake', '#10B981', 2),
('Financiación', 'Acceso a recursos para proyectos innovadores', 'fas fa-coins', '#F59E0B', 3),
('Expansión Mercados', 'Acceso a mercados nacionales e internacionales', 'fas fa-globe', '#06B6D4', 4),
('Fomento Inversión', 'Atracción de capital para la economía local', 'fas fa-chart-line', '#EF4444', 5);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_action_lines_active ON action_lines(is_active);
CREATE INDEX IF NOT EXISTS idx_action_lines_order ON action_lines(display_order);
CREATE INDEX IF NOT EXISTS idx_projects_action_line ON projects(action_line_id);