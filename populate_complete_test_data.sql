-- DATOS SINTÉTICOS COMPLETOS PARA CTeI-MANAGER
-- 6 Proyectos + 12 Productos + Relaciones de autoría y colaboradores

-- PROYECTOS DE INVESTIGACIÓN REALISTAS
INSERT OR IGNORE INTO projects (
  id, title, abstract, keywords, introduction, methodology,
  owner_id, is_public, status, start_date, end_date,
  institution, funding_source, budget, project_code
) VALUES
(1, 'Desarrollo de Algoritmos de Deep Learning para Diagnóstico Automatizado de Enfermedades Respiratorias',
'Investigación orientada al desarrollo de modelos de inteligencia artificial basados en redes neuronales convolucionales para el análisis automatizado de imágenes radiológicas de tórax.',
'inteligencia artificial, deep learning, diagnóstico médico, radiología',
'Las enfermedades respiratorias representan una de las principales causas de morbimortalidad a nivel mundial.',
'La metodología combina técnicas de aprendizaje profundo con validación clínica.',
1, 1, 'ACTIVE', '2024-01-15', '2025-01-15',
'Universidad Nacional de Colombia', 'MinCiencias', 850000000.00, 'CTeI-AI-MED-001'),

(2, 'Implementación de Tecnología Blockchain para Trazabilidad en Cadenas de Suministro Agroindustriales Colombianas',
'Desarrollo de una plataforma basada en tecnología blockchain para garantizar la trazabilidad en las cadenas de suministro del sector agroindustrial colombiano.',
'blockchain, trazabilidad, cadena de suministro, agroindustria',
'Colombia es uno de los principales exportadores agrícolas de América Latina.',
'Se desarrollará una arquitectura blockchain híbrida utilizando Hyperledger Fabric.',
2, 1, 'ACTIVE', '2024-02-01', '2024-12-31',
'Universidad EAFIT', 'Ministerio de Agricultura', 720000000.00, 'CTeI-BLOCK-AGR-002'),

(3, 'Red de Sensores IoT para Monitoreo Ambiental y Gestión Inteligente de Recursos Urbanos',
'Diseño e implementación de una red integrada de sensores IoT para el monitoreo en tiempo real de variables ambientales urbanas.',
'IoT, ciudades inteligentes, monitoreo ambiental, sensores',
'Las ciudades intermedias de Colombia enfrentan desafíos crecientes relacionados con la calidad ambiental.',
'Metodología de investigación aplicada con enfoque experimental.',
3, 1, 'DEVELOPMENT', '2024-03-15', '2025-03-15',
'Universidad de Caldas', 'Alcaldía de Manizales', 650000000.00, 'CTeI-IOT-CITY-003'),

(4, 'Entornos de Realidad Virtual Inmersiva para la Enseñanza de Química Orgánica en Educación Superior',
'Creación de laboratorios virtuales inmersivos utilizando tecnologías de realidad virtual.',
'realidad virtual, educación superior, química orgánica',
'La enseñanza de química orgánica presenta desafíos únicos.',
'Metodología de diseño centrado en el usuario con desarrollo iterativo.',
2, 1, 'ACTIVE', '2024-01-20', '2024-11-30',
'Universidad Javeriana', 'MinEducación', 480000000.00, 'CTeI-VR-EDU-004'),

(5, 'Análisis Genómico Computacional para Identificación de Biomarcadores en Cáncer Colorrectal',
'Desarrollo de pipelines bioinformáticos para el análisis de datos genómicos masivos.',
'bioinformática, genómica, cáncer colorrectal, biomarcadores',
'El cáncer colorrectal presenta particularidades genómicas específicas.',
'Metodología de análisis bioinformático con pipeline automatizado.',
1, 1, 'PLANNING', '2024-05-01', '2025-04-30',
'Universidad de Antioquia', 'Colciencias', 920000000.00, 'CTeI-BIOINF-005'),

(6, 'Optimización de Sistemas Fotovoltaicos Mediante Algoritmos de Inteligencia Artificial',
'Investigación orientada al desarrollo de algoritmos de optimización basados en inteligencia artificial.',
'energia solar, fotovoltaico, inteligencia artificial, optimización',
'Colombia tiene un potencial significativo en energía solar.',
'Metodología experimental con simulación computacional.',
3, 1, 'ACTIVE', '2024-04-10', '2025-04-10',
'Universidad Nacional', 'MinEnergía', 780000000.00, 'CTeI-SOLAR-006');

-- PRODUCTOS CIENTÍFICOS REALISTAS
INSERT OR IGNORE INTO products (
  id, project_id, product_code, product_type, description, is_public,
  doi, url, publication_date, journal, creator_id, last_editor_id
) VALUES
(1, 1, 'ART-AI-RAD-2024-001', 'ART_A1', 'Deep Learning for Automated Chest X-Ray Analysis', 1,
'10.1038/s41598-024-12345-6', NULL, '2024-03-15', 'Nature Scientific Reports', 1, 1),
(2, 1, 'SOFT-DIAGNET-001', 'SOFTWARE', 'DiagNet: Sistema de Diagnóstico Automatizado', 1,
NULL, 'https://github.com/ctei-unal/diagnet', '2024-06-20', NULL, 1, 1),
(3, 2, 'ART-BLOCK-SUPPLY-001', 'ART_A2', 'Blockchain-Based Traceability System for Colombian Coffee', 1,
'10.1016/j.compag.2024.108234', NULL, '2024-07-10', 'Computers and Electronics in Agriculture', 2, 2),
(4, 2, 'PROTOTYPE-COFFEECHAIN-001', 'PROTOTYPE', 'CoffeeChain: Prototipo de Plataforma Blockchain', 1,
NULL, 'https://coffeechain-demo.eafit.edu.co', '2024-08-15', NULL, 2, 2),
(5, 3, 'PLATFORM-SMARTCITY-001', 'PLATFORM', 'Manizales Smart City Dashboard', 1,
NULL, 'https://smart.manizales.gov.co', '2024-05-30', NULL, 3, 3),
(6, 3, 'DATASET-ENVDATA-001', 'DATASET', 'Conjunto de Datos de Monitoreo Ambiental Urbano', 1,
'10.5194/essd-2024-123', 'https://zenodo.org/record/8901234', '2024-09-01', NULL, 3, 3),
(7, 4, 'SOFT-CHEMVR-001', 'SOFTWARE', 'ChemVR: Laboratorio Virtual de Química Orgánica', 1,
NULL, 'https://github.com/javeriana/chemvr', '2024-04-25', NULL, 2, 2),
(8, 4, 'ART-VR-EDUC-001', 'ART_B', 'Effectiveness of Virtual Reality in Organic Chemistry Education', 1,
'10.1007/s10956-024-09876-1', NULL, '2024-08-20', 'Journal of Science Education and Technology', 2, 2),
(9, 5, 'ART-BIOINF-CANCER-001', 'ART_A1', 'Genomic Biomarker Discovery in Colorectal Cancer', 0,
'10.1038/s41588-024-01543-2', NULL, '2024-11-15', 'Nature Genetics', 1, 1),
(10, 5, 'DATABASE-GENOMIC-COL-001', 'DATABASE', 'Base de Datos Genómica de Cáncer Colorrectal', 0,
NULL, 'https://genomics.udea.edu.co/colorectal-db', '2024-10-10', NULL, 1, 1),
(11, 6, 'ART-SOLAR-OPT-001', 'ART_A2', 'AI-Based Optimization of Photovoltaic Systems', 1,
'10.1016/j.renene.2024.119856', NULL, '2024-06-30', 'Renewable Energy', 3, 3),
(12, 6, 'PATENT-SOLAR-CTRL-001', 'PATENT', 'Sistema de Control Adaptativo para Paneles Solares', 1,
NULL, NULL, '2024-09-12', NULL, 3, 3);

-- AUTORÍA DE PRODUCTOS
INSERT OR IGNORE INTO product_authors (product_id, user_id, author_order, contribution_type, added_by) VALUES
(1, 1, 1, 'Autor principal - Desarrollo de algoritmos', 1),
(1, 2, 2, 'Co-autor - Validación clínica', 1),
(1, 3, 3, 'Co-autor - Análisis estadístico', 1),
(2, 1, 1, 'Desarrollador principal - Arquitectura del sistema', 1),
(2, 3, 2, 'Co-desarrollador - Interfaz de usuario', 1),
(3, 2, 1, 'Autor principal - Diseño de smart contracts', 2),
(3, 1, 2, 'Co-autor - Análisis de casos de uso', 2),
(3, 3, 3, 'Co-autor - Implementación piloto', 2),
(4, 2, 1, 'Desarrollador principal - Aplicación móvil', 2),
(4, 3, 2, 'Co-desarrollador - Backend blockchain', 2),
(5, 3, 1, 'Arquitecto principal - Sistema IoT', 3),
(5, 1, 2, 'Co-diseñador - Dashboard analítico', 3),
(5, 2, 3, 'Consultor técnico - Integración de datos', 3),
(6, 3, 1, 'Curador principal - Recolección de datos', 3),
(6, 2, 2, 'Co-curador - Validación de calidad', 3),
(7, 2, 1, 'Desarrollador principal - Motor VR', 2),
(7, 1, 2, 'Co-desarrollador - Contenido educativo', 2),
(8, 2, 1, 'Autor principal - Metodología de evaluación', 2),
(8, 1, 2, 'Co-autor - Diseño experimental', 2),
(8, 3, 3, 'Co-autor - Análisis estadístico', 2),
(9, 1, 1, 'Autor principal - Algoritmos de ML', 1),
(9, 3, 2, 'Co-autor - Análisis genómico', 1),
(10, 1, 1, 'Curador principal - Base de datos', 1),
(10, 2, 2, 'Co-curador - Validación de datos', 1),
(11, 3, 1, 'Autor principal - Optimización IA', 3),
(11, 1, 2, 'Co-autor - Modelado matemático', 3),
(11, 2, 3, 'Co-autor - Simulación computacional', 3),
(12, 3, 1, 'Inventor principal - Sistema de control', 3),
(12, 1, 2, 'Co-inventor - Algoritmos de optimización', 3);

-- COLABORADORES EN PROYECTOS
INSERT OR IGNORE INTO project_collaborators (project_id, user_id, added_at) VALUES
(1, 2, '2024-01-20 09:00:00'),
(1, 3, '2024-01-25 10:30:00'),
(2, 1, '2024-02-05 14:15:00'),
(2, 3, '2024-02-10 11:45:00'),
(3, 1, '2024-03-20 08:30:00'),
(3, 2, '2024-03-25 13:20:00'),
(4, 1, '2024-01-25 15:00:00'),
(4, 3, '2024-02-01 09:15:00'),
(5, 2, '2024-05-10 10:00:00'),
(5, 3, '2024-05-15 14:30:00'),
(6, 1, '2024-04-15 11:20:00'),
(6, 2, '2024-04-20 16:45:00');
