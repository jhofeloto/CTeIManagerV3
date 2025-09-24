// CODECTI Platform - Portal Público Frontend
// HU-08: Portal Público de Proyectos CTeI

const PublicPortal = {
  currentPage: 1,
  totalPages: 1,
  currentFilters: {
    search: '',
    status: '',
    area: '',
    institution: '',
    sort: 'created_at',
    order: 'desc'
  },
  
  // Initialize public portal
  init() {
    console.log('Initializing Public Portal...');
    this.setupEventListeners();
    this.loadPublicProjects();
    this.loadPublicStats();
  },

  // Setup event listeners for public portal
  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('publicSearch');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentFilters.search = e.target.value;
          this.currentPage = 1;
          this.loadPublicProjects();
        }, 500);
      });
    }

    // Filter controls
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentFilters.status = e.target.value;
        this.currentPage = 1;
        this.loadPublicProjects();
      });
    }

    const areaFilter = document.getElementById('areaFilter');
    if (areaFilter) {
      areaFilter.addEventListener('change', (e) => {
        this.currentFilters.area = e.target.value;
        this.currentPage = 1;
        this.loadPublicProjects();
      });
    }

    const institutionFilter = document.getElementById('institutionFilter');
    if (institutionFilter) {
      institutionFilter.addEventListener('change', (e) => {
        this.currentFilters.institution = e.target.value;
        this.currentPage = 1;
        this.loadPublicProjects();
      });
    }

    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        const [sort, order] = e.target.value.split('-');
        this.currentFilters.sort = sort;
        this.currentFilters.order = order;
        this.currentPage = 1;
        this.loadPublicProjects();
      });
    }

    // Clear filters button
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  },

  // Load public projects from API
  async loadPublicProjects() {
    try {
      const params = new URLSearchParams({
        page: this.currentPage.toString(),
        limit: '12',
        ...Object.fromEntries(
          Object.entries(this.currentFilters).filter(([key, value]) => value !== '')
        )
      });

      console.log('Loading public projects with params:', params.toString());

      const response = await axios.get(`/api/public/projects?${params}`);
      
      if (response.data.success) {
        this.renderPublicProjects(response.data.projects);
        this.renderPagination(response.data);
        this.updateResultsInfo(response.data);
      } else {
        this.showError('Error al cargar los proyectos públicos');
      }
    } catch (error) {
      console.error('Error loading public projects:', error);
      this.showError('Error de conexión al cargar proyectos');
    }
  },

  // Load public statistics
  async loadPublicStats() {
    try {
      const response = await axios.get('/api/public/stats');
      
      if (response.data.success) {
        this.renderPublicStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error loading public stats:', error);
    }
  },

  // Render public projects grid
  renderPublicProjects(projects) {
    const container = document.getElementById('publicProjectsGrid');
    if (!container) return;

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <div class="text-gray-500">
            <i class="fas fa-search text-4xl mb-4"></i>
            <h3 class="text-xl font-semibold mb-2">No se encontraron proyectos</h3>
            <p>No hay proyectos que coincidan con los filtros seleccionados.</p>
            <button onclick="PublicPortal.clearFilters()" class="mt-4 btn btn-primary">
              Limpiar filtros
            </button>
          </div>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(project => `
      <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <!-- Project Header -->
        <div class="p-6 border-b border-gray-100">
          <div class="flex items-start justify-between mb-3">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadgeClass(project.status)}">
              ${this.getStatusText(project.status)}
            </span>
            <div class="text-sm text-gray-500">
              <i class="fas fa-calendar mr-1"></i>
              ${new Date(project.startDate).getFullYear()}
            </div>
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            ${this.escapeHtml(project.title)}
          </h3>
          <p class="text-sm text-gray-600 line-clamp-3">
            ${this.escapeHtml(project.summary)}
          </p>
        </div>

        <!-- Project Details -->
        <div class="p-6">
          <div class="space-y-3">
            <!-- Institution -->
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-university w-4 mr-2"></i>
              <span class="truncate">${this.escapeHtml(project.institution || 'No especificada')}</span>
            </div>
            
            <!-- Research Area -->
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-flask w-4 mr-2"></i>
              <span class="truncate">${this.escapeHtml(project.researchArea || 'No especificada')}</span>
            </div>
            
            <!-- Responsible -->
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-user w-4 mr-2"></i>
              <span class="truncate">${this.escapeHtml(project.responsibleName || 'No especificado')}</span>
            </div>

            <!-- Budget -->
            ${project.budget > 0 ? `
              <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-dollar-sign w-4 mr-2"></i>
                <span>$${this.formatCurrency(project.budget)}</span>
              </div>
            ` : ''}

            <!-- Keywords -->
            ${project.keywords && project.keywords.length > 0 ? `
              <div class="flex flex-wrap gap-1 mt-3">
                ${project.keywords.slice(0, 3).map(keyword => `
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-50 text-blue-700">
                    ${this.escapeHtml(keyword)}
                  </span>
                `).join('')}
                ${project.keywords.length > 3 ? `
                  <span class="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-50 text-gray-500">
                    +${project.keywords.length - 3} más
                  </span>
                ` : ''}
              </div>
            ` : ''}
          </div>

          <!-- Actions -->
          <div class="mt-6 flex justify-between items-center">
            <button 
              onclick="PublicPortal.viewProjectDetails(${project.id})"
              class="btn btn-primary btn-sm"
            >
              <i class="fas fa-eye mr-1"></i>
              Ver Detalles
            </button>
            <div class="text-xs text-gray-400">
              Actualizado ${this.formatDate(project.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  },

  // Render pagination controls
  renderPagination(data) {
    const container = document.getElementById('publicPagination');
    if (!container) return;

    this.totalPages = data.totalPages;
    this.currentPage = data.page;

    if (this.totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    let paginationHTML = `
      <div class="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg">
        <div class="flex justify-between flex-1 sm:hidden">
          ${data.hasPrev ? `
            <button onclick="PublicPortal.goToPage(${this.currentPage - 1})" class="btn btn-secondary btn-sm">
              Anterior
            </button>
          ` : `
            <span class="btn btn-secondary btn-sm opacity-50 cursor-not-allowed">Anterior</span>
          `}
          ${data.hasNext ? `
            <button onclick="PublicPortal.goToPage(${this.currentPage + 1})" class="btn btn-secondary btn-sm ml-3">
              Siguiente
            </button>
          ` : `
            <span class="btn btn-secondary btn-sm ml-3 opacity-50 cursor-not-allowed">Siguiente</span>
          `}
        </div>
        
        <div class="hidden sm:flex sm:items-center sm:justify-between w-full">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando 
              <span class="font-medium">${((this.currentPage - 1) * 12) + 1}</span>
              a 
              <span class="font-medium">${Math.min(this.currentPage * 12, data.total)}</span>
              de 
              <span class="font-medium">${data.total}</span>
              resultados
            </p>
          </div>
          <div>
            <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
              ${data.hasPrev ? `
                <button onclick="PublicPortal.goToPage(${this.currentPage - 1})" class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                  <i class="fas fa-chevron-left"></i>
                </button>
              ` : ''}
              
              ${Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                const page = startPage + i;
                return `
                  <button 
                    onclick="PublicPortal.goToPage(${page})"
                    class="relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                      page === this.currentPage
                        ? 'bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                        : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                    }"
                  >
                    ${page}
                  </button>
                `;
              }).join('')}
              
              ${data.hasNext ? `
                <button onclick="PublicPortal.goToPage(${this.currentPage + 1})" class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0">
                  <i class="fas fa-chevron-right"></i>
                </button>
              ` : ''}
            </nav>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = paginationHTML;
  },

  // Render public statistics
  renderPublicStats(stats) {
    const container = document.getElementById('publicStatsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-6">
          <i class="fas fa-chart-bar mr-2 text-blue-600"></i>
          Estadísticas del Ecosistema CTeI Chocó
        </h2>
        
        <!-- Overview Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div class="text-center p-4 bg-blue-50 rounded-lg">
            <div class="text-2xl font-bold text-blue-600">${stats.overview.totalProjects}</div>
            <div class="text-sm text-gray-600">Proyectos Total</div>
          </div>
          <div class="text-center p-4 bg-green-50 rounded-lg">
            <div class="text-2xl font-bold text-green-600">${stats.overview.activeProjects}</div>
            <div class="text-sm text-gray-600">Proyectos Activos</div>
          </div>
          <div class="text-center p-4 bg-purple-50 rounded-lg">
            <div class="text-2xl font-bold text-purple-600">${stats.overview.completedProjects}</div>
            <div class="text-sm text-gray-600">Completados</div>
          </div>
          <div class="text-center p-4 bg-orange-50 rounded-lg">
            <div class="text-2xl font-bold text-orange-600">${stats.overview.totalResearchers}</div>
            <div class="text-sm text-gray-600">Investigadores</div>
          </div>
        </div>

        <div class="grid md:grid-cols-2 gap-8">
          <!-- Research Areas -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Áreas de Investigación</h3>
            <div class="space-y-3">
              ${stats.breakdown.byResearchArea.slice(0, 5).map(area => `
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                    <span class="text-sm text-gray-700 truncate">${this.escapeHtml(area.research_area)}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">${area.count}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Top Institutions -->
          <div>
            <h3 class="text-lg font-medium text-gray-900 mb-4">Principales Instituciones</h3>
            <div class="space-y-3">
              ${stats.breakdown.byInstitution.slice(0, 5).map(inst => `
                <div class="flex items-center justify-between">
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span class="text-sm text-gray-700 truncate">${this.escapeHtml(inst.institution)}</span>
                  </div>
                  <span class="text-sm font-medium text-gray-900">${inst.count}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        ${stats.overview.totalBudget > 0 ? `
          <div class="mt-6 pt-6 border-t border-gray-200">
            <div class="text-center">
              <div class="text-sm text-gray-600">Inversión Total en CTeI</div>
              <div class="text-2xl font-bold text-green-600">$${this.formatCurrency(stats.overview.totalBudget)}</div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  },

  // Update results information
  updateResultsInfo(data) {
    const container = document.getElementById('resultsInfo');
    if (!container) return;

    container.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-600">
          ${data.total} proyecto${data.total !== 1 ? 's' : ''} encontrado${data.total !== 1 ? 's' : ''}
        </div>
        <div class="text-sm text-gray-500">
          Página ${data.page} de ${data.totalPages}
        </div>
      </div>
    `;
  },

  // View project details
  async viewProjectDetails(projectId) {
    try {
      const response = await axios.get(`/api/public/projects/${projectId}`);
      
      if (response.data.success) {
        this.showProjectModal(response.data.project);
      } else {
        this.showError('No se pudo cargar los detalles del proyecto');
      }
    } catch (error) {
      console.error('Error loading project details:', error);
      this.showError('Error al cargar los detalles del proyecto');
    }
  },

  // Show project details modal
  showProjectModal(project) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-semibold text-gray-900">Detalles del Proyecto</h2>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>

        <!-- Modal Content -->
        <div class="p-6 space-y-6">
          <!-- Project Header -->
          <div>
            <div class="flex items-center justify-between mb-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${this.getStatusBadgeClass(project.status)}">
                ${this.getStatusText(project.status)}
              </span>
              <div class="text-sm text-gray-500">
                <i class="fas fa-calendar mr-1"></i>
                ${this.formatDate(project.startDate)} - ${this.formatDate(project.endDate)}
              </div>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 mb-4">${this.escapeHtml(project.title)}</h1>
            <p class="text-lg text-gray-700 mb-6">${this.escapeHtml(project.summary)}</p>
          </div>

          <!-- Project Info Grid -->
          <div class="grid md:grid-cols-2 gap-6">
            <div class="space-y-4">
              <div>
                <h3 class="font-medium text-gray-900 mb-2">
                  <i class="fas fa-university mr-2 text-blue-600"></i>
                  Institución
                </h3>
                <p class="text-gray-700">${this.escapeHtml(project.institution || 'No especificada')}</p>
              </div>
              
              <div>
                <h3 class="font-medium text-gray-900 mb-2">
                  <i class="fas fa-user mr-2 text-blue-600"></i>
                  Investigador Responsable
                </h3>
                <p class="text-gray-700">${this.escapeHtml(project.responsibleName || 'No especificado')}</p>
              </div>

              <div>
                <h3 class="font-medium text-gray-900 mb-2">
                  <i class="fas fa-flask mr-2 text-blue-600"></i>
                  Área de Investigación
                </h3>
                <p class="text-gray-700">${this.escapeHtml(project.researchArea || 'No especificada')}</p>
              </div>

              ${project.budget > 0 ? `
                <div>
                  <h3 class="font-medium text-gray-900 mb-2">
                    <i class="fas fa-dollar-sign mr-2 text-blue-600"></i>
                    Presupuesto
                  </h3>
                  <p class="text-gray-700">$${this.formatCurrency(project.budget)}</p>
                </div>
              ` : ''}
            </div>

            <div class="space-y-4">
              ${project.description ? `
                <div>
                  <h3 class="font-medium text-gray-900 mb-2">
                    <i class="fas fa-align-left mr-2 text-blue-600"></i>
                    Descripción
                  </h3>
                  <p class="text-gray-700 text-sm leading-relaxed">${this.escapeHtml(project.description)}</p>
                </div>
              ` : ''}

              ${project.objectives ? `
                <div>
                  <h3 class="font-medium text-gray-900 mb-2">
                    <i class="fas fa-bullseye mr-2 text-blue-600"></i>
                    Objetivos
                  </h3>
                  <p class="text-gray-700 text-sm leading-relaxed">${this.escapeHtml(project.objectives)}</p>
                </div>
              ` : ''}

              ${project.expectedResults ? `
                <div>
                  <h3 class="font-medium text-gray-900 mb-2">
                    <i class="fas fa-trophy mr-2 text-blue-600"></i>
                    Resultados Esperados
                  </h3>
                  <p class="text-gray-700 text-sm leading-relaxed">${this.escapeHtml(project.expectedResults)}</p>
                </div>
              ` : ''}
            </div>
          </div>

          <!-- Keywords -->
          ${project.keywords && project.keywords.length > 0 ? `
            <div>
              <h3 class="font-medium text-gray-900 mb-3">
                <i class="fas fa-tags mr-2 text-blue-600"></i>
                Palabras Clave
              </h3>
              <div class="flex flex-wrap gap-2">
                ${project.keywords.map(keyword => `
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700">
                    ${this.escapeHtml(keyword)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Methodology -->
          ${project.methodology ? `
            <div>
              <h3 class="font-medium text-gray-900 mb-2">
                <i class="fas fa-cogs mr-2 text-blue-600"></i>
                Metodología
              </h3>
              <p class="text-gray-700 text-sm leading-relaxed">${this.escapeHtml(project.methodology)}</p>
            </div>
          ` : ''}
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div class="text-sm text-gray-500">
            <i class="fas fa-clock mr-1"></i>
            Última actualización: ${this.formatDate(project.updatedAt)}
          </div>
          <button onclick="this.closest('.fixed').remove()" class="btn btn-secondary">
            Cerrar
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  // Navigation functions
  goToPage(page) {
    this.currentPage = page;
    this.loadPublicProjects();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // Clear all filters
  clearFilters() {
    // Reset filters
    this.currentFilters = {
      search: '',
      status: '',
      area: '',
      institution: '',
      sort: 'created_at',
      order: 'desc'
    };
    this.currentPage = 1;

    // Reset form inputs
    const searchInput = document.getElementById('publicSearch');
    if (searchInput) searchInput.value = '';
    
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) statusFilter.value = '';
    
    const areaFilter = document.getElementById('areaFilter');
    if (areaFilter) areaFilter.value = '';
    
    const institutionFilter = document.getElementById('institutionFilter');
    if (institutionFilter) institutionFilter.value = '';
    
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) sortSelect.value = 'created_at-desc';

    // Reload projects
    this.loadPublicProjects();
  },

  // Utility functions
  getStatusBadgeClass(status) {
    const classes = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800',
      'planning': 'bg-yellow-100 text-yellow-800',
      'paused': 'bg-red-100 text-red-800'
    };
    return classes[status] || 'bg-gray-100 text-gray-800';
  },

  getStatusText(status) {
    const texts = {
      'active': 'Activo',
      'completed': 'Completado',
      'planning': 'En Planificación',
      'paused': 'Pausado'
    };
    return texts[status] || status;
  },

  formatCurrency(amount) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(amount);
  },

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showError(message) {
    // Simple error notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md shadow-lg z-50';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }
};

// Export for global access
window.PublicPortal = PublicPortal;