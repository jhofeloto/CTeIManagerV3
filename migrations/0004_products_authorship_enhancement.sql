-- Migración 0004: Mejoras de autoría y control granular de productos
-- Fecha: 2024-09-11
-- Descripción: Añadir campos de autoría y control de productos para asegurar trazabilidad

-- 1. Añadir campos de autoría a productos
ALTER TABLE products ADD COLUMN creator_id INTEGER;
ALTER TABLE products ADD COLUMN last_editor_id INTEGER;

-- 2. Añadir timestamps de edición más granulares
ALTER TABLE products ADD COLUMN published_at TEXT;
ALTER TABLE products ADD COLUMN published_by INTEGER;

-- 3. Crear tabla de autores/colaboradores por producto
CREATE TABLE IF NOT EXISTS product_authors (
    product_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    author_role TEXT NOT NULL DEFAULT 'AUTHOR' CHECK(author_role IN ('AUTHOR', 'CO_AUTHOR', 'EDITOR', 'REVIEWER')),
    author_order INTEGER DEFAULT 1, -- Orden de autoría (1 = primer autor, 2 = segundo, etc.)
    contribution_type TEXT, -- Descripción del tipo de contribución
    added_at TEXT DEFAULT (datetime('now')),
    added_by INTEGER, -- Quién añadió este autor
    PRIMARY KEY (product_id, user_id),
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (added_by) REFERENCES users(id)
);

-- 4. Añadir índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_products_creator ON products(creator_id);
CREATE INDEX IF NOT EXISTS idx_products_last_editor ON products(last_editor_id);
CREATE INDEX IF NOT EXISTS idx_products_published_by ON products(published_by);
CREATE INDEX IF NOT EXISTS idx_product_authors_product ON product_authors(product_id);
CREATE INDEX IF NOT EXISTS idx_product_authors_user ON product_authors(user_id);
CREATE INDEX IF NOT EXISTS idx_product_authors_role ON product_authors(author_role);

-- 5. Añadir foreign keys para los nuevos campos
-- Nota: SQLite no permite añadir foreign keys después, pero las implementaremos en la lógica de aplicación

-- 6. Migrar datos existentes - asignar creator_id basado en el owner del proyecto
UPDATE products SET creator_id = (
    SELECT pr.owner_id 
    FROM projects pr 
    WHERE pr.id = products.project_id
);

UPDATE products SET last_editor_id = creator_id;

-- 7. Insertar autores principales para productos existentes
INSERT INTO product_authors (product_id, user_id, author_role, author_order, contribution_type, added_by)
SELECT 
    p.id as product_id,
    p.creator_id as user_id,
    'AUTHOR' as author_role,
    1 as author_order,
    'Autor principal del producto' as contribution_type,
    p.creator_id as added_by
FROM products p
WHERE p.creator_id IS NOT NULL;

-- 8. Actualizar productos publicados
UPDATE products 
SET published_at = created_at, published_by = creator_id 
WHERE is_public = 1;

-- 9. Crear vista para facilitar consultas de productos con autores
CREATE VIEW IF NOT EXISTS products_with_authors AS
SELECT 
    p.id,
    p.project_id,
    p.product_code,
    p.product_type,
    p.description,
    p.is_public,
    p.created_at,
    p.updated_at,
    p.published_at,
    p.doi,
    p.url,
    p.publication_date,
    p.journal,
    p.impact_factor,
    p.citation_count,
    p.metadata,
    p.file_url,
    -- Información del creador
    p.creator_id,
    creator.full_name as creator_name,
    creator.email as creator_email,
    -- Información del último editor
    p.last_editor_id,
    editor.full_name as last_editor_name,
    -- Información del proyecto
    pr.title as project_title,
    pr.owner_id as project_owner_id,
    -- Categoría del producto
    pc.name as category_name,
    pc.category_group,
    pc.impact_weight,
    -- Contar autores
    (SELECT COUNT(*) FROM product_authors pa WHERE pa.product_id = p.id) as authors_count
FROM products p
LEFT JOIN users creator ON p.creator_id = creator.id
LEFT JOIN users editor ON p.last_editor_id = editor.id
LEFT JOIN projects pr ON p.project_id = pr.id
LEFT JOIN product_categories pc ON p.product_type = pc.code;