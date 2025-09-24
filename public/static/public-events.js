/**
 * HU-10: Sistema de Eventos y Convocatorias - Portal Público
 * 
 * Portal público para visualización y registro en eventos científicos y convocatorias.
 * Incluye búsqueda avanzada, filtros, detalles de eventos, y sistema de registro.
 */

class PublicEvents {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 12;
    this.events = [];
    this.categories = [];
    this.totalEvents = 0;
    this.currentFilters = {
      search: '',
      category: '',
      type: '',
      location: '',
      upcoming: false,
      featured: false,
      sort: 'start_date',
      order: 'asc'
    };
    this.isLoading = false;
    this.currentUser = null;
  }

  async init() {
    try {
      await this.checkAuthentication();
      await this.loadEventCategories();
      await this.loadFeaturedEvents();
      await this.loadEventsStats();
      await this.loadUpcomingEvents();
      await this.loadEvents();
      this.setupEventListeners();
      this.renderCategoriesSidebar();
    } catch (error) {
      console.error('Error initializing public events:', error);
      this.showNotification('Error al cargar eventos', 'error');
    }
  }

  async checkAuthentication() {
    try {
      const token = this.getCookie('auth-token');
      if (token) {
        // Try to get user info from a protected endpoint
        const response = await axios.get('/api/auth/me');
        if (response.data.success) {
          this.currentUser = response.data.user;
        }
      }
    } catch (error) {
      // User not authenticated, which is fine for public portal
      this.currentUser = null;
    }
  }

  getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  async loadEventCategories() {
    try {
      const response = await axios.get('/api/public/events/categories');
      if (response.data.success) {
        this.categories = response.data.data;
      }
    } catch (error) {
      console.error('Error loading event categories:', error);
    }
  }

  async loadFeaturedEvents() {
    try {
      const response = await axios.get('/api/public/events/featured', {
        params: { limit: 3 }
      });
      if (response.data.success) {
        this.renderFeaturedEvents(response.data.data);
      }
    } catch (error) {
      console.error('Error loading featured events:', error);
    }
  }

  async loadEventsStats() {
    try {
      const response = await axios.get('/api/public/events/stats');
      if (response.data.success) {
        this.renderEventsStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading events stats:', error);
    }
  }

  async loadUpcomingEvents() {
    try {
      const response = await axios.get('/api/public/events/upcoming', {
        params: { limit: 5 }
      });
      if (response.data.success) {
        this.renderUpcomingEvents(response.data.data);
      }
    } catch (error) {
      console.error('Error loading upcoming events:', error);
    }
  }

  async loadEvents() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoadingState();

    try {
      const params = {
        ...this.currentFilters,
        limit: this.pageSize,
        offset: (this.currentPage - 1) * this.pageSize
      };

      const response = await axios.get('/api/public/events', { params });
      
      if (response.data.success) {
        this.events = response.data.data.events;
        this.totalEvents = response.data.data.total;
        this.renderEvents();
        this.renderPagination();
        this.updateResultsCount();
      } else {
        throw new Error(response.data.error || 'Error loading events');
      }
    } catch (error) {
      console.error('Error loading events:', error);
      this.showNotification('Error al cargar eventos', 'error');
      this.renderEventsError();
    } finally {
      this.isLoading = false;
      this.hideLoadingState();
    }
  }

  setupEventListeners() {
    // Search form
    const searchForm = document.getElementById('eventsSearchForm');
    const searchInput = document.getElementById('eventsSearchInput');
    
    if (searchForm && searchInput) {
      searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.currentFilters.search = searchInput.value.trim();
        this.currentPage = 1;
        this.loadEvents();
      });

      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentFilters.search = e.target.value.trim();
          this.currentPage = 1;
          this.loadEvents();
        }, 500);
      });
    }

    // Filter controls
    const filters = [
      'eventsCategoryFilter',
      'eventsTypeFilter', 
      'eventsTimeFilter',
      'eventsSortFilter'
    ];

    filters.forEach(filterId => {
      const filter = document.getElementById(filterId);
      if (filter) {
        filter.addEventListener('change', (e) => {
          const filterName = filterId.replace('events', '').replace('Filter', '').toLowerCase();
          
          if (filterName === 'time') {
            // Handle time filters
            this.currentFilters.upcoming = false;
            if (e.target.value === 'upcoming') {
              this.currentFilters.upcoming = true;
            } else if (e.target.value === 'this_month') {
              // Filter by current month (implement if needed)
            }
          } else if (filterName === 'sort') {
            const [sort, order] = e.target.value.split('_');
            this.currentFilters.sort = sort === 'start' ? 'start_date' : sort;
            this.currentFilters.order = order || 'asc';
          } else {
            this.currentFilters[filterName] = e.target.value;
          }
          
          this.currentPage = 1;
          this.loadEvents();
        });
      }
    });

    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('[data-modal="close"]');
    modalCloseButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeAllModals();
      });
    });

    // Click outside modal to close
    window.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal-backdrop')) {
        this.closeAllModals();
      }
    });
  }

  renderFeaturedEvents(events) {
    const container = document.getElementById('featuredEventsContainer');
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="text-center text-white">
          <p class="text-lg opacity-75">No hay eventos destacados disponibles</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-${Math.min(events.length, 3)} gap-6">
        ${events.map(event => this.renderFeaturedEventCard(event)).join('')}
      </div>
    `;
  }

  renderFeaturedEventCard(event) {
    const startDate = new Date(event.start_date);
    const isUpcoming = startDate > new Date();
    
    return `
      <div class="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 hover:bg-opacity-20 transition-all cursor-pointer" onclick="publicEvents.showEventModal('${event.slug}')">
        <div class="flex items-center justify-between mb-3">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-20 text-white">
            <i class="fas fa-star mr-1"></i>
            Destacado
          </span>
          <span class="text-white text-sm opacity-75">
            ${this.getEventTypeLabel(event.type)}
          </span>
        </div>
        <h3 class="text-lg font-bold text-white mb-2 line-clamp-2">${event.title}</h3>
        <p class="text-white text-sm opacity-90 mb-4 line-clamp-3">${event.short_description}</p>
        <div class="flex items-center justify-between text-white text-sm">
          <div class="flex items-center">
            <i class="fas fa-calendar mr-2"></i>
            <span>${startDate.toLocaleDateString('es-CO')}</span>
          </div>
          <div class="flex items-center">
            <i class="fas fa-map-marker-alt mr-2"></i>
            <span class="truncate max-w-20">${event.location}</span>
          </div>
        </div>
        <div class="mt-4 flex items-center justify-between">
          <div class="flex items-center text-white text-sm">
            <i class="fas fa-users mr-2"></i>
            <span>${event.current_participants}/${event.max_participants}</span>
          </div>
          ${isUpcoming ? `
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <i class="fas fa-clock mr-1"></i>
              Próximo
            </span>
          ` : ''}
        </div>
      </div>
    `;
  }

  renderEventsStats(stats) {
    const container = document.getElementById('eventsStatsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="stat-item">
        <div class="text-2xl font-bold text-codecti-primary">${stats.totalEvents}</div>
        <div class="text-sm text-gray-600">Eventos Totales</div>
      </div>
      <div class="stat-item">
        <div class="text-2xl font-bold text-codecti-secondary">${stats.upcomingEvents}</div>
        <div class="text-sm text-gray-600">Próximos</div>
      </div>
      <div class="stat-item">
        <div class="text-2xl font-bold text-codecti-accent">${stats.totalRegistrations}</div>
        <div class="text-sm text-gray-600">Registrados</div>
      </div>
      <div class="stat-item">
        <div class="text-2xl font-bold text-green-600">${stats.totalCategories}</div>
        <div class="text-sm text-gray-600">Categorías</div>
      </div>
    `;
  }

  renderUpcomingEvents(events) {
    const container = document.getElementById('upcomingEventsContainer');
    if (!container) return;

    if (events.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            <i class="fas fa-clock mr-2 text-codecti-primary"></i>
            Próximos Eventos
          </h3>
          <p class="text-gray-500 text-sm">No hay eventos próximos</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-clock mr-2 text-codecti-primary"></i>
          Próximos Eventos
        </h3>
        <div class="space-y-3">
          ${events.map(event => this.renderUpcomingEventItem(event)).join('')}
        </div>
        <div class="mt-4 pt-4 border-t">
          <a href="#" onclick="publicEvents.showAllUpcoming()" class="text-codecti-primary hover:text-codecti-secondary text-sm font-medium">
            Ver todos los próximos eventos →
          </a>
        </div>
      </div>
    `;
  }

  renderUpcomingEventItem(event) {
    const startDate = new Date(event.start_date);
    
    return `
      <div class="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" onclick="publicEvents.showEventModal('${event.slug}')">
        <div class="flex-shrink-0 text-center">
          <div class="text-lg font-bold text-codecti-primary">${startDate.getDate()}</div>
          <div class="text-xs text-gray-500 uppercase">
            ${startDate.toLocaleDateString('es-CO', { month: 'short' })}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-gray-900 truncate">${event.title}</p>
          <p class="text-xs text-gray-500">${event.category_name}</p>
          <div class="flex items-center mt-1 text-xs text-gray-500">
            <i class="fas fa-map-marker-alt mr-1"></i>
            <span class="truncate">${event.location}</span>
          </div>
        </div>
      </div>
    `;
  }

  renderCategoriesSidebar() {
    const container = document.getElementById('eventsCategoriesContainer');
    if (!container) return;

    if (this.categories.length === 0) {
      container.innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">
            <i class="fas fa-tags mr-2 text-codecti-primary"></i>
            Categorías
          </h3>
          <p class="text-gray-500 text-sm">Cargando categorías...</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">
          <i class="fas fa-tags mr-2 text-codecti-primary"></i>
          Categorías
        </h3>
        <div class="space-y-2">
          ${this.categories.map(category => `
            <a href="#" 
               onclick="publicEvents.filterByCategory('${category.slug}')" 
               class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors group">
              <div class="flex items-center">
                <div class="w-3 h-3 rounded-full mr-3" style="background-color: ${category.color}"></div>
                <span class="text-sm text-gray-700 group-hover:text-codecti-primary">${category.name}</span>
              </div>
              <i class="fas fa-arrow-right text-xs text-gray-400 group-hover:text-codecti-primary opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </a>
          `).join('')}
        </div>
      </div>
    `;
  }

  renderEvents() {
    const container = document.getElementById('eventsContainer');
    if (!container) return;

    if (this.events.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-700 mb-2">No se encontraron eventos</h3>
          <p class="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.events.map(event => this.renderEventCard(event)).join('');
  }

  renderEventCard(event) {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const registrationEnd = new Date(event.registration_end);
    const now = new Date();
    
    const isUpcoming = startDate > now;
    const isActive = startDate <= now && endDate >= now;
    const isPast = endDate < now;
    const canRegister = isUpcoming && registrationEnd > now && event.current_participants < event.max_participants;
    
    let statusBadge = '';
    let statusClass = '';
    
    if (isPast) {
      statusBadge = 'Finalizado';
      statusClass = 'bg-gray-100 text-gray-800';
    } else if (isActive) {
      statusBadge = 'En curso';
      statusClass = 'bg-green-100 text-green-800';
    } else if (isUpcoming) {
      statusBadge = 'Próximo';
      statusClass = 'bg-blue-100 text-blue-800';
    }

    return `
      <div class="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
        <div class="p-6">
          <!-- Event Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex-1">
              <div class="flex items-center mb-2">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                  ${this.getEventTypeLabel(event.type)}
                </span>
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClass}">
                  ${statusBadge}
                </span>
                ${event.is_featured ? `
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                    <i class="fas fa-star mr-1"></i>
                    Destacado
                  </span>
                ` : ''}
              </div>
              <h3 class="text-lg font-bold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-codecti-primary" onclick="publicEvents.showEventModal('${event.slug}')">
                ${event.title}
              </h3>
              <p class="text-gray-600 text-sm line-clamp-2 mb-3">${event.short_description}</p>
            </div>
          </div>
          
          <!-- Event Details -->
          <div class="space-y-2 mb-4">
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-calendar mr-2 text-codecti-primary"></i>
              <span>${startDate.toLocaleDateString('es-CO')} - ${endDate.toLocaleDateString('es-CO')}</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-clock mr-2 text-codecti-primary"></i>
              <span>${startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-map-marker-alt mr-2 text-codecti-primary"></i>
              <span class="truncate">${event.location}</span>
            </div>
            ${event.is_virtual || event.is_hybrid ? `
              <div class="flex items-center text-sm text-gray-600">
                <i class="fas fa-globe mr-2 text-codecti-primary"></i>
                <span>${event.is_virtual ? 'Virtual' : 'Híbrido'}</span>
              </div>
            ` : ''}
          </div>
          
          <!-- Registration Info -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center text-sm text-gray-600">
              <i class="fas fa-users mr-2"></i>
              <span>${event.current_participants}/${event.max_participants} registrados</span>
            </div>
            <div class="text-sm text-gray-600">
              ${event.is_free ? 'Gratuito' : `$${event.registration_fee.toLocaleString('es-CO')}`}
            </div>
          </div>
          
          <!-- Registration Progress Bar -->
          <div class="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div class="bg-codecti-primary h-2 rounded-full transition-all duration-300" style="width: ${(event.current_participants / event.max_participants) * 100}%"></div>
          </div>
          
          <!-- Action Buttons -->
          <div class="flex space-x-2">
            <button 
              onclick="publicEvents.showEventModal('${event.slug}')"
              class="flex-1 btn btn-outline btn-sm"
            >
              <i class="fas fa-info-circle mr-2"></i>
              Ver Detalles
            </button>
            ${canRegister && this.currentUser ? `
              <button 
                onclick="publicEvents.showRegistrationModal('${event.slug}')"
                class="flex-1 btn btn-primary btn-sm"
              >
                <i class="fas fa-user-plus mr-2"></i>
                Registrarse
              </button>
            ` : canRegister && !this.currentUser ? `
              <button 
                onclick="publicEvents.showLoginPrompt()"
                class="flex-1 btn btn-primary btn-sm"
              >
                <i class="fas fa-sign-in-alt mr-2"></i>
                Iniciar Sesión
              </button>
            ` : !canRegister && isUpcoming ? `
              <button 
                disabled
                class="flex-1 btn btn-disabled btn-sm"
              >
                <i class="fas fa-times mr-2"></i>
                Registro Cerrado
              </button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  renderPagination() {
    const container = document.getElementById('eventsPagination');
    if (!container || this.totalEvents === 0) return;

    const totalPages = Math.ceil(this.totalEvents / this.pageSize);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="flex items-center justify-center space-x-2">
    `;

    // Previous button
    paginationHTML += `
      <button
        ${this.currentPage === 1 ? 'disabled' : ''}
        onclick="publicEvents.goToPage(${this.currentPage - 1})"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
      >
        <i class="fas fa-chevron-left"></i>
      </button>
    `;

    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);

    for (let i = startPage; i <= endPage; i++) {
      paginationHTML += `
        <button
          onclick="publicEvents.goToPage(${i})"
          class="px-3 py-2 text-sm font-medium ${i === this.currentPage ? 'text-codecti-primary bg-codecti-primary bg-opacity-10 border-codecti-primary' : 'text-gray-500 bg-white border-gray-300 hover:bg-gray-50'} border rounded-md"
        >
          ${i}
        </button>
      `;
    }

    // Next button
    paginationHTML += `
      <button
        ${this.currentPage === totalPages ? 'disabled' : ''}
        onclick="publicEvents.goToPage(${this.currentPage + 1})"
        class="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    paginationHTML += '</div>';
    container.innerHTML = paginationHTML;
  }

  updateResultsCount() {
    const container = document.getElementById('eventsResultsCount');
    if (!container) return;

    const start = (this.currentPage - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage * this.pageSize, this.totalEvents);
    
    container.textContent = `Mostrando ${start} - ${end} de ${this.totalEvents} eventos`;
  }

  goToPage(page) {
    if (page < 1 || page > Math.ceil(this.totalEvents / this.pageSize)) return;
    this.currentPage = page;
    this.loadEvents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  filterByCategory(categorySlug) {
    this.currentFilters.category = categorySlug;
    this.currentPage = 1;
    
    // Update category filter select
    const categoryFilter = document.getElementById('eventsCategoryFilter');
    if (categoryFilter) {
      categoryFilter.value = categorySlug;
    }
    
    this.loadEvents();
  }

  showAllUpcoming() {
    this.currentFilters = {
      search: '',
      category: '',
      type: '',
      location: '',
      upcoming: true,
      featured: false,
      sort: 'start_date',
      order: 'asc'
    };
    this.currentPage = 1;
    
    // Update filters
    document.getElementById('eventsSearchInput').value = '';
    document.getElementById('eventsCategoryFilter').value = '';
    document.getElementById('eventsTypeFilter').value = '';
    document.getElementById('eventsTimeFilter').value = 'upcoming';
    document.getElementById('eventsSortFilter').value = 'start_date_asc';
    
    this.loadEvents();
  }

  async showEventModal(eventSlug) {
    try {
      const response = await axios.get(`/api/public/events/${eventSlug}`);
      if (response.data.success) {
        this.renderEventModal(response.data.data);
      }
    } catch (error) {
      console.error('Error loading event details:', error);
      this.showNotification('Error al cargar detalles del evento', 'error');
    }
  }

  renderEventModal(event) {
    const modal = document.getElementById('eventModal');
    const modalContent = document.getElementById('eventModalContent');
    
    if (!modal || !modalContent) return;

    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const registrationStart = new Date(event.registration_start);
    const registrationEnd = new Date(event.registration_end);
    const now = new Date();
    
    const canRegister = startDate > now && registrationEnd > now && event.current_participants < event.max_participants;

    modalContent.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div class="relative p-6">
          <button 
            data-modal="close"
            class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10"
          >
            <i class="fas fa-times text-xl"></i>
          </button>
          
          <!-- Event Header -->
          <div class="pr-8 mb-6">
            <div class="flex flex-wrap items-center gap-2 mb-3">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                ${this.getEventTypeLabel(event.type)}
              </span>
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                ${event.category_name}
              </span>
              ${event.is_featured ? `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  <i class="fas fa-star mr-1"></i>
                  Destacado
                </span>
              ` : ''}
            </div>
            <h2 class="text-3xl font-bold text-gray-900 mb-3">${event.title}</h2>
            <p class="text-lg text-gray-600 leading-relaxed">${event.short_description}</p>
          </div>
          
          <!-- Event Info Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">Información del Evento</h3>
              
              <div class="flex items-center">
                <i class="fas fa-calendar text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Fecha del Evento</div>
                  <div class="text-sm text-gray-600">
                    ${startDate.toLocaleDateString('es-CO', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                    ${startDate.getTime() !== endDate.getTime() ? ` - ${endDate.toLocaleDateString('es-CO', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}` : ''}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-clock text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Horario</div>
                  <div class="text-sm text-gray-600">
                    ${startDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} - 
                    ${endDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-map-marker-alt text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Ubicación</div>
                  <div class="text-sm text-gray-600">${event.venue}</div>
                  <div class="text-xs text-gray-500">${event.address}</div>
                </div>
              </div>
              
              ${event.is_virtual || event.is_hybrid ? `
                <div class="flex items-center">
                  <i class="fas fa-globe text-codecti-primary mr-3"></i>
                  <div>
                    <div class="font-medium">Modalidad</div>
                    <div class="text-sm text-gray-600">${event.is_virtual ? 'Virtual' : 'Híbrido (Presencial + Virtual)'}</div>
                  </div>
                </div>
              ` : ''}
              
              <div class="flex items-center">
                <i class="fas fa-user-tie text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Organizado por</div>
                  <div class="text-sm text-gray-600">${event.organizer_name}</div>
                  ${event.organizer_institution ? `<div class="text-xs text-gray-500">${event.organizer_institution}</div>` : ''}
                </div>
              </div>
            </div>
            
            <div class="space-y-4">
              <h3 class="text-lg font-semibold text-gray-900 border-b pb-2">Registro</h3>
              
              <div class="flex items-center">
                <i class="fas fa-calendar-check text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Período de Registro</div>
                  <div class="text-sm text-gray-600">
                    ${registrationStart.toLocaleDateString('es-CO')} - ${registrationEnd.toLocaleDateString('es-CO')}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-users text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Participantes</div>
                  <div class="text-sm text-gray-600">${event.current_participants} de ${event.max_participants} registrados</div>
                  <div class="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div class="bg-codecti-primary h-2 rounded-full" style="width: ${(event.current_participants / event.max_participants) * 100}%"></div>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-money-bill-wave text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Costo</div>
                  <div class="text-sm text-gray-600">
                    ${event.is_free ? 'Gratuito' : `$${event.registration_fee.toLocaleString('es-CO')} COP`}
                  </div>
                </div>
              </div>
              
              <div class="flex items-center">
                <i class="fas fa-bullseye text-codecti-primary mr-3"></i>
                <div>
                  <div class="font-medium">Dirigido a</div>
                  <div class="text-sm text-gray-600">${event.target_audience}</div>
                </div>
              </div>
              
              ${event.requirements ? `
                <div class="flex items-start">
                  <i class="fas fa-clipboard-list text-codecti-primary mr-3 mt-1"></i>
                  <div>
                    <div class="font-medium">Requisitos</div>
                    <div class="text-sm text-gray-600">${event.requirements}</div>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
          
          <!-- Event Description -->
          ${event.description ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Descripción</h3>
              <div class="prose prose-sm max-w-none text-gray-600">
                ${event.description}
              </div>
            </div>
          ` : ''}
          
          <!-- Event Agenda -->
          ${event.agenda ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Agenda</h3>
              <div class="prose prose-sm max-w-none text-gray-600 bg-gray-50 p-4 rounded-lg">
                ${event.agenda}
              </div>
            </div>
          ` : ''}
          
          <!-- Learning Objectives -->
          ${event.learning_objectives ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Objetivos de Aprendizaje</h3>
              <div class="text-gray-600 bg-blue-50 p-4 rounded-lg">
                ${event.learning_objectives}
              </div>
            </div>
          ` : ''}
          
          <!-- Tags -->
          ${event.tags && event.tags.length > 0 ? `
            <div class="mb-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-3">Temas</h3>
              <div class="flex flex-wrap gap-2">
                ${event.tags.map(tag => `
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    #${tag}
                  </span>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <!-- Registration Action -->
          <div class="border-t pt-6">
            ${canRegister && this.currentUser ? `
              <div class="flex flex-col sm:flex-row gap-3">
                <button 
                  onclick="publicEvents.showRegistrationModal('${event.slug}')"
                  class="btn btn-primary flex-1"
                >
                  <i class="fas fa-user-plus mr-2"></i>
                  Registrarse en el Evento
                </button>
                <button 
                  data-modal="close"
                  class="btn btn-outline"
                >
                  Cerrar
                </button>
              </div>
            ` : canRegister && !this.currentUser ? `
              <div class="flex flex-col sm:flex-row gap-3">
                <button 
                  onclick="publicEvents.showLoginPrompt()"
                  class="btn btn-primary flex-1"
                >
                  <i class="fas fa-sign-in-alt mr-2"></i>
                  Iniciar Sesión para Registrarse
                </button>
                <button 
                  data-modal="close"
                  class="btn btn-outline"
                >
                  Cerrar
                </button>
              </div>
            ` : `
              <div class="flex flex-col sm:flex-row gap-3">
                <div class="flex-1 bg-gray-100 text-gray-500 px-6 py-3 rounded-lg text-center">
                  <i class="fas fa-info-circle mr-2"></i>
                  ${registrationEnd < now ? 'Registro cerrado' : 
                     event.current_participants >= event.max_participants ? 'Evento lleno' : 
                     'Registro no disponible'}
                </div>
                <button 
                  data-modal="close"
                  class="btn btn-primary"
                >
                  Cerrar
                </button>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    modal.classList.remove('hidden');
  }

  async showRegistrationModal(eventSlug) {
    try {
      // First check if user is already registered
      const statusResponse = await axios.get(`/api/public/events/${eventSlug}/registration-status`);
      
      if (statusResponse.data.success) {
        const status = statusResponse.data.data;
        
        if (status.is_registered) {
          this.showNotification('Ya estás registrado en este evento', 'info');
          return;
        }
        
        if (!status.can_register) {
          this.showNotification('No es posible registrarse en este evento en este momento', 'warning');
          return;
        }
      }
      
      // Load event details for registration form
      const eventResponse = await axios.get(`/api/public/events/${eventSlug}`);
      if (eventResponse.data.success) {
        this.renderRegistrationModal(eventResponse.data.data);
      }
    } catch (error) {
      console.error('Error loading registration modal:', error);
      this.showNotification('Error al cargar formulario de registro', 'error');
    }
  }

  renderRegistrationModal(event) {
    const modal = document.getElementById('registrationModal');
    const modalContent = document.getElementById('registrationModalContent');
    
    if (!modal || !modalContent) return;

    modalContent.innerHTML = `
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-screen overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-center mb-6">
            <h3 class="text-2xl font-bold text-gray-900">Registro al Evento</h3>
            <button data-modal="close" class="text-gray-400 hover:text-gray-600">
              <i class="fas fa-times text-xl"></i>
            </button>
          </div>
          
          <!-- Event Summary -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 class="font-semibold text-gray-900 mb-2">${event.title}</h4>
            <div class="text-sm text-gray-600 space-y-1">
              <div><i class="fas fa-calendar mr-2"></i>${new Date(event.start_date).toLocaleDateString('es-CO')}</div>
              <div><i class="fas fa-map-marker-alt mr-2"></i>${event.location}</div>
              <div><i class="fas fa-money-bill-wave mr-2"></i>${event.is_free ? 'Gratuito' : `$${event.registration_fee.toLocaleString('es-CO')} COP`}</div>
            </div>
          </div>
          
          <!-- Registration Form -->
          <form id="registrationForm" class="space-y-4">
            <input type="hidden" id="eventSlug" value="${event.slug}">
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Nombre Completo *
              </label>
              <input
                type="text"
                id="participantName"
                name="participant_name"
                required
                class="form-input w-full"
                placeholder="Tu nombre completo"
                value="${this.currentUser?.name || ''}"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Correo Electrónico *
              </label>
              <input
                type="email"
                id="participantEmail"
                name="participant_email"
                required
                class="form-input w-full"
                placeholder="tu@email.com"
                value="${this.currentUser?.email || ''}"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Teléfono
              </label>
              <input
                type="tel"
                id="participantPhone"
                name="participant_phone"
                class="form-input w-full"
                placeholder="+57 300 123 4567"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Institución
              </label>
              <input
                type="text"
                id="participantInstitution"
                name="participant_institution"
                class="form-input w-full"
                placeholder="Universidad, empresa o institución"
                value="${this.currentUser?.institution || ''}"
              />
            </div>
            
            ${event.type === 'workshop' || event.type === 'conference' ? `
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Restricciones Alimentarias
                </label>
                <textarea
                  id="dietaryRequirements"
                  name="dietary_requirements"
                  rows="2"
                  class="form-input w-full"
                  placeholder="Alergias, dieta vegetariana, etc."
                ></textarea>
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Necesidades de Accesibilidad
                </label>
                <textarea
                  id="accessibilityNeeds"
                  name="accessibility_needs"
                  rows="2"
                  class="form-input w-full"
                  placeholder="Silla de ruedas, intérprete de señas, etc."
                ></textarea>
              </div>
            ` : ''}
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Comentarios Adicionales
              </label>
              <textarea
                id="additionalNotes"
                name="additional_notes"
                rows="3"
                class="form-input w-full"
                placeholder="Cualquier información adicional que desees compartir"
              ></textarea>
            </div>
            
            <!-- Terms and Conditions -->
            <div class="border-t pt-4">
              <label class="flex items-start">
                <input type="checkbox" id="agreeTerms" required class="mt-1 mr-3">
                <span class="text-sm text-gray-700">
                  Acepto los <a href="#" class="text-codecti-primary hover:underline">términos y condiciones</a> 
                  del evento y autorizo el uso de mis datos personales para fines del evento y comunicaciones relacionadas.
                </span>
              </label>
            </div>
            
            <div class="flex space-x-4 pt-4">
              <button
                type="button"
                data-modal="close"
                class="flex-1 btn btn-outline"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="flex-1 btn btn-primary"
              >
                <i class="fas fa-user-plus mr-2"></i>
                Confirmar Registro
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Setup form submission
    const form = document.getElementById('registrationForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleRegistrationSubmit(e));
    }

    modal.classList.remove('hidden');
  }

  async handleRegistrationSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const eventSlug = document.getElementById('eventSlug').value;
    
    // Convert form data to object
    const registrationData = {};
    for (const [key, value] of formData.entries()) {
      registrationData[key] = value;
    }
    
    try {
      const response = await axios.post(`/api/public/events/${eventSlug}/register`, registrationData);
      
      if (response.data.success) {
        this.showNotification('¡Registro exitoso! Recibirás un correo de confirmación', 'success');
        this.closeAllModals();
        this.loadEvents(); // Refresh events to show updated participant count
      } else {
        throw new Error(response.data.error || 'Error en el registro');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      this.showNotification(
        error.response?.data?.error || 'Error al registrarse en el evento',
        'error'
      );
    }
  }

  showLoginPrompt() {
    this.showNotification('Debes iniciar sesión para registrarte en eventos', 'info');
    // Redirect to dashboard with login
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
  }

  getEventTypeLabel(type) {
    const labels = {
      'conference': 'Conferencia',
      'workshop': 'Taller',
      'convocatoria': 'Convocatoria',
      'seminar': 'Seminario',
      'feria': 'Feria'
    };
    return labels[type] || type;
  }

  closeAllModals() {
    const modals = ['eventModal', 'registrationModal'];
    modals.forEach(modalId => {
      const modal = document.getElementById(modalId);
      if (modal) {
        modal.classList.add('hidden');
      }
    });
  }

  showLoadingState() {
    const container = document.getElementById('eventsContainer');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-spinner fa-spin text-codecti-primary text-4xl mb-4"></i>
          <p class="text-gray-600">Cargando eventos...</p>
        </div>
      `;
    }
  }

  hideLoadingState() {
    // Loading state is handled by renderEvents
  }

  renderEventsError() {
    const container = document.getElementById('eventsContainer');
    if (container) {
      container.innerHTML = `
        <div class="col-span-full text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p class="text-red-600 mb-4">Error al cargar eventos</p>
          <button onclick="publicEvents.loadEvents()" class="btn btn-primary">
            <i class="fas fa-redo mr-2"></i>
            Reintentar
          </button>
        </div>
      `;
    }
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto transition-all duration-300 transform translate-x-full`;
    
    const bgColor = {
      success: 'bg-green-50 border-green-200',
      error: 'bg-red-50 border-red-200',
      warning: 'bg-yellow-50 border-yellow-200',
      info: 'bg-blue-50 border-blue-200'
    }[type] || 'bg-blue-50 border-blue-200';
    
    const textColor = {
      success: 'text-green-800',
      error: 'text-red-800', 
      warning: 'text-yellow-800',
      info: 'text-blue-800'
    }[type] || 'text-blue-800';
    
    const icon = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    }[type] || 'fas fa-info-circle';

    notification.innerHTML = `
      <div class="border ${bgColor} ${textColor} p-4 rounded-lg">
        <div class="flex items-center">
          <i class="${icon} mr-3"></i>
          <span class="font-medium">${message}</span>
          <button class="ml-auto text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.parentElement.remove()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}

// Initialize global instance
const publicEvents = new PublicEvents();

// Export for global access
window.PublicEvents = PublicEvents;