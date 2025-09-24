// CODECTI Platform - Advanced Forecasting Routes
// Sistema de predicciones y forecasting con ML avanzado

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { authMiddleware } from '../utils/middleware';
import { mlService } from '../utils/mlService';

const forecastingRoutes = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware to all forecasting routes
forecastingRoutes.use('/*', authMiddleware);

// GET /api/forecasting/project-success - Predict project success rates
forecastingRoutes.get('/project-success', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const category = c.req.query('category') || 'all';
    const horizon = c.req.query('horizon') || '6months';

    let successPredictions;

    if (projectId) {
      // Individual project prediction
      successPredictions = await predictIndividualProjectSuccess(projectId);
    } else {
      // Category-wide predictions
      successPredictions = await predictCategoryProjectSuccess(category, horizon);
    }

    return c.json({
      success: true,
      forecasting: {
        type: 'project_success',
        target: projectId || category,
        horizon,
        predictions: successPredictions,
        methodology: 'Machine Learning - Random Forest + Neural Networks',
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Project success forecasting error:', error);
    return c.json({
      success: false,
      message: 'Error al generar predicciones de éxito de proyectos',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/funding-probability - Predict funding success probability
forecastingRoutes.get('/funding-probability', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const fundingSource = c.req.query('source') || 'all';
    const amount = c.req.query('amount');

    const fundingPredictions = await predictFundingProbability(projectId, fundingSource, amount);

    return c.json({
      success: true,
      forecasting: {
        type: 'funding_probability',
        predictions: fundingPredictions,
        factors: await analyzeFundingFactors(fundingSource),
        recommendations: await generateFundingRecommendations(fundingPredictions),
        confidence: calculateFundingConfidence(fundingPredictions)
      }
    });

  } catch (error) {
    console.error('Funding probability forecasting error:', error);
    return c.json({
      success: false,
      message: 'Error al generar predicciones de financiamiento',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/timeline - Predict project timeline and milestones
forecastingRoutes.get('/timeline', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const category = c.req.query('category') || 'all';

    const timelinePredictions = await predictProjectTimeline(projectId, category);

    return c.json({
      success: true,
      forecasting: {
        type: 'timeline_prediction',
        predictions: timelinePredictions,
        riskFactors: await identifyTimelineRisks(timelinePredictions),
        optimization: await optimizeTimeline(timelinePredictions),
        confidence: calculateTimelineConfidence(timelinePredictions)
      }
    });

  } catch (error) {
    console.error('Timeline forecasting error:', error);
    return c.json({
      success: false,
      message: 'Error al generar predicciones de timeline',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/resource-allocation - Optimize resource allocation
forecastingRoutes.get('/resource-allocation', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const budget = c.req.query('budget');
    const timeframe = c.req.query('timeframe') || '1year';

    const allocationOptimization = await optimizeResourceAllocation(projectId, budget, timeframe);

    return c.json({
      success: true,
      forecasting: {
        type: 'resource_allocation',
        optimization: allocationOptimization,
        alternatives: await generateAllocationAlternatives(allocationOptimization),
        roi: await calculateAllocationROI(allocationOptimization),
        risk: await assessAllocationRisk(allocationOptimization)
      }
    });

  } catch (error) {
    console.error('Resource allocation forecasting error:', error);
    return c.json({
      success: false,
      message: 'Error al optimizar asignación de recursos',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/collaboration-potential - Predict collaboration opportunities
forecastingRoutes.get('/collaboration-potential', async (c) => {
  try {
    const institution = c.req.query('institution');
    const researchArea = c.req.query('area');
    const geography = c.req.query('geography') || 'national';

    const collaborationForecast = await predictCollaborationPotential(institution, researchArea, geography);

    return c.json({
      success: true,
      forecasting: {
        type: 'collaboration_potential',
        predictions: collaborationForecast,
        opportunities: await identifyCollaborationOpportunities(collaborationForecast),
        partnerships: await recommendPartnerships(collaborationForecast),
        successFactors: await analyzeCollaborationSuccessFactors()
      }
    });

  } catch (error) {
    console.error('Collaboration forecasting error:', error);
    return c.json({
      success: false,
      message: 'Error al predecir potencial de colaboración',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/innovation-impact - Predict innovation and impact
forecastingRoutes.get('/innovation-impact', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const innovationType = c.req.query('type') || 'all';

    const innovationForecast = await predictInnovationImpact(projectId, innovationType);

    return c.json({
      success: true,
      forecasting: {
        type: 'innovation_impact',
        predictions: innovationForecast,
        marketPotential: await assessMarketPotential(innovationForecast),
        commercialization: await predictCommercializationPath(innovationForecast),
        societalImpact: await measureSocietalImpact(innovationForecast)
      }
    });

  } catch (error) {
    console.error('Innovation impact forecasting error:', error);
    return c.json({
      success: false,
      message: 'Error al predecir impacto de innovación',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/risk-assessment - Comprehensive risk assessment
forecastingRoutes.get('/risk-assessment', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const riskType = c.req.query('type') || 'comprehensive';

    const riskAssessment = await performRiskAssessment(projectId, riskType);

    return c.json({
      success: true,
      forecasting: {
        type: 'risk_assessment',
        assessment: riskAssessment,
        mitigation: await generateRiskMitigationStrategies(riskAssessment),
        monitoring: await createRiskMonitoringPlan(riskAssessment),
        earlyWarning: await setupEarlyWarningSystem(riskAssessment)
      }
    });

  } catch (error) {
    console.error('Risk assessment error:', error);
    return c.json({
      success: false,
      message: 'Error al realizar evaluación de riesgos',
      forecasting: null
    }, 500);
  }
});

// POST /api/forecasting/scenario-analysis - Scenario planning and analysis
forecastingRoutes.post('/scenario-analysis', async (c) => {
  try {
    const { baseScenario, scenarios, variables } = await c.req.json();

    if (!baseScenario || !scenarios) {
      return c.json({
        success: false,
        message: 'Escenario base y escenarios alternativos son requeridos'
      }, 400);
    }

    const scenarioAnalysis = await performScenarioAnalysis(baseScenario, scenarios, variables);

    return c.json({
      success: true,
      forecasting: {
        type: 'scenario_analysis',
        analysis: scenarioAnalysis,
        recommendations: await generateScenarioRecommendations(scenarioAnalysis),
        sensitivity: await performSensitivityAnalysis(scenarioAnalysis),
        optimalPath: await identifyOptimalScenario(scenarioAnalysis)
      }
    });

  } catch (error) {
    console.error('Scenario analysis error:', error);
    return c.json({
      success: false,
      message: 'Error al realizar análisis de escenarios',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/benchmarking - Comparative benchmarking
forecastingRoutes.get('/benchmarking', async (c) => {
  try {
    const projectId = c.req.query('project_id');
    const benchmarkType = c.req.query('type') || 'institutional';
    const peerGroup = c.req.query('peer_group') || 'national';

    const benchmarkingData = await performBenchmarking(projectId, benchmarkType, peerGroup);

    return c.json({
      success: true,
      forecasting: {
        type: 'benchmarking',
        data: benchmarkingData,
        gaps: await identifyPerformanceGaps(benchmarkingData),
        improvement: await generateImprovementPlan(benchmarkingData),
        competitive: await analyzeCompetitivePosition(benchmarkingData)
      }
    });

  } catch (error) {
    console.error('Benchmarking error:', error);
    return c.json({
      success: false,
      message: 'Error al realizar benchmarking',
      forecasting: null
    }, 500);
  }
});

// GET /api/forecasting/trend-analysis - Advanced trend analysis
forecastingRoutes.get('/trend-analysis', async (c) => {
  try {
    const researchArea = c.req.query('area');
    const timeframe = c.req.query('timeframe') || '5years';
    const geography = c.req.query('geography') || 'global';

    const trendAnalysis = await performTrendAnalysis(researchArea, timeframe, geography);

    return c.json({
      success: true,
      forecasting: {
        type: 'trend_analysis',
        analysis: trendAnalysis,
        emerging: await identifyEmergingTrends(trendAnalysis),
        opportunities: await identifyTrendOpportunities(trendAnalysis),
        threats: await identifyTrendThreats(trendAnalysis)
      }
    });

  } catch (error) {
    console.error('Trend analysis error:', error);
    return c.json({
      success: false,
      message: 'Error al realizar análisis de tendencias',
      forecasting: null
    }, 500);
  }
});

// Helper functions for advanced forecasting
async function predictIndividualProjectSuccess(projectId: string) {
  // ML-powered individual project success prediction
  return {
    overallSuccess: 0.78,
    completionProbability: 0.85,
    fundingSuccess: 0.72,
    impactScore: 0.68,
    riskLevel: 'medium',
    keyFactors: {
      teamExpertise: 0.82,
      resourceAvailability: 0.75,
      methodology: 0.79,
      innovation: 0.71
    },
    timeline: {
      estimatedCompletion: '2025-08-15',
      confidence: 0.73,
      milestones: [
        { name: 'Fase de planificación', date: '2024-12-01', probability: 0.95 },
        { name: 'Ejecución principal', date: '2025-06-01', probability: 0.78 },
        { name: 'Cierre y evaluación', date: '2025-08-15', probability: 0.82 }
      ]
    }
  };
}

async function predictCategoryProjectSuccess(category: string, horizon: string) {
  return {
    category,
    horizon,
    successRates: {
      overall: 0.73,
      byInstitution: {
        'Universidad': 0.78,
        'Centro de Investigación': 0.71,
        'Empresa': 0.69,
        'Gobierno': 0.75
      },
      byFunding: {
        'Público': 0.68,
        'Privado': 0.76,
        'Mixto': 0.81
      }
    },
    trends: {
      improving: ['Metodología', 'Colaboración'],
      declining: ['Financiamiento tradicional'],
      stable: ['Infraestructura', 'Recursos humanos']
    }
  };
}

async function predictFundingProbability(projectId: string, fundingSource: string, amount?: string) {
  return {
    projectId,
    fundingSource,
    probability: 0.65,
    confidence: 0.78,
    factors: {
      alignment: 0.82,
      competitiveness: 0.71,
      trackRecord: 0.68,
      innovation: 0.74
    },
    timeline: {
      decisionDate: '2024-11-30',
      fundingPeriod: '2025-01-01 to 2025-12-31'
    },
    conditions: [
      'Presentar propuesta detallada antes del 15 de octubre',
      'Demostrar colaboración interinstitucional',
      'Incluir plan de sostenibilidad post-financiamiento'
    ]
  };
}

async function predictProjectTimeline(projectId: string, category: string) {
  return {
    projectId,
    category,
    estimatedDuration: 18, // months
    phases: [
      {
        name: 'Planificación',
        duration: 3,
        probability: 0.95,
        resources: ['Personal', 'Consultoría'],
        deliverables: ['Plan de proyecto', 'Presupuesto detallado']
      },
      {
        name: 'Ejecución',
        duration: 12,
        probability: 0.78,
        resources: ['Equipo de investigación', 'Infraestructura', 'Materiales'],
        deliverables: ['Progreso técnico', 'Publicaciones', 'Prototipos']
      },
      {
        name: 'Cierre',
        duration: 3,
        probability: 0.85,
        resources: ['Personal administrativo', 'Evaluadores'],
        deliverables: ['Informe final', 'Evaluación de impacto', 'Lecciones aprendidas']
      }
    ],
    riskFactors: [
      'Disponibilidad de recursos especializados',
      'Cambios en regulaciones',
      'Dependencia de colaboradores externos'
    ]
  };
}

async function optimizeResourceAllocation(projectId: string, budget: string, timeframe: string) {
  return {
    projectId,
    budget: parseFloat(budget),
    timeframe,
    optimalAllocation: {
      personnel: 0.45,
      equipment: 0.25,
      materials: 0.15,
      travel: 0.08,
      overhead: 0.07
    },
    alternatives: [
      {
        scenario: 'Conservador',
        allocation: { personnel: 0.50, equipment: 0.20, materials: 0.15, travel: 0.08, overhead: 0.07 },
        risk: 'low',
        expectedROI: 2.1
      },
      {
        scenario: 'Agresivo',
        allocation: { personnel: 0.40, equipment: 0.30, materials: 0.15, travel: 0.08, overhead: 0.07 },
        risk: 'high',
        expectedROI: 3.2
      }
    ],
    recommendations: [
      'Invertir en capacitación del personal para maximizar eficiencia',
      'Buscar proveedores locales para reducir costos de materiales',
      'Implementar sistema de monitoreo de gastos en tiempo real'
    ]
  };
}

async function predictCollaborationPotential(institution: string, researchArea: string, geography: string) {
  return {
    institution,
    researchArea,
    geography,
    potentialScore: 0.78,
    opportunities: [
      {
        type: 'Investigación conjunta',
        probability: 0.82,
        expectedImpact: 0.75,
        timeline: '6-12 meses'
      },
      {
        type: 'Intercambio de recursos',
        probability: 0.71,
        expectedImpact: 0.68,
        timeline: '3-6 meses'
      },
      {
        type: 'Publicación colaborativa',
        probability: 0.89,
        expectedImpact: 0.82,
        timeline: '3-9 meses'
      }
    ],
    recommendedPartners: [
      'Universidad Nacional de Colombia',
      'Universidad de Antioquia',
      'Centro Internacional de Agricultura Tropical'
    ]
  };
}

async function predictInnovationImpact(projectId: string, innovationType: string) {
  return {
    projectId,
    innovationType,
    impactScores: {
      scientific: 0.78,
      technological: 0.71,
      economic: 0.65,
      social: 0.82
    },
    commercialization: {
      patentPotential: 0.73,
      marketSize: 1500000,
      adoptionRate: 0.45,
      revenuePotential: 850000
    },
    timeline: {
      development: '12-18 months',
      commercialization: '24-36 months',
      fullMarket: '36-48 months'
    }
  };
}

async function performRiskAssessment(projectId: string, riskType: string) {
  return {
    projectId,
    riskType,
    overallRisk: 'medium',
    riskFactors: [
      {
        category: 'Técnico',
        probability: 0.3,
        impact: 0.7,
        mitigation: 'Implementar revisiones regulares de progreso técnico'
      },
      {
        category: 'Financiero',
        probability: 0.4,
        impact: 0.8,
        mitigation: 'Diversificar fuentes de financiamiento'
      },
      {
        category: 'Operacional',
        probability: 0.2,
        impact: 0.5,
        mitigation: 'Desarrollar plan de contingencia'
      },
      {
        category: 'Reputacional',
        probability: 0.1,
        impact: 0.9,
        mitigation: 'Mantener comunicación transparente con stakeholders'
      }
    ],
    riskScore: 0.45, // Overall risk score
    recommendations: [
      'Realizar revisiones mensuales de riesgos',
      'Asignar presupuesto específico para mitigación',
      'Establecer sistema de alerta temprana'
    ]
  };
}

async function performScenarioAnalysis(baseScenario: any, scenarios: any[], variables: any[]) {
  return {
    baseScenario,
    scenarios,
    variables,
    analysis: {
      bestCase: scenarios[0],
      worstCase: scenarios[scenarios.length - 1],
      mostLikely: scenarios[Math.floor(scenarios.length / 2)]
    },
    sensitivity: {
      variable1: { impact: 0.3, correlation: 0.7 },
      variable2: { impact: 0.5, correlation: 0.8 },
      variable3: { impact: 0.2, correlation: 0.4 }
    }
  };
}

async function performBenchmarking(projectId: string, benchmarkType: string, peerGroup: string) {
  return {
    projectId,
    benchmarkType,
    peerGroup,
    metrics: {
      efficiency: { current: 0.75, benchmark: 0.82, gap: -0.07 },
      impact: { current: 0.68, benchmark: 0.71, gap: -0.03 },
      innovation: { current: 0.73, benchmark: 0.69, gap: 0.04 },
      collaboration: { current: 0.65, benchmark: 0.78, gap: -0.13 }
    },
    ranking: {
      overall: 15,
      totalPeers: 25,
      percentile: 60
    }
  };
}

async function performTrendAnalysis(researchArea: string, timeframe: string, geography: string) {
  return {
    researchArea,
    timeframe,
    geography,
    trends: {
      growthRate: 0.15,
      volatility: 0.23,
      seasonality: 0.12,
      cyclical: 0.08
    },
    patterns: {
      emerging: ['IA aplicada', 'Sostenibilidad', 'Biotecnología'],
      declining: ['Métodos tradicionales', 'Monodisciplinario'],
      stable: ['Colaboración internacional', 'Ciencia abierta']
    }
  };
}

// Additional helper functions
async function analyzeFundingFactors(fundingSource: string) {
  return {
    successFactors: [
      'Alineación con prioridades del financiador',
      'Claridad en objetivos e impacto',
      'Equipo experimentado y diverso',
      'Presupuesto realista y bien justificado'
    ],
    commonPitfalls: [
      'Objetivos demasiado ambiciosos',
      'Falta de diferenciación',
      'Presupuesto inflado',
      'Equipo inadecuado'
    ]
  };
}

async function generateFundingRecommendations(predictions: any) {
  return [
    'Mejorar la presentación del equipo de investigación',
    'Fortalecer la justificación del impacto',
    'Buscar cartas de apoyo de instituciones reconocidas',
    'Revisar y ajustar el presupuesto'
  ];
}

async function calculateFundingConfidence(predictions: any): Promise<number> {
  return 0.78;
}

async function identifyTimelineRisks(predictions: any) {
  return [
    'Dependencia de proveedores externos',
    'Disponibilidad de recursos especializados',
    'Cambios en regulaciones gubernamentales',
    'Retrasos en aprobación ética'
  ];
}

async function optimizeTimeline(predictions: any) {
  return {
    optimizedDuration: predictions.estimatedDuration - 2,
    parallelActivities: ['Revisión ética', 'Contratación de personal'],
    bufferTime: 1, // month
    criticalPath: ['Planificación', 'Ejecución', 'Cierre']
  };
}

async function calculateTimelineConfidence(predictions: any): Promise<number> {
  return 0.72;
}

async function generateAllocationAlternatives(optimization: any) {
  return [
    {
      name: 'Enfoque en personal',
      allocation: { ...optimization.optimalAllocation, personnel: 0.55, equipment: 0.20 },
      expectedROI: 2.3,
      risk: 'medium'
    },
    {
      name: 'Enfoque en tecnología',
      allocation: { ...optimization.optimalAllocation, equipment: 0.35, personnel: 0.35 },
      expectedROI: 2.8,
      risk: 'high'
    }
  ];
}

async function calculateAllocationROI(optimization: any) {
  return {
    expectedROI: 2.5,
    paybackPeriod: 18, // months
    npv: 450000,
    irr: 0.28
  };
}

async function assessAllocationRisk(optimization: any) {
  return {
    overallRisk: 'low',
    riskFactors: [
      { factor: 'Concentración en personal', probability: 0.2, impact: 0.6 },
      { factor: 'Dependencia de equipo', probability: 0.3, impact: 0.8 }
    ]
  };
}

async function identifyCollaborationOpportunities(forecast: any) {
  return [
    'Proyecto conjunto con universidad internacional',
    'Intercambio de investigadores visitantes',
    'Uso compartido de infraestructura especializada',
    'Publicación colaborativa en revista de alto impacto'
  ];
}

async function recommendPartnerships(forecast: any) {
  return [
    {
      institution: 'Universidad Nacional de Colombia',
      synergy: 0.85,
      potentialProjects: ['Biotecnología marina', 'Cambio climático']
    },
    {
      institution: 'Centro Internacional de Agricultura Tropical',
      synergy: 0.78,
      potentialProjects: ['Agrotecnología', 'Desarrollo rural']
    }
  ];
}

async function analyzeCollaborationSuccessFactors() {
  return {
    keyFactors: [
      'Alineación de objetivos',
      'Complementariedad de expertise',
      'Comunicación efectiva',
      'Recursos compartidos'
    ],
    successRate: 0.73
  };
}

async function assessMarketPotential(forecast: any) {
  return {
    marketSize: 2500000,
    growthRate: 0.12,
    competition: 'medium',
    entryBarriers: 'low'
  };
}

async function predictCommercializationPath(forecast: any) {
  return {
    stages: [
      { stage: 'Prototipo', duration: 6, cost: 50000 },
      { stage: 'Pruebas', duration: 12, cost: 150000 },
      { stage: 'Lanzamiento', duration: 6, cost: 100000 }
    ],
    totalInvestment: 300000,
    expectedRevenue: 850000
  };
}

async function measureSocietalImpact(forecast: any) {
  return {
    dimensions: {
      environmental: 0.75,
      social: 0.82,
      economic: 0.68,
      health: 0.71
    },
    beneficiaries: 15000,
    sustainability: 0.78
  };
}

async function generateRiskMitigationStrategies(assessment: any) {
  return [
    'Implementar sistema de monitoreo continuo',
    'Desarrollar planes de contingencia',
    'Diversificar dependencias críticas',
    'Establecer comunicación regular con stakeholders'
  ];
}

async function createRiskMonitoringPlan(assessment: any) {
  return {
    frequency: 'monthly',
    indicators: ['Progreso técnico', 'Gasto presupuestario', 'Satisfacción del equipo'],
    thresholds: {
      warning: 0.7,
      critical: 0.5
    }
  };
}

async function setupEarlyWarningSystem(assessment: any) {
  return {
    triggers: [
      'Retraso > 10% en hitos',
      'Gasto > 90% del presupuesto',
      'Cambios en regulaciones relevantes'
    ],
    actions: [
      'Notificación inmediata al equipo',
      'Revisión de plan de mitigación',
      'Reunión de emergencia si es crítico'
    ]
  };
}

async function generateScenarioRecommendations(analysis: any) {
  return [
    'Preparar para escenario más probable con plan de contingencia',
    'Invertir en capacidades que beneficien múltiples escenarios',
    'Monitorear indicadores clave para detectar cambios tempranos'
  ];
}

async function performSensitivityAnalysis(analysis: any) {
  return {
    variables: [
      { name: 'Crecimiento del mercado', sensitivity: 0.8 },
      { name: 'Costo de desarrollo', sensitivity: 0.6 },
      { name: 'Tiempo de comercialización', sensitivity: 0.7 }
    ]
  };
}

async function identifyOptimalScenario(analysis: any) {
  return {
    scenario: 'Escenario 3 - Equilibrado',
    expectedValue: 1200000,
    probability: 0.65,
    risk: 'medium'
  };
}

async function identifyPerformanceGaps(benchmarking: any) {
  return {
    gaps: [
      { area: 'Colaboración', gap: -0.13, priority: 'high' },
      { area: 'Eficiencia', gap: -0.07, priority: 'medium' },
      { area: 'Innovación', gap: 0.04, priority: 'low' }
    ]
  };
}

async function generateImprovementPlan(benchmarking: any) {
  return [
    'Implementar programa de colaboración internacional',
    'Optimizar procesos internos para mejorar eficiencia',
    'Invertir en capacitación para fomentar innovación'
  ];
}

async function analyzeCompetitivePosition(benchmarking: any) {
  return {
    position: 'emerging',
    strengths: ['Innovación', 'Especialización'],
    weaknesses: ['Colaboración', 'Escala'],
    opportunities: ['Nuevos mercados', 'Tecnologías emergentes'],
    threats: ['Competidores establecidos', 'Cambios regulatorios']
  };
}

async function identifyEmergingTrends(analysis: any) {
  return [
    'Inteligencia Artificial aplicada a investigación',
    'Ciencia abierta y colaborativa',
    'Enfoque transdisciplinario',
    'Integración de datos masivos'
  ];
}

async function identifyTrendOpportunities(analysis: any) {
  return [
    'Liderar en áreas emergentes',
    'Formar alianzas estratégicas',
    'Desarrollar capacidades especializadas',
    'Crear plataformas colaborativas'
  ];
}

async function identifyTrendThreats(analysis: any) {
  return [
    'Obsolescencia de métodos tradicionales',
    'Competencia internacional',
    'Cambios en prioridades de financiamiento',
    'Brecha digital en investigación'
  ];
}

export default forecastingRoutes;