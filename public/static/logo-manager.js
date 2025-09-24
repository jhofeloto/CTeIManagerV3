// CODECTI Platform - Logo Manager

const LogoManager = {
  settings: null,
  
  async loadSettings() {
    try {
      const response = await axios.get('/api/settings/logo');
      if (response.data.success) {
        this.settings = response.data.data;
        return this.settings;
      }
    } catch (error) {
      console.error('Error loading logo settings:', error);
      // Return default settings
      this.settings = {
        enabled: false,
        url: '/static/logo-choco-inventa.png',
        alt: 'Choco Inventa',
        fallbackText: 'CODECTI Chocó'
      };
      return this.settings;
    }
  },

  async renderLogo(containerSelector, options = {}) {
    if (!this.settings) {
      await this.loadSettings();
    }

    const container = document.querySelector(containerSelector);
    if (!container) return;

    const {
      showText = true,
      textClass = 'text-xl font-bold',
      logoClass = 'h-12 mr-3',
      containerClass = 'logo-container flex items-center'
    } = options;

    container.className = containerClass;

    if (this.settings.enabled && this.settings.url) {
      // Show logo with optional text
      container.innerHTML = `
        <img src="${this.settings.url}" 
             alt="${this.settings.alt}" 
             class="${logoClass}"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
        <div class="${showText ? '' : 'hidden'}" style="${this.settings.enabled ? 'display:block' : 'display:block'}">
          <h1 class="${textClass}">${this.settings.fallbackText}</h1>
        </div>
      `;
    } else {
      // Show only text
      container.innerHTML = `
        <div>
          <h1 class="${textClass}">${this.settings.fallbackText}</h1>
        </div>
      `;
    }
  },

  async renderNavbarLogo() {
    await this.renderLogo('.navbar-logo', {
      showText: true,
      textClass: 'text-xl font-bold text-white',
      logoClass: 'h-8 mr-2',
      containerClass: 'navbar-logo flex items-center'
    });
  },

  async renderHeroLogo() {
    await this.renderLogo('.hero-logo', {
      showText: true,
      textClass: 'text-4xl md:text-5xl font-bold text-gray-900 mb-4',
      logoClass: 'h-16 md:h-20 mr-4',
      containerClass: 'hero-logo flex items-center justify-center'
    });
  },

  async renderFooterLogo() {
    await this.renderLogo('.footer-logo', {
      showText: true,
      textClass: 'text-lg font-bold text-gray-800',
      logoClass: 'h-8 mr-2',
      containerClass: 'footer-logo flex items-center'
    });
  },

  // Admin function to update logo settings
  async updateLogoSettings(settings) {
    try {
      const token = App.token || localStorage.getItem('codecti_token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      const response = await axios.put('/api/settings/logo', settings, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        this.settings = response.data.data;
        
        // Re-render all logos on the page
        await this.refreshAllLogos();
        
        return response.data;
      }
    } catch (error) {
      console.error('Error updating logo settings:', error);
      throw error;
    }
  },

  async refreshAllLogos() {
    // Re-render all logo instances
    const logoContainers = [
      '.navbar-logo',
      '.hero-logo', 
      '.footer-logo',
      '.admin-logo'
    ];

    for (const selector of logoContainers) {
      const element = document.querySelector(selector);
      if (element) {
        if (selector === '.navbar-logo') {
          await this.renderNavbarLogo();
        } else if (selector === '.hero-logo') {
          await this.renderHeroLogo();
        } else if (selector === '.footer-logo') {
          await this.renderFooterLogo();
        } else {
          await this.renderLogo(selector);
        }
      }
    }
  },

  // Create logo configuration modal for admin
  showLogoConfigModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Configuración del Logo</h3>
          <button onclick="this.closest('.fixed').remove()" class="text-gray-500 hover:text-gray-700">
            <i class="fas fa-times"></i>
          </button>
        </div>
        
        <form id="logoConfigForm">
          <div class="mb-4">
            <label class="flex items-center">
              <input type="checkbox" id="logoEnabled" ${this.settings?.enabled ? 'checked' : ''} class="mr-2">
              Habilitar logo
            </label>
          </div>
          
          <div id="logoFields" class="${this.settings?.enabled ? '' : 'hidden'}">
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">URL del logo</label>
              <input type="url" id="logoUrl" value="${this.settings?.url || ''}" 
                     class="form-input w-full" placeholder="https://ejemplo.com/logo.png">
            </div>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 mb-1">Texto alternativo</label>
              <input type="text" id="logoAlt" value="${this.settings?.alt || ''}" 
                     class="form-input w-full" placeholder="Descripción del logo">
            </div>
          </div>
          
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-1">Texto de respaldo</label>
            <input type="text" id="fallbackText" value="${this.settings?.fallbackText || ''}" 
                   class="form-input w-full" placeholder="Texto cuando no hay logo">
          </div>
          
          <div class="flex space-x-3">
            <button type="button" onclick="LogoManager.saveLogoConfig()" 
                    class="btn btn-primary flex-1">Guardar</button>
            <button type="button" onclick="this.closest('.fixed').remove()" 
                    class="btn btn-secondary">Cancelar</button>
          </div>
        </form>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Toggle logo fields based on checkbox
    document.getElementById('logoEnabled').addEventListener('change', function() {
      const fields = document.getElementById('logoFields');
      if (this.checked) {
        fields.classList.remove('hidden');
      } else {
        fields.classList.add('hidden');
      }
    });
  },

  async saveLogoConfig() {
    try {
      const enabled = document.getElementById('logoEnabled').checked;
      const url = document.getElementById('logoUrl').value;
      const alt = document.getElementById('logoAlt').value;
      const fallbackText = document.getElementById('fallbackText').value;

      if (enabled && !url) {
        App.showNotification('URL del logo es requerida cuando está habilitado', 'error');
        return;
      }

      if (!fallbackText) {
        App.showNotification('Texto de respaldo es requerido', 'error');
        return;
      }

      const result = await this.updateLogoSettings({
        enabled,
        url,
        alt,
        fallbackText
      });

      App.showNotification('Configuración del logo actualizada exitosamente', 'success');
      
      // Close modal
      document.querySelector('.fixed.inset-0').remove();
      
    } catch (error) {
      App.showNotification('Error al guardar configuración del logo', 'error');
    }
  }
};

// Auto-initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  LogoManager.loadSettings();
});