-- Migración 0013: Agregar columnas faltantes a tabla projects
-- Fecha: 2025-09-25
-- Descripción: Agregar columnas progress_percentage, last_activity_date, risk_level,
--              next_milestone_date y next_milestone_description a la tabla projects

-- Agregar columnas faltantes a la tabla projects (sin valores por defecto no constantes)
ALTER TABLE projects ADD COLUMN progress_percentage DECIMAL(5,2);
ALTER TABLE projects ADD COLUMN last_activity_date TEXT;
ALTER TABLE projects ADD COLUMN risk_level TEXT;
ALTER TABLE projects ADD COLUMN next_milestone_date TEXT;
ALTER TABLE projects ADD COLUMN next_milestone_description TEXT;

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_projects_progress ON projects(progress_percentage);
CREATE INDEX IF NOT EXISTS idx_projects_risk ON projects(risk_level);
CREATE INDEX IF NOT EXISTS idx_projects_last_activity ON projects(last_activity_date);

-- Actualizar proyectos existentes con valores por defecto
UPDATE projects SET
    progress_percentage = 0.0,
    last_activity_date = datetime('now'),
    risk_level = 'LOW'
WHERE progress_percentage IS NULL;

-- Crear tabla project_milestones si no existe (para compatibilidad con código existente)
CREATE TABLE IF NOT EXISTS project_milestones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    target_date TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING',
    completion_date TEXT,
    progress_percentage DECIMAL(5,2) DEFAULT 0.0,
    created_at TEXT,
    updated_at TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Crear índices para project_milestones
CREATE INDEX IF NOT EXISTS idx_milestones_project ON project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_milestones_status ON project_milestones(status);
CREATE INDEX IF NOT EXISTS idx_milestones_target_date ON project_milestones(target_date);

-- Agregar constraint CHECK después de crear la tabla (SQLite no permite CHECK en ALTER TABLE)
-- Nota: Esta restricción se debe agregar manualmente si es necesaria