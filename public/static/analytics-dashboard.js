/**
 * HU-12: Analytics Dashboard Frontend
 * Sistema completo de dashboard analítico con gráficos interactivos
 */

class AnalyticsDashboard {
  constructor() {
    this.isAuthenticated = false
    this.userRole = null
    this.charts = {}
    this.refreshInterval = null
    this.autoRefreshEnabled = true
    this.refreshIntervalMinutes = 5

    // Chart.js default configuration
    Chart.defaults.responsive = true
    Chart.defaults.maintainAspectRatio = false
    Chart.defaults.plugins.legend.display = true
    Chart.defaults.font.family = 'Inter, system-ui, -apple-system, sans-serif'
    Chart.defaults.font.size = 12

    this.init()
  }

  async init() {
    console.log('📊 [ANALYTICS] Initializing Analytics Dashboard')
    
    try {
      await this.checkAuthentication()
      if (!this.isAuthenticated) {
        this.showLoginRequired()
        return
      }

      if (this.userRole !== 'admin') {
        this.showAccessDenied()
        return
      }

      this.setupEventListeners()
      this.showLoadingState()
      await this.loadAnalyticsDashboard()
      this.startAutoRefresh()
      
      console.log('✅ [ANALYTICS] Dashboard initialized successfully')
    } catch (error) {
      console.error('❌ [ANALYTICS] Error initializing dashboard:', error)
      this.showError('Error al inicializar el dashboard analítico')
    }
  }

  async checkAuthentication() {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        this.isAuthenticated = false
        return
      }

      const response = await this.makeAuthenticatedRequest('/api/monitoring/health')
      if (response.success) {
        this.isAuthenticated = true
        // Get user role from token payload
        const payload = JSON.parse(atob(token.split('.')[1]))
        this.userRole = payload.role
      }
    } catch (error) {
      console.error('❌ [ANALYTICS] Authentication check failed:', error)
      this.isAuthenticated = false
    }
  }

  async makeAuthenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token')
    if (!token) throw new Error('No authentication token found')

    const defaultHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }

    const response = await fetch(url, {
      ...options,
      headers: { ...defaultHeaders, ...options.headers }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    return await response.json()
  }

  setupEventListeners() {
    // Auto-refresh toggle
    document.addEventListener('click', (e) => {
      if (e.target.id === 'toggleAutoRefresh') {
        this.toggleAutoRefresh()
      }
      
      if (e.target.id === 'refreshDashboard') {
        this.refreshDashboard()
      }
      
      if (e.target.id === 'exportReport') {
        this.showExportModal()
      }
      
      if (e.target.classList.contains('export-format-btn')) {
        this.exportReport(e.target.dataset.format, e.target.dataset.type)
      }
    })

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'r':
            e.preventDefault()
            this.refreshDashboard()
            break
          case 'e':
            e.preventDefault()
            this.showExportModal()
            break
        }
      }
    })
  }

  showLoadingState() {
    const container = document.getElementById('analytics-container') || document.body
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Cargando Dashboard Analítico</h2>
          <p class="text-gray-500">Generando métricas y gráficos...</p>
        </div>
      </div>
    `
  }

  showLoginRequired() {
    const container = document.getElementById('analytics-container') || document.body
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center max-w-md mx-auto p-8">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-lock text-red-600 text-2xl"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Autenticación Requerida</h2>
          <p class="text-gray-600 mb-6">Debes iniciar sesión para acceder al dashboard analítico.</p>
          <button onclick="window.location.href='/dashboard'" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Ir al Dashboard
          </button>
        </div>
      </div>
    `
  }

  showAccessDenied() {
    const container = document.getElementById('analytics-container') || document.body
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center max-w-md mx-auto p-8">
          <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-exclamation-triangle text-yellow-600 text-2xl"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Acceso Denegado</h2>
          <p class="text-gray-600 mb-6">Solo los administradores pueden acceder al dashboard analítico.</p>
          <button onclick="window.location.href='/dashboard'" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Volver al Dashboard
          </button>
        </div>
      </div>
    `
  }

  showError(message) {
    const container = document.getElementById('analytics-container') || document.body
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center max-w-md mx-auto p-8">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-exclamation-circle text-red-600 text-2xl"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Error</h2>
          <p class="text-gray-600 mb-6">${message}</p>
          <div class="flex gap-3 justify-center">
            <button onclick="location.reload()" 
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              <i class="fas fa-redo mr-2"></i>Reintentar
            </button>
            <button onclick="window.location.href='/admin'" 
                    class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors">
              Volver al Admin
            </button>
          </div>
        </div>
      </div>
    `
  }

  async loadAnalyticsDashboard() {
    try {
      console.log('📊 [ANALYTICS] Loading analytics data...')
      
      // Load metrics data
      const metricsResponse = await this.makeAuthenticatedRequest('/api/analytics/metrics')
      if (!metricsResponse.success) {
        throw new Error(metricsResponse.message || 'Error loading metrics')
      }

      const metrics = metricsResponse.data
      console.log('✅ [ANALYTICS] Metrics loaded successfully:', metrics.overview)

      // Render dashboard
      this.renderDashboard(metrics)
      
      // Load and render charts
      await this.loadCharts()
      
    } catch (error) {
      console.error('❌ [ANALYTICS] Error loading dashboard:', error)
      this.showError('Error al cargar los datos analíticos: ' + error.message)
    }
  }

  renderDashboard(metrics) {
    const container = document.getElementById('analytics-container') || document.body
    
    const html = `
      <!-- Analytics Dashboard Header -->
      <div class="min-h-screen bg-gray-50">
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div class="flex items-center">
                <i class="fas fa-chart-line text-blue-600 text-2xl mr-3"></i>
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">Dashboard Analítico</h1>
                  <p class="text-gray-500 text-sm">Métricas y reportes de la plataforma CODECTI</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-4">
                <!-- Auto-refresh toggle -->
                <div class="flex items-center">
                  <label class="flex items-center cursor-pointer">
                    <input type="checkbox" id="toggleAutoRefresh" ${this.autoRefreshEnabled ? 'checked' : ''} 
                           class="sr-only">
                    <div class="relative">
                      <div class="block bg-gray-600 w-14 h-8 rounded-full"></div>
                      <div class="dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition"></div>
                    </div>
                    <span class="ml-3 text-sm text-gray-600">Auto-refresh</span>
                  </label>
                </div>
                
                <!-- Action buttons -->
                <button id="refreshDashboard" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                  <i class="fas fa-sync-alt mr-2"></i>Actualizar
                </button>
                
                <button id="exportReport" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                  <i class="fas fa-download mr-2"></i>Exportar
                </button>
                
                <button onclick="window.location.href='/admin'" 
                        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                  <i class="fas fa-arrow-left mr-2"></i>Volver
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Dashboard Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <!-- Overview Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            ${this.renderOverviewCards(metrics.overview)}
          </div>

          <!-- Charts Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Projects Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-project-diagram text-blue-600 mr-2"></i>
                Proyectos por Estado
              </h3>
              <div class="chart-container" style="height: 300px;">
                <canvas id="projectsChart"></canvas>
              </div>
            </div>

            <!-- Users Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-users text-purple-600 mr-2"></i>
                Usuarios por Rol
              </h3>
              <div class="chart-container" style="height: 300px;">
                <canvas id="usersChart"></canvas>
              </div>
            </div>

            <!-- News Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-newspaper text-cyan-600 mr-2"></i>
                Noticias por Categoría
              </h3>
              <div class="chart-container" style="height: 300px;">
                <canvas id="newsChart"></canvas>
              </div>
            </div>

            <!-- Events Timeline Chart -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-calendar-alt text-purple-600 mr-2"></i>
                Tendencia de Eventos
              </h3>
              <div class="chart-container" style="height: 300px;">
                <canvas id="eventsChart"></canvas>
              </div>
            </div>
          </div>

          <!-- Resources Chart - Full Width -->
          <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <i class="fas fa-file-download text-green-600 mr-2"></i>
              Top Recursos Más Descargados
            </h3>
            <div class="chart-container" style="height: 400px;">
              <canvas id="resourcesChart"></canvas>
            </div>
          </div>

          <!-- Analytics Tables -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <!-- Recent Activity -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-clock text-orange-600 mr-2"></i>
                Actividad Reciente
              </h3>
              ${this.renderRecentActivity(metrics)}
            </div>

            <!-- Top Performers -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <i class="fas fa-trophy text-yellow-600 mr-2"></i>
                Contenido Destacado
              </h3>
              ${this.renderTopPerformers(metrics)}
            </div>
          </div>

          <!-- Footer Info -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span>Última actualización: ${new Date(metrics.generated_at || Date.now()).toLocaleString('es-ES')}</span>
              <span>Sistema de Analytics CODECTI v2.0</span>
              <span>Auto-refresh: ${this.autoRefreshEnabled ? `cada ${this.refreshIntervalMinutes} min` : 'desactivado'}</span>
            </div>
          </div>
        </div>
      </div>
    `
    
    container.innerHTML = html
  }

  renderOverviewCards(overview) {
    const cards = [
      { 
        title: 'Proyectos', 
        value: overview.total_projects, 
        subtitle: `${overview.active_projects} activos`, 
        icon: 'fas fa-project-diagram', 
        color: 'blue',
        trend: overview.active_projects > 0 ? '+' + Math.round((overview.active_projects / overview.total_projects) * 100) + '%' : '0%'
      },
      { 
        title: 'Usuarios', 
        value: overview.total_users, 
        subtitle: 'registrados', 
        icon: 'fas fa-users', 
        color: 'purple',
        trend: '+12%'
      },
      { 
        title: 'Noticias', 
        value: overview.total_news, 
        subtitle: `${overview.published_news} publicadas`, 
        icon: 'fas fa-newspaper', 
        color: 'cyan',
        trend: overview.published_news > 0 ? '+' + Math.round((overview.published_news / overview.total_news) * 100) + '%' : '0%'
      },
      { 
        title: 'Eventos', 
        value: overview.total_events, 
        subtitle: `${overview.upcoming_events} próximos`, 
        icon: 'fas fa-calendar-alt', 
        color: 'indigo',
        trend: overview.upcoming_events > 0 ? '+' + overview.upcoming_events : '0'
      },
      { 
        title: 'Recursos', 
        value: overview.total_resources, 
        subtitle: `${overview.public_resources} públicos`, 
        icon: 'fas fa-file-alt', 
        color: 'green',
        trend: overview.public_resources > 0 ? '+' + Math.round((overview.public_resources / overview.total_resources) * 100) + '%' : '0%'
      }
    ]

    return cards.map(card => `
      <div class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-${card.color}-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-${card.color}-600 text-sm font-medium uppercase tracking-wide">${card.title}</p>
            <p class="text-2xl font-bold text-gray-900 mt-2">${card.value.toLocaleString()}</p>
            <p class="text-gray-500 text-sm mt-1">${card.subtitle}</p>
          </div>
          <div class="flex flex-col items-center">
            <div class="w-12 h-12 bg-${card.color}-100 rounded-lg flex items-center justify-center">
              <i class="${card.icon} text-${card.color}-600 text-xl"></i>
            </div>
            <span class="text-xs text-green-600 font-medium mt-2">${card.trend}</span>
          </div>
        </div>
      </div>
    `).join('')
  }

  renderRecentActivity(metrics) {
    const activities = [
      ...metrics.projects.recent_activity.map(p => ({
        type: 'proyecto',
        title: p.title,
        time: new Date(p.created_at).toLocaleDateString('es-ES'),
        icon: 'fas fa-project-diagram text-blue-600'
      })),
      ...metrics.news.recent_articles.slice(0, 3).map(n => ({
        type: 'noticia',
        title: n.title,
        time: new Date(n.created_at).toLocaleDateString('es-ES'),
        icon: 'fas fa-newspaper text-cyan-600'
      }))
    ].slice(0, 8)

    if (activities.length === 0) {
      return '<p class="text-gray-500 text-center py-4">No hay actividad reciente</p>'
    }

    return `
      <div class="space-y-3 max-h-80 overflow-y-auto">
        ${activities.map(activity => `
          <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div class="w-8 h-8 flex items-center justify-center mr-3">
              <i class="${activity.icon}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">${activity.title}</p>
              <p class="text-xs text-gray-500">${activity.type} • ${activity.time}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  renderTopPerformers(metrics) {
    const performers = [
      ...metrics.news.most_viewed.slice(0, 3).map(n => ({
        title: n.title,
        metric: n.views_count + ' vistas',
        type: 'Noticia',
        icon: 'fas fa-eye text-cyan-600'
      })),
      ...metrics.resources.most_downloaded.slice(0, 2).map(r => ({
        title: r.title,
        metric: r.downloads_count + ' descargas',
        type: 'Recurso',
        icon: 'fas fa-download text-green-600'
      }))
    ]

    if (performers.length === 0) {
      return '<p class="text-gray-500 text-center py-4">No hay datos de rendimiento</p>'
    }

    return `
      <div class="space-y-3 max-h-80 overflow-y-auto">
        ${performers.map(performer => `
          <div class="flex items-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <div class="w-8 h-8 flex items-center justify-center mr-3">
              <i class="${performer.icon}"></i>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 truncate">${performer.title}</p>
              <p class="text-xs text-gray-500">${performer.type} • ${performer.metric}</p>
            </div>
          </div>
        `).join('')}
      </div>
    `
  }

  async loadCharts() {
    try {
      console.log('📈 [ANALYTICS] Loading charts...')
      
      const chartTypes = [
        'projects-overview',
        'users-roles', 
        'news-categories',
        'events-timeline',
        'resources-downloads'
      ]

      // Load all chart data in parallel
      const chartPromises = chartTypes.map(type => 
        this.makeAuthenticatedRequest(`/api/analytics/charts/${type}`)
      )

      const chartResponses = await Promise.all(chartPromises)
      
      // Render charts
      chartResponses.forEach((response, index) => {
        if (response.success) {
          const chartType = chartTypes[index]
          const canvasId = this.getCanvasIdForChartType(chartType)
          this.renderChart(canvasId, response.data)
        }
      })

      console.log('✅ [ANALYTICS] All charts loaded successfully')
    } catch (error) {
      console.error('❌ [ANALYTICS] Error loading charts:', error)
    }
  }

  getCanvasIdForChartType(chartType) {
    const mapping = {
      'projects-overview': 'projectsChart',
      'users-roles': 'usersChart',
      'news-categories': 'newsChart',
      'events-timeline': 'eventsChart',
      'resources-downloads': 'resourcesChart'
    }
    return mapping[chartType]
  }

  renderChart(canvasId, chartConfig) {
    try {
      const canvas = document.getElementById(canvasId)
      if (!canvas) {
        console.warn(`Canvas ${canvasId} not found`)
        return
      }

      const ctx = canvas.getContext('2d')
      
      // Destroy existing chart if it exists
      if (this.charts[canvasId]) {
        this.charts[canvasId].destroy()
      }

      // Create new chart
      this.charts[canvasId] = new Chart(ctx, chartConfig)
      
      console.log(`✅ [ANALYTICS] Chart ${canvasId} rendered successfully`)
    } catch (error) {
      console.error(`❌ [ANALYTICS] Error rendering chart ${canvasId}:`, error)
    }
  }

  toggleAutoRefresh() {
    this.autoRefreshEnabled = !this.autoRefreshEnabled
    
    if (this.autoRefreshEnabled) {
      this.startAutoRefresh()
      this.showNotification('Auto-refresh activado', 'success')
    } else {
      this.stopAutoRefresh()
      this.showNotification('Auto-refresh desactivado', 'info')
    }
  }

  startAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
    }
    
    if (this.autoRefreshEnabled) {
      this.refreshInterval = setInterval(() => {
        console.log('🔄 [ANALYTICS] Auto-refreshing dashboard...')
        this.loadAnalyticsDashboard()
      }, this.refreshIntervalMinutes * 60 * 1000)
    }
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval)
      this.refreshInterval = null
    }
  }

  async refreshDashboard() {
    try {
      this.showNotification('Actualizando dashboard...', 'info')
      await this.loadAnalyticsDashboard()
      this.showNotification('Dashboard actualizado correctamente', 'success')
    } catch (error) {
      console.error('❌ [ANALYTICS] Error refreshing dashboard:', error)
      this.showNotification('Error al actualizar el dashboard', 'error')
    }
  }

  showExportModal() {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
        <div class="flex justify-between items-center mb-6">
          <h3 class="text-lg font-semibold text-gray-900">Exportar Reportes</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Tipo de Reporte</label>
            <div class="grid grid-cols-2 gap-2">
              <button data-type="projects" data-format="json" class="export-format-btn bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-project-diagram mr-2"></i>Proyectos
              </button>
              <button data-type="users" data-format="json" class="export-format-btn bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-users mr-2"></i>Usuarios
              </button>
              <button data-type="news" data-format="json" class="export-format-btn bg-cyan-50 hover:bg-cyan-100 text-cyan-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-newspaper mr-2"></i>Noticias
              </button>
              <button data-type="events" data-format="json" class="export-format-btn bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-calendar-alt mr-2"></i>Eventos
              </button>
              <button data-type="resources" data-format="json" class="export-format-btn bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-file-alt mr-2"></i>Recursos
              </button>
              <button data-type="comprehensive" data-format="json" class="export-format-btn bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-chart-pie mr-2"></i>Completo
              </button>
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Formato</label>
            <div class="grid grid-cols-2 gap-2">
              <button data-type="comprehensive" data-format="json" class="export-format-btn bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-code mr-2"></i>JSON
              </button>
              <button data-type="comprehensive" data-format="csv" class="export-format-btn bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                <i class="fas fa-table mr-2"></i>CSV
              </button>
            </div>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end space-x-3">
          <button onclick="this.closest('.fixed').remove()" 
                  class="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    `
    
    document.body.appendChild(modal)
  }

  async exportReport(format, type) {
    try {
      this.showNotification(`Generando reporte ${type} en formato ${format.toUpperCase()}...`, 'info')
      
      const request = {
        report_type: type,
        format: format,
        include_charts: false,
        include_details: true
      }

      const response = await this.makeAuthenticatedRequest('/api/analytics/reports', {
        method: 'POST',
        body: JSON.stringify(request)
      })

      if (response.success) {
        // Close modal
        const modal = document.querySelector('.fixed.inset-0')
        if (modal) modal.remove()
        
        this.showNotification(
          `Reporte ${type} generado exitosamente. ID: ${response.data.report_id}`, 
          'success'
        )
        
        // In a real implementation, you would download the file here
        console.log('📋 [ANALYTICS] Report generated:', response.data)
      } else {
        throw new Error(response.message || 'Error generating report')
      }
    } catch (error) {
      console.error('❌ [ANALYTICS] Error exporting report:', error)
      this.showNotification('Error al generar el reporte: ' + error.message, 'error')
    }
  }

  showNotification(message, type = 'info') {
    const colors = {
      success: 'bg-green-500',
      error: 'bg-red-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-500'
    }

    const icons = {
      success: 'fas fa-check-circle',
      error: 'fas fa-exclamation-circle',
      warning: 'fas fa-exclamation-triangle',
      info: 'fas fa-info-circle'
    }

    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 ${colors[type]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300`
    notification.innerHTML = `
      <div class="flex items-center">
        <i class="${icons[type]} mr-2"></i>
        <span>${message}</span>
      </div>
    `
    
    document.body.appendChild(notification)
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification)
        }
      }, 300)
    }, 4000)
  }

  // Cleanup when leaving the page
  destroy() {
    this.stopAutoRefresh()
    
    // Destroy all charts
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.destroy()
    })
    
    this.charts = {}
    console.log('🧹 [ANALYTICS] Dashboard cleaned up')
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.AnalyticsDashboard = new AnalyticsDashboard()
})

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
  if (window.AnalyticsDashboard) {
    window.AnalyticsDashboard.destroy()
  }
})