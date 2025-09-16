-- Insertar usuarios demo
DELETE FROM users WHERE email IN ('admin@ctei.gov.co', 'researcher@ctei.gov.co', 'viewer@ctei.gov.co');
INSERT INTO users (email, password_hash, full_name, role) VALUES ('admin@ctei.gov.co', '$2b$10$JutUxPbOkpgXfkLoWqY2yOEvlwD2baT/p2KtpSitIHyzZyQvrtAHO', 'Administrador del Sistema', 'ADMIN');
INSERT INTO users (email, password_hash, full_name, role) VALUES ('researcher@ctei.gov.co', '$2b$10$VEOlTn3VvV0p6hx1vyLb9O5Ilwzu.zCuv6haGRcRzUxrCHZl20fPe', 'Investigador Principal', 'INVESTIGATOR');
INSERT INTO users (email, password_hash, full_name, role) VALUES ('viewer@ctei.gov.co', '$2b$10$8DUlhS4vNZ9JW13K.i5TaOYxBhhTHo5Mj07Mm60C3wEaIKofyharO', 'Usuario Visualizador', 'COMMUNITY');