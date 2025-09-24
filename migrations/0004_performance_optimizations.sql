-- CODECTI Platform - Performance Optimizations
-- Índices adicionales y optimizaciones para consultas comunes

-- Índices compuestos para consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_projects_status_created_at ON projects(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_created_by_status ON projects(created_by, status);
CREATE INDEX IF NOT EXISTS idx_projects_title_status ON projects(title, status);
CREATE INDEX IF NOT EXISTS idx_projects_responsible_person ON projects(responsible_person);

-- Índices para búsquedas de texto completo (si SQLite soporta FTS)
-- Para búsquedas más eficientes en títulos y resúmenes
CREATE INDEX IF NOT EXISTS idx_projects_search_content ON projects(title, summary, responsible_person);

-- Índices para usuarios activos
CREATE INDEX IF NOT EXISTS idx_users_active_email ON users(is_active, email);
CREATE INDEX IF NOT EXISTS idx_users_active_role ON users(is_active, role);

-- Índices para sesiones activas
CREATE INDEX IF NOT EXISTS idx_sessions_active_user ON sessions(user_id, expires_at) WHERE expires_at > datetime('now');

-- Índices para búsquedas por fecha
CREATE INDEX IF NOT EXISTS idx_projects_date_range ON projects(created_at, updated_at);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Optimización: Agregar columnas calculadas para búsquedas
-- Nota: SQLite no soporta columnas calculadas nativas, pero podemos usar vistas

-- Vista para estadísticas rápidas de proyectos
CREATE VIEW IF NOT EXISTS projects_stats AS
SELECT
    status,
    COUNT(*) as count,
    COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as last_30_days,
    COUNT(CASE WHEN created_at >= datetime('now', '-7 days') THEN 1 END) as last_7_days
FROM projects
GROUP BY status;

-- Vista para estadísticas de usuarios
CREATE VIEW IF NOT EXISTS users_stats AS
SELECT
    role,
    is_active,
    COUNT(*) as count,
    COUNT(CASE WHEN created_at >= datetime('now', '-30 days') THEN 1 END) as new_last_30_days
FROM users
GROUP BY role, is_active;

-- Índices para mejorar el rendimiento de JOINs complejas
-- (Para consultas que unen proyectos con usuarios)
CREATE INDEX IF NOT EXISTS idx_users_id_name ON users(id, name, institution);

-- Optimización: Agregar constraints para integridad de datos
-- Asegurar que los documentos no se dupliquen innecesariamente
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_document_url ON projects(document_url) WHERE document_url IS NOT NULL;

-- Índices para búsquedas por institución (si se agrega campo institution a projects)
-- Nota: Esto se puede agregar cuando se implemente el campo institution en projects
-- CREATE INDEX IF NOT EXISTS idx_projects_institution ON projects(institution);

-- Optimización: Índices parciales para consultas específicas
-- Para consultas que filtran por estado activo
CREATE INDEX IF NOT EXISTS idx_projects_active_recent ON projects(created_at DESC) WHERE status = 'active';

-- Para consultas que buscan proyectos completados en un rango de fechas
CREATE INDEX IF NOT EXISTS idx_projects_completed_dates ON projects(created_at, updated_at) WHERE status = 'completed';

-- Optimización: Preparar para búsquedas de texto completo
-- Crear tabla virtual FTS si es necesario (requiere FTS5)
-- CREATE VIRTUAL TABLE IF NOT EXISTS projects_fts USING fts5(title, summary, responsible_person, content=projects, content_rowid=id);

-- Índices para mejorar el rendimiento de agregaciones
-- Para consultas que cuentan proyectos por usuario
CREATE INDEX IF NOT EXISTS idx_projects_created_by_date ON projects(created_by, created_at);

-- Para consultas que filtran por múltiples criterios
CREATE INDEX IF NOT EXISTS idx_projects_composite_search ON projects(status, created_by, created_at);

-- Optimización: Configurar SQLite para mejor rendimiento
PRAGMA journal_mode = WAL;  -- Write-Ahead Logging para mejor concurrencia
PRAGMA synchronous = NORMAL; -- Balance entre rendimiento y seguridad
PRAGMA cache_size = -64000;  -- 64MB de cache (ajustar según necesidades)
PRAGMA temp_store = MEMORY;  -- Almacenar tablas temporales en memoria
PRAGMA mmap_size = 268435456; -- 256MB de memory mapping

-- Análisis de consultas para identificar cuellos de botella
-- EXPLAIN QUERY PLAN SELECT * FROM projects WHERE status = 'active' ORDER BY created_at DESC LIMIT 10;
-- EXPLAIN QUERY PLAN SELECT p.*, u.name FROM projects p LEFT JOIN users u ON p.created_by = u.id WHERE p.status = 'active';

-- Comentario: Después de aplicar esta migración, ejecutar:
-- ANALYZE; -- Para actualizar las estadísticas del optimizador de consultas