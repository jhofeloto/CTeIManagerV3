// CODECTI Platform - Admin Dashboard

const AdminDashboard = {
  refreshInterval: null,
  refreshRate: 30000, // 30 seconds
  
  // Helper function to make authenticated requests
  async makeAuthenticatedRequest(method, url, data = null, options = {}) {
    const token = App.token || localStorage.getItem('codecti_token');
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const config = {
      method,
      url,
      headers: {
        'Authorization': `Bearer ${token}`,
        ...options.headers
      },
      ...options
    };

    if (data) {
      config.data = data;
    }

    return await axios(config);
  },
  
  init() {
    this.loadSystemStatus();
    this.loadMetrics();
    this.loadRecentLogs();
    this.loadRecentErrors();
    this.loadUsers();
    this.startAutoRefresh();
    this.setupEventListeners();
  },

  setupEventListeners() {
    // Refresh buttons
    document.getElementById('refreshStatus')?.addEventListener('click', () => {
      this.loadSystemStatus();
      App.showNotification('Estado del sistema actualizado', 'info');
    });

    document.getElementById('refreshMetrics')?.addEventListener('click', () => {
      this.loadMetrics();
      App.showNotification('Métricas actualizadas', 'info');
    });

    // Export logs
    document.getElementById('exportLogsJson')?.addEventListener('click', () => {
      this.exportLogs('json');
    });

    document.getElementById('exportLogsCsv')?.addEventListener('click', () => {
      this.exportLogs('csv');
    });

    // Cleanup actions
    document.getElementById('cleanupLogs')?.addEventListener('click', () => {
      this.showCleanupModal('logs');
    });

    document.getElementById('cleanupErrors')?.addEventListener('click', () => {
      this.showCleanupModal('errors');
    });

    // Test load
    document.getElementById('generateTestLoad')?.addEventListener('click', () => {
      this.generateTestLoad();
    });

    // Configure logo
    document.getElementById('configureLogoButton')?.addEventListener('click', () => {
      if (typeof LogoManager !== 'undefined') {
        LogoManager.showLogoConfigModal();
      } else {
        App.showNotification('LogoManager no está disponible', 'error');
      }
    });

    // Open system logs dashboard
    document.getElementById('openSystemLogs')?.addEventListener('click', () => {
      this.openSystemLogsDashboard();
    });

    // Back to dashboard
    document.getElementById('backToDashboard')?.addEventListener('click', () => {
      this.backToDashboard();
    });

    // Force health check
    document.getElementById('forceHealthCheck')?.addEventListener('click', () => {
      this.forceHealthCheck();
    });

    // Auto-refresh toggle
    document.getElementById('toggleAutoRefresh')?.addEventListener('click', () => {
      this.toggleAutoRefresh();
    });

    // Filter controls
    document.getElementById('logLevelFilter')?.addEventListener('change', () => {
      this.loadRecentLogs();
    });

    document.getElementById('errorSeverityFilter')?.addEventListener('change', () => {
      this.loadRecentErrors();
    });

    // Search functionality
    document.getElementById('logSearch')?.addEventListener('input', 
      this.debounce(() => this.loadRecentLogs(), 500)
    );

    document.getElementById('errorSearch')?.addEventListener('input', 
      this.debounce(() => this.loadRecentErrors(), 500)
    );
  },

  async loadSystemStatus() {
    try {
      const response = await this.makeAuthenticatedRequest('GET', '/api/monitoring/admin/status');
      if (response.data.success) {
        this.renderSystemStatus(response.data.data);
      }
    } catch (error) {
      console.error('Error loading system status:', error);
      App.showNotification('Error al cargar estado del sistema', 'error');
    }
  },

  async loadMetrics() {
    try {
      const response = await this.makeAuthenticatedRequest('GET', '/api/monitoring/admin/metrics');
      if (response.data.success) {
        this.renderMetrics(response.data.data);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      App.showNotification('Error al cargar métricas', 'error');
    }
  },

  async loadRecentLogs() {
    try {
      const level = document.getElementById('logLevelFilter')?.value || '';
      const search = document.getElementById('logSearch')?.value || '';
      
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (search) params.append('search', search);
      params.append('limit', '20');
      
      const response = await this.makeAuthenticatedRequest('GET', `/api/monitoring/admin/logs?${params}`);
      if (response.data.success) {
        this.renderLogs(response.data.data.logs);
      }
    } catch (error) {
      console.error('Error loading logs:', error);
      App.showNotification('Error al cargar logs', 'error');
    }
  },

  async loadRecentErrors() {
    try {
      const severity = document.getElementById('errorSeverityFilter')?.value || '';
      const search = document.getElementById('errorSearch')?.value || '';
      
      const params = new URLSearchParams();
      if (severity) params.append('severity', severity);
      if (search) params.append('search', search);
      params.append('limit', '20');
      
      const response = await this.makeAuthenticatedRequest('GET', `/api/monitoring/admin/errors?${params}`);
      if (response.data.success) {
        this.renderErrors(response.data.data.errors, response.data.data.stats);
      }
    } catch (error) {
      console.error('Error loading errors:', error);
      App.showNotification('Error al cargar errores', 'error');
    }
  },

  renderSystemStatus(status) {
    const statusContainer = document.getElementById('systemStatus');
    if (!statusContainer) return;

    const statusColor = {
      'healthy': 'text-green-600 bg-green-100',
      'warning': 'text-yellow-600 bg-yellow-100',
      'critical': 'text-red-600 bg-red-100'
    }[status.status] || 'text-gray-600 bg-gray-100';

    const statusIcon = {
      'healthy': 'fa-check-circle',
      'warning': 'fa-exclamation-triangle',
      'critical': 'fa-times-circle'
    }[status.status] || 'fa-question-circle';

    statusContainer.innerHTML = `
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Estado del Sistema</h2>
          <button id="refreshStatus" class="btn btn-secondary btn-sm">
            <i class="fas fa-refresh mr-1"></i> Actualizar
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div class="text-center">
            <div class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor}">
              <i class="fas ${statusIcon} mr-2"></i>
              ${status.status.toUpperCase()}
            </div>
            <p class="text-sm text-gray-600 mt-1">Estado General</p>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">
              ${Math.floor(status.uptime / 1000 / 60)} min
            </div>
            <p class="text-sm text-gray-600">Tiempo Activo</p>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">v${status.version}</div>
            <p class="text-sm text-gray-600">Versión</p>
          </div>
          
          <div class="text-center">
            <div class="text-2xl font-bold text-gray-900">${status.environment}</div>
            <p class="text-sm text-gray-600">Entorno</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          ${status.checks.map(check => `
            <div class="border rounded-lg p-4">
              <div class="flex items-center justify-between mb-2">
                <h3 class="font-medium capitalize">${check.name}</h3>
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  check.status === 'healthy' ? 'text-green-700 bg-green-100' :
                  check.status === 'warning' ? 'text-yellow-700 bg-yellow-100' :
                  'text-red-700 bg-red-100'
                }">
                  ${check.status}
                </span>
              </div>
              <p class="text-sm text-gray-600 mb-2">${check.message}</p>
              <p class="text-xs text-gray-500">
                Tiempo de respuesta: ${check.responseTime}ms
              </p>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderMetrics(data) {
    const metricsContainer = document.getElementById('metricsOverview');
    if (!metricsContainer) return;

    metricsContainer.innerHTML = `
      <div class="card p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Métricas del Sistema</h2>
          <button id="refreshMetrics" class="btn btn-secondary btn-sm">
            <i class="fas fa-refresh mr-1"></i> Actualizar
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="text-center">
            <div class="text-3xl font-bold text-blue-600">${data.logs.totalLogs}</div>
            <p class="text-sm text-gray-600">Total Logs</p>
          </div>
          
          <div class="text-center">
            <div class="text-3xl font-bold ${data.errors.last24h > 10 ? 'text-red-600' : 'text-green-600'}">
              ${data.errors.last24h}
            </div>
            <p class="text-sm text-gray-600">Errores (24h)</p>
          </div>
          
          <div class="text-center">
            <div class="text-3xl font-bold ${data.logs.averageResponseTime > 1000 ? 'text-red-600' : 'text-green-600'}">
              ${data.logs.averageResponseTime}ms
            </div>
            <p class="text-sm text-gray-600">Tiempo Respuesta</p>
          </div>
          
          <div class="text-center">
            <div class="text-3xl font-bold ${data.logs.slowRequests > 5 ? 'text-yellow-600' : 'text-green-600'}">
              ${data.logs.slowRequests}
            </div>
            <p class="text-sm text-gray-600">Requests Lentos</p>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="font-medium mb-3">Errores por Tipo</h3>
            <div class="space-y-2">
              ${Object.entries(data.errors.byType).map(([type, count]) => `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600">${type}</span>
                  <span class="font-medium">${count}</span>
                </div>
              `).join('') || '<p class="text-gray-500 text-sm">Sin errores registrados</p>'}
            </div>
          </div>
          
          <div>
            <h3 class="font-medium mb-3">Errores por Severidad</h3>
            <div class="space-y-2">
              ${Object.entries(data.errors.bySeverity).map(([severity, count]) => `
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-600 capitalize">${severity}</span>
                  <span class="font-medium ${severity === 'critical' ? 'text-red-600' : ''}">${count}</span>
                </div>
              `).join('') || '<p class="text-gray-500 text-sm">Sin errores registrados</p>'}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderLogs(logs) {
    const logsContainer = document.getElementById('recentLogs');
    if (!logsContainer) return;

    const levelColors = {
      'ERROR': 'text-red-700 bg-red-50',
      'WARN': 'text-yellow-700 bg-yellow-50',
      'INFO': 'text-blue-700 bg-blue-50',
      'DEBUG': 'text-gray-700 bg-gray-50'
    };

    logsContainer.innerHTML = `
      <div class="space-y-2">
        ${logs.length === 0 ? `
          <p class="text-gray-500 text-center py-8">No hay logs disponibles</p>
        ` : logs.map(log => `
          <div class="border rounded-lg p-3 hover:bg-gray-50">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${levelColors[log.level] || 'text-gray-700 bg-gray-50'}">
                  ${log.level}
                </span>
                ${log.context ? `<span class="text-xs text-gray-500">${log.context}</span>` : ''}
              </div>
              <span class="text-xs text-gray-500">
                ${new Date(log.timestamp).toLocaleString()}
              </span>
            </div>
            <p class="text-sm text-gray-800 mb-1">${log.message}</p>
            ${log.path ? `<p class="text-xs text-gray-500">${log.method} ${log.path} - ${log.statusCode} (${log.responseTime}ms)</p>` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  renderErrors(errors, stats) {
    const errorsContainer = document.getElementById('recentErrors');
    if (!errorsContainer) return;

    const severityColors = {
      'critical': 'text-red-700 bg-red-50',
      'high': 'text-red-600 bg-red-50',
      'medium': 'text-yellow-600 bg-yellow-50',
      'low': 'text-gray-600 bg-gray-50'
    };

    errorsContainer.innerHTML = `
      <div class="space-y-2">
        ${errors.length === 0 ? `
          <p class="text-gray-500 text-center py-8">No hay errores registrados</p>
        ` : errors.map(error => `
          <div class="border rounded-lg p-3 hover:bg-gray-50">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${severityColors[error.severity]}">
                  ${error.severity.toUpperCase()}
                </span>
                <span class="text-xs font-medium text-gray-600">${error.error.name}</span>
                ${error.resolved ? '<span class="text-xs text-green-600">✓ Resuelto</span>' : ''}
              </div>
              <span class="text-xs text-gray-500">
                ${new Date(error.timestamp).toLocaleString()}
              </span>
            </div>
            <p class="text-sm text-gray-800 mb-1">${error.error.message}</p>
            <p class="text-xs text-gray-500">${error.context.method} ${error.context.path}</p>
            ${!error.resolved ? `
              <button 
                onclick="AdminDashboard.resolveError('${error.id}')" 
                class="mt-2 text-xs text-blue-600 hover:text-blue-800"
              >
                Marcar como resuelto
              </button>
            ` : ''}
          </div>
        `).join('')}
      </div>
    `;
  },

  async resolveError(errorId) {
    try {
      const response = await axios.patch(`/api/monitoring/admin/errors/${errorId}/resolve`);
      if (response.data.success) {
        App.showNotification('Error marcado como resuelto', 'success');
        this.loadRecentErrors();
      }
    } catch (error) {
      console.error('Error resolving error:', error);
      App.showNotification('Error al resolver error', 'error');
    }
  },

  async exportLogs(format) {
    try {
      const response = await axios.get(`/api/monitoring/admin/logs/export?format=${format}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `codecti-logs-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      App.showNotification('Logs exportados exitosamente', 'success');
    } catch (error) {
      console.error('Error exporting logs:', error);
      App.showNotification('Error al exportar logs', 'error');
    }
  },

  showCleanupModal(type) {
    const isLogs = type === 'logs';
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Limpiar ${isLogs ? 'Logs' : 'Errores'}</h2>
        <p class="text-gray-600 mb-4">
          Esta acción eliminará ${isLogs ? 'logs' : 'errores'} antiguos permanentemente.
        </p>
        <div class="mb-4">
          <label class="form-label">
            ${isLogs ? 'Eliminar logs más antiguos de (horas):' : 'Eliminar errores más antiguos de (días):'}
          </label>
          <input 
            type="number" 
            id="cleanupValue" 
            class="form-input" 
            value="${isLogs ? '168' : '30'}"
            min="1"
          >
        </div>
        <div class="flex justify-end space-x-3">
          <button onclick="this.closest('.fixed').remove()" class="btn btn-secondary">
            Cancelar
          </button>
          <button onclick="AdminDashboard.executeCleanup('${type}'); this.closest('.fixed').remove()" class="btn btn-danger">
            Confirmar Limpieza
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async executeCleanup(type) {
    try {
      const value = document.getElementById('cleanupValue')?.value;
      const param = type === 'logs' ? 'hours' : 'days';
      
      const response = await axios.delete(`/api/monitoring/admin/${type}/cleanup?${param}=${value}`);
      if (response.data.success) {
        App.showNotification(response.data.message, 'success');
        if (type === 'logs') {
          this.loadRecentLogs();
        } else {
          this.loadRecentErrors();
        }
      }
    } catch (error) {
      console.error(`Error cleaning up ${type}:`, error);
      App.showNotification(`Error al limpiar ${type}`, 'error');
    }
  },

  async generateTestLoad() {
    try {
      const response = await axios.post('/api/monitoring/admin/test-load');
      if (response.data.success) {
        App.showNotification('Datos de prueba generados exitosamente', 'success');
        setTimeout(() => {
          this.loadMetrics();
          this.loadRecentLogs();
          this.loadRecentErrors();
        }, 1000);
      }
    } catch (error) {
      console.error('Error generating test load:', error);
      App.showNotification('Error al generar datos de prueba', 'error');
    }
  },

  async forceHealthCheck() {
    try {
      const response = await axios.post('/api/monitoring/admin/health-check');
      if (response.data.success) {
        App.showNotification('Health check ejecutado exitosamente', 'success');
        this.loadSystemStatus();
      }
    } catch (error) {
      console.error('Error forcing health check:', error);
      App.showNotification('Error al ejecutar health check', 'error');
    }
  },

  startAutoRefresh() {
    this.refreshInterval = setInterval(() => {
      this.loadSystemStatus();
      this.loadMetrics();
      this.loadRecentLogs();
      this.loadRecentErrors();
    }, this.refreshRate);
  },

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  },

  toggleAutoRefresh() {
    const button = document.getElementById('toggleAutoRefresh');
    if (this.refreshInterval) {
      this.stopAutoRefresh();
      button.innerHTML = '<i class="fas fa-play mr-1"></i> Iniciar Auto-refresh';
      button.classList.remove('btn-danger');
      button.classList.add('btn-success');
      App.showNotification('Auto-refresh desactivado', 'info');
    } else {
      this.startAutoRefresh();
      button.innerHTML = '<i class="fas fa-pause mr-1"></i> Pausar Auto-refresh';
      button.classList.remove('btn-success');
      button.classList.add('btn-danger');
      App.showNotification('Auto-refresh activado', 'info');
    }
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // User Management Functions
  async loadUsers() {
    try {
      const search = document.getElementById('userSearch')?.value || '';
      const role = document.getElementById('roleFilter')?.value || '';
      const status = document.getElementById('statusFilter')?.value || '';
      
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (role) params.append('role', role);
      if (status) params.append('status', status);
      
      const response = await this.makeAuthenticatedRequest('GET', `/api/users?${params}`);
      if (response.data.success) {
        this.renderUsers(response.data.users, response.data.total);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      App.showNotification('Error al cargar usuarios', 'error');
    }
  },

  renderUsers(users, total) {
    const container = document.getElementById('usersContainer');
    if (!container) return;

    container.innerHTML = `
      <div class="card p-6">
        <div class="flex justify-between items-center mb-6">
          <h2 class="text-xl font-semibold">
            Gestión de Usuarios 
            <span class="text-sm font-normal text-gray-500">(${total} usuarios)</span>
          </h2>
          <button onclick="AdminDashboard.showCreateUserModal()" class="btn btn-primary">
            <i class="fas fa-plus mr-2"></i>
            Crear Usuario
          </button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label class="form-label">Buscar</label>
            <input 
              type="text" 
              id="userSearch" 
              placeholder="Nombre, email o institución..." 
              class="form-input"
            >
          </div>
          <div>
            <label class="form-label">Rol</label>
            <select id="roleFilter" class="form-input">
              <option value="">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="collaborator">Colaborador</option>
              <option value="researcher">Investigador</option>
            </select>
          </div>
          <div>
            <label class="form-label">Estado</label>
            <select id="statusFilter" class="form-input">
              <option value="">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
        </div>

        <!-- Users Table -->
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              ${users.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    No se encontraron usuarios
                  </td>
                </tr>
              ` : users.map(user => `
                <tr class="hover:bg-gray-50">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="flex-shrink-0 h-10 w-10">
                        <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <i class="fas fa-user text-gray-500"></i>
                        </div>
                      </div>
                      <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${this.escapeHtml(user.name)}</div>
                        <div class="text-sm text-gray-500">${this.escapeHtml(user.email)}</div>
                        <div class="text-xs text-gray-400">${this.escapeHtml(user.institution || 'Sin institución')}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'collaborator' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }">
                      ${
                        user.role === 'admin' ? 'Administrador' :
                        user.role === 'collaborator' ? 'Colaborador' :
                        'Investigador'
                      }
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                      ${user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div class="flex justify-end space-x-2">
                      <button 
                        onclick="AdminDashboard.showEditUserModal(${user.id})" 
                        class="text-blue-600 hover:text-blue-800"
                        title="Editar usuario"
                      >
                        <i class="fas fa-edit"></i>
                      </button>
                      <button 
                        onclick="AdminDashboard.showResetPasswordModal(${user.id})" 
                        class="text-yellow-600 hover:text-yellow-800"
                        title="Restablecer contraseña"
                      >
                        <i class="fas fa-key"></i>
                      </button>
                      ${user.is_active ? `
                        <button 
                          onclick="AdminDashboard.confirmDeactivateUser(${user.id})" 
                          class="text-red-600 hover:text-red-800"
                          title="Desactivar usuario"
                        >
                          <i class="fas fa-ban"></i>
                        </button>
                      ` : `
                        <button 
                          onclick="AdminDashboard.activateUser(${user.id})" 
                          class="text-green-600 hover:text-green-800"
                          title="Activar usuario"
                        >
                          <i class="fas fa-check"></i>
                        </button>
                      `}
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Setup filter event listeners
    document.getElementById('userSearch')?.addEventListener('input', 
      this.debounce(() => this.loadUsers(), 500)
    );
    document.getElementById('roleFilter')?.addEventListener('change', () => this.loadUsers());
    document.getElementById('statusFilter')?.addEventListener('change', () => this.loadUsers());
  },

  showCreateUserModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Crear Nuevo Usuario</h2>
        <form id="createUserForm">
          <div class="space-y-4">
            <div>
              <label class="form-label">Nombre Completo *</label>
              <input type="text" id="createName" class="form-input" required>
            </div>
            <div>
              <label class="form-label">Correo Electrónico *</label>
              <input type="email" id="createEmail" class="form-input" required>
            </div>
            <div>
              <label class="form-label">Institución *</label>
              <input type="text" id="createInstitution" class="form-input" required>
            </div>
            <div>
              <label class="form-label">Contraseña *</label>
              <input type="password" id="createPassword" class="form-input" required minlength="6">
            </div>
            <div>
              <label class="form-label">Confirmar Contraseña *</label>
              <input type="password" id="createConfirmPassword" class="form-input" required minlength="6">
            </div>
            <div>
              <label class="form-label">Rol *</label>
              <select id="createRole" class="form-input" required>
                <option value="">Seleccionar rol</option>
                <option value="researcher">Investigador</option>
                <option value="collaborator">Colaborador</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="this.closest('.fixed').remove()" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('createUserForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.createUser();
    });
  },

  async createUser() {
    try {
      const name = document.getElementById('createName').value;
      const email = document.getElementById('createEmail').value;
      const institution = document.getElementById('createInstitution').value;
      const password = document.getElementById('createPassword').value;
      const confirmPassword = document.getElementById('createConfirmPassword').value;
      const role = document.getElementById('createRole').value;

      if (password !== confirmPassword) {
        App.showNotification('Las contraseñas no coinciden', 'error');
        return;
      }

      const response = await axios.post('/api/users', {
        name,
        email,
        institution,
        password,
        role
      });

      if (response.data.success) {
        App.showNotification('Usuario creado exitosamente', 'success');
        document.querySelector('.fixed').remove();
        this.loadUsers();
      }
    } catch (error) {
      console.error('Error creating user:', error);
      App.showNotification(
        error.response?.data?.message || 'Error al crear usuario',
        'error'
      );
    }
  },

  async showEditUserModal(userId) {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      if (!response.data.success) {
        App.showNotification('Error al cargar datos del usuario', 'error');
        return;
      }

      const user = response.data.user;
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
      modal.innerHTML = `
        <div class="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
          <h2 class="text-xl font-bold mb-4">Editar Usuario</h2>
          <form id="editUserForm">
            <div class="space-y-4">
              <div>
                <label class="form-label">Nombre Completo *</label>
                <input type="text" id="editName" class="form-input" value="${this.escapeHtml(user.name)}" required>
              </div>
              <div>
                <label class="form-label">Correo Electrónico *</label>
                <input type="email" id="editEmail" class="form-input" value="${this.escapeHtml(user.email)}" required>
              </div>
              <div>
                <label class="form-label">Institución *</label>
                <input type="text" id="editInstitution" class="form-input" value="${this.escapeHtml(user.institution || '')}" required>
              </div>
              <div>
                <label class="form-label">Rol *</label>
                <select id="editRole" class="form-input" required>
                  <option value="researcher" ${user.role === 'researcher' ? 'selected' : ''}>Investigador</option>
                  <option value="collaborator" ${user.role === 'collaborator' ? 'selected' : ''}>Colaborador</option>
                  <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Administrador</option>
                </select>
              </div>
              <div>
                <label class="checkbox-label">
                  <input type="checkbox" id="editIsActive" ${user.is_active ? 'checked' : ''}>
                  <span class="checkbox-text">Usuario activo</span>
                </label>
              </div>
            </div>
            <div class="flex justify-end space-x-3 mt-6">
              <button type="button" onclick="this.closest('.fixed').remove()" class="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" class="btn btn-primary">
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('editUserForm').addEventListener('submit', (e) => {
        e.preventDefault();
        this.updateUser(userId);
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      App.showNotification('Error al cargar datos del usuario', 'error');
    }
  },

  async updateUser(userId) {
    try {
      const name = document.getElementById('editName').value;
      const email = document.getElementById('editEmail').value;
      const institution = document.getElementById('editInstitution').value;
      const role = document.getElementById('editRole').value;
      const is_active = document.getElementById('editIsActive').checked;

      const response = await axios.put(`/api/users/${userId}`, {
        name,
        email,
        institution,
        role,
        is_active
      });

      if (response.data.success) {
        App.showNotification('Usuario actualizado exitosamente', 'success');
        document.querySelector('.fixed').remove();
        this.loadUsers();
      }
    } catch (error) {
      console.error('Error updating user:', error);
      App.showNotification(
        error.response?.data?.message || 'Error al actualizar usuario',
        'error'
      );
    }
  },

  showResetPasswordModal(userId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Restablecer Contraseña</h2>
        <form id="resetPasswordForm">
          <div class="space-y-4">
            <div>
              <label class="form-label">Nueva Contraseña *</label>
              <input type="password" id="newPassword" class="form-input" required minlength="6">
            </div>
            <div>
              <label class="form-label">Confirmar Nueva Contraseña *</label>
              <input type="password" id="confirmNewPassword" class="form-input" required minlength="6">
            </div>
          </div>
          <div class="flex justify-end space-x-3 mt-6">
            <button type="button" onclick="this.closest('.fixed').remove()" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Restablecer Contraseña
            </button>
          </div>
        </form>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('resetPasswordForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.resetUserPassword(userId);
    });
  },

  async resetUserPassword(userId) {
    try {
      const newPassword = document.getElementById('newPassword').value;
      const confirmNewPassword = document.getElementById('confirmNewPassword').value;

      if (newPassword !== confirmNewPassword) {
        App.showNotification('Las contraseñas no coinciden', 'error');
        return;
      }

      const response = await axios.post(`/api/users/${userId}/reset-password`, {
        new_password: newPassword
      });

      if (response.data.success) {
        App.showNotification('Contraseña restablecida exitosamente', 'success');
        document.querySelector('.fixed').remove();
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      App.showNotification(
        error.response?.data?.message || 'Error al restablecer contraseña',
        'error'
      );
    }
  },

  confirmDeactivateUser(userId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 class="text-xl font-bold mb-4">Confirmar Desactivación</h2>
        <p class="text-gray-600 mb-4">
          ¿Estás seguro de que deseas desactivar este usuario? 
          El usuario no podrá iniciar sesión hasta que sea reactivado.
        </p>
        <div class="flex justify-end space-x-3">
          <button onclick="this.closest('.fixed').remove()" class="btn btn-secondary">
            Cancelar
          </button>
          <button onclick="AdminDashboard.deactivateUser(${userId}); this.closest('.fixed').remove()" class="btn btn-danger">
            Desactivar Usuario
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  async deactivateUser(userId) {
    try {
      const response = await axios.delete(`/api/users/${userId}`);
      if (response.data.success) {
        App.showNotification('Usuario desactivado exitosamente', 'success');
        this.loadUsers();
      }
    } catch (error) {
      console.error('Error deactivating user:', error);
      App.showNotification(
        error.response?.data?.message || 'Error al desactivar usuario',
        'error'
      );
    }
  },

  async activateUser(userId) {
    try {
      // Activate user by updating is_active to true
      const response = await axios.put(`/api/users/${userId}`, {
        is_active: true
      });
      if (response.data.success) {
        App.showNotification('Usuario activado exitosamente', 'success');
        this.loadUsers();
      }
    } catch (error) {
      console.error('Error activating user:', error);
      App.showNotification('Error al activar usuario', 'error');
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Regresar al dashboard principal
  backToDashboard() {
    console.log('backToDashboard called');
    console.log('window.App:', typeof window.App);
    console.log('App.navigateToDashboard:', typeof window.App?.navigateToDashboard);
    
    if (typeof window.App !== 'undefined' && typeof window.App.navigateToDashboard === 'function') {
      console.log('Calling App.navigateToDashboard...');
      window.App.navigateToDashboard();
    } else {
      console.log('App.navigateToDashboard not available, using fallback...');
      // Fallback: redirigir directamente
      window.location.href = '/dashboard';
    }
  },

  // Abrir dashboard avanzado de logs del sistema
  openSystemLogsDashboard() {
    // Crear modal full-screen para el sistema de logs
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-white z-50 overflow-auto';
    modal.innerHTML = `
      <div class="min-h-screen">
        <div class="bg-gray-800 text-white p-4 flex justify-between items-center">
          <div class="flex items-center">
            <i class="fas fa-chart-line mr-2"></i>
            <h1 class="text-xl font-bold">Sistema Avanzado de Logs y Monitoreo</h1>
          </div>
          <button onclick="this.closest('.fixed').remove()" class="text-white hover:text-gray-300">
            <i class="fas fa-times text-xl"></i>
          </button>
        </div>
        <div id="systemDashboard"></div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Inicializar el sistema de dashboard si está disponible
    if (typeof SystemDashboard !== 'undefined') {
      const dashboard = new SystemDashboard();
      dashboard.render();
      dashboard.init();
    } else {
      // Cargar el script del sistema de logs si no está disponible
      const script = document.createElement('script');
      script.src = '/static/system-dashboard.js';
      script.onload = () => {
        if (typeof SystemDashboard !== 'undefined') {
          const dashboard = new SystemDashboard();
          dashboard.render();
          dashboard.init();
        } else {
          console.error('No se pudo cargar SystemDashboard');
          App.showNotification('Error al cargar el sistema de logs', 'error');
        }
      };
      script.onerror = () => {
        console.error('Error cargando system-dashboard.js');
        App.showNotification('Error al cargar el sistema de logs', 'error');
      };
      document.head.appendChild(script);
    }
  }
};