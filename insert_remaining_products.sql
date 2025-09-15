-- Insertar productos restantes (productos 2-12)
INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(2, 1, 'SOFT-DIAGNET-001', 'SOFTWARE', 'DiagNet: Sistema de Diagnóstico Automatizado Basado en Deep Learning para Análisis Radiológico', 1, NULL, 'https://github.com/ctei-unal/diagnet', '2024-06-20', NULL);

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(3, 2, 'ART-BLOCK-SUPPLY-001', 'ART_A2', 'Blockchain-Based Traceability System for Colombian Coffee Supply Chain: Implementation and Validation Study', 1, '10.1016/j.compag.2024.108234', NULL, '2024-07-10', 'Computers and Electronics in Agriculture');

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(4, 2, 'PROTOTYPE-COFFEECHAIN-001', 'PROTOTYPE', 'CoffeeChain: Prototipo de Plataforma Blockchain para Trazabilidad Cafetera', 1, NULL, 'https://coffeechain-demo.eafit.edu.co', '2024-08-15', NULL);

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(5, 3, 'PLATFORM-SMARTCITY-001', 'PLATFORM', 'Manizales Smart City Dashboard: Plataforma de Monitoreo Ambiental Urbano en Tiempo Real', 1, NULL, 'https://smart.manizales.gov.co', '2024-05-30', NULL);

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(6, 3, 'DATASET-ENVDATA-001', 'DATASET', 'Conjunto de Datos de Monitoreo Ambiental Urbano: Manizales 2024', 1, '10.5194/essd-2024-123', 'https://zenodo.org/record/8901234', '2024-09-01', NULL);

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(7, 4, 'SOFT-CHEMVR-001', 'SOFTWARE', 'ChemVR: Laboratorio Virtual de Química Orgánica en Realidad Virtual Inmersiva', 1, NULL, 'https://github.com/javeriana/chemvr', '2024-04-25', NULL);

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(8, 4, 'ART-VR-EDUC-001', 'ART_B', 'Effectiveness of Virtual Reality in Organic Chemistry Education: A Comparative Study in Colombian Higher Education', 1, '10.1007/s10956-024-09876-1', NULL, '2024-08-20', 'Journal of Science Education and Technology');

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(9, 5, 'ART-BIOINF-CANCER-001', 'ART_A1', 'Genomic Biomarker Discovery in Colorectal Cancer: Machine Learning Analysis of Colombian Population Data', 0, '10.1038/s41588-024-01543-2', NULL, '2024-11-15', 'Nature Genetics');

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(10, 5, 'DATABASE-GENOMIC-COL-001', 'DATABASE', 'Base de Datos Genómica de Cáncer Colorrectal en Población Colombiana', 0, NULL, 'https://genomics.udea.edu.co/colorectal-db', '2024-10-10', NULL);

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(11, 6, 'ART-SOLAR-OPT-001', 'ART_A2', 'AI-Based Optimization of Photovoltaic Systems Performance Under Tropical Climate Conditions', 1, '10.1016/j.renene.2024.119856', NULL, '2024-06-30', 'Renewable Energy');

INSERT OR IGNORE INTO products (id, project_id, product_code, product_type, description, is_public, doi, url, publication_date, journal) VALUES 
(12, 6, 'PATENT-SOLAR-CTRL-001', 'PATENT', 'Sistema de Control Adaptativo para Optimización de Paneles Solares en Clima Tropical', 1, NULL, NULL, '2024-09-12', NULL);