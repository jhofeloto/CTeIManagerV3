// ===== SISTEMA DE GESTIÓN DE ARCHIVOS =====
// Sistema completo para subir, listar y gestionar archivos en proyectos y productos

// ===== CONFIGURACIÓN GLOBAL =====
const FILE_CONFIG = {
    project: {
        maxSize: 15 * 1024 * 1024, // 15MB
        allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain'],
        description: 'PDFs, imágenes, archivos de texto'
    },
    product: {
        maxSize: 20 * 1024 * 1024, // 20MB
        allowedTypes: [
            'application/pdf', 
            'image/jpeg', 'image/jpg', 'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ],
        description: 'PDFs, imágenes, documentos Word'
    }
};

// ===== FUNCIONES DE VALIDACIÓN =====
function validateFile(file, type) {
    const config = FILE_CONFIG[type];
    if (!config) {
        return { valid: false, error: 'Tipo de entidad no válida' };
    }
    
    if (!config.allowedTypes.includes(file.type)) {
        return { 
            valid: false, 
            error: `Tipo de archivo no permitido. Permitidos: ${config.description}` 
        };
    }
    
    if (file.size > config.maxSize) {
        const maxMB = Math.round(config.maxSize / (1024 * 1024));
        return { 
            valid: false, 
            error: `El archivo no puede superar ${maxMB}MB` 
        };
    }
    
    return { valid: true };
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileIcon(mimeType) {
    if (mimeType.includes('pdf')) return '📄';
    if (mimeType.includes('image')) return '🖼️';
    if (mimeType.includes('word')) return '📝';
    if (mimeType.includes('text')) return '📋';
    return '📎';
}

// ===== SUBIDA DE ARCHIVOS =====
async function uploadFile(entityType, entityId, file, additionalData = {}) {
    try {
        // Validar archivo
        const validation = validateFile(file, entityType);
        if (!validation.valid) {
            throw new Error(validation.error);
        }
        
        // Preparar FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', entityType);
        
        // Añadir datos adicionales
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key]);
        });
        
        // Determinar endpoint
        let endpoint;
        if (entityType === 'project') {
            endpoint = `${API_BASE}/me/projects/${entityId}/upload`;
        } else if (entityType === 'product') {
            const projectId = additionalData.projectId;
            if (!projectId) throw new Error('ID de proyecto requerido para productos');
            endpoint = `${API_BASE}/me/projects/${projectId}/products/${entityId}/upload`;
        } else {
            throw new Error('Tipo de entidad no soportado');
        }
        
        // Realizar upload con progress
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: formData
        });
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Error al subir archivo');
        }
        
        return result.data;
        
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}

// ===== LISTADO DE ARCHIVOS =====
async function listFiles(entityType, entityId, additionalData = {}) {
    try {
        let endpoint;
        if (entityType === 'project') {
            endpoint = `${API_BASE}/me/projects/${entityId}/files`;
        } else if (entityType === 'product') {
            const projectId = additionalData.projectId;
            if (!projectId) throw new Error('ID de proyecto requerido para productos');
            endpoint = `${API_BASE}/me/projects/${projectId}/products/${entityId}/files`;
        } else {
            throw new Error('Tipo de entidad no soportado');
        }
        
        const response = await axios.get(endpoint);
        
        if (!response.data.success) {
            throw new Error(response.data.error || 'Error al listar archivos');
        }
        
        return response.data.data;
        
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
}

// ===== ELIMINACIÓN DE ARCHIVOS =====
async function deleteFile(fileId) {
    try {
        const response = await axios.delete(`${API_BASE}/me/files/${fileId}`);
        
        if (!response.data.success) {
            throw new Error(response.data.error || 'Error al eliminar archivo');
        }
        
        return response.data.data;
        
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

// ===== COMPONENTES DE INTERFAZ =====

// Crear componente de subida de archivos
function createFileUploadComponent(entityType, entityId, options = {}) {
    const {
        projectId = null,
        onUploadSuccess = null,
        onUploadError = null,
        containerClass = '',
        showPreview = true
    } = options;
    
    const config = FILE_CONFIG[entityType];
    const maxMB = Math.round(config.maxSize / (1024 * 1024));
    
    return `
        <div class="ctei-file-upload ${containerClass}">
            <div class="level-2 p-4">
                <h4 class="text-lg font-semibold mb-3">
                    <i class="fas fa-upload mr-2"></i>
                    Subir Archivo
                </h4>
                
                <div class="mb-4">
                    <input 
                        type="file" 
                        id="fileInput-${entityType}-${entityId}" 
                        class="hidden"
                        accept="${config.allowedTypes.join(',')}"
                    >
                    <div 
                        id="dropZone-${entityType}-${entityId}"
                        class="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
                        onclick="document.getElementById('fileInput-${entityType}-${entityId}').click()"
                    >
                        <i class="fas fa-cloud-upload-alt text-4xl text-muted-foreground mb-3"></i>
                        <p class="text-foreground mb-2">
                            Haz click aquí o arrastra un archivo
                        </p>
                        <p class="text-sm text-muted-foreground">
                            Máximo ${maxMB}MB • ${config.description}
                        </p>
                    </div>
                </div>
                
                <div id="uploadProgress-${entityType}-${entityId}" class="hidden">
                    <div class="flex items-center justify-between mb-2">
                        <span class="text-sm font-medium">Subiendo archivo...</span>
                        <span id="progressPercent-${entityType}-${entityId}" class="text-sm text-muted-foreground">0%</span>
                    </div>
                    <div class="w-full bg-muted rounded-full h-2">
                        <div id="progressBar-${entityType}-${entityId}" class="bg-primary h-2 rounded-full transition-all duration-300" style="width: 0%"></div>
                    </div>
                </div>
                
                <div id="uploadResult-${entityType}-${entityId}" class="hidden mt-4">
                    <!-- Resultado del upload aparecerá aquí -->
                </div>
            </div>
        </div>
    `;
}

// Inicializar componente de subida de archivos
function initFileUpload(entityType, entityId, options = {}) {
    const {
        projectId = null,
        onUploadSuccess = null,
        onUploadError = null
    } = options;
    
    const fileInput = document.getElementById(`fileInput-${entityType}-${entityId}`);
    const dropZone = document.getElementById(`dropZone-${entityType}-${entityId}`);
    const uploadProgress = document.getElementById(`uploadProgress-${entityType}-${entityId}`);
    const uploadResult = document.getElementById(`uploadResult-${entityType}-${entityId}`);
    
    if (!fileInput || !dropZone) return;
    
    // Manejar selección de archivo
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            await handleFileUpload(file);
        }
    });
    
    // Manejar drag & drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-primary', 'bg-primary/5');
    });
    
    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-primary/5');
    });
    
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-primary', 'bg-primary/5');
        
        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            await handleFileUpload(file);
        }
    });
    
    // Función para manejar la subida
    async function handleFileUpload(file) {
        try {
            // Mostrar progreso
            uploadProgress.classList.remove('hidden');
            uploadResult.classList.add('hidden');
            
            // Simular progreso (en una implementación real usarías XMLHttpRequest para progreso real)
            let progress = 0;
            const progressInterval = setInterval(() => {
                progress += 10;
                document.getElementById(`progressBar-${entityType}-${entityId}`).style.width = `${progress}%`;
                document.getElementById(`progressPercent-${entityType}-${entityId}`).textContent = `${progress}%`;
                
                if (progress >= 90) {
                    clearInterval(progressInterval);
                }
            }, 100);
            
            // Subir archivo
            const additionalData = projectId ? { projectId } : {};
            const result = await uploadFile(entityType, entityId, file, additionalData);
            
            // Completar progreso
            clearInterval(progressInterval);
            document.getElementById(`progressBar-${entityType}-${entityId}`).style.width = '100%';
            document.getElementById(`progressPercent-${entityType}-${entityId}`).textContent = '100%';
            
            // Mostrar resultado
            setTimeout(() => {
                uploadProgress.classList.add('hidden');
                uploadResult.classList.remove('hidden');
                uploadResult.innerHTML = `
                    <div class="ctei-success-message">
                        <i class="fas fa-check-circle text-green-600 mr-2"></i>
                        <strong>${result.original_name}</strong> subido exitosamente
                        <div class="text-sm text-muted-foreground mt-1">
                            ${formatFileSize(result.file_size)} • 
                            <a href="${result.file_url}" target="_blank" class="text-primary hover:underline">
                                Ver archivo
                            </a>
                        </div>
                    </div>
                `;
                
                // Callback de éxito
                if (onUploadSuccess) {
                    onUploadSuccess(result);
                }
                
                // Limpiar input
                fileInput.value = '';
            }, 500);
            
        } catch (error) {
            // Ocultar progreso
            uploadProgress.classList.add('hidden');
            
            // Mostrar error
            uploadResult.classList.remove('hidden');
            uploadResult.innerHTML = `
                <div class="ctei-error-message">
                    <i class="fas fa-exclamation-circle text-red-600 mr-2"></i>
                    Error: ${error.message}
                </div>
            `;
            
            // Callback de error
            if (onUploadError) {
                onUploadError(error);
            }
            
            // Limpiar input
            fileInput.value = '';
        }
    }
}

// Crear componente de lista de archivos
function createFileListComponent(entityType, entityId, options = {}) {
    const {
        projectId = null,
        showUploadButton = true,
        containerClass = '',
        emptyMessage = 'No hay archivos subidos'
    } = options;
    
    return `
        <div class="ctei-file-list ${containerClass}">
            <div class="level-2 p-4">
                <div class="flex justify-between items-center mb-4">
                    <h4 class="text-lg font-semibold">
                        <i class="fas fa-folder-open mr-2"></i>
                        Archivos
                    </h4>
                    ${showUploadButton ? `
                        <button 
                            onclick="toggleFileUpload('${entityType}', '${entityId}')"
                            class="ctei-btn-secondary"
                        >
                            <i class="fas fa-plus mr-2"></i>
                            Subir Archivo
                        </button>
                    ` : ''}
                </div>
                
                <div id="fileList-${entityType}-${entityId}" class="space-y-2">
                    <!-- Lista de archivos aparecerá aquí -->
                    <div class="text-center py-8 text-muted-foreground">
                        <i class="fas fa-folder-open text-4xl mb-3"></i>
                        <p>Cargando archivos...</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Cargar y mostrar lista de archivos
async function loadFileList(entityType, entityId, options = {}) {
    const {
        projectId = null,
        containerId = `fileList-${entityType}-${entityId}`,
        emptyMessage = 'No hay archivos subidos'
    } = options;
    
    const container = document.getElementById(containerId);
    if (!container) return;
    
    try {
        const additionalData = projectId ? { projectId } : {};
        const files = await listFiles(entityType, entityId, additionalData);
        
        if (!files || files.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-muted-foreground">
                    <i class="fas fa-folder-open text-4xl mb-3"></i>
                    <p>${emptyMessage}</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = files.map(file => `
            <div class="level-1 p-3 hover:bg-muted/50 transition-colors">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <span class="text-2xl">${getFileIcon(file.mime_type)}</span>
                        <div>
                            <div class="font-medium text-foreground">${file.original_name}</div>
                            <div class="text-sm text-muted-foreground">
                                ${formatFileSize(file.file_size)} • 
                                Subido por ${file.uploaded_by_name || 'Usuario'} • 
                                ${new Date(file.uploaded_at).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <a 
                            href="${file.file_url}" 
                            target="_blank" 
                            class="ctei-btn-secondary ctei-btn-sm"
                            title="Ver archivo"
                        >
                            <i class="fas fa-external-link-alt"></i>
                        </a>
                        <button 
                            onclick="confirmDeleteFile(${file.id}, '${file.original_name}', '${entityType}', '${entityId}'${projectId ? `, '${projectId}'` : ''})"
                            class="ctei-btn-secondary ctei-btn-sm hover:bg-red-100 hover:text-red-700"
                            title="Eliminar archivo"
                        >
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading file list:', error);
        container.innerHTML = `
            <div class="text-center py-8 text-red-600">
                <i class="fas fa-exclamation-triangle text-4xl mb-3"></i>
                <p>Error al cargar archivos: ${error.message}</p>
                <button onclick="loadFileList('${entityType}', '${entityId}', ${JSON.stringify(options).replace(/"/g, '&quot;')})" class="ctei-btn-secondary mt-3">
                    Reintentar
                </button>
            </div>
        `;
    }
}

// ===== FUNCIONES DE INTERFAZ =====

// Toggle de componente de upload
function toggleFileUpload(entityType, entityId) {
    const uploadComponent = document.getElementById(`upload-${entityType}-${entityId}`);
    if (uploadComponent) {
        uploadComponent.classList.toggle('hidden');
    }
}

// Confirmar eliminación de archivo
function confirmDeleteFile(fileId, fileName, entityType, entityId, projectId = null) {
    if (confirm(`¿Estás seguro de que quieres eliminar el archivo "${fileName}"?\n\nEsta acción no se puede deshacer.`)) {
        handleDeleteFile(fileId, entityType, entityId, projectId);
    }
}

// Manejar eliminación de archivo
async function handleDeleteFile(fileId, entityType, entityId, projectId = null) {
    try {
        await deleteFile(fileId);
        
        // Recargar lista
        const options = projectId ? { projectId } : {};
        await loadFileList(entityType, entityId, options);
        
        // Mostrar mensaje de éxito
        showNotification('Archivo eliminado exitosamente', 'success');
        
    } catch (error) {
        console.error('Error deleting file:', error);
        showNotification(`Error al eliminar archivo: ${error.message}`, 'error');
    }
}

// ===== FUNCIÓN DE INICIALIZACIÓN COMPLETA =====
function initCompleteFileManager(entityType, entityId, containerId, options = {}) {
    const {
        projectId = null,
        showUpload = true,
        showList = true
    } = options;
    
    const container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container ${containerId} not found`);
        return;
    }
    
    let html = '';
    
    if (showUpload) {
        html += `
            <div id="upload-${entityType}-${entityId}" class="mb-4">
                ${createFileUploadComponent(entityType, entityId, options)}
            </div>
        `;
    }
    
    if (showList) {
        html += createFileListComponent(entityType, entityId, options);
    }
    
    container.innerHTML = html;
    
    // Inicializar upload si está habilitado
    if (showUpload) {
        setTimeout(() => {
            initFileUpload(entityType, entityId, {
                projectId,
                onUploadSuccess: (result) => {
                    // Recargar lista después de upload exitoso
                    if (showList) {
                        const listOptions = projectId ? { projectId } : {};
                        loadFileList(entityType, entityId, listOptions);
                    }
                    showNotification('Archivo subido exitosamente', 'success');
                }
            });
        }, 100);
    }
    
    // Cargar lista si está habilitada
    if (showList) {
        setTimeout(() => {
            const listOptions = projectId ? { projectId } : {};
            loadFileList(entityType, entityId, listOptions);
        }, 100);
    }
}

// ===== EXPORT PARA USO GLOBAL =====
window.FileManager = {
    uploadFile,
    listFiles,
    deleteFile,
    createFileUploadComponent,
    createFileListComponent,
    initFileUpload,
    loadFileList,
    initCompleteFileManager,
    validateFile,
    formatFileSize,
    getFileIcon,
    toggleFileUpload,
    confirmDeleteFile,
    handleDeleteFile
};