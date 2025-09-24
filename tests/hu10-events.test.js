import { TestClient, TestUtils, TestLogger } from './setup.js';

/**
 * HU-10: Sistema de Eventos - Pruebas Unitarias
 * 
 * Funcionalidades a probar:
 * 1. Crear eventos (admin/organizador)
 * 2. Obtener lista de eventos con filtros
 * 3. Obtener evento por ID
 * 4. Actualizar evento
 * 5. Eliminar evento
 * 6. Registro a eventos
 * 7. Cancelar registro
 * 8. Gestión de asistencia
 * 9. Búsqueda y filtros (fecha, categoría, ubicación)
 * 10. Validaciones de capacidad
 * 11. Notificaciones de eventos
 */

class EventsSystemTests {
  constructor() {
    this.client = new TestClient();
    this.utils = new TestUtils();
    this.logger = new TestLogger('HU-10-Events');
    this.testData = {
      event: null,
      registration: null,
      adminToken: null,
      userToken: null
    };
  }

  // Estructura esperada para validaciones
  static expectedStructures = {
    event: ['id', 'title', 'description', 'start_date', 'end_date', 'location', 'capacity', 'registered_count', 'organizer_id', 'category', 'image', 'status', 'created_at', 'updated_at'],
    registration: ['id', 'event_id', 'user_id', 'registration_date', 'attended', 'notes'],
    eventWithDetails: ['id', 'title', 'description', 'start_date', 'end_date', 'location', 'capacity', 'registered_count', 'available_spots', 'organizer', 'category', 'image', 'status', 'registrations']
  };

  async runAllTests() {
    this.logger.info('=== INICIANDO PRUEBAS HU-10: SISTEMA DE EVENTOS ===');
    
    try {
      // Configuración inicial
      await this.setupTestData();
      
      // Ejecutar todas las pruebas
      await this.testCreateEvent();
      await this.testGetEventsList();
      await this.testGetEventById();
      await this.testUpdateEvent();
      await this.testRegisterToEvent();
      await this.testGetEventRegistrations();
      await this.testMarkAttendance();
      await this.testCancelRegistration();
      await this.testSearchEvents();
      await this.testFilterEvents();
      await this.testEventValidations();
      await this.testCapacityLimits();
      await this.testDeleteEvent();

      this.logger.success('=== TODAS LAS PRUEBAS DE HU-10 COMPLETADAS ===');
      return { success: true, errors: this.logger.getErrors() };
    } catch (error) {
      this.logger.error('Error general en pruebas HU-10', error);
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

  async testCreateEvent() {
    this.logger.info('Probando creación de eventos...');

    const eventData = {
      title: 'Taller de Inteligencia Artificial',
      description: 'Taller práctico sobre implementación de modelos de IA en aplicaciones web. Incluye casos prácticos y ejercicios hands-on.',
      start_date: '2024-12-15T10:00:00Z',
      end_date: '2024-12-15T17:00:00Z',
      location: 'Centro de Innovación Tecnológica, Sala 301',
      capacity: 30,
      category: 'Tecnología',
      image: 'https://example.com/ai-workshop.jpg',
      registration_deadline: '2024-12-14T23:59:59Z',
      requirements: 'Conocimientos básicos de programación',
      materials_included: 'Manual del taller, acceso a plataforma online'
    };

    const response = await this.client.post('/api/events', eventData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al crear evento');
    this.utils.validateStructure(response.data, EventsSystemTests.expectedStructures.event);
    
    this.testData.event = response.data;
    this.logger.success('✅ Evento creado correctamente');
  }

  async testGetEventsList() {
    this.logger.info('Probando obtención de lista de eventos...');

    // Probar lista pública de eventos
    const publicResponse = await this.client.get('/api/events');
    this.utils.validateResponse(publicResponse, 200, 'Error al obtener eventos públicos');
    this.utils.validatePaginationStructure(publicResponse.data, 'eventos públicos');

    // Probar lista admin con todos los eventos
    const adminResponse = await this.client.get('/api/events/all', {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });
    this.utils.validateResponse(adminResponse, 200, 'Error al obtener todos los eventos');
    this.utils.validatePaginationStructure(adminResponse.data, 'todos los eventos');

    // Probar paginación
    const paginatedResponse = await this.client.get('/api/events?page=1&limit=10');
    this.utils.validateResponse(paginatedResponse, 200, 'Error en paginación de eventos');

    this.logger.success('✅ Lista de eventos obtenida correctamente');
  }

  async testGetEventById() {
    this.logger.info('Probando obtención de evento por ID...');

    const response = await this.client.get(`/api/events/${this.testData.event.id}`);

    this.utils.validateResponse(response, 200, 'Error al obtener evento por ID');
    this.utils.validateStructure(response.data, EventsSystemTests.expectedStructures.eventWithDetails);

    // Verificar que incluye información detallada
    if (!response.data.available_spots !== undefined) {
      this.logger.warning('El evento no incluye información de espacios disponibles');
    }

    this.logger.success('✅ Evento obtenido por ID correctamente');
  }

  async testUpdateEvent() {
    this.logger.info('Probando actualización de eventos...');

    const updateData = {
      title: 'Taller Avanzado de Inteligencia Artificial',
      description: this.testData.event.description + ' Actualizado con contenido avanzado.',
      capacity: 25,
      location: 'Centro de Innovación Tecnológica, Auditorio Principal'
    };

    const response = await this.client.put(`/api/events/${this.testData.event.id}`, updateData, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al actualizar evento');
    this.utils.validateStructure(response.data, EventsSystemTests.expectedStructures.event);

    // Verificar que los cambios se aplicaron
    if (!response.data.title.includes('Avanzado')) {
      throw new Error('Los cambios no se aplicaron correctamente');
    }

    this.testData.event = response.data;
    this.logger.success('✅ Evento actualizado correctamente');
  }

  async testRegisterToEvent() {
    this.logger.info('Probando registro a eventos...');

    const registrationData = {
      notes: 'Muy interesado en el tema de IA aplicada'
    };

    const response = await this.client.post(`/api/events/${this.testData.event.id}/register`, registrationData, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(response, 201, 'Error al registrarse al evento');
    this.utils.validateStructure(response.data, EventsSystemTests.expectedStructures.registration);

    this.testData.registration = response.data;

    // Verificar que el contador de registros se actualiza
    const eventCheck = await this.client.get(`/api/events/${this.testData.event.id}`);
    if (eventCheck.data.registered_count !== 1) {
      this.logger.warning('El contador de registros no se actualizó correctamente');
    }

    this.logger.success('✅ Registro al evento completado correctamente');
  }

  async testGetEventRegistrations() {
    this.logger.info('Probando obtención de registros del evento...');

    const response = await this.client.get(`/api/events/${this.testData.event.id}/registrations`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al obtener registros del evento');
    this.utils.validateArray(response.data, 'registros del evento');

    if (response.data.length > 0) {
      this.utils.validateStructure(response.data[0], ['id', 'user', 'registration_date', 'attended', 'notes']);
    }

    this.logger.success('✅ Registros del evento obtenidos correctamente');
  }

  async testMarkAttendance() {
    this.logger.info('Probando marcado de asistencia...');

    const response = await this.client.post(`/api/events/${this.testData.event.id}/attendance`, {
      user_id: this.testData.registration.user_id,
      attended: true,
      notes: 'Asistió puntualmente y participó activamente'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al marcar asistencia');

    // Verificar que la asistencia se registró
    const registrationCheck = await this.client.get(`/api/events/${this.testData.event.id}/registrations`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    const userRegistration = registrationCheck.data.find(r => r.user.id === this.testData.registration.user_id);
    if (!userRegistration || !userRegistration.attended) {
      throw new Error('La asistencia no se registró correctamente');
    }

    this.logger.success('✅ Asistencia marcada correctamente');
  }

  async testCancelRegistration() {
    this.logger.info('Probando cancelación de registro...');

    // Primero registramos otro usuario para luego cancelar
    const secondUserLogin = await this.client.post('/api/auth/register', {
      name: 'Test User 2',
      email: 'user2@test.com',
      password: 'user123'
    });

    const secondUserToken = secondUserLogin.data?.token;
    
    // Registrar al segundo usuario
    await this.client.post(`/api/events/${this.testData.event.id}/register`, {
      notes: 'Registro para posterior cancelación'
    }, {
      headers: { Authorization: `Bearer ${secondUserToken}` }
    });

    // Ahora cancelar el registro
    const cancelResponse = await this.client.delete(`/api/events/${this.testData.event.id}/register`, {
      headers: { Authorization: `Bearer ${secondUserToken}` }
    });

    this.utils.validateResponse(cancelResponse, 200, 'Error al cancelar registro');

    // Verificar que el contador de registros se actualizó
    const eventCheck = await this.client.get(`/api/events/${this.testData.event.id}`);
    if (eventCheck.data.registered_count > 1) {
      this.logger.warning('El contador de registros no se actualizó tras la cancelación');
    }

    this.logger.success('✅ Cancelación de registro funcionó correctamente');
  }

  async testSearchEvents() {
    this.logger.info('Probando búsqueda de eventos...');

    const searchTerm = 'inteligencia';
    const response = await this.client.get(`/api/events/search?q=${searchTerm}`);

    this.utils.validateResponse(response, 200, 'Error en búsqueda de eventos');
    this.utils.validatePaginationStructure(response.data, 'resultados de búsqueda de eventos');

    // Verificar que los resultados contienen el término buscado
    if (response.data.items && response.data.items.length > 0) {
      const hasSearchTerm = response.data.items.some(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!hasSearchTerm) {
        this.logger.warning('Los resultados no contienen el término buscado');
      }
    }

    this.logger.success('✅ Búsqueda de eventos funciona correctamente');
  }

  async testFilterEvents() {
    this.logger.info('Probando filtros de eventos...');

    // Filtro por categoría
    const categoryResponse = await this.client.get('/api/events?category=Tecnología');
    this.utils.validateResponse(categoryResponse, 200, 'Error al filtrar por categoría');

    // Filtro por fecha
    const dateResponse = await this.client.get('/api/events?start_date=2024-12-01&end_date=2024-12-31');
    this.utils.validateResponse(dateResponse, 200, 'Error al filtrar por fecha');

    // Filtro por ubicación
    const locationResponse = await this.client.get('/api/events?location=Centro de Innovación');
    this.utils.validateResponse(locationResponse, 200, 'Error al filtrar por ubicación');

    this.logger.success('✅ Filtros de eventos funcionan correctamente');
  }

  async testEventValidations() {
    this.logger.info('Probando validaciones del sistema...');

    // Probar creación sin título
    const noTitleResponse = await this.client.post('/api/events', {
      description: 'Evento sin título'
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(noTitleResponse, 400, null, true);

    // Probar fechas inválidas
    const invalidDateResponse = await this.client.post('/api/events', {
      title: 'Evento con fecha inválida',
      description: 'Test',
      start_date: '2024-12-15T10:00:00Z',
      end_date: '2024-12-14T17:00:00Z' // Fecha de fin antes que inicio
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(invalidDateResponse, 400, null, true);

    // Probar acceso no autorizado
    const unauthorizedResponse = await this.client.post('/api/events', {
      title: 'Evento sin autorización',
      description: 'Test'
    });

    this.utils.validateResponse(unauthorizedResponse, 401, null, true);

    this.logger.success('✅ Validaciones funcionan correctamente');
  }

  async testCapacityLimits() {
    this.logger.info('Probando límites de capacidad...');

    // Crear evento con capacidad limitada
    const limitedEvent = await this.client.post('/api/events', {
      title: 'Evento con Capacidad Limitada',
      description: 'Evento para probar límites de capacidad',
      start_date: '2024-12-20T10:00:00Z',
      end_date: '2024-12-20T12:00:00Z',
      location: 'Sala pequeña',
      capacity: 1 // Solo 1 espacio
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    // Registrar primer usuario (debe funcionar)
    const firstRegistration = await this.client.post(`/api/events/${limitedEvent.data.id}/register`, {
      notes: 'Primer registro'
    }, {
      headers: { Authorization: `Bearer ${this.testData.userToken}` }
    });

    this.utils.validateResponse(firstRegistration, 201, 'Error en primer registro');

    // Intentar registrar segundo usuario (debe fallar)
    const secondUserLogin = await this.client.post('/api/auth/register', {
      name: 'Test User 3',
      email: 'user3@test.com',
      password: 'user123'
    });

    const secondRegistration = await this.client.post(`/api/events/${limitedEvent.data.id}/register`, {
      notes: 'Segundo registro - debe fallar'
    }, {
      headers: { Authorization: `Bearer ${secondUserLogin.data.token}` }
    });

    this.utils.validateResponse(secondRegistration, 400, null, true);

    this.logger.success('✅ Límites de capacidad funcionan correctamente');
  }

  async testDeleteEvent() {
    this.logger.info('Probando eliminación de eventos...');

    // Crear evento temporal para eliminar
    const tempEvent = await this.client.post('/api/events', {
      title: 'Evento Temporal',
      description: 'Para eliminar',
      start_date: '2024-12-25T10:00:00Z',
      end_date: '2024-12-25T12:00:00Z',
      location: 'Temporal',
      capacity: 10
    }, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    const response = await this.client.delete(`/api/events/${tempEvent.data.id}`, {
      headers: { Authorization: `Bearer ${this.testData.adminToken}` }
    });

    this.utils.validateResponse(response, 200, 'Error al eliminar evento');

    // Verificar que el evento ya no existe
    const checkResponse = await this.client.get(`/api/events/${tempEvent.data.id}`);
    if (checkResponse.status !== 404) {
      throw new Error('El evento no se eliminó correctamente');
    }

    this.logger.success('✅ Eliminación de eventos funciona correctamente');
  }
}

// Ejecutar pruebas si se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const tests = new EventsSystemTests();
  tests.runAllTests().then(result => {
    console.log('Resultado de pruebas HU-10:', result);
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error('Error ejecutando pruebas HU-10:', error);
    process.exit(1);
  });
}

export { EventsSystemTests };