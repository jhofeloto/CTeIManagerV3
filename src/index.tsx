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
                    localStorage.setItem('ctei_token', adminToken);
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
        const existingToken = localStorage.getItem('ctei_token');
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
                        localStorage.setItem('ctei_token', token);
                        log('💾 Token guardado en localStorage');
                        
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
                    localStorage.setItem('ctei_token', token);
                    
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

// Página de dashboard (requiere autenticación en el frontend)
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es" id="dashboard-html">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - CTeI-Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
    <body class="bg-background text-foreground">
        <div id="app">
            <!-- El contenido se cargará dinámicamente según el usuario autenticado -->
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <!-- SOLO dashboard.js principal con versión corregida (sintaxis arreglada) -->
        <script src="/static/dashboard.js?v=20250913-2"></script>
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
                min-height: 100vh;
            }
            
            .sticky-header {
                position: sticky;
                top: 0;
                z-index: 40;
                border-bottom: 1px solid hsl(var(--border));
                background: hsl(var(--background));
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
            }
            
            .btn-secondary {
                background: hsl(var(--secondary));
                color: hsl(var(--secondary-foreground));
                border: 1px solid hsl(var(--border));
            }
            
            .btn-secondary:hover {
                background: hsl(var(--accent));
            }
            
            .btn-outline {
                background: transparent;
                color: hsl(var(--foreground));
                border: 1px solid hsl(var(--border));
            }
            
            .btn-outline:hover {
                background: hsl(var(--accent));
            }
            
            .tags-container {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.5rem;
            }
            
            .tag {
                background: hsl(var(--primary));
                color: hsl(var(--primary-foreground));
                padding: 0.25rem 0.75rem;
                border-radius: calc(var(--radius));
                font-size: 0.75rem;
                display: flex;
                align-items: center;
                gap: 0.25rem;
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
    <body class="edit-page-container dark">
        <!-- Cabecera de acciones persistente -->
        <div class="sticky-header">
            <div class="flex justify-between items-center py-4 px-6">
                <div class="flex items-center gap-4">
                    <a href="/dashboard" class="btn-outline btn">
                        <i class="fas fa-arrow-left"></i>
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
                            <textarea 
                                id="project-introduction"
                                name="introduction"
                                class="form-textarea"
                                placeholder="Contexto y antecedentes del proyecto..."
                                rows="8"
                            ></textarea>
                            <div class="text-xs text-muted-foreground mt-1">
                                <i class="fas fa-lightbulb mr-1"></i>
                                Explique el contexto, antecedentes y justificación del proyecto.
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
                            <textarea 
                                id="project-methodology"
                                name="methodology"
                                class="form-textarea"
                                placeholder="Describa los métodos y enfoques utilizados..."
                                rows="8"
                            ></textarea>
                            <div class="text-xs text-muted-foreground mt-1">
                                <i class="fas fa-route mr-1"></i>
                                Detalle los métodos, herramientas y procesos utilizados en el proyecto.
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
                    
                    <div id="associated-products" class="products-list">
                        <div class="text-center text-muted-foreground py-4">
                            <i class="fas fa-box-open mb-2 block text-lg"></i>
                            No hay productos científicos en este proyecto
                        </div>
                    </div>
                    
                    <button type="button" id="create-product-btn" class="btn-primary btn w-full">
                        <i class="fas fa-plus"></i>
                        Crear Nuevo Producto Científico
                    </button>
                    
                    <div class="text-xs text-muted-foreground mt-2">
                        <i class="fas fa-info-circle mr-1"></i>
                        Los productos científicos incluyen artículos, libros, patentes, software, etc.
                    </div>
                </div>
            </div>
        </div>
        
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
            const PROJECT_ID = '${projectId}';
            let currentProject = null;
            let hasUnsavedChanges = false;
            let keywords = [];
            let associatedProducts = [];
            
            // Elementos DOM
            const form = document.getElementById('edit-project-form');
            const saveBtn = document.getElementById('save-btn');
            const cancelBtn = document.getElementById('cancel-btn');
            const viewPublicBtn = document.getElementById('view-public-btn');
            const pageTitle = document.getElementById('page-title');
            const loadingOverlay = document.getElementById('loading-overlay');
            
            // Inicialización
            document.addEventListener('DOMContentLoaded', async () => {
                try {
                    await loadProject();
                    initializeForm();
                    initializeKeywords();
                    initializeProductSearch();
                    hideLoading();
                } catch (error) {
                    console.error('Error al inicializar:', error);
                    showError('Error al cargar el proyecto');
                }
            });
            
            // Cargar datos del proyecto
            async function loadProject() {
                try {
                    const response = await axios.get(\`\${API_BASE}/private/projects/\${PROJECT_ID}\`);
                    
                    if (response.data.success) {
                        currentProject = response.data.data;
                        populateForm();
                        updatePageTitle();
                        updatePublicLink();
                    } else {
                        throw new Error(response.data.message || 'Error al cargar el proyecto');
                    }
                } catch (error) {
                    console.error('Error cargando proyecto:', error);
                    throw error;
                }
            }
            
            // Poblar formulario con datos del proyecto
            function populateForm() {
                if (!currentProject) return;
                
                document.getElementById('project-title').value = currentProject.title || '';
                document.getElementById('project-abstract').value = currentProject.abstract || '';
                document.getElementById('project-introduction').value = currentProject.introduction || '';
                document.getElementById('project-methodology').value = currentProject.methodology || '';
                document.getElementById('project-status').value = currentProject.status || 'DRAFT';
                
                // Visibilidad (simulada - implementar según schema de BD)
                const isPublic = currentProject.is_public;
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
            }
            
            // Manejar cambios en el formulario
            function handleFormChange() {
                hasUnsavedChanges = true;
                saveBtn.disabled = false;
            }
            
            // Manejar envío del formulario
            async function handleFormSubmit(event) {
                event.preventDefault();
                
                if (!hasUnsavedChanges) return;
                
                try {
                    saveBtn.disabled = true;
                    saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
                    
                    const formData = new FormData(form);
                    const projectData = {
                        title: formData.get('title'),
                        abstract: formData.get('abstract'),
                        introduction: formData.get('introduction') || null,
                        methodology: formData.get('methodology') || null,
                        status: formData.get('status'),
                        keywords: keywords.join(', ') || null,
                        // is_public: formData.get('visibility') === 'public' // Implementar según schema
                    };
                    
                    const response = await axios.put(\`\${API_BASE}/private/projects/\${PROJECT_ID}\`, projectData);
                    
                    if (response.data.success) {
                        hasUnsavedChanges = false;
                        showSuccess('Proyecto actualizado exitosamente');
                        
                        // Actualizar datos locales
                        currentProject = { ...currentProject, ...projectData };
                        updatePageTitle();
                        
                        saveBtn.disabled = true;
                        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
                    } else {
                        throw new Error(response.data.message || 'Error al actualizar el proyecto');
                    }
                } catch (error) {
                    console.error('Error al guardar:', error);
                    showError('Error al guardar el proyecto');
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
                
                createBtn.addEventListener('click', () => {
                    // Redirigir a página de creación de producto con project_id
                    window.location.href = \`/dashboard/productos/nuevo?project_id=\${PROJECT_ID}\`;
                });
            }
            
            // Cargar productos del proyecto
            async function loadAssociatedProducts() {
                try {
                    const response = await axios.get(\`\${API_BASE}/projects/\${PROJECT_ID}/products\`);
                    
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
                // Implementar toast de éxito
                console.log('SUCCESS:', message);
                // TODO: Implementar sistema de notificaciones
            }
            
            function showError(message) {
                // Implementar toast de error
                console.error('ERROR:', message);
                alert('Error: ' + message); // Temporal
            }
            
            // Cargar productos asociados al inicio
            loadAssociatedProducts();
        </script>
    </body>
    </html>
  `);
})

// Ruta de fallback para SPA routing
app.get('*', (c) => {
  // Redireccionar a la página principal
  return c.redirect('/')
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
                const existing = localStorage.getItem('ctei_token');
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
                        localStorage.setItem('ctei_token', adminToken);
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

export default app