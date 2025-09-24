/**
 * HU-13: Advanced File Management System Frontend
 * Sistema completo de gestión de archivos y documentos con upload, preview, versionado
 */

class FileManager {
  constructor() {
    this.isAuthenticated = false
    this.userRole = null
    this.currentPath = '/'
    this.selectedFiles = new Set()
    this.uploadQueue = []
    this.currentView = 'grid' // 'grid' or 'list'
    this.sortBy = 'created_at'
    this.sortOrder = 'desc'
    this.filters = {
      entityType: null,
      entityId: null,
      category: null,
      accessLevel: null
    }

    this.init()
  }

  async init() {
    console.log('📁 [FILE-MANAGER] Initializing File Manager')
    
    try {
      await this.checkAuthentication()
      if (!this.isAuthenticated) {
        this.showLoginRequired()
        return
      }

      this.setupEventListeners()
      this.setupDragAndDrop()
      this.showLoadingState()
      await this.loadFileManager()
      
      console.log('✅ [FILE-MANAGER] File Manager initialized successfully')
    } catch (error) {
      console.error('❌ [FILE-MANAGER] Error initializing file manager:', error)
      this.showError('Error al inicializar el gestor de archivos')
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
        const payload = JSON.parse(atob(token.split('.')[1]))
        this.userRole = payload.role
      }
    } catch (error) {
      console.error('❌ [FILE-MANAGER] Authentication check failed:', error)
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
    // Navigation and toolbar events
    document.addEventListener('click', (e) => {
      if (e.target.id === 'uploadFilesBtn') {
        this.showUploadModal()
      }
      
      if (e.target.id === 'createFolderBtn') {
        this.showCreateFolderModal()
      }
      
      if (e.target.id === 'refreshFiles') {
        this.refreshFileList()
      }
      
      if (e.target.id === 'toggleView') {
        this.toggleView()
      }
      
      if (e.target.classList.contains('file-item')) {
        this.handleFileSelection(e.target)
      }
      
      if (e.target.classList.contains('folder-item')) {
        this.navigateToFolder(e.target.dataset.folderId)
      }
      
      if (e.target.classList.contains('file-download-btn')) {
        this.downloadFile(e.target.dataset.fileId)
      }
      
      if (e.target.classList.contains('file-preview-btn')) {
        this.previewFile(e.target.dataset.fileId)
      }
      
      if (e.target.classList.contains('file-versions-btn')) {
        this.showVersionHistory(e.target.dataset.fileId)
      }
      
      if (e.target.classList.contains('file-edit-btn')) {
        this.editFileMetadata(e.target.dataset.fileId)
      }
      
      if (e.target.classList.contains('file-delete-btn') && confirm('¿Estás seguro de eliminar este archivo?')) {
        this.deleteFile(e.target.dataset.fileId)
      }
      
      if (e.target.id === 'searchFiles') {
        this.performSearch()
      }
    })

    // Search functionality
    document.addEventListener('keypress', (e) => {
      if (e.target.id === 'fileSearchInput' && e.key === 'Enter') {
        this.performSearch()
      }
    })

    // Filter changes
    document.addEventListener('change', (e) => {
      if (e.target.classList.contains('file-filter')) {
        this.updateFilters()
        this.loadFiles()
      }
      
      if (e.target.id === 'sortBy') {
        this.sortBy = e.target.value
        this.loadFiles()
      }
      
      if (e.target.id === 'sortOrder') {
        this.sortOrder = e.target.value
        this.loadFiles()
      }
    })
  }

  setupDragAndDrop() {
    const dropZone = document.getElementById('file-manager-container')
    if (!dropZone) return

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault()
      dropZone.classList.add('drag-over')
    })

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault()
      dropZone.classList.remove('drag-over')
    })

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault()
      dropZone.classList.remove('drag-over')
      
      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        this.handleFileUpload(files)
      }
    })
  }

  showLoadingState() {
    const container = document.getElementById('file-manager-container') || document.body
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 class="text-xl font-semibold text-gray-700 mb-2">Cargando Gestor de Archivos</h2>
          <p class="text-gray-500">Inicializando sistema de documentos...</p>
        </div>
      </div>
    `
  }

  showLoginRequired() {
    const container = document.getElementById('file-manager-container') || document.body
    container.innerHTML = `
      <div class="flex items-center justify-center min-h-screen bg-gray-50">
        <div class="text-center max-w-md mx-auto p-8">
          <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i class="fas fa-lock text-red-600 text-2xl"></i>
          </div>
          <h2 class="text-xl font-semibold text-gray-800 mb-4">Autenticación Requerida</h2>
          <p class="text-gray-600 mb-6">Debes iniciar sesión para acceder al gestor de archivos.</p>
          <button onclick="window.location.href='/dashboard'" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            Ir al Dashboard
          </button>
        </div>
      </div>
    `
  }

  showError(message) {
    const container = document.getElementById('file-manager-container') || document.body
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
            <button onclick="window.location.href='/dashboard'" 
                    class="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg transition-colors">
              Volver
            </button>
          </div>
        </div>
      </div>
    `
  }

  async loadFileManager() {
    try {
      console.log('📁 [FILE-MANAGER] Loading file manager interface...')
      
      // Render main interface
      this.renderFileManager()
      
      // Load initial files
      await this.loadFiles()
      
    } catch (error) {
      console.error('❌ [FILE-MANAGER] Error loading file manager:', error)
      this.showError('Error al cargar el gestor de archivos: ' + error.message)
    }
  }

  renderFileManager() {
    const container = document.getElementById('file-manager-container') || document.body
    
    const html = `
      <!-- File Manager Interface -->
      <div class="min-h-screen bg-gray-50">
        <!-- Header -->
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex justify-between items-center py-6">
              <div class="flex items-center">
                <i class="fas fa-folder-open text-blue-600 text-2xl mr-3"></i>
                <div>
                  <h1 class="text-2xl font-bold text-gray-900">Gestor de Archivos</h1>
                  <p class="text-gray-500 text-sm">Sistema avanzado de documentos y recursos</p>
                </div>
              </div>
              
              <div class="flex items-center space-x-4">
                <button id="uploadFilesBtn" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                  <i class="fas fa-upload mr-2"></i>Subir Archivos
                </button>
                
                <button id="createFolderBtn" 
                        class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                  <i class="fas fa-folder-plus mr-2"></i>Nueva Carpeta
                </button>
                
                <button onclick="window.location.href='/admin'" 
                        class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center">
                  <i class="fas fa-arrow-left mr-2"></i>Volver
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Toolbar -->
        <div class="bg-white shadow-sm border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <!-- Search and Filters -->
              <div class="flex flex-col sm:flex-row gap-4 flex-1">
                <div class="flex-1">
                  <div class="relative">
                    <input type="text" id="fileSearchInput" 
                           placeholder="Buscar archivos, carpetas, contenido..." 
                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center">
                      <i class="fas fa-search text-gray-400"></i>
                    </div>
                    <button id="searchFiles" 
                            class="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-600 hover:text-blue-800">
                      <i class="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
                
                <select id="categoryFilter" class="file-filter px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Todas las categorías</option>
                  <option value="document">Documentos</option>
                  <option value="image">Imágenes</option>
                  <option value="video">Videos</option>
                  <option value="audio">Audio</option>
                  <option value="archive">Archivos</option>
                  <option value="other">Otros</option>
                </select>
                
                <select id="accessLevelFilter" class="file-filter px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="">Todos los niveles</option>
                  <option value="public">Público</option>
                  <option value="internal">Interno</option>
                  <option value="private">Privado</option>
                  <option value="restricted">Restringido</option>
                </select>
              </div>
              
              <!-- View Controls -->
              <div class="flex items-center gap-2">
                <select id="sortBy" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="created_at">Fecha de creación</option>
                  <option value="updated_at">Última modificación</option>
                  <option value="filename">Nombre</option>
                  <option value="file_size">Tamaño</option>
                  <option value="download_count">Descargas</option>
                </select>
                
                <select id="sortOrder" class="px-3 py-2 border border-gray-300 rounded-lg text-sm">
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
                
                <button id="toggleView" 
                        class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <i class="fas fa-th text-gray-600"></i>
                </button>
                
                <button id="refreshFiles" 
                        class="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                  <i class="fas fa-sync-alt text-gray-600"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Breadcrumb -->
        <div class="bg-white border-b">
          <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <nav id="breadcrumb" class="flex items-center text-sm text-gray-500">
              <a href="#" class="hover:text-blue-600 flex items-center">
                <i class="fas fa-home mr-1"></i>Inicio
              </a>
              <i class="fas fa-chevron-right mx-2 text-gray-400"></i>
              <span class="text-gray-900">Todos los archivos</span>
            </nav>
          </div>
        </div>

        <!-- Main Content -->
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          
          <!-- Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div id="stats-total-files" class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-blue-600 text-sm font-medium uppercase tracking-wide">Total Archivos</p>
                  <p class="text-2xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-file text-blue-600 text-xl"></i>
                </div>
              </div>
            </div>
            
            <div id="stats-total-size" class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-green-600 text-sm font-medium uppercase tracking-wide">Almacenamiento</p>
                  <p class="text-2xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-hdd text-green-600 text-xl"></i>
                </div>
              </div>
            </div>
            
            <div id="stats-downloads" class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-purple-600 text-sm font-medium uppercase tracking-wide">Descargas</p>
                  <p class="text-2xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-download text-purple-600 text-xl"></i>
                </div>
              </div>
            </div>
            
            <div id="stats-folders" class="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-orange-600 text-sm font-medium uppercase tracking-wide">Carpetas</p>
                  <p class="text-2xl font-bold text-gray-900 mt-2">--</p>
                </div>
                <div class="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i class="fas fa-folder text-orange-600 text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          <!-- File List -->
          <div class="bg-white rounded-xl shadow-lg">
            <div class="p-6 border-b border-gray-200">
              <h3 class="text-lg font-semibold text-gray-800">Archivos y Carpetas</h3>
            </div>
            
            <div id="file-list-container" class="p-6">
              <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
                <p class="text-gray-500">Cargando archivos...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    
    container.innerHTML = html
  }

  async loadFiles() {
    try {
      console.log('📂 [FILE-MANAGER] Loading files...')
      
      // Build query parameters
      const params = new URLSearchParams()
      if (this.filters.entityType) params.append('entity_type', this.filters.entityType)
      if (this.filters.entityId) params.append('entity_id', this.filters.entityId.toString())
      if (this.filters.category) params.append('category', this.filters.category)
      if (this.filters.accessLevel) params.append('access_level', this.filters.accessLevel)

      const response = await this.makeAuthenticatedRequest(`/api/files?${params.toString()}`)
      
      if (response.success) {
        this.renderFileList(response.data)
        this.updateStatistics(response.data)
      } else {
        throw new Error(response.message || 'Error loading files')
      }
      
    } catch (error) {
      console.error('❌ [FILE-MANAGER] Error loading files:', error)
      this.showNotification('Error al cargar archivos: ' + error.message, 'error')
    }
  }

  renderFileList(data) {
    const container = document.getElementById('file-list-container')
    if (!container) return

    if (data.files.length === 0 && data.folders.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12">
          <i class="fas fa-folder-open text-gray-300 text-6xl mb-4"></i>
          <h3 class="text-lg font-semibold text-gray-600 mb-2">No hay archivos</h3>
          <p class="text-gray-500 mb-6">Esta carpeta está vacía. Sube algunos archivos para comenzar.</p>
          <button onclick="document.getElementById('uploadFilesBtn').click()" 
                  class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
            <i class="fas fa-upload mr-2"></i>Subir Archivos
          </button>
        </div>
      `
      return
    }

    const foldersHtml = data.folders.map(folder => this.renderFolderItem(folder)).join('')
    const filesHtml = data.files.map(file => this.renderFileItem(file)).join('')

    container.innerHTML = `
      <div class="space-y-6">
        ${data.folders.length > 0 ? `
          <div>
            <h4 class="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              <i class="fas fa-folder mr-2"></i>Carpetas (${data.folders.length})
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              ${foldersHtml}
            </div>
          </div>
        ` : ''}
        
        ${data.files.length > 0 ? `
          <div>
            <h4 class="text-sm font-semibold text-gray-600 mb-3 flex items-center">
              <i class="fas fa-file mr-2"></i>Archivos (${data.files.length})
            </h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${filesHtml}
            </div>
          </div>
        ` : ''}
      </div>
    `
  }

  renderFolderItem(folder) {
    const colorClass = this.getFolderColorClass(folder.color)
    return `
      <div class="folder-item bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer" 
           data-folder-id="${folder.id}">
        <div class="flex items-center mb-3">
          <i class="${folder.icon} ${colorClass} text-2xl mr-3"></i>
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-gray-900 truncate">${folder.name}</h4>
            <p class="text-xs text-gray-500">${folder.file_count} archivos</p>
          </div>
        </div>
        <div class="flex items-center justify-between text-xs text-gray-500">
          <span>${this.formatFileSize(folder.total_size)}</span>
          <span class="px-2 py-1 bg-gray-100 rounded-full">${this.getAccessLevelLabel(folder.access_level)}</span>
        </div>
      </div>
    `
  }

  renderFileItem(file) {
    const iconClass = this.getFileIcon(file.mime_type, file.file_extension)
    const categoryColor = this.getCategoryColor(file.category)
    
    return `
      <div class="file-item bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow" 
           data-file-id="${file.id}">
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center flex-1 min-w-0">
            <i class="${iconClass} ${categoryColor} text-2xl mr-3"></i>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-gray-900 truncate" title="${file.title || file.filename}">
                ${file.title || file.filename}
              </h4>
              <p class="text-xs text-gray-500">${this.formatFileSize(file.file_size)}</p>
            </div>
          </div>
          
          <div class="flex items-center space-x-1 ml-2">
            <button class="file-preview-btn p-1 text-gray-400 hover:text-blue-600 transition-colors" 
                    data-file-id="${file.id}" title="Vista previa">
              <i class="fas fa-eye text-sm"></i>
            </button>
            <button class="file-download-btn p-1 text-gray-400 hover:text-green-600 transition-colors" 
                    data-file-id="${file.id}" title="Descargar">
              <i class="fas fa-download text-sm"></i>
            </button>
            ${file.can_edit ? `
              <button class="file-edit-btn p-1 text-gray-400 hover:text-yellow-600 transition-colors" 
                      data-file-id="${file.id}" title="Editar">
                <i class="fas fa-edit text-sm"></i>
              </button>
            ` : ''}
            ${file.version > 1 ? `
              <button class="file-versions-btn p-1 text-gray-400 hover:text-purple-600 transition-colors" 
                      data-file-id="${file.id}" title="Versiones">
                <i class="fas fa-history text-sm"></i>
              </button>
            ` : ''}
            ${file.can_delete ? `
              <button class="file-delete-btn p-1 text-gray-400 hover:text-red-600 transition-colors" 
                      data-file-id="${file.id}" title="Eliminar">
                <i class="fas fa-trash text-sm"></i>
              </button>
            ` : ''}
          </div>
        </div>
        
        <div class="flex items-center justify-between text-xs text-gray-500">
          <div class="flex items-center space-x-3">
            <span class="flex items-center">
              <i class="fas fa-download mr-1"></i>${file.download_count}
            </span>
            <span class="flex items-center">
              <i class="fas fa-eye mr-1"></i>${file.view_count}
            </span>
            ${file.version > 1 ? `<span class="text-purple-600">v${file.version}</span>` : ''}
          </div>
          <span class="px-2 py-1 bg-gray-100 rounded-full">${this.getAccessLevelLabel(file.access_level)}</span>
        </div>
        
        <div class="mt-2 text-xs text-gray-500">
          <div class="flex items-center justify-between">
            <span>Por ${file.uploaded_by_name}</span>
            <span>${this.formatDate(file.created_at)}</span>
          </div>
        </div>
      </div>
    `
  }

  updateStatistics(data) {
    // Update stats cards
    document.querySelector('#stats-total-files p:nth-child(2)').textContent = data.total_files.toLocaleString()
    document.querySelector('#stats-total-size p:nth-child(2)').textContent = this.formatFileSize(data.total_size)
    document.querySelector('#stats-downloads p:nth-child(2)').textContent = data.files.reduce((sum, f) => sum + f.download_count, 0).toLocaleString()
    document.querySelector('#stats-folders p:nth-child(2)').textContent = data.total_folders.toLocaleString()
  }

  // Utility functions
  getFileIcon(mimeType, extension) {
    if (mimeType.startsWith('image/')) return 'fas fa-image'
    if (mimeType.startsWith('video/')) return 'fas fa-video'
    if (mimeType.startsWith('audio/')) return 'fas fa-music'
    if (mimeType === 'application/pdf') return 'fas fa-file-pdf'
    if (mimeType.includes('word') || extension === 'doc' || extension === 'docx') return 'fas fa-file-word'
    if (mimeType.includes('excel') || extension === 'xls' || extension === 'xlsx') return 'fas fa-file-excel'
    if (mimeType.includes('powerpoint') || extension === 'ppt' || extension === 'pptx') return 'fas fa-file-powerpoint'
    if (extension === 'zip' || extension === 'rar' || extension === '7z') return 'fas fa-file-archive'
    return 'fas fa-file'
  }

  getCategoryColor(category) {
    const colors = {
      document: 'text-blue-600',
      image: 'text-green-600',
      video: 'text-red-600',
      audio: 'text-purple-600',
      archive: 'text-orange-600',
      other: 'text-gray-600'
    }
    return colors[category] || 'text-gray-600'
  }

  getFolderColorClass(color) {
    return `text-blue-600` // Default folder color
  }

  getAccessLevelLabel(level) {
    const labels = {
      public: 'Público',
      internal: 'Interno',
      private: 'Privado',
      restricted: 'Restringido'
    }
    return labels[level] || level
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  updateFilters() {
    this.filters.category = document.getElementById('categoryFilter')?.value || null
    this.filters.accessLevel = document.getElementById('accessLevelFilter')?.value || null
  }

  async refreshFileList() {
    this.showNotification('Actualizando lista de archivos...', 'info')
    await this.loadFiles()
    this.showNotification('Lista actualizada correctamente', 'success')
  }

  toggleView() {
    this.currentView = this.currentView === 'grid' ? 'list' : 'grid'
    const button = document.getElementById('toggleView')
    if (button) {
      const icon = button.querySelector('i')
      icon.className = this.currentView === 'grid' ? 'fas fa-list text-gray-600' : 'fas fa-th text-gray-600'
    }
    this.loadFiles() // Refresh with new view
  }

  async downloadFile(fileId) {
    try {
      const response = await this.makeAuthenticatedRequest(`/api/files/${fileId}/download`)
      this.showNotification('Descarga iniciada', 'success')
    } catch (error) {
      console.error('❌ [FILE-MANAGER] Error downloading file:', error)
      this.showNotification('Error al descargar archivo: ' + error.message, 'error')
    }
  }

  showUploadModal() {
    this.showNotification('Función de subida en desarrollo', 'info')
    // TODO: Implement upload modal
  }

  showCreateFolderModal() {
    this.showNotification('Función de crear carpeta en desarrollo', 'info')
    // TODO: Implement folder creation modal
  }

  async performSearch() {
    const query = document.getElementById('fileSearchInput')?.value?.trim()
    if (!query) {
      this.showNotification('Por favor ingresa un término de búsqueda', 'warning')
      return
    }

    try {
      const response = await this.makeAuthenticatedRequest(`/api/files/search?query=${encodeURIComponent(query)}`)
      if (response.success) {
        this.renderFileList({
          files: response.data.files,
          folders: [],
          total_files: response.data.total_results,
          total_folders: 0,
          total_size: response.data.files.reduce((sum, f) => sum + f.file_size, 0)
        })
        this.showNotification(`${response.data.total_results} archivos encontrados`, 'success')
      }
    } catch (error) {
      console.error('❌ [FILE-MANAGER] Error searching files:', error)
      this.showNotification('Error en la búsqueda: ' + error.message, 'error')
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
    console.log('🧹 [FILE-MANAGER] File Manager cleaned up')
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.FileManager = new FileManager()
})

// Cleanup when leaving page
window.addEventListener('beforeunload', () => {
  if (window.FileManager) {
    window.FileManager.destroy()
  }
})