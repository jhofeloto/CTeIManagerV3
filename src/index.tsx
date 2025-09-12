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

// ===== API ROUTES =====

// Rutas de autenticación
app.route('/api/auth', auth)

// Rutas públicas (sin autenticación)
app.route('/api/public', publicRoutes)

// Rutas privadas (requieren autenticación)
app.route('/api/me', privateRoutes)

// Rutas de administrador (solo ADMIN)
app.route('/api/admin', adminRoutes)

// ===== FRONTEND ROUTES =====

// Página principal (Portal público)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CTeI-Manager - Portal de Ciencia, Tecnología e Innovación</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
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
        <!-- Navbar -->
        <nav class="bg-card shadow-lg border-b border-border">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <h1 class="text-xl font-bold text-primary">
                            <i class="fas fa-flask mr-2"></i>
                            CTeI-Manager
                        </h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="#projects" class="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Proyectos</a>
                        <a href="#products" class="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Productos</a>
                        <a href="#stats" class="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">Analíticas</a>
                        
                        <!-- Botones para usuarios no autenticados -->
                        <div id="unauthenticatedButtons" class="flex items-center space-x-4">
                            <button onclick="showLoginModal()" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                                <i class="fas fa-sign-in-alt mr-1"></i>
                                Ingresar
                            </button>
                            <button onclick="showRegisterModal()" class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                                <i class="fas fa-user-plus mr-1"></i>
                                Registro
                            </button>
                        </div>
                        
                        <!-- Botones para usuarios autenticados -->
                        <div id="authenticatedButtons" class="hidden items-center space-x-4">
                            <span id="userInfo" class="text-sm text-muted-foreground"></span>
                            <a href="/dashboard" class="bg-accent text-accent-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                                <i class="fas fa-tachometer-alt mr-1"></i>
                                Dashboard
                            </a>
                            <button onclick="logout()" class="bg-destructive text-destructive-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                                <i class="fas fa-sign-out-alt mr-1"></i>
                                Salir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Contenido principal -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <!-- Hero Section -->
            <div class="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-8 mb-8">
                <h2 class="text-3xl font-bold text-center mb-4">
                    Portal de Gestión de Ciencia, Tecnología e Innovación
                </h2>
                <p class="text-muted-foreground text-center text-lg max-w-3xl mx-auto">
                    Plataforma integral para la gestión, visualización y análisis de proyectos y productos de CTeI. 
                    Conectando investigadores, comunidad académica y sociedad.
                </p>
            </div>

            <!-- Búsqueda Avanzada -->
            <div class="bg-card rounded-lg shadow-md p-6 mb-8">
                <div class="space-y-4">
                    <!-- Barra de búsqueda principal -->
                    <div class="flex flex-col sm:flex-row gap-4">
                        <div class="flex-1">
                            <input 
                                type="text" 
                                id="searchInput"
                                placeholder="Buscar proyectos y productos..." 
                                class="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                        </div>
                        <div class="flex gap-2">
                            <button 
                                onclick="toggleAdvancedFilters()"
                                class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                                id="filtersToggle"
                            >
                                <i class="fas fa-filter mr-2"></i>
                                Filtros
                            </button>
                            <button 
                                onclick="performSearch()"
                                class="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
                            >
                                <i class="fas fa-search mr-2"></i>
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
            <div id="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div class="bg-card rounded-lg shadow-md p-6 stats-card interactive-element" onclick="scrollToSection('projects')">
                    <div class="flex items-center">
                        <div class="p-3 bg-primary/10 rounded-lg">
                            <i class="fas fa-project-diagram text-primary text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold" id="totalProjects">0</p>
                            <p class="text-muted-foreground">Proyectos Públicos</p>
                        </div>
                    </div>
                </div>
                
                <div class="bg-card rounded-lg shadow-md p-6 stats-card interactive-element" onclick="scrollToSection('products')">
                    <div class="flex items-center">
                        <div class="p-3 bg-accent/10 rounded-lg">
                            <i class="fas fa-cubes text-accent text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold" id="totalProducts">0</p>
                            <p class="text-muted-foreground">Productos de CTeI</p>
                        </div>
                    </div>
                </div>

                <div class="bg-card rounded-lg shadow-md p-6 stats-card interactive-element">
                    <div class="flex items-center">
                        <div class="p-3 bg-chart-2/10 rounded-lg">
                            <i class="fas fa-users text-chart-2 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold" id="activeInvestigators">0</p>
                            <p class="text-muted-foreground">Investigadores Activos</p>
                        </div>
                    </div>
                </div>

                <div class="bg-card rounded-lg shadow-md p-6 stats-card interactive-element">
                    <div class="flex items-center">
                        <div class="p-3 bg-chart-3/10 rounded-lg">
                            <i class="fas fa-chart-line text-chart-3 text-xl"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold">24/7</p>
                            <p class="text-muted-foreground">Acceso Disponible</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Proyectos destacados -->
            <section id="projects" class="mb-8">
                <h3 class="text-2xl font-bold mb-6">Proyectos Destacados</h3>
                <div id="projectsContainer" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- Los proyectos se cargarán dinámicamente -->
                </div>
                <div class="text-center mt-6">
                    <button onclick="loadMoreProjects()" class="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90">
                        Ver Más Proyectos
                    </button>
                </div>
            </section>

            <!-- Productos recientes -->
            <section id="products" class="mb-8">
                <h3 class="text-2xl font-bold mb-6">Productos de CTeI Recientes</h3>
                <div id="productsContainer" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Los productos se cargarán dinámicamente -->
                </div>
                <div class="text-center mt-6">
                    <button onclick="loadMoreProducts()" class="bg-secondary text-secondary-foreground px-6 py-2 rounded-lg font-medium hover:opacity-90">
                        Ver Más Productos
                    </button>
                </div>
            </section>
        </main>

        <!-- Footer -->
        <footer class="bg-card border-t border-border py-8 mt-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-muted-foreground">
                <p>&copy; 2024 CTeI-Manager. Plataforma de Ciencia, Tecnología e Innovación.</p>
            </div>
        </footer>

        <!-- Modales -->
        <div id="loginModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Iniciar Sesión</h3>
                            <button onclick="closeLoginModal()" class="text-muted-foreground hover:text-foreground">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form onsubmit="handleLogin(event)">
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Email</label>
                                <input type="email" id="loginEmail" class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2">Contraseña</label>
                                <input type="password" id="loginPassword" class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                            </div>
                            <button type="submit" class="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90">
                                Ingresar
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <div id="registerModal" class="fixed inset-0 bg-black bg-opacity-50 hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-4">
                            <h3 class="text-lg font-semibold">Registro</h3>
                            <button onclick="closeRegisterModal()" class="text-muted-foreground hover:text-foreground">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <form onsubmit="handleRegister(event)">
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Nombre Completo</label>
                                <input type="text" id="registerName" class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Email</label>
                                <input type="email" id="registerEmail" class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                            </div>
                            <div class="mb-4">
                                <label class="block text-sm font-medium mb-2">Contraseña</label>
                                <input type="password" id="registerPassword" class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" required>
                            </div>
                            <div class="mb-6">
                                <label class="block text-sm font-medium mb-2">Rol</label>
                                <select id="registerRole" class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option value="COMMUNITY">Comunidad</option>
                                    <option value="INVESTIGATOR">Investigador</option>
                                </select>
                            </div>
                            <button type="submit" class="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90">
                                Registrarse
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/phase1-enhancements.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

// Página de dashboard (requiere autenticación en el frontend)
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - CTeI-Manager</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
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
        <script src="/static/phase1-enhancements.js"></script>
        <script src="/static/dashboard.js"></script>
        <script src="/static/enhanced-dashboard.js"></script>
        <script src="/static/product-authorship.js"></script>
    </body>
    </html>
  `)
})

// Ruta de fallback para SPA routing
app.get('*', (c) => {
  // Redireccionar a la página principal
  return c.redirect('/')
})

export default app