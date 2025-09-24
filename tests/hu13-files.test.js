import { TestClient, TestUtils, TestLogger } from './setup.js';

/**
 * HU-13: Sistema de Archivos - Pruebas Unitarias
 */

class FilesSystemTests {
  constructor() {
    this.client = new TestClient();
    this.utils = new TestUtils();
    this.logger = new TestLogger('HU-13-Files');
    this.testData = {
      adminToken: null,
      userToken: null,
      uploadedFile: null
    };
  }

  static expectedStructures = {
    file: ['id', 'name', 'original_name', 'size', 'type', 'url', 'path', 'folder_id', 'owner_id', 'created_at'],
    folder: ['id', 'name', 'parent_id', 'owner_id', 'created_at'],
    uploadResponse: ['file', 'url', 'success']
  };

  async runAllTests() {
    this.logger.info('=== INICIANDO PRUEBAS HU-13: SISTEMA DE ARCHIVOS ===');
    
    try {
      await this.setupTestData();
      await this.testCreateFolder();
      await this.testUploadFile();
      await this.testGetFiles();
      await this.testMoveFile();
      await this.testFilePermissions();
      await this.testDeleteFile();
      await this.testFileValidations();

      this.logger.success('=== TODAS LAS PRUEBAS DE HU-13 COMPLETADAS ===');
      return { success: true, errors: this.logger.getErrors() };
    } catch (error) {
      this.logger.error('Error general en pruebas HU-13', error);
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
  }

  async testCreateFolder() {
    this.logger.info('Probando creación de carpetas...');

    const response = await this.client.post('/api/files/folders', {
      name: 'Documentos Test',
      parent_id: null
    }, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear carpeta');
    this.utils.validateStructure(response.data, FilesSystemTests.expectedStructures.folder);
    this.testData.folder = response.data;
    this.logger.success('✅ Carpeta creada correctamente');
  }

  async testUploadFile() {
    this.logger.info('Probando subida de archivos...');

    // Simular subida de archivo
    const formData = {
      file: 'data:text/plain;base64,SGVsbG8gV29ybGQ=', // "Hello World" en base64
      folder_id: this.testData.folder?.id,
      name: 'test-document.txt'
    };

    const response = await this.client.post('/api/files/upload', formData, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al subir archivo');
    this.utils.validateStructure(response.data, FilesSystemTests.expectedStructures.uploadResponse);
    this.testData.uploadedFile = response.data.file;
    this.logger.success('✅ Archivo subido correctamente');
  }

  async testGetFiles() {
    this.logger.info('Probando obtención de archivos...');

    const response = await this.client.get('/api/files', {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener archivos');
    this.utils.validatePaginationStructure(response.data, 'archivos');
    this.logger.success('✅ Archivos obtenidos correctamente');
  }

  async testMoveFile() {
    this.logger.info('Probando movimiento de archivos...');

    if (!this.testData.uploadedFile) {
      this.logger.warning('No hay archivo para mover, saltando prueba');
      return;
    }

    const response = await this.client.put(`/api/files/${this.testData.uploadedFile.id}/move`, {
      folder_id: null // Mover a raíz
    }, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al mover archivo');
    this.logger.success('✅ Archivo movido correctamente');
  }

  async testFilePermissions() {
    this.logger.info('Probando permisos de archivos...');

    if (!this.testData.uploadedFile) {
      this.logger.warning('No hay archivo para probar permisos, saltando prueba');
      return;
    }

    // Intentar acceder al archivo de otro usuario
    const response = await this.client.get(`/api/files/${this.testData.uploadedFile.id}`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    // Admin puede ver todos los archivos
    this.utils.validateResponse(response, 200, 'Admin no puede acceder al archivo');
    this.logger.success('✅ Permisos de archivos funcionan correctamente');
  }

  async testDeleteFile() {
    this.logger.info('Probando eliminación de archivos...');

    if (!this.testData.uploadedFile) {
      this.logger.warning('No hay archivo para eliminar, saltando prueba');
      return;
    }

    const response = await this.client.delete(`/api/files/${this.testData.uploadedFile.id}`, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al eliminar archivo');
    this.logger.success('✅ Archivo eliminado correctamente');
  }

  async testFileValidations() {
    this.logger.info('Probando validaciones...');

    // Probar subida sin autenticación
    const response = await this.client.post('/api/files/upload', {
      file: 'data:text/plain;base64,dGVzdA==',
      name: 'test.txt'
    });

    this.utils.validateResponse(response, 401, null, true);
    this.logger.success('✅ Validaciones funcionan correctamente');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new FilesSystemTests();
  tests.runAllTests().then(result => {
    console.log('Resultado de pruebas HU-13:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando pruebas HU-13:', error);
    process.exit(1);
  });
}

export { FilesSystemTests };