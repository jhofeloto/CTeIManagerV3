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
        case 'profile':
            renderProfileView();
            break;
        case 'admin-users':
            renderAdminUsersView();
            break;
        case 'admin-projects':
            renderAdminProjectsView();
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
    // Implementar vista de gestión de usuarios para admin
    document.getElementById('content').innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold">Gestión de Usuarios</h2>
        </div>
        <div class="card p-6">
            <p class="text-muted-foreground">Vista de administración de usuarios en desarrollo...</p>
        </div>
    `;
}

function renderAdminProjectsView() {
    // Implementar vista de todos los proyectos para admin
    document.getElementById('content').innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-bold">Todos los Proyectos</h2>
        </div>
        <div class="card p-6">
            <p class="text-muted-foreground">Vista de administración de proyectos en desarrollo...</p>
        </div>
    `;
}