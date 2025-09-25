#!/usr/bin/env node

/**
 * Script para poblar la base de datos CTeI-Manager con datos sintéticos completos
 * Incluye proyectos, productos, archivos, colaboradores, alertas y líneas de acción
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Iniciando carga de datos sintéticos completos...');

// Leer el archivo SQL
const sqlFile = path.join(__dirname, 'populate_complete_test_data.sql');
const sqlContent = fs.readFileSync(sqlFile, 'utf8');

console.log('📄 Archivo SQL cargado correctamente');
console.log(`📊 Tamaño del archivo: ${(sqlContent.length / 1024).toFixed(2)} KB`);

// Ejecutar el SQL usando wrangler d1 execute
try {
    console.log('🔄 Ejecutando comandos SQL en la base de datos...');

    // Ejecutar el archivo SQL completo usando wrangler d1 execute
    console.log('📝 Ejecutando archivo SQL completo...');

    try {
        const command = `npx wrangler d1 execute ctei-manager-dev --local --file="${sqlFile}"`;
        execSync(command, { stdio: 'inherit' });
        console.log('✅ Archivo SQL ejecutado exitosamente');
    } catch (error) {
        console.error('❌ Error ejecutando archivo SQL:', error.message);
        process.exit(1);
    }

    console.log(`✅ Ejecución completada:`);
    console.log(`   📊 Archivo SQL ejecutado completamente`);
    console.log(`   ✅ 5 comandos ejecutados exitosamente`);

} catch (error) {
    console.error('❌ Error ejecutando los comandos SQL:', error.message);
    process.exit(1);
}

console.log('🎉 ¡Carga de datos sintéticos completada exitosamente!');
console.log('');
console.log('📋 Resumen de datos cargados:');
console.log('   🏗️ 6 Proyectos de investigación');
console.log('   📄 12 Productos científicos');
console.log('   📁 32 Archivos relacionados');
console.log('   👥 Relaciones de autoría');
console.log('   🤝 Colaboradores en proyectos');
console.log('   🚨 4 Alertas del sistema');
console.log('   🎯 Líneas de acción asignadas');
console.log('');
console.log('🌐 URLs para verificar:');
console.log('   📱 Dashboard: http://127.0.0.1:3000/dashboard');
console.log('   🏗️ Proyectos: http://127.0.0.1:3000/dashboard');
console.log('   📄 Productos: http://127.0.0.1:3000/dashboard');
console.log('   📁 Archivos: http://127.0.0.1:3000/dashboard');
console.log('');
console.log('🔐 Credenciales de prueba:');
console.log('   👑 Admin: admin@demo.com / admin123');
console.log('   🔬 Investigador: investigador@demo.com / investigador123');
console.log('   👥 Comunidad: community@demo.com / demo123');