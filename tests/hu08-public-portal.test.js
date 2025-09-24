// ================================
// HU-08: PORTAL PÚBLICO - TESTS
// ================================

import { TestClient, TestUtils, TEST_CONFIG } from './setup.js';

export class PublicPortalTests {
  constructor() {
    this.client = new TestClient();
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async runAllTests() {
    console.log('\n🌐 === HU-08: PORTAL PÚBLICO - PRUEBAS ===\n');
    
    const tests = [
      { name: 'Test Acceso Portal sin Autenticación', method: 'testUnauthenticatedAccess' },
      { name: 'Test Listar Proyectos Públicos', method: 'testListPublicProjects' },
      { name: 'Test Detalle Proyecto Público', method: 'testPublicProjectDetail' },
      { name: 'Test Búsqueda Proyectos Públicos', method: 'testPublicProjectSearch' },
      { name: 'Test Filtros Proyectos Públicos', method: 'testPublicProjectFilters' },
      { name: 'Test Estadísticas Públicas', method: 'testPublicStats' },
      { name: 'Test Paginación Portal Público', method: 'testPublicPagination' },
      { name: 'Test Categorías de Investigación', method: 'testResearchAreas' },
      { name: 'Test Instituciones Públicas', method: 'testPublicInstitutions' }
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

  async testUnauthenticatedAccess() {
    // Asegurarse de que no hay token
    this.client.setToken(null);
    
    // Test acceso a la página principal del portal
    try {
      const response = await this.client.get('/portal');
      // Se espera que funcione sin autenticación
      this.client.logger.success('Portal public page accessible without auth');
    } catch (error) {
      throw new Error(`Portal should be accessible without authentication: ${error.message}`);
    }
    
    // Test acceso a API pública
    const apiResponse = await this.client.get('/api/public/projects');
    
    if (!apiResponse.success) {
      throw new Error('Public API should be accessible without authentication');
    }
    
    this.client.logger.success('Public API accessible without authentication');
  }

  async testListPublicProjects() {
    const response = await this.client.get('/api/public/projects');
    
    if (!response.success) {
      throw new Error('Failed to list public projects');
    }
    
    if (!Array.isArray(response.data)) {
      throw new Error('Public projects data should be an array');
    }
    
    // Validar estructura de proyectos públicos
    if (response.data.length > 0) {
      const project = response.data[0];
      
      // Campos esperados en proyectos públicos
      const expectedPublicFields = ['id', 'title', 'summary', 'responsible_person', 
                                   'status', 'research_area', 'institution', 'created_at'];
      
      for (const field of expectedPublicFields) {
        if (!(field in project)) {
          throw new Error(`Missing field in public project: ${field}`);
        }
      }
      
      // Verificar que no se exponen campos sensibles
      const sensitiveFields = ['internal_notes', 'budget_details', 'private_data'];
      for (const field of sensitiveFields) {
        if (field in project) {
          throw new Error(`Sensitive field exposed in public project: ${field}`);
        }
      }
    }
    
    this.client.logger.success('Public projects list retrieved successfully', {
      count: response.data.length
    });
  }

  async testPublicProjectDetail() {
    // Obtener lista de proyectos primero
    const listResponse = await this.client.get('/api/public/projects');
    
    if (!listResponse.success || listResponse.data.length === 0) {
      throw new Error('No public projects available for detail test');
    }
    
    const projectId = listResponse.data[0].id;
    const detailResponse = await this.client.get(`/api/public/projects/${projectId}`);
    
    if (!detailResponse.success) {
      throw new Error('Failed to get public project detail');
    }
    
    if (!detailResponse.project) {
      throw new Error('Project detail missing in response');
    }
    
    const project = detailResponse.project;
    
    // Validar campos obligatorios
    const requiredFields = ['id', 'title', 'summary', 'responsible_person', 'status'];
    for (const field of requiredFields) {
      if (!project[field]) {
        throw new Error(`Missing required field in project detail: ${field}`);
      }
    }
    
    this.client.logger.success('Public project detail retrieved successfully', {
      projectId: project.id,
      title: project.title
    });
  }

  async testPublicProjectSearch() {
    // Test búsqueda por término
    const searchTerm = 'investigación';
    const searchResponse = await this.client.get(`/api/public/projects?search=${searchTerm}`);
    
    if (!searchResponse.success) {
      throw new Error('Public project search failed');
    }
    
    if (!Array.isArray(searchResponse.data)) {
      throw new Error('Search results should be an array');
    }
    
    // Si hay resultados, verificar que contienen el término de búsqueda
    if (searchResponse.data.length > 0) {
      const project = searchResponse.data[0];
      const searchFields = [project.title, project.summary, project.responsible_person];
      const containsSearchTerm = searchFields.some(field => 
        field && field.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (!containsSearchTerm) {
        this.client.logger.warning('Search results may not contain search term', {
          searchTerm,
          projectTitle: project.title
        });
      }
    }
    
    this.client.logger.success('Public project search completed', {
      searchTerm,
      resultsCount: searchResponse.data.length
    });
  }

  async testPublicProjectFilters() {
    // Test filtro por estado
    const activeResponse = await this.client.get('/api/public/projects?status=active');
    const completedResponse = await this.client.get('/api/public/projects?status=completed');
    
    if (!activeResponse.success || !completedResponse.success) {
      throw new Error('Status filter requests failed');
    }
    
    // Verificar que los filtros funcionan
    if (activeResponse.data.length > 0) {
      const hasNonActive = activeResponse.data.some(p => p.status !== 'active');
      if (hasNonActive) {
        throw new Error('Active filter returned non-active projects');
      }
    }
    
    // Test filtro por área de investigación
    const areaResponse = await this.client.get('/api/public/projects?research_area=Biodiversidad');
    
    if (!areaResponse.success) {
      throw new Error('Research area filter failed');
    }
    
    this.client.logger.success('Public project filters working correctly', {
      activeCount: activeResponse.data.length,
      completedCount: completedResponse.data.length,
      biodiversityCount: areaResponse.data.length
    });
  }

  async testPublicStats() {
    const response = await this.client.get('/api/public/stats');
    
    if (!response.success) {
      throw new Error('Failed to get public statistics');
    }
    
    if (!response.stats) {
      throw new Error('Stats data missing in response');
    }
    
    const stats = response.stats;
    
    // Verificar campos esperados en estadísticas
    const expectedStats = ['total_projects', 'active_projects', 'completed_projects'];
    for (const stat of expectedStats) {
      if (typeof stats[stat] !== 'number') {
        throw new Error(`Missing or invalid stat: ${stat}`);
      }
    }
    
    // Verificar lógica de estadísticas
    if (stats.total_projects < stats.active_projects + stats.completed_projects) {
      this.client.logger.warning('Stats logic may be incorrect', stats);
    }
    
    this.client.logger.success('Public statistics retrieved successfully', stats);
  }

  async testPublicPagination() {
    // Test paginación
    const page1 = await this.client.get('/api/public/projects?page=1&limit=3');
    const page2 = await this.client.get('/api/public/projects?page=2&limit=3');
    
    if (!page1.success || !page2.success) {
      throw new Error('Pagination requests failed');
    }
    
    if (page1.data.length > 3 || page2.data.length > 3) {
      throw new Error('Pagination limit not working correctly');
    }
    
    // Verificar que page1 y page2 tienen proyectos diferentes (si hay suficientes)
    if (page1.data.length > 0 && page2.data.length > 0) {
      const page1Ids = page1.data.map(p => p.id);
      const page2Ids = page2.data.map(p => p.id);
      const overlap = page1Ids.some(id => page2Ids.includes(id));
      
      if (overlap) {
        throw new Error('Pagination returned overlapping results');
      }
    }
    
    this.client.logger.success('Public pagination working correctly', {
      page1Count: page1.data.length,
      page2Count: page2.data.length
    });
  }

  async testResearchAreas() {
    // Test endpoint de áreas de investigación si existe
    try {
      const response = await this.client.get('/api/public/research-areas');
      
      if (response.success && Array.isArray(response.data)) {
        this.client.logger.success('Research areas retrieved successfully', {
          count: response.data.length
        });
      }
    } catch (error) {
      // Si no existe el endpoint, obtener áreas de los proyectos
      const projectsResponse = await this.client.get('/api/public/projects');
      
      if (projectsResponse.success) {
        const areas = [...new Set(projectsResponse.data.map(p => p.research_area).filter(Boolean))];
        
        this.client.logger.success('Research areas extracted from projects', {
          areas: areas.length,
          uniqueAreas: areas
        });
      } else {
        throw new Error('Could not retrieve research areas');
      }
    }
  }

  async testPublicInstitutions() {
    // Test obtener instituciones de los proyectos públicos
    const projectsResponse = await this.client.get('/api/public/projects');
    
    if (!projectsResponse.success) {
      throw new Error('Failed to get projects for institutions test');
    }
    
    const institutions = [...new Set(projectsResponse.data.map(p => p.institution).filter(Boolean))];
    
    if (institutions.length === 0) {
      throw new Error('No institutions found in public projects');
    }
    
    this.client.logger.success('Public institutions identified successfully', {
      count: institutions.length,
      institutions
    });
  }

  getResults() {
    return {
      hu: 'HU-08',
      name: 'Portal Público',
      ...this.results,
      total: this.results.passed + this.results.failed
    };
  }
}

export default PublicPortalTests;