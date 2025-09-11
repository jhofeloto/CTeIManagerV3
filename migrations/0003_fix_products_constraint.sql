-- Migración 0003: Corregir constraint de product_type en tabla products
-- Fecha: 2024-09-11
-- Descripción: Actualizar constraint CHECK para permitir las nuevas categorías de Fase 1

-- En SQLite no se puede modificar un constraint CHECK directamente
-- Necesitamos recrear la tabla

-- 1. Crear tabla temporal con la nueva estructura
CREATE TABLE products_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    product_code TEXT NOT NULL,
    product_type TEXT NOT NULL,
    description TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    doi TEXT,
    url TEXT,
    publication_date TEXT,
    journal TEXT,
    impact_factor DECIMAL(5,3),
    citation_count INTEGER DEFAULT 0,
    metadata TEXT, -- JSON
    file_url TEXT,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- 2. Copiar datos existentes
INSERT INTO products_new (
    id, project_id, product_code, product_type, description, 
    is_public, created_at, updated_at, doi, url, publication_date, 
    journal, impact_factor, citation_count, metadata, file_url
)
SELECT 
    id, project_id, product_code, product_type, description, 
    is_public, created_at, updated_at, doi, url, publication_date, 
    journal, impact_factor, citation_count, metadata, file_url
FROM products;

-- 3. Eliminar tabla original
DROP TABLE products;

-- 4. Renombrar tabla nueva
ALTER TABLE products_new RENAME TO products;

-- 5. Recrear índices si los había
CREATE INDEX IF NOT EXISTS idx_products_project_id ON products(project_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_public ON products(is_public);
CREATE INDEX IF NOT EXISTS idx_products_created ON products(created_at);