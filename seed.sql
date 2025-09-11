-- Datos de prueba para CTeI-Manager
-- Contraseña por defecto para todos los usuarios: "password123"
-- Hash generado con bcrypt cost=10: $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

-- Usuarios de prueba
INSERT OR IGNORE INTO users (email, password_hash, full_name, role) VALUES 
    ('admin@ctei.edu.co', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Ana María García', 'ADMIN'),
    ('carlos.rodriguez@ctei.edu.co', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Carlos Rodríguez', 'INVESTIGATOR'),
    ('maria.lopez@ctei.edu.co', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dra. María López', 'INVESTIGATOR'),
    ('juan.perez@ctei.edu.co', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Dr. Juan Pérez', 'INVESTIGATOR'),
    ('comunidad@ctei.edu.co', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Usuario Comunidad', 'COMMUNITY');

-- Proyectos de prueba
INSERT OR IGNORE INTO projects (title, abstract, keywords, introduction, methodology, owner_id, is_public) VALUES 
    (
        'EcoMar 4.0: Sostenibilidad Marina Inteligente',
        'Desarrollo de un sistema inteligente para el monitoreo y conservación de ecosistemas marinos utilizando tecnologías de IoT, inteligencia artificial y big data.',
        'ecosistemas marinos, IoT, inteligencia artificial, sostenibilidad, monitoreo ambiental',
        'Los ecosistemas marinos enfrentan desafíos sin precedentes debido al cambio climático y la actividad antropogénica. Este proyecto propone el desarrollo de una plataforma tecnológica integral...',
        'Se implementará una metodología mixta que combina sensores IoT submarinos, análisis de datos satelitales, algoritmos de machine learning para predicción de patrones ambientales...',
        2,
        1
    ),
    (
        'InnovaAgro: Agricultura de Precisión con IA',
        'Sistema de agricultura de precisión basado en inteligencia artificial para optimizar el rendimiento de cultivos y reducir el impacto ambiental.',
        'agricultura de precisión, inteligencia artificial, optimización de cultivos, drones, sensores',
        'La agricultura moderna requiere soluciones innovadoras para alimentar a una población creciente mientras se preservan los recursos naturales...',
        'Implementación de redes de sensores en campo, uso de drones para mapeo aéreo, desarrollo de algoritmos de IA para análisis predictivo...',
        3,
        1
    ),
    (
        'Proyecto Interno de Biomateriales',
        'Investigación avanzada en desarrollo de biomateriales para aplicaciones médicas.',
        'biomateriales, medicina regenerativa, nanotecnología',
        'Este proyecto privado investiga nuevos biomateriales...',
        'Metodología experimental controlada...',
        2,
        0
    );

-- Productos asociados a los proyectos
INSERT OR IGNORE INTO products (project_id, product_code, product_type, description, is_public) VALUES 
    -- Productos del proyecto EcoMar 4.0
    (1, 'ART_OPEN_A1_001', 'A', 'Artículo de investigación: "Smart IoT Networks for Marine Ecosystem Monitoring" publicado en revista indexada Q1', 1),
    (1, 'LIB_A1_002', 'A', 'Capítulo de libro: "Artificial Intelligence Applications in Marine Conservation" en editorial reconocida', 1),
    (1, 'SOFT_B_003', 'B', 'Software EcoMar Platform v1.0 - Sistema de monitoreo marino en tiempo real', 1),
    (1, 'PATENT_A_004', 'A', 'Patente: "Sistema de sensores submarinos auto-calibrantes para monitoreo ambiental"', 1),
    
    -- Productos del proyecto InnovaAgro
    (2, 'ART_OPEN_A1_005', 'A', 'Artículo: "Precision Agriculture Using Machine Learning Algorithms" en revista Q2', 1),
    (2, 'PROTOTYPE_B_006', 'B', 'Prototipo: Sistema de drones autónomos para monitoreo de cultivos', 1),
    (2, 'DATABASE_DPC_007', 'DPC', 'Base de datos de patrones climáticos y rendimiento de cultivos (2020-2024)', 1),
    
    -- Productos del proyecto privado
    (3, 'ART_PREP_008', 'B', 'Artículo en preparación sobre biomateriales nanoestructurados', 0),
    (3, 'PROTOTYPE_PRIV_009', 'B', 'Prototipo de biomaterial para regeneración ósea', 0);

-- Colaboradores en proyectos
INSERT OR IGNORE INTO project_collaborators (project_id, user_id) VALUES 
    -- EcoMar 4.0 colaboradores
    (1, 3), -- María López como colaboradora
    (1, 4), -- Juan Pérez como colaborador
    
    -- InnovaAgro colaboradores  
    (2, 2), -- Carlos Rodríguez como colaborador
    (2, 4); -- Juan Pérez como colaborador