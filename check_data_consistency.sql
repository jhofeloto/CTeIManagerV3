-- Script para verificar la consistencia de datos en los tres ejes estructurales
-- Proyectos, Productos e Investigadores

-- ===========================================
-- 1. VERIFICACIÓN DE USUARIOS/INVESTIGADORES
-- ===========================================

-- Contar usuarios por rol
SELECT
    role,
    COUNT(*) as count,
    GROUP_CONCAT(email, ', ') as emails
FROM users
GROUP BY role
ORDER BY count DESC;

-- Verificar usuarios sin email o nombre
SELECT 'Usuarios con datos faltantes:' as check_type;
SELECT id, email, full_name, role
FROM users
WHERE email IS NULL OR email = '' OR full_name IS NULL OR full_name = ''
ORDER BY id;

-- ===========================================
-- 2. VERIFICACIÓN DE PROYECTOS
-- ===========================================

-- Contar proyectos totales
SELECT 'Estadísticas de proyectos:' as check_type;
SELECT
    COUNT(*) as total_projects,
    COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_projects,
    COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_projects
FROM projects;

-- Verificar proyectos con owner_id inválido
SELECT 'Proyectos con owner_id inválido:' as check_type;
SELECT p.id, p.title, p.owner_id, u.email as owner_email
FROM projects p
LEFT JOIN users u ON p.owner_id = u.id
WHERE u.id IS NULL
ORDER BY p.id;

-- Verificar proyectos sin título o abstract
SELECT 'Proyectos con datos faltantes:' as check_type;
SELECT id, title, abstract, owner_id
FROM projects
WHERE title IS NULL OR title = '' OR abstract IS NULL OR abstract = ''
ORDER BY id;

-- ===========================================
-- 3. VERIFICACIÓN DE PRODUCTOS
-- ===========================================

-- Contar productos totales
SELECT 'Estadísticas de productos:' as check_type;
SELECT
    COUNT(*) as total_products,
    COUNT(CASE WHEN is_public = 1 THEN 1 END) as public_products,
    COUNT(CASE WHEN is_public = 0 THEN 1 END) as private_products
FROM products;

-- Verificar productos con project_id inválido
SELECT 'Productos con project_id inválido:' as check_type;
SELECT pr.id, pr.product_code, pr.project_id, p.title as project_title
FROM products pr
LEFT JOIN projects p ON pr.project_id = p.id
WHERE p.id IS NULL
ORDER BY pr.id;

-- Verificar productos con creator_id inválido
SELECT 'Productos con creator_id inválido:' as check_type;
SELECT pr.id, pr.product_code, pr.creator_id, u.email as creator_email
FROM products pr
LEFT JOIN users u ON pr.creator_id = u.id
WHERE u.id IS NULL AND pr.creator_id IS NOT NULL
ORDER BY pr.id;

-- Verificar productos sin descripción o código
SELECT 'Productos con datos faltantes:' as check_type;
SELECT id, product_code, description, project_id
FROM products
WHERE product_code IS NULL OR product_code = '' OR description IS NULL OR description = ''
ORDER BY id;

-- ===========================================
-- 4. VERIFICACIÓN DE AUTORÍA
-- ===========================================

-- Contar autores por producto
SELECT 'Estadísticas de autoría:' as check_type;
SELECT
    COUNT(DISTINCT product_id) as products_with_authors,
    COUNT(*) as total_authorships,
    AVG(authors_per_product) as avg_authors_per_product
FROM (
    SELECT product_id, COUNT(*) as authors_per_product
    FROM product_authors
    GROUP BY product_id
) stats;

-- Verificar product_authors con product_id inválido
SELECT 'Autorías con product_id inválido:' as check_type;
SELECT pa.product_id, pa.user_id, pa.author_role, pr.product_code
FROM product_authors pa
LEFT JOIN products pr ON pa.product_id = pr.id
WHERE pr.id IS NULL
ORDER BY pa.product_id;

-- Verificar product_authors con user_id inválido
SELECT 'Autorías con user_id inválido:' as check_type;
SELECT pa.product_id, pa.user_id, pa.author_role, u.email
FROM product_authors pa
LEFT JOIN users u ON pa.user_id = u.id
WHERE u.id IS NULL
ORDER BY pa.product_id;

-- Verificar productos sin autores
SELECT 'Productos sin autores registrados:' as check_type;
SELECT p.id, p.product_code, p.description, p.creator_id
FROM products p
LEFT JOIN product_authors pa ON p.id = pa.product_id
WHERE pa.product_id IS NULL
ORDER BY p.id;

-- ===========================================
-- 5. VERIFICACIÓN DE COLABORADORES
-- ===========================================

-- Verificar project_collaborators con project_id inválido
SELECT 'Colaboradores con project_id inválido:' as check_type;
SELECT pc.project_id, pc.user_id, p.title as project_title
FROM project_collaborators pc
LEFT JOIN projects p ON pc.project_id = p.id
WHERE p.id IS NULL
ORDER BY pc.project_id;

-- Verificar project_collaborators con user_id inválido
SELECT 'Colaboradores con user_id inválido:' as check_type;
SELECT pc.project_id, pc.user_id, u.email
FROM project_collaborators pc
LEFT JOIN users u ON pc.user_id = u.id
WHERE u.id IS NULL
ORDER BY pc.project_id;

-- ===========================================
-- 6. VERIFICACIONES CRUZADAS
-- ===========================================

-- Verificar que todos los creadores de productos sean colaboradores o owners de sus proyectos
SELECT 'Creadores de productos que no son colaboradores ni owners:' as check_type;
SELECT
    pr.id as product_id,
    pr.product_code,
    pr.creator_id,
    u.email as creator_email,
    p.id as project_id,
    p.title as project_title,
    p.owner_id as project_owner_id
FROM products pr
JOIN users u ON pr.creator_id = u.id
JOIN projects p ON pr.project_id = p.id
LEFT JOIN project_collaborators pc ON pc.project_id = p.id AND pc.user_id = pr.creator_id
WHERE pc.user_id IS NULL AND p.owner_id != pr.creator_id
ORDER BY pr.id;

-- Verificar consistencia de timestamps
SELECT 'Registros con created_at > updated_at:' as check_type;
SELECT 'users' as table_name, id, created_at, updated_at
FROM users
WHERE created_at > updated_at
UNION ALL
SELECT 'projects' as table_name, id, created_at, updated_at
FROM projects
WHERE created_at > updated_at
UNION ALL
SELECT 'products' as table_name, id, created_at, updated_at
FROM products
WHERE created_at > updated_at;

-- ===========================================
-- 7. RESUMEN FINAL
-- ===========================================

SELECT 'RESUMEN DE CONSISTENCIA DE DATOS' as summary;
SELECT
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM projects) as total_projects,
    (SELECT COUNT(*) FROM products) as total_products,
    (SELECT COUNT(*) FROM product_authors) as total_authorships,
    (SELECT COUNT(*) FROM project_collaborators) as total_collaborators;