// Mejoras de Fase 1 para CTeI-Manager
// Funciones adicionales para soportar las nuevas características

// Cache global para datos auxiliares
const Phase1Cache = {
    productCategories: [],
    institutions: [],
    lastUpdated: null
};

// Cargar datos auxiliares (categorías e instituciones)
async function loadAuxiliaryData() {
    try {
        const [categoriesResponse, institutionsResponse] = await Promise.all([
            axios.get('/public/product-categories'),
            axios.get('/public/institutions')
        ]);
        
        if (categoriesResponse.data.success) {
            Phase1Cache.productCategories = categoriesResponse.data.data.categories;
        }
        
        if (institutionsResponse.data.success) {
            Phase1Cache.institutions = institutionsResponse.data.data.institutions;
        }
        
        Phase1Cache.lastUpdated = new Date();
        
        return true;
    } catch (error) {
        console.error('Error cargando datos auxiliares:', error);
        return false;
    }
}

// Obtener categorías de productos agrupadas
function getProductCategoriesByGroup() {
    const groups = {};
    
    Phase1Cache.productCategories.forEach(category => {
        if (!groups[category.category_group]) {
            groups[category.category_group] = [];
        }
        groups[category.category_group].push(category);
    });
    
    // Ordenar por impact_weight
    Object.keys(groups).forEach(group => {
        groups[group].sort((a, b) => b.impact_weight - a.impact_weight);
    });
    
    return groups;
}

// Generar opciones de categorías para select
function generateCategoryOptions() {
    const groups = getProductCategoriesByGroup();
    let options = '<option value="">Seleccione una categoría</option>';
    
    Object.keys(groups).forEach(group => {
        options += `<optgroup label="${group}">`;
        groups[group].forEach(category => {
            options += `<option value="${category.code}">${category.name}</option>`;
        });
        options += '</optgroup>';
    });
    
    return options;
}

// Generar opciones de instituciones para select
function generateInstitutionOptions() {
    let options = '<option value="">Seleccione una institución</option>';
    
    Phase1Cache.institutions.forEach(institution => {
        const displayName = institution.short_name 
            ? `${institution.name} (${institution.short_name})` 
            : institution.name;
        options += `<option value="${institution.name}">${displayName}</option>`;
    });
    
    return options;
}

// Generar opciones de estado de proyecto
function generateProjectStatusOptions(currentStatus = '') {
    const statuses = [
        { value: 'DRAFT', label: 'Borrador', icon: 'fas fa-edit' },
        { value: 'ACTIVE', label: 'Activo', icon: 'fas fa-play' },
        { value: 'REVIEW', label: 'En Revisión', icon: 'fas fa-search' },
        { value: 'COMPLETED', label: 'Completado', icon: 'fas fa-check' },
        { value: 'SUSPENDED', label: 'Suspendido', icon: 'fas fa-pause' }
    ];
    
    let options = '';
    statuses.forEach(status => {
        const selected = status.value === currentStatus ? 'selected' : '';
        options += `<option value="${status.value}" ${selected}>
            ${status.label}
        </option>`;
    });
    
    return options;
}

// Generar opciones de roles de colaboración
function generateCollaborationRoleOptions(currentRole = '') {
    const roles = [
        { value: 'CO_INVESTIGATOR', label: 'Co-investigador' },
        { value: 'RESEARCH_ASSISTANT', label: 'Asistente de Investigación' },
        { value: 'ADVISOR', label: 'Asesor' },
        { value: 'EXTERNAL_COLLABORATOR', label: 'Colaborador Externo' }
    ];
    
    let options = '<option value="">Seleccione un rol</option>';
    roles.forEach(role => {
        const selected = role.value === currentRole ? 'selected' : '';
        options += `<option value="${role.value}" ${selected}>${role.label}</option>`;
    });
    
    return options;
}

// Obtener badge de estado de proyecto
function getProjectStatusBadge(status) {
    const statusConfig = {
        'DRAFT': { class: 'bg-gray-100 text-gray-800', icon: 'fas fa-edit', label: 'Borrador' },
        'ACTIVE': { class: 'bg-green-100 text-green-800', icon: 'fas fa-play', label: 'Activo' },
        'REVIEW': { class: 'bg-yellow-100 text-yellow-800', icon: 'fas fa-search', label: 'En Revisión' },
        'COMPLETED': { class: 'bg-blue-100 text-blue-800', icon: 'fas fa-check', label: 'Completado' },
        'SUSPENDED': { class: 'bg-red-100 text-red-800', icon: 'fas fa-pause', label: 'Suspendido' }
    };
    
    const config = statusConfig[status] || statusConfig['ACTIVE'];
    
    return `
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.class}">
            <i class="${config.icon} mr-1"></i>
            ${config.label}
        </span>
    `;
}

// Obtener información de categoría de producto
function getProductCategoryInfo(categoryCode) {
    return Phase1Cache.productCategories.find(cat => cat.code === categoryCode) || {
        name: categoryCode,
        category_group: 'OTHER',
        impact_weight: 1.0
    };
}

// Formatear fecha para input date
function formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
}

// Validar fechas de proyecto
function validateProjectDates(startDate, endDate) {
    if (!startDate || !endDate) return true;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return end > start;
}

// Modal mejorado para crear/editar proyecto con campos Fase 1
function showEnhancedProjectModal(project = null) {
    const isEdit = project !== null;
    const modalTitle = isEdit ? 'Editar Proyecto' : 'Crear Nuevo Proyecto';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-screen overflow-auto">
            <div class="p-6 border-b">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-project-diagram mr-2"></i>
                        ${modalTitle}
                    </h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <form id="projectForm" class="p-6 space-y-6">
                <!-- Información Básica -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="lg:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                            <i class="fas fa-info-circle mr-2"></i>
                            Información Básica
                        </h3>
                    </div>
                    
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                        <input 
                            type="text" 
                            id="title" 
                            name="title" 
                            required
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Título del proyecto"
                            value="${project?.title || ''}"
                        >
                    </div>
                    
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Resumen *</label>
                        <textarea 
                            id="abstract" 
                            name="abstract" 
                            required
                            rows="4"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Resumen del proyecto"
                        >${project?.abstract || ''}</textarea>
                    </div>
                    
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Palabras Clave</label>
                        <input 
                            type="text" 
                            id="keywords" 
                            name="keywords"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Palabra1, Palabra2, Palabra3"
                            value="${project?.keywords || ''}"
                        >
                    </div>
                </div>
                
                <!-- Metadatos del Proyecto (Fase 1) -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="lg:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                            <i class="fas fa-cogs mr-2"></i>
                            Metadatos del Proyecto
                        </h3>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                        <select 
                            id="status" 
                            name="status"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            ${generateProjectStatusOptions(project?.status)}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Código del Proyecto</label>
                        <input 
                            type="text" 
                            id="project_code" 
                            name="project_code"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="CTI-2024-001"
                            value="${project?.project_code || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Inicio</label>
                        <input 
                            type="date" 
                            id="start_date" 
                            name="start_date"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            value="${formatDateForInput(project?.start_date)}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Fin</label>
                        <input 
                            type="date" 
                            id="end_date" 
                            name="end_date"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            value="${formatDateForInput(project?.end_date)}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Institución</label>
                        <select 
                            id="institution" 
                            name="institution"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            ${generateInstitutionOptions()}
                        </select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fuente de Financiación</label>
                        <input 
                            type="text" 
                            id="funding_source" 
                            name="funding_source"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Nombre de la institución financiadora"
                            value="${project?.funding_source || ''}"
                        >
                    </div>
                    
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Presupuesto</label>
                        <div class="relative">
                            <span class="absolute left-3 top-3 text-gray-500">$</span>
                            <input 
                                type="number" 
                                id="budget" 
                                name="budget"
                                step="0.01"
                                min="0"
                                class="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                                placeholder="0.00"
                                value="${project?.budget || ''}"
                            >
                        </div>
                    </div>
                </div>
                
                <!-- Descripción Detallada -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-gray-900">
                        <i class="fas fa-file-alt mr-2"></i>
                        Descripción Detallada
                    </h3>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Introducción</label>
                        <textarea 
                            id="introduction" 
                            name="introduction"
                            rows="4"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Introducción y antecedentes del proyecto"
                        >${project?.introduction || ''}</textarea>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Metodología</label>
                        <textarea 
                            id="methodology" 
                            name="methodology"
                            rows="4"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Metodología a utilizar en el proyecto"
                        >${project?.methodology || ''}</textarea>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-6 border-t">
                    <button 
                        type="button" 
                        onclick="this.closest('.fixed').remove()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        class="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Actualizar' : 'Crear'} Proyecto
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Si es edición, establecer el valor de institución
    if (project?.institution) {
        setTimeout(() => {
            const institutionSelect = document.getElementById('institution');
            institutionSelect.value = project.institution;
        }, 100);
    }
    
    // Manejar envío del formulario
    document.getElementById('projectForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const projectData = Object.fromEntries(formData);
        
        // Validar fechas
        if (projectData.start_date && projectData.end_date) {
            if (!validateProjectDates(projectData.start_date, projectData.end_date)) {
                showToast('La fecha de fin debe ser posterior a la fecha de inicio', 'error');
                return;
            }
        }
        
        // Convertir budget a número si existe
        if (projectData.budget) {
            projectData.budget = parseFloat(projectData.budget);
        }
        
        try {
            let response;
            if (isEdit) {
                response = await axios.put(`${API_BASE}/me/projects/${project.id}`, projectData);
            } else {
                response = await axios.post(`${API_BASE}/me/projects`, projectData);
            }
            
            if (response.data.success) {
                showToast(response.data.message || `Proyecto ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
                modal.remove();
                loadMyProjects(); // Recargar lista
            } else {
                showToast(response.data.error || 'Error en la operación', 'error');
            }
        } catch (error) {
            console.error('Error guardando proyecto:', error);
            showToast('Error al guardar el proyecto', 'error');
        }
    });
}

// Modal mejorado para crear producto con categorías Fase 1
function showEnhancedProductModal(projectId, product = null) {
    const isEdit = product !== null;
    const modalTitle = isEdit ? 'Editar Producto CTeI' : 'Crear Nuevo Producto CTeI';
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-screen overflow-auto">
            <div class="p-6 border-b">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-lightbulb mr-2"></i>
                        ${modalTitle}
                    </h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <form id="productForm" class="p-6 space-y-6">
                <!-- Información Básica -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="lg:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                            <i class="fas fa-info-circle mr-2"></i>
                            Información Básica
                        </h3>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Código del Producto *</label>
                        <input 
                            type="text" 
                            id="product_code" 
                            name="product_code" 
                            required
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="PROD-001"
                            value="${product?.product_code || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Producto *</label>
                        <select 
                            id="product_type" 
                            name="product_type" 
                            required
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            ${generateCategoryOptions()}
                        </select>
                    </div>
                    
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descripción *</label>
                        <textarea 
                            id="description" 
                            name="description" 
                            required
                            rows="4"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Descripción detallada del producto"
                        >${product?.description || ''}</textarea>
                    </div>
                </div>
                
                <!-- Metadatos Específicos (Fase 1) -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="lg:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                            <i class="fas fa-tags mr-2"></i>
                            Metadatos Específicos
                        </h3>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">DOI</label>
                        <input 
                            type="text" 
                            id="doi" 
                            name="doi"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="10.1000/182"
                            value="${product?.doi || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL</label>
                        <input 
                            type="url" 
                            id="url" 
                            name="url"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://..."
                            value="${product?.url || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Publicación</label>
                        <input 
                            type="date" 
                            id="publication_date" 
                            name="publication_date"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            value="${formatDateForInput(product?.publication_date)}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Revista/Journal</label>
                        <input 
                            type="text" 
                            id="journal" 
                            name="journal"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Nombre de la revista"
                            value="${product?.journal || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Factor de Impacto</label>
                        <input 
                            type="number" 
                            id="impact_factor" 
                            name="impact_factor"
                            step="0.001"
                            min="0"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="0.000"
                            value="${product?.impact_factor || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL del Archivo</label>
                        <input 
                            type="url" 
                            id="file_url" 
                            name="file_url"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://..."
                            value="${product?.file_url || ''}"
                        >
                    </div>
                    
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Metadatos Adicionales (JSON)</label>
                        <textarea 
                            id="metadata" 
                            name="metadata"
                            rows="3"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                            placeholder='{"campo1": "valor1", "campo2": "valor2"}'
                        >${product?.metadata || ''}</textarea>
                        <p class="text-xs text-gray-500 mt-1">Formato JSON válido para metadatos adicionales</p>
                    </div>
                </div>
                
                <div class="flex justify-end space-x-3 pt-6 border-t">
                    <button 
                        type="button" 
                        onclick="this.closest('.fixed').remove()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        class="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Actualizar' : 'Crear'} Producto
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Si es edición, establecer el valor de categoría
    if (product?.product_type) {
        setTimeout(() => {
            const categorySelect = document.getElementById('product_type');
            categorySelect.value = product.product_type;
        }, 100);
    }
    
    // Manejar envío del formulario
    document.getElementById('productForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const productData = Object.fromEntries(formData);
        
        // Validar JSON de metadatos
        if (productData.metadata && productData.metadata.trim()) {
            try {
                JSON.parse(productData.metadata);
            } catch (error) {
                showToast('El formato de metadatos no es JSON válido', 'error');
                return;
            }
        }
        
        // Convertir impact_factor a número si existe
        if (productData.impact_factor) {
            productData.impact_factor = parseFloat(productData.impact_factor);
        }
        
        try {
            let response;
            if (isEdit) {
                response = await axios.put(`${API_BASE}/me/projects/${projectId}/products/${product.id}`, productData);
            } else {
                response = await axios.post(`${API_BASE}/me/projects/${projectId}/products`, productData);
            }
            
            if (response.data.success) {
                showToast(response.data.message || `Producto ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
                modal.remove();
                loadProjectDetails(projectId); // Recargar detalles del proyecto
            } else {
                showToast(response.data.error || 'Error en la operación', 'error');
            }
        } catch (error) {
            console.error('Error guardando producto:', error);
            showToast('Error al guardar el producto', 'error');
        }
    });
}

// Inicialización de las mejoras Fase 1
document.addEventListener('DOMContentLoaded', function() {
    // Cargar datos auxiliares al iniciar
    loadAuxiliaryData();
});