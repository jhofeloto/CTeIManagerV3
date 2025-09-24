// HU-14: Scientific Publications and DOI System API Routes
import { Hono } from 'hono';
import { 
  Publication, 
  CreatePublicationRequest, 
  UpdatePublicationRequest,
  PublicationListRequest,
  PublicationListResponse,
  PublicationResponse,
  PublicationSearchRequest,
  PublicationSearchResponse,
  CitationResponse,
  DOIResponse,
  PublicationStatsResponse,
  DublinCoreMetadata,
  PublicationAuthor,
  FundingSource,
  PublicationMetricsResponse
} from '../types';
import { verifyJWT } from '../utils/auth';

const publications = new Hono();

// Authentication middleware for admin routes
publications.use('*', async (c, next) => {
  // Skip auth for public GET routes
  if (c.req.method === 'GET') {
    return next();
  }

  // For admin operations (POST, PUT, DELETE), require authentication
  if (c.req.method !== 'GET') {
    const authHeader = c.req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ success: false, message: 'Token de autorización requerido' }, 401);
    }

    const token = authHeader.substring(7);
    
    // Mock authentication for testing - accept any token starting with "mock-"
    if (token.startsWith('mock-')) {
      c.set('user', { userId: 1, email: 'admin@codecti.choco.gov.co', role: 'admin' });
      return next();
    }

    const payload = await verifyJWT(token);
    
    if (!payload) {
      return c.json({ success: false, message: 'Token inválido o expirado' }, 401);
    }

    c.set('user', payload);
  }
  
  return next();
});

// Utility functions for DOI generation and metadata
function generateDOI(publicationId: string): string {
  const year = new Date().getFullYear();
  const sequence = publicationId.split('-')[1] || Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `10.5281/codecti.choco.${year}.${sequence}`;
}

function generateDublinCore(publication: Publication): DublinCoreMetadata {
  return {
    title: publication.title,
    creator: publication.authors.map(a => a.name),
    subject: [...publication.subject_areas, ...publication.keywords],
    description: publication.abstract,
    publisher: 'CODECTI Chocó',
    contributor: publication.authors.filter(a => a.role === 'contributor').map(a => a.name),
    date: publication.publication_date,
    type: publication.publication_type,
    format: 'application/pdf',
    identifier: publication.doi,
    source: publication.journal_name || 'CODECTI Chocó Repository',
    language: publication.language,
    relation: publication.related_publications,
    coverage: publication.geographic_coverage?.join(', '),
    rights: `Licensed under ${publication.license}`,
    abstract: publication.abstract,
    created: publication.created_at,
    issued: publication.published_at || publication.publication_date,
    license: publication.license,
    bibliographicCitation: generateCitation(publication, 'apa'),
    references: publication.cites
  };
}

function generateCitation(publication: Publication, format: string): string {
  const authors = publication.authors
    .sort((a, b) => a.position - b.position)
    .map(a => a.name)
    .join(', ');
  
  const year = new Date(publication.publication_date).getFullYear();
  
  switch (format) {
    case 'apa':
      return `${authors} (${year}). ${publication.title}. ${publication.journal_name || 'CODECTI Chocó Repository'}. https://doi.org/${publication.doi}`;
    case 'mla':
      return `${authors}. "${publication.title}." ${publication.journal_name || 'CODECTI Chocó Repository'}, ${year}, doi:${publication.doi}.`;
    case 'chicago':
      return `${authors}. "${publication.title}." ${publication.journal_name || 'CODECTI Chocó Repository'} (${year}). https://doi.org/${publication.doi}.`;
    default:
      return `${authors} (${year}). ${publication.title}. ${publication.journal_name || 'CODECTI Chocó Repository'}.`;
  }
}

// Mock database - In production, this would be D1 database operations
const mockPublications: Publication[] = [
  {
    id: 'pub-001',
    title: 'Biodiversidad Acuática del Chocó: Análisis Integral de Ecosistemas Marinos y Fluviales',
    abstract: 'Este estudio presenta un análisis comprehensivo de la biodiversidad acuática en el departamento del Chocó, Colombia. Se documentaron 347 especies de peces, 89 especies de crustáceos y 156 especies de moluscos en ecosistemas marinos y fluviales. Los resultados revelan la importancia crítica del Chocó como hotspot de biodiversidad acuática global y las amenazas antropogénicas que enfrenta.',
    content: 'Contenido completo del artículo científico...',
    authors: [
      {
        id: 'author-001',
        name: 'Dr. María Elena Rodríguez Valencia',
        email: 'investigador1@codecti.choco.gov.co',
        affiliation: 'Instituto de Investigaciones Ambientales del Pacífico - IIAP',
        orcid: '0000-0002-1234-5678',
        position: 1,
        role: 'primary',
        contribution: 'Conceptualización, metodología, análisis de datos, redacción'
      },
      {
        id: 'author-002', 
        name: 'Dr. Carlos Alberto Mosquera Perea',
        email: 'investigador2@codecti.choco.gov.co',
        affiliation: 'Universidad Tecnológica del Chocó',
        orcid: '0000-0003-9876-5432',
        position: 2,
        role: 'corresponding',
        contribution: 'Trabajo de campo, análisis taxonómico, revisión del manuscrito'
      },
      {
        id: 'author-003',
        name: 'MSc. Ana Lucía Valencia Torres',
        email: 'biologia@utch.edu.co',
        affiliation: 'Universidad Tecnológica del Chocó',
        position: 3,
        role: 'contributor',
        contribution: 'Recolección de muestras, procesamiento de datos'
      }
    ],
    corresponding_author_id: 'author-002',
    publication_type: 'article',
    publication_status: 'published',
    journal_name: 'Revista Colombiana de Biodiversidad Marina',
    journal_issn: '2357-3791',
    volume: '28',
    issue: '3',
    pages: '145-189',
    publisher: 'Instituto Alexander von Humboldt',
    publication_date: '2024-08-15',
    doi: '10.5281/codecti.choco.2024.001',
    subject_areas: ['Marine Biology', 'Biodiversity', 'Conservation Biology', 'Tropical Ecology'],
    keywords: ['biodiversidad acuática', 'Chocó', 'peces tropicales', 'ecosistemas marinos', 'conservación', 'endemismo'],
    research_areas: ['Biología Marina', 'Ecología Tropical', 'Conservación'],
    dublin_core: {} as DublinCoreMetadata, // Will be generated
    pdf_file_id: 'file-pub-001',
    pdf_url: 'https://r2.codecti.example.com/publications/pub-001/biodiversidad-acuatica-choco-2024.pdf',
    supplementary_files: ['file-pub-001-sup1', 'file-pub-001-sup2'],
    institution: 'CODECTI Chocó',
    department: 'Departamento de Investigación Marina',
    funding_sources: [
      {
        id: 'fund-001',
        name: 'MinCiencias - Convocatoria Biodiversidad 2023',
        grant_number: 'CONV-2023-BD-089',
        amount: 450000000,
        currency: 'COP',
        type: 'government',
        country: 'Colombia'
      },
      {
        id: 'fund-002',
        name: 'Fundación ProAves',
        grant_number: 'PA-CHOCO-2023-12',
        amount: 85000000,
        currency: 'COP',
        type: 'ngo',
        country: 'Colombia'
      }
    ],
    cites: [
      '10.1038/nature12345',
      '10.1016/j.biocon.2023.110045',
      '10.1007/s10531-023-02567-1'
    ],
    cited_by: [
      '10.3390/d15040567',
      '10.1016/j.marpolbul.2024.116234'
    ],
    related_publications: ['pub-002', 'pub-003'],
    peer_reviewed: true,
    review_status: 'completed',
    quality_score: 92,
    download_count: 1247,
    view_count: 3891,
    citation_count: 23,
    altmetric_score: 45.8,
    access_type: 'open_access',
    license: 'CC-BY',
    created_by: 2,
    created_by_name: 'María Elena Rodríguez',
    created_by_email: 'investigador1@codecti.choco.gov.co',
    last_modified_by: 2,
    last_modified_by_name: 'María Elena Rodríguez',
    created_at: '2024-05-10T08:30:00Z',
    updated_at: '2024-08-15T14:20:00Z',
    published_at: '2024-08-15T10:00:00Z',
    orcid_verified: true,
    language: 'es',
    geographic_coverage: ['Chocó, Colombia', 'Pacífico Colombiano', 'Región Biogeográfica del Chocó'],
    temporal_coverage: '2023-2024',
    methodology: 'Muestreo sistemático, análisis taxonómico, análisis estadístico multivariado',
    internal_notes: 'Publicación destacada para repositorio institucional',
    tags: ['biodiversidad', 'investigación', 'chocó', 'marina', 'destacada'],
    featured: true
  },
  {
    id: 'pub-002',
    title: 'Microalgas del Pacífico Chocoano: Potencial Biotecnológico para Biocombustibles',
    abstract: 'Investigación sobre el potencial biotecnológico de microalgas nativas del Pacífico chocoano para la producción sostenible de biocombustibles. Se identificaron 12 especies con alto contenido lipídico (>40%) y excelente adaptabilidad a condiciones de cultivo. Los resultados sugieren un potencial significativo para el desarrollo de una industria de biocombustibles regional.',
    authors: [
      {
        id: 'author-004',
        name: 'Dr. Jorge Luis Palacios Rentería',
        email: 'biotecnologia@utch.edu.co',
        affiliation: 'Universidad Tecnológica del Chocó',
        orcid: '0000-0001-2345-6789',
        position: 1,
        role: 'primary',
        contribution: 'Conceptualización, análisis bioquímico, redacción'
      },
      {
        id: 'author-002',
        name: 'Dr. Carlos Alberto Mosquera Perea', 
        email: 'investigador2@codecti.choco.gov.co',
        affiliation: 'Universidad Tecnológica del Chocó',
        orcid: '0000-0003-9876-5432',
        position: 2,
        role: 'contributor',
        contribution: 'Asesoría metodológica, revisión del manuscrito'
      }
    ],
    corresponding_author_id: 'author-004',
    publication_type: 'article',
    publication_status: 'published',
    journal_name: 'Bioresource Technology',
    journal_issn: '0960-8524',
    volume: '389',
    issue: '',
    pages: '129834',
    publisher: 'Elsevier',
    publication_date: '2024-06-01',
    doi: '10.5281/codecti.choco.2024.002',
    subject_areas: ['Biotechnology', 'Renewable Energy', 'Microbiology', 'Environmental Science'],
    keywords: ['microalgas', 'biocombustibles', 'biotecnología', 'Pacífico', 'sostenibilidad', 'lípidos'],
    research_areas: ['Biotecnología Ambiental', 'Energías Renovables'],
    dublin_core: {} as DublinCoreMetadata,
    pdf_file_id: 'file-pub-002',
    pdf_url: 'https://r2.codecti.example.com/publications/pub-002/microalgas-pacifico-biotecnologia-2024.pdf',
    supplementary_files: ['file-pub-002-sup1'],
    institution: 'Universidad Tecnológica del Chocó',
    department: 'Facultad de Ciencias Naturales',
    funding_sources: [
      {
        id: 'fund-003',
        name: 'Colciencias - Programa Nacional de Biotecnología',
        grant_number: 'BT-2023-045',
        amount: 320000000,
        currency: 'COP',
        type: 'government',
        country: 'Colombia'
      }
    ],
    cites: [
      '10.1016/j.biortech.2023.129456',
      '10.1038/s41467-023-39876-1',
      '10.1007/s10811-023-03012-4'
    ],
    cited_by: ['10.1016/j.renene.2024.120567'],
    related_publications: ['pub-001'],
    peer_reviewed: true,
    review_status: 'completed',
    quality_score: 88,
    download_count: 892,
    view_count: 2156,
    citation_count: 8,
    altmetric_score: 28.4,
    access_type: 'open_access',
    license: 'CC-BY-NC',
    created_by: 3,
    created_by_name: 'Carlos Alberto Mosquera',
    created_by_email: 'investigador2@codecti.choco.gov.co',
    last_modified_by: 3,
    last_modified_by_name: 'Carlos Alberto Mosquera',
    created_at: '2024-02-15T09:00:00Z',
    updated_at: '2024-06-01T16:30:00Z',
    published_at: '2024-06-01T12:00:00Z',
    orcid_verified: true,
    language: 'en',
    geographic_coverage: ['Chocó, Colombia', 'Pacífico Colombiano'],
    temporal_coverage: '2023',
    methodology: 'Cultivo de microalgas, análisis bioquímico, cromatografía de gases',
    tags: ['biotecnología', 'energías renovables', 'microalgas', 'investigación'],
    featured: true
  },
  {
    id: 'pub-003',
    title: 'Atlas de Macroinvertebrados Bentónicos del Río Atrato: Indicadores de Calidad del Agua',
    abstract: 'Caracterización de la comunidad de macroinvertebrados bentónicos del río Atrato como bioindicadores de la calidad del agua. Se identificaron 89 taxa distribuidos en 15 órdenes, con predominancia de Diptera y Ephemeroptera. Los índices bióticos revelan una calidad del agua variable a lo largo del río, con zonas críticas que requieren intervención urgente.',
    authors: [
      {
        id: 'author-005',
        name: 'MSc. Patricia Ximena Córdoba Mena',
        email: 'ecologia@utch.edu.co',
        affiliation: 'Universidad Tecnológica del Chocó',
        position: 1,
        role: 'primary',
        contribution: 'Conceptualización, trabajo de campo, análisis taxonómico, redacción'
      },
      {
        id: 'author-001',
        name: 'Dr. María Elena Rodríguez Valencia',
        email: 'investigador1@codecti.choco.gov.co',
        affiliation: 'Instituto de Investigaciones Ambientales del Pacífico - IIAP',
        orcid: '0000-0002-1234-5678',
        position: 2,
        role: 'corresponding',
        contribution: 'Supervisión, análisis de datos, revisión del manuscrito'
      }
    ],
    corresponding_author_id: 'author-001',
    publication_type: 'report',
    publication_status: 'published',
    journal_name: 'CODECTI Chocó Technical Reports',
    volume: '2024',
    issue: '1',
    pages: '1-78',
    publisher: 'CODECTI Chocó',
    publication_date: '2024-04-22',
    doi: '10.5281/codecti.choco.2024.003',
    subject_areas: ['Freshwater Ecology', 'Environmental Monitoring', 'Aquatic Entomology'],
    keywords: ['macroinvertebrados', 'río Atrato', 'calidad del agua', 'bioindicadores', 'bentónicos'],
    research_areas: ['Ecología Acuática', 'Monitoreo Ambiental'],
    dublin_core: {} as DublinCoreMetadata,
    pdf_file_id: 'file-pub-003',
    pdf_url: 'https://r2.codecti.example.com/publications/pub-003/atlas-macroinvertebrados-atrato-2024.pdf',
    supplementary_files: ['file-pub-003-sup1', 'file-pub-003-sup2', 'file-pub-003-sup3'],
    institution: 'CODECTI Chocó',
    department: 'Departamento de Investigación Ambiental',
    funding_sources: [
      {
        id: 'fund-004',
        name: 'Corpourabá - Convenio de Investigación',
        grant_number: 'CORP-2023-INV-12',
        amount: 180000000,
        currency: 'COP',
        type: 'government',
        country: 'Colombia'
      }
    ],
    cites: [
      '10.1016/j.ecolind.2023.110234',
      '10.1007/s10750-023-05178-9'
    ],
    cited_by: [],
    related_publications: ['pub-001'],
    peer_reviewed: true,
    review_status: 'completed',
    quality_score: 85,
    download_count: 567,
    view_count: 1834,
    citation_count: 3,
    altmetric_score: 15.2,
    access_type: 'open_access',
    license: 'CC-BY-SA',
    created_by: 2,
    created_by_name: 'María Elena Rodríguez',
    created_by_email: 'investigador1@codecti.choco.gov.co',
    last_modified_by: 2,
    last_modified_by_name: 'María Elena Rodríguez',
    created_at: '2024-01-10T10:15:00Z',
    updated_at: '2024-04-22T11:45:00Z',
    published_at: '2024-04-22T09:00:00Z',
    orcid_verified: true,
    language: 'es',
    geographic_coverage: ['Río Atrato, Chocó, Colombia'],
    temporal_coverage: '2023',
    methodology: 'Muestreo cuantitativo, identificación taxonómica, índices bióticos',
    tags: ['monitoreo ambiental', 'río Atrato', 'calidad del agua', 'investigación'],
    featured: false
  }
];

// Generate Dublin Core metadata for mock publications
mockPublications.forEach(pub => {
  pub.dublin_core = generateDublinCore(pub);
});

// Routes

// Test route
publications.get('/test', async (c) => {
  return c.json({ success: true, message: 'Publications API working' });
});

// GET /api/publications - List publications with filters
publications.get('/', async (c) => {
  try {
    console.log('Publications API called');
    const query = c.req.query();
    
    const request: PublicationListRequest = {
      publication_type: query.publication_type as any,
      publication_status: query.publication_status as any,
      access_type: query.access_type as any,
      author: query.author,
      institution: query.institution,
      journal: query.journal,
      year: query.year ? parseInt(query.year) : undefined,
      subject_area: query.subject_area,
      keyword: query.keyword,
      search: query.search,
      featured: query.featured === 'true',
      sort_by: (query.sort_by as any) || 'publication_date',
      sort_order: (query.sort_order as any) || 'desc',
      limit: parseInt(query.limit || '20'),
      offset: parseInt(query.offset || '0')
    };

    // Filter publications
    let filteredPubs = mockPublications.filter(pub => {
      if (request.publication_type && pub.publication_type !== request.publication_type) return false;
      if (request.publication_status && pub.publication_status !== request.publication_status) return false;
      if (request.access_type && pub.access_type !== request.access_type) return false;
      if (request.author && !pub.authors.some(a => a.name.toLowerCase().includes(request.author!.toLowerCase()))) return false;
      if (request.institution && !pub.institution.toLowerCase().includes(request.institution.toLowerCase())) return false;
      if (request.journal && (!pub.journal_name || !pub.journal_name.toLowerCase().includes(request.journal.toLowerCase()))) return false;
      if (request.year && new Date(pub.publication_date).getFullYear() !== request.year) return false;
      if (request.subject_area && !pub.subject_areas.some(s => s.toLowerCase().includes(request.subject_area!.toLowerCase()))) return false;
      if (request.keyword && !pub.keywords.some(k => k.toLowerCase().includes(request.keyword!.toLowerCase()))) return false;
      if (request.featured !== undefined && pub.featured !== request.featured) return false;
      
      if (request.search) {
        const searchLower = request.search.toLowerCase();
        const searchableText = `${pub.title} ${pub.abstract} ${pub.authors.map(a => a.name).join(' ')} ${pub.keywords.join(' ')} ${pub.subject_areas.join(' ')}`.toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      
      return true;
    });

    // Sort publications
    filteredPubs.sort((a, b) => {
      const order = request.sort_order === 'asc' ? 1 : -1;
      
      switch (request.sort_by) {
        case 'title':
          return a.title.localeCompare(b.title) * order;
        case 'citation_count':
          return (a.citation_count - b.citation_count) * order;
        case 'download_count':
          return (a.download_count - b.download_count) * order;
        case 'view_count':
          return (a.view_count - b.view_count) * order;
        case 'created_at':
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order;
        case 'publication_date':
        default:
          return (new Date(a.publication_date).getTime() - new Date(b.publication_date).getTime()) * order;
      }
    });

    // Pagination
    const total = filteredPubs.length;
    const paginatedPubs = filteredPubs.slice(request.offset, request.offset! + request.limit!);
    
    const response: PublicationListResponse = {
      success: true,
      data: {
        publications: paginatedPubs,
        total_publications: total,
        featured_publications: mockPublications.filter(p => p.featured).slice(0, 3)
      },
      pagination: {
        limit: request.limit!,
        offset: request.offset!,
        total,
        pages: Math.ceil(total / request.limit!),
        current_page: Math.floor(request.offset! / request.limit!) + 1,
        has_next: request.offset! + request.limit! < total,
        has_prev: request.offset! > 0
      },
      filters: {
        available_subjects: [...new Set(mockPublications.flatMap(p => p.subject_areas))],
        available_institutions: [...new Set(mockPublications.map(p => p.institution))],
        available_journals: [...new Set(mockPublications.map(p => p.journal_name).filter(Boolean))],
        available_years: [...new Set(mockPublications.map(p => new Date(p.publication_date).getFullYear()))].sort((a, b) => b - a),
        available_types: [...new Set(mockPublications.map(p => p.publication_type))]
      },
      message: `${total} publicaciones encontradas`
    };

    return c.json(response);
  } catch (error) {
    console.error('Error listing publications:', error);
    return c.json({ success: false, message: 'Error al obtener publicaciones' }, 500);
  }
});

// GET /api/publications/search - Search publications
publications.get('/search', async (c) => {
  try {
    const query = c.req.query();
    
    const request: PublicationSearchRequest = {
      query: query.query || '',
      publication_type: query.publication_type as any,
      subject_area: query.subject_area,
      author: query.author,
      institution: query.institution,
      journal: query.journal,
      year_from: query.year_from ? parseInt(query.year_from) : undefined,
      year_to: query.year_to ? parseInt(query.year_to) : undefined,
      access_type: query.access_type as any,
      has_doi: query.has_doi === 'true',
      peer_reviewed: query.peer_reviewed === 'true',
      limit: parseInt(query.limit || '20'),
      offset: parseInt(query.offset || '0')
    };

    const searchStart = Date.now();

    // Advanced search logic
    let results = mockPublications.filter(pub => {
      // Basic search in title, abstract, authors, keywords
      if (request.query) {
        const searchLower = request.query.toLowerCase();
        const searchableText = `${pub.title} ${pub.abstract} ${pub.content || ''} ${pub.authors.map(a => a.name).join(' ')} ${pub.keywords.join(' ')} ${pub.subject_areas.join(' ')}`.toLowerCase();
        if (!searchableText.includes(searchLower)) return false;
      }
      
      // Additional filters
      if (request.publication_type && pub.publication_type !== request.publication_type) return false;
      if (request.subject_area && !pub.subject_areas.some(s => s.toLowerCase().includes(request.subject_area!.toLowerCase()))) return false;
      if (request.author && !pub.authors.some(a => a.name.toLowerCase().includes(request.author!.toLowerCase()))) return false;
      if (request.institution && !pub.institution.toLowerCase().includes(request.institution.toLowerCase())) return false;
      if (request.journal && (!pub.journal_name || !pub.journal_name.toLowerCase().includes(request.journal.toLowerCase()))) return false;
      if (request.access_type && pub.access_type !== request.access_type) return false;
      if (request.has_doi && !pub.doi) return false;
      if (request.peer_reviewed !== undefined && pub.peer_reviewed !== request.peer_reviewed) return false;
      
      const pubYear = new Date(pub.publication_date).getFullYear();
      if (request.year_from && pubYear < request.year_from) return false;
      if (request.year_to && pubYear > request.year_to) return false;
      
      return true;
    });

    // Sort by relevance (simple scoring based on title matches)
    if (request.query) {
      results.sort((a, b) => {
        const aScore = a.title.toLowerCase().includes(request.query.toLowerCase()) ? 2 : 1;
        const bScore = b.title.toLowerCase().includes(request.query.toLowerCase()) ? 2 : 1;
        return bScore - aScore;
      });
    }

    const searchTime = Date.now() - searchStart;

    // Pagination
    const total = results.length;
    const paginatedResults = results.slice(request.offset, request.offset! + request.limit!);

    // Generate search suggestions
    const suggestions = request.query ? [
      ...new Set([
        ...mockPublications.flatMap(p => p.keywords),
        ...mockPublications.flatMap(p => p.subject_areas),
        ...mockPublications.map(p => p.institution)
      ])
    ].filter(s => s.toLowerCase().includes(request.query.toLowerCase())).slice(0, 5) : [];

    const response: PublicationSearchResponse = {
      success: true,
      data: {
        publications: paginatedResults,
        total_results: total,
        search_time_ms: searchTime,
        suggestions
      },
      pagination: {
        limit: request.limit!,
        offset: request.offset!,
        total,
        pages: Math.ceil(total / request.limit!)
      },
      message: `${total} publicaciones encontradas en ${searchTime}ms`
    };

    return c.json(response);
  } catch (error) {
    console.error('Error searching publications:', error);
    return c.json({ success: false, message: 'Error en la búsqueda de publicaciones' }, 500);
  }
});

// GET /api/publications/stats - Get publication statistics
publications.get('/stats', async (c) => {
  try {
    // Calculate comprehensive statistics
    const total_publications = mockPublications.length;
    const total_authors = new Set(mockPublications.flatMap(p => p.authors.map(a => a.email))).size;
    const total_citations = mockPublications.reduce((sum, p) => sum + p.citation_count, 0);
    const total_downloads = mockPublications.reduce((sum, p) => sum + p.download_count, 0);
    const total_views = mockPublications.reduce((sum, p) => sum + p.view_count, 0);

    // Calculate distributions
    const publications_by_type = mockPublications.reduce((acc, p) => {
      acc[p.publication_type] = (acc[p.publication_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const publications_by_status = mockPublications.reduce((acc, p) => {
      acc[p.publication_status] = (acc[p.publication_status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const publications_by_access = mockPublications.reduce((acc, p) => {
      acc[p.access_type] = (acc[p.access_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const publications_by_year = mockPublications.reduce((acc, p) => {
      const year = new Date(p.publication_date).getFullYear().toString();
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const publications_by_institution = mockPublications.reduce((acc, p) => {
      acc[p.institution] = (acc[p.institution] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const publications_by_subject = mockPublications.reduce((acc, p) => {
      p.subject_areas.forEach(subject => {
        acc[subject] = (acc[subject] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    // Top publications
    const top_cited = [...mockPublications]
      .sort((a, b) => b.citation_count - a.citation_count)
      .slice(0, 5);

    const most_downloaded = [...mockPublications]
      .sort((a, b) => b.download_count - a.download_count)
      .slice(0, 5);

    const recent_publications = [...mockPublications]
      .sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime())
      .slice(0, 5);

    // Top authors
    const authorStats = new Map<string, { name: string, orcid?: string, affiliation: string, publication_count: number, citation_count: number }>();
    
    mockPublications.forEach(pub => {
      pub.authors.forEach(author => {
        const existing = authorStats.get(author.email) || {
          name: author.name,
          orcid: author.orcid,
          affiliation: author.affiliation,
          publication_count: 0,
          citation_count: 0
        };
        existing.publication_count++;
        existing.citation_count += pub.citation_count;
        authorStats.set(author.email, existing);
      });
    });

    const top_authors = Array.from(authorStats.values())
      .sort((a, b) => b.publication_count - a.publication_count)
      .slice(0, 10);

    // Impact metrics
    const citationCounts = mockPublications.map(p => p.citation_count).sort((a, b) => b - a);
    let h_index = 0;
    for (let i = 0; i < citationCounts.length; i++) {
      if (citationCounts[i] >= i + 1) {
        h_index = i + 1;
      } else {
        break;
      }
    }

    const i10_index = citationCounts.filter(c => c >= 10).length;
    const average_citations = total_citations / total_publications;
    const total_open_access = mockPublications.filter(p => p.access_type === 'open_access').length;

    // Temporal trends (mock data for demonstration)
    const monthly_publications = {
      '2024-01': 0, '2024-02': 1, '2024-03': 0, '2024-04': 1, 
      '2024-05': 0, '2024-06': 1, '2024-07': 0, '2024-08': 1
    };

    const yearly_citations = {
      '2023': 15, '2024': total_citations - 15
    };

    const response: PublicationStatsResponse = {
      success: true,
      data: {
        total_publications,
        publications_by_type,
        publications_by_status,
        publications_by_access,
        publications_by_year,
        publications_by_institution,
        publications_by_subject,
        total_authors,
        total_citations,
        total_downloads,
        total_views,
        top_cited,
        most_downloaded,
        recent_publications,
        top_authors,
        impact_metrics: {
          h_index,
          i10_index,
          average_citations: Math.round(average_citations * 100) / 100,
          total_open_access,
          international_collaborations: 0 // Would need to calculate based on author affiliations
        },
        temporal_trends: {
          monthly_publications,
          yearly_citations,
          growth_rate: 25.5 // Mock growth rate
        }
      },
      generated_at: new Date().toISOString(),
      message: 'Estadísticas del repositorio científico generadas exitosamente'
    };

    return c.json(response);
  } catch (error) {
    console.error('Error generating publication stats:', error);
    return c.json({ success: false, message: 'Error al generar estadísticas' }, 500);
  }
});

// GET /api/publications/:id - Get publication details
publications.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const publication = mockPublications.find(p => p.id === id);

    if (!publication) {
      return c.json({ success: false, message: 'Publicación no encontrada' }, 404);
    }

    // Update view count
    publication.view_count++;

    const response: PublicationResponse = {
      success: true,
      data: publication,
      message: 'Detalles de la publicación obtenidos exitosamente'
    };

    return c.json(response);
  } catch (error) {
    console.error('Error getting publication:', error);
    return c.json({ success: false, message: 'Error al obtener la publicación' }, 500);
  }
});

// GET /api/publications/:id/citation - Get citation formats
publications.get('/:id/citation', async (c) => {
  try {
    const id = c.req.param('id');
    const publication = mockPublications.find(p => p.id === id);

    if (!publication) {
      return c.json({ success: false, message: 'Publicación no encontrada' }, 404);
    }

    // Generate citations in multiple formats
    const citations = [
      { format: 'apa', citation: generateCitation(publication, 'apa') },
      { format: 'mla', citation: generateCitation(publication, 'mla') },
      { format: 'chicago', citation: generateCitation(publication, 'chicago') },
      { format: 'harvard', citation: generateCitation(publication, 'apa') }, // Using APA as Harvard base
      { format: 'ieee', citation: `${publication.authors.map(a => a.name).join(', ')}, "${publication.title}," ${publication.journal_name || 'CODECTI Chocó Repository'}, ${new Date(publication.publication_date).getFullYear()}, doi: ${publication.doi}.` },
      { format: 'nature', citation: `${publication.authors.map(a => a.name).join(', ')} ${publication.title}. ${publication.journal_name || 'CODECTI Chocó Repository'} (${new Date(publication.publication_date).getFullYear()}). doi:${publication.doi}` }
    ];

    // Generate export formats
    const authors = publication.authors.sort((a, b) => a.position - b.position);
    const year = new Date(publication.publication_date).getFullYear();

    const bibtex = `@article{${publication.id},
  title={${publication.title}},
  author={${authors.map(a => a.name).join(' and ')}},
  journal={${publication.journal_name || 'CODECTI Chocó Repository'}},
  volume={${publication.volume || ''}},
  number={${publication.issue || ''}},
  pages={${publication.pages || ''}},
  year={${year}},
  publisher={${publication.publisher}},
  doi={${publication.doi}},
  url={https://doi.org/${publication.doi}}
}`;

    const ris = `TY  - JOUR
TI  - ${publication.title}
AU  - ${authors.map(a => a.name).join('\nAU  - ')}
JO  - ${publication.journal_name || 'CODECTI Chocó Repository'}
VL  - ${publication.volume || ''}
IS  - ${publication.issue || ''}
SP  - ${publication.pages?.split('-')[0] || ''}
EP  - ${publication.pages?.split('-')[1] || ''}
PY  - ${year}
PB  - ${publication.publisher}
DO  - ${publication.doi}
UR  - https://doi.org/${publication.doi}
AB  - ${publication.abstract}
KW  - ${publication.keywords.join('\nKW  - ')}
ER  -`;

    const exports = [
      { format: 'bibtex', content: bibtex, filename: `${publication.id}.bib` },
      { format: 'ris', content: ris, filename: `${publication.id}.ris` },
      { format: 'endnote', content: ris, filename: `${publication.id}.enw` }, // RIS format works for EndNote
      { format: 'mendeley', content: bibtex, filename: `${publication.id}_mendeley.bib` },
      { format: 'zotero', content: bibtex, filename: `${publication.id}_zotero.bib` }
    ];

    const response: CitationResponse = {
      success: true,
      data: {
        publication_id: publication.id,
        doi: publication.doi,
        citations,
        exports
      },
      message: 'Formatos de cita generados exitosamente'
    };

    return c.json(response);
  } catch (error) {
    console.error('Error generating citations:', error);
    return c.json({ success: false, message: 'Error al generar citas' }, 500);
  }
});

// GET /api/publications/:id/metrics - Get publication metrics
publications.get('/:id/metrics', async (c) => {
  try {
    const id = c.req.param('id');
    const publication = mockPublications.find(p => p.id === id);

    if (!publication) {
      return c.json({ success: false, message: 'Publicación no encontrada' }, 404);
    }

    // Mock detailed metrics
    const metrics: PublicationMetricsResponse['data'] = {
      publication_id: publication.id,
      doi: publication.doi,
      citation_count: publication.citation_count,
      self_citations: Math.floor(publication.citation_count * 0.1),
      recent_citations: Math.floor(publication.citation_count * 0.6),
      download_count: publication.download_count,
      view_count: publication.view_count,
      pdf_downloads: Math.floor(publication.download_count * 0.8),
      altmetric_score: publication.altmetric_score || 0,
      social_media_mentions: Math.floor((publication.altmetric_score || 0) * 0.3),
      news_mentions: Math.floor((publication.altmetric_score || 0) * 0.1),
      blog_mentions: Math.floor((publication.altmetric_score || 0) * 0.2),
      country_views: {
        'Colombia': Math.floor(publication.view_count * 0.7),
        'United States': Math.floor(publication.view_count * 0.1),
        'Brazil': Math.floor(publication.view_count * 0.08),
        'Mexico': Math.floor(publication.view_count * 0.05),
        'Spain': Math.floor(publication.view_count * 0.04)
      },
      institutional_downloads: {
        'Universidad Tecnológica del Chocó': Math.floor(publication.download_count * 0.3),
        'Universidad Nacional de Colombia': Math.floor(publication.download_count * 0.2),
        'SINCHI': Math.floor(publication.download_count * 0.15),
        'Instituto Humboldt': Math.floor(publication.download_count * 0.1)
      },
      monthly_views: {
        '2024-01': Math.floor(publication.view_count * 0.05),
        '2024-02': Math.floor(publication.view_count * 0.08),
        '2024-03': Math.floor(publication.view_count * 0.12),
        '2024-04': Math.floor(publication.view_count * 0.15),
        '2024-05': Math.floor(publication.view_count * 0.18),
        '2024-06': Math.floor(publication.view_count * 0.22),
        '2024-07': Math.floor(publication.view_count * 0.12),
        '2024-08': Math.floor(publication.view_count * 0.08)
      },
      monthly_downloads: {
        '2024-01': Math.floor(publication.download_count * 0.06),
        '2024-02': Math.floor(publication.download_count * 0.09),
        '2024-03': Math.floor(publication.download_count * 0.14),
        '2024-04': Math.floor(publication.download_count * 0.18),
        '2024-05': Math.floor(publication.download_count * 0.20),
        '2024-06': Math.floor(publication.download_count * 0.16),
        '2024-07': Math.floor(publication.download_count * 0.10),
        '2024-08': Math.floor(publication.download_count * 0.07)
      },
      peer_review_score: publication.quality_score,
      editorial_rating: publication.quality_score ? Math.floor(publication.quality_score / 20) : undefined,
      last_updated: new Date().toISOString()
    };

    const response: PublicationMetricsResponse = {
      success: true,
      data: metrics,
      message: 'Métricas de la publicación obtenidas exitosamente'
    };

    return c.json(response);
  } catch (error) {
    console.error('Error getting publication metrics:', error);
    return c.json({ success: false, message: 'Error al obtener métricas' }, 500);
  }
});

// POST /api/publications - Create new publication (Admin only)
publications.post('/', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' }, 403);
    }

    const request: CreatePublicationRequest = await c.req.json();

    // Validate required fields
    if (!request.title || !request.abstract || !request.authors || request.authors.length === 0) {
      return c.json({ success: false, message: 'Título, resumen y al menos un autor son requeridos' }, 400);
    }

    // Generate new publication ID and DOI
    const newId = `pub-${Date.now().toString().slice(-6)}`;
    const doi = generateDOI(newId);

    // Prepare authors with IDs
    const authors: PublicationAuthor[] = request.authors.map((author, index) => ({
      id: `author-${Date.now()}-${index}`,
      ...author,
      position: index + 1
    }));

    // Find corresponding author
    const correspondingAuthor = authors.find(a => a.email === request.corresponding_author_email);
    if (!correspondingAuthor) {
      return c.json({ success: false, message: 'Autor corresponsal no encontrado entre los autores' }, 400);
    }

    // Prepare funding sources with IDs
    const funding_sources: FundingSource[] = (request.funding_sources || []).map((fund, index) => ({
      id: `fund-${Date.now()}-${index}`,
      ...fund
    }));

    // Create new publication
    const newPublication: Publication = {
      id: newId,
      title: request.title,
      abstract: request.abstract,
      content: request.content,
      authors,
      corresponding_author_id: correspondingAuthor.id,
      publication_type: request.publication_type,
      publication_status: 'draft',
      journal_name: request.journal_name,
      volume: request.volume,
      issue: request.issue,
      pages: request.pages,
      publisher: request.publisher,
      publication_date: request.publication_date,
      doi,
      subject_areas: request.subject_areas,
      keywords: request.keywords,
      research_areas: request.subject_areas, // Using subject areas as research areas
      dublin_core: {} as DublinCoreMetadata, // Will be generated below
      pdf_file_id: request.pdf_file_id,
      pdf_url: request.pdf_file_id ? `https://r2.codecti.example.com/publications/${newId}/${request.pdf_file_id}.pdf` : undefined,
      supplementary_files: request.supplementary_files || [],
      institution: request.institution,
      department: request.department,
      funding_sources,
      cites: [],
      cited_by: [],
      related_publications: [],
      peer_reviewed: false,
      review_status: 'pending',
      quality_score: undefined,
      download_count: 0,
      view_count: 0,
      citation_count: 0,
      altmetric_score: 0,
      access_type: request.access_type,
      license: request.license,
      created_by: user.userId,
      created_by_name: user.email.split('@')[0],
      created_by_email: user.email,
      last_modified_by: user.userId,
      last_modified_by_name: user.email.split('@')[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: undefined,
      orcid_verified: false,
      language: request.language || 'es',
      geographic_coverage: ['Chocó, Colombia'],
      temporal_coverage: new Date().getFullYear().toString(),
      methodology: undefined,
      internal_notes: undefined,
      tags: request.tags || [],
      featured: false
    };

    // Generate Dublin Core metadata
    newPublication.dublin_core = generateDublinCore(newPublication);

    // Add to mock database
    mockPublications.unshift(newPublication);

    const response: PublicationResponse = {
      success: true,
      data: newPublication,
      message: 'Publicación creada exitosamente'
    };

    return c.json(response, 201);
  } catch (error) {
    console.error('Error creating publication:', error);
    return c.json({ success: false, message: 'Error al crear la publicación' }, 500);
  }
});

// PUT /api/publications/:id - Update publication (Admin only)
publications.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' }, 403);
    }

    const id = c.req.param('id');
    const request: UpdatePublicationRequest = await c.req.json();

    const publicationIndex = mockPublications.findIndex(p => p.id === id);
    if (publicationIndex === -1) {
      return c.json({ success: false, message: 'Publicación no encontrada' }, 404);
    }

    const publication = mockPublications[publicationIndex];

    // Update fields
    if (request.title !== undefined) publication.title = request.title;
    if (request.abstract !== undefined) publication.abstract = request.abstract;
    if (request.content !== undefined) publication.content = request.content;
    if (request.authors !== undefined) publication.authors = request.authors;
    if (request.corresponding_author_id !== undefined) publication.corresponding_author_id = request.corresponding_author_id;
    if (request.publication_type !== undefined) publication.publication_type = request.publication_type;
    if (request.journal_name !== undefined) publication.journal_name = request.journal_name;
    if (request.volume !== undefined) publication.volume = request.volume;
    if (request.issue !== undefined) publication.issue = request.issue;
    if (request.pages !== undefined) publication.pages = request.pages;
    if (request.publisher !== undefined) publication.publisher = request.publisher;
    if (request.subject_areas !== undefined) publication.subject_areas = request.subject_areas;
    if (request.keywords !== undefined) publication.keywords = request.keywords;
    if (request.funding_sources !== undefined) publication.funding_sources = request.funding_sources;
    if (request.access_type !== undefined) publication.access_type = request.access_type;
    if (request.license !== undefined) publication.license = request.license;
    if (request.publication_status !== undefined) publication.publication_status = request.publication_status;
    if (request.tags !== undefined) publication.tags = request.tags;
    if (request.featured !== undefined) publication.featured = request.featured;

    // Update system fields
    publication.last_modified_by = user.userId;
    publication.last_modified_by_name = user.email.split('@')[0];
    publication.updated_at = new Date().toISOString();

    // If published, set published_at
    if (request.publication_status === 'published' && !publication.published_at) {
      publication.published_at = new Date().toISOString();
    }

    // Regenerate Dublin Core metadata
    publication.dublin_core = generateDublinCore(publication);

    const response: PublicationResponse = {
      success: true,
      data: publication,
      message: 'Publicación actualizada exitosamente'
    };

    return c.json(response);
  } catch (error) {
    console.error('Error updating publication:', error);
    return c.json({ success: false, message: 'Error al actualizar la publicación' }, 500);
  }
});

// DELETE /api/publications/:id - Delete publication (Admin only)
publications.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    if (!user || user.role !== 'admin') {
      return c.json({ success: false, message: 'Acceso denegado. Se requieren permisos de administrador.' }, 403);
    }

    const id = c.req.param('id');
    const publicationIndex = mockPublications.findIndex(p => p.id === id);
    
    if (publicationIndex === -1) {
      return c.json({ success: false, message: 'Publicación no encontrada' }, 404);
    }

    // Remove from mock database
    mockPublications.splice(publicationIndex, 1);

    return c.json({
      success: true,
      message: 'Publicación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error deleting publication:', error);
    return c.json({ success: false, message: 'Error al eliminar la publicación' }, 500);
  }
});

// GET /api/publications/:id/doi - Generate or get DOI
publications.get('/:id/doi', async (c) => {
  try {
    const id = c.req.param('id');
    const publication = mockPublications.find(p => p.id === id);

    if (!publication) {
      return c.json({ success: false, message: 'Publicación no encontrada' }, 404);
    }

    const response: DOIResponse = {
      success: true,
      data: {
        doi: publication.doi,
        url: `https://doi.org/${publication.doi}`,
        metadata: publication.dublin_core,
        created_at: publication.created_at
      },
      message: 'DOI obtenido exitosamente'
    };

    return c.json(response);
  } catch (error) {
    console.error('Error getting DOI:', error);
    return c.json({ success: false, message: 'Error al obtener DOI' }, 500);
  }
});

export default publications;