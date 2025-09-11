-- FASE 1: Mejoras de Gestión de Proyectos
-- Añadir estados de proyecto y metadatos básicos

-- 1. ESTADOS Y METADATOS DE PROYECTOS
-- Añadir columnas para estados y información adicional
ALTER TABLE projects ADD COLUMN status TEXT CHECK(status IN ('DRAFT', 'ACTIVE', 'REVIEW', 'COMPLETED', 'SUSPENDED')) DEFAULT 'ACTIVE';
ALTER TABLE projects ADD COLUMN start_date TEXT;
ALTER TABLE projects ADD COLUMN end_date TEXT; 
ALTER TABLE projects ADD COLUMN institution TEXT;
ALTER TABLE projects ADD COLUMN funding_source TEXT;
ALTER TABLE projects ADD COLUMN budget DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN project_code TEXT; -- Código único del proyecto

-- 2. CLASIFICACIÓN MEJORADA DE PRODUCTOS CTeI
-- Tabla de categorías de productos con descripciones claras
CREATE TABLE IF NOT EXISTS product_categories (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category_group TEXT NOT NULL, -- 'PUBLICATION', 'SOFTWARE', 'PATENT', 'DATABASE', 'OTHER'
    impact_weight DECIMAL(3,2) DEFAULT 1.0,
    required_fields TEXT, -- JSON con campos requeridos
    created_at TEXT DEFAULT (datetime('now'))
);

-- Insertar categorías de productos CTeI estándar
INSERT OR REPLACE INTO product_categories VALUES 
-- PUBLICACIONES
('ART_A1', 'Artículo A1 (Q1)', 'Artículo de investigación en revista indexada ISI/Scopus Q1', 'PUBLICATION', 4.0, '{"doi": true, "journal": true, "impact_factor": true}', datetime('now')),
('ART_A2', 'Artículo A2 (Q2-Q4)', 'Artículo de investigación en revista indexada Q2-Q4', 'PUBLICATION', 3.0, '{"doi": true, "journal": true}', datetime('now')),
('ART_B', 'Artículo B', 'Artículo en revista no indexada o de divulgación', 'PUBLICATION', 2.0, '{"journal": true}', datetime('now')),
('BOOK', 'Libro de Investigación', 'Libro resultado de investigación', 'PUBLICATION', 3.5, '{"isbn": true, "publisher": true, "pages": true}', datetime('now')),
('BOOK_CHAPTER', 'Capítulo de Libro', 'Capítulo en libro de investigación', 'PUBLICATION', 2.5, '{"isbn": true, "publisher": true}', datetime('now')),
('CONFERENCE', 'Ponencia en Congreso', 'Presentación en evento científico', 'PUBLICATION', 1.5, '{"event_name": true, "event_date": true}', datetime('now')),

-- SOFTWARE Y TECNOLOGÍA  
('SOFTWARE', 'Software Científico', 'Desarrollo de software para investigación', 'SOFTWARE', 2.5, '{"repository": true, "license": true, "version": true}', datetime('now')),
('PROTOTYPE', 'Prototipo Tecnológico', 'Prototipo funcional desarrollado', 'SOFTWARE', 3.0, '{"description": true, "trl_level": true}', datetime('now')),
('PLATFORM', 'Plataforma Digital', 'Sistema o plataforma web/móvil', 'SOFTWARE', 3.5, '{"url": true, "users": false}', datetime('now')),

-- PROPIEDAD INTELECTUAL
('PATENT', 'Patente', 'Patente de invención otorgada', 'PATENT', 4.5, '{"patent_number": true, "country": true, "filing_date": true}', datetime('now')),
('UTILITY_MODEL', 'Modelo de Utilidad', 'Modelo de utilidad registrado', 'PATENT', 3.0, '{"registration_number": true, "country": true}', datetime('now')),
('INDUSTRIAL_DESIGN', 'Diseño Industrial', 'Diseño industrial registrado', 'PATENT', 2.5, '{"registration_number": true}', datetime('now')),

-- BASES DE DATOS Y COLECCIONES
('DATABASE', 'Base de Datos', 'Base de datos científica desarrollada', 'DATABASE', 2.0, '{"url": true, "size": true, "access_type": true}', datetime('now')),
('DATASET', 'Conjunto de Datos', 'Dataset publicado para investigación', 'DATABASE', 2.5, '{"doi": true, "repository": true, "size": true}', datetime('now')),
('COLLECTION', 'Colección Científica', 'Colección biológica, mineralógica, etc.', 'DATABASE', 2.0, '{"type": true, "specimens": true}', datetime('now')),

-- FORMACIÓN Y CAPACITACIÓN
('THESIS_PHD', 'Tesis Doctoral', 'Tesis de doctorado dirigida', 'TRAINING', 3.0, '{"student_name": true, "defense_date": true}', datetime('now')),
('THESIS_MASTER', 'Tesis de Maestría', 'Tesis de maestría dirigida', 'TRAINING', 2.0, '{"student_name": true, "defense_date": true}', datetime('now')),
('COURSE', 'Curso Especializado', 'Curso de formación desarrollado', 'TRAINING', 1.5, '{"hours": true, "participants": false}', datetime('now')),

-- OTROS PRODUCTOS
('STANDARD', 'Norma Técnica', 'Norma o estándar técnico desarrollado', 'OTHER', 3.5, '{"norm_number": true, "organization": true}', datetime('now')),
('CONSULTING', 'Consultoría Técnica', 'Servicio de consultoría especializada', 'OTHER', 2.0, '{"client": false, "duration": true}', datetime('now')),
('EXHIBITION', 'Exposición', 'Exposición o muestra científica', 'OTHER', 1.0, '{"venue": true, "date": true}', datetime('now'));

-- 3. METADATOS EXTENDIDOS PARA PRODUCTOS
-- Añadir campos adicionales a la tabla productos
ALTER TABLE products ADD COLUMN doi TEXT;
ALTER TABLE products ADD COLUMN url TEXT;
ALTER TABLE products ADD COLUMN publication_date TEXT;
ALTER TABLE products ADD COLUMN journal TEXT;
ALTER TABLE products ADD COLUMN impact_factor DECIMAL(5,3);
ALTER TABLE products ADD COLUMN citation_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN metadata TEXT; -- JSON con datos específicos del tipo
ALTER TABLE products ADD COLUMN file_url TEXT; -- URL del archivo asociado

-- 4. ROLES DE COLABORACIÓN MEJORADOS
-- Extender la tabla de colaboradores con roles específicos
ALTER TABLE project_collaborators ADD COLUMN collaboration_role TEXT CHECK(collaboration_role IN ('CO_INVESTIGATOR', 'RESEARCH_ASSISTANT', 'ADVISOR', 'EXTERNAL_COLLABORATOR')) DEFAULT 'CO_INVESTIGATOR';
ALTER TABLE project_collaborators ADD COLUMN can_edit_project BOOLEAN DEFAULT 0;
ALTER TABLE project_collaborators ADD COLUMN can_add_products BOOLEAN DEFAULT 1;
ALTER TABLE project_collaborators ADD COLUMN can_manage_team BOOLEAN DEFAULT 0;
ALTER TABLE project_collaborators ADD COLUMN role_description TEXT;

-- 5. TABLA DE INSTITUCIONES
-- Para manejar afiliaciones de manera estructurada
CREATE TABLE IF NOT EXISTS institutions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    short_name TEXT,
    type TEXT CHECK(type IN ('UNIVERSITY', 'RESEARCH_CENTER', 'COMPANY', 'NGO', 'GOVERNMENT', 'OTHER')) NOT NULL,
    country TEXT NOT NULL,
    city TEXT,
    website TEXT,
    logo_url TEXT,
    created_at TEXT DEFAULT (datetime('now'))
);

-- Insertar algunas instituciones de ejemplo
INSERT OR IGNORE INTO institutions (name, short_name, type, country, city, website) VALUES 
('Universidad Nacional de Colombia', 'UNAL', 'UNIVERSITY', 'Colombia', 'Bogotá', 'https://unal.edu.co'),
('Corporación para la Investigación de la Corrosión', 'CIC', 'RESEARCH_CENTER', 'Colombia', 'Bogotá', 'https://cic.org.co'),
('Instituto Colombiano del Petróleo', 'ICP', 'RESEARCH_CENTER', 'Colombia', 'Bucaramanga', 'https://icp.ecopetrol.com.co'),
('COLCIENCIAS - Ministerio de Ciencia, Tecnología e Innovación', 'MINCIENCIAS', 'GOVERNMENT', 'Colombia', 'Bogotá', 'https://minciencias.gov.co');

-- 6. ÍNDICES PARA OPTIMIZACIÓN
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_institution ON projects(institution);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(product_code);
CREATE INDEX IF NOT EXISTS idx_products_date ON products(publication_date);
CREATE INDEX IF NOT EXISTS idx_products_doi ON products(doi);
CREATE INDEX IF NOT EXISTS idx_collaborators_role ON project_collaborators(collaboration_role);

-- 7. TRIGGERS ACTUALIZADOS
-- Trigger para actualizar updated_at cuando cambie el estado
CREATE TRIGGER IF NOT EXISTS update_projects_status_change
AFTER UPDATE OF status ON projects
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Trigger para validar fechas de proyecto
CREATE TRIGGER IF NOT EXISTS validate_project_dates
BEFORE UPDATE ON projects
BEGIN
    -- Validar que end_date sea posterior a start_date
    UPDATE projects 
    SET end_date = NULL 
    WHERE NEW.start_date IS NOT NULL 
      AND NEW.end_date IS NOT NULL 
      AND NEW.end_date <= NEW.start_date 
      AND id = NEW.id;
END;