-- Insertar datos de demostración

-- Limpiar datos existentes
DELETE FROM project_collaborators;
DELETE FROM products;
DELETE FROM projects WHERE id > 0;

-- Insertar categorías de productos si no existen
INSERT OR IGNORE INTO product_categories (name, description, impact_weight) VALUES 
('Artículo Científico', 'Publicaciones en revistas indexadas', 0.9),
('Libro', 'Publicaciones de libros científicos', 0.8),
('Software', 'Desarrollo de herramientas de software', 0.7),
('Dataset', 'Conjuntos de datos científicos', 0.6),
('Prototipo', 'Prototipos tecnológicos', 0.75);

-- Insertar instituciones si no existen
INSERT OR IGNORE INTO institutions (name, type, description) VALUES 
('Universidad Tecnológica del Chocó', 'UNIVERSIDAD', 'Principal universidad del departamento'),
('SINCHI', 'INSTITUTO', 'Instituto de investigación amazónico'),
('Universidad Nacional', 'UNIVERSIDAD', 'Sede Medellín - Colaboración');

-- Insertar proyectos de demostración
INSERT INTO projects (title, description, status, start_date, end_date, budget, lead_researcher_id, institution_id) VALUES 
('Biodiversidad Marina del Pacífico Chocoano', 'Estudio integral de la biodiversidad marina en las costas del Pacífico chocoano, enfocado en especies endémicas y su conservación.', 'ACTIVE', '2024-01-15', '2025-12-31', 150000000, 2, 1),
('Tecnologías Sostenibles para Comunidades Rurales', 'Desarrollo e implementación de tecnologías apropiadas para mejorar la calidad de vida en comunidades rurales del Chocó.', 'ACTIVE', '2024-03-01', '2026-06-30', 200000000, 3, 1),
('Conservación de Bosques Tropicales', 'Estrategias innovadoras para la conservación y manejo sostenible de bosques tropicales en el Chocó biogeográfico.', 'PLANNING', '2025-01-01', '2027-12-31', 180000000, 4, 2);

-- Insertar colaboradores en proyectos
INSERT INTO project_collaborators (project_id, user_id, role, contribution_percentage) VALUES 
(1, 2, 'INVESTIGATOR_PRINCIPAL', 40),
(1, 3, 'CO_INVESTIGATOR', 30),
(1, 4, 'RESEARCHER', 30),
(2, 3, 'INVESTIGATOR_PRINCIPAL', 50),
(2, 2, 'CO_INVESTIGATOR', 35),
(2, 4, 'RESEARCHER', 15),
(3, 4, 'INVESTIGATOR_PRINCIPAL', 60),
(3, 3, 'CO_INVESTIGATOR', 40);

-- Insertar productos científicos
INSERT INTO products (title, type, description, status, project_id, publication_date, doi, impact_factor, citations_count, category_id) VALUES 
('Nuevas Especies de Corales en el Pacífico Chocoano', 'ARTICLE', 'Descripción taxonómica de tres nuevas especies de corales blandos encontradas en aguas del Pacífico chocoano.', 'PUBLISHED', 1, '2024-08-15', '10.1016/j.marine.2024.08.015', 2.1, 5, 1),
('Manual de Tecnologías Sostenibles', 'BOOK', 'Guía práctica para la implementación de tecnologías apropiadas en comunidades rurales del Chocó.', 'IN_REVIEW', 2, null, null, 0, 0, 2),
('EcoChoco: Sistema de Monitoreo Ambiental', 'SOFTWARE', 'Plataforma web para el monitoreo en tiempo real de variables ambientales en el Chocó.', 'DEVELOPMENT', 2, null, null, 0, 0, 3),
('Dataset: Flora del Chocó Biogeográfico', 'DATASET', 'Base de datos completa de especies vegetales del Chocó con información georreferenciada.', 'PUBLISHED', 3, '2024-09-01', '10.5194/essd-2024-flora-choco', 0, 2, 4);

-- Insertar autores de productos
INSERT INTO product_authors (product_id, user_id, author_order, is_corresponding) VALUES 
(1, 2, 1, 1),
(1, 3, 2, 0),
(1, 4, 3, 0),
(2, 3, 1, 1),
(2, 2, 2, 0),
(3, 3, 1, 1),
(3, 4, 2, 0),
(4, 4, 1, 1),
(4, 3, 2, 0);

-- Verificar usuarios creados
SELECT 'USUARIOS DEMO CREADOS:' as info;
SELECT email, full_name, role FROM users WHERE email LIKE '%@ctei.gov.co';

-- Verificar proyectos creados  
SELECT 'PROYECTOS DEMO CREADOS:' as info;
SELECT id, title, status, budget FROM projects;

-- Verificar productos creados
SELECT 'PRODUCTOS DEMO CREADOS:' as info;  
SELECT id, title, type, status FROM products;