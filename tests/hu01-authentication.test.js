// ================================
// HU-01: SISTEMA DE AUTENTICACIÓN - TESTS
// ================================

import { TestClient, TestUtils, TEST_CONFIG } from './setup.js';

export class AuthenticationTests {
  constructor() {
    this.client = new TestClient();
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('\n🔐 === HU-01: SISTEMA DE AUTENTICACIÓN - PRUEBAS ===\n');
    
    const tests = [
      { name: 'Test Login Válido Admin', method: 'testValidAdminLogin' },
      { name: 'Test Login Válido Investigador', method: 'testValidResearcherLogin' },
      { name: 'Test Login Inválido', method: 'testInvalidLogin' },
      { name: 'Test Registro de Usuario', method: 'testUserRegistration' },
      { name: 'Test Validación de Token', method: 'testTokenValidation' },
      { name: 'Test Perfil de Usuario', method: 'testUserProfile' },
      { name: 'Test Logout', method: 'testLogout' },
      { name: 'Test Acceso sin Autenticación', method: 'testUnauthorizedAccess' }
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
      
      await TestUtils.delay(500); // Delay between tests
    }

    return this.results;
  }

  async testValidAdminLogin() {
    const loginData = {
      email: TEST_CONFIG.users.admin.email,
      password: TEST_CONFIG.users.admin.password
    };

    const response = await this.client.post('/api/auth/login', loginData);
    
    // Validar estructura de respuesta
    if (!response.success) {
      throw new Error('Login failed: success = false');
    }
    
    if (!response.token) {
      throw new Error('No token received in login response');
    }
    
    if (!response.user) {
      throw new Error('No user data received in login response');
    }

    // Validar estructura del usuario
    TestUtils.validateStructure(response.user, TEST_CONFIG.expectedStructures.user, 'user');
    
    // Validar rol de admin
    if (response.user.role !== TEST_CONFIG.users.admin.expectedRole) {
      throw new Error(`Expected admin role, got: ${response.user.role}`);
    }

    // Guardar token para tests posteriores
    this.client.setToken(response.token);
    
    this.client.logger.success('Admin login successful', {
      userId: response.user.id,
      role: response.user.role
    });
  }

  async testValidResearcherLogin() {
    const loginData = {
      email: TEST_CONFIG.users.researcher.email,
      password: TEST_CONFIG.users.researcher.password
    };

    const response = await this.client.post('/api/auth/login', loginData);
    
    if (!response.success || !response.token || !response.user) {
      throw new Error('Researcher login failed');
    }
    
    TestUtils.validateStructure(response.user, TEST_CONFIG.expectedStructures.user, 'researcher');
    
    if (response.user.role !== TEST_CONFIG.users.researcher.expectedRole) {
      throw new Error(`Expected researcher role, got: ${response.user.role}`);
    }
    
    this.client.logger.success('Researcher login successful', {
      userId: response.user.id,
      role: response.user.role
    });
  }

  async testInvalidLogin() {
    const invalidLogins = [
      { email: 'invalid@email.com', password: 'wrongpass' },
      { email: TEST_CONFIG.users.admin.email, password: 'wrongpass' },
      { email: 'invalid@email.com', password: TEST_CONFIG.users.admin.password },
      { email: '', password: '' },
      { email: 'not-an-email', password: '123' }
    ];

    for (const loginData of invalidLogins) {
      try {
        const response = await this.client.post('/api/auth/login', loginData);
        
        // Si llegamos aquí, el login no debería haber funcionado
        if (response.success) {
          throw new Error(`Login should have failed for: ${JSON.stringify(loginData)}`);
        }
      } catch (error) {
        // Se espera que falle, esto es correcto
        if (error.message.includes('HTTP 401') || error.message.includes('HTTP 400')) {
          continue; // Error esperado
        } else {
          throw error; // Error inesperado
        }
      }
    }
    
    this.client.logger.success('Invalid login attempts properly rejected');
  }

  async testUserRegistration() {
    const userData = {
      name: 'Test User Registration',
      email: TestUtils.generateTestEmail(),
      password: 'testpassword123',
      institution: 'Test Institution'
    };

    const response = await this.client.post('/api/auth/register', userData);
    
    if (!response.success) {
      throw new Error('User registration failed');
    }
    
    if (!response.user || !response.token) {
      throw new Error('Registration response missing user or token');
    }
    
    TestUtils.validateStructure(response.user, TEST_CONFIG.expectedStructures.user, 'registered user');
    
    // Verificar que el nuevo usuario tiene rol de researcher por defecto
    if (response.user.role !== 'researcher') {
      throw new Error(`Expected researcher role for new user, got: ${response.user.role}`);
    }
    
    this.client.logger.success('User registration successful', {
      userId: response.user.id,
      email: response.user.email
    });
  }

  async testTokenValidation() {
    // Usar token del login de admin anterior
    if (!this.client.token) {
      throw new Error('No token available for validation test');
    }

    const response = await this.client.get('/api/auth/profile');
    
    if (!response.success || !response.user) {
      throw new Error('Token validation failed');
    }
    
    TestUtils.validateStructure(response.user, TEST_CONFIG.expectedStructures.user, 'profile user');
    
    this.client.logger.success('Token validation successful', {
      userId: response.user.id
    });
  }

  async testUserProfile() {
    const response = await this.client.get('/api/auth/profile');
    
    if (!response.success || !response.user) {
      throw new Error('Profile retrieval failed');
    }
    
    const user = response.user;
    
    // Verificar campos requeridos
    const requiredFields = ['id', 'email', 'name', 'role', 'institution'];
    for (const field of requiredFields) {
      if (!user[field]) {
        throw new Error(`Missing required field in profile: ${field}`);
      }
    }
    
    this.client.logger.success('User profile retrieved successfully', {
      userId: user.id,
      email: user.email,
      role: user.role
    });
  }

  async testLogout() {
    const response = await this.client.post('/api/auth/logout', {});
    
    if (!response.success) {
      throw new Error('Logout failed');
    }
    
    // Limpiar token
    this.client.setToken(null);
    
    this.client.logger.success('Logout successful');
  }

  async testUnauthorizedAccess() {
    // Intentar acceder a endpoint protegido sin token
    try {
      await this.client.get('/api/projects');
      throw new Error('Should not be able to access protected endpoint without token');
    } catch (error) {
      if (error.message.includes('HTTP 401') || error.message.includes('Unauthorized')) {
        // Error esperado
        this.client.logger.success('Unauthorized access properly rejected');
      } else {
        throw error;
      }
    }
  }

  getResults() {
    return {
      hu: 'HU-01',
      name: 'Sistema de Autenticación',
      ...this.results,
      total: this.results.passed + this.results.failed
    };
  }
}

export default AuthenticationTests;