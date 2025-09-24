#!/usr/bin/env node

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

console.log('🗄️ Configurando base de datos local CTeI-Manager...');

// Crear directorio de BD local
const dbDir = './.wrangler/state/v3/d1';
const dbPath = path.join(dbDir, 'miniflare-D1DatabaseObject');

// Crear directorio si no existe
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('📁 Directorio de BD creado:', dbDir);
}

// Crear conexión a SQLite
const db = new Database(dbPath + '/db.sqlite');
console.log('💾 Base de datos SQLite creada:', dbPath + '/db.sqlite');

// Aplicar migración principal
console.log('📋 Aplicando esquema principal...');

// Esquema de usuarios
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('ADMIN', 'INVESTIGATOR', 'COMMUNITY')) DEFAULT 'COMMUNITY',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);
`);

// Esquema de proyectos
db.exec(`
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
`);

// Esquema de productos
db.exec(`
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
`);

// Tabla de colaboradores
db.exec(`
CREATE TABLE IF NOT EXISTS project_collaborators (
    project_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    added_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
`);

// Tabla de archivos
db.exec(`
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    file_type TEXT NOT NULL CHECK(file_type IN ('document', 'image', 'video', 'audio', 'other')),
    mime_type TEXT NOT NULL,
    project_id INTEGER,
    product_id INTEGER,
    uploaded_by INTEGER NOT NULL,
    upload_path TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);
`);

console.log('✅ Esquemas de tablas aplicados');

// Insertar usuario administrador
console.log('👤 Insertando usuario administrador...');

const adminInsert = db.prepare(`
    INSERT OR REPLACE INTO users (email, password_hash, full_name, role, created_at, updated_at) 
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const investigadorInsert = db.prepare(`
    INSERT OR REPLACE INTO users (email, password_hash, full_name, role, created_at, updated_at) 
    VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
`);

// Hash bcrypt para 'admin123'
const adminResult = adminInsert.run(
    'admin@demo.com',
    '$2b$10$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi',
    'Administrador Demo',
    'ADMIN'
);

// Hash bcrypt para 'investigador123'
const investigadorResult = investigadorInsert.run(
    'investigador@demo.com',
    '$2b$10$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm',
    'Dr. Investigador Demo',
    'INVESTIGATOR'
);

console.log('✅ Admin insertado - ID:', adminResult.lastInsertRowid);
console.log('✅ Investigador insertado - ID:', investigadorResult.lastInsertRowid);

// Verificar usuarios
const users = db.prepare('SELECT id, email, full_name, role FROM users').all();
console.log('👥 Usuarios en la base de datos:');
users.forEach(user => {
    console.log(`  - ${user.email} (${user.role}) - ID: ${user.id}`);
});

// Insertar proyecto de ejemplo
console.log('📊 Insertando proyecto de ejemplo...');

const projectInsert = db.prepare(`
    INSERT INTO projects (title, abstract, keywords, introduction, methodology, owner_id, is_public) 
    VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const projectResult = projectInsert.run(
    'Proyecto de Investigación en IA',
    'Este es un proyecto de ejemplo para demostrar el sistema CTeI-Manager',
    'inteligencia artificial, machine learning, investigación',
    'La inteligencia artificial representa uno de los campos más prometedores...',
    'Se utilizará una metodología mixta combinando análisis cuantitativo y cualitativo...',
    adminResult.lastInsertRowid, // owner_id = admin
    1 // is_public = true
);

console.log('✅ Proyecto de ejemplo insertado - ID:', projectResult.lastInsertRowid);

// Insertar producto de ejemplo
const productInsert = db.prepare(`
    INSERT INTO products (project_id, product_code, product_type, description) 
    VALUES (?, ?, ?, ?)
`);

const productResult = productInsert.run(
    projectResult.lastInsertRowid,
    'TOP-001-2024',
    'TOP',
    'Artículo científico sobre algoritmos de machine learning'
);

console.log('✅ Producto de ejemplo insertado - ID:', productResult.lastInsertRowid);

db.close();

console.log('');
console.log('🎉 ¡Base de datos configurada exitosamente!');
console.log('');
console.log('🔑 CREDENCIALES DE ACCESO:');
console.log('👤 Admin: admin@demo.com / admin123');
console.log('👨‍🔬 Investigador: investigador@demo.com / investigador123');
console.log('');
console.log('📊 DATOS DE EJEMPLO:');
console.log('- 1 proyecto de investigación');
console.log('- 1 producto científico (TOP)');
console.log('- 2 usuarios activos');