-- Migración 0011: Campos adicionales para proyectos
-- Agrega campos adicionales para mejorar la estructura de datos de proyectos

-- Agregar campos adicionales a la tabla projects
ALTER TABLE projects ADD COLUMN objectives TEXT;
ALTER TABLE projects ADD COLUMN expected_results TEXT;
ALTER TABLE projects ADD COLUMN budget_breakdown TEXT;
ALTER TABLE projects ADD COLUMN team TEXT;
ALTER TABLE projects ADD COLUMN expected_impact TEXT;
ALTER TABLE projects ADD COLUMN sustainability TEXT;

-- Crear índices para los nuevos campos de texto largo (opcional, para optimización)
CREATE INDEX IF NOT EXISTS idx_projects_objectives ON projects(objectives) WHERE objectives IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_expected_impact ON projects(expected_impact) WHERE expected_impact IS NOT NULL;