// HU-11: Resources Manager - Admin Panel Frontend
class ResourcesManager {
    constructor() {
        this.resources = [];
        this.categories = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.currentFilters = {
            search: '',
            type: '',
            category: '',
            status: '',
            author: ''
        };
        
        console.log('ResourcesManager initialized');
    }

    async init() {
        console.log('Initializing Resources Manager...');
        await this.loadCategories();
        await this.loadResources();
        this.bindEvents();
    }

    bindEvents() {
        // Search with debounce
        let searchTimeout;
        const searchInput = document.getElementById('resourceSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.currentPage = 1;
                    this.loadResources();
                }, 500);
            });
        }

        // Filter changes
        const typeFilter = document.getElementById('resourceTypeFilter');
        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.currentFilters.type = e.target.value;
                this.currentPage = 1;
                this.loadResources();
            });
        }

        const categoryFilter = document.getElementById('resourceCategoryFilter');
        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.currentFilters.category = e.target.value;
                this.currentPage = 1;
                this.loadResources();
            });
        }

        const statusFilter = document.getElementById('resourceStatusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.currentPage = 1;
                this.loadResources();
            });
        }

        // Create resource button
        const createBtn = document.getElementById('createResourceBtn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.showCreateModal());
        }

        // Modal close buttons
        const closeCreateModal = document.getElementById('closeCreateResourceModal');
        if (closeCreateModal) {
            closeCreateModal.addEventListener('click', () => this.hideCreateModal());
        }

        const closeEditModal = document.getElementById('closeEditResourceModal');
        if (closeEditModal) {
            closeEditModal.addEventListener('click', () => this.hideEditModal());
        }

        // Forms
        const createForm = document.getElementById('createResourceForm');
        if (createForm) {
            createForm.addEventListener('submit', (e) => this.handleCreateResource(e));
        }

        const editForm = document.getElementById('editResourceForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleUpdateResource(e));
        }
    }

    async loadCategories() {
        try {
            const response = await this.makeAuthenticatedRequest('/api/resources/categories');
            
            if (response.data.success) {
                this.categories = response.data.data;
                this.populateCategorySelects();
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadResources() {
        try {
            const params = new URLSearchParams({
                ...this.currentFilters,
                limit: this.itemsPerPage.toString(),
                offset: ((this.currentPage - 1) * this.itemsPerPage).toString()
            });

            const response = await this.makeAuthenticatedRequest(`/api/resources?${params}`);
            
            if (response.data.success) {
                this.resources = response.data.data.resources;
                const pagination = response.data.pagination;
                this.totalPages = pagination.pages;
                
                this.renderResourcesTable();
                this.renderPagination();
                this.updateResultsInfo(pagination);
            }
        } catch (error) {
            console.error('Error loading resources:', error);
            this.showError('Error al cargar recursos');
        }
    }

    populateCategorySelects() {
        const selects = ['resourceCategoryFilter', 'createResourceCategory', 'editResourceCategory'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                const options = this.categories.map(category => 
                    `<option value="${category.id}">${category.name}</option>`
                ).join('');
                
                if (selectId === 'resourceCategoryFilter') {
                    select.innerHTML = '<option value="">Todas las categorías</option>' + options;
                } else {
                    select.innerHTML = '<option value="">Seleccionar categoría</option>' + options;
                }
            }
        });
    }

    renderResourcesTable() {
        const tbody = document.getElementById('resourcesTableBody');
        if (!tbody) return;

        if (this.resources.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center py-8 text-gray-500">
                        <i class="fas fa-folder-open text-4xl mb-2"></i>
                        <div>No se encontraron recursos</div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.resources.map(resource => `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3">
                    <div class="font-medium text-gray-900">${resource.title}</div>
                    <div class="text-sm text-gray-500">${resource.summary.substring(0, 100)}...</div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <i class="fas ${this.getTypeIcon(resource.type)} mr-1"></i>
                        ${this.getTypeLabel(resource.type)}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <span class="text-sm text-gray-600">${resource.category_name}</span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${resource.author}</div>
                    <div class="text-xs text-gray-500">${resource.author_institution}</div>
                </td>
                <td class="px-4 py-3">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${this.getStatusBadge(resource.status)}">
                        ${resource.status === 'published' ? 'Publicado' : 
                          resource.status === 'draft' ? 'Borrador' : 'Archivado'}
                    </span>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${resource.downloads_count}</div>
                    <div class="text-xs text-gray-500">${resource.views_count} vistas</div>
                </td>
                <td class="px-4 py-3">
                    <div class="text-sm text-gray-900">${this.formatDate(resource.publication_date)}</div>
                </td>
                <td class="px-4 py-3">
                    <div class="flex space-x-2">
                        <button onclick="resourcesManager.editResource(${resource.id})" 
                                class="text-indigo-600 hover:text-indigo-800 transition-colors" 
                                title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="resourcesManager.deleteResource(${resource.id})" 
                                class="text-red-600 hover:text-red-800 transition-colors" 
                                title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                        ${resource.status === 'published' ? `
                            <a href="/recursos" target="_blank" 
                               class="text-green-600 hover:text-green-800 transition-colors" 
                               title="Ver en portal público">
                                <i class="fas fa-eye"></i>
                            </a>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const container = document.getElementById('resourcesPagination');
        if (!container) return;

        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '<div class="pagination-controls">';
        
        // Previous button
        if (this.currentPage > 1) {
            html += `<button onclick="resourcesManager.changePage(${this.currentPage - 1})" class="pagination-btn">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }

        // Page numbers
        for (let i = Math.max(1, this.currentPage - 2); i <= Math.min(this.totalPages, this.currentPage + 2); i++) {
            html += `<button onclick="resourcesManager.changePage(${i})" 
                     class="pagination-btn ${i === this.currentPage ? 'active' : ''}">${i}</button>`;
        }

        // Next button
        if (this.currentPage < this.totalPages) {
            html += `<button onclick="resourcesManager.changePage(${this.currentPage + 1})" class="pagination-btn">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        html += '</div>';
        container.innerHTML = html;
    }

    updateResultsInfo(pagination) {
        const info = document.getElementById('resourcesResultsInfo');
        if (!info) return;

        const { total, limit, offset } = pagination;
        const start = offset + 1;
        const end = Math.min(offset + limit, total);

        info.textContent = `Mostrando ${start}-${end} de ${total} recursos`;
    }

    changePage(page) {
        this.currentPage = page;
        this.loadResources();
    }

    showCreateModal() {
        const modal = document.getElementById('createResourceModal');
        if (modal) {
            // Reset form
            document.getElementById('createResourceForm').reset();
            modal.style.display = 'flex';
        }
    }

    hideCreateModal() {
        const modal = document.getElementById('createResourceModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    showEditModal() {
        const modal = document.getElementById('editResourceModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    hideEditModal() {
        const modal = document.getElementById('editResourceModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    async handleCreateResource(e) {
        e.preventDefault();
        
        const form = e.target;
        const formData = new FormData(form);
        
        const resourceData = {
            title: formData.get('title'),
            summary: formData.get('summary'),
            description: formData.get('description'),
            type: formData.get('type'),
            category_id: parseInt(formData.get('category_id')),
            author: formData.get('author'),
            author_institution: formData.get('author_institution'),
            language: formData.get('language'),
            publication_date: formData.get('publication_date'),
            keywords: formData.get('keywords').split(',').map(k => k.trim()).filter(k => k),
            tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
            file_url: formData.get('file_url'),
            external_url: formData.get('external_url'),
            is_featured: form.querySelector('input[name="is_featured"]').checked,
            is_public: form.querySelector('input[name="is_public"]').checked,
            status: formData.get('status')
        };

        try {
            const response = await this.makeAuthenticatedRequest('/api/resources', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(resourceData)
            });

            if (response.data.success) {
                this.hideCreateModal();
                this.loadResources();
                this.showSuccess('Recurso creado exitosamente');
            } else {
                this.showError(response.data.error || 'Error al crear recurso');
            }
        } catch (error) {
            console.error('Error creating resource:', error);
            this.showError('Error al crear recurso');
        }
    }

    async editResource(id) {
        try {
            const response = await this.makeAuthenticatedRequest(`/api/resources/${id}`);
            
            if (response.data.success) {
                const resource = response.data.data;
                this.fillEditForm(resource);
                this.showEditModal();
            }
        } catch (error) {
            console.error('Error loading resource for edit:', error);
            this.showError('Error al cargar recurso para edición');
        }
    }

    fillEditForm(resource) {
        const form = document.getElementById('editResourceForm');
        if (!form) return;

        // Set form values
        form.querySelector('input[name="title"]').value = resource.title || '';
        form.querySelector('textarea[name="summary"]').value = resource.summary || '';
        form.querySelector('textarea[name="description"]').value = resource.description || '';
        form.querySelector('select[name="type"]').value = resource.type || '';
        form.querySelector('select[name="category_id"]').value = resource.category_id || '';
        form.querySelector('input[name="author"]').value = resource.author || '';
        form.querySelector('input[name="author_institution"]').value = resource.author_institution || '';
        form.querySelector('input[name="language"]').value = resource.language || '';
        form.querySelector('input[name="publication_date"]').value = resource.publication_date?.split('T')[0] || '';
        form.querySelector('textarea[name="keywords"]').value = resource.keywords?.join(', ') || '';
        form.querySelector('textarea[name="tags"]').value = resource.tags?.join(', ') || '';
        form.querySelector('input[name="file_url"]').value = resource.file_url || '';
        form.querySelector('input[name="external_url"]').value = resource.external_url || '';
        form.querySelector('input[name="is_featured"]').checked = resource.is_featured || false;
        form.querySelector('input[name="is_public"]').checked = resource.is_public || false;
        form.querySelector('select[name="status"]').value = resource.status || '';

        // Store resource ID for update
        form.dataset.resourceId = resource.id;
    }

    async handleUpdateResource(e) {
        e.preventDefault();
        
        const form = e.target;
        const resourceId = form.dataset.resourceId;
        const formData = new FormData(form);
        
        const resourceData = {
            title: formData.get('title'),
            summary: formData.get('summary'),
            description: formData.get('description'),
            type: formData.get('type'),
            category_id: parseInt(formData.get('category_id')),
            author: formData.get('author'),
            author_institution: formData.get('author_institution'),
            language: formData.get('language'),
            publication_date: formData.get('publication_date'),
            keywords: formData.get('keywords').split(',').map(k => k.trim()).filter(k => k),
            tags: formData.get('tags').split(',').map(t => t.trim()).filter(t => t),
            file_url: formData.get('file_url'),
            external_url: formData.get('external_url'),
            is_featured: form.querySelector('input[name="is_featured"]').checked,
            is_public: form.querySelector('input[name="is_public"]').checked,
            status: formData.get('status')
        };

        try {
            const response = await this.makeAuthenticatedRequest(`/api/resources/${resourceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(resourceData)
            });

            if (response.data.success) {
                this.hideEditModal();
                this.loadResources();
                this.showSuccess('Recurso actualizado exitosamente');
            } else {
                this.showError(response.data.error || 'Error al actualizar recurso');
            }
        } catch (error) {
            console.error('Error updating resource:', error);
            this.showError('Error al actualizar recurso');
        }
    }

    async deleteResource(id) {
        if (!confirm('¿Estás seguro de que deseas eliminar este recurso?')) {
            return;
        }

        try {
            const response = await this.makeAuthenticatedRequest(`/api/resources/${id}`, {
                method: 'DELETE'
            });

            if (response.data.success) {
                this.loadResources();
                this.showSuccess('Recurso eliminado exitosamente');
            } else {
                this.showError(response.data.error || 'Error al eliminar recurso');
            }
        } catch (error) {
            console.error('Error deleting resource:', error);
            this.showError('Error al eliminar recurso');
        }
    }

    async makeAuthenticatedRequest(url, options = {}) {
        const token = this.getAuthToken();
        if (!token) {
            throw new Error('No authentication token found');
        }

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `auth-token=${token}`
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        const response = await fetch(url, mergedOptions);
        const data = await response.json();
        
        return { data, status: response.status };
    }

    getAuthToken() {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('auth-token='))
            ?.split('=')[1];
    }

    getTypeIcon(type) {
        const icons = {
            'document': 'fa-file-alt',
            'manual': 'fa-book',
            'dataset': 'fa-database',
            'presentation': 'fa-presentation',
            'video': 'fa-video',
            'software': 'fa-laptop-code',
            'guide': 'fa-compass'
        };
        return icons[type] || 'fa-file';
    }

    getTypeLabel(type) {
        const labels = {
            'document': 'Documento',
            'manual': 'Manual',
            'dataset': 'Dataset',
            'presentation': 'Presentación',
            'video': 'Video',
            'software': 'Software',
            'guide': 'Guía'
        };
        return labels[type] || 'Recurso';
    }

    getStatusBadge(status) {
        const badges = {
            'published': 'bg-green-100 text-green-800',
            'draft': 'bg-yellow-100 text-yellow-800',
            'archived': 'bg-gray-100 text-gray-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES');
    }

    showSuccess(message) {
        // Simple success notification - could be enhanced
        alert(message);
    }

    showError(message) {
        // Simple error notification - could be enhanced  
        alert(message);
    }
}

// Global instance
let resourcesManager = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('admin') || window.location.pathname.includes('dashboard')) {
        resourcesManager = new ResourcesManager();
    }
});