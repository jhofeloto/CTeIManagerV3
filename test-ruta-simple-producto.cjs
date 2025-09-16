// Script para verificar si el problema es la complejidad de la ruta
// Vamos a buscar en el servidor si la ruta se está registrando correctamente

console.log('Buscando la definición de la ruta de productos...');

const fs = require('fs');
const path = require('path');

// Leer el archivo index.tsx
const filePath = path.join(__dirname, 'src', 'index.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Buscar la línea específica donde está la ruta
const lines = content.split('\n');

let found = false;
let productRouteStart = -1;
let productRouteEnd = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes("app.get('/dashboard/productos/:id/editar'")) {
        console.log(`✅ Ruta encontrada en línea ${i + 1}: ${line.trim()}`);
        productRouteStart = i;
        found = true;
    }
    
    if (found && line.trim() === '})') {
        productRouteEnd = i;
        console.log(`✅ Cierre de ruta encontrado en línea ${i + 1}: ${line.trim()}`);
        break;
    }
}

if (found) {
    console.log(`✅ Ruta completa: líneas ${productRouteStart + 1} - ${productRouteEnd + 1}`);
    console.log(`📏 Longitud de la ruta: ${productRouteEnd - productRouteStart + 1} líneas`);
    
    // Verificar si hay errores de sintaxis obvios
    const routeContent = lines.slice(productRouteStart, productRouteEnd + 1).join('\n');
    
    // Buscar posibles problemas
    const backticks = (routeContent.match(/`/g) || []).length;
    console.log(`📝 Backticks en la ruta: ${backticks} ${backticks % 2 === 0 ? '(PAR ✅)' : '(IMPAR ❌)'}`);
    
    const braces = {
        open: (routeContent.match(/{/g) || []).length,
        close: (routeContent.match(/}/g) || []).length
    };
    console.log(`📝 Llaves: ${braces.open} abiertas, ${braces.close} cerradas ${braces.open === braces.close ? '(BALANCEADAS ✅)' : '(DESBALANCEADAS ❌)'}`);
    
    const parens = {
        open: (routeContent.match(/\(/g) || []).length,
        close: (routeContent.match(/\)/g) || []).length
    };
    console.log(`📝 Paréntesis: ${parens.open} abiertos, ${parens.close} cerrados ${parens.open === parens.close ? '(BALANCEADOS ✅)' : '(DESBALANCEADOS ❌)'}`);
    
} else {
    console.log('❌ Ruta de productos NO encontrada');
}

// Ahora verificar la ruta de proyectos para comparar
console.log('\n--- COMPARANDO CON RUTA DE PROYECTOS ---');

let projectRouteStart = -1;
let projectRouteEnd = -1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes("app.get('/dashboard/proyectos/:id/editar'")) {
        console.log(`✅ Ruta de proyectos encontrada en línea ${i + 1}: ${line.trim()}`);
        projectRouteStart = i;
        
        // Buscar el cierre
        for (let j = i; j < lines.length; j++) {
            if (lines[j].trim() === '})') {
                projectRouteEnd = j;
                console.log(`✅ Cierre de ruta de proyectos en línea ${j + 1}`);
                break;
            }
        }
        break;
    }
}

if (projectRouteStart >= 0 && projectRouteEnd >= 0) {
    console.log(`✅ Ruta de proyectos: líneas ${projectRouteStart + 1} - ${projectRouteEnd + 1}`);
    console.log(`📏 Longitud: ${projectRouteEnd - projectRouteStart + 1} líneas`);
}

// Verificar orden de las rutas
console.log('\n--- ORDEN DE LAS RUTAS ---');
console.log(`Ruta proyectos: línea ${projectRouteStart + 1}`);
console.log(`Ruta productos: línea ${productRouteStart + 1}`);
console.log(`Ruta fallback (*): cerca de línea 10397`);

if (productRouteStart < 10397) {
    console.log('✅ La ruta de productos está ANTES del fallback (correcto)');
} else {
    console.log('❌ La ruta de productos está DESPUÉS del fallback (PROBLEMA)');
}