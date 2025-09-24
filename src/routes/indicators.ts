// HU-15: CTeI Indicators and Visualization System API Routes
// Sistema de Indicadores y Visualización de CTeI para CODECTI Chocó

import { Hono } from 'hono'
import { authMiddleware } from '../utils/middleware'
import type { 
  CTeIIndicators, 
  CTeIIndicatorsRequest, 
  CTeIIndicatorsResponse,
  ExecutiveReport,
  ExecutiveReportRequest,
  ExecutiveReportResponse,
  BenchmarkingRequest,
  BenchmarkingResponse,
  GeographicAnalysisRequest,
  GeographicAnalysisResponse,
  RegionalProductivity,
  InstitutionalMetrics,
  ResearchAreaMetrics,
  CollaborationNetwork,
  ImpactMetrics,
  TemporalTrend,
  GeographicMetrics,
  BenchmarkComparison,
  ReportVisualization
} from '../types'

const app = new Hono()

// Apply authentication middleware to all routes
app.use('/*', authMiddleware)

// ====================================
// MOCK DATA GENERATORS
// ====================================

// Mock data for Chocó CTeI indicators
function generateRegionalProductivity(): RegionalProductivity {
  return {
    total_projects: 89,
    active_projects: 34,
    completed_projects: 55,
    total_publications: 156,
    total_researchers: 278,
    total_institutions: 12,
    research_groups: 23,
    annual_growth_rate: 12.5,
    productivity_index: 76.8,
    regional_ranking: 18, // Position among 32 departments
    budget_allocation: 4500000000, // 4.5 billion COP
    international_collaborations: 28,
    patents_registered: 7,
    technology_transfers: 3
  }
}

function generateInstitutionalMetrics(): InstitutionalMetrics[] {
  return [
    {
      institution: "Universidad Tecnológica del Chocó",
      category: "universidad",
      projects_count: 45,
      publications_count: 89,
      researchers_count: 156,
      students_count: 3200,
      active_collaborations: 18,
      budget_total: 2800000000,
      productivity_score: 82.4,
      innovation_index: 67.2,
      impact_factor: 1.8,
      ranking_position: 1,
      h_index: 23,
      patents_count: 4,
      spin_offs: 2,
      international_projects: 12
    },
    {
      institution: "CODECTI Chocó",
      category: "gobierno",
      projects_count: 23,
      publications_count: 34,
      researchers_count: 45,
      students_count: 0,
      active_collaborations: 25,
      budget_total: 1200000000,
      productivity_score: 78.9,
      innovation_index: 89.3,
      impact_factor: 2.1,
      ranking_position: 2,
      h_index: 15,
      patents_count: 2,
      spin_offs: 1,
      international_projects: 8
    },
    {
      institution: "SINCHI - Instituto Amazónico",
      category: "centro_investigacion",
      projects_count: 18,
      publications_count: 28,
      researchers_count: 67,
      students_count: 45,
      active_collaborations: 15,
      budget_total: 800000000,
      productivity_score: 85.6,
      innovation_index: 74.1,
      impact_factor: 2.3,
      ranking_position: 3,
      h_index: 19,
      patents_count: 1,
      spin_offs: 0,
      international_projects: 6
    },
    {
      institution: "Fundación ProAves Colombia",
      category: "ong",
      projects_count: 12,
      publications_count: 18,
      researchers_count: 28,
      students_count: 0,
      active_collaborations: 12,
      budget_total: 350000000,
      productivity_score: 91.2,
      innovation_index: 68.7,
      impact_factor: 3.1,
      ranking_position: 4,
      h_index: 22,
      patents_count: 0,
      spin_offs: 0,
      international_projects: 8
    }
  ]
}

function generateResearchAreaMetrics(): ResearchAreaMetrics[] {
  return [
    {
      area: "Biodiversidad y Conservación",
      area_code: "UNESCO-2417",
      projects_count: 28,
      publications_count: 67,
      researchers_involved: 89,
      institutions_participating: 8,
      funding_total: 1800000000,
      collaboration_score: 87.3,
      international_links: 15,
      societal_impact: 92.1,
      technology_transfer: 4,
      patent_applications: 2,
      startup_creations: 1,
      policy_contributions: 8,
      media_coverage: 156
    },
    {
      area: "Biotecnología Marina",
      area_code: "UNESCO-2302",
      projects_count: 19,
      publications_count: 45,
      researchers_involved: 67,
      institutions_participating: 6,
      funding_total: 1200000000,
      collaboration_score: 78.9,
      international_links: 12,
      societal_impact: 76.4,
      technology_transfer: 3,
      patent_applications: 3,
      startup_creations: 2,
      policy_contributions: 4,
      media_coverage: 89
    },
    {
      area: "Acuicultura Sostenible",
      area_code: "UNESCO-3109",
      projects_count: 16,
      publications_count: 34,
      researchers_involved: 45,
      institutions_participating: 5,
      funding_total: 950000000,
      collaboration_score: 82.6,
      international_links: 8,
      societal_impact: 88.7,
      technology_transfer: 2,
      patent_applications: 1,
      startup_creations: 1,
      policy_contributions: 6,
      media_coverage: 67
    },
    {
      area: "Monitoreo Ambiental",
      area_code: "UNESCO-2308",
      projects_count: 14,
      publications_count: 28,
      researchers_involved: 38,
      institutions_participating: 7,
      funding_total: 780000000,
      collaboration_score: 74.2,
      international_links: 6,
      societal_impact: 85.3,
      technology_transfer: 1,
      patent_applications: 1,
      startup_creations: 0,
      policy_contributions: 12,
      media_coverage: 45
    },
    {
      area: "Etnobotánica y Medicina Tradicional",
      area_code: "UNESCO-2415",
      projects_count: 12,
      publications_count: 22,
      researchers_involved: 29,
      institutions_participating: 4,
      funding_total: 560000000,
      collaboration_score: 69.8,
      international_links: 4,
      societal_impact: 94.6,
      technology_transfer: 0,
      patent_applications: 0,
      startup_creations: 0,
      policy_contributions: 15,
      media_coverage: 78
    }
  ]
}

function generateCollaborationNetwork(): CollaborationNetwork {
  return {
    total_collaborations: 147,
    internal_collaborations: 89,
    national_collaborations: 42,
    international_collaborations: 16,
    inter_institutional: 67,
    interdisciplinary: 93,
    network_density: 0.68,
    clustering_coefficient: 0.72,
    key_nodes: [
      {
        entity: "Universidad Tecnológica del Chocó",
        type: "institution",
        connections: 23,
        centrality_score: 0.89,
        influence_index: 92.4,
        geographic_location: "Quibdó",
        specialization_areas: ["Biodiversidad", "Biotecnología", "Acuicultura"]
      },
      {
        entity: "Dr. María Elena Palacios",
        type: "researcher",
        connections: 18,
        centrality_score: 0.76,
        influence_index: 87.2,
        geographic_location: "Quibdó",
        specialization_areas: ["Biodiversidad Marina", "Conservación"]
      },
      {
        entity: "Proyecto BioCHOCÓ 2024",
        type: "project",
        connections: 15,
        centrality_score: 0.65,
        influence_index: 78.9,
        geographic_location: "Regional",
        specialization_areas: ["Biodiversidad", "Monitoreo"]
      },
      {
        entity: "Grupo BIODIMAR-UTCH",
        type: "research_group",
        connections: 12,
        centrality_score: 0.58,
        influence_index: 82.1,
        geographic_location: "Quibdó",
        specialization_areas: ["Biodiversidad Marina", "Biotecnología"]
      }
    ],
    collaboration_strength: {
      "Nacional": 0.72,
      "Internacional": 0.45,
      "Regional": 0.89,
      "Institucional": 0.94
    },
    geographic_reach: ["Colombia", "Ecuador", "Costa Rica", "España", "Estados Unidos"]
  }
}

function generateImpactMetrics(): ImpactMetrics {
  return {
    // Academic impact
    total_citations: 1847,
    h_index: 34,
    i10_index: 67,
    field_weighted_citation_impact: 1.89,
    average_citations_per_publication: 11.8,
    most_cited_publications: [
      {
        id: "pub-001",
        title: "Biodiversidad acuática del Pacífico chocoano: evaluación y conservación",
        authors: ["M.E. Palacios", "C. Rentería", "J. Murillo"],
        citations: 189,
        year: 2022,
        journal: "Biodiversity and Conservation",
        doi: "10.1007/s10531-022-02456-1",
        research_area: "Biodiversidad Marina",
        institution: "Universidad Tecnológica del Chocó"
      },
      {
        id: "pub-002", 
        title: "Microalgas del Chocó: potencial biotecnológico para biocombustibles",
        authors: ["A. Mosquera", "L.F. Jiménez", "R. García"],
        citations: 156,
        year: 2023,
        journal: "Algal Research",
        doi: "10.1016/j.algal.2023.03.012",
        research_area: "Biotecnología",
        institution: "Universidad Tecnológica del Chocó"
      },
      {
        id: "pub-003",
        title: "Macroinvertebrados bentónicos como bioindicadores de calidad del agua",
        authors: ["D. Córdoba", "F. Lozano"],
        citations: 134,
        year: 2022,
        journal: "Ecological Indicators",
        doi: "10.1016/j.ecolind.2022.09.045",
        research_area: "Monitoreo Ambiental",
        institution: "SINCHI"
      }
    ],
    
    // Societal impact
    societal_impact_score: 78.4,
    policy_documents_influenced: 23,
    media_mentions: 347,
    social_media_reach: 145000,
    
    // Economic impact
    technology_adoption_rate: 34.6,
    patent_citations: 45,
    licensing_revenue: 145000000, // 145M COP
    startup_valuations: 890000000, // 890M COP
    job_creation: 267,
    
    // Environmental impact
    environmental_benefits: 89.2,
    sustainable_development_contributions: 92.7,
    carbon_footprint_reduction: 1250 // tons CO2 equivalent
  }
}

function generateTemporalTrends(): TemporalTrend[] {
  const trends: TemporalTrend[] = []
  const currentYear = 2024
  
  // Generate data for last 24 months
  for (let year = currentYear - 1; year <= currentYear; year++) {
    for (let month = 1; month <= 12; month++) {
      if (year === currentYear && month > 9) break // Current month is September 2024
      
      const baseGrowth = month <= 6 ? 1.05 : 1.12 // Higher activity in second half
      const yearFactor = year === currentYear ? 1.15 : 1.0
      
      trends.push({
        period: `${year}-${month.toString().padStart(2, '0')}`,
        year: year,
        month: month,
        quarter: Math.ceil(month / 3),
        
        // Core metrics with seasonal variation
        projects: Math.floor((3 + Math.random() * 2) * baseGrowth * yearFactor),
        publications: Math.floor((5 + Math.random() * 3) * baseGrowth * yearFactor),
        researchers: Math.floor((15 + Math.random() * 5) * baseGrowth * yearFactor),
        funding: Math.floor((200000000 + Math.random() * 100000000) * baseGrowth * yearFactor),
        collaborations: Math.floor((4 + Math.random() * 2) * baseGrowth * yearFactor),
        
        // Innovation metrics
        innovation_output: Math.floor((2 + Math.random()) * baseGrowth * yearFactor),
        patents_filed: Math.floor(Math.random() * 2 * baseGrowth * yearFactor),
        technology_transfers: Math.floor(Math.random() * baseGrowth * yearFactor),
        startups_created: Math.floor(Math.random() * 0.5 * baseGrowth * yearFactor),
        
        // Quality metrics
        citation_rate: 8.5 + Math.random() * 3,
        international_collaboration_rate: 15.2 + Math.random() * 5,
        industry_partnerships: Math.floor(Math.random() * 3 * baseGrowth * yearFactor),
        
        // Growth indicators
        project_growth_rate: (baseGrowth - 1) * 100 + Math.random() * 5,
        researcher_growth_rate: (baseGrowth - 1) * 100 + Math.random() * 3,
        publication_growth_rate: (baseGrowth - 1) * 100 + Math.random() * 8,
        funding_growth_rate: (baseGrowth - 1) * 100 + Math.random() * 10
      })
    }
  }
  
  return trends
}

function generateGeographicMetrics(): GeographicMetrics[] {
  return [
    {
      municipality: "Quibdó",
      department: "Chocó", 
      region: "Pacífico",
      coordinates: { lat: 5.6947, lng: -76.6588 },
      projects_count: 45,
      institutions_count: 8,
      researchers_count: 189,
      publications_count: 89,
      funding_amount: 2800000000,
      infrastructure_investment: 450000000,
      equipment_value: 230000000,
      specialization_areas: ["Biodiversidad", "Biotecnología", "Acuicultura"],
      dominant_research_area: "Biodiversidad Marina",
      specialization_index: 0.78,
      collaboration_index: 0.89,
      international_connections: 15,
      national_connections: 34,
      population: 115000,
      gdp_contribution: 12.4,
      employment_in_ctei: 456
    },
    {
      municipality: "Bahía Solano",
      department: "Chocó",
      region: "Pacífico", 
      coordinates: { lat: 6.2297, lng: -77.3708 },
      projects_count: 12,
      institutions_count: 3,
      researchers_count: 28,
      publications_count: 18,
      funding_amount: 450000000,
      infrastructure_investment: 67000000,
      equipment_value: 34000000,
      specialization_areas: ["Turismo Científico", "Biodiversidad Marina"],
      dominant_research_area: "Biodiversidad Marina",
      specialization_index: 0.92,
      collaboration_index: 0.67,
      international_connections: 8,
      national_connections: 12,
      population: 10000,
      gdp_contribution: 8.7,
      employment_in_ctei: 45
    },
    {
      municipality: "Nuquí",
      department: "Chocó",
      region: "Pacífico",
      coordinates: { lat: 5.7116, lng: -77.2667 },
      projects_count: 8,
      institutions_count: 2,
      researchers_count: 15,
      publications_count: 12,
      funding_amount: 280000000,
      infrastructure_investment: 45000000,
      equipment_value: 18000000,
      specialization_areas: ["Conservación Marina", "Ecoturismo"],
      dominant_research_area: "Conservación Marina",
      specialization_index: 0.85,
      collaboration_index: 0.72,
      international_connections: 6,
      national_connections: 8,
      population: 8500,
      gdp_contribution: 15.3,
      employment_in_ctei: 28
    },
    {
      municipality: "Istmina",
      department: "Chocó",
      region: "Pacífico",
      coordinates: { lat: 5.1597, lng: -76.6847 },
      projects_count: 15,
      institutions_count: 4,
      researchers_count: 34,
      publications_count: 23,
      funding_amount: 670000000,
      infrastructure_investment: 89000000,
      equipment_value: 45000000,
      specialization_areas: ["Minería Sostenible", "Monitoreo Ambiental"],
      dominant_research_area: "Monitoreo Ambiental",
      specialization_index: 0.69,
      collaboration_index: 0.56,
      international_connections: 4,
      national_connections: 18,
      population: 23000,
      gdp_contribution: 9.8,
      employment_in_ctei: 67
    },
    {
      municipality: "Condoto",
      department: "Chocó",
      region: "Pacífico",
      coordinates: { lat: 5.0972, lng: -76.6431 },
      projects_count: 9,
      institutions_count: 2,
      researchers_count: 18,
      publications_count: 14,
      funding_amount: 340000000,
      infrastructure_investment: 56000000,
      equipment_value: 23000000,
      specialization_areas: ["Remediación Ambiental", "Etnobotánica"],
      dominant_research_area: "Etnobotánica",
      specialization_index: 0.74,
      collaboration_index: 0.43,
      international_connections: 2,
      national_connections: 12,
      population: 18000,
      gdp_contribution: 6.2,
      employment_in_ctei: 34
    }
  ]
}

function generateBenchmarkComparisons(): BenchmarkComparison[] {
  return [
    {
      category: "Productividad Científica",
      indicator: "Publicaciones por 100,000 habitantes",
      choco_value: 135.7,
      choco_position: 18,
      national_average: 89.3,
      national_median: 76.8,
      regional_average: 92.1,
      peer_departments: [
        { department: "Atlántico", value: 245.6, position: 3 },
        { department: "Valle del Cauca", value: 198.9, position: 7 },
        { department: "Magdalena", value: 145.2, position: 14 },
        { department: "Cauca", value: 142.8, position: 16 },
        { department: "Nariño", value: 139.4, position: 17 }
      ],
      international_reference: {
        country: "Costa Rica",
        region: "Región Pacífico Central",
        value: 189.7,
        source: "CONARE 2023"
      },
      performance_gap: 54.0,
      percentile_rank: 56.3,
      trend: "improving",
      target_value: 180.0,
      target_year: 2027
    },
    {
      category: "Colaboración Internacional",
      indicator: "Porcentaje de publicaciones con coautores internacionales",
      choco_value: 18.7,
      choco_position: 12,
      national_average: 15.4,
      national_median: 13.8,
      regional_average: 16.9,
      peer_departments: [
        { department: "Magdalena", value: 23.4, position: 8 },
        { department: "Atlántico", value: 31.2, position: 4 },
        { department: "Valle del Cauca", value: 29.8, position: 5 },
        { department: "Cauca", value: 19.7, position: 11 },
        { department: "Nariño", value: 17.3, position: 14 }
      ],
      international_reference: {
        country: "Ecuador",
        region: "Región Costa",
        value: 28.5,
        source: "SENESCYT 2023"
      },
      performance_gap: 9.8,
      percentile_rank: 62.5,
      trend: "improving",
      target_value: 25.0,
      target_year: 2026
    },
    {
      category: "Innovación Tecnológica",
      indicator: "Patentes por millón de habitantes",
      choco_value: 14.2,
      choco_position: 22,
      national_average: 23.7,
      national_median: 18.9,
      regional_average: 19.4,
      peer_departments: [
        { department: "Valle del Cauca", value: 67.8, position: 2 },
        { department: "Atlántico", value: 45.3, position: 6 },
        { department: "Magdalena", value: 19.8, position: 18 },
        { department: "Cauca", value: 16.7, position: 20 },
        { department: "Nariño", value: 12.4, position: 24 }
      ],
      performance_gap: 9.5,
      percentile_rank: 31.3,
      trend: "stable",
      target_value: 28.0,
      target_year: 2028
    }
  ]
}

function generateExecutiveReport(request: ExecutiveReportRequest): ExecutiveReport {
  const reportId = `rep-${Date.now()}`
  const currentDate = new Date().toISOString()
  
  return {
    id: reportId,
    title: `Informe Ejecutivo de Indicadores CTeI - Chocó ${request.period.start_date.substring(0, 4)}`,
    subtitle: `Análisis de productividad científica, tecnológica e innovación del departamento del Chocó`,
    type: request.type,
    scope: request.scope,
    
    period: {
      start_date: request.period.start_date,
      end_date: request.period.end_date,
      label: `${request.type === 'annual' ? 'Año' : 'Período'} ${request.period.start_date.substring(0, 4)}`
    },
    
    executive_summary: `El departamento del Chocó muestra un crecimiento sostenido en su productividad científica y tecnológica durante el período analizado. Con 89 proyectos activos, 156 publicaciones científicas y 278 investigadores registrados, la región se posiciona como un referente en biodiversidad marina y biotecnología en el Pacífico colombiano. El índice de productividad regional alcanzó 76.8 puntos, ubicando al Chocó en la posición 18 entre los 32 departamentos del país. La colaboración internacional aumentó un 23% respecto al período anterior, y se registraron 7 nuevas patentes en áreas de biotecnología marina y acuicultura sostenible.`,
    
    key_findings: [
      "Crecimiento del 12.5% anual en productividad científica",
      "Liderazgo nacional en investigación de biodiversidad marina",
      "Incremento del 23% en colaboraciones internacionales",
      "7 patentes registradas en biotecnología y acuicultura",
      "Creación de 3 spin-offs universitarios",
      "Generación de 267 empleos directos en CTeI",
      "Inversión total de $4.5 mil millones en I+D+i"
    ],
    
    recommendations: [
      {
        id: "rec-001",
        title: "Fortalecimiento de infraestructura de investigación",
        description: "Inversión en laboratorios especializados y equipamiento de alta tecnología para investigación marina",
        priority: "high",
        category: "infrastructure", 
        target_entities: ["CODECTI", "UTCH", "Gobierno Departamental"],
        implementation_timeline: "12-18 meses",
        expected_impact: "Incremento del 30% en capacidad de investigación",
        resources_required: "$2.5 mil millones COP",
        success_indicators: ["Nuevos equipos instalados", "Proyectos de investigación iniciados", "Publicaciones de alto impacto"],
        status: "proposed"
      },
      {
        id: "rec-002", 
        title: "Programa de internacionalización científica",
        description: "Establecimiento de convenios con universidades y centros de investigación internacionales",
        priority: "high",
        category: "collaboration",
        target_entities: ["UTCH", "CODECTI", "Cancillería"],
        implementation_timeline: "6-12 meses",
        expected_impact: "Duplicar colaboraciones internacionales en 2 años",
        resources_required: "$800 millones COP anuales",
        success_indicators: ["Convenios firmados", "Intercambios académicos", "Proyectos conjuntos"],
        status: "proposed"
      }
    ],
    
    strategic_priorities: [
      "Consolidación como hub de investigación en biodiversidad del Pacífico",
      "Desarrollo de la industria biotecnológica marina",
      "Formación de capital humano altamente calificado",
      "Transferencia tecnológica hacia el sector productivo",
      "Sostenibilidad ambiental en todas las actividades de CTeI"
    ],
    
    risk_assessment: [
      {
        risk: "Fuga de cerebros hacia otros departamentos",
        category: "strategic",
        probability: "medium",
        impact: "high", 
        risk_level: "high",
        mitigation_strategies: [
          "Programa de incentivos para investigadores",
          "Mejoramiento de condiciones laborales",
          "Oportunidades de desarrollo profesional"
        ],
        responsible_entity: "CODECTI - UTCH",
        monitoring_indicators: ["Tasa de retención de investigadores", "Nuevas contrataciones", "Satisfacción laboral"]
      },
      {
        risk: "Reducción de financiamiento nacional",
        category: "financial",
        probability: "medium",
        impact: "high",
        risk_level: "high", 
        mitigation_strategies: [
          "Diversificación de fuentes de financiamiento",
          "Alianzas público-privadas",
          "Cooperación internacional"
        ],
        responsible_entity: "CODECTI",
        monitoring_indicators: ["Presupuesto ejecutado", "Número de fuentes activas", "Proyectos financiados"]
      }
    ],
    
    indicators: {
      regional_productivity: generateRegionalProductivity(),
      institutional_comparison: generateInstitutionalMetrics(),
      research_areas: generateResearchAreaMetrics(),
      collaboration_networks: generateCollaborationNetwork(),
      impact_metrics: generateImpactMetrics(),
      temporal_trends: generateTemporalTrends().slice(-12), // Last 12 months
      geographic_distribution: generateGeographicMetrics(),
      generated_at: currentDate
    },
    
    benchmarks: generateBenchmarkComparisons(),
    
    swot_analysis: {
      strengths: [
        {
          factor: "Biodiversidad excepcional",
          description: "El Chocó alberga una de las biotas más ricas del planeta",
          impact_level: "high",
          evidence: ["Alto endemismo", "Ecosistemas únicos", "Reconocimiento internacional"],
          related_indicators: ["Publicaciones en biodiversidad", "Proyectos de conservación"]
        },
        {
          factor: "Ubicación estratégica",
          description: "Acceso privilegiado al Océano Pacífico y conexión con Centro América",
          impact_level: "high", 
          evidence: ["Puerto de Buenaventura cercano", "Frontera con Panamá", "Corredor biológico"],
          related_indicators: ["Colaboraciones internacionales", "Proyectos transfronterizos"]
        }
      ],
      weaknesses: [
        {
          factor: "Infraestructura limitada",
          description: "Carencias en conectividad y servicios básicos",
          impact_level: "high",
          evidence: ["Baja cobertura internet", "Vías en mal estado", "Servicios públicos deficientes"],
          related_indicators: ["Inversión en infraestructura", "Conectividad digital"]
        }
      ],
      opportunities: [
        {
          factor: "Economía azul global",
          description: "Creciente interés mundial en recursos marinos sostenibles",
          impact_level: "high",
          evidence: ["Mercados emergentes", "Financiamiento internacional", "Políticas favorables"],
          related_indicators: ["Proyectos de biotecnología marina", "Inversión extranjera"]
        }
      ],
      threats: [
        {
          factor: "Cambio climático",
          description: "Impactos en ecosistemas y actividad pesquera",
          impact_level: "high",
          evidence: ["Aumento temperatura oceánica", "Alteración corrientes marinas", "Eventos extremos"],
          related_indicators: ["Estudios de impacto climático", "Proyectos de adaptación"]
        }
      ],
      strategic_implications: [
        "Aprovechar biodiversidad para liderazgo en biotecnología marina",
        "Desarrollar infraestructura resiliente al cambio climático",
        "Posicionar al Chocó como referente en economía azul",
        "Fortalecer capacidades locales de investigación"
      ],
      action_items: [
        "Elaborar plan maestro de infraestructura científica",
        "Crear fondo de financiamiento para biotecnología marina",
        "Establecer observatorio de cambio climático regional",
        "Desarrollar programa de formación de investigadores"
      ]
    },
    
    visualizations: [
      {
        id: "viz-productivity-trend",
        title: "Tendencia de Productividad Científica 2022-2024",
        description: "Evolución mensual de publicaciones, proyectos y colaboraciones",
        type: "chart",
        category: "trends",
        chart_config: {
          type: "line",
          data_source: "temporal_trends",
          x_axis: "period",
          y_axis: "publications",
          series: ["publications", "projects", "collaborations"],
          colors: ["#3B82F6", "#10B981", "#F59E0B"],
          interactive: true
        },
        data_source: "indicators.temporal_trends",
        refresh_frequency: "monthly",
        last_updated: currentDate,
        export_formats: ["png", "svg", "pdf"],
        size: "large",
        position: { row: 1, column: 1, width: 12, height: 6 }
      },
      {
        id: "viz-institutional-comparison",
        title: "Comparación Institucional - Productividad vs Impacto",
        description: "Matriz de posicionamiento de instituciones por productividad e impacto",
        type: "chart",
        category: "comparison", 
        chart_config: {
          type: "scatter",
          data_source: "institutional_comparison",
          x_axis: "productivity_score",
          y_axis: "impact_factor",
          colors: ["#8B5CF6"],
          interactive: true
        },
        data_source: "indicators.institutional_comparison",
        refresh_frequency: "quarterly",
        last_updated: currentDate,
        export_formats: ["png", "svg"],
        size: "medium",
        position: { row: 2, column: 1, width: 6, height: 4 }
      },
      {
        id: "viz-geographic-distribution",
        title: "Distribución Geográfica de Actividad CTeI",
        description: "Mapa de calor de proyectos e investigadores por municipio",
        type: "map",
        category: "geographic",
        map_config: {
          type: "heatmap",
          base_layer: "openstreet",
          data_layer: "projects_count",
          zoom_level: 8,
          center: { lat: 5.6947, lng: -76.6588 }
        },
        data_source: "indicators.geographic_distribution", 
        refresh_frequency: "quarterly",
        last_updated: currentDate,
        export_formats: ["png", "svg"],
        size: "medium",
        position: { row: 2, column: 2, width: 6, height: 4 }
      }
    ],
    
    infographics: [
      {
        id: "inf-total-projects",
        title: "Proyectos Totales",
        type: "metric",
        value: 89,
        unit: "proyectos",
        icon: "fas fa-project-diagram",
        color: "#3B82F6",
        trend: "up",
        change_value: 12.5,
        change_period: "vs año anterior",
        position: { x: 0, y: 0, width: 3, height: 2 }
      },
      {
        id: "inf-publications",
        title: "Publicaciones Científicas", 
        type: "metric",
        value: 156,
        unit: "publicaciones",
        icon: "fas fa-book-open",
        color: "#10B981",
        trend: "up",
        change_value: 18.7,
        change_period: "vs año anterior", 
        position: { x: 3, y: 0, width: 3, height: 2 }
      },
      {
        id: "inf-researchers",
        title: "Investigadores Activos",
        type: "metric", 
        value: 278,
        unit: "investigadores",
        icon: "fas fa-users",
        color: "#8B5CF6",
        trend: "up",
        change_value: 8.3,
        change_period: "vs año anterior",
        position: { x: 6, y: 0, width: 3, height: 2 }
      },
      {
        id: "inf-ranking",
        title: "Posición Nacional",
        type: "metric",
        value: 18,
        unit: "de 32 departamentos", 
        icon: "fas fa-trophy",
        color: "#F59E0B",
        trend: "up",
        change_value: 2,
        change_period: "posiciones mejoradas",
        position: { x: 9, y: 0, width: 3, height: 2 }
      }
    ],
    
    generated_by: "Sistema de Indicadores CTeI - CODECTI Chocó",
    generated_by_role: "Administrador del Sistema",
    generated_at: currentDate,
    
    status: "published",
    confidentiality: "public",
    target_audience: ["Directivos CODECTI", "Gobernación del Chocó", "Rectores Universitarios", "MinCiencias"],
    
    version: "1.0",
    
    available_formats: ["pdf", "word", "web"],
    download_urls: {
      pdf: `/api/indicators/reports/${reportId}/download?format=pdf`,
      word: `/api/indicators/reports/${reportId}/download?format=word`,
      web: `/indicadores/reportes/${reportId}`
    }
  }
}

// ====================================
// API ENDPOINTS
// ====================================

// GET /api/indicators - Get comprehensive CTeI indicators
app.get('/', async (c) => {
  try {
    const query = c.req.query()
    const filters = query.filters ? JSON.parse(query.filters) : {}
    
    const indicators: CTeIIndicators = {
      regional_productivity: generateRegionalProductivity(),
      institutional_comparison: generateInstitutionalMetrics(),
      research_areas: generateResearchAreaMetrics(),
      collaboration_networks: generateCollaborationNetwork(),
      impact_metrics: generateImpactMetrics(),
      temporal_trends: generateTemporalTrends(),
      geographic_distribution: generateGeographicMetrics(),
      generated_at: new Date().toISOString()
    }
    
    const response: CTeIIndicatorsResponse = {
      success: true,
      data: indicators,
      metadata: {
        calculation_date: new Date().toISOString(),
        data_sources: [
          "CODECTI Database", 
          "UTCH Research Registry",
          "MinCiencias SNCTI",
          "Scopus Database",
          "Web of Science"
        ],
        coverage_period: "2022-2024",
        reliability_score: 0.89,
        completeness_percentage: 94.3
      },
      message: "Indicadores CTeI generados exitosamente"
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error generating CTeI indicators:', error)
    return c.json({
      success: false,
      message: 'Error al generar indicadores CTeI'
    }, 500)
  }
})

// GET /api/indicators/productivity - Regional productivity metrics
app.get('/productivity', async (c) => {
  try {
    const productivity = generateRegionalProductivity()
    
    return c.json({
      success: true,
      data: productivity,
      generated_at: new Date().toISOString(),
      message: "Métricas de productividad regional obtenidas"
    })
  } catch (error) {
    console.error('Error getting productivity metrics:', error)
    return c.json({
      success: false,
      message: 'Error al obtener métricas de productividad'
    }, 500)
  }
})

// GET /api/indicators/institutions - Institutional comparison metrics  
app.get('/institutions', async (c) => {
  try {
    const institutions = generateInstitutionalMetrics()
    
    return c.json({
      success: true,
      data: {
        institutions,
        total_institutions: institutions.length,
        top_performer: institutions.reduce((prev, current) => 
          prev.productivity_score > current.productivity_score ? prev : current
        )
      },
      generated_at: new Date().toISOString(),
      message: "Métricas institucionales obtenidas"
    })
  } catch (error) {
    console.error('Error getting institutional metrics:', error)
    return c.json({
      success: false,
      message: 'Error al obtener métricas institucionales'
    }, 500)
  }
})

// GET /api/indicators/areas - Research areas analysis
app.get('/areas', async (c) => {
  try {
    const areas = generateResearchAreaMetrics()
    
    return c.json({
      success: true,
      data: {
        research_areas: areas,
        total_areas: areas.length,
        leading_area: areas.reduce((prev, current) =>
          prev.collaboration_score > current.collaboration_score ? prev : current
        ),
        total_funding: areas.reduce((sum, area) => sum + area.funding_total, 0)
      },
      generated_at: new Date().toISOString(),
      message: "Análisis de áreas de investigación obtenido"
    })
  } catch (error) {
    console.error('Error getting research areas:', error)
    return c.json({
      success: false,
      message: 'Error al obtener análisis de áreas de investigación'
    }, 500)
  }
})

// GET /api/indicators/collaboration - Collaboration network analysis
app.get('/collaboration', async (c) => {
  try {
    const network = generateCollaborationNetwork()
    
    return c.json({
      success: true,
      data: network,
      insights: {
        network_health: network.network_density > 0.6 ? "Saludable" : "Necesita fortalecimiento",
        international_percentage: (network.international_collaborations / network.total_collaborations * 100).toFixed(1),
        key_connector: network.key_nodes[0]
      },
      generated_at: new Date().toISOString(),
      message: "Análisis de red de colaboración obtenido"
    })
  } catch (error) {
    console.error('Error getting collaboration network:', error)
    return c.json({
      success: false,
      message: 'Error al obtener análisis de red de colaboración'
    }, 500)
  }
})

// GET /api/indicators/impact - Impact metrics and citations
app.get('/impact', async (c) => {
  try {
    const impact = generateImpactMetrics()
    
    return c.json({
      success: true,
      data: impact,
      insights: {
        citation_performance: impact.average_citations_per_publication > 10 ? "Excelente" : "Bueno",
        societal_impact_level: impact.societal_impact_score > 70 ? "Alto" : "Medio",
        economic_contribution: `$${(impact.licensing_revenue / 1000000).toFixed(1)}M COP en licencias`
      },
      generated_at: new Date().toISOString(), 
      message: "Métricas de impacto obtenidas"
    })
  } catch (error) {
    console.error('Error getting impact metrics:', error)
    return c.json({
      success: false,
      message: 'Error al obtener métricas de impacto'
    }, 500)
  }
})

// GET /api/indicators/trends - Temporal trends analysis
app.get('/trends', async (c) => {
  try {
    const trends = generateTemporalTrends()
    const recentTrends = trends.slice(-12) // Last 12 months
    
    const totalGrowth = {
      projects: ((recentTrends[recentTrends.length - 1].projects / recentTrends[0].projects) - 1) * 100,
      publications: ((recentTrends[recentTrends.length - 1].publications / recentTrends[0].publications) - 1) * 100,
      researchers: ((recentTrends[recentTrends.length - 1].researchers / recentTrends[0].researchers) - 1) * 100
    }
    
    return c.json({
      success: true,
      data: {
        monthly_trends: recentTrends,
        annual_summary: {
          total_periods: recentTrends.length,
          growth_rates: totalGrowth,
          peak_month: recentTrends.reduce((prev, current) =>
            prev.publications > current.publications ? prev : current
          )
        }
      },
      generated_at: new Date().toISOString(),
      message: "Análisis de tendencias temporales obtenido"
    })
  } catch (error) {
    console.error('Error getting temporal trends:', error)
    return c.json({
      success: false,
      message: 'Error al obtener análisis de tendencias temporales'
    }, 500)
  }
})

// GET /api/indicators/geographic - Geographic distribution analysis
app.get('/geographic', async (c) => {
  try {
    const query = c.req.query()
    const scope = query.scope || 'choco'
    
    const request: GeographicAnalysisRequest = {
      scope: scope as 'choco' | 'colombia' | 'region',
      indicators: ['projects_count', 'researchers_count', 'publications_count', 'funding_amount'],
      aggregation_level: 'municipality'
    }
    
    const geographic = generateGeographicMetrics()
    
    // Calculate regional totals
    const regional_summary = {
      total_projects: geographic.reduce((sum, g) => sum + g.projects_count, 0),
      total_researchers: geographic.reduce((sum, g) => sum + g.researchers_count, 0),
      total_publications: geographic.reduce((sum, g) => sum + g.publications_count, 0),
      total_funding: geographic.reduce((sum, g) => sum + g.funding_amount, 0),
      participating_municipalities: geographic.length
    }
    
    // Identify spatial patterns
    const spatial_patterns = {
      hotspots: geographic.filter(g => g.projects_count >= 15).slice(0, 3),
      clusters: [
        {
          name: "Cluster Quibdó-Istmina",
          municipalities: ["Quibdó", "Istmina"],
          characteristics: ["Centro administrativo", "Infraestructura educativa", "Conectividad terrestre"]
        },
        {
          name: "Cluster Costero",
          municipalities: ["Bahía Solano", "Nuquí"],
          characteristics: ["Biodiversidad marina", "Turismo científico", "Acceso marítimo"]
        }
      ],
      connectivity_matrix: {
        "Quibdó": { "Istmina": 0.78, "Bahía Solano": 0.45, "Nuquí": 0.32, "Condoto": 0.67 },
        "Istmina": { "Quibdó": 0.78, "Condoto": 0.89, "Bahía Solano": 0.23, "Nuquí": 0.18 },
        "Bahía Solano": { "Nuquí": 0.92, "Quibdó": 0.45, "Istmina": 0.23, "Condoto": 0.12 },
        "Nuquí": { "Bahía Solano": 0.92, "Quibdó": 0.32, "Istmina": 0.18, "Condoto": 0.08 },
        "Condoto": { "Istmina": 0.89, "Quibdó": 0.67, "Bahía Solano": 0.12, "Nuquí": 0.08 }
      }
    }
    
    const response: GeographicAnalysisResponse = {
      success: true,
      data: {
        geographic_data: geographic,
        regional_summary: {
          ...generateRegionalProductivity(),
          ...regional_summary
        },
        spatial_patterns
      },
      message: "Análisis geográfico completado"
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error getting geographic analysis:', error)
    return c.json({
      success: false,
      message: 'Error al obtener análisis geográfico'
    }, 500)
  }
})

// POST /api/indicators/benchmarking - Generate benchmarking analysis
app.post('/benchmarking', async (c) => {
  try {
    const body = await c.req.json() as BenchmarkingRequest
    
    const benchmarks = generateBenchmarkComparisons()
    
    // Filter benchmarks based on requested indicators
    const filteredBenchmarks = body.indicators?.length 
      ? benchmarks.filter(b => body.indicators.includes(b.indicator))
      : benchmarks
    
    // Calculate overall ranking
    const avgPercentile = filteredBenchmarks.reduce((sum, b) => sum + b.percentile_rank, 0) / filteredBenchmarks.length
    const rankingPosition = Math.round(32 * (1 - avgPercentile / 100)) // Position among 32 departments
    
    const response: BenchmarkingResponse = {
      success: true,
      data: {
        target_entity: body.target_entity || "Chocó",
        benchmarks: filteredBenchmarks,
        ranking_position: rankingPosition,
        percentile_rank: avgPercentile,
        key_insights: [
          "Chocó supera el promedio nacional en colaboración internacional",
          "Oportunidad de mejora en productividad de patentes", 
          "Fortaleza en publicaciones científicas per cápita",
          "Necesidad de incrementar transferencia tecnológica"
        ],
        improvement_areas: [
          "Innovación tecnológica y patentes",
          "Infraestructura de investigación",
          "Vinculación universidad-empresa",
          "Financiamiento privado de I+D"
        ]
      },
      message: "Análisis de benchmarking completado"
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error generating benchmarking:', error)
    return c.json({
      success: false,
      message: 'Error al generar análisis de benchmarking'
    }, 500)
  }
})

// POST /api/indicators/reports - Generate executive report
app.post('/reports', async (c) => {
  try {
    const body = await c.req.json() as ExecutiveReportRequest
    
    const report = generateExecutiveReport(body)
    
    const response: ExecutiveReportResponse = {
      success: true,
      data: report,
      download_urls: report.download_urls,
      message: "Reporte ejecutivo generado exitosamente"
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error generating executive report:', error)
    return c.json({
      success: false,
      message: 'Error al generar reporte ejecutivo'
    }, 500)
  }
})

// GET /api/indicators/reports/:id - Get specific executive report
app.get('/reports/:id', async (c) => {
  try {
    const reportId = c.req.param('id')
    
    // In a real implementation, this would fetch from database
    // For now, generate a sample report
    const mockRequest: ExecutiveReportRequest = {
      type: 'annual',
      scope: 'departmental',
      period: {
        start_date: '2024-01-01',
        end_date: '2024-12-31'
      }
    }
    
    const report = generateExecutiveReport(mockRequest)
    report.id = reportId // Override with requested ID
    
    return c.json({
      success: true,
      data: report,
      message: "Reporte ejecutivo obtenido"
    })
  } catch (error) {
    console.error('Error getting executive report:', error)
    return c.json({
      success: false,
      message: 'Error al obtener reporte ejecutivo'
    }, 500)
  }
})

// GET /api/indicators/reports/:id/download - Download report in specific format
app.get('/reports/:id/download', async (c) => {
  try {
    const reportId = c.req.param('id')
    const format = c.req.query('format') || 'pdf'
    
    // In a real implementation, this would generate and return the actual file
    return c.json({
      success: true,
      message: `Descarga de reporte ${reportId} en formato ${format} iniciada`,
      download_url: `/downloads/reports/${reportId}.${format}`,
      estimated_size: "2.3 MB",
      estimated_time: "30 segundos"
    })
  } catch (error) {
    console.error('Error downloading report:', error)
    return c.json({
      success: false,
      message: 'Error al descargar reporte'
    }, 500)
  }
})

// GET /api/indicators/dashboard - Dashboard data for visualization components
app.get('/dashboard', async (c) => {
  try {
    const productivity = generateRegionalProductivity()
    const institutions = generateInstitutionalMetrics()
    const areas = generateResearchAreaMetrics()
    const collaboration = generateCollaborationNetwork()
    const impact = generateImpactMetrics()
    const trends = generateTemporalTrends().slice(-6) // Last 6 months
    const geographic = generateGeographicMetrics()
    
    const dashboard = {
      overview_cards: [
        {
          id: 'total-projects',
          title: 'Proyectos Activos',
          value: productivity.total_projects,
          change: '+12.5%',
          trend: 'up',
          icon: 'fas fa-project-diagram',
          color: '#3B82F6'
        },
        {
          id: 'total-publications',
          title: 'Publicaciones', 
          value: productivity.total_publications,
          change: '+18.7%',
          trend: 'up',
          icon: 'fas fa-book-open',
          color: '#10B981'
        },
        {
          id: 'total-researchers',
          title: 'Investigadores',
          value: productivity.total_researchers,
          change: '+8.3%', 
          trend: 'up',
          icon: 'fas fa-users',
          color: '#8B5CF6'
        },
        {
          id: 'ranking-position',
          title: 'Posición Nacional',
          value: `#${productivity.regional_ranking}`,
          change: '↑2 pos',
          trend: 'up',
          icon: 'fas fa-trophy',
          color: '#F59E0B'
        }
      ],
      
      quick_charts: [
        {
          id: 'productivity-trend',
          title: 'Tendencia de Productividad',
          type: 'line',
          data: {
            labels: trends.map(t => t.period),
            datasets: [{
              label: 'Publicaciones',
              data: trends.map(t => t.publications),
              borderColor: '#3B82F6',
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }]
          }
        },
        {
          id: 'institutional-performance',
          title: 'Rendimiento Institucional', 
          type: 'bar',
          data: {
            labels: institutions.map(i => i.institution.split(' ')[0]), // Shortened names
            datasets: [{
              label: 'Score de Productividad',
              data: institutions.map(i => i.productivity_score),
              backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B']
            }]
          }
        },
        {
          id: 'research-areas',
          title: 'Áreas de Investigación',
          type: 'doughnut',
          data: {
            labels: areas.map(a => a.area),
            datasets: [{
              data: areas.map(a => a.projects_count),
              backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444']
            }]
          }
        },
        {
          id: 'collaboration-network',
          title: 'Red de Colaboración',
          type: 'radar',
          data: {
            labels: ['Interno', 'Nacional', 'Internacional', 'Interdisciplinario', 'Inter-institucional'],
            datasets: [{
              label: 'Colaboraciones',
              data: [
                collaboration.internal_collaborations,
                collaboration.national_collaborations, 
                collaboration.international_collaborations,
                collaboration.interdisciplinary,
                collaboration.inter_institutional
              ],
              backgroundColor: 'rgba(59, 130, 246, 0.2)',
              borderColor: '#3B82F6'
            }]
          }
        }
      ],
      
      key_insights: [
        {
          insight: "Crecimiento sostenido en productividad científica",
          impact: "high",
          trend: "positive",
          metric: "+12.5% anual"
        },
        {
          insight: "Liderazgo regional en biodiversidad marina", 
          impact: "high",
          trend: "stable",
          metric: "67 publicaciones"
        },
        {
          insight: "Incremento en colaboraciones internacionales",
          impact: "medium",
          trend: "positive", 
          metric: "+23% vs año anterior"
        },
        {
          insight: "Oportunidad de mejora en patentes",
          impact: "medium",
          trend: "stable",
          metric: "14.2 por millón hab."
        }
      ],
      
      recent_activity: [
        {
          type: "publication",
          title: "Nueva publicación en Biodiversity & Conservation",
          description: "Estudio sobre microalgas del Pacífico chocoano",
          timestamp: "2024-09-08T10:30:00Z",
          impact: "high"
        },
        {
          type: "collaboration",
          title: "Convenio con Universidad de Costa Rica",
          description: "Proyecto conjunto de biotecnología marina",
          timestamp: "2024-09-05T14:15:00Z", 
          impact: "high"
        },
        {
          type: "funding",
          title: "Financiamiento aprobado - MinCiencias",
          description: "450M COP para proyecto de acuicultura sostenible",
          timestamp: "2024-09-03T09:00:00Z",
          impact: "medium"
        }
      ],
      
      geographic_summary: {
        total_municipalities: geographic.length,
        active_municipalities: geographic.filter(g => g.projects_count > 0).length,
        leading_municipality: geographic.reduce((prev, current) => 
          prev.projects_count > current.projects_count ? prev : current
        ),
        total_coverage: `${geographic.length}/30 municipios`
      },
      
      generated_at: new Date().toISOString()
    }
    
    return c.json({
      success: true,
      data: dashboard,
      message: "Datos del dashboard obtenidos"
    })
  } catch (error) {
    console.error('Error getting dashboard data:', error)
    return c.json({
      success: false,
      message: 'Error al obtener datos del dashboard'
    }, 500)
  }
})

export { app as indicatorsRoutes }