-- Insertar datos de demostración simples

-- Insertar proyectos básicos usando owner_id en lugar de lead_researcher_id
INSERT INTO projects (title, abstract, status, start_date, end_date, budget, owner_id, institution) VALUES 
('Biodiversidad Marina del Pacífico Chocoano', 'Estudio integral de la biodiversidad marina en las costas del Pacífico chocoano, enfocado en especies endémicas y su conservación.', 'ACTIVE', '2024-01-15', '2025-12-31', 150000000.00, 2, 'Universidad Tecnológica del Chocó'),
('Tecnologías Sostenibles para Comunidades Rurales', 'Desarrollo e implementación de tecnologías apropiadas para mejorar la calidad de vida en comunidades rurales del Chocó.', 'ACTIVE', '2024-03-01', '2026-06-30', 200000000.00, 3, 'Universidad Tecnológica del Chocó'),
('Conservación de Bosques Tropicales', 'Estrategias innovadoras para la conservación y manejo sostenible de bosques tropicales en el Chocó biogeográfico.', 'DRAFT', '2025-01-01', '2027-12-31', 180000000.00, 4, 'SINCHI');