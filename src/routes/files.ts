import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from '../utils/middleware'
import { 
  FileDocument, 
  FileFolder, 
  FileUploadRequest, 
  FileUploadResponse,
  FileListRequest,
  FileListResponse,
  FileUpdateRequest,
  FileVersionHistory,
  FolderCreateRequest,
  FileSearchRequest,
  FileSearchResponse,
  FileStatsResponse,
  JWTPayload 
} from '../types'

const files = new Hono()

// Enable CORS for all file routes
files.use('/*', cors())

// Apply authentication middleware - all file operations require auth
// Temporary: Mock auth for testing
files.use('/*', async (c, next) => {
  // Mock JWT payload for testing
  c.set('jwtPayload', {
    userId: 1,
    email: 'admin@codecti.choco.gov.co',
    role: 'admin'
  })
  await next()
})

// Mock file storage (in production, this would be Cloudflare R2 + D1)
const mockFiles: FileDocument[] = [
  {
    id: 'file-001',
    filename: 'proyecto_biodiversidad_2024.pdf',
    original_filename: 'Proyecto Biodiversidad Chocó 2024.pdf',
    file_path: '/projects/1/documents/proyecto_biodiversidad_2024.pdf',
    file_url: 'https://r2.codecti.example.com/projects/1/documents/proyecto_biodiversidad_2024.pdf',
    file_size: 2456789,
    mime_type: 'application/pdf',
    file_extension: 'pdf',
    title: 'Proyecto de Biodiversidad Chocó 2024',
    description: 'Documento técnico completo del proyecto de investigación de biodiversidad acuática',
    tags: ['biodiversidad', 'investigación', 'chocó', 'proyecto'],
    category: 'document',
    folder_path: '/projects/1/documents',
    is_public: false,
    access_level: 'internal',
    entity_type: 'project',
    entity_id: 1,
    parent_folder_id: 'folder-proj-1',
    version: 3,
    is_current_version: true,
    previous_version_id: 'file-001-v2',
    uploaded_by: 2,
    uploaded_by_name: 'María Elena Rodríguez',
    uploaded_by_email: 'investigador1@codecti.choco.gov.co',
    download_count: 45,
    view_count: 127,
    last_accessed_at: '2025-09-08T14:30:00Z',
    status: 'active',
    processing_status: 'completed',
    created_at: '2024-03-15T10:00:00Z',
    updated_at: '2025-09-01T16:45:00Z',
    checksum: 'sha256:a1b2c3d4e5f6...',
    thumbnail_url: 'https://r2.codecti.example.com/thumbnails/file-001-thumb.png',
    preview_url: 'https://r2.codecti.example.com/previews/file-001-preview.pdf',
    can_edit: true,
    can_delete: true,
    can_share: true
  },
  {
    id: 'file-002',
    filename: 'atlas_especies_acuaticas.pdf',
    original_filename: 'Atlas Especies Acuáticas Chocó.pdf',
    file_path: '/resources/1/documents/atlas_especies_acuaticas.pdf',
    file_url: 'https://r2.codecti.example.com/resources/1/documents/atlas_especies_acuaticas.pdf',
    file_size: 15678234,
    mime_type: 'application/pdf',
    file_extension: 'pdf',
    title: 'Atlas de Especies Acuáticas del Chocó',
    description: 'Documento científico con catálogo completo de especies acuáticas endémicas del Chocó',
    tags: ['atlas', 'especies', 'acuáticas', 'chocó', 'biodiversidad'],
    category: 'document',
    folder_path: '/resources/1/documents',
    is_public: true,
    access_level: 'public',
    entity_type: 'resource',
    entity_id: 1,
    parent_folder_id: 'folder-res-1',
    version: 1,
    is_current_version: true,
    uploaded_by: 1,
    uploaded_by_name: 'Administrador CODECTI',
    uploaded_by_email: 'admin@codecti.choco.gov.co',
    download_count: 234,
    view_count: 567,
    last_accessed_at: '2025-09-10T08:15:00Z',
    status: 'active',
    processing_status: 'completed',
    created_at: '2024-06-20T09:30:00Z',
    updated_at: '2024-06-20T09:30:00Z',
    checksum: 'sha256:f6e5d4c3b2a1...',
    thumbnail_url: 'https://r2.codecti.example.com/thumbnails/file-002-thumb.png',
    preview_url: 'https://r2.codecti.example.com/previews/file-002-preview.pdf',
    can_edit: false,
    can_delete: false,
    can_share: true
  },
  {
    id: 'file-003',
    filename: 'congreso_biodiversidad_2025.jpg',
    original_filename: 'Congreso Biodiversidad Chocó 2025 - Banner.jpg',
    file_path: '/events/1/images/congreso_biodiversidad_2025.jpg',
    file_url: 'https://r2.codecti.example.com/events/1/images/congreso_biodiversidad_2025.jpg',
    file_size: 892145,
    mime_type: 'image/jpeg',
    file_extension: 'jpg',
    title: 'Banner Congreso de Biodiversidad 2025',
    description: 'Imagen promocional del evento científico más importante del Chocó',
    tags: ['congreso', 'biodiversidad', '2025', 'evento', 'banner'],
    category: 'image',
    folder_path: '/events/1/images',
    is_public: true,
    access_level: 'public',
    entity_type: 'event',
    entity_id: 1,
    parent_folder_id: 'folder-evt-1',
    version: 2,
    is_current_version: true,
    previous_version_id: 'file-003-v1',
    uploaded_by: 3,
    uploaded_by_name: 'Carlos Alberto Mosquera',
    uploaded_by_email: 'investigador2@codecti.choco.gov.co',
    download_count: 89,
    view_count: 345,
    last_accessed_at: '2025-09-09T18:20:00Z',
    status: 'active',
    processing_status: 'completed',
    created_at: '2024-08-10T14:00:00Z',
    updated_at: '2025-09-05T11:30:00Z',
    checksum: 'sha256:9876543210ab...',
    thumbnail_url: 'https://r2.codecti.example.com/thumbnails/file-003-thumb.jpg',
    can_edit: true,
    can_delete: true,
    can_share: true
  }
]

const mockFolders: FileFolder[] = [
  {
    id: 'folder-proj-1',
    name: 'Documentos del Proyecto',
    path: '/projects/1/documents',
    parent_id: 'folder-proj-root',
    description: 'Documentos técnicos y científicos del proyecto de biodiversidad',
    color: '#3B82F6',
    icon: 'fas fa-folder',
    entity_type: 'project',
    entity_id: 1,
    is_public: false,
    access_level: 'internal',
    created_by: 2,
    created_by_name: 'María Elena Rodríguez',
    file_count: 12,
    folder_count: 3,
    total_size: 45672890,
    status: 'active',
    created_at: '2024-03-01T08:00:00Z',
    updated_at: '2025-09-01T16:45:00Z'
  },
  {
    id: 'folder-res-1',
    name: 'Recursos Científicos',
    path: '/resources/1/documents',
    description: 'Documentos y recursos científicos públicos',
    color: '#10B981',
    icon: 'fas fa-book',
    entity_type: 'resource',
    entity_id: 1,
    is_public: true,
    access_level: 'public',
    created_by: 1,
    created_by_name: 'Administrador CODECTI',
    file_count: 8,
    folder_count: 2,
    total_size: 123456789,
    status: 'active',
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2024-06-20T09:30:00Z'
  },
  {
    id: 'folder-evt-1',
    name: 'Materiales del Evento',
    path: '/events/1/images',
    description: 'Imágenes, banners y materiales promocionales',
    color: '#8B5CF6',
    icon: 'fas fa-images',
    entity_type: 'event',
    entity_id: 1,
    is_public: true,
    access_level: 'public',
    created_by: 3,
    created_by_name: 'Carlos Alberto Mosquera',
    file_count: 15,
    folder_count: 1,
    total_size: 67890123,
    status: 'active',
    created_at: '2024-08-01T12:00:00Z',
    updated_at: '2025-09-05T11:30:00Z'
  }
]

/**
 * POST /api/files/upload
 * Upload a new file to Cloudflare R2 storage
 */
files.post('/upload', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    console.log('📤 [FILES] File upload initiated by:', payload.email)

    // In a real implementation, this would:
    // 1. Parse multipart/form-data
    // 2. Validate file type and size
    // 3. Upload to Cloudflare R2
    // 4. Store metadata in D1 database
    // 5. Generate thumbnails/previews
    // 6. Return file metadata

    // Mock implementation for demonstration
    const mockUploadedFile: FileDocument = {
      id: `file-${Date.now()}`,
      filename: `uploaded_file_${Date.now()}.pdf`,
      original_filename: 'Nuevo Documento.pdf',
      file_path: `/uploads/${payload.userId}/uploaded_file_${Date.now()}.pdf`,
      file_url: `https://r2.codecti.example.com/uploads/${payload.userId}/uploaded_file_${Date.now()}.pdf`,
      file_size: 1024000,
      mime_type: 'application/pdf',
      file_extension: 'pdf',
      title: 'Nuevo Documento Subido',
      description: 'Documento subido por el usuario',
      tags: ['nuevo', 'upload'],
      category: 'document',
      folder_path: `/uploads/${payload.userId}`,
      is_public: false,
      access_level: 'private',
      entity_type: 'user',
      entity_id: payload.userId,
      version: 1,
      is_current_version: true,
      uploaded_by: payload.userId,
      uploaded_by_name: payload.email,
      uploaded_by_email: payload.email,
      download_count: 0,
      view_count: 0,
      status: 'active',
      processing_status: 'completed',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      checksum: 'sha256:mock_checksum',
      can_edit: true,
      can_delete: true,
      can_share: true
    }

    const response: FileUploadResponse = {
      success: true,
      data: mockUploadedFile,
      message: 'Archivo subido exitosamente',
      upload_progress: 100
    }

    console.log('✅ [FILES] File uploaded successfully:', mockUploadedFile.filename)
    return c.json(response)
  } catch (error) {
    console.error('❌ [FILES] Error uploading file:', error)
    return c.json({
      success: false,
      message: 'Error al subir el archivo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files
 * List files and folders with filtering and pagination
 */
files.get('/', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    console.log('📂 [FILES] File list requested by:', payload.email)

    // Parse query parameters
    const entityType = c.req.query('entity_type')
    const entityId = c.req.query('entity_id') ? parseInt(c.req.query('entity_id')!) : undefined
    const folderPath = c.req.query('folder_path')
    const category = c.req.query('category')
    const search = c.req.query('search')
    const limit = parseInt(c.req.query('limit') || '20')
    const offset = parseInt(c.req.query('offset') || '0')

    // Filter files based on access permissions and query parameters
    let filteredFiles = mockFiles.filter(file => {
      // Access control check
      if (file.access_level === 'private' && file.uploaded_by !== payload.userId) {
        return false
      }
      if (file.access_level === 'restricted' && payload.role !== 'admin') {
        return false
      }

      // Apply filters
      if (entityType && file.entity_type !== entityType) return false
      if (entityId && file.entity_id !== entityId) return false
      if (folderPath && file.folder_path !== folderPath) return false
      if (category && file.category !== category) return false
      if (search && !file.filename.toLowerCase().includes(search.toLowerCase()) &&
          !file.title?.toLowerCase().includes(search.toLowerCase())) return false

      return file.status === 'active'
    })

    // Filter folders
    let filteredFolders = mockFolders.filter(folder => {
      // Access control check
      if (folder.access_level === 'private' && folder.created_by !== payload.userId) {
        return false
      }
      if (folder.access_level === 'restricted' && payload.role !== 'admin') {
        return false
      }

      // Apply filters
      if (entityType && folder.entity_type !== entityType) return false
      if (entityId && folder.entity_id !== entityId) return false
      if (folderPath && !folder.path.startsWith(folderPath)) return false

      return folder.status === 'active'
    })

    // Pagination
    const totalFiles = filteredFiles.length
    const totalFolders = filteredFolders.length
    const paginatedFiles = filteredFiles.slice(offset, offset + limit)

    // Calculate total size
    const totalSize = filteredFiles.reduce((sum, file) => sum + file.file_size, 0)

    const response: FileListResponse = {
      success: true,
      data: {
        files: paginatedFiles,
        folders: filteredFolders,
        total_files: totalFiles,
        total_folders: totalFolders,
        total_size: totalSize
      },
      pagination: {
        limit,
        offset,
        total: totalFiles,
        pages: Math.ceil(totalFiles / limit),
        current_page: Math.floor(offset / limit) + 1,
        has_next: offset + limit < totalFiles,
        has_prev: offset > 0
      },
      message: `${totalFiles} archivos y ${totalFolders} carpetas encontrados`
    }

    console.log(`✅ [FILES] Returned ${paginatedFiles.length} files and ${filteredFolders.length} folders`)
    return c.json(response)
  } catch (error) {
    console.error('❌ [FILES] Error listing files:', error)
    return c.json({
      success: false,
      message: 'Error al listar archivos',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files/search
 * Search files with advanced filters
 */
files.get('/search', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const query = c.req.query('query') || ''

    console.log('🔍 [FILES] File search requested:', query, 'by:', payload.email)

    if (!query.trim()) {
      return c.json({
        success: false,
        message: 'Query de búsqueda requerido'
      }, 400)
    }

    const startTime = Date.now()

    // Search in files
    const searchResults = mockFiles.filter(file => {
      // Access control
      if (file.access_level === 'private' && file.uploaded_by !== payload.userId) return false
      if (file.access_level === 'restricted' && payload.role !== 'admin') return false
      if (file.status !== 'active') return false

      // Search in filename, title, description, tags
      const searchTerm = query.toLowerCase()
      return (
        file.filename.toLowerCase().includes(searchTerm) ||
        file.title?.toLowerCase().includes(searchTerm) ||
        file.description?.toLowerCase().includes(searchTerm) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        file.uploaded_by_name.toLowerCase().includes(searchTerm)
      )
    })

    const searchTime = Date.now() - startTime

    const response: FileSearchResponse = {
      success: true,
      data: {
        files: searchResults,
        total_results: searchResults.length,
        search_time_ms: searchTime,
        suggestions: ['biodiversidad', 'proyecto', 'atlas', 'congreso', 'chocó']
      },
      pagination: {
        limit: 50,
        offset: 0,
        total: searchResults.length,
        pages: 1
      },
      message: `${searchResults.length} archivos encontrados en ${searchTime}ms`
    }

    console.log('✅ [FILES] Search completed:', searchResults.length, 'results in', searchTime, 'ms')
    return c.json(response)
  } catch (error) {
    console.error('❌ [FILES] Error searching files:', error)
    return c.json({
      success: false,
      message: 'Error en la búsqueda de archivos',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files/stats
 * Get file system statistics
 */
files.get('/stats', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    console.log('📊 [FILES] File statistics requested by:', payload.email)

    // Filter accessible files
    const accessibleFiles = mockFiles.filter(file => {
      if (file.access_level === 'private' && file.uploaded_by !== payload.userId) return false
      if (file.access_level === 'restricted' && payload.role !== 'admin') return false
      return file.status === 'active'
    })

    // Calculate statistics
    const totalSize = accessibleFiles.reduce((sum, file) => sum + file.file_size, 0)
    const totalDownloads = accessibleFiles.reduce((sum, file) => sum + file.download_count, 0)
    const totalViews = accessibleFiles.reduce((sum, file) => sum + file.view_count, 0)

    const filesByCategory: Record<string, number> = {}
    const filesByExtension: Record<string, number> = {}
    const filesByAccessLevel: Record<string, number> = {}
    const storageUsageByEntity: Record<string, number> = {}

    accessibleFiles.forEach(file => {
      filesByCategory[file.category] = (filesByCategory[file.category] || 0) + 1
      filesByExtension[file.file_extension] = (filesByExtension[file.file_extension] || 0) + 1
      filesByAccessLevel[file.access_level] = (filesByAccessLevel[file.access_level] || 0) + 1
      storageUsageByEntity[file.entity_type] = (storageUsageByEntity[file.entity_type] || 0) + file.file_size
    })

    const stats = {
      total_files: accessibleFiles.length,
      total_folders: mockFolders.length,
      total_size: totalSize,
      total_downloads: totalDownloads,
      total_views: totalViews,
      files_by_category: filesByCategory,
      files_by_extension: filesByExtension,
      files_by_access_level: filesByAccessLevel,
      storage_usage_by_entity: storageUsageByEntity,
      top_downloaded: accessibleFiles
        .sort((a, b) => b.download_count - a.download_count)
        .slice(0, 5),
      recent_uploads: accessibleFiles
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
      large_files: accessibleFiles
        .sort((a, b) => b.file_size - a.file_size)
        .slice(0, 5)
    }

    const response: FileStatsResponse = {
      success: true,
      data: stats,
      generated_at: new Date().toISOString(),
      message: 'Estadísticas del sistema de archivos generadas exitosamente'
    }

    console.log('✅ [FILES] Statistics generated:', accessibleFiles.length, 'files analyzed')
    return c.json(response)
  } catch (error) {
    console.error('❌ [FILES] Error generating file statistics:', error)
    return c.json({
      success: false,
      message: 'Error al generar estadísticas de archivos',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files/:id
 * Get file details and metadata
 */
files.get('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const fileId = c.req.param('id')
    
    console.log('📄 [FILES] File details requested:', fileId, 'by:', payload.email)

    const file = mockFiles.find(f => f.id === fileId)
    if (!file) {
      return c.json({
        success: false,
        message: 'Archivo no encontrado'
      }, 404)
    }

    // Access control check
    if (file.access_level === 'private' && file.uploaded_by !== payload.userId) {
      return c.json({
        success: false,
        message: 'No tienes permisos para acceder a este archivo'
      }, 403)
    }

    if (file.access_level === 'restricted' && payload.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Acceso restringido - se requieren permisos de administrador'
      }, 403)
    }

    // Increment view count
    file.view_count += 1
    file.last_accessed_at = new Date().toISOString()

    console.log('✅ [FILES] File details returned:', file.filename)
    return c.json({
      success: true,
      data: file,
      message: 'Detalles del archivo obtenidos exitosamente'
    })
  } catch (error) {
    console.error('❌ [FILES] Error getting file details:', error)
    return c.json({
      success: false,
      message: 'Error al obtener detalles del archivo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * PUT /api/files/:id
 * Update file metadata
 */
files.put('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const fileId = c.req.param('id')
    const updateData = await c.req.json() as FileUpdateRequest

    console.log('✏️ [FILES] File update requested:', fileId, 'by:', payload.email)

    const file = mockFiles.find(f => f.id === fileId)
    if (!file) {
      return c.json({
        success: false,
        message: 'Archivo no encontrado'
      }, 404)
    }

    // Permission check
    if (file.uploaded_by !== payload.userId && payload.role !== 'admin') {
      return c.json({
        success: false,
        message: 'No tienes permisos para editar este archivo'
      }, 403)
    }

    // Update file metadata
    if (updateData.title !== undefined) file.title = updateData.title
    if (updateData.description !== undefined) file.description = updateData.description
    if (updateData.tags !== undefined) file.tags = updateData.tags
    if (updateData.category !== undefined) file.category = updateData.category
    if (updateData.folder_path !== undefined) file.folder_path = updateData.folder_path
    if (updateData.is_public !== undefined) file.is_public = updateData.is_public
    if (updateData.access_level !== undefined) file.access_level = updateData.access_level
    if (updateData.status !== undefined) file.status = updateData.status

    file.updated_at = new Date().toISOString()

    console.log('✅ [FILES] File updated successfully:', file.filename)
    return c.json({
      success: true,
      data: file,
      message: 'Archivo actualizado exitosamente'
    })
  } catch (error) {
    console.error('❌ [FILES] Error updating file:', error)
    return c.json({
      success: false,
      message: 'Error al actualizar archivo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * DELETE /api/files/:id
 * Delete a file (soft delete)
 */
files.delete('/:id', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const fileId = c.req.param('id')

    console.log('🗑️ [FILES] File deletion requested:', fileId, 'by:', payload.email)

    const file = mockFiles.find(f => f.id === fileId)
    if (!file) {
      return c.json({
        success: false,
        message: 'Archivo no encontrado'
      }, 404)
    }

    // Permission check
    if (file.uploaded_by !== payload.userId && payload.role !== 'admin') {
      return c.json({
        success: false,
        message: 'No tienes permisos para eliminar este archivo'
      }, 403)
    }

    // Soft delete
    file.status = 'deleted'
    file.deleted_at = new Date().toISOString()
    file.updated_at = new Date().toISOString()

    console.log('✅ [FILES] File deleted successfully:', file.filename)
    return c.json({
      success: true,
      message: 'Archivo eliminado exitosamente'
    })
  } catch (error) {
    console.error('❌ [FILES] Error deleting file:', error)
    return c.json({
      success: false,
      message: 'Error al eliminar archivo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files/:id/download
 * Download a file
 */
files.get('/:id/download', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const fileId = c.req.param('id')

    console.log('⬇️ [FILES] File download requested:', fileId, 'by:', payload.email)

    const file = mockFiles.find(f => f.id === fileId)
    if (!file) {
      return c.json({
        success: false,
        message: 'Archivo no encontrado'
      }, 404)
    }

    // Access control check
    if (file.access_level === 'private' && file.uploaded_by !== payload.userId) {
      return c.json({
        success: false,
        message: 'No tienes permisos para descargar este archivo'
      }, 403)
    }

    // Increment download count
    file.download_count += 1
    file.last_accessed_at = new Date().toISOString()

    // In production, this would redirect to the Cloudflare R2 URL or stream the file
    console.log('✅ [FILES] File download initiated:', file.filename)
    return c.redirect(file.file_url)
  } catch (error) {
    console.error('❌ [FILES] Error downloading file:', error)
    return c.json({
      success: false,
      message: 'Error al descargar archivo',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files/:id/versions
 * Get file version history
 */
files.get('/:id/versions', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const fileId = c.req.param('id')

    console.log('📜 [FILES] File version history requested:', fileId, 'by:', payload.email)

    const file = mockFiles.find(f => f.id === fileId)
    if (!file) {
      return c.json({
        success: false,
        message: 'Archivo no encontrado'
      }, 404)
    }

    // Mock version history
    const mockVersions = [
      {
        id: `${fileId}-v3`,
        version: 3,
        filename: file.filename,
        file_size: file.file_size,
        checksum: file.checksum || 'sha256:current',
        uploaded_by: file.uploaded_by,
        uploaded_by_name: file.uploaded_by_name,
        created_at: file.updated_at,
        change_notes: 'Actualización de contenido y correcciones menores',
        is_current: true
      },
      {
        id: `${fileId}-v2`,
        version: 2,
        filename: file.filename.replace('.', '_v2.'),
        file_size: file.file_size - 50000,
        checksum: 'sha256:version2_hash',
        uploaded_by: file.uploaded_by,
        uploaded_by_name: file.uploaded_by_name,
        created_at: '2025-08-15T10:30:00Z',
        change_notes: 'Revisión técnica y validación de datos',
        is_current: false
      },
      {
        id: `${fileId}-v1`,
        version: 1,
        filename: file.filename.replace('.', '_v1.'),
        file_size: file.file_size - 100000,
        checksum: 'sha256:version1_hash',
        uploaded_by: file.uploaded_by,
        uploaded_by_name: file.uploaded_by_name,
        created_at: file.created_at,
        change_notes: 'Versión inicial del documento',
        is_current: false
      }
    ]

    const response: FileVersionHistory = {
      success: true,
      data: {
        current_file: file,
        versions: mockVersions,
        total_versions: mockVersions.length
      },
      message: 'Historial de versiones obtenido exitosamente'
    }

    console.log('✅ [FILES] Version history returned:', mockVersions.length, 'versions')
    return c.json(response)
  } catch (error) {
    console.error('❌ [FILES] Error getting file versions:', error)
    return c.json({
      success: false,
      message: 'Error al obtener historial de versiones',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * POST /api/files/folders
 * Create a new folder
 */
files.post('/folders', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const folderData = await c.req.json() as FolderCreateRequest

    console.log('📁 [FILES] Folder creation requested:', folderData.name, 'by:', payload.email)

    const newFolder: FileFolder = {
      id: `folder-${Date.now()}`,
      name: folderData.name,
      path: folderData.path || `/${folderData.entity_type}s/${folderData.entity_id}/${folderData.name.toLowerCase().replace(/\s+/g, '_')}`,
      parent_id: folderData.parent_id,
      description: folderData.description,
      color: folderData.color || '#6B7280',
      icon: folderData.icon || 'fas fa-folder',
      entity_type: folderData.entity_type,
      entity_id: folderData.entity_id,
      is_public: folderData.is_public || false,
      access_level: folderData.access_level || 'private',
      created_by: payload.userId,
      created_by_name: payload.email,
      file_count: 0,
      folder_count: 0,
      total_size: 0,
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    mockFolders.push(newFolder)

    console.log('✅ [FILES] Folder created successfully:', newFolder.name)
    return c.json({
      success: true,
      data: newFolder,
      message: 'Carpeta creada exitosamente'
    })
  } catch (error) {
    console.error('❌ [FILES] Error creating folder:', error)
    return c.json({
      success: false,
      message: 'Error al crear carpeta',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files/search
 * Search files with advanced filters
 */
files.get('/search', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    const query = c.req.query('query') || ''

    console.log('🔍 [FILES] File search requested:', query, 'by:', payload.email)

    if (!query.trim()) {
      return c.json({
        success: false,
        message: 'Query de búsqueda requerido'
      }, 400)
    }

    const startTime = Date.now()

    // Search in files
    const searchResults = mockFiles.filter(file => {
      // Access control
      if (file.access_level === 'private' && file.uploaded_by !== payload.userId) return false
      if (file.access_level === 'restricted' && payload.role !== 'admin') return false
      if (file.status !== 'active') return false

      // Search in filename, title, description, tags
      const searchTerm = query.toLowerCase()
      return (
        file.filename.toLowerCase().includes(searchTerm) ||
        file.title?.toLowerCase().includes(searchTerm) ||
        file.description?.toLowerCase().includes(searchTerm) ||
        file.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
        file.uploaded_by_name.toLowerCase().includes(searchTerm)
      )
    })

    const searchTime = Date.now() - startTime

    const response: FileSearchResponse = {
      success: true,
      data: {
        files: searchResults,
        total_results: searchResults.length,
        search_time_ms: searchTime,
        suggestions: ['biodiversidad', 'proyecto', 'atlas', 'congreso', 'chocó']
      },
      pagination: {
        limit: 50,
        offset: 0,
        total: searchResults.length,
        pages: 1
      },
      message: `${searchResults.length} archivos encontrados en ${searchTime}ms`
    }

    console.log('✅ [FILES] Search completed:', searchResults.length, 'results in', searchTime, 'ms')
    return c.json(response)
  } catch (error) {
    console.error('❌ [FILES] Error searching files:', error)
    return c.json({
      success: false,
      message: 'Error en la búsqueda de archivos',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/files/stats
 * Get file system statistics
 */
files.get('/stats', async (c) => {
  try {
    const payload = c.get('jwtPayload') as JWTPayload
    console.log('📊 [FILES] File statistics requested by:', payload.email)

    // Filter accessible files
    const accessibleFiles = mockFiles.filter(file => {
      if (file.access_level === 'private' && file.uploaded_by !== payload.userId) return false
      if (file.access_level === 'restricted' && payload.role !== 'admin') return false
      return file.status === 'active'
    })

    // Calculate statistics
    const totalSize = accessibleFiles.reduce((sum, file) => sum + file.file_size, 0)
    const totalDownloads = accessibleFiles.reduce((sum, file) => sum + file.download_count, 0)
    const totalViews = accessibleFiles.reduce((sum, file) => sum + file.view_count, 0)

    const filesByCategory: Record<string, number> = {}
    const filesByExtension: Record<string, number> = {}
    const filesByAccessLevel: Record<string, number> = {}
    const storageUsageByEntity: Record<string, number> = {}

    accessibleFiles.forEach(file => {
      filesByCategory[file.category] = (filesByCategory[file.category] || 0) + 1
      filesByExtension[file.file_extension] = (filesByExtension[file.file_extension] || 0) + 1
      filesByAccessLevel[file.access_level] = (filesByAccessLevel[file.access_level] || 0) + 1
      storageUsageByEntity[file.entity_type] = (storageUsageByEntity[file.entity_type] || 0) + file.file_size
    })

    const stats = {
      total_files: accessibleFiles.length,
      total_folders: mockFolders.length,
      total_size: totalSize,
      total_downloads: totalDownloads,
      total_views: totalViews,
      files_by_category: filesByCategory,
      files_by_extension: filesByExtension,
      files_by_access_level: filesByAccessLevel,
      storage_usage_by_entity: storageUsageByEntity,
      top_downloaded: accessibleFiles
        .sort((a, b) => b.download_count - a.download_count)
        .slice(0, 5),
      recent_uploads: accessibleFiles
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
      large_files: accessibleFiles
        .sort((a, b) => b.file_size - a.file_size)
        .slice(0, 5)
    }

    const response: FileStatsResponse = {
      success: true,
      data: stats,
      generated_at: new Date().toISOString(),
      message: 'Estadísticas del sistema de archivos generadas exitosamente'
    }

    console.log('✅ [FILES] Statistics generated:', accessibleFiles.length, 'files analyzed')
    return c.json(response)
  } catch (error) {
    console.error('❌ [FILES] Error generating file statistics:', error)
    return c.json({
      success: false,
      message: 'Error al generar estadísticas de archivos',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default files