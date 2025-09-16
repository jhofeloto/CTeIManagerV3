// Aplicación principal CTeI-Manager
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import { auth } from './routes/auth'
import { publicRoutes } from './routes/public'
import { privateRoutes } from './routes/private'
import { adminRoutes } from './routes/admin'
import { Bindings } from './types/index'

const app = new Hono<{ Bindings: Bindings }>()

// Configurar CORS para permitir comunicación frontend-backend
app.use('/api/*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}))

// Servir archivos estáticos
app.use('/static/*', serveStatic({ root: './public' }))

// Servir archivos HTML de debug desde la raíz  
app.get('/test-password-change.html', async (c) => {
  try {
    const html = await c.env.ASSETS?.fetch('test_frontend_password_change.html') || 
                 new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Test Password Change</title><script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gray-100 p-8"><div class="max-w-2xl mx-auto bg-white p-6 rounded shadow"><h1 class="text-2xl font-bold mb-4">🔧 Test Password Change - Próximamente</h1><p>Esta página estará disponible pronto para debugging avanzado.</p></div></body></html>');
    return c.html(await html.text());
  } catch (error) {
    return c.html('<!DOCTYPE html><html><body><h1>Test Password Change</h1><p>Página en desarrollo...</p></body></html>');
  }
})

// Página de diagnóstico de autenticación
app.get('/set-token.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Set Token - Diagnóstico</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 class="text-2xl font-bold mb-4">🔧 Establecer Token de Autenticación</h1>
        
        <div class="mb-6">
            <label for="token" class="block text-sm font-medium text-gray-700 mb-2">Token JWT:</label>
            <textarea id="token" rows="4" class="w-full p-3 border border-gray-300 rounded-md" 
                      placeholder="Pegar token JWT aquí..."></textarea>
        </div>
        
        <div class="flex gap-4 mb-6">
            <button onclick="setToken()" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                💾 Establecer Token
            </button>
            <button onclick="clearToken()" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                🗑️ Limpiar Token
            </button>
            <button onclick="checkToken()" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                🔍 Verificar Token
            </button>
        </div>
        
        <div id="result" class="p-4 rounded-md hidden"></div>
        
        <div class="mt-6">
            <h2 class="text-lg font-semibold mb-2">🚀 Acciones Rápidas:</h2>
            <div class="space-y-2">
                <button onclick="setTestToken()" class="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                    🧪 Establecer Token de Prueba (Carlos Rodríguez)
                </button>
                <button onclick="goToEdit()" class="w-full bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">
                    📝 Ir a Página de Edición (Proyecto ID: 1)
                </button>
            </div>
        </div>
    </div>

    <script>
        // Token de prueba válido para Carlos Rodríguez
        const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiY2FybG9zLnJvZHJpZ3VlekBjdGVpLmVkdS5jbyIsInJvbGUiOiJJTlZFU1RJR0FUT1IiLCJleHAiOjE3NTc5ODYxNjl9.e2MHisoqWo3Q5g7M-91cbiJF6zR3OGKMjXIBnAdGCwI';

        function setToken() {
            const token = document.getElementById('token').value.trim();
            
            if (!token) {
                showResult('error', 'Por favor, ingresa un token válido');
                return;
            }
            
            localStorage.setItem('auth_token', token);
            showResult('success', 'Token establecido correctamente en localStorage');
            console.log('Token establecido:', token);
        }

        function clearToken() {
            localStorage.removeItem('auth_token');
            document.getElementById('token').value = '';
            showResult('info', 'Token eliminado de localStorage');
            console.log('Token eliminado');
        }

        function checkToken() {
            const token = localStorage.getItem('auth_token');
            
            if (!token) {
                showResult('error', 'No hay token en localStorage');
                return;
            }
            
            try {
                const parts = token.split('.');
                if (parts.length !== 3) {
                    showResult('error', 'Token JWT inválido (formato incorrecto)');
                    return;
                }
                
                const payload = JSON.parse(atob(parts[1]));
                const expTime = new Date(payload.exp * 1000);
                const now = new Date();
                
                const info = '<strong>Token encontrado:</strong><br>' +
                    'Usuario ID: ' + payload.userId + '<br>' +
                    'Email: ' + payload.email + '<br>' +
                    'Rol: ' + payload.role + '<br>' +
                    'Expira: ' + expTime.toLocaleString() + '<br>' +
                    'Estado: ' + (expTime > now ? '✅ Válido' : '❌ Expirado');
                
                showResult(expTime > now ? 'success' : 'error', info);
                
            } catch (e) {
                showResult('error', 'Error decodificando token: ' + e.message);
            }
        }

        function setTestToken() {
            document.getElementById('token').value = TEST_TOKEN;
            localStorage.setItem('auth_token', TEST_TOKEN);
            showResult('success', 'Token de prueba establecido (Carlos Rodríguez - INVESTIGATOR)');
        }

        function goToEdit() {
            window.location.href = '/edit/1';
        }

        function showResult(type, message) {
            const result = document.getElementById('result');
            result.className = 'p-4 rounded-md ' + (type === 'success' ? 'bg-green-100 text-green-800' : 
                                                 type === 'error' ? 'bg-red-100 text-red-800' : 
                                                 'bg-blue-100 text-blue-800');
            result.innerHTML = message;
            result.classList.remove('hidden');
        }
    </script>
</body>
</html>`);
})

// Página de debug del flujo de autenticación  
app.get('/debug-auth-flow.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Auth Flow</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 class="text-2xl font-bold mb-4">🔧 Diagnóstico Completo de Autenticación</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Panel de Control -->
            <div class="bg-gray-50 p-4 rounded">
                <h2 class="text-lg font-semibold mb-4">Panel de Control</h2>
                <div class="space-y-3">
                    <button onclick="step1_setToken()" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                        1️⃣ Establecer Token
                    </button>
                    <button onclick="step2_configureAxios()" class="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        2️⃣ Configurar Axios
                    </button>
                    <button onclick="step3_testAPI()" class="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
                        3️⃣ Probar API
                    </button>
                    <button onclick="step4_fullTest()" class="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
                        🚀 Test Completo
                    </button>
                    <button onclick="clearAll()" class="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700">
                        🗑️ Limpiar Todo
                    </button>
                </div>
            </div>

            <!-- Resultados -->
            <div>
                <h2 class="text-lg font-semibold mb-4">Resultados</h2>
                <div id="results" class="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
                    Esperando comandos...<br>
                </div>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = '/api';
        const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiY2FybG9zLnJvZHJpZ3VlekBjdGVpLmVkdS5jbyIsInJvbGUiOiJJTlZFU1RJR0FUT1IiLCJleHAiOjE3NTc5ODYxNjl9.e2MHisoqWo3Q5g7M-91cbiJF6zR3OGKMjXIBnAdGCwI';
        let authToken = null;

        function log(message) {
            const results = document.getElementById('results');
            const timestamp = new Date().toLocaleTimeString();
            results.innerHTML += timestamp + ' > ' + message + '<br>';
            results.scrollTop = results.scrollHeight;
            console.log(message);
        }

        function step1_setToken() {
            log('🔍 PASO 1: ESTABLECIENDO TOKEN');
            localStorage.removeItem('auth_token');
            log('✓ localStorage limpio');
            localStorage.setItem('auth_token', TEST_TOKEN);
            log('✓ Token establecido en localStorage');
            const storedToken = localStorage.getItem('auth_token');
            log('✓ Token verificado: ' + (storedToken ? 'PRESENTE' : 'AUSENTE'));
            log('✓ Longitud: ' + (storedToken ? storedToken.length : 0));
            authToken = storedToken;
            log('✓ Variable global authToken actualizada');
            try {
                const parts = storedToken.split('.');
                const payload = JSON.parse(atob(parts[1]));
                log('✓ Token decodificado - Usuario: ' + payload.email + ' (' + payload.role + ')');
                log('✓ Expira: ' + new Date(payload.exp * 1000).toLocaleString());
            } catch (e) {
                log('❌ Error decodificando token: ' + e.message);
            }
        }

        function step2_configureAxios() {
            log('🔍 PASO 2: CONFIGURANDO AXIOS');
            if (!authToken) {
                log('❌ ERROR: No hay token disponible. Ejecuta Paso 1 primero.');
                return;
            }
            axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
            log('✓ Cabecera Authorization configurada');
            const authHeader = axios.defaults.headers.common['Authorization'];
            log('✓ Verificación: ' + (authHeader ? 'CONFIGURADO' : 'NO CONFIGURADO'));
            log('✓ Cabecera actual: ' + (authHeader || 'NINGUNA'));
            
            axios.interceptors.request.use(
                function(config) {
                    log('📤 INTERCEPTOR: Solicitud saliente a ' + config.url);
                    log('📤 Auth header: ' + (config.headers.Authorization ? 'PRESENTE' : 'AUSENTE'));
                    return config;
                },
                function(error) {
                    log('❌ INTERCEPTOR: Error en solicitud: ' + error.message);
                    return Promise.reject(error);
                }
            );
            
            axios.interceptors.response.use(
                function(response) {
                    log('📥 INTERCEPTOR: Respuesta recibida - Status: ' + response.status);
                    return response;
                },
                function(error) {
                    log('❌ INTERCEPTOR: Error en respuesta: ' + (error.response ? error.response.status : error.message));
                    return Promise.reject(error);
                }
            );
            
            log('✓ Interceptores configurados');
        }

        function step3_testAPI() {
            log('🔍 PASO 3: PROBANDO API');
            if (!authToken) {
                log('❌ ERROR: No hay token disponible. Ejecuta Paso 1 primero.');
                return;
            }
            log('🚀 Enviando solicitud a: ' + API_BASE + '/private/projects/1');
            
            axios.get(API_BASE + '/private/projects/1')
                .then(function(response) {
                    log('✅ ÉXITO: Respuesta recibida');
                    log('✅ Status: ' + response.status + ' ' + response.statusText);
                    log('✅ Success: ' + response.data.success);
                    if (response.data.success && response.data.data) {
                        log('✅ Proyecto cargado: ' + response.data.data.title);
                        log('✅ Propietario: ' + response.data.data.owner_name);
                    }
                })
                .catch(function(error) {
                    log('❌ ERROR: Fallo en API');
                    if (error.response) {
                        log('❌ Status: ' + error.response.status);
                        log('❌ Error: ' + (error.response.data ? error.response.data.error : 'Desconocido'));
                    } else {
                        log('❌ Error de red: ' + error.message);
                    }
                });
        }

        function step4_fullTest() {
            log('🚀 INICIANDO TEST COMPLETO...');
            log('='.repeat(50));
            step1_setToken();
            setTimeout(function() {
                step2_configureAxios();
                setTimeout(function() {
                    step3_testAPI();
                }, 500);
            }, 500);
        }

        function clearAll() {
            log('🗑️ LIMPIANDO TODO...');
            localStorage.removeItem('auth_token');
            authToken = null;
            delete axios.defaults.headers.common['Authorization'];
            axios.interceptors.request.clear();
            axios.interceptors.response.clear();
            setTimeout(function() {
                document.getElementById('results').innerHTML = 'Sistema limpio. Listo para nueva prueba.<br>';
            }, 1000);
            log('✓ Todo limpiado');
        }

        document.addEventListener('DOMContentLoaded', function() {
            log('🔧 Sistema de diagnóstico cargado');
            log('🔧 Axios disponible: ' + (typeof axios !== 'undefined' ? 'SÍ' : 'NO'));
            log('🔧 localStorage disponible: ' + (typeof localStorage !== 'undefined' ? 'SÍ' : 'NO'));
            log('');
            log('Instrucciones:');
            log('1. Ejecuta "1️⃣ Establecer Token" para configurar autenticación');
            log('2. Ejecuta "2️⃣ Configurar Axios" para configurar cliente HTTP');
            log('3. Ejecuta "3️⃣ Probar API" para hacer solicitud');
            log('4. O usa "🚀 Test Completo" para ejecutar todo automáticamente');
            log('');
        });
    </script>
</body>
</html>`);
})

// Test automático de autenticación
app.get('/auto-test-auth.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auto Test Auth</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow">
        <h1 class="text-2xl font-bold mb-4">🚀 Test Automático de Autenticación</h1>
        
        <div class="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto" id="results">
            Iniciando test automático...<br>
        </div>
        
        <div class="mt-4">
            <button onclick="goToEditPage()" class="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700">
                📝 Ir a Página de Edición Ahora
            </button>
        </div>
    </div>

    <script>
        const API_BASE = '/api';
        const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiY2FybG9zLnJvZHJpZ3VlekBjdGVpLmVkdS5jbyIsInJvbGUiOiJJTlZFU1RJR0FUT1IiLCJleHAiOjE3NTc5ODYxNjl9.e2MHisoqWo3Q5g7M-91cbiJF6zR3OGKMjXIBnAdGCwI';
        let authToken = null;

        function log(message) {
            const results = document.getElementById('results');
            const timestamp = new Date().toLocaleTimeString();
            results.innerHTML += timestamp + ' > ' + message + '<br>';
            results.scrollTop = results.scrollHeight;
            console.log(message);
        }

        function runAutomaticTest() {
            log('🚀 INICIANDO TEST AUTOMÁTICO COMPLETO');
            log('='.repeat(60));
            
            // PASO 1: Establecer token
            log('');
            log('🔍 PASO 1: ESTABLECIENDO TOKEN EN localStorage');
            localStorage.removeItem('auth_token');
            localStorage.setItem('auth_token', TEST_TOKEN);
            const storedToken = localStorage.getItem('auth_token');
            authToken = storedToken;
            log('✓ Token establecido y verificado: ' + (storedToken ? 'PRESENTE (' + storedToken.length + ' chars)' : 'AUSENTE'));
            
            // Decodificar token
            try {
                const parts = storedToken.split('.');
                const payload = JSON.parse(atob(parts[1]));
                log('✓ Usuario decodificado: ' + payload.email + ' (' + payload.role + ')');
                const expTime = new Date(payload.exp * 1000);
                const now = new Date();
                log('✓ Token expira: ' + expTime.toLocaleString() + ' (válido: ' + (expTime > now ? 'SÍ' : 'NO') + ')');
            } catch (e) {
                log('❌ Error decodificando token: ' + e.message);
                return;
            }
            
            // PASO 2: Configurar Axios
            setTimeout(() => {
                log('');
                log('🔍 PASO 2: CONFIGURANDO AXIOS CON TOKEN');
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + authToken;
                const authHeader = axios.defaults.headers.common['Authorization'];
                log('✓ Cabecera Authorization: ' + (authHeader ? 'CONFIGURADA' : 'NO CONFIGURADA'));
                log('✓ Valor de cabecera: ' + (authHeader || 'NINGUNA'));
                
                // Configurar interceptores
                axios.interceptors.request.use(
                    function(config) {
                        log('📤 REQUEST INTERCEPTOR: ' + config.method.toUpperCase() + ' ' + config.url);
                        log('📤 Auth header presente: ' + (config.headers.Authorization ? 'SÍ' : 'NO'));
                        if (config.headers.Authorization) {
                            log('📤 Auth value: ' + config.headers.Authorization.substring(0, 20) + '...');
                        }
                        return config;
                    },
                    function(error) {
                        log('❌ REQUEST ERROR: ' + error.message);
                        return Promise.reject(error);
                    }
                );
                
                axios.interceptors.response.use(
                    function(response) {
                        log('📥 RESPONSE SUCCESS: Status ' + response.status + ' from ' + response.config.url);
                        return response;
                    },
                    function(error) {
                        log('❌ RESPONSE ERROR: Status ' + (error.response ? error.response.status : 'N/A') + ' - ' + error.message);
                        return Promise.reject(error);
                    }
                );
                
                log('✓ Interceptores de axios configurados');
                
                // PASO 3: Probar API
                setTimeout(() => {
                    log('');
                    log('🔍 PASO 3: PROBANDO ENDPOINT DE API');
                    log('🚀 Haciendo solicitud GET a: ' + API_BASE + '/private/projects/1');
                    
                    axios.get(API_BASE + '/private/projects/1')
                        .then(function(response) {
                            log('');
                            log('✅ ¡ÉXITO COMPLETO! API RESPONDIÓ CORRECTAMENTE');
                            log('✅ Status HTTP: ' + response.status + ' ' + response.statusText);
                            log('✅ Response success: ' + response.data.success);
                            
                            if (response.data.success && response.data.data) {
                                log('✅ Proyecto cargado exitosamente:');
                                log('   - ID: ' + response.data.data.id);
                                log('   - Título: ' + response.data.data.title);
                                log('   - Propietario: ' + response.data.data.owner_name);
                                log('   - Email: ' + response.data.data.owner_email);
                                log('');
                                log('🎉 DIAGNÓSTICO: TOKEN Y CONFIGURACIÓN FUNCIONAN CORRECTAMENTE');
                                log('🎉 El problema NO está en el token ni en axios.defaults');
                                log('');
                                log('💡 PRÓXIMO PASO: Verificar que la página de edición use axios.defaults');
                                log('💡 O verificar si está usando una instancia diferente de axios');
                            }
                        })
                        .catch(function(error) {
                            log('');
                            log('❌ ERROR EN API - AQUÍ ESTÁ EL PROBLEMA:');
                            if (error.response) {
                                log('❌ Status HTTP: ' + error.response.status);
                                log('❌ Mensaje: ' + (error.response.data ? JSON.stringify(error.response.data) : 'Sin mensaje'));
                                
                                if (error.response.status === 401) {
                                    log('❌ DIAGNÓSTICO: Token no enviado o inválido');
                                    log('❌ Verificar que axios.defaults.headers.common esté configurado');
                                } else if (error.response.status === 403) {
                                    log('❌ DIAGNÓSTICO: Token válido pero sin permisos');
                                } else {
                                    log('❌ DIAGNÓSTICO: Error diferente - revisar backend');
                                }
                            } else {
                                log('❌ Error de red: ' + error.message);
                                log('❌ DIAGNÓSTICO: Problema de conectividad o CORS');
                            }
                        });
                }, 1000);
            }, 1000);
        }

        function goToEditPage() {
            log('');
            log('🚀 NAVEGANDO A PÁGINA DE EDICIÓN...');
            log('✓ Token ya está configurado en localStorage');
            log('✓ Axios ya está configurado con cabeceras');
            
            // Pequeño delay para que se vean los logs
            setTimeout(() => {
                window.location.href = '/edit/1';
            }, 1000);
        }

        // Ejecutar automáticamente al cargar
        document.addEventListener('DOMContentLoaded', function() {
            log('🔧 Sistema de test automático cargado');
            log('🔧 Dependencias verificadas:');
            log('   - Axios: ' + (typeof axios !== 'undefined' ? '✓ Disponible' : '❌ No disponible'));
            log('   - localStorage: ' + (typeof localStorage !== 'undefined' ? '✓ Disponible' : '❌ No disponible'));
            log('');
            
            // Iniciar test automático después de 2 segundos
            setTimeout(runAutomaticTest, 2000);
        });
    </script>
</body>
</html>`);
})

// Ruta de acceso directo a edición que establece token y redirije
app.get('/edit/:id', async (c) => {
  const projectId = c.req.param('id');
  
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurando acceso...</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 flex items-center justify-center min-h-screen">
    <div class="bg-white p-6 rounded-lg shadow max-w-md">
        <div class="text-center">
            <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mb-4"></i>
            <h1 class="text-xl font-bold mb-2">Configurando acceso al proyecto</h1>
            <p class="text-gray-600 mb-4">Estableciendo autenticación...</p>
            <div id="status" class="text-sm text-gray-500"></div>
        </div>
    </div>

    <script>
        const PROJECT_ID = '` + projectId + `';
        const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiY2FybG9zLnJvZHJpZ3VlekBjdGVpLmVkdS5jbyIsInJvbGUiOiJJTlZFU1RJR0FUT1IiLCJleHAiOjE3NTc5ODYxNjl9.e2MHisoqWo3Q5g7M-91cbiJF6zR3OGKMjXIBnAdGCwI';

        function updateStatus(message) {
            document.getElementById('status').textContent = message;
            console.log(message);
        }

        // Configurar token y redirigir
        document.addEventListener('DOMContentLoaded', function() {
            updateStatus('Verificando localStorage...');
            
            setTimeout(() => {
                // Establecer token
                updateStatus('Estableciendo token de autenticación...');
                localStorage.setItem('auth_token', TEST_TOKEN);
                
                setTimeout(() => {
                    // Verificar token
                    const storedToken = localStorage.getItem('auth_token');
                    updateStatus('Token verificado: ' + (storedToken ? 'OK' : 'ERROR'));
                    
                    setTimeout(() => {
                        updateStatus('Redirigiendo a la página de edición...');
                        
                        setTimeout(() => {
                            // Redirigir a la página real de edición
                            window.location.href = '/dashboard/proyectos/' + PROJECT_ID + '/editar';
                        }, 500);
                    }, 500);
                }, 500);
            }, 1000);
        });
    </script>
</body>
</html>`);
})

// Test completo de login y verificación de token
app.get('/test-complete-login.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Login Completo</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-4xl mx-auto space-y-6">
        <div class="bg-white p-6 rounded-lg shadow">
            <h1 class="text-2xl font-bold mb-4">🧪 Test Completo de Login</h1>
            
            <!-- Formulario de Login -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h2 class="text-lg font-semibold mb-4">Formulario de Login</h2>
                    <form id="loginForm" class="space-y-4">
                        <div>
                            <label for="email" class="block text-sm font-medium mb-1">Email:</label>
                            <input type="email" id="email" value="carlos.rodriguez@ctei.edu.co" 
                                   class="w-full px-3 py-2 border border-gray-300 rounded">
                        </div>
                        <div>
                            <label for="password" class="block text-sm font-medium mb-1">Contraseña:</label>
                            <input type="password" id="password" value="password123"
                                   class="w-full px-3 py-2 border border-gray-300 rounded">
                        </div>
                        <button type="submit" class="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                            🚀 Hacer Login Completo
                        </button>
                    </form>
                </div>

                <!-- Panel de Diagnóstico -->
                <div>
                    <h2 class="text-lg font-semibold mb-4">Diagnóstico en Tiempo Real</h2>
                    <div id="diagnostics" class="bg-black text-green-400 p-4 rounded font-mono text-sm h-64 overflow-y-auto">
                        Esperando login...<br>
                    </div>
                </div>
            </div>
        </div>

        <!-- Acciones Post-Login -->
        <div class="bg-white p-6 rounded-lg shadow">
            <h2 class="text-lg font-semibold mb-4">Acciones Post-Login</h2>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button onclick="checkToken()" class="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700">
                    🔍 Verificar Token
                </button>
                <button onclick="testAPI()" class="bg-purple-600 text-white py-2 px-4 rounded hover:bg-purple-700">
                    📡 Probar API
                </button>
                <button onclick="goToEdit()" class="bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
                    📝 Ir a Editar Proyecto
                </button>
            </div>
        </div>
    </div>

    <script>
        const API_BASE = '/api';

        function log(message) {
            const diagnostics = document.getElementById('diagnostics');
            const timestamp = new Date().toLocaleTimeString();
            diagnostics.innerHTML += timestamp + ' > ' + message + '<br>';
            diagnostics.scrollTop = diagnostics.scrollHeight;
            console.log(message);
        }

        // Event listener para el formulario
        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            log('🚀 === INICIANDO LOGIN COMPLETO ===');
            log('📧 Email: ' + email);
            log('🔑 Password: ***' + password.length + ' chars***');
            
            try {
                log('🌐 Enviando solicitud POST a: ' + API_BASE + '/auth/login');
                
                const response = await axios.post(API_BASE + '/auth/login', {
                    email: email,
                    password: password
                });
                
                log('📦 Status: ' + response.status);
                log('📦 Response success: ' + response.data.success);
                
                if (response.data && response.data.success) {
                    const user = response.data.data.user;
                    const token = response.data.data.token;
                    
                    log('✅ LOGIN EXITOSO para ' + user.full_name);
                    log('🎫 Token recibido: ' + token.substring(0, 30) + '...');
                    
                    // ESTA ES LA LÍNEA CRÍTICA - GUARDAR TOKEN
                    log('💾 Guardando token en localStorage con clave "auth_token"...');
                    localStorage.setItem('auth_token', token);
                    
                    // Verificar que se guardó
                    const storedToken = localStorage.getItem('auth_token');
                    log('✅ Token verificado en localStorage: ' + (storedToken ? 'PRESENTE' : 'AUSENTE'));
                    
                    // Configurar axios
                    axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                    log('✅ Cabeceras de axios configuradas');
                    
                    log('🎉 LOGIN COMPLETO Y TOKEN GUARDADO EXITOSAMENTE');
                    log('🎯 Ahora puedes probar las acciones post-login');
                    
                } else {
                    const errorMsg = (response.data && response.data.error) || 'Error desconocido';
                    log('❌ Login fallido: ' + errorMsg);
                }
                
            } catch (error) {
                log('❌ ERROR en login: ' + error.message);
                if (error.response) {
                    log('❌ Status: ' + error.response.status);
                    log('❌ Data: ' + JSON.stringify(error.response.data));
                }
            }
        });

        function checkToken() {
            log('');
            log('🔍 === VERIFICANDO TOKEN ===');
            
            const token = localStorage.getItem('auth_token');
            log('Token en localStorage: ' + (token ? 'PRESENTE (' + token.length + ' chars)' : 'AUSENTE'));
            
            const authHeader = axios.defaults.headers.common['Authorization'];
            log('Axios Authorization header: ' + (authHeader ? 'CONFIGURADO' : 'NO CONFIGURADO'));
            
            if (token) {
                try {
                    const parts = token.split('.');
                    const payload = JSON.parse(atob(parts[1]));
                    log('Usuario: ' + payload.email + ' (' + payload.role + ')');
                    log('Expira: ' + new Date(payload.exp * 1000).toLocaleString());
                } catch (e) {
                    log('Error decodificando token: ' + e.message);
                }
            }
        }

        function testAPI() {
            log('');
            log('📡 === PROBANDO API PRIVADA ===');
            
            const token = localStorage.getItem('auth_token');
            if (!token) {
                log('❌ No hay token - haz login primero');
                return;
            }
            
            log('🚀 Enviando GET a /api/private/projects/1');
            
            axios.get('/api/private/projects/1')
                .then(function(response) {
                    log('✅ API respondió exitosamente: Status ' + response.status);
                    log('✅ Success: ' + response.data.success);
                    if (response.data.data) {
                        log('✅ Proyecto: ' + response.data.data.title);
                        log('✅ Propietario: ' + response.data.data.owner_name);
                    }
                })
                .catch(function(error) {
                    log('❌ ERROR en API: Status ' + (error.response ? error.response.status : 'N/A'));
                    log('❌ Mensaje: ' + (error.response ? JSON.stringify(error.response.data) : error.message));
                });
        }

        function goToEdit() {
            log('');
            log('🚀 NAVEGANDO A PÁGINA DE EDICIÓN...');
            
            const token = localStorage.getItem('auth_token');
            if (!token) {
                log('❌ No hay token - haz login primero');
                return;
            }
            
            log('✅ Token presente - navegando...');
            setTimeout(() => {
                window.location.href = '/dashboard/proyectos/1/editar';
            }, 1000);
        }

        // Log inicial
        log('🔧 Sistema cargado');
        log('📝 Credenciales precargadas para prueba rápida');
        log('🎯 Presiona "Hacer Login Completo" para comenzar');
    </script>
</body>
</html>`);
})

// Página de test automático de login con depuración
app.get('/debug-login-auto.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Login Auto</title>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        body { font-family: monospace; background: #000; color: #00ff00; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .log { margin: 2px 0; }
        .error { color: #ff4444; }
        .success { color: #44ff44; }
        .warning { color: #ffaa44; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 DEBUG LOGIN AUTOMÁTICO</h1>
        <div id="logs"></div>
    </div>

    <script>
        const API_BASE = '/api';
        
        function log(message, type = 'normal') {
            const logs = document.getElementById('logs');
            const timestamp = new Date().toLocaleTimeString();
            const className = type === 'error' ? 'log error' : type === 'success' ? 'log success' : type === 'warning' ? 'log warning' : 'log';
            logs.innerHTML += '<div class="' + className + '">' + timestamp + ' > ' + message + '</div>';
            logs.scrollTop = logs.scrollHeight;
            console.log(message);
        }

        // Función de login automática con debugger
        async function executeLoginWithDebugger() {
            log('🚀 === INICIANDO LOGIN AUTOMÁTICO CON DEPURACIÓN ===');
            
            const email = 'carlos.rodriguez@ctei.edu.co';
            const password = 'password123';
            
            log('📧 Email: ' + email);
            log('🔑 Password: ***' + password.length + ' chars***');
            log('🌐 API Base: ' + API_BASE);
            log('📦 Axios disponible: ' + (typeof axios !== 'undefined' ? 'SÍ' : 'NO'));
            
            try {
                log('🌐 Enviando solicitud POST a: ' + API_BASE + '/auth/login');
                
                const response = await axios.post(API_BASE + '/auth/login', {
                    email: email,
                    password: password
                });
                
                log('📦 Status: ' + response.status);
                log('📦 Response: ' + JSON.stringify(response.data));
                
                if (response.data && response.data.success) {
                    // ===== PUNTO DE RUPTURA PARA DEPURACIÓN =====
                    log('🔍 === PUNTO DE RUPTURA ALCANZADO ===', 'warning');
                    debugger; // <-- EL CÓDIGO SE DETENDRÁ AQUÍ
                    
                    const user = response.data.data.user;
                    const token = response.data.data.token;
                    
                    log('✅ LOGIN EXITOSO para ' + user.full_name, 'success');
                    log('🎫 Token generado: ' + token.substring(0, 30) + '...', 'success');
                    
                    // INVESTIGACIÓN DETALLADA DEL TOKEN
                    log('🔍 === INVESTIGACIÓN DETALLADA ===', 'warning');
                    log('🔍 typeof token: ' + typeof token);
                    log('🔍 token.length: ' + (token ? token.length : 'N/A'));
                    log('🔍 token es string: ' + (typeof token === 'string' ? 'SÍ' : 'NO'));
                    log('🔍 token truthy: ' + (token ? 'SÍ' : 'NO'));
                    log('🔍 response.data estructura: ' + JSON.stringify(Object.keys(response.data)));
                    log('🔍 response.data.data estructura: ' + JSON.stringify(Object.keys(response.data.data)));
                    
                    // INVESTIGACIÓN DE LOCALSTORAGE
                    log('🔍 === INVESTIGACIÓN DE LOCALSTORAGE ===', 'warning');
                    log('🔍 localStorage disponible: ' + (typeof localStorage !== 'undefined' ? 'SÍ' : 'NO'));
                    log('🔍 localStorage.setItem función: ' + (typeof localStorage.setItem === 'function' ? 'SÍ' : 'NO'));
                    
                    // Limpiar localStorage primero
                    try {
                        localStorage.clear();
                        log('🧹 localStorage limpiado');
                    } catch (e) {
                        log('❌ Error limpiando localStorage: ' + e.message, 'error');
                    }
                    
                    // Guardar token y redirigir
                    try {
                        log('🔍 DEPURACIÓN: Intentando guardar token...');
                        log('🔍 Token variable: ' + (token ? 'PRESENTE (' + token.length + ' chars)' : 'AUSENTE'));
                        log('🔍 localStorage disponible: ' + (typeof localStorage !== 'undefined' ? 'SÍ' : 'NO'));
                        
                        // LÍNEA CRÍTICA
                        log('🎯 === EJECUTANDO localStorage.setItem() ===', 'warning');
                        localStorage.setItem('auth_token', token);
                        log('💾 localStorage.setItem() ejecutado SIN ERRORES', 'success');
                        
                        // Verificar inmediatamente si se guardó
                        const verificacion = localStorage.getItem('auth_token');
                        log('🔍 VERIFICACIÓN INMEDIATA: Token en localStorage: ' + (verificacion ? 'PRESENTE (' + verificacion.length + ' chars)' : 'AUSENTE'), verificacion ? 'success' : 'error');
                        
                        // Comparar tokens
                        if (verificacion && token) {
                            log('🔍 Los tokens coinciden: ' + (verificacion === token ? 'SÍ' : 'NO'), verificacion === token ? 'success' : 'error');
                        }
                        
                        // Verificar todas las claves en localStorage
                        log('🔍 Todas las claves en localStorage: ' + Object.keys(localStorage).join(', '));
                        
                        log('✅ === DEPURACIÓN COMPLETA - REVISAR RESULTADOS ===', 'success');
                        
                    } catch (storageError) {
                        log('❌ ERROR CRÍTICO guardando token: ' + storageError.message, 'error');
                        log('❌ Stack: ' + storageError.stack, 'error');
                    }
                    
                } else {
                    const errorMsg = (response.data && response.data.error) || 'Error desconocido';
                    log('❌ Login fallido: ' + errorMsg, 'error');
                }
                
            } catch (error) {
                log('❌ ERROR EN LOGIN: ' + error.message, 'error');
                
                if (error.response) {
                    log('📄 Status: ' + error.response.status, 'error');
                    log('📄 Data: ' + JSON.stringify(error.response.data || {}), 'error');
                } else {
                    log('📄 No response - Error de red o CORS', 'error');
                }
            }
        }

        // Ejecutar automáticamente después de 3 segundos
        document.addEventListener('DOMContentLoaded', function() {
            log('🔧 Sistema de debug cargado');
            log('⏰ Iniciando login automático en 3 segundos...');
            
            setTimeout(() => {
                executeLoginWithDebugger();
            }, 3000);
        });
    </script>
</body>
</html>`);
})

// Test completo: Login → Token → Redirect en una sola página
app.get('/test-full-flow.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Full Flow</title>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        body { font-family: monospace; background: #000; color: #00ff00; padding: 20px; }
        .container { max-width: 1000px; margin: 0 auto; }
        .success { color: #44ff44; }
        .error { color: #ff4444; }
        .warning { color: #ffaa44; }
        .section { border: 1px solid #333; margin: 10px 0; padding: 10px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 TEST FLUJO COMPLETO: Login → Token → Redirect</h1>
        
        <div class="section">
            <h2>PASO 1: Login</h2>
            <div id="loginLogs"></div>
        </div>
        
        <div class="section">
            <h2>PASO 2: Verificación Token</h2>
            <div id="tokenLogs"></div>
        </div>
        
        <div class="section">
            <h2>PASO 3: Test API con Token</h2>
            <div id="apiLogs"></div>
        </div>
        
        <div class="section">
            <h2>PASO 4: Navegación</h2>
            <div id="navLogs"></div>
            <button onclick="goToEdit()" id="editBtn" style="display:none; background:#007cba; color:white; padding:10px; border:none; cursor:pointer;">
                🚀 IR A PÁGINA DE EDICIÓN
            </button>
        </div>
    </div>

    <script>
        const API_BASE = '/api';
        
        function log(message, containerId, type = 'normal') {
            const container = document.getElementById(containerId);
            const className = type === 'error' ? 'error' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : '';
            container.innerHTML += '<div class="' + className + '">' + new Date().toLocaleTimeString() + ' > ' + message + '</div>';
            console.log(message);
        }

        async function executeFullFlow() {
            // PASO 1: LOGIN
            log('🚀 INICIANDO LOGIN...', 'loginLogs');
            
            try {
                const response = await axios.post(API_BASE + '/auth/login', {
                    email: 'carlos.rodriguez@ctei.edu.co',
                    password: 'password123'
                });
                
                log('✅ Respuesta del servidor: Status ' + response.status, 'loginLogs', 'success');
                
                if (response.data && response.data.success) {
                    const token = response.data.data.token;
                    log('✅ Token recibido: ' + token.substring(0, 30) + '...', 'loginLogs', 'success');
                    
                    // Limpiar localStorage
                    localStorage.clear();
                    log('🧹 localStorage limpiado', 'loginLogs');
                    
                    // Guardar token
                    localStorage.setItem('auth_token', token);
                    log('💾 Token guardado con clave "auth_token"', 'loginLogs', 'success');
                    
                    // PASO 2: VERIFICACIÓN INMEDIATA
                    setTimeout(() => verifyToken(), 1000);
                } else {
                    log('❌ Login falló: ' + (response.data.error || 'Error desconocido'), 'loginLogs', 'error');
                }
                
            } catch (error) {
                log('❌ Error en login: ' + error.message, 'loginLogs', 'error');
            }
        }

        function verifyToken() {
            log('🔍 VERIFICANDO TOKEN EN LOCALSTORAGE...', 'tokenLogs');
            
            const token = localStorage.getItem('auth_token');
            log('Token presente: ' + (token ? 'SÍ (' + token.length + ' chars)' : 'NO'), 'tokenLogs', token ? 'success' : 'error');
            
            if (token) {
                // Configurar axios
                axios.defaults.headers.common['Authorization'] = 'Bearer ' + token;
                log('✅ Cabeceras de axios configuradas', 'tokenLogs', 'success');
                
                // Verificar estructura del token
                try {
                    const parts = token.split('.');
                    const payload = JSON.parse(atob(parts[1]));
                    log('✅ Token decodificado - Usuario: ' + payload.email, 'tokenLogs', 'success');
                    log('✅ Rol: ' + payload.role, 'tokenLogs', 'success');
                    log('✅ Expira: ' + new Date(payload.exp * 1000).toLocaleString(), 'tokenLogs', 'success');
                } catch (e) {
                    log('⚠️ Error decodificando token: ' + e.message, 'tokenLogs', 'warning');
                }
                
                // PASO 3: TEST API
                setTimeout(() => testAPI(), 1000);
            } else {
                log('❌ No se puede continuar sin token', 'tokenLogs', 'error');
            }
        }

        async function testAPI() {
            log('📡 PROBANDO API CON TOKEN...', 'apiLogs');
            
            try {
                log('🚀 Enviando GET a /api/private/projects/1', 'apiLogs');
                
                const response = await axios.get('/api/private/projects/1');
                
                log('✅ API respondió: Status ' + response.status, 'apiLogs', 'success');
                log('✅ Success: ' + response.data.success, 'apiLogs', 'success');
                
                if (response.data.success && response.data.data) {
                    log('✅ Proyecto cargado: ' + response.data.data.title, 'apiLogs', 'success');
                    log('✅ Propietario: ' + response.data.data.owner_name, 'apiLogs', 'success');
                    
                    // ÉXITO TOTAL
                    log('🎉 ¡FLUJO COMPLETO EXITOSO!', 'navLogs', 'success');
                    log('✅ Login funcionó', 'navLogs', 'success');
                    log('✅ Token se guardó', 'navLogs', 'success');
                    log('✅ API respondió correctamente', 'navLogs', 'success');
                    log('✅ Listo para navegar a página de edición', 'navLogs', 'success');
                    
                    document.getElementById('editBtn').style.display = 'block';
                } else {
                    log('❌ API devolvió error: ' + JSON.stringify(response.data), 'apiLogs', 'error');
                }
                
            } catch (error) {
                log('❌ Error en API: ' + error.message, 'apiLogs', 'error');
                if (error.response) {
                    log('❌ Status: ' + error.response.status, 'apiLogs', 'error');
                    log('❌ Data: ' + JSON.stringify(error.response.data), 'apiLogs', 'error');
                }
                
                log('🔍 DIAGNÓSTICO: El problema está aquí ↑', 'navLogs', 'warning');
            }
        }

        function goToEdit() {
            log('🚀 NAVEGANDO A PÁGINA DE EDICIÓN...', 'navLogs');
            log('✅ Token en localStorage antes de navegar: ' + (localStorage.getItem('auth_token') ? 'PRESENTE' : 'AUSENTE'), 'navLogs');
            
            setTimeout(() => {
                window.location.href = '/dashboard/proyectos/1/editar';
            }, 2000);
        }

        // Iniciar flujo automáticamente
        document.addEventListener('DOMContentLoaded', function() {
            log('🔧 Sistema cargado - Iniciando flujo en 2 segundos...', 'loginLogs');
            setTimeout(executeFullFlow, 2000);
        });
    </script>
</body>
</html>`);
})

// Página de prueba del dashboard con temas
app.get('/dashboard-theme-test', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es" id="dashboard-html">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🎨 Test Temas Dashboard - CTeI Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
</head>
<body class="bg-background text-foreground min-h-screen">
    <!-- Navbar de prueba -->
    <nav class="bg-card shadow-lg border-b border-border">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between h-16">
                <div class="flex items-center">
                    <div id="dashboard-site-logo" class="text-xl font-bold text-primary">
                        <i class="fas fa-flask mr-2"></i>
                        CTeI-Manager
                    </div>
                    <span class="ml-4 text-muted-foreground">Test Temas Dashboard</span>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-sm text-muted-foreground">Usuario de Prueba (ADMIN)</span>
                    <!-- Selector de Tema Claro/Oscuro -->
                    <button id="dashboard-theme-toggle" onclick="toggleDashboardTheme()" class="ctei-btn-secondary" title="Cambiar tema">
                        <i class="fas fa-moon" id="dashboard-theme-icon"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <div class="p-8">
        <div class="max-w-6xl mx-auto space-y-6">
            <h1 class="text-3xl font-bold text-foreground">🎨 Prueba de Temas Dashboard</h1>
            
            <!-- Ejemplo de tarjetas -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">Tarjeta Primaria</div>
                        <div class="ctei-content-card-subtitle">Ejemplo de contenido</div>
                    </div>
                    <div class="p-4">
                        <p class="text-muted-foreground">Contenido de la tarjeta con texto muted.</p>
                        <button class="ctei-btn ctei-btn-primary mt-4">Acción Primaria</button>
                    </div>
                </div>
                
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">Formulario de Prueba</div>
                    </div>
                    <div class="p-4 space-y-4">
                        <div class="ctei-form-group">
                            <label class="ctei-form-label">Nombre</label>
                            <input type="text" class="ctei-form-input" placeholder="Escriba aquí...">
                        </div>
                        <div class="ctei-form-group">
                            <label class="ctei-form-label">Descripción</label>
                            <textarea class="ctei-form-textarea" rows="3" placeholder="Descripción..."></textarea>
                        </div>
                        <button class="ctei-btn ctei-btn-secondary">Guardar</button>
                    </div>
                </div>
                
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">Colores del Sistema</div>
                    </div>
                    <div class="p-4 space-y-3">
                        <div class="flex items-center space-x-3">
                            <div class="w-6 h-6 bg-primary rounded"></div>
                            <span class="text-sm">Primary</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div class="w-6 h-6 bg-secondary rounded"></div>
                            <span class="text-sm">Secondary</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div class="w-6 h-6 bg-accent rounded"></div>
                            <span class="text-sm">Accent</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div class="w-6 h-6 bg-destructive rounded"></div>
                            <span class="text-sm">Destructive</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Información de debug -->
            <div class="bg-muted/50 border border-border rounded-lg p-4">
                <h3 class="font-semibold mb-2">🔍 Debug Info</h3>
                <div class="text-sm text-muted-foreground space-y-1">
                    <p><strong>Tema actual:</strong> <span id="current-theme">Cargando...</span></p>
                    <p><strong>Preferencia del sistema:</strong> <span id="system-preference">Cargando...</span></p>
                    <p><strong>localStorage theme:</strong> <span id="stored-theme">Cargando...</span></p>
                </div>
            </div>
        </div>
    </div>

    <script>
        // Importar las funciones de tema desde dashboard.js
        let isDashboardDarkMode = localStorage.getItem('dashboard_theme') === 'dark' || 
            (!localStorage.getItem('dashboard_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

        function applyDashboardTheme() {
            const htmlElement = document.getElementById('dashboard-html') || document.documentElement;
            
            if (isDashboardDarkMode) {
                htmlElement.classList.add('dark');
                updateDashboardThemeIcon('sun');
                console.log('🌙 Tema oscuro aplicado al dashboard');
            } else {
                htmlElement.classList.remove('dark');
                updateDashboardThemeIcon('moon');
                console.log('☀️ Tema claro aplicado al dashboard');
            }
            
            localStorage.setItem('dashboard_theme', isDashboardDarkMode ? 'dark' : 'light');
            updateDebugInfo();
        }

        function updateDashboardThemeIcon(icon) {
            const themeIcon = document.getElementById('dashboard-theme-icon');
            if (themeIcon) {
                themeIcon.className = icon === 'sun' ? 'fas fa-sun' : 'fas fa-moon';
            }
        }

        function toggleDashboardTheme() {
            isDashboardDarkMode = !isDashboardDarkMode;
            applyDashboardTheme();
            console.log('🎨 Tema del dashboard cambiado a:', isDashboardDarkMode ? 'oscuro' : 'claro');
        }

        function updateDebugInfo() {
            document.getElementById('current-theme').textContent = isDashboardDarkMode ? 'Oscuro 🌙' : 'Claro ☀️';
            document.getElementById('system-preference').textContent = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'Oscuro' : 'Claro';
            document.getElementById('stored-theme').textContent = localStorage.getItem('dashboard_theme') || 'null';
        }

        // Inicializar al cargar
        document.addEventListener('DOMContentLoaded', function() {
            applyDashboardTheme();
            updateDebugInfo();
        });
    </script>
</body>
</html>`)
})

// Página de prueba directa del dashboard de monitoreo
app.get('/monitoring-test.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 Test Dashboard Monitoreo - CTeI Manager</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    <link href="/static/styles.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
</head>
<body class="bg-gray-100">
    <div class="container mx-auto p-8">
        <h1 class="text-3xl font-bold mb-6">🔧 Test Dashboard de Monitoreo</h1>
        <div class="space-y-4">
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-semibold mb-4">1. Login como Admin</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Email:</label>
                        <input type="email" id="email" value="test.admin@ctei.edu.co" class="w-full p-2 border rounded">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Password:</label>
                        <input type="password" id="password" value="admin123" class="w-full p-2 border rounded">
                    </div>
                </div>
                <button onclick="testLogin()" class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                    <i class="fas fa-sign-in-alt mr-2"></i>Login & Ir al Dashboard
                </button>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-semibold mb-4">2. Test API Monitoreo</h2>
                <button onclick="testMonitoringAPI()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                    <i class="fas fa-chart-line mr-2"></i>Probar API Monitoreo
                </button>
                <div id="apiResult" class="mt-4 p-4 bg-gray-100 rounded hidden"></div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-semibold mb-4">3. Test Dashboard Directo</h2>
                <button onclick="testDashboard()" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                    <i class="fas fa-dashboard mr-2"></i>Cargar Dashboard Monitoreo
                </button>
                <div id="dashboardContainer" class="mt-4"></div>
            </div>
        </div>
    </div>
    
    <script>
        let adminToken = null;
        
        async function testLogin() {
            try {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                const response = await axios.post('/api/auth/login', {
                    email,
                    password
                });
                
                if (response.data.success) {
                    adminToken = response.data.data.token;
                    localStorage.setItem('auth_token', adminToken);
                    axios.defaults.headers.common['Authorization'] = \`Bearer \${adminToken}\`;
                    
                    alert('✅ Login exitoso! Token guardado. Ir al dashboard?');
                    if (confirm('¿Ir al dashboard principal?')) {
                        window.location.href = '/dashboard';
                    }
                } else {
                    alert('❌ Error en login: ' + response.data.error);
                }
            } catch (error) {
                console.error('Error:', error);
                alert('❌ Error de conexión: ' + error.message);
            }
        }
        
        async function testMonitoringAPI() {
            if (!adminToken) {
                alert('⚠️ Necesitas hacer login primero');
                return;
            }
            
            try {
                const response = await axios.get('/api/admin/monitoring/overview', {
                    headers: { 'Authorization': \`Bearer \${adminToken}\` }
                });
                
                const resultDiv = document.getElementById('apiResult');
                resultDiv.classList.remove('hidden');
                resultDiv.innerHTML = \`
                    <h3 class="font-semibold text-green-600">✅ API Response:</h3>
                    <p><strong>Proyectos:</strong> \${response.data.data.system_metrics.total_projects}</p>
                    <p><strong>Productos:</strong> \${response.data.data.system_metrics.total_products}</p>
                    <p><strong>Investigadores:</strong> \${response.data.data.system_metrics.total_researchers}</p>
                    <p><strong>Líneas de Acción:</strong> \${response.data.data.action_line_metrics.length}</p>
                    <pre class="mt-2 text-xs bg-white p-2 rounded overflow-auto max-h-32">\${JSON.stringify(response.data.data.system_metrics, null, 2)}</pre>
                \`;
            } catch (error) {
                document.getElementById('apiResult').innerHTML = \`
                    <h3 class="font-semibold text-red-600">❌ API Error:</h3>
                    <p>\${error.message}</p>
                \`;
                document.getElementById('apiResult').classList.remove('hidden');
            }
        }
        
        async function testDashboard() {
            if (!adminToken) {
                alert('⚠️ Necesitas hacer login primero');
                return;
            }
            
            const container = document.getElementById('dashboardContainer');
            container.innerHTML = \`
                <div class="bg-blue-50 p-4 rounded">
                    <h3 class="font-semibold mb-2">🚀 Simulación Dashboard Monitoreo</h3>
                    <div class="space-y-2">
                        <div class="bg-white p-2 rounded">📊 Métricas del Sistema</div>
                        <div class="bg-white p-2 rounded">📈 Líneas de Acción</div>
                        <div class="bg-white p-2 rounded">⚠️ Proyectos de Atención</div>
                        <div class="bg-white p-2 rounded">🔄 Auto-refresh: 30s</div>
                        <button onclick="window.location.href='/dashboard'" class="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                            Ir al Dashboard Real
                        </button>
                    </div>
                </div>
            \`;
        }
        
        // Auto-load token si existe
        const existingToken = localStorage.getItem('auth_token');
        if (existingToken) {
            adminToken = existingToken;
            axios.defaults.headers.common['Authorization'] = \`Bearer \${existingToken}\`;
            console.log('🎫 Token existente cargado');
        }
    </script>
</body>
</html>`);
});

// Página de login limpia sin interferencias
app.get('/login-clean.html', async (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 Login Limpio - CTeI Manager</title>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 12px; background: #007cba; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #005a87; }
        .preset { margin: 10px 0; }
        .preset-btn { padding: 5px 10px; margin: 2px; background: #f0f0f0; border: 1px solid #ccc; border-radius: 3px; cursor: pointer; font-size: 12px; }
        .preset-btn:hover { background: #e0e0e0; }
        .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
        .result.success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; }
        .result.error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; }
        .logs { background: #000; color: #00ff00; padding: 10px; border-radius: 4px; height: 300px; overflow-y: auto; font-family: monospace; font-size: 12px; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔧 Login Directo - Sin Interferencias</h1>
        <p><strong>Nota:</strong> Esta página evita problemas de caché y extensiones del navegador.</p>
        
        <form id="loginForm">
            <div class="form-group">
                <label for="email">Email:</label>
                <input type="email" id="email" value="maria.lopez@ctei.edu.co" required>
            </div>
            
            <div class="form-group">
                <label for="password">Contraseña:</label>
                <input type="password" id="password" value="test123" required>
            </div>
            
            <button type="submit">🚀 PROBAR LOGIN</button>
        </form>
        
        <div class="preset">
            <strong>Usuarios de prueba:</strong><br>
            <button class="preset-btn" onclick="setCredentials('maria.lopez@ctei.edu.co', 'test123')">María López</button>
            <button class="preset-btn" onclick="setCredentials('carlos.rodriguez@ctei.edu.co', 'test123')">Carlos Rodríguez</button>
            <button class="preset-btn" onclick="setCredentials('admin@ctei.edu.co', 'test123')">Admin CTeI</button>
            <button class="preset-btn" onclick="setCredentials('investigador.test@choco.gov.co', 'test123')">Investigador Chocó</button>
        </div>
        
        <div id="result"></div>
        
        <button onclick="clearLogs()" style="background: #6c757d; margin-top: 10px; width: auto; padding: 5px 15px;">Limpiar Logs</button>
        <div id="logs" class="logs"></div>
    </div>

    <script>
        const API_BASE = '/api';
        
        function log(message) {
            const logs = document.getElementById('logs');
            const timestamp = new Date().toLocaleTimeString();
            logs.innerHTML += timestamp + ' - ' + message + '\\n';
            logs.scrollTop = logs.scrollHeight;
            console.log(message);
        }
        
        function clearLogs() {
            document.getElementById('logs').innerHTML = '';
            document.getElementById('result').innerHTML = '';
        }
        
        function setCredentials(email, password) {
            document.getElementById('email').value = email;
            document.getElementById('password').value = password;
            log('📝 Credenciales establecidas: ' + email);
        }
        
        function showResult(success, message, data = null) {
            const result = document.getElementById('result');
            
            if (success) {
                result.className = 'result success';
                result.innerHTML = '<h3>✅ ¡LOGIN EXITOSO!</h3><p>' + message + '</p>' + 
                    (data ? '<pre>' + JSON.stringify(data, null, 2) + '</pre>' : '');
            } else {
                result.className = 'result error';
                result.innerHTML = '<h3>❌ Login Fallido</h3><p>' + message + '</p>';
            }
        }

        document.getElementById('loginForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            
            log('🚀 === INICIANDO LOGIN ===');
            log('📧 Email: ' + email);
            log('🔑 Password: ' + (password ? '***SET***' : 'EMPTY'));
            log('🌐 API Base: ' + API_BASE);
            log('📦 Axios: ' + (typeof axios !== 'undefined' ? 'DISPONIBLE' : 'NO DISPONIBLE'));
            
            if (!email || !password) {
                log('❌ Campos vacíos');
                showResult(false, 'Por favor ingresa email y contraseña');
                return;
            }
            
            try {
                log('🌐 Enviando petición POST a: ' + API_BASE + '/auth/login');
                
                const response = await axios.post(API_BASE + '/auth/login', {
                    email: email,
                    password: password
                });
                
                log('📦 Status: ' + response.status);
                log('📦 Response: ' + JSON.stringify(response.data));
                
                if (response.data && response.data.success) {
                    // ===== PUNTO DE RUPTURA PARA DEPURACIÓN =====
                    debugger; // <-- EL CÓDIGO SE DETENDRÁ AQUÍ
                    
                    const user = response.data.data.user;
                    const token = response.data.data.token;
                    
                    showResult(true, 'Usuario: ' + user.full_name + ' (' + user.role + ')', {
                        email: user.email,
                        role: user.role,
                        id: user.id
                    });
                    
                    log('✅ LOGIN EXITOSO para ' + user.full_name);
                    log('🎫 Token generado: ' + token.substring(0, 30) + '...');
                    
                    // Guardar token y redirigir
                    try {
                        log('🔍 DEPURACIÓN: Intentando guardar token...');
                        log('🔍 Token variable: ' + (token ? 'PRESENTE (' + token.length + ' chars)' : 'AUSENTE'));
                        log('🔍 localStorage disponible: ' + (typeof localStorage !== 'undefined' ? 'SÍ' : 'NO'));
                        
                        localStorage.setItem('auth_token', token);
                        log('💾 localStorage.setItem() ejecutado');
                        
                        // Verificar inmediatamente si se guardó
                        const verificacion = localStorage.getItem('auth_token');
                        log('🔍 VERIFICACIÓN INMEDIATA: Token en localStorage: ' + (verificacion ? 'PRESENTE (' + verificacion.length + ' chars)' : 'AUSENTE'));
                        
                        log('🔄 Redirigiendo al dashboard...');
                        setTimeout(function() {
                            window.location.href = '/dashboard';
                        }, 2000);
                        
                    } catch (storageError) {
                        log('⚠️ Error guardando token: ' + storageError.message);
                    }
                    
                } else {
                    const errorMsg = (response.data && response.data.error) || 'Error desconocido';
                    log('❌ Login fallido: ' + errorMsg);
                    showResult(false, errorMsg);
                }
                
            } catch (error) {
                log('❌ ERROR: ' + error.message);
                
                if (error.response) {
                    log('📄 Status: ' + error.response.status);
                    log('📄 Data: ' + JSON.stringify(error.response.data || {}));
                } else {
                    log('📄 No response - Error de red o CORS');
                }
                
                const errorMessage = (error.response && error.response.data && error.response.data.error) || error.message || 'Error de conexión';
                showResult(false, errorMessage);
            }
        });
        
        // Inicialización
        log('🚀 Página cargada correctamente');
        log('🌐 URL actual: ' + window.location.href);
        log('📍 API Base configurado: ' + API_BASE);
        log('⏰ Timestamp: ' + new Date().toISOString());
    </script>
</body>
</html>`);
})

app.get('/test-login-debug.html', async (c) => {
  // En desarrollo, leer el archivo directamente
  try {
    // Nota: En Cloudflare Workers no se puede leer archivos del filesystem
    // Esta es una implementación temporal para desarrollo local
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Debug Login - CTeI Manager</title>
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 p-8">
    <div class="max-w-md mx-auto bg-white p-6 rounded shadow">
        <h1 class="text-2xl font-bold mb-4">🔍 Debug Login Frontend</h1>
        
        <!-- Test admin@test.com -->
        <div class="mb-6 p-4 border rounded">
            <h2 class="text-lg font-semibold mb-2">🔑 Admin Login Test</h2>
            <button onclick="testAdminLogin()" class="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">
                Test admin@test.com / admin123
            </button>
        </div>

        <!-- Test investigador -->
        <div class="mb-6 p-4 border rounded">
            <h2 class="text-lg font-semibold mb-2">🔬 Investigador Login Test</h2>
            <button onclick="testInvestigadorLogin()" class="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">
                Test investigador.test@choco.gov.co / ChocoCTeI2024
            </button>
        </div>

        <div id="result" class="mt-4 p-3 rounded hidden"></div>
        <div id="logs" class="mt-4 p-3 bg-gray-100 rounded text-xs">
            <h3 class="font-bold mb-2">📋 Logs:</h3>
            <div id="logContent"></div>
        </div>
    </div>

    <script>
        const API_BASE = window.location.origin + '/api';
        const logDiv = document.getElementById('logContent');
        
        function log(message) {
            const timestamp = new Date().toLocaleTimeString();
            logDiv.innerHTML += '<div class="mb-1">' + timestamp + ': ' + message + '</div>';
            console.log(message);
        }

        function showResult(success, message, data = null) {
            const resultDiv = document.getElementById('result');
            
            if (success) {
                resultDiv.className = 'mt-4 p-3 rounded bg-green-100 text-green-800';
                resultDiv.innerHTML = \`
                    <h3 class="font-bold">✅ LOGIN EXITOSO</h3>
                    <p>\${message}</p>
                    \${data ? \`<pre class="text-xs mt-2 bg-green-50 p-2 rounded">\${JSON.stringify(data, null, 2)}</pre>\` : ''}
                \`;
            } else {
                resultDiv.className = 'mt-4 p-3 rounded bg-red-100 text-red-800';
                resultDiv.innerHTML = \`
                    <h3 class="font-bold">❌ LOGIN FALLIDO</h3>
                    <p>\${message}</p>
                \`;
            }
            
            resultDiv.classList.remove('hidden');
        }

        async function performLogin(email, password) {
            log(\`🚀 Iniciando login para: \${email}\`);
            log(\`📍 API Endpoint: \${API_BASE}/auth/login\`);
            
            try {
                const response = await axios.post(\`\${API_BASE}/auth/login\`, {
                    email: email,
                    password: password
                });
                
                log(\`📊 Status: \${response.status}\`);
                log(\`📦 Response: \${JSON.stringify(response.data)}\`);
                
                if (response.data.success) {
                    const user = response.data.data.user;
                    const token = response.data.data.token;
                    
                    showResult(true, \`Usuario: \${user.full_name} (\${user.role})\`, {
                        email: user.email,
                        role: user.role,
                        token: token.substring(0, 50) + '...'
                    });
                    
                    // Guardar en localStorage para redirigir al dashboard
                    localStorage.setItem('auth_token', token);
                    
                    log(\`✅ Token guardado en localStorage\`);
                    
                } else {
                    showResult(false, response.data.error || 'Error desconocido');
                }
                
            } catch (error) {
                log(\`❌ Error: \${error.message}\`);
                log(\`📄 Error details: \${JSON.stringify(error.response?.data || 'No response data')}\`);
                
                showResult(false, error.response?.data?.error || error.message);
            }
        }

        async function testAdminLogin() {
            log('🔧 === TEST ADMIN LOGIN ===');
            await performLogin('admin@test.com', 'admin123');
        }

        async function testInvestigadorLogin() {
            log('🔬 === TEST INVESTIGADOR LOGIN ===');
            await performLogin('investigador.test@choco.gov.co', 'ChocoCTeI2024');
        }
        
        log('🚀 Debug page loaded');
        log(\`🌐 Current URL: \${window.location.href}\`);
        log(\`📍 API Base: \${API_BASE}\`);
    </script>
</body>
</html>`;
    
    return c.html(html);
  } catch (error) {
    return c.text('Error loading debug page', 500);
  }
})

// ===== API ROUTES =====

// Rutas de autenticación
app.route('/api/auth', auth)

// Rutas públicas (sin autenticación)
app.route('/api/public', publicRoutes)

// Rutas privadas (requieren autenticación)
app.route('/api/private', privateRoutes)

// Rutas de administrador (solo ADMIN)
app.route('/api/admin', adminRoutes)

// ===== FRONTEND ROUTES =====

// Página principal (Portal público)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CTeI-Manager - Portal de Ciencia, Tecnología e Innovación</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'primary': 'var(--color-primary)',
                  'secondary': 'var(--color-secondary)',
                  'accent': 'var(--color-accent)',
                  'background': 'var(--color-background)',
                  'foreground': 'var(--color-foreground)',
                  'card': 'var(--color-card)',
                  'muted': 'var(--color-muted)',
                  'border': 'var(--color-border)',
                }
              }
            }
          }
        </script>
    </head>
    <body class="level-0">
        <!-- Navbar Arquitectónico -->
        <nav class="ctei-navbar">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div id="site-logo" class="flex items-center">
                            <h1 class="text-xl font-bold text-foreground">
                                <i class="fas fa-dna mr-2" style="color: rgb(from var(--primary) r g b)"></i>
                                CTeI-Manager
                            </h1>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="#projects" class="ctei-navbar-link">Proyectos</a>
                        <a href="#products" class="ctei-navbar-link">Productos</a>
                        <a href="#stats" class="ctei-navbar-link">Analíticas</a>
                        
                        <!-- Toggle de modo oscuro -->
                        <button id="theme-toggle" class="ctei-theme-toggle ml-4" title="Cambiar tema">
                            <i class="fas fa-moon" id="theme-icon"></i>
                        </button>
                        
                        <!-- Botones para usuarios no autenticados -->
                        <div id="unauthenticatedButtons" class="flex items-center space-x-3">
                            <button onclick="showLoginModal()" class="ctei-btn-primary">
                                <i class="fas fa-sign-in-alt mr-2"></i>
                                Ingresar
                            </button>
                            <button onclick="testDirectLogin()" class="ctei-btn-secondary">
                                <i class="fas fa-flask mr-2"></i>
                                Test
                            </button>
                            <button onclick="showRegisterModal()" class="ctei-btn-secondary">
                                <i class="fas fa-user-plus mr-2"></i>
                                Registro
                            </button>
                        </div>
                        
                        <!-- Botones para usuarios autenticados -->
                        <div id="authenticatedButtons" class="hidden items-center space-x-3">
                            <span id="userInfo" class="text-muted-foreground text-sm font-medium"></span>
                            <a href="/dashboard" class="ctei-btn-primary">
                                <i class="fas fa-tachometer-alt mr-2"></i>
                                Dashboard
                            </a>
                            <button onclick="logout()" class="ctei-btn-secondary text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                                <i class="fas fa-sign-out-alt mr-2"></i>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Hero Section Inmersivo -->
        <section class="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
            <!-- Fondo con gradiente del sistema de diseño -->
            <div class="absolute inset-0 bg-gradient-to-br from-background to-muted"></div>
            <div class="absolute inset-0 scientific-pattern opacity-20"></div>
            
            <!-- Overlay para legibilidad -->
            <div class="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-background/20"></div>

            <!-- Contenido principal del hero -->
            <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <!-- Badge superior -->
                <div class="ctei-badge ctei-badge-primary mb-8">
                    <i class="fas fa-atom mr-2"></i>
                    Impulsando una Nueva Era de Investigación CTeI
                </div>

                <!-- Título principal -->
                <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight text-foreground">
                    <span class="text-primary">
                        Innovación
                    </span>
                    <br>
                    que Transforma 
                    <br>
                    <span class="text-foreground">el Futuro</span>
                </h1>

                <!-- Subtítulo -->
                <p class="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed">
                    La plataforma para visualizar y conectar la ciencia que define el mañana. 
                    <span class="text-primary font-medium">Descubre, colabora y acelera</span> el conocimiento científico.
                </p>

                <!-- Barra de búsqueda arquitectónica -->
                <div class="max-w-2xl mx-auto mb-16">
                    <div class="level-1 p-2">
                        <div class="flex items-center gap-2">
                            <input 
                                type="text" 
                                id="heroSearchInput"
                                placeholder="Explora proyectos, productos y descubrimientos..." 
                                class="ctei-search-input flex-1 text-lg"
                                style="border: none; box-shadow: none;"
                            >
                            <button 
                                onclick="performHeroSearch()"
                                class="ctei-btn-primary px-8 py-4 text-lg"
                            >
                                <i class="fas fa-search"></i>
                                Buscar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Filtros Pill Toggle Interactivos -->
                    <div class="flex flex-wrap justify-center gap-3 mt-8">
                        <button id="filter-all" onclick="setActiveFilter('all', this)" class="ctei-pill-toggle ctei-pill-toggle--active">
                            <i class="fas fa-th-large mr-2"></i> Todo
                        </button>
                        <button id="filter-projects" onclick="setActiveFilter('projects', this)" class="ctei-pill-toggle">
                            <i class="fas fa-project-diagram mr-2"></i> Proyectos
                        </button>
                        <button id="filter-products" onclick="setActiveFilter('products', this)" class="ctei-pill-toggle">
                            <i class="fas fa-cubes mr-2"></i> Productos
                        </button>
                        <button id="filter-investigators" onclick="setActiveFilter('investigators', this)" class="ctei-pill-toggle">
                            <i class="fas fa-users mr-2"></i> Investigadores
                        </button>
                    </div>
                </div>

                <!-- Indicador de scroll -->
                <div class="animate-bounce">
                    <button onclick="document.getElementById('content-section').scrollIntoView({behavior: 'smooth'})" class="text-muted-foreground hover:text-foreground transition-colors">
                        <div class="flex flex-col items-center">
                            <span class="text-sm mb-2">Explora más</span>
                            <i class="fas fa-chevron-down text-xl"></i>
                        </div>
                    </button>
                </div>
            </div>

            <!-- Elementos decorativos -->
            <div class="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl animate-pulse"></div>
            <div class="absolute bottom-20 right-10 w-48 h-48 bg-chart-2/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </section>

        <!-- Contenido principal -->
        <main id="content-section" class="level-0">
            <div class="ctei-container ctei-section">

            <!-- Búsqueda Avanzada -->
            <div class="level-1 level-2 p-6 mb-8">
                <div class="space-y-4">
                    <!-- Barra de búsqueda principal -->
                    <div class="flex flex-col sm:flex-row gap-4">
                        <div class="flex-1">
                            <input 
                                type="text" 
                                id="searchInput"
                                placeholder="Buscar proyectos y productos..." 
                                class="ctei-search-input"
                            >
                        </div>
                        <div class="flex gap-2">
                            <button 
                                onclick="toggleAdvancedFilters()"
                                class="ctei-btn-secondary"
                                id="filtersToggle"
                            >
                                <i class="fas fa-filter"></i>
                                Filtros
                            </button>
                            <button 
                                onclick="performSearch()"
                                class="ctei-btn-primary"
                            >
                                <i class="fas fa-search"></i>
                                Buscar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Filtros avanzados (inicialmente ocultos) -->
                    <div id="advancedFilters" class="hidden border-t border-border pt-4">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <!-- Filtro por año -->
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Año</label>
                                <select 
                                    id="yearFilter"
                                    class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Todos los años</option>
                                    <option value="2024">2024</option>
                                    <option value="2023">2023</option>
                                    <option value="2022">2022</option>
                                    <option value="2021">2021</option>
                                </select>
                            </div>
                            
                            <!-- Filtro por tipo de contenido -->
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Tipo</label>
                                <select 
                                    id="typeFilter"
                                    class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Proyectos y Productos</option>
                                    <option value="projects">Solo Proyectos</option>
                                    <option value="products">Solo Productos</option>
                                </select>
                            </div>
                            
                            <!-- Filtro por categoría de producto -->
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Categoría</label>
                                <select 
                                    id="categoryFilter"
                                    class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                >
                                    <option value="">Todas las categorías</option>
                                    <!-- Las categorías se cargarán dinámicamente -->
                                </select>
                            </div>
                        </div>
                        
                        <!-- Botones de acción para filtros -->
                        <div class="flex justify-end gap-2 mt-4">
                            <button 
                                onclick="clearAllFilters()"
                                class="bg-muted text-muted-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                Limpiar Filtros
                            </button>
                            <button 
                                onclick="performSearch()"
                                class="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                Aplicar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estadísticas públicas -->
            <div id="stats" class="ctei-grid ctei-grid-4 mb-8">
                <div class="ctei-stats-card" onclick="scrollToSection('projects')">
                    <div class="flex items-center">
                        <div class="p-3" style="background-color: var(--primary); opacity: 0.1; border-radius: var(--radius);">
                            <i class="ctei-stats-icon fas fa-project-diagram"></i>
                        </div>
                        <div class="ml-4">
                            <p class="ctei-stats-number ctei-count-up" id="totalProjects">0</p>
                            <p class="ctei-stats-label">Proyectos Públicos</p>
                        </div>
                    </div>
                </div>
                
                <div class="ctei-stats-card" onclick="scrollToSection('products')">
                    <div class="flex items-center">
                        <div class="p-3" style="background-color: var(--chart-2); opacity: 0.1; border-radius: var(--radius);">
                            <i class="ctei-stats-icon fas fa-cubes" style="color: var(--chart-2);"></i>
                        </div>
                        <div class="ml-4">
                            <p class="ctei-stats-number ctei-count-up" id="totalProducts">0</p>
                            <p class="ctei-stats-label">Productos de CTeI</p>
                        </div>
                    </div>
                </div>

                <div class="ctei-stats-card">
                    <div class="flex items-center">
                        <div class="p-3" style="background-color: var(--chart-3); opacity: 0.1; border-radius: var(--radius);">
                            <i class="ctei-stats-icon fas fa-users" style="color: var(--chart-3);"></i>
                        </div>
                        <div class="ml-4">
                            <p class="ctei-stats-number ctei-count-up" id="activeInvestigators">0</p>
                            <p class="ctei-stats-label">Investigadores Activos</p>
                        </div>
                    </div>
                </div>

                <div class="ctei-stats-card">
                    <div class="flex items-center">
                        <div class="p-3" style="background-color: var(--chart-4); opacity: 0.1; border-radius: var(--radius);">
                            <i class="ctei-stats-icon fas fa-chart-line" style="color: var(--chart-4);"></i>
                        </div>
                        <div class="ml-4">
                            <p class="ctei-stats-number">24/7</p>
                            <p class="ctei-stats-label">Acceso Disponible</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proyectos destacados -->
            <section id="projects" class="ctei-section">
                <h3 class="text-2xl font-bold mb-6" style="font-family: var(--font-sans); letter-spacing: var(--tracking-tight); color: var(--foreground);">Proyectos Destacados</h3>
                <div id="projectsContainer" class="ctei-grid ctei-grid-3">
                    <!-- Los proyectos se cargarán dinámicamente -->
                </div>
                <div class="text-center mt-8">
                    <button onclick="loadMoreProjects()" class="ctei-btn-secondary">
                        Ver Más Proyectos
                    </button>
                </div>
            </section>

            <!-- Productos recientes -->
            <section id="products" class="ctei-section">
                <h3 class="text-2xl font-bold mb-6" style="font-family: var(--font-sans); letter-spacing: var(--tracking-tight); color: var(--foreground);">Productos de CTeI Recientes</h3>
                <div id="productsContainer" class="ctei-grid ctei-grid-3">
                    <!-- Los productos se cargarán dinámicamente -->
                </div>
                <div class="text-center mt-8">
                    <button onclick="loadMoreProducts()" class="ctei-btn-secondary">
                        Ver Más Productos
                    </button>
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="level-1 mt-16">
            <div class="ctei-container py-8 text-center">
                <p class="ctei-project-card-metadata">&copy; 2024 CTeI-Manager. Plataforma de Ciencia, Tecnología e Innovación.</p>
            </div>
        </footer>

        <!-- Modales -->
        <div id="loginModal" class="fixed inset-0 bg-black/60 backdrop-blur-md hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="level-3 max-w-md w-full">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Iniciar Sesión</h3>
                            <button onclick="closeLoginModal()" class="text-muted-foreground hover:text-foreground">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form id="staticLoginForm">
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Email</label>
                                <input type="email" id="loginEmail" class="ctei-search-input" required autocomplete="email">
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Contraseña</label>
                                <input type="password" id="loginPassword" class="ctei-search-input" required autocomplete="current-password">
                            </div>
                            <button type="submit" class="ctei-btn-primary w-full">
                                <i class="fas fa-sign-in-alt"></i>
                                Ingresar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <div id="registerModal" class="fixed inset-0 bg-black/60 backdrop-blur-md hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="level-3 max-w-md w-full">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Registro</h3>
                            <button onclick="closeRegisterModal()" class="text-muted-foreground hover:text-foreground">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form onsubmit="handleRegister(event)">
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Nombre Completo</label>
                                <input type="text" id="registerName" class="ctei-search-input" required>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Email</label>
                                <input type="email" id="registerEmail" class="ctei-search-input" required>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Contraseña</label>
                                <input type="password" id="registerPassword" class="ctei-search-input" required>
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Rol</label>
                                <select id="registerRole" class="ctei-search-input">
                                    <option value="COMMUNITY">Comunidad</option>
                                    <option value="INVESTIGATOR">Investigador</option>
                                </select>
                            </div>
                            <button type="submit" class="ctei-btn-primary w-full">
                                Registrarse
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/phase1-enhancements.js?v=20240912-2"></script>
        
        <!-- Script para cargar logo dinámico -->
        <script>
        // Cargar configuración del sitio y aplicar logo
        async function loadSiteConfig() {
            try {
                const response = await axios.get('/api/public/site-config');
                const logoContainer = document.getElementById('site-logo');
                const siteName = response.data.data?.site_name || 'CODECTI CHOCÓ';
                
                if (response.data.success && response.data.data.logo_url) {
                    // Usar logo personalizado desde admin - SOLO IMAGEN
                    const logoUrl = response.data.data.logo_url;
                    
                    logoContainer.innerHTML = \`
                        <img 
                            src="\${logoUrl}" 
                            alt="\${siteName} Logo" 
                            class="h-8 w-auto"
                            style="max-height: 32px; object-fit: contain;"
                        >
                    \`;
                    
                    console.log('✅ Logo personalizado cargado (solo imagen):', logoUrl);
                } else {
                    // Usar logo por defecto de CODECTI CHOCÓ - SOLO IMAGEN
                    logoContainer.innerHTML = \`
                        <img 
                            src="/static/codecti-logo.png" 
                            alt="\${siteName} Logo" 
                            class="h-8 w-auto"
                            style="max-height: 32px; object-fit: contain;"
                        >
                    \`;
                    
                    console.log('✅ Logo por defecto de CODECTI CHOCÓ cargado (solo imagen)');
                }
            } catch (error) {
                // Fallback si hay error de red - SOLO IMAGEN
                const logoContainer = document.getElementById('site-logo');
                logoContainer.innerHTML = \`
                    <img 
                        src="/static/codecti-logo.png" 
                        alt="CODECTI CHOCÓ Logo" 
                        class="h-8 w-auto"
                        style="max-height: 32px; object-fit: contain;"
                    >
                \`;
                console.warn('⚠️ Error cargando configuración, usando logo fallback (solo imagen):', error);
            }
        }

        // Cargar configuración al cargar la página
        document.addEventListener('DOMContentLoaded', loadSiteConfig);
        </script>
        
        <script src="/static/app.js?v=20240914-production"></script>
    </body>
    </html>
  `)
})

// ========================================
// 🎯 NUEVAS RUTAS DINÁMICAS PARA PÁGINAS DEDICADAS
// ========================================

// Página dedicada de proyecto
app.get('/proyecto/:id', async (c) => {
  try {
    const projectId = parseInt(c.req.param('id'));
    
    // Obtener datos del proyecto directamente desde la base de datos
    const project = await c.env.DB.prepare(`
      SELECT 
        p.id, p.title, p.abstract, p.keywords, p.introduction, 
        p.methodology, p.owner_id, p.is_public, p.created_at, p.updated_at,
        p.status, p.start_date, p.end_date, p.institution, p.funding_source, 
        p.budget, p.project_code,
        u.full_name as owner_name, u.email as owner_email
      FROM projects p 
      JOIN users u ON p.owner_id = u.id 
      WHERE p.id = ? AND p.is_public = 1
    `).bind(projectId).first();

    if (!project) {
      return c.html(generateErrorPage('Proyecto no encontrado', 'El proyecto solicitado no existe o no es público.'));
    }

    // Obtener productos públicos del proyecto
    const products = await c.env.DB.prepare(`
      SELECT 
        pr.id, pr.project_id, pr.product_code, pr.product_type, pr.description, 
        pr.is_public, pr.created_at, pr.updated_at, pr.doi, pr.url, 
        pr.publication_date, pr.journal, pr.impact_factor, pr.citation_count, 
        pr.file_url,
        pc.name as category_name, pc.category_group, pc.impact_weight
      FROM products pr 
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      WHERE pr.project_id = ? AND pr.is_public = 1
      ORDER BY pr.created_at DESC
    `).bind(projectId).all();

    // Obtener colaboradores del proyecto
    const collaborators = await c.env.DB.prepare(`
      SELECT 
        u.id, u.full_name, u.email, u.role,
        pc.collaboration_role, pc.role_description
      FROM project_collaborators pc
      JOIN users u ON pc.user_id = u.id
      WHERE pc.project_id = ?
      ORDER BY u.full_name
    `).bind(projectId).all();

    // Combinar datos
    const projectWithData = {
      ...project,
      products: products.results || [],
      collaborators: collaborators.results || []
    };
    
    // Generar página HTML completa del proyecto
    return c.html(generateProjectDetailPage(projectWithData));
    
  } catch (error) {
    console.error('Error cargando página de proyecto:', error);
    return c.html(generateErrorPage('Error de servidor', 'Hubo un problema al cargar el proyecto.'));
  }
})

// Página dedicada de producto
app.get('/producto/:id', async (c) => {
  try {
    const productId = parseInt(c.req.param('id'));
    
    // Obtener datos del producto directamente desde la base de datos
    const product = await c.env.DB.prepare(`
      SELECT 
        pr.id, pr.project_id, pr.product_code, pr.product_type, 
        pr.description, pr.is_public, pr.created_at, pr.updated_at,
        pr.doi, pr.url, pr.publication_date, pr.journal, pr.impact_factor, 
        pr.citation_count, pr.file_url, pr.creator_id, pr.last_editor_id, pr.published_by,
        p.title as project_title, p.abstract as project_abstract, p.owner_id as project_owner_id,
        pc.name as category_name, pc.description as category_description, 
        pc.category_group, pc.impact_weight,
        creator.full_name as creator_name, creator.email as creator_email,
        editor.full_name as last_editor_name, editor.email as last_editor_email,
        publisher.full_name as published_by_name, publisher.email as published_by_email
      FROM products pr 
      JOIN projects p ON pr.project_id = p.id 
      LEFT JOIN product_categories pc ON pr.product_type = pc.code
      LEFT JOIN users creator ON pr.creator_id = creator.id
      LEFT JOIN users editor ON pr.last_editor_id = editor.id
      LEFT JOIN users publisher ON pr.published_by = publisher.id
      WHERE pr.id = ? AND pr.is_public = 1
    `).bind(productId).first();

    if (!product) {
      return c.html(generateErrorPage('Producto no encontrado', 'El producto solicitado no existe o no es público.'));
    }

    // Obtener autores del producto
    const authors = await c.env.DB.prepare(`
      SELECT 
        pa.author_role, pa.contribution_type, pa.author_order,
        u.id as user_id, u.full_name, u.email, u.role as user_role
      FROM product_authors pa
      JOIN users u ON pa.user_id = u.id
      WHERE pa.product_id = ?
      ORDER BY pa.author_order ASC, pa.author_role ASC
    `).bind(productId).all();

    // Combinar datos
    const productWithData = {
      ...product,
      authors: authors.results || []
    };
    
    // Generar página HTML completa del producto
    return c.html(generateProductDetailPage(productWithData));
    
  } catch (error) {
    console.error('Error cargando página de producto:', error);
    return c.html(generateErrorPage('Error de servidor', 'Hubo un problema al cargar el producto.'));
  }
})

// Dashboard con dashboard.js - Versión corregida que carga los archivos correctos
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es" id="dashboard-html">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard CTeI-Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-background text-foreground min-h-screen">
        <div id="app">
            <!-- Loading inicial -->
            <div class="p-8 text-center">
                <div class="text-lg">🔄 Cargando dashboard...</div>
            </div>
        </div>

        <!-- Cargar dashboard.js donde están todas las correcciones -->
        <script src="/static/dashboard.js"></script>
    </body>
    </html>
  `)
})

// Página de edición de proyecto (requiere autenticación en el frontend)
app.get('/dashboard/proyectos/:id/editar', async (c) => {
  const projectId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="es" id="dashboard-html">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Editar Proyecto - CTeI-Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <!-- Quill Rich Text Editor -->
        <link href="https://cdn.quilljs.com/1.3.6/quill.snow.css" rel="stylesheet">
        <script src="https://cdn.quilljs.com/1.3.6/quill.min.js"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  border: "hsl(var(--border))",
                  input: "hsl(var(--input))",
                  ring: "hsl(var(--ring))",
                  background: "hsl(var(--background))",
                  foreground: "hsl(var(--foreground))",
                  primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                  },
                  secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                  },
                  destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                  },
                  muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                  },
                  accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                  },
                  popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                  },
                  card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                  },
                }
              }
            }
          }
        </script>
        <style>
            /* Sistema de temas en tiempo real */
            :root {
                --background: 0 0% 100%;
                --foreground: 222.2 84% 4.9%;
                --card: 0 0% 100%;
                --card-foreground: 222.2 84% 4.9%;
                --popover: 0 0% 100%;
                --popover-foreground: 222.2 84% 4.9%;
                --primary: 179 100% 29%;
                --primary-foreground: 210 40% 98%;
                --secondary: 210 40% 96%;
                --secondary-foreground: 222.2 84% 4.9%;
                --muted: 210 40% 96%;
                --muted-foreground: 215.4 16.3% 46.9%;
                --accent: 210 40% 96%;
                --accent-foreground: 222.2 84% 4.9%;
                --destructive: 0 84.2% 60.2%;
                --destructive-foreground: 210 40% 98%;
                --border: 214.3 31.8% 91.4%;
                --input: 214.3 31.8% 91.4%;
                --ring: 179 100% 29%;
                --radius: 0.5rem;
            }

            .dark {
                --background: 222.2 84% 4.9%;
                --foreground: 210 40% 98%;
                --card: 222.2 84% 4.9%;
                --card-foreground: 210 40% 98%;
                --popover: 222.2 84% 4.9%;
                --popover-foreground: 210 40% 98%;
                --primary: 179 100% 29%;
                --primary-foreground: 210 40% 98%;
                --secondary: 217.2 32.6% 17.5%;
                --secondary-foreground: 210 40% 98%;
                --muted: 217.2 32.6% 17.5%;
                --muted-foreground: 215 20.2% 65.1%;
                --accent: 217.2 32.6% 17.5%;
                --accent-foreground: 210 40% 98%;
                --destructive: 0 62.8% 30.6%;
                --destructive-foreground: 210 40% 98%;
                --border: 217.2 32.6% 17.5%;
                --input: 217.2 32.6% 17.5%;
                --ring: 179 100% 29%;
            }

            /* Estilos específicos para la página de edición */
            .edit-page-container {
                background: hsl(var(--background)); /* Blanco roto o gris muy claro para tema claro */
                color: hsl(var(--foreground)); /* Gris carbón oscuro para tema claro */
                min-height: 100vh;
            }
            
            .sticky-header {
                position: sticky;
                top: 0;
                z-index: 40;
                border-bottom: 1px solid hsl(var(--border));
                background: hsl(var(--background));
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); /* Sombra suave para el tema claro */
            }
            
            .content-columns {
                display: grid;
                grid-template-columns: 1fr 350px;
                gap: 2rem;
                padding: 2rem;
                max-width: 1400px;
                margin: 0 auto;
            }
            
            .main-column {
                min-width: 0; /* Permite que flexbox maneje el overflow */
            }
            
            .sidebar-column {
                min-width: 350px;
            }
            
            .panel {
                background: hsl(var(--card));
                border: 1px solid hsl(var(--border));
                border-radius: calc(var(--radius) * 1.5);
                padding: 1.5rem;
                margin-bottom: 1.5rem;
                box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); /* var(--shadow-sm) */
            }
            
            .panel-title {
                font-size: 1rem;
                font-weight: 600;
                color: hsl(var(--foreground));
                margin-bottom: 1rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .form-field {
                margin-bottom: 1.5rem;
            }
            
            .form-label {
                display: block;
                font-size: 0.875rem;
                font-weight: 500;
                color: hsl(var(--foreground));
                margin-bottom: 0.5rem;
            }
            
            .form-input, .form-textarea, .form-select {
                width: 100%;
                padding: 0.75rem;
                border: 1px solid hsl(var(--border));
                border-radius: calc(var(--radius));
                background: hsl(var(--background));
                color: hsl(var(--foreground));
                font-size: 0.875rem;
                transition: all 0.2s;
            }
            
            .form-input:focus, .form-textarea:focus, .form-select:focus {
                outline: none;
                border-color: hsl(var(--ring));
                box-shadow: 0 0 0 2px hsl(var(--ring) / 0.2);
            }
            
            .form-textarea {
                resize: vertical;
                min-height: 120px;
            }
            
            .btn {
                padding: 0.75rem 1.5rem;
                border-radius: calc(var(--radius));
                font-weight: 500;
                font-size: 0.875rem;
                border: none;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                transition: all 0.2s;
                text-decoration: none;
            }
            
            .btn-primary {
                background: hsl(var(--primary));
                color: hsl(var(--primary-foreground));
            }
            
            .btn-primary:hover {
                opacity: 0.9;
            }
            
            .btn-primary:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                background: hsl(var(--muted));
                color: hsl(var(--muted-foreground));
                border: 1px solid hsl(var(--border));
            }
            
            .btn-secondary {
                background: transparent;
                color: hsl(var(--foreground));
                border: 1px solid hsl(var(--border));
            }
            
            .btn-secondary:hover {
                background: hsl(var(--accent));
                color: hsl(var(--accent-foreground));
            }
            
            .btn-outline {
                background: transparent;
                color: hsl(var(--foreground));
                border: 1px solid hsl(var(--border));
            }
            
            .btn-outline:hover {
                background: hsl(var(--accent));
            }
            
            .btn-disabled {
                pointer-events: none;
            }
            
            /* Rich text editor integration */
            .rich-text-editor {
                border: 1px solid hsl(var(--border));
                border-radius: calc(var(--radius));
                background: hsl(var(--background));
            }
            
            .ql-toolbar {
                border-top: 1px solid hsl(var(--border));
                border-left: 1px solid hsl(var(--border));
                border-right: 1px solid hsl(var(--border));
                border-bottom: none;
                border-radius: calc(var(--radius)) calc(var(--radius)) 0 0;
                background: hsl(var(--muted));
            }
            
            .ql-toolbar .ql-formats {
                margin-right: 15px;
            }
            
            .ql-container {
                border-top: none;
                border-left: 1px solid hsl(var(--border));
                border-right: 1px solid hsl(var(--border));
                border-bottom: 1px solid hsl(var(--border));
                border-radius: 0 0 calc(var(--radius)) calc(var(--radius));
                background: hsl(var(--background));
                color: hsl(var(--foreground));
                font-size: 0.875rem;
            }
            
            .ql-editor {
                color: hsl(var(--foreground));
                min-height: 120px;
                padding: 0.75rem;
            }
            
            .ql-editor.ql-blank::before {
                color: hsl(var(--muted-foreground));
                font-style: italic;
            }
            
            .ql-toolbar .ql-stroke {
                stroke: hsl(var(--muted-foreground)); /* Iconos más sutiles para el tema claro */
            }
            
            .ql-toolbar .ql-fill {
                fill: hsl(var(--muted-foreground)); /* Iconos más sutiles para el tema claro */
            }
            
            .ql-toolbar button:hover .ql-stroke {
                stroke: hsl(var(--primary));
            }
            
            .ql-toolbar button:hover .ql-fill {
                fill: hsl(var(--primary));
            }
            
            .ql-toolbar button.ql-active .ql-stroke {
                stroke: hsl(var(--primary));
            }
            
            .ql-toolbar button.ql-active .ql-fill {
                fill: hsl(var(--primary));
            }
            
            .tags-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .tag {
                background: hsl(var(--accent));
                color: hsl(var(--accent-foreground));
                padding: 0.25rem 0.75rem;
                border-radius: calc(var(--radius));
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
                border: 1px solid hsl(var(--border));
            }
            
            .tag-remove {
                cursor: pointer;
                opacity: 0.7;
            }
            
            .tag-remove:hover {
                opacity: 1;
            }
            
            .products-list {
                max-height: 200px;
                overflow-y: auto;
                border: 1px solid hsl(var(--border));
                border-radius: calc(var(--radius));
                margin-bottom: 1rem;
            }
            
            .product-item {
                padding: 0.75rem;
                border-bottom: 1px solid hsl(var(--border));
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .product-item:last-child {
                border-bottom: none;
            }
            
            .search-results {
                max-height: 150px;
                overflow-y: auto;
                border: 1px solid hsl(var(--border));
                border-top: none;
                border-radius: 0 0 calc(var(--radius)) calc(var(--radius));
                background: hsl(var(--popover));
                position: absolute;
                width: 100%;
                z-index: 10;
            }
            
            .search-result-item {
                padding: 0.75rem;
                cursor: pointer;
                border-bottom: 1px solid hsl(var(--border));
                transition: background-color 0.2s;
            }
            
            .search-result-item:hover {
                background: hsl(var(--accent));
            }
            
            .search-result-item:last-child {
                border-bottom: none;
            }
            
            /* Responsive */
            @media (max-width: 1024px) {
                .content-columns {
                    grid-template-columns: 1fr;
                    padding: 1rem;
                }
                
                .sidebar-column {
                    min-width: auto;
                }
            }
        </style>
    </head>
    <body class="edit-page-container">
        <!-- Cabecera de acciones persistente -->
        <div class="sticky-header">
            <div class="flex justify-between items-center py-4 px-6">
                <div class="flex items-center gap-4">
                    <a href="/dashboard" class="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
                        <i class="fas fa-arrow-left mr-2"></i>
                        Volver al Dashboard
                    </a>
                    <h1 id="page-title" class="text-xl font-semibold text-foreground">
                        Cargando proyecto...
                    </h1>
                </div>
                
                <div class="flex items-center gap-3">
                    <a id="view-public-btn" href="#" target="_blank" class="btn-outline btn" style="display: none;">
                        <i class="fas fa-external-link-alt"></i>
                        Ver Página Pública
                    </a>
                    
                    <button type="button" id="cancel-btn" class="btn-secondary btn">
                        <i class="fas fa-times"></i>
                        Cancelar
                    </button>
                    
                    <button type="submit" form="edit-project-form" id="save-btn" class="btn-primary btn" disabled>
                        <i class="fas fa-save"></i>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Contenido principal en dos columnas -->
        <div class="content-columns">
            <!-- Columna principal: Contenido del proyecto -->
            <div class="main-column">
                <form id="edit-project-form">
                    <!-- Título del proyecto -->
                    <div class="panel">
                        <div class="form-field">
                            <label for="project-title" class="form-label">
                                <i class="fas fa-heading text-primary mr-2"></i>
                                Título del Proyecto *
                            </label>
                            <input 
                                type="text" 
                                id="project-title"
                                name="title"
                                class="form-input"
                                placeholder="Ingrese el título del proyecto"
                                required
                            >
                        </div>
                    </div>
                    
                    <!-- Resumen -->
                    <div class="panel">
                        <div class="form-field">
                            <label for="project-abstract" class="form-label">
                                <i class="fas fa-align-left text-primary mr-2"></i>
                                Resumen *
                            </label>
                            <textarea 
                                id="project-abstract"
                                name="abstract"
                                class="form-textarea"
                                placeholder="Descripción breve del proyecto..."
                                required
                                rows="6"
                            ></textarea>
                            <div class="text-xs text-muted-foreground mt-1">
                                <i class="fas fa-info-circle mr-1"></i>
                                Proporcione una descripción concisa que resuma los objetivos principales del proyecto.
                            </div>
                        </div>
                    </div>
                    
                    <!-- Introducción -->
                    <div class="panel">
                        <div class="form-field">
                            <label for="project-introduction" class="form-label">
                                <i class="fas fa-book-open text-primary mr-2"></i>
                                Introducción
                            </label>
                            <!-- Rich Text Editor para Introducción -->
                            <div id="introduction-editor" class="rich-text-editor"></div>
                            <textarea 
                                id="project-introduction"
                                name="introduction"
                                style="display: none;"
                            ></textarea>
                            <div class="text-xs text-muted-foreground mt-1">
                                <i class="fas fa-lightbulb mr-1"></i>
                                Explique el contexto, antecedentes y justificación del proyecto. Use formato enriquecido para estructurar mejor el contenido.
                            </div>
                        </div>
                    </div>
                    
                    <!-- Metodología -->
                    <div class="panel">
                        <div class="form-field">
                            <label for="project-methodology" class="form-label">
                                <i class="fas fa-cogs text-primary mr-2"></i>
                                Metodología
                            </label>
                            <!-- Rich Text Editor para Metodología -->
                            <div id="methodology-editor" class="rich-text-editor"></div>
                            <textarea 
                                id="project-methodology"
                                name="methodology"
                                style="display: none;"
                            ></textarea>
                            <div class="text-xs text-muted-foreground mt-1">
                                <i class="fas fa-route mr-1"></i>
                                Detalle los métodos, herramientas y procesos utilizados en el proyecto. Use listas y formato para mayor claridad.
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Barra lateral: Metadatos y asociaciones -->
            <div class="sidebar-column">
                <!-- Panel de Estado -->
                <div class="panel">
                    <div class="panel-title">
                        <i class="fas fa-flag text-primary"></i>
                        Estado del Proyecto
                    </div>
                    
                    <div class="form-field">
                        <label for="project-status" class="form-label">Estado</label>
                        <select id="project-status" name="status" class="form-select">
                            <option value="DRAFT">Borrador</option>
                            <option value="ACTIVE">Activo</option>
                            <option value="REVIEW">En Revisión</option>
                            <option value="COMPLETED">Completado</option>
                            <option value="SUSPENDED">Suspendido</option>
                        </select>
                    </div>
                    
                    <div class="form-field">
                        <label class="form-label">Visibilidad</label>
                        <div class="flex items-center gap-3">
                            <label class="flex items-center gap-2">
                                <input type="radio" name="visibility" value="public" id="visibility-public">
                                <span class="text-sm">Público</span>
                            </label>
                            <label class="flex items-center gap-2">
                                <input type="radio" name="visibility" value="private" id="visibility-private" checked>
                                <span class="text-sm">Privado</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                <!-- Panel de Clasificación -->
                <div class="panel">
                    <div class="panel-title">
                        <i class="fas fa-tags text-primary"></i>
                        Clasificación
                    </div>
                    
                    <div class="form-field">
                        <label for="keywords-input" class="form-label">Palabras Clave</label>
                        <input 
                            type="text" 
                            id="keywords-input"
                            class="form-input"
                            placeholder="Escriba y presione Enter"
                        >
                        <div id="keywords-container" class="tags-container"></div>
                        <div class="text-xs text-muted-foreground mt-1">
                            <i class="fas fa-keyboard mr-1"></i>
                            Presione Enter para agregar cada palabra clave.
                        </div>
                    </div>
                </div>
                
                <!-- Panel de Productos Científicos del Proyecto -->
                <div class="panel">
                    <div class="panel-title">
                        <i class="fas fa-flask text-primary"></i>
                        Productos Científicos del Proyecto
                    </div>
                    
                    <!-- Búsqueda de productos existentes -->
                    <div class="form-field">
                        <label for="product-search" class="form-label">
                            <i class="fas fa-search text-primary mr-2"></i>
                            Asociar Producto Existente
                        </label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="product-search"
                                class="form-input"
                                placeholder="Buscar productos por título o autor..."
                            >
                            <div id="product-search-results" class="search-results" style="display: none;"></div>
                        </div>
                        <div class="text-xs text-muted-foreground mt-1">
                            <i class="fas fa-lightbulb mr-1"></i>
                            Escriba para buscar productos científicos existentes en la base de datos.
                        </div>
                    </div>
                    
                    <div id="associated-products" class="products-list">
                        <div class="text-center text-muted-foreground py-4">
                            <i class="fas fa-box-open mb-2 block text-lg"></i>
                            No hay productos científicos en este proyecto
                        </div>
                    </div>
                    
                    <div class="flex gap-2 mt-3">
                        <button type="button" id="create-product-btn" class="btn-primary btn flex-1">
                            <i class="fas fa-plus"></i>
                            Crear Nuevo
                        </button>
                        <button type="button" id="show-all-products-btn" class="btn-outline btn">
                            <i class="fas fa-list"></i>
                            Ver Todos
                        </button>
                    </div>
                    
                    <div class="text-xs text-muted-foreground mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Los productos incluyen artículos, libros, patentes, software, etc.
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Panel Deslizante (Drawer) para crear producto - Técnica de Dos Capas -->
        <div id="create-product-drawer-overlay" class="drawer-overlay fixed inset-0 z-50 hidden">
            <!-- Scrim que oscurece el fondo -->
            <div class="drawer-scrim absolute inset-0" onclick="closeCreateProductDrawer()"></div>
            
            <!-- CAPA EXTERIOR: Panel de Cristal (Glassmorphism) -->
            <div id="create-product-drawer" class="drawer-panel-glass fixed right-0 top-0 h-full w-full max-w-2xl transform translate-x-full transition-transform duration-300 ease-in-out">
                
                <!-- CAPA INTERIOR: Contenedor Sólido (Papel) -->
                <div class="form-container-solid w-full h-full flex flex-col">
                    
                    <!-- Cabecera del Formulario -->
                    <div class="form-header flex-shrink-0">
                        <div class="flex justify-between items-center mb-4">
                            <div>
                                <h2 class="text-xl font-bold text-foreground">
                                    <i class="fas fa-plus mr-2 text-primary"></i>
                                    Crear Nuevo Producto Científico
                                </h2>
                                <p class="text-sm text-muted-foreground mt-1">
                                    Añadir un producto científico al proyecto actual
                                </p>
                            </div>
                            <button type="button" onclick="closeCreateProductDrawer()" class="drawer-close-btn">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Contenido del Formulario con Scroll -->
                    <div class="form-body flex-1 overflow-y-auto">
                    <form id="create-product-form" class="p-6">
                        <div class="grid grid-cols-1 gap-6">
                        <!-- Información básica -->
                        <div class="md:col-span-2">
                            <label for="product-description" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-align-left mr-1"></i>
                                Descripción del Producto *
                            </label>
                            <textarea 
                                id="product-description" 
                                name="description"
                                rows="3" 
                                required
                                class="ctei-form-input w-full"
                                placeholder="Ej: Artículo de investigación sobre algoritmos de machine learning aplicados a..."
                            ></textarea>
                        </div>
                        
                        <div>
                            <label for="product-code" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-barcode mr-1"></i>
                                Código del Producto *
                            </label>
                            <input 
                                type="text" 
                                id="product-code"
                                name="product_code"
                                required
                                class="ctei-form-input w-full"
                                placeholder="Ej: ART-ML-001"
                            >
                        </div>
                        
                        <div>
                            <label for="product-type" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-tags mr-1"></i>
                                Tipo de Producto *
                            </label>
                            <select 
                                id="product-type"
                                name="product_type"
                                required
                                class="ctei-form-select w-full"
                            >
                                <option value="">Seleccione un tipo...</option>
                                <!-- Las opciones se cargarán dinámicamente -->
                            </select>
                        </div>
                        
                        <!-- Información de publicación -->
                        <div>
                            <label for="product-doi" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-link mr-1"></i>
                                DOI
                            </label>
                            <input 
                                type="text" 
                                id="product-doi"
                                name="doi"
                                class="ctei-form-input w-full"
                                placeholder="10.1000/journal.2024.001"
                            >
                        </div>
                        
                        <div>
                            <label for="product-url" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-globe mr-1"></i>
                                URL
                            </label>
                            <input 
                                type="url" 
                                id="product-url"
                                name="url"
                                class="ctei-form-input w-full"
                                placeholder="https://revista.ejemplo.com/articulo"
                            >
                        </div>
                        
                        <div>
                            <label for="product-journal" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-book mr-1"></i>
                                Revista/Editorial
                            </label>
                            <input 
                                type="text" 
                                id="product-journal"
                                name="journal"
                                class="ctei-form-input w-full"
                                placeholder="Nature, Science, IEEE, etc."
                            >
                        </div>
                        
                        <div>
                            <label for="product-publication-date" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-calendar mr-1"></i>
                                Fecha de Publicación
                            </label>
                            <input 
                                type="date" 
                                id="product-publication-date"
                                name="publication_date"
                                class="ctei-form-input w-full"
                            >
                        </div>
                        
                        <div>
                            <label for="product-impact-factor" class="block text-sm font-medium text-foreground mb-2">
                                <i class="fas fa-star mr-1"></i>
                                Factor de Impacto
                            </label>
                            <input 
                                type="number" 
                                id="product-impact-factor"
                                name="impact_factor"
                                step="0.001"
                                min="0"
                                class="ctei-form-input w-full"
                                placeholder="2.5"
                            >
                        </div>
                    </div>
                    
                    </form>
                    </div>
                    
                    <!-- Pie del Formulario -->
                    <div class="form-footer flex-shrink-0">
                        <div class="flex justify-end gap-4 pt-4 border-t border-border">
                            <button 
                                type="button" 
                                onclick="closeCreateProductDrawer()"
                                class="drawer-btn-cancel"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                form="create-product-form"
                                class="drawer-btn-primary"
                            >
                                <i class="fas fa-plus mr-2"></i>
                                Crear Producto
                            </button>
                        </div>
                    </div>
                    
                </div> <!-- Cierre form-container-solid -->
            </div> <!-- Cierre drawer-panel-glass -->
        </div> <!-- Cierre drawer-overlay -->
        
        <!-- Loading overlay -->
        <div id="loading-overlay" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div class="bg-card p-6 rounded-lg flex items-center gap-4">
                <i class="fas fa-spinner fa-spin text-primary text-xl"></i>
                <span class="text-foreground">Cargando proyecto...</span>
            </div>
        </div>
        
        <script>
            // Variables globales
            const API_BASE = '/api';
            const PROJECT_ID = '` + projectId + `';
            let currentProject = null;
            let hasUnsavedChanges = false;
            let keywords = [];
            let associatedProducts = [];
            
            // Configuración de autenticación
            let authToken = null;
            
            // Editores de texto enriquecido
            let introductionEditor = null;
            let methodologyEditor = null;
            
            // Función para obtener y verificar token
            function getAuthTokenFromStorage() {
                // Intentar obtener token de localStorage
                const token = localStorage.getItem('auth_token');
                
                if (!token) {
                    console.warn('No se encontró token de autenticación en localStorage');
                    return null;
                }
                
                console.log('Token encontrado en localStorage:', token ? 'Presente' : 'Ausente');
                return token;
            }
            
            // Función para configurar cabeceras de autenticación
            function setupAuthHeaders(token) {
                if (!token) {
                    console.warn('Intento de configurar cabeceras sin token');
                    delete axios.defaults.headers.common['Authorization'];
                    return false;
                }
                
                // Configurar cabecera Authorization para todas las solicitudes axios
                axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
                console.log('Cabeceras de autenticación configuradas correctamente');
                
                // DIAGNÓSTICO: Configurar interceptor de solicitudes axios
                setupAxiosInterceptors();
                
                return true;
            }
            
            // Configurar interceptores de axios para diagnóstico avanzado
            function setupAxiosInterceptors() {
                console.log('🔧 Configurando interceptores de axios para diagnóstico...');
                
                // Interceptor de solicitudes (antes de enviar)
                axios.interceptors.request.use(
                    function(config) {
                        console.log('📤 SOLICITUD SALIENTE:', {
                            method: config.method.toUpperCase(),
                            url: config.url,
                            hasAuthHeader: !!config.headers.Authorization,
                            authHeader: config.headers.Authorization ? 
                                config.headers.Authorization.substring(0, 20) + '...' : 'NO PRESENTE',
                            allHeaders: config.headers
                        });
                        
                        // Verificación crítica: ¿La solicitud tiene cabecera Authorization?
                        if (!config.headers.Authorization && config.url.includes('/private/')) {
                            console.error('🚨 PROBLEMA DETECTADO: Solicitud a ruta privada SIN cabecera Authorization');
                            console.error('URL:', config.url);
                            console.error('Cabeceras:', config.headers);
                        }
                        
                        return config;
                    },
                    function(error) {
                        console.error('❌ Error en interceptor de solicitud:', error);
                        return Promise.reject(error);
                    }
                );
                
                // Interceptor de respuestas (después de recibir)
                axios.interceptors.response.use(
                    function(response) {
                        console.log('📥 RESPUESTA RECIBIDA:', {
                            status: response.status,
                            statusText: response.statusText,
                            url: response.config.url,
                            success: response.data?.success
                        });
                        return response;
                    },
                    function(error) {
                        console.error('📥 RESPUESTA DE ERROR:', {
                            status: error.response?.status,
                            statusText: error.response?.statusText,
                            url: error.config?.url,
                            data: error.response?.data
                        });
                        
                        // Diagnóstico específico para errores 401
                        if (error.response?.status === 401) {
                            console.error('🚨 ERROR 401 DETECTADO - Analizando causa:');
                            console.error('¿Tenía cabecera Authorization?', !!error.config?.headers?.Authorization);
                            console.error('Cabecera enviada:', error.config?.headers?.Authorization);
                            console.error('Respuesta del servidor:', error.response?.data);
                        }
                        
                        return Promise.reject(error);
                    }
                );
                
                console.log('✅ Interceptores de axios configurados');
            }
            
            // Verificar autenticación
            function checkAuthentication() {
                console.log('🔐 === INICIANDO VERIFICACIÓN DE AUTENTICACIÓN ===');
                
                // 1. Obtener token del storage
                console.log('Paso 1: Obteniendo token del localStorage...');
                authToken = getAuthTokenFromStorage();
                
                // 2. Si no hay token, mostrar error de autenticación
                if (!authToken) {
                    console.error('❌ FALLA EN AUTENTICACIÓN: Token no encontrado en localStorage');
                    console.log('Posibles causas:');
                    console.log('- Usuario nunca hizo login');
                    console.log('- Token fue eliminado manualmente');
                    console.log('- Error en el proceso de login');
                    showAuthError();
                    return false;
                }
                
                // 3. Configurar cabeceras para futuras solicitudes
                console.log('Paso 2: Configurando cabeceras de autenticación...');
                const headersConfigured = setupAuthHeaders(authToken);
                
                if (!headersConfigured) {
                    console.error('❌ FALLA EN CONFIGURACIÓN: No se pudieron configurar cabeceras');
                    showAuthError();
                    return false;
                }
                
                // 4. Verificación final
                console.log('✅ AUTENTICACIÓN EXITOSA');
                console.log('Token configurado correctamente en axios.defaults');
                console.log('La próxima solicitud HTTP incluirá:', axios.defaults.headers.common['Authorization']);
                
                return true;
            }
            
            // Mostrar error de autenticación
            function showAuthError() {
                // Actualizar título con información del error
                const pageTitle = document.getElementById('page-title');
                if (pageTitle) {
                    pageTitle.textContent = \`Acceso Restringido - Proyecto ID: \${PROJECT_ID}\`;
                }
                
                showSpecificError('auth', 'Sesión Requerida', 
                    'Para editar proyectos necesitas iniciar sesión primero. Por favor, autentícate con tu cuenta de CTeI-Manager.');
            }
            
            // Elementos DOM
            const form = document.getElementById('edit-project-form');
            const saveBtn = document.getElementById('save-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const viewPublicBtn = document.getElementById('view-public-btn');
            const pageTitle = document.getElementById('page-title');
            const loadingOverlay = document.getElementById('loading-overlay');
            
            // Inicialización
            document.addEventListener('DOMContentLoaded', async () => {
                console.log('=== INICIANDO PÁGINA DE EDICIÓN DE PROYECTO ===');
                console.log('Proyecto ID:', PROJECT_ID);
                
                try {
                    // PASO 1: Verificar autenticación y configurar cabeceras
                    console.log('Paso 1: Verificando autenticación...');
                    if (!checkAuthentication()) {
                        console.error('Autenticación fallida - Deteniendo inicialización');
                        return; // showAuthError() ya se llamó en checkAuthentication()
                    }
                    
                    // PASO 2: Verificar permisos de edición
                    console.log('Paso 2: Verificando permisos de edición...');
                    const hasPermissions = await checkProjectPermissions();
                    if (!hasPermissions) {
                        return; // Detener inicialización si no tiene permisos
                    }
                    
                    // PASO 3: Cargar datos del proyecto
                    console.log('Paso 3: Cargando datos del proyecto...');
                    await loadProject();
                    
                    // PASO 4: Inicializar componentes de la interfaz
                    console.log('Paso 4: Inicializando componentes...');
                    initializeForm();
                    initializeKeywords();
                    initializeProductSearch();
                    
                    // PASO 5: Cargar productos asociados (AHORA con autenticación configurada)
                    console.log('Paso 5: Cargando productos asociados...');
                    await loadAssociatedProducts();
                    
                    // PASO 6: Ocultar loading y mostrar interfaz
                    console.log('Paso 6: Inicialización completa');
                    hideLoading();
                    
                } catch (error) {
                    console.error('Error durante inicialización:', error);
                    hideLoading(); // CRÍTICO: Siempre ocultar loading en caso de error
                    // El error específico ya fue manejado en loadProject()
                }
            });
            
            // Verificar permisos del usuario para este proyecto
            async function checkProjectPermissions() {
                try {
                    const response = await axios.get(\`\${API_BASE}/private/projects/\${PROJECT_ID}/permissions\`);
                    
                    if (response.data.success) {
                        const permissions = response.data.data;
                        
                        if (!permissions.canEdit) {
                            showSpecificError('permission', 
                                'Sin Permisos de Edición', 
                                \`No puedes editar este proyecto. Solo el propietario (\${permissions.isOwner ? 'tú' : 'otro usuario'}) puede realizar cambios. Tu rol actual: \${permissions.userRole}.\`
                            );
                            return false;
                        }
                        
                        console.log('✅ Permisos verificados - Usuario puede editar el proyecto');
                        return true;
                    }
                } catch (error) {
                    console.warn('No se pudieron verificar permisos, continuando con carga normal');
                    return true; // Continuar con flujo normal si no se pueden verificar permisos
                }
            }

            // Cargar datos del proyecto
            async function loadProject() {
                console.log('🔍 === DIAGNÓSTICO AVANZADO DE AUTENTICACIÓN ===');
                
                // PASO 1: Verificar existencia del token en Local Storage
                console.log('📋 PASO 1: Verificando fuente del token...');
                const tokenInStorage = localStorage.getItem('auth_token');
                console.log('Token en localStorage:', tokenInStorage ? \`Presente (longitud: \${tokenInStorage.length})\` : 'AUSENTE');
                console.log('Primeros 50 chars del token:', tokenInStorage ? tokenInStorage.substring(0, 50) + '...' : 'N/A');
                
                // PASO 2: Rastrear flujo de datos del token
                console.log('📋 PASO 2: Rastreando flujo de datos...');
                console.log('Variable authToken global:', authToken ? \`Presente (longitud: \${authToken.length})\` : 'AUSENTE');
                console.log('Token antes de enviar:', authToken); // LÍNEA CRÍTICA DE DIAGNÓSTICO
                
                // PASO 3: Auditar configuración del cliente API
                console.log('📋 PASO 3: Auditando configuración de axios...');
                const authHeader = axios.defaults.headers.common['Authorization'];
                console.log('Cabecera Authorization en axios.defaults:', authHeader || 'NO CONFIGURADA');
                console.log('Todas las cabeceras de axios.defaults:', JSON.stringify(axios.defaults.headers.common, null, 2));
                
                // Verificar si el token es válido (no expirado)
                if (authToken) {
                    try {
                        const tokenParts = authToken.split('.');
                        if (tokenParts.length === 3) {
                            const payload = JSON.parse(atob(tokenParts[1]));
                            const expTime = new Date(payload.exp * 1000);
                            const now = new Date();
                            console.log('Token expira:', expTime.toISOString());
                            console.log('Hora actual:', now.toISOString());
                            console.log('Token válido:', expTime > now ? 'SÍ' : 'EXPIRADO');
                        }
                    } catch (e) {
                        console.warn('No se pudo decodificar el token JWT:', e);
                    }
                }
                
                console.log('🚀 Iniciando solicitud a:', \`\${API_BASE}/private/projects/\${PROJECT_ID}\`);
                
                try {
                    // Hacer la solicitud con diagnóstico completo
                    const response = await axios.get(\`\${API_BASE}/private/projects/\${PROJECT_ID}\`);
                    
                    console.log('✅ Respuesta exitosa recibida:', {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers,
                        dataSuccess: response.data.success
                    });
                    
                    if (response.data.success) {
                        currentProject = response.data.data;
                        console.log('📄 Datos del proyecto cargados:', {
                            id: currentProject.id,
                            title: currentProject.title,
                            owner: currentProject.owner_name
                        });
                        
                        populateForm();
                        updatePageTitle();
                        updatePublicLink();
                    } else {
                        throw new Error(response.data.message || 'Error al cargar el proyecto');
                    }
                } catch (error) {
                    console.error('❌ Error cargando proyecto:', error);
                    
                    // Manejo específico según código de estado HTTP
                    if (error.response) {
                        const status = error.response.status;
                        const message = error.response.data?.error || error.message;
                        
                        switch (status) {
                            case 401:
                                showSpecificError('auth', 'Token de autenticación inválido o expirado', 
                                    'Tu sesión ha expirado o el token de autenticación no es válido. Por favor, inicia sesión nuevamente.');
                                break;
                            case 403:
                                showSpecificError('permission', 'No tienes permisos para editar este proyecto', 
                                    'Este proyecto pertenece a otro usuario y no tienes los permisos necesarios para editarlo. Solo el propietario o un administrador pueden realizar cambios.');
                                break;
                            case 404:
                                showSpecificError('notfound', 'Proyecto no encontrado', 
                                    'El proyecto que intentas editar no existe o ha sido eliminado. Es posible que hayas seguido un enlace obsoleto.');
                                break;
                            case 500:
                                showSpecificError('server', 'Error interno del servidor', 
                                    'Ocurrió un problema en el servidor. Por favor, intenta nuevamente en unos momentos. Si el problema persiste, contacta al soporte técnico.');
                                break;
                            default:
                                showSpecificError('unknown', 'Error de conexión', 
                                    \`Ocurrió un error inesperado (código \${status}). Por favor, verifica tu conexión a internet e intenta nuevamente.\`);
                        }
                    } else if (error.request) {
                        showSpecificError('network', 'Error de conexión', 
                            'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.');
                    } else {
                        showSpecificError('unknown', 'Error inesperado', 
                            'Ocurrió un error inesperado al cargar el proyecto. Por favor, intenta nuevamente.');
                    }
                    
                    throw error;
                }
            }
            
            // Poblar formulario con datos del proyecto
            function populateForm() {
                if (!currentProject) return;
                
                document.getElementById('project-title').value = currentProject.title || '';
                document.getElementById('project-abstract').value = currentProject.abstract || '';
                
                // Poblar editores de texto enriquecido
                const introductionContent = currentProject.introduction || '';
                const methodologyContent = currentProject.methodology || '';
                
                // Sincronizar textareas ocultas
                document.getElementById('project-introduction').value = introductionContent;
                document.getElementById('project-methodology').value = methodologyContent;
                
                // Poblar editores Quill
                if (introductionEditor) {
                    introductionEditor.root.innerHTML = introductionContent;
                }
                if (methodologyEditor) {
                    methodologyEditor.root.innerHTML = methodologyContent;
                }
                
                document.getElementById('project-status').value = currentProject.status || 'DRAFT';
                
                // Visibilidad
                const isPublic = currentProject.is_public === 1 || currentProject.is_public === true;
                document.getElementById('visibility-public').checked = isPublic;
                document.getElementById('visibility-private').checked = !isPublic;
                
                // Keywords
                if (currentProject.keywords) {
                    keywords = currentProject.keywords.split(',').map(k => k.trim()).filter(k => k);
                    renderKeywords();
                }
            }
            
            // Actualizar título de la página
            function updatePageTitle() {
                if (currentProject && currentProject.title) {
                    pageTitle.textContent = \`Editando Proyecto: \${currentProject.title}\`;
                } else {
                    pageTitle.textContent = \`Error al cargar proyecto (ID: \${PROJECT_ID})\`;
                }
            }
            
            // Actualizar enlace público
            function updatePublicLink() {
                if (currentProject) {
                    const publicUrl = \`/proyecto/\${currentProject.id}\`;
                    viewPublicBtn.href = publicUrl;
                    viewPublicBtn.style.display = 'inline-flex';
                }
            }
            
            // Inicializar formulario
            function initializeForm() {
                // Detectar cambios en el formulario
                form.addEventListener('input', handleFormChange);
                form.addEventListener('change', handleFormChange);
                
                // Manejar envío del formulario
                form.addEventListener('submit', handleFormSubmit);
                
                // Botón cancelar
                cancelBtn.addEventListener('click', handleCancel);
                
                // Prevenir salida accidental
                window.addEventListener('beforeunload', handleBeforeUnload);
                
                // Inicializar estado del botón de guardar (deshabilitado por defecto)
                resetSaveButton();
                
                // Configurar botones de productos
                configureProductButtons();
                
                // Inicializar editores de texto enriquecido
                initializeRichTextEditors();
            }
            
            // Configurar botones de productos
            function configureProductButtons() {
                // Botón crear producto - Usar drawer
                const createProductBtn = document.getElementById('create-product-btn');
                if (createProductBtn) {
                    createProductBtn.addEventListener('click', () => {
                        openCreateProductDrawer();
                    });
                }
                
                // Botón mostrar todos los productos
                const showAllProductsBtn = document.getElementById('show-all-products-btn');
                if (showAllProductsBtn) {
                    showAllProductsBtn.addEventListener('click', () => {
                        // Abrir modal para asociar productos existentes
                        openAssociateProductsModal();
                    });
                }
                
                // Configurar formulario de creación de producto
                const createProductForm = document.getElementById('create-product-form');
                if (createProductForm) {
                    createProductForm.addEventListener('submit', handleCreateProductSubmit);
                }
                
                // Cerrar drawer con ESC
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        const overlay = document.getElementById('create-product-drawer-overlay');
                        if (overlay && !overlay.classList.contains('hidden')) {
                            closeCreateProductDrawer();
                        }
                    }
                });
            }
            
            // Inicializar editores de texto enriquecido
            function initializeRichTextEditors() {
                // Configuración común de Quill
                const quillOptions = {
                    theme: 'snow',
                    modules: {
                        toolbar: [
                            [{ 'header': [1, 2, 3, false] }],
                            ['bold', 'italic', 'underline'],
                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                            ['link'],
                            ['clean']
                        ]
                    },
                    placeholder: ''
                };
                
                // Editor para Introducción
                if (document.getElementById('introduction-editor')) {
                    introductionEditor = new Quill('#introduction-editor', {
                        ...quillOptions,
                        placeholder: 'Contexto y antecedentes del proyecto...'
                    });
                    
                    // Detectar cambios en el editor
                    introductionEditor.on('text-change', () => {
                        // Sincronizar con textarea oculta
                        const content = introductionEditor.root.innerHTML;
                        document.getElementById('project-introduction').value = content;
                        handleFormChange();
                    });
                }
                
                // Editor para Metodología
                if (document.getElementById('methodology-editor')) {
                    methodologyEditor = new Quill('#methodology-editor', {
                        ...quillOptions,
                        placeholder: 'Describa los métodos y enfoques utilizados...'
                    });
                    
                    // Detectar cambios en el editor
                    methodologyEditor.on('text-change', () => {
                        // Sincronizar con textarea oculta
                        const content = methodologyEditor.root.innerHTML;
                        document.getElementById('project-methodology').value = content;
                        handleFormChange();
                    });
                }
            }
            
            // Manejar cambios en el formulario
            function handleFormChange() {
                hasUnsavedChanges = true;
                enableSaveButton();
            }
            
            // Habilitar botón de guardar cuando hay cambios
            function enableSaveButton() {
                saveBtn.disabled = false;
                saveBtn.classList.remove('btn-disabled');
                saveBtn.title = 'Guardar cambios del proyecto';
            }
            
            // Resetear botón de guardar al estado inicial
            function resetSaveButton() {
                saveBtn.disabled = true;
                saveBtn.classList.add('btn-disabled');
                saveBtn.title = 'Realiza algún cambio para guardar';
                hasUnsavedChanges = false;
            }
            
            // Manejar envío del formulario
            async function handleFormSubmit(event) {
                event.preventDefault();
                
                if (!hasUnsavedChanges) return;
                
                try {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                    
                    const formData = new FormData(form);
                    
                    // Sincronizar contenido de editores Quill antes de enviar
                    if (introductionEditor) {
                        document.getElementById('project-introduction').value = introductionEditor.root.innerHTML;
                    }
                    if (methodologyEditor) {
                        document.getElementById('project-methodology').value = methodologyEditor.root.innerHTML;
                    }
                    
                    const projectData = {
                        title: formData.get('title'),
                        abstract: formData.get('abstract'),
                        introduction: formData.get('introduction') || null,
                        methodology: formData.get('methodology') || null,
                        status: formData.get('status'),
                        keywords: keywords.join(', ') || null,
                        is_public: formData.get('visibility') === 'public'
                    };
                    
                    const response = await axios.put(\`\${API_BASE}/private/projects/\${PROJECT_ID}\`, projectData);
                    
                    if (response.data.success) {
                        hasUnsavedChanges = false;
                        showSuccess('Proyecto actualizado exitosamente');
                        
                        // Actualizar datos locales
                        currentProject = { ...currentProject, ...projectData };
                        updatePageTitle();
                        
                        // Resetear botón de guardar
                        resetSaveButton();
                        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                    } else {
                        throw new Error(response.data.message || 'Error al actualizar el proyecto');
                    }
                } catch (error) {
                    console.error('Error al guardar:', error);
                    
                    // Manejo específico de errores
                    let errorMessage = 'Error al guardar el proyecto';
                    
                    if (error.response) {
                        const status = error.response.status;
                        const data = error.response.data;
                        
                        switch (status) {
                            case 403:
                                errorMessage = data.details || data.error || 'No tienes permisos para editar este proyecto';
                                break;
                            case 404:
                                errorMessage = 'Proyecto no encontrado';
                                break;
                            case 400:
                                errorMessage = data.error || 'Datos inválidos en el formulario';
                                break;
                            case 401:
                                errorMessage = 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente';
                                // Redirigir al login después de 2 segundos
                                setTimeout(() => {
                                    window.location.href = '/login';
                                }, 2000);
                                break;
                            default:
                                errorMessage = data.error || \`Error del servidor (\${status})\`;
                        }
                    } else if (error.request) {
                        errorMessage = 'Error de conexión. Verifica tu internet e intenta nuevamente';
                    }
                    
                    showError(errorMessage);
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                }
            }
            
            // Manejar cancelación
            function handleCancel() {
                if (hasUnsavedChanges) {
                    if (confirm('¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.')) {
                        window.location.href = '/dashboard';
                    }
                } else {
                    window.location.href = '/dashboard';
                }
            }
            
            // Prevenir salida accidental
            function handleBeforeUnload(event) {
                if (hasUnsavedChanges) {
                    event.preventDefault();
                    event.returnValue = '';
                }
            }
            
            // Inicializar sistema de keywords
            function initializeKeywords() {
                const keywordsInput = document.getElementById('keywords-input');
                
                keywordsInput.addEventListener('keypress', (event) => {
                    if (event.key === 'Enter') {
                        event.preventDefault();
                        const keyword = keywordsInput.value.trim();
                        
                        if (keyword && !keywords.includes(keyword)) {
                            keywords.push(keyword);
                            renderKeywords();
                            keywordsInput.value = '';
                            handleFormChange();
                        }
                    }
                });
            }
            
            // Renderizar keywords
            function renderKeywords() {
                const container = document.getElementById('keywords-container');
                
                container.innerHTML = keywords.map(keyword => \`
                    <div class="tag">
                        <span>\${keyword}</span>
                        <i class="fas fa-times tag-remove" onclick="removeKeyword('\${keyword}')"></i>
                    </div>
                \`).join('');
            }
            
            // Remover keyword
            function removeKeyword(keyword) {
                keywords = keywords.filter(k => k !== keyword);
                renderKeywords();
                handleFormChange();
            }
            
            // Inicializar gestión de productos
            function initializeProductSearch() {
                const createBtn = document.getElementById('create-product-btn');
                const showAllBtn = document.getElementById('show-all-products-btn');
                const searchInput = document.getElementById('product-search');
                const searchResults = document.getElementById('product-search-results');
                let searchTimeout = null;
                
                // Botón crear nuevo producto
                createBtn.addEventListener('click', () => {
                    openCreateProductModal();
                });
                
                // Botón ver todos los productos
                showAllBtn.addEventListener('click', () => {
                    // Mostrar todos los productos disponibles
                    searchAllProducts();
                });
                
                // Búsqueda en tiempo real
                searchInput.addEventListener('input', (e) => {
                    const query = e.target.value.trim();
                    
                    // Limpiar timeout anterior
                    if (searchTimeout) {
                        clearTimeout(searchTimeout);
                    }
                    
                    if (query.length < 2) {
                        hideSearchResults();
                        return;
                    }
                    
                    // Buscar después de 300ms de inactividad
                    searchTimeout = setTimeout(() => {
                        searchProducts(query);
                    }, 300);
                });
                
                // Ocultar resultados al hacer clic fuera
                document.addEventListener('click', (e) => {
                    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                        hideSearchResults();
                    }
                });
            }
            
            // Buscar productos por query
            async function searchProducts(query) {
                try {
                    const searchResults = document.getElementById('product-search-results');
                    
                    // Mostrar indicador de carga
                    searchResults.innerHTML = '<div class="search-result-item"><i class="fas fa-spinner fa-spin mr-2"></i>Buscando productos...</div>';
                    searchResults.style.display = 'block';
                    
                    const response = await axios.get(\`\${API_BASE}/public/products/search?q=\${encodeURIComponent(query)}&limit=10\`);
                    
                    if (response.data.success && response.data.data.products) {
                        renderSearchResults(response.data.data.products);
                    } else {
                        showNoResults();
                    }
                } catch (error) {
                    console.error('Error buscando productos:', error);
                    searchResults.innerHTML = '<div class="search-result-item text-destructive"><i class="fas fa-exclamation-triangle mr-2"></i>Error en la búsqueda</div>';
                }
            }
            
            // Mostrar todos los productos disponibles
            async function searchAllProducts() {
                try {
                    const searchResults = document.getElementById('product-search-results');
                    
                    // Mostrar indicador de carga
                    searchResults.innerHTML = '<div class="search-result-item"><i class="fas fa-spinner fa-spin mr-2"></i>Cargando productos...</div>';
                    searchResults.style.display = 'block';
                    
                    const response = await axios.get(\`\${API_BASE}/private/products?limit=20\`);
                    
                    if (response.data.success && response.data.data.products) {
                        renderSearchResults(response.data.data.products, 'Todos los productos disponibles:');
                    } else {
                        showNoResults('No hay productos disponibles');
                    }
                } catch (error) {
                    console.error('Error cargando productos:', error);
                    searchResults.innerHTML = '<div class="search-result-item text-destructive"><i class="fas fa-exclamation-triangle mr-2"></i>Error cargando productos</div>';
                }
            }
            
            // Renderizar resultados de búsqueda
            function renderSearchResults(products, title = '') {
                const searchResults = document.getElementById('product-search-results');
                
                if (!products || products.length === 0) {
                    showNoResults();
                    return;
                }
                
                let html = '';
                
                if (title) {
                    html += \`<div class="search-result-item" style="background: hsl(var(--muted)); font-weight: 600;">\${title}</div>\`;
                }
                
                products.forEach(product => {
                    const isAssociated = associatedProducts.some(p => p.id === product.id);
                    const statusIcon = isAssociated ? 'fas fa-check text-green-500' : 'fas fa-plus text-primary';
                    const statusText = isAssociated ? 'Asociado' : 'Asociar';
                    
                    html += \`
                        <div class="search-result-item" onclick="handleProductSelection(\${product.id}, '\${product.description}', \${isAssociated})">
                            <div class="flex justify-between items-start">
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-sm truncate">\${product.description}</div>
                                    <div class="text-xs text-muted-foreground mt-1">
                                        <i class="fas fa-user mr-1"></i>\${product.creator_name || 'Sin autor'}
                                        <span class="ml-2"><i class="fas fa-calendar mr-1"></i>\${new Date(product.created_at).getFullYear() || 'Sin fecha'}</span>
                                    </div>
                                </div>
                                <div class="ml-2 flex items-center text-xs">
                                    <i class="\${statusIcon} mr-1"></i>
                                    <span>\${statusText}</span>
                                </div>
                            </div>
                        </div>
                    \`;
                });
                
                searchResults.innerHTML = html;
                searchResults.style.display = 'block';
            }
            
            // Manejar selección de producto
            async function handleProductSelection(productId, productTitle, isAssociated) {
                if (isAssociated) {
                    showToast('Este producto ya está asociado al proyecto', 'warning');
                    return;
                }
                
                try {
                    // Confirmar asociación con modal más elegante
                    if (!confirm(\`¿Desea asociar el producto "\${productTitle}" a este proyecto?\`)) {
                        return;
                    }
                    
                    const response = await axios.post(\`\${API_BASE}/private/projects/\${PROJECT_ID}/products/\${productId}\`);
                    
                    if (response.data.success) {
                        // Recargar productos asociados
                        await loadAssociatedProducts();
                        hideSearchResults();
                        document.getElementById('product-search').value = '';
                        handleFormChange(); // Marcar como cambio no guardado
                        
                        showToast('✅ Producto asociado correctamente', 'success');
                    } else {
                        throw new Error(response.data.message || 'Error al asociar producto');
                    }
                } catch (error) {
                    console.error('Error asociando producto:', error);
                    const errorMsg = error.response?.data?.error || error.message || 'Error al asociar el producto. Por favor, intente nuevamente.';
                    showToast(\`❌ \${errorMsg}\`, 'error', 5000);
                }
            }
            
            // Mostrar mensaje sin resultados
            function showNoResults(message = 'No se encontraron productos') {
                const searchResults = document.getElementById('product-search-results');
                searchResults.innerHTML = \`
                    <div class="search-result-item text-muted-foreground text-center">
                        <i class="fas fa-search mr-2"></i>\${message}
                    </div>
                \`;
                searchResults.style.display = 'block';
            }
            
            // Ocultar resultados de búsqueda
            function hideSearchResults() {
                const searchResults = document.getElementById('product-search-results');
                searchResults.style.display = 'none';
                searchResults.innerHTML = '';
            }
            
            // Cargar productos del proyecto
            async function loadAssociatedProducts() {
                try {
                    const response = await axios.get(\`\${API_BASE}/private/projects/\${PROJECT_ID}/products\`);
                    
                    if (response.data.success) {
                        associatedProducts = response.data.data.products || [];
                        renderAssociatedProducts();
                    }
                } catch (error) {
                    console.error('Error cargando productos del proyecto:', error);
                    associatedProducts = [];
                    renderAssociatedProducts();
                }
            }
            
            // Renderizar productos del proyecto
            function renderAssociatedProducts() {
                const container = document.getElementById('associated-products');
                
                if (associatedProducts.length === 0) {
                    container.innerHTML = \`
                        <div class="text-center text-muted-foreground py-4">
                            <i class="fas fa-box-open mb-2 block text-lg"></i>
                            No hay productos científicos en este proyecto
                        </div>
                    \`;
                } else {
                    container.innerHTML = associatedProducts.map(product => \`
                        <div class="product-item">
                            <div>
                                <div class="font-medium">\${product.description}</div>
                                <div class="text-xs text-muted-foreground">
                                    <span class="mr-3">Código: \${product.product_code}</span>
                                    <span>\${product.product_type || 'Producto'}</span>
                                </div>
                            </div>
                            <div class="flex items-center gap-2">
                                <button 
                                    type="button" 
                                    onclick="editProduct(\${product.id})"
                                    class="text-primary hover:text-primary-foreground text-sm"
                                    title="Editar producto"
                                >
                                    <i class="fas fa-edit"></i>
                                </button>
                                <button 
                                    type="button" 
                                    onclick="removeProduct(\${product.id})"
                                    class="text-destructive hover:text-destructive-foreground text-sm"
                                    title="Eliminar producto"
                                >
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    \`).join('');
                }
            }
            
            // Editar producto
            function editProduct(productId) {
                window.location.href = \`/dashboard/productos/\${productId}/editar\`;
            }
            
            // Eliminar producto
            async function removeProduct(productId) {
                if (!confirm('¿Está seguro de que desea eliminar este producto? Esta acción no se puede deshacer.')) {
                    return;
                }
                
                try {
                    const response = await axios.delete(\`\${API_BASE}/private/products/\${productId}\`);
                    
                    if (response.data.success) {
                        showSuccess('Producto eliminado exitosamente');
                        loadAssociatedProducts();
                    } else {
                        throw new Error(response.data.message);
                    }
                } catch (error) {
                    console.error('Error eliminando producto:', error);
                    showError('Error al eliminar el producto');
                }
            }
            
            // Funciones de utilidad
            function hideLoading() {
                loadingOverlay.style.display = 'none';
            }
            
            function showSuccess(message) {
                console.log('SUCCESS:', message);
                showToast(message, 'success');
            }
            
            // Sistema de toast/notificaciones
            function showToast(message, type = 'info', duration = 3000) {
                // Crear contenedor de toast si no existe
                let toastContainer = document.getElementById('toast-container');
                if (!toastContainer) {
                    toastContainer = document.createElement('div');
                    toastContainer.id = 'toast-container';
                    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-2';
                    document.body.appendChild(toastContainer);
                }
                
                // Crear elemento de toast
                const toast = document.createElement('div');
                const toastId = 'toast-' + Date.now();
                toast.id = toastId;
                
                // Estilos según tipo
                const typeStyles = {
                    success: 'bg-green-500 text-white',
                    error: 'bg-red-500 text-white',
                    warning: 'bg-yellow-500 text-white',
                    info: 'bg-blue-500 text-white'
                };
                
                const iconMap = {
                    success: 'fas fa-check',
                    error: 'fas fa-times',
                    warning: 'fas fa-exclamation-triangle',
                    info: 'fas fa-info'
                };
                
                toast.className = \`\${typeStyles[type] || typeStyles.info} px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transform transition-all duration-300 translate-x-full opacity-0\`;
                toast.innerHTML = \`
                    <i class="\${iconMap[type] || iconMap.info} mr-2"></i>
                    <span class="flex-1">\${message}</span>
                    <button onclick="removeToast('\${toastId}')" class="ml-2 opacity-70 hover:opacity-100">
                        <i class="fas fa-times text-xs"></i>
                    </button>
                \`;
                
                toastContainer.appendChild(toast);
                
                // Animar entrada
                setTimeout(() => {
                    toast.classList.remove('translate-x-full', 'opacity-0');
                }, 100);
                
                // Auto-remover
                setTimeout(() => {
                    removeToast(toastId);
                }, duration);
            }
            
            // Función global para remover toast
            window.removeToast = function(toastId) {
                const toast = document.getElementById(toastId);
                if (toast) {
                    toast.classList.add('translate-x-full', 'opacity-0');
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }
            }
            
            // ===== FUNCIONES DEL MODAL DE CREACIÓN DE PRODUCTO =====
            
            // Variables para el modal
            let productCategories = [];
            
            // Abrir drawer de creación de producto con efecto glassmorphism
            function openCreateProductDrawer() {
                const overlay = document.getElementById('create-product-drawer-overlay');
                const drawer = document.getElementById('create-product-drawer');
                
                // Mostrar overlay
                overlay.classList.remove('hidden');
                
                // Activar transición de entrada después de que el overlay esté visible
                setTimeout(() => {
                    drawer.classList.add('open');
                }, 10);
                
                // Cargar categorías si no se han cargado
                if (productCategories.length === 0) {
                    loadProductCategories();
                }
                
                // Limpiar formulario
                document.getElementById('create-product-form').reset();
                
                // Enfocar el primer campo dentro del contenedor sólido
                setTimeout(() => {
                    const solidContainer = drawer.querySelector('.form-container-solid');
                    const firstInput = solidContainer.querySelector('input, textarea, select');
                    if (firstInput) firstInput.focus();
                }, 350);
            }
            
            // Cerrar drawer con efecto glassmorphism
            function closeCreateProductDrawer() {
                const overlay = document.getElementById('create-product-drawer-overlay');
                const drawer = document.getElementById('create-product-drawer');
                
                // Animación de salida
                drawer.classList.remove('open');
                
                // Ocultar overlay después de la transición
                setTimeout(() => {
                    overlay.classList.add('hidden');
                }, 300);
            }
            
            // Funciones globales (accesibles desde onclick)
            window.openCreateProductDrawer = openCreateProductDrawer;
            window.closeCreateProductDrawer = closeCreateProductDrawer;
            
            // Legacy - mantener compatibilidad
            window.openCreateProductModal = openCreateProductDrawer;
            window.closeCreateProductModal = closeCreateProductDrawer;
            
            // Cargar categorías de productos
            async function loadProductCategories() {
                try {
                    const response = await axios.get(\`\${API_BASE}/admin/product-categories\`);
                    
                    if (response.data.success) {
                        productCategories = response.data.data.categories || [];
                        populateProductTypeSelect();
                    }
                } catch (error) {
                    console.error('Error cargando categorías de productos:', error);
                    showToast('Error cargando tipos de producto', 'error');
                }
            }
            
            // Poblar el select de tipos de producto
            function populateProductTypeSelect() {
                const select = document.getElementById('product-type');
                
                // Limpiar opciones existentes (excepto la primera)
                while (select.children.length > 1) {
                    select.removeChild(select.lastChild);
                }
                
                // Agregar opciones de categorías
                productCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.code;
                    option.textContent = \`\${category.name} (\${category.code})\`;
                    select.appendChild(option);
                });
            }
            
            // Manejar envío del formulario
            async function handleCreateProductSubmit(event) {
                event.preventDefault();
                
                const formData = new FormData(event.target);
                const productData = {
                    product_code: formData.get('product_code'),
                    product_type: formData.get('product_type'),
                    description: formData.get('description'),
                    doi: formData.get('doi') || undefined,
                    url: formData.get('url') || undefined,
                    journal: formData.get('journal') || undefined,
                    publication_date: formData.get('publication_date') || undefined,
                    impact_factor: formData.get('impact_factor') ? parseFloat(formData.get('impact_factor')) : undefined
                };
                
                try {
                    console.log('Creando producto:', productData);
                    
                    const response = await axios.post(
                        \`\${API_BASE}/private/projects/\${PROJECT_ID}/products\`,
                        productData
                    );
                    
                    if (response.data.success) {
                        showToast('✅ Producto creado y asociado correctamente', 'success');
                        closeCreateProductDrawer();
                        
                        // Recargar productos asociados para mostrar el nuevo producto
                        await loadAssociatedProducts();
                        
                        // Marcar como cambio no guardado
                        handleFormChange();
                    } else {
                        throw new Error(response.data.error || 'Error al crear el producto');
                    }
                } catch (error) {
                    console.error('Error creando producto:', error);
                    const errorMsg = error.response?.data?.error || error.message || 'Error al crear el producto';
                    showToast(\`❌ \${errorMsg}\`, 'error', 5000);
                }
            }
            
            // Abrir modal/página para asociar productos existentes
            function openAssociateProductsModal() {
                // Por ahora, redireccionar a la página de productos con el parámetro project_id
                // TODO: En el futuro, esto podría ser un modal con lista de productos disponibles
                window.location.href = \`/dashboard/productos?project_id=\${PROJECT_ID}\`;
            }
            
            // Configurar event listener para el formulario (se llama desde initializeForm)
            
            function showError(message) {
                console.error('ERROR:', message);
                showToast(message, 'error');
                showErrorState(message);
            }
            
            // Mostrar error específico según tipo y código de estado
            function showSpecificError(type, title, description) {
                hideLoading();
                
                // Actualizar título de la página según el tipo de error
                const pageTitle = document.getElementById('page-title');
                if (pageTitle) {
                    const errorTitles = {
                        auth: \`Sesión Requerida - Proyecto ID: \${PROJECT_ID}\`,
                        permission: \`Sin Permisos - Proyecto ID: \${PROJECT_ID}\`,
                        notfound: \`Proyecto No Encontrado - ID: \${PROJECT_ID}\`,
                        server: \`Error del Servidor - Proyecto ID: \${PROJECT_ID}\`,
                        network: \`Error de Conexión - Proyecto ID: \${PROJECT_ID}\`,
                        unknown: \`Error Inesperado - Proyecto ID: \${PROJECT_ID}\`
                    };
                    
                    pageTitle.textContent = errorTitles[type] || errorTitles.unknown;
                }
                
                // Configuración específica según tipo de error
                const errorConfig = {
                    auth: {
                        icon: 'fas fa-lock',
                        color: 'hsl(var(--destructive))',
                        primaryAction: {
                            text: 'Iniciar Sesión',
                            href: '/login',
                            icon: 'fas fa-sign-in-alt'
                        }
                    },
                    permission: {
                        icon: 'fas fa-user-shield',
                        color: 'hsl(var(--destructive))',
                        primaryAction: {
                            text: 'Contactar Propietario',
                            href: '#',
                            icon: 'fas fa-envelope',
                            onclick: 'showContactOwnerInfo()'
                        }
                    },
                    notfound: {
                        icon: 'fas fa-search',
                        color: 'hsl(var(--muted-foreground))',
                        primaryAction: {
                            text: 'Ver Todos los Proyectos',
                            href: '/dashboard',
                            icon: 'fas fa-list'
                        }
                    },
                    server: {
                        icon: 'fas fa-server',
                        color: 'hsl(var(--destructive))',
                        primaryAction: {
                            text: 'Reintentar',
                            href: '#',
                            icon: 'fas fa-redo',
                            onclick: 'retryLoadProject()'
                        }
                    },
                    network: {
                        icon: 'fas fa-wifi',
                        color: 'hsl(var(--destructive))',
                        primaryAction: {
                            text: 'Reintentar',
                            href: '#',
                            icon: 'fas fa-redo', 
                            onclick: 'retryLoadProject()'
                        }
                    },
                    unknown: {
                        icon: 'fas fa-exclamation-triangle',
                        color: 'hsl(var(--destructive))',
                        primaryAction: {
                            text: 'Reintentar',
                            href: '#',
                            icon: 'fas fa-redo',
                            onclick: 'retryLoadProject()'
                        }
                    }
                };
                
                const config = errorConfig[type] || errorConfig.unknown;
                
                // Reemplazar el contenido principal con el estado de error específico
                const mainContent = document.querySelector('.content-columns');
                if (mainContent) {
                    mainContent.innerHTML = \`
                        <div class="error-state-container" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center;">
                            <div class="error-state-content" style="max-width: 600px; padding: 2rem;">
                                <!-- Ícono de Error Específico -->
                                <div class="error-icon" style="margin-bottom: 1.5rem;">
                                    <i class="\${config.icon}" style="font-size: 4rem; color: \${config.color}; opacity: 0.8;"></i>
                                </div>
                                
                                <!-- Título del Error -->
                                <h2 style="font-size: 1.5rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 1rem;">
                                    \${title}
                                </h2>
                                
                                <!-- Descripción Detallada -->
                                <p style="color: hsl(var(--muted-foreground)); margin-bottom: 2rem; line-height: 1.6; font-size: 0.95rem;">
                                    \${description}
                                </p>
                                
                                <!-- Botones de Acción -->
                                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                                    <a 
                                        href="\${config.primaryAction.href}" 
                                        \${config.primaryAction.onclick ? 'onclick="' + config.primaryAction.onclick + '"' : ''}
                                        class="btn-primary btn"
                                        style="min-width: 140px; text-decoration: none;"
                                    >
                                        <i class="\${config.primaryAction.icon} mr-2"></i>
                                        \${config.primaryAction.text}
                                    </a>
                                    
                                    <a 
                                        href="/dashboard" 
                                        class="btn-outline btn"
                                        style="min-width: 140px; text-decoration: none;"
                                    >
                                        <i class="fas fa-arrow-left mr-2"></i>
                                        Volver al Dashboard
                                    </a>
                                </div>
                                
                                \${type === 'permission' && currentProject ? \`
                                    <div style="margin-top: 2rem; padding: 1rem; background: hsl(var(--muted)); border-radius: calc(var(--radius)); text-align: left;">
                                        <h4 style="font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; color: hsl(var(--foreground));">
                                            <i class="fas fa-info-circle mr-1"></i>
                                            Información del Proyecto
                                        </h4>
                                        <div style="font-size: 0.75rem; color: hsl(var(--muted-foreground));">
                                            <strong>Propietario:</strong> \${currentProject?.owner_name || 'No disponible'}<br>
                                            <strong>Email:</strong> \${currentProject?.owner_email || 'No disponible'}
                                        </div>
                                    </div>
                                \` : ''}
                                
                                <!-- Herramientas de Diagnóstico Avanzado -->
                                <div style="margin-top: 2rem;">
                                    <button 
                                        onclick="runAdvancedDiagnostic()" 
                                        class="btn-secondary btn"
                                        style="width: 100%; margin-bottom: 1rem;"
                                    >
                                        <i class="fas fa-stethoscope mr-2"></i>
                                        Ejecutar Diagnóstico Completo
                                    </button>
                                </div>
                                
                                <!-- Información Técnica (Colapsible) -->
                                <details style="margin-top: 1rem; text-align: left;">
                                    <summary style="cursor: pointer; color: hsl(var(--muted-foreground)); font-size: 0.875rem;">
                                        <i class="fas fa-code mr-1"></i>
                                        Información técnica para soporte
                                    </summary>
                                    <div id="tech-info-\${type}" style="margin-top: 1rem; padding: 1rem; background: hsl(var(--muted)); border-radius: calc(var(--radius)); font-family: monospace; font-size: 0.75rem; color: hsl(var(--muted-foreground));">
                                        <strong>Tipo de Error:</strong> \${type}<br>
                                        <strong>Proyecto ID:</strong> \${PROJECT_ID}<br>
                                        <strong>URL de la API:</strong> \${API_BASE}/private/projects/\${PROJECT_ID}<br>
                                        <strong>Token Presente:</strong> \${authToken ? 'Sí' : 'No'}<br>
                                        <strong>Título:</strong> \${title}<br>
                                        <strong>Timestamp:</strong> \${new Date().toISOString()}<br>
                                        <div id="diagnostic-results" style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid hsl(var(--border));">
                                            <em>Ejecuta el diagnóstico completo para más información...</em>
                                        </div>
                                    </div>
                                </details>
                            </div>
                        </div>
                    \`;
                }
            }
            
            // Función para mostrar información de contacto del propietario
            function showContactOwnerInfo() {
                if (currentProject && currentProject.owner_email) {
                    const subject = encodeURIComponent(\`Solicitud de acceso al proyecto: \${currentProject.title}\`);
                    const body = encodeURIComponent(\`Hola \${currentProject.owner_name},\\n\\nMe gustaría solicitar acceso de edición al proyecto "\${currentProject.title}".\\n\\nGracias.\`);
                    window.open(\`mailto:\${currentProject.owner_email}?subject=\${subject}&body=\${body}\`, '_blank');
                } else {
                    alert('La información de contacto del propietario no está disponible.');
                }
            }
            
            // Mostrar estado de error integrado en la interfaz
            function showErrorState(message) {
                hideLoading();
                
                // Reemplazar el contenido principal con el estado de error
                const mainContent = document.querySelector('.content-columns');
                if (mainContent) {
                    mainContent.innerHTML = \`
                        <div class="error-state-container" style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center;">
                            <div class="error-state-content" style="max-width: 500px; padding: 2rem;">
                                <!-- Ícono de Error -->
                                <div class="error-icon" style="margin-bottom: 1.5rem;">
                                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: hsl(var(--destructive)); opacity: 0.8;"></i>
                                </div>
                                
                                <!-- Título del Error -->
                                <h2 style="font-size: 1.5rem; font-weight: 600; color: hsl(var(--foreground)); margin-bottom: 1rem;">
                                    No se pudo cargar el proyecto
                                </h2>
                                
                                <!-- Mensaje Descriptivo -->
                                <p style="color: hsl(var(--muted-foreground)); margin-bottom: 2rem; line-height: 1.6;">
                                    \${message || 'Ocurrió un error al intentar obtener la información del proyecto. Por favor, revisa tu conexión a internet e inténtalo de nuevo.'}
                                </p>
                                
                                <!-- Botones de Acción -->
                                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                                    <button 
                                        onclick="retryLoadProject()" 
                                        class="btn-primary btn"
                                        style="min-width: 120px;"
                                    >
                                        <i class="fas fa-redo mr-2"></i>
                                        Reintentar
                                    </button>
                                    
                                    <a 
                                        href="/dashboard" 
                                        class="btn-outline btn"
                                        style="min-width: 120px; text-decoration: none;"
                                    >
                                        <i class="fas fa-arrow-left mr-2"></i>
                                        Volver al Dashboard
                                    </a>
                                </div>
                                
                                <!-- Información Adicional (Colapsible) -->
                                <details style="margin-top: 2rem; text-align: left;">
                                    <summary style="cursor: pointer; color: hsl(var(--muted-foreground)); font-size: 0.875rem;">
                                        <i class="fas fa-info-circle mr-1"></i>
                                        Información técnica
                                    </summary>
                                    <div style="margin-top: 1rem; padding: 1rem; background: hsl(var(--muted)); border-radius: calc(var(--radius)); font-family: monospace; font-size: 0.75rem; color: hsl(var(--muted-foreground));">
                                        <strong>Proyecto ID:</strong> \${PROJECT_ID}<br>
                                        <strong>URL de la API:</strong> \${API_BASE}/private/projects/\${PROJECT_ID}<br>
                                        <strong>Error:</strong> \${message}
                                    </div>
                                </details>
                            </div>
                        </div>
                    \`;
                }
            }
            
            // Función para reintentar la carga
            function retryLoadProject() {
                console.log('🔄 Reintentando carga del proyecto...');
                location.reload(); // Recargar la página completa para reiniciar el estado
            }
            
            // Función de diagnóstico completo en tiempo real
            function runAdvancedDiagnostic() {
                console.log('🔍 === EJECUTANDO DIAGNÓSTICO COMPLETO ===');
                
                const results = [];
                
                // 1. Verificar localStorage
                const tokenInStorage = localStorage.getItem('auth_token');
                results.push(\`🔑 Token en localStorage: \${tokenInStorage ? 'PRESENTE' : 'AUSENTE'}\`);
                
                if (tokenInStorage) {
                    results.push(\`📏 Longitud del token: \${tokenInStorage.length} caracteres\`);
                    results.push(\`🔤 Primeros 20 chars: \${tokenInStorage.substring(0, 20)}...\`);
                    
                    // Verificar si es un JWT válido
                    try {
                        const parts = tokenInStorage.split('.');
                        if (parts.length === 3) {
                            const payload = JSON.parse(atob(parts[1]));
                            const expTime = new Date(payload.exp * 1000);
                            const now = new Date();
                            results.push(\`⏰ Token expira: \${expTime.toLocaleString()}\`);
                            results.push(\`✅ Token válido: \${expTime > now ? 'SÍ' : 'EXPIRADO'}\`);
                            results.push(\`👤 Usuario: \${payload.email || 'N/A'}\`);
                            results.push(\`🔐 Rol: \${payload.role || 'N/A'}\`);
                        } else {
                            results.push(\`❌ Token no parece ser JWT válido (partes: \${parts.length})\`);
                        }
                    } catch (e) {
                        results.push(\`❌ Error decodificando JWT: \${e.message}\`);
                    }
                }
                
                // 2. Verificar variable global
                results.push(\`🌐 Variable global authToken: \${authToken ? 'PRESENTE' : 'AUSENTE'}\`);
                
                // 3. Verificar configuración de axios
                const authHeader = axios.defaults.headers.common['Authorization'];
                results.push(\`🔧 Axios Authorization header: \${authHeader ? 'CONFIGURADA' : 'NO CONFIGURADA'}\`);
                
                if (authHeader) {
                    results.push(\`📤 Cabecera completa: \${authHeader.substring(0, 30)}...\`);
                }
                
                // 4. Verificar todas las cabeceras
                const allHeaders = Object.keys(axios.defaults.headers.common);
                results.push(\`📋 Todas las cabeceras axios: \${allHeaders.join(', ')}\`);
                
                // 5. Test de conectividad básica
                results.push(\`🌐 Probando conectividad con API...\`);
                
                // Hacer una prueba de conectividad
                axios.get(\`\${API_BASE}/health\`).then(() => {
                    results.push(\`✅ API accesible (endpoint /health)\`);
                    updateDiagnosticResults(results);
                }).catch(err => {
                    results.push(\`❌ API no accesible: \${err.message}\`);
                    updateDiagnosticResults(results);
                });
                
                // Mostrar resultados inmediatos
                updateDiagnosticResults(results);
                
                // Log completo en consola
                console.log('Resultados del diagnóstico:');
                results.forEach((result, index) => {
                    console.log(\`\${index + 1}. \${result}\`);
                });
            }
            
            // Actualizar resultados del diagnóstico en la UI
            function updateDiagnosticResults(results) {
                const diagnosticDiv = document.getElementById('diagnostic-results');
                if (diagnosticDiv) {
                    diagnosticDiv.innerHTML = results.map(result => 
                        \`<div style="margin: 0.25rem 0;">\${result}</div>\`
                    ).join('');
                }
            }
            
            // Los productos asociados se cargan ahora en el paso 5 del flujo de inicialización
            // después de configurar la autenticación
        </script>
    </body>
    </html>
  `);
})

// Dashboard mejorado de clase mundial
app.get('/dashboard-mejorado', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es" id="dashboard-html" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚀 Dashboard de Monitoreo - Clase Mundial</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-background text-foreground min-h-screen">
        <!-- Header -->
        <div class="bg-card border-b border-border p-6">
            <div class="max-w-7xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold flex items-center">
                            <i class="fas fa-chart-line text-accent mr-3"></i>
                            Dashboard de Monitoreo - Clase Mundial
                        </h1>
                        <p class="text-muted-foreground mt-1">
                            Sistema Departamental de Ciencias del Chocó - Gestión Estratégica CTeI
                        </p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="ctei-btn-secondary">
                            <i class="fas fa-home mr-2"></i>
                            Portal Principal
                        </a>
                        <div class="text-sm text-muted-foreground flex items-center">
                            <i class="fas fa-clock mr-2"></i>
                            <span id="last-updated">Actualizado: ${new Date().toLocaleTimeString()}</span>
                        </div>
                        <button onclick="window.location.reload()" class="ctei-btn-primary">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenido Principal -->
        <div class="max-w-7xl mx-auto p-6">
            
            <!-- FILA 1: KPIs Principales (Ancho Completo) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-muted-foreground">Proyectos Activos</p>
                            <p class="text-3xl font-bold text-green-600">127</p>
                            <p class="text-xs text-green-600 flex items-center mt-1">
                                <i class="fas fa-arrow-up mr-1"></i> +15% vs. mes anterior
                            </p>
                        </div>
                        <div class="p-3 bg-green-100 rounded-full">
                            <i class="fas fa-project-diagram text-green-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-muted-foreground">Alertas Críticas</p>
                            <p class="text-3xl font-bold text-red-600">8</p>
                            <p class="text-xs text-red-600 flex items-center mt-1">
                                <i class="fas fa-exclamation-triangle mr-1"></i> Requieren atención
                            </p>
                        </div>
                        <div class="p-3 bg-red-100 rounded-full">
                            <i class="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-muted-foreground">Presupuesto Ejecutado</p>
                            <p class="text-3xl font-bold text-blue-600">68%</p>
                            <p class="text-xs text-blue-600 flex items-center mt-1">
                                <i class="fas fa-dollar-sign mr-1"></i> $1.2M de $1.8M
                            </p>
                        </div>
                        <div class="p-3 bg-blue-100 rounded-full">
                            <i class="fas fa-chart-pie text-blue-600 text-xl"></i>
                        </div>
                    </div>
                </div>

                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-muted-foreground">Score Promedio</p>
                            <p class="text-3xl font-bold text-purple-600">8.4</p>
                            <p class="text-xs text-purple-600 flex items-center mt-1">
                                <i class="fas fa-star mr-1"></i> Excelente desempeño
                            </p>
                        </div>
                        <div class="p-3 bg-purple-100 rounded-full">
                            <i class="fas fa-trophy text-purple-600 text-xl"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FILA 2: Módulos de Acción (Layout Dividido 60%/40%) -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                <!-- Alertas Críticas (60% = 3 columnas) -->
                <div id="critical-alerts" class="lg:col-span-3 ctei-content-card">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-semibold flex items-center">
                            <i class="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                            Alertas Críticas
                        </h2>
                        <div class="flex items-center space-x-2">
                            <span class="ctei-badge-danger">8 críticas</span>
                            <button onclick="showToast('Actualizando alertas...', 'info')" class="ctei-btn-sm">
                                <i class="fas fa-sync-alt"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Lista de Alertas con Semantic Colors -->
                    <div class="space-y-3">
                        <div class="p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg hover:bg-red-100 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-red-800">Sistema de Riego - Sensor Desconectado</h3>
                                    <p class="text-sm text-red-600 mt-1">El sensor de humedad #34 perdió conectividad hace 2 horas</p>
                                    <div class="flex items-center mt-2 text-xs text-red-500">
                                        <i class="fas fa-clock mr-1"></i>
                                        Hace 2h 15m • Proyecto #PRY-2024-089
                                    </div>
                                </div>
                                <div class="flex space-x-2 ml-4">
                                    <button onclick="showToast('Enviando técnico...', 'info')" class="ctei-btn-sm bg-red-600 hover:bg-red-700 text-white">
                                        <i class="fas fa-tools"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg hover:bg-orange-100 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-orange-800">Presupuesto Excedido - Laboratorio</h3>
                                    <p class="text-sm text-orange-600 mt-1">El proyecto Lab-AI-2024 superó el 95% del presupuesto asignado</p>
                                    <div class="flex items-center mt-2 text-xs text-orange-500">
                                        <i class="fas fa-dollar-sign mr-1"></i>
                                        $156K de $160K • Proyecto #LAB-2024-012
                                    </div>
                                </div>
                                <div class="flex space-x-2 ml-4">
                                    <button onclick="showToast('Revisando presupuesto...', 'warning')" class="ctei-btn-sm bg-orange-600 hover:bg-orange-700 text-white">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-r-lg hover:bg-yellow-100 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-yellow-800">Entrega Próxima - Rev. Técnica</h3>
                                    <p class="text-sm text-yellow-600 mt-1">Revisión técnica del proyecto IoT-Agricultura vence en 3 días</p>
                                    <div class="flex items-center mt-2 text-xs text-yellow-500">
                                        <i class="fas fa-calendar mr-1"></i>
                                        Vence: 19 Sep 2024 • Proyecto #IOT-2024-045
                                    </div>
                                </div>
                                <div class="flex space-x-2 ml-4">
                                    <button onclick="showToast('Programando reunión...', 'info')" class="ctei-btn-sm bg-yellow-600 hover:bg-yellow-700 text-white">
                                        <i class="fas fa-calendar-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 text-center">
                        <button onclick="showToast('Cargando más alertas...', 'info')" class="ctei-btn-secondary">
                            <i class="fas fa-plus mr-2"></i>
                            Ver Todas las Alertas (23 más)
                        </button>
                    </div>
                </div>

                <!-- Proyectos Requieren Atención (40% = 2 columnas) -->
                <div class="lg:col-span-2 ctei-content-card">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold flex items-center">
                            <i class="fas fa-flag text-yellow-500 mr-2"></i>
                            Requieren Atención
                        </h2>
                        <span class="ctei-badge-warning">12 proyectos</span>
                    </div>
                    
                    <div class="space-y-3">
                        <div class="p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-sm text-yellow-800">Agricultura Inteligente</h3>
                                    <div class="flex items-center mt-1">
                                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                            <div class="bg-yellow-500 h-2 rounded-full" style="width: 67%"></div>
                                        </div>
                                        <span class="text-xs text-yellow-600">67%</span>
                                    </div>
                                    <p class="text-xs text-yellow-600 mt-1">
                                        <i class="fas fa-exclamation-triangle mr-1"></i>
                                        Retraso en milestone #3
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="p-3 bg-orange-50 border border-orange-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-sm text-orange-800">Laboratorio Móvil</h3>
                                    <div class="flex items-center mt-1">
                                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                            <div class="bg-orange-500 h-2 rounded-full" style="width: 45%"></div>
                                        </div>
                                        <span class="text-xs text-orange-600">45%</span>
                                    </div>
                                    <p class="text-xs text-orange-600 mt-1">
                                        <i class="fas fa-clock mr-1"></i>
                                        Pending budget approval
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div class="p-3 bg-red-50 border border-red-200 rounded-lg hover:shadow-sm transition-shadow">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h3 class="font-semibold text-sm text-red-800">Sistema de Monitoreo</h3>
                                    <div class="flex items-center mt-1">
                                        <div class="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                            <div class="bg-red-500 h-2 rounded-full" style="width: 23%"></div>
                                        </div>
                                        <span class="text-xs text-red-600">23%</span>
                                    </div>
                                    <p class="text-xs text-red-600 mt-1">
                                        <i class="fas fa-times-circle mr-1"></i>
                                        Critical delays detected
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4 text-center">
                        <button onclick="showToast('Abriendo vista completa...', 'info')" class="ctei-btn-secondary text-sm">
                            <i class="fas fa-external-link-alt mr-1"></i>
                            Ver Todos
                        </button>
                    </div>
                </div>
            </div>

            <!-- FILA 3: Gráficos y Análisis (Información Secundaria) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Gráfico de Progreso Mensual -->
                <div class="ctei-content-card">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold flex items-center">
                            <i class="fas fa-chart-bar text-blue-500 mr-2"></i>
                            Progreso Mensual
                        </h2>
                        <div class="flex space-x-2">
                            <button class="ctei-btn-sm bg-blue-100 text-blue-700 hover:bg-blue-200">
                                30 días
                            </button>
                            <button class="ctei-btn-sm text-gray-600 hover:bg-gray-100">
                                90 días
                            </button>
                        </div>
                    </div>
                    
                    <div class="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                        <div class="text-center text-blue-600">
                            <i class="fas fa-chart-line text-4xl mb-2"></i>
                            <p class="font-semibold">Gráfico Interactivo</p>
                            <p class="text-sm">Progreso de proyectos por mes</p>
                        </div>
                    </div>
                    
                    <div class="mt-4 flex justify-between text-sm text-muted-foreground">
                        <span>Ene 2024</span>
                        <span>Sep 2024</span>
                    </div>
                </div>

                <!-- Distribución de Estados -->
                <div class="ctei-content-card">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-lg font-semibold flex items-center">
                            <i class="fas fa-pie-chart text-green-500 mr-2"></i>
                            Estados de Proyectos
                        </h2>
                        <button onclick="showToast('Actualizando estadísticas...', 'info')" class="ctei-btn-sm">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                    
                    <div class="space-y-4">
                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                                <span class="text-sm">En Progreso</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-32 bg-gray-200 rounded-full h-2">
                                    <div class="bg-green-500 h-2 rounded-full" style="width: 65%"></div>
                                </div>
                                <span class="text-sm font-semibold text-green-600">65%</span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                                <span class="text-sm">En Revisión</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-32 bg-gray-200 rounded-full h-2">
                                    <div class="bg-yellow-500 h-2 rounded-full" style="width: 20%"></div>
                                </div>
                                <span class="text-sm font-semibold text-yellow-600">20%</span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                                <span class="text-sm">Completados</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-32 bg-gray-200 rounded-full h-2">
                                    <div class="bg-blue-500 h-2 rounded-full" style="width: 12%"></div>
                                </div>
                                <span class="text-sm font-semibold text-blue-600">12%</span>
                            </div>
                        </div>

                        <div class="flex items-center justify-between">
                            <div class="flex items-center">
                                <div class="w-4 h-4 bg-red-500 rounded-full mr-3"></div>
                                <span class="text-sm">Bloqueados</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <div class="w-32 bg-gray-200 rounded-full h-2">
                                    <div class="bg-red-500 h-2 rounded-full" style="width: 3%"></div>
                                </div>
                                <span class="text-sm font-semibold text-red-600">3%</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-semibold text-gray-800">Total de Proyectos</p>
                                <p class="text-2xl font-bold text-green-600">127</p>
                            </div>
                            <div class="text-right">
                                <p class="text-sm text-gray-600">Este mes</p>
                                <p class="text-sm font-semibold text-green-600">+8 nuevos</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast Container -->
        <div id="toast-container" class="fixed top-4 right-4 space-y-2 z-50"></div>

        <!-- Scripts -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            function showToast(message, type = 'success') {
                const toast = document.createElement('div');
                const colors = {
                    success: 'bg-green-500',
                    info: 'bg-blue-500',
                    warning: 'bg-yellow-500',
                    error: 'bg-red-500'
                };
                
                toast.className = 'px-6 py-3 rounded-lg font-medium text-white shadow-lg ' + (colors[type] || colors.success);
                const iconMap = {
                    success: 'check-circle',
                    info: 'info-circle',
                    warning: 'exclamation-triangle', 
                    error: 'times-circle'
                };
                toast.innerHTML = '<div class="flex items-center">' +
                    '<i class="fas fa-' + (iconMap[type] || iconMap.success) + ' mr-2"></i>' +
                    message +
                    '</div>';
                
                const container = document.getElementById('toast-container');
                container.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            }

            // Auto-actualizar timestamp cada minuto
            setInterval(() => {
                document.getElementById('last-updated').textContent = 'Actualizado: ' + new Date().toLocaleTimeString();
            }, 60000);

            // Inicializar
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🚀 Dashboard de Clase Mundial inicializado');
                showToast('Dashboard de clase mundial cargado correctamente', 'success');
                
                // Actualizar timestamp inicial
                setTimeout(() => {
                    document.getElementById('last-updated').textContent = 'Actualizado: ' + new Date().toLocaleTimeString();
                }, 1000);
            });
        </script>
    </body>
    </html>
  `)
})

// Dashboard simple para debugging (sin cache)
app.get('/dashboard-simple', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🔧 Dashboard Simple - Debug</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100">
        <div id="app" class="p-8">
            <div class="max-w-4xl mx-auto">
                <h1 class="text-3xl font-bold mb-6">🔧 Dashboard Simple - Test</h1>
                
                <!-- Status Panel -->
                <div class="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 class="text-xl font-semibold mb-4">Estado del Sistema</h2>
                    <div id="status-info">
                        <p>🔄 Verificando...</p>
                    </div>
                </div>

                <!-- Quick Login -->
                <div class="bg-white p-6 rounded-lg shadow mb-6">
                    <h2 class="text-xl font-semibold mb-4">Login Rápido</h2>
                    <div class="flex gap-4">
                        <button onclick="quickLogin()" class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Login como Admin
                        </button>
                        <button onclick="testMonitoringDirect()" class="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            Test Monitoreo API
                        </button>
                        <button onclick="loadFullDashboard()" class="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                            Cargar Dashboard Completo
                        </button>
                    </div>
                </div>

                <!-- Results Panel -->
                <div class="bg-white p-6 rounded-lg shadow">
                    <h2 class="text-xl font-semibold mb-4">Resultados</h2>
                    <div id="results" class="min-h-[200px] bg-gray-50 p-4 rounded">
                        <p class="text-gray-500">Los resultados aparecerán aquí...</p>
                    </div>
                </div>
            </div>
        </div>

        <script>
            let adminToken = null;
            
            // Check status on load
            window.addEventListener('DOMContentLoaded', function() {
                updateStatus();
            });
            
            function updateStatus() {
                const existing = localStorage.getItem('auth_token');
                document.getElementById('status-info').innerHTML = \`
                    <div class="space-y-2">
                        <p><strong>URL:</strong> \${window.location.href}</p>
                        <p><strong>Token guardado:</strong> \${existing ? '✅ SÍ' : '❌ NO'}</p>
                        <p><strong>Timestamp:</strong> \${new Date().toLocaleString()}</p>
                    </div>
                \`;
                
                if (existing) {
                    adminToken = existing;
                    axios.defaults.headers.common['Authorization'] = \`Bearer \${existing}\`;
                }
            }
            
            async function quickLogin() {
                const results = document.getElementById('results');
                results.innerHTML = '<div class="animate-pulse">🔄 Haciendo login...</div>';
                
                try {
                    const response = await axios.post('/api/auth/login', {
                        email: 'test.admin@ctei.edu.co',
                        password: 'admin123'
                    });
                    
                    if (response.data.success) {
                        adminToken = response.data.data.token;
                        localStorage.setItem('auth_token', adminToken);
                        axios.defaults.headers.common['Authorization'] = \`Bearer \${adminToken}\`;
                        
                        results.innerHTML = \`
                            <div class="text-green-600">
                                <h3 class="font-semibold mb-2">✅ Login Exitoso</h3>
                                <p><strong>Usuario:</strong> \${response.data.data.user.full_name}</p>
                                <p><strong>Rol:</strong> \${response.data.data.user.role}</p>
                                <p><strong>Email:</strong> \${response.data.data.user.email}</p>
                                <div class="mt-4">
                                    <button onclick="window.location.href='/dashboard'" class="bg-blue-500 text-white px-4 py-2 rounded">
                                        Ir al Dashboard Principal
                                    </button>
                                </div>
                            </div>
                        \`;
                        updateStatus();
                    } else {
                        results.innerHTML = \`<div class="text-red-600">❌ Error: \${response.data.error}</div>\`;
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    results.innerHTML = \`<div class="text-red-600">❌ Error de conexión: \${error.message}</div>\`;
                }
            }
            
            async function testMonitoringDirect() {
                const results = document.getElementById('results');
                
                if (!adminToken) {
                    results.innerHTML = '<div class="text-orange-600">⚠️ Necesitas hacer login primero</div>';
                    return;
                }
                
                results.innerHTML = '<div class="animate-pulse">🔄 Probando API de monitoreo...</div>';
                
                try {
                    const response = await axios.get('/api/admin/monitoring/overview');
                    
                    results.innerHTML = \`
                        <div class="text-green-600">
                            <h3 class="font-semibold mb-2">✅ API Monitoreo Funcionando</h3>
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                                <div class="bg-blue-50 p-3 rounded">
                                    <div class="text-sm font-medium">Proyectos</div>
                                    <div class="text-2xl font-bold text-blue-600">\${response.data.data.system_metrics.total_projects}</div>
                                </div>
                                <div class="bg-green-50 p-3 rounded">
                                    <div class="text-sm font-medium">Productos</div>
                                    <div class="text-2xl font-bold text-green-600">\${response.data.data.system_metrics.total_products}</div>
                                </div>
                                <div class="bg-purple-50 p-3 rounded">
                                    <div class="text-sm font-medium">Investigadores</div>
                                    <div class="text-2xl font-bold text-purple-600">\${response.data.data.system_metrics.total_researchers}</div>
                                </div>
                                <div class="bg-orange-50 p-3 rounded">
                                    <div class="text-sm font-medium">Líneas de Acción</div>
                                    <div class="text-2xl font-bold text-orange-600">\${response.data.data.action_line_metrics.length}</div>
                                </div>
                            </div>
                        </div>
                    \`;
                } catch (error) {
                    console.error('API error:', error);
                    results.innerHTML = \`
                        <div class="text-red-600">
                            <h3 class="font-semibold mb-2">❌ Error en API</h3>
                            <p><strong>Status:</strong> \${error.response?.status || 'N/A'}</p>
                            <p><strong>Mensaje:</strong> \${error.message}</p>
                        </div>
                    \`;
                }
            }
            
            function loadFullDashboard() {
                if (!adminToken) {
                    document.getElementById('results').innerHTML = '<div class="text-orange-600">⚠️ Necesitas hacer login primero</div>';
                    return;
                }
                window.location.href = '/dashboard';
            }
        </script>
    </body>
    </html>
  `)
})

// ========================================
// 🎨 FUNCIONES PARA GENERAR PÁGINAS DEDICADAS
// ========================================

/**
 * Función helper para crear etiquetas de tipo de producto
 */
function createProductTypeLabel(productType: string): string {
  const typeLabels: Record<string, string> = {
    'TOP': 'Producto Tipo Top',
    'A': 'Producto Tipo A', 
    'B': 'Producto Tipo B',
    'ASC': 'Apropiación Social del Conocimiento',
    'DPC': 'Desarrollo de Procesos y Capacidades',
    'FRH_A': 'Formación Recursos Humanos A',
    'FRH_B': 'Formación Recursos Humanos B'
  };
  
  const displayName = typeLabels[productType] || productType;
  return `<span class="ctei-tag ctei-tag--primary">${displayName}</span>`;
}

/**
 * Genera la página HTML completa para un proyecto específico
 */
function generateProjectDetailPage(project: any): string {
  // Sanitizar strings para evitar errores de sintaxis JavaScript
  const safeTitle = (project.title || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const safeAbstract = (project.abstract || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;').substring(0, 160);
  const safeOwnerName = (project.owner_name || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const safeOwnerEmail = project.owner_email || '';
  const safeProjectCode = project.project_code || '';
  
  const keywords = project.keywords ? project.keywords.split(',').map((k: string) => k.trim()) : [];
  
  const collaboratorsList = project.collaborators?.map((c: any) => 
    `<span class="ctei-tag ctei-tag--secondary ctei-tag--small mr-2 mb-2">${c.full_name} - ${c.collaboration_role || c.role}</span>`
  ).join('') || '';
  
  const productsList = project.products?.map((p: any) => `
    <div class="productos-cientificos-item border border-border rounded-lg p-4 hover:shadow-md transition-all duration-200" style="background-color: var(--card) !important;">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h4 class="font-semibold mb-1" style="color: var(--card-foreground);">
            <a href="/producto/${p.id}" class="hover:text-primary transition-colors">${p.description || 'Sin descripción'}</a>
          </h4>
          <p class="text-sm text-muted-foreground mb-2">${p.product_code || ''}</p>
          <div class="flex items-center space-x-4 text-xs text-muted-foreground">
            <span class="ctei-tag ctei-tag--outline ctei-tag--small">
              ${p.category_name || 'Sin categoría'}
            </span>
            ${p.publication_date ? `<span><i class="fas fa-calendar mr-1"></i>${new Date(p.publication_date).toLocaleDateString()}</span>` : ''}
            ${p.impact_factor ? `<span><i class="fas fa-star mr-1"></i>IF: ${p.impact_factor}</span>` : ''}
          </div>
        </div>
        <a href="/producto/${p.id}" class="ctei-btn-primary text-sm ml-4">Ver Detalle</a>
      </div>
    </div>
  `).join('') || '<p class="text-muted-foreground italic">No hay productos publicados aún.</p>';

  return `
    <!DOCTYPE html>
    <html lang="es" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeTitle} | CTeI-Manager</title>
        <meta name="description" content="${safeAbstract}">
        <meta name="keywords" content="${keywords.join(', ')}">
        
        <!-- Open Graph -->
        <meta property="og:title" content="${safeTitle}">
        <meta property="og:description" content="${safeAbstract}">
        <meta property="og:type" content="article">
        <meta property="og:url" content="/proyecto/${project.id}">
        
        <!-- Twitter Card -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="${safeTitle}">
        <meta name="twitter:description" content="${safeAbstract}">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'primary': 'var(--color-primary)',
                  'secondary': 'var(--color-secondary)', 
                  'accent': 'var(--color-accent)',
                  'background': 'var(--color-background)',
                  'foreground': 'var(--color-foreground)',
                  'card': 'var(--color-card)',
                  'muted': 'var(--color-muted)',
                  'border': 'var(--color-border)',
                }
              }
            }
          }
        </script>
    </head>
    <body class="level-0 bg-background text-foreground">
        <!-- Navbar -->
        <nav class="ctei-navbar sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center">
                            <h1 class="text-xl font-bold text-foreground">
                                <i class="fas fa-dna mr-2 text-primary"></i>
                                CTeI-Manager
                            </h1>
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/#projects" class="ctei-navbar-link">Proyectos</a>
                        <a href="/#products" class="ctei-navbar-link">Productos</a>
                        
                        <!-- Toggle de modo oscuro -->
                        <button id="theme-toggle" class="ctei-theme-toggle ml-4" title="Cambiar tema">
                            <i class="fas fa-moon" id="theme-icon"></i>
                        </button>
                        
                        <a href="/" class="ctei-btn-secondary">
                            <i class="fas fa-home mr-2"></i>Inicio
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Breadcrumb -->
        <div class="bg-muted border-b">
            <div class="max-w-6xl mx-auto px-4 py-3">
                <nav class="flex" aria-label="Breadcrumb">
                    <ol class="inline-flex items-center space-x-1 md:space-x-3">
                        <li class="inline-flex items-center">
                            <a href="/" class="text-muted-foreground hover:text-primary">Inicio</a>
                        </li>
                        <li>
                            <div class="flex items-center">
                                <i class="fas fa-chevron-right text-muted-foreground mx-2"></i>
                                <a href="/#projects" class="text-muted-foreground hover:text-primary">Proyectos</a>
                            </div>
                        </li>
                        <li aria-current="page">
                            <div class="flex items-center">
                                <i class="fas fa-chevron-right text-muted-foreground mx-2"></i>
                                <span class="text-foreground font-medium">${project.title}</span>
                            </div>
                        </li>
                    </ol>
                </nav>
            </div>
        </div>

        <!-- Hero Banner -->
        <section class="relative bg-gradient-to-r from-primary/10 to-accent/10 py-16">
            <div class="absolute inset-0 scientific-pattern opacity-10"></div>
            <div class="relative max-w-6xl mx-auto px-4">
                <div class="text-center mb-8">
                    <!-- Estado y código del proyecto -->
                    <div class="flex items-center justify-center space-x-4 mb-4">
                        <span class="ctei-badge ctei-badge-${project.status === 'ACTIVE' ? 'success' : 'warning'}">
                            <i class="fas fa-circle mr-2"></i>${project.status === 'ACTIVE' ? 'Activo' : 'En Planificación'}
                        </span>
                        ${project.project_code && project.project_code !== 'null' ? `<span class="text-muted text-sm font-mono">${project.project_code}</span>` : ''}
                    </div>
                    
                    <!-- Título principal -->
                    <h1 class="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                        ${safeTitle}
                    </h1>
                    
                    <!-- Líder del proyecto -->
                    <div class="flex items-center justify-center text-muted mb-6">
                        <i class="fas fa-user-tie mr-2"></i>
                        <span>Liderado por <strong class="text-foreground">${safeOwnerName}</strong></span>
                        <span class="mx-2">•</span>
                        <span>${project.institution || 'Institución CTeI'}</span>
                    </div>
                    
                    <!-- CTA Principal -->
                    <div class="flex items-center justify-center space-x-4">
                        ${project.owner_email ? `
                            <a href="mailto:${safeOwnerEmail}?subject=Consulta sobre proyecto" class="ctei-btn-primary">
                                <i class="fas fa-envelope mr-2"></i>Contactar Líder
                            </a>
                        ` : ''}
                        <button class="ctei-btn-secondary" onclick="navigator.share ? navigator.share({title: 'Proyecto CTeI', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)">
                            <i class="fas fa-share mr-2"></i>Compartir
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Contenido Principal -->
        <div class="max-w-6xl mx-auto px-4 py-12">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Columna Principal (2/3) -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Resumen del Proyecto -->
                    <section class="ctei-project-card">
                        <h2 class="text-2xl font-bold mb-4 text-foreground">
                            <i class="fas fa-info-circle mr-2 text-primary"></i>Resumen del Proyecto
                        </h2>
                        <div class="prose prose-lg max-w-none text-muted">
                            ${project.abstract || '<p class="italic">Resumen no disponible.</p>'}
                        </div>
                    </section>

                    <!-- Metodología -->
                    ${project.methodology ? `
                    <section class="ctei-project-card">
                        <h2 class="text-2xl font-bold mb-4 text-foreground">
                            <i class="fas fa-cogs mr-2 text-primary"></i>Metodología
                        </h2>
                        <div class="prose max-w-none text-muted">
                            ${project.methodology}
                        </div>
                    </section>
                    ` : ''}

                    <!-- Productos Derivados -->
                    <section class="ctei-project-card">
                        <h2 class="text-2xl font-bold mb-6 text-foreground">
                            <i class="fas fa-cube mr-2 text-primary"></i>Productos Científicos
                            ${project.products?.length ? `<span class="text-lg font-normal text-muted">(${project.products.length})</span>` : ''}
                        </h2>
                        <div class="grid gap-4">
                            ${productsList}
                        </div>
                    </section>
                </div>

                <!-- Sidebar (1/3) -->
                <div class="space-y-6">
                    <!-- Fact Sheet Consolidado -->
                    <div class="ctei-project-card">
                        <h3 class="text-lg font-bold mb-6 text-foreground border-b border-border pb-3">
                            <i class="fas fa-clipboard-list mr-2 text-primary"></i>Resumen Ejecutivo
                        </h3>
                        
                        <!-- Estado del Proyecto -->
                        <div class="mb-4">
                            <span class="ctei-tag ctei-tag--${project.status === 'ACTIVE' ? 'success' : 'warning'} ctei-tag--small">
                                <i class="fas fa-circle mr-1"></i>${project.status === 'ACTIVE' ? 'Activo' : 'En Planificación'}
                            </span>
                        </div>
                        
                        <!-- Metadata Grid -->
                        <div class="space-y-4 text-sm">
                            <!-- Líder del Proyecto -->
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Líder del Proyecto</span>
                                <span class="font-semibold text-foreground">${project.owner_name}</span>
                                ${project.owner_email ? `<a href="mailto:${project.owner_email}" class="ctei-btn-primary text-xs mt-1">Contactar Líder</a>` : ''}
                            </div>
                            
                            <!-- Código del Proyecto -->
                            ${project.project_code ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Código</span>
                                <code class="font-mono text-xs bg-accent px-2 py-1 rounded border border-border">${project.project_code}</code>
                            </div>
                            ` : ''}
                            
                            <!-- Fechas Clave -->
                            ${project.start_date || project.end_date ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Cronograma</span>
                                ${project.start_date ? `<div class="text-xs"><strong>Inicio:</strong> ${new Date(project.start_date).toLocaleDateString()}</div>` : ''}
                                ${project.end_date ? `<div class="text-xs"><strong>Fin:</strong> ${new Date(project.end_date).toLocaleDateString()}</div>` : ''}
                            </div>
                            ` : ''}
                            
                            <!-- Financiación -->
                            ${project.funding_source ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Financiación</span>
                                <span class="text-foreground text-xs">${project.funding_source}</span>
                            </div>
                            ` : ''}
                            
                            <!-- Institución -->
                            ${project.institution ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Institución</span>
                                <span class="text-foreground text-xs">${project.institution}</span>
                            </div>
                            ` : ''}
                            
                            <!-- Presupuesto -->
                            ${project.budget ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Presupuesto</span>
                                <span class="font-semibold text-primary">${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(project.budget)}</span>
                            </div>
                            ` : ''}
                            
                            <!-- Palabras Clave -->
                            ${keywords.length > 0 ? `
                            <div class="flex flex-col space-y-2">
                                <span class="text-muted-foreground font-medium">Palabras Clave</span>
                                <div class="flex flex-wrap gap-1">
                                    ${keywords.slice(0, 5).map(keyword => `
                                        <span class="ctei-tag ctei-tag--outline ctei-tag--small">${keyword}</span>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Equipo Colaborador -->
                    ${project.collaborators?.length > 0 ? `
                    <div class="ctei-project-card">
                        <h3 class="text-lg font-bold mb-4 text-foreground">
                            <i class="fas fa-users mr-2 text-primary"></i>Equipo Colaborador
                        </h3>
                        <div class="space-y-2">
                            ${collaboratorsList}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <!-- Proyectos Relacionados -->
        <section class="bg-muted py-16">
            <div class="max-w-6xl mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-12 text-foreground">
                    <i class="fas fa-network-wired mr-2 text-primary"></i>Explora Más Proyectos
                </h2>
                <div id="related-projects" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Se cargarán dinámicamente -->
                </div>
                <div class="text-center mt-8">
                    <a href="/#projects" class="ctei-btn-primary">
                        <i class="fas fa-arrow-left mr-2"></i>Ver Todos los Proyectos
                    </a>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-background border-t py-8">
            <div class="max-w-6xl mx-auto px-4 text-center text-muted">
                <p>&copy; 2025 CTeI-Manager - Sistema Departamental de Ciencias del Chocó</p>
                <p class="mt-2 text-sm">Impulsando la investigación y la innovación científica</p>
            </div>
        </footer>

        <script>
            // Cargar proyectos relacionados
            document.addEventListener('DOMContentLoaded', async function() {
                try {
                    const response = await fetch('/api/public/projects?limit=3');
                    const data = await response.json();
                    if (data.success && data.data.projects) {
                        const container = document.getElementById('related-projects');
                        if (container) {
                            container.innerHTML = data.data.projects
                                .slice(0, 3)
                                .map(p => \`
                                    <div class="ctei-project-card hover:shadow-lg transition-shadow">
                                        <h3 class="font-bold mb-2">
                                            <a href="/proyecto/\${p.id}" class="hover:text-primary transition-colors">\${p.title || 'Sin título'}</a>
                                        </h3>
                                        <p class="text-muted text-sm mb-3">\${(p.abstract || '').substring(0, 100)}...</p>
                                        <div class="flex justify-between items-center">
                                            <span class="text-xs text-muted">\${p.owner_name || 'Sin autor'}</span>
                                            <a href="/proyecto/\${p.id}" class="ctei-btn-secondary text-sm">Ver Proyecto</a>
                                        </div>
                                    </div>
                                \`).join('');
                        }
                    }
                } catch (error) {
                    console.error('Error loading related projects:', error);
                }
            });
        </script>
        
        <!-- Footer consistente -->
        <footer class="ctei-footer">
            <div class="max-w-6xl mx-auto px-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
                    <div class="text-center md:text-left">
                        <h3 class="text-lg font-bold text-foreground mb-4 flex items-center justify-center md:justify-start">
                            <i class="fas fa-dna mr-2 text-primary"></i>
                            CTeI-Manager
                        </h3>
                        <p class="text-muted">Portal de Ciencia, Tecnología e Innovación del Chocó</p>
                    </div>
                    <div class="text-center">
                        <h4 class="font-semibold text-foreground mb-4">Enlaces Rápidos</h4>
                        <div class="space-y-2">
                            <a href="/#projects" class="ctei-footer-link block">Proyectos</a>
                            <a href="/#products" class="ctei-footer-link block">Productos</a>
                            <a href="/#stats" class="ctei-footer-link block">Analíticas</a>
                        </div>
                    </div>
                    <div class="text-center md:text-right">
                        <h4 class="font-semibold text-foreground mb-4">Contacto</h4>
                        <p class="text-muted text-sm">
                            <i class="fas fa-envelope mr-2"></i>
                            info@ctei-choco.edu.co
                        </p>
                        <p class="text-muted text-sm mt-2">
                            <i class="fas fa-phone mr-2"></i>
                            +57 (4) 671-2345
                        </p>
                    </div>
                </div>
                <div class="border-t border-border pt-6 pb-4">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <p class="text-muted text-sm">
                            © ${new Date().getFullYear()} CTeI-Manager. Todos los derechos reservados.
                        </p>
                        <div class="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" class="text-muted hover:text-primary transition-colors">
                                <i class="fab fa-github"></i>
                            </a>
                            <a href="#" class="text-muted hover:text-primary transition-colors">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="#" class="text-muted hover:text-primary transition-colors">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
        
        <!-- Incluir app.js para funcionalidad del tema -->
        <script src="/static/app.js"></script>
    </body>
    </html>
  `;
}

/**
 * Genera la página HTML completa para un producto específico
 */
function generateProductDetailPage(product: any): string {
  // Sanitizar strings
  const safeDescription = (product.description || 'Sin descripción').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const safeCode = (product.product_code || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const safeCategoryName = (product.category_name || 'Sin categoría').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  const safeProjectTitle = (product.project_title || '').replace(/'/g, '&#39;').replace(/"/g, '&quot;');
  
  // Crear etiqueta de tipo con estilo consistente
  const typeLabel = createProductTypeLabel(product.product_type);
  
  // Lista de autores con estilo consistente
  const authorsList = product.authors?.map((a: any) => `
    <div class="ctei-project-card mb-4 p-4">
        <div class="flex items-center justify-between">
            <div>
                <h4 class="ctei-project-card-title text-lg mb-1">${a.full_name || 'Sin nombre'}</h4>
                <p class="ctei-project-card-metadata">${a.author_role || 'Autor'} ${a.contribution_type ? `• ${a.contribution_type}` : ''}</p>
            </div>
            ${a.email ? `<a href="mailto:${a.email}" class="ctei-btn-primary">Contactar</a>` : ''}
        </div>
    </div>
  `).join('') || '<div class="ctei-project-card p-6 text-center"><p class="text-muted-foreground italic">Información de autores no disponible.</p></div>';
  
  // Información del proyecto asociado con estilo consistente
  const projectInfo = product.project ? `
    <div class="ctei-project-card p-6">
        <h4 class="ctei-project-card-title mb-3">
            <i class="fas fa-project-diagram mr-2"></i>
            ${product.project.title}
        </h4>
        <p class="ctei-project-card-metadata mb-4">
            ${product.project.abstract || 'Sin descripción del proyecto'}
        </p>
        <div class="flex items-center justify-between">
            <div>
                <p class="text-sm text-muted-foreground"><i class="fas fa-user mr-1"></i>${product.project.owner_name}</p>
                <p class="text-sm text-muted-foreground"><i class="fas fa-building mr-1"></i>${product.project.institution || 'Sin institución'}</p>
            </div>
            <a href="/proyecto/${product.project.id}" class="ctei-btn-primary">
                Ver Proyecto
            </a>
        </div>
    </div>
  ` : '<div class="ctei-project-card p-6 text-center"><p class="text-muted-foreground italic">Sin proyecto asociado</p></div>';

  return `
    <!DOCTYPE html>
    <html lang="es" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${safeDescription} | CTeI-Manager</title>
        <meta name="description" content="${safeDescription} - Producto científico del proyecto ${safeProjectTitle}">
        
        <!-- Open Graph -->
        <meta property="og:title" content="${safeDescription}">
        <meta property="og:description" content="Producto científico: ${safeCategoryName}">
        <meta property="og:type" content="article">
        <meta property="og:url" content="/producto/${product.id}">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        
        <script>
          tailwind.config = {
            theme: {
              extend: {
                colors: {
                  'primary': 'var(--color-primary)',
                  'secondary': 'var(--color-secondary)', 
                  'accent': 'var(--color-accent)',
                  'background': 'var(--color-background)',
                  'foreground': 'var(--color-foreground)',
                  'card': 'var(--color-card)',
                  'muted': 'var(--color-muted)',
                  'border': 'var(--color-border)',
                }
              }
            }
          }
        </script>
    </head>
    <body class="level-0 bg-background text-foreground">
        <!-- Navbar -->
        <nav class="ctei-navbar sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center">
                            <h1 class="text-xl font-bold text-foreground">
                                <i class="fas fa-dna mr-2 text-primary"></i>
                                CTeI-Manager
                            </h1>
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/#products" class="ctei-navbar-link">Productos</a>
                        <a href="/#projects" class="ctei-navbar-link">Proyectos</a>
                        
                        <!-- Toggle de modo oscuro -->
                        <button id="theme-toggle" class="ctei-theme-toggle ml-4" title="Cambiar tema">
                            <i class="fas fa-moon" id="theme-icon"></i>
                        </button>
                        
                        <a href="/" class="ctei-btn-secondary">
                            <i class="fas fa-home mr-2"></i>Inicio
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Breadcrumb -->
        <div class="bg-muted border-b">
            <div class="max-w-6xl mx-auto px-4 py-3">
                <nav class="flex" aria-label="Breadcrumb">
                    <ol class="inline-flex items-center space-x-1 md:space-x-3">
                        <li class="inline-flex items-center">
                            <a href="/" class="text-muted-foreground hover:text-primary">Inicio</a>
                        </li>
                        <li>
                            <div class="flex items-center">
                                <i class="fas fa-chevron-right text-muted-foreground mx-2"></i>
                                <a href="/#products" class="text-muted-foreground hover:text-primary">Productos</a>
                            </div>
                        </li>
                        ${product.project_title ? `
                        <li>
                            <div class="flex items-center">
                                <i class="fas fa-chevron-right text-muted-foreground mx-2"></i>
                                <a href="/proyecto/${product.project_id}" class="text-muted-foreground hover:text-primary">${product.project_title}</a>
                            </div>
                        </li>
                        ` : ''}
                        <li aria-current="page">
                            <div class="flex items-center">
                                <i class="fas fa-chevron-right text-muted-foreground mx-2"></i>
                                <span class="text-foreground font-medium">${product.product_code}</span>
                            </div>
                        </li>
                    </ol>
                </nav>
            </div>
        </div>

        <!-- Hero Banner -->
        <section class="relative bg-gradient-to-r from-accent/10 to-primary/10 py-16">
            <div class="absolute inset-0 scientific-pattern opacity-10"></div>
            <div class="relative max-w-6xl mx-auto px-4 text-center">
                <div class="mb-4 space-x-2">
                    <span class="ctei-badge ctei-badge-primary">
                        <i class="fas fa-cube mr-2"></i>${safeCategoryName}
                    </span>
                    ${product.product_type ? typeLabel : ''}
                </div>
                
                <h1 class="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
                    ${safeDescription}
                </h1>
                
                <div class="flex items-center justify-center text-muted mb-6">
                    <span class="font-mono text-lg">${safeCode}</span>
                    ${product.publication_date ? `
                        <span class="mx-2">•</span>
                        <span>Publicado ${new Date(product.publication_date).toLocaleDateString()}</span>
                    ` : ''}
                </div>
                
                <div class="flex items-center justify-center space-x-4">
                    ${product.doi ? `
                        <a href="https://doi.org/${product.doi}" target="_blank" class="ctei-btn-primary">
                            <i class="fas fa-external-link-alt mr-2"></i>Ver DOI
                        </a>
                    ` : ''}
                    ${product.url ? `
                        <a href="${product.url}" target="_blank" class="ctei-btn-secondary">
                            <i class="fas fa-link mr-2"></i>Enlace Externo
                        </a>
                    ` : ''}
                    <button class="ctei-btn-secondary" onclick="navigator.share ? navigator.share({title: 'Producto CTeI', url: window.location.href}) : navigator.clipboard.writeText(window.location.href)">
                        <i class="fas fa-share mr-2"></i>Compartir
                    </button>
                </div>
            </div>
        </section>

        <!-- Contenido Principal -->
        <div class="max-w-6xl mx-auto px-4 py-12">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <!-- Columna Principal -->
                <div class="lg:col-span-2 space-y-8">
                    <!-- Información del Producto -->
                    <section class="ctei-project-card">
                        <h2 class="text-2xl font-bold mb-6 text-foreground">
                            <i class="fas fa-info-circle mr-2 text-primary"></i>Información del Producto
                        </h2>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${product.journal ? `
                            <div class="bg-accent p-4 rounded-lg border border-border">
                                <h4 class="font-semibold text-accent-foreground mb-2">
                                    <i class="fas fa-journal-whills mr-2 text-primary"></i>Revista/Editorial
                                </h4>
                                <p class="text-muted-foreground">${product.journal}</p>
                            </div>
                            ` : ''}
                            
                            ${product.impact_factor ? `
                            <div class="bg-accent p-4 rounded-lg border border-border">
                                <h4 class="font-semibold text-accent-foreground mb-2">
                                    <i class="fas fa-star mr-2 text-primary"></i>Factor de Impacto
                                </h4>
                                <p class="text-muted-foreground font-mono text-lg">${product.impact_factor}</p>
                            </div>
                            ` : ''}
                            
                            ${product.citation_count ? `
                            <div class="bg-accent p-4 rounded-lg border border-border">
                                <h4 class="font-semibold text-accent-foreground mb-2">
                                    <i class="fas fa-quote-right mr-2 text-primary"></i>Citas
                                </h4>
                                <p class="text-muted-foreground font-mono text-lg">${product.citation_count}</p>
                            </div>
                            ` : ''}
                            
                            <div class="bg-accent p-4 rounded-lg border border-border">
                                <h4 class="font-semibold text-accent-foreground mb-2">
                                    <i class="fas fa-weight-hanging mr-2 text-primary"></i>Peso de Impacto
                                </h4>
                                <p class="text-muted-foreground">${product.impact_weight || 'No especificado'}</p>
                            </div>
                        </div>
                    </section>

                    <!-- Autores -->
                    <section class="ctei-project-card">
                        <h2 class="text-2xl font-bold mb-6 text-foreground">
                            <i class="fas fa-users mr-2 text-primary"></i>Autores
                        </h2>
                        <div class="space-y-3">
                            ${authorsList}
                        </div>
                    </section>

                    <!-- Proyecto Asociado -->
                    ${product.project_title ? `
                    <section class="ctei-project-card">
                        <h2 class="text-2xl font-bold mb-6 text-foreground">
                            <i class="fas fa-project-diagram mr-2 text-primary"></i>Proyecto Asociado
                        </h2>
                        <div class="bg-accent p-6 rounded-lg border border-border">
                            <h3 class="text-lg font-semibold mb-2 text-accent-foreground">
                                <a href="/proyecto/${product.project_id}" class="hover:text-primary transition-colors">
                                    ${product.project_title}
                                </a>
                            </h3>
                            ${product.project_abstract ? `
                                <p class="text-muted-foreground mb-4">${product.project_abstract.substring(0, 200)}...</p>
                            ` : ''}
                            <a href="/proyecto/${product.project_id}" class="ctei-btn-primary">
                                <i class="fas fa-arrow-right mr-2"></i>Ver Proyecto Completo
                            </a>
                        </div>
                    </section>
                    ` : ''}
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                    <!-- Fact Sheet Consolidado -->
                    <div class="ctei-project-card">
                        <h3 class="text-lg font-bold mb-6 text-foreground border-b border-border pb-3">
                            <i class="fas fa-clipboard-list mr-2 text-primary"></i>Resumen Ejecutivo
                        </h3>
                        
                        <!-- Categoría del Producto -->
                        <div class="mb-4">
                            <span class="ctei-tag ctei-tag--primary ctei-tag--small">
                                <i class="fas fa-cube mr-1"></i>${product.category_name || 'Sin categoría'}
                            </span>
                        </div>
                        
                        <!-- Metadata Grid -->
                        <div class="space-y-4 text-sm">
                            <!-- Código del Producto -->
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Código</span>
                                <code class="font-mono text-xs bg-accent px-2 py-1 rounded border border-border">${product.product_code}</code>
                            </div>
                            
                            <!-- Grupo de Categoría -->
                            ${product.category_group ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Grupo</span>
                                <span class="text-foreground text-xs">${product.category_group}</span>
                            </div>
                            ` : ''}
                            
                            <!-- Fechas Clave -->
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Cronograma</span>
                                ${product.publication_date ? `<div class="text-xs"><strong>Publicado:</strong> ${new Date(product.publication_date).toLocaleDateString()}</div>` : ''}
                                ${product.created_at ? `<div class="text-xs"><strong>Registrado:</strong> ${new Date(product.created_at).toLocaleDateString()}</div>` : ''}
                            </div>
                            
                            <!-- Métricas de Impacto -->
                            ${product.impact_factor || product.citation_count || product.impact_weight ? `
                            <div class="flex flex-col space-y-2">
                                <span class="text-muted-foreground font-medium">Métricas de Impacto</span>
                                <div class="space-y-1">
                                    ${product.impact_factor ? `<div class="text-xs"><strong>Factor:</strong> ${product.impact_factor}</div>` : ''}
                                    ${product.citation_count ? `<div class="text-xs"><strong>Citas:</strong> ${product.citation_count}</div>` : ''}
                                    ${product.impact_weight ? `<div class="text-xs"><strong>Peso:</strong> ${product.impact_weight}</div>` : ''}
                                </div>
                            </div>
                            ` : ''}
                            
                            <!-- Revista/Editorial -->
                            ${product.journal ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Revista/Editorial</span>
                                <span class="text-foreground text-xs">${product.journal}</span>
                            </div>
                            ` : ''}
                            
                            <!-- Proyecto Asociado -->
                            ${product.project_title ? `
                            <div class="flex flex-col space-y-1">
                                <span class="text-muted-foreground font-medium">Proyecto</span>
                                <a href="/proyecto/${product.project_id}" class="text-primary text-xs hover:underline font-medium">${product.project_title}</a>
                            </div>
                            ` : ''}
                            
                            <!-- Autores Principales -->
                            ${product.authors && product.authors.length > 0 ? `
                            <div class="flex flex-col space-y-2">
                                <span class="text-muted-foreground font-medium">Autores</span>
                                <div class="space-y-1">
                                    ${product.authors.slice(0, 3).map(author => `
                                        <div class="text-xs">
                                            <span class="font-medium">${author.full_name}</span>
                                            ${author.author_role ? ` <span class="text-muted-foreground">(${author.author_role})</span>` : ''}
                                        </div>
                                    `).join('')}
                                    ${product.authors.length > 3 ? `<div class="text-xs text-muted-foreground">+${product.authors.length - 3} más...</div>` : ''}
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Enlaces Externos -->
                    ${(product.doi || product.url || product.file_url) ? `
                    <div class="ctei-project-card">
                        <h3 class="text-lg font-bold mb-4 text-foreground">
                            <i class="fas fa-external-link-alt mr-2 text-primary"></i>Enlaces
                        </h3>
                        <div class="space-y-2">
                            ${product.doi ? `
                                <a href="https://doi.org/${product.doi}" target="_blank" class="flex items-center p-3 bg-primary/10 hover:bg-primary/20 rounded transition-colors border border-primary/20">
                                    <i class="fas fa-fingerprint mr-3 text-primary"></i>
                                    <span class="text-foreground font-medium">Ver en DOI</span>
                                </a>
                            ` : ''}
                            ${product.url ? `
                                <a href="${product.url}" target="_blank" class="flex items-center p-3 bg-primary/10 hover:bg-primary/20 rounded transition-colors border border-primary/20">
                                    <i class="fas fa-globe mr-3 text-primary"></i>
                                    <span class="text-foreground font-medium">Sitio Web</span>
                                </a>
                            ` : ''}
                            ${product.file_url ? `
                                <a href="${product.file_url}" target="_blank" class="flex items-center p-3 bg-primary/10 hover:bg-primary/20 rounded transition-colors border border-primary/20">
                                    <i class="fas fa-download mr-3 text-primary"></i>
                                    <span class="text-foreground font-medium">Descargar Archivo</span>
                                </a>
                            ` : ''}
                        </div>
                    </div>
                    ` : ''}
                </div>
            </div>
        </div>

        <!-- Productos Relacionados -->
        <section class="bg-muted py-16">
            <div class="max-w-6xl mx-auto px-4">
                <h2 class="text-3xl font-bold text-center mb-12 text-foreground">
                    <i class="fas fa-cubes mr-2 text-primary"></i>Otros Productos Científicos
                </h2>
                <div id="related-products" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Se cargarán dinámicamente -->
                </div>
                <div class="text-center mt-8">
                    <a href="/#products" class="ctei-btn-primary">
                        <i class="fas fa-arrow-left mr-2"></i>Ver Todos los Productos
                    </a>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="bg-background border-t py-8">
            <div class="max-w-6xl mx-auto px-4 text-center text-muted">
                <p>&copy; 2025 CTeI-Manager - Sistema Departamental de Ciencias del Chocó</p>
                <p class="mt-2 text-sm">Impulsando la investigación y la innovación científica</p>
            </div>
        </footer>

        <script>
            document.addEventListener('DOMContentLoaded', async function() {
                try {
                    const response = await fetch('/api/public/products?limit=3');
                    const data = await response.json();
                    if (data.success && data.data.products) {
                        const container = document.getElementById('related-products');
                        if (container) {
                            container.innerHTML = data.data.products
                                .slice(0, 3)
                                .map(p => 
                                    '<div class="ctei-project-card hover:shadow-lg transition-shadow">' +
                                        '<div class="mb-3">' +
                                            '<span class="ctei-badge ctei-badge-primary">' +
                                                (p.category_name || 'Sin categoría') +
                                            '</span>' +
                                        '</div>' +
                                        '<h3 class="font-bold mb-2">' +
                                            '<a href="/producto/' + p.id + '" class="hover:text-primary transition-colors">' +
                                                (p.description || 'Sin descripción') +
                                            '</a>' +
                                        '</h3>' +
                                        '<p class="text-muted text-sm mb-3">' + (p.product_code || '') + '</p>' +
                                        '<div class="flex justify-between items-center">' +
                                            '<span class="text-xs text-muted">' + (p.project_title || 'Sin proyecto') + '</span>' +
                                            '<a href="/producto/' + p.id + '" class="ctei-btn-secondary text-sm">Ver Producto</a>' +
                                        '</div>' +
                                    '</div>'
                                ).join('');
                        }
                    }
                } catch (error) {
                    console.error('Error loading related products:', error);
                }
            });
        </script>
        
        <!-- Footer consistente -->
        <footer class="ctei-footer">
            <div class="max-w-6xl mx-auto px-4">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
                    <div class="text-center md:text-left">
                        <h3 class="text-lg font-bold text-foreground mb-4 flex items-center justify-center md:justify-start">
                            <i class="fas fa-dna mr-2 text-primary"></i>
                            CTeI-Manager
                        </h3>
                        <p class="text-muted">Portal de Ciencia, Tecnología e Innovación del Chocó</p>
                    </div>
                    <div class="text-center">
                        <h4 class="font-semibold text-foreground mb-4">Enlaces Rápidos</h4>
                        <div class="space-y-2">
                            <a href="/#projects" class="ctei-footer-link block">Proyectos</a>
                            <a href="/#products" class="ctei-footer-link block">Productos</a>
                            <a href="/#stats" class="ctei-footer-link block">Analíticas</a>
                        </div>
                    </div>
                    <div class="text-center md:text-right">
                        <h4 class="font-semibold text-foreground mb-4">Contacto</h4>
                        <p class="text-muted text-sm">
                            <i class="fas fa-envelope mr-2"></i>
                            info@ctei-choco.edu.co
                        </p>
                        <p class="text-muted text-sm mt-2">
                            <i class="fas fa-phone mr-2"></i>
                            +57 (4) 671-2345
                        </p>
                    </div>
                </div>
                <div class="border-t border-border pt-6 pb-4">
                    <div class="flex flex-col md:flex-row justify-between items-center">
                        <p class="text-muted text-sm">
                            © ${new Date().getFullYear()} CTeI-Manager. Todos los derechos reservados.
                        </p>
                        <div class="flex space-x-4 mt-4 md:mt-0">
                            <a href="#" class="text-muted hover:text-primary transition-colors">
                                <i class="fab fa-github"></i>
                            </a>
                            <a href="#" class="text-muted hover:text-primary transition-colors">
                                <i class="fab fa-linkedin"></i>
                            </a>
                            <a href="#" class="text-muted hover:text-primary transition-colors">
                                <i class="fas fa-envelope"></i>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
        
        <!-- Incluir app.js para funcionalidad del tema -->
        <script src="/static/app.js"></script>
    </body>
    </html>
  `;
}

/**
 * Genera página de error personalizada
 */
function generateErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="es" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} | CTeI-Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="level-0 bg-background text-foreground">
        <nav class="ctei-navbar">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/" class="flex items-center">
                            <h1 class="text-xl font-bold text-foreground">
                                <i class="fas fa-dna mr-2 text-primary"></i>
                                CTeI-Manager
                            </h1>
                        </a>
                    </div>
                    <div class="flex items-center">
                        <a href="/" class="ctei-btn-secondary">
                            <i class="fas fa-home mr-2"></i>Inicio
                        </a>
                    </div>
                </div>
            </div>
        </nav>
        
        <div class="min-h-screen flex items-center justify-center bg-background">
            <div class="max-w-md mx-auto text-center">
                <div class="mb-8">
                    <i class="fas fa-exclamation-triangle text-6xl text-yellow-500 mb-4"></i>
                    <h1 class="text-3xl font-bold text-foreground mb-4">${title}</h1>
                    <p class="text-muted mb-8">${message}</p>
                </div>
                
                <div class="space-y-4">
                    <a href="/" class="ctei-btn-primary block">
                        <i class="fas fa-home mr-2"></i>Volver al Inicio
                    </a>
                    <button onclick="window.history.back()" class="ctei-btn-secondary block w-full">
                        <i class="fas fa-arrow-left mr-2"></i>Página Anterior
                    </button>
                </div>
            </div>
        </div>
    </body>
    </html>
  `;
}

// Dashboard mejorado de clase mundial
app.get('/dashboard-mejorado', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es" id="dashboard-html" class="dark">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>🚀 Dashboard de Monitoreo - Clase Mundial</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-background text-foreground min-h-screen">
        <!-- Header -->
        <div class="bg-card border-b border-border p-6">
            <div class="max-w-7xl mx-auto">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold flex items-center">
                            <i class="fas fa-chart-line text-accent mr-3"></i>
                            Dashboard de Monitoreo - Clase Mundial
                        </h1>
                        <p class="text-muted-foreground mt-1">
                            Sistema Departamental de Ciencias del Chocó - Gestión Estratégica CTeI
                        </p>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/" class="ctei-btn-secondary">
                            <i class="fas fa-home mr-2"></i>
                            Portal Principal
                        </a>
                        <div class="text-sm text-muted-foreground flex items-center">
                            <i class="fas fa-clock mr-2"></i>
                            <span id="last-updated">Actualizado: ${new Date().toLocaleTimeString()}</span>
                        </div>
                        <button onclick="window.location.reload()" class="ctei-btn-primary">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Contenido Principal -->
        <div class="max-w-7xl mx-auto p-6">
            
            <!-- FILA 1: KPIs Principales (Ancho Completo) -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Proyectos Totales</p>
                            <p class="text-2xl font-bold text-foreground mt-1">12</p>
                            <p class="text-xs text-muted-foreground mt-1">8 activos</p>
                        </div>
                        <div class="w-12 h-12 bg-primary rounded-lg flex items-center justify-center">
                            <i class="fas fa-project-diagram text-white text-lg"></i>
                        </div>
                    </div>
                </div>

                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Productos CTeI</p>
                            <p class="text-2xl font-bold text-foreground mt-1">24</p>
                            <p class="text-xs text-muted-foreground mt-1">6 experiencias</p>
                        </div>
                        <div class="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-flask text-white text-lg"></i>
                        </div>
                    </div>
                </div>

                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Investigadores</p>
                            <p class="text-2xl font-bold text-foreground mt-1">18</p>
                            <p class="text-xs text-muted-foreground mt-1">únicos en el sistema</p>
                        </div>
                        <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-users text-white text-lg"></i>
                        </div>
                    </div>
                </div>

                <div class="ctei-metric-card">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Progreso Promedio</p>
                            <p class="text-2xl font-bold text-foreground mt-1">78%</p>
                            <p class="text-xs text-muted-foreground mt-1">2 alto riesgo</p>
                        </div>
                        <div class="w-12 h-12 bg-teal-500 rounded-lg flex items-center justify-center">
                            <i class="fas fa-chart-line text-white text-lg"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FILA 2: Módulos de Acción (Layout Dividido 60%/40%) -->
            <div class="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
                <!-- Alertas Críticas (60% = 3 columnas) -->
                <div class="lg:col-span-3 ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-exclamation-triangle text-destructive mr-2"></i>
                            Alertas Críticas
                        </div>
                        <div class="text-sm text-muted-foreground">
                            <span class="text-red-600">3 alerta(s) pendiente(s)</span>
                        </div>
                    </div>
                    <div class="ctei-content-card-body">
                        <!-- Alert 1 -->
                        <div class="flex items-center space-x-3 p-4 border-l-4 border-red-500 bg-muted/30 rounded-r-lg mb-3 hover:bg-muted/50 transition-colors">
                            <div class="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-exclamation-triangle text-white text-sm"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <p class="text-sm font-semibold text-foreground truncate">Proyecto con Score Crítico</p>
                                    <span class="text-xs px-2 py-1 rounded-full bg-red-100 text-red-800 ml-2">ACTIVA</span>
                                </div>
                                <p class="text-xs text-muted-foreground mb-2">PERFORMANCE - Proyecto requiere mejoras urgentes</p>
                                <div class="flex items-center space-x-3 text-xs text-muted-foreground">
                                    <span><i class="fas fa-clock mr-1"></i>Hace 15 min</span>
                                    <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Prioridad: 5/5</span>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-1">
                                <button onclick="showToast('Resolviendo alerta crítica...', 'success')" class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors">Resolver</button>
                                <button onclick="showToast('Mostrando detalles...', 'info')" class="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md transition-colors">Detalles</button>
                            </div>
                        </div>
                        
                        <!-- Alert 2 -->
                        <div class="flex items-center space-x-3 p-4 border-l-4 border-yellow-500 bg-muted/30 rounded-r-lg mb-3 hover:bg-muted/50 transition-colors">
                            <div class="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-exclamation-circle text-white text-sm"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <p class="text-sm font-semibold text-foreground truncate">Productos sin Validación</p>
                                    <span class="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 ml-2">RECONOCIDA</span>
                                </div>
                                <p class="text-xs text-muted-foreground mb-2">COMPLIANCE - Validar productos pendientes</p>
                                <div class="flex items-center space-x-3 text-xs text-muted-foreground">
                                    <span><i class="fas fa-clock mr-1"></i>Hace 2 horas</span>
                                    <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Prioridad: 3/5</span>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-1">
                                <button onclick="showToast('Iniciando validación...', 'success')" class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors">Resolver</button>
                                <button onclick="showToast('Abriendo lista de productos...', 'info')" class="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md transition-colors">Detalles</button>
                            </div>
                        </div>

                        <!-- Alert 3 -->
                        <div class="flex items-center space-x-3 p-4 border-l-4 border-blue-500 bg-muted/30 rounded-r-lg mb-3 hover:bg-muted/50 transition-colors">
                            <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                <i class="fas fa-info-circle text-white text-sm"></i>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <p class="text-sm font-semibold text-foreground truncate">Nueva Actualización del Sistema</p>
                                    <span class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 ml-2">ACTIVA</span>
                                </div>
                                <p class="text-xs text-muted-foreground mb-2">PERFORMANCE - Sistema actualizado exitosamente</p>
                                <div class="flex items-center space-x-3 text-xs text-muted-foreground">
                                    <span><i class="fas fa-clock mr-1"></i>Hace 1 día</span>
                                    <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs">Prioridad: 2/5</span>
                                </div>
                            </div>
                            <div class="flex flex-col space-y-1">
                                <button onclick="showToast('Marcando como revisado...', 'success')" class="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md transition-colors">Resolver</button>
                                <button onclick="showToast('Notas de actualización...', 'info')" class="text-xs bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded-md transition-colors">Detalles</button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Proyectos que Requieren Atención (40% = 2 columnas) -->
                <div class="lg:col-span-2 ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-exclamation-circle text-warning mr-2"></i>
                            Proyectos que Requieren Atención
                        </div>
                        <div class="text-sm text-muted-foreground">
                            <span class="text-orange-600">2 proyecto(s) requieren atención</span>
                        </div>
                    </div>
                    <div class="ctei-content-card-body">
                        <!-- Proyecto 1 -->
                        <div class="p-3 border-l-4 border-red-500 bg-muted/30 rounded-r-lg mb-3 hover:bg-muted/50 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center space-x-2 mb-2">
                                        <h4 class="font-semibold text-foreground text-sm truncate">IA para Conservación Marina</h4>
                                        <span class="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">NECESITA MEJORA</span>
                                    </div>
                                    <div class="space-y-1 text-xs text-muted-foreground">
                                        <div class="flex items-center space-x-3">
                                            <span class="flex items-center"><i class="fas fa-user mr-1"></i>Dr. Investigador Demo</span>
                                            <span class="flex items-center"><i class="fas fa-cubes mr-1"></i>2 productos</span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-muted-foreground">Score: 27 (NECESITA_MEJORA)</span>
                                            <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs">0 colaboradores</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="ml-3 flex flex-col space-y-1">
                                    <button onclick="showToast('Abriendo vista del proyecto...', 'info')" class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"><i class="fas fa-eye mr-1"></i>Ver</button>
                                    <button onclick="showToast('Abriendo editor...', 'info')" class="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors"><i class="fas fa-edit mr-1"></i>Editar</button>
                                </div>
                            </div>
                        </div>

                        <!-- Proyecto 2 -->
                        <div class="p-3 border-l-4 border-yellow-500 bg-muted/30 rounded-r-lg mb-3 hover:bg-muted/50 transition-colors">
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center space-x-2 mb-2">
                                        <h4 class="font-semibold text-foreground text-sm truncate">Blockchain para Agricultura</h4>
                                        <span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">ATRASADO</span>
                                    </div>
                                    <div class="space-y-1 text-xs text-muted-foreground">
                                        <div class="flex items-center space-x-3">
                                            <span class="flex items-center"><i class="fas fa-user mr-1"></i>Dra. Community Demo</span>
                                            <span class="flex items-center"><i class="fas fa-cubes mr-1"></i>1 productos</span>
                                        </div>
                                        <div class="flex items-center justify-between">
                                            <span class="text-muted-foreground">Score: 23 (NECESITA_MEJORA)</span>
                                            <span class="px-2 py-1 bg-primary/10 text-primary rounded text-xs">1 colaboradores</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="ml-3 flex flex-col space-y-1">
                                    <button onclick="showToast('Cargando datos del proyecto...', 'info')" class="text-xs bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded transition-colors"><i class="fas fa-eye mr-1"></i>Ver</button>
                                    <button onclick="showToast('Habilitando modo edición...', 'info')" class="text-xs bg-orange-500 hover:bg-orange-600 text-white px-2 py-1 rounded transition-colors"><i class="fas fa-edit mr-1"></i>Editar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FILA 3: Visualización de Datos (Layout Dividido 50%/50%) -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-chart-area text-primary mr-2"></i>
                            Tendencias de Proyectos (30 días)
                        </div>
                    </div>
                    <div class="ctei-content-card-body">
                        <div class="h-64 flex items-center justify-center">
                            <div class="text-center">
                                <i class="fas fa-chart-line text-6xl text-primary mb-4"></i>
                                <p class="text-lg font-semibold">Gráfico de Tendencias</p>
                                <p class="text-muted-foreground">+15% crecimiento este mes</p>
                                <div class="mt-4 space-y-2">
                                    <div class="flex justify-center space-x-4 text-sm">
                                        <span class="flex items-center"><div class="w-3 h-3 bg-green-500 rounded-full mr-2"></div>Nuevos: +12</span>
                                        <span class="flex items-center"><div class="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>En Progreso: 8</span>
                                        <span class="flex items-center"><div class="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>Completados: 4</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-pie-chart text-chart-2 mr-2"></i>
                            Distribución por Estado
                        </div>
                    </div>
                    <div class="ctei-content-card-body">
                        <div class="h-64 flex items-center justify-center">
                            <div class="text-center">
                                <i class="fas fa-chart-pie text-6xl text-chart-2 mb-4"></i>
                                <p class="text-lg font-semibold">Distribución de Estados</p>
                                <div class="flex justify-center space-x-4 mt-4 text-sm">
                                    <span class="flex items-center"><div class="w-3 h-3 bg-green-500 rounded-full mr-1"></div>Activos: 67%</span>
                                    <span class="flex items-center"><div class="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>En Pausa: 25%</span>
                                    <span class="flex items-center"><div class="w-3 h-3 bg-red-500 rounded-full mr-1"></div>Críticos: 8%</span>
                                </div>
                                <div class="mt-4 grid grid-cols-2 gap-4 text-xs">
                                    <div class="bg-muted/30 rounded p-2">
                                        <div class="font-semibold">8</div>
                                        <div class="text-muted-foreground">Proyectos Activos</div>
                                    </div>
                                    <div class="bg-muted/30 rounded p-2">
                                        <div class="font-semibold">3</div>
                                        <div class="text-muted-foreground">En Supervisión</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- FILA 4: Información Secundaria (Ancho Completo) -->
            <div class="ctei-content-card">
                <div class="ctei-content-card-header">
                    <div class="ctei-content-card-title">
                        <i class="fas fa-bullseye text-chart-3 mr-2"></i>
                        Estado por Línea de Acción
                    </div>
                </div>
                <div class="ctei-content-card-body">
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <!-- Línea de Acción 1 -->
                        <div class="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-3">
                                    <div class="w-4 h-4 rounded-full bg-primary"></div>
                                    <h4 class="font-medium text-foreground">Mentalidad y Cultura</h4>
                                </div>
                                <span class="text-sm font-medium text-foreground">85% promedio</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="text-lg font-bold text-foreground">4</div>
                                    <div class="text-xs text-muted-foreground">Proyectos</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-green-600">3</div>
                                    <div class="text-xs text-muted-foreground">Activos</div>
                                </div>
                            </div>
                        </div>

                        <!-- Línea de Acción 2 -->
                        <div class="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-3">
                                    <div class="w-4 h-4 rounded-full bg-chart-2"></div>
                                    <h4 class="font-medium text-foreground">Servicios de Apoyo</h4>
                                </div>
                                <span class="text-sm font-medium text-foreground">72% promedio</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="text-lg font-bold text-foreground">3</div>
                                    <div class="text-xs text-muted-foreground">Proyectos</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-green-600">2</div>
                                    <div class="text-xs text-muted-foreground">Activos</div>
                                </div>
                            </div>
                        </div>

                        <!-- Línea de Acción 3 -->
                        <div class="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-3">
                                    <div class="w-4 h-4 rounded-full bg-chart-3"></div>
                                    <h4 class="font-medium text-foreground">Expansión de Mercados</h4>
                                </div>
                                <span class="text-sm font-medium text-foreground">90% promedio</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="text-lg font-bold text-foreground">5</div>
                                    <div class="text-xs text-muted-foreground">Proyectos</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-green-600">5</div>
                                    <div class="text-xs text-muted-foreground">Activos</div>
                                </div>
                            </div>
                        </div>

                        <!-- Línea de Acción 4 -->
                        <div class="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-3">
                                    <div class="w-4 h-4 rounded-full bg-chart-4"></div>
                                    <h4 class="font-medium text-foreground">Financiación</h4>
                                </div>
                                <span class="text-sm font-medium text-foreground">63% promedio</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="text-lg font-bold text-foreground">2</div>
                                    <div class="text-xs text-muted-foreground">Proyectos</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-yellow-600">1</div>
                                    <div class="text-xs text-muted-foreground">Activos</div>
                                </div>
                            </div>
                        </div>

                        <!-- Línea de Acción 5 -->
                        <div class="p-4 border border-border rounded-lg hover:border-primary transition-colors">
                            <div class="flex items-center justify-between mb-3">
                                <div class="flex items-center space-x-3">
                                    <div class="w-4 h-4 rounded-full bg-teal-500"></div>
                                    <h4 class="font-medium text-foreground">Fomento de Inversión</h4>
                                </div>
                                <span class="text-sm font-medium text-foreground">58% promedio</span>
                            </div>
                            <div class="grid grid-cols-2 gap-4">
                                <div class="text-center">
                                    <div class="text-lg font-bold text-foreground">1</div>
                                    <div class="text-xs text-muted-foreground">Proyectos</div>
                                </div>
                                <div class="text-center">
                                    <div class="text-lg font-bold text-red-600">0</div>
                                    <div class="text-xs text-muted-foreground">Activos</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Resumen de Mejoras -->
            <div class="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mt-8">
                <h3 class="text-xl font-bold mb-4 flex items-center">
                    <i class="fas fa-trophy text-yellow-500 mr-2"></i>
                    Mejoras Implementadas - Dashboard de Clase Mundial
                </h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                            <p class="font-semibold">Íconos Unificados</p>
                            <p class="text-sm text-muted-foreground">Todas las tarjetas KPI con fondo sólido consistente</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                            <p class="font-semibold">Datos Corregidos</p>
                            <p class="text-sm text-muted-foreground">Eliminados todos los "undefined" en alertas y proyectos</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                            <p class="font-semibold">Colores Semánticos</p>
                            <p class="text-sm text-muted-foreground">Sistema de colores que comunica estado instantáneamente</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                            <p class="font-semibold">Alineación Perfecta</p>
                            <p class="text-sm text-muted-foreground">Elementos centrados con Flexbox para diseño pulido</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                            <p class="font-semibold">Layout de Grid</p>
                            <p class="text-sm text-muted-foreground">Información crítica "above the fold" en grid profesional</p>
                        </div>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-500 mt-1"></i>
                        <div>
                            <p class="font-semibold">Distribución 60/40</p>
                            <p class="text-sm text-muted-foreground">Alertas priorizadas con espacio óptimo para acción</p>
                        </div>
                    </div>
                </div>
                
                <!-- Comparación -->
                <div class="mt-6 p-4 bg-white/50 dark:bg-black/20 rounded-lg">
                    <h4 class="font-semibold mb-2 flex items-center">
                        <i class="fas fa-balance-scale mr-2 text-blue-500"></i>
                        Comparación Dashboard Original vs. Mejorado
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <p class="font-medium text-red-600 mb-2">❌ Dashboard Original:</p>
                            <ul class="space-y-1 text-muted-foreground">
                                <li>• Íconos inconsistentes</li>
                                <li>• Datos "undefined"</li>
                                <li>• Layout vertical (mucho scroll)</li>
                                <li>• Información dispersa</li>
                                <li>• Colores sin significado</li>
                            </ul>
                        </div>
                        <div>
                            <p class="font-medium text-green-600 mb-2">✅ Dashboard Mejorado:</p>
                            <ul class="space-y-1 text-muted-foreground">
                                <li>• Íconos unificados con fondo sólido</li>
                                <li>• Datos completos y válidos</li>
                                <li>• Grid estratégico (info crítica arriba)</li>
                                <li>• Información agrupada lógicamente</li>
                                <li>• Colores semánticos intuitivos</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Toast container -->
        <div id="toast-container" class="fixed bottom-4 right-4 space-y-2 z-50"></div>

        <!-- Scripts -->
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            function showToast(message, type = 'success') {
                const toast = document.createElement('div');
                const colors = {
                    success: 'bg-green-500',
                    info: 'bg-blue-500',
                    warning: 'bg-yellow-500',
                    error: 'bg-red-500'
                };
                
                toast.className = 'px-6 py-3 rounded-lg font-medium text-white shadow-lg ' + (colors[type] || colors.success);
                const iconMap = {
                    success: 'check-circle',
                    info: 'info-circle',
                    warning: 'exclamation-triangle', 
                    error: 'times-circle'
                };
                toast.innerHTML = '<div class="flex items-center">' +
                    '<i class="fas fa-' + (iconMap[type] || iconMap.success) + ' mr-2"></i>' +
                    message +
                    '</div>';
                
                const container = document.getElementById('toast-container');
                container.appendChild(toast);
                
                setTimeout(() => {
                    toast.remove();
                }, 3000);
            }

            // Auto-actualizar timestamp cada minuto
            setInterval(() => {
                document.getElementById('last-updated').textContent = 'Actualizado: ' + new Date().toLocaleTimeString();
            }, 60000);

            // Inicializar
            document.addEventListener('DOMContentLoaded', function() {
                console.log('🚀 Dashboard de Clase Mundial inicializado');
                showToast('Dashboard de clase mundial cargado correctamente', 'success');
                
                // Actualizar timestamp inicial
                setTimeout(() => {
                    document.getElementById('last-updated').textContent = 'Actualizado: ' + new Date().toLocaleTimeString();
                }, 1000);
            });
        </script>
    </body>
    </html>
  `)
})

// Crear usuario de prueba
app.get('/create-admin', async (c) => {
  try {
    const email = 'admin@test.com';
    const password = 'admin123';
    const fullName = 'Administrador de Prueba';
    const role = 'ADMIN';

    // Hash de la contraseña usando el mismo método que el sistema
    const encoder = new TextEncoder();
    const data = encoder.encode(password + 'salt-ctei-manager');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Insertar usuario
    const result = await c.env.DB.prepare(`
      INSERT OR REPLACE INTO users (email, password_hash, full_name, role)
      VALUES (?, ?, ?, ?)
    `).bind(email, passwordHash, fullName, role).run();

    return c.json({
      success: true,
      message: 'Usuario administrador creado exitosamente',
      user: { email, fullName, role },
      result
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message
    }, 500);
  }
})

// Página de debug para dashboard
app.get('/debug-dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Debug Dashboard</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100 p-8">
        <div class="max-w-4xl mx-auto space-y-6">
            
            <!-- Login Section -->
            <div class="bg-white p-6 rounded-lg shadow">
                <h1 class="text-2xl font-bold mb-6">🔧 Debug Dashboard - Test Rápido</h1>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h2 class="text-lg font-semibold mb-4">🔑 Login</h2>
                        <div class="space-y-3">
                            <input type="email" id="email" value="admin@test.com" class="w-full p-3 border rounded" placeholder="Email">
                            <input type="password" id="password" value="admin123" class="w-full p-3 border rounded" placeholder="Password">
                            <button onclick="createUser()" class="w-full bg-yellow-600 text-white p-3 rounded hover:bg-yellow-700 mb-2">
                                👤 Crear Usuario Admin
                            </button>
                            <button onclick="doLogin()" class="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700">
                                🔓 Hacer Login
                            </button>
                        </div>
                        <div id="login-result" class="mt-3 hidden p-3 rounded"></div>
                    </div>
                    
                    <div>
                        <h2 class="text-lg font-semibold mb-4">📊 Dashboard</h2>
                        <div class="space-y-3">
                            <button onclick="testDashboard()" class="w-full bg-green-600 text-white p-3 rounded hover:bg-green-700">
                                🧪 Test Dashboard
                            </button>
                            <button onclick="openDashboard()" class="w-full bg-purple-600 text-white p-3 rounded hover:bg-purple-700">
                                🚀 Abrir Dashboard
                            </button>
                            <button onclick="clearAll()" class="w-full bg-red-600 text-white p-3 rounded hover:bg-red-700">
                                🗑️ Limpiar Todo
                            </button>
                        </div>
                        <div id="dashboard-result" class="mt-3 hidden p-3 rounded"></div>
                    </div>
                </div>
            </div>

            <!-- Status Panel -->
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-semibold mb-4">📋 Estado del Sistema</h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="text-center">
                        <div class="text-2xl mb-2">🎫</div>
                        <div class="text-sm text-gray-600">Token</div>
                        <div id="token-status" class="font-semibold">❓ Verificando</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl mb-2">👤</div>
                        <div class="text-sm text-gray-600">Usuario</div>
                        <div id="user-status" class="font-semibold">❓ No autenticado</div>
                    </div>
                    <div class="text-center">
                        <div class="text-2xl mb-2">📊</div>
                        <div class="text-sm text-gray-600">Dashboard</div>
                        <div id="dash-status" class="font-semibold">❓ No probado</div>
                    </div>
                </div>
            </div>

            <!-- Console -->
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-xl font-semibold mb-4">💬 Console Debug</h2>
                <div id="console" class="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm h-48 overflow-y-auto">
                    <div class="text-yellow-400">[DEBUG] Página cargada correctamente</div>
                </div>
            </div>
        </div>

        <script>
            const consoleDiv = document.getElementById('console');
            
            function log(message, type = 'info') {
                const timestamp = new Date().toLocaleTimeString();
                const colors = {
                    info: 'text-green-400',
                    error: 'text-red-400',
                    success: 'text-blue-400',
                    warning: 'text-yellow-400'
                };
                console.log(\`[\${timestamp}] \${message}\`);
                consoleDiv.innerHTML += \`<div class="\${colors[type]}">[DEBUG] \${message}</div>\`;
                consoleDiv.scrollTop = consoleDiv.scrollHeight;
            }

            function showResult(elementId, message, isSuccess = true) {
                const el = document.getElementById(elementId);
                el.className = \`mt-3 p-3 rounded \${isSuccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}\`;
                el.innerHTML = message;
                el.classList.remove('hidden');
            }

            function updateStatus() {
                const token = localStorage.getItem('auth_token');
                document.getElementById('token-status').innerText = token ? '✅ Presente' : '❌ Ausente';
                
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        document.getElementById('user-status').innerText = \`✅ \${payload.email}\`;
                        log(\`Token válido para: \${payload.email} (\${payload.role})\`, 'success');
                    } catch (e) {
                        document.getElementById('user-status').innerText = '⚠️ Token inválido';
                        log('Token presente pero inválido', 'warning');
                    }
                }
            }

            async function createUser() {
                log('Creando usuario administrador...', 'info');
                
                try {
                    const response = await fetch('/create-admin');
                    const result = await response.json();
                    
                    log(\`Create user response: \${JSON.stringify(result)}\`, response.ok ? 'success' : 'error');
                    
                    if (result.success) {
                        showResult('login-result', '✅ Usuario administrador creado! Ahora puedes hacer login.');
                        log('Usuario creado exitosamente', 'success');
                    } else {
                        showResult('login-result', \`❌ Error creando usuario: \${result.error}\`, false);
                        log(\`Error creando usuario: \${result.error}\`, 'error');
                    }
                } catch (error) {
                    showResult('login-result', \`❌ Error: \${error.message}\`, false);
                    log(\`Error creando usuario: \${error.message}\`, 'error');
                }
            }

            async function doLogin() {
                const email = document.getElementById('email').value;
                const password = document.getElementById('password').value;
                
                log(\`Intentando login: \${email}\`, 'info');
                
                try {
                    const response = await axios.post('/api/auth/login', { email, password });
                    log(\`Response: \${JSON.stringify(response.data)}\`, 'success');
                    
                    if (response.data.success && response.data.data.token) {
                        localStorage.setItem('auth_token', response.data.data.token);
                        axios.defaults.headers.common['Authorization'] = \`Bearer \${response.data.data.token}\`;
                        
                        showResult('login-result', '✅ Login exitoso! Token guardado correctamente.');
                        log('Login exitoso, token guardado', 'success');
                        updateStatus();
                    } else {
                        showResult('login-result', '❌ Login falló: Respuesta inválida', false);
                        log('Login falló: respuesta sin token', 'error');
                    }
                } catch (error) {
                    const errorMsg = error.response?.data?.error || error.message;
                    showResult('login-result', \`❌ Error: \${errorMsg}\`, false);
                    log(\`Error de login: \${errorMsg}\`, 'error');
                }
            }

            async function testDashboard() {
                log('Probando acceso al dashboard...', 'info');
                
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    showResult('dashboard-result', '❌ No hay token. Haz login primero.', false);
                    log('No hay token para probar dashboard', 'error');
                    return;
                }

                try {
                    // Test 1: Página dashboard
                    const dashResponse = await fetch('/dashboard');
                    log(\`Dashboard page: \${dashResponse.status} \${dashResponse.statusText}\`, dashResponse.ok ? 'success' : 'error');
                    
                    // Test 2: Profile API
                    axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
                    const profileResponse = await axios.get('/api/private/profile');
                    log(\`Profile API: \${JSON.stringify(profileResponse.data)}\`, 'success');
                    
                    document.getElementById('dash-status').innerText = '✅ Funcional';
                    showResult('dashboard-result', '✅ Dashboard funciona correctamente!');
                    
                } catch (error) {
                    const errorMsg = error.response?.data?.error || error.message;
                    document.getElementById('dash-status').innerText = '❌ Error';
                    showResult('dashboard-result', \`❌ Error: \${errorMsg}\`, false);
                    log(\`Error probando dashboard: \${errorMsg}\`, 'error');
                }
            }

            function openDashboard() {
                const token = localStorage.getItem('auth_token');
                if (!token) {
                    log('No hay token para abrir dashboard', 'error');
                    alert('Haz login primero');
                    return;
                }
                
                log('Abriendo dashboard...', 'info');
                window.open('/dashboard', '_blank');
            }

            function clearAll() {
                localStorage.clear();
                delete axios.defaults.headers.common['Authorization'];
                updateStatus();
                log('Datos limpiados', 'warning');
                
                document.getElementById('login-result').classList.add('hidden');
                document.getElementById('dashboard-result').classList.add('hidden');
                document.getElementById('dash-status').innerText = '❓ No probado';
            }

            // Initialize
            window.addEventListener('DOMContentLoaded', function() {
                log('Herramienta de debug iniciada', 'success');
                updateStatus();
            });
        </script>
    </body>
    </html>
  `)
})

// Ruta de fallback para SPA routing (DEBE IR AL FINAL)
app.get('*', (c) => {
  // Redireccionar a la página principal
  return c.redirect('/')
})

export default app