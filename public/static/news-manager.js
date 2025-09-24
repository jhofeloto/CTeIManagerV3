// CODECTI Platform - News Manager (Admin Panel)
// HU-09: Sistema de Noticias/Blog - Admin CRUD Interface

const NewsManager = {
  currentPage: 1,
  totalPages: 1,
  filters: {
    search: '',
    status: '',
    category: '',
    author: '',
    sort: 'created_at',
    order: 'desc'
  },
  
  // Initialize news manager
  async init() {
    console.log('🗞️ Initializing News Manager');
    
    // Check authentication
    const authCheck = await this.checkAuthentication();
    if (!authCheck) {
      window.location.href = '/';
      return;
    }

    // Load data
    await this.loadCategories();
    await this.loadTags();
    await this.loadNewsArticles();
    
    // Setup event listeners
    this.setupEventListeners();
    
    console.log('✅ News Manager initialized successfully');
  },

  // Check if user is authenticated and has proper permissions
  async checkAuthentication() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return false;
      }

      const response = await axios.get('/api/monitoring/admin/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      return response.data.success;
    } catch (error) {
      console.error('❌ Authentication check failed:', error);
      return false;
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
    ['newsStatusFilter', 'newsCategoryFilter', 'newsAuthorFilter', 'newsSortFilter'].forEach(filterId => {
      const filterElement = document.getElementById(filterId);
      if (filterElement) {
        filterElement.addEventListener('change', () => this.handleFilters());
      }
    });

    // Create new article button
    const createBtn = document.getElementById('createNewsBtn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.showCreateNewsModal());
    }

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
    const statusFilter = document.getElementById('newsStatusFilter');
    const categoryFilter = document.getElementById('newsCategoryFilter');
    const authorFilter = document.getElementById('newsAuthorFilter');
    const sortFilter = document.getElementById('newsSortFilter');

    if (statusFilter) this.filters.status = statusFilter.value;
    if (categoryFilter) this.filters.category = categoryFilter.value;
    if (authorFilter) this.filters.author = authorFilter.value;
    if (sortFilter) {
      const [sort, order] = sortFilter.value.split('_');
      this.filters.sort = sort;
      this.filters.order = order;
    }

    this.currentPage = 1;
    this.loadNewsArticles();
  },

  // Load categories for filters and forms
  async loadCategories() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/news/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        this.categories = response.data.categories;
        this.updateCategoryFilters();
      }
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      this.categories = [];
    }
  },

  // Load tags for forms
  async loadTags() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/news/tags', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        this.tags = response.data.tags;
      }
    } catch (error) {
      console.error('❌ Error loading tags:', error);
      this.tags = [];
    }
  },

  // Update category filter dropdown
  updateCategoryFilters() {
    const categoryFilter = document.getElementById('newsCategoryFilter');
    const categorySelect = document.getElementById('articleCategorySelect');
    
    if (categoryFilter) {
      categoryFilter.innerHTML = `
        <option value="">Todas las categorías</option>
        ${this.categories.map(cat => 
          `<option value="${cat.slug}">${cat.name}</option>`
        ).join('')}
      `;
    }

    if (categorySelect) {
      categorySelect.innerHTML = `
        <option value="">Seleccionar categoría</option>
        ${this.categories.map(cat => 
          `<option value="${cat.id}">${cat.name}</option>`
        ).join('')}
      `;
    }
  },

  // Load news articles with filters and pagination
  async loadNewsArticles() {
    try {
      const params = new URLSearchParams({
        page: this.currentPage,
        limit: 10,
        search: this.filters.search,
        status: this.filters.status,
        category: this.filters.category,
        author: this.filters.author,
        sort: this.filters.sort,
        order: this.filters.order
      });

      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/news?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        this.renderNewsArticles(response.data.articles);
        this.renderNewsPagination(response.data);
        this.totalPages = response.data.totalPages;
      } else {
        throw new Error(response.data.message || 'Error al cargar artículos');
      }
    } catch (error) {
      console.error('❌ Error loading news articles:', error);
      this.showError('Error al cargar artículos de noticias');
    }
  },

  // Render news articles table
  renderNewsArticles(articles) {
    const tableBody = document.getElementById('newsTableBody');
    if (!tableBody) return;

    if (articles.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="7" class="px-6 py-4 text-center text-gray-500">
            <i class="fas fa-newspaper mr-2"></i>
            No se encontraron artículos de noticias
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = articles.map(article => `
      <tr class="border-b border-gray-200 hover:bg-gray-50">
        <td class="px-4 py-3">
          <div class="flex items-center">
            <div>
              <div class="text-sm font-medium text-gray-900">${this.escapeHtml(article.title)}</div>
              <div class="text-sm text-gray-500">
                <i class="fas fa-user mr-1"></i>${this.escapeHtml(article.author_name || 'Sin autor')}
              </div>
            </div>
          </div>
        </td>
        <td class="px-4 py-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusColor(article.status)}">
            <i class="fas ${this.getStatusIcon(article.status)} mr-1"></i>
            ${this.getStatusText(article.status)}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-gray-900">
          <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
            ${this.escapeHtml(article.category_name || 'Sin categoría')}
          </span>
        </td>
        <td class="px-4 py-3 text-sm text-gray-500">
          <i class="fas fa-eye mr-1"></i>
          ${article.views_count || 0} vistas
        </td>
        <td class="px-4 py-3 text-sm text-gray-500">
          ${article.is_featured ? 
            '<i class="fas fa-star text-yellow-500 mr-1"></i>Destacado' : 
            '<i class="far fa-star text-gray-400 mr-1"></i>Normal'
          }
        </td>
        <td class="px-4 py-3 text-sm text-gray-500">
          ${this.formatDate(article.published_at || article.created_at)}
        </td>
        <td class="px-4 py-3 text-sm font-medium">
          <div class="flex space-x-2">
            <button onclick="NewsManager.viewArticle(${article.id})" 
                    class="text-blue-600 hover:text-blue-900" title="Ver">
              <i class="fas fa-eye"></i>
            </button>
            <button onclick="NewsManager.editArticle(${article.id})" 
                    class="text-green-600 hover:text-green-900" title="Editar">
              <i class="fas fa-edit"></i>
            </button>
            <button onclick="NewsManager.deleteArticle(${article.id})" 
                    class="text-red-600 hover:text-red-900" title="Eliminar">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
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
      <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
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
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
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

    if (startPage > 1) {
      paginationHTML += `<button class="news-page-btn relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" data-page="1">1</button>`;
      if (startPage > 2) {
        paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === page) {
        paginationHTML += `<button class="relative inline-flex items-center px-4 py-2 border border-codecti-primary bg-codecti-primary text-sm font-medium text-white">${i}</button>`;
      } else {
        paginationHTML += `<button class="news-page-btn relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" data-page="${i}">${i}</button>`;
      }
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        paginationHTML += `<span class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>`;
      }
      paginationHTML += `<button class="news-page-btn relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50" data-page="${totalPages}">${totalPages}</button>`;
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

  // Show create news modal
  showCreateNewsModal() {
    const modal = document.getElementById('newsModal');
    const modalTitle = document.getElementById('newsModalTitle');
    const newsForm = document.getElementById('newsForm');
    
    if (!modal || !modalTitle || !newsForm) return;

    modalTitle.textContent = 'Crear Nuevo Artículo';
    newsForm.reset();
    
    // Setup form for creation
    newsForm.dataset.mode = 'create';
    delete newsForm.dataset.articleId;
    
    // Update category and tag options
    this.updateCategoryFilters();
    this.updateTagsSelector();
    
    modal.classList.remove('hidden');
  },

  // Update tags selector
  updateTagsSelector() {
    const tagsContainer = document.getElementById('articleTagsContainer');
    if (!tagsContainer || !this.tags) return;

    tagsContainer.innerHTML = this.tags.map(tag => `
      <label class="inline-flex items-center mr-4 mb-2">
        <input type="checkbox" name="tags" value="${tag.id}" class="rounded border-gray-300 text-codecti-primary focus:ring-codecti-primary">
        <span class="ml-2 text-sm text-gray-700">${this.escapeHtml(tag.name)}</span>
      </label>
    `).join('');
  },

  // View article
  async viewArticle(articleId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/news/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        this.showArticleViewModal(response.data.article);
      } else {
        this.showError('Error al cargar el artículo');
      }
    } catch (error) {
      console.error('❌ Error viewing article:', error);
      this.showError('Error al cargar el artículo');
    }
  },

  // Edit article
  async editArticle(articleId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/news/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        this.showEditNewsModal(response.data.article);
      } else {
        this.showError('Error al cargar el artículo para edición');
      }
    } catch (error) {
      console.error('❌ Error loading article for edit:', error);
      this.showError('Error al cargar el artículo para edición');
    }
  },

  // Show edit news modal
  showEditNewsModal(article) {
    const modal = document.getElementById('newsModal');
    const modalTitle = document.getElementById('newsModalTitle');
    const newsForm = document.getElementById('newsForm');
    
    if (!modal || !modalTitle || !newsForm) return;

    modalTitle.textContent = 'Editar Artículo';
    
    // Setup form for editing
    newsForm.dataset.mode = 'edit';
    newsForm.dataset.articleId = article.id;
    
    // Populate form fields
    document.getElementById('articleTitle').value = article.title;
    document.getElementById('articleSummary').value = article.summary;
    document.getElementById('articleContent').value = article.content;
    document.getElementById('articleFeaturedImage').value = article.featured_image || '';
    document.getElementById('articleCategorySelect').value = article.category_id;
    document.getElementById('articleStatus').value = article.status;
    document.getElementById('articleFeatured').checked = article.is_featured;
    
    // Handle published_at field
    if (article.published_at) {
      const publishedDate = new Date(article.published_at);
      document.getElementById('articlePublishedAt').value = publishedDate.toISOString().slice(0, 16);
    }
    
    // Update selectors and populate tags
    this.updateCategoryFilters();
    this.updateTagsSelector();
    
    // Select current tags
    setTimeout(() => {
      const tagCheckboxes = document.querySelectorAll('input[name="tags"]');
      const currentTagIds = article.tags.map(tag => tag.id);
      
      tagCheckboxes.forEach(checkbox => {
        checkbox.checked = currentTagIds.includes(parseInt(checkbox.value));
      });
    }, 100);
    
    modal.classList.remove('hidden');
  },

  // Delete article
  async deleteArticle(articleId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este artículo? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`/api/news/${articleId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.data.success) {
        this.showSuccess('Artículo eliminado exitosamente');
        this.loadNewsArticles();
      } else {
        this.showError(response.data.message || 'Error al eliminar el artículo');
      }
    } catch (error) {
      console.error('❌ Error deleting article:', error);
      this.showError('Error al eliminar el artículo');
    }
  },

  // Utility functions
  getStatusColor(status) {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  },

  getStatusIcon(status) {
    switch (status) {
      case 'published': return 'fa-check-circle';
      case 'draft': return 'fa-edit';
      case 'archived': return 'fa-archive';
      default: return 'fa-question-circle';
    }
  },

  getStatusText(status) {
    switch (status) {
      case 'published': return 'Publicado';
      case 'draft': return 'Borrador';
      case 'archived': return 'Archivado';
      default: return 'Desconocido';
    }
  },

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  showSuccess(message) {
    // Simple success notification - could be enhanced with a proper notification system
    alert(`✅ ${message}`);
  },

  showError(message) {
    // Simple error notification - could be enhanced with a proper notification system
    alert(`❌ ${message}`);
  }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => NewsManager.init());
} else {
  NewsManager.init();
}