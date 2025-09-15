-- =============================================
-- DATOS REALISTAS PARA PROYECTO CTeI-MANAGER
-- 6 Proyectos + 12 Productos de Investigación
-- =============================================

-- PROYECTOS DE INVESTIGACIÓN REALISTAS
INSERT OR IGNORE INTO projects (
  id, title, abstract, keywords, introduction, methodology, 
  owner_id, is_public, status, start_date, end_date, 
  institution, funding_source, budget, project_code
) VALUES

-- 1. PROYECTO DE INTELIGENCIA ARTIFICIAL EN SALUD
(1, 
'Desarrollo de Algoritmos de Deep Learning para Diagnóstico Automatizado de Enfermedades Respiratorias', 
'Investigación orientada al desarrollo de modelos de inteligencia artificial basados en redes neuronales convolucionales para el análisis automatizado de imágenes radiológicas de tórax, con el objetivo de mejorar la precisión diagnóstica y reducir los tiempos de detección de patologías respiratorias como neumonía, tuberculosis y COVID-19.',
'inteligencia artificial, deep learning, diagnóstico médico, radiología, redes neuronales convolucionales, COVID-19, tuberculosis, neumonía',
'Las enfermedades respiratorias representan una de las principales causas de morbimortalidad a nivel mundial. La implementación de tecnologías de inteligencia artificial en el ámbito médico ha demostrado un potencial significativo para mejorar la precisión diagnóstica y optimizar los recursos en salud. Este proyecto busca desarrollar herramientas de apoyo al diagnóstico que permitan a los profesionales médicos tomar decisiones más informadas y oportunas.',
'La metodología combina técnicas de aprendizaje profundo con validación clínica. Se utilizarán datasets públicos y privados de imágenes radiológicas, implementando arquitecturas CNN como ResNet, DenseNet y Vision Transformers. El proceso incluye preprocesamiento de imágenes, aumento de datos, entrenamiento supervisado y validación cruzada con métricas de sensibilidad, especificidad y AUC-ROC.',
1, 1, 'ACTIVE', '2024-01-15', '2025-01-15',
'Universidad Nacional de Colombia - Facultad de Medicina', 'MinCiencias - Convocatoria 891-2023', 850000000.00, 'CTeI-AI-MED-001'),

-- 2. PROYECTO DE BLOCKCHAIN EN CADENAS DE SUMINISTRO
(2,
'Implementación de Tecnología Blockchain para Trazabilidad en Cadenas de Suministro Agroindustriales Colombianas',
'Desarrollo de una plataforma basada en tecnología blockchain para garantizar la trazabilidad, transparencia y autenticidad en las cadenas de suministro del sector agroindustrial colombiano, con enfoque en productos de exportación como café, flores y frutas tropicales.',
'blockchain, trazabilidad, cadena de suministro, agroindustria, smart contracts, café, exportación, transparencia',
'Colombia es uno de los principales exportadores agrícolas de América Latina, sin embargo, la falta de trazabilidad en las cadenas de suministro genera pérdidas económicas y afecta la confianza internacional. La tecnología blockchain ofrece una solución inmutable y transparente para registrar cada etapa del proceso productivo, desde el campo hasta el consumidor final.',
'Se desarrollará una arquitectura blockchain híbrida utilizando Hyperledger Fabric para la red privada de productores y Ethereum para las transacciones públicas. La metodología incluye análisis de procesos agroindustriales, diseño de smart contracts, desarrollo de interfaces móviles y web, y piloto con 50 productores cafeteros del Eje Cafetero.',
2, 1, 'ACTIVE', '2024-02-01', '2024-12-31',
'Universidad EAFIT - Departamento de Ingeniería de Sistemas', 'Ministerio de Agricultura y Desarrollo Rural', 720000000.00, 'CTeI-BLOCK-AGR-002'),

-- 3. PROYECTO DE IOT PARA CIUDADES INTELIGENTES  
(3,
'Red de Sensores IoT para Monitoreo Ambiental y Gestión Inteligente de Recursos Urbanos',
'Diseño e implementación de una red integrada de sensores IoT para el monitoreo en tiempo real de variables ambientales urbanas (calidad del aire, ruido, temperatura, humedad) y optimización del uso de recursos públicos (alumbrado, riego, tráfico) en ciudades intermedias colombianas.',
'IoT, ciudades inteligentes, monitoreo ambiental, sensores, big data, sostenibilidad urbana, calidad del aire',
'Las ciudades intermedias de Colombia enfrentan desafíos crecientes relacionados con la calidad ambiental y la eficiencia en el uso de recursos. La implementación de tecnologías IoT permite recopilar datos en tiempo real para la toma de decisiones informadas en política pública urbana, contribuyendo al desarrollo sostenible y mejorando la calidad de vida ciudadana.',
'Metodología de investigación aplicada con enfoque experimental. Despliegue de 200 nodos sensores distribuidos estratégicamente, desarrollo de plataforma de analítica de datos con Apache Kafka y Spark, creación de dashboard para tomadores de decisión y validación durante 12 meses en Manizales como ciudad piloto.',
3, 1, 'DEVELOPMENT', '2024-03-15', '2025-03-15',
'Universidad de Caldas - Facultad de Ingeniería', 'Alcaldía de Manizales - Convenio Especial', 650000000.00, 'CTeI-IOT-CITY-003'),

-- 4. PROYECTO DE REALIDAD VIRTUAL EN EDUCACIÓN
(4,
'Entornos de Realidad Virtual Inmersiva para la Enseñanza de Química Orgánica en Educación Superior',
'Creación de laboratorios virtuales inmersivos utilizando tecnologías de realidad virtual para la enseñanza de química orgánica, permitiendo a los estudiantes manipular moléculas en 3D, realizar reacciones químicas simuladas y acceder a experiencias de aprendizaje imposibles en laboratorios físicos tradicionales.',
'realidad virtual, educación superior, química orgánica, laboratorios virtuales, aprendizaje inmersivo, simulación molecular',
'La enseñanza de química orgánica presenta desafíos únicos debido a la naturaleza abstracta de las estructuras moleculares y los mecanismos de reacción. Las tecnologías de realidad virtual ofrecen oportunidades sin precedentes para visualizar y manipular estructuras químicas complejas, mejorando la comprensión conceptual y el engagement estudiantil.',
'Metodología de diseño centrado en el usuario con desarrollo iterativo. Creación de contenidos 3D moleculares, implementación en Unity con integración de dispositivos VR (Oculus, HTC Vive), diseño de actividades pedagógicas gamificadas y evaluación de efectividad de aprendizaje mediante estudios cuasi-experimentales con 300 estudiantes.',
2, 1, 'ACTIVE', '2024-01-20', '2024-11-30',
'Universidad Javeriana - Facultad de Ciencias', 'MinEducación - Convocatoria Innovación Educativa', 480000000.00, 'CTeI-VR-EDU-004'),

-- 5. PROYECTO DE BIOINFORMÁTICA Y GENÓMICA
(5,
'Análisis Genómico Computacional para Identificación de Biomarcadores en Cáncer Colorrectal en Población Colombiana',
'Desarrollo de pipelines bioinformáticos para el análisis de datos genómicos masivos orientados a la identificación de biomarcadores específicos de cáncer colorrectal en población colombiana, utilizando técnicas de machine learning y análisis de expresión diferencial.',
'bioinformática, genómica, cáncer colorrectal, biomarcadores, machine learning, NGS, análisis genómico',
'El cáncer colorrectal presenta particularidades genómicas específicas según la población. La identificación de biomarcadores en población colombiana puede contribuir al desarrollo de terapias personalizadas y estrategias de prevención más efectivas. La bioinformática computacional permite analizar grandes volúmenes de datos genómicos para identificar patrones relevantes.',
'Metodología de análisis bioinformático con pipeline automatizado. Procesamiento de datos RNA-seq y WGS de 500 muestras, implementación de algoritmos de ML (Random Forest, SVM, Deep Learning), análisis de expresión diferencial con DESeq2, validación funcional y desarrollo de modelo predictivo con validación cruzada.',
1, 1, 'PLANNING', '2024-05-01', '2025-04-30',
'Universidad de Antioquia - Facultad de Medicina', 'Colciencias - Programa Nacional de Biotecnología', 920000000.00, 'CTeI-BIOINF-005'),

-- 6. PROYECTO DE ENERGÍAS RENOVABLES
(6,
'Optimización de Sistemas Fotovoltaicos Mediante Algoritmos de Inteligencia Artificial para Condiciones Climáticas del Trópico Colombiano',
'Investigación orientada al desarrollo de algoritmos de optimización basados en inteligencia artificial para maximizar la eficiencia de sistemas fotovoltaicos en condiciones climáticas tropicales, considerando variables como irradiancia, temperatura, humedad y nubosidad típicas del territorio colombiano.',
'energía solar, fotovoltaico, inteligencia artificial, optimización, energías renovables, algoritmos genéticos, trópico',
'Colombia tiene un potencial significativo en energía solar debido a su ubicación ecuatorial, sin embargo, las condiciones climáticas tropicales presentan desafíos únicos para la eficiencia fotovoltaica. El desarrollo de sistemas de optimización inteligente puede aumentar significativamente el rendimiento energético y acelerar la adopción de energías renovables en el país.',
'Metodología experimental con simulación computacional. Implementación de algoritmos de optimización (genéticos, enjambre de partículas, redes neuronales), modelado de sistemas fotovoltaicos con PVLib, integración de datos meteorológicos históricos, desarrollo de sistema de control adaptativo y validación en planta piloto de 100kW en Guajira.',
3, 1, 'ACTIVE', '2024-04-10', '2025-04-10',
'Universidad Nacional - Facultad de Ingeniería', 'MinEnergía - Programa FENOGE', 780000000.00, 'CTeI-SOLAR-006');


-- =============================================
-- PRODUCTOS CIENTÍFICOS REALISTAS (12 productos)
-- =============================================

INSERT OR IGNORE INTO products (
  id, project_id, product_code, product_type, description, is_public,
  doi, url, publication_date, journal, creator_id, last_editor_id
) VALUES

-- PRODUCTOS DEL PROYECTO 1 (AI en Salud)
(1, 1, 'ART-AI-RAD-2024-001', 'ART_A1', 'Deep Learning for Automated Chest X-Ray Analysis: A Comprehensive Study on COVID-19, Pneumonia and Tuberculosis Detection in Latin American Populations', 1,
'10.1038/s41598-024-12345-6', NULL, '2024-03-15', 'Nature Scientific Reports', 1, 1),

(2, 1, 'SOFT-DIAGNET-001', 'SOFTWARE', 'DiagNet: Sistema de Diagnóstico Automatizado Basado en Deep Learning para Análisis Radiológico', 1,
NULL, 'https://github.com/ctei-unal/diagnet', '2024-06-20', NULL, 1, 1),

-- PRODUCTOS DEL PROYECTO 2 (Blockchain Agroindustrial)  
(3, 2, 'ART-BLOCK-SUPPLY-001', 'ART_A2', 'Blockchain-Based Traceability System for Colombian Coffee Supply Chain: Implementation and Validation Study', 1,
'10.1016/j.compag.2024.108234', NULL, '2024-07-10', 'Computers and Electronics in Agriculture', 2, 2),

(4, 2, 'PROTOTYPE-COFFEECHAIN-001', 'PROTOTYPE', 'CoffeeChain: Prototipo de Plataforma Blockchain para Trazabilidad Cafetera', 1,
NULL, 'https://coffeechain-demo.eafit.edu.co', '2024-08-15', NULL, 2, 2),

-- PRODUCTOS DEL PROYECTO 3 (IoT Ciudades Inteligentes)
(5, 3, 'PLATFORM-SMARTCITY-001', 'PLATFORM', 'Manizales Smart City Dashboard: Plataforma de Monitoreo Ambiental Urbano en Tiempo Real', 1,
NULL, 'https://smart.manizales.gov.co', '2024-05-30', NULL, 3, 3),

(6, 3, 'DATASET-ENVDATA-001', 'DATASET', 'Conjunto de Datos de Monitoreo Ambiental Urbano: Manizales 2024', 1,
'10.5194/essd-2024-123', 'https://zenodo.org/record/8901234', '2024-09-01', NULL, 3, 3),

-- PRODUCTOS DEL PROYECTO 4 (VR Educación)
(7, 4, 'SOFT-CHEMVR-001', 'SOFTWARE', 'ChemVR: Laboratorio Virtual de Química Orgánica en Realidad Virtual Inmersiva', 1,
NULL, 'https://github.com/javeriana/chemvr', '2024-04-25', NULL, 2, 2),

(8, 4, 'ART-VR-EDUC-001', 'ART_B', 'Effectiveness of Virtual Reality in Organic Chemistry Education: A Comparative Study in Colombian Higher Education', 1,
'10.1007/s10956-024-09876-1', NULL, '2024-08-20', 'Journal of Science Education and Technology', 2, 2),

-- PRODUCTOS DEL PROYECTO 5 (Bioinformática)
(9, 5, 'ART-BIOINF-CANCER-001', 'ART_A1', 'Genomic Biomarker Discovery in Colorectal Cancer: Machine Learning Analysis of Colombian Population Data', 0,
'10.1038/s41588-024-01543-2', NULL, '2024-11-15', 'Nature Genetics', 1, 1),

(10, 5, 'DATABASE-GENOMIC-COL-001', 'DATABASE', 'Base de Datos Genómica de Cáncer Colorrectal en Población Colombiana', 0,
NULL, 'https://genomics.udea.edu.co/colorectal-db', '2024-10-10', NULL, 1, 1),

-- PRODUCTOS DEL PROYECTO 6 (Energía Solar)
(11, 6, 'ART-SOLAR-OPT-001', 'ART_A2', 'AI-Based Optimization of Photovoltaic Systems Performance Under Tropical Climate Conditions', 1,
'10.1016/j.renene.2024.119856', NULL, '2024-06-30', 'Renewable Energy', 3, 3),

(12, 6, 'PATENT-SOLAR-CTRL-001', 'PATENT', 'Sistema de Control Adaptativo para Optimización de Paneles Solares en Clima Tropical', 1,
NULL, NULL, '2024-09-12', NULL, 3, 3);