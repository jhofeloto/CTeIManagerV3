// CODECTI Platform - Public News Portal (No Authentication Required)
// HU-09: Sistema de Noticias/Blog - Public Frontend

const PublicNews = {
  currentPage: 1,
  totalPages: 1,
  filters: {
    search: '',
    category: '',
    tag: '',
    sort: 'published_at',
    order: 'desc'
  },
  
  // Initialize public news portal
  async init() {
    console.log('📰 Initializing Public News Portal');
    
    try {
      // Load initial data
      await this.loadCategories();
      await this.loadFeaturedNews();
      await this.loadRecentNews();
      await this.loadNewsArticles();
      
      // Setup event listeners
      this.setupEventListeners();
      
      console.log('✅ Public News Portal initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Public News Portal:', error);
      this.showError('Error al cargar el portal de noticias');
    }
  },

  // Setup event listeners
  setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('newsSearchForm');
    if (searchForm) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSearch();
      });
    }

    // Filter dropdowns
    ['newsCategoryFilter', 'newsTagFilter', 'newsSortFilter'].forEach(filterId => {
      const filterElement = document.getElementById(filterId);
      if (filterElement) {
        filterElement.addEventListener('change', () => this.handleFilters());
      }
    });

    // Pagination event delegation
    const newsContent = document.getElementById('newsContent');
    if (newsContent) {
      newsContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('news-page-btn')) {
          const page = parseInt(e.target.dataset.page);
          if (!isNaN(page)) {
            this.currentPage = page;
            this.loadNewsArticles();
          }
        }
      });
    }

    // Article details modal
    this.setupModalEventListeners();
  },

  // Setup modal event listeners
  setupModalEventListeners() {
    const modal = document.getElementById('articleModal');
    const closeBtn = document.getElementById('closeArticleModal');
    
    if (modal && closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
      
      // Close modal when clicking outside
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          modal.classList.add('hidden');
        }
      });
    }
  },

  // Handle search
  handleSearch() {
    const searchInput = document.getElementById('newsSearchInput');
    if (searchInput) {
      this.filters.search = searchInput.value.trim();
      this.currentPage = 1;
      this.loadNewsArticles();
    }
  },

  // Handle filters
  handleFilters() {
    const categoryFilter = document.getElementById('newsCategoryFilter');
    const tagFilter = document.getElementById('newsTagFilter');
    const sortFilter = document.getElementById('newsSortFilter');

    if (categoryFilter) this.filters.category = categoryFilter.value;
    if (tagFilter) this.filters.tag = tagFilter.value;
    if (sortFilter) {
      const [sort, order] = sortFilter.value.split('_');
      this.filters.sort = sort;
      this.filters.order = order;
    }

    this.currentPage = 1;
    this.loadNewsArticles();
  },

  // Load categories for filters
  async loadCategories() {
    try {
      const response = await axios.get('/api/public/news/categories');
      
      if (response.data.success) {
        this.categories = response.data.categories;
        this.updateCategoryFilter();
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      this.categories = [];
    }
  },

  // Update category filter dropdown
  updateCategoryFilter() {
    const categoryFilter = document.getElementById('newsCategoryFilter');
    
    if (categoryFilter && this.categories) {
      categoryFilter.innerHTML = `
        <option value="">Todas las categorías</option>
        ${this.categories.map(cat => 
          `<option value="${cat.slug}">${cat.name} (${cat.articles_count || 0})</option>`
        ).join('')}
      `;
    }
  },

  // Load featured news for hero section
  async loadFeaturedNews() {
    try {
      const response = await axios.get('/api/public/news/featured?limit=3');
      
      if (response.data.success && response.data.articles.length > 0) {
        this.renderFeaturedNews(response.data.articles);
      }
    } catch (error) {
      console.error('❌ Error loading featured news:', error);
    }
  },

  // Load recent news for sidebar
  async loadRecentNews() {
    try {
      const response = await axios.get('/api/public/news/recent?limit=5');
      
      if (response.data.success) {
        this.renderRecentNews(response.data.articles);
      }
    } catch (error) {
      console.error('❌ Error loading recent news:', error);
    }
  },

  // Load news articles with filters and pagination
  async loadNewsArticles() {
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: 12,
        search: this.filters.search,
        category: this.filters.category,
        tag: this.filters.tag,
        sort: this.filters.sort,
        order: this.filters.order
      });

      const response = await axios.get(`/api/public/news?${params}`);

      if (response.data.success) {
        this.renderNewsArticles(response.data.articles);
        this.renderNewsPagination(response.data);
        this.totalPages = response.data.totalPages;
        this.updateResultsCount(response.data);
      } else {
        throw new Error(response.data.message || 'Error al cargar noticias');
      }
    } catch (error) {
      console.error('❌ Error loading news articles:', error);
      this.showError('Error al cargar las noticias');
    }
  },

  // Render featured news in hero section
  renderFeaturedNews(articles) {
    const featuredContainer = document.getElementById('featuredNewsContainer');
    if (!featuredContainer || articles.length === 0) return;

    const mainArticle = articles[0];
    const sideArticles = articles.slice(1);

    featuredContainer.innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Main Featured Article -->
        <div class="lg:col-span-1">
          <div class="relative bg-white rounded-lg shadow-lg overflow-hidden h-full">
            ${mainArticle.featured_image ? 
              `<img src="${mainArticle.featured_image}" alt="${this.escapeHtml(mainArticle.title)}" class="w-full h-64 object-cover">` :
              `<div class="w-full h-64 bg-gradient-to-r from-codecti-primary to-codecti-secondary flex items-center justify-center">
                <i class="fas fa-newspaper text-white text-6xl opacity-50"></i>
              </div>`
            }
            <div class="p-6">
              <div class="flex items-center justify-between mb-3">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-codecti-primary text-white">
                  <i class="fas fa-star mr-1"></i>
                  Destacado
                </span>
                <span class="text-sm text-gray-500">
                  <i class="fas fa-calendar mr-1"></i>
                  ${this.formatDate(mainArticle.published_at)}
                </span>
              </div>
              <h2 class="text-2xl font-bold text-gray-900 mb-3 leading-tight">
                ${this.escapeHtml(mainArticle.title)}
              </h2>
              <p class="text-gray-600 mb-4 line-clamp-3">
                ${this.escapeHtml(mainArticle.summary)}
              </p>
              <div class="flex items-center justify-between">
                <div class="flex items-center text-sm text-gray-500">
                  <i class="fas fa-user mr-1"></i>
                  ${this.escapeHtml(mainArticle.author_name)}
                  <span class="mx-2">•</span>
                  <i class="fas fa-tag mr-1"></i>
                  ${this.escapeHtml(mainArticle.category_name)}
                </div>
                <button onclick="PublicNews.viewArticle('${mainArticle.slug}')" 
                        class="inline-flex items-center px-4 py-2 bg-codecti-primary text-white text-sm font-medium rounded-md hover:bg-codecti-secondary transition-colors">
                  Leer más
                  <i class="fas fa-arrow-right ml-2"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Side Featured Articles -->
        <div class="lg:col-span-1 space-y-4">
          ${sideArticles.map(article => `
            <div class="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer" 
                 onclick="PublicNews.viewArticle('${article.slug}')">
              <div class="flex items-start space-x-4">
                ${article.featured_image ? 
                  `<img src="${article.featured_image}" alt="${this.escapeHtml(article.title)}" class="w-20 h-20 object-cover rounded-lg flex-shrink-0">` :
                  `<div class="w-20 h-20 bg-gradient-to-r from-codecti-primary to-codecti-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    <i class="fas fa-newspaper text-white text-lg"></i>
                  </div>`
                }
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    ${this.escapeHtml(article.title)}
                  </h3>
                  <div class="flex items-center text-sm text-gray-500">
                    <i class="fas fa-calendar mr-1"></i>
                    ${this.formatDate(article.published_at)}
                    <span class="mx-2">•</span>
                    <i class="fas fa-eye mr-1"></i>
                    ${article.views_count} vistas
                  </div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Render recent news in sidebar
  renderRecentNews(articles) {
    const recentContainer = document.getElementById('recentNewsContainer');
    if (!recentContainer || articles.length === 0) return;

    recentContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-clock mr-2 text-codecti-primary"></i>
          Noticias Recientes
        </h3>
        <div class="space-y-4">
          ${articles.map(article => `
            <div class="border-b border-gray-200 pb-4 last:border-b-0 last:pb-0">
              <h4 class="text-sm font-medium text-gray-900 mb-2 hover:text-codecti-primary cursor-pointer transition-colors"
                  onclick="PublicNews.viewArticle('${article.slug}')">
                ${this.escapeHtml(article.title)}
              </h4>
              <div class="flex items-center text-xs text-gray-500">
                <i class="fas fa-calendar mr-1"></i>
                ${this.formatDate(article.published_at)}
                <span class="mx-2">•</span>
                <i class="fas fa-eye mr-1"></i>
                ${article.views_count} vistas
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  // Render news articles grid
  renderNewsArticles(articles) {
    const articlesContainer = document.getElementById('newsArticlesContainer');
    if (!articlesContainer) return;

    if (articles.length === 0) {
      articlesContainer.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-newspaper text-gray-400 text-6xl mb-4"></i>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No se encontraron noticias</h3>
          <p class="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      `;
      return;
    }

    articlesContainer.innerHTML = articles.map(article => `
      <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
           onclick="PublicNews.viewArticle('${article.slug}')">
        ${article.featured_image ? 
          `<img src="${article.featured_image}" alt="${this.escapeHtml(article.title)}" class="w-full h-48 object-cover">` :
          `<div class="w-full h-48 bg-gradient-to-r from-codecti-primary to-codecti-secondary flex items-center justify-center">
            <i class="fas fa-newspaper text-white text-4xl opacity-50"></i>
          </div>`
        }
        <div class="p-6">
          <div class="flex items-center justify-between mb-3">
            <span class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" 
                  style="background-color: ${this.getCategoryColor(article.category_slug)}20; color: ${this.getCategoryColor(article.category_slug)}">
              ${this.escapeHtml(article.category_name)}
            </span>
            <span class="text-xs text-gray-500">
              <i class="fas fa-eye mr-1"></i>
              ${article.views_count}
            </span>
          </div>
          <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            ${this.escapeHtml(article.title)}
          </h3>
          <p class="text-gray-600 text-sm mb-4 line-clamp-3">
            ${this.escapeHtml(article.summary)}
          </p>
          <div class="flex items-center justify-between text-sm text-gray-500">
            <div class="flex items-center">
              <i class="fas fa-user mr-1"></i>
              ${this.escapeHtml(article.author_name)}
            </div>
            <div class="flex items-center">
              <i class="fas fa-calendar mr-1"></i>
              ${this.formatDate(article.published_at)}
            </div>
          </div>
          ${article.tags && article.tags.length > 0 ? `
            <div class="mt-3 flex flex-wrap gap-1">
              ${article.tags.slice(0, 3).map(tag => `
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  #${this.escapeHtml(tag)}
                </span>
              `).join('')}
              ${article.tags.length > 3 ? `
                <span class="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                  +${article.tags.length - 3} más
                </span>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  },

  // Render pagination
  renderNewsPagination(data) {
    const paginationContainer = document.getElementById('newsPagination');
    if (!paginationContainer) return;

    const { page, totalPages, hasNext, hasPrev } = data;
    
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-lg sm:px-6">
        <div class="flex justify-between flex-1 sm:hidden">
          ${hasPrev ? 
            `<button class="news-page-btn relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" data-page="${page - 1}">
              Anterior
            </button>` : 
            '<span></span>'
          }
          ${hasNext ? 
            `<button class="news-page-btn relative inline-flex items-center px-4 py-2 ml-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" data-page="${page + 1}">
              Siguiente
            </button>` : 
            '<span></span>'
          }
        </div>
        <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Página <span class="font-medium">${page}</span> de <span class="font-medium">${totalPages}</span>
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
    `;

    // Previous button
    paginationHTML += hasPrev ? 
      `<button class="news-page-btn relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50" data-page="${page - 1}">
        <i class="fas fa-chevron-left"></i>
      </button>` :
      `<span class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-300">
        <i class="fas fa-chevron-left"></i>
      </span>`;

    // Page numbers
    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(totalPages, page + 2);

    for (let i = startPage; i <= endPage; i++) {
      if (i === page) {
        paginationHTML += `<button class="relative inline-flex items-center px-4 py-2 border border-codecti-primary bg-codecti-primary text-sm font-medium text-white">${i}</button>`;
      } else {
        paginationHTML += `<button class="news-page-btn relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" data-page="${i}">${i}</button>`;
      }
    }

    // Next button
    paginationHTML += hasNext ? 
      `<button class="news-page-btn relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50" data-page="${page + 1}">
        <i class="fas fa-chevron-right"></i>
      </button>` :
      `<span class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-gray-50 text-sm font-medium text-gray-300">
        <i class="fas fa-chevron-right"></i>
      </span>`;

    paginationHTML += `
            </nav>
          </div>
        </div>
      </div>
    `;

    paginationContainer.innerHTML = paginationHTML;
  },

  // Update results count
  updateResultsCount(data) {
    const resultsCount = document.getElementById('newsResultsCount');
    if (resultsCount) {
      const start = ((data.page - 1) * data.limit) + 1;
      const end = Math.min(data.page * data.limit, data.total);
      
      resultsCount.textContent = data.total > 0 ? 
        `Mostrando ${start}-${end} de ${data.total} noticias` :
        'No se encontraron noticias';
    }
  },

  // View article in modal
  async viewArticle(slug) {
    try {
      const response = await axios.get(`/api/public/news/${slug}`);
      
      if (response.data.success) {
        this.showArticleModal(response.data.article);
      } else {
        this.showError('Artículo no encontrado');
      }
    } catch (error) {
      console.error('❌ Error loading article:', error);
      this.showError('Error al cargar el artículo');
    }
  },

  // Show article modal
  showArticleModal(article) {
    const modal = document.getElementById('articleModal');
    const modalContent = document.getElementById('articleModalContent');
    
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div class="relative">
          ${article.featured_image ? 
            `<img src="${article.featured_image}" alt="${this.escapeHtml(article.title)}" class="w-full h-64 object-cover">` :
            `<div class="w-full h-64 bg-gradient-to-r from-codecti-primary to-codecti-secondary flex items-center justify-center">
              <i class="fas fa-newspaper text-white text-6xl opacity-50"></i>
            </div>`
          }
          <button id="closeArticleModal" 
                  class="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-70 transition-all">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="p-8 overflow-y-auto max-h-[60vh]">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-4">
              <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium" 
                    style="background-color: ${this.getCategoryColor(article.category_slug)}20; color: ${this.getCategoryColor(article.category_slug)}">
                ${this.escapeHtml(article.category_name)}
              </span>
              <div class="flex items-center text-sm text-gray-500">
                <i class="fas fa-eye mr-1"></i>
                ${article.views_count} vistas
              </div>
            </div>
            <span class="text-sm text-gray-500">
              <i class="fas fa-calendar mr-1"></i>
              ${this.formatDate(article.published_at)}
            </span>
          </div>

          <h1 class="text-3xl font-bold text-gray-900 mb-4">
            ${this.escapeHtml(article.title)}
          </h1>

          <div class="flex items-center text-sm text-gray-600 mb-6">
            <i class="fas fa-user mr-2"></i>
            <span class="font-medium">${this.escapeHtml(article.author_name)}</span>
            <span class="mx-3">•</span>
            <i class="fas fa-clock mr-2"></i>
            <span>Actualizado: ${this.formatDate(article.updated_at)}</span>
          </div>

          <div class="prose prose-lg max-w-none mb-6">
            <div class="text-lg text-gray-700 font-medium mb-4">
              ${this.escapeHtml(article.summary)}
            </div>
            <div class="text-gray-700 leading-relaxed">
              ${article.content || ''}
            </div>
          </div>

          ${article.tags && article.tags.length > 0 ? `
            <div class="border-t pt-6">
              <h3 class="text-sm font-medium text-gray-900 mb-3">
                <i class="fas fa-tags mr-2"></i>
                Etiquetas
              </h3>
              <div class="flex flex-wrap gap-2">
                ${article.tags.map(tag => `
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 cursor-pointer transition-colors">
                    #${this.escapeHtml(tag)}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
    
    // Re-setup close button event listener
    const newCloseBtn = document.getElementById('closeArticleModal');
    if (newCloseBtn) {
      newCloseBtn.addEventListener('click', () => {
        modal.classList.add('hidden');
      });
    }
  },

  // Utility functions
  getCategoryColor(categorySlug) {
    const colors = {
      'ciencia-tecnologia': '#3b82f6',
      'innovacion': '#10b981',
      'biodiversidad': '#059669',
      'desarrollo-sostenible': '#84cc16',
      'educacion-ctei': '#f59e0b'
    };
    return colors[categorySlug] || '#6b7280';
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
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
    // Simple error notification - could be enhanced with a proper notification system
    console.error('PublicNews Error:', message);
    alert(`❌ ${message}`);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PublicNews.init());
} else {
  PublicNews.init();
}