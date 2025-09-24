// Choco Inventa - Development Server
// Servidor local para desarrollo sin Cloudflare Workers

import { Hono } from 'hono';
import { serveStatic } from '@hono/node-server/serve-static';
import { auth } from './src/routes/auth.ts';
import projects from './src/routes/projects.ts';
import users from './src/routes/users.ts';
import monitoring from './src/routes/monitoring.ts';
import settings from './src/routes/settings.ts';
import publicRoutes from './src/routes/public.ts';
import newsRoutes from './src/routes/news.ts';
import publicNewsRoutes from './src/routes/publicNews.ts';
import eventsRoutes from './src/routes/events.ts';
import publicEventsRoutes from './src/routes/publicEvents.ts';
import resourcesRoutes from './src/routes/resources.ts';
import publicResourcesRoutes from './src/routes/publicResources.ts';
import mlRoutes from './src/routes/ml.ts';
import analyticsRoutes from './src/routes/analytics.ts';
import forecastingRoutes from './src/routes/forecasting.ts';
import { loggingMiddleware, logger } from './src/monitoring/logger.ts';
import { systemLoggingMiddleware, systemLogger } from './src/monitoring/systemLogger.ts';
import systemLogs from './src/routes/systemLogs.ts';
import { errorHandlerMiddleware } from './src/monitoring/errorHandler.ts';
import { performanceMiddleware, performanceMonitor } from './src/monitoring/performance.ts';

// Importar rutas adicionales
import analyticsRoutes2 from './src/routes/analytics.ts';
import filesRoutes from './src/routes/files.ts';
import publicationsRoutes from './src/routes/publications.ts';
import { indicatorsRoutes } from './src/routes/indicators.ts';
import { notifications } from './src/routes/notifications.ts';

// Crear aplicación Hono
const app = new Hono();

// Configurar CORS para desarrollo local
app.use('/api/*', async (c, next) => {
  c.header('Access-Control-Allow-Origin', '*');
  c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  c.header('Access-Control-Max-Age', '86400');

  if (c.req.method === 'OPTIONS') {
    return c.text('', 204);
  }

  await next();
});

// Servir archivos estáticos
app.use('/static/*', serveStatic({ root: './public' }));

// Manejar favicon.ico
app.get('/favicon.ico', (c) => {
  return c.redirect('/static/favicon.ico', 301);
});

// Agregar middlewares de monitoreo
app.use('*', performanceMiddleware(performanceMonitor));
app.use('*', loggingMiddleware(logger));
app.use('*', systemLoggingMiddleware());
app.use('*', errorHandlerMiddleware());

// Configurar variables de entorno simuladas para desarrollo local
const devEnv = {
  DB: null, // Usará mock database
  R2: null, // No disponible en desarrollo local
  KV: null, // No disponible en desarrollo local
  NODE_ENV: 'development',
  CLOUDFLARE_API_TOKEN: 'dev-token',
  WORKERS_AI_MODEL: 'llama-2-7b-chat'
};

// Simular entorno de Cloudflare Workers para desarrollo
app.use('*', async (c, next) => {
  // Agregar variables de entorno simuladas
  c.env = devEnv;

  // Simular usuario autenticado para desarrollo
  if (c.req.header('Authorization') || c.req.path.startsWith('/api/auth')) {
    await next();
    return;
  }

  // Para rutas protegidas, simular usuario admin para desarrollo
  if (c.req.path.startsWith('/api/') && !c.req.path.startsWith('/api/public') && !c.req.path.startsWith('/api/auth')) {
    c.set('user', {
      userId: 1,
      email: 'admin@codecti.gov.co',
      role: 'admin',
      name: 'Administrador CODECTI',
      institution: 'CODECTI Chocó'
    });
  }

  await next();
});

// Rutas API
app.route('/api/auth', auth);
app.route('/api/projects', projects);
app.route('/api/users', users);
app.route('/api/news', newsRoutes);
app.route('/api/events', eventsRoutes);
app.route('/api/resources', resourcesRoutes);
app.route('/api/monitoring', monitoring);
app.route('/api/system-logs', systemLogs);
app.route('/api/settings', settings);
app.route('/api/ml', mlRoutes);
app.route('/api/analytics', analyticsRoutes);
app.route('/api/forecasting', forecastingRoutes);

// Rutas adicionales
app.route('/api/analytics', analyticsRoutes2);
app.route('/api/files', filesRoutes);
app.route('/api/publications', publicationsRoutes);
app.route('/api/indicators', indicatorsRoutes);
app.route('/api', notifications);

// Rutas públicas
app.route('/api/public', publicRoutes);
app.route('/api/public/news', publicNewsRoutes);
app.route('/api/public/events', publicEventsRoutes);
app.route('/api/public/resources', publicResourcesRoutes);

// Portal público de proyectos
app.get('/portal', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portal Público - Choco Inventa</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <nav className="navbar bg-white border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="navbar-logo flex items-center">
                        <a href="/" className="flex items-center">
                            <img src="/static/logo-choco-inventa.png" alt="Choco Inventa" className="h-10 mr-3" />
                            <div>
                                <div className="font-bold text-xl text-primary">Choco Inventa</div>
                                <div className="text-xs text-gray-600">Portal Público CTeI</div>
                            </div>
                        </a>
                    </div>
                    <div className="nav-actions">
                        <a href="/dashboard" className="btn btn-outline mr-3">Dashboard Privado</a>
                        <a href="/" className="btn btn-primary">Inicio</a>
                    </div>
                </div>
            </div>
        </nav>

        <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
            <div className="container mx-auto px-4 text-center">
                <h1 className="text-4xl font-bold text-gray-900 mb-6">
                    Portal Público de Proyectos CTeI
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                    Descubre los proyectos de investigación, ciencia, tecnología e innovación
                    que están transformando el departamento del Chocó
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <a href="#projects" className="btn btn-primary btn-lg">
                        <i className="fas fa-search mr-2"></i>
                        Explorar Proyectos
                    </a>
                    <a href="#stats" className="btn btn-outline btn-lg">
                        <i className="fas fa-chart-bar mr-2"></i>
                        Ver Estadísticas
                    </a>
                </div>
            </div>
        </section>

        <section id="stats" className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Impacto del Ecosistema CTeI Chocó
                    </h2>
                    <p className="text-lg text-gray-600">
                        Conoce los números que reflejan el desarrollo científico y tecnológico del Chocó
                    </p>
                </div>
                <div id="publicStatsContainer">
                    <div className="text-center py-8">
                        <i className="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
                        <p className="text-gray-500 mt-2">Cargando estadísticas...</p>
                    </div>
                </div>
            </div>
        </section>

        <section id="projects" className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">
                        Catálogo de Proyectos CTeI
                    </h2>
                    <p className="text-lg text-gray-600">
                        Explora los proyectos de investigación que están impulsando el desarrollo del Chocó
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div className="lg:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar proyectos
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="publicSearch"
                                    className="form-input pl-10"
                                    placeholder="Título, palabras clave, institución..."
                                />
                                <i className="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Estado
                            </label>
                            <select id="statusFilter" className="form-input">
                                <option value="">Todos los estados</option>
                                <option value="active">Activos</option>
                                <option value="completed">Completados</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Ordenar por
                            </label>
                            <select id="sortSelect" className="form-input">
                                <option value="created_at-desc">Más recientes</option>
                                <option value="created_at-asc">Más antiguos</option>
                                <option value="title-asc">Título A-Z</option>
                                <option value="title-desc">Título Z-A</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div id="resultsInfo" className="text-sm text-gray-600">
                            {/* Results info will be loaded here */}
                        </div>
                        <button id="clearFilters" className="btn btn-secondary btn-sm">
                            <i className="fas fa-times mr-2"></i>
                            Limpiar Filtros
                        </button>
                    </div>
                </div>

                <div id="publicProjectsGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    <div className="col-span-full text-center py-12">
                        <i className="fas fa-spinner fa-spin text-3xl text-gray-400 mb-4"></i>
                        <p className="text-gray-500">Cargando proyectos...</p>
                    </div>
                </div>

                <div id="publicPagination">
                    {/* Pagination will be loaded here */}
                </div>
            </div>
        </section>

        <footer className="footer bg-gray-800 text-white">
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <div className="flex items-center mb-4">
                            <img src="/static/logo-choco-inventa.png" alt="Choco Inventa" className="h-8 mr-3" />
                            <div className="font-bold text-lg">Choco Inventa</div>
                        </div>
                        <p className="text-gray-300">
                            Portal público de proyectos de Ciencia, Tecnología e Innovación del Chocó
                        </p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Enlaces</h4>
                        <ul className="space-y-2 text-gray-300">
                            <li><a href="/" className="hover:text-white">Inicio</a></li>
                            <li><a href="/portal" className="hover:text-white">Portal Público</a></li>
                            <li><a href="/dashboard" className="hover:text-white">Dashboard</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">CODECTI Chocó</h4>
                        <p className="text-gray-300 text-sm">
                            Corporación para el Desarrollo de la Ciencia, la Tecnología y la Innovación del Chocó
                        </p>
                    </div>
                </div>
                <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
                    <p>&copy; 2025 CODECTI Chocó. Todos los derechos reservados.</p>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/public-portal.js"></script>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                if (typeof PublicPortal !== 'undefined') {
                    PublicPortal.init();
                }
            });
        </script>
    </body>
    </html>
  `);
});

// Dashboard principal
app.get('/dashboard', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Dashboard - Choco Inventa CODECTI</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app">
            <nav id="navbar"></nav>
            <main id="main-content">
                <div id="projects-container"></div>
            </main>
        </div>

        <script src="/static/notifications.js"></script>
    </body>
    </html>
  `);
});

// Página principal
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Choco Inventa - CODECTI Chocó</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <nav className="navbar">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center py-4">
                    <div className="navbar-logo flex items-center">
                        <img src="/static/logo-choco-inventa.png" alt="Choco Inventa" className="h-10 mr-3" />
                        <div>
                            <div className="font-bold text-xl text-primary">Choco Inventa</div>
                            <div className="text-xs text-gray-600">CODECTI Chocó</div>
                        </div>
                    </div>
                    <div className="nav-actions" id="landingNavActions">
                        <a href="/portal" className="btn btn-outline mr-3">
                            Portal de Proyectos
                        </a>
                        <a href="/noticias" className="btn btn-outline mr-3">
                            Noticias CTeI
                        </a>
                        <a href="/eventos" className="btn btn-outline mr-3">
                            Eventos
                        </a>
                        <a href="/recursos" className="btn btn-outline mr-3">
                            Recursos
                        </a>
                        <a href="/publicaciones" className="btn btn-outline mr-3">
                            Publicaciones
                        </a>
                        <button id="showLoginModal" className="btn btn-outline">
                            Iniciar Sesión
                        </button>
                        <button id="showRegisterModal" className="btn btn-primary">
                            Registrarse
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <div id="app">
            <section className="hero-section">
                <div className="container mx-auto px-4">
                    <div className="hero-content">
                        <div className="hero-text">
                            <h1 className="hero-title">
                                <span className="text-gradient">Choco Inventa</span>: Innovación y Conocimiento para el Chocó
                            </h1>
                            <p className="hero-description">
                                CODECTI Chocó impulsa la investigación científica con Choco Inventa, una plataforma integral de gestión de proyectos CTeI,
                                diseñada específicamente para el desarrollo de capacidades investigativas e innovación en la región del Chocó.
                            </p>
                            <div className="hero-actions">
                                <button id="ctaRegister" className="btn btn-primary btn-lg">
                                    <i className="fas fa-microscope mr-2"></i>
                                    Comenzar Investigación
                                </button>
                                <a href="/portal" className="btn btn-secondary btn-lg">
                                    <i className="fas fa-eye mr-2"></i>
                                    Ver Proyectos Públicos
                                </a>
                                <button id="learnMore" className="btn btn-outline btn-lg">
                                    <i className="fas fa-chart-line mr-2"></i>
                                    Conocer Más
                                </button>
                            </div>
                        </div>
                        <div className="hero-visual">
                            <div className="hero-cards">
                                <div className="floating-card card-1">
                                    <i className="fas fa-flask text-primary"></i>
                                    <span>Gestión de Proyectos</span>
                                </div>
                                <div className="floating-card card-2">
                                    <i className="fas fa-chart-line text-accent"></i>
                                    <span>Analytics Avanzado</span>
                                </div>
                                <div className="floating-card card-3">
                                    <i className="fas fa-users text-secondary"></i>
                                    <span>Colaboración</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="stats-section">
                <div className="container mx-auto px-4">
                    <div className="stats-grid">
                        <div className="stat-item">
                            <div className="stat-number">500+</div>
                            <div className="stat-label">Proyectos Activos</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">1,200+</div>
                            <div className="stat-label">Investigadores</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">50+</div>
                            <div className="stat-label">Instituciones</div>
                        </div>
                        <div className="stat-item">
                            <div className="stat-number">95%</div>
                            <div className="stat-label">Satisfacción</div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="features" className="features-section">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="section-title">Un Nuevo Estándar en Gestión de Investigación</h2>
                        <p className="section-description">
                            Tres pilares fundamentales que transforman la investigación científica en el Chocó
                        </p>
                    </div>

                    <div className="features-grid-opus">
                        <div className="feature-card-opus">
                            <div className="feature-number">01</div>
                            <div className="feature-icon-opus">
                                <i className="fas fa-dna"></i>
                            </div>
                            <h3>Gestión Científica Avanzada</h3>
                            <p>Metodologías probadas para la planificación, ejecución y monitoreo de proyectos de investigación con estándares internacionales de calidad.</p>
                            <div className="feature-highlight">
                                Mayor eficiencia en gestión de proyectos investigativos
                            </div>
                        </div>

                        <div className="feature-card-opus">
                            <div className="feature-number">02</div>
                            <div className="feature-icon-opus">
                                <i className="fas fa-network-wired"></i>
                            </div>
                            <h3>Colaboración Interinstitucional</h3>
                            <p>Plataforma unificada que conecta investigadores, instituciones y organizaciones del Chocó para fortalecer el ecosistema científico regional.</p>
                            <div className="feature-highlight">
                                Red integrada de conocimiento científico del Chocó
                            </div>
                        </div>

                        <div className="feature-card-opus">
                            <div className="feature-number">03</div>
                            <div className="feature-icon-opus">
                                <i className="fas fa-chart-network"></i>
                            </div>
                            <h3>Analítica de Impacto</h3>
                            <p>Herramientas de análisis que permiten medir y visualizar el impacto real de los proyectos de investigación en el desarrollo regional.</p>
                            <div className="feature-highlight">
                                Medición del impacto científico y social
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="cta-section-opus">
                <div className="container mx-auto px-4">
                    <div className="cta-content-opus">
                        <div className="cta-badge">
                            <i className="fas fa-flask mr-2"></i>
                            Únete al Ecosistema de Investigación del Chocó
                        </div>
                        <h2 className="cta-title-opus">
                            Impulsa tu Investigación con CODECTI
                        </h2>
                        <p className="cta-description-opus">
                            Accede a herramientas avanzadas de gestión de proyectos CTeI y forma parte de la comunidad científica
                            más importante del Pacífico colombiano
                        </p>
                        <div className="cta-actions-opus">
                            <button id="ctaRegisterMain" className="btn-cta-primary">
                                <i className="fas fa-microscope mr-2"></i>
                                Comenzar Investigación
                                <span className="btn-shine"></span>
                            </button>
                            <div className="cta-note-opus">
                                <div className="cta-benefits">
                                    <div className="benefit-item">
                                        <i className="fas fa-check-circle"></i>
                                        <span>Acceso gratuito para investigadores del Chocó</span>
                                    </div>
                                    <div className="benefit-item">
                                        <i className="fas fa-users"></i>
                                        <span>Red colaborativa de instituciones</span>
                                    </div>
                                    <div className="benefit-item">
                                        <i className="fas fa-chart-line"></i>
                                        <span>Analíticas y métricas de impacto</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="footer">
                <div className="container mx-auto px-4">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="footer-logo flex items-center mb-2">
                                <img src="/static/logo-choco-inventa.png" alt="Choco Inventa" className="h-10 mr-3" />
                                <div className="font-bold text-xl">Choco Inventa</div>
                            </div>
                            <p>CODECTI Chocó: Transformando la investigación científica con innovación y conocimiento</p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-column">
                                <h4>Plataforma</h4>
                                <a href="#features">Características</a>
                            </div>
                            <div className="footer-column">
                                <h4>Recursos</h4>
                                <a href="/docs">Documentación</a>
                            </div>
                            <div className="footer-column">
                                <h4>Contacto</h4>
                                <a href="/soporte">Soporte</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; 2025 CODECTI. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>

            <div id="loginModal" className="modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>Iniciar Sesión</h3>
                        <button className="modal-close" id="closeLoginModal">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="modal-body">
                        <form id="loginForm">
                            <div className="form-group">
                                <label for="loginEmail">Correo Electrónico</label>
                                <input type="email" id="loginEmail" className="form-input" placeholder="tu@email.com" autocomplete="email" required />
                            </div>
                            <div className="form-group">
                                <label for="loginPassword">Contraseña</label>
                                <input type="password" id="loginPassword" className="form-input" placeholder="••••••••" autocomplete="current-password" required />
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                Iniciar Sesión
                            </button>
                        </form>
                        <div className="modal-footer">
                            <p>¿No tienes cuenta? <a href="#" id="switchToRegister">Regístrate aquí</a></p>
                        </div>
                    </div>
                </div>
            </div>

            <div id="registerModal" className="modal">
                <div className="modal-content">
                    <div className="modal-header">
                        <h3>Crear Cuenta</h3>
                        <button className="modal-close" id="closeRegisterModal">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="modal-body">
                        <form id="registerForm">
                            <div className="form-group">
                                <label for="registerName">Nombre Completo</label>
                                <input type="text" id="registerName" className="form-input" placeholder="Tu nombre" autocomplete="name" required />
                            </div>
                            <div className="form-group">
                                <label for="registerEmail">Correo Electrónico</label>
                                <input type="email" id="registerEmail" className="form-input" placeholder="tu@email.com" autocomplete="email" required />
                            </div>
                            <div className="form-group">
                                <label for="registerInstitution">Institución</label>
                                <input type="text" id="registerInstitution" className="form-input" placeholder="Universidad o empresa" autocomplete="organization" required />
                            </div>
                            <div className="form-group">
                                <label for="registerPassword">Contraseña</label>
                                <input type="password" id="registerPassword" className="form-input" placeholder="••••••••" autocomplete="new-password" required />
                            </div>
                            <div className="form-group">
                                <label for="registerConfirmPassword">Confirmar Contraseña</label>
                                <input type="password" id="registerConfirmPassword" className="form-input" placeholder="••••••••" autocomplete="new-password" required />
                            </div>
                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input type="checkbox" id="agreeTerms" required />
                                    <span className="checkbox-text">
                                        Acepto los <a href="#terms">términos y condiciones</a> y la
                                        <a href="#privacy">política de privacidad</a>
                                    </span>
                                </label>
                            </div>
                            <button type="submit" className="btn btn-primary w-full">
                                <i className="fas fa-user-plus mr-2"></i>
                                Crear Cuenta
                            </button>
                        </form>
                        <div className="modal-footer">
                            <p>¿Ya tienes cuenta? <a href="#" id="switchToLogin">Inicia sesión aquí</a></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

// Iniciar servidor de desarrollo
const port = process.env.PORT || 3000;

console.log('🚀 Iniciando Choco Inventa - Development Server');
console.log(`📍 Servidor local: http://localhost:${port}`);
console.log(`🔧 Modo: ${devEnv.NODE_ENV}`);
console.log(`🤖 ML Service: ${devEnv.WORKERS_AI_MODEL ? 'Activado' : 'Simulado'}`);
console.log('📊 Base de datos: Mock Database (Desarrollo)');
console.log('💾 Cache: En memoria');
console.log('🌐 CORS: Configurado para desarrollo local');
console.log('');
console.log('✅ Servidor listo! Presiona Ctrl+C para detener');
console.log('');
console.log('📋 Endpoints disponibles:');
console.log('   GET  /                    - Página principal');
console.log('   GET  /portal              - Portal público');
console.log('   GET  /dashboard           - Dashboard principal');
console.log('   GET  /api/projects        - API de proyectos');
console.log('   GET  /api/analytics       - Analytics avanzado');
console.log('   GET  /api/forecasting     - Forecasting ML');
console.log('   GET  /api/ml              - ML Service');
console.log('   POST /api/projects        - Crear proyecto (con ML)');
console.log('   GET  /api/projects/recommendations - Recomendaciones ML');

export default {
  port,
  fetch: app.fetch,
};