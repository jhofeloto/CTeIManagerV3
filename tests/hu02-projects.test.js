// ================================
// HU-02: GESTIÓN DE PROYECTOS - TESTS
// ================================

import { TestClient, TestUtils, TEST_CONFIG } from './setup.js';

export class ProjectsTests {
  constructor() {
    this.client = new TestClient();
    this.adminToken = null;
    this.testProjectId = null;
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('\n📊 === HU-02: GESTIÓN DE PROYECTOS - PRUEBAS ===\n');
    
    // Primero hacer login como admin
    await this.loginAsAdmin();
    
    const tests = [
      { name: 'Test Listar Proyectos', method: 'testListProjects' },
      { name: 'Test Crear Proyecto', method: 'testCreateProject' },
      { name: 'Test Obtener Proyecto por ID', method: 'testGetProjectById' },
      { name: 'Test Actualizar Proyecto', method: 'testUpdateProject' },
      { name: 'Test Búsqueda de Proyectos', method: 'testSearchProjects' },
      { name: 'Test Filtros de Estado', method: 'testProjectStatusFilters' },
      { name: 'Test Paginación', method: 'testProjectPagination' },
      { name: 'Test Validaciones de Entrada', method: 'testProjectValidations' },
      { name: 'Test Eliminar Proyecto', method: 'testDeleteProject' }
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
      
      await TestUtils.delay(500);
    }

    return this.results;
  }

  async loginAsAdmin() {
    const response = await this.client.post('/api/auth/login', {
      email: TEST_CONFIG.users.admin.email,
      password: TEST_CONFIG.users.admin.password
    });
    
    if (!response.success) {
      throw new Error('Admin login failed for projects tests');
    }
    
    this.client.setToken(response.token);
    this.adminToken = response.token;
  }

  async testListProjects() {
    const response = await this.client.get('/api/projects');
    
    if (!response.success) {
      throw new Error('Failed to list projects');
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Projects data should be an array');
    }
    
    // Validar estructura de los proyectos
    if (response.data.length > 0) {
      const project = response.data[0];
      TestUtils.validateStructure(project, TEST_CONFIG.expectedStructures.project, 'project');
    }
    
    this.client.logger.success('Projects list retrieved successfully', {
      count: response.data.length
    });
  }

  async testCreateProject() {
    const projectData = {
      title: `Test Project ${TestUtils.generateRandomString()}`,
      summary: 'This is a test project created by automated testing',
      responsible_person: 'Test Researcher',
      status: 'active',
      start_date: '2024-01-01',
      end_date: '2024-12-31',
      institution: 'Test Institution',
      research_area: 'Tecnología'
    };

    const response = await this.client.post('/api/projects', projectData);
    
    if (!response.success) {
      throw new Error(`Failed to create project: ${response.message}`);
    }
    
    if (!response.project || !response.project.id) {
      throw new Error('Created project should have ID');
    }
    
    // Guardar ID para tests posteriores
    this.testProjectId = response.project.id;
    
    TestUtils.validateStructure(response.project, TEST_CONFIG.expectedStructures.project, 'created project');
    
    // Verificar que los datos coinciden
    if (response.project.title !== projectData.title) {
      throw new Error('Project title does not match');
    }
    
    if (response.project.status !== projectData.status) {
      throw new Error('Project status does not match');
    }
    
    this.client.logger.success('Project created successfully', {
      projectId: this.testProjectId,
      title: response.project.title
    });
  }

  async testGetProjectById() {
    if (!this.testProjectId) {
      throw new Error('No test project ID available');
    }
    
    const response = await this.client.get(`/api/projects/${this.testProjectId}`);
    
    if (!response.success) {
      throw new Error('Failed to get project by ID');
    }
    
    if (!response.project) {
      throw new Error('Project data missing in response');
    }
    
    TestUtils.validateStructure(response.project, TEST_CONFIG.expectedStructures.project, 'project by ID');
    
    if (response.project.id !== this.testProjectId) {
      throw new Error('Returned project ID does not match requested ID');
    }
    
    this.client.logger.success('Project retrieved by ID successfully', {
      projectId: response.project.id
    });
  }

  async testUpdateProject() {
    if (!this.testProjectId) {
      throw new Error('No test project ID available for update');
    }
    
    const updateData = {
      title: `Updated Test Project ${TestUtils.generateRandomString()}`,
      summary: 'Updated summary for test project',
      status: 'completed'
    };
    
    const response = await this.client.put(`/api/projects/${this.testProjectId}`, updateData);
    
    if (!response.success) {
      throw new Error(`Failed to update project: ${response.message}`);
    }
    
    // Verificar que los cambios se aplicaron
    const updatedProject = await this.client.get(`/api/projects/${this.testProjectId}`);
    
    if (updatedProject.project.title !== updateData.title) {
      throw new Error('Project title was not updated');
    }
    
    if (updatedProject.project.status !== updateData.status) {
      throw new Error('Project status was not updated');
    }
    
    this.client.logger.success('Project updated successfully', {
      projectId: this.testProjectId,
      newTitle: updateData.title
    });
  }

  async testSearchProjects() {
    // Test búsqueda por título
    const searchResponse = await this.client.get('/api/projects?search=Test');
    
    if (!searchResponse.success) {
      throw new Error('Search request failed');
    }
    
    if (!Array.isArray(searchResponse.data)) {
      throw new Error('Search results should be an array');
    }
    
    this.client.logger.success('Project search completed', {
      resultsCount: searchResponse.data.length
    });
  }

  async testProjectStatusFilters() {
    // Test filtro por estado
    const activeProjects = await this.client.get('/api/projects?status=active');
    const completedProjects = await this.client.get('/api/projects?status=completed');
    
    if (!activeProjects.success || !completedProjects.success) {
      throw new Error('Status filter requests failed');
    }
    
    // Verificar que los proyectos activos tienen status 'active'
    if (activeProjects.data.length > 0) {
      const hasNonActive = activeProjects.data.some(p => p.status !== 'active');
      if (hasNonActive) {
        throw new Error('Active filter returned non-active projects');
      }
    }
    
    this.client.logger.success('Status filters working correctly', {
      activeCount: activeProjects.data.length,
      completedCount: completedProjects.data.length
    });
  }

  async testProjectPagination() {
    // Test paginación
    const page1 = await this.client.get('/api/projects?page=1&limit=2');
    const page2 = await this.client.get('/api/projects?page=2&limit=2');
    
    if (!page1.success || !page2.success) {
      throw new Error('Pagination requests failed');
    }
    
    if (page1.data.length > 2 || page2.data.length > 2) {
      throw new Error('Pagination limit not working correctly');
    }
    
    this.client.logger.success('Pagination working correctly', {
      page1Count: page1.data.length,
      page2Count: page2.data.length
    });
  }

  async testProjectValidations() {
    // Test validaciones de entrada
    const invalidProjectData = [
      { /* título vacío */ summary: 'test', responsible_person: 'test', status: 'active' },
      { title: 'test', /* resumen vacío */ responsible_person: 'test', status: 'active' },
      { title: 'test', summary: 'test', /* responsable vacío */ status: 'active' },
      { title: 'test', summary: 'test', responsible_person: 'test', status: 'invalid_status' }
    ];
    
    for (const invalidData of invalidProjectData) {
      try {
        const response = await this.client.post('/api/projects', invalidData);
        if (response.success) {
          throw new Error(`Validation should have failed for: ${JSON.stringify(invalidData)}`);
        }
      } catch (error) {
        if (error.message.includes('HTTP 400') || error.message.includes('validation')) {
          continue; // Error esperado
        }
        throw error;
      }
    }
    
    this.client.logger.success('Project validations working correctly');
  }

  async testDeleteProject() {
    if (!this.testProjectId) {
      throw new Error('No test project ID available for deletion');
    }
    
    const response = await this.client.delete(`/api/projects/${this.testProjectId}`);
    
    if (!response.success) {
      throw new Error('Failed to delete project');
    }
    
    // Verificar que el proyecto ya no existe
    try {
      await this.client.get(`/api/projects/${this.testProjectId}`);
      throw new Error('Project should not exist after deletion');
    } catch (error) {
      if (error.message.includes('HTTP 404')) {
        // Error esperado
        this.client.logger.success('Project deleted successfully', {
          projectId: this.testProjectId
        });
      } else {
        throw error;
      }
    }
  }

  getResults() {
    return {
      hu: 'HU-02',
      name: 'Gestión de Proyectos',
      ...this.results,
      total: this.results.passed + this.results.failed
    };
  }
}

export default ProjectsTests;