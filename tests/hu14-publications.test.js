import { TestClient, TestUtils, TestLogger } from './setup.js';

/**
 * HU-14: Sistema de Publicaciones - Pruebas Unitarias
 */

class PublicationsSystemTests {
  constructor() {
    this.client = new TestClient();
    this.utils = new TestUtils();
    this.logger = new TestLogger('HU-14-Publications');
    this.testData = {
      adminToken: null,
      userToken: null,
      publication: null,
      comment: null
    };
  }

  static expectedStructures = {
    publication: ['id', 'title', 'content', 'excerpt', 'author_id', 'category', 'tags', 'status', 'published_at', 'views', 'likes', 'created_at'],
    comment: ['id', 'publication_id', 'author_id', 'content', 'parent_id', 'created_at'],
    publicationWithDetails: ['id', 'title', 'content', 'author', 'category', 'tags', 'comments_count', 'likes_count', 'views']
  };

  async runAllTests() {
    this.logger.info('=== INICIANDO PRUEBAS HU-14: SISTEMA DE PUBLICACIONES ===');
    
    try {
      await this.setupTestData();
      await this.testCreatePublication();
      await this.testGetPublications();
      await this.testGetPublicationById();
      await this.testUpdatePublication();
      await this.testPublishPublication();
      await this.testAddComment();
      await this.testReplyToComment();
      await this.testLikePublication();
      await this.testSearchPublications();
      await this.testDeletePublication();

      this.logger.success('=== TODAS LAS PRUEBAS DE HU-14 COMPLETADAS ===');
      return { success: true, errors: this.logger.getErrors() };
    } catch (error) {
      this.logger.error('Error general en pruebas HU-14', error);
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

  async testCreatePublication() {
    this.logger.info('Probando creación de publicaciones...');

    const publicationData = {
      title: 'El Futuro de la Inteligencia Artificial',
      content: 'La inteligencia artificial está transformando rápidamente nuestro mundo...',
      excerpt: 'Exploramos las tendencias y el impacto futuro de la IA',
      category: 'Tecnología',
      tags: ['ia', 'tecnologia', 'futuro', 'innovacion'],
      status: 'draft'
    };

    const response = await this.client.post('/api/publications', publicationData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear publicación');
    this.utils.validateStructure(response.data, PublicationsSystemTests.expectedStructures.publication);
    this.testData.publication = response.data;
    this.logger.success('✅ Publicación creada correctamente');
  }

  async testGetPublications() {
    this.logger.info('Probando obtención de publicaciones...');

    const response = await this.client.get('/api/publications');
    this.utils.validateResponse(response, 200, 'Error al obtener publicaciones');
    this.utils.validatePaginationStructure(response.data, 'publicaciones');
    this.logger.success('✅ Publicaciones obtenidas correctamente');
  }

  async testGetPublicationById() {
    this.logger.info('Probando obtención de publicación por ID...');

    const response = await this.client.get(`/api/publications/${this.testData.publication.id}`);
    this.utils.validateResponse(response, 200, 'Error al obtener publicación por ID');
    this.utils.validateStructure(response.data, PublicationsSystemTests.expectedStructures.publicationWithDetails);
    this.logger.success('✅ Publicación obtenida por ID correctamente');
  }

  async testUpdatePublication() {
    this.logger.info('Probando actualización de publicaciones...');

    const updateData = {
      title: 'El Futuro Prometedor de la IA',
      content: this.testData.publication.content + ' Contenido actualizado.',
      tags: [...this.testData.publication.tags, 'actualizado']
    };

    const response = await this.client.put(`/api/publications/${this.testData.publication.id}`, updateData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al actualizar publicación');
    this.testData.publication = response.data;
    this.logger.success('✅ Publicación actualizada correctamente');
  }

  async testPublishPublication() {
    this.logger.info('Probando publicación...');

    const response = await this.client.post(`/api/publications/${this.testData.publication.id}/publish`, {}, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al publicar');
    this.logger.success('✅ Publicación publicada correctamente');
  }

  async testAddComment() {
    this.logger.info('Probando adición de comentarios...');

    const commentData = {
      content: 'Excelente artículo sobre IA. Muy informativo y bien estructurado.'
    };

    const response = await this.client.post(`/api/publications/${this.testData.publication.id}/comments`, commentData, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al añadir comentario');
    this.utils.validateStructure(response.data, PublicationsSystemTests.expectedStructures.comment);
    this.testData.comment = response.data;
    this.logger.success('✅ Comentario añadido correctamente');
  }

  async testReplyToComment() {
    this.logger.info('Probando respuestas a comentarios...');

    const replyData = {
      content: 'Gracias por tu comentario. Me alegra que te haya resultado útil.',
      parent_id: this.testData.comment.id
    };

    const response = await this.client.post(`/api/publications/${this.testData.publication.id}/comments`, replyData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al responder comentario');
    this.logger.success('✅ Respuesta a comentario añadida correctamente');
  }

  async testLikePublication() {
    this.logger.info('Probando likes en publicaciones...');

    const response = await this.client.post(`/api/publications/${this.testData.publication.id}/like`, {}, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al dar like');
    this.logger.success('✅ Like añadido correctamente');
  }

  async testSearchPublications() {
    this.logger.info('Probando búsqueda de publicaciones...');

    const response = await this.client.get('/api/publications/search?q=inteligencia');
    this.utils.validateResponse(response, 200, 'Error en búsqueda');
    this.utils.validatePaginationStructure(response.data, 'resultados de búsqueda');
    this.logger.success('✅ Búsqueda funciona correctamente');
  }

  async testDeletePublication() {
    this.logger.info('Probando eliminación de publicaciones...');

    const tempPublication = await this.client.post('/api/publications', {
      title: 'Publicación Temporal',
      content: 'Para eliminar',
      category: 'Test',
      status: 'draft'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    const response = await this.client.delete(`/api/publications/${tempPublication.data.id}`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al eliminar publicación');
    this.logger.success('✅ Publicación eliminada correctamente');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new PublicationsSystemTests();
  tests.runAllTests().then(result => {
    console.log('Resultado de pruebas HU-14:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando pruebas HU-14:', error);
    process.exit(1);
  });
}

export { PublicationsSystemTests };