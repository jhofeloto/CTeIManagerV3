-- Migración 0006: Sistema de Scoring Automatizado de Proyectos
-- Fecha: 2024-09-12
-- Descripción: Tabla y sistema para scoring inteligente y evaluación automatizada

-- Crear tabla de scores de proyectos
CREATE TABLE IF NOT EXISTS project_scores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    
    -- Scores por categoría (0-100)
    completeness_score DECIMAL(5,2) DEFAULT 0, -- Completitud del proyecto
    collaboration_score DECIMAL(5,2) DEFAULT 0, -- Nivel de colaboración
    productivity_score DECIMAL(5,2) DEFAULT 0, -- Productividad (productos generados)
    impact_score DECIMAL(5,2) DEFAULT 0, -- Impacto científico
    innovation_score DECIMAL(5,2) DEFAULT 0, -- Nivel de innovación
    timeline_score DECIMAL(5,2) DEFAULT 0, -- Cumplimiento de cronograma
    
    -- Score general ponderado (0-100)
    total_score DECIMAL(5,2) DEFAULT 0,
    
    -- Categoría de evaluación basada en score
    evaluation_category TEXT CHECK (evaluation_category IN ('EXCELENTE', 'BUENO', 'REGULAR', 'NECESITA_MEJORA')) DEFAULT 'REGULAR',
    
    -- Recomendaciones automatizadas (JSON)
    recommendations TEXT, -- JSON con sugerencias específicas
    
    -- Metadatos de scoring
    last_calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    calculation_version TEXT DEFAULT '1.0', -- Para futuras actualizaciones del algoritmo
    
    -- Flags de estado
    is_current BOOLEAN DEFAULT 1, -- Si es el score más actual
    needs_review BOOLEAN DEFAULT 0, -- Si necesita revisión manual
    
    -- Auditoría
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Crear tabla de criterios de evaluación configurables
CREATE TABLE IF NOT EXISTS scoring_criteria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    criterion_name TEXT NOT NULL UNIQUE,
    weight DECIMAL(5,2) NOT NULL, -- Peso en el score total (0-1)
    is_active BOOLEAN DEFAULT 1,
    description TEXT,
    formula_type TEXT CHECK (formula_type IN ('LINEAR', 'LOGARITHMIC', 'EXPONENTIAL', 'THRESHOLD')) DEFAULT 'LINEAR',
    min_value DECIMAL(10,2) DEFAULT 0,
    max_value DECIMAL(10,2) DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Crear tabla de alertas y triggers automáticos
CREATE TABLE IF NOT EXISTS project_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    alert_type TEXT NOT NULL CHECK (alert_type IN ('LOW_SCORE', 'MILESTONE_MISSED', 'NO_ACTIVITY', 'IMPROVEMENT_OPPORTUNITY')),
    severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')) DEFAULT 'MEDIUM',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_required TEXT, -- Acción recomendada
    
    -- Estado de la alerta
    status TEXT CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')) DEFAULT 'ACTIVE',
    acknowledged_by INTEGER, -- ID del usuario que reconoció la alerta
    acknowledged_at DATETIME,
    resolved_at DATETIME,
    
    -- Metadatos
    triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME, -- Fecha de expiración automática
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (acknowledged_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_project_scores_project_id ON project_scores(project_id);
CREATE INDEX IF NOT EXISTS idx_project_scores_current ON project_scores(is_current, total_score);
CREATE INDEX IF NOT EXISTS idx_project_scores_category ON project_scores(evaluation_category);
CREATE INDEX IF NOT EXISTS idx_project_scores_calculated ON project_scores(last_calculated_at);

CREATE INDEX IF NOT EXISTS idx_scoring_criteria_active ON scoring_criteria(is_active, weight);

CREATE INDEX IF NOT EXISTS idx_project_alerts_project ON project_alerts(project_id, status);
CREATE INDEX IF NOT EXISTS idx_project_alerts_type ON project_alerts(alert_type, severity);
CREATE INDEX IF NOT EXISTS idx_project_alerts_active ON project_alerts(status, triggered_at);

-- Triggers para actualizar timestamps
CREATE TRIGGER IF NOT EXISTS update_project_scores_timestamp 
    AFTER UPDATE ON project_scores
BEGIN
    UPDATE project_scores SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_scoring_criteria_timestamp 
    AFTER UPDATE ON scoring_criteria
BEGIN
    UPDATE scoring_criteria SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_project_alerts_timestamp 
    AFTER UPDATE ON project_alerts
BEGIN
    UPDATE project_alerts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Insertar criterios de evaluación por defecto
INSERT OR IGNORE INTO scoring_criteria (criterion_name, weight, description, formula_type) VALUES
('completeness', 0.25, 'Completitud de información del proyecto (título, resumen, metodología, etc.)', 'LINEAR'),
('collaboration', 0.20, 'Nivel de colaboración (número de colaboradores, diversidad institucional)', 'LOGARITHMIC'),
('productivity', 0.25, 'Productividad científica (productos generados, publicaciones)', 'LINEAR'),
('impact', 0.15, 'Impacto científico (citaciones, factor de impacto, DOI)', 'EXPONENTIAL'),
('innovation', 0.10, 'Nivel de innovación (categorías de productos, tecnologías)', 'LINEAR'),
('timeline', 0.05, 'Cumplimiento de cronograma y actividad reciente', 'THRESHOLD');