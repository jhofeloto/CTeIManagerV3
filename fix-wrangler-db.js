#!/usr/bin/env node

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

console.log('🔧 Reparando base de datos para Wrangler...');

// Buscar todos los archivos SQLite en .wrangler
const dbDir = './.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
const dbFiles = fs.readdirSync(dbDir).filter(f => f.endsWith('.sqlite'));

console.log('📂 Archivos SQLite encontrados:', dbFiles);

for (const dbFile of dbFiles) {
    const dbPath = path.join(dbDir, dbFile);
    console.log(`\n💾 Configurando ${dbFile}...`);
    
    const db = new Database(dbPath);
    
    // Aplicar esquema completo
    try {
        // Usuarios
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
        
        // Proyectos
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
        
        // Productos
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
        
        // Colaboradores
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
        
        // Archivos
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
        
        // Instituciones (tabla opcional que causaba error)
        db.exec(`
        CREATE TABLE IF NOT EXISTS institutions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            created_at TEXT DEFAULT (datetime('now'))
        );
        `);
        
        // Categorías de productos (tabla opcional que causaba error)
        db.exec(`
        CREATE TABLE IF NOT EXISTS product_categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_code TEXT UNIQUE NOT NULL,
            category_name TEXT NOT NULL,
            description TEXT,
            created_at TEXT DEFAULT (datetime('now'))
        );
        `);
        
        console.log('✅ Esquemas aplicados');
        
        // Insertar usuarios solo si no existen
        const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
        
        if (userCount.count === 0) {
            console.log('👤 Insertando usuarios...');
            
            // Admin
            db.prepare(`
                INSERT INTO users (email, password_hash, full_name, role) 
                VALUES (?, ?, ?, ?)
            `).run(
                'admin@demo.com',
                '$2b$10$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi',
                'Administrador Demo',
                'ADMIN'
            );
            
            // Investigador
            db.prepare(`
                INSERT INTO users (email, password_hash, full_name, role) 
                VALUES (?, ?, ?, ?)
            `).run(
                'investigador@demo.com',
                '$2b$10$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm',
                'Dr. Investigador Demo',
                'INVESTIGATOR'
            );
            
            console.log('✅ Usuarios insertados');
            
            // Insertar proyecto de ejemplo
            const projectResult = db.prepare(`
                INSERT INTO projects (title, abstract, keywords, introduction, methodology, owner_id, is_public) 
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `).run(
                'Proyecto IA - Demostración',
                'Proyecto de ejemplo para mostrar funcionalidades del sistema CTeI-Manager',
                'inteligencia artificial, machine learning, investigación',
                'La inteligencia artificial representa uno de los campos más prometedores para el desarrollo científico...',
                'Se utilizará metodología mixta combinando análisis cuantitativo y cualitativo...',
                1, // admin ID
                1  // público
            );
            
            // Insertar producto de ejemplo
            db.prepare(`
                INSERT INTO products (project_id, product_code, product_type, description) 
                VALUES (?, ?, ?, ?)
            `).run(
                projectResult.lastInsertRowid,
                'TOP-001-2024',
                'TOP',
                'Artículo científico sobre algoritmos de machine learning aplicados a la investigación'
            );
            
            console.log('✅ Datos de ejemplo insertados');
        } else {
            console.log('👥 Usuarios ya existen, saltando inserción');
        }
        
        // Insertar categorías básicas si no existen
        const categoryCount = db.prepare('SELECT COUNT(*) as count FROM product_categories').get();
        if (categoryCount.count === 0) {
            const categories = [
                ['TOP', 'Tipo TOP', 'Productos de alto reconocimiento'],
                ['A', 'Tipo A', 'Productos reconocidos'], 
                ['B', 'Tipo B', 'Productos validados'],
                ['ASC', 'Apropiación Social', 'Productos de apropiación social del conocimiento'],
                ['DPC', 'Desarrollo de Capacidades', 'Productos de desarrollo de capacidades'],
                ['FRH_A', 'Formación RH - A', 'Formación de recursos humanos nivel avanzado'],
                ['FRH_B', 'Formación RH - B', 'Formación de recursos humanos nivel básico']
            ];
            
            const insertCategory = db.prepare('INSERT INTO product_categories (category_code, category_name, description) VALUES (?, ?, ?)');
            
            for (const [code, name, desc] of categories) {
                insertCategory.run(code, name, desc);
            }
            
            console.log('✅ Categorías de productos insertadas');
        }
        
        // Insertar institución básica si no existe
        const instCount = db.prepare('SELECT COUNT(*) as count FROM institutions').get();
        if (instCount.count === 0) {
            db.prepare('INSERT INTO institutions (name, code) VALUES (?, ?)').run(
                'Universidad Tecnológica del Chocó',
                'UTCH'
            );
            console.log('✅ Institución básica insertada');
        }
        
    } catch (error) {
        console.error(`❌ Error configurando ${dbFile}:`, error.message);
    } finally {
        db.close();
    }
}

console.log('\n🎉 ¡Reparación completada!');
console.log('🔑 Credenciales activas:');
console.log('👤 Admin: admin@demo.com / admin123'); 
console.log('👨‍🔬 Investigador: investigador@demo.com / investigador123');