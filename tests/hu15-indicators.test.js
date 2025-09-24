import { TestClient, TestUtils, TestLogger } from './setup.js';

/**
 * HU-15: Sistema de Indicadores - Pruebas Unitarias
 */

class IndicatorsSystemTests {
  constructor() {
    this.client = new TestClient();
    this.utils = new TestUtils();
    this.logger = new TestLogger('HU-15-Indicators');
    this.testData = {
      adminToken: null,
      indicator: null
    };
  }

  static expectedStructures = {
    indicator: ['id', 'name', 'description', 'type', 'value', 'target', 'unit', 'category', 'status', 'updated_at'],
    kpi: ['id', 'name', 'current_value', 'target_value', 'percentage', 'trend', 'period'],
    dashboard: ['performance_indicators', 'kpis', 'alerts', 'trends']
  };

  async runAllTests() {
    this.logger.info('=== INICIANDO PRUEBAS HU-15: SISTEMA DE INDICADORES ===');
    
    try {
      await this.setupTestData();
      await this.testCreateIndicator();
      await this.testGetIndicators();
      await this.testUpdateIndicatorValue();
      await this.testGetKPIs();
      await this.testIndicatorsDashboard();
      await this.testPerformanceAlerts();
      await this.testTrendAnalysis();
      await this.testDeleteIndicator();

      this.logger.success('=== TODAS LAS PRUEBAS DE HU-15 COMPLETADAS ===');
      return { success: true, errors: this.logger.getErrors() };
    } catch (error) {
      this.logger.error('Error general en pruebas HU-15', error);
      return { success: false, errors: this.logger.getErrors() };
    }
  }

  async setupTestData() {
    this.logger.info('Configurando datos de prueba...');
    
    const adminLogin = await this.client.post('/api/auth/login', {
      email: 'admin@test.com',
      password: 'admin123'
    });

    this.testData.adminToken = adminLogin.data?.token;
  }

  async testCreateIndicator() {
    this.logger.info('Probando creación de indicadores...');

    const indicatorData = {
      name: 'Usuarios Activos Mensuales',
      description: 'Número de usuarios que han iniciado sesión en los últimos 30 días',
      type: 'counter',
      target: 1000,
      unit: 'usuarios',
      category: 'Engagement',
      calculation_method: 'COUNT_DISTINCT',
      data_source: 'user_sessions'
    };

    const response = await this.client.post('/api/indicators', indicatorData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear indicador');
    this.utils.validateStructure(response.data, IndicatorsSystemTests.expectedStructures.indicator);
    this.testData.indicator = response.data;
    this.logger.success('✅ Indicador creado correctamente');
  }

  async testGetIndicators() {
    this.logger.info('Probando obtención de indicadores...');

    const response = await this.client.get('/api/indicators', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener indicadores');
    this.utils.validateArray(response.data, 'indicadores');
    this.logger.success('✅ Indicadores obtenidos correctamente');
  }

  async testUpdateIndicatorValue() {
    this.logger.info('Probando actualización de valor de indicador...');

    const response = await this.client.post(`/api/indicators/${this.testData.indicator.id}/update-value`, {
      value: 850,
      timestamp: new Date().toISOString()
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al actualizar valor');
    this.logger.success('✅ Valor de indicador actualizado correctamente');
  }

  async testGetKPIs() {
    this.logger.info('Probando obtención de KPIs...');

    const response = await this.client.get('/api/indicators/kpis', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener KPIs');
    this.utils.validateArray(response.data, 'KPIs');
    
    if (response.data.length > 0) {
      this.utils.validateStructure(response.data[0], IndicatorsSystemTests.expectedStructures.kpi);
    }
    
    this.logger.success('✅ KPIs obtenidos correctamente');
  }

  async testIndicatorsDashboard() {
    this.logger.info('Probando dashboard de indicadores...');

    const response = await this.client.get('/api/indicators/dashboard', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener dashboard');
    this.utils.validateStructure(response.data, IndicatorsSystemTests.expectedStructures.dashboard);
    this.logger.success('✅ Dashboard de indicadores obtenido correctamente');
  }

  async testPerformanceAlerts() {
    this.logger.info('Probando alertas de rendimiento...');

    const response = await this.client.get('/api/indicators/alerts', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener alertas');
    this.utils.validateArray(response.data, 'alertas');
    this.logger.success('✅ Alertas de rendimiento obtenidas correctamente');
  }

  async testTrendAnalysis() {
    this.logger.info('Probando análisis de tendencias...');

    const response = await this.client.get(`/api/indicators/${this.testData.indicator.id}/trend?period=30d`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener tendencias');
    this.logger.success('✅ Análisis de tendencias funciona correctamente');
  }

  async testDeleteIndicator() {
    this.logger.info('Probando eliminación de indicadores...');

    const tempIndicator = await this.client.post('/api/indicators', {
      name: 'Indicador Temporal',
      description: 'Para eliminar',
      type: 'counter',
      target: 100,
      unit: 'unidades',
      category: 'Test'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    const response = await this.client.delete(`/api/indicators/${tempIndicator.data.id}`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al eliminar indicador');
    this.logger.success('✅ Indicador eliminado correctamente');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new IndicatorsSystemTests();
  tests.runAllTests().then(result => {
    console.log('Resultado de pruebas HU-15:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando pruebas HU-15:', error);
    process.exit(1);
  });
}

export { IndicatorsSystemTests };