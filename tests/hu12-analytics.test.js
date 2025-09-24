import { TestClient, TestUtils, TestLogger } from './setup.js';

/**
 * HU-12: Sistema de Analytics - Pruebas Unitarias
 * 
 * Funcionalidades a probar:
 * 1. Métricas de usuarios y actividad
 * 2. Reportes de contenido
 * 3. Estadísticas de eventos
 * 4. Analytics de recursos
 * 5. Dashboards y visualizaciones
 * 6. Exportación de datos
 * 7. Filtros temporales
 * 8. Métricas en tiempo real
 */

class AnalyticsSystemTests {
  constructor() {
    this.client = new TestClient();
    this.utils = new TestUtils();
    this.logger = new TestLogger('HU-12-Analytics');
    this.testData = {
      adminToken: null,
      userToken: null
    };
  }

  static expectedStructures = {
    userMetrics: ['total_users', 'active_users', 'new_users', 'user_growth'],
    contentMetrics: ['total_content', 'published_content', 'draft_content', 'views', 'engagement'],
    eventMetrics: ['total_events', 'upcoming_events', 'past_events', 'registrations', 'attendance_rate'],
    resourceMetrics: ['total_resources', 'downloads', 'popular_resources', 'categories_distribution'],
    dashboard: ['users', 'content', 'events', 'resources', 'recent_activity']
  };

  async runAllTests() {
    this.logger.info('=== INICIANDO PRUEBAS HU-12: SISTEMA DE ANALYTICS ===');
    
    try {
      await this.setupTestData();
      await this.testUserMetrics();
      await this.testContentMetrics();
      await this.testEventMetrics();
      await this.testResourceMetrics();
      await this.testDashboard();
      await this.testExportData();
      await this.testDateFilters();
      await this.testRealTimeMetrics();
      await this.testAccessControl();

      this.logger.success('=== TODAS LAS PRUEBAS DE HU-12 COMPLETADAS ===');
      return { success: true, errors: this.logger.getErrors() };
    } catch (error) {
      this.logger.error('Error general en pruebas HU-12', error);
      return { success: false, errors: this.logger.getErrors() };
    }
  }

  async setupTestData() {
    this.logger.info('Configurando datos de prueba...');
    
    const adminLogin = await this.client.post('/api/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });

    const userLogin = await this.client.post('/api/auth/login', {
      email: 'user@test.com',
      password: 'user123'
    });

    this.testData.adminToken = adminLogin.data?.token;
    this.testData.userToken = userLogin.data?.token;

    if (!this.testData.adminToken) {
      throw new Error('No se pudo obtener token de administrador para pruebas');
    }
  }

  async testUserMetrics() {
    this.logger.info('Probando métricas de usuarios...');

    const response = await this.client.get('/api/analytics/users', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener métricas de usuarios');
    this.utils.validateStructure(response.data, AnalyticsSystemTests.expectedStructures.userMetrics);
    this.logger.success('✅ Métricas de usuarios obtenidas correctamente');
  }

  async testContentMetrics() {
    this.logger.info('Probando métricas de contenido...');

    const response = await this.client.get('/api/analytics/content', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener métricas de contenido');
    this.utils.validateStructure(response.data, AnalyticsSystemTests.expectedStructures.contentMetrics);
    this.logger.success('✅ Métricas de contenido obtenidas correctamente');
  }

  async testEventMetrics() {
    this.logger.info('Probando métricas de eventos...');

    const response = await this.client.get('/api/analytics/events', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener métricas de eventos');
    this.utils.validateStructure(response.data, AnalyticsSystemTests.expectedStructures.eventMetrics);
    this.logger.success('✅ Métricas de eventos obtenidas correctamente');
  }

  async testResourceMetrics() {
    this.logger.info('Probando métricas de recursos...');

    const response = await this.client.get('/api/analytics/resources', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener métricas de recursos');
    this.utils.validateStructure(response.data, AnalyticsSystemTests.expectedStructures.resourceMetrics);
    this.logger.success('✅ Métricas de recursos obtenidas correctamente');
  }

  async testDashboard() {
    this.logger.info('Probando dashboard principal...');

    const response = await this.client.get('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener dashboard');
    this.utils.validateStructure(response.data, AnalyticsSystemTests.expectedStructures.dashboard);
    this.logger.success('✅ Dashboard obtenido correctamente');
  }

  async testExportData() {
    this.logger.info('Probando exportación de datos...');

    const response = await this.client.get('/api/analytics/export?format=csv&type=users', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al exportar datos');
    this.logger.success('✅ Exportación de datos funciona correctamente');
  }

  async testDateFilters() {
    this.logger.info('Probando filtros de fecha...');

    const response = await this.client.get('/api/analytics/users?start_date=2024-01-01&end_date=2024-12-31', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error con filtros de fecha');
    this.logger.success('✅ Filtros de fecha funcionan correctamente');
  }

  async testRealTimeMetrics() {
    this.logger.info('Probando métricas en tiempo real...');

    const response = await this.client.get('/api/analytics/realtime', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener métricas en tiempo real');
    this.logger.success('✅ Métricas en tiempo real funcionan correctamente');
  }

  async testAccessControl() {
    this.logger.info('Probando control de acceso...');

    const response = await this.client.get('/api/analytics/dashboard', {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 403, null, true);
    this.logger.success('✅ Control de acceso funciona correctamente');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new AnalyticsSystemTests();
  tests.runAllTests().then(result => {
    console.log('Resultado de pruebas HU-12:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando pruebas HU-12:', error);
    process.exit(1);
  });
}

export { AnalyticsSystemTests };