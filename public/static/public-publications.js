// HU-14: Scientific Publications Public Portal
class PublicationsPortal {
  constructor() {
    this.publications = [];
    this.filteredPublications = [];
    this.currentPage = 1;
    this.itemsPerPage = 12;
    this.totalPages = 1;
    this.currentPublication = null;
    this.stats = null;
    this.searchTimeout = null;
    this.filters = {
      search: '',
      publication_type: '',
      subject_area: '',
      access_type: '',
      year: '',
      featured: false
    };
    
    this.init();
  }

  async init() {
    console.log('🔬 Inicializando Portal de Publicaciones Científicas...');
    
    // Show loading
    this.showLoading();
    
    try {
      // Load initial data
      await Promise.all([
        this.loadPublications(),
        this.loadStats()
      ]);
      
      this.setupEventListeners();
      this.renderPortal();
      this.hideLoading();
      
      console.log('✅ Portal de Publicaciones cargado exitosamente');
    } catch (error) {
      console.error('❌ Error cargando portal:', error);
      this.showError('Error cargando el portal de publicaciones');
    }
  }

  async loadPublications() {
    try {
      const queryParams = new URLSearchParams({
        limit: this.itemsPerPage.toString(),
        offset: ((this.currentPage - 1) * this.itemsPerPage).toString(),
        sort_by: 'publication_date',
        sort_order: 'desc',
        ...this.filters
      });

      // Remove empty filters
      for (const [key, value] of queryParams.entries()) {
        if (!value || value === 'false') {
          queryParams.delete(key);
        }
      }

      const response = await axios.get(`/api/publications?${queryParams}`);
      
      if (response.data.success) {
        this.publications = response.data.data.publications;
        this.filteredPublications = this.publications;
        this.featuredPublications = response.data.data.featured_publications || [];
        this.availableFilters = response.data.filters || {};
        
        // Update pagination
        const pagination = response.data.pagination;
        this.totalPages = pagination.pages;
        this.currentPage = pagination.current_page;
        
        console.log(`📚 ${this.publications.length} publicaciones cargadas`);
      }
    } catch (error) {
      console.error('Error loading publications:', error);
      throw error;
    }
  }

  async loadStats() {
    try {
      const response = await axios.get('/api/publications/stats');
      
      if (response.data.success) {
        this.stats = response.data.data;
        console.log('📊 Estadísticas del repositorio cargadas');
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      // Don't throw, stats are not critical
    }
  }

  async searchPublications(query) {
    if (!query.trim()) {
      return this.loadPublications();
    }

    try {
      const response = await axios.get('/api/publications/search', {
        params: {
          query: query,
          limit: this.itemsPerPage,
          offset: (this.currentPage - 1) * this.itemsPerPage,
          ...this.filters
        }
      });

      if (response.data.success) {
        this.publications = response.data.data.publications;
        this.searchSuggestions = response.data.data.suggestions || [];
        
        const pagination = response.data.pagination;
        this.totalPages = pagination.pages;
        
        this.renderPublications();
        this.renderPagination();
        
        // Show search results info
        const resultsInfo = document.getElementById('search-results-info');
        if (resultsInfo) {
          const total = response.data.data.total_results;
          const time = response.data.data.search_time_ms;
          resultsInfo.innerHTML = `
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <i class="fas fa-search text-blue-400"></i>
                </div>
                <div class="ml-3">
                  <p class="text-blue-700">
                    <strong>${total}</strong> resultados encontrados para "<em>${query}</em>" en <strong>${time}ms</strong>
                  </p>
                  ${this.searchSuggestions.length > 0 ? `
                    <p class="text-sm text-blue-600 mt-1">
                      Sugerencias: ${this.searchSuggestions.map(s => `<span class="bg-blue-100 px-2 py-1 rounded text-xs mr-1">${s}</span>`).join('')}
                    </p>
                  ` : ''}
                </div>
              </div>
            </div>
          `;
        }
      }
    } catch (error) {
      console.error('Error searching publications:', error);
      this.showError('Error en la búsqueda de publicaciones');
    }
  }

  setupEventListeners() {
    // Search input with debounce
    const searchInput = document.getElementById('publications-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
          this.filters.search = e.target.value;
          this.currentPage = 1;
          this.searchPublications(e.target.value);
        }, 300);
      });
    }

    // Filters
    const filterElements = [
      'filter-type', 'filter-subject', 'filter-access', 'filter-year'
    ];

    filterElements.forEach(filterId => {
      const element = document.getElementById(filterId);
      if (element) {
        element.addEventListener('change', (e) => {
          const filterKey = filterId.replace('filter-', '').replace('-', '_');
          if (filterKey === 'type') {
            this.filters.publication_type = e.target.value;
          } else if (filterKey === 'subject') {
            this.filters.subject_area = e.target.value;
          } else if (filterKey === 'access') {
            this.filters.access_type = e.target.value;
          } else if (filterKey === 'year') {
            this.filters.year = e.target.value;
          }
          
          this.currentPage = 1;
          this.loadPublications().then(() => {
            this.renderPublications();
            this.renderPagination();
          });
        });
      }
    });

    // Featured toggle
    const featuredToggle = document.getElementById('filter-featured');
    if (featuredToggle) {
      featuredToggle.addEventListener('change', (e) => {
        this.filters.featured = e.target.checked;
        this.currentPage = 1;
        this.loadPublications().then(() => {
          this.renderPublications();
          this.renderPagination();
        });
      });
    }

    // Clear filters
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        this.clearFilters();
      });
    }
  }

  clearFilters() {
    // Reset filters
    this.filters = {
      search: '',
      publication_type: '',
      subject_area: '',
      access_type: '',
      year: '',
      featured: false
    };
    
    // Reset UI elements
    document.getElementById('publications-search').value = '';
    document.getElementById('filter-type').value = '';
    document.getElementById('filter-subject').value = '';
    document.getElementById('filter-access').value = '';
    document.getElementById('filter-year').value = '';
    document.getElementById('filter-featured').checked = false;
    
    // Clear search results info
    const resultsInfo = document.getElementById('search-results-info');
    if (resultsInfo) {
      resultsInfo.innerHTML = '';
    }
    
    this.currentPage = 1;
    this.loadPublications().then(() => {
      this.renderPublications();
      this.renderPagination();
    });
  }

  renderPortal() {
    const container = document.getElementById('publications-container');
    if (!container) return;

    container.innerHTML = `
      <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div class="text-center">
              <h1 class="text-4xl font-bold mb-4">
                <i class="fas fa-graduation-cap mr-3"></i>
                Repositorio Científico CODECTI
              </h1>
              <p class="text-xl text-blue-100 mb-6">
                Portal de publicaciones científicas del Chocó
              </p>
              <div class="flex justify-center items-center space-x-8 text-sm">
                <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <i class="fas fa-book-open mr-2"></i>
                  <span class="font-semibold">${this.stats?.total_publications || 0}</span> Publicaciones
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <i class="fas fa-users mr-2"></i>
                  <span class="font-semibold">${this.stats?.total_authors || 0}</span> Autores
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <i class="fas fa-quote-left mr-2"></i>
                  <span class="font-semibold">${this.stats?.total_citations || 0}</span> Citas
                </div>
                <div class="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                  <i class="fas fa-download mr-2"></i>
                  <span class="font-semibold">${this.stats?.total_downloads || 0}</span> Descargas
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <!-- Featured Publications -->
          ${this.renderFeaturedSection()}

          <!-- Search and Filters -->
          <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div class="flex flex-col lg:flex-row gap-4">
              <!-- Search -->
              <div class="flex-1">
                <div class="relative">
                  <input
                    type="text"
                    id="publications-search"
                    placeholder="Buscar por título, autor, palabras clave..."
                    class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                </select>
                
                <select id="filter-subject" class="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Todas las áreas</option>
                  ${this.availableFilters?.available_subjects?.map(subject => 
                    `<option value="${subject}">${subject}</option>`
                  ).join('') || ''}
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
                  ${this.availableFilters?.available_years?.map(year => 
                    `<option value="${year}">${year}</option>`
                  ).join('') || ''}
                </select>
                
                <label class="flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <input type="checkbox" id="filter-featured" class="rounded text-yellow-600 focus:ring-yellow-500">
                  <span class="text-sm font-medium text-yellow-800">
                    <i class="fas fa-star mr-1"></i>
                    Destacadas
                  </span>
                </label>
                
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

          <!-- Search Results Info -->
          <div id="search-results-info"></div>

          <!-- Publications Grid -->
          <div id="publications-grid" class="mb-8">
            ${this.renderPublications()}
          </div>

          <!-- Pagination -->
          <div id="pagination-container">
            ${this.renderPagination()}
          </div>
        </div>

        <!-- Publication Detail Modal -->
        <div id="publication-modal" class="hidden fixed inset-0 z-50 overflow-y-auto">
          <div class="flex min-h-screen items-center justify-center px-4">
            <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onclick="publicationsPortal.closeModal()"></div>
            <div class="relative bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div id="modal-content">
                <!-- Modal content will be inserted here -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderPublications();
    this.renderPagination();
  }

  renderFeaturedSection() {
    if (!this.featuredPublications || this.featuredPublications.length === 0) {
      return '';
    }

    return `
      <div class="mb-12">
        <div class="text-center mb-8">
          <h2 class="text-3xl font-bold text-gray-900 mb-4">
            <i class="fas fa-star text-yellow-500 mr-3"></i>
            Publicaciones Destacadas
          </h2>
          <p class="text-lg text-gray-600">
            Las investigaciones más relevantes de nuestro repositorio científico
          </p>
        </div>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          ${this.featuredPublications.map(pub => this.renderFeaturedCard(pub)).join('')}
        </div>
      </div>
    `;
  }

  renderFeaturedCard(publication) {
    const authors = publication.authors.slice(0, 3).map(a => a.name).join(', ');
    const moreAuthors = publication.authors.length > 3 ? ` et al.` : '';
    const year = new Date(publication.publication_date).getFullYear();
    
    return `
      <div class="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer" onclick="publicationsPortal.showPublicationDetails('${publication.id}')">
        <div class="flex items-start justify-between mb-4">
          <span class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full">
            <i class="fas fa-star mr-1"></i>
            ${publication.publication_type.charAt(0).toUpperCase() + publication.publication_type.slice(1)}
          </span>
          <div class="flex space-x-2">
            ${publication.access_type === 'open_access' ? 
              '<i class="fas fa-unlock text-green-600" title="Acceso Abierto"></i>' : 
              '<i class="fas fa-lock text-gray-400" title="Acceso Restringido"></i>'
            }
            ${publication.peer_reviewed ? 
              '<i class="fas fa-check-circle text-blue-600" title="Revisado por Pares"></i>' : ''
            }
          </div>
        </div>
        
        <h3 class="font-bold text-lg text-gray-900 mb-3 line-clamp-2 leading-tight">
          ${publication.title}
        </h3>
        
        <p class="text-gray-700 text-sm mb-4 line-clamp-3">
          ${publication.abstract}
        </p>
        
        <div class="space-y-2 text-xs text-gray-600">
          <div class="flex items-center">
            <i class="fas fa-users w-4 mr-2"></i>
            <span class="font-medium">${authors}${moreAuthors}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-calendar w-4 mr-2"></i>
            <span>${year}</span>
            ${publication.journal_name ? `
              <i class="fas fa-book-open w-4 ml-4 mr-2"></i>
              <span class="font-medium">${publication.journal_name}</span>
            ` : ''}
          </div>
          <div class="flex items-center justify-between pt-2">
            <div class="flex items-center space-x-3">
              <span class="flex items-center">
                <i class="fas fa-quote-left w-3 mr-1"></i>
                ${publication.citation_count}
              </span>
              <span class="flex items-center">
                <i class="fas fa-download w-3 mr-1"></i>
                ${publication.download_count}
              </span>
              <span class="flex items-center">
                <i class="fas fa-eye w-3 mr-1"></i>
                ${publication.view_count}
              </span>
            </div>
            <div class="text-right">
              <div class="text-xs font-semibold text-blue-600">
                DOI: ${publication.doi}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPublications() {
    if (!this.publications || this.publications.length === 0) {
      return `
        <div class="text-center py-16">
          <div class="text-6xl text-gray-300 mb-4">
            <i class="fas fa-search"></i>
          </div>
          <h3 class="text-xl font-semibold text-gray-700 mb-2">No se encontraron publicaciones</h3>
          <p class="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      `;
    }

    const grid = `
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${this.publications.map(pub => this.renderPublicationCard(pub)).join('')}
      </div>
    `;

    const gridContainer = document.getElementById('publications-grid');
    if (gridContainer) {
      gridContainer.innerHTML = grid;
    }
    
    return grid;
  }

  renderPublicationCard(publication) {
    const authors = publication.authors.slice(0, 2).map(a => a.name).join(', ');
    const moreAuthors = publication.authors.length > 2 ? ` et al.` : '';
    const year = new Date(publication.publication_date).getFullYear();
    const truncatedAbstract = publication.abstract.length > 120 ? 
      publication.abstract.substring(0, 120) + '...' : publication.abstract;
    
    return `
      <div class="bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer" onclick="publicationsPortal.showPublicationDetails('${publication.id}')">
        <div class="p-6">
          <!-- Header with badges -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex flex-wrap gap-2">
              <span class="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                ${publication.publication_type.charAt(0).toUpperCase() + publication.publication_type.slice(1)}
              </span>
              ${publication.featured ? 
                '<span class="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-1 rounded-full"><i class="fas fa-star mr-1"></i>Destacada</span>' : 
                ''
              }
            </div>
            <div class="flex space-x-2">
              ${publication.access_type === 'open_access' ? 
                '<i class="fas fa-unlock text-green-600" title="Acceso Abierto"></i>' : 
                '<i class="fas fa-lock text-gray-400" title="Acceso Restringido"></i>'
              }
              ${publication.peer_reviewed ? 
                '<i class="fas fa-check-circle text-blue-600" title="Revisado por Pares"></i>' : ''
              }
            </div>
          </div>

          <!-- Title -->
          <h3 class="font-bold text-lg text-gray-900 mb-3 line-clamp-2 leading-tight">
            ${publication.title}
          </h3>

          <!-- Abstract -->
          <p class="text-gray-700 text-sm mb-4 line-clamp-3">
            ${truncatedAbstract}
          </p>

          <!-- Keywords -->
          ${publication.keywords.length > 0 ? `
            <div class="mb-4">
              <div class="flex flex-wrap gap-1">
                ${publication.keywords.slice(0, 3).map(keyword => `
                  <span class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                    ${keyword}
                  </span>
                `).join('')}
                ${publication.keywords.length > 3 ? `
                  <span class="text-xs text-gray-500 px-2 py-1">
                    +${publication.keywords.length - 3} más
                  </span>
                ` : ''}
              </div>
            </div>
          ` : ''}

          <!-- Metadata -->
          <div class="space-y-2 text-xs text-gray-600">
            <div class="flex items-center">
              <i class="fas fa-users w-4 mr-2"></i>
              <span class="font-medium">${authors}${moreAuthors}</span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-calendar w-4 mr-2"></i>
              <span>${year}</span>
              ${publication.journal_name ? `
                <i class="fas fa-book-open w-4 ml-4 mr-2"></i>
                <span class="font-medium truncate">${publication.journal_name}</span>
              ` : ''}
            </div>
            <div class="flex items-center">
              <i class="fas fa-building w-4 mr-2"></i>
              <span class="truncate">${publication.institution}</span>
            </div>
          </div>

          <!-- Footer with metrics and DOI -->
          <div class="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
            <div class="flex items-center space-x-3">
              <span class="flex items-center text-xs text-gray-600">
                <i class="fas fa-quote-left w-3 mr-1"></i>
                ${publication.citation_count}
              </span>
              <span class="flex items-center text-xs text-gray-600">
                <i class="fas fa-download w-3 mr-1"></i>
                ${publication.download_count}
              </span>
              <span class="flex items-center text-xs text-gray-600">
                <i class="fas fa-eye w-3 mr-1"></i>
                ${publication.view_count}
              </span>
            </div>
            <div class="text-right">
              <div class="text-xs font-semibold text-blue-600 truncate">
                DOI: ${publication.doi}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderPagination() {
    if (this.totalPages <= 1) return '';

    const pagination = `
      <div class="flex items-center justify-between bg-white px-6 py-4 rounded-lg border border-gray-200">
        <div class="flex items-center text-sm text-gray-700">
          <span>
            Mostrando página <span class="font-semibold">${this.currentPage}</span> de 
            <span class="font-semibold">${this.totalPages}</span>
          </span>
        </div>
        
        <div class="flex items-center space-x-2">
          ${this.currentPage > 1 ? `
            <button 
              onclick="publicationsPortal.goToPage(${this.currentPage - 1})" 
              class="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <i class="fas fa-chevron-left mr-1"></i>
              Anterior
            </button>
          ` : ''}
          
          ${this.renderPageNumbers()}
          
          ${this.currentPage < this.totalPages ? `
            <button 
              onclick="publicationsPortal.goToPage(${this.currentPage + 1})" 
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

    return pagination;
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
          onclick="publicationsPortal.goToPage(${i})" 
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
    this.showLoading();
    
    try {
      await this.loadPublications();
      this.renderPublications();
      this.renderPagination();
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error loading page:', error);
      this.showError('Error cargando la página');
    } finally {
      this.hideLoading();
    }
  }

  async showPublicationDetails(publicationId) {
    try {
      // Show modal with loading
      const modal = document.getElementById('publication-modal');
      const modalContent = document.getElementById('modal-content');
      
      modal.classList.remove('hidden');
      modalContent.innerHTML = `
        <div class="flex items-center justify-center p-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Cargando detalles de la publicación...</p>
          </div>
        </div>
      `;

      // Load publication details
      const response = await axios.get(`/api/publications/${publicationId}`);
      
      if (response.data.success) {
        this.currentPublication = response.data.data;
        
        // Load citation formats
        const citationResponse = await axios.get(`/api/publications/${publicationId}/citation`);
        let citations = [];
        if (citationResponse.data.success) {
          citations = citationResponse.data.data.citations;
        }

        modalContent.innerHTML = this.renderPublicationModal(this.currentPublication, citations);
      }
    } catch (error) {
      console.error('Error loading publication details:', error);
      this.showError('Error cargando los detalles de la publicación');
      this.closeModal();
    }
  }

  renderPublicationModal(publication, citations = []) {
    const authors = publication.authors.sort((a, b) => a.position - b.position);
    const correspondingAuthor = authors.find(a => a.id === publication.corresponding_author_id);
    const year = new Date(publication.publication_date).getFullYear();

    return `
      <div class="relative">
        <!-- Close button -->
        <button 
          onclick="publicationsPortal.closeModal()" 
          class="absolute top-4 right-4 z-10 w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center transition-colors"
        >
          <i class="fas fa-times text-gray-600"></i>
        </button>

        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8">
          <div class="flex flex-wrap gap-3 mb-4">
            <span class="bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-3 py-1 rounded-full">
              ${publication.publication_type.charAt(0).toUpperCase() + publication.publication_type.slice(1)}
            </span>
            ${publication.featured ? 
              '<span class="bg-yellow-400 text-yellow-900 text-sm font-semibold px-3 py-1 rounded-full"><i class="fas fa-star mr-1"></i>Destacada</span>' : 
              ''
            }
            ${publication.access_type === 'open_access' ? 
              '<span class="bg-green-400 text-green-900 text-sm font-semibold px-3 py-1 rounded-full"><i class="fas fa-unlock mr-1"></i>Acceso Abierto</span>' : 
              '<span class="bg-red-400 text-red-900 text-sm font-semibold px-3 py-1 rounded-full"><i class="fas fa-lock mr-1"></i>Acceso Restringido</span>'
            }
            ${publication.peer_reviewed ? 
              '<span class="bg-blue-400 text-blue-900 text-sm font-semibold px-3 py-1 rounded-full"><i class="fas fa-check-circle mr-1"></i>Revisado por Pares</span>' : ''
            }
          </div>
          
          <h2 class="text-3xl font-bold mb-4 leading-tight">
            ${publication.title}
          </h2>
          
          <div class="text-blue-100 space-y-2">
            <div class="flex items-center">
              <i class="fas fa-users mr-3"></i>
              <span class="font-medium">
                ${authors.map(a => a.name).join(', ')}
              </span>
            </div>
            <div class="flex items-center">
              <i class="fas fa-calendar mr-3"></i>
              <span>${year}</span>
              ${publication.journal_name ? `
                <i class="fas fa-book-open ml-6 mr-3"></i>
                <span class="font-medium">${publication.journal_name}</span>
              ` : ''}
            </div>
            <div class="flex items-center">
              <i class="fas fa-building mr-3"></i>
              <span>${publication.institution}</span>
              ${publication.department ? `, ${publication.department}` : ''}
            </div>
            <div class="flex items-center">
              <i class="fas fa-link mr-3"></i>
              <span class="font-mono text-sm bg-white/10 backdrop-blur-sm px-2 py-1 rounded">
                DOI: ${publication.doi}
              </span>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8">
          <!-- Abstract -->
          <div class="mb-8">
            <h3 class="text-xl font-bold text-gray-900 mb-4">
              <i class="fas fa-file-alt mr-2 text-blue-600"></i>
              Resumen
            </h3>
            <p class="text-gray-700 leading-relaxed text-justify">
              ${publication.abstract}
            </p>
          </div>

          <!-- Two-column layout -->
          <div class="grid lg:grid-cols-3 gap-8">
            <!-- Left column -->
            <div class="lg:col-span-2 space-y-8">
              
              <!-- Authors Details -->
              <div>
                <h3 class="text-xl font-bold text-gray-900 mb-4">
                  <i class="fas fa-users mr-2 text-blue-600"></i>
                  Autores
                </h3>
                <div class="space-y-3">
                  ${authors.map(author => `
                    <div class="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                      <div>
                        <div class="font-semibold text-gray-900">
                          ${author.name}
                          ${author.id === correspondingAuthor?.id ? 
                            '<span class="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Corresponsal</span>' : 
                            ''
                          }
                        </div>
                        <div class="text-sm text-gray-600">${author.affiliation}</div>
                        ${author.contribution ? `
                          <div class="text-xs text-gray-500 mt-1">
                            <strong>Contribución:</strong> ${author.contribution}
                          </div>
                        ` : ''}
                      </div>
                      <div class="text-right">
                        ${author.orcid ? `
                          <div class="text-xs text-green-600 font-mono">
                            <i class="fas fa-id-card mr-1"></i>
                            ORCID: ${author.orcid}
                          </div>
                        ` : ''}
                        <div class="text-xs text-gray-500">
                          ${author.email}
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Keywords and Subject Areas -->
              <div class="grid md:grid-cols-2 gap-6">
                ${publication.keywords.length > 0 ? `
                  <div>
                    <h4 class="font-semibold text-gray-900 mb-3">
                      <i class="fas fa-tags mr-2 text-green-600"></i>
                      Palabras Clave
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      ${publication.keywords.map(keyword => `
                        <span class="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                          ${keyword}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
                
                ${publication.subject_areas.length > 0 ? `
                  <div>
                    <h4 class="font-semibold text-gray-900 mb-3">
                      <i class="fas fa-atom mr-2 text-purple-600"></i>
                      Áreas Temáticas
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      ${publication.subject_areas.map(area => `
                        <span class="bg-purple-100 text-purple-800 text-sm px-3 py-1 rounded-full">
                          ${area}
                        </span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>

              <!-- Funding Sources -->
              ${publication.funding_sources && publication.funding_sources.length > 0 ? `
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-hand-holding-usd mr-2 text-yellow-600"></i>
                    Financiamiento
                  </h3>
                  <div class="space-y-3">
                    ${publication.funding_sources.map(fund => `
                      <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="font-semibold text-gray-900">${fund.name}</div>
                        ${fund.grant_number ? `
                          <div class="text-sm text-gray-600">
                            <strong>Número de Grant:</strong> ${fund.grant_number}
                          </div>
                        ` : ''}
                        ${fund.amount ? `
                          <div class="text-sm text-gray-600">
                            <strong>Monto:</strong> ${fund.amount.toLocaleString()} ${fund.currency || ''}
                          </div>
                        ` : ''}
                        <div class="text-xs text-gray-500 mt-1">
                          Tipo: ${fund.type} ${fund.country ? ` | País: ${fund.country}` : ''}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}

              <!-- Citations -->
              ${citations.length > 0 ? `
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-quote-left mr-2 text-indigo-600"></i>
                    Cómo Citar
                  </h3>
                  <div class="space-y-3">
                    ${citations.map(citation => `
                      <div class="bg-gray-50 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-2">
                          <span class="font-semibold text-gray-900 uppercase text-sm">
                            ${citation.format}
                          </span>
                          <button 
                            onclick="publicationsPortal.copyCitation('${citation.citation.replace(/'/g, "\\'")}')"
                            class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                          >
                            <i class="fas fa-copy mr-1"></i>
                            Copiar
                          </button>
                        </div>
                        <div class="text-sm text-gray-700 font-mono leading-relaxed">
                          ${citation.citation}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>

            <!-- Right column -->
            <div class="space-y-6">
              
              <!-- Metrics -->
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h4 class="font-bold text-gray-900 mb-4">
                  <i class="fas fa-chart-line mr-2 text-blue-600"></i>
                  Métricas de Impacto
                </h4>
                <div class="space-y-4">
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">
                      <i class="fas fa-quote-left w-4 mr-2"></i>
                      Citas
                    </span>
                    <span class="font-bold text-lg text-blue-600">${publication.citation_count}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">
                      <i class="fas fa-download w-4 mr-2"></i>
                      Descargas
                    </span>
                    <span class="font-bold text-lg text-green-600">${publication.download_count}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-gray-600">
                      <i class="fas fa-eye w-4 mr-2"></i>
                      Visualizaciones
                    </span>
                    <span class="font-bold text-lg text-purple-600">${publication.view_count}</span>
                  </div>
                  ${publication.altmetric_score ? `
                    <div class="flex items-center justify-between">
                      <span class="text-gray-600">
                        <i class="fas fa-share-alt w-4 mr-2"></i>
                        Altmetric
                      </span>
                      <span class="font-bold text-lg text-orange-600">${publication.altmetric_score}</span>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Publication Details -->
              <div class="bg-gray-50 rounded-xl p-6">
                <h4 class="font-bold text-gray-900 mb-4">
                  <i class="fas fa-info-circle mr-2 text-gray-600"></i>
                  Detalles de Publicación
                </h4>
                <div class="space-y-3 text-sm">
                  ${publication.journal_name ? `
                    <div>
                      <span class="font-semibold text-gray-700">Revista:</span>
                      <div class="text-gray-600">${publication.journal_name}</div>
                      ${publication.journal_issn ? `
                        <div class="text-xs text-gray-500">ISSN: ${publication.journal_issn}</div>
                      ` : ''}
                    </div>
                  ` : ''}
                  
                  ${publication.volume || publication.issue || publication.pages ? `
                    <div>
                      <span class="font-semibold text-gray-700">Volumen/Número:</span>
                      <div class="text-gray-600">
                        ${[publication.volume, publication.issue, publication.pages].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  ` : ''}
                  
                  <div>
                    <span class="font-semibold text-gray-700">Fecha de Publicación:</span>
                    <div class="text-gray-600">${new Date(publication.publication_date).toLocaleDateString('es-ES')}</div>
                  </div>
                  
                  <div>
                    <span class="font-semibold text-gray-700">Licencia:</span>
                    <div class="text-gray-600">${publication.license}</div>
                  </div>
                  
                  <div>
                    <span class="font-semibold text-gray-700">Idioma:</span>
                    <div class="text-gray-600">${publication.language === 'es' ? 'Español' : publication.language === 'en' ? 'Inglés' : publication.language}</div>
                  </div>
                  
                  ${publication.geographic_coverage ? `
                    <div>
                      <span class="font-semibold text-gray-700">Cobertura Geográfica:</span>
                      <div class="text-gray-600">${publication.geographic_coverage.join(', ')}</div>
                    </div>
                  ` : ''}
                </div>
              </div>

              <!-- Actions -->
              <div class="bg-white border-2 border-dashed border-gray-200 rounded-xl p-6">
                <h4 class="font-bold text-gray-900 mb-4">
                  <i class="fas fa-download mr-2 text-blue-600"></i>
                  Descargar & Compartir
                </h4>
                <div class="space-y-3">
                  ${publication.pdf_url ? `
                    <button 
                      onclick="window.open('${publication.pdf_url}', '_blank')"
                      class="w-full bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                    >
                      <i class="fas fa-file-pdf mr-2"></i>
                      Descargar PDF
                    </button>
                  ` : ''}
                  
                  <button 
                    onclick="publicationsPortal.sharePublication('${publication.id}')"
                    class="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                  >
                    <i class="fas fa-share mr-2"></i>
                    Compartir
                  </button>
                  
                  <button 
                    onclick="window.open('https://doi.org/${publication.doi}', '_blank')"
                    class="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                  >
                    <i class="fas fa-external-link-alt mr-2"></i>
                    Ver DOI
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  copyCitation(citation) {
    navigator.clipboard.writeText(citation).then(() => {
      this.showSuccess('Cita copiada al portapapeles');
    }).catch(() => {
      this.showError('Error al copiar la cita');
    });
  }

  sharePublication(publicationId) {
    const url = `${window.location.origin}/publicaciones?pub=${publicationId}`;
    
    if (navigator.share) {
      navigator.share({
        title: this.currentPublication?.title || 'Publicación Científica',
        text: this.currentPublication?.abstract || '',
        url: url
      });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.showSuccess('URL copiada al portapapeles');
      }).catch(() => {
        this.showError('Error al compartir la publicación');
      });
    }
  }

  closeModal() {
    const modal = document.getElementById('publication-modal');
    modal.classList.add('hidden');
    this.currentPublication = null;
  }

  showLoading() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-overlay';
    loadingDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loadingDiv.innerHTML = `
      <div class="bg-white rounded-lg p-8 text-center">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p class="text-gray-700">Cargando publicaciones...</p>
      </div>
    `;
    document.body.appendChild(loadingDiv);
  }

  hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
      loading.remove();
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
  window.publicationsPortal = new PublicationsPortal();
});