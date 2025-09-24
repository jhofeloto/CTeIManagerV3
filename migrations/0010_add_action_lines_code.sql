-- Migración 0010: Agregar columna 'code' a tabla action_lines
-- Agrega columna 'code' requerida por el frontend

-- Agregar columna code a la tabla action_lines
ALTER TABLE action_lines ADD COLUMN code TEXT UNIQUE;

-- Actualizar las líneas de acción existentes con códigos únicos
UPDATE action_lines SET code = 'MENTALIDAD_CULTURA' WHERE name = 'Mentalidad y Cultura';
UPDATE action_lines SET code = 'SERVICIOS_APOYO' WHERE name = 'Servicios de Apoyo';
UPDATE action_lines SET code = 'FINANCIACION' WHERE name = 'Financiación';
UPDATE action_lines SET code = 'EXPANSION_MERCADOS' WHERE name = 'Expansión Mercados';
UPDATE action_lines SET code = 'FOMENTO_INVERSION' WHERE name = 'Fomento de la Inversión';

-- Crear índice para la nueva columna
CREATE INDEX IF NOT EXISTS idx_action_lines_code ON action_lines(code);