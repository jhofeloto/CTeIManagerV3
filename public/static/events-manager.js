/**
 * HU-10: Sistema de Eventos y Convocatorias - Administración
 * 
 * Interfaz de administración para gestión completa de eventos científicos y convocatorias.
 * Incluye CRUD completo, gestión de registros, y análisis de estadísticas.
 */

class EventsManager {
  constructor() {
    this.currentPage = 1;
    this.pageSize = 10;
    this.events = [];
    this.categories = [];
    this.totalEvents = 0;
    this.currentFilters = {
      search: '',
      status: '',
      category: '',
      type: '',
      organizer: '',
      sort: 'created_at',
      order: 'desc'
    };
    this.selectedEvent = null;
    this.isLoading = false;
  }

  async init() {
    try {
      await this.loadEventCategories();
      await this.loadEvents();
      await this.loadEventStats();
      this.setupEventListeners();
      this.renderEventsInterface();
    } catch (error) {
      console.error('Error initializing events manager:', error);
      this.showNotification('Error al inicializar el gestor de eventos', 'error');
    }
  }

  async loadEventCategories() {
    try {
      const response = await axios.get('/api/events/categories');
      if (response.data.success) {
        this.categories = response.data.data;
      }
    } catch (error) {
      console.error('Error loading event categories:', error);
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

      const response = await axios.get('/api/events', { params });
      
      if (response.data.success) {
        this.events = response.data.data.events;
        this.totalEvents = response.data.data.total;
        this.renderEventsTable();
        this.renderPagination();
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

  async loadEventStats() {
    try {
      const response = await axios.get('/api/events/stats');
      if (response.data.success) {
        this.renderEventStats(response.data.data);
      }
    } catch (error) {
      console.error('Error loading event stats:', error);
    }
  }

  setupEventListeners() {
    // Search and filters
    const searchInput = document.getElementById('eventSearchInput');
    if (searchInput) {
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.currentFilters.search = e.target.value;
          this.currentPage = 1;
          this.loadEvents();
        }, 500);
      });
    }

    // Filter controls
    ['eventStatusFilter', 'eventCategoryFilter', 'eventTypeFilter', 'eventOrganizerFilter', 'eventSortFilter'].forEach(filterId => {
      const filter = document.getElementById(filterId);
      if (filter) {
        filter.addEventListener('change', (e) => {
          const filterName = filterId.replace('event', '').replace('Filter', '').toLowerCase();
          if (filterName === 'sort') {
            const [sort, order] = e.target.value.split('-');
            this.currentFilters.sort = sort;
            this.currentFilters.order = order || 'desc';
          } else {
            this.currentFilters[filterName] = e.target.value;
          }
          this.currentPage = 1;
          this.loadEvents();
        });
      }
    });

    // Action buttons
    const newEventBtn = document.getElementById('newEventBtn');
    if (newEventBtn) {
      newEventBtn.addEventListener('click', () => this.showEventModal());
    }

    const refreshEventsBtn = document.getElementById('refreshEventsBtn');
    if (refreshEventsBtn) {
      refreshEventsBtn.addEventListener('click', () => {
        this.loadEvents();
        this.loadEventStats();
      });
    }

    // Modal close buttons
    const closeModalBtns = document.querySelectorAll('[data-modal-close]');
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-modal-close');
        this.closeModal(modalId);
      });
    });

    // Form submission
    const eventForm = document.getElementById('eventForm');
    if (eventForm) {
      eventForm.addEventListener('submit', (e) => this.handleEventSubmit(e));
    }
  }

  renderEventsInterface() {
    const container = document.getElementById('eventsManagerContainer');
    if (!container) return;

    container.innerHTML = `
      <!-- Events Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div id="eventsStatsContainer">
          <div class="bg-white rounded-lg shadow-md p-6 animate-pulse">
            <div class="text-center">
              <div class="w-12 h-12 bg-gray-200 rounded-full mx-auto mb-3"></div>
              <div class="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Events Management Controls -->
      <div class="bg-white rounded-lg shadow-md p-6 mb-8">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-2xl font-bold text-gray-900">
            <i class="fas fa-calendar-alt mr-2 text-codecti-primary"></i>
            Gestión de Eventos
          </h2>
          <div class="flex space-x-3">
            <button id="refreshEventsBtn" class="btn btn-secondary">
              <i class="fas fa-sync-alt mr-2"></i>
              Actualizar
            </button>
            <button id="newEventBtn" class="btn btn-primary">
              <i class="fas fa-plus mr-2"></i>
              Nuevo Evento
            </button>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
          <div class="md:col-span-2">
            <input
              type="text"
              id="eventSearchInput"
              placeholder="Buscar eventos..."
              class="form-input w-full"
            />
          </div>
          <div>
            <select id="eventStatusFilter" class="form-input w-full">
              <option value="">Todos los estados</option>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
          <div>
            <select id="eventCategoryFilter" class="form-input w-full">
              <option value="">Todas las categorías</option>
              ${this.categories.map(cat => `
                <option value="${cat.slug}">${cat.name}</option>
              `).join('')}
            </select>
          </div>
          <div>
            <select id="eventTypeFilter" class="form-input w-full">
              <option value="">Todos los tipos</option>
              <option value="conference">Conferencia</option>
              <option value="workshop">Taller</option>
              <option value="convocatoria">Convocatoria</option>
              <option value="seminar">Seminario</option>
              <option value="feria">Feria</option>
            </select>
          </div>
          <div>
            <select id="eventSortFilter" class="form-input w-full">
              <option value="created_at-desc">Más recientes</option>
              <option value="created_at-asc">Más antiguos</option>
              <option value="title-asc">Título A-Z</option>
              <option value="title-desc">Título Z-A</option>
              <option value="start_date-asc">Fecha inicio (próximos)</option>
              <option value="start_date-desc">Fecha inicio (recientes)</option>
              <option value="registrations-desc">Más registros</option>
              <option value="views-desc">Más vistas</option>
            </select>
          </div>
        </div>

        <!-- Events Table -->
        <div class="overflow-x-auto">
          <div id="eventsTableContainer">
            <div class="text-center py-8">
              <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
              <p class="text-gray-500 mt-2">Cargando eventos...</p>
            </div>
          </div>
        </div>

        <!-- Pagination -->
        <div id="eventsPaginationContainer" class="mt-6"></div>
      </div>

      <!-- Event Modal -->
      <div id="eventModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div class="p-6">
              <div class="flex justify-between items-center mb-6">
                <h3 id="eventModalTitle" class="text-2xl font-bold text-gray-900">Nuevo Evento</h3>
                <button data-modal-close="eventModal" class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <form id="eventForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Basic Information -->
                  <div class="md:col-span-2">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4">Información Básica</h4>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Título del Evento *
                    </label>
                    <input
                      type="text"
                      id="eventTitle"
                      name="title"
                      required
                      class="form-input w-full"
                      placeholder="Ej: VI Congreso Nacional de Biodiversidad del Chocó"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Evento *
                    </label>
                    <select id="eventType" name="type" required class="form-input w-full">
                      <option value="">Seleccionar tipo</option>
                      <option value="conference">Conferencia</option>
                      <option value="workshop">Taller</option>
                      <option value="convocatoria">Convocatoria</option>
                      <option value="seminar">Seminario</option>
                      <option value="feria">Feria</option>
                    </select>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Categoría *
                    </label>
                    <select id="eventCategory" name="category_id" required class="form-input w-full">
                      <option value="">Seleccionar categoría</option>
                      ${this.categories.map(cat => `
                        <option value="${cat.id}">${cat.name}</option>
                      `).join('')}
                    </select>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Corta *
                    </label>
                    <textarea
                      id="eventShortDescription"
                      name="short_description"
                      rows="2"
                      required
                      class="form-input w-full"
                      placeholder="Descripción breve del evento (máximo 200 caracteres)"
                    ></textarea>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Descripción Completa *
                    </label>
                    <textarea
                      id="eventDescription"
                      name="description"
                      rows="4"
                      required
                      class="form-input w-full"
                      placeholder="Descripción detallada del evento con HTML"
                    ></textarea>
                  </div>
                  
                  <!-- Dates and Location -->
                  <div class="md:col-span-2">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4 mt-6">Fechas y Ubicación</h4>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Fecha y Hora de Inicio *
                    </label>
                    <input
                      type="datetime-local"
                      id="eventStartDate"
                      name="start_date"
                      required
                      class="form-input w-full"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Fecha y Hora de Finalización *
                    </label>
                    <input
                      type="datetime-local"
                      id="eventEndDate"
                      name="end_date"
                      required
                      class="form-input w-full"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Inicio de Registros *
                    </label>
                    <input
                      type="datetime-local"
                      id="eventRegistrationStart"
                      name="registration_start"
                      required
                      class="form-input w-full"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Cierre de Registros *
                    </label>
                    <input
                      type="datetime-local"
                      id="eventRegistrationEnd"
                      name="registration_end"
                      required
                      class="form-input w-full"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      id="eventLocation"
                      name="location"
                      required
                      class="form-input w-full"
                      placeholder="Ej: Quibdó, Chocó"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Lugar/Sede *
                    </label>
                    <input
                      type="text"
                      id="eventVenue"
                      name="venue"
                      required
                      class="form-input w-full"
                      placeholder="Ej: Hotel Chocó Internacional"
                    />
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Dirección Completa *
                    </label>
                    <input
                      type="text"
                      id="eventAddress"
                      name="address"
                      required
                      class="form-input w-full"
                      placeholder="Dirección completa del evento"
                    />
                  </div>
                  
                  <!-- Event Settings -->
                  <div class="md:col-span-2">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4 mt-6">Configuraciones</h4>
                  </div>
                  
                  <div class="md:col-span-2">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div class="flex items-center">
                        <input
                          type="checkbox"
                          id="eventIsVirtual"
                          name="is_virtual"
                          class="mr-2"
                        />
                        <label for="eventIsVirtual" class="text-sm text-gray-700">Virtual</label>
                      </div>
                      <div class="flex items-center">
                        <input
                          type="checkbox"
                          id="eventIsHybrid"
                          name="is_hybrid"
                          class="mr-2"
                        />
                        <label for="eventIsHybrid" class="text-sm text-gray-700">Híbrido</label>
                      </div>
                      <div class="flex items-center">
                        <input
                          type="checkbox"
                          id="eventIsFree"
                          name="is_free"
                          class="mr-2"
                          checked
                        />
                        <label for="eventIsFree" class="text-sm text-gray-700">Gratuito</label>
                      </div>
                      <div class="flex items-center">
                        <input
                          type="checkbox"
                          id="eventIsFeatured"
                          name="is_featured"
                          class="mr-2"
                        />
                        <label for="eventIsFeatured" class="text-sm text-gray-700">Destacado</label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Máximo de Participantes *
                    </label>
                    <input
                      type="number"
                      id="eventMaxParticipants"
                      name="max_participants"
                      required
                      min="1"
                      value="100"
                      class="form-input w-full"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Costo de Registro
                    </label>
                    <input
                      type="number"
                      id="eventRegistrationFee"
                      name="registration_fee"
                      min="0"
                      step="1000"
                      class="form-input w-full"
                      placeholder="0 (si es gratuito)"
                    />
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Link Virtual (si aplica)
                    </label>
                    <input
                      type="url"
                      id="eventVirtualLink"
                      name="virtual_link"
                      class="form-input w-full"
                      placeholder="https://zoom.us/j/..."
                    />
                  </div>
                  
                  <!-- Additional Information -->
                  <div class="md:col-span-2">
                    <h4 class="text-lg font-semibold text-gray-900 mb-4 mt-6">Información Adicional</h4>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Público Objetivo *
                    </label>
                    <textarea
                      id="eventTargetAudience"
                      name="target_audience"
                      rows="2"
                      required
                      class="form-input w-full"
                      placeholder="Ej: Investigadores, estudiantes de posgrado, profesionales en biotecnología"
                    ></textarea>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Requisitos
                    </label>
                    <textarea
                      id="eventRequirements"
                      name="requirements"
                      rows="2"
                      class="form-input w-full"
                      placeholder="Requisitos de participación"
                    ></textarea>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Objetivos de Aprendizaje
                    </label>
                    <textarea
                      id="eventLearningObjectives"
                      name="learning_objectives"
                      rows="2"
                      class="form-input w-full"
                      placeholder="Qué aprenderán los participantes"
                    ></textarea>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Agenda (HTML)
                    </label>
                    <textarea
                      id="eventAgenda"
                      name="agenda"
                      rows="4"
                      class="form-input w-full"
                      placeholder="Agenda detallada del evento con HTML"
                    ></textarea>
                  </div>
                  
                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Etiquetas (separadas por coma)
                    </label>
                    <input
                      type="text"
                      id="eventTags"
                      name="tags"
                      class="form-input w-full"
                      placeholder="biotecnología, biología marina, cultivos"
                    />
                  </div>
                  
                  <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                      Estado *
                    </label>
                    <select id="eventStatus" name="status" required class="form-input w-full">
                      <option value="draft">Borrador</option>
                      <option value="published">Publicado</option>
                      <option value="cancelled">Cancelado</option>
                    </select>
                  </div>
                  
                  <div class="flex items-center">
                    <input
                      type="checkbox"
                      id="eventIsPublic"
                      name="is_public"
                      checked
                      class="mr-2"
                    />
                    <label for="eventIsPublic" class="text-sm text-gray-700">Visible públicamente</label>
                  </div>
                </div>
                
                <div class="flex justify-end space-x-4 pt-6 border-t">
                  <button
                    type="button"
                    data-modal-close="eventModal"
                    class="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    class="btn btn-primary"
                  >
                    <i class="fas fa-save mr-2"></i>
                    Guardar Evento
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Event Registrations Modal -->
      <div id="eventRegistrationsModal" class="fixed inset-0 bg-gray-600 bg-opacity-50 hidden z-50">
        <div class="flex items-center justify-center min-h-screen p-4">
          <div class="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-screen overflow-y-auto">
            <div class="p-6">
              <div class="flex justify-between items-center mb-6">
                <h3 id="registrationsModalTitle" class="text-2xl font-bold text-gray-900">
                  Registros del Evento
                </h3>
                <button data-modal-close="eventRegistrationsModal" class="text-gray-400 hover:text-gray-600">
                  <i class="fas fa-times text-xl"></i>
                </button>
              </div>
              
              <div id="registrationsContent">
                <!-- Content will be loaded dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderEventStats(stats) {
    const container = document.getElementById('eventsStatsContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-codecti-primary mb-2">
            ${stats.totalEvents}
          </div>
          <div class="text-sm text-gray-600">Total Eventos</div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-green-600 mb-2">
            ${stats.upcomingEvents}
          </div>
          <div class="text-sm text-gray-600">Próximos</div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-blue-600 mb-2">
            ${stats.totalRegistrations}
          </div>
          <div class="text-sm text-gray-600">Registrados</div>
        </div>
      </div>
      <div class="bg-white rounded-lg shadow-md p-6">
        <div class="text-center">
          <div class="text-3xl font-bold text-orange-600 mb-2">
            ${stats.featuredEvents}
          </div>
          <div class="text-sm text-gray-600">Destacados</div>
        </div>
      </div>
    `;
  }

  renderEventsTable() {
    const container = document.getElementById('eventsTableContainer');
    if (!container) return;

    if (this.events.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-calendar-times text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">No se encontraron eventos</p>
        </div>
      `;
      return;
    }

    const tableHTML = `
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evento</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fechas</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registros</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          ${this.events.map(event => this.renderEventRow(event)).join('')}
        </tbody>
      </table>
    `;

    container.innerHTML = tableHTML;
  }

  renderEventRow(event) {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);
    const now = new Date();
    
    const isUpcoming = startDate > now;
    const isActive = startDate <= now && endDate >= now;
    const isPast = endDate < now;
    
    let dateStatus = '';
    let dateClass = '';
    
    if (isUpcoming) {
      dateStatus = 'Próximo';
      dateClass = 'text-blue-600';
    } else if (isActive) {
      dateStatus = 'En curso';
      dateClass = 'text-green-600';
    } else {
      dateStatus = 'Finalizado';
      dateClass = 'text-gray-600';
    }

    const statusBadgeClass = {
      'published': 'bg-green-100 text-green-800',
      'draft': 'bg-yellow-100 text-yellow-800',
      'cancelled': 'bg-red-100 text-red-800'
    }[event.status] || 'bg-gray-100 text-gray-800';

    return `
      <tr class="hover:bg-gray-50">
        <td class="px-6 py-4 whitespace-nowrap">
          <div class="flex items-center">
            <div>
              <div class="text-sm font-medium text-gray-900">${event.title}</div>
              <div class="text-sm text-gray-500">
                ${event.category_name} • ${event.location}
              </div>
              ${event.is_featured ? '<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><i class="fas fa-star mr-1"></i>Destacado</span>' : ''}
            </div>
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            ${this.getEventTypeLabel(event.type)}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div class="${dateClass} font-medium">${dateStatus}</div>
          <div class="text-gray-500">
            ${startDate.toLocaleDateString('es-CO')}
          </div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          <div class="flex items-center">
            <span class="font-medium">${event.current_participants}/${event.max_participants}</span>
            <div class="ml-2 w-16 bg-gray-200 rounded-full h-2">
              <div class="bg-blue-600 h-2 rounded-full" style="width: ${(event.current_participants / event.max_participants) * 100}%"></div>
            </div>
          </div>
          <div class="text-gray-500">${event.views_count} vistas</div>
        </td>
        <td class="px-6 py-4 whitespace-nowrap">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass}">
            ${this.getStatusLabel(event.status)}
          </span>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <div class="flex space-x-2">
            <button
              onclick="eventsManager.viewEventRegistrations(${event.id})"
              class="text-green-600 hover:text-green-900"
              title="Ver registros"
            >
              <i class="fas fa-users"></i>
            </button>
            <button
              onclick="eventsManager.editEvent(${event.id})"
              class="text-indigo-600 hover:text-indigo-900"
              title="Editar"
            >
              <i class="fas fa-edit"></i>
            </button>
            <button
              onclick="eventsManager.duplicateEvent(${event.id})"
              class="text-blue-600 hover:text-blue-900"
              title="Duplicar"
            >
              <i class="fas fa-copy"></i>
            </button>
            <button
              onclick="eventsManager.deleteEvent(${event.id})"
              class="text-red-600 hover:text-red-900"
              title="Eliminar"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
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

  getStatusLabel(status) {
    const labels = {
      'published': 'Publicado',
      'draft': 'Borrador',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  renderPagination() {
    const container = document.getElementById('eventsPaginationContainer');
    if (!container || this.totalEvents === 0) return;

    const totalPages = Math.ceil(this.totalEvents / this.pageSize);
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = `
      <div class="flex items-center justify-between">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            ${this.currentPage === 1 ? 'disabled' : ''}
            onclick="eventsManager.goToPage(${this.currentPage - 1})"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            Anterior
          </button>
          <button
            ${this.currentPage === totalPages ? 'disabled' : ''}
            onclick="eventsManager.goToPage(${this.currentPage + 1})"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            Siguiente
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
              Mostrando <span class="font-medium">${(this.currentPage - 1) * this.pageSize + 1}</span> a 
              <span class="font-medium">${Math.min(this.currentPage * this.pageSize, this.totalEvents)}</span> de 
              <span class="font-medium">${this.totalEvents}</span> eventos
            </p>
          </div>
          <div>
            <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
    `;

    // Previous button
    paginationHTML += `
      <button
        ${this.currentPage === 1 ? 'disabled' : ''}
        onclick="eventsManager.goToPage(${this.currentPage - 1})"
        class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}"
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
          onclick="eventsManager.goToPage(${i})"
          class="relative inline-flex items-center px-4 py-2 border ${i === this.currentPage ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600' : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-50'} text-sm font-medium"
        >
          ${i}
        </button>
      `;
    }

    // Next button
    paginationHTML += `
      <button
        ${this.currentPage === totalPages ? 'disabled' : ''}
        onclick="eventsManager.goToPage(${this.currentPage + 1})"
        class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${this.currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}"
      >
        <i class="fas fa-chevron-right"></i>
      </button>
    `;

    paginationHTML += `
            </nav>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = paginationHTML;
  }

  goToPage(page) {
    if (page < 1 || page > Math.ceil(this.totalEvents / this.pageSize)) return;
    this.currentPage = page;
    this.loadEvents();
  }

  showEventModal(event = null) {
    const modal = document.getElementById('eventModal');
    const title = document.getElementById('eventModalTitle');
    const form = document.getElementById('eventForm');
    
    if (!modal || !title || !form) return;

    this.selectedEvent = event;
    
    if (event) {
      title.textContent = 'Editar Evento';
      this.populateEventForm(event);
    } else {
      title.textContent = 'Nuevo Evento';
      form.reset();
      // Set default values
      document.getElementById('eventIsFree').checked = true;
      document.getElementById('eventIsPublic').checked = true;
      document.getElementById('eventStatus').value = 'draft';
    }
    
    modal.classList.remove('hidden');
  }

  populateEventForm(event) {
    // Basic information
    document.getElementById('eventTitle').value = event.title || '';
    document.getElementById('eventType').value = event.type || '';
    document.getElementById('eventCategory').value = event.category_id || '';
    document.getElementById('eventShortDescription').value = event.short_description || '';
    document.getElementById('eventDescription').value = event.description || '';
    
    // Dates and location
    document.getElementById('eventStartDate').value = this.formatDateForInput(event.start_date);
    document.getElementById('eventEndDate').value = this.formatDateForInput(event.end_date);
    document.getElementById('eventRegistrationStart').value = this.formatDateForInput(event.registration_start);
    document.getElementById('eventRegistrationEnd').value = this.formatDateForInput(event.registration_end);
    document.getElementById('eventLocation').value = event.location || '';
    document.getElementById('eventVenue').value = event.venue || '';
    document.getElementById('eventAddress').value = event.address || '';
    
    // Settings
    document.getElementById('eventIsVirtual').checked = event.is_virtual || false;
    document.getElementById('eventIsHybrid').checked = event.is_hybrid || false;
    document.getElementById('eventIsFree').checked = event.is_free !== false;
    document.getElementById('eventIsFeatured').checked = event.is_featured || false;
    document.getElementById('eventMaxParticipants').value = event.max_participants || 100;
    document.getElementById('eventRegistrationFee').value = event.registration_fee || 0;
    document.getElementById('eventVirtualLink').value = event.virtual_link || '';
    
    // Additional information
    document.getElementById('eventTargetAudience').value = event.target_audience || '';
    document.getElementById('eventRequirements').value = event.requirements || '';
    document.getElementById('eventLearningObjectives').value = event.learning_objectives || '';
    document.getElementById('eventAgenda').value = event.agenda || '';
    document.getElementById('eventTags').value = Array.isArray(event.tags) ? event.tags.join(', ') : '';
    
    // Status
    document.getElementById('eventStatus').value = event.status || 'draft';
    document.getElementById('eventIsPublic').checked = event.is_public !== false;
  }

  formatDateForInput(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toISOString().slice(0, 16);
  }

  async handleEventSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    
    // Convert form data to object
    const eventData = {};
    for (const [key, value] of formData.entries()) {
      eventData[key] = value;
    }
    
    // Handle checkboxes
    eventData.is_virtual = document.getElementById('eventIsVirtual').checked;
    eventData.is_hybrid = document.getElementById('eventIsHybrid').checked;
    eventData.is_free = document.getElementById('eventIsFree').checked;
    eventData.is_featured = document.getElementById('eventIsFeatured').checked;
    eventData.is_public = document.getElementById('eventIsPublic').checked;
    eventData.registration_required = true; // Always require registration
    
    // Handle tags
    const tagsInput = document.getElementById('eventTags').value;
    eventData.tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()).filter(tag => tag) : [];
    
    // Convert numeric fields
    eventData.category_id = parseInt(eventData.category_id);
    eventData.max_participants = parseInt(eventData.max_participants);
    eventData.registration_fee = eventData.is_free ? 0 : (parseFloat(eventData.registration_fee) || 0);

    try {
      let response;
      if (this.selectedEvent) {
        response = await axios.put(`/api/events/${this.selectedEvent.id}`, eventData);
      } else {
        response = await axios.post('/api/events', eventData);
      }
      
      if (response.data.success) {
        this.showNotification(
          this.selectedEvent ? 'Evento actualizado exitosamente' : 'Evento creado exitosamente',
          'success'
        );
        this.closeModal('eventModal');
        this.loadEvents();
        this.loadEventStats();
      } else {
        throw new Error(response.data.error || 'Error al guardar evento');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      this.showNotification(
        error.response?.data?.error || 'Error al guardar evento',
        'error'
      );
    }
  }

  async editEvent(eventId) {
    try {
      const response = await axios.get(`/api/events/${eventId}`);
      if (response.data.success) {
        this.showEventModal(response.data.data);
      }
    } catch (error) {
      console.error('Error loading event:', error);
      this.showNotification('Error al cargar evento', 'error');
    }
  }

  async deleteEvent(eventId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.')) {
      return;
    }
    
    try {
      const response = await axios.delete(`/api/events/${eventId}`);
      if (response.data.success) {
        this.showNotification('Evento eliminado exitosamente', 'success');
        this.loadEvents();
        this.loadEventStats();
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      this.showNotification(
        error.response?.data?.error || 'Error al eliminar evento',
        'error'
      );
    }
  }

  async duplicateEvent(eventId) {
    try {
      const response = await axios.get(`/api/events/${eventId}`);
      if (response.data.success) {
        const event = response.data.data;
        // Clear ID and modify title
        delete event.id;
        event.title = `Copia de ${event.title}`;
        event.status = 'draft';
        event.is_featured = false;
        
        // Reset dates to future
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        event.start_date = nextWeek.toISOString();
        event.end_date = nextWeek.toISOString();
        event.registration_start = now.toISOString();
        event.registration_end = nextWeek.toISOString();
        
        this.showEventModal(event);
      }
    } catch (error) {
      console.error('Error duplicating event:', error);
      this.showNotification('Error al duplicar evento', 'error');
    }
  }

  async viewEventRegistrations(eventId) {
    try {
      const response = await axios.get(`/api/events/${eventId}/registrations`);
      if (response.data.success) {
        this.showEventRegistrationsModal(eventId, response.data.data);
      }
    } catch (error) {
      console.error('Error loading registrations:', error);
      this.showNotification('Error al cargar registros', 'error');
    }
  }

  showEventRegistrationsModal(eventId, registrationsData) {
    const modal = document.getElementById('eventRegistrationsModal');
    const title = document.getElementById('registrationsModalTitle');
    const content = document.getElementById('registrationsContent');
    
    if (!modal || !title || !content) return;

    const event = this.events.find(e => e.id === eventId);
    title.textContent = `Registros: ${event ? event.title : 'Evento'}`;
    
    if (registrationsData.registrations.length === 0) {
      content.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-users text-4xl text-gray-400 mb-4"></i>
          <p class="text-gray-500">No hay registros para este evento</p>
        </div>
      `;
    } else {
      content.innerHTML = `
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participante</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contacto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registro</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${registrationsData.registrations.map(reg => `
                <tr>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm font-medium text-gray-900">${reg.participant_name}</div>
                    ${reg.participant_institution ? `<div class="text-sm text-gray-500">${reg.participant_institution}</div>` : ''}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${reg.participant_email}</div>
                    ${reg.participant_phone ? `<div class="text-sm text-gray-500">${reg.participant_phone}</div>` : ''}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>${new Date(reg.registration_date).toLocaleDateString('es-CO')}</div>
                    <div class="text-xs text-gray-500">${reg.confirmation_code}</div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reg.status === 'confirmed' ? 'bg-green-100 text-green-800' : reg.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}">
                      ${reg.status === 'confirmed' ? 'Confirmado' : reg.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    ${reg.status === 'confirmed' ? `
                      <button
                        onclick="eventsManager.cancelRegistration(${eventId}, ${reg.id})"
                        class="text-red-600 hover:text-red-900"
                        title="Cancelar registro"
                      >
                        <i class="fas fa-times"></i>
                      </button>
                    ` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="mt-6 pt-6 border-t">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-green-50 rounded-lg p-4">
              <div class="text-2xl font-bold text-green-600">
                ${registrationsData.registrations.filter(r => r.status === 'confirmed').length}
              </div>
              <div class="text-sm text-green-700">Confirmados</div>
            </div>
            <div class="bg-yellow-50 rounded-lg p-4">
              <div class="text-2xl font-bold text-yellow-600">
                ${registrationsData.registrations.filter(r => r.status === 'pending').length}
              </div>
              <div class="text-sm text-yellow-700">Pendientes</div>
            </div>
            <div class="bg-red-50 rounded-lg p-4">
              <div class="text-2xl font-bold text-red-600">
                ${registrationsData.registrations.filter(r => r.status === 'cancelled').length}
              </div>
              <div class="text-sm text-red-700">Cancelados</div>
            </div>
          </div>
        </div>
      `;
    }
    
    modal.classList.remove('hidden');
  }

  async cancelRegistration(eventId, registrationId) {
    if (!confirm('¿Estás seguro de que deseas cancelar este registro?')) {
      return;
    }
    
    try {
      const response = await axios.put(`/api/events/${eventId}/registrations/${registrationId}/cancel`);
      if (response.data.success) {
        this.showNotification('Registro cancelado exitosamente', 'success');
        this.viewEventRegistrations(eventId); // Reload registrations
        this.loadEvents(); // Update events list
      }
    } catch (error) {
      console.error('Error cancelling registration:', error);
      this.showNotification('Error al cancelar registro', 'error');
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('hidden');
    }
  }

  showLoadingState() {
    const container = document.getElementById('eventsTableContainer');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-8">
          <i class="fas fa-spinner fa-spin text-2xl text-gray-400"></i>
          <p class="text-gray-500 mt-2">Cargando eventos...</p>
        </div>
      `;
    }
  }

  hideLoadingState() {
    // Loading state is handled by renderEventsTable
  }

  renderEventsError() {
    const container = document.getElementById('eventsTableContainer');
    if (container) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-exclamation-triangle text-4xl text-red-400 mb-4"></i>
          <p class="text-red-600 mb-4">Error al cargar eventos</p>
          <button onclick="eventsManager.loadEvents()" class="btn btn-primary">
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
const eventsManager = new EventsManager();

// Export for global access
window.eventsManager = eventsManager;