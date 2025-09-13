-- Migración 0005: Sistema completo de gestión de archivos
-- Fecha: 2024-09-12
-- Descripción: Tabla para gestionar archivos subidos al sistema

-- Crear tabla de archivos
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('document', 'image', 'project', 'product', 'logo', 'general')),
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    entity_type TEXT CHECK (entity_type IN ('project', 'product', 'user', 'general')),
    entity_id TEXT,
    uploaded_by INTEGER,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_files_entity ON files(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_files_type ON files(file_type);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by ON files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_files_uploaded_at ON files(uploaded_at);

-- Trigger para actualizar timestamp
CREATE TRIGGER IF NOT EXISTS update_files_timestamp 
    AFTER UPDATE ON files
BEGIN
    UPDATE files SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;