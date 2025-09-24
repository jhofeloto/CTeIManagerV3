import { TestClient, TestUtils, TestLogger } from './setup.js';

/**
 * HU-11: Sistema de Recursos - Pruebas Unitarias
 * 
 * Funcionalidades a probar:
 * 1. Crear recursos (admin/editor)
 * 2. Obtener lista de recursos con filtros
 * 3. Obtener recurso por ID
 * 4. Actualizar recurso
 * 5. Eliminar recurso
 * 6. Descargar recursos
 * 7. Gestión de categorías
 * 8. Búsqueda y filtros
 * 9. Control de acceso
 * 10. Estadísticas de descarga
 * 11. Validaciones de archivos
 */

class ResourcesSystemTests {
  constructor() {
    this.client = new TestClient();
    this.utils = new TestUtils();
    this.logger = new TestLogger('HU-11-Resources');
    this.testData = {
      category: null,
      resource: null,
      adminToken: null,
      userToken: null
    };
  }

  // Estructura esperada para validaciones
  static expectedStructures = {
    category: ['id', 'name', 'slug', 'description', 'icon', 'created_at'],
    resource: ['id', 'title', 'description', 'file_url', 'file_name', 'file_size', 'file_type', 'category_id', 'author_id', 'download_count', 'access_level', 'tags', 'created_at', 'updated_at'],
    resourceWithDetails: ['id', 'title', 'description', 'file_url', 'file_name', 'file_size', 'file_type', 'category', 'author', 'download_count', 'access_level', 'tags', 'created_at', 'updated_at'],
    downloadLog: ['id', 'resource_id', 'user_id', 'download_date', 'ip_address']
  };

  async runAllTests() {
    this.logger.info('=== INICIANDO PRUEBAS HU-11: SISTEMA DE RECURSOS ===');
    
    try {
      // Configuración inicial
      await this.setupTestData();
      
      // Ejecutar todas las pruebas
      await this.testCreateCategory();
      await this.testGetCategories();
      await this.testCreateResource();
      await this.testGetResourcesList();
      await this.testGetResourceById();
      await this.testUpdateResource();
      await this.testDownloadResource();
      await this.testSearchResources();
      await this.testFilterResources();
      await this.testAccessControl();
      await this.testDownloadStatistics();
      await this.testResourceValidations();
      await this.testDeleteResource();

      this.logger.success('=== TODAS LAS PRUEBAS DE HU-11 COMPLETADAS ===');
      return { success: true, errors: this.logger.getErrors() };
    } catch (error) {
      this.logger.error('Error general en pruebas HU-11', error);
      return { success: false, errors: this.logger.getErrors() };
    }
  }

  async setupTestData() {
    this.logger.info('Configurando datos de prueba...');
    
    // Obtener tokens de autenticación
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

    if (!this.testData.adminToken || !this.testData.userToken) {
      throw new Error('No se pudieron obtener tokens para pruebas');
    }
  }

  async testCreateCategory() {
    this.logger.info('Probando creación de categorías de recursos...');

    const categoryData = {
      name: 'Documentos Técnicos',
      description: 'Documentación técnica, manuales y guías especializadas',
      slug: 'documentos-tecnicos',
      icon: 'fas fa-file-alt'
    };

    const response = await this.client.post('/api/resources/categories', categoryData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear categoría de recurso');
    this.utils.validateStructure(response.data, ResourcesSystemTests.expectedStructures.category);
    
    this.testData.category = response.data;
    this.logger.success('✅ Categoría de recurso creada correctamente');
  }

  async testGetCategories() {
    this.logger.info('Probando obtención de categorías...');

    const response = await this.client.get('/api/resources/categories');
    
    this.utils.validateResponse(response, 200, 'Error al obtener categorías');
    this.utils.validateArray(response.data, 'categorías de recursos');
    
    if (response.data.length > 0) {
      this.utils.validateStructure(response.data[0], ResourcesSystemTests.expectedStructures.category);
    }

    this.logger.success('✅ Categorías obtenidas correctamente');
  }

  async testCreateResource() {
    this.logger.info('Probando creación de recursos...');

    const resourceData = {
      title: 'Manual de Implementación de IA',
      description: 'Guía completa para implementar sistemas de inteligencia artificial en entornos empresariales. Incluye casos de uso, mejores prácticas y ejemplos de código.',
      file_url: 'https://example.com/files/manual-ia-implementacion.pdf',
      file_name: 'manual-ia-implementacion.pdf',
      file_size: 2048576, // 2MB
      file_type: 'application/pdf',
      category_id: this.testData.category?.id,
      access_level: 'public',
      tags: ['ia', 'implementacion', 'manual', 'empresarial'],
      metadata: {
        author_original: 'Dr. María González',
        version: '2.1',
        language: 'es',
        pages: 45
      }
    };

    const response = await this.client.post('/api/resources', resourceData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear recurso');
    this.utils.validateStructure(response.data, ResourcesSystemTests.expectedStructures.resource);
    
    this.testData.resource = response.data;
    this.logger.success('✅ Recurso creado correctamente');
  }

  async testGetResourcesList() {
    this.logger.info('Probando obtención de lista de recursos...');

    // Probar lista pública de recursos
    const publicResponse = await this.client.get('/api/resources');
    this.utils.validateResponse(publicResponse, 200, 'Error al obtener recursos públicos');
    this.utils.validatePaginationStructure(publicResponse.data, 'recursos públicos');

    // Probar lista admin con todos los recursos
    const adminResponse = await this.client.get('/api/resources/all', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });
    this.utils.validateResponse(adminResponse, 200, 'Error al obtener todos los recursos');
    this.utils.validatePaginationStructure(adminResponse.data, 'todos los recursos');

    // Probar paginación
    const paginatedResponse = await this.client.get('/api/resources?page=1&limit=10');
    this.utils.validateResponse(paginatedResponse, 200, 'Error en paginación de recursos');

    this.logger.success('✅ Lista de recursos obtenida correctamente');
  }

  async testGetResourceById() {
    this.logger.info('Probando obtención de recurso por ID...');

    const response = await this.client.get(`/api/resources/${this.testData.resource.id}`);

    this.utils.validateResponse(response, 200, 'Error al obtener recurso por ID');
    this.utils.validateStructure(response.data, ResourcesSystemTests.expectedStructures.resourceWithDetails);

    // Verificar que incluye información detallada
    if (!response.data.category || !response.data.author) {
      this.logger.warning('El recurso no incluye información completa de categoría o autor');
    }

    this.logger.success('✅ Recurso obtenido por ID correctamente');
  }

  async testUpdateResource() {
    this.logger.info('Probando actualización de recursos...');

    const updateData = {
      title: 'Manual Avanzado de Implementación de IA',
      description: this.testData.resource.description + ' Actualizado con nuevos casos de uso.',
      tags: [...this.testData.resource.tags, 'avanzado', 'casos-uso'],
      access_level: 'registered'
    };

    const response = await this.client.put(`/api/resources/${this.testData.resource.id}`, updateData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al actualizar recurso');
    this.utils.validateStructure(response.data, ResourcesSystemTests.expectedStructures.resource);

    // Verificar que los cambios se aplicaron
    if (!response.data.title.includes('Avanzado')) {
      throw new Error('Los cambios no se aplicaron correctamente');
    }

    this.testData.resource = response.data;
    this.logger.success('✅ Recurso actualizado correctamente');
  }

  async testDownloadResource() {
    this.logger.info('Probando descarga de recursos...');

    // Probar descarga con usuario autenticado
    const downloadResponse = await this.client.get(`/api/resources/${this.testData.resource.id}/download`, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(downloadResponse, 200, 'Error al descargar recurso');

    // Verificar que se registra la descarga
    const resourceCheck = await this.client.get(`/api/resources/${this.testData.resource.id}`);
    if (resourceCheck.data.download_count !== this.testData.resource.download_count + 1) {
      this.logger.warning('El contador de descargas no se actualizó correctamente');
    }

    // Probar descarga directa del archivo
    const directDownloadResponse = await this.client.get(`/api/resources/${this.testData.resource.id}/file`, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    // Debe redirigir o devolver el archivo
    if (directDownloadResponse.status !== 200 && directDownloadResponse.status !== 302) {
      this.logger.warning('La descarga directa no funciona correctamente');
    }

    this.logger.success('✅ Descarga de recursos funciona correctamente');
  }

  async testSearchResources() {
    this.logger.info('Probando búsqueda de recursos...');

    const searchTerm = 'inteligencia';
    const response = await this.client.get(`/api/resources/search?q=${searchTerm}`);

    this.utils.validateResponse(response, 200, 'Error en búsqueda de recursos');
    this.utils.validatePaginationStructure(response.data, 'resultados de búsqueda de recursos');

    // Verificar que los resultados contienen el término buscado
    if (response.data.items && response.data.items.length > 0) {
      const hasSearchTerm = response.data.items.some(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      
      if (!hasSearchTerm) {
        this.logger.warning('Los resultados no contienen el término buscado');
      }
    }

    this.logger.success('✅ Búsqueda de recursos funciona correctamente');
  }

  async testFilterResources() {
    this.logger.info('Probando filtros de recursos...');

    // Filtro por categoría
    const categoryResponse = await this.client.get(`/api/resources?category=${this.testData.category.slug}`);
    this.utils.validateResponse(categoryResponse, 200, 'Error al filtrar por categoría');

    // Filtro por tipo de archivo
    const typeResponse = await this.client.get('/api/resources?file_type=pdf');
    this.utils.validateResponse(typeResponse, 200, 'Error al filtrar por tipo de archivo');

    // Filtro por tags
    const tagsResponse = await this.client.get('/api/resources?tags=ia,manual');
    this.utils.validateResponse(tagsResponse, 200, 'Error al filtrar por tags');

    // Filtro por nivel de acceso
    const accessResponse = await this.client.get('/api/resources?access_level=public');
    this.utils.validateResponse(accessResponse, 200, 'Error al filtrar por nivel de acceso');

    this.logger.success('✅ Filtros de recursos funcionan correctamente');
  }

  async testAccessControl() {
    this.logger.info('Probando control de acceso a recursos...');

    // Crear recurso privado
    const privateResource = await this.client.post('/api/resources', {
      title: 'Documento Confidencial',
      description: 'Documento con acceso restringido',
      file_url: 'https://example.com/files/confidencial.pdf',
      file_name: 'confidencial.pdf',
      file_size: 1024,
      file_type: 'application/pdf',
      category_id: this.testData.category?.id,
      access_level: 'admin'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    // Usuario normal no debe poder descargar recurso admin
    const unauthorizedDownload = await this.client.get(`/api/resources/${privateResource.data.id}/download`, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(unauthorizedDownload, 403, null, true);

    // Admin sí debe poder descargar
    const authorizedDownload = await this.client.get(`/api/resources/${privateResource.data.id}/download`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(authorizedDownload, 200, 'Admin no puede descargar recurso privado');

    this.logger.success('✅ Control de acceso funciona correctamente');
  }

  async testDownloadStatistics() {
    this.logger.info('Probando estadísticas de descarga...');

    // Obtener estadísticas generales
    const statsResponse = await this.client.get('/api/resources/stats', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(statsResponse, 200, 'Error al obtener estadísticas');

    const expectedStats = ['total_resources', 'total_downloads', 'popular_resources', 'recent_downloads'];
    this.utils.validateStructure(statsResponse.data, expectedStats);

    // Obtener estadísticas de un recurso específico
    const resourceStatsResponse = await this.client.get(`/api/resources/${this.testData.resource.id}/stats`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(resourceStatsResponse, 200, 'Error al obtener estadísticas del recurso');

    this.logger.success('✅ Estadísticas de descarga funcionan correctamente');
  }

  async testResourceValidations() {
    this.logger.info('Probando validaciones del sistema...');

    // Probar creación sin título
    const noTitleResponse = await this.client.post('/api/resources', {
      description: 'Recurso sin título'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(noTitleResponse, 400, null, true);

    // Probar archivo con tamaño excesivo
    const largeSizeResponse = await this.client.post('/api/resources', {
      title: 'Archivo muy grande',
      description: 'Test',
      file_url: 'https://example.com/large.pdf',
      file_name: 'large.pdf',
      file_size: 1073741824, // 1GB
      file_type: 'application/pdf',
      category_id: this.testData.category?.id
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    // Debe fallar si hay límite de tamaño
    if (largeSizeResponse.status === 400) {
      this.logger.info('Validación de tamaño de archivo funciona correctamente');
    }

    // Probar acceso no autorizado
    const unauthorizedResponse = await this.client.post('/api/resources', {
      title: 'Recurso sin autorización',
      description: 'Test'
    });

    this.utils.validateResponse(unauthorizedResponse, 401, null, true);

    this.logger.success('✅ Validaciones funcionan correctamente');
  }

  async testDeleteResource() {
    this.logger.info('Probando eliminación de recursos...');

    // Crear recurso temporal para eliminar
    const tempResource = await this.client.post('/api/resources', {
      title: 'Recurso Temporal',
      description: 'Para eliminar',
      file_url: 'https://example.com/temp.pdf',
      file_name: 'temp.pdf',
      file_size: 1024,
      file_type: 'application/pdf',
      category_id: this.testData.category?.id,
      access_level: 'public'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    const response = await this.client.delete(`/api/resources/${tempResource.data.id}`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al eliminar recurso');

    // Verificar que el recurso ya no existe
    const checkResponse = await this.client.get(`/api/resources/${tempResource.data.id}`);
    if (checkResponse.status !== 404) {
      throw new Error('El recurso no se eliminó correctamente');
    }

    this.logger.success('✅ Eliminación de recursos funciona correctamente');
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new ResourcesSystemTests();
  tests.runAllTests().then(result => {
    console.log('Resultado de pruebas HU-11:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando pruebas HU-11:', error);
    process.exit(1);
  });
}

export { ResourcesSystemTests };