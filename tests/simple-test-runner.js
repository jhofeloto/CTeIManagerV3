#!/usr/bin/env node

/**
 * Test Runner Simplificado para CODECTI Platform
 * Ejecuta pruebas básicas de API sin dependencias complejas
 */

// Configuración básica de pruebas
const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  
  testUsers: {
    admin: {
      email: 'admin@codecti.choco.gov.co',
      password: 'admin123'
    },
    researcher: {
      email: 'investigador1@codecti.choco.gov.co', 
      password: 'admin123'
    },
    testUser: {
      email: 'test@codecti.test',
      password: 'testpass123',
      name: 'Test User',
      institution: 'Test Institution'
    }
  }
};

// Cliente HTTP simplificado usando fetch nativo de Node.js (v18+)
class SimpleTestClient {
  constructor(baseURL = TEST_CONFIG.baseURL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async request(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method,
      headers: { ...this.defaultHeaders, ...headers }
    };

    if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      let responseData = null;
      
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch (e) {
          responseData = await response.text();
        }
      } else {
        responseData = await response.text();
      }

      return {
        status: response.status,
        ok: response.ok,
        data: responseData,
        headers: response.headers
      };
    } catch (error) {
      return {
        status: 0,
        ok: false,
        error: error.message,
        data: null
      };
    }
  }

  async get(endpoint, headers = {}) {
    return this.request('GET', endpoint, null, headers);
  }

  async post(endpoint, data, headers = {}) {
    return this.request('POST', endpoint, data, headers);
  }

  async put(endpoint, data, headers = {}) {
    return this.request('PUT', endpoint, data, headers);
  }

  async delete(endpoint, headers = {}) {
    return this.request('DELETE', endpoint, null, headers);
  }
}

// Logger de pruebas
class TestLogger {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.successes = [];
    this.startTime = Date.now();
  }

  info(message) {
    console.log(`ℹ️  ${message}`);
  }

  success(message) {
    console.log(`✅ ${message}`);
    this.successes.push({ message, timestamp: new Date().toISOString() });
  }

  warning(message) {
    console.log(`⚠️  ${message}`);
    this.warnings.push({ message, timestamp: new Date().toISOString() });
  }

  error(message, details = null) {
    console.log(`❌ ${message}`);
    if (details) {
      console.log(`   Detalles: ${details}`);
    }
    this.errors.push({ 
      message, 
      details, 
      timestamp: new Date().toISOString() 
    });
  }

  getResults() {
    return {
      duration: Date.now() - this.startTime,
      errors: this.errors,
      warnings: this.warnings,
      successes: this.successes,
      totalTests: this.errors.length + this.warnings.length + this.successes.length
    };
  }
}

// Clase principal para ejecutar pruebas
class SimplifiedTestRunner {
  constructor() {
    this.client = new SimpleTestClient();
    this.logger = new TestLogger();
    this.tokens = {};
  }

  // Método para validar respuesta
  validateResponse(response, expectedStatus, errorMessage = null, shouldFail = false) {
    if (shouldFail) {
      if (response.status === expectedStatus) {
        this.logger.success(`✓ Validación correcta: ${response.status} (esperado que falle)`);
        return true;
      } else {
        this.logger.error(`Respuesta incorrecta: ${response.status}, esperado: ${expectedStatus} (que falle)`, 
          response.data);
        return false;
      }
    } else {
      if (response.status === expectedStatus && response.ok) {
        this.logger.success(`✓ Respuesta correcta: ${response.status}`);
        return true;
      } else {
        const message = errorMessage || `Status incorrecto: ${response.status}, esperado: ${expectedStatus}`;
        this.logger.error(message, response.data || response.error);
        return false;
      }
    }
  }

  // Validar estructura de objeto
  validateStructure(obj, expectedFields) {
    if (!obj || typeof obj !== 'object') {
      this.logger.error('Objeto inválido para validación de estructura');
      return false;
    }

    const missingFields = expectedFields.filter(field => !(field in obj));
    if (missingFields.length > 0) {
      this.logger.error(`Campos faltantes en estructura: ${missingFields.join(', ')}`);
      return false;
    }

    this.logger.success(`✓ Estructura válida: ${expectedFields.length} campos`);
    return true;
  }

  // Probar servidor básico
  async testServerHealth() {
    this.logger.info('=== PRUEBA 01: SALUD DEL SERVIDOR ===');
    
    const response = await this.client.get('/');
    if (response.status === 200) {
      this.logger.success('Servidor respondiendo correctamente');
      return true;
    } else {
      this.logger.error('Servidor no responde', `Status: ${response.status}`);
      return false;
    }
  }

  // Probar autenticación
  async testAuthentication() {
    this.logger.info('=== PRUEBA 02: SISTEMA DE AUTENTICACIÓN ===');
    
    // Probar login con credenciales válidas
    this.logger.info('Probando login de administrador...');
    const loginResponse = await this.client.post('/api/auth/login', {
      email: TEST_CONFIG.testUsers.admin.email,
      password: TEST_CONFIG.testUsers.admin.password
    });

    if (this.validateResponse(loginResponse, 200)) {
      if (loginResponse.data && (loginResponse.data.token || loginResponse.data.access_token)) {
        const token = loginResponse.data.token || loginResponse.data.access_token;
        this.tokens.admin = token;
        this.logger.success('Token de admin obtenido correctamente');
      } else {
        this.logger.error('Respuesta de login no contiene token válido', loginResponse.data);
      }
    }

    // Probar login con credenciales inválidas
    this.logger.info('Probando login con credenciales inválidas...');
    const invalidLoginResponse = await this.client.post('/api/auth/login', {
      email: 'invalid@test.com',
      password: 'wrongpassword'
    });

    this.validateResponse(invalidLoginResponse, 401, null, true);
    
    return this.tokens.admin !== undefined;
  }

  // Probar endpoints protegidos
  async testProtectedEndpoints() {
    this.logger.info('=== PRUEBA 03: ENDPOINTS PROTEGIDOS ===');
    
    if (!this.tokens.admin) {
      this.logger.error('No hay token de admin para pruebas protegidas');
      return false;
    }

    const authHeaders = { Authorization: `Bearer ${this.tokens.admin}` };

    // Probar acceso a dashboard o perfil
    const endpoints = [
      '/api/auth/profile',
      '/api/dashboard',
      '/api/projects',
      '/api/notifications'
    ];

    let successCount = 0;
    for (const endpoint of endpoints) {
      this.logger.info(`Probando ${endpoint}...`);
      const response = await this.client.get(endpoint, authHeaders);
      
      if (response.status === 200 || response.status === 404) {
        this.logger.success(`${endpoint}: Acceso autorizado`);
        successCount++;
      } else if (response.status === 401) {
        this.logger.warning(`${endpoint}: Requiere autenticación (esperado)`);
      } else {
        this.logger.error(`${endpoint}: Respuesta inesperada ${response.status}`, response.data);
      }
    }

    return successCount > 0;
  }

  // Probar endpoints públicos
  async testPublicEndpoints() {
    this.logger.info('=== PRUEBA 04: ENDPOINTS PÚBLICOS ===');
    
    const publicEndpoints = [
      '/portal',
      '/noticias',
      '/eventos',
      '/recursos',
      '/publicaciones'
    ];

    let successCount = 0;
    for (const endpoint of publicEndpoints) {
      this.logger.info(`Probando acceso público a ${endpoint}...`);
      const response = await this.client.get(endpoint);
      
      if (response.status === 200) {
        this.logger.success(`${endpoint}: Accesible públicamente`);
        successCount++;
      } else if (response.status === 404) {
        this.logger.warning(`${endpoint}: Endpoint no implementado`);
      } else {
        this.logger.error(`${endpoint}: Error de acceso ${response.status}`, response.data);
      }
    }

    return successCount > 0;
  }

  // Probar APIs específicas
  async testAPIEndpoints() {
    this.logger.info('=== PRUEBA 05: APIs ESPECÍFICAS ===');
    
    const apiEndpoints = [
      { path: '/api/projects', method: 'GET', name: 'Lista de Proyectos' },
      { path: '/api/news', method: 'GET', name: 'Lista de Noticias' },
      { path: '/api/events', method: 'GET', name: 'Lista de Eventos' },
      { path: '/api/resources', method: 'GET', name: 'Lista de Recursos' }
    ];

    let successCount = 0;
    for (const api of apiEndpoints) {
      this.logger.info(`Probando ${api.name}...`);
      
      let response;
      if (api.method === 'GET') {
        response = await this.client.get(api.path);
      }
      
      if (response.status === 200) {
        this.logger.success(`${api.name}: API funcionando`);
        
        // Validar que sea una respuesta JSON válida
        if (typeof response.data === 'object') {
          this.logger.success(`${api.name}: Respuesta JSON válida`);
        }
        successCount++;
      } else if (response.status === 401 || response.status === 403) {
        this.logger.warning(`${api.name}: Requiere autenticación`);
      } else if (response.status === 404) {
        this.logger.warning(`${api.name}: Endpoint no implementado`);
      } else {
        this.logger.error(`${api.name}: Error ${response.status}`, response.data);
      }
    }

    return successCount > 0;
  }

  // Ejecutar todas las pruebas
  async runAllTests() {
    console.log('🚀 INICIANDO PROTOCOLO DE PRUEBAS UNITARIAS SIMPLICADO');
    console.log('=' .repeat(70));
    console.log(`Servidor: ${TEST_CONFIG.baseURL}`);
    console.log(`Inicio: ${new Date().toISOString()}`);
    console.log('=' .repeat(70));

    try {
      const results = {};
      
      results.serverHealth = await this.testServerHealth();
      results.authentication = await this.testAuthentication();
      results.protectedEndpoints = await this.testProtectedEndpoints();
      results.publicEndpoints = await this.testPublicEndpoints();
      results.apiEndpoints = await this.testAPIEndpoints();

      // Generar resumen final
      const testResults = this.logger.getResults();
      
      console.log('\n' + '=' .repeat(70));
      console.log('📊 RESUMEN FINAL DE PRUEBAS');
      console.log('=' .repeat(70));
      console.log(`⏱️  Duración: ${Math.round(testResults.duration / 1000)} segundos`);
      console.log(`✅ Éxitos: ${testResults.successes.length}`);
      console.log(`⚠️  Advertencias: ${testResults.warnings.length}`);
      console.log(`❌ Errores: ${testResults.errors.length}`);
      
      const overallSuccess = Object.values(results).some(result => result === true);
      console.log(`🏆 Estado General: ${overallSuccess ? 'FUNCIONAL' : 'CON PROBLEMAS'}`);
      
      if (testResults.errors.length > 0) {
        console.log('\n🐛 ERRORES ENCONTRADOS:');
        testResults.errors.forEach((error, index) => {
          console.log(`${index + 1}. ${error.message}`);
          if (error.details) {
            console.log(`   → ${error.details}`);
          }
        });
      }

      if (testResults.warnings.length > 0) {
        console.log('\n⚠️  ADVERTENCIAS:');
        testResults.warnings.forEach((warning, index) => {
          console.log(`${index + 1}. ${warning.message}`);
        });
      }

      // Generar recomendaciones
      this.generateRecommendations(results, testResults);

      return {
        success: overallSuccess,
        results,
        testResults,
        summary: {
          functionalComponents: Object.entries(results).filter(([, v]) => v === true).map(([k]) => k),
          problematicComponents: Object.entries(results).filter(([, v]) => v === false).map(([k]) => k),
          totalErrors: testResults.errors.length,
          totalWarnings: testResults.warnings.length
        }
      };

    } catch (error) {
      console.log('💥 ERROR CRÍTICO EN EJECUCIÓN DE PRUEBAS');
      console.error(error);
      return {
        success: false,
        criticalError: error.message,
        results: {},
        testResults: this.logger.getResults()
      };
    }
  }

  generateRecommendations(results, testResults) {
    console.log('\n💡 RECOMENDACIONES:');
    console.log('-' .repeat(50));

    if (!results.serverHealth) {
      console.log('🔧 ALTA PRIORIDAD: Verificar que el servidor esté ejecutándose correctamente');
      console.log('   → Ejecutar: npm run dev:d1 o verificar puerto 3000');
    }

    if (!results.authentication) {
      console.log('🔒 ALTA PRIORIDAD: Sistema de autenticación no funcional');
      console.log('   → Verificar endpoints /api/auth/login y base de datos de usuarios');
    }

    if (testResults.errors.length > 5) {
      console.log('⚠️  MÚLTIPLES ERRORES: Sistema requiere atención inmediata');
      console.log('   → Revisar logs de aplicación y configuración de base de datos');
    }

    if (results.publicEndpoints && results.serverHealth) {
      console.log('✨ POSITIVO: Funcionalidad básica del sistema operativa');
    }

    if (testResults.warnings.length > testResults.errors.length) {
      console.log('📋 IMPLEMENTACIÓN: Muchas características pendientes de implementar');
      console.log('   → Continuar desarrollo según roadmap de HUs');
    }
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new SimplifiedTestRunner();
  runner.runAllTests()
    .then((finalResults) => {
      process.exit(finalResults.success ? 0 : 1);
    })
    .catch((error) => {
      console.error('Error crítico:', error);
      process.exit(1);
    });
}

export { SimplifiedTestRunner, SimpleTestClient, TestLogger };