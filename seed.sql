-- CODECTI Platform - Seed data for testing

-- Insert test users (password is "password123" hashed with bcrypt)
-- Admin user
INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES 
('admin@codecti.choco.gov.co', '$2a$10$CwTycUXWue0Thq9StjUM0uJ1/K0nP5K5YZ0XvFVJ.6FbcxXUhQE6m', 'Administrador CODECTI', 'admin');

-- Collaborator users
INSERT OR IGNORE INTO users (email, password_hash, name, role) VALUES 
('investigador1@codecti.choco.gov.co', '$2a$10$CwTycUXWue0Thq9StjUM0uJ1/K0nP5K5YZ0XvFVJ.6FbcxXUhQE6m', 'María Elena Rodríguez', 'collaborator'),
('investigador2@codecti.choco.gov.co', '$2a$10$CwTycUXWue0Thq9StjUM0uJ1/K0nP5K5YZ0XvFVJ.6FbcxXUhQE6m', 'Carlos Alberto Mosquera', 'collaborator'),
('investigador3@codecti.choco.gov.co', '$2a$10$CwTycUXWue0Thq9StjUM0uJ1/K0nP5K5YZ0XvFVJ.6FbcxXUhQE6m', 'Ana Lucía Palacios', 'collaborator');

-- Insert test projects
INSERT OR IGNORE INTO projects (title, responsible_person, summary, status, created_by) VALUES 
('Biodiversidad Acuática del Chocó', 'María Elena Rodríguez', 'Estudio comprehensive de la biodiversidad acuática en las principales cuencas hidrográficas del departamento del Chocó, con enfoque en especies endémicas y en peligro de extinción.', 'active', 2),
('Desarrollo de Tecnologías Verdes para Minería Sostenible', 'Carlos Alberto Mosquera', 'Investigación aplicada para el desarrollo de tecnologías limpias que permitan la explotación minera responsable y sostenible en el Chocó, reduciendo el impacto ambiental.', 'active', 3),
('Fortalecimiento de Cadenas Productivas Agrícolas', 'Ana Lucía Palacios', 'Proyecto de innovación para el fortalecimiento de las cadenas productivas del cacao, plátano y frutas tropicales en comunidades rurales del Chocó.', 'completed', 4),
('Medicina Tradicional y Plantas Medicinales', 'María Elena Rodríguez', 'Sistematización y validación científica del conocimiento tradicional sobre plantas medicinales utilizadas por comunidades afrodescendientes e indígenas del Chocó.', 'active', 2),
('Tecnologías de Información para Educación Rural', 'Carlos Alberto Mosquera', 'Desarrollo e implementación de soluciones tecnológicas para mejorar el acceso y la calidad de la educación en zonas rurales dispersas del departamento.', 'completed', 3);