// JavaScript principal para CTeI-Manager Portal Público

// Estado global de la aplicación
const AppState = {
    currentPage: 1,
    currentProductPage: 1,
    searchQuery: '',
    isAuthenticated: false,
    user: null,
    token: localStorage.getItem('ctei_token') || null
};

// API Base URL
const API_BASE = '/api';

// Configurar axios con token si existe
if (AppState.token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${AppState.token}`;
}

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
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

function showSpinner(element) {
    element.innerHTML = '<div class="flex justify-center"><div class="spinner"></div></div>';
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function truncateText(text, maxLength = 150) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Funciones de autenticación
function showLoginModal() {
    document.getElementById('loginModal').classList.remove('hidden');
}

function closeLoginModal() {
    document.getElementById('loginModal').classList.add('hidden');
    // Limpiar formulario
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
}

function showRegisterModal() {
    document.getElementById('registerModal').classList.remove('hidden');
}

function closeRegisterModal() {
    document.getElementById('registerModal').classList.add('hidden');
    // Limpiar formulario
    document.getElementById('registerName').value = '';
    document.getElementById('registerEmail').value = '';
    document.getElementById('registerPassword').value = '';
    document.getElementById('registerRole').value = 'COMMUNITY';
}

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email,
            password
        });
        
        if (response.data.success) {
            const { token, user } = response.data.data;
            
            // Guardar token
            localStorage.setItem('ctei_token', token);
            AppState.token = token;
            AppState.user = user;
            AppState.isAuthenticated = true;
            
            // Configurar axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            showToast('Inicio de sesión exitoso');
            closeLoginModal();
            
            // Redireccionar al dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        }
    } catch (error) {
        const message = error.response?.data?.error || 'Error al iniciar sesión';
        showToast(message, 'error');
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const full_name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const role = document.getElementById('registerRole').value;
    
    try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
            email,
            password,
            full_name,
            role
        });
        
        if (response.data.success) {
            const { token } = response.data.data;
            
            // Guardar token
            localStorage.setItem('ctei_token', token);
            AppState.token = token;
            AppState.isAuthenticated = true;
            
            // Configurar axios
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            showToast('Registro exitoso');
            closeRegisterModal();
            
            // Redireccionar al dashboard
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1000);
        }
    } catch (error) {
        const message = error.response?.data?.error || 'Error al registrarse';
        showToast(message, 'error');
    }
}

// Funciones de datos públicos
async function loadPublicStats() {
    try {
        const response = await axios.get(`${API_BASE}/public/stats`);
        if (response.data.success) {
            const stats = response.data.data;
            
            document.getElementById('totalProjects').textContent = stats.totalProjects || 0;
            document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
            document.getElementById('activeInvestigators').textContent = stats.activeInvestigators || 0;
        }
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

async function loadProjects(page = 1, search = '', filters = {}) {
    const container = document.getElementById('projectsContainer');
    
    if (page === 1) {
        showSpinner(container);
    }
    
    try {
        const params = { page, limit: 6 };
        if (search) params.search = search;
        if (filters.year) params.year = filters.year;
        
        const response = await axios.get(`${API_BASE}/public/projects`, { params });
        
        if (response.data.success) {
            const { projects, pagination } = response.data.data;
            
            if (page === 1) {
                container.innerHTML = '';
            }
            
            projects.forEach(project => {
                const projectCard = createProjectCard(project);
                container.appendChild(projectCard);
            });
            
            AppState.currentPage = page;
            
            // Ocultar botón "Ver más" si no hay más páginas
            const loadMoreBtn = document.querySelector('[onclick="loadMoreProjects()"]');
            if (pagination.page >= pagination.totalPages) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        if (page === 1) {
            container.innerHTML = '<p class="text-center text-muted-foreground">Error al cargar proyectos</p>';
        }
    }
}

async function loadProducts(page = 1, search = '', filters = {}) {
    const container = document.getElementById('productsContainer');
    
    if (page === 1) {
        showSpinner(container);
    }
    
    try {
        const params = { page, limit: 6 };
        if (search) params.search = search;
        if (filters.year) params.year = filters.year;
        if (filters.category) params.category = filters.category;
        
        const response = await axios.get(`${API_BASE}/public/products`, { params });
        
        if (response.data.success) {
            const { products, pagination } = response.data.data;
            
            if (page === 1) {
                container.innerHTML = '';
            }
            
            products.forEach(product => {
                const productCard = createProductCard(product);
                container.appendChild(productCard);
            });
            
            AppState.currentProductPage = page;
            
            // Ocultar botón "Ver más" si no hay más páginas
            const loadMoreBtn = document.querySelector('[onclick="loadMoreProducts()"]');
            if (pagination.page >= pagination.totalPages) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'inline-block';
            }
        }
    } catch (error) {
        console.error('Error cargando productos:', error);
        if (page === 1) {
            container.innerHTML = '<p class="text-center text-muted-foreground">Error al cargar productos</p>';
        }
    }
}

function createProjectCard(project) {
    const card = document.createElement('div');
    card.className = 'card p-6 fade-in';
    
    // Tipos de productos como badges
    const keywordsBadges = project.keywords 
        ? project.keywords.split(',').slice(0, 3).map(keyword => 
            `<span class="inline-block bg-accent text-accent-foreground text-xs px-2 py-1 rounded-full">${keyword.trim()}</span>`
          ).join(' ')
        : '';
    
    card.innerHTML = `
        <div class="mb-4">
            <h4 class="text-lg font-semibold text-foreground mb-2">${project.title}</h4>
            <p class="text-muted-foreground text-sm mb-3">${truncateText(project.abstract)}</p>
            <div class="flex flex-wrap gap-2 mb-3">
                ${keywordsBadges}
            </div>
            <div class="flex items-center justify-between text-sm text-muted-foreground">
                <span><i class="fas fa-user mr-1"></i>${project.owner_name}</span>
                <span><i class="fas fa-calendar mr-1"></i>${formatDate(project.created_at)}</span>
            </div>
        </div>
        <button 
            onclick="viewProjectDetails(${project.id})"
            class="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
            Ver Detalles
        </button>
    `;
    
    return card;
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'card p-6 fade-in';
    
    const typeColors = {
        'TOP': 'bg-chart-1 text-white',
        'A': 'bg-chart-2 text-white',
        'B': 'bg-chart-3 text-white',
        'ASC': 'bg-chart-4 text-white',
        'DPC': 'bg-chart-5 text-white',
        'FRH_A': 'bg-primary text-primary-foreground',
        'FRH_B': 'bg-accent text-accent-foreground'
    };
    
    // Crear etiqueta de tipo con tooltip
    const typeLabel = createTechLabelWithTooltip(product.product_type, `px-2 py-1 text-xs font-semibold rounded ${typeColors[product.product_type] || 'bg-muted text-muted-foreground'}`);
    
    card.innerHTML = `
        <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-mono text-muted-foreground">${product.product_code}</span>
                ${typeLabel}
            </div>
            <p class="text-sm text-foreground mb-3">${truncateText(product.description, 120)}</p>
            <div class="text-sm text-muted-foreground">
                <p><i class="fas fa-project-diagram mr-1"></i>${product.project_title}</p>
                <p class="mt-1"><i class="fas fa-calendar mr-1"></i>${formatDate(product.created_at)}</p>
            </div>
        </div>
        <button onclick="viewProductDetails(${product.id})" class="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90 transition-opacity">
            Ver Detalles
        </button>
    `;
    
    return card;
}

async function viewProjectDetails(projectId) {
    try {
        const response = await axios.get(`${API_BASE}/public/projects/${projectId}`);
        if (response.data.success) {
            const project = response.data.data;
            showProjectModal(project);
        }
    } catch (error) {
        showToast('Error al cargar detalles del proyecto', 'error');
    }
}

async function viewProductDetails(productId) {
    try {
        const response = await axios.get(`${API_BASE}/public/products/${productId}`);
        if (response.data.success) {
            const product = response.data.data;
            showProductModal(product);
        }
    } catch (error) {
        showToast('Error al cargar detalles del producto', 'error');
    }
}

function showProjectModal(project) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    const productsList = project.products?.map(product => `
        <div class="border border-border rounded p-3 mb-2">
            <div class="flex justify-between items-start mb-1">
                <span class="font-mono text-sm">${product.product_code}</span>
                ${createTechLabelWithTooltip(product.product_type, 'px-2 py-1 text-xs rounded bg-muted text-muted-foreground')}
            </div>
            <p class="text-sm">${product.description}</p>
        </div>
    `).join('') || '<p class="text-muted-foreground">No hay productos asociados</p>';
    
    const collaboratorsList = project.collaborators?.map(collab => `
        <span class="inline-block bg-accent text-accent-foreground px-2 py-1 rounded text-sm mr-2 mb-2">
            ${collab.full_name}
        </span>
    `).join('') || '<p class="text-muted-foreground">No hay colaboradores</p>';
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-4">
                    <h3 class="text-xl font-bold">${project.title}</h3>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="space-y-4">
                    <div>
                        <h4 class="font-semibold mb-2">Resumen</h4>
                        <p class="text-muted-foreground">${project.abstract}</p>
                    </div>
                    
                    ${project.keywords ? `
                    <div>
                        <h4 class="font-semibold mb-2">Palabras Clave</h4>
                        <div class="flex flex-wrap gap-2">
                            ${project.keywords.split(',').map(keyword => 
                                `<span class="bg-accent text-accent-foreground px-2 py-1 rounded text-sm">${keyword.trim()}</span>`
                            ).join('')}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${project.introduction ? `
                    <div>
                        <h4 class="font-semibold mb-2">Introducción</h4>
                        <p class="text-muted-foreground">${project.introduction}</p>
                    </div>
                    ` : ''}
                    
                    ${project.methodology ? `
                    <div>
                        <h4 class="font-semibold mb-2">Metodología</h4>
                        <p class="text-muted-foreground">${project.methodology}</p>
                    </div>
                    ` : ''}
                    
                    <div>
                        <h4 class="font-semibold mb-2">Productos de CTeI</h4>
                        ${productsList}
                    </div>
                    
                    <div>
                        <h4 class="font-semibold mb-2">Colaboradores</h4>
                        ${collaboratorsList}
                    </div>
                    
                    <div class="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                        <span><i class="fas fa-user mr-1"></i>${project.owner_name}</span>
                        <span><i class="fas fa-calendar mr-1"></i>${formatDate(project.created_at)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showProductModal(product) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    const authorsList = product.authors?.map(author => `
        <div class="flex items-center justify-between py-2 border-b border-border last:border-b-0">
            <div>
                <span class="font-medium">${author.full_name}</span>
                <span class="text-muted-foreground ml-2">(${author.email})</span>
            </div>
            <div class="text-right">
                <div class="text-sm font-medium">${formatRole(author.author_role)}</div>
                ${author.contribution_type ? `<div class="text-xs text-muted-foreground">${author.contribution_type}</div>` : ''}
            </div>
        </div>
    `).join('') || '<p class="text-muted-foreground">No hay autores registrados</p>';
    
    const typeColors = {
        'TOP': 'bg-chart-1 text-white',
        'A': 'bg-chart-2 text-white',
        'B': 'bg-chart-3 text-white',
        'ASC': 'bg-chart-4 text-white',
        'DPC': 'bg-chart-5 text-white',
        'FRH_A': 'bg-primary text-primary-foreground',
        'FRH_B': 'bg-accent text-accent-foreground'
    };
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <span class="text-lg font-mono text-muted-foreground">${product.product_code}</span>
                            ${createTechLabelWithTooltip(product.product_type, `px-3 py-1 text-sm font-semibold rounded ${typeColors[product.product_type] || 'bg-muted text-muted-foreground'}`)}
                        </div>
                        <h2 class="text-2xl font-bold">Producto de CTeI</h2>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-muted-foreground hover:text-foreground text-xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="space-y-6">
                    <div>
                        <h4 class="font-semibold mb-2">Descripción</h4>
                        <p class="text-muted-foreground">${product.description || 'Sin descripción disponible'}</p>
                    </div>
                    
                    ${product.category_description ? `
                    <div>
                        <h4 class="font-semibold mb-2">Categoría</h4>
                        <p class="text-muted-foreground">${product.category_description}</p>
                    </div>
                    ` : ''}
                    
                    ${product.doi || product.url || product.journal ? `
                    <div>
                        <h4 class="font-semibold mb-2">Información de Publicación</h4>
                        <div class="space-y-2">
                            ${product.journal ? `<p><i class="fas fa-book-open mr-2"></i><strong>Revista:</strong> ${product.journal}</p>` : ''}
                            ${product.publication_date ? `<p><i class="fas fa-calendar mr-2"></i><strong>Fecha de Publicación:</strong> ${formatDate(product.publication_date)}</p>` : ''}
                            ${product.doi ? `<p><i class="fas fa-link mr-2"></i><strong>DOI:</strong> <a href="https://doi.org/${product.doi}" target="_blank" class="text-primary hover:underline">${product.doi}</a></p>` : ''}
                            ${product.url ? `<p><i class="fas fa-external-link-alt mr-2"></i><strong>URL:</strong> <a href="${product.url}" target="_blank" class="text-primary hover:underline">Enlace externo</a></p>` : ''}
                            ${product.impact_factor ? `<p><i class="fas fa-star mr-2"></i><strong>Factor de Impacto:</strong> ${product.impact_factor}</p>` : ''}
                            ${product.citation_count ? `<p><i class="fas fa-quote-right mr-2"></i><strong>Citaciones:</strong> ${product.citation_count}</p>` : ''}
                        </div>
                    </div>
                    ` : ''}
                    
                    ${product.project ? `
                    <div>
                        <h4 class="font-semibold mb-2">Proyecto Asociado</h4>
                        <div class="bg-muted p-4 rounded-lg">
                            <h5 class="font-medium">${product.project.title}</h5>
                            <p class="text-sm text-muted-foreground mt-1">${product.project.abstract || 'Sin resumen disponible'}</p>
                            <div class="flex items-center justify-between mt-3 text-sm">
                                <span><i class="fas fa-user mr-1"></i>${product.project.owner_name}</span>
                                <span><i class="fas fa-building mr-1"></i>${product.project.institution || 'Sin institución'}</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div>
                        <h4 class="font-semibold mb-2">Autores y Colaboradores</h4>
                        <div class="bg-muted p-4 rounded-lg">
                            ${authorsList}
                        </div>
                    </div>
                    
                    <div class="flex items-center justify-between pt-4 border-t border-border text-sm text-muted-foreground">
                        <div class="space-y-1">
                            ${product.creator_name ? `<div><i class="fas fa-user-plus mr-1"></i>Creado por: ${product.creator_name}</div>` : ''}
                            ${product.last_editor_name ? `<div><i class="fas fa-edit mr-1"></i>Editado por: ${product.last_editor_name}</div>` : ''}
                        </div>
                        <div class="text-right space-y-1">
                            <div><i class="fas fa-calendar-plus mr-1"></i>Creado: ${formatDate(product.created_at)}</div>
                            <div><i class="fas fa-calendar-edit mr-1"></i>Actualizado: ${formatDate(product.updated_at)}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function formatRole(role) {
    const roleNames = {
        'AUTHOR': 'Autor',
        'CO_AUTHOR': 'Co-autor',
        'EDITOR': 'Editor',
        'REVIEWER': 'Revisor'
    };
    return roleNames[role] || role;
}

// Funciones de búsqueda
// ===== BÚSQUEDA AVANZADA =====

// Toggle para mostrar/ocultar filtros avanzados
function toggleAdvancedFilters() {
    const filtersContainer = document.getElementById('advancedFilters');
    const toggleButton = document.getElementById('filtersToggle');
    
    if (filtersContainer && filtersContainer.classList.contains('hidden')) {
        filtersContainer.classList.remove('hidden');
        toggleButton.innerHTML = '<i class="fas fa-filter mr-2"></i>Ocultar Filtros';
        // Cargar categorías cuando se muestran los filtros
        loadProductCategoriesForFilter();
    } else if (filtersContainer) {
        filtersContainer.classList.add('hidden');
        toggleButton.innerHTML = '<i class="fas fa-filter mr-2"></i>Filtros';
    }
}

// Cargar categorías de productos para el filtro
async function loadProductCategoriesForFilter() {
    try {
        const response = await axios.get(`${API_BASE}/public/product-categories`);
        if (response.data.success) {
            const categoryFilter = document.getElementById('categoryFilter');
            if (!categoryFilter) return;
            
            const categories = response.data.data.categories;
            
            // Limpiar opciones existentes (excepto "Todas las categorías")
            categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
            
            // Agrupar categorías por grupo
            const groupedCategories = categories.reduce((acc, category) => {
                if (!acc[category.category_group]) {
                    acc[category.category_group] = [];
                }
                acc[category.category_group].push(category);
                return acc;
            }, {});
            
            // Agregar opciones agrupadas
            Object.entries(groupedCategories).forEach(([group, groupCategories]) => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = group;
                
                groupCategories.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.code;
                    option.textContent = `${category.code} - ${category.name}`;
                    optgroup.appendChild(option);
                });
                
                categoryFilter.appendChild(optgroup);
            });
        }
    } catch (error) {
        console.error('Error cargando categorías para filtro:', error);
    }
}

// Limpiar todos los filtros
function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    if (document.getElementById('yearFilter')) document.getElementById('yearFilter').value = '';
    if (document.getElementById('typeFilter')) document.getElementById('typeFilter').value = '';
    if (document.getElementById('categoryFilter')) document.getElementById('categoryFilter').value = '';
    
    // Realizar búsqueda vacía para mostrar todo
    performSearch();
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    const yearFilter = document.getElementById('yearFilter')?.value || '';
    const typeFilter = document.getElementById('typeFilter')?.value || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || '';
    
    // Actualizar estado global
    AppState.searchQuery = query;
    AppState.searchFilters = { year: yearFilter, type: typeFilter, category: categoryFilter };
    
    // Resetear páginas
    AppState.currentPage = 1;
    AppState.currentProductPage = 1;
    
    // Cargar resultados con filtros
    if (typeFilter !== 'products') {
        loadProjects(1, query, { year: yearFilter });
    } else {
        // Limpiar proyectos si solo se buscan productos
        document.getElementById('projectsContainer').innerHTML = '<p class="text-center text-muted-foreground py-8">Búsqueda limitada a productos</p>';
    }
    
    if (typeFilter !== 'projects') {
        loadProducts(1, query, { year: yearFilter, category: categoryFilter });
    } else {
        // Limpiar productos si solo se buscan proyectos
        document.getElementById('productsContainer').innerHTML = '<p class="text-center text-muted-foreground py-8">Búsqueda limitada a proyectos</p>';
    }
    
    // Mostrar mensaje de búsqueda
    let searchMessage = '';
    if (query) searchMessage += `"${query}"`;
    if (yearFilter) searchMessage += ` en ${yearFilter}`;
    if (categoryFilter) searchMessage += ` categoría ${categoryFilter}`;
    
    if (searchMessage) {
        showToast(`Buscando: ${searchMessage}`);
    }
}

function loadMoreProjects() {
    const filters = AppState.searchFilters || {};
    loadProjects(AppState.currentPage + 1, AppState.searchQuery, { year: filters.year });
}

function loadMoreProducts() {
    const filters = AppState.searchFilters || {};
    loadProducts(AppState.currentProductPage + 1, AppState.searchQuery, { year: filters.year, category: filters.category });
}

// Event listener para búsqueda con Enter
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    // Cargar datos iniciales
    loadPublicStats();
    loadProjects();
    loadProducts();
    
    // Verificar si el usuario está autenticado
    checkAuthenticationStatus();
});

// Cerrar modales con Escape
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeLoginModal();
        closeRegisterModal();
    }
});

// ===== TOOLTIPS PARA ETIQUETAS TÉCNICAS =====

// Diccionario de etiquetas técnicas y sus descripciones
const TECH_LABELS = {
    // Artículos científicos
    'ART_A1': 'Artículo en revista indexada en Q1 - Máxima calidad científica',
    'ART_A2': 'Artículo en revista indexada en Q2 - Alta calidad científica',
    'ART_B': 'Artículo en revista indexada nacional - Calidad regional',
    'ART_C': 'Artículo en revista no indexada - Divulgación científica',
    
    // Eventos y conferencias
    'CONFERENCE': 'Ponencia en conferencia internacional - Presentación académica',
    'WORKSHOP': 'Taller o seminario especializado - Capacitación técnica',
    'SYMPOSIUM': 'Simposio científico - Encuentro académico',
    
    // Productos tecnológicos
    'SOFTWARE': 'Desarrollo de software - Producto tecnológico',
    'PATENT': 'Patente registrada - Propiedad intelectual',
    'PROTOTYPE': 'Prototipo funcional - Desarrollo tecnológico',
    'DATASET': 'Base de datos científica - Recurso de investigación',
    
    // Formación de recursos humanos
    'PHD': 'Formación doctoral - Doctorado',
    'MSC': 'Formación de maestría - Postgrado',
    'SPEC': 'Especialización técnica - Formación avanzada',
    'INTERN': 'Programa de prácticas - Formación práctica',
    
    // Tipos de productos (Minciencias)
    'TOP': 'Producto tipo Top - Máximo reconocimiento Minciencias',
    'A': 'Producto tipo A - Alto reconocimiento Minciencias',
    'B': 'Producto tipo B - Reconocimiento estándar Minciencias',
    'ASC': 'Apropiación Social del Conocimiento',
    'DPC': 'Desarrollo de Procesos y Capacidades',
    'FRH_A': 'Formación Recursos Humanos tipo A',
    'FRH_B': 'Formación Recursos Humanos tipo B'
};

// Función para crear tooltip con etiqueta técnica
function createTechLabelWithTooltip(label, className = '') {
    const description = TECH_LABELS[label] || 'Etiqueta técnica especializada';
    
    return `
        <span class="tooltip-container ${className}">
            <span class="tech-label">${label}</span>
            <div class="tooltip">${description}</div>
        </span>
    `;
}

// Función para procesar etiquetas técnicas en texto
function processTextWithTechLabels(text) {
    if (!text) return text;
    
    // Buscar patrones de etiquetas técnicas en el texto
    return Object.keys(TECH_LABELS).reduce((processedText, label) => {
        const regex = new RegExp(`\\b${label}\\b`, 'gi');
        return processedText.replace(regex, (match) => {
            return createTechLabelWithTooltip(match.toUpperCase());
        });
    }, text);
}

// ===== GESTIÓN DE AUTENTICACIÓN =====

// Verificar el estado de autenticación del usuario
async function checkAuthenticationStatus() {
    const token = localStorage.getItem('ctei_token');
    
    if (!token) {
        showUnauthenticatedButtons();
        return;
    }
    
    try {
        // Verificar si el token es válido obteniendo el perfil del usuario
        const response = await axios.get(`${API_BASE}/me/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.success) {
            const user = response.data.data;
            showAuthenticatedButtons(user);
        } else {
            // Token inválido, limpiar y mostrar botones de login
            localStorage.removeItem('ctei_token');
            delete axios.defaults.headers.common['Authorization'];
            showUnauthenticatedButtons();
        }
        
    } catch (error) {
        // Error en la verificación, asumir no autenticado
        localStorage.removeItem('ctei_token');
        delete axios.defaults.headers.common['Authorization'];
        showUnauthenticatedButtons();
    }
}

// Mostrar botones para usuarios no autenticados
function showUnauthenticatedButtons() {
    const unauthenticatedButtons = document.getElementById('unauthenticatedButtons');
    const authenticatedButtons = document.getElementById('authenticatedButtons');
    
    if (unauthenticatedButtons && authenticatedButtons) {
        unauthenticatedButtons.classList.remove('hidden');
        authenticatedButtons.classList.add('hidden');
    }
}

// Mostrar botones para usuarios autenticados
function showAuthenticatedButtons(user) {
    const unauthenticatedButtons = document.getElementById('unauthenticatedButtons');
    const authenticatedButtons = document.getElementById('authenticatedButtons');
    const userInfo = document.getElementById('userInfo');
    
    if (unauthenticatedButtons && authenticatedButtons) {
        unauthenticatedButtons.classList.add('hidden');
        authenticatedButtons.classList.remove('hidden');
        authenticatedButtons.classList.add('flex');
    }
    
    if (userInfo && user) {
        userInfo.textContent = `${user.full_name} (${user.role})`;
    }
}

// Función de logout
function logout() {
    // Limpiar token y datos de sesión
    localStorage.removeItem('ctei_token');
    delete axios.defaults.headers.common['Authorization'];
    
    // Mostrar mensaje de confirmación
    showToast('Sesión cerrada exitosamente');
    
    // Actualizar la interfaz
    showUnauthenticatedButtons();
}

// Actualizar las funciones de login existentes para manejar el estado
function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    // Simular login - aquí deberías conectar con tu API real
    showToast('Login functionality needs to be implemented', 'error');
}

function handleRegister(event) {
    event.preventDefault();
    
    // Simular registro - aquí deberías conectar con tu API real
    showToast('Register functionality needs to be implemented', 'error');
}

// ===== GESTIÓN DE MODALES =====

function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'loginModal';
    modal.onclick = (e) => {
        if (e.target === modal) closeLoginModal();
    };
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Iniciar Sesión</h3>
                    <button onclick="closeLoginModal()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form onsubmit="handleLoginSubmit(event)">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input 
                            type="email" 
                            id="loginEmail" 
                            required
                            class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="tu@email.com"
                        >
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Contraseña</label>
                        <input 
                            type="password" 
                            id="loginPassword" 
                            required
                            class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Tu contraseña"
                        >
                    </div>
                    <button 
                        type="submit" 
                        class="w-full bg-primary text-primary-foreground py-2 rounded-lg font-medium hover:opacity-90"
                    >
                        <i class="fas fa-sign-in-alt mr-1"></i>
                        Ingresar
                    </button>
                </form>
                <div class="mt-4 text-center">
                    <button 
                        onclick="closeLoginModal(); showRegisterModal();" 
                        class="text-primary hover:underline text-sm"
                    >
                        ¿No tienes cuenta? Regístrate aquí
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus en el campo email
    setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.focus();
    }, 100);
}

function closeLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.remove();
    }
}

function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.id = 'registerModal';
    modal.onclick = (e) => {
        if (e.target === modal) closeRegisterModal();
    };
    
    modal.innerHTML = `
        <div class="bg-card rounded-lg shadow-xl max-w-md w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Crear Cuenta</h3>
                    <button onclick="closeRegisterModal()" class="text-muted-foreground hover:text-foreground">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form onsubmit="handleRegisterSubmit(event)">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Nombre Completo</label>
                        <input 
                            type="text" 
                            id="registerName" 
                            required
                            class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Tu nombre completo"
                        >
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input 
                            type="email" 
                            id="registerEmail" 
                            required
                            class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="tu@email.com"
                        >
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Contraseña</label>
                        <input 
                            type="password" 
                            id="registerPassword" 
                            required
                            class="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Mínimo 6 caracteres"
                        >
                    </div>
                    <button 
                        type="submit" 
                        class="w-full bg-secondary text-secondary-foreground py-2 rounded-lg font-medium hover:opacity-90"
                    >
                        <i class="fas fa-user-plus mr-1"></i>
                        Crear Cuenta
                    </button>
                </form>
                <div class="mt-4 text-center">
                    <button 
                        onclick="closeRegisterModal(); showLoginModal();" 
                        class="text-primary hover:underline text-sm"
                    >
                        ¿Ya tienes cuenta? Inicia sesión aquí
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Focus en el campo nombre
    setTimeout(() => {
        const nameInput = document.getElementById('registerName');
        if (nameInput) nameInput.focus();
    }, 100);
}

function closeRegisterModal() {
    const modal = document.getElementById('registerModal');
    if (modal) {
        modal.remove();
    }
}

// Manejar envío de formulario de login
async function handleLoginSubmit(event) {
    event.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: email,
            password: password
        });
        
        if (response.data.success) {
            const { token, user } = response.data.data;
            
            // Guardar token
            localStorage.setItem('ctei_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Actualizar interfaz
            showAuthenticatedButtons(user);
            closeLoginModal();
            
            showToast(`¡Bienvenido ${user.full_name}!`);
        } else {
            showToast(response.data.error || 'Error al iniciar sesión', 'error');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        const message = error.response?.data?.error || 'Error de conexión';
        showToast(message, 'error');
    }
}

// Manejar envío de formulario de registro
async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await axios.post(`${API_BASE}/auth/register`, {
            full_name: fullName,
            email: email,
            password: password
        });
        
        if (response.data.success) {
            closeRegisterModal();
            showToast('Cuenta creada exitosamente. Puedes iniciar sesión ahora.');
            showLoginModal();
        } else {
            showToast(response.data.error || 'Error al crear la cuenta', 'error');
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        const message = error.response?.data?.error || 'Error de conexión';
        showToast(message, 'error');
    }
}