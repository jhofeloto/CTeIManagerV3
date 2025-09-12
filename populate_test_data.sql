-- Poblar datos de prueba adicionales para CTeI-Manager
-- Para probar funcionalidades de Mis Proyectos y Mis Productos

-- Proyectos adicionales para diferentes usuarios

-- Proyecto para María López (ID 3)
INSERT OR IGNORE INTO projects (
    title, abstract, introduction, methodology, keywords, 
    is_public, owner_id, institution, created_at
) VALUES (
    'Biodiversidad Digital Pacífica',
    'Desarrollo de una plataforma digital para catalogar y preservar la biodiversidad del Pacífico colombiano mediante tecnologías de IA y machine learning.',
    'El Pacífico colombiano alberga una de las biodiversidades más ricas del mundo, pero carece de herramientas digitales para su catalogación y preservación sistemática.',
    'Utilizamos computer vision, machine learning y bases de datos distribuidas para crear un sistema automatizado de identificación y catalogación de especies.',
    'biodiversidad, IA, machine learning, Pacífico colombiano, conservación',
    1, 3, 'Universidad Tecnológica del Chocó',
    datetime('now', '-30 days')
);

-- Proyecto privado para María López
INSERT OR IGNORE INTO projects (
    title, abstract, introduction, methodology, keywords, 
    is_public, owner_id, institution, created_at
) VALUES (
    'Análisis Genómico Avanzado - Fase Inicial',
    'Estudio preliminar de variantes genéticas en poblaciones afrocolombianas del Pacífico. Proyecto en fase de desarrollo.',
    'Investigación en curso sobre marcadores genéticos específicos de poblaciones afrocolombianas.',
    'Secuenciación NGS, análisis bioinformático, estudios poblacionales.',
    'genómica, poblaciones afrocolombianas, NGS, bioinformática',
    0, 3, 'Universidad Tecnológica del Chocó',
    datetime('now', '-15 days')
);

-- Proyecto para Juan Pérez (ID 4)
INSERT OR IGNORE INTO projects (
    title, abstract, introduction, methodology, keywords, 
    is_public, owner_id, institution, created_at
) VALUES (
    'Smart Cities Chocó: Infraestructura Inteligente',
    'Implementación de soluciones IoT y sistemas inteligentes para mejorar la infraestructura urbana en municipios del Chocó.',
    'Los municipios del Chocó enfrentan desafíos únicos de infraestructura que pueden ser abordados con tecnologías inteligentes adaptadas al contexto local.',
    'Deployment de sensores IoT, desarrollo de dashboard de monitoreo, análisis de datos en tiempo real.',
    'Smart Cities, IoT, infraestructura, Chocó, monitoreo urbano',
    1, 4, 'Universidad Minuto de Dios - Chocó',
    datetime('now', '-45 days')
);

-- Proyecto para el Investigador Chocó (ID 6)
INSERT OR IGNORE INTO projects (
    title, abstract, introduction, methodology, keywords, 
    is_public, owner_id, institution, created_at
) VALUES (
    'Agricultura Sostenible 4.0 - Chocó',
    'Desarrollo de tecnologías agrícolas sostenibles adaptadas a las condiciones climáticas y sociales del departamento del Chocó.',
    'La agricultura en el Chocó requiere soluciones tecnológicas que consideren las condiciones de alta humedad, biodiversidad y características socioculturales de la región.',
    'Sensores ambientales, análisis de suelos, sistemas de riego inteligente, capacitación comunitaria.',
    'agricultura sostenible, tecnología agrícola, Chocó, sensores ambientales',
    1, 6, 'Gobernación del Chocó - Secretaría de Agricultura',
    datetime('now', '-20 days')
);

-- Proyecto del Admin Ana María García (ID 1)
INSERT OR IGNORE INTO projects (
    title, abstract, introduction, methodology, keywords, 
    is_public, owner_id, institution, created_at
) VALUES (
    'Gestión Integral de Datos CTeI Nacional',
    'Proyecto estratégico para consolidar y estandarizar la gestión de información científica, tecnológica y de innovación a nivel nacional.',
    'La fragmentación de datos CTeI en Colombia requiere un enfoque integral que permita la interoperabilidad entre instituciones.',
    'Análisis de sistemas existentes, desarrollo de APIs estándar, implementación de arquitectura distribuida.',
    'gestión de datos, CTeI, interoperabilidad, APIs, arquitectura distribuida',
    1, 1, 'MinCiencias',
    datetime('now', '-60 days')
);

-- Ahora agregar productos para estos nuevos proyectos

-- Productos para Biodiversidad Digital Pacífica (proyecto de María López)
INSERT OR IGNORE INTO products (
    product_code, description, product_type, category_code,
    project_id, is_public, created_by_user_id, created_at,
    doi, journal, publication_date, impact_factor, citation_count
) VALUES 
(
    'ART_A1_BDP_001',
    'Machine Learning Approaches for Automated Species Identification in Pacific Colombian Biodiversity',
    'A',
    'ART_A1',
    4, -- ID del proyecto Biodiversidad Digital
    1, 3,
    datetime('now', '-25 days'),
    '10.1016/j.biodiversity.2024.03.015',
    'Biodiversity and Conservation',
    '2024-03-15',
    4.2,
    12
),
(
    'SOFT_B_BDP_002',
    'BioPacífico: Plataforma Web para Catalogación de Especies',
    'B',
    'SOFT_B',
    4,
    1, 3,
    datetime('now', '-20 days'),
    NULL, NULL, NULL, NULL, NULL
),
(
    'DATABASE_DPC_BDP_003',
    'Base de Datos de Especies del Pacífico Colombiano',
    'DPC',
    'DATABASE_DPC',
    4,
    1, 3,
    datetime('now', '-15 days'),
    NULL, NULL, NULL, NULL, NULL
);

-- Productos para Smart Cities Chocó
INSERT OR IGNORE INTO products (
    product_code, description, product_type, category_code,
    project_id, is_public, created_by_user_id, created_at
) VALUES 
(
    'PROTOTYPE_B_SC_001',
    'Sistema de Monitoreo Urbano IoT para Municipios del Chocó',
    'B',
    'PROTOTYPE_B',
    6, -- Smart Cities Chocó
    1, 4,
    datetime('now', '-40 days')
),
(
    'CONFERENCE_ASC_SC_002',
    'Presentación: IoT Solutions for Rural Smart Cities in Colombian Pacific Region',
    'ASC',
    'CONFERENCE_ASC',
    6,
    1, 4,
    datetime('now', '-35 days')
),
(
    'MANUAL_DPC_SC_003',
    'Guía de Implementación de Sensores IoT en Ambiente Tropical Húmedo',
    'DPC',
    'MANUAL_DPC',
    6,
    1, 4,
    datetime('now', '-30 days')
);

-- Productos para Agricultura Sostenible 4.0 - Chocó
INSERT OR IGNORE INTO products (
    product_code, description, product_type, category_code,
    project_id, is_public, created_by_user_id, created_at
) VALUES 
(
    'PATENT_A_AS_001',
    'Sistema de Riego Inteligente Adaptado a Condiciones de Alta Humedad',
    'A',
    'PATENT_A',
    7, -- Agricultura Sostenible
    1, 6,
    datetime('now', '-18 days')
),
(
    'TRAINING_FRH_AS_002',
    'Programa de Capacitación en Tecnologías Agrícolas Sostenibles',
    'FRH_A',
    'TRAINING_FRH',
    7,
    1, 6,
    datetime('now', '-12 days')
),
(
    'WORKSHOP_ASC_AS_003',
    'Taller Comunitario: Agricultura 4.0 en el Chocó',
    'ASC',
    'WORKSHOP_ASC',
    7,
    1, 6,
    datetime('now', '-8 days')
);

-- Productos para Gestión Integral CTeI (Admin)
INSERT OR IGNORE INTO products (
    product_code, description, product_type, category_code,
    project_id, is_public, created_by_user_id, created_at,
    journal, publication_date
) VALUES 
(
    'ART_TOP_GI_001',
    'National Framework for Scientific Data Interoperability in Colombian Research Institutions',
    'TOP',
    'ART_TOP',
    8, -- Gestión Integral
    1, 1,
    datetime('now', '-55 days'),
    'Nature Scientific Data',
    '2024-01-20'
),
(
    'SOFTWARE_A_GI_002',
    'CTeI-Connect: API Framework for Research Data Integration',
    'A',
    'SOFTWARE_A',
    8,
    1, 1,
    datetime('now', '-50 days')
),
(
    'POLICY_DPC_GI_003',
    'Lineamientos Nacionales para Gestión de Datos CTeI',
    'DPC',
    'POLICY_DPC',
    8,
    1, 1,
    datetime('now', '-45 days')
);

-- Agregar algunos colaboradores a los proyectos
INSERT OR IGNORE INTO project_collaborators (project_id, user_id, role, added_at) VALUES
-- Colaboradores para Biodiversidad Digital Pacífica
(4, 2, 'RESEARCHER', datetime('now', '-25 days')), -- Carlos colabora con María
(4, 6, 'ADVISOR', datetime('now', '-25 days')), -- Investigador Chocó como asesor

-- Colaboradores para Smart Cities Chocó
(6, 3, 'RESEARCHER', datetime('now', '-40 days')), -- María colabora con Juan
(6, 1, 'SUPERVISOR', datetime('now', '-40 days')), -- Admin como supervisor

-- Colaboradores para Agricultura Sostenible
(7, 4, 'RESEARCHER', datetime('now', '-18 days')), -- Juan colabora con Investigador Chocó
(7, 3, 'CONSULTANT', datetime('now', '-15 days')); -- María como consultora

-- Agregar autores a los productos
INSERT OR IGNORE INTO product_authors (product_id, user_id, author_role, contribution_type, added_at) VALUES
-- Autores para productos de Biodiversidad Digital
(10, 3, 'AUTHOR', 'Investigación principal y redacción', datetime('now', '-24 days')),
(10, 2, 'CO_AUTHOR', 'Análisis de datos y metodología', datetime('now', '-24 days')),
(11, 3, 'AUTHOR', 'Desarrollo y arquitectura', datetime('now', '-19 days')),
(12, 3, 'AUTHOR', 'Curación y estructuración de datos', datetime('now', '-14 days')),

-- Autores para productos de Smart Cities
(13, 4, 'AUTHOR', 'Diseño e implementación del sistema', datetime('now', '-39 days')),
(13, 3, 'CO_AUTHOR', 'Análisis de requisitos urbanos', datetime('now', '-39 days')),
(14, 4, 'AUTHOR', 'Presentación y comunicación', datetime('now', '-34 days')),

-- Autores para productos de Agricultura Sostenible
(15, 6, 'AUTHOR', 'Invención y desarrollo del sistema', datetime('now', '-17 days')),
(16, 6, 'AUTHOR', 'Diseño curricular y metodología', datetime('now', '-11 days')),
(17, 6, 'AUTHOR', 'Facilitación y coordinación', datetime('now', '-7 days')),

-- Autores para productos de Gestión Integral
(18, 1, 'AUTHOR', 'Conceptualización y redacción', datetime('now', '-54 days')),
(19, 1, 'AUTHOR', 'Arquitectura y desarrollo', datetime('now', '-49 days')),
(20, 1, 'AUTHOR', 'Desarrollo de políticas', datetime('now', '-44 days'));