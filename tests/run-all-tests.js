import { AuthenticationTests } from './hu01-authentication.test.js';
import { ProjectsSystemTests } from './hu02-projects.test.js';
import { PublicPortalTests } from './hu08-public-portal.test.js';
import { NewsSystemTests } from './hu09-news.test.js';
import { EventsSystemTests } from './hu10-events.test.js';
import { ResourcesSystemTests } from './hu11-resources.test.js';
import { AnalyticsSystemTests } from './hu12-analytics.test.js';
import { FilesSystemTests } from './hu13-files.test.js';
import { PublicationsSystemTests } from './hu14-publications.test.js';
import { IndicatorsSystemTests } from './hu15-indicators.test.js';
import { NotificationsSystemTests } from './hu17-notifications.test.js';

/**
 * Executor Maestro de Pruebas Unitarias
 * Ejecuta todas las pruebas de HUs y genera un reporte completo
 */

class MasterTestRunner {
  constructor() {
    this.results = {};
    this.allErrors = [];
    this.startTime = new Date();
  }

  async runAllTests() {
    console.log('🚀 INICIANDO EJECUCIÓN COMPLETA DE PRUEBAS UNITARIAS');
    console.log('=' .repeat(60));
    console.log(`Fecha de inicio: ${this.startTime.toISOString()}`);
    console.log('=' .repeat(60));

    const testSuites = [
      { name: 'HU-01 Autenticación', class: AuthenticationTests },
      { name: 'HU-02 Proyectos', class: ProjectsSystemTests },
      { name: 'HU-08 Portal Público', class: PublicPortalTests },
      { name: 'HU-09 Noticias', class: NewsSystemTests },
      { name: 'HU-10 Eventos', class: EventsSystemTests },
      { name: 'HU-11 Recursos', class: ResourcesSystemTests },
      { name: 'HU-12 Analytics', class: AnalyticsSystemTests },
      { name: 'HU-13 Archivos', class: FilesSystemTests },
      { name: 'HU-14 Publicaciones', class: PublicationsSystemTests },
      { name: 'HU-15 Indicadores', class: IndicatorsSystemTests },
      { name: 'HU-17 Notificaciones', class: NotificationsSystemTests }
    ];

    for (const suite of testSuites) {
      try {
        console.log(`\n📋 Ejecutando ${suite.name}...`);
        const testInstance = new suite.class();
        const result = await testInstance.runAllTests();
        
        this.results[suite.name] = result;
        
        if (result.success) {
          console.log(`✅ ${suite.name}: ÉXITO`);
        } else {
          console.log(`❌ ${suite.name}: FALLÓ`);
          this.allErrors.push(...result.errors.map(error => ({
            suite: suite.name,
            ...error
          })));
        }
        
        if (result.errors && result.errors.length > 0) {
          this.allErrors.push(...result.errors.map(error => ({
            suite: suite.name,
            ...error
          })));
        }
      } catch (error) {
        console.log(`💥 ${suite.name}: ERROR CRÍTICO`);
        console.error(error);
        
        this.results[suite.name] = { 
          success: false, 
          errors: [{ 
            type: 'CRITICAL_ERROR', 
            message: error.message, 
            stack: error.stack 
          }] 
        };
        
        this.allErrors.push({
          suite: suite.name,
          type: 'CRITICAL_ERROR',
          message: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
      }
    }

    await this.generateReport();
    return this.results;
  }

  async generateReport() {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 REPORTE FINAL DE EJECUCIÓN DE PRUEBAS');
    console.log('=' .repeat(60));
    
    const totalSuites = Object.keys(this.results).length;
    const successfulSuites = Object.values(this.results).filter(r => r.success).length;
    const failedSuites = totalSuites - successfulSuites;
    
    console.log(`⏱️  Duración total: ${Math.round(duration / 1000)} segundos`);
    console.log(`📦 Suites ejecutadas: ${totalSuites}`);
    console.log(`✅ Suites exitosas: ${successfulSuites}`);
    console.log(`❌ Suites fallidas: ${failedSuites}`);
    console.log(`🐛 Total de errores: ${this.allErrors.length}`);
    
    console.log('\n📋 RESUMEN POR SUITE:');
    for (const [suiteName, result] of Object.entries(this.results)) {
      const status = result.success ? '✅' : '❌';
      const errorCount = result.errors ? result.errors.length : 0;
      console.log(`${status} ${suiteName}: ${errorCount} errores`);
    }

    if (this.allErrors.length > 0) {
      console.log('\n🐛 ERRORES DETALLADOS:');
      console.log('-' .repeat(50));
      
      this.allErrors.forEach((error, index) => {
        console.log(`\n${index + 1}. [${error.suite}] ${error.type || 'ERROR'}`);
        console.log(`   Mensaje: ${error.message}`);
        if (error.details) {
          console.log(`   Detalles: ${error.details}`);
        }
        if (error.timestamp) {
          console.log(`   Timestamp: ${error.timestamp}`);
        }
      });
    }

    // Guardar reporte detallado en archivo
    await this.saveDetailedReport();
  }

  async saveDetailedReport() {
    const reportData = {
      execution_info: {
        start_time: this.startTime.toISOString(),
        end_time: new Date().toISOString(),
        duration_ms: new Date().getTime() - this.startTime.getTime(),
        total_suites: Object.keys(this.results).length,
        successful_suites: Object.values(this.results).filter(r => r.success).length,
        failed_suites: Object.values(this.results).filter(r => !r.success).length,
        total_errors: this.allErrors.length
      },
      results_by_suite: this.results,
      all_errors: this.allErrors,
      error_summary: this.generateErrorSummary(),
      recommendations: this.generateRecommendations()
    };

    // Generar archivo JSON con reporte completo
    const reportJson = JSON.stringify(reportData, null, 2);
    
    // Simular escritura de archivo (en un entorno real se escribiría al filesystem)
    console.log('\n💾 REPORTE DETALLADO GENERADO');
    console.log(`Tamaño del reporte: ${reportJson.length} caracteres`);
    console.log('Contenido del reporte disponible en memoria para análisis');

    return reportData;
  }

  generateErrorSummary() {
    const errorTypes = {};
    const errorsBySuite = {};

    this.allErrors.forEach(error => {
      // Contar por tipo
      const type = error.type || 'UNKNOWN';
      errorTypes[type] = (errorTypes[type] || 0) + 1;

      // Contar por suite
      errorsBySuite[error.suite] = (errorsBySuite[error.suite] || 0) + 1;
    });

    return {
      by_type: errorTypes,
      by_suite: errorsBySuite,
      most_problematic_suite: Object.entries(errorsBySuite)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Ninguna',
      most_common_error: Object.entries(errorTypes)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Ninguno'
    };
  }

  generateRecommendations() {
    const recommendations = [];

    // Analizar patrones de errores comunes
    const errorTypes = {};
    this.allErrors.forEach(error => {
      const type = error.type || 'UNKNOWN';
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    if (errorTypes['NETWORK_ERROR'] > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Infrastructure',
        issue: 'Errores de conexión de red',
        solution: 'Verificar que el servidor esté ejecutándose correctamente y que las URLs de API sean correctas'
      });
    }

    if (errorTypes['AUTHENTICATION_ERROR'] > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Security',
        issue: 'Errores de autenticación',
        solution: 'Revisar la implementación de JWT y los endpoints de login/registro'
      });
    }

    if (errorTypes['VALIDATION_ERROR'] > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Data Validation',
        issue: 'Errores de validación de datos',
        solution: 'Revisar los esquemas de validación en el backend y asegurar consistencia'
      });
    }

    if (errorTypes['DATABASE_ERROR'] > 0) {
      recommendations.push({
        priority: 'HIGH',
        category: 'Database',
        issue: 'Errores de base de datos',
        solution: 'Verificar migraciones de D1, conexiones y esquemas de base de datos'
      });
    }

    if (this.allErrors.length === 0) {
      recommendations.push({
        priority: 'INFO',
        category: 'Success',
        issue: 'Todas las pruebas pasaron exitosamente',
        solution: 'Sistema funcionando correctamente. Continuar con monitoreo regular'
      });
    }

    return recommendations;
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new MasterTestRunner();
  runner.runAllTests().then(results => {
    const hasErrors = Object.values(results).some(result => !result.success);
    console.log(`\n🏁 Ejecución completada. Estado: ${hasErrors ? 'CON ERRORES' : 'ÉXITO'}`);
    process.exit(hasErrors ? 1 : 0);
  }).catch(error => {
    console.error('💥 Error crítico ejecutando pruebas:', error);
    process.exit(1);
  });
}

export { MasterTestRunner };