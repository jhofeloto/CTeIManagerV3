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
                                onclick="showView('timeline')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-clock mr-3"></i>
                                Timeline
                            </button>
                        </li>
                        <li>
                            <button 
                                onclick="showView('monitoring')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-chart-bar mr-3"></i>
                                Monitoreo
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
        case 'timeline':
            if (typeof renderTimelineView === 'function') renderTimelineView();
            break;
        case 'monitoring':
            if (typeof renderMonitoringView === 'function') renderMonitoringView();
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
            // Usar logo personalizado desde admin
            const logoUrl = response.data.data.logo_url;
            
            logoContainer.innerHTML = `
                <img 
                    src="${logoUrl}" 
                    alt="${siteName} Logo" 
                    class="h-8 w-auto mr-3 inline"
                    style="max-height: 32px; object-fit: contain;"
                >
                <span>${siteName}</span>
            `;
            
            console.log('✅ Logo personalizado cargado en dashboard:', logoUrl);
        } else {
            // Usar logo por defecto de CODECTI CHOCÓ
            logoContainer.innerHTML = `
                <img 
                    src="/static/codecti-logo.png" 
                    alt="${siteName} Logo" 
                    class="h-8 w-auto mr-3 inline"
                    style="max-height: 32px; object-fit: contain;"
                >
                <span>${siteName}</span>
            `;
            
            console.log('✅ Logo por defecto de CODECTI CHOCÓ cargado en dashboard');
        }
    } catch (error) {
        // Fallback si hay error de red
        const logoContainer = document.getElementById('dashboard-site-logo');
        logoContainer.innerHTML = `
            <img 
                src="/static/codecti-logo.png" 
                alt="CODECTI CHOCÓ Logo" 
                class="h-8 w-auto mr-3 inline"
                style="max-height: 32px; object-fit: contain;"
            >
            <span>CODECTI CHOCÓ</span>
        `;
        console.warn('⚠️ Error cargando configuración del dashboard, usando logo fallback:', error);
    }
}