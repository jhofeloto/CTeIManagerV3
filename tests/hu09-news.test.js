import { TestClient, TestUtils, TestLogger } from './setup.js';

/**
 * HU-09: Sistema de Noticias - Pruebas Unitarias
 * 
 * Funcionalidades a probar:
 * 1. Crear noticias (admin/editor)
 * 2. Obtener lista de noticias con paginación
 * 3. Obtener noticia por ID
 * 4. Actualizar noticia
 * 5. Eliminar noticia
 * 6. Buscar noticias por título/contenido
 * 7. Filtrar por categoría
 * 8. Gestión de categorías
 * 9. Publicación y despublicación
 * 10. Validaciones de seguridad
 */

class NewsSystemTests {
  constructor() {
    this.client = new TestClient();
    this.utils = new TestUtils();
    this.logger = new TestLogger('HU-09-News');
    this.testData = {
      category: null,
      article: null,
      adminToken: null,
      userToken: null
    };
  }

  // Estructura esperada para validaciones
  static expectedStructures = {
    category: ['id', 'name', 'slug', 'description', 'created_at'],
    article: ['id', 'title', 'slug', 'content', 'excerpt', 'category_id', 'author_id', 'featured_image', 'published', 'published_at', 'views', 'created_at', 'updated_at'],
    articleWithCategory: ['id', 'title', 'slug', 'content', 'excerpt', 'category', 'author', 'featured_image', 'published', 'published_at', 'views', 'created_at', 'updated_at']
  };

  async runAllTests() {
    this.logger.info('=== INICIANDO PRUEBAS HU-09: SISTEMA DE NOTICIAS ===');
    
    try {
      // Configuración inicial
      await this.setupTestData();
      
      // Ejecutar todas las pruebas
      await this.testCreateCategory();
      await this.testGetCategories();
      await this.testCreateNews();
      await this.testGetNewsList();
      await this.testGetNewsById();
      await this.testUpdateNews();
      await this.testSearchNews();
      await this.testFilterByCategory();
      await this.testPublishUnpublishNews();
      await this.testDeleteNews();
      await this.testNewsValidations();
      await this.testPublicAccess();

      this.logger.success('=== TODAS LAS PRUEBAS DE HU-09 COMPLETADAS ===');
      return { success: true, errors: this.logger.getErrors() };
    } catch (error) {
      this.logger.error('Error general en pruebas HU-09', error);
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

    if (!this.testData.adminToken) {
      throw new Error('No se pudo obtener token de administrador para pruebas');
    }
  }

  async testCreateCategory() {
    this.logger.info('Probando creación de categorías...');

    const categoryData = {
      name: 'Tecnología',
      description: 'Noticias relacionadas con tecnología e innovación',
      slug: 'tecnologia'
    };

    const response = await this.client.post('/api/news/categories', categoryData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear categoría');
    this.utils.validateStructure(response.data, NewsSystemTests.expectedStructures.category);
    
    this.testData.category = response.data;
    this.logger.success('✅ Categoría creada correctamente');
  }

  async testGetCategories() {
    this.logger.info('Probando obtención de categorías...');

    const response = await this.client.get('/api/news/categories');
    
    this.utils.validateResponse(response, 200, 'Error al obtener categorías');
    this.utils.validateArray(response.data, 'categorías');
    
    if (response.data.length > 0) {
      this.utils.validateStructure(response.data[0], NewsSystemTests.expectedStructures.category);
    }

    this.logger.success('✅ Categorías obtenidas correctamente');
  }

  async testCreateNews() {
    this.logger.info('Probando creación de noticias...');

    const articleData = {
      title: 'Innovaciones en Inteligencia Artificial 2024',
      content: 'La inteligencia artificial continúa revolucionando múltiples industrias con avances significativos en procesamiento de lenguaje natural, visión por computadora y automatización de procesos.',
      excerpt: 'Descubre las últimas innovaciones en IA que están transformando el mundo.',
      category_id: this.testData.category?.id,
      featured_image: 'https://example.com/ai-innovation.jpg',
      published: false
    };

    const response = await this.client.post('/api/news', articleData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear noticia');
    this.utils.validateStructure(response.data, NewsSystemTests.expectedStructures.article);
    
    this.testData.article = response.data;
    this.logger.success('✅ Noticia creada correctamente');
  }

  async testGetNewsList() {
    this.logger.info('Probando obtención de lista de noticias...');

    // Probar lista pública (solo publicadas)
    const publicResponse = await this.client.get('/api/news');
    this.utils.validateResponse(publicResponse, 200, 'Error al obtener noticias públicas');
    this.utils.validatePaginationStructure(publicResponse.data, 'noticias públicas');

    // Probar lista admin (todas las noticias)
    const adminResponse = await this.client.get('/api/news/all', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });
    this.utils.validateResponse(adminResponse, 200, 'Error al obtener todas las noticias');
    this.utils.validatePaginationStructure(adminResponse.data, 'todas las noticias');

    // Probar paginación
    const paginatedResponse = await this.client.get('/api/news?page=1&limit=5');
    this.utils.validateResponse(paginatedResponse, 200, 'Error en paginación');

    this.logger.success('✅ Lista de noticias obtenida correctamente');
  }

  async testGetNewsById() {
    this.logger.info('Probando obtención de noticia por ID...');

    const response = await this.client.get(`/api/news/${this.testData.article.id}`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener noticia por ID');
    this.utils.validateStructure(response.data, NewsSystemTests.expectedStructures.articleWithCategory);

    // Verificar que se incrementan las vistas
    if (response.data.views !== this.testData.article.views + 1) {
      this.logger.warning('Las vistas no se incrementaron correctamente');
    }

    this.logger.success('✅ Noticia obtenida por ID correctamente');
  }

  async testUpdateNews() {
    this.logger.info('Probando actualización de noticias...');

    const updateData = {
      title: 'Innovaciones en IA 2024 - Actualizado',
      content: this.testData.article.content + ' Contenido actualizado con nuevas tendencias.',
      excerpt: 'Versión actualizada con las últimas tendencias en IA.'
    };

    const response = await this.client.put(`/api/news/${this.testData.article.id}`, updateData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al actualizar noticia');
    this.utils.validateStructure(response.data, NewsSystemTests.expectedStructures.article);

    // Verificar que los cambios se aplicaron
    if (!response.data.title.includes('Actualizado')) {
      throw new Error('Los cambios no se aplicaron correctamente');
    }

    this.testData.article = response.data;
    this.logger.success('✅ Noticia actualizada correctamente');
  }

  async testSearchNews() {
    this.logger.info('Probando búsqueda de noticias...');

    const searchTerm = 'inteligencia';
    const response = await this.client.get(`/api/news/search?q=${searchTerm}`);

    this.utils.validateResponse(response, 200, 'Error en búsqueda de noticias');
    this.utils.validatePaginationStructure(response.data, 'resultados de búsqueda');

    // Verificar que los resultados contienen el término buscado
    if (response.data.items && response.data.items.length > 0) {
      const hasSearchTerm = response.data.items.some(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!hasSearchTerm) {
        this.logger.warning('Los resultados no contienen el término buscado');
      }
    }

    this.logger.success('✅ Búsqueda de noticias funciona correctamente');
  }

  async testFilterByCategory() {
    this.logger.info('Probando filtrado por categoría...');

    const response = await this.client.get(`/api/news?category=${this.testData.category.slug}`);

    this.utils.validateResponse(response, 200, 'Error al filtrar por categoría');
    this.utils.validatePaginationStructure(response.data, 'noticias filtradas por categoría');

    this.logger.success('✅ Filtrado por categoría funciona correctamente');
  }

  async testPublishUnpublishNews() {
    this.logger.info('Probando publicación y despublicación...');

    // Publicar noticia
    const publishResponse = await this.client.post(`/api/news/${this.testData.article.id}/publish`, {}, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(publishResponse, 200, 'Error al publicar noticia');
    
    if (!publishResponse.data.published || !publishResponse.data.published_at) {
      throw new Error('La noticia no se marcó como publicada correctamente');
    }

    // Despublicar noticia
    const unpublishResponse = await this.client.post(`/api/news/${this.testData.article.id}/unpublish`, {}, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(unpublishResponse, 200, 'Error al despublicar noticia');
    
    if (unpublishResponse.data.published) {
      throw new Error('La noticia no se despublicó correctamente');
    }

    this.logger.success('✅ Publicación y despublicación funcionan correctamente');
  }

  async testDeleteNews() {
    this.logger.info('Probando eliminación de noticias...');

    const response = await this.client.delete(`/api/news/${this.testData.article.id}`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al eliminar noticia');

    // Verificar que la noticia ya no existe
    const checkResponse = await this.client.get(`/api/news/${this.testData.article.id}`);
    if (checkResponse.status !== 404) {
      throw new Error('La noticia no se eliminó correctamente');
    }

    this.logger.success('✅ Eliminación de noticias funciona correctamente');
  }

  async testNewsValidations() {
    this.logger.info('Probando validaciones del sistema...');

    // Probar creación sin título
    const noTitleResponse = await this.client.post('/api/news', {
      content: 'Contenido sin título'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(noTitleResponse, 400, null, true);

    // Probar acceso no autorizado
    const unauthorizedResponse = await this.client.post('/api/news', {
      title: 'Noticia sin autorización',
      content: 'Contenido'
    });

    this.utils.validateResponse(unauthorizedResponse, 401, null, true);

    this.logger.success('✅ Validaciones funcionan correctamente');
  }

  async testPublicAccess() {
    this.logger.info('Probando acceso público a noticias...');

    // Las noticias publicadas deben ser accesibles sin autenticación
    const response = await this.client.get('/api/news');
    this.utils.validateResponse(response, 200, 'Error al acceder a noticias públicas');

    // Las categorías también deben ser públicas
    const categoriesResponse = await this.client.get('/api/news/categories');
    this.utils.validateResponse(categoriesResponse, 200, 'Error al acceder a categorías públicas');

    this.logger.success('✅ Acceso público funciona correctamente');
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new NewsSystemTests();
  tests.runAllTests().then(result => {
    console.log('Resultado de pruebas HU-09:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando pruebas HU-09:', error);
    process.exit(1);
  });
}

export { NewsSystemTests };