// ================================
// HU-17: SISTEMA DE NOTIFICACIONES Y COMUNICACIÓN - TESTS
// ================================

import { TestClient, TestUtils, TEST_CONFIG } from './setup.js';

export class NotificationsTests {
  constructor() {
    this.client = new TestClient();
    this.adminToken = null;
    this.testNotificationId = null;
    this.testConversationId = null;
    this.testMessageId = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('\n🔔 === HU-17: SISTEMA DE NOTIFICACIONES - PRUEBAS ===\n');
    
    // Primero hacer login como admin
    await this.loginAsAdmin();
    
    const tests = [
      { name: 'Test Listar Notificaciones', method: 'testListNotifications' },
      { name: 'Test Crear Notificación', method: 'testCreateNotification' },
      { name: 'Test Marcar Notificación como Leída', method: 'testMarkNotificationRead' },
      { name: 'Test Contador No Leídas', method: 'testUnreadCount' },
      { name: 'Test Preferencias de Usuario', method: 'testNotificationPreferences' },
      { name: 'Test Listar Conversaciones', method: 'testListConversations' },
      { name: 'Test Crear Conversación', method: 'testCreateConversation' },
      { name: 'Test Enviar Mensaje', method: 'testSendMessage' },
      { name: 'Test Listar Mensajes', method: 'testListMessages' },
      { name: 'Test Búsqueda de Usuarios', method: 'testUserSearch' },
      { name: 'Test Plantillas Admin', method: 'testNotificationTemplates' },
      { name: 'Test Estadísticas Comunicación', method: 'testCommunicationStats' }
    ];

    for (const test of tests) {
      try {
        TestUtils.logTestStart(test.name);
        await this[test.method]();
        this.results.passed++;
        TestUtils.logTestEnd(test.name, true);
      } catch (error) {
        this.results.failed++;
        this.results.errors.push({
          test: test.name,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        TestUtils.logError(test.name, error);
        TestUtils.logTestEnd(test.name, false);
      }
      
      await TestUtils.delay(500);
    }

    return this.results;
  }

  async loginAsAdmin() {
    const response = await this.client.post('/api/auth/login', {
      email: TEST_CONFIG.users.admin.email,
      password: TEST_CONFIG.users.admin.password
    });
    
    if (!response.success) {
      throw new Error('Admin login failed for notifications tests');
    }
    
    this.client.setToken(response.token);
    this.adminToken = response.token;
  }

  async testListNotifications() {
    const response = await this.client.get('/api/notifications');
    
    if (!response.success) {
      throw new Error('Failed to list notifications');
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Notifications data should be an array');
    }
    
    // Validar estructura si hay notificaciones
    if (response.data.length > 0) {
      const notification = response.data[0];
      TestUtils.validateStructure(notification, TEST_CONFIG.expectedStructures.notification, 'notification');
    }
    
    this.client.logger.success('Notifications list retrieved successfully', {
      count: response.data.length
    });
  }

  async testCreateNotification() {
    const notificationData = {
      user_id: 1, // Admin user
      title: `Test Notification ${TestUtils.generateRandomString()}`,
      message: 'This is a test notification created by automated testing',
      type: 'info',
      priority: 'medium',
      delivery_method: ['in_app', 'email'],
      related_entity_type: 'system',
      action_url: '/dashboard'
    };

    const response = await this.client.post('/api/notifications', notificationData);
    
    if (!response.success) {
      throw new Error(`Failed to create notification: ${response.error}`);
    }
    
    if (!response.data || !response.data.id) {
      throw new Error('Created notification should have ID');
    }
    
    // Guardar ID para tests posteriores
    this.testNotificationId = response.data.id;
    
    this.client.logger.success('Notification created successfully', {
      notificationId: this.testNotificationId,
      title: notificationData.title
    });
  }

  async testMarkNotificationRead() {
    if (!this.testNotificationId) {
      throw new Error('No test notification ID available');
    }
    
    const response = await this.client.patch(`/api/notifications/${this.testNotificationId}/read`);
    
    if (!response.success) {
      throw new Error('Failed to mark notification as read');
    }
    
    this.client.logger.success('Notification marked as read successfully', {
      notificationId: this.testNotificationId
    });
  }

  async testUnreadCount() {
    const response = await this.client.get('/api/unread-count');
    
    if (!response.success) {
      throw new Error('Failed to get unread count');
    }
    
    if (!response.data || typeof response.data.unread_count !== 'number') {
      throw new Error('Unread count should be a number');
    }
    
    this.client.logger.success('Unread count retrieved successfully', {
      count: response.data.unread_count
    });
  }

  async testNotificationPreferences() {
    // Test obtener preferencias
    const getResponse = await this.client.get('/api/preferences');
    
    if (!getResponse.success) {
      throw new Error('Failed to get notification preferences');
    }
    
    // Test actualizar preferencias
    const updateData = {
      email_enabled: true,
      push_enabled: false,
      sms_enabled: false,
      in_app_enabled: true,
      frequency: 'daily',
      quiet_hours_start: '23:00',
      quiet_hours_end: '08:00',
      categories: {
        projects: true,
        events: false,
        publications: true,
        messages: true,
        system: true
      }
    };
    
    const updateResponse = await this.client.patch('/api/preferences', updateData);
    
    if (!updateResponse.success) {
      throw new Error('Failed to update notification preferences');
    }
    
    this.client.logger.success('Notification preferences managed successfully');
  }

  async testListConversations() {
    const response = await this.client.get('/api/conversations');
    
    if (!response.success) {
      throw new Error('Failed to list conversations');
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Conversations data should be an array');
    }
    
    // Validar estructura si hay conversaciones
    if (response.data.length > 0) {
      const conversation = response.data[0];
      TestUtils.validateStructure(conversation, TEST_CONFIG.expectedStructures.conversation, 'conversation');
    }
    
    this.client.logger.success('Conversations list retrieved successfully', {
      count: response.data.length
    });
  }

  async testCreateConversation() {
    const conversationData = {
      title: `Test Conversation ${TestUtils.generateRandomString()}`,
      type: 'group',
      participants: [1, 2] // Admin y otro usuario
    };

    const response = await this.client.post('/api/conversations', conversationData);
    
    if (!response.success) {
      throw new Error(`Failed to create conversation: ${response.error}`);
    }
    
    if (!response.data || !response.data.id) {
      throw new Error('Created conversation should have ID');
    }
    
    // Guardar ID para tests posteriores
    this.testConversationId = response.data.id;
    
    this.client.logger.success('Conversation created successfully', {
      conversationId: this.testConversationId,
      title: conversationData.title
    });
  }

  async testSendMessage() {
    if (!this.testConversationId) {
      // Crear conversación si no existe
      await this.testCreateConversation();
    }
    
    const messageData = {
      content: `Test message ${TestUtils.generateRandomString()}`,
      message_type: 'text'
    };

    const response = await this.client.post(`/api/conversations/${this.testConversationId}/messages`, messageData);
    
    if (!response.success) {
      throw new Error(`Failed to send message: ${response.error}`);
    }
    
    if (!response.data || !response.data.id) {
      throw new Error('Sent message should have ID');
    }
    
    this.testMessageId = response.data.id;
    
    this.client.logger.success('Message sent successfully', {
      messageId: this.testMessageId,
      conversationId: this.testConversationId
    });
  }

  async testListMessages() {
    if (!this.testConversationId) {
      throw new Error('No test conversation ID available');
    }
    
    const response = await this.client.get(`/api/conversations/${this.testConversationId}/messages`);
    
    if (!response.success) {
      throw new Error('Failed to list messages');
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Messages data should be an array');
    }
    
    // Validar estructura si hay mensajes
    if (response.data.length > 0) {
      const message = response.data[0];
      TestUtils.validateStructure(message, TEST_CONFIG.expectedStructures.message, 'message');
    }
    
    this.client.logger.success('Messages list retrieved successfully', {
      count: response.data.length,
      conversationId: this.testConversationId
    });
  }

  async testUserSearch() {
    const response = await this.client.get('/api/users/search?q=admin');
    
    if (!response.success) {
      throw new Error('Failed to search users');
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('User search results should be an array');
    }
    
    this.client.logger.success('User search completed successfully', {
      resultsCount: response.data.length
    });
  }

  async testNotificationTemplates() {
    // Test listar plantillas (solo admin)
    const listResponse = await this.client.get('/api/templates');
    
    if (!listResponse.success) {
      throw new Error('Failed to list notification templates');
    }
    
    // Test crear plantilla
    const templateData = {
      name: `test_template_${TestUtils.generateRandomString()}`,
      subject: 'Test Template Subject',
      body: 'This is a test template: {{variable}}',
      type: 'email',
      variables: ['variable', 'user_name']
    };
    
    const createResponse = await this.client.post('/api/templates', templateData);
    
    if (!createResponse.success) {
      throw new Error(`Failed to create notification template: ${createResponse.error}`);
    }
    
    this.client.logger.success('Notification templates managed successfully');
  }

  async testCommunicationStats() {
    const response = await this.client.get('/api/stats');
    
    if (!response.success) {
      throw new Error('Failed to get communication stats');
    }
    
    if (!response.data) {
      throw new Error('Communication stats data missing');
    }
    
    // Verificar campos esperados en estadísticas
    const expectedFields = ['total_notifications', 'total_messages', 'active_conversations'];
    for (const field of expectedFields) {
      if (typeof response.data[field] !== 'number') {
        throw new Error(`Missing or invalid stat field: ${field}`);
      }
    }
    
    this.client.logger.success('Communication stats retrieved successfully', {
      totalNotifications: response.data.total_notifications,
      totalMessages: response.data.total_messages,
      activeConversations: response.data.active_conversations
    });
  }

  getResults() {
    return {
      hu: 'HU-17',
      name: 'Sistema de Notificaciones y Comunicación',
      ...this.results,
      total: this.results.passed + this.results.failed
    };
  }
}

export default NotificationsTests;