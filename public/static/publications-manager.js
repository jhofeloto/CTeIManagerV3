// HU-14: Scientific Publications Admin Manager
class PublicationsManager {
  constructor() {
    this.publications = [];
    this.currentPage = 1;
    this.itemsPerPage = 10;
    this.totalPages = 1;
    this.currentPublication = null;
    this.isEditing = false;
    this.searchTimeout = null;
    this.filters = {
      search: '',
      publication_type: '',
      publication_status: '',
      access_type: '',
      year: ''
    };
    
    this.init();
  }

  async init() {
    console.log('🔬 Inicializando Gestor de Publicaciones Científicas...');
    
    try {
      await this.loadPublications();
      this.setupEventListeners();
      this.renderManager();
      
      console.log('✅ Gestor de Publicaciones cargado exitosamente');
    } catch (error) {
      console.error('❌ Error cargando gestor:', error);
      this.showError('Error cargando el gestor de publicaciones');
    }
  }

  async loadPublications() {
    try {
      const queryParams = new URLSearchParams({
        limit: this.itemsPerPage.toString(),
        offset: ((this.currentPage - 1) * this.itemsPerPage).toString(),
        sort_by: 'created_at',
        sort_order: 'desc',
        ...this.filters
      });

      // Remove empty filters
      for (const [key, value] of queryParams.entries()) {
        if (!value || value === 'false') {
          queryParams.delete(key);
        }
      }

      const response = await this.makeAuthenticatedRequest('GET', `/api/publications?${queryParams}`);
      
      if (response.data.success) {
        this.publications = response.data.data.publications;
        
        // Update pagination
        const pagination = response.data.pagination;
        this.totalPages = pagination.pages;
        this.currentPage = pagination.current_page;
        
        console.log(`📚 ${this.publications.length} publicaciones cargadas`);
      } else {
        throw new Error(response.data.message || 'Error loading publications');
      }
    } catch (error) {
      console.error('Error loading publications:', error);
      throw error;
    }
  }

  async makeAuthenticatedRequest(method, url, data = null) {
    const token = localStorage.getItem('codecti_token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    return await axios(config);
  }

  setupEventListeners() {
    // Search with debounce
    const searchInput = document.getElementById('publications-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.currentPage = 1;
          this.loadAndRender();
        }, 300);
      });
    }

    // Filters
    const filterElements = [
      'filter-type', 'filter-status', 'filter-access', 'filter-year'
    ];

    filterElements.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', (e) => {
          const filterKey = filterId.replace('filter-', '').replace('-', '_');
          this.filters[`publication_${filterKey}`] = e.target.value;
          this.currentPage = 1;
          this.loadAndRender();
        });
      }
    });

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // New publication button
    const newPublicationBtn = document.getElementById('new-publication-btn');
    if (newPublicationBtn) {
      newPublicationBtn.addEventListener('click', () => {
        this.openPublicationModal();
      });
    }
  }

  async loadAndRender() {
    try {
      this.showLoading();
      await this.loadPublications();
      this.renderPublications();
      this.renderPagination();
    } catch (error) {
      console.error('Error loading and rendering:', error);
      this.showError('Error cargando publicaciones');
    } finally {
      this.hideLoading();
    }
  }

  clearFilters() {
    this.filters = {
      search: '',
      publication_type: '',
      publication_status: '',
      access_type: '',
      year: ''
    };
    
    // Reset UI elements
    document.getElementById('publications-search').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-status').value = '';
    document.getElementById('filter-access').value = '';
    document.getElementById('filter-year').value = '';
    
    this.currentPage = 1;
    this.loadAndRender();
  }

  renderManager() {
    const container = document.getElementById('publications-manager-container');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-200">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl font-semibold text-gray-900">
                <i class="fas fa-graduation-cap mr-3 text-blue-600"></i>
                Gestión de Publicaciones Científicas
              </h2>
              <p class="text-sm text-gray-600 mt-1">
                Administra el repositorio científico institucional con estándares internacionales
              </p>
            </div>
            <button
              id="new-publication-btn"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              <i class="fas fa-plus mr-2"></i>
              Nueva Publicación
            </button>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Search -->
            <div class="flex-1">
              <div class="relative">
                <input
                  type="text"
                  id="publications-search"
                  placeholder="Buscar por título, autor, DOI, palabras clave..."
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i class="fas fa-search text-gray-400"></i>
                </div>
              </div>
            </div>
            
            <!-- Filters -->
            <div class="flex flex-wrap gap-3">
              <select id="filter-type" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los tipos</option>
                <option value="article">Artículo</option>
                <option value="book">Libro</option>
                <option value="chapter">Capítulo</option>
                <option value="conference">Conferencia</option>
                <option value="thesis">Tesis</option>
                <option value="report">Reporte</option>
                <option value="dataset">Dataset</option>
                <option value="software">Software</option>
                <option value="patent">Patente</option>
              </select>
              
              <select id="filter-status" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los estados</option>
                <option value="draft">Borrador</option>
                <option value="under_review">En Revisión</option>
                <option value="published">Publicado</option>
                <option value="retracted">Retraído</option>
                <option value="archived">Archivado</option>
              </select>
              
              <select id="filter-access" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los accesos</option>
                <option value="open_access">Acceso Abierto</option>
                <option value="restricted">Restringido</option>
                <option value="embargo">Embargo</option>
                <option value="closed">Cerrado</option>
              </select>
              
              <select id="filter-year" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">Todos los años</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
                <option value="2020">2020</option>
              </select>
              
              <button
                id="clear-filters"
                class="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <i class="fas fa-times mr-2"></i>
                Limpiar
              </button>
            </div>
          </div>
        </div>

        <!-- Publications Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Publicación
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Autores
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo/Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  DOI/Fecha
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Métricas
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody id="publications-table-body" class="bg-white divide-y divide-gray-200">
              <!-- Publications will be rendered here -->
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div id="pagination-container" class="px-6 py-4 border-t border-gray-200">
          <!-- Pagination will be rendered here -->
        </div>

        <!-- Loading State -->
        <div id="loading-state" class="hidden px-6 py-12 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p class="text-gray-600">Cargando publicaciones...</p>
        </div>
      </div>

      <!-- Publication Modal -->
      <div id="publication-modal" class="hidden fixed inset-0 z-50 overflow-y-auto">
        <div class="flex min-h-screen items-center justify-center px-4">
          <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onclick="publicationsManager.closeModal()"></div>
          <div class="relative bg-white rounded-xl max-w-5xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div id="modal-content">
              <!-- Modal content will be inserted here -->
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderPublications();
    this.renderPagination();
  }

  renderPublications() {
    const tbody = document.getElementById('publications-table-body');
    if (!tbody) return;

    if (!this.publications || this.publications.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" class="px-6 py-12 text-center">
            <div class="text-gray-400">
              <i class="fas fa-search text-4xl mb-4"></i>
              <p class="text-lg font-medium">No se encontraron publicaciones</p>
              <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
            </div>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = this.publications.map(pub => this.renderPublicationRow(pub)).join('');
  }

  renderPublicationRow(publication) {
    const authors = publication.authors.slice(0, 2).map(a => a.name).join(', ');
    const moreAuthors = publication.authors.length > 2 ? ` +${publication.authors.length - 2}` : '';
    const year = new Date(publication.publication_date).getFullYear();
    
    // Status badges
    const statusBadges = {
      draft: 'bg-gray-100 text-gray-800',
      under_review: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      retracted: 'bg-red-100 text-red-800',
      archived: 'bg-purple-100 text-purple-800'
    };

    const typeBadges = {
      article: 'bg-blue-100 text-blue-800',
      book: 'bg-indigo-100 text-indigo-800',
      chapter: 'bg-cyan-100 text-cyan-800',
      conference: 'bg-orange-100 text-orange-800',
      thesis: 'bg-pink-100 text-pink-800',
      report: 'bg-green-100 text-green-800',
      dataset: 'bg-yellow-100 text-yellow-800',
      software: 'bg-purple-100 text-purple-800',
      patent: 'bg-red-100 text-red-800'
    };

    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4">
          <div class="max-w-xs">
            <div class="font-medium text-gray-900 line-clamp-2">
              ${publication.title}
              ${publication.featured ? 
                '<i class="fas fa-star text-yellow-500 ml-2" title="Destacada"></i>' : 
                ''
              }
            </div>
            <div class="text-sm text-gray-500 line-clamp-1 mt-1">
              ${publication.abstract.substring(0, 100)}...
            </div>
            ${publication.journal_name ? `
              <div class="text-xs text-gray-400 mt-1">
                <i class="fas fa-book mr-1"></i>
                ${publication.journal_name}
              </div>
            ` : ''}
          </div>
        </td>
        
        <td class="px-6 py-4">
          <div class="text-sm text-gray-900">
            ${authors}${moreAuthors}
          </div>
          <div class="text-xs text-gray-500">
            ${publication.institution}
          </div>
        </td>
        
        <td class="px-6 py-4">
          <div class="space-y-2">
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${typeBadges[publication.publication_type] || 'bg-gray-100 text-gray-800'}">
              ${publication.publication_type}
            </span>
            <br>
            <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusBadges[publication.publication_status] || 'bg-gray-100 text-gray-800'}">
              ${publication.publication_status}
            </span>
          </div>
        </td>
        
        <td class="px-6 py-4">
          <div class="text-sm">
            <div class="font-mono text-xs text-blue-600 mb-1">
              DOI: ${publication.doi}
            </div>
            <div class="text-gray-500">
              ${year}
            </div>
            <div class="flex items-center mt-2">
              ${publication.access_type === 'open_access' ? 
                '<i class="fas fa-unlock text-green-600 mr-1" title="Acceso Abierto"></i>' : 
                '<i class="fas fa-lock text-gray-400 mr-1" title="Acceso Restringido"></i>'
              }
              ${publication.peer_reviewed ? 
                '<i class="fas fa-check-circle text-blue-600 ml-2" title="Revisado por Pares"></i>' : 
                ''
              }
            </div>
          </div>
        </td>
        
        <td class="px-6 py-4">
          <div class="space-y-1 text-xs">
            <div class="flex items-center">
              <i class="fas fa-quote-left w-3 mr-2 text-gray-400"></i>
              <span>${publication.citation_count} citas</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-download w-3 mr-2 text-gray-400"></i>
              <span>${publication.download_count} descargas</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-eye w-3 mr-2 text-gray-400"></i>
              <span>${publication.view_count} vistas</span>
            </div>
          </div>
        </td>
        
        <td class="px-6 py-4">
          <div class="flex items-center space-x-2">
            <button
              onclick="publicationsManager.viewPublication('${publication.id}')"
              class="text-blue-600 hover:text-blue-800 transition-colors"
              title="Ver detalles"
            >
              <i class="fas fa-eye"></i>
            </button>
            <button
              onclick="publicationsManager.editPublication('${publication.id}')"
              class="text-green-600 hover:text-green-800 transition-colors"
              title="Editar"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              onclick="publicationsManager.duplicatePublication('${publication.id}')"
              class="text-yellow-600 hover:text-yellow-800 transition-colors"
              title="Duplicar"
            >
              <i class="fas fa-copy"></i>
            </button>
            <button
              onclick="publicationsManager.deletePublication('${publication.id}')"
              class="text-red-600 hover:text-red-800 transition-colors"
              title="Eliminar"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  renderPagination() {
    if (this.totalPages <= 1) return;

    const pagination = `
      <div class="flex items-center justify-between">
        <div class="text-sm text-gray-700">
          <span>
            Mostrando página <span class="font-semibold">${this.currentPage}</span> de 
            <span class="font-semibold">${this.totalPages}</span>
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          ${this.currentPage > 1 ? `
            <button 
              onclick="publicationsManager.goToPage(${this.currentPage - 1})" 
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i class="fas fa-chevron-left mr-1"></i>
              Anterior
            </button>
          ` : ''}
          
          ${this.renderPageNumbers()}
          
          ${this.currentPage < this.totalPages ? `
            <button 
              onclick="publicationsManager.goToPage(${this.currentPage + 1})" 
              class="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Siguiente
              <i class="fas fa-chevron-right ml-1"></i>
            </button>
          ` : ''}
        </div>
      </div>
    `;

    const paginationContainer = document.getElementById('pagination-container');
    if (paginationContainer) {
      paginationContainer.innerHTML = pagination;
    }
  }

  renderPageNumbers() {
    const pages = [];
    const maxVisible = 5;
    const half = Math.floor(maxVisible / 2);
    
    let start = Math.max(1, this.currentPage - half);
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(`
        <button 
          onclick="publicationsManager.goToPage(${i})" 
          class="px-3 py-2 text-sm rounded-lg transition-colors ${
            i === this.currentPage 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }"
        >
          ${i}
        </button>
      `);
    }

    return pages.join('');
  }

  async goToPage(page) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    
    this.currentPage = page;
    await this.loadAndRender();
  }

  async viewPublication(publicationId) {
    try {
      const response = await this.makeAuthenticatedRequest('GET', `/api/publications/${publicationId}`);
      
      if (response.data.success) {
        this.currentPublication = response.data.data;
        this.openPublicationModal(true); // View mode
      }
    } catch (error) {
      console.error('Error loading publication:', error);
      this.showError('Error cargando los detalles de la publicación');
    }
  }

  editPublication(publicationId) {
    this.viewPublication(publicationId);
    setTimeout(() => {
      this.isEditing = true;
      this.openPublicationModal(false); // Edit mode
    }, 100);
  }

  async duplicatePublication(publicationId) {
    try {
      const response = await this.makeAuthenticatedRequest('GET', `/api/publications/${publicationId}`);
      
      if (response.data.success) {
        const original = response.data.data;
        
        // Create a copy with modified title
        const duplicateData = {
          ...original,
          title: `Copia de ${original.title}`,
          publication_status: 'draft'
        };
        
        delete duplicateData.id;
        delete duplicateData.doi;
        delete duplicateData.created_at;
        delete duplicateData.updated_at;
        delete duplicateData.published_at;
        
        this.currentPublication = duplicateData;
        this.isEditing = false;
        this.openPublicationModal(false);
      }
    } catch (error) {
      console.error('Error duplicating publication:', error);
      this.showError('Error duplicando la publicación');
    }
  }

  async deletePublication(publicationId) {
    if (!confirm('¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const response = await this.makeAuthenticatedRequest('DELETE', `/api/publications/${publicationId}`);
      
      if (response.data.success) {
        this.showSuccess('Publicación eliminada exitosamente');
        await this.loadAndRender();
      }
    } catch (error) {
      console.error('Error deleting publication:', error);
      this.showError('Error eliminando la publicación');
    }
  }

  openPublicationModal(viewMode = false) {
    const modal = document.getElementById('publication-modal');
    const modalContent = document.getElementById('modal-content');
    
    modal.classList.remove('hidden');
    modalContent.innerHTML = this.renderPublicationModal(viewMode);
    
    if (!viewMode) {
      this.setupModalEventListeners();
    }
  }

  renderPublicationModal(viewMode = false) {
    const pub = this.currentPublication;
    const isNew = !pub || !pub.id;
    
    if (viewMode && pub) {
      return this.renderViewMode(pub);
    }
    
    return this.renderEditMode(pub, isNew);
  }

  renderViewMode(publication) {
    const authors = publication.authors.sort((a, b) => a.position - b.position);
    const year = new Date(publication.publication_date).getFullYear();

    return `
      <div class="relative">
        <!-- Close button -->
        <button 
          onclick="publicationsManager.closeModal()" 
          class="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <i class="fas fa-times text-gray-600"></i>
        </button>

        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <h2 class="text-2xl font-bold mb-4 pr-12">${publication.title}</h2>
          
          <div class="space-y-2 text-blue-100">
            <div class="flex items-center">
              <i class="fas fa-users mr-3"></i>
              <span>${authors.map(a => a.name).join(', ')}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-building mr-3"></i>
              <span>${publication.institution}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-link mr-3"></i>
              <span class="font-mono">DOI: ${publication.doi}</span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8">
          <div class="grid lg:grid-cols-2 gap-8">
            <!-- Left column -->
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Resumen</h3>
                <p class="text-gray-700 leading-relaxed">${publication.abstract}</p>
              </div>

              ${publication.keywords.length > 0 ? `
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 mb-3">Palabras Clave</h3>
                  <div class="flex flex-wrap gap-2">
                    ${publication.keywords.map(keyword => `
                      <span class="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                        ${keyword}
                      </span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Right column -->
            <div class="space-y-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Información de Publicación</h3>
                <dl class="space-y-2 text-sm">
                  <div class="flex justify-between">
                    <dt class="font-medium text-gray-600">Tipo:</dt>
                    <dd class="text-gray-900">${publication.publication_type}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="font-medium text-gray-600">Estado:</dt>
                    <dd class="text-gray-900">${publication.publication_status}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="font-medium text-gray-600">Acceso:</dt>
                    <dd class="text-gray-900">${publication.access_type}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="font-medium text-gray-600">Fecha:</dt>
                    <dd class="text-gray-900">${new Date(publication.publication_date).toLocaleDateString('es-ES')}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 class="text-lg font-semibold text-gray-900 mb-3">Métricas</h3>
                <div class="grid grid-cols-3 gap-4 text-center">
                  <div class="bg-blue-50 p-3 rounded-lg">
                    <div class="text-2xl font-bold text-blue-600">${publication.citation_count}</div>
                    <div class="text-xs text-gray-600">Citas</div>
                  </div>
                  <div class="bg-green-50 p-3 rounded-lg">
                    <div class="text-2xl font-bold text-green-600">${publication.download_count}</div>
                    <div class="text-xs text-gray-600">Descargas</div>
                  </div>
                  <div class="bg-purple-50 p-3 rounded-lg">
                    <div class="text-2xl font-bold text-purple-600">${publication.view_count}</div>
                    <div class="text-xs text-gray-600">Vistas</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              onclick="publicationsManager.editPublication('${publication.id}')"
              class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <i class="fas fa-edit mr-2"></i>
              Editar
            </button>
            <button
              onclick="publicationsManager.closeModal()"
              class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderEditMode(publication, isNew) {
    // Simplified form for now - in production, this would be a comprehensive form
    return `
      <div class="relative">
        <!-- Close button -->
        <button 
          onclick="publicationsManager.closeModal()" 
          class="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <i class="fas fa-times text-gray-600"></i>
        </button>

        <!-- Header -->
        <div class="bg-gradient-to-r from-green-600 to-teal-700 text-white p-6">
          <h2 class="text-xl font-bold">
            ${isNew ? 'Nueva Publicación Científica' : 'Editar Publicación'}
          </h2>
          <p class="text-green-100 mt-2">
            ${isNew ? 'Crear una nueva entrada en el repositorio científico' : 'Modificar información de la publicación'}
          </p>
        </div>

        <!-- Form -->
        <div class="p-6">
          <form id="publication-form" class="space-y-6">
            <!-- Basic Information -->
            <div class="grid lg:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Título *</label>
                <input
                  type="text"
                  id="publication-title"
                  value="${publication?.title || ''}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Publicación *</label>
                <select
                  id="publication-type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="article" ${publication?.publication_type === 'article' ? 'selected' : ''}>Artículo</option>
                  <option value="book" ${publication?.publication_type === 'book' ? 'selected' : ''}>Libro</option>
                  <option value="chapter" ${publication?.publication_type === 'chapter' ? 'selected' : ''}>Capítulo</option>
                  <option value="conference" ${publication?.publication_type === 'conference' ? 'selected' : ''}>Conferencia</option>
                  <option value="thesis" ${publication?.publication_type === 'thesis' ? 'selected' : ''}>Tesis</option>
                  <option value="report" ${publication?.publication_type === 'report' ? 'selected' : ''}>Reporte</option>
                  <option value="dataset" ${publication?.publication_type === 'dataset' ? 'selected' : ''}>Dataset</option>
                  <option value="software" ${publication?.publication_type === 'software' ? 'selected' : ''}>Software</option>
                </select>
              </div>
            </div>

            <!-- Abstract -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Resumen *</label>
              <textarea
                id="publication-abstract"
                rows="4"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >${publication?.abstract || ''}</textarea>
            </div>

            <!-- Authors (simplified) -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Autores (nombres separados por coma) *</label>
              <input
                type="text"
                id="publication-authors"
                value="${publication?.authors ? publication.authors.map(a => a.name).join(', ') : ''}"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Dr. Juan Pérez, Dra. María García, ..."
                required
              >
            </div>

            <!-- Publication Details -->
            <div class="grid lg:grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Publicación *</label>
                <input
                  type="date"
                  id="publication-date"
                  value="${publication?.publication_date ? publication.publication_date.split('T')[0] : new Date().toISOString().split('T')[0]}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Acceso *</label>
                <select
                  id="access-type"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="open_access" ${publication?.access_type === 'open_access' ? 'selected' : ''}>Acceso Abierto</option>
                  <option value="restricted" ${publication?.access_type === 'restricted' ? 'selected' : ''}>Restringido</option>
                  <option value="embargo" ${publication?.access_type === 'embargo' ? 'selected' : ''}>Embargo</option>
                  <option value="closed" ${publication?.access_type === 'closed' ? 'selected' : ''}>Cerrado</option>
                </select>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Licencia *</label>
                <select
                  id="license"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="CC-BY" ${publication?.license === 'CC-BY' ? 'selected' : ''}>CC-BY</option>
                  <option value="CC-BY-SA" ${publication?.license === 'CC-BY-SA' ? 'selected' : ''}>CC-BY-SA</option>
                  <option value="CC-BY-NC" ${publication?.license === 'CC-BY-NC' ? 'selected' : ''}>CC-BY-NC</option>
                  <option value="CC-BY-NC-SA" ${publication?.license === 'CC-BY-NC-SA' ? 'selected' : ''}>CC-BY-NC-SA</option>
                  <option value="CC0" ${publication?.license === 'CC0' ? 'selected' : ''}>CC0</option>
                  <option value="all_rights_reserved" ${publication?.license === 'all_rights_reserved' ? 'selected' : ''}>Todos los Derechos Reservados</option>
                </select>
              </div>
            </div>

            <!-- Institution and Keywords -->
            <div class="grid lg:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Institución *</label>
                <input
                  type="text"
                  id="institution"
                  value="${publication?.institution || 'CODECTI Chocó'}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Palabras Clave</label>
                <input
                  type="text"
                  id="keywords"
                  value="${publication?.keywords ? publication.keywords.join(', ') : ''}"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="biodiversidad, chocó, investigación, ..."
                >
              </div>
            </div>

            <!-- Subject Areas -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Áreas Temáticas</label>
              <input
                type="text"
                id="subject-areas"
                value="${publication?.subject_areas ? publication.subject_areas.join(', ') : ''}"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Biología Marina, Biotecnología, Ecología Tropical, ..."
              >
            </div>

            <!-- Actions -->
            <div class="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onclick="publicationsManager.closeModal()"
                class="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i class="fas fa-save mr-2"></i>
                ${isNew ? 'Crear Publicación' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  setupModalEventListeners() {
    const form = document.getElementById('publication-form');
    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.savePublication();
      });
    }
  }

  async savePublication() {
    try {
      const formData = this.getFormData();
      const isNew = !this.currentPublication || !this.currentPublication.id;
      
      let response;
      if (isNew) {
        response = await this.makeAuthenticatedRequest('POST', '/api/publications', formData);
      } else {
        response = await this.makeAuthenticatedRequest('PUT', `/api/publications/${this.currentPublication.id}`, formData);
      }
      
      if (response.data.success) {
        this.showSuccess(`Publicación ${isNew ? 'creada' : 'actualizada'} exitosamente`);
        this.closeModal();
        await this.loadAndRender();
      }
    } catch (error) {
      console.error('Error saving publication:', error);
      this.showError('Error guardando la publicación');
    }
  }

  getFormData() {
    const title = document.getElementById('publication-title').value;
    const abstract = document.getElementById('publication-abstract').value;
    const publication_type = document.getElementById('publication-type').value;
    const publication_date = document.getElementById('publication-date').value;
    const access_type = document.getElementById('access-type').value;
    const license = document.getElementById('license').value;
    const institution = document.getElementById('institution').value;
    
    const authorsText = document.getElementById('publication-authors').value;
    const keywordsText = document.getElementById('keywords').value;
    const subjectAreasText = document.getElementById('subject-areas').value;
    
    // Parse authors (simplified)
    const authors = authorsText.split(',').map((name, index) => ({
      name: name.trim(),
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
      affiliation: institution,
      position: index + 1,
      role: index === 0 ? 'primary' : 'contributor'
    }));
    
    return {
      title,
      abstract,
      publication_type,
      publication_date,
      access_type,
      license,
      institution,
      authors,
      corresponding_author_email: authors[0]?.email,
      keywords: keywordsText ? keywordsText.split(',').map(k => k.trim()) : [],
      subject_areas: subjectAreasText ? subjectAreasText.split(',').map(s => s.trim()) : []
    };
  }

  closeModal() {
    const modal = document.getElementById('publication-modal');
    modal.classList.add('hidden');
    this.currentPublication = null;
    this.isEditing = false;
  }

  showLoading() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
      loadingState.classList.remove('hidden');
    }
  }

  hideLoading() {
    const loadingState = document.getElementById('loading-state');
    if (loadingState) {
      loadingState.classList.add('hidden');
    }
  }

  showError(message) {
    // Remove any existing alerts
    const existingAlert = document.getElementById('alert-message');
    if (existingAlert) existingAlert.remove();

    const alertDiv = document.createElement('div');
    alertDiv.id = 'alert-message';
    alertDiv.className = 'fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg';
    alertDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-exclamation-circle mr-3"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv && alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 5000);
  }

  showSuccess(message) {
    // Remove any existing alerts
    const existingAlert = document.getElementById('alert-message');
    if (existingAlert) existingAlert.remove();

    const alertDiv = document.createElement('div');
    alertDiv.id = 'alert-message';
    alertDiv.className = 'fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg';
    alertDiv.innerHTML = `
      <div class="flex items-center">
        <i class="fas fa-check-circle mr-3"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
      if (alertDiv && alertDiv.parentNode) {
        alertDiv.remove();
      }
    }, 3000);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (typeof PublicationsManager !== 'undefined') {
    window.publicationsManager = new PublicationsManager();
  }
});