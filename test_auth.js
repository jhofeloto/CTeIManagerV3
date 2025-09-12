#!/usr/bin/env node

// Pruebas unitarias de autenticación para CTeI-Manager
// Ejecutar con: node test_auth.js

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Configuración de pruebas
const TEST_CASES = [
    {
        name: 'Login Admin Válido',
        email: 'admin@test.com',
        password: 'admin123',
        shouldSucceed: true,
        expectedRole: 'ADMIN',
        expectedName: 'Admin CTeI'
    },
    {
        name: 'Login Investigador Válido',
        email: 'carlos.rodriguez@ctei.edu.co',
        password: 'password123',
        shouldSucceed: true,
        expectedRole: 'INVESTIGATOR',
        expectedName: 'Dr. Carlos Rodríguez'
    },
    {
        name: 'Login Email Incorrecto',
        email: 'noexiste@test.com',
        password: 'password123',
        shouldSucceed: false
    },
    {
        name: 'Login Password Incorrecto',
        email: 'admin@test.com',
        password: 'wrongpassword',
        shouldSucceed: false
    },
    {
        name: 'Login Campos Vacíos',
        email: '',
        password: '',
        shouldSucceed: false
    },
    {
        name: 'Login Email Vacío',
        email: '',
        password: 'admin123',
        shouldSucceed: false
    },
    {
        name: 'Login Password Vacío',
        email: 'admin@test.com',
        password: '',
        shouldSucceed: false
    }
];

let testsExecuted = 0;
let testsPassed = 0;
let testsFailed = 0;

function log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        error: '\x1b[31m',
        warning: '\x1b[33m',
        reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function testLogin(testCase) {
    testsExecuted++;
    
    try {
        log(`🧪 Ejecutando: ${testCase.name}`, 'info');
        
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: testCase.email,
            password: testCase.password
        }, {
            timeout: 5000,
            validateStatus: () => true // No lanzar error para códigos de estado HTTP
        });
        
        const success = response.data.success;
        
        if (testCase.shouldSucceed) {
            // El test debería tener éxito
            if (success) {
                const user = response.data.data.user;
                const token = response.data.data.token;
                
                // Validar datos del usuario
                if (testCase.expectedRole && user.role !== testCase.expectedRole) {
                    throw new Error(`Rol esperado: ${testCase.expectedRole}, recibido: ${user.role}`);
                }
                
                if (testCase.expectedName && user.full_name !== testCase.expectedName) {
                    throw new Error(`Nombre esperado: ${testCase.expectedName}, recibido: ${user.full_name}`);
                }
                
                // Validar token
                if (!token || token.length < 20) {
                    throw new Error('Token inválido o no proporcionado');
                }
                
                // Probar token con endpoint protegido
                await testTokenValidation(token, user);
                
                log(`✅ PASSED: ${testCase.name} - Usuario: ${user.full_name} (${user.role})`, 'success');
                testsPassed++;
            } else {
                throw new Error(`Login debería haber tenido éxito pero falló: ${response.data.error}`);
            }
        } else {
            // El test debería fallar
            if (!success) {
                log(`✅ PASSED: ${testCase.name} - Correctamente rechazado: ${response.data.error}`, 'success');
                testsPassed++;
            } else {
                throw new Error('Login debería haber fallado pero tuvo éxito');
            }
        }
        
    } catch (error) {
        testsFailed++;
        log(`❌ FAILED: ${testCase.name} - ${error.message}`, 'error');
        
        if (error.code === 'ECONNREFUSED') {
            log('⚠️  Servidor no disponible. Asegúrate de que el servidor esté ejecutándose en localhost:3000', 'warning');
            return false;
        }
    }
    
    return true;
}

async function testTokenValidation(token, expectedUser) {
    const response = await axios.get(`${BASE_URL}/api/private/profile`, {
        headers: {
            'Authorization': `Bearer ${token}`
        },
        timeout: 5000
    });
    
    if (!response.data.success) {
        throw new Error('Token no válido para endpoint protegido');
    }
    
    const profileUser = response.data.data;
    if (profileUser.id !== expectedUser.id || profileUser.email !== expectedUser.email) {
        throw new Error('Los datos del perfil no coinciden con el usuario autenticado');
    }
}

async function testEndpoints() {
    log('🚀 Iniciando pruebas de endpoints...', 'info');
    
    // Probar acceso sin token a endpoint protegido
    try {
        const response = await axios.get(`${BASE_URL}/api/private/profile`, {
            validateStatus: () => true,
            timeout: 5000
        });
        
        if (response.data.success) {
            throw new Error('Endpoint protegido debería rechazar acceso sin token');
        } else {
            log('✅ Endpoint protegido correctamente rechaza acceso sin token', 'success');
        }
    } catch (error) {
        log(`❌ Error probando endpoint protegido: ${error.message}`, 'error');
    }
}

async function runTests() {
    log('🎯 Iniciando pruebas unitarias de autenticación CTeI-Manager', 'info');
    log(`📋 Total de pruebas a ejecutar: ${TEST_CASES.length}`, 'info');
    
    // Probar conexión al servidor
    try {
        await axios.get(`${BASE_URL}/`, { timeout: 5000 });
        log('✅ Conexión al servidor establecida', 'success');
    } catch (error) {
        log('❌ No se puede conectar al servidor. Asegúrate de que esté ejecutándose.', 'error');
        return;
    }
    
    // Ejecutar pruebas de login
    for (const testCase of TEST_CASES) {
        const success = await testLogin(testCase);
        if (!success) break; // Parar si hay problemas de conexión
        
        // Pausa pequeña entre pruebas
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Pruebas adicionales de endpoints
    await testEndpoints();
    
    // Reporte final
    log('\n📊 REPORTE FINAL:', 'info');
    log(`📋 Pruebas ejecutadas: ${testsExecuted}`, 'info');
    log(`✅ Pruebas exitosas: ${testsPassed}`, 'success');
    log(`❌ Pruebas fallidas: ${testsFailed}`, testsFailed > 0 ? 'error' : 'info');
    
    const successRate = testsExecuted > 0 ? ((testsPassed / testsExecuted) * 100).toFixed(2) : 0;
    log(`📈 Tasa de éxito: ${successRate}%`, successRate >= 90 ? 'success' : 'warning');
    
    if (testsFailed === 0) {
        log('🎉 ¡Todas las pruebas pasaron exitosamente!', 'success');
        process.exit(0);
    } else {
        log('⚠️  Algunas pruebas fallaron. Revisa los errores anteriores.', 'warning');
        process.exit(1);
    }
}

// Ejecutar pruebas
runTests().catch(error => {
    log(`💥 Error crítico en las pruebas: ${error.message}`, 'error');
    process.exit(1);
});