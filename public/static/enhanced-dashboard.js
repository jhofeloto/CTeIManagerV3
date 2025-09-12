// Mejoras del Dashboard CTeI-Manager - Fase 1
// Funciones mejoradas para integración completa de proyectos y productos

// Cargar proyectos con información completa Fase 1
async function loadMyProjects() {
    try {
        const response = await axios.get(`${API_BASE}/me/projects`);
        if (response.data.success) {
            DashboardState.projects = response.data.data.projects;
            
            // Si estamos en la vista de proyectos, re-renderizar
            if (DashboardState.currentView === 'projects') {
                renderEnhancedProjectsView();
            }
        }
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        showToast('Error cargando proyectos', 'error');
    }
}

// Vista mejorada de proyectos con integración Fase 1
function renderEnhancedProjectsView() {
    const content = document.getElementById('content');
    
    content.innerHTML = `
        <div class="mb-6">
            <div class="flex justify-between items-center">
                <div>
                    <h2 class="text-2xl font-bold">Mis Proyectos</h2>
                    <p class="text-muted-foreground mt-1">
                        Gestiona tus proyectos de investigación y productos CTeI
                    </p>
                </div>
                <button 
                    onclick="showEnhancedProjectModal()"
                    class="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 shadow-lg"
                >
                    <i class="fas fa-plus mr-2"></i>
                    Nuevo Proyecto
                </button>
            </div>
        </div>

        <!-- Filtros y ordenamiento -->
        <div class="mb-6 flex flex-wrap gap-4">
            <select 
                id="statusFilter" 
                onchange="filterProjects()"
                class="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
                <option value="">Todos los estados</option>
                <option value="DRAFT">Borrador</option>
                <option value="ACTIVE">Activo</option>
                <option value="REVIEW">En Revisión</option>
                <option value="COMPLETED">Completado</option>
                <option value="SUSPENDED">Suspendido</option>
            </select>
            
            <select 
                id="visibilityFilter" 
                onchange="filterProjects()"
                class="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary"
            >
                <option value="">Todos</option>
                <option value="public">Públicos</option>
                <option value="private">Privados</option>
            </select>
            
            <input 
                type="text" 
                id="searchProjects"
                placeholder="Buscar proyectos..."
                onkeyup="filterProjects()"
                class="px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary flex-1 min-w-64"
            >
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6" id="projectsGrid">
            ${renderEnhancedProjectsGrid()}
        </div>
    `;
}

// Grid mejorado de proyectos con Fase 1
function renderEnhancedProjectsGrid() {
    if (!DashboardState.projects || DashboardState.projects.length === 0) {
        return `
            <div class="col-span-full card p-12 text-center">
                <div class="max-w-sm mx-auto">
                    <i class="fas fa-project-diagram text-6xl text-muted-foreground mb-6"></i>
                    <h3 class="text-xl font-semibold mb-3">No tienes proyectos aún</h3>
                    <p class="text-muted-foreground mb-6">
                        Crea tu primer proyecto de investigación y comienza a documentar tus productos CTeI
                    </p>
                    <button 
                        onclick="showEnhancedProjectModal()"
                        class="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90"
                    >
                        <i class="fas fa-plus mr-2"></i>
                        Crear mi primer proyecto
                    </button>
                </div>
            </div>
        `;
    }
    
    return DashboardState.projects.map(project => `
        <div class="card hover:shadow-lg transition-shadow duration-200">
            <!-- Header del proyecto -->
            <div class="p-6 pb-0">
                <div class="flex justify-between items-start mb-3">
                    <h4 class="font-bold text-lg leading-tight pr-4">${project.title}</h4>
                    ${getProjectStatusBadge(project.status || 'ACTIVE')}
                </div>
                
                <!-- Metadatos básicos -->
                <div class="flex flex-wrap gap-2 mb-3">
                    <span class="px-2 py-1 text-xs rounded ${project.is_public ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        <i class="fas fa-${project.is_public ? 'globe' : 'lock'} mr-1"></i>
                        ${project.is_public ? 'Público' : 'Privado'}
                    </span>
                    ${project.institution ? `
                        <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                            <i class="fas fa-university mr-1"></i>
                            ${project.institution}
                        </span>
                    ` : ''}
                    ${project.project_code ? `
                        <span class="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded font-mono">
                            ${project.project_code}
                        </span>
                    ` : ''}
                </div>
                
                <!-- Abstract -->
                <p class="text-sm text-muted-foreground mb-4 line-clamp-3">
                    ${project.abstract.substring(0, 150)}${project.abstract.length > 150 ? '...' : ''}
                </p>
            </div>
            
            <!-- Metadatos de fechas y presupuesto -->
            <div class="px-6 pb-4">
                <div class="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                    <div>
                        <i class="fas fa-calendar-alt mr-1"></i>
                        <strong>Creado:</strong> ${formatDate(project.created_at)}
                    </div>
                    ${project.start_date ? `
                        <div>
                            <i class="fas fa-play mr-1"></i>
                            <strong>Inicio:</strong> ${formatDate(project.start_date)}
                        </div>
                    ` : ''}
                    ${project.end_date ? `
                        <div>
                            <i class="fas fa-flag-checkered mr-1"></i>
                            <strong>Fin:</strong> ${formatDate(project.end_date)}
                        </div>
                    ` : ''}
                    ${project.budget ? `
                        <div>
                            <i class="fas fa-dollar-sign mr-1"></i>
                            <strong>Presupuesto:</strong> $${Number(project.budget).toLocaleString()}
                        </div>
                    ` : ''}
                    ${project.funding_source ? `
                        <div class="col-span-2">
                            <i class="fas fa-hand-holding-usd mr-1"></i>
                            <strong>Financiación:</strong> ${project.funding_source}
                        </div>
                    ` : ''}
                </div>
            </div>
            
            <!-- Sección de productos CTeI -->
            <div class="border-t border-border px-6 py-4">
                <div class="flex justify-between items-center mb-3">
                    <h5 class="font-semibold text-sm">
                        <i class="fas fa-lightbulb mr-1"></i>
                        Productos CTeI
                    </h5>
                    <button 
                        onclick="loadProjectProducts(${project.id})"
                        class="text-xs text-primary hover:text-primary-dark"
                        title="Ver productos del proyecto"
                    >
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
                
                <div id="products-preview-${project.id}" class="mb-3">
                    <div class="text-xs text-muted-foreground">
                        <i class="fas fa-spinner fa-spin mr-1"></i>
                        Cargando productos...
                    </div>
                </div>
                
                <button 
                    onclick="showEnhancedProductModal(${project.id})"
                    class="w-full text-xs bg-accent text-accent-foreground py-2 rounded-md hover:bg-accent/80 transition-colors"
                >
                    <i class="fas fa-plus mr-1"></i>
                    Añadir Producto CTeI
                </button>
            </div>
            
            <!-- Acciones del proyecto -->
            <div class="border-t border-border p-6 pt-4">
                <div class="grid grid-cols-2 gap-3">
                    <!-- Fila 1 -->
                    <button 
                        onclick="showEnhancedProjectModal(${JSON.stringify(project).replace(/"/g, '&quot;')})"
                        class="bg-secondary text-secondary-foreground py-2 px-3 rounded text-sm hover:opacity-90 transition-opacity"
                    >
                        <i class="fas fa-edit mr-1"></i>
                        Editar
                    </button>
                    <button 
                        onclick="toggleProjectVisibility(${project.id}, ${!project.is_public})"
                        class="${project.is_public ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'} py-2 px-3 rounded text-sm hover:opacity-90 transition-opacity"
                    >
                        <i class="fas fa-${project.is_public ? 'eye-slash' : 'eye'} mr-1"></i>
                        ${project.is_public ? 'Ocultar' : 'Publicar'}
                    </button>
                    
                    <!-- Fila 2 -->
                    <button 
                        onclick="manageProjectCollaborators(${project.id})"
                        class="bg-blue-500 text-white py-2 px-3 rounded text-sm hover:opacity-90 transition-opacity"
                    >
                        <i class="fas fa-users mr-1"></i>
                        Equipo
                    </button>
                    <button 
                        onclick="viewProjectDetails(${project.id})"
                        class="bg-purple-500 text-white py-2 px-3 rounded text-sm hover:opacity-90 transition-opacity"
                    >
                        <i class="fas fa-eye mr-1"></i>
                        Ver Detalles
                    </button>
                </div>
                
                <!-- Botón de eliminar (solo si es borrador o el usuario es admin) -->
                ${(project.status === 'DRAFT' || DashboardState.user.role === 'ADMIN') ? `
                    <button 
                        onclick="deleteProject(${project.id})"
                        class="w-full mt-3 bg-red-500 text-white py-2 px-3 rounded text-sm hover:bg-red-600 transition-colors"
                    >
                        <i class="fas fa-trash mr-1"></i>
                        Eliminar Proyecto
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Cargar y mostrar preview de productos de un proyecto
async function loadProjectProducts(projectId) {
    const previewContainer = document.getElementById(`products-preview-${projectId}`);
    
    try {
        const response = await axios.get(`${API_BASE}/me/projects/${projectId}/products`);
        
        if (response.data.success) {
            const products = response.data.data.products;
            
            if (products.length === 0) {
                previewContainer.innerHTML = `
                    <div class="text-xs text-muted-foreground">
                        <i class="fas fa-info-circle mr-1"></i>
                        Sin productos registrados
                    </div>
                `;
            } else {
                const productsByType = {};
                products.forEach(product => {
                    const categoryInfo = getProductCategoryInfo(product.product_type);
                    const group = categoryInfo.category_group || 'OTHER';
                    
                    if (!productsByType[group]) {
                        productsByType[group] = 0;
                    }
                    productsByType[group]++;
                });
                
                const badges = Object.entries(productsByType).map(([group, count]) => {
                    const groupColors = {
                        'PUBLICATION': 'bg-blue-100 text-blue-800',
                        'SOFTWARE': 'bg-green-100 text-green-800',
                        'PATENT': 'bg-purple-100 text-purple-800',
                        'DATABASE': 'bg-yellow-100 text-yellow-800',
                        'TRAINING': 'bg-indigo-100 text-indigo-800',
                        'OTHER': 'bg-gray-100 text-gray-800'
                    };
                    
                    return `
                        <span class="inline-flex items-center px-2 py-1 rounded text-xs ${groupColors[group] || groupColors['OTHER']}">
                            ${group}: ${count}
                        </span>
                    `;
                }).join(' ');
                
                // Mostrar algunos productos destacados
                const featuredProducts = products.slice(0, 3).map(product => `
                    <div class="text-xs border-l-2 border-gray-300 pl-2 mb-1">
                        <div class="font-medium">${product.product_code}</div>
                        <div class="text-gray-600">
                            ${getProductCategoryInfo(product.product_type).name}
                            ${product.creator_name ? `• ${product.creator_name}` : ''}
                            ${product.is_public ? '• Público' : '• Privado'}
                        </div>
                    </div>
                `).join('');
                
                previewContainer.innerHTML = `
                    <div class="space-y-2">
                        <div class="text-xs font-medium">
                            <i class="fas fa-cubes mr-1"></i>
                            ${products.length} producto${products.length !== 1 ? 's' : ''}:
                        </div>
                        <div class="flex flex-wrap gap-1 mb-2">
                            ${badges}
                        </div>
                        ${products.length > 0 ? `
                            <div class="border-t border-gray-200 pt-2">
                                <div class="text-xs text-gray-500 mb-1">Productos recientes:</div>
                                ${featuredProducts}
                                ${products.length > 3 ? `
                                    <div class="text-xs text-gray-400 mt-1">
                                        +${products.length - 3} producto${products.length - 3 !== 1 ? 's' : ''} más
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        previewContainer.innerHTML = `
            <div class="text-xs text-red-500">
                <i class="fas fa-exclamation-triangle mr-1"></i>
                Error cargando productos
            </div>
        `;
    }
}

// Filtrar proyectos en tiempo real
function filterProjects() {
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const visibilityFilter = document.getElementById('visibilityFilter')?.value || '';
    const searchTerm = document.getElementById('searchProjects')?.value.toLowerCase() || '';
    
    let filteredProjects = DashboardState.projects;
    
    // Filtrar por estado
    if (statusFilter) {
        filteredProjects = filteredProjects.filter(project => 
            (project.status || 'ACTIVE') === statusFilter
        );
    }
    
    // Filtrar por visibilidad
    if (visibilityFilter) {
        filteredProjects = filteredProjects.filter(project => {
            if (visibilityFilter === 'public') return project.is_public;
            if (visibilityFilter === 'private') return !project.is_public;
            return true;
        });
    }
    
    // Filtrar por búsqueda de texto
    if (searchTerm) {
        filteredProjects = filteredProjects.filter(project =>
            project.title.toLowerCase().includes(searchTerm) ||
            project.abstract.toLowerCase().includes(searchTerm) ||
            (project.keywords && project.keywords.toLowerCase().includes(searchTerm)) ||
            (project.institution && project.institution.toLowerCase().includes(searchTerm))
        );
    }
    
    // Actualizar el estado temporal y re-renderizar
    const originalProjects = DashboardState.projects;
    DashboardState.projects = filteredProjects;
    
    const projectsGrid = document.getElementById('projectsGrid');
    if (projectsGrid) {
        projectsGrid.innerHTML = renderEnhancedProjectsGrid();
        
        // Cargar productos para cada proyecto visible
        filteredProjects.forEach(project => {
            loadProjectProducts(project.id);
        });
    }
    
    // Restaurar el estado original
    DashboardState.projects = originalProjects;
}

// Gestionar colaboradores de un proyecto
async function manageProjectCollaborators(projectId) {
    try {
        const response = await axios.get(`${API_BASE}/me/projects/${projectId}/collaborators`);
        
        if (response.data.success) {
            const collaborators = response.data.data.collaborators;
            showCollaboratorsModal(projectId, collaborators);
        }
    } catch (error) {
        console.error('Error cargando colaboradores:', error);
        showToast('Error cargando colaboradores', 'error');
    }
}

// Modal de gestión de colaboradores
function showCollaboratorsModal(projectId, collaborators) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-auto">
            <div class="p-6 border-b">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-users mr-2"></i>
                        Gestión de Colaboradores
                    </h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-6">
                <!-- Formulario para añadir colaborador -->
                <div class="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 class="text-lg font-semibold mb-4">Añadir Nuevo Colaborador</h3>
                    <form id="addCollaboratorForm" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium mb-2">ID del Usuario</label>
                            <input 
                                type="number" 
                                id="collaborator_user_id" 
                                name="user_id" 
                                required
                                class="w-full p-3 border border-gray-300 rounded-md"
                                placeholder="ID del usuario a añadir"
                            >
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium mb-2">Rol de Colaboración</label>
                            <select 
                                id="collaboration_role" 
                                name="collaboration_role" 
                                required
                                class="w-full p-3 border border-gray-300 rounded-md"
                            >
                                ${generateCollaborationRoleOptions()}
                            </select>
                        </div>
                        
                        <div class="md:col-span-2">
                            <label class="block text-sm font-medium mb-2">Descripción del Rol</label>
                            <input 
                                type="text" 
                                id="role_description" 
                                name="role_description"
                                class="w-full p-3 border border-gray-300 rounded-md"
                                placeholder="Descripción específica del rol en el proyecto"
                            >
                        </div>
                        
                        <div class="md:col-span-2">
                            <h4 class="text-md font-medium mb-3">Permisos del Colaborador</h4>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <label class="flex items-center">
                                    <input type="checkbox" name="can_edit_project" class="mr-2">
                                    <span class="text-sm">Puede editar proyecto</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" name="can_add_products" class="mr-2" checked>
                                    <span class="text-sm">Puede añadir productos</span>
                                </label>
                                <label class="flex items-center">
                                    <input type="checkbox" name="can_manage_team" class="mr-2">
                                    <span class="text-sm">Puede gestionar equipo</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="md:col-span-2">
                            <button 
                                type="submit"
                                class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                            >
                                <i class="fas fa-user-plus mr-2"></i>
                                Añadir Colaborador
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Lista de colaboradores existentes -->
                <div>
                    <h3 class="text-lg font-semibold mb-4">Colaboradores Actuales (${collaborators.length})</h3>
                    
                    ${collaborators.length === 0 ? `
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-users text-4xl mb-3"></i>
                            <p>No hay colaboradores añadidos aún</p>
                        </div>
                    ` : `
                        <div class="space-y-4">
                            ${collaborators.map(collab => `
                                <div class="border border-gray-200 rounded-lg p-4">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <h4 class="font-semibold">${collab.full_name}</h4>
                                            <p class="text-sm text-gray-600">${collab.email}</p>
                                            <div class="mt-2 flex flex-wrap gap-2">
                                                <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                                    ${collab.collaboration_role}
                                                </span>
                                                <span class="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                                    ${collab.user_role}
                                                </span>
                                            </div>
                                            ${collab.role_description ? `
                                                <p class="mt-2 text-sm text-gray-600">
                                                    <i class="fas fa-info-circle mr-1"></i>
                                                    ${collab.role_description}
                                                </p>
                                            ` : ''}
                                            
                                            <!-- Permisos -->
                                            <div class="mt-3 flex flex-wrap gap-2 text-xs">
                                                ${collab.can_edit_project ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded">✓ Editar proyecto</span>' : ''}
                                                ${collab.can_add_products ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded">✓ Añadir productos</span>' : ''}
                                                ${collab.can_manage_team ? '<span class="bg-green-100 text-green-800 px-2 py-1 rounded">✓ Gestionar equipo</span>' : ''}
                                            </div>
                                        </div>
                                        
                                        <div class="ml-4">
                                            <button 
                                                onclick="removeCollaborator(${projectId}, ${collab.user_id})"
                                                class="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                                                title="Remover colaborador"
                                            >
                                                <i class="fas fa-user-minus"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Manejar envío del formulario
    document.getElementById('addCollaboratorForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const collaboratorData = {
            user_id: parseInt(formData.get('user_id')),
            collaboration_role: formData.get('collaboration_role'),
            role_description: formData.get('role_description') || null,
            can_edit_project: formData.has('can_edit_project'),
            can_add_products: formData.has('can_add_products'),
            can_manage_team: formData.has('can_manage_team')
        };
        
        try {
            const response = await axios.post(`${API_BASE}/me/projects/${projectId}/collaborators`, collaboratorData);
            
            if (response.data.success) {
                showToast('Colaborador añadido exitosamente');
                modal.remove();
                manageProjectCollaborators(projectId); // Reabrir con datos actualizados
            } else {
                showToast(response.data.error || 'Error añadiendo colaborador', 'error');
            }
        } catch (error) {
            console.error('Error añadiendo colaborador:', error);
            showToast('Error al añadir colaborador', 'error');
        }
    });
}

// Ver detalles completos del proyecto
async function viewProjectDetails(projectId) {
    try {
        // En un entorno real, esto sería una nueva página o modal con información completa
        // Por ahora, redirigimos a la página pública del proyecto si es público
        const project = DashboardState.projects.find(p => p.id === projectId);
        
        if (project && project.is_public) {
            window.open(`/project/${projectId}`, '_blank');
        } else {
            showToast('Funcionalidad de vista detallada en desarrollo', 'info');
        }
    } catch (error) {
        console.error('Error viendo detalles:', error);
    }
}

// Eliminar proyecto
async function deleteProject(projectId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este proyecto? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const response = await axios.delete(`${API_BASE}/me/projects/${projectId}`);
        
        if (response.data.success) {
            showToast('Proyecto eliminado exitosamente');
            loadMyProjects(); // Recargar lista
        } else {
            showToast(response.data.error || 'Error eliminando proyecto', 'error');
        }
    } catch (error) {
        console.error('Error eliminando proyecto:', error);
        showToast('Error al eliminar el proyecto', 'error');
    }
}

// Reemplazar la función original de renderProjectsView
function renderProjectsView() {
    // Cargar datos auxiliares si no están cargados
    if (Phase1Cache.productCategories.length === 0) {
        loadAuxiliaryData();
    }
    
    // Usar la versión mejorada
    renderEnhancedProjectsView();
    
    // Cargar productos para cada proyecto
    setTimeout(() => {
        DashboardState.projects.forEach(project => {
            loadProjectProducts(project.id);
        });
    }, 100);
}

// Actualizar función de toggle visibility para usar toasts
async function toggleProjectVisibility(projectId, makePublic) {
    try {
        const response = await axios.post(`${API_BASE}/me/projects/${projectId}/publish`, {
            is_public: makePublic
        });
        
        if (response.data.success) {
            showToast(response.data.message);
            loadMyProjects(); // Recargar datos
        } else {
            showToast(response.data.error || 'Error cambiando visibilidad', 'error');
        }
    } catch (error) {
        console.error('Error cambiando visibilidad:', error);
        showToast('Error al cambiar la visibilidad', 'error');
    }
}

// Remover colaborador de un proyecto
async function removeCollaborator(projectId, userId) {
    if (!confirm('¿Estás seguro de que deseas remover este colaborador del proyecto?')) {
        return;
    }
    
    try {
        const response = await axios.delete(`${API_BASE}/me/projects/${projectId}/collaborators/${userId}`);
        
        if (response.data.success) {
            showToast('Colaborador removido exitosamente');
            manageProjectCollaborators(projectId); // Reabrir modal con datos actualizados
        } else {
            showToast(response.data.error || 'Error removiendo colaborador', 'error');
        }
    } catch (error) {
        console.error('Error removiendo colaborador:', error);
        showToast('Error al remover colaborador', 'error');
    }
}

// Función para usar los modales mejorados de phase1-enhancements.js
function showNewProjectModal() {
    showEnhancedProjectModal();
}

function editProject(projectId) {
    const project = DashboardState.projects.find(p => p.id === projectId);
    if (project) {
        showEnhancedProjectModal(project);
    }
}