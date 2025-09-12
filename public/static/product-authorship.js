// Gestión de autoría de productos CTeI - Extensión Fase 1.1
// Funciones para manejar autores, permisos y control granular de productos

// Modal mejorado para gestión de productos con autoría
async function showEnhancedProductModalWithAuthors(projectId, product = null) {
    const isEdit = product !== null;
    const modalTitle = isEdit ? 'Editar Producto CTeI' : 'Crear Nuevo Producto CTeI';
    
    // Asegurar que los datos auxiliares están cargados
    if (!window.Phase1Cache || !window.Phase1Cache.productCategories) {
        console.log('Cargando datos auxiliares...');
        const loaded = await loadAuxiliaryData();
        if (!loaded) {
            showNotification('Error cargando categorías de productos', 'error');
            return;
        }
    }
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-auto';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-screen overflow-auto">
            <div class="p-6 border-b">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-900">
                        <i class="fas fa-lightbulb mr-2"></i>
                        ${modalTitle}
                    </h2>
                    <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <form id="productAuthorshipForm" class="p-6 space-y-8">
                <!-- Información Básica del Producto -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="lg:col-span-2">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-info-circle mr-2 text-blue-500"></i>
                            Información Básica del Producto
                        </h3>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Código del Producto *</label>
                        <input 
                            type="text" 
                            id="product_code" 
                            name="product_code" 
                            required
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="PROD-001"
                            value="${product?.product_code || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Categoría del Producto *</label>
                        <select 
                            id="product_type" 
                            name="product_type" 
                            required
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                            <option value="">Cargando categorías...</option>
                        </select>
                    </div>
                    
                    <div class="lg:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Descripción del Producto *</label>
                        <textarea 
                            id="description" 
                            name="description" 
                            required
                            rows="3"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Descripción detallada del producto CTeI"
                        >${product?.description || ''}</textarea>
                    </div>
                </div>
                
                <!-- Metadatos Específicos del Producto -->
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-3">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                            <i class="fas fa-tags mr-2 text-green-500"></i>
                            Metadatos y Referencias
                        </h3>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">DOI</label>
                        <input 
                            type="text" 
                            id="doi" 
                            name="doi"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="10.1000/182"
                            value="${product?.doi || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL del Producto</label>
                        <input 
                            type="url" 
                            id="url" 
                            name="url"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://..."
                            value="${product?.url || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Fecha de Publicación</label>
                        <input 
                            type="date" 
                            id="publication_date" 
                            name="publication_date"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            value="${formatDateForInput(product?.publication_date)}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Revista/Journal</label>
                        <input 
                            type="text" 
                            id="journal" 
                            name="journal"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="Nombre de la revista"
                            value="${product?.journal || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Factor de Impacto</label>
                        <input 
                            type="number" 
                            id="impact_factor" 
                            name="impact_factor"
                            step="0.001"
                            min="0"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="0.000"
                            value="${product?.impact_factor || ''}"
                        >
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL del Archivo</label>
                        <input 
                            type="url" 
                            id="file_url" 
                            name="file_url"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent"
                            placeholder="https://..."
                            value="${product?.file_url || ''}"
                        >
                    </div>
                    
                    <div class="lg:col-span-3">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Metadatos Adicionales (JSON)</label>
                        <textarea 
                            id="metadata" 
                            name="metadata"
                            rows="3"
                            class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-transparent font-mono text-sm"
                            placeholder='{"campo1": "valor1", "campo2": "valor2"}'
                        >${product?.metadata || ''}</textarea>
                        <p class="text-xs text-gray-500 mt-1">Formato JSON válido para metadatos adicionales</p>
                    </div>
                </div>
                
                <!-- Gestión de Autoría -->
                <div class="border-t pt-6">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <i class="fas fa-users mr-2 text-purple-500"></i>
                        Autoría y Colaboradores
                    </h3>
                    
                    <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <div class="flex items-start">
                            <i class="fas fa-info-circle text-blue-500 mt-1 mr-3"></i>
                            <div>
                                <h4 class="font-medium text-blue-900">Información sobre Autoría</h4>
                                <p class="text-sm text-blue-700 mt-1">
                                    ${isEdit 
                                        ? 'Puedes gestionar los autores de este producto. El creador original no puede ser removido.' 
                                        : 'Serás registrado automáticamente como autor principal. Puedes añadir co-autores adicionales.'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Creador del producto (solo en edición) -->
                    ${isEdit && product?.creator_name ? `
                        <div class="mb-6">
                            <label class="block text-sm font-medium text-gray-700 mb-3">Creador del Producto</label>
                            <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                <div class="flex items-center">
                                    <div class="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="ml-3">
                                        <p class="font-medium text-gray-900">${product.creator_name}</p>
                                        <p class="text-sm text-gray-500">Autor principal (creador)</p>
                                    </div>
                                    <div class="ml-auto">
                                        <span class="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                            <i class="fas fa-crown mr-1"></i>
                                            Creador
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Lista de autores actuales (en edición) -->
                    ${isEdit ? `
                        <div class="mb-6">
                            <div class="flex justify-between items-center mb-3">
                                <label class="block text-sm font-medium text-gray-700">Autores Actuales</label>
                                <button 
                                    type="button"
                                    onclick="loadProductAuthors(${projectId}, ${product?.id})"
                                    class="text-sm text-primary hover:text-primary-dark"
                                >
                                    <i class="fas fa-refresh mr-1"></i>
                                    Recargar
                                </button>
                            </div>
                            <div id="currentAuthors" class="space-y-2">
                                <div class="text-sm text-gray-500">
                                    <i class="fas fa-spinner fa-spin mr-2"></i>
                                    Cargando autores...
                                </div>
                            </div>
                        </div>
                    ` : ''}
                    
                    <!-- Formulario para añadir nuevos autores -->
                    <div class="border border-gray-200 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-4">
                            <i class="fas fa-user-plus mr-2"></i>
                            ${isEdit ? 'Añadir Nuevo Autor' : 'Autores Adicionales'}
                        </h4>
                        
                        <div id="authorsContainer" class="space-y-4">
                            <!-- Los autores adicionales se añaden dinámicamente -->
                        </div>
                        
                        <button 
                            type="button"
                            onclick="addAuthorField()"
                            class="mt-4 w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <i class="fas fa-plus mr-2"></i>
                            Añadir Autor
                        </button>
                    </div>
                </div>
                
                <!-- Botones de acción -->
                <div class="flex justify-end space-x-3 pt-6 border-t">
                    <button 
                        type="button" 
                        onclick="this.closest('.fixed').remove()"
                        class="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button 
                        type="submit"
                        class="px-6 py-3 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                    >
                        <i class="fas fa-save mr-2"></i>
                        ${isEdit ? 'Actualizar' : 'Crear'} Producto
                    </button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cargar categorías dinámicamente después de que el modal esté en el DOM
    requestAnimationFrame(async () => {
        const categorySelect = document.getElementById('product_type');
        if (categorySelect && window.Phase1Cache && window.Phase1Cache.productCategories) {
            // Limpiar opciones existentes
            categorySelect.innerHTML = '<option value="">Seleccionar categoría</option>';
            
            // Agregar todas las categorías disponibles
            window.Phase1Cache.productCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.code; // Usar 'code' en lugar de 'id'
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            
            console.log('✅ Categorías cargadas en modal:', window.Phase1Cache.productCategories.length);
        } else {
            console.error('❌ No se pudo cargar categorías en modal');
            
            // Mostrar mensaje de error en el select
            if (categorySelect) {
                categorySelect.innerHTML = '<option value="">Error cargando categorías</option>';
            }
        }
        
        // Si es edición, establecer el valor de categoría y cargar autores
        if (isEdit) {
            if (product?.product_type) {
                if (categorySelect) {
                    categorySelect.value = product.product_type;
                    console.log('Categoría establecida:', product.product_type);
                } else {
                    console.error('No se encontró el select de categorías');
                }
            }
            
            if (product?.id) {
                loadProductAuthors(projectId, product.id);
            }
        }
    });
    
    // Manejar envío del formulario
    document.getElementById('productAuthorshipForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const productData = Object.fromEntries(formData);
        
        // Recopilar datos de autores adicionales
        const authors = [];
        document.querySelectorAll('.author-entry').forEach((entry, index) => {
            const userId = entry.querySelector('[name="author_user_id"]')?.value;
            const role = entry.querySelector('[name="author_role"]')?.value;
            const contribution = entry.querySelector('[name="contribution_type"]')?.value;
            
            if (userId && role) {
                authors.push({
                    user_id: parseInt(userId),
                    author_role: role,
                    author_order: index + 2, // +2 porque el creador es orden 1
                    contribution_type: contribution || null
                });
            }
        });
        
        if (authors.length > 0) {
            productData.authors = authors;
        }
        
        // Validar JSON de metadatos
        if (productData.metadata && productData.metadata.trim()) {
            try {
                JSON.parse(productData.metadata);
            } catch (error) {
                showToast('El formato de metadatos no es JSON válido', 'error');
                return;
            }
        }
        
        // Convertir campos numéricos
        if (productData.impact_factor) {
            productData.impact_factor = parseFloat(productData.impact_factor);
        }
        
        try {
            let response;
            if (isEdit) {
                response = await axios.put(`${API_BASE}/private/projects/${projectId}/products/${product.id}`, productData);
            } else {
                response = await axios.post(`${API_BASE}/private/projects/${projectId}/products`, productData);
            }
            
            if (response.data.success) {
                showToast(response.data.message || `Producto ${isEdit ? 'actualizado' : 'creado'} exitosamente`);
                modal.remove();
                loadMyProjects(); // Recargar lista de proyectos
            } else {
                showToast(response.data.error || 'Error en la operación', 'error');
            }
        } catch (error) {
            console.error('Error guardando producto:', error);
            showToast('Error al guardar el producto', 'error');
        }
    });
}

// Cargar y mostrar autores de un producto
async function loadProductAuthors(projectId, productId) {
    const container = document.getElementById('currentAuthors');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-sm text-gray-500">
            <i class="fas fa-spinner fa-spin mr-2"></i>
            Cargando autores...
        </div>
    `;
    
    try {
        const response = await axios.get(`${API_BASE}/private/projects/${projectId}/products/${productId}/authors`);
        
        if (response.data.success) {
            const authors = response.data.data.authors;
            
            if (authors.length === 0) {
                container.innerHTML = `
                    <div class="text-sm text-gray-500">
                        <i class="fas fa-info-circle mr-2"></i>
                        Solo el creador está registrado como autor
                    </div>
                `;
                return;
            }
            
            container.innerHTML = authors.map(author => `
                <div class="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">
                            ${author.author_order}
                        </div>
                        <div class="ml-3">
                            <p class="font-medium text-gray-900">${author.full_name}</p>
                            <p class="text-xs text-gray-500">${author.email}</p>
                            ${author.contribution_type ? `
                                <p class="text-xs text-gray-600 mt-1">
                                    <i class="fas fa-info-circle mr-1"></i>
                                    ${author.contribution_type}
                                </p>
                            ` : ''}
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-2 py-1 text-xs rounded ${getRoleColorClass(author.author_role)}">
                            ${getRoleDisplayName(author.author_role)}
                        </span>
                        ${author.user_id !== DashboardState.user?.id ? `
                            <button 
                                onclick="removeProductAuthor(${projectId}, ${productId}, ${author.user_id})"
                                class="text-red-500 hover:text-red-700 text-sm"
                                title="Remover autor"
                            >
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            `).join('');
            
        } else {
            container.innerHTML = `
                <div class="text-sm text-red-500">
                    <i class="fas fa-exclamation-triangle mr-2"></i>
                    Error cargando autores
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando autores:', error);
        container.innerHTML = `
            <div class="text-sm text-red-500">
                <i class="fas fa-exclamation-triangle mr-2"></i>
                Error cargando autores del producto
            </div>
        `;
    }
}

// Añadir campo para nuevo autor
function addAuthorField() {
    const container = document.getElementById('authorsContainer');
    const authorIndex = container.children.length;
    
    const authorDiv = document.createElement('div');
    authorDiv.className = 'author-entry grid grid-cols-1 md:grid-cols-4 gap-3 p-4 border border-gray-200 rounded-lg';
    authorDiv.innerHTML = `
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">ID de Usuario</label>
            <input 
                type="number" 
                name="author_user_id"
                required
                class="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="ID"
            >
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Rol</label>
            <select 
                name="author_role"
                required
                class="w-full p-2 border border-gray-300 rounded text-sm"
            >
                <option value="">Seleccionar</option>
                <option value="CO_AUTHOR">Co-autor</option>
                <option value="EDITOR">Editor</option>
                <option value="REVIEWER">Revisor</option>
            </select>
        </div>
        
        <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contribución</label>
            <input 
                type="text" 
                name="contribution_type"
                class="w-full p-2 border border-gray-300 rounded text-sm"
                placeholder="Tipo de contribución"
            >
        </div>
        
        <div class="flex items-end">
            <button 
                type="button"
                onclick="this.closest('.author-entry').remove()"
                class="w-full bg-red-500 text-white p-2 rounded text-sm hover:bg-red-600"
            >
                <i class="fas fa-trash mr-1"></i>
                Remover
            </button>
        </div>
    `;
    
    container.appendChild(authorDiv);
}

// Remover autor de un producto
async function removeProductAuthor(projectId, productId, userId) {
    if (!confirm('¿Estás seguro de que deseas remover este autor del producto?')) {
        return;
    }
    
    try {
        const response = await axios.delete(`${API_BASE}/private/projects/${projectId}/products/${productId}/authors/${userId}`);
        
        if (response.data.success) {
            showToast('Autor removido exitosamente');
            loadProductAuthors(projectId, productId); // Recargar lista
        } else {
            showToast(response.data.error || 'Error removiendo autor', 'error');
        }
    } catch (error) {
        console.error('Error removiendo autor:', error);
        showToast('Error al remover autor del producto', 'error');
    }
}

// Publicar/despublicar producto individual (desde gestión de autoría)
async function toggleProductVisibilityFromAuthorship(projectId, productId, isPublic) {
    try {
        const response = await axios.post(`${API_BASE}/private/projects/${projectId}/products/${productId}/publish`, {
            is_public: isPublic
        });
        
        if (response.data.success) {
            showToast(response.data.message);
            loadMyProjects(); // Recargar lista
        } else {
            showToast(response.data.error || 'Error cambiando visibilidad', 'error');
        }
    } catch (error) {
        console.error('Error cambiando visibilidad del producto:', error);
        showToast('Error al cambiar la visibilidad del producto', 'error');
    }
}

// Utilidades para roles
function getRoleColorClass(role) {
    const colors = {
        'AUTHOR': 'bg-blue-100 text-blue-800',
        'CO_AUTHOR': 'bg-green-100 text-green-800',
        'EDITOR': 'bg-purple-100 text-purple-800',
        'REVIEWER': 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
}

function getRoleDisplayName(role) {
    const names = {
        'AUTHOR': 'Autor',
        'CO_AUTHOR': 'Co-autor',
        'EDITOR': 'Editor',
        'REVIEWER': 'Revisor'
    };
    return names[role] || role;
}

// Reemplazar la función original del modal de productos
function showEnhancedProductModal(projectId, product = null) {
    // Usar la nueva función con autoría
    showEnhancedProductModalWithAuthors(projectId, product);
}