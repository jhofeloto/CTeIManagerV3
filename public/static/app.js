// JavaScript principal para CTeI-Manager Portal Público
// VERSION: 2024-09-12-FIXED-LOGIN-v2

console.log('🔧 CTeI-Manager Frontend VERSION: 2024-09-12-FIXED-LOGIN-v2');

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
    try {
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
        
        if (document.body) {
            document.body.appendChild(toast);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                try {
                    if (toast && toast.parentElement) {
                        toast.remove();
                    }
                } catch (e) {
                    console.warn('Error removiendo toast:', e);
                }
            }, 5000);
        } else {
            console.warn('document.body no disponible para toast:', message);
        }
    } catch (error) {
        console.warn('Error creando toast:', error);
        console.log('Toast message:', message);
    }
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

// Función handleLogin removida - usar solo handleLoginSubmit para consistencia

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
                container.className = 'ctei-grid ctei-grid-3';
            }
            
            projects.forEach(project => {
                const card = createProjectCard(project);
                container.appendChild(card);
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
                container.className = 'ctei-grid ctei-grid-3';
                console.log('🔄 Container productos reinicializado con grid mejorado:', container.className);
            }
            
            products.forEach(product => {
                const card = createProductCard(product);
                container.appendChild(card);
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
    // REMOVING ALL CSS CLASSES - ONLY INLINE STYLES
    card.className = '';
    
    // ESTILOS CORRECTOS PARA MODO OSCURO - VALORES SÓLIDOS
    card.style.cssText = `
        display: block;
        background-color: #1f2937;
        color: #f9fafb;
        border: 1px solid #374151;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 1rem;
        transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
        min-height: 200px;
        cursor: pointer;
    `;
    
    // Agregar efectos hover para proyectos
    card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        this.style.transform = 'translateY(-2px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        this.style.transform = 'translateY(0)';
    });
    
    // Tipos de productos como badges con estilos inline
    const keywordsBadges = project.keywords 
        ? project.keywords.split(',').slice(0, 3).map(keyword => 
            `<span style="display: inline-block; background-color: #374151; color: #d1d5db; font-size: 0.75rem; padding: 0.25rem 0.5rem; border-radius: 9999px; margin-right: 0.5rem;">${keyword.trim()}</span>`
          ).join('')
        : '';
    
    card.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <h4 style="font-weight: 600; font-size: 1.125rem; line-height: 1.4; color: #f9fafb; margin-bottom: 0.75rem;">${project.title}</h4>
            <p style="color: #d1d5db; font-size: 0.875rem; margin-bottom: 0.75rem;">${truncateText(project.abstract)}</p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem;">
                ${keywordsBadges}
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; color: #9ca3af; font-size: 0.875rem;">
                <span><i class="fas fa-user" style="margin-right: 0.25rem;"></i>${project.owner_name}</span>
                <span><i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>${formatDate(project.created_at)}</span>
            </div>
        </div>
        <button 
            onclick="viewProjectDetails(${project.id})"
            style="width: 100%; background-color: #3b82f6; color: white; font-weight: 500; padding: 0.75rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; transition: background-color 0.2s ease-in-out;"
            onmouseover="this.style.backgroundColor='#2563eb'"
            onmouseout="this.style.backgroundColor='#3b82f6'"
        >
            Ver Detalles
        </button>
    `;
    

    
    return card;
}

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = '';
    
    // ESTILOS CORRECTOS PARA MODO OSCURO - VALORES SÓLIDOS
    card.style.cssText = `
        display: block;
        background-color: #1f2937;
        color: #f9fafb;
        border: 1px solid #374151;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        padding: 1.5rem;
        margin-bottom: 1rem;
        transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
        min-height: 200px;
        cursor: pointer;
    `;
    
    // Agregar efectos hover para productos
    card.addEventListener('mouseenter', function() {
        this.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        this.style.transform = 'translateY(-2px)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        this.style.transform = 'translateY(0)';
    });
    
    // ELIMINADOS: Event listeners problemáticos que causaban fondos blancos persistentes
    // El hover se maneja completamente con CSS usando var(--card) y var(--card-foreground)
    
    // Colores de tipo con estilos inline
    const typeColors = {
        'TOP': '#ef4444', // rojo
        'A': '#22c55e',   // verde
        'B': '#3b82f6',   // azul
        'ASC': '#f59e0b', // amarillo
        'DPC': '#8b5cf6', // púrpura
        'FRH_A': '#06b6d4', // cyan
        'FRH_B': '#84cc16'  // lima
    };
    const typeColor = typeColors[product.product_type] || '#6b7280';
    
    card.innerHTML = `
        <div style="margin-bottom: 1rem;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
                <span style="font-family: monospace; font-size: 0.875rem; color: #9ca3af;">${product.product_code}</span>
                <span style="background-color: ${typeColor}; color: white; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; border-radius: 0.375rem;">${product.product_type}</span>
            </div>
            <p style="font-size: 0.875rem; color: #f9fafb; margin-bottom: 0.75rem;">${truncateText(product.description, 120)}</p>
            <div style="font-size: 0.875rem; color: #9ca3af;">
                <p><i class="fas fa-project-diagram" style="margin-right: 0.25rem;"></i>${product.project_title}</p>
                <p style="margin-top: 0.25rem;"><i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>${formatDate(product.created_at)}</p>
            </div>
        </div>
        <button 
            onclick="viewProductDetails(${product.id})" 
            style="width: 100%; background-color: #10b981; color: white; font-weight: 500; padding: 0.75rem 1rem; border-radius: 0.375rem; border: none; cursor: pointer; transition: background-color 0.2s ease-in-out;"
            onmouseover="this.style.backgroundColor='#059669'"
            onmouseout="this.style.backgroundColor='#10b981'"
        >
            Ver Detalles
        </button>
    `;
    
    return card;
}

// 🎯 NUEVA FUNCIONALIDAD: Navegación directa a páginas dedicadas
async function viewProjectDetails(projectId) {
    // Navegar directamente a la página dedicada del proyecto
    window.location.href = `/proyecto/${projectId}`;
}

// 🎯 NUEVA FUNCIONALIDAD: Navegación directa a páginas dedicadas  
async function viewProductDetails(productId) {
    // Navegar directamente a la página dedicada del producto
    window.location.href = `/producto/${productId}`;
}

function showProjectModal(project) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Crear componente de tags mejorado con diseño más elegante
    const createTag = (text) => `
        <span class="inline-block px-5 py-3 text-base font-semibold rounded-full border-2 transition-all duration-300 hover:scale-105 hover:shadow-lg cursor-default" 
              style="background-color: var(--accent); color: var(--accent-foreground); font-family: var(--font-sans); border-color: var(--border);">
            <i class="fas fa-tag mr-2 text-sm opacity-75"></i>${text.trim()}
        </span>
    `;
    
    // Productos asociados con diseño mejorado y elegante
    const productsList = project.products?.map(product => `
        <div class="bg-card border-2 border-border rounded-xl p-6 hover:bg-muted/10 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <div class="flex justify-between items-start mb-4">
                <span class="font-mono text-lg font-bold text-primary px-4 py-2 bg-primary/10 rounded-lg">
                    <i class="fas fa-barcode mr-2"></i>${product.product_code}
                </span>
                ${createTechLabelWithTooltip(product.product_type, 'px-3 py-2 text-sm rounded-lg bg-muted/80 text-muted-foreground border border-border')}
            </div>
            <p class="text-lg text-foreground leading-relaxed mb-4 line-height-1.7">${product.description}</p>
            <button onclick="viewProductDetails(${product.id})" 
                    class="inline-flex items-center px-4 py-2 text-sm text-primary hover:text-primary-foreground hover:bg-primary font-semibold rounded-lg border border-primary/30 hover:border-primary transition-all duration-300 group-hover:scale-105">
                <i class="fas fa-external-link-alt mr-2"></i>Ver detalles del producto
            </button>
        </div>
    `).join('') || `
    <div class="text-center py-12 bg-background rounded-xl border-2 border-dashed border-border">
        <div class="max-w-md mx-auto">
            <i class="fas fa-flask text-6xl text-muted-foreground mb-6 opacity-50"></i>
            <h3 class="text-xl font-semibold text-foreground mb-2">Sin Productos Asociados</h3>
            <p class="text-muted-foreground">Este proyecto aún no tiene productos científicos registrados.</p>
        </div>
    </div>`;
    
    // Colaboradores con diseño mejorado y profesional
    const collaboratorsList = project.collaborators?.map(collab => `
        <button onclick="showCollaboratorDetails('${collab.id}')" 
                class="inline-flex items-center px-6 py-4 text-base font-semibold rounded-xl mr-4 mb-4 transition-all duration-300 hover:scale-105 hover:shadow-lg border-2 group"
                style="background-color: var(--accent); color: var(--accent-foreground); font-family: var(--font-sans); border-color: var(--border);">
            <i class="fas fa-user-circle mr-3 text-xl p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30 transition-colors"></i>
            <div class="text-left">
                <div class="font-bold">${collab.full_name}</div>
                <div class="text-sm opacity-75">Colaborador</div>
            </div>
        </button>
    `).join('') || `
    <div class="text-center py-12 bg-background rounded-xl border-2 border-dashed border-border">
        <div class="max-w-md mx-auto">
            <i class="fas fa-users text-6xl text-muted-foreground mb-6 opacity-50"></i>
            <h3 class="text-xl font-semibold text-foreground mb-2">Sin Colaboradores Asignados</h3>
            <p class="text-muted-foreground">Este proyecto aún no tiene colaboradores registrados en el equipo de trabajo.</p>
        </div>
    </div>`;
    
    // Tags para palabras clave
    const keywordTags = project.keywords ? 
        project.keywords.split(',').map(keyword => createTag(keyword)).join(' ') :
        `<p class="text-muted-foreground" style="font-style: italic;">No hay palabras clave definidas</p>`;
    
    modal.innerHTML = `
        <div class="level-3 max-w-6xl w-full max-h-[95vh] overflow-hidden"
             style="background-color: var(--card); border: 2px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); font-family: var(--font-sans);">
            
            <!-- Encabezado Prominente con Mayor Jerarquía Visual -->
            <div class="px-10 py-10 border-b-2 border-border bg-gradient-to-r from-muted/30 to-muted/10">
                <div class="flex justify-between items-start">
                    <div class="flex-1 pr-8">
                        <!-- Título principal con mayor tamaño y prominencia -->
                        <h1 class="text-5xl font-bold text-foreground mb-4 leading-tight tracking-tight" style="font-family: var(--font-sans); color: var(--primary);">
                            ${project.title}
                        </h1>
                        <!-- Identificador secundario mejorado -->
                        <div class="flex items-center gap-4 mb-2">
                            <span class="text-xl text-muted-foreground font-mono font-bold px-5 py-3 bg-muted/60 rounded-full border-2 border-border">
                                <i class="fas fa-hashtag mr-2 text-primary"></i>
                                ${project.project_code || 'PROJ-' + String(project.id).padStart(3, '0')}
                            </span>
                            ${project.status ? `
                            <span class="px-4 py-2 rounded-full text-sm font-bold border-2" style="background-color: var(--primary); color: var(--primary-foreground); border-color: var(--primary);">
                                <i class="fas fa-flag mr-2"></i>${project.status}
                            </span>
                            ` : ''}
                        </div>
                    </div>
                    <!-- Botón de cierre mejorado con mejor accesibilidad -->
                    <button onclick="this.closest('.fixed').remove()" 
                            class="p-5 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-all duration-300 border-2 border-destructive/20 hover:border-destructive/40 hover:scale-110"
                            style="color: var(--destructive);" 
                            title="Cerrar modal">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Contenido principal con mejor espaciado y organización -->
            <div class="px-10 py-10 max-h-[calc(95vh-220px)] overflow-y-auto" style="background-color: var(--background);">
                <div class="space-y-16">
                    
                    <!-- Descripción con Mejor Jerarquía -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-file-alt mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Resumen del Proyecto
                        </h2>
                        <div class="bg-background p-8 rounded-xl border-l-6 border-primary shadow-sm">
                            <p class="text-foreground leading-relaxed text-xl" style="line-height: 1.8;">
                                ${project.abstract || `
                                <div class="text-center py-6">
                                    <i class="fas fa-file-text text-4xl text-muted-foreground mb-4 opacity-50"></i>
                                    <p class="text-muted-foreground text-lg" style="font-style: italic;">No hay descripción disponible para este proyecto</p>
                                </div>`}
                            </p>
                        </div>
                    </section>
                    
                    ${project.keywords ? `
                    <!-- Palabras Clave con Diseño Mejorado -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-tags mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Palabras Clave
                        </h2>
                        <div class="bg-background p-6 rounded-xl">
                            <div class="flex flex-wrap gap-4">
                                ${keywordTags}
                            </div>
                        </div>
                    </section>
                    ` : ''}
                    
                    ${project.introduction ? `
                    <!-- Introducción con Mejor Estructura -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-lightbulb mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Introducción
                        </h2>
                        <div class="bg-background p-8 rounded-xl">
                            <p class="text-foreground leading-relaxed text-xl" style="line-height: 1.8;">
                                ${project.introduction}
                            </p>
                        </div>
                    </section>
                    ` : ''}
                    
                    ${project.methodology ? `
                    <!-- Metodología con Diseño Prominente -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-cogs mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Metodología
                        </h2>
                        <div class="bg-background p-8 rounded-xl">
                            <p class="text-foreground leading-relaxed text-xl" style="line-height: 1.8;">
                                ${project.methodology}
                            </p>
                        </div>
                    </section>
                    ` : ''}
                    
                    <!-- Productos Asociados con Mejor Organización -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-cubes mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Productos de CTeI
                            ${project.products?.length ? `<span class="ml-4 px-4 py-2 text-lg bg-primary/20 text-primary rounded-full">${project.products.length}</span>` : ''}
                        </h2>
                        <div class="bg-background p-6 rounded-xl">
                            <div class="space-y-6">
                                ${productsList}
                            </div>
                        </div>
                    </section>
                    
                    <!-- Colaboradores con Diseño Mejorado -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-users mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Equipo de Colaboradores
                            ${project.collaborators?.length ? `<span class="ml-4 px-4 py-2 text-lg bg-primary/20 text-primary rounded-full">${project.collaborators.length}</span>` : ''}
                        </h2>
                        <div class="bg-background p-8 rounded-xl">
                            ${collaboratorsList}
                        </div>
                    </section>
                    
                </div>
            </div>
            
            <!-- Pie de página con metadata mejorada -->
            <div class="px-10 py-8 bg-gradient-to-r from-muted/30 to-muted/10 border-t-2 border-border">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                    <div class="flex flex-col space-y-4 text-muted-foreground">
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-user-tie mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div>
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Responsable</div>
                                <div class="text-lg font-semibold text-foreground">${project.owner_name}</div>
                            </div>
                        </div>
                        ${project.institution ? `
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-building mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div>
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Institución</div>
                                <div class="text-lg font-semibold text-foreground">${project.institution}</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col justify-end space-y-4 md:items-end text-muted-foreground">
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-calendar-plus mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div class="md:text-right">
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Fecha de Creación</div>
                                <div class="text-lg font-semibold text-foreground">${formatDate(project.created_at)}</div>
                            </div>
                        </div>
                        ${project.updated_at && project.updated_at !== project.created_at ? `
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-calendar-edit mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div class="md:text-right">
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Última Actualización</div>
                                <div class="text-lg font-semibold text-foreground">${formatDate(project.updated_at)}</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function showProductModal(product) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4';
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Autores y colaboradores con diseño mejorado y elegante
    const authorsList = product.authors?.map(author => `
        <div class="bg-card border-2 border-border rounded-xl p-6 mb-4 hover:bg-muted/10 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
            <div class="flex items-center justify-between">
                <div class="flex-1">
                    <button onclick="showCollaboratorDetails('${author.user_id}')" 
                            class="text-left hover:text-primary transition-colors duration-300 group">
                        <div class="flex items-center mb-2">
                            <i class="fas fa-user-circle mr-3 text-2xl text-primary p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors"></i>
                            <div>
                                <div class="font-bold text-foreground text-lg group-hover:text-primary transition-colors">${author.full_name}</div>
                                <div class="text-sm text-muted-foreground">${author.email}</div>
                            </div>
                        </div>
                    </button>
                    ${author.contribution_type ? `
                    <div class="mt-3 px-4 py-2 bg-muted/50 rounded-lg border border-border">
                        <div class="text-sm text-muted-foreground font-semibold">Tipo de Contribución</div>
                        <div class="text-base text-foreground">${author.contribution_type}</div>
                    </div>
                    ` : ''}
                </div>
                <div class="text-right ml-6">
                    <div class="inline-flex items-center px-4 py-3 text-base font-bold rounded-xl border-2"
                         style="background-color: var(--accent); color: var(--accent-foreground); border-color: var(--border);">
                        <i class="fas fa-medal mr-2"></i>
                        ${formatRole(author.author_role)}
                    </div>
                </div>
            </div>
        </div>
    `).join('') || `
    <div class="text-center py-12 bg-background rounded-xl border-2 border-dashed border-border">
        <div class="max-w-md mx-auto">
            <i class="fas fa-user-edit text-6xl text-muted-foreground mb-6 opacity-50"></i>
            <h3 class="text-xl font-semibold text-foreground mb-2">Sin Autores Registrados</h3>
            <p class="text-muted-foreground">Este producto aún no tiene autores o colaboradores registrados.</p>
        </div>
    </div>`;
    
    const typeColors = {
        'TOP': 'bg-chart-1 text-background',
        'A': 'bg-chart-2 text-background',
        'B': 'bg-chart-3 text-background',
        'ASC': 'bg-chart-4 text-background',
        'DPC': 'bg-chart-5 text-background',
        'FRH_A': 'bg-primary text-primary-foreground',
        'FRH_B': 'bg-accent text-accent-foreground'
    };
    
    // Determinar el nombre descriptivo del producto
    const productName = product.description || 
                       (product.category_name ? `${product.category_name}` : 'Producto Científico') ||
                       'Producto de CTeI';
    
    modal.innerHTML = `
        <div class="level-3 max-w-6xl w-full max-h-[95vh] overflow-hidden"
             style="background-color: var(--card); border: 2px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); font-family: var(--font-sans);">
            
            <!-- Encabezado Prominente Consistente con Projects -->
            <div class="px-10 py-10 border-b-2 border-border bg-gradient-to-r from-muted/30 to-muted/10">
                <div class="flex justify-between items-start">
                    <div class="flex-1 pr-8">
                        <!-- Título principal con mayor prominencia -->
                        <h1 class="text-4xl font-bold text-foreground mb-4 leading-tight tracking-tight" style="font-family: var(--font-sans); color: var(--primary);">
                            ${productName}
                        </h1>
                        <!-- Identificador y etiqueta mejorados -->
                        <div class="flex items-center gap-4 mb-2">
                            <span class="text-xl text-muted-foreground font-mono font-bold px-5 py-3 bg-muted/60 rounded-full border-2 border-border">
                                <i class="fas fa-barcode mr-2 text-primary"></i>
                                ${product.product_code}
                            </span>
                            ${createTechLabelWithTooltip(product.product_type, `inline-flex items-center px-4 py-3 text-base font-bold rounded-xl border-2 ${typeColors[product.product_type] || 'bg-muted text-muted-foreground border-border'}`)}
                        </div>
                    </div>
                    <!-- Botón de cierre mejorado consistente -->
                    <button onclick="this.closest('.fixed').remove()" 
                            class="p-5 rounded-full bg-destructive/10 hover:bg-destructive/20 transition-all duration-300 border-2 border-destructive/20 hover:border-destructive/40 hover:scale-110"
                            style="color: var(--destructive);"
                            title="Cerrar modal">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <!-- Contenido principal con mejor espaciado -->
            <div class="px-10 py-10 max-h-[calc(95vh-220px)] overflow-y-auto" style="background-color: var(--background);">
                <div class="space-y-16">
                    
                    <!-- Descripción con Diseño Mejorado -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-file-text mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Descripción del Producto
                        </h2>
                        <div class="bg-background p-8 rounded-xl border-l-6 border-primary shadow-sm">
                            <p class="text-foreground leading-relaxed text-xl" style="line-height: 1.8;">
                                ${product.description || `
                                <div class="text-center py-6">
                                    <i class="fas fa-file-alt text-4xl text-muted-foreground mb-4 opacity-50"></i>
                                    <p class="text-muted-foreground text-lg" style="font-style: italic;">Sin descripción disponible para este producto</p>
                                </div>`}
                            </p>
                        </div>
                    </section>
                    
                    ${product.category_description ? `
                    <!-- Categoría con Mejor Diseño -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-layer-group mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Categoría Científica
                        </h2>
                        <div class="bg-background p-8 rounded-xl">
                            <p class="text-foreground leading-relaxed text-xl" style="line-height: 1.8;">
                                ${product.category_description}
                            </p>
                        </div>
                    </section>
                    ` : ''}
                    
                    ${product.doi || product.url || product.journal ? `
                    <!-- Información de Publicación Mejorada -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-book-open mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Información de Publicación
                        </h2>
                        <div class="bg-background p-6 rounded-xl">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            ${product.journal ? `
                            <div class="flex items-start space-x-4 p-6 rounded-xl bg-card border-2 border-border shadow-sm">
                                <i class="fas fa-journal-whills text-primary text-2xl mt-1 p-3 bg-primary/10 rounded-lg"></i>
                                <div>
                                    <div class="font-bold text-foreground text-lg mb-1">Revista</div>
                                    <div class="text-muted-foreground text-base">${product.journal}</div>
                                </div>
                            </div>
                            ` : ''}
                            ${product.publication_date ? `
                            <div class="flex items-start space-x-4 p-6 rounded-xl bg-card border-2 border-border shadow-sm">
                                <i class="fas fa-calendar-alt text-primary text-2xl mt-1 p-3 bg-primary/10 rounded-lg"></i>
                                <div>
                                    <div class="font-bold text-foreground text-lg mb-1">Fecha de Publicación</div>
                                    <div class="text-muted-foreground text-base">${formatDate(product.publication_date)}</div>
                                </div>
                            </div>
                            ` : ''}
                            ${product.doi ? `
                            <div class="flex items-start space-x-4 p-6 rounded-xl bg-card border-2 border-border shadow-sm">
                                <i class="fas fa-fingerprint text-primary text-2xl mt-1 p-3 bg-primary/10 rounded-lg"></i>
                                <div>
                                    <div class="font-bold text-foreground text-lg mb-1">DOI (Identificador Digital)</div>
                                    <a href="https://doi.org/${product.doi}" target="_blank" 
                                       class="text-primary hover:text-primary-foreground hover:bg-primary px-3 py-2 rounded-lg font-semibold transition-all duration-300 border border-primary/30 hover:border-primary inline-block">
                                        <i class="fas fa-external-link-alt mr-2"></i>${product.doi}
                                    </a>
                                </div>
                            </div>
                            ` : ''}
                            ${product.url ? `
                            <div class="flex items-start space-x-4 p-6 rounded-xl bg-card border-2 border-border shadow-sm">
                                <i class="fas fa-globe text-primary text-2xl mt-1 p-3 bg-primary/10 rounded-lg"></i>
                                <div>
                                    <div class="font-bold text-foreground text-lg mb-1">Enlace Externo</div>
                                    <a href="${product.url}" target="_blank" 
                                       class="inline-flex items-center text-primary hover:text-primary-foreground hover:bg-primary px-4 py-3 rounded-lg font-semibold transition-all duration-300 border border-primary/30 hover:border-primary">
                                        <i class="fas fa-external-link-alt mr-2"></i>Visitar enlace externo
                                    </a>
                                </div>
                            </div>
                            ` : ''}
                            ${product.impact_factor ? `
                            <div class="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                                <i class="fas fa-star text-primary mt-1"></i>
                                <div>
                                    <div class="font-medium text-foreground">Factor de Impacto</div>
                                    <div class="text-muted-foreground font-semibold">${product.impact_factor}</div>
                                </div>
                            </div>
                            ` : ''}
                            ${product.citation_count ? `
                            <div class="flex items-start space-x-3 p-3 rounded-lg bg-muted/20">
                                <i class="fas fa-quote-right text-primary mt-1"></i>
                                <div>
                                    <div class="font-medium text-foreground">Citaciones</div>
                                    <div class="text-muted-foreground font-semibold">${product.citation_count}</div>
                                </div>
                            </div>
                            ` : ''}
                        </div>
                    </section>
                    ` : ''}
                    
                    ${product.project ? `
                    <!-- Proyecto Asociado con Diseño Mejorado -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-project-diagram mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Proyecto Asociado
                        </h2>
                        <div class="bg-background p-8 rounded-xl border-2 border-border hover:bg-muted/10 transition-all duration-300 hover:shadow-lg hover:border-primary/30 group">
                            <button onclick="viewProjectDetails(${product.project.id})" 
                                    class="text-left w-full hover:text-primary transition-colors duration-300 group">
                                <h3 class="text-2xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors">
                                    ${product.project.title}
                                    <i class="fas fa-external-link-alt ml-3 text-lg text-primary group-hover:scale-110 transition-transform"></i>
                                </h3>
                                <p class="text-muted-foreground leading-relaxed mb-6 text-lg" style="line-height: 1.7;">
                                    ${product.project.abstract || `<span style="font-style: italic;">Sin resumen disponible para este proyecto</span>`}
                                </p>
                            </button>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 border-t-2 border-border pt-6">
                                <div class="flex items-center bg-card px-4 py-3 rounded-lg border border-border">
                                    <i class="fas fa-user-tie mr-3 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                                    <div>
                                        <div class="text-sm text-muted-foreground font-semibold">Responsable</div>
                                        <div class="text-lg font-bold text-foreground">${product.project.owner_name}</div>
                                    </div>
                                </div>
                                <div class="flex items-center bg-card px-4 py-3 rounded-lg border border-border">
                                    <i class="fas fa-building mr-3 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                                    <div>
                                        <div class="text-sm text-muted-foreground font-semibold">Institución</div>
                                        <div class="text-lg font-bold text-foreground">${product.project.institution || 'Sin institución'}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    ` : ''}
                    
                    <!-- Autores y Colaboradores Mejorado -->
                    <section class="bg-card/50 p-8 rounded-xl border-2 border-border">
                        <h2 class="text-3xl font-bold text-foreground mb-8 flex items-center pb-4 border-b-2 border-border" style="font-family: var(--font-sans); color: var(--primary);">
                            <i class="fas fa-users mr-4 p-3 bg-primary/10 rounded-lg text-2xl" style="color: var(--primary);"></i>
                            Autores y Colaboradores
                            ${product.authors?.length ? `<span class="ml-4 px-4 py-2 text-lg bg-primary/20 text-primary rounded-full">${product.authors.length}</span>` : ''}
                        </h2>
                        <div class="bg-background p-8 rounded-xl">
                            ${authorsList}
                        </div>
                    </section>
                    
                </div>
            </div>
            
            <!-- Pie de página con metadata mejorada -->
            <div class="px-10 py-8 bg-gradient-to-r from-muted/30 to-muted/10 border-t-2 border-border">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                    <div class="flex flex-col space-y-4 text-muted-foreground">
                        ${product.creator_name ? `
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-user-plus mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div>
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Creado por</div>
                                <div class="text-lg font-semibold text-foreground">${product.creator_name}</div>
                            </div>
                        </div>
                        ` : ''}
                        ${product.last_editor_name ? `
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-edit mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div>
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Última Edición por</div>
                                <div class="text-lg font-semibold text-foreground">${product.last_editor_name}</div>
                            </div>
                        </div>
                        ` : ''}
                    </div>
                    <div class="flex flex-col justify-end space-y-4 md:items-end text-muted-foreground">
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-calendar-plus mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div class="md:text-right">
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Fecha de Creación</div>
                                <div class="text-lg font-semibold text-foreground">${formatDate(product.created_at)}</div>
                            </div>
                        </div>
                        <div class="flex items-center bg-background px-6 py-4 rounded-xl border border-border shadow-sm">
                            <i class="fas fa-calendar-edit mr-4 text-primary text-xl p-2 bg-primary/10 rounded-lg"></i>
                            <div class="md:text-right">
                                <div class="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Última Actualización</div>
                                <div class="text-lg font-semibold text-foreground">${formatDate(product.updated_at)}</div>
                            </div>
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

// ===== FUNCIONES AUXILIARES PARA MODALES REDISEÑADOS =====

// Función para mostrar detalles de colaborador (placeholder)
function showCollaboratorDetails(collaboratorId) {
    showToast('Función de colaboradores próximamente disponible', 'info');
    console.log('Mostrar detalles del colaborador:', collaboratorId);
    // TODO: Implementar modal de detalles de colaborador
}

// Función para navegar a proyecto desde producto
// 🎯 NUEVA FUNCIONALIDAD: Navegación directa a páginas dedicadas
async function viewProjectFromProduct(projectId) {
    // Navegar directamente a la página dedicada del proyecto
    window.location.href = `/proyecto/${projectId}`;
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

// Función de búsqueda desde el hero
function performHeroSearch() {
    const heroSearchInput = document.getElementById('heroSearchInput');
    if (heroSearchInput) {
        const query = heroSearchInput.value.trim();
        
        // Trasladar búsqueda al input principal
        const mainSearchInput = document.getElementById('searchInput');
        if (mainSearchInput) {
            mainSearchInput.value = query;
        }
        
        // Actualizar estado y realizar búsqueda
        AppState.searchQuery = query;
        AppState.searchFilters = {};
        AppState.currentPage = 1;
        AppState.currentProductPage = 1;
        
        // Scroll hacia la sección de contenido
        document.getElementById('content-section').scrollIntoView({behavior: 'smooth'});
        
        // Realizar búsqueda después del scroll
        setTimeout(() => {
            loadProjects(1, query);
            loadProducts(1, query);
            
            if (query) {
                showToast(`Buscando: "${query}"`);
            }
        }, 300);
    }
}

// 🎯 NUEVA FUNCIONALIDAD: Pill Toggle Filters (Talla Mundial)
function setActiveFilter(type, clickedButton) {
    // Remover clase activa de todos los botones
    document.querySelectorAll('.ctei-pill-toggle').forEach(btn => {
        btn.classList.remove('ctei-pill-toggle--active');
    });
    
    // Añadir clase activa al botón clickeado
    clickedButton.classList.add('ctei-pill-toggle--active');
    
    // Aplicar filtro usando la función existente
    if (type !== 'all') {
        performQuickFilter(type);
    } else {
        // Limpiar filtros si es "Todo"
        const typeFilter = document.getElementById('typeFilter');
        if (typeFilter) {
            typeFilter.value = '';
        }
        performSearch();
    }
}

// Función para filtros rápidos desde el hero (función original mantenida)
function performQuickFilter(type) {
    // Actualizar filtro de tipo
    const typeFilter = document.getElementById('typeFilter');
    if (typeFilter) {
        typeFilter.value = type;
        
        // Mostrar los filtros avanzados
        const advancedFilters = document.getElementById('advancedFilters');
        const toggleButton = document.getElementById('filtersToggle');
        if (advancedFilters && advancedFilters.classList.contains('hidden')) {
            advancedFilters.classList.remove('hidden');
            toggleButton.innerHTML = '<i class="fas fa-filter mr-2"></i>Ocultar Filtros';
        }
    }
    
    // Scroll hacia la sección de contenido
    document.getElementById('content-section').scrollIntoView({behavior: 'smooth'});
    
    // Realizar búsqueda con filtro después del scroll
    setTimeout(() => {
        performSearch();
        
        const typeNames = {
            'projects': 'Solo Proyectos',
            'products': 'Solo Productos',
            'investigators': 'Investigadores'
        };
        showToast(`Filtro aplicado: ${typeNames[type]}`);
    }, 300);
}

// Función de utilidad para scroll suave a sección
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({behavior: 'smooth'});
    }
}

// ===== MODO OSCURO - TOGGLE FUNCIONALIDAD =====

// Inicializar modo oscuro desde localStorage
function initializeTheme() {
    const savedTheme = localStorage.getItem('ctei_theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // FORZAR MODO OSCURO POR DEFECTO - Aplicar tema guardado o modo oscuro por defecto
    const isDark = savedTheme === 'dark' || (savedTheme === null && true); // Cambié systemPreference por true
    
    if (isDark) {
        document.documentElement.classList.add('dark');
        updateThemeIcon(true);
        // Guardar preferencia si no existe
        if (savedTheme === null) {
            localStorage.setItem('ctei_theme', 'dark');
        }
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon(false);
    }
}

// Alternar modo oscuro
function toggleTheme() {
    const isDark = document.documentElement.classList.contains('dark');
    
    if (isDark) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('ctei_theme', 'light');
        updateThemeIcon(false);
        showToast('Modo claro activado');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('ctei_theme', 'dark');
        updateThemeIcon(true);
        showToast('Modo oscuro activado');
    }
}

// Actualizar icono del toggle
function updateThemeIcon(isDark) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = isDark ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Animaciones mejoradas para las estadísticas
function animateStatNumbers() {
    const statNumbers = document.querySelectorAll('.ctei-count-up');
    
    statNumbers.forEach(element => {
        const finalValue = parseInt(element.textContent) || 0;
        let currentValue = 0;
        const increment = Math.ceil(finalValue / 30); // 30 frames para la animación
        
        const timer = setInterval(() => {
            currentValue += increment;
            if (currentValue >= finalValue) {
                currentValue = finalValue;
                clearInterval(timer);
            }
            element.textContent = currentValue;
        }, 50); // 50ms entre frames
    });
}

// Event listener para búsqueda con Enter
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM cargado, inicializando aplicación...');
    console.log('🔍 Verificando dependencias:', {
        axios: typeof axios,
        API_BASE: API_BASE,
        localStorage: typeof localStorage,
        document: typeof document
    });
    
    // Event listeners para inputs de búsqueda
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
    
    const heroSearchInput = document.getElementById('heroSearchInput');
    if (heroSearchInput) {
        heroSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performHeroSearch();
            }
        });
    }
    
    // Configurar event listener para el formulario de login estático
    const staticLoginForm = document.getElementById('staticLoginForm');
    if (staticLoginForm) {
        staticLoginForm.addEventListener('submit', handleLoginSubmit);
        console.log('✅ Event listener configurado para formulario estático de login');
    }
    
    // Inicializar modo oscuro
    initializeTheme();
    
    // Configurar toggle de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('✅ Theme toggle configurado');
    }
    
    // Cargar datos iniciales
    loadPublicStats();
    loadProjects();
    loadProducts();
    
    // Verificar si el usuario está autenticado
    checkAuthenticationStatus();
    
    // Animar estadísticas después de cargar
    setTimeout(() => {
        animateStatNumbers();
    }, 500);
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
        const response = await axios.get(`${API_BASE}/private/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.data.success) {
            const user = response.data.data;
            showAuthenticatedButtons(user);
            
            // Mostrar mensaje de bienvenida si viene del dashboard
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get('from') === 'dashboard') {
                setTimeout(() => {
                    showToast(`¡Bienvenido de vuelta, ${user.full_name}! Tu sesión sigue activa.`);
                }, 500);
            }
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
    try {
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
        
        console.log('✅ showAuthenticatedButtons completed successfully');
        
    } catch (error) {
        console.warn('⚠️ Error in showAuthenticatedButtons:', error);
        // No fallar completamente si hay error en la UI
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

// Las funciones de login están implementadas correctamente más arriba

// La función de registro está implementada correctamente más abajo

// ===== GESTIÓN DE MODALES =====

function showLoginModal() {
    // Remover modal existente si existe
    const existingModal = document.getElementById('loginModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4';
    modal.id = 'loginModal';
    modal.onclick = (e) => {
        if (e.target === modal) closeLoginModal();
    };
    
    modal.innerHTML = `
        <div class="level-3 max-w-md w-full">
            <div class="p-6">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold" style="color: var(--popover-foreground); font-family: var(--font-sans);">Iniciar Sesión</h3>
                    <button onclick="closeLoginModal()" style="color: var(--muted-foreground);" class="hover:opacity-80">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="loginForm">
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Email</label>
                        <input 
                            type="email" 
                            id="loginEmail" 
                            required
                            class="ctei-search-input"
                            placeholder="tu@email.com"
                            autocomplete="email"
                        >
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2" style="color: var(--popover-foreground); font-family: var(--font-sans);">Contraseña</label>
                        <input 
                            type="password" 
                            id="loginPassword" 
                            required
                            class="ctei-search-input"
                            placeholder="Tu contraseña"
                            autocomplete="current-password"
                        >
                    </div>
                    <button 
                        type="submit" 
                        class="ctei-btn-primary w-full"
                    >
                        <i class="fas fa-sign-in-alt"></i>
                        Ingresar
                    </button>
                </form>
                <div class="mt-4 text-center">
                    <button 
                        onclick="closeLoginModal(); showRegisterModal();" 
                        class="ctei-project-card-link text-sm"
                    >
                        ¿No tienes cuenta? Regístrate aquí
                    </button>
                </div>
                
                <!-- Botón de debug para testing -->
                <div class="mt-4 pt-4" style="border-top: 1px solid var(--border);">
                    <button 
                        onclick="testQuickLogin()" 
                        class="ctei-btn-secondary w-full text-sm"
                        style="background-color: var(--chart-4); color: var(--background);"
                        title="Login rápido para testing"
                    >
                        🧪 Test: María López
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar event listener para el formulario (técnica del login limpio)
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    
    // Focus en el campo email
    setTimeout(() => {
        const emailInput = document.getElementById('loginEmail');
        if (emailInput) emailInput.focus();
    }, 100);
}

function closeLoginModal() {
    try {
        const modal = document.getElementById('loginModal');
        if (modal) {
            modal.remove();
            console.log('✅ Login modal closed successfully');
        } else {
            console.log('ℹ️ Login modal not found (already closed?)');
        }
    } catch (error) {
        console.warn('⚠️ Error closing login modal:', error);
    }
}

function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4';
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
                            class="w-full px-3 py-2 bg-input text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Tu nombre completo"
                        >
                    </div>
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Email</label>
                        <input 
                            type="email" 
                            id="registerEmail" 
                            required
                            class="w-full px-3 py-2 bg-input text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="tu@email.com"
                        >
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium mb-2">Contraseña</label>
                        <input 
                            type="password" 
                            id="registerPassword" 
                            required
                            class="w-full px-3 py-2 bg-input text-foreground border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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



// Manejar envío de formulario de login - VERSIÓN MEJORADA CON ANTI-INTERFERENCIA
async function handleLoginSubmit(event) {
    // Prevenir comportamientos por defecto y propagación de eventos (técnica del login limpio)
    if (event) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
    }
    
    try {
        // Verificar que los elementos existen
        const emailElement = document.getElementById('loginEmail');
        const passwordElement = document.getElementById('loginPassword');
        
        if (!emailElement || !passwordElement) {
            showToast('Error: No se encontraron los campos de login', 'error');
            return;
        }
        
        // Limpiar y validar datos
        const email = emailElement.value.trim();
        const password = passwordElement.value;
        
        if (!email || !password) {
            showToast('Por favor ingresa email y contraseña', 'error');
            if (!email && emailElement) emailElement.focus();
            else if (!password && passwordElement) passwordElement.focus();
            return;
        }
        
        // Verificar axios
        if (typeof axios === 'undefined') {
            showToast('Error: Sistema de comunicación no disponible', 'error');
            return;
        }
        
        // Enviar request
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: email,
            password: password
        });
        
        if (response.data && response.data.success) {
            const { token, user } = response.data.data;
            
            // Guardar token
            try {
                localStorage.setItem('ctei_token', token);
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            } catch (storageError) {
                console.warn('Error guardando token:', storageError);
            }
            
            // Actualizar estado global
            AppState.token = token;
            AppState.user = user;
            AppState.isAuthenticated = true;
            
            // Cerrar modal
            try {
                closeLoginModal();
            } catch (modalError) {
                console.warn('Error cerrando modal:', modalError);
            }
            
            // Mostrar mensaje de éxito
            showToast(`¡Bienvenido ${user.full_name}!`);
            
            // Redirigir inmediatamente para evitar interferencias (técnica del login limpio)
            window.location.href = '/dashboard';
            
        } else {
            const errorMsg = (response.data && response.data.error) || 'Error desconocido';
            showToast(errorMsg, 'error');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        
        let errorMessage = 'Error de conexión';
        if (error.response && error.response.data && error.response.data.error) {
            errorMessage = error.response.data.error;
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showToast(errorMessage, 'error');
    }
}

// Función de debugging para login
window.debugLogin = function() {
    console.log('🔧 DEBUG LOGIN - Estado actual:');
    
    const emailElement = document.getElementById('loginEmail');
    const passwordElement = document.getElementById('loginPassword');
    
    console.log('Elementos:', {
        emailElement: !!emailElement,
        passwordElement: !!passwordElement,
        emailValue: emailElement?.value,
        passwordValue: passwordElement?.value ? 'HAS_PASSWORD' : 'EMPTY',
        emailLength: emailElement?.value?.length,
        passwordLength: passwordElement?.value?.length
    });
    
    if (emailElement && passwordElement) {
        console.log('Valores exactos:');
        console.log('Email:', JSON.stringify(emailElement.value));
        console.log('Password:', passwordElement.value ? 'HAS_VALUE' : 'EMPTY');
        
        // Intentar login directo
        handleLoginSubmit({
            preventDefault: () => {},
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
        });
    }
};

// Función de prueba de login rápida
window.testLogin = function(email = 'investigador.test@choco.gov.co', password = 'test123') {
    console.log('🧪 TEST LOGIN con:', email);
    
    const emailEl = document.getElementById('loginEmail');
    const passwordEl = document.getElementById('loginPassword');
    
    if (emailEl && passwordEl) {
        emailEl.value = email;
        passwordEl.value = password;
        
        console.log('Valores establecidos, ejecutando handleLoginSubmit...');
        handleLoginSubmit({
            preventDefault: () => {},
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
        });
    } else {
        console.error('Elementos de login no encontrados');
    }
};

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

// Función de test directo para debugging
async function testDirectLogin() {
    console.log('🔧 === TEST DIRECT LOGIN ===');
    console.log('Estado inicial:', {
        axiosExists: typeof axios !== 'undefined',
        API_BASE: API_BASE,
        location: window.location.href
    });
    
    try {
        const response = await axios.post(`${API_BASE}/auth/login`, {
            email: 'admin@ctei.edu.co',
            password: 'test123'
        });
        
        console.log('✅ Respuesta exitosa:', response.data);
        
        if (response.data.success) {
            const { token, user } = response.data.data;
            
            // Guardar token
            localStorage.setItem('ctei_token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            alert(`¡Test Login Exitoso!\nUsuario: ${user.full_name}\nRol: ${user.role}\n\n¿Ir al dashboard?`);
            
            if (confirm('¿Redirigir al dashboard?')) {
                window.location.href = '/dashboard';
            }
        } else {
            alert('Test Login Falló: ' + response.data.error);
        }
        
    } catch (error) {
        console.error('❌ Error en test login:', error);
        alert('Error en test: ' + (error.response?.data?.error || error.message));
    }
}

// Función de test rápido para María López
function testQuickLogin() {
    const emailElement = document.getElementById('loginEmail');
    const passwordElement = document.getElementById('loginPassword');
    
    if (emailElement && passwordElement) {
        emailElement.value = 'maria.lopez@ctei.edu.co';
        passwordElement.value = 'test123';
        
        // Ejecutar el login
        handleLoginSubmit({
            preventDefault: () => {},
            stopPropagation: () => {},
            stopImmediatePropagation: () => {}
        });
    } else {
        showToast('Error: Campos de login no encontrados', 'error');
    }
}

// ========================================
//  FUNCIONALIDAD DE TEMA OSCURO
// ========================================

// Estado del tema
let isDarkMode = localStorage.getItem('theme') === 'dark' || 
    (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

// Aplicar tema inicial
function applyTheme() {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        updateThemeIcon('sun');
    } else {
        document.documentElement.classList.remove('dark');
        updateThemeIcon('moon');
    }
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
}

// Actualizar icono del botón de tema
function updateThemeIcon(icon) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.className = icon === 'sun' ? 'fas fa-sun' : 'fas fa-moon';
    }
}

// Toggle del tema
function toggleTheme() {
    isDarkMode = !isDarkMode;
    applyTheme();
    console.log('🎨 Tema cambiado a:', isDarkMode ? 'oscuro' : 'claro');
}

// Inicializar tema cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    // Aplicar tema inicial
    applyTheme();
    
    // Configurar botón de toggle de tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        console.log('🎨 Botón de tema configurado');
    }
    
    // Escuchar cambios en las preferencias del sistema
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            isDarkMode = e.matches;
            applyTheme();
            console.log('🎨 Tema actualizado por preferencias del sistema:', isDarkMode ? 'oscuro' : 'claro');
        }
    });
});

// Exportar funciones para uso global
window.toggleTheme = toggleTheme;
window.applyTheme = applyTheme;
