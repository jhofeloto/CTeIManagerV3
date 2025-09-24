-- Migración 0012: Actualizar líneas de acción por defecto y asignar a proyectos existentes
-- Corrige los nombres de las líneas de acción según especificaciones del usuario

-- Actualizar las líneas de acción existentes con los nombres correctos
UPDATE action_lines SET
    name = 'Mentalidad y cultura innovadora',
    description = 'Fomentar una mentalidad innovadora y cultura emprendedora en la región',
    code = 'MENTALIDAD_CULTURA_INNOVADORA'
WHERE name = 'Mentalidad y Cultura';

UPDATE action_lines SET
    name = 'Servicios de apoyo',
    description = 'Proporcionar servicios de incubación y apoyo empresarial a emprendedores',
    code = 'SERVICIOS_APOYO'
WHERE name = 'Servicios de Apoyo';

UPDATE action_lines SET
    name = 'Instrumentos de financiación',
    description = 'Facilitar el acceso a instrumentos financieros para proyectos innovadores',
    code = 'INSTRUMENTOS_FINANCIACION'
WHERE name = 'Financiación';

UPDATE action_lines SET
    name = 'Expansión de mercados',
    description = 'Apoyar la expansión de mercados nacionales e internacionales',
    code = 'EXPANSION_MERCADOS'
WHERE name = 'Expansión Mercados';

UPDATE action_lines SET
    name = 'Oportunidades e inversión',
    description = 'Atraer oportunidades de inversión y capital para la economía local',
    code = 'OPORTUNIDADES_INVERSION'
WHERE name = 'Fomento Inversión' OR name = 'Fomento de la Inversión';

-- Asignar líneas de acción a los proyectos existentes
-- Asignar al menos una línea de acción a cada proyecto generado
UPDATE projects SET action_line_id = 1 WHERE id = 1; -- EcoMar 4.0 -> Mentalidad y cultura innovadora
UPDATE projects SET action_line_id = 2 WHERE id = 2; -- InnovaAgro -> Servicios de apoyo
UPDATE projects SET action_line_id = 3 WHERE id = 3; -- Proyecto Interno -> Instrumentos de financiación

-- Crear índices adicionales si no existen
CREATE INDEX IF NOT EXISTS idx_projects_action_line_id ON projects(action_line_id);