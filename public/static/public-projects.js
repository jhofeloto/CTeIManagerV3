// CODECTI Platform - Public Projects Portal
// HU-08: Portal Público de Proyectos CTeI

const PublicProjects = {
  currentPage: 1,
  totalPages: 1,
  projects: [],
  stats: {},
  filters: {
    search: '',
    area: '',
    status: '',
    sort: 'created_at',
    order: 'desc'
  },

  // Initialize the public portal
  async init() {
    console.log('Initializing Public Projects Portal...');
    
    await this.loadStats();
    await this.loadProjects();
    this.setupEventListeners();
    
    // Initialize logos
    if (typeof LogoManager !== 'undefined') {
      await LogoManager.init();
    }
  },

  // Setup event listeners for filters and search
  setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.currentPage = 1;
          this.loadProjects();
        }, 500);
      });
    }

    // Area filter
    const areaFilter = document.getElementById('areaFilter');
    if (areaFilter) {
      areaFilter.addEventListener('change', (e) => {
        this.filters.area = e.target.value;
        this.currentPage = 1;
        this.loadProjects();
      });
    }

    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.filters.status = e.target.value;
        this.currentPage = 1;
        this.loadProjects();
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sortSelect');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.filters.sort = e.target.value;
        this.currentPage = 1;
        this.loadProjects();
      });
    }
  },

  // Load public statistics
  async loadStats() {
    try {
      console.log('Loading public statistics...');
      const response = await axios.get('/api/public/stats');
      
      if (response.data.success) {
        this.stats = response.data.stats;
        this.renderStats();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      this.renderStatsError();
    }
  },

  // Load projects with current filters
  async loadProjects() {
    try {
      console.log('Loading projects with filters:', this.filters);
      
      // Show loading spinner
      this.showLoading();

      const params = new URLSearchParams({
        page: this.currentPage.toString(),
        limit: '12',
        ...this.filters
      });

      // Remove empty filters
      Object.keys(this.filters).forEach(key => {
        if (!this.filters[key]) {
          params.delete(key);
        }
      });

      const response = await axios.get(`/api/public/projects?${params}`);
      
      if (response.data.success) {
        this.projects = response.data.projects;
        this.totalPages = response.data.totalPages;
        this.renderProjects();
        this.renderPagination();
        this.updateResultsCount(response.data.total);
      } else {
        throw new Error(response.data.message || 'Error loading projects');
      }
    } catch (error) {
      console.error('Error loading projects:', error);
      this.renderProjectsError();
    }
  },

  // Render statistics in hero section
  renderStats() {
    const statsSection = document.getElementById('statsSection');
    if (!statsSection) return;

    const formatBudget = (budget) => {
      if (budget >= 1000000000) {
        return `$${(budget / 1000000000).toFixed(1)}B`;
      } else if (budget >= 1000000) {
        return `$${(budget / 1000000).toFixed(1)}M`;
      } else if (budget >= 1000) {
        return `$${(budget / 1000).toFixed(0)}K`;
      }
      return `$${budget.toLocaleString()}`;
    };

    statsSection.innerHTML = `
      <div class="text-center">
        <div class="text-3xl font-bold">${this.stats.total_projects || 0}</div>
        <div class="text-sm opacity-90">Proyectos Totales</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold">${this.stats.active_projects || 0}</div>
        <div class="text-sm opacity-90">En Curso</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold">${this.stats.completed_projects || 0}</div>
        <div class="text-sm opacity-90">Completados</div>
      </div>
      <div class="text-center">
        <div class="text-3xl font-bold">${formatBudget(this.stats.total_budget || 0)}</div>
        <div class="text-sm opacity-90">Inversión Total</div>
      </div>
    `;
  },

  // Render statistics error
  renderStatsError() {
    const statsSection = document.getElementById('statsSection');
    if (!statsSection) return;

    statsSection.innerHTML = `
      <div class="col-span-4 text-center text-white/80">
        <i class="fas fa-exclamation-triangle text-2xl mb-2"></i>
        <p>Error al cargar estadísticas</p>
      </div>
    `;
  },

  // Show loading spinner
  showLoading() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const projectsGrid = document.getElementById('projectsGrid');
    const noResults = document.getElementById('noResults');
    const pagination = document.getElementById('pagination');

    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (projectsGrid) projectsGrid.classList.add('hidden');
    if (noResults) noResults.classList.add('hidden');
    if (pagination) pagination.classList.add('hidden');
  },

  // Render projects grid
  renderProjects() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const projectsGrid = document.getElementById('projectsGrid');
    const noResults = document.getElementById('noResults');

    if (loadingSpinner) loadingSpinner.classList.add('hidden');

    if (this.projects.length === 0) {
      if (projectsGrid) projectsGrid.classList.add('hidden');
      if (noResults) noResults.classList.remove('hidden');
      return;
    }

    if (noResults) noResults.classList.add('hidden');
    if (projectsGrid) {
      projectsGrid.classList.remove('hidden');
      projectsGrid.innerHTML = this.projects.map(project => this.renderProjectCard(project)).join('');
    }
  },

  // Render individual project card
  renderProjectCard(project) {
    const statusColors = {
      'active': 'bg-green-100 text-green-800',
      'completed': 'bg-blue-100 text-blue-800'
    };

    const statusLabels = {
      'active': 'En Curso',
      'completed': 'Completado'
    };

    const formatBudget = (budget) => {
      if (!budget) return 'No especificado';
      return `$${budget.toLocaleString()}`;
    };

    const formatDate = (dateStr) => {
      if (!dateStr) return 'No especificado';
      return new Date(dateStr).toLocaleDateString('es-ES');
    };

    return `
      <div class="card hover:shadow-lg transition-shadow duration-300 cursor-pointer" onclick="PublicProjects.viewProject(${project.id})">
        <div class="p-6">
          <!-- Project Header -->
          <div class="flex justify-between items-start mb-4">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[project.status] || 'bg-gray-100 text-gray-800'}">
              ${statusLabels[project.status] || project.status}
            </span>
            <div class="text-xs text-gray-500">
              ${formatDate(project.created_at)}
            </div>
          </div>

          <!-- Project Title -->
          <h3 class="text-lg font-semibold text-gray-900 mb-3 line-clamp-2">
            ${this.escapeHtml(project.title)}
          </h3>

          <!-- Project Summary -->
          <p class="text-gray-600 text-sm mb-4 line-clamp-3">
            ${this.escapeHtml(project.summary)}
          </p>

          <!-- Project Details -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-user-tie w-4 text-center mr-2"></i>
              <span class="font-medium">Responsable:</span>
              <span class="ml-1">${this.escapeHtml(project.responsible_person)}</span>
            </div>
            
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-building w-4 text-center mr-2"></i>
              <span class="font-medium">Institución:</span>
              <span class="ml-1">${this.escapeHtml(project.institution || 'No especificada')}</span>
            </div>

            ${project.area ? `
              <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-microscope w-4 text-center mr-2"></i>
                <span class="font-medium">Área:</span>
                <span class="ml-1">${this.escapeHtml(project.area)}</span>
              </div>
            ` : ''}

            ${project.budget ? `
              <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-dollar-sign w-4 text-center mr-2"></i>
                <span class="font-medium">Presupuesto:</span>
                <span class="ml-1">${formatBudget(project.budget)}</span>
              </div>
            ` : ''}
          </div>

          <!-- View Details Button -->
          <div class="flex justify-between items-center">
            <div class="flex items-center text-xs text-gray-500">
              ${project.has_documents ? '<i class="fas fa-paperclip mr-1"></i> Con documentos' : ''}
            </div>
            <button class="btn btn-primary btn-sm">
              Ver Detalles
              <i class="fas fa-arrow-right ml-1"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // View project details (will navigate to detail page)
  viewProject(projectId) {
    window.location.href = `/projects/${projectId}`;
  },

  // Render projects error
  renderProjectsError() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const projectsGrid = document.getElementById('projectsGrid');
    const noResults = document.getElementById('noResults');

    if (loadingSpinner) loadingSpinner.classList.add('hidden');
    if (projectsGrid) projectsGrid.classList.add('hidden');
    
    if (noResults) {
      noResults.classList.remove('hidden');
      noResults.innerHTML = `
        <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-700 mb-2">Error al cargar proyectos</h3>
        <p class="text-gray-600 mb-4">Hubo un problema al obtener los proyectos. Por favor, intenta más tarde.</p>
        <button onclick="PublicProjects.loadProjects()" class="btn btn-primary">
          <i class="fas fa-redo mr-2"></i>
          Reintentar
        </button>
      `;
    }
  },

  // Render pagination
  renderPagination() {
    const pagination = document.getElementById('pagination');
    if (!pagination || this.totalPages <= 1) {
      if (pagination) pagination.classList.add('hidden');
      return;
    }

    pagination.classList.remove('hidden');
    
    let paginationHTML = '';

    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `
        <button onclick="PublicProjects.goToPage(${this.currentPage - 1})" class="btn btn-outline mr-2">
          <i class="fas fa-chevron-left mr-1"></i>
          Anterior
        </button>
      `;
    }

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);

    if (startPage > 1) {
      paginationHTML += `<button onclick="PublicProjects.goToPage(1)" class="btn btn-outline mr-1">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="mx-2 text-gray-500">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === this.currentPage;
      paginationHTML += `
        <button onclick="PublicProjects.goToPage(${i})" class="btn ${isActive ? 'btn-primary' : 'btn-outline'} mr-1">
          ${i}
        </button>
      `;
    }

    if (endPage < this.totalPages) {
      if (endPage < this.totalPages - 1) {
        paginationHTML += `<span class="mx-2 text-gray-500">...</span>`;
      }
      paginationHTML += `<button onclick="PublicProjects.goToPage(${this.totalPages})" class="btn btn-outline mr-1">${this.totalPages}</button>`;
    }

    // Next button
    if (this.currentPage < this.totalPages) {
      paginationHTML += `
        <button onclick="PublicProjects.goToPage(${this.currentPage + 1})" class="btn btn-outline ml-2">
          Siguiente
          <i class="fas fa-chevron-right ml-1"></i>
        </button>
      `;
    }

    pagination.innerHTML = `<div class="flex items-center justify-center">${paginationHTML}</div>`;
  },

  // Go to specific page
  goToPage(page) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProjects();
      // Scroll to top of projects section
      document.querySelector('#projectsGrid').scrollIntoView({ behavior: 'smooth' });
    }
  },

  // Update results count
  updateResultsCount(total) {
    const resultsCount = document.getElementById('resultsCount');
    if (resultsCount) {
      const start = (this.currentPage - 1) * 12 + 1;
      const end = Math.min(this.currentPage * 12, total);
      
      if (total === 0) {
        resultsCount.textContent = 'No se encontraron proyectos';
      } else {
        resultsCount.textContent = `Mostrando ${start}-${end} de ${total} proyectos`;
      }
    }
  },

  // Utility function to escape HTML
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text || '';
    return div.innerHTML;
  }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Public Projects DOM loaded, initializing...');
  PublicProjects.init();
});

// Global error handler
window.onerror = function(msg, url, lineNo, columnNo, error) {
  console.error('Public Projects Error:', msg, url, lineNo, columnNo, error);
  return false;
};