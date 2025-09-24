// CODECTI Platform - Sistema de Dashboard para Logs y Monitoreo
// Interfaz avanzada para revisión de logs, métricas y salud del sistema

class SystemDashboard {
  constructor() {
    this.logs = [];
    this.metrics = null;
    this.components = [];
    this.currentFilter = {
      level: [],
      component: [],
      search: '',
      timeframe: '24h',
      hasErrors: false
    };
    this.refreshInterval = null;
  }

  // Inicializar el dashboard
  async init() {
    await this.loadComponents();
    await this.loadLogs();
    await this.loadMetrics();
    this.setupEventListeners();
    this.startAutoRefresh();
    
    console.log('Sistema de Dashboard inicializado');
  }

  // Cargar componentes disponibles para filtros
  async loadComponents() {
    try {
      const response = await axios.get('/api/system-logs/components');
      if (response.data.success) {
        this.components = response.data.data.components;
        this.renderComponentFilter();
      }
    } catch (error) {
      console.error('Error cargando componentes:', error);
    }
  }

  // Cargar logs con filtros
  async loadLogs() {
    try {
      const params = new URLSearchParams();
      
      if (this.currentFilter.level.length > 0) {
        params.append('level', this.currentFilter.level.join(','));
      }
      
      if (this.currentFilter.component.length > 0) {
        params.append('component', this.currentFilter.component.join(','));
      }
      
      if (this.currentFilter.search) {
        params.append('search', this.currentFilter.search);
      }
      
      if (this.currentFilter.hasErrors) {
        params.append('hasErrors', 'true');
      }

      // Configurar timeframe
      const now = new Date();
      let startDate;
      
      switch (this.currentFilter.timeframe) {
        case '1h':
          startDate = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case '6h':
          startDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
          break;
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
      }
      
      if (startDate) {
        params.append('startDate', startDate.toISOString());
      }

      params.append('limit', '200');

      const response = await axios.get(`/api/system-logs?${params.toString()}`);
      
      if (response.data.success) {
        this.logs = response.data.data.logs;
        this.metrics = response.data.data.metrics;
        this.renderLogs();
        this.renderMetrics();
      }
      
    } catch (error) {
      console.error('Error cargando logs:', error);
      this.showNotification('Error al cargar logs del sistema', 'error');
    }
  }

  // Cargar métricas específicas
  async loadMetrics() {
    try {
      const response = await axios.get(`/api/system-logs/metrics?timeframe=${this.currentFilter.timeframe}`);
      
      if (response.data.success) {
        this.metrics = response.data.data.metrics;
        this.renderSystemHealth();
      }
      
    } catch (error) {
      console.error('Error cargando métricas:', error);
    }
  }

  // Renderizar el dashboard principal
  render() {
    const dashboard = document.getElementById('systemDashboard');
    if (!dashboard) return;

    dashboard.innerHTML = `
      <div class="system-dashboard p-6 bg-gray-50 min-h-screen">
        <div class="max-w-7xl mx-auto">
          <!-- Header -->
          <div class="mb-6">
            <h1 class="text-3xl font-bold text-gray-900 mb-2">
              <i class="fas fa-chart-line mr-2"></i>
              Sistema de Monitoreo y Logs
            </h1>
            <p class="text-gray-600">Análisis en tiempo real del estado del sistema CODECTI</p>
          </div>

          <!-- Métricas del Sistema -->
          <div id="systemMetrics" class="mb-6">
            ${this.renderSystemHealthHTML()}
          </div>

          <!-- Filtros -->
          <div class="bg-white rounded-lg shadow p-4 mb-6">
            <h3 class="text-lg font-semibold mb-4">Filtros de Logs</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              
              <!-- Timeframe -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Período</label>
                <select id="timeframeFilter" class="form-input w-full">
                  <option value="1h">Última hora</option>
                  <option value="6h">Últimas 6 horas</option>
                  <option value="24h" selected>Últimas 24 horas</option>
                  <option value="7d">Últimos 7 días</option>
                </select>
              </div>

              <!-- Nivel -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Nivel</label>
                <select id="levelFilter" multiple class="form-input w-full">
                  <option value="DEBUG">DEBUG</option>
                  <option value="INFO">INFO</option>
                  <option value="WARN">WARN</option>
                  <option value="ERROR">ERROR</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <!-- Componente -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Componente</label>
                <select id="componentFilter" multiple class="form-input w-full">
                  <!-- Se llenará dinámicamente -->
                </select>
              </div>

              <!-- Búsqueda -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <input 
                  type="text" 
                  id="searchFilter" 
                  class="form-input w-full"
                  placeholder="Buscar en logs..."
                >
              </div>
            </div>
            
            <div class="mt-4 flex gap-2">
              <button id="applyFilters" class="btn btn-primary">
                <i class="fas fa-search mr-2"></i>
                Aplicar Filtros
              </button>
              <button id="clearFilters" class="btn btn-secondary">
                <i class="fas fa-times mr-2"></i>
                Limpiar
              </button>
              <button id="refreshLogs" class="btn btn-secondary">
                <i class="fas fa-sync-alt mr-2"></i>
                Actualizar
              </button>
              <button id="exportLogs" class="btn btn-secondary">
                <i class="fas fa-download mr-2"></i>
                Exportar
              </button>
              <label class="flex items-center ml-4">
                <input type="checkbox" id="errorsOnly" class="mr-2">
                <span class="text-sm">Solo errores</span>
              </label>
              <label class="flex items-center ml-4">
                <input type="checkbox" id="autoRefresh" class="mr-2" checked>
                <span class="text-sm">Auto-actualizar</span>
              </label>
            </div>
          </div>

          <!-- Análisis de Errores -->
          <div id="errorAnalysis" class="mb-6">
            <!-- Se llenará dinámicamente -->
          </div>

          <!-- Logs del Sistema -->
          <div class="bg-white rounded-lg shadow">
            <div class="p-4 border-b border-gray-200">
              <h3 class="text-lg font-semibold">Logs del Sistema</h3>
              <p class="text-sm text-gray-600" id="logsSummary">Cargando logs...</p>
            </div>
            
            <div id="logsContainer" class="max-h-96 overflow-y-auto">
              <!-- Se llenará dinámicamente -->
            </div>
          </div>

          <!-- Herramientas de Mantenimiento -->
          <div class="mt-6 bg-white rounded-lg shadow p-4">
            <h3 class="text-lg font-semibold mb-4">Herramientas de Mantenimiento</h3>
            <div class="flex gap-4">
              <button id="cleanupLogs" class="btn btn-warning">
                <i class="fas fa-broom mr-2"></i>
                Limpiar Logs Antiguos
              </button>
              <button id="systemHealth" class="btn btn-info">
                <i class="fas fa-heartbeat mr-2"></i>
                Verificar Salud del Sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Configurar valores iniciales
    document.getElementById('timeframeFilter').value = this.currentFilter.timeframe;
  }

  // Renderizar salud del sistema
  renderSystemHealthHTML() {
    if (!this.metrics) {
      return '<div class="text-center py-4">Cargando métricas...</div>';
    }

    const healthColor = {
      'healthy': 'bg-green-500',
      'warning': 'bg-yellow-500',
      'critical': 'bg-red-500'
    }[this.metrics.systemHealth] || 'bg-gray-500';

    const healthIcon = {
      'healthy': 'fas fa-check-circle',
      'warning': 'fas fa-exclamation-triangle',
      'critical': 'fas fa-times-circle'
    }[this.metrics.systemHealth] || 'fas fa-question-circle';

    return `
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- Estado General -->
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <div class="flex items-center justify-center mb-2">
            <div class="${healthColor} w-4 h-4 rounded-full mr-2"></div>
            <i class="${healthIcon} text-xl"></i>
          </div>
          <h3 class="font-semibold text-sm text-gray-600">Estado del Sistema</h3>
          <p class="text-lg font-bold capitalize">${this.metrics.systemHealth}</p>
        </div>

        <!-- Total de Logs -->
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <i class="fas fa-file-alt text-2xl text-blue-500 mb-2"></i>
          <h3 class="font-semibold text-sm text-gray-600">Total de Logs</h3>
          <p class="text-2xl font-bold">${this.metrics.totalLogs.toLocaleString()}</p>
        </div>

        <!-- Errores -->
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <i class="fas fa-exclamation-circle text-2xl text-red-500 mb-2"></i>
          <h3 class="font-semibold text-sm text-gray-600">Errores</h3>
          <p class="text-2xl font-bold text-red-600">${this.metrics.errorCount}</p>
          ${this.metrics.criticalCount > 0 ? `<p class="text-sm text-red-500">+${this.metrics.criticalCount} críticos</p>` : ''}
        </div>

        <!-- Usuarios Activos -->
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <i class="fas fa-users text-2xl text-green-500 mb-2"></i>
          <h3 class="font-semibold text-sm text-gray-600">Usuarios Activos</h3>
          <p class="text-2xl font-bold">${this.metrics.activeUsers}</p>
        </div>

        <!-- Tiempo de Respuesta -->
        <div class="bg-white rounded-lg shadow p-4 text-center">
          <i class="fas fa-tachometer-alt text-2xl text-purple-500 mb-2"></i>
          <h3 class="font-semibold text-sm text-gray-600">Tiempo Respuesta</h3>
          <p class="text-2xl font-bold">${this.metrics.averageResponseTime ? Math.round(this.metrics.averageResponseTime) : 'N/A'}<span class="text-sm">ms</span></p>
        </div>
      </div>
    `;
  }

  // Renderizar métricas
  renderSystemHealth() {
    const container = document.getElementById('systemMetrics');
    if (container) {
      container.innerHTML = this.renderSystemHealthHTML();
    }
  }

  // Renderizar logs
  renderLogs() {
    const container = document.getElementById('logsContainer');
    const summary = document.getElementById('logsSummary');
    
    if (!container) return;

    if (summary) {
      summary.textContent = `Mostrando ${this.logs.length} logs - ${this.currentFilter.timeframe}`;
    }

    if (this.logs.length === 0) {
      container.innerHTML = `
        <div class="text-center py-8 text-gray-500">
          <i class="fas fa-inbox text-3xl mb-2"></i>
          <p>No se encontraron logs con los filtros aplicados</p>
        </div>
      `;
      return;
    }

    const logsHTML = this.logs.map(log => this.renderLogEntry(log)).join('');
    container.innerHTML = logsHTML;
  }

  // Renderizar una entrada de log individual
  renderLogEntry(log) {
    const levelColors = {
      'DEBUG': 'text-gray-500 bg-gray-50',
      'INFO': 'text-blue-600 bg-blue-50',
      'WARN': 'text-yellow-600 bg-yellow-50',
      'ERROR': 'text-red-600 bg-red-50',
      'CRITICAL': 'text-white bg-red-600'
    };

    const levelIcons = {
      'DEBUG': 'fas fa-bug',
      'INFO': 'fas fa-info-circle',
      'WARN': 'fas fa-exclamation-triangle',
      'ERROR': 'fas fa-times-circle',
      'CRITICAL': 'fas fa-fire'
    };

    const levelClass = levelColors[log.level] || 'text-gray-600 bg-gray-50';
    const levelIcon = levelIcons[log.level] || 'fas fa-circle';

    const timestamp = new Date(log.timestamp).toLocaleString();
    const hasData = log.data && Object.keys(log.data).length > 0;
    const hasStack = log.errorStack && log.errorStack.length > 0;

    return `
      <div class="log-entry border-b border-gray-100 p-3 hover:bg-gray-50 transition-colors">
        <div class="flex items-start gap-3">
          <!-- Level Badge -->
          <span class="${levelClass} px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
            <i class="${levelIcon}"></i>
            ${log.level}
          </span>
          
          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="font-medium text-gray-900">${log.component}</span>
              <span class="text-sm text-gray-500">${timestamp}</span>
              ${log.duration ? `<span class="text-xs bg-gray-200 px-2 py-1 rounded">${log.duration}ms</span>` : ''}
              ${log.status ? `<span class="text-xs bg-blue-200 px-2 py-1 rounded">${log.status}</span>` : ''}
            </div>
            
            <p class="text-gray-800 mb-2">${this.escapeHtml(log.message)}</p>
            
            ${hasData ? `
              <details class="text-sm">
                <summary class="cursor-pointer text-gray-600 hover:text-gray-800">Datos adicionales</summary>
                <pre class="mt-2 bg-gray-100 p-2 rounded text-xs overflow-x-auto">${JSON.stringify(log.data, null, 2)}</pre>
              </details>
            ` : ''}
            
            ${hasStack ? `
              <details class="text-sm mt-2">
                <summary class="cursor-pointer text-red-600 hover:text-red-800">Stack Trace</summary>
                <pre class="mt-2 bg-red-50 p-2 rounded text-xs overflow-x-auto text-red-800">${this.escapeHtml(log.errorStack)}</pre>
              </details>
            ` : ''}
          </div>
          
          <!-- Actions -->
          <div class="flex items-center gap-2">
            ${log.userId ? `<span class="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">User: ${log.userId}</span>` : ''}
            ${log.requestId ? `<button onclick="systemDashboard.filterByRequest('${log.requestId}')" class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hover:bg-purple-200">Req: ${log.requestId.slice(-6)}</button>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // Renderizar filtro de componentes
  renderComponentFilter() {
    const select = document.getElementById('componentFilter');
    if (!select) return;

    select.innerHTML = this.components.map(component => 
      `<option value="${component}">${component}</option>`
    ).join('');
  }

  // Event listeners
  setupEventListeners() {
    document.getElementById('applyFilters')?.addEventListener('click', () => this.applyFilters());
    document.getElementById('clearFilters')?.addEventListener('click', () => this.clearFilters());
    document.getElementById('refreshLogs')?.addEventListener('click', () => this.loadLogs());
    document.getElementById('exportLogs')?.addEventListener('click', () => this.exportLogs());
    document.getElementById('cleanupLogs')?.addEventListener('click', () => this.cleanupLogs());
    document.getElementById('systemHealth')?.addEventListener('click', () => this.checkSystemHealth());
    
    // Auto-refresh toggle
    document.getElementById('autoRefresh')?.addEventListener('change', (e) => {
      if (e.target.checked) {
        this.startAutoRefresh();
      } else {
        this.stopAutoRefresh();
      }
    });

    // Search en tiempo real
    let searchTimeout;
    document.getElementById('searchFilter')?.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        this.currentFilter.search = e.target.value;
        this.loadLogs();
      }, 500);
    });
  }

  // Aplicar filtros
  applyFilters() {
    const timeframe = document.getElementById('timeframeFilter')?.value;
    const levelSelect = document.getElementById('levelFilter');
    const componentSelect = document.getElementById('componentFilter');
    const search = document.getElementById('searchFilter')?.value;
    const errorsOnly = document.getElementById('errorsOnly')?.checked;

    this.currentFilter = {
      timeframe: timeframe || '24h',
      level: levelSelect ? Array.from(levelSelect.selectedOptions).map(option => option.value) : [],
      component: componentSelect ? Array.from(componentSelect.selectedOptions).map(option => option.value) : [],
      search: search || '',
      hasErrors: errorsOnly || false
    };

    this.loadLogs();
  }

  // Limpiar filtros
  clearFilters() {
    this.currentFilter = {
      level: [],
      component: [],
      search: '',
      timeframe: '24h',
      hasErrors: false
    };

    document.getElementById('timeframeFilter').value = '24h';
    document.getElementById('levelFilter').selectedIndex = -1;
    document.getElementById('componentFilter').selectedIndex = -1;
    document.getElementById('searchFilter').value = '';
    document.getElementById('errorsOnly').checked = false;

    this.loadLogs();
  }

  // Exportar logs
  async exportLogs() {
    try {
      const response = await axios.get(`/api/system-logs/export?format=json&timeframe=${this.currentFilter.timeframe}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `system_logs_${this.currentFilter.timeframe}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      this.showNotification('Logs exportados correctamente', 'success');
      
    } catch (error) {
      console.error('Error exportando logs:', error);
      this.showNotification('Error al exportar logs', 'error');
    }
  }

  // Limpiar logs antiguos
  async cleanupLogs() {
    const days = prompt('¿Cuántos días de logs mantener? (1-365)', '7');
    if (!days || isNaN(days) || days < 1 || days > 365) return;

    try {
      const response = await axios.delete(`/api/system-logs/cleanup?days=${days}`);
      
      if (response.data.success) {
        this.showNotification(response.data.data.message, 'success');
        this.loadLogs();
      }
      
    } catch (error) {
      console.error('Error limpiando logs:', error);
      this.showNotification('Error al limpiar logs antiguos', 'error');
    }
  }

  // Verificar salud del sistema
  async checkSystemHealth() {
    await this.loadMetrics();
    this.showNotification('Verificación de salud del sistema completada', 'info');
  }

  // Filtrar por request ID
  filterByRequest(requestId) {
    this.currentFilter.search = requestId;
    document.getElementById('searchFilter').value = requestId;
    this.loadLogs();
  }

  // Auto-refresh
  startAutoRefresh() {
    if (this.refreshInterval) return;
    
    this.refreshInterval = setInterval(() => {
      this.loadLogs();
      this.loadMetrics();
    }, 30000); // 30 segundos
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  // Utilidades
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  showNotification(message, type) {
    // Reusar el sistema de notificaciones del app principal si existe
    if (window.app && window.app.showNotification) {
      window.app.showNotification(message, type);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
      alert(message);
    }
  }
}

// Instancia global
window.systemDashboard = new SystemDashboard();