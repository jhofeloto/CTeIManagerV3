// Script para probar la funcionalidad "Mis Productos"
// Simula las acciones de usuario en la interfaz

const API_BASE = 'http://localhost:3000/api';

// Función para obtener token de autenticación
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.token;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('❌ Error en login:', error);
    return null;
  }
}

// Función para probar la API de productos
async function testMyProductsAPI(token) {
  try {
    console.log('🔍 Probando API de Mis Productos...');
    
    const response = await fetch(`${API_BASE}/private/products`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ API funciona correctamente');
      console.log(`📊 Total de productos: ${data.data.products.length}`);
      
      data.data.products.forEach((product, index) => {
        console.log(`\n📋 Producto ${index + 1}:`);
        console.log(`   Código: ${product.product_code}`);
        console.log(`   Tipo: ${product.product_type}`);
        console.log(`   Descripción: ${product.description.substring(0, 80)}...`);
        console.log(`   Proyecto: ${product.project_title}`);
        console.log(`   Público: ${product.is_public ? '✅' : '❌'}`);
      });
      
      return data.data.products;
    } else {
      console.error('❌ Error en API:', data.error);
      return null;
    }
  } catch (error) {
    console.error('❌ Error probando API:', error);
    return null;
  }
}

// Función principal de prueba
async function testMisProductos() {
  console.log('🚀 INICIANDO PRUEBAS DE MIS PRODUCTOS\n');
  
  // Probar con usuario investigador
  console.log('👤 Probando con usuario INVESTIGADOR...');
  const investigadorToken = await login('investigador@demo.com', 'investigador123');
  
  if (investigadorToken) {
    console.log('✅ Login exitoso como investigador');
    const investigadorProducts = await testMyProductsAPI(investigadorToken);
    
    if (investigadorProducts) {
      console.log(`\n📈 RESUMEN INVESTIGADOR: ${investigadorProducts.length} productos encontrados`);
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Probar con usuario admin
  console.log('👤 Probando con usuario ADMIN...');
  const adminToken = await login('admin@demo.com', 'admin123');
  
  if (adminToken) {
    console.log('✅ Login exitoso como admin');
    const adminProducts = await testMyProductsAPI(adminToken);
    
    if (adminProducts) {
      console.log(`\n📈 RESUMEN ADMIN: ${adminProducts.length} productos encontrados`);
    }
  }
  
  console.log('\n🎯 PRUEBAS COMPLETADAS');
}

// Función para probar URLs específicas
function testURLs() {
  console.log('\n📋 URLs PARA PROBAR MANUALMENTE:');
  console.log('\n🌐 Portal Principal:');
  console.log('   https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev');
  
  console.log('\n🔐 Dashboard (después del login):');
  console.log('   https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev/dashboard');
  console.log('   📝 Hacer clic en "Mis Productos" en el menú lateral');
  
  console.log('\n👥 Credenciales de prueba:');
  console.log('   📧 investigador@demo.com / 🔑 investigador123 (3 productos)');
  console.log('   📧 admin@demo.com / 🔑 admin123 (todos los productos)');
}

// Ejecutar pruebas
if (typeof module !== 'undefined' && module.exports) {
  // Si se ejecuta con Node.js
  module.exports = { testMisProductos, testURLs };
} else {
  // Si se ejecuta en navegador
  testMisProductos();
  testURLs();
}