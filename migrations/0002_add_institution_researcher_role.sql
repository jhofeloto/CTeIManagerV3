-- CODECTI Platform - Add institution field and researcher role
-- Migration: 0002_add_institution_researcher_role.sql

-- Add institution column to users table
ALTER TABLE users ADD COLUMN institution TEXT;

-- Update the role constraint to include 'researcher'
-- Note: SQLite doesn't support direct ALTER TABLE constraint changes
-- So we create a new table and migrate data

-- Create new users table with updated constraints
CREATE TABLE users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    institution TEXT,
    role TEXT NOT NULL CHECK (role IN ('admin', 'collaborator', 'researcher')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Copy existing data to new table
INSERT INTO users_new (id, email, password_hash, name, role, created_at, updated_at, is_active)
SELECT id, email, password_hash, name, role, created_at, updated_at, is_active
FROM users;

-- Drop old table and rename new one
DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_institution ON users(institution);