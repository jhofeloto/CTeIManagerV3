// JavaScript para Dashboard CTeI-Manager

// Estado global del dashboard
const DashboardState = {
    user: null,
    token: localStorage.getItem('ctei_token') || null,
    currentView: 'dashboard',
    projects: [],
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
    if (!DashboardState.token) {
        window.location.href = '/';
        return;
    }
    
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
    try {
        // Obtener perfil del usuario
        const profileResponse = await axios.get(`${API_BASE}/me/profile`);
        
        if (profileResponse.data.success) {
            DashboardState.user = profileResponse.data.data;
            renderDashboard();
            await loadDashboardData();
        } else {
            throw new Error('No se pudo cargar el perfil');
        }
    } catch (error) {
        console.error('Error inicializando dashboard:', error);
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
                        <h1 class="text-xl font-bold text-primary">
                            <i class="fas fa-flask mr-2"></i>
                            CTeI-Manager
                        </h1>
                        <span class="ml-4 text-muted-foreground">Dashboard</span>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-sm text-muted-foreground">
                            ${DashboardState.user.full_name} (${DashboardState.user.role})
                        </span>
                        <a href="/" class="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium">
                            Portal Público
                        </a>
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
                                onclick="showView('admin-categories')" 
                                class="nav-item w-full flex items-center px-3 py-2 text-left rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                            >
                                <i class="fas fa-tags mr-3"></i>
                                Categorías de Productos
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
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        // Cargar estadísticas
        const statsEndpoint = DashboardState.user.role === 'ADMIN' 
            ? `${API_BASE}/admin/dashboard/stats`
            : `${API_BASE}/me/dashboard/stats`;
            
        const statsResponse = await axios.get(statsEndpoint);
        
        if (statsResponse.data.success) {
            DashboardState.stats = statsResponse.data.data;
        }
        
        // Cargar proyectos
        const projectsResponse = await axios.get(`${API_BASE}/me/projects`);
        if (projectsResponse.data.success) {
            DashboardState.projects = projectsResponse.data.data.projects;
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
        case 'admin-categories':
            renderAdminCategoriesView();
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
        <div class="mb-6">
            <h2 class="text-2xl font-bold mb-2">
                ${isAdmin ? 'Panel de Administración' : 'Mi Dashboard'}
            </h2>
            <p class="text-muted-foreground">
                ${isAdmin ? 'Vista general del sistema CTeI-Manager' : 'Resumen de tus proyectos y actividad'}
            </p>
        </div>

        <!-- Estadísticas -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            ${isAdmin ? `
            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-primary/10 rounded-lg">
                        <i class="fas fa-users text-primary text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${stats.users?.total_users || 0}</p>
                        <p class="text-muted-foreground">Usuarios Total</p>
                    </div>
                </div>
            </div>
            ` : ''}
            
            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-chart-2/10 rounded-lg">
                        <i class="fas fa-project-diagram text-chart-2 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${isAdmin ? (stats.projects?.total_projects || 0) : (stats.projects?.total || 0)}</p>
                        <p class="text-muted-foreground">${isAdmin ? 'Proyectos Totales' : 'Mis Proyectos'}</p>
                    </div>
                </div>
            </div>

            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-chart-3/10 rounded-lg">
                        <i class="fas fa-cubes text-chart-3 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${isAdmin ? (stats.products?.total_products || 0) : (stats.products?.total || 0)}</p>
                        <p class="text-muted-foreground">${isAdmin ? 'Productos Totales' : 'Mis Productos'}</p>
                    </div>
                </div>
            </div>

            <div class="card p-6">
                <div class="flex items-center">
                    <div class="p-3 bg-chart-4/10 rounded-lg">
                        <i class="fas fa-eye text-chart-4 text-xl"></i>
                    </div>
                    <div class="ml-4">
                        <p class="text-2xl font-bold">${isAdmin ? (stats.projects?.public_projects || 0) : (stats.projects?.public || 0)}</p>
                        <p class="text-muted-foreground">Proyectos Públicos</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Proyectos recientes -->
        <div class="card p-6">
            <h3 class="text-lg font-semibold mb-4">
                ${isAdmin ? 'Actividad Reciente del Sistema' : 'Mis Proyectos Recientes'}
            </h3>
            <div id="recentProjects">
                ${renderRecentProjectsList()}
            </div>
        </div>
    `;
}

function renderRecentProjectsList() {
    const projects = DashboardState.projects.slice(0, 5);
    
    if (projects.length === 0) {
        return '<p class="text-muted-foreground">No hay proyectos para mostrar</p>';
    }
    
    return projects.map(project => `
        <div class="flex items-center justify-between py-3 border-b border-border last:border-b-0">
            <div class="flex-1">
                <h4 class="font-medium">${project.title}</h4>
                <p class="text-sm text-muted-foreground mt-1">${project.abstract.substring(0, 100)}...</p>
                <div class="flex items-center mt-2 text-xs text-muted-foreground">
                    <span class="mr-4">
                        <i class="fas fa-calendar mr-1"></i>
                        ${formatDate(project.created_at)}
                    </span>
                    <span class="px-2 py-1 rounded ${project.is_public ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">
                        ${project.is_public ? 'Público' : 'Privado'}
                    </span>
                </div>
            </div>
            <button 
                onclick="viewProject(${project.id})"
                class="ml-4 text-primary hover:text-primary/80"
            >
                <i class="fas fa-arrow-right"></i>
            </button>
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
            <div class="col-span-full card p-8 text-center">
                <i class="fas fa-project-diagram text-4xl text-muted-foreground mb-4"></i>
                <p class="text-muted-foreground">No tienes proyectos aún</p>
                <button 
                    onclick="showNewProjectModal()"
                    class="mt-4 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
                >
                    Crear mi primer proyecto
                </button>
            </div>
        `;
    }
    
    return DashboardState.projects.map(project => `
        <div class="card p-6">
            <div class="mb-4">
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-semibold">${project.title}</h4>
                    <span class="px-2 py-1 text-xs rounded ${project.is_public ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}">
                        ${project.is_public ? 'Público' : 'Privado'}
                    </span>
                </div>
                <p class="text-sm text-muted-foreground mb-3">
                    ${project.abstract.substring(0, 120)}${project.abstract.length > 120 ? '...' : ''}
                </p>
                <div class="text-xs text-muted-foreground mb-4">
                    <i class="fas fa-calendar mr-1"></i>
                    ${formatDate(project.created_at)}
                </div>
            </div>
            
            <div class="flex space-x-2">
                <button 
                    onclick="editProject(${project.id})"
                    class="flex-1 bg-secondary text-secondary-foreground py-2 px-3 rounded text-sm hover:opacity-90"
                >
                    <i class="fas fa-edit mr-1"></i>
                    Editar
                </button>
                <button 
                    onclick="toggleProjectVisibility(${project.id}, ${!project.is_public})"
                    class="flex-1 ${project.is_public ? 'bg-muted text-muted-foreground' : 'bg-primary text-primary-foreground'} py-2 px-3 rounded text-sm hover:opacity-90"
                >
                    <i class="fas fa-${project.is_public ? 'eye-slash' : 'eye'} mr-1"></i>
                    ${project.is_public ? 'Ocultar' : 'Publicar'}
                </button>
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
    try {
        const [projectsResponse, categoriesResponse] = await Promise.all([
            axios.get(`${API_BASE}/me/projects`),
            axios.get(`${API_BASE}/public/product-categories`)
        ]);
        
        if (projectsResponse.data.success && categoriesResponse.data.success) {
            // Extraer todos los productos de todos los proyectos
            let allProducts = [];
            const projects = projectsResponse.data.data.projects;
            
            // Cargar productos de cada proyecto
            for (const project of projects) {
                try {
                    const productsResponse = await axios.get(`${API_BASE}/me/projects/${project.id}/products`);
                    if (productsResponse.data.success) {
                        const products = productsResponse.data.data.products.map(product => ({
                            ...product,
                            project_title: project.title,
                            project_status: project.status
                        }));
                        allProducts = allProducts.concat(products);
                    }
                } catch (error) {
                    console.error(`Error cargando productos del proyecto ${project.id}:`, error);
                }
            }
            
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
        console.error('Error cargando mis productos:', error);
        document.getElementById('myProductsList').innerHTML = `
            <div class="text-center py-8 text-red-500">
                <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
                <p>Error cargando productos</p>
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
            <div class="text-center py-12 text-muted-foreground">
                <i class="fas fa-cubes text-4xl mb-4"></i>
                <h3 class="text-lg font-medium mb-2">No tienes productos aún</h3>
                <p class="mb-4">Comienza creando tu primer producto de investigación</p>
                <button 
                    onclick="showCreateProductModal()"
                    class="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:opacity-90"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Crear Primer Producto
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => `
        <div id="product-card-${product.id}" class="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
            <div class="flex justify-between items-start mb-4">
                <div class="flex-1">
                    <div class="flex items-center gap-3 mb-2">
                        <h3 class="text-lg font-semibold text-foreground">${product.product_code}</h3>
                        <span class="px-2 py-1 text-xs rounded-full ${product.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            <i class="fas fa-${product.is_public ? 'eye' : 'eye-slash'} mr-1"></i>
                            ${product.is_public ? 'Público' : 'Privado'}
                        </span>
                        ${product.category_name ? `
                            <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                ${product.category_name}
                            </span>
                        ` : ''}
                    </div>
                    
                    <p class="text-muted-foreground mb-3 line-clamp-2">${product.description}</p>
                    
                    <div class="flex items-center text-sm text-muted-foreground mb-3">
                        <i class="fas fa-project-diagram mr-2"></i>
                        <span class="mr-4">${product.project_title}</span>
                        <i class="fas fa-user mr-2"></i>
                        <span class="mr-4">Creado por: ${product.creator_name || 'N/A'}</span>
                        <i class="fas fa-calendar mr-2"></i>
                        <span>${new Date(product.created_at).toLocaleDateString()}</span>
                    </div>
                    
                    ${product.doi || product.url || product.journal ? `
                        <div class="flex items-center text-sm text-muted-foreground">
                            ${product.doi ? `<span class="mr-4"><i class="fas fa-link mr-1"></i>DOI: ${product.doi}</span>` : ''}
                            ${product.journal ? `<span class="mr-4"><i class="fas fa-book mr-1"></i>${product.journal}</span>` : ''}
                            ${product.impact_factor ? `<span class="mr-4"><i class="fas fa-chart-line mr-1"></i>IF: ${product.impact_factor}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="flex items-center space-x-2">
                    <button 
                        onclick="editProduct(${product.project_id}, ${product.id})"
                        class="bg-secondary text-secondary-foreground px-3 py-2 rounded text-sm hover:opacity-90"
                        title="Editar producto"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                    
                    <button 
                        id="visibility-btn-${product.id}"
                        onclick="toggleProductVisibility(${product.project_id}, ${product.id}, ${product.is_public ? false : true})"
                        class="${product.is_public ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'} px-3 py-2 rounded text-sm hover:opacity-90"
                        title="${product.is_public ? 'Ocultar producto' : 'Publicar producto'}"
                    >
                        <i class="fas fa-${product.is_public ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    
                    <button 
                        onclick="manageProductAuthors(${product.project_id}, ${product.id})"
                        class="bg-purple-500 text-white px-3 py-2 rounded text-sm hover:opacity-90"
                        title="Gestionar autores"
                    >
                        <i class="fas fa-users"></i>
                    </button>
                    
                    <button 
                        onclick="deleteProduct(${product.project_id}, ${product.id})"
                        class="bg-red-500 text-white px-3 py-2 rounded text-sm hover:opacity-90"
                        title="Eliminar producto"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
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
        const response = await axios.post(`${API_BASE}/me/projects/${projectId}/products/${productId}/publish`, {
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
        const response = await axios.delete(`${API_BASE}/me/projects/${projectId}/products/${productId}`);
        
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
        <div class="mb-6">
            <h2 class="text-2xl font-bold">Mi Perfil</h2>
        </div>

        <div class="max-w-2xl">
            <div class="card p-6">
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Nombre Completo</label>
                        <input 
                            type="text" 
                            id="profileName"
                            value="${user.full_name}" 
                            class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input 
                            type="email" 
                            value="${user.email}" 
                            disabled
                            class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                        >
                        <p class="text-xs text-muted-foreground mt-1">El email no se puede modificar</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Rol</label>
                        <input 
                            type="text" 
                            value="${user.role}" 
                            disabled
                            class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Miembro desde</label>
                        <input 
                            type="text" 
                            value="${formatDate(user.created_at)}" 
                            disabled
                            class="w-full px-3 py-2 border border-border rounded-lg bg-muted text-muted-foreground"
                        >
                    </div>
                    
                    <div class="pt-4">
                        <button 
                            onclick="updateProfile()"
                            class="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90"
                        >
                            <i class="fas fa-save mr-2"></i>
                            Guardar Cambios
                        </button>
                    </div>
                </div>
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
        const response = await axios.post(`${API_BASE}/me/projects`, projectData);
        
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
        const response = await axios.post(`${API_BASE}/me/projects/${projectId}/publish`, {
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
    // Implementar edición del proyecto
    console.log('Editar proyecto:', projectId);
}

async function updateProfile() {
    const newName = document.getElementById('profileName').value;
    
    if (!newName.trim()) {
        showToast('El nombre no puede estar vacío', 'error');
        return;
    }
    
    try {
        // Por ahora solo mostrar mensaje, ya que no implementamos actualización de perfil en el backend
        showToast('Función de actualización de perfil pendiente de implementar');
    } catch (error) {
        showToast('Error al actualizar perfil', 'error');
    }
}

function renderAdminUsersView() {
    document.getElementById('content').innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">Gestión de Usuarios</h2>
                    <p class="text-muted-foreground">Administrar usuarios del sistema CTeI-Manager (v2.0)</p>
                </div>
            </div>
        </div>
        
        <!-- Filtros y búsqueda -->
        <div class="card mb-6">
            <div class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Búsqueda -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Buscar usuarios</label>
                        <div class="relative">
                            <input 
                                type="text" 
                                id="userSearch"
                                placeholder="Nombre o email..."
                                class="w-full pl-10 pr-4 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                onkeypress="if(event.key === 'Enter') loadAdminUsers()"
                            >
                            <i class="fas fa-search absolute left-3 top-3 text-muted-foreground"></i>
                        </div>
                    </div>
                    
                    <!-- Filtro por rol -->
                    <div>
                        <label class="block text-sm font-medium mb-2">Filtrar por rol</label>
                        <select 
                            id="roleFilter"
                            class="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
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
                            class="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex-1"
                        >
                            <i class="fas fa-search mr-2"></i>
                            Buscar
                        </button>
                        <button 
                            onclick="clearUserFilters()"
                            class="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            <i class="fas fa-times mr-2"></i>
                            Limpiar
                        </button>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Lista de usuarios -->
        <div class="card">
            <div class="p-6">
                <div id="usersContainer">
                    <div class="flex justify-center py-8">
                        <div class="spinner"></div>
                    </div>
                </div>
                
                <!-- Paginación -->
                <div id="usersPagination" class="mt-6"></div>
            </div>
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
            <table class="w-full">
                <thead class="border-b border-border">
                    <tr class="text-left">
                        <th class="pb-3 font-medium">Usuario</th>
                        <th class="pb-3 font-medium">Rol</th>
                        <th class="pb-3 font-medium">Registro</th>
                        <th class="pb-3 font-medium text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-border">
    `;
    
    users.forEach(user => {
        const roleConfig = {
            'ADMIN': { color: 'bg-destructive text-destructive-foreground', icon: 'fas fa-crown', label: 'Administrador' },
            'INVESTIGATOR': { color: 'bg-primary text-primary-foreground', icon: 'fas fa-microscope', label: 'Investigador' },
            'COMMUNITY': { color: 'bg-secondary text-secondary-foreground', icon: 'fas fa-users', label: 'Comunidad' }
        };
        
        const role = roleConfig[user.role] || roleConfig.COMMUNITY;
        const isCurrentUser = user.id === currentUser?.userId;
        
        html += `
            <tr class="hover:bg-muted/50">
                <td class="py-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <i class="${role.icon} text-primary"></i>
                        </div>
                        <div>
                            <div class="font-medium">${user.full_name}</div>
                            <div class="text-sm text-muted-foreground">${user.email}</div>
                            ${isCurrentUser ? '<span class="text-xs text-primary font-medium">(Tú)</span>' : ''}
                        </div>
                    </div>
                </td>
                <td class="py-4">
                    <span class="px-2 py-1 rounded text-xs font-medium ${role.color}">
                        <i class="${role.icon} mr-1"></i>
                        ${role.label}
                    </span>
                </td>
                <td class="py-4 text-sm text-muted-foreground">
                    ${formatDate(user.created_at)}
                </td>
                <td class="py-4">
                    <div class="flex justify-end space-x-2">
                        <button 
                            onclick="editUser(${user.id})"
                            class="bg-accent text-accent-foreground px-3 py-1 rounded text-sm hover:opacity-90"
                            title="Editar usuario"
                        >
                            <i class="fas fa-edit"></i>
                        </button>
                        ${!isCurrentUser ? `
                            <button 
                                onclick="deleteUser(${user.id}, '${user.full_name}', '${user.email}')"
                                class="bg-destructive text-destructive-foreground px-3 py-1 rounded text-sm hover:opacity-90"
                                title="Eliminar usuario"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
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
            
            // Actualizar estado de paginación
            DashboardState.projectsState.total = pagination.total;
            DashboardState.projectsState.totalPages = pagination.totalPages;
            
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
                            onclick="toggleProjectVisibility(${project.id}, ${!isPublic})"
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

async function toggleProjectVisibility(projectId, makePublic) {
    try {
        const response = await axios.post(`${API_BASE}/admin/projects/${projectId}/publish`, {
            is_public: makePublic
        });
        
        if (response.data.success) {
            showToast(response.data.message || `Proyecto ${makePublic ? 'publicado' : 'ocultado'} exitosamente`, 'success');
            loadAdminProjects(DashboardState.projectsState.currentPage); // Recargar la página actual
        } else {
            throw new Error(response.data.error || 'Error al cambiar visibilidad del proyecto');
        }
        
    } catch (error) {
        console.error('Error cambiando visibilidad:', error);
        showToast(error.response?.data?.error || 'Error al cambiar visibilidad del proyecto', 'error');
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