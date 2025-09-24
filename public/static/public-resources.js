// HU-11: Public Resources Portal - Frontend JavaScript
class PublicResourcesPortal {
    constructor() {
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.currentFilters = {
            search: '',
            type: '',
            category: '',
            author: '',
            sort: 'publication_date',
            order: 'desc'
        };
        
        this.init();
    }

    async init() {
        console.log('Initializing Public Resources Portal...');
        await this.loadCategories();
        await this.loadResources();
        this.bindEvents();
    }

    bindEvents() {
        // Search input with debounce
        let searchTimeout;
        document.getElementById('searchInput').addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value;
                this.currentPage = 1;
                this.loadResources();
            }, 500);
        });

        // Filter changes
        document.getElementById('typeFilter').addEventListener('change', (e) => {
            this.currentFilters.type = e.target.value;
            this.currentPage = 1;
            this.loadResources();
        });

        document.getElementById('categoryFilter').addEventListener('change', (e) => {
            this.currentFilters.category = e.target.value;
            this.currentPage = 1;
            this.loadResources();
        });

        document.getElementById('sortFilter').addEventListener('change', (e) => {
            const [sort, order] = e.target.value.split('-');
            this.currentFilters.sort = sort;
            this.currentFilters.order = order;
            this.currentPage = 1;
            this.loadResources();
        });

        // Clear filters
        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Login modal
        document.getElementById('showLoginModal').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });

        document.getElementById('closeLoginModal').addEventListener('click', () => {
            this.hideLoginModal();
        });

        document.getElementById('closeResourceModal').addEventListener('click', () => {
            this.hideResourceModal();
        });

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Click outside modal to close
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    async loadCategories() {
        try {
            console.log('Loading resource categories...');
            const response = await axios.get('/api/public/resources/categories');
            
            if (response.data.success) {
                this.renderCategories(response.data.data);
                this.populateCategoryFilter(response.data.data);
            }
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    }

    async loadResources() {
        try {
            console.log('Loading resources with filters:', this.currentFilters);
            
            const params = new URLSearchParams({
                ...this.currentFilters,
                limit: this.itemsPerPage.toString(),
                offset: ((this.currentPage - 1) * this.itemsPerPage).toString()
            });

            const response = await axios.get(`/api/public/resources?${params}`);
            
            if (response.data.success) {
                this.renderResources(response.data.data.resources);
                this.renderPagination(response.data.pagination);
                this.updateResultsInfo(response.data.pagination);
            }
        } catch (error) {
            console.error('Error loading resources:', error);
            this.showError('Error loading resources. Please try again.');
        }
    }

    renderCategories(categories) {
        const container = document.getElementById('resourceCategories');
        if (!container) return;

        container.innerHTML = categories.map(category => `
            <button class="category-card" data-category="${category.slug}">
                <div class="category-icon" style="color: ${category.color};">
                    <i class="${category.icon}"></i>
                </div>
                <div class="category-name">${category.name}</div>
                <div class="category-desc">${category.description}</div>
            </button>
        `).join('');

        // Bind category click events
        container.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const categorySlug = e.currentTarget.dataset.category;
                this.currentFilters.category = categorySlug;
                document.getElementById('categoryFilter').value = categorySlug;
                this.currentPage = 1;
                this.loadResources();
            });
        });
    }

    populateCategoryFilter(categories) {
        const select = document.getElementById('categoryFilter');
        if (!select) return;

        const options = categories.map(category => 
            `<option value="${category.slug}">${category.name}</option>`
        ).join('');

        select.innerHTML = '<option value="">Todas las categorías</option>' + options;
    }

    renderResources(resources) {
        const container = document.getElementById('publicResourcesGrid');
        if (!container) return;

        if (resources.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                    <h3 class="text-xl font-semibold text-gray-600 mb-2">No se encontraron recursos</h3>
                    <p class="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
            `;
            return;
        }

        container.innerHTML = resources.map(resource => `
            <div class="resource-card" data-resource-slug="${resource.slug}">
                <div class="resource-header">
                    <div class="resource-type">
                        <i class="fas ${this.getTypeIcon(resource.type)}"></i>
                        <span>${this.getTypeLabel(resource.type)}</span>
                    </div>
                    <div class="resource-category" style="color: ${this.getCategoryColor(resource.category_slug)};">
                        ${resource.category_name}
                    </div>
                </div>
                
                <div class="resource-content">
                    <h3 class="resource-title">${resource.title}</h3>
                    <p class="resource-summary">${resource.summary}</p>
                    
                    <div class="resource-meta">
                        <div class="resource-author">
                            <i class="fas fa-user-circle mr-1"></i>
                            <span>${resource.author}</span>
                        </div>
                        <div class="resource-institution">
                            <i class="fas fa-university mr-1"></i>
                            <span>${resource.author_institution}</span>
                        </div>
                        <div class="resource-date">
                            <i class="fas fa-calendar mr-1"></i>
                            <span>${this.formatDate(resource.publication_date)}</span>
                        </div>
                        <div class="resource-language">
                            <i class="fas fa-language mr-1"></i>
                            <span>${resource.language}</span>
                        </div>
                    </div>
                    
                    ${resource.file_type ? `
                        <div class="resource-file-info">
                            <i class="fas fa-file mr-1"></i>
                            <span>${resource.file_type.toUpperCase()}</span>
                            ${resource.file_size ? `<span class="text-gray-500 ml-2">(${this.formatFileSize(resource.file_size)})</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="resource-stats">
                        <span class="stat-item">
                            <i class="fas fa-eye"></i>
                            ${resource.views_count} vistas
                        </span>
                        <span class="stat-item">
                            <i class="fas fa-download"></i>
                            ${resource.downloads_count} descargas
                        </span>
                    </div>
                    
                    <div class="resource-tags">
                        ${resource.keywords.slice(0, 3).map(keyword => 
                            `<span class="tag">${keyword}</span>`
                        ).join('')}
                        ${resource.keywords.length > 3 ? '<span class="tag-more">+más</span>' : ''}
                    </div>
                </div>
                
                <div class="resource-actions">
                    <button class="btn btn-primary btn-sm view-resource-btn">
                        <i class="fas fa-eye mr-2"></i>
                        Ver Detalles
                    </button>
                    ${resource.external_url ? `
                        <a href="${resource.external_url}" target="_blank" class="btn btn-secondary btn-sm">
                            <i class="fas fa-external-link-alt mr-2"></i>
                            Acceder
                        </a>
                    ` : ''}
                </div>
            </div>
        `).join('');

        // Bind resource click events
        container.querySelectorAll('.view-resource-btn').forEach((btn, index) => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const resourceSlug = resources[index].slug;
                this.showResourceDetails(resourceSlug);
            });
        });
    }

    renderPagination(pagination) {
        const container = document.getElementById('resourcesPagination');
        if (!container) return;

        const { pages, total, limit, offset } = pagination;
        const currentPage = Math.floor(offset / limit) + 1;

        if (pages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHtml = '<div class="pagination">';
        
        // Previous button
        if (currentPage > 1) {
            paginationHtml += `<button class="pagination-btn" data-page="${currentPage - 1}">
                <i class="fas fa-chevron-left"></i>
            </button>`;
        }

        // Page numbers
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(pages, startPage + 4);

        if (startPage > 1) {
            paginationHtml += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHtml += `<span class="pagination-dots">...</span>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < pages) {
            if (endPage < pages - 1) {
                paginationHtml += `<span class="pagination-dots">...</span>`;
            }
            paginationHtml += `<button class="pagination-btn" data-page="${pages}">${pages}</button>`;
        }

        // Next button
        if (currentPage < pages) {
            paginationHtml += `<button class="pagination-btn" data-page="${currentPage + 1}">
                <i class="fas fa-chevron-right"></i>
            </button>`;
        }

        paginationHtml += '</div>';
        container.innerHTML = paginationHtml;

        // Bind pagination events
        container.querySelectorAll('.pagination-btn[data-page]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const page = parseInt(e.currentTarget.dataset.page);
                this.currentPage = page;
                this.loadResources();
            });
        });
    }

    updateResultsInfo(pagination) {
        const info = document.getElementById('resultsInfo');
        if (!info) return;

        const { total, limit, offset } = pagination;
        const start = offset + 1;
        const end = Math.min(offset + limit, total);

        info.textContent = `Mostrando ${start}-${end} de ${total} recursos`;
    }

    async showResourceDetails(slug) {
        try {
            const response = await axios.get(`/api/public/resources/${slug}`);
            
            if (response.data.success) {
                const resource = response.data.data;
                this.renderResourceModal(resource);
                this.showResourceModal();
            }
        } catch (error) {
            console.error('Error loading resource details:', error);
            this.showError('Error loading resource details.');
        }
    }

    renderResourceModal(resource) {
        const titleEl = document.getElementById('resourceModalTitle');
        const contentEl = document.getElementById('resourceModalContent');
        
        if (titleEl) titleEl.textContent = resource.title;
        
        if (contentEl) {
            contentEl.innerHTML = `
                <div class="resource-modal-content">
                    <div class="resource-modal-header">
                        <div class="resource-modal-meta">
                            <div class="meta-item">
                                <i class="fas fa-tag text-primary"></i>
                                <span>${this.getTypeLabel(resource.type)} - ${resource.category_name}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-user-circle text-primary"></i>
                                <span>${resource.author}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-university text-primary"></i>
                                <span>${resource.author_institution}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-calendar text-primary"></i>
                                <span>${this.formatDate(resource.publication_date)}</span>
                            </div>
                            <div class="meta-item">
                                <i class="fas fa-language text-primary"></i>
                                <span>${resource.language}</span>
                            </div>
                        </div>
                        
                        ${resource.file_type || resource.external_url ? `
                            <div class="resource-modal-actions">
                                ${resource.file_url ? `
                                    <button class="btn btn-primary" onclick="window.publicResourcesPortal.downloadResource('${resource.slug}', '${resource.file_url}')">
                                        <i class="fas fa-download mr-2"></i>
                                        Descargar ${resource.file_type ? resource.file_type.toUpperCase() : 'Archivo'}
                                        ${resource.file_size ? `(${this.formatFileSize(resource.file_size)})` : ''}
                                    </button>
                                ` : ''}
                                ${resource.external_url ? `
                                    <a href="${resource.external_url}" target="_blank" class="btn btn-secondary">
                                        <i class="fas fa-external-link-alt mr-2"></i>
                                        Acceder al Recurso
                                    </a>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="resource-modal-description">
                        <h4>Descripción</h4>
                        <div class="content">${resource.description}</div>
                    </div>
                    
                    <div class="resource-modal-summary">
                        <h4>Resumen</h4>
                        <p>${resource.summary}</p>
                    </div>
                    
                    ${resource.keywords && resource.keywords.length > 0 ? `
                        <div class="resource-modal-keywords">
                            <h4>Palabras Clave</h4>
                            <div class="keywords-list">
                                ${resource.keywords.map(keyword => `<span class="keyword-tag">${keyword}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="resource-modal-stats">
                        <div class="stat-item">
                            <i class="fas fa-eye text-primary"></i>
                            <span>${resource.views_count} visualizaciones</span>
                        </div>
                        <div class="stat-item">
                            <i class="fas fa-download text-primary"></i>
                            <span>${resource.downloads_count} descargas</span>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    async downloadResource(slug, fileUrl) {
        try {
            // Track download
            await axios.post(`/api/public/resources/${slug}/download`);
            
            // Trigger download
            if (fileUrl) {
                window.open(fileUrl, '_blank');
            }
        } catch (error) {
            console.error('Error tracking download:', error);
            // Still allow download even if tracking fails
            if (fileUrl) {
                window.open(fileUrl, '_blank');
            }
        }
    }

    clearFilters() {
        this.currentFilters = {
            search: '',
            type: '',
            category: '',
            author: '',
            sort: 'publication_date',
            order: 'desc'
        };
        this.currentPage = 1;

        // Reset form inputs
        document.getElementById('searchInput').value = '';
        document.getElementById('typeFilter').value = '';
        document.getElementById('categoryFilter').value = '';
        document.getElementById('sortFilter').value = 'publication_date-desc';

        this.loadResources();
    }

    showLoginModal() {
        document.getElementById('loginModal').style.display = 'flex';
    }

    hideLoginModal() {
        document.getElementById('loginModal').style.display = 'none';
    }

    showResourceModal() {
        document.getElementById('resourceModal').style.display = 'flex';
    }

    hideResourceModal() {
        document.getElementById('resourceModal').style.display = 'none';
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showError('Por favor completa todos los campos');
            return;
        }

        try {
            const response = await axios.post('/api/auth/login', { email, password });
            
            if (response.data.success) {
                this.hideLoginModal();
                window.location.href = '/dashboard';
            } else {
                this.showError(response.data.error || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Error al iniciar sesión. Verifica tus credenciales.');
        }
    }

    showError(message) {
        // Simple error display - could be enhanced with a proper notification system
        alert(message);
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

    getCategoryColor(categorySlug) {
        const colors = {
            'documentos-cientificos': '#2563eb',
            'manuales-guias': '#059669',
            'datos-datasets': '#dc2626',
            'presentaciones': '#7c3aed',
            'software-herramientas': '#f59e0b'
        };
        return colors[categorySlug] || '#6b7280';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Make it globally accessible for download function
window.publicResourcesPortal = null;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    window.publicResourcesPortal = new PublicResourcesPortal();
});