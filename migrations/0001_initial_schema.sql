-- CTeI-Manager Database Schema
-- Creación de tablas para el sistema de gestión de proyectos de CTeI

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'INVESTIGATOR', 'COMMUNITY')) DEFAULT 'COMMUNITY',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Tabla de proyectos
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    abstract TEXT NOT NULL,
    keywords TEXT,
    introduction TEXT,
    methodology TEXT,
    owner_id INTEGER NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tabla de productos
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    product_code TEXT NOT NULL,
    product_type TEXT NOT NULL CHECK(product_type IN ('TOP', 'A', 'B', 'ASC', 'DPC', 'FRH_A', 'FRH_B')),
    description TEXT NOT NULL,
    is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0, 1)),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Tabla pivot para colaboradores de proyectos
CREATE TABLE IF NOT EXISTS project_collaborators (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    added_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_public ON projects(is_public);
CREATE INDEX IF NOT EXISTS idx_products_project ON products(project_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_public ON products(is_public);
CREATE INDEX IF NOT EXISTS idx_collaborators_project ON project_collaborators(project_id);
CREATE INDEX IF NOT EXISTS idx_collaborators_user ON project_collaborators(user_id);

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER IF NOT EXISTS update_users_updated_at
AFTER UPDATE ON users
BEGIN
    UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_projects_updated_at
AFTER UPDATE ON projects
BEGIN
    UPDATE projects SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_products_updated_at
AFTER UPDATE ON products
BEGIN
    UPDATE products SET updated_at = datetime('now') WHERE id = NEW.id;
END;