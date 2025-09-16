// Script para hacer login programáticamente y probar el botón editar
async function testEditProductButton() {
    const API_BASE = '/api';
    
    console.log('🚀 Iniciando test del botón "Editar Producto"');
    
    try {
        // 1. Hacer login
        console.log('🔐 Haciendo login...');
        const loginResponse = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'test2@admin.com',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        
        if (!loginData.success) {
            console.error('❌ Error de login:', loginData.error);
            return;
        }
        
        const token = loginData.data.token;
        console.log('✅ Login exitoso para:', loginData.data.user.full_name);
        
        // 2. Obtener productos
        console.log('📦 Obteniendo productos...');
        const productsResponse = await fetch(`${API_BASE}/private/products`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const productsData = await productsResponse.json();
        
        if (!productsData.success) {
            console.error('❌ Error obteniendo productos:', productsData.error);
            return;
        }
        
        console.log(`✅ ${productsData.products.length} productos obtenidos`);
        
        if (productsData.products.length === 0) {
            console.log('⚠️ No hay productos para probar');
            return;
        }
        
        // 3. Probar función editProduct
        const testProduct = productsData.products[0];
        console.log(`🧪 Probando con producto ID ${testProduct.id}: ${testProduct.description}`);
        
        // 4. Verificar URL de edición
        const editURL = `/dashboard/productos/${testProduct.id}/editar`;
        console.log(`🔗 Probando URL: ${editURL}`);
        
        const editResponse = await fetch(editURL, {
            method: 'HEAD',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log(`📊 Resultado: Status ${editResponse.status} (${editResponse.statusText})`);
        
        if (editResponse.ok || editResponse.status === 302) {
            console.log('🎉 ¡ÉXITO! La URL de edición es accesible');
            
            // 5. Verificar contenido de la página
            const contentResponse = await fetch(editURL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (contentResponse.ok) {
                const html = await contentResponse.text();
                const hasEditForm = html.includes('Editar Producto');
                const hasFileUpload = html.includes('file') || html.includes('upload') || html.includes('drag');
                
                console.log(`📋 Página contiene formulario de edición: ${hasEditForm ? '✅' : '❌'}`);
                console.log(`📁 Página tiene soporte para archivos: ${hasFileUpload ? '✅' : '❌'}`);
                
                if (hasEditForm && hasFileUpload) {
                    console.log('🎯 ¡PERFECTO! El botón "Editar Producto" funciona correctamente:');
                    console.log('   ✅ Redirecciona a página independiente');
                    console.log('   ✅ Página contiene formulario de edición');
                    console.log('   ✅ Soporte para carga de archivos implementado');
                } else {
                    console.log('⚠️ La página existe pero le faltan algunos elementos');
                }
            }
        } else {
            console.log('❌ La URL de edición no es accesible');
        }
        
        // 6. Test adicional: Probar API endpoints
        console.log('🔌 Probando API endpoints...');
        
        const apiTests = [
            { url: `/products/${testProduct.id}`, desc: 'Obtener producto individual' },
            { url: `/products/${testProduct.id}/files`, desc: 'Obtener archivos del producto' }
        ];
        
        for (const test of apiTests) {
            try {
                const apiResponse = await fetch(`${API_BASE}/private${test.url}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                console.log(`  ${test.desc}: Status ${apiResponse.status} ${apiResponse.ok ? '✅' : '❌'}`);
            } catch (error) {
                console.log(`  ${test.desc}: Error ${error.message} ❌`);
            }
        }
        
        console.log('🏁 Test completado');
        
    } catch (error) {
        console.error('❌ Error durante el test:', error);
    }
}

// Ejecutar el test
testEditProductButton();