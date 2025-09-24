// ================================
// HU-17: Sistema de Notificaciones y Comunicación Inteligente
// Frontend JavaScript para gestión completa de notificaciones y mensajería
// ================================

class NotificationSystem {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.notifications = [];
    this.conversations = [];
    this.messages = {};
    this.unreadCount = 0;
    this.isNotificationCenterOpen = false;
    this.isMessageCenterOpen = false;
    this.currentConversation = null;
    
    // WebSocket connection for real-time updates
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    
    this.init();
  }

  async init() {
    try {
      // Check authentication
      const token = localStorage.getItem('codecti-token');
      if (!token) {
        console.log('Usuario no autenticado');
        return;
      }

      this.isAuthenticated = true;
      await this.loadUserData();
      await this.createUI();
      await this.loadNotifications();
      await this.loadConversations();
      this.setupEventListeners();
      this.initializeWebSocket();
      this.startPeriodicUpdates();
    } catch (error) {
      console.error('Error initializing notification system:', error);
    }
  }

  async loadUserData() {
    try {
      const response = await axios.get('/api/auth/profile');
      if (response.data.success) {
        this.currentUser = response.data.user;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  createUI() {
    // Create floating action buttons
    this.createFloatingButtons();
    
    // Create notification center
    this.createNotificationCenter();
    
    // Create message center
    this.createMessageCenter();
    
    // Add CSS
    if (!document.querySelector('#notification-styles')) {
      const link = document.createElement('link');
      link.id = 'notification-styles';
      link.rel = 'stylesheet';
      link.href = '/static/notifications.css';
      document.head.appendChild(link);
    }
  }

  createFloatingButtons() {
    // Remove existing buttons
    const existing = document.querySelector('#notification-floating-actions');
    if (existing) existing.remove();

    const floatingActions = document.createElement('div');
    floatingActions.id = 'notification-floating-actions';
    floatingActions.className = 'floating-actions';
    
    floatingActions.innerHTML = `
      <button class="floating-btn notifications" id="toggleNotifications" title="Notificaciones">
        <i class="fas fa-bell"></i>
        <span class="notification-badge hidden" id="notificationBadge">0</span>
      </button>
      <button class="floating-btn messages" id="toggleMessages" title="Mensajes">
        <i class="fas fa-comments"></i>
        <span class="notification-badge hidden" id="messagesBadge">0</span>
      </button>
    `;
    
    document.body.appendChild(floatingActions);
  }

  createNotificationCenter() {
    // Remove existing center
    const existing = document.querySelector('#notification-center');
    if (existing) existing.remove();

    const notificationCenter = document.createElement('div');
    notificationCenter.id = 'notification-center';
    notificationCenter.className = 'notification-center';
    
    notificationCenter.innerHTML = `
      <div class="notification-center-header">
        <h3 class="notification-center-title">
          <i class="fas fa-bell mr-2"></i>
          Notificaciones
        </h3>
        <div class="notification-center-actions">
          <button class="btn btn-sm btn-white" id="markAllRead">
            <i class="fas fa-check mr-1"></i>
            Marcar todas como leídas
          </button>
          <button class="btn btn-sm btn-white" id="closeNotifications">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
      <div class="notification-center-body" id="notificationsList">
        <div class="text-center py-8">
          <div class="loading-spinner mx-auto mb-4"></div>
          <p class="text-gray-500">Cargando notificaciones...</p>
        </div>
      </div>
    `;
    
    document.body.appendChild(notificationCenter);
  }

  createMessageCenter() {
    // Remove existing center
    const existing = document.querySelector('#message-center');
    if (existing) existing.remove();

    const messageCenter = document.createElement('div');
    messageCenter.id = 'message-center';
    messageCenter.className = 'message-center';
    
    messageCenter.innerHTML = `
      <div class="message-center-header">
        <h3 class="message-center-title">
          <i class="fas fa-comments mr-2"></i>
          Mensajes
        </h3>
        <p class="message-center-subtitle">Comunicación en tiempo real</p>
        <button class="btn btn-sm btn-white mt-2" id="closeMessages">
          <i class="fas fa-times mr-1"></i>
          Cerrar
        </button>
      </div>
      <div class="message-center-body">
        <div id="conversationsView" class="conversations-list">
          <div class="text-center py-8">
            <div class="loading-spinner mx-auto mb-4"></div>
            <p class="text-gray-500">Cargando conversaciones...</p>
          </div>
        </div>
        <div id="chatView" class="hidden">
          <div class="messages-container" id="messagesContainer">
            <!-- Messages will be loaded here -->
          </div>
          <div class="message-input-container">
            <form class="message-input-form" id="messageForm">
              <textarea 
                id="messageInput" 
                class="message-input" 
                placeholder="Escribe tu mensaje..."
                rows="1"
              ></textarea>
              <button type="submit" class="message-send-btn" id="sendMessage">
                <i class="fas fa-paper-plane"></i>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(messageCenter);
  }

  setupEventListeners() {
    // Floating buttons
    document.getElementById('toggleNotifications').addEventListener('click', () => {
      this.toggleNotificationCenter();
    });

    document.getElementById('toggleMessages').addEventListener('click', () => {
      this.toggleMessageCenter();
    });

    // Notification center
    document.getElementById('markAllRead').addEventListener('click', () => {
      this.markAllNotificationsRead();
    });

    document.getElementById('closeNotifications').addEventListener('click', () => {
      this.closeNotificationCenter();
    });

    // Message center
    document.getElementById('closeMessages').addEventListener('click', () => {
      this.closeMessageCenter();
    });

    document.getElementById('messageForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.sendMessage();
    });

    // Auto-resize message input
    const messageInput = document.getElementById('messageInput');
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = messageInput.scrollHeight + 'px';
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      const notificationCenter = document.getElementById('notification-center');
      const messageCenter = document.getElementById('message-center');
      const floatingActions = document.getElementById('notification-floating-actions');
      
      if (!notificationCenter.contains(e.target) && 
          !floatingActions.contains(e.target) && 
          this.isNotificationCenterOpen) {
        this.closeNotificationCenter();
      }
    });
  }

  async loadNotifications() {
    try {
      const response = await axios.get('/api/notifications');
      if (response.data.success) {
        this.notifications = response.data.data;
        this.updateUnreadCount();
        this.renderNotifications();
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
      this.showToast('Error al cargar notificaciones', 'error');
    }
  }

  async loadConversations() {
    try {
      const response = await axios.get('/api/conversations');
      if (response.data.success) {
        this.conversations = response.data.data;
        this.renderConversations();
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      this.showToast('Error al cargar conversaciones', 'error');
    }
  }

  renderNotifications() {
    const container = document.getElementById('notificationsList');
    
    if (this.notifications.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-bell-slash"></i>
          <h3>No tienes notificaciones</h3>
          <p>Cuando recibas notificaciones aparecerán aquí</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.notifications.map(notification => `
      <div class="notification-item ${!notification.read_status ? 'unread' : ''}" 
           data-id="${notification.id}">
        <div class="notification-content">
          <div class="notification-title">${notification.title}</div>
          <div class="notification-message">${notification.message}</div>
          <div class="notification-meta">
            <span class="notification-type ${notification.type}">${notification.type}</span>
            <span class="notification-time">${this.formatTime(notification.created_at)}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers
    container.querySelectorAll('.notification-item').forEach(item => {
      item.addEventListener('click', () => {
        const notificationId = item.dataset.id;
        this.markNotificationRead(notificationId);
        
        const notification = this.notifications.find(n => n.id == notificationId);
        if (notification && notification.action_url) {
          window.location.href = notification.action_url;
        }
      });
    });
  }

  renderConversations() {
    const container = document.getElementById('conversationsView');
    
    if (this.conversations.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-comments"></i>
          <h3>No tienes conversaciones</h3>
          <p>Inicia una nueva conversación para comunicarte con otros usuarios</p>
          <button class="btn btn-primary mt-4" id="newConversation">
            <i class="fas fa-plus mr-2"></i>
            Nueva Conversación
          </button>
        </div>
      `;
      
      document.getElementById('newConversation').addEventListener('click', () => {
        this.showNewConversationDialog();
      });
      return;
    }

    container.innerHTML = `
      <div class="mb-4">
        <button class="btn btn-primary w-full" id="newConversation">
          <i class="fas fa-plus mr-2"></i>
          Nueva Conversación
        </button>
      </div>
      ${this.conversations.map(conversation => `
        <div class="conversation-item" data-id="${conversation.id}">
          <div class="conversation-avatar">
            ${this.getConversationInitials(conversation)}
          </div>
          <div class="conversation-content">
            <div class="conversation-title">${conversation.title || 'Conversación'}</div>
            <div class="conversation-preview">
              ${conversation.last_message || 'No hay mensajes aún'}
            </div>
          </div>
          <div class="conversation-meta">
            <div class="conversation-time">${this.formatTime(conversation.updated_at)}</div>
            ${conversation.unread_count > 0 ? `
              <div class="conversation-unread">${conversation.unread_count}</div>
            ` : ''}
          </div>
        </div>
      `).join('')}
    `;

    // Add click handlers
    document.getElementById('newConversation').addEventListener('click', () => {
      this.showNewConversationDialog();
    });

    container.querySelectorAll('.conversation-item').forEach(item => {
      item.addEventListener('click', () => {
        const conversationId = item.dataset.id;
        this.openConversation(conversationId);
      });
    });
  }

  async openConversation(conversationId) {
    try {
      this.currentConversation = conversationId;
      
      // Load messages
      const response = await axios.get(`/api/conversations/${conversationId}/messages`);
      if (response.data.success) {
        this.messages[conversationId] = response.data.data;
        this.renderMessages();
        this.showChatView();
      }
    } catch (error) {
      console.error('Error loading conversation:', error);
      this.showToast('Error al cargar conversación', 'error');
    }
  }

  renderMessages() {
    if (!this.currentConversation) return;
    
    const container = document.getElementById('messagesContainer');
    const messages = this.messages[this.currentConversation] || [];
    
    container.innerHTML = messages.map(message => `
      <div class="message-item ${message.sender_id === this.currentUser.id ? 'own' : ''}">
        <div class="message-avatar">
          ${this.getUserInitials(message.sender_name)}
        </div>
        <div class="message-content">
          <div class="message-text">${message.content}</div>
          <div class="message-time">${this.formatTime(message.created_at)}</div>
        </div>
      </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
  }

  async sendMessage() {
    if (!this.currentConversation) return;
    
    const input = document.getElementById('messageInput');
    const content = input.value.trim();
    
    if (!content) return;
    
    try {
      const response = await axios.post(`/api/conversations/${this.currentConversation}/messages`, {
        content,
        message_type: 'text'
      });
      
      if (response.data.success) {
        input.value = '';
        input.style.height = 'auto';
        
        // Add message to local array
        const newMessage = {
          id: response.data.data.id,
          content,
          sender_id: this.currentUser.id,
          sender_name: this.currentUser.name,
          created_at: new Date().toISOString()
        };
        
        if (!this.messages[this.currentConversation]) {
          this.messages[this.currentConversation] = [];
        }
        this.messages[this.currentConversation].push(newMessage);
        
        this.renderMessages();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.showToast('Error al enviar mensaje', 'error');
    }
  }

  showChatView() {
    document.getElementById('conversationsView').classList.add('hidden');
    document.getElementById('chatView').classList.remove('hidden');
    
    // Add back button to chat view
    const header = document.querySelector('.message-center-header');
    let backButton = document.getElementById('backToConversations');
    
    if (!backButton) {
      backButton = document.createElement('button');
      backButton.id = 'backToConversations';
      backButton.className = 'btn btn-sm btn-white mt-2 mr-2';
      backButton.innerHTML = '<i class="fas fa-arrow-left mr-1"></i> Volver';
      
      const closeButton = document.getElementById('closeMessages');
      header.insertBefore(backButton, closeButton);
      
      backButton.addEventListener('click', () => {
        this.showConversationsView();
      });
    }
  }

  showConversationsView() {
    document.getElementById('chatView').classList.add('hidden');
    document.getElementById('conversationsView').classList.remove('hidden');
    this.currentConversation = null;
    
    const backButton = document.getElementById('backToConversations');
    if (backButton) backButton.remove();
  }

  async markNotificationRead(notificationId) {
    try {
      await axios.patch(`/api/notifications/${notificationId}/read`);
      
      // Update local state
      const notification = this.notifications.find(n => n.id == notificationId);
      if (notification) {
        notification.read_status = true;
        notification.read_at = new Date().toISOString();
        this.updateUnreadCount();
        this.renderNotifications();
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async markAllNotificationsRead() {
    try {
      await axios.patch('/api/notifications/mark-all-read');
      
      // Update local state
      this.notifications.forEach(notification => {
        notification.read_status = true;
        notification.read_at = new Date().toISOString();
      });
      
      this.updateUnreadCount();
      this.renderNotifications();
      this.showToast('Todas las notificaciones marcadas como leídas', 'success');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      this.showToast('Error al marcar notificaciones', 'error');
    }
  }

  updateUnreadCount() {
    this.unreadCount = this.notifications.filter(n => !n.read_status).length;
    
    const badge = document.getElementById('notificationBadge');
    if (badge) {
      if (this.unreadCount > 0) {
        badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }
  }

  toggleNotificationCenter() {
    const center = document.getElementById('notification-center');
    
    if (this.isNotificationCenterOpen) {
      this.closeNotificationCenter();
    } else {
      center.classList.add('open');
      this.isNotificationCenterOpen = true;
      
      // Close message center if open
      if (this.isMessageCenterOpen) {
        this.closeMessageCenter();
      }
    }
  }

  closeNotificationCenter() {
    const center = document.getElementById('notification-center');
    center.classList.remove('open');
    this.isNotificationCenterOpen = false;
  }

  toggleMessageCenter() {
    const center = document.getElementById('message-center');
    
    if (this.isMessageCenterOpen) {
      this.closeMessageCenter();
    } else {
      center.classList.add('open');
      this.isMessageCenterOpen = true;
      
      // Close notification center if open
      if (this.isNotificationCenterOpen) {
        this.closeNotificationCenter();
      }
    }
  }

  closeMessageCenter() {
    const center = document.getElementById('message-center');
    center.classList.remove('open');
    this.isMessageCenterOpen = false;
    this.showConversationsView();
  }

  showNewConversationDialog() {
    // Implementation for creating new conversations
    this.showToast('Función de nueva conversación en desarrollo', 'info');
  }

  initializeWebSocket() {
    // WebSocket implementation for real-time updates
    // This would connect to a WebSocket server for real-time notifications
    console.log('WebSocket connection initialized');
  }

  startPeriodicUpdates() {
    // Poll for new notifications every 30 seconds
    setInterval(() => {
      if (this.isAuthenticated) {
        this.loadNotifications();
        this.updateUnreadCount();
      }
    }, 30000);
  }

  showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.notification-toast');
    if (existingToast) {
      existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `notification-toast ${type}`;
    toast.innerHTML = `
      <div class="flex items-center">
        <i class="fas ${this.getToastIcon(type)} mr-3"></i>
        <div class="flex-1">
          <p class="font-medium">${message}</p>
        </div>
        <button class="ml-2 text-gray-400 hover:text-gray-600" onclick="this.parentElement.parentElement.remove()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;

    document.body.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentElement) {
        toast.remove();
      }
    }, 5000);
  }

  getToastIcon(type) {
    const icons = {
      success: 'fa-check-circle',
      error: 'fa-exclamation-circle',
      warning: 'fa-exclamation-triangle',
      info: 'fa-info-circle'
    };
    return icons[type] || icons.info;
  }

  formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    
    return date.toLocaleDateString();
  }

  getConversationInitials(conversation) {
    if (conversation.title) {
      return conversation.title.substring(0, 2).toUpperCase();
    }
    return 'C';
  }

  getUserInitials(name) {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

// Initialize notification system when page loads
document.addEventListener('DOMContentLoaded', function() {
  // Only initialize if user is authenticated
  const token = localStorage.getItem('codecti-token');
  if (token) {
    window.notificationSystem = new NotificationSystem();
  }
});