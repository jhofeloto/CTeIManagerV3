-- Script para corregir inconsistencias de consistencia encontradas

-- ===========================================
-- CORRECCIÓN: Agregar colaboradores faltantes
-- ===========================================

-- Los productos 11 y 12 fueron creados por admin@ctei.edu.co (user_id=3)
-- pero este usuario no es colaborador del proyecto "Proyecto de Prueba para Colaboradores" (project_id=6)
-- El owner del proyecto es user_id=1

-- Agregar al creador como colaborador del proyecto
INSERT OR IGNORE INTO project_collaborators (project_id, user_id, added_at)
VALUES (6, 3, datetime('now'));

-- Verificar que la corrección funcionó
SELECT 'Verificación de corrección:' as status;
SELECT
    pc.project_id,
    pc.user_id,
    u.email as user_email,
    p.title as project_title,
    p.owner_id as project_owner_id,
    u2.email as project_owner_email
FROM project_collaborators pc
JOIN users u ON pc.user_id = u.id
JOIN projects p ON pc.project_id = p.id
JOIN users u2 ON p.owner_id = u2.id
WHERE pc.project_id = 6 AND pc.user_id = 3;

-- Verificar que ya no hay inconsistencias
SELECT 'Productos con creadores que no son colaboradores ni owners (después de corrección):' as check_type;
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