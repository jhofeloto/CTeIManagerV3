// JavaScript para Dashboard CTeI-Manager

// Estado global del dashboard
const DashboardState = {
    user: null,
    token: localStorage.getItem('ctei_token') || null,
    currentView: 'dashboard',
    projects: [],
    adminProjects: [], // Proyectos para vista de administrador
    users: [], // Solo para admins
    selectedProject: null,
    charts: {}
};

// API Base URL
const API_BASE = '/api';

// Configurar axios con token
if (DashboardState.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${DashboardState.token}`;
}

// Verificar autenticación al cargar
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Dashboard inicializado');
    console.log('🎫 Token encontrado:', DashboardState.token ? 'SÍ' : 'NO');
    
    if (!DashboardState.token) {
        console.log('❌ Sin token - redirigiendo a login');
        window.location.href = '/';
        return;
    }
    
    console.log('✅ Token válido - iniciando dashboard');
    initDashboard();
});

// Funciones de utilidad
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function logout() {
    localStorage.removeItem('ctei_token');
    delete axios.defaults.headers.common['Authorization'];
    window.location.href = '/';
}

// Inicialización del dashboard
async function initDashboard() {
    console.log('🎯 Ejecutando initDashboard()');
    
    try {
        // Obtener perfil del usuario
        console.log('👤 Obteniendo perfil del usuario...');
        const profileResponse = await axios.get(`${API_BASE}/private/profile`);
        console.log('📋 Respuesta del perfil:', profileResponse.data);
        
        if (profileResponse.data.success) {
            DashboardState.user = profileResponse.data.data;
            console.log('✅ Usuario cargado:', DashboardState.user.full_name);
            
            renderDashboard();
            console.log('🎨 Dashboard renderizado, cargando datos...');
            
            await loadDashboardData();
            console.log('📊 Datos del dashboard cargados');
        } else {
            throw new Error('No se pudo cargar el perfil');
        }
    } catch (error) {
        console.error('❌ Error inicializando dashboard:', error);
        showToast('Error de autenticación. Redirigiendo...', 'error');
        setTimeout(() => {
            logout();
        }, 2000);
    }
}

// Renderizar la estructura base del dashboard
function renderDashboard() {
    const app = document.getElementById('app');
    
    const isAdmin = DashboardState.user.role === 'ADMIN';
    const isInvestigator = DashboardState.user.role === 'INVESTIGATOR' || isAdmin;
    
    // DEBUG: Logging para identificar problemas de roles
    console.log('🔍 DASHBOARD DEBUG:');
    console.log('   - User:', DashboardState.user);
    console.log('   - User Role:', DashboardState.user?.role);
    console.log('   - isAdmin:', isAdmin);
    console.log('   - isInvestigator:', isInvestigator);
    
    app.innerHTML = `
        <!-- Navbar -->
        <nav class="bg-card shadow-lg border-b border-border">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <div id="dashboard-site-logo" class="text-xl font-bold text-primary">
                            <i class="fas fa-flask mr-2"></i>
                            CTeI-Manager
                        </div>
                        <span class="ml-4 text-muted-foreground">Dashboard</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-muted-foreground">
                            ${DashboardState.user.full_name} (${DashboardState.user.role})
                        </span>
                        <button onclick="goToPublicPortal()" class="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                            Portal Público
                        </button>
                        <!-- Selector de Tema Claro/Oscuro -->
                        <button id="dashboard-theme-toggle" onclick="toggleDashboardTheme()" class="ctei-btn-secondary" title="Cambiar tema">
                            <i class="fas fa-moon" id="dashboard-theme-icon"></i>
                        </button>
                        <button onclick="logout()" class="text-destructive hover:text-destructive-foreground px-3 py-2 rounded-md text-sm font-medium">
                            <i class="fas fa-sign-out-alt mr-1"></i>
                            Salir
                        </button>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Contenido principal -->
        <div class="flex">
            <!-- Sidebar -->
            <aside class="w-64 bg-card shadow-lg min-h-screen border-r border-border">
                <nav class="p-4">
                    <ul class="space-y-2">
                        <li>
                            <button 
                                onclick="showView('dashboard')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-chart-line mr-3"></i>
                                Dashboard
                            </button>
                        </li>
                        ${isInvestigator ? `
                        <li>
                            <button 
                                onclick="showView('projects')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-project-diagram mr-3"></i>
                                Mis Proyectos
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('my-products')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-cubes mr-3"></i>
                                Mis Productos
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('file-manager')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-folder-open mr-3"></i>
                                Gestión de Archivos
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('advanced-analytics')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-chart-line mr-3"></i>
                                Analítica Avanzada
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('timeline')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-clock mr-3"></i>
                                Timeline
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('basic-monitoring')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-chart-bar mr-3"></i>
                                Monitoreo Básico
                            </button>
                        </li>
                        ` : ''}
                        <li>
                            <button 
                                onclick="showView('profile')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-user mr-3"></i>
                                Mi Perfil
                            </button>
                        </li>
                        ${isAdmin ? `
                        <li>
                            <button 
                                onclick="showView('admin-users')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-users mr-3"></i>
                                Gestión de Usuarios
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('monitoring')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-chart-line mr-3"></i>
                                Monitoreo en Tiempo Real
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('alerts')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-exclamation-triangle mr-3"></i>
                                Sistema de Alertas
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('scoring')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-chart-bar mr-3"></i>
                                Evaluación y Scoring
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('files')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-folder-open mr-3"></i>
                                Gestión de Archivos
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="debugMonitoringView()" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors border border-red-200"
                            >
                                <i class="fas fa-bug mr-3"></i>
                                🔧 Debug Monitoreo
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('admin-projects')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-cogs mr-3"></i>
                                Todos los Proyectos
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('admin-products')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-box mr-3"></i>
                                Gestión de Productos
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('admin-categories')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-tags mr-3"></i>
                                Categorías de Productos
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('admin-monitoring')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-analytics mr-3"></i>
                                Monitoreo Estratégico
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('admin-action-lines')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-road mr-3"></i>
                                Líneas de Acción
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('admin-site-config')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-cog mr-3"></i>
                                Configuración del Sitio
                            </button>
                        </li>
                        ` : ''}
                    </ul>
                </nav>
            </aside>

            <!-- Área de contenido -->
            <main class="flex-1 p-8">
                <div id="content">
                    <!-- El contenido se carga dinámicamente -->
                </div>
            </main>
        </div>
    `;

    // Establecer vista inicial
    showView('dashboard');
    
    // Cargar logo personalizado después de renderizar el navbar
    setTimeout(loadDashboardSiteLogo, 100);
    
    // Inicializar tema del dashboard
    setTimeout(initDashboardTheme, 50);
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar estadísticas (opcional - no bloquear si falla)
        try {
            const statsEndpoint = DashboardState.user.role === 'ADMIN' 
                ? `${API_BASE}/admin/dashboard/stats`
                : `${API_BASE}/private/dashboard/stats`;
                
            console.log('📈 Cargando estadísticas desde:', statsEndpoint);
            const statsResponse = await axios.get(statsEndpoint);
            
            if (statsResponse.data.success) {
                DashboardState.stats = statsResponse.data.data;
                console.log('✅ Estadísticas cargadas');
            } else {
                console.warn('⚠️ Estadísticas no disponibles:', statsResponse.data.error);
                DashboardState.stats = { projects: { total: 0 }, products: { total: 0 } };
            }
        } catch (statsError) {
            console.warn('⚠️ Error cargando estadísticas (continuando sin ellas):', statsError);
            DashboardState.stats = { projects: { total: 0 }, products: { total: 0 } };
        }
        
        // Cargar proyectos
        console.log('🔍 Cargando proyectos desde:', `${API_BASE}/private/projects`);
        const projectsResponse = await axios.get(`${API_BASE}/private/projects`);
        console.log('📊 Respuesta de proyectos:', projectsResponse.data);
        
        if (projectsResponse.data.success) {
            DashboardState.projects = projectsResponse.data.data.projects;
            console.log('✅ Proyectos cargados en DashboardState:', DashboardState.projects.length);
        } else {
            console.error('❌ Error en respuesta de proyectos:', projectsResponse.data.error);
        }
        
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
    }
}

// Sistema de navegación
function showView(view) {
    DashboardState.currentView = view;
    
    // Actualizar navegación activa
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('bg-primary', 'text-primary-foreground');
        item.classList.add('text-foreground');
    });
    
    const activeItem = document.querySelector(`[onclick="showView('${view}')"]`);
    if (activeItem) {
        activeItem.classList.add('bg-primary', 'text-primary-foreground');
        activeItem.classList.remove('text-foreground');
    }
    
    // Renderizar vista correspondiente
    switch (view) {
        case 'dashboard':
            renderMainDashboard();
            break;
        case 'projects':
            renderProjectsView();
            break;
        case 'my-products':
            renderMyProductsView();
            break;
        case 'file-manager':
            renderFileManagerView();
            break;
        case 'advanced-analytics':
            if (typeof renderAdvancedAnalyticsView === 'function') renderAdvancedAnalyticsView();
            break;
        case 'profile':
            renderProfileView();
            break;
        case 'admin-users':
            renderAdminUsersView();
            break;
        case 'admin-projects':
            renderAdminProjectsView();
            break;
        case 'admin-products':
            renderAdminProductsView();
            break;
        case 'admin-categories':
            renderAdminCategoriesView();
            break;
        case 'monitoring':
            renderMonitoringDashboard();
            break;
        case 'alerts':
            renderAlertsDashboard();
            break;
        case 'scoring':
            renderScoringDashboard();
            break;
        case 'files':
            renderFilesDashboard();
            break;
        case 'basic-monitoring':
            if (typeof renderBasicMonitoringView === 'function') renderBasicMonitoringView();
            else showToast('Vista de monitoreo básico en desarrollo', 'info');
            break;
        case 'timeline':
            if (typeof renderTimelineView === 'function') renderTimelineView();
            break;
        case 'admin-monitoring':
            if (typeof renderAdminMonitoringView === 'function') renderAdminMonitoringView();
            break;
        case 'admin-action-lines':
            if (typeof renderAdminActionLinesView === 'function') renderAdminActionLinesView();
            break;
        case 'admin-site-config':
            renderAdminSiteConfigView();
            break;
        default:
            renderMainDashboard();
    }
}

// Vista principal del dashboard
function renderMainDashboard() {
    const content = document.getElementById('content');
    
    const stats = DashboardState.stats || {};
    const isAdmin = DashboardState.user.role === 'ADMIN';
    
    content.innerHTML = `
        <!-- Encabezado del Dashboard -->
        <div class="ctei-content-card mb-6">
            <div class="ctei-content-card-header">
                <div>
                    <div class="ctei-content-card-title">
                        ${isAdmin ? 'Panel de Administración' : 'Mi Dashboard'}
                    </div>
                    <div class="ctei-content-card-subtitle">
                        ${isAdmin ? 'Vista general del sistema CTeI-Manager' : 'Resumen de tus proyectos y actividad'}
                    </div>
                </div>
            </div>
        </div>

        <!-- Métricas KPI usando componentes arquitectónicos -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            ${isAdmin ? `
            <div class="ctei-metric-card">
                <div class="ctei-metric-icon primary">
                    <i class="fas fa-users"></i>
                </div>
                <div class="ctei-metric-value">${stats.users?.total_users || 0}</div>
                <div class="ctei-metric-label">Usuarios Total</div>
            </div>
            ` : ''}
            
            <div class="ctei-metric-card">
                <div class="ctei-metric-icon chart-2">
                    <i class="fas fa-project-diagram"></i>
                </div>
                <div class="ctei-metric-value">${isAdmin ? (stats.projects?.total_projects || 0) : (stats.projects?.total || 0)}</div>
                <div class="ctei-metric-label">${isAdmin ? 'Proyectos Totales' : 'Mis Proyectos'}</div>
            </div>

            <div class="ctei-metric-card">
                <div class="ctei-metric-icon chart-3">
                    <i class="fas fa-cubes"></i>
                </div>
                <div class="ctei-metric-value">${isAdmin ? (stats.products?.total_products || 0) : (stats.products?.total || 0)}</div>
                <div class="ctei-metric-label">${isAdmin ? 'Productos Totales' : 'Mis Productos'}</div>
            </div>

            <div class="ctei-metric-card">
                <div class="ctei-metric-icon chart-4">
                    <i class="fas fa-eye"></i>
                </div>
                <div class="ctei-metric-value">${isAdmin ? (stats.projects?.public_projects || 0) : (stats.projects?.public || 0)}</div>
                <div class="ctei-metric-label">Proyectos Públicos</div>
            </div>
        </div>

        <!-- Actividad Reciente usando componente arquitectónico -->
        <div class="ctei-activity-list">
            <div class="ctei-content-card-header">
                <div class="ctei-content-card-title">
                    <i class="fas fa-chart-line mr-2"></i>
                    ${isAdmin ? 'Actividad Reciente del Sistema' : 'Mis Proyectos Recientes'}
                </div>
            </div>
            <div id="recentProjects">
                ${renderRecentProjectsList()}
            </div>
        </div>
    `;
}

function renderRecentProjectsList() {
    const projects = DashboardState.projects.slice(0, 5);
    
    if (projects.length === 0) {
        return `
            <div class="ctei-empty-state">
                <div class="ctei-empty-state-icon">
                    <i class="fas fa-project-diagram"></i>
                </div>
                <div class="ctei-empty-state-title">No hay proyectos para mostrar</div>
                <div class="ctei-empty-state-description">
                    Cuando tengas proyectos, aparecerán aquí los más recientes.
                </div>
            </div>
        `;
    }
    
    return projects.map(project => `
        <div class="ctei-activity-item">
            <div class="ctei-activity-title">
                ${project.title}
            </div>
            <div class="ctei-activity-description">
                ${project.abstract.substring(0, 120)}${project.abstract.length > 120 ? '...' : ''}
            </div>
            <div class="ctei-activity-meta">
                <span>
                    <i class="fas fa-calendar mr-1"></i>
                    ${formatDate(project.created_at)}
                </span>
                <span class="ctei-status-badge ${project.is_public ? 'public' : 'private'}">
                    ${project.is_public ? 'Público' : 'Privado'}
                </span>
                <button 
                    onclick="viewProject(${project.id})"
                    class="ctei-btn ctei-btn-secondary ctei-btn-sm ctei-tooltip"
                    data-tooltip="Ver detalles del proyecto"
                >
                    <i class="fas fa-arrow-right mr-1"></i>
                    Ver
                </button>
            </div>
        </div>
    `).join('');
}

// Vista de proyectos
function renderProjectsView() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold">Mis Proyectos</h2>
                <button 
                    onclick="showNewProjectModal()"
                    class="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Nuevo Proyecto
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="projectsGrid">
            ${renderProjectsGrid()}
        </div>
    `;
}

function renderProjectsGrid() {
    if (DashboardState.projects.length === 0) {
        return `
            <div class="col-span-full">
                <div class="ctei-empty-state">
                    <div class="ctei-empty-state-icon">
                        <i class="fas fa-project-diagram"></i>
                    </div>
                    <div class="ctei-empty-state-title">No tienes proyectos aún</div>
                    <div class="ctei-empty-state-description">
                        Los proyectos te permiten organizar tu investigación, colaborar con otros investigadores
                        y gestionar los productos científicos que generes.
                    </div>
                    <button 
                        onclick="showNewProjectModal()"
                        class="ctei-btn ctei-btn-primary ctei-btn-lg"
                    >
                        <i class="fas fa-plus mr-2"></i>
                        Crear Mi Primer Proyecto
                    </button>
                </div>
            </div>
        `;
    }
    
    return DashboardState.projects.map(project => `
        <div class="ctei-content-card">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-start justify-between mb-3">
                        <h4 class="font-semibold text-lg text-foreground">${project.title}</h4>
                        <span class="ctei-status-badge ${project.is_public ? 'public' : 'private'} ml-3">
                            <i class="fas fa-${project.is_public ? 'eye' : 'eye-slash'} mr-1"></i>
                            ${project.is_public ? 'Público' : 'Privado'}
                        </span>
                    </div>
                    
                    <p class="text-muted-foreground mb-4 leading-relaxed">
                        ${project.abstract.substring(0, 160)}${project.abstract.length > 160 ? '...' : ''}
                    </p>
                    
                    <div class="flex items-center text-sm text-muted-foreground mb-4">
                        <i class="fas fa-calendar mr-2"></i>
                        <span>Creado el ${formatDate(project.created_at)}</span>
                        ${project.status ? `
                            <span class="mx-3">•</span>
                            <span class="ctei-status-badge ${project.status.toLowerCase()}">
                                ${project.status}
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <!-- Acciones simplificadas -->
            <div class="flex justify-between items-center pt-4 border-t border-border">
                <!-- Acción principal: Ver/Editar -->
                <button 
                    onclick="editProject(${project.id})"
                    class="ctei-btn ctei-btn-primary"
                >
                    <i class="fas fa-edit mr-2"></i>
                    Editar Proyecto
                </button>
                
                <!-- Acciones secundarias en menú -->
                <div class="ctei-actions-menu">
                    <button 
                        class="ctei-actions-trigger ctei-tooltip"
                        data-tooltip="Más acciones"
                        onclick="toggleProjectActionsMenu(${project.id})"
                    >
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <div id="project-actions-${project.id}" class="ctei-actions-dropdown hidden">
                        <button 
                            onclick="viewProject(${project.id}); closeAllActionsMenus()"
                            class="ctei-actions-item"
                        >
                            <i class="fas fa-eye mr-2"></i>
                            Ver Detalles
                        </button>
                        <button 
                            onclick="toggleProjectVisibility(${project.id}, ${!project.is_public}); closeAllActionsMenus()"
                            class="ctei-actions-item"
                        >
                            <i class="fas fa-${project.is_public ? 'eye-slash' : 'eye'} mr-2"></i>
                            ${project.is_public ? 'Hacer Privado' : 'Hacer Público'}
                        </button>
                        <button 
                            onclick="duplicateProject(${project.id}); closeAllActionsMenus()"
                            class="ctei-actions-item"
                        >
                            <i class="fas fa-copy mr-2"></i>
                            Duplicar Proyecto
                        </button>
                        <button 
                            onclick="deleteProject(${project.id}); closeAllActionsMenus()"
                            class="ctei-actions-item destructive"
                        >
                            <i class="fas fa-trash mr-2"></i>
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Vista de mis productos
async function renderMyProductsView() {
    const content = document.getElementById('content');
    
    // Mostrar loading inicial
    content.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">Mis Productos CTeI</h2>
                    <p class="text-muted-foreground mt-1">
                        Gestiona todos tus productos de investigación
                    </p>
                </div>
                <button 
                    onclick="showCreateProductModal()"
                    class="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 shadow-lg"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Nuevo Producto
                </button>
            </div>
        </div>

        <div class="mb-6">
            <div class="flex flex-wrap gap-4">
                <select 
                    id="productStatusFilter" 
                    onchange="filterMyProducts()"
                    class="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                >
                    <option value="">Todos los estados</option>
                    <option value="public">Públicos</option>
                    <option value="private">Privados</option>
                </select>
                
                <select 
                    id="productCategoryFilter" 
                    onchange="filterMyProducts()"
                    class="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
                >
                    <option value="">Todas las categorías</option>
                </select>
                
                <input 
                    type="text" 
                    id="productSearchInput" 
                    placeholder="Buscar productos..."
                    onkeyup="filterMyProducts()"
                    class="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary flex-1 min-w-64"
                >
            </div>
        </div>

        <div id="myProductsList" class="space-y-4">
            <div class="flex justify-center py-8">
                <i class="fas fa-spinner fa-spin text-2xl text-primary"></i>
            </div>
        </div>
    `;
    
    // Cargar datos
    await loadMyProducts();
}

// Cargar todos los productos del usuario autenticado
async function loadMyProducts() {
    console.log('🔄 Cargando productos del usuario...');
    
    try {
        // Usar el nuevo endpoint que obtiene todos los productos del usuario directamente
        const [productsResponse, categoriesResponse] = await Promise.all([
            axios.get(`${API_BASE}/private/products`),
            axios.get(`${API_BASE}/public/product-categories`)
        ]);
        
        console.log('📊 Respuesta de productos:', productsResponse.data);
        console.log('📊 Respuesta de categorías:', categoriesResponse.data);
        
        if (productsResponse.data.success && categoriesResponse.data.success) {
            // Los productos ya vienen con la información del proyecto incluida
            const allProducts = productsResponse.data.data.products;
            
            console.log('✅ Productos cargados:', allProducts.length);
            
            // Guardar productos en el estado
            DashboardState.myProducts = allProducts;
            DashboardState.productCategories = categoriesResponse.data.data.categories;
            
            // Llenar filtro de categorías
            populateProductCategoryFilter();
            
            // Renderizar productos
            renderMyProductsList(allProducts);
        } else {
            throw new Error('Error en la respuesta de la API');
        }
    } catch (error) {
        console.error('❌ Error cargando mis productos:', error);
        document.getElementById('myProductsList').innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Error cargando productos: ${error.message}</p>
                <button 
                    onclick="loadMyProducts()" 
                    class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                >
                    <i class="fas fa-retry mr-2"></i>Reintentar
                </button>
            </div>
        `;
    }
}

// Llenar filtro de categorías
function populateProductCategoryFilter() {
    const categoryFilter = document.getElementById('productCategoryFilter');
    if (!categoryFilter || !DashboardState.productCategories) return;
    
    // Limpiar opciones existentes excepto la primera
    while (categoryFilter.children.length > 1) {
        categoryFilter.removeChild(categoryFilter.lastChild);
    }
    
    // Agrupar por category_group
    const groups = {};
    DashboardState.productCategories.forEach(category => {
        if (!groups[category.category_group]) {
            groups[category.category_group] = [];
        }
        groups[category.category_group].push(category);
    });
    
    // Añadir opciones por grupo
    Object.keys(groups).forEach(groupName => {
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupName;
        
        groups[groupName].forEach(category => {
            const option = document.createElement('option');
            option.value = category.code;
            option.textContent = category.name;
            optgroup.appendChild(option);
        });
        
        categoryFilter.appendChild(optgroup);
    });
}

// Renderizar lista de productos
function renderMyProductsList(products) {
    const container = document.getElementById('myProductsList');
    
    if (!products || products.length === 0) {
        container.innerHTML = `
            <div class="ctei-empty-state">
                <div class="ctei-empty-state-icon">
                    <i class="fas fa-cubes"></i>
                </div>
                <div class="ctei-empty-state-title">No tienes productos aún</div>
                <div class="ctei-empty-state-description">
                    Comienza creando tu primer producto de investigación. Los productos pueden incluir
                    publicaciones, patentes, software, datasets y más.
                </div>
                <button 
                    onclick="showCreateProductModal()"
                    class="ctei-btn ctei-btn-primary ctei-btn-lg"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Crear Primer Producto
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div id="product-card-${product.id}" class="ctei-content-card">
            <div class="flex justify-between items-start">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-3">
                        <h3 class="text-lg font-semibold text-foreground">${product.product_code}</h3>
                        <span class="ctei-status-badge ${product.is_public ? 'public' : 'private'}">
                            <i class="fas fa-${product.is_public ? 'eye' : 'eye-slash'} mr-1"></i>
                            ${product.is_public ? 'Público' : 'Privado'}
                        </span>
                        ${product.category_name ? `
                            <span class="ctei-status-badge active">
                                ${product.category_name}
                            </span>
                        ` : ''}
                    </div>
                    
                    <p class="text-muted-foreground mb-3 line-clamp-2">${product.description}</p>
                    
                    <div class="flex items-center text-sm text-muted-foreground mb-3 flex-wrap gap-4">
                        <span class="flex items-center">
                            <i class="fas fa-project-diagram mr-1"></i>
                            ${product.project_title}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-user mr-1"></i>
                            ${product.creator_name || 'N/A'}
                        </span>
                        <span class="flex items-center">
                            <i class="fas fa-calendar mr-1"></i>
                            ${new Date(product.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    
                    ${product.doi || product.url || product.journal ? `
                        <div class="flex items-center text-sm text-muted-foreground flex-wrap gap-4">
                            ${product.doi ? `<span class="flex items-center"><i class="fas fa-link mr-1"></i>DOI: ${product.doi}</span>` : ''}
                            ${product.journal ? `<span class="flex items-center"><i class="fas fa-book mr-1"></i>${product.journal}</span>` : ''}
                            ${product.impact_factor ? `<span class="flex items-center"><i class="fas fa-chart-line mr-1"></i>IF: ${product.impact_factor}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <!-- Acciones simplificadas con menú de tres puntos -->
                <div class="flex items-center space-x-2">
                    <!-- Acción principal: Editar -->
                    <button 
                        onclick="editProduct(${product.project_id}, ${product.id})"
                        class="ctei-btn ctei-btn-primary ctei-btn-sm ctei-tooltip"
                        data-tooltip="Editar producto"
                    >
                        <i class="fas fa-edit mr-1"></i>
                        Editar
                    </button>
                    
                    <!-- Menú de acciones secundarias -->
                    <div class="ctei-actions-menu">
                        <button 
                            class="ctei-actions-trigger ctei-tooltip"
                            data-tooltip="Más acciones"
                            onclick="toggleProductActionsMenu(${product.id})"
                        >
                            <i class="fas fa-ellipsis-v"></i>
                        </button>
                        <div id="product-actions-${product.id}" class="ctei-actions-dropdown hidden">
                            <button 
                                onclick="toggleProductVisibility(${product.project_id}, ${product.id}, ${product.is_public ? false : true}); closeAllActionsMenus()"
                                class="ctei-actions-item"
                            >
                                <i class="fas fa-${product.is_public ? 'eye-slash' : 'eye'} mr-2"></i>
                                ${product.is_public ? 'Ocultar' : 'Publicar'}
                            </button>
                            <button 
                                onclick="manageProductAuthors(${product.project_id}, ${product.id}); closeAllActionsMenus()"
                                class="ctei-actions-item"
                            >
                                <i class="fas fa-users mr-2"></i>
                                Gestionar Autores
                            </button>
                            <button 
                                onclick="deleteProduct(${product.project_id}, ${product.id}); closeAllActionsMenus()"
                                class="ctei-actions-item destructive"
                            >
                                <i class="fas fa-trash mr-2"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar productos
function filterMyProducts() {
    const statusFilter = document.getElementById('productStatusFilter')?.value || '';
    const categoryFilter = document.getElementById('productCategoryFilter')?.value || '';
    const searchInput = document.getElementById('productSearchInput')?.value?.toLowerCase() || '';
    
    if (!DashboardState.myProducts) return;
    
    let filteredProducts = DashboardState.myProducts.filter(product => {
        const matchesStatus = !statusFilter || 
            (statusFilter === 'public' && product.is_public) ||
            (statusFilter === 'private' && !product.is_public);
        
        const matchesCategory = !categoryFilter || product.product_type === categoryFilter;
        
        const matchesSearch = !searchInput || 
            product.product_code.toLowerCase().includes(searchInput) ||
            product.description.toLowerCase().includes(searchInput) ||
            product.project_title.toLowerCase().includes(searchInput);
        
        return matchesStatus && matchesCategory && matchesSearch;
    });
    
    renderMyProductsList(filteredProducts);
}

// Funciones de acción para productos
function editProduct(projectId, productId) {
    // Buscar el producto en nuestros datos
    const product = DashboardState.myProducts.find(p => p.id === productId);
    if (product) {
        showEnhancedProductModalWithAuthors(projectId, product);
    } else {
        showToast('Producto no encontrado', 'error');
    }
}

async function toggleProductVisibility(projectId, productId, makePublic) {
    try {
        const response = await axios.post(`${API_BASE}/private/projects/${projectId}/products/${productId}/publish`, {
            is_public: makePublic
        });
        
        if (response.data.success) {
            showToast(`Producto ${makePublic ? 'publicado' : 'ocultado'} exitosamente`, 'success');
            
            // Actualizar el estado local
            const product = DashboardState.myProducts.find(p => p.id === productId);
            if (product) {
                product.is_public = makePublic ? 1 : 0;
            }
            
            // Recargar los productos completamente para asegurar consistencia
            await loadMyProducts();
            
            // Re-renderizar la vista actual
            const currentView = DashboardState.currentView;
            if (currentView === 'my-products') {
                filterMyProducts();
            } else if (currentView === 'projects') {
                renderProjectsView();
            }
        } else {
            showToast(response.data.error || 'Error actualizando producto', 'error');
        }
    } catch (error) {
        console.error('Error actualizando visibilidad:', error);
        showToast('Error actualizando producto', 'error');
    }
}

// Función auxiliar para actualizar el botón de visibilidad y otros indicadores
function updateVisibilityButton(projectId, productId, isPublic) {
    // Esta función ya no es necesaria porque recargamos todo después del toggle
    // Se mantiene por compatibilidad pero no hace nada
}

function manageProductAuthors(projectId, productId) {
    const product = DashboardState.myProducts.find(p => p.id === productId);
    if (product) {
        showEnhancedProductModalWithAuthors(projectId, product);
    }
}

async function deleteProduct(projectId, productId) {
    const product = DashboardState.myProducts.find(p => p.id === productId);
    if (!product) {
        showToast('Producto no encontrado', 'error');
        return;
    }
    
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el producto "${product.product_code}"?\n\nEsta acción no se puede deshacer.`);
    if (!confirmDelete) return;
    
    try {
        const response = await axios.delete(`${API_BASE}/private/projects/${projectId}/products/${productId}`);
        
        if (response.data.success) {
            showToast('Producto eliminado exitosamente', 'success');
            
            // Remover del estado local
            DashboardState.myProducts = DashboardState.myProducts.filter(p => p.id !== productId);
            filterMyProducts(); // Re-renderizar
        } else {
            showToast(response.data.error || 'Error eliminando producto', 'error');
        }
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showToast('Error eliminando producto', 'error');
    }
}

function showCreateProductModal() {
    // Mostrar modal para seleccionar proyecto primero
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div class="p-6 border-b">
                <h3 class="text-lg font-semibold">Seleccionar Proyecto</h3>
                <p class="text-muted-foreground text-sm mt-1">Elige el proyecto al que pertenecerá el nuevo producto</p>
            </div>
            <div class="p-6">
                <select id="projectSelect" class="w-full p-3 border border-border rounded-lg">
                    <option value="">Selecciona un proyecto...</option>
                    ${DashboardState.projects.map(project => `
                        <option value="${project.id}">${project.title}</option>
                    `).join('')}
                </select>
            </div>
            <div class="p-6 border-t flex justify-end space-x-3">
                <button 
                    onclick="this.closest('.fixed').remove()"
                    class="px-4 py-2 text-muted-foreground hover:text-foreground"
                >
                    Cancelar
                </button>
                <button 
                    onclick="createProductInProject()"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                >
                    Continuar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function createProductInProject() {
    const projectSelect = document.getElementById('projectSelect');
    const projectId = projectSelect.value;
    
    if (!projectId) {
        showToast('Por favor selecciona un proyecto', 'error');
        return;
    }
    
    // Cerrar modal de selección
    document.querySelector('.fixed').remove();
    
    // Abrir modal de creación de producto
    showEnhancedProductModalWithAuthors(parseInt(projectId));
}

// Vista de perfil
function renderProfileView() {
    const content = document.getElementById('content');
    const user = DashboardState.user;
    
    content.innerHTML = `
        <!-- Encabezado de la vista -->
        <div class="ctei-content-card mb-6">
            <div class="ctei-content-card-header">
                <div>
                    <div class="ctei-content-card-title">
                        <i class="fas fa-user mr-2"></i>
                        Mi Perfil
                    </div>
                    <div class="ctei-content-card-subtitle">
                        Gestiona tu información personal y preferencias
                    </div>
                </div>
            </div>
        </div>

        <!-- Formulario de perfil -->
        <div class="max-w-2xl">
            <div class="ctei-content-card">
                <form onsubmit="updateProfile(event)" class="space-y-6">
                    <div class="ctei-form-group">
                        <label class="ctei-form-label">Nombre Completo</label>
                        <input 
                            type="text" 
                            id="profileName"
                            value="${user.full_name}" 
                            class="ctei-form-input"
                            required
                        >
                    </div>
                    
                    <div class="ctei-form-group">
                        <label class="ctei-form-label">Correo Electrónico</label>
                        <input 
                            type="email" 
                            value="${user.email}" 
                            disabled
                            class="ctei-form-input"
                        >
                        <p class="text-xs text-muted-foreground mt-1">
                            <i class="fas fa-info-circle mr-1"></i>
                            El email no se puede modificar
                        </p>
                    </div>
                    
                    <div class="ctei-form-group">
                        <label class="ctei-form-label">Rol en el Sistema</label>
                        <div class="flex items-center space-x-3">
                            <span class="ctei-status-badge ${user.role === 'ADMIN' ? 'destructive' : user.role === 'INVESTIGATOR' ? 'active' : 'private'}">
                                <i class="fas fa-${user.role === 'ADMIN' ? 'crown' : user.role === 'INVESTIGATOR' ? 'microscope' : 'users'} mr-1"></i>
                                ${user.role === 'ADMIN' ? 'Administrador' : user.role === 'INVESTIGATOR' ? 'Investigador' : 'Comunidad'}
                            </span>
                        </div>
                    </div>
                    
                    <div class="ctei-form-group">
                        <label class="ctei-form-label">Miembro desde</label>
                        <input 
                            type="text" 
                            value="${formatDate(user.created_at)}" 
                            disabled
                            class="ctei-form-input"
                        >
                    </div>
                    
                    <div class="flex justify-end pt-4 border-t border-border">
                        <button 
                            type="submit"
                            class="ctei-btn ctei-btn-primary ctei-btn-lg"
                        >
                            <i class="fas fa-save mr-2"></i>
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
}

// Funciones de proyectos
function showNewProjectModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Nuevo Proyecto</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form onsubmit="createProject(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Título *</label>
                            <input 
                                type="text" 
                                id="newProjectTitle"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Resumen *</label>
                            <textarea 
                                id="newProjectAbstract"
                                rows="4"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            ></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Palabras Clave</label>
                            <input 
                                type="text" 
                                id="newProjectKeywords"
                                placeholder="Separadas por comas"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Introducción</label>
                            <textarea 
                                id="newProjectIntroduction"
                                rows="3"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            ></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Metodología</label>
                            <textarea 
                                id="newProjectMethodology"
                                rows="3"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            ></textarea>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button"
                            onclick="this.closest('.fixed').remove()"
                            class="px-4 py-2 border border-border rounded-lg hover:bg-muted"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
                        >
                            <i class="fas fa-save mr-2"></i>
                            Crear Proyecto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function createProject(event) {
    event.preventDefault();
    
    const projectData = {
        title: document.getElementById('newProjectTitle').value,
        abstract: document.getElementById('newProjectAbstract').value,
        keywords: document.getElementById('newProjectKeywords').value || null,
        introduction: document.getElementById('newProjectIntroduction').value || null,
        methodology: document.getElementById('newProjectMethodology').value || null
    };
    
    try {
        const response = await axios.post(`${API_BASE}/private/projects`, projectData);
        
        if (response.data.success) {
            showToast('Proyecto creado exitosamente');
            
            // Cerrar modal
            document.querySelector('.fixed').remove();
            
            // Recargar proyectos
            await loadDashboardData();
            if (DashboardState.currentView === 'projects') {
                renderProjectsView();
            }
        }
    } catch (error) {
        const message = error.response?.data?.error || 'Error al crear el proyecto';
        showToast(message, 'error');
    }
}

async function toggleProjectVisibility(projectId, isPublic) {
    try {
        const response = await axios.post(`${API_BASE}/private/projects/${projectId}/publish`, {
            is_public: isPublic
        });
        
        if (response.data.success) {
            showToast(response.data.message);
            
            // Actualizar estado local
            const project = DashboardState.projects.find(p => p.id === projectId);
            if (project) {
                project.is_public = isPublic ? 1 : 0;
            }
            
            // Re-renderizar vista actual
            if (DashboardState.currentView === 'projects') {
                renderProjectsView();
            } else if (DashboardState.currentView === 'dashboard') {
                renderMainDashboard();
            }
            
            // Forzar actualización visual inmediata del botón
            const button = document.querySelector(`[onclick*="toggleProjectVisibility(${projectId}"]`);
            if (button) {
                const icon = button.querySelector('i');
                if (isPublic) {
                    // Proyecto ahora es público - botón para ocultar
                    button.className = 'flex-1 bg-muted text-muted-foreground py-2 px-3 rounded text-sm hover:opacity-90';
                    icon.className = 'fas fa-eye-slash mr-1';
                    button.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Ocultar';
                    button.setAttribute('onclick', `toggleProjectVisibility(${projectId}, false)`);
                } else {
                    // Proyecto ahora es privado - botón para publicar
                    button.className = 'flex-1 bg-primary text-primary-foreground py-2 px-3 rounded text-sm hover:opacity-90';
                    icon.className = 'fas fa-eye mr-1';
                    button.innerHTML = '<i class="fas fa-eye mr-1"></i>Publicar';
                    button.setAttribute('onclick', `toggleProjectVisibility(${projectId}, true)`);
                }
            }
        }
    } catch (error) {
        const message = error.response?.data?.error || 'Error al actualizar el proyecto';
        showToast(message, 'error');
    }
}

// Funciones adicionales necesarias
function viewProject(projectId) {
    // Implementar vista detallada del proyecto
    console.log('Ver proyecto:', projectId);
}

function editProject(projectId) {
    // Buscar el proyecto en el estado
    const project = DashboardState.projects.find(p => p.id === projectId);
    if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return;
    }
    
    showEditProjectModal(project);
}

// Modal de edición de proyecto
function showEditProjectModal(project) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-semibold">Editar Proyecto</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form onsubmit="updateProject(event, ${project.id})">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Título *</label>
                            <input 
                                type="text" 
                                id="editProjectTitle"
                                value="${project.title || ''}"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Resumen *</label>
                            <textarea 
                                id="editProjectAbstract"
                                rows="4"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            >${project.abstract || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Palabras Clave</label>
                            <input 
                                type="text" 
                                id="editProjectKeywords"
                                value="${project.keywords || ''}"
                                placeholder="Separadas por comas"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Introducción</label>
                            <textarea 
                                id="editProjectIntroduction"
                                rows="3"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >${project.introduction || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Metodología</label>
                            <textarea 
                                id="editProjectMethodology"
                                rows="3"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >${project.methodology || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Estado</label>
                            <select 
                                id="editProjectStatus"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="DRAFT" ${project.status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
                                <option value="ACTIVE" ${project.status === 'ACTIVE' ? 'selected' : ''}>Activo</option>
                                <option value="REVIEW" ${project.status === 'REVIEW' ? 'selected' : ''}>En Revisión</option>
                                <option value="COMPLETED" ${project.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
                                <option value="SUSPENDED" ${project.status === 'SUSPENDED' ? 'selected' : ''}>Suspendido</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button"
                            onclick="this.closest('.fixed').remove()"
                            class="bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:opacity-90"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                        >
                            <i class="fas fa-save mr-1"></i>
                            Actualizar Proyecto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Función para actualizar proyecto
async function updateProject(event, projectId) {
    event.preventDefault();
    
    const projectData = {
        title: document.getElementById('editProjectTitle').value,
        abstract: document.getElementById('editProjectAbstract').value,
        keywords: document.getElementById('editProjectKeywords').value || null,
        introduction: document.getElementById('editProjectIntroduction').value || null,
        methodology: document.getElementById('editProjectMethodology').value || null,
        status: document.getElementById('editProjectStatus').value
    };
    
    try {
        const response = await axios.put(`${API_BASE}/private/projects/${projectId}`, projectData);
        
        if (response.data.success) {
            showToast('Proyecto actualizado exitosamente');
            
            // Cerrar modal
            document.querySelector('.fixed').remove();
            
            // Actualizar estado local
            const projectIndex = DashboardState.projects.findIndex(p => p.id === projectId);
            if (projectIndex !== -1) {
                DashboardState.projects[projectIndex] = { ...DashboardState.projects[projectIndex], ...projectData };
            }
            
            // Re-renderizar vista actual
            if (DashboardState.currentView === 'projects') {
                renderProjectsView();
            } else if (DashboardState.currentView === 'dashboard') {
                renderMainDashboard();
            }
        }
    } catch (error) {
        const message = error.response?.data?.error || 'Error al actualizar el proyecto';
        showToast(message, 'error');
    }
}

async function updateProfile(event) {
    event.preventDefault();
    
    const newName = document.getElementById('profileName').value;
    const submitButton = event.target.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    if (!newName.trim()) {
        showToast('El nombre no puede estar vacío', 'error');
        return;
    }
    
    try {
        // Mostrar estado de carga
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        
        // Por ahora solo mostrar mensaje, ya que no implementamos actualización de perfil en el backend
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simular delay
        showToast('Función de actualización de perfil pendiente de implementar');
        
    } catch (error) {
        showToast('Error al actualizar perfil', 'error');
    } finally {
        // Restaurar botón
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
}

// ===== DASHBOARD DE SISTEMA DE ALERTAS INTELIGENTES - FASE 2B =====
async function renderAlertsDashboard() {
    try {
        document.getElementById('content').innerHTML = `
            <div class="space-y-6">
                <!-- Encabezado del Dashboard de Alertas -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div>
                            <div class="ctei-content-card-title">
                                <i class="fas fa-exclamation-triangle text-accent mr-3"></i>
                                Sistema de Alertas Inteligentes
                            </div>
                            <div class="ctei-content-card-description">
                                Fase 2B - Análisis Proactivo de Riesgos y Oportunidades
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div id="alerts-last-updated" class="text-sm text-muted-foreground">
                                <i class="fas fa-sync-alt mr-1"></i>
                                Cargando...
                            </div>
                            <button 
                                onclick="refreshAlertsDashboard()"
                                class="ctei-btn-primary"
                            >
                                <i class="fas fa-sync-alt mr-2"></i>
                                Actualizar
                            </button>
                            <button 
                                onclick="runRiskAnalysis()"
                                class="ctei-btn-secondary"
                                style="background-color: var(--chart-3); color: var(--background);"
                            >
                                <i class="fas fa-robot mr-2"></i>
                                Análisis IA
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Filtros de Alertas -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">Filtros de Alertas</div>
                    </div>
                    <div class="p-4">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Estado</label>
                                <select id="alert-status-filter" onchange="filterAlerts()" 
                                        class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary">
                                    <option value="ACTIVE">Activas</option>
                                    <option value="ALL">Todas</option>
                                    <option value="ACKNOWLEDGED">Reconocidas</option>
                                    <option value="RESOLVED">Resueltas</option>
                                    <option value="DISMISSED">Descartadas</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Categoría</label>
                                <select id="alert-category-filter" onchange="filterAlerts()" 
                                        class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary">
                                    <option value="">Todas las categorías</option>
                                    <option value="PERFORMANCE">Rendimiento</option>
                                    <option value="RISK">Riesgos</option>
                                    <option value="OPPORTUNITY">Oportunidades</option>
                                    <option value="COMPLIANCE">Cumplimiento</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Severidad</label>
                                <select id="alert-severity-filter" onchange="filterAlerts()" 
                                        class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary">
                                    <option value="">Todos los niveles</option>
                                    <option value="1">Crítico</option>
                                    <option value="2">Alto</option>
                                    <option value="3">Medio</option>
                                    <option value="4">Bajo</option>
                                    <option value="5">Informativo</option>
                                </select>
                            </div>
                            <div class="flex items-end">
                                <button onclick="clearAlertsFilters()" 
                                        class="w-full bg-muted text-muted-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                                    <i class="fas fa-times mr-2"></i>
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas de Alertas -->
                <div id="alerts-statistics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Se carga dinámicamente -->
                </div>

                <!-- Lista de Alertas -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-list mr-2"></i>
                            Alertas del Sistema
                        </div>
                        <div id="alerts-count" class="text-sm text-muted-foreground">
                            <!-- Contador de alertas -->
                        </div>
                    </div>
                    <div id="alerts-list" class="divide-y divide-border">
                        <!-- Lista de alertas se carga dinámicamente -->
                        <div class="p-8 text-center text-muted-foreground">
                            <i class="fas fa-spinner fa-spin text-2xl mb-4"></i>
                            <p>Cargando alertas del sistema...</p>
                        </div>
                    </div>
                </div>

                <!-- Paginación -->
                <div id="alerts-pagination" class="flex justify-center">
                    <!-- Paginación se carga dinámicamente -->
                </div>
            </div>
        `;

        // Cargar datos iniciales
        await loadAlertsOverview();
        
        // Configurar actualización automática cada 2 minutos para alertas
        if (window.alertsInterval) {
            clearInterval(window.alertsInterval);
        }
        window.alertsInterval = setInterval(loadAlertsOverview, 120000);

    } catch (error) {
        console.error('Error renderizando dashboard de alertas:', error);
        showToast('Error al cargar el dashboard de alertas', 'error');
    }
}

// Cargar vista general de alertas
async function loadAlertsOverview() {
    try {
        const status = document.getElementById('alert-status-filter')?.value || 'ACTIVE';
        const category = document.getElementById('alert-category-filter')?.value || '';
        const severity = document.getElementById('alert-severity-filter')?.value || '';
        const page = window.currentAlertsPage || 1;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10',
            status
        });
        
        if (category) params.append('category', category);
        if (severity) params.append('severity', severity);

        const response = await axios.get(`/api/admin/alerts/overview?${params}`);
        
        if (response.data.success) {
            renderAlertsStatistics(response.data.data.statistics);
            renderAlertsList(response.data.data.alerts);
            renderAlertsPagination(response.data.data.pagination);
            
            // Actualizar contador
            const alertsCount = document.getElementById('alerts-count');
            if (alertsCount) {
                alertsCount.textContent = `${response.data.data.pagination.total} alertas encontradas`;
            }

            // Actualizar timestamp
            const lastUpdated = document.getElementById('alerts-last-updated');
            if (lastUpdated) {
                lastUpdated.innerHTML = `<i class="fas fa-clock mr-1"></i>Actualizado: ${new Date().toLocaleTimeString()}`;
            }
        }
    } catch (error) {
        console.error('Error loading alerts overview:', error);
        showToast('Error al cargar alertas', 'error');
    }
}

// Renderizar estadísticas de alertas
function renderAlertsStatistics(stats) {
    const container = document.getElementById('alerts-statistics');
    if (!container) return;

    const categoryColors = {
        PERFORMANCE: '#FF8C00',
        RISK: '#FF4444', 
        OPPORTUNITY: '#32CD32',
        COMPLIANCE: '#4169E1'
    };

    let statisticsHTML = `
        <!-- Total de Alertas Activas -->
        <div class="ctei-stats-card">
            <div class="flex items-center">
                <div class="p-3" style="background-color: var(--chart-1); opacity: 0.1; border-radius: var(--radius);">
                    <i class="ctei-stats-icon fas fa-exclamation-circle" style="color: var(--chart-1);"></i>
                </div>
                <div class="ml-4">
                    <p class="ctei-stats-number">${stats.total_active}</p>
                    <p class="ctei-stats-label">Alertas Activas</p>
                </div>
            </div>
        </div>

        <!-- Prioridad Promedio -->
        <div class="ctei-stats-card">
            <div class="flex items-center">
                <div class="p-3" style="background-color: var(--chart-2); opacity: 0.1; border-radius: var(--radius);">
                    <i class="ctei-stats-icon fas fa-tachometer-alt" style="color: var(--chart-2);"></i>
                </div>
                <div class="ml-4">
                    <p class="ctei-stats-number">${Math.round(stats.avg_priority)}</p>
                    <p class="ctei-stats-label">Prioridad Promedio</p>
                </div>
            </div>
        </div>
    `;

    // Añadir estadísticas por categoría
    const categories = Object.keys(stats.by_category);
    if (categories.length > 0) {
        const topCategory = categories.reduce((a, b) => 
            stats.by_category[a] > stats.by_category[b] ? a : b
        );
        
        statisticsHTML += `
            <!-- Categoría Principal -->
            <div class="ctei-stats-card">
                <div class="flex items-center">
                    <div class="p-3" style="background-color: ${categoryColors[topCategory] || '#666'}; opacity: 0.1; border-radius: var(--radius);">
                        <i class="ctei-stats-icon fas fa-tags" style="color: ${categoryColors[topCategory] || '#666'};"></i>
                    </div>
                    <div class="ml-4">
                        <p class="ctei-stats-number">${stats.by_category[topCategory]}</p>
                        <p class="ctei-stats-label">${getCategoryDisplayName(topCategory)}</p>
                    </div>
                </div>
            </div>
        `;
    }

    // Severidad crítica
    const criticalCount = stats.by_severity[1] || 0;
    statisticsHTML += `
        <!-- Alertas Críticas -->
        <div class="ctei-stats-card ${criticalCount > 0 ? 'border-l-4' : ''}" 
             style="${criticalCount > 0 ? 'border-left-color: #FF0000;' : ''}">
            <div class="flex items-center">
                <div class="p-3" style="background-color: #FF0000; opacity: 0.1; border-radius: var(--radius);">
                    <i class="ctei-stats-icon fas fa-exclamation-triangle" style="color: #FF0000;"></i>
                </div>
                <div class="ml-4">
                    <p class="ctei-stats-number ${criticalCount > 0 ? 'text-red-600 font-bold' : ''}">${criticalCount}</p>
                    <p class="ctei-stats-label">Alertas Críticas</p>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = statisticsHTML;
}

// Renderizar lista de alertas
function renderAlertsList(alerts) {
    const container = document.getElementById('alerts-list');
    if (!container) return;

    if (alerts.length === 0) {
        container.innerHTML = `
            <div class="p-8 text-center text-muted-foreground">
                <i class="fas fa-check-circle text-4xl mb-4" style="color: var(--chart-3);"></i>
                <p class="text-lg font-medium mb-2">¡Excelente!</p>
                <p>No hay alertas que requieran atención en este momento.</p>
            </div>
        `;
        return;
    }

    let alertsHTML = '';
    
    alerts.forEach(alert => {
        const priorityClass = getPriorityClass(alert.priority_score);
        const severityBadgeClass = getSeverityBadgeClass(alert.severity_level);
        const categoryIcon = getCategoryIcon(alert.category);
        
        alertsHTML += `
            <div class="p-6 hover:bg-muted/30 transition-colors" data-alert-id="${alert.id}">
                <div class="flex items-start justify-between">
                    <div class="flex items-start space-x-4 flex-1">
                        <!-- Icono y indicador de prioridad -->
                        <div class="flex-shrink-0">
                            <div class="w-12 h-12 rounded-lg flex items-center justify-center" 
                                 style="background-color: ${alert.color_code}20; border: 2px solid ${alert.color_code}40;">
                                <i class="${alert.icon}" style="color: ${alert.color_code}; font-size: 1.2rem;"></i>
                            </div>
                        </div>

                        <!-- Contenido de la alerta -->
                        <div class="flex-1 min-w-0">
                            <div class="flex items-center space-x-3 mb-2">
                                <h3 class="text-lg font-semibold text-foreground truncate">
                                    ${alert.title}
                                </h3>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${severityBadgeClass}">
                                    ${alert.severity_label}
                                </span>
                                <span class="px-2 py-1 text-xs font-medium rounded-full ${priorityClass}">
                                    ${alert.priority_label}
                                </span>
                            </div>
                            
                            <p class="text-muted-foreground mb-3 leading-relaxed">
                                ${alert.message}
                            </p>
                            
                            <div class="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                                <span class="flex items-center">
                                    <i class="${categoryIcon} mr-1"></i>
                                    ${getCategoryDisplayName(alert.category)}
                                </span>
                                <span class="flex items-center">
                                    <i class="fas fa-tag mr-1"></i>
                                    ${alert.entity_type}: ${alert.entity_name}
                                </span>
                                <span class="flex items-center">
                                    <i class="fas fa-clock mr-1"></i>
                                    ${alert.time_ago}
                                </span>
                            </div>

                            <!-- Acciones recomendadas -->
                            ${alert.recommended_actions && alert.recommended_actions.length > 0 ? `
                                <div class="mb-3">
                                    <p class="text-sm font-medium text-foreground mb-2">
                                        <i class="fas fa-lightbulb mr-1"></i>
                                        Acciones Recomendadas:
                                    </p>
                                    <div class="flex flex-wrap gap-2">
                                        ${alert.recommended_actions.slice(0, 3).map(action => 
                                            `<span class="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full border">
                                                ${action}
                                             </span>`
                                        ).join('')}
                                        ${alert.recommended_actions.length > 3 ? 
                                            `<span class="text-xs text-muted-foreground">+${alert.recommended_actions.length - 3} más</span>`
                                        : ''}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>

                    <!-- Acciones de la alerta -->
                    <div class="flex items-center space-x-2 ml-4">
                        ${alert.status === 'ACTIVE' ? `
                            <button onclick="updateAlertStatus(${alert.id}, 'ACKNOWLEDGED')" 
                                    class="px-3 py-1 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-90 transition-all">
                                <i class="fas fa-check mr-1"></i>
                                Reconocer
                            </button>
                            <button onclick="updateAlertStatus(${alert.id}, 'RESOLVED')" 
                                    class="px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600 transition-colors">
                                <i class="fas fa-check-double mr-1"></i>
                                Resolver
                            </button>
                        ` : `
                            <span class="px-3 py-1 text-sm rounded-md ${getStatusBadgeClass(alert.status)}">
                                ${getStatusDisplayName(alert.status)}
                            </span>
                        `}
                        <button onclick="showAlertDetails(${alert.id})" 
                                class="px-2 py-1 text-muted-foreground hover:text-foreground transition-colors">
                            <i class="fas fa-info-circle"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = alertsHTML;
}

// Renderizar paginación
function renderAlertsPagination(pagination) {
    const container = document.getElementById('alerts-pagination');
    if (!container) return;

    if (pagination.total_pages <= 1) {
        container.innerHTML = '';
        return;
    }

    let paginationHTML = '<div class="flex items-center space-x-2">';
    
    // Botón anterior
    if (pagination.has_prev) {
        paginationHTML += `
            <button onclick="changeAlertsPage(${pagination.page - 1})" 
                    class="px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
    }

    // Números de página
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.total_pages, pagination.page + 2);

    if (startPage > 1) {
        paginationHTML += `<button onclick="changeAlertsPage(1)" class="px-3 py-2 border border-border rounded-md hover:bg-accent">1</button>`;
        if (startPage > 2) {
            paginationHTML += `<span class="px-2">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === pagination.page;
        paginationHTML += `
            <button onclick="changeAlertsPage(${i})" 
                    class="px-3 py-2 border rounded-md transition-colors ${isActive ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-accent'}">
                ${i}
            </button>
        `;
    }

    if (endPage < pagination.total_pages) {
        if (endPage < pagination.total_pages - 1) {
            paginationHTML += `<span class="px-2">...</span>`;
        }
        paginationHTML += `<button onclick="changeAlertsPage(${pagination.total_pages})" class="px-3 py-2 border border-border rounded-md hover:bg-accent">${pagination.total_pages}</button>`;
    }

    // Botón siguiente
    if (pagination.has_next) {
        paginationHTML += `
            <button onclick="changeAlertsPage(${pagination.page + 1})" 
                    class="px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors">
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
    }

    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

// Funciones de utilidad para alertas
function getCategoryDisplayName(category) {
    const names = {
        PERFORMANCE: 'Rendimiento',
        RISK: 'Riesgos',
        OPPORTUNITY: 'Oportunidades', 
        COMPLIANCE: 'Cumplimiento'
    };
    return names[category] || category;
}

function getCategoryIcon(category) {
    const icons = {
        PERFORMANCE: 'fas fa-chart-line',
        RISK: 'fas fa-exclamation-triangle',
        OPPORTUNITY: 'fas fa-rocket',
        COMPLIANCE: 'fas fa-shield-alt'
    };
    return icons[category] || 'fas fa-tag';
}

function getPriorityClass(score) {
    if (score >= 80) return 'bg-red-100 text-red-800';
    if (score >= 60) return 'bg-orange-100 text-orange-800';
    if (score >= 40) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
}

function getSeverityBadgeClass(level) {
    const classes = {
        1: 'bg-red-100 text-red-800',
        2: 'bg-orange-100 text-orange-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-primary/10 text-primary',
        5: 'bg-gray-100 text-gray-800'
    };
    return classes[level] || 'bg-gray-100 text-gray-800';
}

function getStatusBadgeClass(status) {
    const classes = {
        ACTIVE: 'bg-red-100 text-red-800',
        ACKNOWLEDGED: 'bg-primary/10 text-primary',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
        RESOLVED: 'bg-green-100 text-green-800',
        DISMISSED: 'bg-gray-100 text-gray-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
}

function getStatusDisplayName(status) {
    const names = {
        ACTIVE: 'Activa',
        ACKNOWLEDGED: 'Reconocida',
        IN_PROGRESS: 'En Progreso',
        RESOLVED: 'Resuelta',
        DISMISSED: 'Descartada'
    };
    return names[status] || status;
}

// Funciones de interacción
async function updateAlertStatus(alertId, newStatus) {
    try {
        const response = await axios.put(`/api/admin/alerts/${alertId}/status`, {
            status: newStatus
        });
        
        if (response.data.success) {
            showToast(response.data.data.message, 'success');
            await loadAlertsOverview(); // Recargar la lista
        }
    } catch (error) {
        console.error('Error updating alert status:', error);
        showToast('Error al actualizar estado de alerta', 'error');
    }
}

function filterAlerts() {
    window.currentAlertsPage = 1; // Reset a la primera página
    loadAlertsOverview();
}

function clearAlertsFilters() {
    document.getElementById('alert-status-filter').value = 'ACTIVE';
    document.getElementById('alert-category-filter').value = '';
    document.getElementById('alert-severity-filter').value = '';
    filterAlerts();
}

function changeAlertsPage(page) {
    window.currentAlertsPage = page;
    loadAlertsOverview();
}

function refreshAlertsDashboard() {
    loadAlertsOverview();
}

async function runRiskAnalysis() {
    try {
        showToast('Ejecutando análisis de riesgos con IA...', 'info');
        
        const response = await axios.post('/api/admin/alerts/analyze-risks', {
            type: 'all'
        });
        
        if (response.data.success) {
            showToast(response.data.data.message, 'success');
            // Recargar las alertas después de un breve delay
            setTimeout(() => {
                loadAlertsOverview();
            }, 1000);
        }
    } catch (error) {
        console.error('Error running risk analysis:', error);
        showToast('Error al ejecutar análisis de riesgos', 'error');
    }
}

function showAlertDetails(alertId) {
    showToast('Funcionalidad de detalles en desarrollo', 'info');
}

// ===== FUNCIÓN DE DEBUG PARA MONITOREO =====
async function debugMonitoringView() {
    console.log('🔧 DEBUG: Iniciando debug de monitoreo');
    
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="ctei-content-card">
                <div class="ctei-content-card-header">
                    <div class="ctei-content-card-title">
                        🔧 Debug: Sistema de Monitoreo en Tiempo Real
                    </div>
                    <div class="ctei-content-card-description">
                        Diagnóstico del sistema de monitoreo - Fase 2A Semana 2
                    </div>
                </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Panel de Estado del Usuario -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">👤 Estado del Usuario</div>
                    </div>
                    <div class="p-4 space-y-2 text-sm">
                        <div><strong>Email:</strong> ${DashboardState.user?.email || 'No disponible'}</div>
                        <div><strong>Nombre:</strong> ${DashboardState.user?.full_name || 'No disponible'}</div>
                        <div><strong>Rol:</strong> <span class="font-mono px-2 py-1 bg-accent text-accent-foreground rounded">${DashboardState.user?.role || 'No disponible'}</span></div>
                        <div><strong>Token:</strong> ${DashboardState.token ? '✅ Presente' : '❌ Ausente'}</div>
                        <div><strong>Es Admin:</strong> ${DashboardState.user?.role === 'ADMIN' ? '✅ SÍ' : '❌ NO'}</div>
                    </div>
                </div>
                
                <!-- Panel de Tests API -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">🔌 Test APIs</div>
                    </div>
                    <div class="p-4 space-y-3">
                        <button onclick="testMonitoringAPIDebug()" class="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                            Test API Monitoreo
                        </button>
                        <button onclick="showView('monitoring')" class="w-full bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90">
                            Cargar Monitoreo Real
                        </button>
                        <button onclick="loadMonitoringOverview()" class="w-full bg-secondary text-secondary-foreground px-4 py-2 rounded hover:bg-accent">
                            Test Función loadMonitoringOverview()
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Panel de Resultados -->
            <div class="ctei-content-card">
                <div class="ctei-content-card-header">
                    <div class="ctei-content-card-title">📊 Resultados de Pruebas</div>
                </div>
                <div id="debug-results" class="p-4 min-h-[200px] bg-gray-50 rounded">
                    <p class="text-gray-500">Los resultados de las pruebas aparecerán aquí...</p>
                </div>
            </div>
        </div>
    `;
}

async function testMonitoringAPIDebug() {
    const resultsDiv = document.getElementById('debug-results');
    resultsDiv.innerHTML = '<div class="animate-pulse">🔄 Probando API de monitoreo...</div>';
    
    try {
        console.log('🔧 Probando API con token:', DashboardState.token);
        
        const response = await axios.get('/api/admin/monitoring/overview');
        
        resultsDiv.innerHTML = `
            <div class="space-y-4">
                <h3 class="text-lg font-semibold text-green-600">✅ API Response Exitosa</h3>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div class="bg-white p-3 rounded">
                        <div class="font-semibold">Proyectos</div>
                        <div class="text-2xl text-primary font-bold">${response.data.data.system_metrics.total_projects}</div>
                    </div>
                    <div class="bg-white p-3 rounded">
                        <div class="font-semibold">Productos</div>
                        <div class="text-2xl text-green-600">${response.data.data.system_metrics.total_products}</div>
                    </div>
                    <div class="bg-white p-3 rounded">
                        <div class="font-semibold">Investigadores</div>
                        <div class="text-2xl text-primary font-bold">${response.data.data.system_metrics.total_researchers}</div>
                    </div>
                    <div class="bg-white p-3 rounded">
                        <div class="font-semibold">Líneas de Acción</div>
                        <div class="text-2xl text-orange-600">${response.data.data.action_line_metrics.length}</div>
                    </div>
                </div>
                <details class="mt-4">
                    <summary class="cursor-pointer font-medium">Ver JSON completo</summary>
                    <pre class="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-64">${JSON.stringify(response.data.data, null, 2)}</pre>
                </details>
            </div>
        `;
        
    } catch (error) {
        console.error('❌ Error en API:', error);
        resultsDiv.innerHTML = `
            <div class="text-red-600">
                <h3 class="text-lg font-semibold">❌ Error en API</h3>
                <p><strong>Status:</strong> ${error.response?.status || 'N/A'}</p>
                <p><strong>Mensaje:</strong> ${error.message}</p>
                <p><strong>URL:</strong> /api/admin/monitoring/overview</p>
                <details class="mt-2">
                    <summary class="cursor-pointer">Ver error completo</summary>
                    <pre class="mt-2 p-4 bg-red-50 rounded text-xs overflow-auto max-h-32">${JSON.stringify(error.response?.data || error, null, 2)}</pre>
                </details>
            </div>
        `;
    }
}

// ===== DASHBOARD DE MONITOREO EN TIEMPO REAL =====
// Función para renderizar el dashboard de monitoreo
async function renderMonitoringDashboard() {
    try {
        document.getElementById('content').innerHTML = `
            <div class="space-y-6">
                <!-- Encabezado del Dashboard de Monitoreo -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div>
                            <div class="ctei-content-card-title">
                                <i class="fas fa-chart-line text-accent mr-3"></i>
                                Dashboard de Monitoreo en Tiempo Real
                            </div>
                            <div class="ctei-content-card-description">
                                Sistema Departamental de Ciencias del Chocó - Fase 2A Semana 2
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div id="last-updated" class="text-sm text-muted-foreground">
                                <i class="fas fa-clock mr-1"></i>
                                Actualizando...
                            </div>
                            <button 
                                onclick="loadMonitoringOverview()"
                                class="ctei-btn-primary"
                            >
                                <i class="fas fa-sync-alt mr-2"></i>
                                Actualizar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Métricas Generales del Sistema -->
                <div id="system-metrics" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <!-- Se carga dinámicamente -->
                </div>

                <!-- Alertas Críticas -->
                <div id="critical-alerts" class="ctei-content-card" style="display: none;">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-exclamation-triangle text-destructive mr-2"></i>
                            Alertas Críticas
                        </div>
                        <div class="text-sm text-muted-foreground" id="alerts-count">
                            <!-- Contador de alertas -->
                        </div>
                    </div>
                    <div class="ctei-content-card-body">
                        <div id="alerts-container">
                            <!-- Lista de alertas -->
                        </div>
                    </div>
                </div>

                <!-- Proyectos que Requieren Atención -->
                <div id="attention-projects" class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-exclamation-circle text-warning mr-2"></i>
                            Proyectos que Requieren Atención
                        </div>
                        <div class="text-sm text-muted-foreground" id="attention-count">
                            <!-- Contador de proyectos -->
                        </div>
                    </div>
                    <div class="ctei-content-card-body">
                        <div id="projects-attention-list">
                            <!-- Lista de proyectos -->
                        </div>
                    </div>
                </div>

                <!-- Métricas por Línea de Acción -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-bullseye text-accent mr-2"></i>
                            Estado por Línea de Acción
                        </div>
                    </div>
                    <div class="ctei-content-card-body">
                        <div id="action-lines-metrics" class="space-y-4">
                            <!-- Métricas por línea -->
                        </div>
                    </div>
                </div>

                <!-- Gráficos de Tendencias -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="ctei-content-card">
                        <div class="ctei-content-card-header">
                            <div class="ctei-content-card-title">
                                <i class="fas fa-chart-area text-accent mr-2"></i>
                                Tendencias de Proyectos (30 días)
                            </div>
                        </div>
                        <div class="ctei-content-card-body">
                            <div id="project-trends-chart" class="h-64 flex items-center justify-center text-muted-foreground">
                                <i class="fas fa-spinner fa-spin mr-2"></i>
                                Cargando gráfico...
                            </div>
                        </div>
                    </div>
                    
                    <div class="ctei-content-card">
                        <div class="ctei-content-card-header">
                            <div class="ctei-content-card-title">
                                <i class="fas fa-pie-chart text-accent mr-2"></i>
                                Distribución por Estado
                            </div>
                        </div>
                        <div class="ctei-content-card-body">
                            <div id="status-distribution-chart" class="h-64 flex items-center justify-center text-muted-foreground">
                                <i class="fas fa-spinner fa-spin mr-2"></i>
                                Cargando gráfico...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cargar datos del dashboard
        await loadMonitoringOverview();

        // Configurar actualización automática cada 30 segundos
        if (window.monitoringInterval) {
            clearInterval(window.monitoringInterval);
        }
        window.monitoringInterval = setInterval(loadMonitoringOverview, 30000);

    } catch (error) {
        console.error('Error renderizando dashboard de monitoreo:', error);
        showToast('Error al cargar el dashboard de monitoreo', 'error');
    }
}

// Cargar datos de monitoreo general
async function loadMonitoringOverview() {
    try {
        const response = await axios.get(`${API_BASE}/admin/monitoring/overview`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            // Actualizar timestamp
            const lastUpdatedEl = document.getElementById('last-updated');
            if (lastUpdatedEl) {
                lastUpdatedEl.innerHTML = `
                    <i class="fas fa-clock mr-1"></i>
                    Actualizado: ${new Date().toLocaleTimeString()}
                `;
            }
            
            // Renderizar métricas del sistema
            renderSystemMetrics(data.system_metrics);
            
            // Renderizar alertas críticas
            renderCriticalAlerts(data.recent_alerts);
            
            // Renderizar proyectos que requieren atención
            renderAttentionProjects(data.attention_projects);
            
            // Renderizar métricas por línea de acción
            renderActionLineMetrics(data.action_line_metrics);
            
            // Cargar gráficos de tendencias
            await loadRealTimeStats();
            
        } else {
            throw new Error(response.data.error || 'Error al cargar datos de monitoreo');
        }
        
    } catch (error) {
        console.error('Error cargando overview de monitoreo:', error);
        showToast('Error al actualizar datos de monitoreo', 'error');
    }
}

// Renderizar métricas del sistema
function renderSystemMetrics(metrics) {
    const container = document.getElementById('system-metrics');
    if (!container) return;
    
    const cards = [
        {
            title: 'Proyectos Totales',
            value: metrics?.total_projects || 0,
            subtitle: `${metrics?.active_projects || 0} activos`,
            icon: 'fas fa-project-diagram',
            color: 'bg-primary'
        },
        {
            title: 'Productos CTeI',
            value: metrics?.total_products || 0,
            subtitle: `${metrics?.total_experiences || 0} experiencias`,
            icon: 'fas fa-flask',
            color: 'bg-green-500'
        },
        {
            title: 'Investigadores',
            value: metrics?.total_researchers || 0,
            subtitle: 'únicos en el sistema',
            icon: 'fas fa-users',
            color: 'bg-secondary'
        },
        {
            title: 'Progreso Promedio',
            value: `${Math.round(metrics?.avg_project_progress || 0)}%`,
            subtitle: `${metrics?.high_risk_projects || 0} alto riesgo`,
            icon: 'fas fa-chart-line',
            color: (metrics?.high_risk_projects || 0) > 0 ? 'bg-red-500' : 'bg-teal-500'
        }
    ];
    
    container.innerHTML = cards.map(card => `
        <div class="ctei-metric-card">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-medium text-muted-foreground">${card.title}</p>
                    <p class="text-2xl font-bold text-foreground mt-1">${card.value}</p>
                    <p class="text-xs text-muted-foreground mt-1">${card.subtitle}</p>
                </div>
                <div class="w-12 h-12 ${card.color} rounded-lg flex items-center justify-center">
                    <i class="${card.icon} text-white text-lg"></i>
                </div>
            </div>
        </div>
    `).join('');
}

// Renderizar alertas críticas
function renderCriticalAlerts(alerts) {
    const container = document.getElementById('critical-alerts');
    const alertsContainer = document.getElementById('alerts-container');
    const alertsCount = document.getElementById('alerts-count');
    
    if (!container) return;
    
    if (!alerts || alerts.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    if (alertsCount) {
        alertsCount.textContent = `${alerts.length} alerta(s) pendiente(s)`;
    }
    
    if (alertsContainer) {
        alertsContainer.innerHTML = alerts.slice(0, 5).map(alert => `
            <div class="flex items-start space-x-3 p-3 border-l-4 ${getSeverityBorderColor(alert.severity)} bg-muted/50 rounded-r-lg mb-3">
                <div class="w-8 h-8 ${getSeverityBgColor(alert.severity)} rounded-full flex items-center justify-center flex-shrink-0">
                    <i class="fas ${getSeverityIcon(alert.severity)} text-white text-sm"></i>
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-foreground">${alert.title}</p>
                    <p class="text-xs text-muted-foreground mt-1">${alert.message}</p>
                    <div class="flex items-center space-x-4 mt-2">
                        <span class="text-xs text-muted-foreground">
                            <i class="fas fa-user mr-1"></i>
                            ${alert.user_name}
                        </span>
                        ${alert.project_title ? `
                            <span class="text-xs text-muted-foreground">
                                <i class="fas fa-project-diagram mr-1"></i>
                                ${alert.project_title}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <button 
                    onclick="resolveAlert(${alert.id})"
                    class="text-xs bg-primary text-primary-foreground px-2 py-1 rounded hover:opacity-90"
                >
                    Resolver
                </button>
            </div>
        `).join('');
    }
}

// Renderizar proyectos que requieren atención
function renderAttentionProjects(projects) {
    const container = document.getElementById('projects-attention-list');
    const attentionCount = document.getElementById('attention-count');
    
    if (!container) return;
    
    if (!projects || projects.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-muted-foreground">
                <i class="fas fa-check-circle text-4xl mb-3"></i>
                <p>No hay proyectos que requieran atención inmediata</p>
            </div>
        `;
        if (attentionCount) {
            attentionCount.textContent = 'Todos los proyectos están en orden';
        }
        return;
    }
    
    if (attentionCount) {
        attentionCount.textContent = `${projects.length} proyecto(s) requieren atención`;
    }
    
    container.innerHTML = projects.slice(0, 10).map(project => `
        <div class="flex items-center justify-between p-4 border border-border rounded-lg mb-3 hover:bg-muted/50">
            <div class="flex-1">
                <div class="flex items-center space-x-3">
                    <div 
                        class="w-3 h-3 rounded-full" 
                        style="background-color: ${project.action_line_color || '#6B7280'}"
                    ></div>
                    <h4 class="font-medium text-foreground">${project.title}</h4>
                    <span class="text-xs bg-${getRiskLevelColor(project.risk_level)}-100 text-${getRiskLevelColor(project.risk_level)}-800 px-2 py-1 rounded">
                        ${project.risk_level}
                    </span>
                </div>
                <div class="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <span>
                        <i class="fas fa-user mr-1"></i>
                        ${project.owner_name}
                    </span>
                    <span>
                        <i class="fas fa-percentage mr-1"></i>
                        ${Math.round(project.progress_percentage)}% progreso
                    </span>
                    ${project.overdue_milestones > 0 ? `
                        <span class="text-destructive">
                            <i class="fas fa-clock mr-1"></i>
                            ${project.overdue_milestones} vencido(s)
                        </span>
                    ` : ''}
                </div>
            </div>
            <div class="ctei-actions-menu">
                <button class="ctei-btn-secondary" onclick="viewProjectDetails(${project.id})">
                    <i class="fas fa-eye"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Renderizar métricas por línea de acción
function renderActionLineMetrics(actionLines) {
    const container = document.getElementById('action-lines-metrics');
    if (!container) return;
    
    if (!actionLines || actionLines.length === 0) {
        container.innerHTML = '<p class="text-muted-foreground">No hay líneas de acción configuradas</p>';
        return;
    }
    
    container.innerHTML = actionLines.map(line => `
        <div class="p-4 border border-border rounded-lg">
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-3">
                    <div 
                        class="w-4 h-4 rounded-full" 
                        style="background-color: ${line.color_code}"
                    ></div>
                    <h4 class="font-medium text-foreground">${line.name}</h4>
                    <span class="text-xs text-muted-foreground">(${line.code})</span>
                </div>
                <div class="flex items-center space-x-2">
                    <span class="text-sm font-medium text-foreground">
                        ${Math.round(line.avg_progress || 0)}% promedio
                    </span>
                </div>
            </div>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center">
                    <div class="text-lg font-bold text-foreground">${line.project_count || 0}</div>
                    <div class="text-xs text-muted-foreground">Proyectos</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-bold text-green-600">${line.active_projects || 0}</div>
                    <div class="text-xs text-muted-foreground">Activos</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-bold text-primary">${line.product_count || 0}</div>
                    <div class="text-xs text-muted-foreground">Productos</div>
                </div>
                <div class="text-center">
                    <div class="text-lg font-bold text-primary">${line.experience_count || 0}</div>
                    <div class="text-xs text-muted-foreground">Experiencias</div>
                </div>
            </div>
        </div>
    `).join('');
}

// Cargar estadísticas en tiempo real para gráficos
async function loadRealTimeStats() {
    try {
        const response = await axios.get(`${API_BASE}/admin/monitoring/real-time-stats?timeframe=30`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            // Renderizar gráfico de tendencias (simulación simple)
            renderProjectTrendsChart(data.project_progress);
            
            // Renderizar distribución por estado
            renderStatusDistributionChart(data.status_distribution);
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas en tiempo real:', error);
    }
}

// Renderizar gráfico de tendencias (implementación simple)
function renderProjectTrendsChart(trends) {
    const container = document.getElementById('project-trends-chart');
    if (!container) return;
    
    if (!trends || trends.length === 0) {
        container.innerHTML = '<p class="text-muted-foreground">No hay datos disponibles</p>';
        return;
    }
    
    // Implementación simple de gráfico (sin librerías externas)
    const maxValue = Math.max(...trends.map(t => t.projects_created)) || 1;
    
    container.innerHTML = `
        <div class="w-full h-full flex items-end space-x-1 px-2">
            ${trends.slice(-14).map((trend, index) => {
                const height = Math.max((trend.projects_created / maxValue) * 80, 5);
                return `
                    <div class="flex-1 flex flex-col items-center">
                        <div 
                            class="bg-accent w-full rounded-t transition-all duration-300"
                            style="height: ${height}%"
                            title="${trend.date}: ${trend.projects_created} proyectos"
                        ></div>
                        <div class="text-xs text-muted-foreground mt-1 transform rotate-45 origin-top-left">
                            ${new Date(trend.date).getDate()}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Renderizar distribución por estado
function renderStatusDistributionChart(distribution) {
    const container = document.getElementById('status-distribution-chart');
    if (!container) return;
    
    if (!distribution || distribution.length === 0) {
        container.innerHTML = '<p class="text-muted-foreground">No hay datos disponibles</p>';
        return;
    }
    
    const total = distribution.reduce((sum, item) => sum + item.count, 0);
    const colors = {
        'ACTIVE': 'bg-green-500',
        'COMPLETED': 'bg-primary',
        'DRAFT': 'bg-yellow-500',
        'REVIEW': 'bg-secondary',
        'SUSPENDED': 'bg-red-500'
    };
    
    container.innerHTML = `
        <div class="space-y-3">
            ${distribution.map(item => {
                const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) : 0;
                return `
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-3">
                            <div class="w-4 h-4 ${colors[item.status] || 'bg-gray-500'} rounded"></div>
                            <span class="text-sm font-medium">${item.status}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="text-sm font-bold">${item.count}</span>
                            <span class="text-xs text-muted-foreground">(${percentage}%)</span>
                        </div>
                    </div>
                    <div class="w-full bg-muted rounded-full h-2">
                        <div 
                            class="${colors[item.status] || 'bg-gray-500'} h-2 rounded-full transition-all duration-300"
                            style="width: ${percentage}%"
                        ></div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

// Funciones auxiliares
function getSeverityBorderColor(severity) {
    const colors = {
        'CRITICAL': 'border-red-500',
        'HIGH': 'border-orange-500',
        'MEDIUM': 'border-yellow-500',
        'LOW': 'border-primary'
    };
    return colors[severity] || 'border-gray-400';
}

function getSeverityBgColor(severity) {
    const colors = {
        'CRITICAL': 'bg-red-500',
        'HIGH': 'bg-orange-500',
        'MEDIUM': 'bg-yellow-500',
        'LOW': 'bg-primary'
    };
    return colors[severity] || 'bg-gray-400';
}

function getSeverityIcon(severity) {
    const icons = {
        'CRITICAL': 'fa-exclamation-circle',
        'HIGH': 'fa-exclamation-triangle',
        'MEDIUM': 'fa-exclamation',
        'LOW': 'fa-info-circle'
    };
    return icons[severity] || 'fa-info';
}

function getRiskLevelColor(riskLevel) {
    const colors = {
        'CRITICAL': 'red',
        'HIGH': 'orange',
        'MEDIUM': 'yellow',
        'LOW': 'green'
    };
    return colors[riskLevel] || 'gray';
}

// Resolver alerta
async function resolveAlert(alertId) {
    try {
        const response = await axios.put(`${API_BASE}/admin/alerts/${alertId}/resolve`);
        
        if (response.data.success) {
            showToast('Alerta resuelta exitosamente', 'success');
            await loadMonitoringOverview(); // Recargar datos
        } else {
            throw new Error(response.data.error || 'Error al resolver alerta');
        }
        
    } catch (error) {
        console.error('Error resolviendo alerta:', error);
        showToast('Error al resolver alerta', 'error');
    }
}

// Ver detalles de proyecto
function viewProjectDetails(projectId) {
    // Navegar a la vista de proyectos con filtro específico
    showToast('Redirigiendo a detalles del proyecto...', 'info');
    // Aquí podríamos implementar navegación específica o modal
}

function renderAdminUsersView() {
    document.getElementById('content').innerHTML = `
        <!-- Encabezado -->
        <div class="ctei-content-card mb-6">
            <div class="ctei-content-card-header">
                <div>
                    <div class="ctei-content-card-title">
                        <i class="fas fa-users mr-2"></i>
                        Gestión de Usuarios
                    </div>
                    <div class="ctei-content-card-subtitle">
                        Administrar usuarios del sistema CTeI-Manager
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filtros y búsqueda -->
        <div class="ctei-content-card mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <!-- Búsqueda -->
                <div class="ctei-form-group">
                    <label class="ctei-form-label">
                        <i class="fas fa-search mr-2"></i>
                        Buscar usuarios
                    </label>
                    <div class="relative">
                        <input 
                            type="text" 
                            id="userSearch"
                            placeholder="Nombre o email..."
                            class="ctei-form-input pl-10"
                            onkeypress="if(event.key === 'Enter') loadAdminUsers()"
                        >
                        <i class="fas fa-search absolute left-3 top-3 text-muted-foreground"></i>
                    </div>
                </div>
                
                <!-- Filtro por rol -->
                <div class="ctei-form-group">
                    <label class="ctei-form-label">
                        <i class="fas fa-filter mr-2"></i>
                        Filtrar por rol
                    </label>
                    <select 
                        id="roleFilter"
                        class="ctei-form-select"
                        onchange="loadAdminUsers()"
                    >
                        <option value="">Todos los roles</option>
                        <option value="ADMIN">Administradores</option>
                        <option value="INVESTIGATOR">Investigadores</option>
                        <option value="COMMUNITY">Comunidad</option>
                    </select>
                </div>
                
                <!-- Botones de acción -->
                <div class="flex items-end space-x-2">
                    <button 
                        onclick="loadAdminUsers()"
                        class="ctei-btn ctei-btn-primary flex-1"
                    >
                        <i class="fas fa-search mr-2"></i>
                        Buscar
                    </button>
                    <button 
                        onclick="clearUserFilters()"
                        class="ctei-btn ctei-btn-outline ctei-tooltip"
                        data-tooltip="Limpiar filtros"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Lista de usuarios -->
        <div class="ctei-content-card">
            <div id="usersContainer">
                <div class="ctei-empty-state">
                    <div class="ctei-empty-state-icon">
                        <i class="fas fa-spinner fa-spin"></i>
                    </div>
                    <div class="ctei-empty-state-title">Cargando usuarios...</div>
                </div>
            </div>
            
            <!-- Paginación -->
            <div id="usersPagination" class="mt-6"></div>
        </div>
    `;
    
    // Inicializar estado de usuarios
    DashboardState.usersState = {
        currentPage: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        search: '',
        role: ''
    };
    
    // Cargar usuarios
    loadAdminUsers();
}

// ===== GESTIÓN DE USUARIOS ADMIN =====

async function loadAdminUsers(page = 1) {
    const container = document.getElementById('usersContainer');
    const paginationContainer = document.getElementById('usersPagination');
    
    // Actualizar estado
    DashboardState.usersState.currentPage = page;
    DashboardState.usersState.search = document.getElementById('userSearch')?.value || '';
    DashboardState.usersState.role = document.getElementById('roleFilter')?.value || '';
    
    try {
        // Construir parámetros de consulta
        const params = new URLSearchParams({
            page: page.toString(),
            limit: DashboardState.usersState.limit.toString()
        });
        
        if (DashboardState.usersState.search) {
            params.set('search', DashboardState.usersState.search);
        }
        
        if (DashboardState.usersState.role) {
            params.set('role', DashboardState.usersState.role);
        }
        
        const response = await axios.get(`${API_BASE}/admin/users?${params.toString()}`);
        
        if (response.data.success) {
            const { users, pagination } = response.data.data;
            
            // Actualizar estado de paginación
            DashboardState.usersState.total = pagination.total;
            DashboardState.usersState.totalPages = pagination.totalPages;
            
            if (users.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-users text-4xl text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground">No se encontraron usuarios</p>
                    </div>
                `;
                paginationContainer.innerHTML = '';
                return;
            }
            
            // Renderizar usuarios
            renderUsersTable(users);
            
            // Renderizar paginación
            renderUsersPagination(pagination);
            
        } else {
            throw new Error(response.data.error || 'Error al cargar usuarios');
        }
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
                <p class="text-destructive">Error al cargar usuarios</p>
                <button 
                    onclick="loadAdminUsers()" 
                    class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                >
                    <i class="fas fa-retry mr-2"></i>
                    Reintentar
                </button>
            </div>
        `;
        paginationContainer.innerHTML = '';
        showToast('Error al cargar usuarios', 'error');
    }
}

function renderUsersTable(users) {
    const container = document.getElementById('usersContainer');
    const currentUser = DashboardState.user;
    
    let html = `
        <div class="overflow-x-auto">
            <table class="ctei-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Registro</th>
                        <th style="text-align: right;">Acciones</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    users.forEach(user => {
        const roleConfig = {
            'ADMIN': { badge: 'destructive', icon: 'fas fa-crown', label: 'Administrador' },
            'INVESTIGATOR': { badge: 'primary', icon: 'fas fa-microscope', label: 'Investigador' },
            'COMMUNITY': { badge: 'secondary', icon: 'fas fa-users', label: 'Comunidad' }
        };
        
        const role = roleConfig[user.role] || roleConfig.COMMUNITY;
        const isCurrentUser = user.id === currentUser?.userId;
        
        html += `
            <tr>
                <td>
                    <div class="flex items-center space-x-3">
                        <div class="ctei-metric-icon primary" style="width: 2.5rem; height: 2.5rem; font-size: 1rem;">
                            <i class="${role.icon}"></i>
                        </div>
                        <div>
                            <div class="table-primary-text">${user.full_name}</div>
                            <div class="table-secondary-text">${user.email}</div>
                            ${isCurrentUser ? '<span class="table-metadata text-primary font-medium">(Tú)</span>' : ''}
                        </div>
                    </div>
                </td>
                <td>
                    <span class="ctei-status-badge ${role.badge}">
                        <i class="${role.icon} mr-1"></i>
                        ${role.label}
                    </span>
                </td>
                <td>
                    <div class="table-metadata">
                        ${formatDate(user.created_at)}
                    </div>
                </td>
                <td>
                    <div class="flex justify-end items-center space-x-2">
                        <button 
                            onclick="editUser(${user.id})"
                            class="ctei-btn ctei-btn-secondary ctei-btn-sm ctei-tooltip"
                            data-tooltip="Editar usuario"
                        >
                            <i class="fas fa-edit"></i>
                        </button>
                        
                        <div class="ctei-actions-menu">
                            <button 
                                class="ctei-actions-trigger ctei-tooltip"
                                data-tooltip="Más acciones"
                                onclick="toggleUserActionsMenu(${user.id})"
                            >
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div id="user-actions-${user.id}" class="ctei-actions-dropdown hidden">
                                <button 
                                    onclick="changeUserPassword(${user.id}, '${user.full_name}', '${user.email}'); closeAllActionsMenus()"
                                    class="ctei-actions-item"
                                >
                                    <i class="fas fa-key mr-2"></i>
                                    Cambiar Contraseña
                                </button>
                                ${!isCurrentUser ? `
                                    <button 
                                        onclick="deleteUser(${user.id}, '${user.full_name}', '${user.email}'); closeAllActionsMenus()"
                                        class="ctei-actions-item destructive"
                                    >
                                        <i class="fas fa-trash mr-2"></i>
                                        Eliminar Usuario
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderUsersPagination(pagination) {
    const container = document.getElementById('usersPagination');
    
    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
                Mostrando ${((pagination.page - 1) * pagination.limit) + 1} a ${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total} usuarios
            </div>
            <div class="flex space-x-2">
    `;
    
    // Botón anterior
    if (pagination.page > 1) {
        html += `
            <button 
                onclick="loadAdminUsers(${pagination.page - 1})"
                class="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:opacity-90"
            >
                <i class="fas fa-chevron-left mr-1"></i>
                Anterior
            </button>
        `;
    }
    
    // Números de página
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === pagination.page;
        html += `
            <button 
                onclick="loadAdminUsers(${i})"
                class="px-3 py-2 text-sm rounded ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-90'}"
            >
                ${i}
            </button>
        `;
    }
    
    // Botón siguiente
    if (pagination.page < pagination.totalPages) {
        html += `
            <button 
                onclick="loadAdminUsers(${pagination.page + 1})"
                class="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:opacity-90"
            >
                Siguiente
                <i class="fas fa-chevron-right ml-1"></i>
            </button>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function clearUserFilters() {
    document.getElementById('userSearch').value = '';
    document.getElementById('roleFilter').value = '';
    DashboardState.usersState.search = '';
    DashboardState.usersState.role = '';
    loadAdminUsers(1);
}

async function editUser(userId) {
    try {
        // Buscar el usuario en los datos cargados
        const usersContainer = document.getElementById('usersContainer');
        if (!usersContainer) return;
        
        // Obtener datos del usuario actual desde la API
        const response = await axios.get(`${API_BASE}/admin/users?limit=1000`); // Obtener todos para encontrar el usuario
        if (!response.data.success) {
            showToast('Error al cargar datos del usuario', 'error');
            return;
        }
        
        const user = response.data.data.users.find(u => u.id === userId);
        if (!user) {
            showToast('Usuario no encontrado', 'error');
            return;
        }
        
        // Crear modal de edición
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Editar Usuario</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form id="editUserForm" onsubmit="saveUserChanges(event, ${userId})">
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-2">Nombre completo</label>
                            <input 
                                type="text" 
                                id="editUserName"
                                value="${user.full_name}"
                                class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                required
                            >
                        </div>
                        
                        <div class="mb-4">
                            <label class="block text-sm font-medium mb-2">Email</label>
                            <input 
                                type="email" 
                                value="${user.email}"
                                class="w-full px-3 py-2 border border-input rounded-md bg-muted"
                                disabled
                            >
                            <p class="text-xs text-muted-foreground mt-1">El email no se puede modificar</p>
                        </div>
                        
                        <div class="mb-6">
                            <label class="block text-sm font-medium mb-2">Rol</label>
                            <select 
                                id="editUserRole"
                                class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="COMMUNITY" ${user.role === 'COMMUNITY' ? 'selected' : ''}>
                                    <i class="fas fa-users"></i> Comunidad
                                </option>
                                <option value="INVESTIGATOR" ${user.role === 'INVESTIGATOR' ? 'selected' : ''}>
                                    <i class="fas fa-microscope"></i> Investigador
                                </option>
                                <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>
                                    <i class="fas fa-crown"></i> Administrador
                                </option>
                            </select>
                        </div>
                        
                        <div class="flex space-x-3">
                            <button 
                                type="button"
                                onclick="this.closest('.fixed').remove()"
                                class="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                class="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                            >
                                <i class="fas fa-save mr-2"></i>
                                Guardar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error editando usuario:', error);
        showToast('Error al abrir editor de usuario', 'error');
    }
}

async function saveUserChanges(event, userId) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        submitButton.disabled = true;
        
        const userData = {
            full_name: document.getElementById('editUserName').value,
            role: document.getElementById('editUserRole').value
        };
        
        const response = await axios.put(`${API_BASE}/admin/users/${userId}`, userData);
        
        if (response.data.success) {
            showToast('Usuario actualizado exitosamente', 'success');
            loadAdminUsers(DashboardState.usersState.currentPage); // Recargar la lista
            form.closest('.fixed').remove(); // Cerrar modal
        } else {
            throw new Error(response.data.error || 'Error al actualizar usuario');
        }
        
    } catch (error) {
        console.error('Error guardando cambios:', error);
        showToast(error.response?.data?.error || 'Error al actualizar usuario', 'error');
    } finally {
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

async function deleteUser(userId, userName, userEmail) {
    const currentUser = DashboardState.user;
    
    // Verificar que no se está intentando eliminar a sí mismo
    if (userId === currentUser?.userId) {
        showToast('No puedes eliminar tu propio usuario', 'error');
        return;
    }
    
    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-exclamation-triangle text-destructive text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-destructive">Eliminar Usuario</h3>
                        <p class="text-sm text-muted-foreground">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <p class="text-sm mb-2">¿Estás seguro de que deseas eliminar el usuario:</p>
                    <div class="bg-muted p-3 rounded-md">
                        <p class="font-medium">${userName}</p>
                        <p class="text-sm text-muted-foreground">${userEmail}</p>
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button 
                        type="button"
                        onclick="this.closest('.fixed').remove()"
                        class="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onclick="confirmDeleteUser(${userId})"
                        class="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:opacity-90"
                    >
                        <i class="fas fa-trash mr-2"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function confirmDeleteUser(userId) {
    const modal = document.querySelector('.fixed');
    const deleteButton = modal.querySelector('button[onclick*="confirmDeleteUser"]');
    const originalText = deleteButton.innerHTML;
    
    try {
        deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Eliminando...';
        deleteButton.disabled = true;
        
        const response = await axios.delete(`${API_BASE}/admin/users/${userId}`);
        
        if (response.data.success) {
            showToast('Usuario eliminado exitosamente', 'success');
            loadAdminUsers(DashboardState.usersState.currentPage); // Recargar la lista
            modal.remove(); // Cerrar modal
        } else {
            throw new Error(response.data.error || 'Error al eliminar usuario');
        }
        
    } catch (error) {
        console.error('Error eliminando usuario:', error);
        showToast(error.response?.data?.error || 'Error al eliminar usuario', 'error');
        deleteButton.innerHTML = originalText;
        deleteButton.disabled = false;
    }
}

// Cambiar contraseña de usuario (solo admin)
async function changeUserPassword(userId, userName, userEmail) {
    // Crear modal de cambio de contraseña
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Cambiar Contraseña</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-4">
                    <p class="text-sm text-muted-foreground">
                        Cambiando contraseña para: <strong>${userName}</strong> (${userEmail})
                    </p>
                </div>
                
                <form onsubmit="confirmChangePassword(event, ${userId})">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Nueva Contraseña</label>
                        <input 
                            type="password" 
                            id="newPassword"
                            placeholder="Mínimo 6 caracteres"
                            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                            minlength="6"
                        >
                    </div>
                    
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Confirmar Nueva Contraseña</label>
                        <input 
                            type="password" 
                            id="confirmPassword"
                            placeholder="Repetir la contraseña"
                            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            required
                            minlength="6"
                        >
                    </div>
                    
                    <div class="flex space-x-3">
                        <button 
                            type="submit"
                            class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 flex-1"
                        >
                            <i class="fas fa-key mr-2"></i>
                            Cambiar Contraseña
                        </button>
                        <button 
                            type="button"
                            onclick="this.closest('.fixed').remove()"
                            class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function confirmChangePassword(event, userId) {
    event.preventDefault();
    
    const form = event.target;
    const newPasswordField = form.querySelector('#newPassword');
    const confirmPasswordField = form.querySelector('#confirmPassword');
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Limpiar espacios en blanco al inicio y final
    const newPassword = newPasswordField.value.trim();
    const confirmPassword = confirmPasswordField.value.trim();
    
    console.log('🔐 Cambio de contraseña:', {
        userId: userId,
        passwordLength: newPassword.length,
        confirmLength: confirmPassword.length,
        passwordMatch: newPassword === confirmPassword
    });
    
    // Actualizar los campos con valores limpiados
    newPasswordField.value = newPassword;
    confirmPasswordField.value = confirmPassword;
    
    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    // Validar longitud mínima
    if (newPassword.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Validar que no esté vacía
    if (!newPassword) {
        showToast('La contraseña no puede estar vacía', 'error');
        return;
    }
    
    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Cambiando...';
        submitButton.disabled = true;
        
        console.log('🌐 Enviando cambio de contraseña para usuario:', userId);
        
        const response = await axios.put(`${API_BASE}/admin/users/${userId}/password`, {
            new_password: newPassword
        });
        
        console.log('📦 Respuesta del cambio:', response.data);
        
        if (response.data.success) {
            showToast('Contraseña cambiada exitosamente', 'success');
            console.log('✅ Contraseña actualizada correctamente');
            
            // Mostrar información adicional de debug
            showToast(`Debug: Nueva contraseña tiene ${newPassword.length} caracteres`, 'info');
            
            form.closest('.fixed').remove(); // Cerrar modal
        } else {
            throw new Error(response.data.error || 'Error al cambiar contraseña');
        }
        
    } catch (error) {
        console.error('❌ Error cambiando contraseña:', error);
        showToast(error.response?.data?.error || 'Error al cambiar contraseña', 'error');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

function renderAdminProjectsView() {
    document.getElementById('content').innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">Todos los Proyectos</h2>
                    <p class="text-muted-foreground">Administrar todos los proyectos del sistema CTeI-Manager</p>
                </div>
            </div>
        </div>
        
        <!-- Filtros y búsqueda -->
        <div class="card mb-6">
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Búsqueda -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Buscar proyectos</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="projectSearch"
                                placeholder="Título, resumen o propietario..."
                                class="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                onkeypress="if(event.key === 'Enter') loadAdminProjects()"
                            >
                            <i class="fas fa-search absolute left-3 top-3 text-muted-foreground"></i>
                        </div>
                    </div>
                    
                    <!-- Filtro por visibilidad -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Filtrar por visibilidad</label>
                        <select 
                            id="visibilityFilter"
                            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            onchange="loadAdminProjects()"
                        >
                            <option value="">Todos los proyectos</option>
                            <option value="1">Públicos</option>
                            <option value="0">Privados</option>
                        </select>
                    </div>
                    
                    <!-- Botones de acción -->
                    <div class="flex items-end space-x-2">
                        <button 
                            onclick="loadAdminProjects()"
                            class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex-1"
                        >
                            <i class="fas fa-search mr-2"></i>
                            Buscar
                        </button>
                        <button 
                            onclick="clearProjectFilters()"
                            class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <i class="fas fa-times mr-2"></i>
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Lista de proyectos -->
        <div class="card">
            <div class="p-6">
                <div id="projectsContainer">
                    <div class="flex justify-center py-8">
                        <div class="spinner"></div>
                    </div>
                </div>
                
                <!-- Paginación -->
                <div id="projectsPagination" class="mt-6"></div>
            </div>
        </div>
    `;
    
    // Inicializar estado de proyectos
    DashboardState.projectsState = {
        currentPage: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        search: '',
        is_public: ''
    };
    
    // Cargar proyectos
    loadAdminProjects();
}

// ===== GESTIÓN DE PROYECTOS ADMIN =====

async function loadAdminProjects(page = 1) {
    const container = document.getElementById('projectsContainer');
    const paginationContainer = document.getElementById('projectsPagination');
    
    // Actualizar estado
    DashboardState.projectsState.currentPage = page;
    DashboardState.projectsState.search = document.getElementById('projectSearch')?.value || '';
    DashboardState.projectsState.is_public = document.getElementById('visibilityFilter')?.value || '';
    
    try {
        // Construir parámetros de consulta
        const params = new URLSearchParams({
            page: page.toString(),
            limit: DashboardState.projectsState.limit.toString()
        });
        
        if (DashboardState.projectsState.search) {
            params.set('search', DashboardState.projectsState.search);
        }
        
        if (DashboardState.projectsState.is_public !== '') {
            params.set('is_public', DashboardState.projectsState.is_public);
        }
        
        const response = await axios.get(`${API_BASE}/admin/projects?${params.toString()}`);
        
        if (response.data.success) {
            const { projects, pagination } = response.data.data;
            
            // Actualizar estado de paginación y proyectos
            DashboardState.projectsState.total = pagination.total;
            DashboardState.projectsState.totalPages = pagination.totalPages;
            DashboardState.adminProjects = projects; // Guardar proyectos para acceso en edición
            
            if (projects.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-project-diagram text-4xl text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground">No se encontraron proyectos</p>
                    </div>
                `;
                paginationContainer.innerHTML = '';
                return;
            }
            
            // Renderizar proyectos
            renderProjectsTable(projects);
            
            // Renderizar paginación
            renderProjectsPagination(pagination);
            
        } else {
            throw new Error(response.data.error || 'Error al cargar proyectos');
        }
        
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
                <p class="text-destructive">Error al cargar proyectos</p>
                <button 
                    onclick="loadAdminProjects()" 
                    class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                >
                    <i class="fas fa-retry mr-2"></i>
                    Reintentar
                </button>
            </div>
        `;
        paginationContainer.innerHTML = '';
        showToast('Error al cargar proyectos', 'error');
    }
}

function renderProjectsTable(projects) {
    const container = document.getElementById('projectsContainer');
    
    let html = `
        <div class="overflow-x-auto">
            <table class="w-full">
                <thead class="border-b border-border">
                    <tr class="text-left">
                        <th class="pb-3 font-medium">Proyecto</th>
                        <th class="pb-3 font-medium">Propietario</th>
                        <th class="pb-3 font-medium">Estado</th>
                        <th class="pb-3 font-medium">Fecha</th>
                        <th class="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
    `;
    
    projects.forEach(project => {
        const isPublic = project.is_public === 1;
        const statusConfig = {
            'DRAFT': { color: 'bg-muted text-muted-foreground', icon: 'fas fa-edit', label: 'Borrador' },
            'ACTIVE': { color: 'bg-primary text-primary-foreground', icon: 'fas fa-play', label: 'Activo' },
            'REVIEW': { color: 'bg-accent text-accent-foreground', icon: 'fas fa-eye', label: 'En Revisión' },
            'COMPLETED': { color: 'bg-chart-1 text-white', icon: 'fas fa-check', label: 'Completado' },
            'SUSPENDED': { color: 'bg-destructive text-destructive-foreground', icon: 'fas fa-pause', label: 'Suspendido' }
        };
        
        const status = statusConfig[project.status] || statusConfig.DRAFT;
        
        html += `
            <tr class="hover:bg-muted/50">
                <td class="py-4">
                    <div class="flex items-start space-x-3">
                        <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <i class="fas fa-project-diagram text-primary"></i>
                        </div>
                        <div class="flex-1 min-w-0">
                            <div class="font-medium text-sm line-clamp-1">${project.title}</div>
                            <div class="text-xs text-muted-foreground mt-1 line-clamp-2">${project.abstract || 'Sin resumen disponible'}</div>
                            ${project.project_code ? `<span class="text-xs bg-muted px-2 py-0.5 rounded mt-1 inline-block">${project.project_code}</span>` : ''}
                        </div>
                    </div>
                </td>
                <td class="py-4">
                    <div class="text-sm">
                        <div class="font-medium">${project.owner_name}</div>
                        <div class="text-muted-foreground">${project.owner_email}</div>
                    </div>
                </td>
                <td class="py-4">
                    <div class="space-y-1">
                        <span class="px-2 py-1 rounded text-xs font-medium ${status.color}">
                            <i class="${status.icon} mr-1"></i>
                            ${status.label}
                        </span>
                        <div class="flex items-center text-xs">
                            ${isPublic ? 
                                '<span class="text-green-600"><i class="fas fa-globe mr-1"></i>Público</span>' : 
                                '<span class="text-muted-foreground"><i class="fas fa-lock mr-1"></i>Privado</span>'
                            }
                        </div>
                    </div>
                </td>
                <td class="py-4 text-sm text-muted-foreground">
                    ${formatDate(project.created_at)}
                </td>
                <td class="py-4">
                    <div class="flex justify-end space-x-2">
                        <button 
                            onclick="editAdminProject(${project.id})"
                            class="bg-secondary text-secondary-foreground px-3 py-1 rounded text-sm hover:opacity-90"
                            title="Editar proyecto"
                        >
                            <i class="fas fa-edit"></i>
                        </button>
                        <button 
                            onclick="toggleAdminProjectVisibility(${project.id}, ${!isPublic})"
                            class="px-3 py-1 rounded text-sm ${isPublic ? 'bg-muted text-muted-foreground' : 'bg-green-100 text-green-700'} hover:opacity-90"
                            title="${isPublic ? 'Ocultar proyecto' : 'Publicar proyecto'}"
                        >
                            <i class="fas fa-${isPublic ? 'eye-slash' : 'eye'}"></i>
                        </button>
                        <button 
                            onclick="deleteAdminProject(${project.id}, '${project.title}', '${project.owner_name}')"
                            class="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm hover:opacity-90"
                            title="Eliminar proyecto"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

function renderProjectsPagination(pagination) {
    const container = document.getElementById('projectsPagination');
    
    if (pagination.totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let html = `
        <div class="flex items-center justify-between">
            <div class="text-sm text-muted-foreground">
                Mostrando ${((pagination.page - 1) * pagination.limit) + 1} a ${Math.min(pagination.page * pagination.limit, pagination.total)} de ${pagination.total} proyectos
            </div>
            <div class="flex space-x-2">
    `;
    
    // Botón anterior
    if (pagination.page > 1) {
        html += `
            <button 
                onclick="loadAdminProjects(${pagination.page - 1})"
                class="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:opacity-90"
            >
                <i class="fas fa-chevron-left mr-1"></i>
                Anterior
            </button>
        `;
    }
    
    // Números de página
    const startPage = Math.max(1, pagination.page - 2);
    const endPage = Math.min(pagination.totalPages, pagination.page + 2);
    
    for (let i = startPage; i <= endPage; i++) {
        const isActive = i === pagination.page;
        html += `
            <button 
                onclick="loadAdminProjects(${i})"
                class="px-3 py-2 text-sm rounded ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:opacity-90'}"
            >
                ${i}
            </button>
        `;
    }
    
    // Botón siguiente
    if (pagination.page < pagination.totalPages) {
        html += `
            <button 
                onclick="loadAdminProjects(${pagination.page + 1})"
                class="px-3 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:opacity-90"
            >
                Siguiente
                <i class="fas fa-chevron-right ml-1"></i>
            </button>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
}

function clearProjectFilters() {
    document.getElementById('projectSearch').value = '';
    document.getElementById('visibilityFilter').value = '';
    DashboardState.projectsState.search = '';
    DashboardState.projectsState.is_public = '';
    loadAdminProjects(1);
}

async function toggleAdminProjectVisibility(projectId, makePublic) {
    try {
        const response = await axios.post(`${API_BASE}/admin/projects/${projectId}/publish`, {
            is_public: makePublic
        });
        
        if (response.data.success) {
            showToast(response.data.message || `Proyecto ${makePublic ? 'publicado' : 'ocultado'} exitosamente`, 'success');
            
            // Actualización visual inmediata del botón en vista admin
            const button = document.querySelector(`[onclick*="toggleAdminProjectVisibility(${projectId}"]`);
            if (button) {
                const icon = button.querySelector('i');
                if (makePublic) {
                    // Proyecto ahora es público - botón para ocultar
                    button.className = 'px-3 py-1 rounded text-sm bg-muted text-muted-foreground hover:opacity-90';
                    icon.className = 'fas fa-eye-slash';
                    button.setAttribute('onclick', `toggleAdminProjectVisibility(${projectId}, false)`);
                    button.title = 'Ocultar proyecto';
                } else {
                    // Proyecto ahora es privado - botón para publicar
                    button.className = 'px-3 py-1 rounded text-sm bg-green-100 text-green-700 hover:opacity-90';
                    icon.className = 'fas fa-eye';
                    button.setAttribute('onclick', `toggleAdminProjectVisibility(${projectId}, true)`);
                    button.title = 'Publicar proyecto';
                }
            }
            
            loadAdminProjects(DashboardState.projectsState.currentPage); // Recargar la página actual
        } else {
            throw new Error(response.data.error || 'Error al cambiar visibilidad del proyecto');
        }
        
    } catch (error) {
        console.error('Error cambiando visibilidad:', error);
        showToast(error.response?.data?.error || 'Error al cambiar visibilidad del proyecto', 'error');
    }
}

// Funciones de edición para administradores
function editAdminProject(projectId) {
    console.log('editAdminProject llamada con ID:', projectId);
    console.log('DashboardState.adminProjects:', DashboardState.adminProjects);
    
    // Buscar el proyecto en los datos cargados
    const projects = DashboardState.adminProjects || [];
    console.log('Proyectos disponibles:', projects.length);
    
    const project = projects.find(p => p.id === projectId);
    console.log('Proyecto encontrado:', project);
    
    if (!project) {
        console.warn('Proyecto no encontrado con ID:', projectId);
        showToast('Proyecto no encontrado. Verificando datos...', 'error');
        
        // Intentar recargar los proyectos si no están disponibles
        if (!DashboardState.adminProjects || DashboardState.adminProjects.length === 0) {
            console.log('Recargando proyectos de admin...');
            loadAdminProjects().then(() => {
                // Intentar de nuevo después de recargar
                const reloadedProjects = DashboardState.adminProjects || [];
                const reloadedProject = reloadedProjects.find(p => p.id === projectId);
                if (reloadedProject) {
                    showAdminEditProjectModal(reloadedProject);
                } else {
                    showToast('Proyecto no encontrado después de recargar', 'error');
                }
            });
        }
        return;
    }
    
    console.log('Abriendo modal para proyecto:', project.title);
    showAdminEditProjectModal(project);
}

function showAdminEditProjectModal(project) {
    console.log('showAdminEditProjectModal llamada para:', project);
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h3 class="text-xl font-semibold">Editar Proyecto (Admin)</h3>
                        <p class="text-sm text-muted-foreground">Propietario: ${project.owner_name}</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form onsubmit="updateAdminProject(event, ${project.id})">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Título *</label>
                            <input 
                                type="text" 
                                id="editAdminProjectTitle"
                                value="${(project.title || '').replace(/"/g, '&quot;')}"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent" 
                                required
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Resumen *</label>
                            <textarea 
                                id="editAdminProjectAbstract"
                                rows="4"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                                required
                            >${project.abstract || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Palabras Clave</label>
                            <input 
                                type="text" 
                                id="editAdminProjectKeywords"
                                value="${(project.keywords || '').replace(/"/g, '&quot;')}"
                                placeholder="Separadas por comas"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Introducción</label>
                            <textarea 
                                id="editAdminProjectIntroduction"
                                rows="3"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >${project.introduction || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Metodología</label>
                            <textarea 
                                id="editAdminProjectMethodology"
                                rows="3"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >${project.methodology || ''}</textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Estado</label>
                            <select 
                                id="editAdminProjectStatus"
                                class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            >
                                <option value="DRAFT" ${project.status === 'DRAFT' ? 'selected' : ''}>Borrador</option>
                                <option value="ACTIVE" ${project.status === 'ACTIVE' ? 'selected' : ''}>Activo</option>
                                <option value="REVIEW" ${project.status === 'REVIEW' ? 'selected' : ''}>En Revisión</option>
                                <option value="COMPLETED" ${project.status === 'COMPLETED' ? 'selected' : ''}>Completado</option>
                                <option value="SUSPENDED" ${project.status === 'SUSPENDED' ? 'selected' : ''}>Suspendido</option>
                            </select>
                        </div>
                        
                        <div class="bg-muted/50 p-4 rounded-lg">
                            <div class="flex items-center mb-2">
                                <i class="fas fa-info-circle text-muted-foreground mr-2"></i>
                                <span class="text-sm font-medium">Información del Propietario</span>
                            </div>
                            <div class="text-sm text-muted-foreground">
                                <p><strong>Nombre:</strong> ${project.owner_name}</p>
                                <p><strong>Email:</strong> ${project.owner_email || 'No disponible'}</p>
                                <p><strong>ID de Usuario:</strong> ${project.owner_id}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button"
                            onclick="this.closest('.fixed').remove()"
                            class="bg-muted text-muted-foreground px-4 py-2 rounded-lg hover:opacity-90"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                        >
                            <i class="fas fa-save mr-1"></i>
                            Actualizar Proyecto
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function updateAdminProject(event, projectId) {
    event.preventDefault();
    
    const projectData = {
        title: document.getElementById('editAdminProjectTitle').value,
        abstract: document.getElementById('editAdminProjectAbstract').value,
        keywords: document.getElementById('editAdminProjectKeywords').value || null,
        introduction: document.getElementById('editAdminProjectIntroduction').value || null,
        methodology: document.getElementById('editAdminProjectMethodology').value || null,
        status: document.getElementById('editAdminProjectStatus').value
    };
    
    try {
        // Primero intentar con endpoint de admin (cuando esté disponible en backend)
        let response;
        try {
            response = await axios.put(`${API_BASE}/admin/projects/${projectId}`, projectData);
        } catch (adminError) {
            if (adminError.response?.status === 404) {
                // Si el endpoint de admin no existe, intentar con endpoint de usuario
                // Esto funcionará solo si el admin es también propietario del proyecto
                response = await axios.put(`${API_BASE}/private/projects/${projectId}`, projectData);
            } else {
                throw adminError;
            }
        }
        
        if (response.data.success) {
            showToast('Proyecto actualizado exitosamente por administrador');
            
            // Cerrar modal
            document.querySelector('.fixed').remove();
            
            // Actualizar estado local si existe
            if (DashboardState.adminProjects) {
                const projectIndex = DashboardState.adminProjects.findIndex(p => p.id === projectId);
                if (projectIndex !== -1) {
                    DashboardState.adminProjects[projectIndex] = { 
                        ...DashboardState.adminProjects[projectIndex], 
                        ...projectData 
                    };
                }
            }
            
            // Recargar la vista de administrador
            loadAdminProjects(DashboardState.projectsState?.currentPage || 1);
        }
    } catch (error) {
        let message = 'Error al actualizar el proyecto';
        
        if (error.response?.status === 403) {
            message = 'No tienes permisos para editar este proyecto. El endpoint de administrador aún no está implementado en el backend.';
        } else if (error.response?.data?.error) {
            message = error.response.data.error;
        }
        
        showToast(message, 'error');
        console.warn('Nota para desarrollo: Se necesita implementar PUT /api/admin/projects/:id en el backend para permitir edición de administrador de cualquier proyecto.');
    }
}

async function deleteAdminProject(projectId, projectTitle, ownerName) {
    // Crear modal de confirmación
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
                <div class="flex items-center mb-4">
                    <div class="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mr-4">
                        <i class="fas fa-exclamation-triangle text-destructive text-xl"></i>
                    </div>
                    <div>
                        <h3 class="text-lg font-semibold text-destructive">Eliminar Proyecto</h3>
                        <p class="text-sm text-muted-foreground">Esta acción no se puede deshacer</p>
                    </div>
                </div>
                
                <div class="mb-6">
                    <p class="text-sm mb-2">¿Estás seguro de que deseas eliminar este proyecto?</p>
                    <div class="bg-muted p-3 rounded-md">
                        <p class="font-medium">${projectTitle}</p>
                        <p class="text-sm text-muted-foreground">Propietario: ${ownerName}</p>
                    </div>
                    <div class="mt-2 text-xs text-destructive">
                        <i class="fas fa-warning mr-1"></i>
                        Esto eliminará también todos los productos asociados al proyecto
                    </div>
                </div>
                
                <div class="flex space-x-3">
                    <button 
                        type="button"
                        onclick="this.closest('.fixed').remove()"
                        class="flex-1 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="button"
                        onclick="confirmDeleteAdminProject(${projectId})"
                        class="flex-1 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg hover:opacity-90"
                    >
                        <i class="fas fa-trash mr-2"></i>
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function confirmDeleteAdminProject(projectId) {
    const modal = document.querySelector('.fixed');
    const deleteButton = modal.querySelector('button[onclick*="confirmDeleteAdminProject"]');
    const originalText = deleteButton.innerHTML;
    
    try {
        deleteButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Eliminando...';
        deleteButton.disabled = true;
        
        const response = await axios.delete(`${API_BASE}/admin/projects/${projectId}`);
        
        if (response.data.success) {
            showToast('Proyecto eliminado exitosamente', 'success');
            loadAdminProjects(DashboardState.projectsState.currentPage); // Recargar la lista
            modal.remove(); // Cerrar modal
        } else {
            throw new Error(response.data.error || 'Error al eliminar proyecto');
        }
        
    } catch (error) {
        console.error('Error eliminando proyecto:', error);
        showToast(error.response?.data?.error || 'Error al eliminar proyecto', 'error');
        deleteButton.innerHTML = originalText;
        deleteButton.disabled = false;
    }
}

function renderAdminCategoriesView() {
    document.getElementById('content').innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">Gestión de Categorías de Productos</h2>
                    <p class="text-muted-foreground">Administrar categorías CTeI del sistema</p>
                </div>
                <button 
                    onclick="showCreateCategoryModal()" 
                    class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Nueva Categoría
                </button>
            </div>
        </div>
        
        <div class="card">
            <div class="p-6">
                <div id="categoriesContainer">
                    <div class="flex justify-center py-8">
                        <div class="spinner"></div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cargar categorías
    loadAdminCategories();
}

// ===== GESTIÓN DE PRODUCTOS ADMIN =====

function renderAdminProductsView() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h2 class="text-2xl font-bold text-foreground">Gestión de Productos</h2>
                <div class="flex space-x-2">
                    <button 
                        onclick="loadAdminProducts()"
                        class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                    >
                        <i class="fas fa-refresh mr-2"></i>Actualizar
                    </button>
                </div>
            </div>
            
            <!-- Filtros -->
            <div class="bg-card rounded-lg shadow-sm border p-4">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Buscar</label>
                        <input 
                            type="text" 
                            id="adminProductsSearch" 
                            placeholder="Buscar productos..."
                            class="w-full px-3 py-2 border border-border rounded-lg"
                            onkeyup="if(event.key==='Enter') loadAdminProducts(1)"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Proyecto</label>
                        <select 
                            id="adminProductsProject" 
                            class="w-full px-3 py-2 border border-border rounded-lg"
                            onchange="loadAdminProducts(1)"
                        >
                            <option value="">Todos los proyectos</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Categoría</label>
                        <select 
                            id="adminProductsCategory" 
                            class="w-full px-3 py-2 border border-border rounded-lg"
                            onchange="loadAdminProducts(1)"
                        >
                            <option value="">Todas las categorías</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Visibilidad</label>
                        <select 
                            id="adminProductsVisibility" 
                            class="w-full px-3 py-2 border border-border rounded-lg"
                            onchange="loadAdminProducts(1)"
                        >
                            <option value="">Todos</option>
                            <option value="true">Públicos</option>
                            <option value="false">Privados</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Lista de productos -->
            <div id="adminProductsContainer">
                <div class="text-center py-8">
                    <i class="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-4"></i>
                    <p class="text-muted-foreground">Cargando productos...</p>
                </div>
            </div>
            
            <!-- Paginación -->
            <div id="adminProductsPagination" class="flex justify-center"></div>
        </div>
    `;
    
    // Inicializar estado si no existe
    if (!DashboardState.productsState) {
        DashboardState.productsState = {
            currentPage: 1,
            search: '',
            project_id: '',
            category: '',
            is_public: '',
            total: 0,
            totalPages: 1
        };
    }
    
    loadAdminProducts(1);
    loadProjectsForFilter();
    loadCategoriesForFilter();
}

async function loadAdminProducts(page = 1) {
    const container = document.getElementById('adminProductsContainer');
    
    try {
        // Actualizar estado
        DashboardState.productsState.currentPage = page;
        DashboardState.productsState.search = document.getElementById('adminProductsSearch')?.value || '';
        DashboardState.productsState.project_id = document.getElementById('adminProductsProject')?.value || '';
        DashboardState.productsState.category = document.getElementById('adminProductsCategory')?.value || '';
        DashboardState.productsState.is_public = document.getElementById('adminProductsVisibility')?.value || '';
        
        const params = new URLSearchParams({
            page: page.toString(),
            limit: '10'
        });
        
        if (DashboardState.productsState.search) {
            params.set('search', DashboardState.productsState.search);
        }
        if (DashboardState.productsState.project_id) {
            params.set('project_id', DashboardState.productsState.project_id);
        }
        if (DashboardState.productsState.category) {
            params.set('category', DashboardState.productsState.category);
        }
        if (DashboardState.productsState.is_public) {
            params.set('is_public', DashboardState.productsState.is_public);
        }
        
        const response = await axios.get(`${API_BASE}/admin/products?${params.toString()}`);
        
        if (response.data.success) {
            const { products, pagination } = response.data.data;
            
            // Actualizar estado de paginación
            DashboardState.productsState.total = pagination.total;
            DashboardState.productsState.totalPages = pagination.totalPages;
            
            if (products.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-box-open text-4xl text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground">No hay productos que coincidan con los filtros</p>
                    </div>
                `;
                return;
            }
            
            // Renderizar productos
            container.innerHTML = `
                <div class="space-y-4">
                    ${products.map(product => `
                        <div class="bg-card rounded-lg shadow-sm border p-4">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <h3 class="font-semibold text-lg">${product.product_code || 'Sin código'}</h3>
                                        <span class="px-2 py-1 text-xs rounded-full ${product.is_public ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}">
                                            ${product.is_public ? 'PÚBLICO' : 'PRIVADO'}
                                        </span>
                                        ${product.category_name ? `<span class="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700">${product.category_name}</span>` : ''}
                                    </div>
                                    <p class="text-muted-foreground mb-2">${product.description}</p>
                                    <div class="text-sm text-muted-foreground">
                                        <p><strong>Proyecto:</strong> ${product.project_title}</p>
                                        <p><strong>Propietario:</strong> ${product.owner_name} (${product.owner_email})</p>
                                        ${product.doi ? `<p><strong>DOI:</strong> ${product.doi}</p>` : ''}
                                        ${product.journal ? `<p><strong>Revista:</strong> ${product.journal}</p>` : ''}
                                        ${product.impact_factor ? `<p><strong>Factor de Impacto:</strong> ${product.impact_factor}</p>` : ''}
                                    </div>
                                </div>
                                <div class="flex flex-col space-y-2 ml-4">
                                    <button 
                                        onclick="toggleAdminProductVisibility(${product.id}, ${!product.is_public})"
                                        class="px-3 py-1 rounded text-sm ${product.is_public ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'} hover:opacity-90"
                                        title="${product.is_public ? 'Ocultar producto' : 'Publicar producto'}"
                                    >
                                        <i class="fas fa-${product.is_public ? 'eye-slash' : 'eye'} mr-1"></i>
                                        ${product.is_public ? 'Ocultar' : 'Publicar'}
                                    </button>
                                    <button 
                                        onclick="deleteAdminProduct(${product.id}, '${product.product_code || 'Sin código'}', '${product.project_title}')"
                                        class="px-3 py-1 rounded text-sm bg-red-100 text-red-700 hover:bg-red-200"
                                        title="Eliminar producto"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            
            // Renderizar paginación
            renderAdminProductsPagination();
        }
        
    } catch (error) {
        console.error('Error cargando productos de admin:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
                <p class="text-red-500">Error al cargar productos</p>
                <button onclick="loadAdminProducts()" class="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg">
                    Reintentar
                </button>
            </div>
        `;
    }
}

function renderAdminProductsPagination() {
    const container = document.getElementById('adminProductsPagination');
    const { currentPage, totalPages } = DashboardState.productsState;
    
    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="flex space-x-2">';
    
    // Botón anterior
    if (currentPage > 1) {
        paginationHTML += `
            <button onclick="loadAdminProducts(${currentPage - 1})" 
                class="px-3 py-2 border border-border rounded-lg hover:bg-accent">
                Anterior
            </button>
        `;
    }
    
    // Páginas
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
        paginationHTML += `
            <button onclick="loadAdminProducts(${i})" 
                class="px-3 py-2 ${i === currentPage ? 'bg-primary text-primary-foreground' : 'border border-border hover:bg-accent'} rounded-lg">
                ${i}
            </button>
        `;
    }
    
    // Botón siguiente
    if (currentPage < totalPages) {
        paginationHTML += `
            <button onclick="loadAdminProducts(${currentPage + 1})" 
                class="px-3 py-2 border border-border rounded-lg hover:bg-accent">
                Siguiente
            </button>
        `;
    }
    
    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
}

async function toggleAdminProductVisibility(productId, makePublic) {
    try {
        const response = await axios.put(`${API_BASE}/admin/products/${productId}/visibility`, {
            is_public: makePublic
        });
        
        if (response.data.success) {
            showToast(response.data.message || `Producto ${makePublic ? 'publicado' : 'ocultado'} exitosamente`, 'success');
            
            // Actualización visual inmediata del botón
            const button = document.querySelector(`[onclick*="toggleAdminProductVisibility(${productId}"]`);
            if (button) {
                const icon = button.querySelector('i');
                if (makePublic) {
                    // Producto ahora es público - botón para ocultar
                    button.className = 'px-3 py-1 rounded text-sm bg-orange-100 text-orange-700 hover:opacity-90';
                    icon.className = 'fas fa-eye-slash mr-1';
                    button.innerHTML = '<i class="fas fa-eye-slash mr-1"></i>Ocultar';
                    button.setAttribute('onclick', `toggleAdminProductVisibility(${productId}, false)`);
                    button.title = 'Ocultar producto';
                } else {
                    // Producto ahora es privado - botón para publicar
                    button.className = 'px-3 py-1 rounded text-sm bg-green-100 text-green-700 hover:opacity-90';
                    icon.className = 'fas fa-eye mr-1';
                    button.innerHTML = '<i class="fas fa-eye mr-1"></i>Publicar';
                    button.setAttribute('onclick', `toggleAdminProductVisibility(${productId}, true)`);
                    button.title = 'Publicar producto';
                }
            }
            
            // Recargar para actualizar el estado general
            setTimeout(() => {
                loadAdminProducts(DashboardState.productsState?.currentPage || 1);
            }, 1000);
        }
    } catch (error) {
        console.error('Error cambiando visibilidad del producto:', error);
        showToast(error.response?.data?.error || 'Error al cambiar visibilidad del producto', 'error');
    }
}

async function deleteAdminProduct(productId, productCode, projectTitle) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el producto "${productCode}" del proyecto "${projectTitle}"?\\n\\nEsta acción no se puede deshacer.`)) {
        return;
    }
    
    try {
        const response = await axios.delete(`${API_BASE}/admin/products/${productId}`);
        
        if (response.data.success) {
            showToast('Producto eliminado exitosamente', 'success');
            loadAdminProducts(DashboardState.productsState?.currentPage || 1);
        } else {
            throw new Error(response.data.error || 'Error al eliminar producto');
        }
        
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showToast(error.response?.data?.error || 'Error al eliminar producto', 'error');
    }
}

async function loadProjectsForFilter() {
    try {
        const response = await axios.get(`${API_BASE}/admin/projects?limit=1000`);
        if (response.data.success) {
            const select = document.getElementById('adminProductsProject');
            if (select) {
                const projects = response.data.data.projects;
                select.innerHTML = '<option value="">Todos los proyectos</option>' +
                    projects.map(p => `<option value="${p.id}">${p.title}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando proyectos para filtro:', error);
    }
}

async function loadCategoriesForFilter() {
    try {
        const response = await axios.get(`${API_BASE}/admin/product-categories`);
        if (response.data.success) {
            const select = document.getElementById('adminProductsCategory');
            if (select) {
                const categories = response.data.data.categories;
                select.innerHTML = '<option value="">Todas las categorías</option>' +
                    categories.map(c => `<option value="${c.code}">${c.name}</option>`).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando categorías para filtro:', error);
    }
}

// ===== GESTIÓN DE CATEGORÍAS ADMIN =====

async function loadAdminCategories() {
    const container = document.getElementById('categoriesContainer');
    
    try {
        const response = await axios.get(`${API_BASE}/admin/product-categories`);
        
        if (response.data.success) {
            const categories = response.data.data.categories;
            
            if (categories.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-8">
                        <i class="fas fa-tags text-4xl text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground">No hay categorías de productos registradas</p>
                    </div>
                `;
                return;
            }
            
            // Agrupar por category_group
            const groupedCategories = categories.reduce((acc, category) => {
                if (!acc[category.category_group]) {
                    acc[category.category_group] = [];
                }
                acc[category.category_group].push(category);
                return acc;
            }, {});
            
            let html = '';
            
            Object.entries(groupedCategories).forEach(([group, groupCategories]) => {
                html += `
                    <div class="mb-8">
                        <h3 class="text-lg font-semibold mb-4 text-primary border-b border-border pb-2">
                            ${group}
                        </h3>
                        <div class="grid grid-cols-1 gap-4">
                `;
                
                groupCategories.forEach(category => {
                    html += `
                        <div class="border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-3 mb-2">
                                        <span class="font-mono text-sm bg-muted px-2 py-1 rounded">${category.code}</span>
                                        <span class="font-medium">${category.name}</span>
                                        <span class="text-xs bg-chart-1 text-white px-2 py-1 rounded">
                                            Peso: ${category.impact_weight}
                                        </span>
                                    </div>
                                    ${category.description ? `
                                        <p class="text-sm text-muted-foreground mb-2">${category.description}</p>
                                    ` : ''}
                                    <div class="flex items-center text-xs text-muted-foreground space-x-4">
                                        <span><i class="fas fa-calendar-plus mr-1"></i>Creado: ${formatDate(category.created_at)}</span>
                                    </div>
                                </div>
                                <div class="flex space-x-2">
                                    <button 
                                        onclick="editCategory('${category.code}')"
                                        class="bg-accent text-accent-foreground px-3 py-1 rounded text-sm hover:opacity-90"
                                        title="Editar categoría"
                                    >
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button 
                                        onclick="deleteCategory('${category.code}', '${category.name}')"
                                        class="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm hover:opacity-90"
                                        title="Eliminar categoría"
                                    >
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;
                });
                
                html += `
                        </div>
                    </div>
                `;
            });
            
            container.innerHTML = html;
            
        } else {
            throw new Error(response.data.error || 'Error al cargar categorías');
        }
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
                <p class="text-destructive">Error al cargar categorías</p>
                <button 
                    onclick="loadAdminCategories()" 
                    class="mt-4 bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90"
                >
                    Reintentar
                </button>
            </div>
        `;
        showToast('Error al cargar categorías', 'error');
    }
}

function showCreateCategoryModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Nueva Categoría de Producto</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form onsubmit="handleCreateCategory(event)">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-1">Código *</label>
                            <input 
                                type="text" 
                                name="code" 
                                required 
                                maxlength="10"
                                class="w-full p-2 border border-border rounded text-sm"
                                placeholder="ej. A_01, TOP, ASC"
                            >
                            <p class="text-xs text-muted-foreground mt-1">Código único de la categoría</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-1">Nombre *</label>
                            <input 
                                type="text" 
                                name="name" 
                                required 
                                maxlength="100"
                                class="w-full p-2 border border-border rounded text-sm"
                                placeholder="Nombre de la categoría"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-1">Descripción</label>
                            <textarea 
                                name="description" 
                                rows="3"
                                class="w-full p-2 border border-border rounded text-sm"
                                placeholder="Descripción detallada de la categoría"
                            ></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-1">Grupo de Categoría *</label>
                            <select 
                                name="category_group" 
                                required 
                                class="w-full p-2 border border-border rounded text-sm"
                            >
                                <option value="">Seleccionar grupo</option>
                                <option value="Artículos de investigación">Artículos de investigación</option>
                                <option value="Libros y capítulos">Libros y capítulos</option>
                                <option value="Productos tecnológicos">Productos tecnológicos</option>
                                <option value="Formación de recursos humanos">Formación de recursos humanos</option>
                                <option value="Divulgación del conocimiento">Divulgación del conocimiento</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-1">Peso de Impacto *</label>
                            <input 
                                type="number" 
                                name="impact_weight" 
                                required 
                                min="0" 
                                max="100" 
                                step="0.1"
                                class="w-full p-2 border border-border rounded text-sm"
                                placeholder="ej. 85.5"
                            >
                            <p class="text-xs text-muted-foreground mt-1">Peso de impacto (0-100)</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button 
                            type="button" 
                            onclick="this.closest('.fixed').remove()"
                            class="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:opacity-90"
                        >
                            Cancelar
                        </button>
                        <button 
                            type="submit"
                            class="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
                        >
                            Crear Categoría
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function handleCreateCategory(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        code: formData.get('code'),
        name: formData.get('name'),
        description: formData.get('description') || null,
        category_group: formData.get('category_group'),
        impact_weight: parseFloat(formData.get('impact_weight'))
    };
    
    try {
        const response = await axios.post(`${API_BASE}/admin/product-categories`, categoryData);
        
        if (response.data.success) {
            showToast('Categoría creada exitosamente');
            event.target.closest('.fixed').remove();
            loadAdminCategories(); // Recargar la lista
        } else {
            throw new Error(response.data.error || 'Error al crear categoría');
        }
        
    } catch (error) {
        console.error('Error creando categoría:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        showToast(`Error: ${errorMessage}`, 'error');
    }
}

async function editCategory(categoryCode) {
    try {
        // Primero obtener los datos actuales de la categoría
        const response = await axios.get(`${API_BASE}/admin/product-categories`);
        
        if (!response.data.success) {
            throw new Error('Error al cargar categorías');
        }
        
        const category = response.data.data.categories.find(cat => cat.code === categoryCode);
        
        if (!category) {
            throw new Error('Categoría no encontrada');
        }
        
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
        modal.onclick = (e) => {
            if (e.target === modal) modal.remove();
        };
        
        modal.innerHTML = `
            <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Editar Categoría: ${category.code}</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <form onsubmit="handleEditCategory(event, '${categoryCode}')">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium mb-1">Código</label>
                                <input 
                                    type="text" 
                                    value="${category.code}"
                                    disabled
                                    class="w-full p-2 border border-border rounded text-sm bg-muted text-muted-foreground"
                                >
                                <p class="text-xs text-muted-foreground mt-1">El código no se puede modificar</p>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Nombre *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    required 
                                    maxlength="100"
                                    value="${category.name}"
                                    class="w-full p-2 border border-border rounded text-sm"
                                >
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Descripción</label>
                                <textarea 
                                    name="description" 
                                    rows="3"
                                    class="w-full p-2 border border-border rounded text-sm"
                                >${category.description || ''}</textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Grupo de Categoría *</label>
                                <select 
                                    name="category_group" 
                                    required 
                                    class="w-full p-2 border border-border rounded text-sm"
                                >
                                    <option value="Artículos de investigación" ${category.category_group === 'Artículos de investigación' ? 'selected' : ''}>Artículos de investigación</option>
                                    <option value="Libros y capítulos" ${category.category_group === 'Libros y capítulos' ? 'selected' : ''}>Libros y capítulos</option>
                                    <option value="Productos tecnológicos" ${category.category_group === 'Productos tecnológicos' ? 'selected' : ''}>Productos tecnológicos</option>
                                    <option value="Formación de recursos humanos" ${category.category_group === 'Formación de recursos humanos' ? 'selected' : ''}>Formación de recursos humanos</option>
                                    <option value="Divulgación del conocimiento" ${category.category_group === 'Divulgación del conocimiento' ? 'selected' : ''}>Divulgación del conocimiento</option>
                                </select>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium mb-1">Peso de Impacto *</label>
                                <input 
                                    type="number" 
                                    name="impact_weight" 
                                    required 
                                    min="0" 
                                    max="100" 
                                    step="0.1"
                                    value="${category.impact_weight}"
                                    class="w-full p-2 border border-border rounded text-sm"
                                >
                            </div>
                        </div>
                        
                        <div class="flex justify-end space-x-3 mt-6">
                            <button 
                                type="button" 
                                onclick="this.closest('.fixed').remove()"
                                class="bg-secondary text-secondary-foreground px-4 py-2 rounded hover:opacity-90"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit"
                                class="bg-primary text-primary-foreground px-4 py-2 rounded hover:opacity-90"
                            >
                                Guardar Cambios
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error cargando categoría para edición:', error);
        showToast('Error al cargar categoría', 'error');
    }
}

async function handleEditCategory(event, categoryCode) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const categoryData = {
        name: formData.get('name'),
        description: formData.get('description') || null,
        category_group: formData.get('category_group'),
        impact_weight: parseFloat(formData.get('impact_weight'))
    };
    
    try {
        const response = await axios.put(`${API_BASE}/admin/product-categories/${categoryCode}`, categoryData);
        
        if (response.data.success) {
            showToast('Categoría actualizada exitosamente');
            event.target.closest('.fixed').remove();
            loadAdminCategories(); // Recargar la lista
        } else {
            throw new Error(response.data.error || 'Error al actualizar categoría');
        }
        
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        showToast(`Error: ${errorMessage}`, 'error');
    }
}

async function deleteCategory(categoryCode, categoryName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${categoryName}" (${categoryCode})?\n\nEsta acción no se puede deshacer y fallará si hay productos usando esta categoría.`)) {
        return;
    }
    
    try {
        const response = await axios.delete(`${API_BASE}/admin/product-categories/${categoryCode}`);
        
        if (response.data.success) {
            showToast('Categoría eliminada exitosamente');
            loadAdminCategories(); // Recargar la lista
        } else {
            throw new Error(response.data.error || 'Error al eliminar categoría');
        }
        
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        showToast(`Error: ${errorMessage}`, 'error');
    }
}

// Función para navegar al portal público preservando la sesión
function goToPublicPortal() {
    console.log('🔄 Navegando al portal público preservando sesión...');
    
    // Verificar que el token esté guardado
    const token = localStorage.getItem('ctei_token');
    if (token) {
        console.log('✅ Token encontrado, navegando al portal público');
        // Agregar parámetro para indicar que viene del dashboard
        location.href = '/?from=dashboard';
    } else {
        console.log('⚠️ No hay token, redirigiendo sin autenticación');
        location.href = '/';
    }
}

// ========== GESTIÓN DE CONFIGURACIÓN DEL SITIO ==========

function renderAdminSiteConfigView() {
    document.getElementById('content').innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">Configuración del Sitio</h2>
                    <p class="text-muted-foreground">Gestionar configuraciones visuales y branding del sitio</p>
                </div>
            </div>
        </div>
        
        <!-- Gestión del Logo -->
        <div class="card mb-6">
            <div class="p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">Logo del Sitio</h3>
                    <button 
                        onclick="loadCurrentLogo()"
                        class="bg-secondary text-secondary-foreground px-3 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
                    >
                        <i class="fas fa-sync mr-2"></i>
                        Actualizar Vista
                    </button>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Vista actual del logo -->
                    <div>
                        <h4 class="font-medium mb-3">Logo Actual</h4>
                        <div class="level-2 p-4 text-center min-h-[200px] flex items-center justify-center" id="current-logo-container">
                            <div class="text-muted-foreground">
                                <i class="fas fa-image text-4xl mb-2"></i>
                                <p>Cargando...</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Subida de nuevo logo -->
                    <div>
                        <h4 class="font-medium mb-3">Cambiar Logo</h4>
                        <div class="space-y-4">
                            <!-- Área de subida -->
                            <div class="level-1 p-6 border-2 border-dashed border-border rounded-lg text-center">
                                <input 
                                    type="file" 
                                    id="logo-file-input" 
                                    accept="image/jpeg,image/jpg,image/png" 
                                    style="display: none;"
                                    onchange="handleLogoFileSelect(event)"
                                >
                                <button 
                                    onclick="document.getElementById('logo-file-input').click()"
                                    class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    <i class="fas fa-upload mr-2"></i>
                                    Seleccionar Imagen
                                </button>
                                <p class="text-sm text-muted-foreground mt-2">
                                    JPG o PNG, máximo 2MB
                                </p>
                            </div>
                            
                            <!-- Preview del nuevo logo -->
                            <div id="logo-preview-container" class="hidden">
                                <div class="level-2 p-4 text-center">
                                    <img id="logo-preview" src="" alt="Preview del logo" class="max-h-32 mx-auto mb-3 rounded">
                                    <div class="flex justify-center space-x-3">
                                        <button 
                                            onclick="uploadNewLogo()"
                                            class="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                                            id="upload-logo-btn"
                                        >
                                            <i class="fas fa-check mr-2"></i>
                                            Confirmar Cambio
                                        </button>
                                        <button 
                                            onclick="cancelLogoUpload()"
                                            class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity text-sm"
                                        >
                                            <i class="fas fa-times mr-2"></i>
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Botón para eliminar logo actual -->
                            <div class="pt-2 border-t border-border">
                                <button 
                                    onclick="removeCurrentLogo()"
                                    class="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm w-full"
                                    id="remove-logo-btn"
                                >
                                    <i class="fas fa-trash mr-2"></i>
                                    Eliminar Logo Actual
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Estado de carga -->
                <div id="logo-upload-status" class="hidden mt-4">
                    <div class="level-3 p-4 text-center">
                        <i class="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <p>Procesando logo...</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Información adicional -->
        <div class="card">
            <div class="p-6">
                <h3 class="text-lg font-semibold mb-3">Información</h3>
                <div class="text-sm text-muted-foreground space-y-2">
                    <p><strong>Formatos soportados:</strong> JPG, JPEG, PNG</p>
                    <p><strong>Tamaño máximo:</strong> 2 MB</p>
                    <p><strong>Recomendación:</strong> Usar imágenes con fondo transparente (PNG) y dimensiones cuadradas o rectangulares (proporción 2:1)</p>
                    <p><strong>Ubicación:</strong> El logo aparecerá en la esquina superior izquierda del sitio</p>
                </div>
            </div>
        </div>
    `;
    
    // Cargar logo actual
    loadCurrentLogo();
}

// Variable global para almacenar el archivo seleccionado
let selectedLogoFile = null;

async function loadCurrentLogo() {
    console.log('🖼️ Cargando logo actual...');
    
    try {
        const response = await axios.get(`${API_BASE}/admin/site-config`);
        
        if (response.data.success) {
            const config = response.data.data;
            const container = document.getElementById('current-logo-container');
            
            if (config.logo_url) {
                container.innerHTML = `
                    <div>
                        <img 
                            src="${config.logo_url}" 
                            alt="Logo actual" 
                            class="max-h-32 mx-auto mb-3 rounded shadow-sm"
                            style="max-width: 200px;"
                        >
                        <p class="text-sm text-muted-foreground">
                            Logo cargado: ${config.logo_filename || 'logo personalizado'}
                        </p>
                    </div>
                `;
                
                // Habilitar botón de eliminar
                const removeBtn = document.getElementById('remove-logo-btn');
                if (removeBtn) {
                    removeBtn.disabled = false;
                    removeBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            } else {
                container.innerHTML = `
                    <div class="text-muted-foreground">
                        <i class="fas fa-image text-4xl mb-2"></i>
                        <p>No hay logo configurado</p>
                        <p class="text-xs mt-2">Se usa el logo por defecto del sistema</p>
                    </div>
                `;
                
                // Deshabilitar botón de eliminar
                const removeBtn = document.getElementById('remove-logo-btn');
                if (removeBtn) {
                    removeBtn.disabled = true;
                    removeBtn.classList.add('opacity-50', 'cursor-not-allowed');
                }
            }
        }
    } catch (error) {
        console.error('Error cargando logo actual:', error);
        const container = document.getElementById('current-logo-container');
        container.innerHTML = `
            <div class="text-red-600">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Error al cargar logo</p>
                <p class="text-xs">${error.message}</p>
            </div>
        `;
    }
}

function handleLogoFileSelect(event) {
    const file = event.target.files[0];
    
    if (!file) {
        return;
    }
    
    // Validar tipo de archivo
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
        showToast('Solo se permiten archivos JPG y PNG', 'error');
        return;
    }
    
    // Validar tamaño (2MB máximo)
    if (file.size > 2 * 1024 * 1024) {
        showToast('El archivo es demasiado grande. Máximo 2MB', 'error');
        return;
    }
    
    selectedLogoFile = file;
    
    // Mostrar preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('logo-preview');
        const container = document.getElementById('logo-preview-container');
        
        preview.src = e.target.result;
        container.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
    
    console.log('✅ Archivo seleccionado:', file.name, 'Tamaño:', (file.size / 1024).toFixed(2) + 'KB');
}

async function uploadNewLogo() {
    if (!selectedLogoFile) {
        showToast('No hay archivo seleccionado', 'error');
        return;
    }
    
    const uploadBtn = document.getElementById('upload-logo-btn');
    const statusDiv = document.getElementById('logo-upload-status');
    
    try {
        // Mostrar estado de carga
        uploadBtn.disabled = true;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Subiendo...';
        statusDiv.classList.remove('hidden');
        
        // Crear FormData
        const formData = new FormData();
        formData.append('logo', selectedLogoFile);
        
        console.log('📤 Subiendo logo...', selectedLogoFile.name);
        
        // Enviar archivo
        const response = await axios.post(`${API_BASE}/admin/upload-logo`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.data.success) {
            showToast('Logo actualizado exitosamente', 'success');
            
            // Limpiar formulario
            cancelLogoUpload();
            
            // Recargar logo actual
            await loadCurrentLogo();
            
            console.log('✅ Logo subido exitosamente:', response.data.data.logo_url);
        } else {
            throw new Error(response.data.error || 'Error al subir logo');
        }
        
    } catch (error) {
        console.error('❌ Error subiendo logo:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        showToast(`Error: ${errorMessage}`, 'error');
    } finally {
        // Restaurar botón
        uploadBtn.disabled = false;
        uploadBtn.innerHTML = '<i class="fas fa-check mr-2"></i>Confirmar Cambio';
        statusDiv.classList.add('hidden');
    }
}

function cancelLogoUpload() {
    selectedLogoFile = null;
    
    // Limpiar input
    const input = document.getElementById('logo-file-input');
    input.value = '';
    
    // Ocultar preview
    const container = document.getElementById('logo-preview-container');
    container.classList.add('hidden');
    
    console.log('❌ Subida de logo cancelada');
}

async function removeCurrentLogo() {
    if (!confirm('¿Estás seguro de que quieres eliminar el logo actual? Se usará el logo por defecto del sistema.')) {
        return;
    }
    
    const removeBtn = document.getElementById('remove-logo-btn');
    
    try {
        removeBtn.disabled = true;
        removeBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Eliminando...';
        
        console.log('🗑️ Eliminando logo actual...');
        
        const response = await axios.delete(`${API_BASE}/admin/logo`);
        
        if (response.data.success) {
            showToast('Logo eliminado exitosamente', 'success');
            await loadCurrentLogo();
            console.log('✅ Logo eliminado exitosamente');
        } else {
            throw new Error(response.data.error || 'Error al eliminar logo');
        }
        
    } catch (error) {
        console.error('❌ Error eliminando logo:', error);
        const errorMessage = error.response?.data?.error || error.message || 'Error desconocido';
        showToast(`Error: ${errorMessage}`, 'error');
    } finally {
        removeBtn.disabled = false;
        removeBtn.innerHTML = '<i class="fas fa-trash mr-2"></i>Eliminar Logo Actual';
    }
}

// ========== UTILIDADES DE UI - MENÚ DE ACCIONES ==========

// Función para toggle del menú de acciones de productos
function toggleProductActionsMenu(productId) {
    const menu = document.getElementById(`product-actions-${productId}`);
    if (menu) {
        // Cerrar otros menús abiertos
        closeAllActionsMenus();
        // Toggle el menú actual
        menu.classList.toggle('hidden');
    }
}

// Función para toggle del menú de acciones de usuarios
function toggleUserActionsMenu(userId) {
    const menu = document.getElementById(`user-actions-${userId}`);
    if (menu) {
        // Cerrar otros menús abiertos
        closeAllActionsMenus();
        // Toggle el menú actual
        menu.classList.toggle('hidden');
    }
}

// Función para toggle del menú de acciones de proyectos
function toggleProjectActionsMenu(projectId) {
    const menu = document.getElementById(`project-actions-${projectId}`);
    if (menu) {
        // Cerrar otros menús abiertos
        closeAllActionsMenus();
        // Toggle el menú actual
        menu.classList.toggle('hidden');
    }
}

// Función para cerrar todos los menús de acciones
function closeAllActionsMenus() {
    document.querySelectorAll('.ctei-actions-dropdown').forEach(menu => {
        menu.classList.add('hidden');
    });
}

// Cerrar menús al hacer click fuera
document.addEventListener('click', function(event) {
    if (!event.target.closest('.ctei-actions-menu')) {
        closeAllActionsMenus();
    }
});

// Funciones placeholder para acciones de proyectos
function duplicateProject(projectId) {
    showToast('Función de duplicar proyecto pendiente de implementar');
}

function deleteProject(projectId) {
    const project = DashboardState.projects.find(p => p.id === projectId);
    if (!project) {
        showToast('Proyecto no encontrado', 'error');
        return;
    }
    
    const confirmDelete = confirm(`¿Estás seguro de que deseas eliminar el proyecto "${project.title}"?\n\nEsta acción no se puede deshacer.`);
    if (confirmDelete) {
        showToast('Función de eliminar proyecto pendiente de implementar');
    }
}

// ========== GESTIÓN DE LOGO DINÁMICO EN NAVBAR ==========

// Cargar configuración del sitio y aplicar logo en el dashboard
async function loadDashboardSiteLogo() {
    try {
        const response = await axios.get(`${API_BASE}/public/site-config`);
        const logoContainer = document.getElementById('dashboard-site-logo');
        const siteName = response.data.data?.site_name || 'CODECTI CHOCÓ';
        
        if (response.data.success && response.data.data.logo_url) {
            // Usar logo personalizado desde admin - SOLO IMAGEN
            const logoUrl = response.data.data.logo_url;
            
            logoContainer.innerHTML = `
                <img 
                    src="${logoUrl}" 
                    alt="${siteName} Logo" 
                    class="h-8 w-auto inline"
                    style="max-height: 32px; object-fit: contain;"
                >
            `;
            
            console.log('✅ Logo personalizado cargado en dashboard (solo imagen):', logoUrl);
        } else {
            // Usar logo por defecto de CODECTI CHOCÓ - SOLO IMAGEN
            logoContainer.innerHTML = `
                <img 
                    src="/static/codecti-logo.png" 
                    alt="${siteName} Logo" 
                    class="h-8 w-auto inline"
                    style="max-height: 32px; object-fit: contain;"
                >
            `;
            
            console.log('✅ Logo por defecto de CODECTI CHOCÓ cargado en dashboard (solo imagen)');
        }
    } catch (error) {
        // Fallback si hay error de red - SOLO IMAGEN
        const logoContainer = document.getElementById('dashboard-site-logo');
        logoContainer.innerHTML = `
            <img 
                src="/static/codecti-logo.png" 
                alt="CODECTI CHOCÓ Logo" 
                class="h-8 w-auto inline"
                style="max-height: 32px; object-fit: contain;"
            >
        `;
        console.warn('⚠️ Error cargando configuración del dashboard, usando logo fallback (solo imagen):', error);
    }
}

// ========== GESTIÓN DE ARCHIVOS ==========

// Vista principal de gestión de archivos
function renderFileManagerView() {
    const mainContent = document.getElementById('mainContent');
    mainContent.innerHTML = `
        <div class="ctei-container">
            <div class="mb-8">
                <h2 class="text-3xl font-bold text-foreground mb-2">
                    <i class="fas fa-folder-open mr-3"></i>
                    Gestión de Archivos
                </h2>
                <p class="text-muted-foreground">
                    Administra todos los archivos de tus proyectos y productos CTeI desde un lugar centralizado.
                </p>
            </div>
            
            <!-- Filtros y búsqueda -->
            <div class="level-1 p-6 mb-6">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Buscar archivos</label>
                        <input 
                            type="text" 
                            id="fileSearchInput"
                            placeholder="Nombre de archivo, proyecto..."
                            class="ctei-search-input"
                            oninput="filterFiles()"
                        >
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Tipo de entidad</label>
                        <select id="fileEntityFilter" class="ctei-search-input" onchange="filterFiles()">
                            <option value="">Todos</option>
                            <option value="project">Archivos de Proyectos</option>
                            <option value="product">Archivos de Productos</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Tipo de archivo</label>
                        <select id="fileTypeFilter" class="ctei-search-input" onchange="filterFiles()">
                            <option value="">Todos los tipos</option>
                            <option value="pdf">PDF</option>
                            <option value="image">Imágenes</option>
                            <option value="document">Documentos</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button onclick="clearFileFilters()" class="ctei-btn-secondary w-full">
                            <i class="fas fa-times mr-2"></i>
                            Limpiar Filtros
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Estadísticas rápidas -->
            <div id="fileStats" class="ctei-grid ctei-grid-4 mb-6">
                <div class="ctei-metric-card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-primary/10">
                            <i class="fas fa-file text-2xl text-primary"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold text-foreground" id="totalFiles">0</p>
                            <p class="text-sm text-muted-foreground">Total Archivos</p>
                        </div>
                    </div>
                </div>
                <div class="ctei-metric-card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-chart-2/10">
                            <i class="fas fa-project-diagram text-2xl text-chart-2"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold text-foreground" id="projectFiles">0</p>
                            <p class="text-sm text-muted-foreground">Archivos de Proyectos</p>
                        </div>
                    </div>
                </div>
                <div class="ctei-metric-card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-chart-3/10">
                            <i class="fas fa-cubes text-2xl text-chart-3"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold text-foreground" id="productFiles">0</p>
                            <p class="text-sm text-muted-foreground">Archivos de Productos</p>
                        </div>
                    </div>
                </div>
                <div class="ctei-metric-card">
                    <div class="flex items-center">
                        <div class="p-3 rounded-full bg-chart-4/10">
                            <i class="fas fa-hdd text-2xl text-chart-4"></i>
                        </div>
                        <div class="ml-4">
                            <p class="text-2xl font-bold text-foreground" id="totalSize">0 MB</p>
                            <p class="text-sm text-muted-foreground">Espacio Usado</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Lista de archivos -->
            <div id="filesContainer" class="level-1 p-6">
                <div class="flex justify-between items-center mb-6">
                    <h3 class="text-xl font-semibold">Todos los Archivos</h3>
                    <div class="flex space-x-2">
                        <button onclick="refreshFileList()" class="ctei-btn-secondary">
                            <i class="fas fa-sync-alt mr-2"></i>
                            Actualizar
                        </button>
                        <button onclick="showBulkUploadModal()" class="ctei-btn-primary">
                            <i class="fas fa-upload mr-2"></i>
                            Subir Archivos
                        </button>
                    </div>
                </div>
                
                <div id="filesList" class="space-y-3">
                    <div class="text-center py-8">
                        <i class="fas fa-spinner fa-spin text-4xl text-muted-foreground mb-3"></i>
                        <p class="text-muted-foreground">Cargando archivos...</p>
                    </div>
                </div>
                
                <!-- Paginación -->
                <div id="filesPagination" class="mt-6 flex justify-center">
                    <!-- Controles de paginación aparecerán aquí -->
                </div>
            </div>
        </div>
        
        <!-- Modal de subida masiva -->
        <div id="bulkUploadModal" class="fixed inset-0 bg-background/80 backdrop-blur-sm hidden z-50">
            <div class="flex items-center justify-center min-h-screen p-4">
                <div class="level-3 max-w-2xl w-full">
                    <div class="p-6">
                        <div class="flex justify-between items-center mb-6">
                            <h3 class="text-xl font-semibold">Subir Archivos Masivamente</h3>
                            <button onclick="closeBulkUploadModal()" class="text-muted-foreground hover:text-foreground">
                                <i class="fas fa-times text-xl"></i>
                            </button>
                        </div>
                        
                        <div id="bulkUploadContent">
                            <!-- Contenido del modal aparecerá aquí -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Cargar datos iniciales
    loadFileManagerData();
}

// Cargar datos del gestor de archivos
async function loadFileManagerData() {
    try {
        // Cargar todos los proyectos del usuario para mostrar archivos
        const projectsResponse = await axios.get(`${API_BASE}/me/projects`);
        
        if (!projectsResponse.data.success) {
            throw new Error('Error al cargar proyectos');
        }
        
        const projects = projectsResponse.data.data;
        const allFiles = [];
        let totalSize = 0;
        let projectFilesCount = 0;
        let productFilesCount = 0;
        
        // Cargar archivos de cada proyecto
        for (const project of projects) {
            try {
                // Archivos del proyecto
                const projectFilesResponse = await axios.get(`${API_BASE}/me/projects/${project.id}/files`);
                if (projectFilesResponse.data.success) {
                    const projectFiles = projectFilesResponse.data.data.map(file => ({
                        ...file,
                        entity_type: 'project',
                        entity_name: project.title,
                        project_id: project.id
                    }));
                    allFiles.push(...projectFiles);
                    projectFilesCount += projectFiles.length;
                    totalSize += projectFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
                }
                
                // Archivos de productos del proyecto
                const productsResponse = await axios.get(`${API_BASE}/me/projects/${project.id}/products`);
                if (productsResponse.data.success) {
                    const products = productsResponse.data.data;
                    
                    for (const product of products) {
                        try {
                            const productFilesResponse = await axios.get(`${API_BASE}/me/projects/${project.id}/products/${product.id}/files`);
                            if (productFilesResponse.data.success) {
                                const productFiles = productFilesResponse.data.data.map(file => ({
                                    ...file,
                                    entity_type: 'product',
                                    entity_name: product.product_code,
                                    project_id: project.id,
                                    product_id: product.id
                                }));
                                allFiles.push(...productFiles);
                                productFilesCount += productFiles.length;
                                totalSize += productFiles.reduce((sum, file) => sum + (file.file_size || 0), 0);
                            }
                        } catch (error) {
                            console.warn(`Error cargando archivos del producto ${product.id}:`, error);
                        }
                    }
                }
            } catch (error) {
                console.warn(`Error cargando archivos del proyecto ${project.id}:`, error);
            }
        }
        
        // Actualizar estadísticas
        document.getElementById('totalFiles').textContent = allFiles.length;
        document.getElementById('projectFiles').textContent = projectFilesCount;
        document.getElementById('productFiles').textContent = productFilesCount;
        document.getElementById('totalSize').textContent = FileManager.formatFileSize(totalSize);
        
        // Almacenar archivos para filtrado
        window.allFilesData = allFiles;
        
        // Mostrar lista inicial
        renderFilesList(allFiles);
        
    } catch (error) {
        console.error('Error cargando datos de archivos:', error);
        document.getElementById('filesList').innerHTML = `
            <div class="text-center py-8 text-red-600">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p>Error al cargar archivos: ${error.message}</p>
                <button onclick="loadFileManagerData()" class="ctei-btn-secondary mt-3">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// Renderizar lista de archivos
function renderFilesList(files) {
    const container = document.getElementById('filesList');
    
    if (!files || files.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-muted-foreground">
                <i class="fas fa-folder-open text-4xl mb-3"></i>
                <p>No se encontraron archivos</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = files.map(file => `
        <div class="ctei-file-item">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <div class="ctei-file-icon">
                        ${FileManager.getFileIcon(file.mime_type)}
                    </div>
                    <div>
                        <div class="font-medium text-foreground">${file.original_name}</div>
                        <div class="text-sm text-muted-foreground">
                            ${file.entity_type === 'project' ? '📁' : '📦'} ${file.entity_name} • 
                            ${FileManager.formatFileSize(file.file_size)} • 
                            ${new Date(file.uploaded_at).toLocaleDateString()}
                        </div>
                        ${file.uploaded_by_name ? `<div class="text-xs text-muted-foreground">Por: ${file.uploaded_by_name}</div>` : ''}
                    </div>
                </div>
                <div class="flex items-center space-x-2">
                    <a 
                        href="${file.file_url}" 
                        target="_blank" 
                        class="ctei-btn-secondary ctei-btn-sm"
                        title="Ver archivo"
                    >
                        <i class="fas fa-eye"></i>
                    </a>
                    <a 
                        href="${file.file_url}" 
                        download="${file.original_name}"
                        class="ctei-btn-secondary ctei-btn-sm"
                        title="Descargar archivo"
                    >
                        <i class="fas fa-download"></i>
                    </a>
                    <button 
                        onclick="confirmDeleteFileFromManager(${file.id}, '${file.original_name}')"
                        class="ctei-btn-secondary ctei-btn-sm hover:bg-red-100 hover:text-red-700"
                        title="Eliminar archivo"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Filtrar archivos
function filterFiles() {
    if (!window.allFilesData) return;
    
    const searchTerm = document.getElementById('fileSearchInput').value.toLowerCase();
    const entityFilter = document.getElementById('fileEntityFilter').value;
    const typeFilter = document.getElementById('fileTypeFilter').value;
    
    let filteredFiles = window.allFilesData.filter(file => {
        const matchesSearch = !searchTerm || 
            file.original_name.toLowerCase().includes(searchTerm) ||
            file.entity_name.toLowerCase().includes(searchTerm);
            
        const matchesEntity = !entityFilter || file.entity_type === entityFilter;
        
        const matchesType = !typeFilter || 
            (typeFilter === 'pdf' && file.mime_type.includes('pdf')) ||
            (typeFilter === 'image' && file.mime_type.includes('image')) ||
            (typeFilter === 'document' && (file.mime_type.includes('word') || file.mime_type.includes('text')));
            
        return matchesSearch && matchesEntity && matchesType;
    });
    
    renderFilesList(filteredFiles);
}

// Limpiar filtros
function clearFileFilters() {
    document.getElementById('fileSearchInput').value = '';
    document.getElementById('fileEntityFilter').value = '';
    document.getElementById('fileTypeFilter').value = '';
    filterFiles();
}

// Actualizar lista
function refreshFileList() {
    loadFileManagerData();
}

// Confirmar eliminación desde el gestor
function confirmDeleteFileFromManager(fileId, fileName) {
    if (confirm(`¿Estás seguro de que quieres eliminar el archivo "${fileName}"?\\n\\nEsta acción no se puede deshacer.`)) {
        deleteFileFromManager(fileId);
    }
}

// Eliminar archivo desde el gestor
async function deleteFileFromManager(fileId) {
    try {
        await FileManager.deleteFile(fileId);
        showNotification('Archivo eliminado exitosamente', 'success');
        loadFileManagerData(); // Recargar datos
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        showNotification(`Error al eliminar archivo: ${error.message}`, 'error');
    }
}

// Modal de subida masiva
function showBulkUploadModal() {
    document.getElementById('bulkUploadModal').classList.remove('hidden');
    loadBulkUploadContent();
}

function closeBulkUploadModal() {
    document.getElementById('bulkUploadModal').classList.add('hidden');
}

async function loadBulkUploadContent() {
    const content = document.getElementById('bulkUploadContent');
    
    try {
        // Cargar proyectos para seleccionar destino
        const projectsResponse = await axios.get(`${API_BASE}/me/projects`);
        
        if (!projectsResponse.data.success) {
            throw new Error('Error al cargar proyectos');
        }
        
        const projects = projectsResponse.data.data;
        
        content.innerHTML = `
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium mb-2">Proyecto de destino</label>
                    <select id="bulkProjectSelect" class="ctei-search-input">
                        <option value="">Seleccionar proyecto...</option>
                        ${projects.map(project => `
                            <option value="${project.id}">${project.title}</option>
                        `).join('')}
                    </select>
                </div>
                
                <div id="bulkUploadZone" class="ctei-file-dropzone">
                    <i class="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-3"></i>
                    <p class="text-foreground mb-2">
                        Arrastra múltiples archivos aquí o haz click para seleccionar
                    </p>
                    <p class="text-sm text-muted-foreground">
                        PDFs, imágenes y documentos • Máximo 15MB por archivo
                    </p>
                    <input type="file" id="bulkFileInput" multiple class="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.txt">
                </div>
                
                <div id="bulkUploadProgress" class="hidden">
                    <h4 class="font-medium mb-3">Progreso de subida:</h4>
                    <div id="bulkUploadList" class="space-y-2 max-h-60 overflow-y-auto">
                        <!-- Lista de archivos subiendo -->
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3">
                    <button onclick="closeBulkUploadModal()" class="ctei-btn-secondary">
                        Cancelar
                    </button>
                    <button onclick="startBulkUpload()" id="startBulkUploadBtn" class="ctei-btn-primary" disabled>
                        <i class="fas fa-upload mr-2"></i>
                        Subir Archivos
                    </button>
                </div>
            </div>
        `;
        
        // Configurar eventos
        setupBulkUploadEvents();
        
    } catch (error) {
        content.innerHTML = `
            <div class="text-center py-8 text-red-600">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p>Error al cargar proyectos: ${error.message}</p>
            </div>
        `;
    }
}

function setupBulkUploadEvents() {
    const fileInput = document.getElementById('bulkFileInput');
    const dropZone = document.getElementById('bulkUploadZone');
    const projectSelect = document.getElementById('bulkProjectSelect');
    const uploadBtn = document.getElementById('startBulkUploadBtn');
    
    // Click en zona de drop
    dropZone.addEventListener('click', () => {
        fileInput.click();
    });
    
    // Drag & drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('active');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
    });
    
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('active');
        fileInput.files = e.dataTransfer.files;
        updateBulkUploadUI();
    });
    
    // Selección de archivos
    fileInput.addEventListener('change', updateBulkUploadUI);
    
    // Selección de proyecto
    projectSelect.addEventListener('change', updateBulkUploadUI);
    
    function updateBulkUploadUI() {
        const hasFiles = fileInput.files && fileInput.files.length > 0;
        const hasProject = projectSelect.value;
        
        uploadBtn.disabled = !hasFiles || !hasProject;
        
        if (hasFiles) {
            dropZone.innerHTML = `
                <i class="fas fa-check-circle text-4xl text-green-600 mb-3"></i>
                <p class="text-foreground mb-2">
                    ${fileInput.files.length} archivo(s) seleccionado(s)
                </p>
                <p class="text-sm text-muted-foreground">
                    Haz click para cambiar la selección
                </p>
            `;
        }
    }
}

async function startBulkUpload() {
    const fileInput = document.getElementById('bulkFileInput');
    const projectSelect = document.getElementById('bulkProjectSelect');
    const progressSection = document.getElementById('bulkUploadProgress');
    const progressList = document.getElementById('bulkUploadList');
    
    if (!fileInput.files || fileInput.files.length === 0 || !projectSelect.value) {
        alert('Por favor selecciona archivos y un proyecto de destino');
        return;
    }
    
    progressSection.classList.remove('hidden');
    document.getElementById('startBulkUploadBtn').disabled = true;
    
    const files = Array.from(fileInput.files);
    const projectId = projectSelect.value;
    let successCount = 0;
    let errorCount = 0;
    
    for (const file of files) {
        const fileDiv = document.createElement('div');
        fileDiv.className = 'flex items-center justify-between p-3 bg-card rounded-lg';
        fileDiv.innerHTML = `
            <div class="flex items-center space-x-3">
                <i class="fas fa-file text-muted-foreground"></i>
                <span class="text-sm">${file.name}</span>
            </div>
            <div class="flex items-center space-x-2">
                <div class="w-4 h-4">
                    <i class="fas fa-spinner fa-spin text-yellow-600"></i>
                </div>
                <span class="text-xs text-muted-foreground">Subiendo...</span>
            </div>
        `;
        progressList.appendChild(fileDiv);
        
        try {
            await FileManager.uploadFile('project', projectId, file);
            fileDiv.querySelector('.w-4').innerHTML = '<i class="fas fa-check-circle text-green-600"></i>';
            fileDiv.querySelector('.text-xs').textContent = 'Completado';
            fileDiv.querySelector('.text-xs').className = 'text-xs text-green-600';
            successCount++;
        } catch (error) {
            fileDiv.querySelector('.w-4').innerHTML = '<i class="fas fa-exclamation-circle text-red-600"></i>';
            fileDiv.querySelector('.text-xs').textContent = `Error: ${error.message}`;
            fileDiv.querySelector('.text-xs').className = 'text-xs text-red-600';
            errorCount++;
        }
    }
    
    // Mostrar resumen
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'mt-4 p-3 bg-muted rounded-lg';
    summaryDiv.innerHTML = `
        <div class="text-sm font-medium">Resumen de subida:</div>
        <div class="text-sm text-muted-foreground">
            ${successCount} archivo(s) subido(s) exitosamente, ${errorCount} error(es)
        </div>
    `;
    progressList.appendChild(summaryDiv);
    
    // Recargar datos principales si hubo éxitos
    if (successCount > 0) {
        setTimeout(() => {
            loadFileManagerData();
            showNotification(`${successCount} archivo(s) subido(s) exitosamente`, 'success');
        }, 1000);
    }
    
    document.getElementById('startBulkUploadBtn').textContent = 'Cerrar';
    document.getElementById('startBulkUploadBtn').disabled = false;
    document.getElementById('startBulkUploadBtn').onclick = closeBulkUploadModal;
}

// ===== DASHBOARD DE SCORING Y EVALUACIÓN AUTOMATIZADA - FASE 3A =====

async function renderScoringDashboard() {
    try {
        document.getElementById('content').innerHTML = `
            <div class="space-y-6">
                <!-- Encabezado del Dashboard de Scoring -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div>
                            <div class="ctei-content-card-title">
                                <i class="fas fa-chart-bar text-accent mr-3"></i>
                                Sistema de Evaluación y Scoring
                            </div>
                            <div class="ctei-content-card-description">
                                Fase 3A - Análisis Automatizado del Desempeño de Proyectos
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div id="scoring-last-updated" class="text-sm text-muted-foreground">
                                <i class="fas fa-sync-alt mr-1"></i>
                                Cargando...
                            </div>
                            <button 
                                onclick="refreshScoringDashboard()"
                                class="ctei-btn-primary"
                            >
                                <i class="fas fa-sync-alt mr-2"></i>
                                Actualizar
                            </button>
                            <button 
                                onclick="calculateAllScoring()"
                                class="ctei-btn-secondary"
                                style="background-color: var(--chart-1); color: var(--background);"
                            >
                                <i class="fas fa-calculator mr-2"></i>
                                Calcular Scoring
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Filtros de Scoring -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">Filtros de Evaluación</div>
                    </div>
                    <div class="p-4">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Categoría</label>
                                <select id="scoring-category-filter" onchange="filterScoring()" 
                                        class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary">
                                    <option value="">Todas las categorías</option>
                                    <option value="EXCELENTE">Excelente</option>
                                    <option value="BUENO">Bueno</option>
                                    <option value="REGULAR">Regular</option>
                                    <option value="NECESITA_MEJORA">Necesita Mejora</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Score Mínimo</label>
                                <input type="number" id="scoring-min-filter" onchange="filterScoring()" 
                                       min="0" max="100" placeholder="0"
                                       class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-foreground mb-2">Score Máximo</label>
                                <input type="number" id="scoring-max-filter" onchange="filterScoring()" 
                                       min="0" max="100" placeholder="100"
                                       class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary">
                            </div>
                            <div class="flex items-end">
                                <button onclick="clearScoringFilters()" 
                                        class="w-full bg-muted text-muted-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90">
                                    <i class="fas fa-times mr-2"></i>
                                    Limpiar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Estadísticas de Scoring -->
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div id="scoring-stats-container">
                        <!-- Las estadísticas se cargarán aquí -->
                    </div>
                </div>

                <!-- Gráfico de Distribución -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-chart-pie mr-2"></i>
                            Distribución por Categoría de Evaluación
                        </div>
                    </div>
                    <div class="p-6">
                        <canvas id="scoringDistributionChart" width="400" height="200"></canvas>
                    </div>
                </div>

                <!-- Lista de Proyectos con Scoring -->
                <div class="ctei-content-card">
                    <div class="ctei-content-card-header">
                        <div class="ctei-content-card-title">
                            <i class="fas fa-list mr-2"></i>
                            Evaluación de Proyectos
                        </div>
                    </div>
                    <div class="p-4">
                        <div id="scoring-list-container">
                            <!-- La lista de scoring se cargará aquí -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Cargar datos del dashboard
        loadScoringOverview();
        
    } catch (error) {
        console.error('Error rendering scoring dashboard:', error);
        showToast('Error al cargar dashboard de scoring', 'error');
    }
}

async function loadScoringOverview() {
    try {
        const category = document.getElementById('scoring-category-filter')?.value || '';
        const minScore = document.getElementById('scoring-min-filter')?.value || '';
        const maxScore = document.getElementById('scoring-max-filter')?.value || '';
        
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (minScore) params.append('min_score', minScore);
        if (maxScore) params.append('max_score', maxScore);
        
        const response = await axios.get(`/api/admin/scoring/overview?${params.toString()}`);
        
        if (response.data.success) {
            const data = response.data.data;
            
            // Actualizar estadísticas
            renderScoringStatistics(data.statistics);
            
            // Actualizar gráfico de distribución
            renderScoringChart(data.statistics.by_category);
            
            // Actualizar lista de proyectos
            renderScoringList(data.scores);
            
            // Actualizar timestamp
            document.getElementById('scoring-last-updated').innerHTML = 
                `<i class="fas fa-sync-alt mr-1"></i> Actualizado: ${new Date().toLocaleTimeString()}`;
                
        } else {
            showToast('Error al cargar datos de scoring', 'error');
        }
        
    } catch (error) {
        console.error('Error loading scoring overview:', error);
        showToast('Error de conexión al cargar scoring', 'error');
    }
}

function renderScoringStatistics(stats) {
    const container = document.getElementById('scoring-stats-container');
    
    // Estadística total
    const totalProjects = stats.total_projects || 0;
    
    // Estadísticas por categoría
    const categories = stats.by_category || [];
    const categoryStats = categories.reduce((acc, cat) => {
        acc[cat.evaluation_category] = cat;
        return acc;
    }, {});
    
    // Promedios por criterio
    const criteriaAvgs = stats.by_criteria || {};
    
    container.innerHTML = `
        <div class="ctei-metric-card">
            <div class="ctei-metric-icon bg-blue-100 text-blue-600">
                <i class="fas fa-clipboard-list"></i>
            </div>
            <div class="ctei-metric-content">
                <div class="ctei-metric-value">${totalProjects}</div>
                <div class="ctei-metric-label">Proyectos Evaluados</div>
            </div>
        </div>
        
        <div class="ctei-metric-card">
            <div class="ctei-metric-icon bg-green-100 text-green-600">
                <i class="fas fa-star"></i>
            </div>
            <div class="ctei-metric-content">
                <div class="ctei-metric-value">${(criteriaAvgs.avg_total || 0).toFixed(1)}</div>
                <div class="ctei-metric-label">Score Promedio</div>
            </div>
        </div>
        
        <div class="ctei-metric-card">
            <div class="ctei-metric-icon bg-emerald-100 text-emerald-600">
                <i class="fas fa-trophy"></i>
            </div>
            <div class="ctei-metric-content">
                <div class="ctei-metric-value">${categoryStats.EXCELENTE?.count || 0}</div>
                <div class="ctei-metric-label">Proyectos Excelentes</div>
            </div>
        </div>
        
        <div class="ctei-metric-card">
            <div class="ctei-metric-icon bg-amber-100 text-amber-600">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div class="ctei-metric-content">
                <div class="ctei-metric-value">${categoryStats.NECESITA_MEJORA?.count || 0}</div>
                <div class="ctei-metric-label">Requieren Mejora</div>
            </div>
        </div>
    `;
}

function renderScoringChart(categoryData) {
    const ctx = document.getElementById('scoringDistributionChart').getContext('2d');
    
    const categories = ['EXCELENTE', 'BUENO', 'REGULAR', 'NECESITA_MEJORA'];
    const colors = ['#22C55E', '#3B82F6', '#F59E0B', '#EF4444'];
    const labels = ['Excelente', 'Bueno', 'Regular', 'Necesita Mejora'];
    
    const data = categories.map(cat => {
        const found = categoryData.find(item => item.evaluation_category === cat);
        return found ? found.count : 0;
    });
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 20,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderScoringList(scores) {
    const container = document.getElementById('scoring-list-container');
    
    if (!scores || scores.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-muted-foreground">
                <i class="fas fa-chart-bar text-4xl mb-4"></i>
                <p>No hay evaluaciones de scoring disponibles</p>
                <p class="text-sm">Haz clic en "Calcular Scoring" para generar evaluaciones</p>
            </div>
        `;
        return;
    }
    
    const scoringHtml = scores.map(score => `
        <div class="scoring-item border border-border rounded-lg p-4 hover:border-primary transition-all duration-200 mb-4">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="font-semibold text-lg text-foreground">${score.project_title}</h3>
                        <span class="px-3 py-1 rounded-full text-sm font-medium" 
                              style="background-color: ${score.category_color}20; color: ${score.category_color};">
                            ${score.category_label}
                        </span>
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white"
                                 style="background-color: ${score.category_color};">
                                ${score.total_score}
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
                        <div class="text-center p-2 bg-muted rounded">
                            <div class="text-sm text-muted-foreground">Completitud</div>
                            <div class="font-semibold">${score.completeness_score}</div>
                        </div>
                        <div class="text-center p-2 bg-muted rounded">
                            <div class="text-sm text-muted-foreground">Colaboración</div>
                            <div class="font-semibold">${score.collaboration_score}</div>
                        </div>
                        <div class="text-center p-2 bg-muted rounded">
                            <div class="text-sm text-muted-foreground">Productividad</div>
                            <div class="font-semibold">${score.productivity_score}</div>
                        </div>
                        <div class="text-center p-2 bg-muted rounded">
                            <div class="text-sm text-muted-foreground">Impacto</div>
                            <div class="font-semibold">${score.impact_score}</div>
                        </div>
                        <div class="text-center p-2 bg-muted rounded">
                            <div class="text-sm text-muted-foreground">Innovación</div>
                            <div class="font-semibold">${score.innovation_score}</div>
                        </div>
                        <div class="text-center p-2 bg-muted rounded">
                            <div class="text-sm text-muted-foreground">Cronograma</div>
                            <div class="font-semibold">${score.timeline_score}</div>
                        </div>
                    </div>
                    
                    ${score.recommendations && score.recommendations.length > 0 ? `
                        <div class="mb-3">
                            <h4 class="text-sm font-medium text-muted-foreground mb-2">Recomendaciones:</h4>
                            <ul class="text-sm space-y-1">
                                ${score.recommendations.slice(0, 3).map(rec => 
                                    `<li class="flex items-center"><i class="fas fa-lightbulb text-amber-500 mr-2 text-xs"></i>${rec}</li>`
                                ).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    <div class="flex items-center justify-between text-sm text-muted-foreground">
                        <div class="flex items-center gap-4">
                            <span><i class="fas fa-user mr-1"></i>${score.owner_name}</span>
                            <span><i class="fas fa-box mr-1"></i>${score.product_count || 0} productos</span>
                            <span><i class="fas fa-users mr-1"></i>${score.collaborator_count || 0} colaboradores</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span>${score.last_calculated_formatted}</span>
                            <button onclick="viewScoringDetails(${score.project_id})" 
                                    class="text-primary hover:text-primary-dark">
                                <i class="fas fa-eye"></i> Ver detalle
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = scoringHtml;
}

async function calculateAllScoring() {
    try {
        const button = event.target;
        const originalText = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Calculando...';
        
        const response = await axios.post('/api/admin/scoring/calculate', {});
        
        if (response.data.success) {
            showToast(`Scoring calculado para ${response.data.data.results.length} proyectos`, 'success');
            loadScoringOverview(); // Recargar datos
        } else {
            showToast('Error al calcular scoring', 'error');
        }
        
    } catch (error) {
        console.error('Error calculating scoring:', error);
        showToast('Error de conexión al calcular scoring', 'error');
    } finally {
        const button = event.target;
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-calculator mr-2"></i>Calcular Scoring';
    }
}

async function viewScoringDetails(projectId) {
    try {
        const response = await axios.get(`/api/admin/scoring/project/${projectId}`);
        
        if (response.data.success) {
            const data = response.data.data;
            showScoringDetailsModal(data);
        } else {
            showToast('Error al cargar detalles de scoring', 'error');
        }
        
    } catch (error) {
        console.error('Error loading scoring details:', error);
        showToast('Error de conexión', 'error');
    }
}

function showScoringDetailsModal(data) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6 border-b border-border">
                <div class="flex items-center justify-between">
                    <h2 class="text-2xl font-bold text-foreground">Detalle de Evaluación</h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <p class="text-muted-foreground mt-1">${data.score.project_title}</p>
            </div>
            
            <div class="p-6 space-y-6">
                <!-- Score General -->
                <div class="text-center">
                    <div class="inline-flex items-center justify-center w-24 h-24 rounded-full text-3xl font-bold text-white mb-4"
                         style="background-color: ${data.score.category_color};">
                        ${data.score.total_score}
                    </div>
                    <div class="text-xl font-semibold">${data.score.category_label}</div>
                    <div class="text-muted-foreground">Evaluación General</div>
                </div>
                
                <!-- Breakdown por Criterios -->
                <div>
                    <h3 class="text-lg font-semibold mb-4">Breakdown por Criterios</h3>
                    <div class="space-y-3">
                        ${Object.entries(data.breakdown).map(([key, criterion]) => `
                            <div class="flex items-center justify-between p-3 bg-muted rounded-lg">
                                <div class="flex-1">
                                    <div class="font-medium capitalize">${key === 'completeness' ? 'Completitud' : 
                                        key === 'collaboration' ? 'Colaboración' :
                                        key === 'productivity' ? 'Productividad' :
                                        key === 'impact' ? 'Impacto' :
                                        key === 'innovation' ? 'Innovación' : 'Cronograma'}</div>
                                    <div class="text-sm text-muted-foreground">${criterion.description}</div>
                                </div>
                                <div class="text-right">
                                    <div class="text-lg font-semibold">${criterion.score}/100</div>
                                    <div class="text-sm text-muted-foreground">${criterion.weight}% peso</div>
                                </div>
                                <div class="w-16 ml-4">
                                    <div class="w-full bg-gray-200 rounded-full h-2">
                                        <div class="bg-primary h-2 rounded-full" style="width: ${criterion.score}%"></div>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- Recomendaciones -->
                ${data.score.recommendations && data.score.recommendations.length > 0 ? `
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Recomendaciones</h3>
                        <ul class="space-y-2">
                            ${data.score.recommendations.map(rec => 
                                `<li class="flex items-start"><i class="fas fa-lightbulb text-amber-500 mr-3 mt-1"></i><span>${rec}</span></li>`
                            ).join('')}
                        </ul>
                    </div>
                ` : ''}
                
                <!-- Historial -->
                ${data.history && data.history.length > 1 ? `
                    <div>
                        <h3 class="text-lg font-semibold mb-4">Historial de Evaluaciones</h3>
                        <div class="space-y-2">
                            ${data.history.slice(0, 5).map(entry => `
                                <div class="flex items-center justify-between p-2 border border-border rounded">
                                    <span class="font-medium">${entry.total_score}</span>
                                    <span class="text-sm text-muted-foreground">${new Date(entry.last_calculated_at).toLocaleDateString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function filterScoring() {
    loadScoringOverview();
}

function clearScoringFilters() {
    document.getElementById('scoring-category-filter').value = '';
    document.getElementById('scoring-min-filter').value = '';
    document.getElementById('scoring-max-filter').value = '';
    loadScoringOverview();
}

function refreshScoringDashboard() {
    loadScoringOverview();
}

// ===== FUNCIONES PARA GESTIÓN DE ARCHIVOS =====

// Renderizar dashboard de archivos
async function renderFilesDashboard() {
    try {
        document.getElementById('content').innerHTML = `
            <div class="mb-6">
                <div class="flex justify-between items-center">
                    <div>
                        <h2 class="text-2xl font-bold text-foreground">
                            <i class="fas fa-folder-open mr-2 text-primary"></i>
                            Gestión de Archivos
                        </h2>
                        <p class="text-muted-foreground">Sistema centralizado de archivos para proyectos y productos</p>
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="showUploadModal()" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
                            <i class="fas fa-upload mr-2"></i>
                            Subir Archivo
                        </button>
                        <button onclick="refreshFilesDashboard()" class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90">
                            <i class="fas fa-refresh mr-2"></i>
                            Actualizar
                        </button>
                    </div>
                </div>
            </div>

            <!-- Pestañas -->
            <div class="mb-6">
                <div class="border-b border-border">
                    <nav class="flex space-x-8">
                        <button onclick="setActiveFileTab('overview')" id="tab-overview" class="border-b-2 border-primary text-primary py-2 px-1 text-sm font-medium">
                            Dashboard
                        </button>
                        <button onclick="setActiveFileTab('search')" id="tab-search" class="border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium">
                            Buscar Archivos
                        </button>
                        <button onclick="setActiveFileTab('projects')" id="tab-projects" class="border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium">
                            Por Proyectos
                        </button>
                        <button onclick="setActiveFileTab('products')" id="tab-products" class="border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium">
                            Por Productos
                        </button>
                    </nav>
                </div>
            </div>

            <!-- Contenido de pestañas -->
            <div id="files-tab-content">
                <!-- El contenido se cargará dinámicamente -->
            </div>
        `;
        
        // Cargar pestaña por defecto
        await setActiveFileTab('overview');

    } catch (error) {
        console.error('Error renderizando dashboard de archivos:', error);
        showToast('Error al cargar el dashboard de archivos', 'error');
    }
}

// Cambiar pestaña activa
async function setActiveFileTab(tab) {
    // Actualizar estado visual de las pestañas
    document.querySelectorAll('[id^="tab-"]').forEach(btn => {
        btn.className = "border-b-2 border-transparent text-muted-foreground hover:text-foreground py-2 px-1 text-sm font-medium";
    });
    document.getElementById(`tab-${tab}`).className = "border-b-2 border-primary text-primary py-2 px-1 text-sm font-medium";

    // Cargar contenido de la pestaña
    const contentDiv = document.getElementById('files-tab-content');
    
    switch (tab) {
        case 'overview':
            await loadFilesOverview();
            break;
        case 'search':
            await loadFilesSearch();
            break;
        case 'projects':
            await loadFilesByProjects();
            break;
        case 'products':
            await loadFilesByProducts();
            break;
    }
}

// Cargar vista general de archivos
async function loadFilesOverview() {
    try {
        const response = await axios.get(`${API_BASE}/admin/files/dashboard`);
        const data = response.data.data;

        document.getElementById('files-tab-content').innerHTML = `
            <!-- Estadísticas -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div class="bg-card text-card-foreground p-4 rounded-lg border border-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Total de Archivos</p>
                            <p class="text-2xl font-bold">${data.statistics.total_files}</p>
                        </div>
                        <i class="fas fa-files text-primary text-2xl"></i>
                    </div>
                </div>
                <div class="bg-card text-card-foreground p-4 rounded-lg border border-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Tamaño Total</p>
                            <p class="text-2xl font-bold">${data.statistics.total_size_mb} MB</p>
                        </div>
                        <i class="fas fa-database text-primary text-2xl"></i>
                    </div>
                </div>
                <div class="bg-card text-card-foreground p-4 rounded-lg border border-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Documentos</p>
                            <p class="text-2xl font-bold">${data.files_by_type.find(f => f.file_type === 'document')?.count || 0}</p>
                        </div>
                        <i class="fas fa-file-alt text-primary text-2xl"></i>
                    </div>
                </div>
                <div class="bg-card text-card-foreground p-4 rounded-lg border border-border">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm font-medium text-muted-foreground">Imágenes</p>
                            <p class="text-2xl font-bold">${data.files_by_type.find(f => f.file_type === 'image')?.count || 0}</p>
                        </div>
                        <i class="fas fa-image text-primary text-2xl"></i>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Archivos Recientes -->
                <div class="bg-card text-card-foreground rounded-lg border border-border">
                    <div class="p-4 border-b border-border">
                        <h3 class="font-semibold">Archivos Recientes</h3>
                        <p class="text-sm text-muted-foreground">Últimos 7 días</p>
                    </div>
                    <div class="p-4">
                        ${data.recent_files.length > 0 ? `
                            <div class="space-y-3">
                                ${data.recent_files.slice(0, 5).map(file => `
                                    <div class="flex items-center justify-between p-2 border border-border rounded hover:bg-muted">
                                        <div class="flex items-center space-x-3">
                                            <i class="fas ${getFileIcon(file.file_type)} text-primary"></i>
                                            <div>
                                                <p class="font-medium text-sm">${file.original_name}</p>
                                                <p class="text-xs text-muted-foreground">
                                                    ${file.uploaded_by_name || 'Usuario desconocido'} • ${formatFileSize(file.file_size)}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="flex space-x-2">
                                            <button onclick="viewFileDetails('${file.id}')" class="text-primary hover:text-primary/80">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="downloadFile('${file.id}')" class="text-primary hover:text-primary/80">
                                                <i class="fas fa-download"></i>
                                            </button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="text-muted-foreground text-center py-8">No hay archivos recientes</p>'}
                    </div>
                </div>

                <!-- Archivos Más Grandes -->
                <div class="bg-card text-card-foreground rounded-lg border border-border">
                    <div class="p-4 border-b border-border">
                        <h3 class="font-semibold">Archivos Más Grandes</h3>
                        <p class="text-sm text-muted-foreground">Top 5 por tamaño</p>
                    </div>
                    <div class="p-4">
                        ${data.largest_files.length > 0 ? `
                            <div class="space-y-3">
                                ${data.largest_files.map(file => `
                                    <div class="flex items-center justify-between p-2 border border-border rounded hover:bg-muted">
                                        <div class="flex items-center space-x-3">
                                            <i class="fas ${getFileIcon(file.file_type)} text-primary"></i>
                                            <div>
                                                <p class="font-medium text-sm">${file.original_name}</p>
                                                <p class="text-xs text-muted-foreground">
                                                    ${file.uploaded_by_name || 'Usuario desconocido'}
                                                </p>
                                            </div>
                                        </div>
                                        <div class="text-right">
                                            <p class="font-medium text-sm">${formatFileSize(file.file_size)}</p>
                                            <div class="flex space-x-2">
                                                <button onclick="viewFileDetails('${file.id}')" class="text-primary hover:text-primary/80">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button onclick="downloadFile('${file.id}')" class="text-primary hover:text-primary/80">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        ` : '<p class="text-muted-foreground text-center py-8">No hay archivos grandes</p>'}
                    </div>
                </div>
            </div>

            <!-- Distribución por Tipo -->
            <div class="mt-6 bg-card text-card-foreground rounded-lg border border-border">
                <div class="p-4 border-b border-border">
                    <h3 class="font-semibold">Distribución por Tipo de Archivo</h3>
                </div>
                <div class="p-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                        ${data.files_by_type.map(item => `
                            <div class="text-center p-3 border border-border rounded">
                                <i class="fas ${getFileIcon(item.file_type)} text-2xl text-primary mb-2"></i>
                                <p class="font-medium text-sm capitalize">${item.file_type}</p>
                                <p class="text-lg font-bold">${item.count}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error cargando vista general de archivos:', error);
        document.getElementById('files-tab-content').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
                <p class="text-destructive">Error al cargar las estadísticas de archivos</p>
                <button onclick="loadFilesOverview()" class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    Intentar de nuevo
                </button>
            </div>
        `;
    }
}

// Cargar búsqueda de archivos
async function loadFilesSearch() {
    document.getElementById('files-tab-content').innerHTML = `
        <!-- Filtros de Búsqueda -->
        <div class="bg-card text-card-foreground rounded-lg border border-border mb-6">
            <div class="p-4 border-b border-border">
                <h3 class="font-semibold">Buscar Archivos</h3>
            </div>
            <div class="p-4">
                <div class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-1">Buscar</label>
                        <input type="text" id="search-files-query" placeholder="Nombre del archivo..." 
                               class="w-full p-2 border border-border rounded bg-background">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Tipo</label>
                        <select id="search-files-type" class="w-full p-2 border border-border rounded bg-background">
                            <option value="">Todos</option>
                            <option value="document">Documentos</option>
                            <option value="image">Imágenes</option>
                            <option value="project">Proyectos</option>
                            <option value="product">Productos</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Entidad</label>
                        <select id="search-files-entity" class="w-full p-2 border border-border rounded bg-background">
                            <option value="">Todas</option>
                            <option value="project">Proyectos</option>
                            <option value="product">Productos</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-1">Desde</label>
                        <input type="date" id="search-files-from" 
                               class="w-full p-2 border border-border rounded bg-background">
                    </div>
                    <div class="flex items-end space-x-2">
                        <button onclick="searchFiles()" class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90">
                            <i class="fas fa-search mr-2"></i>
                            Buscar
                        </button>
                        <button onclick="clearSearchFiles()" class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90">
                            <i class="fas fa-times mr-2"></i>
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Resultados de Búsqueda -->
        <div id="search-results">
            <div class="text-center py-12">
                <i class="fas fa-search text-4xl text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground">Usa los filtros de arriba para buscar archivos</p>
            </div>
        </div>
    `;
}

// Buscar archivos con filtros
async function searchFiles(page = 1) {
    try {
        const query = document.getElementById('search-files-query').value;
        const fileType = document.getElementById('search-files-type').value;
        const entityType = document.getElementById('search-files-entity').value;
        const dateFrom = document.getElementById('search-files-from').value;

        const params = new URLSearchParams({
            page: page.toString(),
            limit: '20'
        });

        if (query) params.append('search', query);
        if (fileType) params.append('file_type', fileType);
        if (entityType) params.append('entity_type', entityType);
        if (dateFrom) params.append('date_from', dateFrom);

        const response = await axios.get(`${API_BASE}/admin/files/search?${params}`);
        const data = response.data.data;

        displaySearchResults(data, page);

    } catch (error) {
        console.error('Error buscando archivos:', error);
        showToast('Error al buscar archivos', 'error');
    }
}

// Mostrar resultados de búsqueda
function displaySearchResults(data, currentPage) {
    const { files, pagination } = data;

    document.getElementById('search-results').innerHTML = `
        ${files.length > 0 ? `
            <!-- Información de Resultados -->
            <div class="flex justify-between items-center mb-4">
                <p class="text-sm text-muted-foreground">
                    Mostrando ${files.length} de ${pagination.total_items} archivos
                </p>
                <div class="flex items-center space-x-2">
                    <select id="results-per-page" onchange="changeResultsPerPage()" class="text-sm p-1 border border-border rounded bg-background">
                        <option value="10">10 por página</option>
                        <option value="20" selected>20 por página</option>
                        <option value="50">50 por página</option>
                    </select>
                </div>
            </div>

            <!-- Lista de Archivos -->
            <div class="bg-card text-card-foreground rounded-lg border border-border">
                <div class="overflow-x-auto">
                    <table class="w-full">
                        <thead class="border-b border-border">
                            <tr class="text-left">
                                <th class="p-3 font-medium">Archivo</th>
                                <th class="p-3 font-medium">Tipo</th>
                                <th class="p-3 font-medium">Tamaño</th>
                                <th class="p-3 font-medium">Entidad</th>
                                <th class="p-3 font-medium">Subido por</th>
                                <th class="p-3 font-medium">Fecha</th>
                                <th class="p-3 font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${files.map(file => `
                                <tr class="border-b border-border hover:bg-muted">
                                    <td class="p-3">
                                        <div class="flex items-center space-x-3">
                                            <i class="fas ${getFileIcon(file.file_type)} text-primary"></i>
                                            <div>
                                                <p class="font-medium">${file.original_name}</p>
                                                <p class="text-xs text-muted-foreground">${file.filename}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="p-3">
                                        <span class="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs capitalize">
                                            ${file.file_type}
                                        </span>
                                    </td>
                                    <td class="p-3">${formatFileSize(file.file_size)}</td>
                                    <td class="p-3">
                                        ${file.entity_name ? `
                                            <div>
                                                <span class="text-xs text-muted-foreground capitalize">${file.entity_type}</span>
                                                <p class="text-sm">${file.entity_name}</p>
                                            </div>
                                        ` : '<span class="text-muted-foreground">-</span>'}
                                    </td>
                                    <td class="p-3">${file.uploaded_by_name || 'Desconocido'}</td>
                                    <td class="p-3">
                                        <span class="text-sm">${new Date(file.uploaded_at).toLocaleDateString()}</span>
                                    </td>
                                    <td class="p-3">
                                        <div class="flex space-x-2">
                                            <button onclick="viewFileDetails('${file.id}')" 
                                                    class="text-primary hover:text-primary/80" title="Ver detalles">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            <button onclick="downloadFile('${file.id}')" 
                                                    class="text-primary hover:text-primary/80" title="Descargar">
                                                <i class="fas fa-download"></i>
                                            </button>
                                            <button onclick="editFileMetadata('${file.id}')" 
                                                    class="text-accent hover:text-accent/80" title="Editar">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button onclick="deleteFile('${file.id}')" 
                                                    class="text-destructive hover:text-destructive/80" title="Eliminar">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Paginación -->
            ${pagination.total_pages > 1 ? `
                <div class="flex justify-center mt-6">
                    <div class="flex space-x-2">
                        ${currentPage > 1 ? `
                            <button onclick="searchFiles(${currentPage - 1})" 
                                    class="px-3 py-2 border border-border rounded hover:bg-muted">
                                <i class="fas fa-chevron-left"></i>
                            </button>
                        ` : ''}
                        
                        ${Array.from({length: Math.min(5, pagination.total_pages)}, (_, i) => {
                            const pageNum = Math.max(1, currentPage - 2) + i;
                            if (pageNum <= pagination.total_pages) {
                                return `
                                    <button onclick="searchFiles(${pageNum})" 
                                            class="px-3 py-2 border border-border rounded hover:bg-muted ${pageNum === currentPage ? 'bg-primary text-primary-foreground' : ''}">
                                        ${pageNum}
                                    </button>
                                `;
                            }
                            return '';
                        }).join('')}
                        
                        ${currentPage < pagination.total_pages ? `
                            <button onclick="searchFiles(${currentPage + 1})" 
                                    class="px-3 py-2 border border-border rounded hover:bg-muted">
                                <i class="fas fa-chevron-right"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
        ` : `
            <div class="text-center py-12">
                <i class="fas fa-inbox text-4xl text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground">No se encontraron archivos con los criterios seleccionados</p>
            </div>
        `}
    `;
}

// Limpiar filtros de búsqueda
function clearSearchFiles() {
    document.getElementById('search-files-query').value = '';
    document.getElementById('search-files-type').value = '';
    document.getElementById('search-files-entity').value = '';
    document.getElementById('search-files-from').value = '';
    
    document.getElementById('search-results').innerHTML = `
        <div class="text-center py-12">
            <i class="fas fa-search text-4xl text-muted-foreground mb-4"></i>
            <p class="text-muted-foreground">Usa los filtros de arriba para buscar archivos</p>
        </div>
    `;
}

// Mostrar modal de subida de archivos
function showUploadModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Subir Archivo</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form onsubmit="uploadFile(event)" id="upload-form">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Tipo de Archivo</label>
                            <select id="upload-type" required class="w-full p-2 border border-border rounded bg-background">
                                <option value="">Seleccionar tipo...</option>
                                <option value="document">Documento</option>
                                <option value="image">Imagen</option>
                                <option value="project">Archivo de Proyecto</option>
                                <option value="product">Archivo de Producto</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">ID de Entidad (Opcional)</label>
                            <input type="text" id="upload-entity-id" placeholder="ID del proyecto o producto..."
                                   class="w-full p-2 border border-border rounded bg-background">
                            <p class="text-xs text-muted-foreground mt-1">Deja en blanco para archivos generales</p>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Archivo</label>
                            <input type="file" id="upload-file" required 
                                   class="w-full p-2 border border-border rounded bg-background">
                            <p class="text-xs text-muted-foreground mt-1">Tamaño máximo: 20MB</p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 text-muted-foreground border border-border rounded hover:bg-muted">
                            Cancelar
                        </button>
                        <button type="submit" 
                                class="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
                            <i class="fas fa-upload mr-2"></i>
                            Subir Archivo
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Subir archivo
async function uploadFile(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Subiendo...';
        submitButton.disabled = true;
        
        const fileInput = document.getElementById('upload-file');
        const typeInput = document.getElementById('upload-type');
        const entityIdInput = document.getElementById('upload-entity-id');
        
        if (!fileInput.files[0]) {
            throw new Error('Selecciona un archivo');
        }
        
        const formData = new FormData();
        formData.append('file', fileInput.files[0]);
        formData.append('type', typeInput.value);
        formData.append('entityId', entityIdInput.value || 'general');
        
        const response = await axios.post(`${API_BASE}/admin/upload-file`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        
        if (response.data.success) {
            showToast('Archivo subido exitosamente', 'success');
            form.closest('.fixed').remove();
            
            // Actualizar la vista actual
            const activeTab = document.querySelector('[id^="tab-"].border-primary').id.replace('tab-', '');
            await setActiveFileTab(activeTab);
        } else {
            throw new Error(response.data.error || 'Error al subir archivo');
        }
        
    } catch (error) {
        console.error('Error subiendo archivo:', error);
        showToast(error.message || 'Error al subir archivo', 'error');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

// Funciones auxiliares
function getFileIcon(fileType) {
    const icons = {
        'document': 'fa-file-alt',
        'image': 'fa-image',
        'project': 'fa-project-diagram',
        'product': 'fa-box',
        'logo': 'fa-image',
        'general': 'fa-file'
    };
    return icons[fileType] || 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Placeholder para funciones adicionales que se implementarán
async function loadFilesByProjects() {
    try {
        // Obtener lista de proyectos con archivos
        const projectsResponse = await axios.get(`${API_BASE}/admin/projects?has_files=true&limit=50`);
        
        if (!projectsResponse.data.success) {
            throw new Error('Error al cargar proyectos');
        }
        
        const projects = projectsResponse.data.data.projects || [];
        
        document.getElementById('files-tab-content').innerHTML = `
            <div class="space-y-6">
                ${projects.length > 0 ? `
                    <!-- Resumen -->
                    <div class="bg-card text-card-foreground p-4 rounded-lg border border-border">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold">Archivos por Proyectos</h3>
                                <p class="text-sm text-muted-foreground">${projects.length} proyectos con archivos</p>
                            </div>
                            <i class="fas fa-project-diagram text-2xl text-primary"></i>
                        </div>
                    </div>
                    
                    <!-- Lista de Proyectos -->
                    <div class="space-y-4">
                        ${projects.map(project => `
                            <div class="bg-card text-card-foreground rounded-lg border border-border">
                                <div class="p-4 border-b border-border">
                                    <div class="flex items-start justify-between">
                                        <div class="flex-1">
                                            <h4 class="font-semibold text-lg">${project.title}</h4>
                                            <p class="text-sm text-muted-foreground mt-1">${project.abstract || 'Sin descripción'}</p>
                                            <div class="flex items-center space-x-4 mt-2">
                                                <span class="text-xs text-muted-foreground">
                                                    <i class="fas fa-user mr-1"></i>
                                                    ${project.owner_name}
                                                </span>
                                                <span class="text-xs text-muted-foreground">
                                                    <i class="fas fa-calendar mr-1"></i>
                                                    ${new Date(project.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <button onclick="toggleProjectFiles('${project.id}')" 
                                                class="bg-primary text-primary-foreground px-3 py-1 rounded text-sm hover:opacity-90">
                                            <i class="fas fa-folder mr-1"></i>
                                            Ver Archivos
                                        </button>
                                    </div>
                                </div>
                                <div id="project-files-${project.id}" class="hidden">
                                    <!-- Los archivos se cargarán dinámicamente -->
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <i class="fas fa-folder-open text-4xl text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground text-lg mb-2">No hay proyectos con archivos</p>
                        <p class="text-sm text-muted-foreground">Los archivos aparecerán aquí cuando se suban a proyectos</p>
                    </div>
                `}
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando archivos por proyectos:', error);
        document.getElementById('files-tab-content').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
                <p class="text-destructive">Error al cargar archivos por proyectos</p>
                <button onclick="loadFilesByProjects()" class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    Intentar de nuevo
                </button>
            </div>
        `;
    }
}

async function loadFilesByProducts() {
    try {
        // Obtener lista de productos con archivos
        const productsResponse = await axios.get(`${API_BASE}/admin/products?has_files=true&limit=50`);
        
        if (!productsResponse.data.success) {
            throw new Error('Error al cargar productos');
        }
        
        const products = productsResponse.data.data.products || [];
        
        document.getElementById('files-tab-content').innerHTML = `
            <div class="space-y-6">
                ${products.length > 0 ? `
                    <!-- Resumen -->
                    <div class="bg-card text-card-foreground p-4 rounded-lg border border-border">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="font-semibold">Archivos por Productos</h3>
                                <p class="text-sm text-muted-foreground">${products.length} productos con archivos</p>
                            </div>
                            <i class="fas fa-box text-2xl text-primary"></i>
                        </div>
                    </div>
                    
                    <!-- Galería de Productos -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        ${products.map(product => `
                            <div class="bg-card text-card-foreground rounded-lg border border-border overflow-hidden">
                                <div class="p-4">
                                    <div class="flex items-start justify-between mb-3">
                                        <span class="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                                            ${product.category_name || product.product_type}
                                        </span>
                                        <span class="text-xs text-muted-foreground">
                                            ${product.product_code}
                                        </span>
                                    </div>
                                    
                                    <h4 class="font-semibold mb-2">${product.description}</h4>
                                    
                                    <div class="text-sm text-muted-foreground space-y-1 mb-3">
                                        <div class="flex items-center">
                                            <i class="fas fa-project-diagram mr-2 w-4"></i>
                                            <span>${product.project_title}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="fas fa-user mr-2 w-4"></i>
                                            <span>${product.owner_name}</span>
                                        </div>
                                        <div class="flex items-center">
                                            <i class="fas fa-calendar mr-2 w-4"></i>
                                            <span>${new Date(product.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    
                                    <button onclick="toggleProductFiles('${product.id}')" 
                                            class="w-full bg-primary text-primary-foreground py-2 rounded text-sm hover:opacity-90">
                                        <i class="fas fa-images mr-1"></i>
                                        Ver Archivos
                                    </button>
                                </div>
                                
                                <div id="product-files-${product.id}" class="hidden border-t border-border">
                                    <!-- Los archivos se cargarán dinámicamente -->
                                </div>
                            </div>
                        `).join('')}
                    </div>
                ` : `
                    <div class="text-center py-12">
                        <i class="fas fa-box text-4xl text-muted-foreground mb-4"></i>
                        <p class="text-muted-foreground text-lg mb-2">No hay productos con archivos</p>
                        <p class="text-sm text-muted-foreground">Los archivos aparecerán aquí cuando se suban a productos</p>
                    </div>
                `}
            </div>
        `;
        
    } catch (error) {
        console.error('Error cargando archivos por productos:', error);
        document.getElementById('files-tab-content').innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
                <p class="text-destructive">Error al cargar archivos por productos</p>
                <button onclick="loadFilesByProducts()" class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg">
                    Intentar de nuevo
                </button>
            </div>
        `;
    }
}

// Alternar vista de archivos de proyecto
async function toggleProjectFiles(projectId) {
    const container = document.getElementById(`project-files-${projectId}`);
    
    if (container.classList.contains('hidden')) {
        // Mostrar archivos del proyecto
        container.classList.remove('hidden');
        await loadProjectFiles(projectId);
    } else {
        // Ocultar archivos
        container.classList.add('hidden');
    }
}

// Cargar archivos de un proyecto específico
async function loadProjectFiles(projectId) {
    const container = document.getElementById(`project-files-${projectId}`);
    
    try {
        container.innerHTML = `
            <div class="p-4 text-center">
                <i class="fas fa-spinner fa-spin text-primary text-xl"></i>
                <p class="text-muted-foreground mt-2">Cargando archivos...</p>
            </div>
        `;
        
        const response = await axios.get(`${API_BASE}/admin/files/project/${projectId}`);
        
        if (response.data.success) {
            const files = response.data.data || [];
            
            if (files.length > 0) {
                container.innerHTML = `
                    <div class="p-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            ${files.map(file => `
                                <div class="flex items-center space-x-3 p-3 border border-border rounded hover:bg-muted">
                                    <i class="fas ${getFileIcon(file.file_type)} text-primary text-lg"></i>
                                    <div class="flex-1 min-w-0">
                                        <p class="font-medium text-sm truncate">${file.original_name}</p>
                                        <p class="text-xs text-muted-foreground">${formatFileSize(file.file_size)}</p>
                                    </div>
                                    <div class="flex space-x-1">
                                        <button onclick="viewFileDetails('${file.id}')" 
                                                class="text-primary hover:text-primary/80" title="Ver detalles">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        <button onclick="downloadFile('${file.id}')" 
                                                class="text-primary hover:text-primary/80" title="Descargar">
                                            <i class="fas fa-download"></i>
                                        </button>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="p-4 text-center">
                        <i class="fas fa-folder-open text-2xl text-muted-foreground mb-2"></i>
                        <p class="text-muted-foreground">No hay archivos en este proyecto</p>
                    </div>
                `;
            }
        } else {
            throw new Error(response.data.error || 'Error al cargar archivos');
        }
        
    } catch (error) {
        console.error('Error cargando archivos del proyecto:', error);
        container.innerHTML = `
            <div class="p-4 text-center">
                <i class="fas fa-exclamation-triangle text-xl text-destructive mb-2"></i>
                <p class="text-destructive text-sm">Error al cargar archivos</p>
            </div>
        `;
    }
}

// Alternar vista de archivos de producto
async function toggleProductFiles(productId) {
    const container = document.getElementById(`product-files-${productId}`);
    
    if (container.classList.contains('hidden')) {
        // Mostrar archivos del producto
        container.classList.remove('hidden');
        await loadProductFiles(productId);
    } else {
        // Ocultar archivos
        container.classList.add('hidden');
    }
}

// Cargar archivos de un producto específico
async function loadProductFiles(productId) {
    const container = document.getElementById(`product-files-${productId}`);
    
    try {
        container.innerHTML = `
            <div class="p-4 text-center">
                <i class="fas fa-spinner fa-spin text-primary text-xl"></i>
                <p class="text-muted-foreground mt-2">Cargando archivos...</p>
            </div>
        `;
        
        const response = await axios.get(`${API_BASE}/admin/files/product/${productId}`);
        
        if (response.data.success) {
            const files = response.data.data || [];
            
            if (files.length > 0) {
                // Separar imágenes de otros archivos
                const images = files.filter(f => f.file_type === 'image' || f.mime_type.startsWith('image/'));
                const documents = files.filter(f => f.file_type !== 'image' && !f.mime_type.startsWith('image/'));
                
                container.innerHTML = `
                    <div class="p-4 space-y-4">
                        ${images.length > 0 ? `
                            <div>
                                <h5 class="font-medium text-sm mb-2 text-primary">Imágenes</h5>
                                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    ${images.map(file => `
                                        <div class="relative group">
                                            <div class="aspect-square bg-muted rounded-lg overflow-hidden">
                                                <img src="${file.file_url}" alt="${file.original_name}"
                                                     class="w-full h-full object-cover"
                                                     onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"100\\" height=\\"100\\" viewBox=\\"0 0 24 24\\"><rect fill=\\"%23f3f4f6\\" width=\\"24\\" height=\\"24\\"/><path fill=\\"%239ca3af\\" d=\\"M9 3v2H7a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2V3h2a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h2z\\"/></svg>'">
                                            </div>
                                            <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                                                <button onclick="viewFileDetails('${file.id}')" 
                                                        class="text-white hover:text-primary" title="Ver detalles">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button onclick="downloadFile('${file.id}')" 
                                                        class="text-white hover:text-primary" title="Descargar">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                            </div>
                                            <p class="text-xs text-muted-foreground mt-1 truncate">${file.original_name}</p>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${documents.length > 0 ? `
                            <div>
                                <h5 class="font-medium text-sm mb-2 text-primary">Documentos</h5>
                                <div class="space-y-2">
                                    ${documents.map(file => `
                                        <div class="flex items-center space-x-3 p-2 border border-border rounded hover:bg-muted">
                                            <i class="fas ${getFileIcon(file.file_type)} text-primary"></i>
                                            <div class="flex-1 min-w-0">
                                                <p class="font-medium text-sm truncate">${file.original_name}</p>
                                                <p class="text-xs text-muted-foreground">${formatFileSize(file.file_size)}</p>
                                            </div>
                                            <div class="flex space-x-1">
                                                <button onclick="viewFileDetails('${file.id}')" 
                                                        class="text-primary hover:text-primary/80" title="Ver detalles">
                                                    <i class="fas fa-eye"></i>
                                                </button>
                                                <button onclick="downloadFile('${file.id}')" 
                                                        class="text-primary hover:text-primary/80" title="Descargar">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        ${images.length === 0 && documents.length === 0 ? `
                            <div class="text-center py-4">
                                <i class="fas fa-folder-open text-2xl text-muted-foreground mb-2"></i>
                                <p class="text-muted-foreground">No hay archivos en este producto</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="p-4 text-center">
                        <i class="fas fa-folder-open text-2xl text-muted-foreground mb-2"></i>
                        <p class="text-muted-foreground">No hay archivos en este producto</p>
                    </div>
                `;
            }
        } else {
            throw new Error(response.data.error || 'Error al cargar archivos');
        }
        
    } catch (error) {
        console.error('Error cargando archivos del producto:', error);
        container.innerHTML = `
            <div class="p-4 text-center">
                <i class="fas fa-exclamation-triangle text-xl text-destructive mb-2"></i>
                <p class="text-destructive text-sm">Error al cargar archivos</p>
            </div>
        `;
    }
}

async function viewFileDetails(fileId) {
    try {
        const response = await axios.get(`${API_BASE}/admin/files/details/${fileId}`);
        
        if (response.data.success) {
            const fileInfo = response.data.data.file_info;
            const r2Metadata = response.data.data.r2_metadata;
            
            showFileDetailsModal(fileInfo, r2Metadata);
        } else {
            throw new Error(response.data.error || 'Error al obtener detalles del archivo');
        }
        
    } catch (error) {
        console.error('Error obteniendo detalles del archivo:', error);
        showToast('Error al obtener detalles del archivo', 'error');
    }
}

function showFileDetailsModal(fileInfo, r2Metadata) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-background rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-xl font-semibold flex items-center">
                        <i class="fas ${getFileIcon(fileInfo.file_type)} text-primary mr-2"></i>
                        Detalles del Archivo
                    </h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <!-- Información Básica -->
                    <div class="bg-muted/30 rounded-lg p-4">
                        <h4 class="font-semibold mb-3 text-primary">Información General</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="font-medium text-muted-foreground">Nombre Original:</span>
                                <p class="mt-1">${fileInfo.original_name}</p>
                            </div>
                            <div>
                                <span class="font-medium text-muted-foreground">Nombre del Sistema:</span>
                                <p class="mt-1 font-mono text-xs">${fileInfo.filename}</p>
                            </div>
                            <div>
                                <span class="font-medium text-muted-foreground">Tipo de Archivo:</span>
                                <p class="mt-1">
                                    <span class="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs capitalize">
                                        ${fileInfo.file_type}
                                    </span>
                                </p>
                            </div>
                            <div>
                                <span class="font-medium text-muted-foreground">Tamaño:</span>
                                <p class="mt-1">${formatFileSize(fileInfo.file_size)}</p>
                            </div>
                            <div>
                                <span class="font-medium text-muted-foreground">Tipo MIME:</span>
                                <p class="mt-1 font-mono text-xs">${fileInfo.mime_type}</p>
                            </div>
                            <div>
                                <span class="font-medium text-muted-foreground">URL del Archivo:</span>
                                <p class="mt-1 font-mono text-xs break-all">${fileInfo.file_url}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Información de Entidad -->
                    ${fileInfo.entity_type ? `
                        <div class="bg-muted/30 rounded-lg p-4">
                            <h4 class="font-semibold mb-3 text-primary">Entidad Asociada</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span class="font-medium text-muted-foreground">Tipo:</span>
                                    <p class="mt-1 capitalize">${fileInfo.entity_type}</p>
                                </div>
                                <div>
                                    <span class="font-medium text-muted-foreground">ID:</span>
                                    <p class="mt-1">${fileInfo.entity_id}</p>
                                </div>
                                ${fileInfo.entity_name ? `
                                    <div class="md:col-span-2">
                                        <span class="font-medium text-muted-foreground">Nombre:</span>
                                        <p class="mt-1">${fileInfo.entity_name}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Información de Subida -->
                    <div class="bg-muted/30 rounded-lg p-4">
                        <h4 class="font-semibold mb-3 text-primary">Información de Subida</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div>
                                <span class="font-medium text-muted-foreground">Subido por:</span>
                                <p class="mt-1">${fileInfo.uploaded_by_name || 'Usuario desconocido'}</p>
                                ${fileInfo.uploaded_by_email ? `
                                    <p class="text-xs text-muted-foreground">${fileInfo.uploaded_by_email}</p>
                                ` : ''}
                            </div>
                            <div>
                                <span class="font-medium text-muted-foreground">Fecha de Subida:</span>
                                <p class="mt-1">${new Date(fileInfo.uploaded_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <span class="font-medium text-muted-foreground">Última Actualización:</span>
                                <p class="mt-1">${new Date(fileInfo.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Metadatos de R2 (si disponibles) -->
                    ${r2Metadata ? `
                        <div class="bg-muted/30 rounded-lg p-4">
                            <h4 class="font-semibold mb-3 text-primary">Metadatos de Almacenamiento</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span class="font-medium text-muted-foreground">ETag:</span>
                                    <p class="mt-1 font-mono text-xs">${r2Metadata.etag}</p>
                                </div>
                                <div>
                                    <span class="font-medium text-muted-foreground">Tamaño en R2:</span>
                                    <p class="mt-1">${formatFileSize(r2Metadata.size)}</p>
                                </div>
                                ${r2Metadata.uploaded ? `
                                    <div>
                                        <span class="font-medium text-muted-foreground">Subido a R2:</span>
                                        <p class="mt-1">${new Date(r2Metadata.uploaded).toLocaleString()}</p>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    ` : ''}
                </div>
                
                <!-- Acciones -->
                <div class="flex justify-end space-x-3 mt-6 pt-4 border-t border-border">
                    <button onclick="downloadFile('${fileInfo.id}')" 
                            class="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
                        <i class="fas fa-download mr-2"></i>
                        Descargar
                    </button>
                    <button onclick="editFileMetadata('${fileInfo.id}')" 
                            class="px-4 py-2 bg-accent text-accent-foreground rounded hover:opacity-90">
                        <i class="fas fa-edit mr-2"></i>
                        Editar
                    </button>
                    <button onclick="this.closest('.fixed').remove()" 
                            class="px-4 py-2 bg-muted text-muted-foreground rounded hover:bg-muted/80">
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function downloadFile(fileId) {
    try {
        // Obtener información del archivo para construir la URL
        const response = await axios.get(`${API_BASE}/admin/files/details/${fileId}`);
        
        if (response.data.success) {
            const fileInfo = response.data.data.file_info;
            
            // Crear enlace temporal para descarga
            const downloadLink = document.createElement('a');
            downloadLink.href = fileInfo.file_url;
            downloadLink.download = fileInfo.original_name;
            downloadLink.target = '_blank';
            
            // Disparar descarga
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            
            showToast('Descarga iniciada', 'success');
        } else {
            throw new Error(response.data.error || 'Error al obtener información del archivo');
        }
        
    } catch (error) {
        console.error('Error descargando archivo:', error);
        showToast('Error al descargar archivo', 'error');
    }
}

async function editFileMetadata(fileId) {
    try {
        // Obtener información actual del archivo
        const response = await axios.get(`${API_BASE}/admin/files/details/${fileId}`);
        
        if (response.data.success) {
            const fileInfo = response.data.data.file_info;
            showEditMetadataModal(fileInfo);
        } else {
            throw new Error(response.data.error || 'Error al obtener información del archivo');
        }
        
    } catch (error) {
        console.error('Error cargando archivo para edición:', error);
        showToast('Error al cargar archivo', 'error');
    }
}

function showEditMetadataModal(fileInfo) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    
    modal.innerHTML = `
        <div class="bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Editar Metadatos</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form onsubmit="updateFileMetadata(event, '${fileInfo.id}')" id="edit-metadata-form">
                    <div class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">Nombre Original</label>
                            <input type="text" id="edit-original-name" value="${fileInfo.original_name}"
                                   class="w-full p-2 border border-border rounded bg-background" required>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Tipo de Archivo</label>
                            <select id="edit-file-type" class="w-full p-2 border border-border rounded bg-background" required>
                                <option value="document" ${fileInfo.file_type === 'document' ? 'selected' : ''}>Documento</option>
                                <option value="image" ${fileInfo.file_type === 'image' ? 'selected' : ''}>Imagen</option>
                                <option value="project" ${fileInfo.file_type === 'project' ? 'selected' : ''}>Archivo de Proyecto</option>
                                <option value="product" ${fileInfo.file_type === 'product' ? 'selected' : ''}>Archivo de Producto</option>
                                <option value="logo" ${fileInfo.file_type === 'logo' ? 'selected' : ''}>Logo</option>
                                <option value="general" ${fileInfo.file_type === 'general' ? 'selected' : ''}>General</option>
                            </select>
                        </div>
                        
                        <div class="bg-muted/30 p-3 rounded">
                            <p class="text-sm text-muted-foreground">
                                <i class="fas fa-info-circle mr-1"></i>
                                Archivo: ${fileInfo.filename}
                            </p>
                            <p class="text-sm text-muted-foreground">
                                Tamaño: ${formatFileSize(fileInfo.file_size)}
                            </p>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-3 mt-6">
                        <button type="button" onclick="this.closest('.fixed').remove()" 
                                class="px-4 py-2 text-muted-foreground border border-border rounded hover:bg-muted">
                            Cancelar
                        </button>
                        <button type="submit" 
                                class="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90">
                            <i class="fas fa-save mr-2"></i>
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

async function updateFileMetadata(event, fileId) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    try {
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Guardando...';
        submitButton.disabled = true;
        
        const originalName = document.getElementById('edit-original-name').value.trim();
        const fileType = document.getElementById('edit-file-type').value;
        
        if (!originalName) {
            throw new Error('El nombre original no puede estar vacío');
        }
        
        const response = await axios.put(`${API_BASE}/admin/files/${fileId}/metadata`, {
            original_name: originalName,
            file_type: fileType
        });
        
        if (response.data.success) {
            showToast('Metadatos actualizados exitosamente', 'success');
            form.closest('.fixed').remove();
            
            // Actualizar la vista actual
            const activeTab = document.querySelector('[id^="tab-"].border-primary').id.replace('tab-', '');
            await setActiveFileTab(activeTab);
        } else {
            throw new Error(response.data.error || 'Error al actualizar metadatos');
        }
        
    } catch (error) {
        console.error('Error actualizando metadatos:', error);
        showToast(error.message || 'Error al actualizar metadatos', 'error');
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
    }
}

async function deleteFile(fileId) {
    // Implementar eliminación de archivo
    if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
        try {
            const response = await axios.delete(`${API_BASE}/admin/files/${fileId}`);
            if (response.data.success) {
                showToast('Archivo eliminado exitosamente', 'success');
                // Actualizar la vista actual
                const activeTab = document.querySelector('[id^="tab-"].border-primary').id.replace('tab-', '');
                await setActiveFileTab(activeTab);
            } else {
                throw new Error(response.data.error || 'Error al eliminar archivo');
            }
        } catch (error) {
            console.error('Error eliminando archivo:', error);
            showToast('Error al eliminar archivo', 'error');
        }
    }
}

function refreshFilesDashboard() {
    const activeTab = document.querySelector('[id^="tab-"].border-primary').id.replace('tab-', '');
    setActiveFileTab(activeTab);
}

// ========================================
// 🌓 SISTEMA DE TEMAS CLARO/OSCURO PARA DASHBOARD
// ========================================

// Estado del tema para dashboard
let isDashboardDarkMode = localStorage.getItem('dashboard_theme') === 'dark' || 
    (!localStorage.getItem('dashboard_theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

// Aplicar tema inicial al dashboard
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
}

// Actualizar ícono del botón de tema
function updateDashboardThemeIcon(icon) {
    const themeIcon = document.getElementById('dashboard-theme-icon');
    if (themeIcon) {
        themeIcon.className = icon === 'sun' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Toggle del tema del dashboard
function toggleDashboardTheme() {
    isDashboardDarkMode = !isDashboardDarkMode;
    applyDashboardTheme();
    console.log('🎨 Tema del dashboard cambiado a:', isDashboardDarkMode ? 'oscuro' : 'claro');
    showToast(`Tema cambiado a ${isDashboardDarkMode ? 'oscuro' : 'claro'}`, 'success');
}

// Inicializar tema cuando se renderiza el dashboard
function initDashboardTheme() {
    // Aplicar tema inicial
    applyDashboardTheme();
    
    // Escuchar cambios en las preferencias del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('dashboard_theme')) {
            isDashboardDarkMode = e.matches;
            applyDashboardTheme();
            console.log('🎨 Tema del dashboard actualizado por preferencias del sistema:', isDashboardDarkMode ? 'oscuro' : 'claro');
        }
    });
}

// Exportar funciones para uso global
window.toggleDashboardTheme = toggleDashboardTheme;
window.applyDashboardTheme = applyDashboardTheme;