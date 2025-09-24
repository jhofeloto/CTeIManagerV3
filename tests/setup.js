// ================================
// CODECTI PLATFORM - TEST SETUP
// Sistema de pruebas unitarias e integración
// ================================

import { env } from '../src/index.tsx';

// Test configuration
export const TEST_CONFIG = {
  baseURL: 'http://localhost:3000',
  timeout: 10000,
  retries: 3,
  
  // Test users
  users: {
    admin: {
      email: 'admin@codecti.choco.gov.co',
      password: 'password123',
      expectedRole: 'admin'
    },
    researcher: {
      email: 'investigador1@codecti.choco.gov.co', 
      password: 'password123',
      expectedRole: 'collaborator'
    },
    testUser: {
      email: 'test@codecti.test',
      password: 'testpass123',
      name: 'Test User',
      institution: 'Test Institution'
    }
  },

  // Expected responses
  expectedStructures: {
    user: ['id', 'email', 'name', 'role', 'institution', 'created_at'],
    project: ['id', 'title', 'summary', 'responsible_person', 'status', 'created_at'],
    notification: ['id', 'user_id', 'title', 'message', 'type', 'read_status', 'created_at'],
    news: ['id', 'title', 'summary', 'content', 'category', 'status', 'published_at'],
    event: ['id', 'title', 'description', 'type', 'start_date', 'end_date', 'status'],
    resource: ['id', 'title', 'description', 'type', 'category', 'file_path'],
    file: ['id', 'original_name', 'file_path', 'file_size', 'mime_type', 'category'],
    publication: ['id', 'title', 'authors', 'publication_type', 'doi', 'published_date'],
    conversation: ['id', 'title', 'type', 'participants', 'created_at'],
    message: ['id', 'conversation_id', 'sender_id', 'content', 'message_type', 'created_at']
  }
};

// Test utilities
export class TestUtils {
  static logTestStart(testName) {
    console.log(`\n🧪 [TEST START] ${testName}`);
  }

  static logTestEnd(testName, passed) {
    const status = passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`🧪 [TEST END] ${testName} - ${status}`);
  }

  static logError(testName, error) {
    console.error(`❌ [TEST ERROR] ${testName}:`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }

  static validateStructure(obj, expectedFields, objectName = 'object') {
    const missing = expectedFields.filter(field => !(field in obj));
    if (missing.length > 0) {
      throw new Error(`Missing fields in ${objectName}: ${missing.join(', ')}`);
    }
    return true;
  }

  static async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static generateRandomString(length = 8) {
    return Math.random().toString(36).substring(2, length + 2);
  }

  static generateTestEmail() {
    return `test_${this.generateRandomString()}@codecti.test`;
  }
}

// Test logger
export class TestLogger {
  constructor() {
    this.logs = [];
    this.errors = [];
    this.startTime = Date.now();
  }

  log(level, message, data = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      duration: Date.now() - this.startTime
    };
    
    this.logs.push(entry);
    
    if (level === 'ERROR') {
      this.errors.push(entry);
    }
    
    // Console output
    const prefix = {
      INFO: '📝',
      SUCCESS: '✅',
      ERROR: '❌',
      WARNING: '⚠️'
    }[level] || 'ℹ️';
    
    console.log(`${prefix} [${level}] ${message}`, data ? data : '');
  }

  info(message, data) {
    this.log('INFO', message, data);
  }

  success(message, data) {
    this.log('SUCCESS', message, data);
  }

  error(message, data) {
    this.log('ERROR', message, data);
  }

  warning(message, data) {
    this.log('WARNING', message, data);
  }

  getErrorCount() {
    return this.errors.length;
  }

  getSummary() {
    const totalTests = this.logs.filter(log => log.message.includes('TEST')).length;
    const passedTests = this.logs.filter(log => 
      log.level === 'SUCCESS' && log.message.includes('TEST')
    ).length;
    
    return {
      totalLogs: this.logs.length,
      totalErrors: this.errors.length,
      totalTests,
      passedTests,
      failedTests: totalTests - passedTests,
      duration: Date.now() - this.startTime
    };
  }

  exportLogs() {
    return {
      summary: this.getSummary(),
      logs: this.logs,
      errors: this.errors
    };
  }
}

// HTTP Client for tests
export class TestClient {
  constructor(baseURL = TEST_CONFIG.baseURL) {
    this.baseURL = baseURL;
    this.token = null;
    this.logger = new TestLogger();
  }

  setToken(token) {
    this.token = token;
  }

  async request(method, endpoint, data = null, headers = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${responseData.message || 'Request failed'}`);
      }
      
      return responseData;
    } catch (error) {
      this.logger.error(`Request failed: ${method} ${endpoint}`, {
        error: error.message,
        data
      });
      throw error;
    }
  }

  async get(endpoint, headers) {
    return this.request('GET', endpoint, null, headers);
  }

  async post(endpoint, data, headers) {
    return this.request('POST', endpoint, data, headers);
  }

  async put(endpoint, data, headers) {
    return this.request('PUT', endpoint, data, headers);
  }

  async patch(endpoint, data, headers) {
    return this.request('PATCH', endpoint, data, headers);
  }

  async delete(endpoint, headers) {
    return this.request('DELETE', endpoint, null, headers);
  }
}

export default { TEST_CONFIG, TestUtils, TestLogger, TestClient };