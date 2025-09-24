// CODECTI Platform - Mock Database for Development

import type { User, Project, NewsArticle, NewsCategory, NewsTag, Resource, ResourceCategory, Event } from '../types';

// Mock data for development
const mockUsers: User[] = [
  {
    id: 1,
    email: 'admin@codecti.choco.gov.co',
    name: 'Administrador CODECTI',
    role: 'admin',
    institution: 'CODECTI Chocó',
    created_at: '2025-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 2,
    email: 'investigador1@codecti.choco.gov.co',
    name: 'María Elena Rodríguez',
    role: 'collaborator',
    institution: 'Universidad Tecnológica del Chocó',
    created_at: '2025-01-01T00:00:00Z',
    is_active: true
  },
  {
    id: 3,
    email: 'investigador2@codecti.choco.gov.co',
    name: 'Carlos Alberto Mosquera',
    role: 'researcher',
    institution: 'SINCHI - Instituto Amazónico de Investigaciones Científicas',
    created_at: '2025-01-01T00:00:00Z',
    is_active: true
  }
];

const mockProjects: Project[] = [
  {
    id: 1,
    title: 'Biodiversidad Acuática del Chocó',
    responsible_person: 'investigador1@codecti.choco.gov.co',
    summary: 'Estudio comprehensive de la biodiversidad acuática en las principales cuencas hidrográficas del departamento del Chocó, con enfoque en especies endémicas y en peligro de extinción.',
    description: 'Este proyecto busca realizar un inventario completo de la biodiversidad acuática presente en las principales cuencas del Chocó, incluyendo el Atrato, San Juan y Baudó. Se utilizarán técnicas de muestreo tradicionales y tecnologías de vanguardia como el análisis de ADN ambiental.',
    objectives: 'Catalogar especies acuáticas endémicas, identificar especies en peligro, desarrollar estrategias de conservación',
    methodology: 'Muestreo sistemático, análisis de ADN ambiental, caracterización fisicoquímica de aguas',
    expected_results: 'Catálogo de biodiversidad acuática, mapas de distribución, estrategias de conservación',
    status: 'active',
    start_date: '2024-03-01',
    end_date: '2025-02-28',
    budget: 450000000,
    institution: 'Universidad Tecnológica del Chocó',
    research_area: 'Biodiversidad y Ecosistemas',
    keywords: 'biodiversidad, ecosistemas acuáticos, especies endémicas, conservación, Chocó',
    created_by: 2,
    created_at: '2024-03-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
    creator_name: 'María Elena Rodríguez'
  },
  {
    id: 2,
    title: 'Desarrollo de Tecnologías Verdes para Minería Sostenible',
    responsible_person: 'investigador2@codecti.choco.gov.co',
    summary: 'Investigación aplicada para el desarrollo de tecnologías limpias que permitan la explotación minera responsable y sostenible en el Chocó, reduciendo el impacto ambiental.',
    description: 'El proyecto desarrolla tecnologías innovadoras para la minería artesanal de oro, incluyendo sistemas de procesamiento sin mercurio, técnicas de biorremediación y métodos de monitoreo ambiental en tiempo real.',
    objectives: 'Desarrollar tecnologías limpias, capacitar comunidades mineras, reducir contaminación por mercurio',
    methodology: 'Investigación participativa, desarrollo tecnológico, transferencia de conocimiento',
    expected_results: 'Tecnologías verdes implementadas, comunidades capacitadas, reducción de contaminación',
    status: 'active',
    start_date: '2024-06-01',
    end_date: '2025-12-31',
    budget: 680000000,
    institution: 'SINCHI - Instituto Amazónico de Investigaciones Científicas',
    research_area: 'Tecnología Ambiental',
    keywords: 'minería sostenible, tecnologías limpias, mercurio, biorremediación, comunidades',
    created_by: 3,
    created_at: '2024-06-01T10:00:00Z',
    updated_at: '2025-01-02T10:00:00Z',
    creator_name: 'Carlos Alberto Mosquera'
  },
  {
    id: 3,
    title: 'Fortalecimiento de Cadenas Productivas Agrícolas del Pacífico',
    responsible_person: 'investigador1@codecti.choco.gov.co',
    summary: 'Proyecto de innovación para el fortalecimiento de las cadenas productivas del cacao, plátano y frutas tropicales en comunidades rurales del Chocó.',
    description: 'Iniciativa integral que busca mejorar la productividad y competitividad de las cadenas agrícolas tradicionales del Chocó mediante la implementación de tecnologías apropiadas, fortalecimiento organizacional y acceso a mercados especializados.',
    objectives: 'Mejorar productividad agrícola, fortalecer organizaciones, facilitar acceso a mercados',
    methodology: 'Investigación acción participativa, transferencia tecnológica, desarrollo organizacional',
    expected_results: 'Aumento en productividad del 30%, organizaciones fortalecidas, nuevos mercados',
    status: 'completed',
    start_date: '2023-01-01',
    end_date: '2024-12-31',
    budget: 320000000,
    institution: 'Universidad Tecnológica del Chocó',
    research_area: 'Desarrollo Rural y Agrícola',
    keywords: 'cacao, plátano, frutas tropicales, cadenas productivas, desarrollo rural',
    created_by: 2,
    created_at: '2023-01-01T10:00:00Z',
    updated_at: '2024-12-31T10:00:00Z',
    creator_name: 'María Elena Rodríguez'
  },
  {
    id: 4,
    title: 'Medicina Tradicional y Plantas del Chocó Biogeográfico',
    responsible_person: 'investigador2@codecti.choco.gov.co',
    summary: 'Investigación etnobotánica sobre el conocimiento tradicional de plantas medicinales utilizadas por comunidades afrodescendientes e indígenas del Chocó.',
    description: 'Estudio sistemático del conocimiento ancestral sobre plantas medicinales, documentación de usos tradicionales, análisis fitoquímico de especies promisorias y validación científica de propiedades terapéuticas.',
    objectives: 'Documentar conocimiento ancestral, validar propiedades medicinales, conservar biodiversidad',
    methodology: 'Etnobotánica, análisis fitoquímico, estudios farmacológicos, documentación participativa',
    expected_results: 'Catálogo de plantas medicinales, productos naturales, protocolos de conservación',
    status: 'active',
    start_date: '2024-08-01',
    end_date: '2026-07-31',
    budget: 520000000,
    institution: 'SINCHI - Instituto Amazónico de Investigaciones Científicas',
    research_area: 'Etnobotánica y Farmacología',
    keywords: 'medicina tradicional, etnobotánica, plantas medicinales, conocimiento ancestral, fitoquímica',
    created_by: 3,
    created_at: '2024-08-01T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
    creator_name: 'Carlos Alberto Mosquera'
  },
  {
    id: 5,
    title: 'Cambio Climático y Vulnerabilidad Costera en el Pacífico Chocoano',
    responsible_person: 'investigador1@codecti.choco.gov.co',
    summary: 'Análisis de los efectos del cambio climático en las comunidades costeras del Pacífico chocoano y desarrollo de estrategias de adaptación.',
    description: 'Evaluación integral de la vulnerabilidad climática en municipios costeros, modelado de escenarios futuros, y diseño participativo de medidas de adaptación con comunidades locales.',
    objectives: 'Evaluar vulnerabilidad climática, desarrollar estrategias de adaptación, fortalecer resiliencia',
    methodology: 'Modelado climático, análisis de vulnerabilidad, planificación participativa',
    expected_results: 'Mapas de vulnerabilidad, estrategias de adaptación, comunidades resilientes',
    status: 'active',
    start_date: '2024-09-01',
    end_date: '2025-08-31',
    budget: 390000000,
    institution: 'Universidad Tecnológica del Chocó',
    research_area: 'Cambio Climático',
    keywords: 'cambio climático, vulnerabilidad, adaptación, comunidades costeras, resiliencia',
    created_by: 2,
    created_at: '2024-09-01T10:00:00Z',
    updated_at: '2025-01-08T10:00:00Z',
    creator_name: 'María Elena Rodríguez'
  },
  {
    id: 6,
    title: 'Innovación en Acuicultura Sostenible para el Pacífico',
    responsible_person: 'investigador2@codecti.choco.gov.co',
    summary: 'Desarrollo de sistemas de acuicultura sostenible adaptados a las condiciones del Pacífico chocoano, con enfoque en especies nativas.',
    description: 'Investigación aplicada para el desarrollo de tecnologías de acuicultura que aprovechen especies ícticas nativas, con sistemas de bajo impacto ambiental y alto potencial económico para las comunidades.',
    objectives: 'Desarrollar sistemas acuícolas sostenibles, capacitar productores, generar ingresos',
    methodology: 'Investigación aplicada, transferencia tecnológica, acompañamiento técnico',
    expected_results: 'Sistemas acuícolas funcionando, productores capacitados, ingresos generados',
    status: 'planning',
    start_date: '2025-03-01',
    end_date: '2027-02-28',
    budget: 720000000,
    institution: 'SINCHI - Instituto Amazónico de Investigaciones Científicas',
    research_area: 'Acuicultura y Pesca',
    keywords: 'acuicultura, especies nativas, sostenibilidad, desarrollo comunitario, Pacífico',
    created_by: 3,
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-10T10:00:00Z',
    creator_name: 'Carlos Alberto Mosquera'
  },
  {
    id: 7,
    title: 'Patrimonio Cultural Digital del Chocó',
    responsible_person: 'investigador1@codecti.choco.gov.co',
    summary: 'Digitalización y preservación del patrimonio cultural inmaterial del Chocó mediante tecnologías digitales avanzadas.',
    description: 'Proyecto de documentación digital del patrimonio cultural chocoano incluyendo música, danzas, tradiciones orales y artesanías, utilizando realidad virtual, inteligencia artificial y plataformas interactivas.',
    objectives: 'Preservar patrimonio cultural, crear archivos digitales, facilitar acceso educativo',
    methodology: 'Documentación digital, realidad virtual, inteligencia artificial, plataformas interactivas',
    expected_results: 'Archivo digital, museo virtual, plataforma educativa, patrimonio preservado',
    status: 'draft',
    start_date: '2025-06-01',
    end_date: '2026-12-31',
    budget: 280000000,
    institution: 'Universidad Tecnológica del Chocó',
    research_area: 'Patrimonio Cultural y TIC',
    keywords: 'patrimonio cultural, digitalización, realidad virtual, tradiciones, Chocó',
    created_by: 2,
    created_at: '2025-01-15T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
    creator_name: 'María Elena Rodríguez'
  }
];

// HU-09: Mock data for News/Blog System
const mockNewsCategories: NewsCategory[] = [
  {
    id: 1,
    name: 'Ciencia y Tecnología',
    slug: 'ciencia-tecnologia',
    description: 'Avances científicos y desarrollos tecnológicos en el Chocó',
    color: '#3b82f6',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Innovación',
    slug: 'innovacion',
    description: 'Proyectos innovadores y emprendimientos tecnológicos',
    color: '#10b981',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Biodiversidad',
    slug: 'biodiversidad',
    description: 'Investigación y conservación de la biodiversidad chocoana',
    color: '#059669',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'Desarrollo Sostenible',
    slug: 'desarrollo-sostenible',
    description: 'Proyectos de desarrollo sostenible y medio ambiente',
    color: '#84cc16',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Educación CTeI',
    slug: 'educacion-ctei',
    description: 'Educación en ciencia, tecnología e innovación',
    color: '#f59e0b',
    created_at: '2025-01-01T00:00:00Z'
  }
];

const mockNewsTags: NewsTag[] = [
  { id: 1, name: 'Acuicultura', slug: 'acuicultura', created_at: '2025-01-01T00:00:00Z' },
  { id: 2, name: 'Biotecnología', slug: 'biotecnologia', created_at: '2025-01-01T00:00:00Z' },
  { id: 3, name: 'Conservación', slug: 'conservacion', created_at: '2025-01-01T00:00:00Z' },
  { id: 4, name: 'Sostenibilidad', slug: 'sostenibilidad', created_at: '2025-01-01T00:00:00Z' },
  { id: 5, name: 'Energías Renovables', slug: 'energias-renovables', created_at: '2025-01-01T00:00:00Z' },
  { id: 6, name: 'Investigación Marina', slug: 'investigacion-marina', created_at: '2025-01-01T00:00:00Z' },
  { id: 7, name: 'Tecnologías Limpias', slug: 'tecnologias-limpias', created_at: '2025-01-01T00:00:00Z' },
  { id: 8, name: 'Comunidades Afro', slug: 'comunidades-afro', created_at: '2025-01-01T00:00:00Z' },
  { id: 9, name: 'Pueblos Indígenas', slug: 'pueblos-indigenas', created_at: '2025-01-01T00:00:00Z' },
  { id: 10, name: 'Desarrollo Rural', slug: 'desarrollo-rural', created_at: '2025-01-01T00:00:00Z' }
];

const mockNewsArticles: NewsArticle[] = [
  {
    id: 1,
    title: 'CODECTI Chocó lanza nueva convocatoria para proyectos de acuicultura sostenible',
    slug: 'codecti-convocatoria-acuicultura-sostenible-2025',
    summary: 'La corporación destinará $5.000 millones para financiar proyectos innovadores en acuicultura que beneficien a las comunidades del Pacífico chocoano.',
    content: `<p>CODECTI Chocó anunció oficialmente el lanzamiento de su nueva convocatoria "Acuicultura Sostenible 2025", que destinará recursos por $5.000 millones de pesos para el financiamiento de proyectos innovadores en el sector acuícola del departamento.</p>

<p>La convocatoria busca promover el desarrollo de tecnologías limpias y sostenibles para el cultivo de especies nativas como el camarón, tilapia y bocachico, con especial énfasis en el beneficio directo a las comunidades afrodescendientes e indígenas del Pacífico chocoano.</p>

<h3>Líneas de Financiación</h3>
<p>Los recursos se distribuirán en tres líneas principales:</p>
<ul>
<li><strong>Innovación Tecnológica:</strong> $2.000 millones para desarrollo de nuevas tecnologías</li>
<li><strong>Fortalecimiento Comunitario:</strong> $2.000 millones para proyectos liderados por comunidades</li>
<li><strong>Investigación Aplicada:</strong> $1.000 millones para estudios de impacto y sostenibilidad</li>
</ul>

<p>Las postulaciones estarán abiertas hasta el 31 de marzo de 2025, y los resultados se publicarán en mayo del mismo año.</p>`,
    featured_image: '/static/news-acuicultura-2025.jpg',
    author_id: 1,
    author_name: 'Administrador CODECTI',
    author_email: 'admin@codecti.choco.gov.co',
    category_id: 2,
    category_name: 'Innovación',
    category_slug: 'innovacion',
    status: 'published',
    is_featured: true,
    tags: [
      { id: 1, name: 'Acuicultura', slug: 'acuicultura', created_at: '2025-01-01T00:00:00Z' },
      { id: 4, name: 'Sostenibilidad', slug: 'sostenibilidad', created_at: '2025-01-01T00:00:00Z' },
      { id: 8, name: 'Comunidades Afro', slug: 'comunidades-afro', created_at: '2025-01-01T00:00:00Z' }
    ],
    views_count: 1247,
    published_at: '2025-01-15T09:00:00Z',
    created_at: '2025-01-15T08:30:00Z',
    updated_at: '2025-01-15T09:00:00Z'
  },
  {
    id: 2,
    title: 'Investigadores del UTCH desarrollan bioplástico a partir de cáscara de cacao',
    slug: 'utch-bioplastico-cascara-cacao',
    summary: 'Un equipo de la Universidad Tecnológica del Chocó logró crear un material biodegradable innovador que podría revolucionar el manejo de residuos en la región.',
    content: `<p>Un grupo de investigadores de la Universidad Tecnológica del Chocó (UTCH), liderado por el Dr. Carlos Mosquera, ha desarrollado exitosamente un bioplástico revolucionario elaborado a partir de cáscaras de cacao, un subproducto abundante en la región.</p>

<p>El proyecto, financiado por CODECTI Chocó, representa un avance significativo en la búsqueda de alternativas sostenibles a los plásticos convencionales, aprovechando los residuos orgánicos de una de las principales actividades económicas del departamento.</p>

<h3>Características del Bioplástico</h3>
<p>El nuevo material presenta propiedades excepcionales:</p>
<ul>
<li><strong>100% biodegradable</strong> en un período de 6 meses</li>
<li><strong>Resistencia mecánica</strong> comparable a plásticos tradicionales</li>
<li><strong>Bajo costo de producción</strong> utilizando residuos locales</li>
<li><strong>Proceso de fabricación</strong> limpio y ambientalmente responsable</li>
</ul>

<p>La investigación ha captado la atención de empresas internacionales interesadas en licenciar la tecnología, lo que podría generar importantes recursos para la región.</p>`,
    featured_image: '/static/news-bioplastico-cacao.jpg',
    author_id: 2,
    author_name: 'María Elena Rodríguez',
    author_email: 'investigador1@codecti.choco.gov.co',
    category_id: 1,
    category_name: 'Ciencia y Tecnología',
    category_slug: 'ciencia-tecnologia',
    status: 'published',
    is_featured: true,
    tags: [
      { id: 2, name: 'Biotecnología', slug: 'biotecnologia', created_at: '2025-01-01T00:00:00Z' },
      { id: 4, name: 'Sostenibilidad', slug: 'sostenibilidad', created_at: '2025-01-01T00:00:00Z' },
      { id: 7, name: 'Tecnologías Limpias', slug: 'tecnologias-limpias', created_at: '2025-01-01T00:00:00Z' }
    ],
    views_count: 892,
    published_at: '2025-01-12T14:30:00Z',
    created_at: '2025-01-12T14:00:00Z',
    updated_at: '2025-01-12T14:30:00Z'
  },
  {
    id: 3,
    title: 'Nueva especie de rana endémica descubierta en el Darién chocoano',
    slug: 'nueva-especie-rana-darien-choco',
    summary: 'Científicos del Instituto Humboldt y la UTCH confirman el hallazgo de una nueva especie de rana venenosa en las selvas del Darién, destacando la riqueza biológica única del Chocó.',
    content: `<p>Un equipo conjunto del Instituto Alexander von Humboldt y la Universidad Tecnológica del Chocó ha confirmado oficialmente el descubrimiento de una nueva especie de rana venenosa en las selvas del Darién chocoano, denominada científicamente <em>Phyllobates chocoensis</em>.</p>

<p>El hallazgo, resultado de cinco años de investigación sistemática en la región, representa el primer descubrimiento de una nueva especie de anfibio en el Chocó en la última década y subraya la extraordinaria biodiversidad que alberga este territorio.</p>

<h3>Características de la Especie</h3>
<p>La <em>Phyllobates chocoensis</em> presenta características únicas:</p>
<ul>
<li><strong>Coloración distintiva:</strong> Verde esmeralda con patrones dorados únicos</li>
<li><strong>Tamaño:</strong> Entre 2.5 y 3.2 centímetros de longitud</li>
<li><strong>Hábitat:</strong> Bosques húmedos tropicales entre 200 y 800 metros de altitud</li>
<li><strong>Toxinas:</strong> Alcaloides únicos con potencial farmacológico</li>
</ul>

<p>Los investigadores estiman que la población actual se encuentra entre 500 y 1.000 individuos, clasificándola como especie vulnerable que requiere medidas urgentes de conservación.</p>

<h3>Importancia Científica</h3>
<p>El Dr. Luis Fernando García, líder de la investigación, destaca que "este descubrimiento no solo enriquece nuestro conocimiento sobre la biodiversidad chocoana, sino que también abre nuevas oportunidades para la investigación biomédica, considerando las propiedades únicas de las toxinas de esta especie".</p>`,
    featured_image: '/static/news-rana-darien.jpg',
    author_id: 3,
    author_name: 'Carlos Alberto Mosquera',
    author_email: 'investigador2@codecti.choco.gov.co',
    category_id: 3,
    category_name: 'Biodiversidad',
    category_slug: 'biodiversidad',
    status: 'published',
    is_featured: false,
    tags: [
      { id: 3, name: 'Conservación', slug: 'conservacion', created_at: '2025-01-01T00:00:00Z' },
      { id: 2, name: 'Biotecnología', slug: 'biotecnologia', created_at: '2025-01-01T00:00:00Z' }
    ],
    views_count: 654,
    published_at: '2025-01-10T11:15:00Z',
    created_at: '2025-01-10T10:45:00Z',
    updated_at: '2025-01-10T11:15:00Z'
  },
  {
    id: 4,
    title: 'Comunidades emberá implementan sistema de energía solar comunitaria',
    slug: 'comunidades-embera-energia-solar',
    summary: 'Cinco resguardos emberá del Alto Baudó instalan sistemas fotovoltaicos comunitarios que beneficiarán a más de 200 familias con energía limpia y sostenible.',
    content: `<p>En una iniciativa histórica para el departamento, cinco resguardos emberá del Alto Baudó han logrado implementar exitosamente un sistema de energía solar comunitaria que beneficiará directamente a más de 200 familias indígenas.</p>

<p>El proyecto, desarrollado en alianza entre CODECTI Chocó, la Organización Regional Emberá Wounaan (OREWA) y la empresa social Energía Verde Colombia, representa un modelo innovador de desarrollo sostenible con enfoque étnico diferencial.</p>

<h3>Beneficios del Proyecto</h3>
<p>La implementación de este sistema ha generado múltiples beneficios:</p>
<ul>
<li><strong>Acceso a electricidad:</strong> 24 horas al día para todas las familias participantes</li>
<li><strong>Reducción de emisiones:</strong> Evita la emisión de 45 toneladas de CO2 anuales</li>
<li><strong>Ahorro económico:</strong> Eliminación del gasto en combustibles fósiles</li>
<li><strong>Fortalecimiento comunitario:</strong> Gestión autónoma del sistema energético</li>
</ul>

<h3>Tecnología Implementada</h3>
<p>El sistema cuenta con:</p>
<ul>
<li>120 paneles solares de alta eficiencia</li>
<li>Sistema de almacenamiento de 240 kWh</li>
<li>Red de distribución comunitaria de 2.5 km</li>
<li>Centro de control y monitoreo automatizado</li>
</ul>

<p>El líder emberá Juvenal Domicó expresó que "este proyecto no solo nos da luz, sino que fortalece nuestra autonomía y nos permite conservar nuestro territorio sin depender de combustibles que dañan la selva".</p>`,
    featured_image: '/static/news-energia-solar-embera.jpg',
    author_id: 1,
    author_name: 'Administrador CODECTI',
    author_email: 'admin@codecti.choco.gov.co',
    category_id: 4,
    category_name: 'Desarrollo Sostenible',
    category_slug: 'desarrollo-sostenible',
    status: 'published',
    is_featured: true,
    tags: [
      { id: 5, name: 'Energías Renovables', slug: 'energias-renovables', created_at: '2025-01-01T00:00:00Z' },
      { id: 9, name: 'Pueblos Indígenas', slug: 'pueblos-indigenas', created_at: '2025-01-01T00:00:00Z' },
      { id: 4, name: 'Sostenibilidad', slug: 'sostenibilidad', created_at: '2025-01-01T00:00:00Z' }
    ],
    views_count: 1108,
    published_at: '2025-01-08T16:20:00Z',
    created_at: '2025-01-08T15:50:00Z',
    updated_at: '2025-01-08T16:20:00Z'
  },
  {
    id: 5,
    title: 'Estudiantes chocoanos ganan concurso nacional de robótica con proyecto de manglares',
    slug: 'estudiantes-choco-robotica-manglares',
    summary: 'Un equipo de estudiantes de Quibdó desarrolla robot submarino para monitoreo de ecosistemas de manglar y obtiene el primer lugar en la Olimpiada Nacional de Robótica.',
    content: `<p>El equipo "Manglar Bot", conformado por seis estudiantes de instituciones educativas de Quibdó, obtuvo el primer lugar en la XVI Olimpiada Nacional de Robótica con su innovador proyecto de monitoreo submarino de ecosistemas de manglar.</p>

<p>El proyecto, mentoreado por ingenieros de CODECTI Chocó y docentes de la UTCH, desarrolló un robot submarino autónomo capaz de recolectar datos sobre calidad del agua, biodiversidad y estado de conservación de los manglares del Pacífico chocoano.</p>

<h3>Características del Robot</h3>
<p>El "Manglar Bot" incorpora tecnología de vanguardia:</p>
<ul>
<li><strong>Navegación autónoma:</strong> Sistema GPS y sensores de profundidad</li>
<li><strong>Sensores ambientales:</strong> pH, oxígeno disuelto, temperatura y turbidez</li>
<li><strong>Cámara submarina:</strong> Para registro de fauna y flora acuática</li>
<li><strong>Transmisión en tiempo real:</strong> Datos enviados vía WiFi a estación base</li>
</ul>

<p>La estudiante Yurley Mosquera, líder del equipo, explicó que "queríamos crear algo que realmente ayudara a proteger nuestros manglares. Sabemos que son súper importantes para las comunidades pesqueras y para enfrentar el cambio climático".</p>

<h3>Impacto y Reconocimientos</h3>
<p>El proyecto ha recibido múltiples reconocimientos:</p>
<ul>
<li>Primer lugar en Olimpiada Nacional de Robótica</li>
<li>Premio especial a la Innovación Social</li>
<li>Invitación al Foro Mundial de Jóvenes Científicos</li>
<li>Financiación para prototipo a escala real</li>
</ul>`,
    featured_image: '/static/news-robotica-manglares.jpg',
    author_id: 2,
    author_name: 'María Elena Rodríguez',
    author_email: 'investigador1@codecti.choco.gov.co',
    category_id: 5,
    category_name: 'Educación CTeI',
    category_slug: 'educacion-ctei',
    status: 'published',
    is_featured: false,
    tags: [
      { id: 3, name: 'Conservación', slug: 'conservacion', created_at: '2025-01-01T00:00:00Z' },
      { id: 6, name: 'Investigación Marina', slug: 'investigacion-marina', created_at: '2025-01-01T00:00:00Z' },
      { id: 7, name: 'Tecnologías Limpias', slug: 'tecnologias-limpias', created_at: '2025-01-01T00:00:00Z' }
    ],
    views_count: 743,
    published_at: '2025-01-06T13:45:00Z',
    created_at: '2025-01-06T13:15:00Z',
    updated_at: '2025-01-06T13:45:00Z'
  }
];

// HU-10: Mock data for Events and Convocatorias System
const mockEventCategories = [
  {
    id: 1,
    name: 'Conferencias Científicas',
    slug: 'conferencias-cientificas',
    description: 'Eventos científicos y presentaciones de investigación',
    color: '#2563eb',
    icon: 'fa-flask',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Talleres y Workshops',
    slug: 'talleres-workshops',
    description: 'Talleres prácticos y workshops de capacitación',
    color: '#059669',
    icon: 'fa-tools',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Convocatorias de Financiamiento',
    slug: 'convocatorias-financiamiento',
    description: 'Llamados a propuestas y financiamiento de proyectos',
    color: '#dc2626',
    icon: 'fa-money-bill-wave',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'Seminarios y Webinars',
    slug: 'seminarios-webinars',
    description: 'Seminarios académicos y conferencias virtuales',
    color: '#7c3aed',
    icon: 'fa-video',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Ferias de Ciencia',
    slug: 'ferias-ciencia',
    description: 'Ferias científicas y exposiciones tecnológicas',
    color: '#f59e0b',
    icon: 'fa-microscope',
    created_at: '2025-01-01T00:00:00Z'
  }
];

// HU-11: Mock data for Resources and Scientific Documents System
const mockResourceCategories: ResourceCategory[] = [
  {
    id: 1,
    name: 'Documentos Científicos',
    slug: 'documentos-cientificos',
    description: 'Artículos, papers y publicaciones científicas',
    color: '#2563eb',
    icon: 'fa-file-alt',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 2,
    name: 'Manuales y Guías',
    slug: 'manuales-guias',
    description: 'Manuales técnicos y guías metodológicas',
    color: '#059669',
    icon: 'fa-book',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 3,
    name: 'Datos y Datasets',
    slug: 'datos-datasets',
    description: 'Conjuntos de datos y bases de datos científicas',
    color: '#dc2626',
    icon: 'fa-database',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 4,
    name: 'Presentaciones',
    slug: 'presentaciones',
    description: 'Presentaciones y material audiovisual',
    color: '#7c3aed',
    icon: 'fa-presentation',
    created_at: '2025-01-01T00:00:00Z'
  },
  {
    id: 5,
    name: 'Software y Herramientas',
    slug: 'software-herramientas',
    description: 'Software, aplicaciones y herramientas científicas',
    color: '#f59e0b',
    icon: 'fa-laptop-code',
    created_at: '2025-01-01T00:00:00Z'
  }
];

const mockResources: Resource[] = [
  {
    id: 1,
    title: 'Atlas de Biodiversidad del Chocó Biogeográfico 2024',
    slug: 'atlas-biodiversidad-choco-biageografico-2024',
    description: `<p>Documento técnico-científico que presenta una compilación exhaustiva de la biodiversidad del Chocó Biogeográfico, incluyendo especies de fauna y flora endémicas, ecosistemas únicos y áreas de conservación prioritaria.</p>

<h3>Contenido del Atlas</h3>
<ul>
<li><strong>Capítulo 1:</strong> Caracterización del Chocó Biogeográfico</li>
<li><strong>Capítulo 2:</strong> Biodiversidad de Fauna Terrestre</li>
<li><strong>Capítulo 3:</strong> Biodiversidad Marina y Costera</li>
<li><strong>Capítulo 4:</strong> Flora Endémica y Ecosistemas Forestales</li>
<li><strong>Capítulo 5:</strong> Áreas de Conservación y Manejo</li>
</ul>

<p>Este atlas es resultado de 3 años de investigación colaborativa entre múltiples instituciones científicas de la región.</p>`,
    summary: 'Atlas completo de la biodiversidad del Chocó Biogeográfico con mapas, especies endémicas y áreas de conservación.',
    type: 'document',
    category_id: 1,
    category_name: 'Documentos Científicos',
    category_slug: 'documentos-cientificos',
    author: 'Dr. María Elena Rodríguez & Equipo CODECTI',
    author_institution: 'CODECTI Chocó - Universidad Tecnológica del Chocó',
    created_by: 1,
    creator_name: 'Administrador CODECTI',
    file_url: '/static/resources/atlas-biodiversidad-choco-2024.pdf',
    file_size: 15728640, // 15MB
    file_type: 'application/pdf',
    download_url: '/api/public/resources/atlas-biodiversidad-choco-biageografico-2024/download',
    language: 'Español',
    publication_date: '2024-12-15',
    keywords: ['biodiversidad', 'chocó biogeográfico', 'conservación', 'especies endémicas', 'ecosistemas'],
    tags: ['atlas', 'biodiversidad', 'conservación', 'fauna', 'flora', 'ecosistemas'],
    is_featured: true,
    is_public: true,
    status: 'published',
    downloads_count: 1247,
    views_count: 3891,
    created_at: '2024-12-15T14:00:00Z',
    updated_at: '2025-01-08T10:30:00Z'
  },
  {
    id: 2,
    title: 'Manual de Técnicas de Cultivo de Microalgas Marinas',
    slug: 'manual-tecnicas-cultivo-microalgas-marinas',
    description: `<p>Manual técnico detallado para el cultivo y mantenimiento de microalgas marinas del Pacífico chocoano, incluyendo protocolos de laboratorio, medios de cultivo y técnicas de escalamiento.</p>

<h3>Técnicas Incluidas</h3>
<ol>
<li><strong>Preparación de Medios de Cultivo</strong> - Formulaciones específicas para especies locales</li>
<li><strong>Técnicas de Inoculación</strong> - Métodos estériles de propagación</li>
<li><strong>Control de Calidad</strong> - Monitoreo de pH, salinidad y nutrientes</li>
<li><strong>Escalamiento de Cultivos</strong> - De escala laboratorio a piloto</li>
<li><strong>Cosecha y Procesamiento</strong> - Técnicas de concentración y conservación</li>
</ol>

<p>Manual desarrollado por el Laboratorio de Biotecnología Marina de la Universidad Tecnológica del Chocó.</p>`,
    summary: 'Manual completo de técnicas para cultivo de microalgas marinas con protocolos paso a paso para investigadores.',
    type: 'manual',
    category_id: 2,
    category_name: 'Manuales y Guías',
    category_slug: 'manuales-guias',
    author: 'Dr. Carlos Alberto Mosquera',
    author_institution: 'Universidad Tecnológica del Chocó - Lab. Biotecnología Marina',
    created_by: 2,
    creator_name: 'María Elena Rodríguez',
    file_url: '/static/resources/manual-cultivo-microalgas-2024.pdf',
    file_size: 8388608, // 8MB
    file_type: 'application/pdf',
    download_url: '/api/public/resources/manual-tecnicas-cultivo-microalgas-marinas/download',
    language: 'Español',
    publication_date: '2024-11-20',
    keywords: ['microalgas', 'biotecnología marina', 'cultivo', 'protocolos', 'laboratorio'],
    tags: ['manual', 'microalgas', 'biotecnología', 'cultivo', 'protocolos', 'marina'],
    is_featured: true,
    is_public: true,
    status: 'published',
    downloads_count: 892,
    views_count: 2156,
    created_at: '2024-11-20T16:30:00Z',
    updated_at: '2024-12-10T09:15:00Z'
  },
  {
    id: 3,
    title: 'Dataset: Registros de Fauna Acuática del Río Atrato 2024',
    slug: 'dataset-fauna-acuatica-rio-atrato-2024',
    description: `<p>Base de datos completa con registros de especies de fauna acuática del río Atrato y sus afluentes, recolectados durante 2024 mediante técnicas de muestreo estandarizadas.</p>

<h3>Información del Dataset</h3>
<ul>
<li><strong>Número de registros:</strong> 2,847 especímenes</li>
<li><strong>Especies documentadas:</strong> 156 especies</li>
<li><strong>Grupos taxonómicos:</strong> Peces, crustáceos, moluscos</li>
<li><strong>Sitios de muestreo:</strong> 23 estaciones a lo largo del río</li>
<li><strong>Período de muestreo:</strong> Enero - Noviembre 2024</li>
</ul>

<p>Los datos incluyen coordenadas GPS, fechas de colecta, abundancias, medidas biométricas y fotografías de referencia.</p>`,
    summary: 'Dataset científico con 2,847 registros de fauna acuática del río Atrato, incluye coordenadas GPS y datos biométricos.',
    type: 'dataset',
    category_id: 3,
    category_name: 'Datos y Datasets',
    category_slug: 'datos-datasets',
    author: 'Equipo de Investigación SINCHI Chocó',
    author_institution: 'SINCHI - Instituto Amazónico de Investigaciones Científicas',
    created_by: 3,
    creator_name: 'Carlos Alberto Mosquera',
    external_url: 'https://dataportal.codecti.choco.gov.co/datasets/fauna-atrato-2024',
    language: 'Español/Inglés',
    publication_date: '2024-12-01',
    keywords: ['fauna acuática', 'río atrato', 'biodiversidad', 'peces', 'dataset', 'GPS'],
    tags: ['dataset', 'fauna', 'acuática', 'atrato', 'biodiversidad', 'peces', 'GPS'],
    is_featured: true,
    is_public: true,
    status: 'published',
    downloads_count: 445,
    views_count: 1230,
    created_at: '2024-12-01T11:20:00Z',
    updated_at: '2024-12-05T14:45:00Z'
  }
];

const mockEvents = [
  {
    id: 1,
    title: 'VI Congreso Nacional de Biodiversidad del Chocó',
    slug: 'vi-congreso-nacional-biodiversidad-choco-2025',
    description: `<p>El VI Congreso Nacional de Biodiversidad del Chocó se consolida como el evento científico más importante de la región, reuniendo a investigadores, académicos y conservacionistas para compartir los últimos avances en investigación sobre la biodiversidad chocoana.</p>

<h3>Objetivos del Congreso</h3>
<ul>
<li><strong>Promover el intercambio científico</strong> entre investigadores nacionales e internacionales</li>
<li><strong>Divulgar investigaciones recientes</strong> sobre biodiversidad del Chocó Biogeográfico</li>
<li><strong>Fortalecer redes de colaboración</strong> inter-institucionales</li>
<li><strong>Impulsar la conservación</strong> mediante evidencia científica</li>
</ul>

<h3>Líneas Temáticas</h3>
<ol>
<li>Biodiversidad Marina y Costera</li>
<li>Ecosistemas de Manglar y Humedales</li>
<li>Fauna y Flora Endémica</li>
<li>Biotecnología y Bioprospección</li>
<li>Conservación y Manejo Sostenible</li>
<li>Cambio Climático y Biodiversidad</li>
</ol>

<p>El evento contará con conferencias magistrales, presentaciones orales, pósters científicos y talleres especializados.</p>`,
    short_description: 'Evento científico principal del Chocó sobre biodiversidad, conservación y investigación del Chocó Biogeográfico con participación nacional e internacional.',
    type: 'conference',
    category_id: 1,
    category_name: 'Conferencias Científicas',
    category_slug: 'conferencias-cientificas',
    organizer_id: 1,
    organizer_name: 'CODECTI Chocó',
    organizer_email: 'admin@codecti.choco.gov.co',
    organizer_institution: 'CODECTI Chocó',
    
    start_date: '2025-03-15T08:00:00Z',
    end_date: '2025-03-17T17:00:00Z',
    registration_start: '2025-02-01T00:00:00Z',
    registration_end: '2025-03-10T23:59:59Z',
    location: 'Quibdó, Chocó',
    venue: 'Universidad Tecnológica del Chocó - Auditorio Principal',
    address: 'Carrera 22 # 18B-10, Quibdó, Chocó',
    virtual_link: 'https://meet.codecti.choco.gov.co/biodiversidad2025',
    is_virtual: false,
    is_hybrid: true,
    
    max_participants: 300,
    current_participants: 147,
    registration_required: true,
    registration_fee: 180000,
    is_free: false,
    
    featured_image: '/static/events/congreso-biodiversidad-2025.jpg',
    agenda: `<h3>Día 1 - 15 de Marzo</h3>
<ul>
<li><strong>8:00 AM</strong> - Registro y acreditación</li>
<li><strong>9:00 AM</strong> - Ceremonia de apertura</li>
<li><strong>10:00 AM</strong> - Conferencia magistral: "Biodiversidad del Chocó en el Siglo XXI"</li>
<li><strong>11:30 AM</strong> - Sesión de pósters</li>
<li><strong>2:00 PM</strong> - Mesa redonda: Conservación marina</li>
<li><strong>4:00 PM</strong> - Presentaciones orales</li>
</ul>

<h3>Día 2 - 16 de Marzo</h3>
<ul>
<li><strong>9:00 AM</strong> - Talleres especializados</li>
<li><strong>11:00 AM</strong> - Conferencia: "Biotecnología y bioprospección"</li>
<li><strong>2:00 PM</strong> - Trabajo de campo (opcional)</li>
<li><strong>6:00 PM</strong> - Cóctel de networking</li>
</ul>

<h3>Día 3 - 17 de Marzo</h3>
<ul>
<li><strong>9:00 AM</strong> - Presentaciones de proyectos estudiantiles</li>
<li><strong>11:00 AM</strong> - Panel: "Retos y oportunidades futuras"</li>
<li><strong>3:00 PM</strong> - Ceremonia de clausura</li>
<li><strong>5:00 PM</strong> - Entrega de certificados</li>
</ul>`,
    requirements: 'Estudiantes de pregrado/posgrado en ciencias biológicas, ambientales o afines. Investigadores y profesionales del sector ambiental.',
    target_audience: 'Investigadores, estudiantes de ciencias biológicas, conservacionistas, funcionarios ambientales',
    learning_objectives: 'Conocer avances en investigación de biodiversidad chocoana, establecer redes de colaboración, identificar oportunidades de investigación futura',
    
    status: 'published',
    is_featured: true,
    is_public: true,
    tags: ['biodiversidad', 'conservación', 'chocó biogeográfico', 'investigación científica', 'ecosistemas'],
    views_count: 2341,
    registrations_count: 147,
    
    created_at: '2025-01-10T10:00:00Z',
    updated_at: '2025-01-15T16:30:00Z'
  },
  {
    id: 2,
    title: 'Taller de Biotecnología Marina Aplicada',
    slug: 'taller-biotecnologia-marina-aplicada-2025',
    description: `<p>Taller intensivo de biotecnología marina enfocado en técnicas de cultivo, identificación molecular y aprovechamiento sostenible de recursos marinos del Pacífico chocoano.</p>

<p>Este taller práctico está dirigido a estudiantes de posgrado, investigadores y profesionales interesados en aplicar herramientas biotecnológicas para el estudio y aprovechamiento de la biodiversidad marina.</p>

<h3>Módulos del Taller</h3>
<ol>
<li><strong>Fundamentos de Biotecnología Marina</strong>
   <ul>
   <li>Principios básicos de biotecnología aplicada</li>
   <li>Ecosistemas marinos del Chocó</li>
   <li>Especies de interés biotecnológico</li>
   </ul>
</li>
<li><strong>Técnicas de Cultivo in vitro</strong>
   <ul>
   <li>Cultivo de microalgas</li>
   <li>Propagación de corales</li>
   <li>Cultivo de tejidos vegetales</li>
   </ul>
</li>
<li><strong>Biología Molecular Marina</strong>
   <ul>
   <li>Extracción de ADN de organismos marinos</li>
   <li>PCR y técnicas de amplificación</li>
   <li>Secuenciación y análisis filogenético</li>
   </ul>
</li>
<li><strong>Bioprospección y Productos Naturales</strong>
   <ul>
   <li>Identificación de compuestos bioactivos</li>
   <li>Técnicas de extracción y purificación</li>
   <li>Evaluación de actividad biológica</li>
   </ul>
</li>
</ol>`,
    short_description: 'Taller práctico sobre técnicas biotecnológicas aplicadas al estudio y aprovechamiento de recursos marinos del Pacífico chocoano.',
    type: 'workshop',
    category_id: 2,
    category_name: 'Talleres y Workshops',
    category_slug: 'talleres-workshops',
    organizer_id: 2,
    organizer_name: 'Dr. María Elena Rodríguez',
    organizer_email: 'investigador1@codecti.choco.gov.co',
    organizer_institution: 'Universidad Tecnológica del Chocó',
    
    start_date: '2025-02-20T08:00:00Z',
    end_date: '2025-02-22T17:00:00Z',
    registration_start: '2025-01-15T00:00:00Z',
    registration_end: '2025-02-15T23:59:59Z',
    location: 'Bahía Solano, Chocó',
    venue: 'Estación Marina Universidad del Valle - Sede Pacífico',
    address: 'Bahía Solano, Valle del Cauca',
    virtual_link: '',
    is_virtual: false,
    is_hybrid: false,
    
    max_participants: 25,
    current_participants: 18,
    registration_required: true,
    registration_fee: 350000,
    is_free: false,
    
    featured_image: '/static/events/taller-biotecnologia-marina.jpg',
    agenda: `<h3>Día 1 - Fundamentos y Cultivos</h3>
<ul>
<li><strong>8:00 AM</strong> - Registro y bienvenida</li>
<li><strong>9:00 AM</strong> - Conferencia inaugural: "Biotecnología marina en el Pacífico"</li>
<li><strong>10:30 AM</strong> - Práctica: Cultivo de microalgas</li>
<li><strong>2:00 PM</strong> - Taller: Propagación de corales</li>
<li><strong>4:00 PM</strong> - Evaluación y discusión</li>
</ul>

<h3>Día 2 - Biología Molecular</h3>
<ul>
<li><strong>8:30 AM</strong> - Extracción de ADN marino</li>
<li><strong>10:30 AM</strong> - PCR y amplificación</li>
<li><strong>2:00 PM</strong> - Electroforesis y análisis</li>
<li><strong>4:00 PM</strong> - Secuenciación básica</li>
</ul>

<h3>Día 3 - Bioprospección</h3>
<ul>
<li><strong>8:30 AM</strong> - Colecta de muestras marinas</li>
<li><strong>10:30 AM</strong> - Extracción de compuestos</li>
<li><strong>2:00 PM</strong> - Bioensayos</li>
<li><strong>4:00 PM</strong> - Presentación de resultados</li>
<li><strong>5:30 PM</strong> - Ceremonia de cierre</li>
</ul>`,
    requirements: 'Conocimientos básicos en biología, química o carreras afines. Experiencia previa en laboratorio deseable.',
    target_audience: 'Estudiantes de posgrado, investigadores, profesionales en biotecnología',
    learning_objectives: 'Dominar técnicas de biotecnología marina, desarrollar protocolos de cultivo, aplicar herramientas moleculares',
    
    status: 'published',
    is_featured: true,
    is_public: true,
    tags: ['biotecnología', 'biología marina', 'cultivos', 'biología molecular', 'pacífico'],
    views_count: 892,
    registrations_count: 18,
    
    created_at: '2025-01-05T14:20:00Z',
    updated_at: '2025-01-12T09:15:00Z'
  },
  {
    id: 3,
    title: 'Convocatoria Nacional CTeI Chocó 2025 - Biodiversidad e Innovación',
    slug: 'convocatoria-nacional-ctei-choco-2025-biodiversidad-innovacion',
    description: `<p>CODECTI Chocó abre la Convocatoria Nacional de Ciencia, Tecnología e Innovación 2025, destinando <strong>$8.000 millones de pesos</strong> para financiar proyectos de investigación enfocados en biodiversidad e innovación tecnológica.</p>

<h3>Objetivos de la Convocatoria</h3>
<ul>
<li><strong>Fortalecer las capacidades de investigación</strong> en instituciones del Chocó</li>
<li><strong>Promover la innovación tecnológica</strong> basada en biodiversidad</li>
<li><strong>Generar conocimiento científico</strong> de alto impacto</li>
<li><strong>Contribuir al desarrollo sostenible</strong> de la región</li>
</ul>

<h3>Líneas de Investigación Prioritarias</h3>
<ol>
<li><strong>Biodiversidad y Conservación</strong> - Hasta $1.500M
   <ul>
   <li>Inventarios y caracterización de especies</li>
   <li>Estudios de ecología y distribución</li>
   <li>Estrategias de conservación</li>
   </ul>
</li>
<li><strong>Biotecnología y Bioprospección</strong> - Hasta $2.000M
   <ul>
   <li>Identificación de compuestos bioactivos</li>
   <li>Desarrollo de productos biotecnológicos</li>
   <li>Aplicaciones industriales y farmacéuticas</li>
   </ul>
</li>
<li><strong>Tecnologías Sostenibles</strong> - Hasta $1.800M
   <ul>
   <li>Energías renovables</li>
   <li>Tecnologías limpias</li>
   <li>Gestión de residuos</li>
   </ul>
</li>
<li><strong>Innovación Social y Tecnológica</strong> - Hasta $1.500M
   <ul>
   <li>Desarrollo de tecnologías apropiadas</li>
   <li>Soluciones para comunidades</li>
   <li>Transferencia de tecnología</li>
   </ul>
</li>
<li><strong>Sistemas Productivos Sostenibles</strong> - Hasta $1.200M
   <ul>
   <li>Acuicultura y pesca sostenible</li>
   <li>Agroecología y sistemas agroforestales</li>
   <li>Ecoturismo científico</li>
   </ul>
</li>
</ol>

<h3>Modalidades de Financiación</h3>
<ul>
<li><strong>Proyectos de Investigación Básica:</strong> $80M - $300M</li>
<li><strong>Proyectos de Investigación Aplicada:</strong> $150M - $500M</li>
<li><strong>Proyectos de Desarrollo Tecnológico:</strong> $300M - $800M</li>
<li><strong>Proyectos de Innovación:</strong> $200M - $600M</li>
</ul>`,
    short_description: 'Convocatoria nacional de $8.000M para financiar proyectos de investigación en biodiversidad e innovación tecnológica del Chocó.',
    type: 'convocatoria',
    category_id: 3,
    category_name: 'Convocatorias de Financiamiento',
    category_slug: 'convocatorias-financiamiento',
    organizer_id: 1,
    organizer_name: 'CODECTI Chocó',
    organizer_email: 'admin@codecti.choco.gov.co',
    organizer_institution: 'CODECTI Chocó',
    
    start_date: '2025-02-01T00:00:00Z',
    end_date: '2025-04-30T23:59:59Z',
    registration_start: '2025-01-15T00:00:00Z',
    registration_end: '2025-04-15T23:59:59Z',
    location: 'Nacional (con énfasis en Chocó)',
    venue: 'Modalidad Virtual - Plataforma CODECTI',
    address: 'En línea',
    virtual_link: 'https://convocatorias.codecti.choco.gov.co/2025',
    is_virtual: true,
    is_hybrid: false,
    
    max_participants: 500,
    current_participants: 89,
    registration_required: true,
    registration_fee: 0,
    is_free: true,
    
    featured_image: '/static/events/convocatoria-ctei-2025.jpg',
    agenda: `<h3>Cronograma de la Convocatoria</h3>
<ul>
<li><strong>15 Enero 2025</strong> - Apertura de convocatoria</li>
<li><strong>1 Febrero 2025</strong> - Inicio período de postulación</li>
<li><strong>15 Marzo 2025</strong> - Seminario web informativo</li>
<li><strong>1 Abril 2025</strong> - Sesión de consultas</li>
<li><strong>15 Abril 2025</strong> - Cierre de postulaciones</li>
<li><strong>30 Abril 2025</strong> - Fin de evaluación</li>
<li><strong>15 Mayo 2025</strong> - Publicación de resultados</li>
<li><strong>1 Junio 2025</strong> - Inicio de proyectos seleccionados</li>
</ul>

<h3>Proceso de Evaluación</h3>
<ol>
<li><strong>Evaluación de elegibilidad</strong> (Mayo 1-7)</li>
<li><strong>Evaluación técnica por pares</strong> (Mayo 8-20)</li>
<li><strong>Evaluación del comité científico</strong> (Mayo 21-28)</li>
<li><strong>Aprobación final</strong> (Mayo 29-30)</li>
</ol>`,
    requirements: 'Investigadores con título de maestría o doctorado. Vinculación institucional. Experiencia demostrada en investigación.',
    target_audience: 'Investigadores, grupos de investigación, instituciones de educación superior',
    learning_objectives: 'Obtener financiación para proyectos de investigación, fortalecer capacidades investigativas, generar conocimiento científico',
    
    status: 'published',
    is_featured: true,
    is_public: true,
    tags: ['convocatoria', 'financiamiento', 'investigación', 'biodiversidad', 'innovación', 'ctei'],
    views_count: 3127,
    registrations_count: 89,
    
    created_at: '2025-01-08T12:00:00Z',
    updated_at: '2025-01-15T10:30:00Z'
  },
  {
    id: 4,
    title: 'Seminario Internacional: Cambio Climático y Ecosistemas Tropicales',
    slug: 'seminario-internacional-cambio-climatico-ecosistemas-tropicales',
    description: `<p>Seminario internacional que reúne a expertos mundiales para analizar los impactos del cambio climático en ecosistemas tropicales, con énfasis especial en la región del Chocó Biogeográfico.</p>

<p>Este evento académico de alto nivel contará con la participación de investigadores de instituciones internacionales reconocidas, presentando los últimos avances en investigación sobre adaptación y mitigación del cambio climático en ecosistemas tropicales.</p>

<h3>Conferencistas Confirmados</h3>
<ul>
<li><strong>Dr. Carlos Reynel</strong> - Universidad Nacional Mayor de San Marcos (Perú)</li>
<li><strong>Dra. Brigitte Baptiste</strong> - Instituto Alexander von Humboldt (Colombia)</li>
<li><strong>Dr. Thomas Lovejoy</strong> - George Mason University (USA)</li>
<li><strong>Dra. Catherine Tucker</strong> - Indiana University (USA)</li>
<li><strong>Dr. Rodolfo Dirzo</strong> - Stanford University (USA)</li>
</ul>

<h3>Sesiones Temáticas</h3>
<ol>
<li><strong>Impactos del Cambio Climático en Biodiversidad Tropical</strong>
   <ul>
   <li>Cambios en patrones de distribución de especies</li>
   <li>Efectos en redes tróficas y servicios ecosistémicos</li>
   <li>Vulnerabilidad de especies endémicas</li>
   </ul>
</li>
<li><strong>Estrategias de Adaptación Ecosistémica</strong>
   <ul>
   <li>Corredores biológicos y conectividad</li>
   <li>Restauración ecológica adaptativa</li>
   <li>Especies refugio y áreas prioritarias</li>
   </ul>
</li>
<li><strong>Mitigación Basada en Ecosistemas</strong>
   <ul>
   <li>Captura y almacenamiento de carbono</li>
   <li>REDD+ y mecanismos de pago por servicios ambientales</li>
   <li>Soluciones basadas en la naturaleza</li>
   </ul>
</li>
<li><strong>Caso de Estudio: Chocó Biogeográfico</strong>
   <ul>
   <li>Proyecciones climáticas regionales</li>
   <li>Vulnerabilidad de ecosistemas chocoanos</li>
   <li>Estrategias de conservación adaptativa</li>
   </ul>
</li>
</ol>`,
    short_description: 'Seminario internacional con expertos mundiales sobre impactos del cambio climático en ecosistemas tropicales, enfocado en el Chocó Biogeográfico.',
    type: 'seminar',
    category_id: 4,
    category_name: 'Seminarios y Webinars',
    category_slug: 'seminarios-webinars',
    organizer_id: 1,
    organizer_name: 'CODECTI Chocó',
    organizer_email: 'admin@codecti.choco.gov.co',
    organizer_institution: 'CODECTI Chocó',
    
    start_date: '2025-04-10T14:00:00Z',
    end_date: '2025-04-11T17:00:00Z',
    registration_start: '2025-02-15T00:00:00Z',
    registration_end: '2025-04-08T23:59:59Z',
    location: 'Virtual Internacional',
    venue: 'Plataforma Zoom Webinar',
    address: 'En línea',
    virtual_link: 'https://codecti.zoom.us/webinar/register/WN_climatechange2025',
    is_virtual: true,
    is_hybrid: false,
    
    max_participants: 1000,
    current_participants: 456,
    registration_required: true,
    registration_fee: 0,
    is_free: true,
    
    featured_image: '/static/events/seminario-cambio-climatico.jpg',
    agenda: `<h3>Día 1 - 10 de Abril</h3>
<ul>
<li><strong>2:00 PM</strong> - Apertura y bienvenida</li>
<li><strong>2:30 PM</strong> - Conferencia magistral: "Cambio climático global y ecosistemas tropicales"</li>
<li><strong>3:30 PM</strong> - Panel: "Impactos en biodiversidad neotropical"</li>
<li><strong>4:30 PM</strong> - Receso</li>
<li><strong>5:00 PM</strong> - Mesa redonda: "Vulnerabilidad ecosistémica"</li>
<li><strong>6:00 PM</strong> - Sesión de preguntas y respuestas</li>
</ul>

<h3>Día 2 - 11 de Abril</h3>
<ul>
<li><strong>2:00 PM</strong> - Conferencia: "Soluciones basadas en naturaleza"</li>
<li><strong>3:00 PM</strong> - Presentaciones: "Casos de estudio regionales"</li>
<li><strong>4:00 PM</strong> - Workshop: "Chocó Biogeográfico - Estrategias futuras"</li>
<li><strong>5:00 PM</strong> - Panel de cierre: "Recomendaciones y compromisos"</li>
<li><strong>6:00 PM</strong> - Ceremonia de clausura</li>
</ul>`,
    requirements: 'Profesionales y estudiantes en ciencias ambientales, biología, ecología o carreras afines.',
    target_audience: 'Investigadores, estudiantes de posgrado, profesionales ambientales, tomadores de decisión',
    learning_objectives: 'Comprender impactos del cambio climático, identificar estrategias de adaptación, conocer soluciones basadas en naturaleza',
    
    status: 'published',
    is_featured: false,
    is_public: true,
    tags: ['cambio climático', 'ecosistemas tropicales', 'adaptación', 'mitigación', 'internacional'],
    views_count: 1834,
    registrations_count: 456,
    
    created_at: '2025-01-12T16:45:00Z',
    updated_at: '2025-01-14T11:20:00Z'
  },
  {
    id: 5,
    title: 'Feria de Ciencia y Tecnología Juvenil Chocó 2025',
    slug: 'feria-ciencia-tecnologia-juvenil-choco-2025',
    description: `<p>La Feria de Ciencia y Tecnología Juvenil del Chocó es el evento educativo más importante de la región, donde jóvenes estudiantes de instituciones educativas presentan sus proyectos científicos y tecnológicos.</p>

<p>Esta feria promueve el interés por la ciencia entre los jóvenes chocoanos, fortalece las capacidades investigativas desde temprana edad y reconoce el talento científico regional.</p>

<h3>Categorías de Participación</h3>
<ol>
<li><strong>Ciencias Naturales y Medio Ambiente</strong>
   <ul>
   <li>Biología y biodiversidad</li>
   <li>Ecología y conservación</li>
   <li>Ciencias de la tierra</li>
   </ul>
</li>
<li><strong>Ciencias Exactas y Aplicadas</strong>
   <ul>
   <li>Matemáticas aplicadas</li>
   <li>Física experimental</li>
   <li>Química y materiales</li>
   </ul>
</li>
<li><strong>Tecnología e Innovación</strong>
   <ul>
   <li>Robótica y automatización</li>
   <li>Tecnologías de información</li>
   <li>Innovación tecnológica</li>
   </ul>
</li>
<li><strong>Ciencias Sociales y Humanas</strong>
   <ul>
   <li>Investigación social</li>
   <li>Estudios culturales</li>
   <li>Desarrollo comunitario</li>
   </ul>
</li>
</ol>

<h3>Premios y Reconocimientos</h3>
<ul>
<li><strong>Primer lugar por categoría:</strong> $2,000,000 + Beca de estudios</li>
<li><strong>Segundo lugar por categoría:</strong> $1,500,000 + Kit científico</li>
<li><strong>Tercer lugar por categoría:</strong> $1,000,000 + Libros especializados</li>
<li><strong>Premio especial innovación:</strong> $3,000,000 + Mentoría empresarial</li>
<li><strong>Premio mejor proyecto ambiental:</strong> $2,500,000 + Viaje educativo</li>
</ul>

<p>Todos los participantes reciben certificado de participación y los proyectos destacados serán incluidos en la memoria científica del evento.</p>`,
    short_description: 'Feria científica juvenil del Chocó donde estudiantes presentan proyectos de ciencia y tecnología con premios y reconocimientos.',
    type: 'feria',
    category_id: 5,
    category_name: 'Ferias de Ciencia',
    category_slug: 'ferias-ciencia',
    organizer_id: 1,
    organizer_name: 'CODECTI Chocó',
    organizer_email: 'admin@codecti.choco.gov.co',
    organizer_institution: 'CODECTI Chocó',
    
    start_date: '2025-05-20T08:00:00Z',
    end_date: '2025-05-22T18:00:00Z',
    registration_start: '2025-03-01T00:00:00Z',
    registration_end: '2025-05-10T23:59:59Z',
    location: 'Quibdó, Chocó',
    venue: 'Coliseo Municipal de Quibdó',
    address: 'Calle 26 con Carrera 4, Quibdó, Chocó',
    virtual_link: 'https://feria.codecti.choco.gov.co/virtual2025',
    is_virtual: false,
    is_hybrid: true,
    
    max_participants: 400,
    current_participants: 67,
    registration_required: true,
    registration_fee: 0,
    is_free: true,
    
    featured_image: '/static/events/feria-ciencia-juvenil.jpg',
    agenda: `<h3>Día 1 - 20 de Mayo (Montaje y Inauguración)</h3>
<ul>
<li><strong>8:00 AM</strong> - Llegada y registro de equipos</li>
<li><strong>9:00 AM</strong> - Montaje de stands y proyectos</li>
<li><strong>11:00 AM</strong> - Verificación técnica</li>
<li><strong>2:00 PM</strong> - Ceremonia de inauguración</li>
<li><strong>3:00 PM</strong> - Conferencia: "Jóvenes científicos del futuro"</li>
<li><strong>4:00 PM</strong> - Presentaciones preliminares</li>
</ul>

<h3>Día 2 - 21 de Mayo (Evaluación)</h3>
<ul>
<li><strong>8:00 AM</strong> - Inicio de evaluaciones por jurados</li>
<li><strong>10:00 AM</strong> - Presentaciones orales - Ronda 1</li>
<li><strong>2:00 PM</strong> - Presentaciones orales - Ronda 2</li>
<li><strong>4:00 PM</strong> - Evaluación final de proyectos</li>
<li><strong>6:00 PM</strong> - Actividad cultural</li>
</ul>

<h3>Día 3 - 22 de Mayo (Premiación)</h3>
<ul>
<li><strong>9:00 AM</strong> - Feria abierta al público general</li>
<li><strong>11:00 AM</strong> - Presentaciones estudiantiles abiertas</li>
<li><strong>2:00 PM</strong> - Deliberación de jurados</li>
<li><strong>4:00 PM</strong> - Ceremonia de premiación</li>
<li><strong>6:00 PM</strong> - Clausura del evento</li>
</ul>`,
    requirements: 'Estudiantes de instituciones educativas de básica secundaria y media del Chocó. Proyecto científico o tecnológico original.',
    target_audience: 'Estudiantes de secundaria y media, docentes, padres de familia, comunidad educativa',
    learning_objectives: 'Desarrollar habilidades investigativas, fomentar vocaciones científicas, promover innovación juvenil',
    
    status: 'published',
    is_featured: false,
    is_public: true,
    tags: ['feria científica', 'estudiantes', 'ciencia juvenil', 'innovación', 'educación'],
    views_count: 1203,
    registrations_count: 67,
    
    created_at: '2025-01-14T09:30:00Z',
    updated_at: '2025-01-16T14:45:00Z'
  }
];

// Mock password hash for "password123"
const mockPasswordHash = 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f';

// Mock database interface
export class MockDatabase {
  users: User[] = [...mockUsers];
  projects: Project[] = [...mockProjects];
  newsCategories: NewsCategory[] = [...mockNewsCategories];
  newsTags: NewsTag[] = [...mockNewsTags];
  newsArticles: NewsArticle[] = [...mockNewsArticles];
  // HU-10: Events system data
  eventCategories: EventCategory[] = [...mockEventCategories];
  events: Event[] = [...mockEvents];
  eventRegistrations: EventRegistration[] = [];
  // HU-11: Resources system data
  resourceCategories: ResourceCategory[] = [...mockResourceCategories];
  resources: Resource[] = [...mockResources];
  // Store password hashes separately for dynamic users
  passwordHashes: Map<string, string> = new Map();
  nextUserId = 4;
  nextProjectId = 4;
  nextNewsId = 6;
  nextCategoryId = 6;
  nextTagId = 11;
  nextEventId = 6;
  nextEventCategoryId = 6;
  nextRegistrationId = 1;

  async getUserByEmail(email: string): Promise<any> {
    const user = this.users.find(u => u.email === email && u.is_active);
    if (!user) return null;
    
    // Check if we have a stored password hash for this email
    const storedPasswordHash = this.passwordHashes.get(email);
    
    return {
      ...user,
      password_hash: storedPasswordHash || mockPasswordHash // Use stored hash or fallback to mock
    };
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(u => u.id === id && u.is_active) || null;
  }

  async createUser(data: {
    name: string;
    email: string;
    institution: string;
    password_hash: string;
    role: 'admin' | 'collaborator' | 'researcher';
  }): Promise<User> {
    const now = new Date().toISOString();
    
    const user: User = {
      id: this.nextUserId++,
      email: data.email,
      name: data.name,
      institution: data.institution,
      role: data.role,
      created_at: now,
      is_active: true
    };
    
    // Store the password hash for this email
    this.passwordHashes.set(data.email, data.password_hash);
    
    this.users.push(user);
    return user;
  }

  async getProjects(search: string = '', status: string = '', sort: string = 'created_at', limit: number = 10, offset: number = 0): Promise<{ results: Project[], total: number }> {
    let filtered = [...this.projects];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(searchLower) ||
        p.responsible_person.toLowerCase().includes(searchLower) ||
        p.summary.toLowerCase().includes(searchLower)
      );
    }
    
    // Apply status filter
    if (status && ['active', 'completed'].includes(status)) {
      filtered = filtered.filter(p => p.status === status);
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      switch (sort) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'responsible_person':
          return a.responsible_person.localeCompare(b.responsible_person);
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });
    
    const total = filtered.length;
    const results = filtered.slice(offset, offset + limit);
    
    return { results, total };
  }

  async getProjectById(id: number): Promise<Project | null> {
    return this.projects.find(p => p.id === id) || null;
  }

  async createProject(data: {
    title: string;
    responsible_person: string;
    summary: string;
    status: 'active' | 'completed';
    created_by: number;
  }): Promise<Project> {
    const now = new Date().toISOString();
    const creator = this.users.find(u => u.id === data.created_by);
    
    const project: Project = {
      id: this.nextProjectId++,
      title: data.title,
      responsible_person: data.responsible_person,
      summary: data.summary,
      status: data.status,
      created_by: data.created_by,
      created_at: now,
      updated_at: now,
      creator_name: creator?.name || 'Usuario'
    };
    
    this.projects.push(project);
    return project;
  }

  async updateProject(id: number, updates: any): Promise<boolean> {
    const index = this.projects.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    return true;
  }

  // User management methods
  async getUsers(search: string = '', role: string = '', status: string = '', limit: number = 20, offset: number = 0): Promise<{ results: User[], total: number }> {
    let filtered = [...this.users];
    
    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(u => 
        u.name.toLowerCase().includes(searchLower) ||
        u.email.toLowerCase().includes(searchLower) ||
        (u.institution && u.institution.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply role filter
    if (role && ['admin', 'collaborator', 'researcher'].includes(role)) {
      filtered = filtered.filter(u => u.role === role);
    }
    
    // Apply status filter
    if (status) {
      if (status === 'active') {
        filtered = filtered.filter(u => u.is_active);
      } else if (status === 'inactive') {
        filtered = filtered.filter(u => !u.is_active);
      }
    }
    
    const total = filtered.length;
    const results = filtered
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit);
    
    return { results, total };
  }

  async updateUser(id: number, updates: any): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users[index] = {
      ...this.users[index],
      ...updates
    };
    
    // Update password hash if provided
    if (updates.password_hash) {
      this.passwordHashes.set(this.users[index].email, updates.password_hash);
    }
    
    return true;
  }

  async resetUserPassword(id: number, passwordHash: string): Promise<boolean> {
    const user = this.users.find(u => u.id === id);
    if (!user) return false;
    
    this.passwordHashes.set(user.email, passwordHash);
    return true;
  }

  async deactivateUser(id: number): Promise<boolean> {
    const index = this.users.findIndex(u => u.id === id);
    if (index === -1) return false;
    
    this.users[index].is_active = false;
    return true;
  }

  // Public API methods (no authentication required)
  async getPublicProjects(
    search: string = '', 
    status: string = '', 
    area: string = '', 
    institution: string = '', 
    sort: string = 'created_at', 
    order: string = 'desc',
    limit: number = 12, 
    offset: number = 0
  ) {
    let filtered = [...this.projects].filter(project => {
      // Only show non-draft projects publicly
      if (project.status === 'draft') return false;
      
      if (search) {
        const searchLower = search.toLowerCase();
        const matches = 
          project.title.toLowerCase().includes(searchLower) ||
          project.summary.toLowerCase().includes(searchLower) ||
          (project.research_area && project.research_area.toLowerCase().includes(searchLower)) ||
          (project.institution && project.institution.toLowerCase().includes(searchLower)) ||
          (project.keywords && project.keywords.toLowerCase().includes(searchLower));
        if (!matches) return false;
      }
      
      if (status && project.status !== status) return false;
      if (area && (!project.research_area || !project.research_area.toLowerCase().includes(area.toLowerCase()))) return false;
      if (institution && (!project.institution || !project.institution.toLowerCase().includes(institution.toLowerCase()))) return false;
      
      return true;
    });

    // Sorting
    if (sort === 'title') {
      filtered.sort((a, b) => order === 'asc' ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title));
    } else if (sort === 'start_date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.start_date || a.created_at).getTime();
        const dateB = new Date(b.start_date || b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else {
      // Default: created_at
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const total = filtered.length;
    const projects = filtered.slice(offset, offset + limit).map(project => ({
      ...project,
      responsible_name: this.users.find(u => u.email === project.responsible_person)?.name || 'Usuario no encontrado'
    }));

    return { projects, total };
  }

  async getPublicProjectById(id: number) {
    const project = this.projects.find(p => p.id === id);
    if (!project || project.status === 'draft') return null;
    
    const responsible = this.users.find(u => u.email === project.responsible_person);
    
    return {
      ...project,
      responsible_name: responsible?.name || 'Usuario no encontrado',
      responsible_institution: responsible?.institution || 'Institución no encontrada'
    };
  }

  async getPublicStats() {
    const publicProjects = this.projects.filter(p => p.status !== 'draft');
    
    // Research areas count
    const researchAreas = new Map<string, number>();
    publicProjects.forEach(project => {
      if (project.research_area) {
        researchAreas.set(project.research_area, (researchAreas.get(project.research_area) || 0) + 1);
      }
    });

    // Institutions count
    const institutions = new Map<string, number>();
    publicProjects.forEach(project => {
      if (project.institution) {
        institutions.set(project.institution, (institutions.get(project.institution) || 0) + 1);
      }
    });

    return {
      totalProjects: publicProjects.length,
      activeProjects: publicProjects.filter(p => p.status === 'active').length,
      completedProjects: publicProjects.filter(p => p.status === 'completed').length,
      totalResearchers: this.users.filter(u => u.is_active).length,
      totalBudget: publicProjects.reduce((sum, p) => sum + (p.budget || 0), 0),
      researchAreas: Array.from(researchAreas.entries()).map(([area, count]) => ({
        research_area: area,
        count
      })).sort((a, b) => b.count - a.count).slice(0, 10),
      topInstitutions: Array.from(institutions.entries()).map(([institution, count]) => ({
        institution,
        count
      })).sort((a, b) => b.count - a.count).slice(0, 10)
    };
  }

  // HU-09: News/Blog System Methods

  // Categories management
  async getNewsCategories(): Promise<NewsCategory[]> {
    return [...this.newsCategories];
  }

  async getNewsCategoryById(id: number): Promise<NewsCategory | null> {
    return this.newsCategories.find(c => c.id === id) || null;
  }

  async getNewsCategoryBySlug(slug: string): Promise<NewsCategory | null> {
    return this.newsCategories.find(c => c.slug === slug) || null;
  }

  // Tags management
  async getNewsTags(): Promise<NewsTag[]> {
    return [...this.newsTags];
  }

  async getNewsTagById(id: number): Promise<NewsTag | null> {
    return this.newsTags.find(t => t.id === id) || null;
  }

  async getNewsTagsByIds(ids: number[]): Promise<NewsTag[]> {
    return this.newsTags.filter(t => ids.includes(t.id));
  }

  // News articles management (Admin)
  async getNewsArticles(
    search: string = '', 
    status: string = '', 
    category: string = '',
    author: string = '',
    sort: string = 'created_at', 
    order: string = 'desc',
    limit: number = 10, 
    offset: number = 0
  ) {
    let filtered = [...this.newsArticles];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        (article.content && article.content.toLowerCase().includes(searchLower)) ||
        (article.author_name && article.author_name.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter(article => article.status === status);
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(article => 
        article.category_slug === category || article.category_name?.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Apply author filter
    if (author) {
      filtered = filtered.filter(article => 
        article.author_name?.toLowerCase().includes(author.toLowerCase()) ||
        article.author_email?.toLowerCase().includes(author.toLowerCase())
      );
    }

    // Apply sorting
    if (sort === 'title') {
      filtered.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return order === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      });
    } else if (sort === 'views') {
      filtered.sort((a, b) => {
        return order === 'asc' ? a.views_count - b.views_count : b.views_count - a.views_count;
      });
    } else if (sort === 'published_at') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else {
      // Default: created_at
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const total = filtered.length;
    const articles = filtered.slice(offset, offset + limit);

    return { articles, total };
  }

  async getNewsArticleById(id: number): Promise<NewsArticle | null> {
    return this.newsArticles.find(article => article.id === id) || null;
  }

  async getNewsArticleBySlug(slug: string): Promise<NewsArticle | null> {
    return this.newsArticles.find(article => article.slug === slug) || null;
  }

  async createNewsArticle(data: {
    title: string;
    summary: string;
    content: string;
    featured_image?: string;
    author_id: number;
    category_id: number;
    tag_ids: number[];
    status: 'draft' | 'published';
    is_featured: boolean;
    published_at?: string;
  }): Promise<NewsArticle> {
    const now = new Date().toISOString();
    const author = this.users.find(u => u.id === data.author_id);
    const category = this.newsCategories.find(c => c.id === data.category_id);
    const tags = this.newsTags.filter(t => data.tag_ids.includes(t.id));
    
    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const article: NewsArticle = {
      id: this.nextNewsId++,
      title: data.title,
      slug: `${slug}-${this.nextNewsId - 1}`,
      summary: data.summary,
      content: data.content,
      featured_image: data.featured_image,
      author_id: data.author_id,
      author_name: author?.name || 'Usuario Desconocido',
      author_email: author?.email,
      category_id: data.category_id,
      category_name: category?.name || 'Sin Categoría',
      category_slug: category?.slug || 'sin-categoria',
      status: data.status,
      is_featured: data.is_featured,
      tags,
      views_count: 0,
      published_at: data.status === 'published' ? (data.published_at || now) : undefined,
      created_at: now,
      updated_at: now
    };

    this.newsArticles.unshift(article);
    return article;
  }

  async updateNewsArticle(id: number, data: {
    title: string;
    summary: string;
    content: string;
    featured_image?: string;
    category_id: number;
    tag_ids: number[];
    status: 'draft' | 'published' | 'archived';
    is_featured: boolean;
    published_at?: string;
  }): Promise<NewsArticle | null> {
    const articleIndex = this.newsArticles.findIndex(article => article.id === id);
    if (articleIndex === -1) return null;

    const article = this.newsArticles[articleIndex];
    const category = this.newsCategories.find(c => c.id === data.category_id);
    const tags = this.newsTags.filter(t => data.tag_ids.includes(t.id));
    const now = new Date().toISOString();

    // Generate new slug if title changed
    let slug = article.slug;
    if (data.title !== article.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + `-${id}`;
    }

    const updatedArticle: NewsArticle = {
      ...article,
      title: data.title,
      slug,
      summary: data.summary,
      content: data.content,
      featured_image: data.featured_image,
      category_id: data.category_id,
      category_name: category?.name || 'Sin Categoría',
      category_slug: category?.slug || 'sin-categoria',
      status: data.status,
      is_featured: data.is_featured,
      tags,
      published_at: data.status === 'published' ? (data.published_at || article.published_at || now) : article.published_at,
      updated_at: now
    };

    this.newsArticles[articleIndex] = updatedArticle;
    return updatedArticle;
  }

  async deleteNewsArticle(id: number): Promise<boolean> {
    const articleIndex = this.newsArticles.findIndex(article => article.id === id);
    if (articleIndex === -1) return false;

    this.newsArticles.splice(articleIndex, 1);
    return true;
  }

  // Public news methods (for public portal)
  async getPublicNewsArticles(
    search: string = '', 
    category: string = '',
    tag: string = '',
    sort: string = 'published_at', 
    order: string = 'desc',
    limit: number = 12, 
    offset: number = 0
  ) {
    // Only show published articles
    let filtered = this.newsArticles.filter(article => article.status === 'published');

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        (article.category_name && article.category_name.toLowerCase().includes(searchLower)) ||
        article.tags.some(tag => tag.name.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(article => 
        article.category_slug === category || 
        (article.category_name && article.category_name.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // Apply tag filter
    if (tag) {
      filtered = filtered.filter(article => 
        article.tags.some(t => t.slug === tag || t.name.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    // Apply sorting
    if (sort === 'title') {
      filtered.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return order === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      });
    } else if (sort === 'views') {
      filtered.sort((a, b) => {
        return order === 'asc' ? a.views_count - b.views_count : b.views_count - a.views_count;
      });
    } else if (sort === 'published_at') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at).getTime();
        const dateB = new Date(b.published_at || b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const total = filtered.length;
    const articles = filtered.slice(offset, offset + limit).map(article => ({
      ...article,
      tags: article.tags.map(t => t.name)
    }));

    return { articles, total };
  }

  async getPublicNewsArticleBySlug(slug: string): Promise<any | null> {
    const article = this.newsArticles.find(a => a.slug === slug && a.status === 'published');
    if (!article) return null;

    // Increment views count
    article.views_count++;

    return {
      ...article,
      tags: article.tags.map(t => t.name)
    };
  }

  async getFeaturedNewsArticles(limit: number = 3): Promise<any[]> {
    return this.newsArticles
      .filter(article => article.status === 'published' && article.is_featured)
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
      .slice(0, limit)
      .map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        featured_image: article.featured_image,
        author_name: article.author_name,
        category_name: article.category_name,
        category_slug: article.category_slug,
        published_at: article.published_at,
        views_count: article.views_count,
        tags: article.tags.map(t => t.name).slice(0, 3)
      }));
  }

  async getRecentNewsArticles(limit: number = 5): Promise<any[]> {
    return this.newsArticles
      .filter(article => article.status === 'published')
      .sort((a, b) => new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime())
      .slice(0, limit)
      .map(article => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        author_name: article.author_name,
        category_name: article.category_name,
        published_at: article.published_at,
        views_count: article.views_count
      }));
  }

  async getNewsStats(): Promise<any> {
    const publishedArticles = this.newsArticles.filter(article => article.status === 'published');
    
    // Categories stats
    const categoriesStats = new Map<string, number>();
    publishedArticles.forEach(article => {
      if (article.category_name) {
        categoriesStats.set(article.category_name, (categoriesStats.get(article.category_name) || 0) + 1);
      }
    });

    // Tags stats
    const tagsStats = new Map<string, number>();
    publishedArticles.forEach(article => {
      article.tags.forEach(tag => {
        tagsStats.set(tag.name, (tagsStats.get(tag.name) || 0) + 1);
      });
    });

    return {
      totalArticles: publishedArticles.length,
      featuredArticles: publishedArticles.filter(a => a.is_featured).length,
      totalViews: publishedArticles.reduce((sum, article) => sum + article.views_count, 0),
      totalCategories: this.newsCategories.length,
      totalTags: this.newsTags.length,
      topCategories: Array.from(categoriesStats.entries()).map(([name, count]) => ({
        name, count
      })).sort((a, b) => b.count - a.count).slice(0, 5),
      topTags: Array.from(tagsStats.entries()).map(([name, count]) => ({
        name, count
      })).sort((a, b) => b.count - a.count).slice(0, 10)
    };
  }

  // HU-10: Events and Convocatorias System Methods

  // Event Categories Management
  async getEventCategories(): Promise<EventCategory[]> {
    return [...this.eventCategories];
  }

  async getEventCategoryById(id: number): Promise<EventCategory | null> {
    return this.eventCategories.find(c => c.id === id) || null;
  }

  async getEventCategoryBySlug(slug: string): Promise<EventCategory | null> {
    return this.eventCategories.find(c => c.slug === slug) || null;
  }

  // Events Management (Admin)
  async getEvents(
    search: string = '', 
    status: string = '', 
    category: string = '',
    type: string = '',
    organizer: string = '',
    sort: string = 'created_at', 
    order: string = 'desc',
    limit: number = 10, 
    offset: number = 0
  ) {
    let filtered = [...this.events];

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.short_description.toLowerCase().includes(searchLower) ||
        (event.description && event.description.toLowerCase().includes(searchLower)) ||
        (event.organizer_name && event.organizer_name.toLowerCase().includes(searchLower)) ||
        (event.location && event.location.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    if (status) {
      filtered = filtered.filter(event => event.status === status);
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(event => 
        event.category_slug === category || 
        (event.category_name && event.category_name.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // Apply type filter
    if (type) {
      filtered = filtered.filter(event => event.type === type);
    }

    // Apply organizer filter
    if (organizer) {
      filtered = filtered.filter(event => 
        event.organizer_name?.toLowerCase().includes(organizer.toLowerCase()) ||
        event.organizer_email?.toLowerCase().includes(organizer.toLowerCase()) ||
        event.organizer_institution?.toLowerCase().includes(organizer.toLowerCase())
      );
    }

    // Apply sorting
    if (sort === 'title') {
      filtered.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return order === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      });
    } else if (sort === 'start_date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    } else if (sort === 'registrations') {
      filtered.sort((a, b) => {
        return order === 'asc' ? a.current_participants - b.current_participants : b.current_participants - a.current_participants;
      });
    } else if (sort === 'views') {
      filtered.sort((a, b) => {
        return order === 'asc' ? a.views_count - b.views_count : b.views_count - a.views_count;
      });
    } else {
      // Default: created_at
      filtered.sort((a, b) => {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const total = filtered.length;
    const events = filtered.slice(offset, offset + limit);

    return { events, total };
  }

  async getEventById(id: number): Promise<Event | null> {
    return this.events.find(event => event.id === id) || null;
  }

  async getEventBySlug(slug: string): Promise<Event | null> {
    return this.events.find(event => event.slug === slug) || null;
  }

  async createEvent(data: {
    title: string;
    description: string;
    short_description: string;
    type: string;
    category_id: number;
    organizer_id: number;
    start_date: string;
    end_date: string;
    registration_start: string;
    registration_end: string;
    location: string;
    venue: string;
    address: string;
    virtual_link?: string;
    is_virtual: boolean;
    is_hybrid: boolean;
    max_participants: number;
    registration_required: boolean;
    registration_fee: number;
    is_free: boolean;
    featured_image?: string;
    agenda?: string;
    requirements?: string;
    target_audience?: string;
    learning_objectives?: string;
    tags: string[];
    status: 'draft' | 'published' | 'cancelled';
    is_featured: boolean;
    is_public: boolean;
  }): Promise<Event> {
    const now = new Date().toISOString();
    const organizer = this.users.find(u => u.id === data.organizer_id);
    const category = this.eventCategories.find(c => c.id === data.category_id);
    
    // Generate slug from title
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const event: Event = {
      id: this.nextEventId++,
      title: data.title,
      slug: `${slug}-${this.nextEventId - 1}`,
      description: data.description,
      short_description: data.short_description,
      type: data.type,
      category_id: data.category_id,
      category_name: category?.name || 'Sin Categoría',
      category_slug: category?.slug || 'sin-categoria',
      organizer_id: data.organizer_id,
      organizer_name: organizer?.name || 'Organizador Desconocido',
      organizer_email: organizer?.email,
      organizer_institution: organizer?.institution,
      start_date: data.start_date,
      end_date: data.end_date,
      registration_start: data.registration_start,
      registration_end: data.registration_end,
      location: data.location,
      venue: data.venue,
      address: data.address,
      virtual_link: data.virtual_link,
      is_virtual: data.is_virtual,
      is_hybrid: data.is_hybrid,
      max_participants: data.max_participants,
      current_participants: 0,
      registration_required: data.registration_required,
      registration_fee: data.registration_fee,
      is_free: data.is_free,
      featured_image: data.featured_image,
      agenda: data.agenda,
      requirements: data.requirements,
      target_audience: data.target_audience,
      learning_objectives: data.learning_objectives,
      status: data.status,
      is_featured: data.is_featured,
      is_public: data.is_public,
      tags: data.tags,
      views_count: 0,
      registrations_count: 0,
      created_at: now,
      updated_at: now
    };

    this.events.unshift(event);
    return event;
  }

  async updateEvent(id: number, data: {
    title: string;
    description: string;
    short_description: string;
    type: string;
    category_id: number;
    start_date: string;
    end_date: string;
    registration_start: string;
    registration_end: string;
    location: string;
    venue: string;
    address: string;
    virtual_link?: string;
    is_virtual: boolean;
    is_hybrid: boolean;
    max_participants: number;
    registration_required: boolean;
    registration_fee: number;
    is_free: boolean;
    featured_image?: string;
    agenda?: string;
    requirements?: string;
    target_audience?: string;
    learning_objectives?: string;
    tags: string[];
    status: 'draft' | 'published' | 'cancelled';
    is_featured: boolean;
    is_public: boolean;
  }): Promise<Event | null> {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) return null;

    const event = this.events[eventIndex];
    const category = this.eventCategories.find(c => c.id === data.category_id);
    const now = new Date().toISOString();

    // Generate new slug if title changed
    let slug = event.slug;
    if (data.title !== event.title) {
      slug = data.title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() + `-${id}`;
    }

    const updatedEvent: Event = {
      ...event,
      title: data.title,
      slug,
      description: data.description,
      short_description: data.short_description,
      type: data.type,
      category_id: data.category_id,
      category_name: category?.name || 'Sin Categoría',
      category_slug: category?.slug || 'sin-categoria',
      start_date: data.start_date,
      end_date: data.end_date,
      registration_start: data.registration_start,
      registration_end: data.registration_end,
      location: data.location,
      venue: data.venue,
      address: data.address,
      virtual_link: data.virtual_link,
      is_virtual: data.is_virtual,
      is_hybrid: data.is_hybrid,
      max_participants: data.max_participants,
      registration_required: data.registration_required,
      registration_fee: data.registration_fee,
      is_free: data.is_free,
      featured_image: data.featured_image,
      agenda: data.agenda,
      requirements: data.requirements,
      target_audience: data.target_audience,
      learning_objectives: data.learning_objectives,
      status: data.status,
      is_featured: data.is_featured,
      is_public: data.is_public,
      tags: data.tags,
      updated_at: now
    };

    this.events[eventIndex] = updatedEvent;
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const eventIndex = this.events.findIndex(event => event.id === id);
    if (eventIndex === -1) return false;

    // Also remove all registrations for this event
    this.eventRegistrations = this.eventRegistrations.filter(reg => reg.event_id !== id);
    this.events.splice(eventIndex, 1);
    return true;
  }

  // Public Events Methods (for public portal)
  async getPublicEvents(
    search: string = '', 
    category: string = '',
    type: string = '',
    location: string = '',
    upcoming: boolean = false,
    featured: boolean = false,
    sort: string = 'start_date', 
    order: string = 'asc',
    limit: number = 12, 
    offset: number = 0
  ) {
    // Only show published and public events
    let filtered = this.events.filter(event => event.status === 'published' && event.is_public);

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(searchLower) ||
        event.short_description.toLowerCase().includes(searchLower) ||
        (event.category_name && event.category_name.toLowerCase().includes(searchLower)) ||
        event.tags.some(tag => tag.toLowerCase().includes(searchLower)) ||
        (event.location && event.location.toLowerCase().includes(searchLower))
      );
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(event => 
        event.category_slug === category || 
        (event.category_name && event.category_name.toLowerCase().includes(category.toLowerCase()))
      );
    }

    // Apply type filter
    if (type) {
      filtered = filtered.filter(event => event.type === type);
    }

    // Apply location filter
    if (location) {
      filtered = filtered.filter(event => 
        event.location && event.location.toLowerCase().includes(location.toLowerCase())
      );
    }

    // Apply upcoming filter
    if (upcoming) {
      const now = new Date();
      filtered = filtered.filter(event => new Date(event.start_date) >= now);
    }

    // Apply featured filter
    if (featured) {
      filtered = filtered.filter(event => event.is_featured);
    }

    // Apply sorting
    if (sort === 'title') {
      filtered.sort((a, b) => {
        const titleA = a.title.toLowerCase();
        const titleB = b.title.toLowerCase();
        return order === 'asc' ? titleA.localeCompare(titleB) : titleB.localeCompare(titleA);
      });
    } else if (sort === 'registrations') {
      filtered.sort((a, b) => {
        return order === 'asc' ? a.current_participants - b.current_participants : b.current_participants - a.current_participants;
      });
    } else if (sort === 'views') {
      filtered.sort((a, b) => {
        return order === 'asc' ? a.views_count - b.views_count : b.views_count - a.views_count;
      });
    } else if (sort === 'start_date') {
      filtered.sort((a, b) => {
        const dateA = new Date(a.start_date).getTime();
        const dateB = new Date(b.start_date).getTime();
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    const total = filtered.length;
    const events = filtered.slice(offset, offset + limit);

    return { events, total };
  }

  async getPublicEventBySlug(slug: string): Promise<Event | null> {
    const event = this.events.find(e => e.slug === slug && e.status === 'published' && e.is_public);
    if (!event) return null;

    // Increment views count
    event.views_count++;

    return event;
  }

  async getFeaturedEvents(limit: number = 3): Promise<Event[]> {
    return this.events
      .filter(event => event.status === 'published' && event.is_public && event.is_featured)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, limit);
  }

  async getUpcomingEvents(limit: number = 5): Promise<Event[]> {
    const now = new Date();
    return this.events
      .filter(event => 
        event.status === 'published' && 
        event.is_public && 
        new Date(event.start_date) >= now
      )
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, limit);
  }

  async getEventsByCategory(categorySlug: string, limit: number = 5): Promise<Event[]> {
    return this.events
      .filter(event => 
        event.status === 'published' && 
        event.is_public && 
        event.category_slug === categorySlug
      )
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
      .slice(0, limit);
  }

  // Event Registration Management
  async registerForEvent(data: {
    event_id: number;
    user_id: number;
    participant_name: string;
    participant_email: string;
    participant_phone?: string;
    participant_institution?: string;
    dietary_requirements?: string;
    accessibility_needs?: string;
    additional_notes?: string;
  }): Promise<EventRegistration | null> {
    const event = this.events.find(e => e.id === data.event_id);
    if (!event) return null;

    // Check if registration is open
    const now = new Date();
    const registrationStart = new Date(event.registration_start);
    const registrationEnd = new Date(event.registration_end);
    if (now < registrationStart || now > registrationEnd) return null;

    // Check if event is full
    if (event.current_participants >= event.max_participants) return null;

    // Check if user is already registered
    const existingRegistration = this.eventRegistrations.find(
      reg => reg.event_id === data.event_id && reg.user_id === data.user_id
    );
    if (existingRegistration) return null;

    const registration: EventRegistration = {
      id: this.nextRegistrationId++,
      event_id: data.event_id,
      user_id: data.user_id,
      participant_name: data.participant_name,
      participant_email: data.participant_email,
      participant_phone: data.participant_phone,
      participant_institution: data.participant_institution,
      registration_date: new Date().toISOString(),
      status: 'confirmed',
      payment_status: event.is_free ? 'completed' : 'pending',
      dietary_requirements: data.dietary_requirements,
      accessibility_needs: data.accessibility_needs,
      additional_notes: data.additional_notes,
      confirmation_code: `EVT${data.event_id}-${this.nextRegistrationId - 1}-${Date.now().toString(36).toUpperCase()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.eventRegistrations.push(registration);
    
    // Update event participant count
    event.current_participants++;
    event.registrations_count++;

    return registration;
  }

  async getEventRegistrations(
    eventId: number,
    status: string = '',
    search: string = '',
    limit: number = 50,
    offset: number = 0
  ): Promise<{ registrations: EventRegistration[], total: number }> {
    let filtered = this.eventRegistrations.filter(reg => reg.event_id === eventId);

    // Apply status filter
    if (status) {
      filtered = filtered.filter(reg => reg.status === status);
    }

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(reg => 
        reg.participant_name.toLowerCase().includes(searchLower) ||
        reg.participant_email.toLowerCase().includes(searchLower) ||
        (reg.participant_institution && reg.participant_institution.toLowerCase().includes(searchLower)) ||
        (reg.confirmation_code && reg.confirmation_code.toLowerCase().includes(searchLower))
      );
    }

    const total = filtered.length;
    const registrations = filtered
      .sort((a, b) => new Date(b.registration_date).getTime() - new Date(a.registration_date).getTime())
      .slice(offset, offset + limit);

    return { registrations, total };
  }

  async getUserEventRegistration(userId: number, eventId: number): Promise<EventRegistration | null> {
    return this.eventRegistrations.find(
      reg => reg.user_id === userId && reg.event_id === eventId
    ) || null;
  }

  async cancelEventRegistration(registrationId: number): Promise<boolean> {
    const registrationIndex = this.eventRegistrations.findIndex(reg => reg.id === registrationId);
    if (registrationIndex === -1) return false;

    const registration = this.eventRegistrations[registrationIndex];
    const event = this.events.find(e => e.id === registration.event_id);
    
    if (event) {
      event.current_participants = Math.max(0, event.current_participants - 1);
      event.registrations_count = Math.max(0, event.registrations_count - 1);
    }

    registration.status = 'cancelled';
    registration.updated_at = new Date().toISOString();

    return true;
  }

  async getEventsStats(): Promise<any> {
    const publishedEvents = this.events.filter(event => event.status === 'published');
    const now = new Date();
    
    // Categories stats
    const categoriesStats = new Map<string, number>();
    publishedEvents.forEach(event => {
      if (event.category_name) {
        categoriesStats.set(event.category_name, (categoriesStats.get(event.category_name) || 0) + 1);
      }
    });

    // Types stats
    const typesStats = new Map<string, number>();
    publishedEvents.forEach(event => {
      typesStats.set(event.type, (typesStats.get(event.type) || 0) + 1);
    });

    return {
      totalEvents: publishedEvents.length,
      upcomingEvents: publishedEvents.filter(e => new Date(e.start_date) >= now).length,
      pastEvents: publishedEvents.filter(e => new Date(e.start_date) < now).length,
      featuredEvents: publishedEvents.filter(e => e.is_featured).length,
      totalRegistrations: this.eventRegistrations.filter(r => r.status === 'confirmed').length,
      totalViews: publishedEvents.reduce((sum, event) => sum + event.views_count, 0),
      totalCategories: this.eventCategories.length,
      topCategories: Array.from(categoriesStats.entries()).map(([name, count]) => ({
        name, count
      })).sort((a, b) => b.count - a.count).slice(0, 5),
      eventTypes: Array.from(typesStats.entries()).map(([type, count]) => ({
        type, count
      })).sort((a, b) => b.count - a.count),
      registrationStats: {
        confirmed: this.eventRegistrations.filter(r => r.status === 'confirmed').length,
        pending: this.eventRegistrations.filter(r => r.status === 'pending').length,
        cancelled: this.eventRegistrations.filter(r => r.status === 'cancelled').length
      }
    };
  }

  // HU-11: Resources and Scientific Documents System Methods

  // Resource Categories Management
  async getResourceCategories(): Promise<ResourceCategory[]> {
    return [...this.resourceCategories];
  }

  async getResourceCategoryById(id: number): Promise<ResourceCategory | null> {
    return this.resourceCategories.find(c => c.id === id) || null;
  }

  async getResourceCategoryBySlug(slug: string): Promise<ResourceCategory | null> {
    return this.resourceCategories.find(c => c.slug === slug) || null;
  }

  // Resources Management (Admin)
  async getResources(
    search: string = '', 
    type: string = '', 
    category: string = '', 
    status: string = '',
    author: string = '',
    sort: string = 'created_at', 
    order: string = 'desc',
    limit: number = 10, 
    offset: number = 0
  ): Promise<{ resources: Resource[], total: number }> {
    let filteredResources = [...this.resources];

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResources = filteredResources.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.summary.toLowerCase().includes(searchLower) ||
        r.author.toLowerCase().includes(searchLower) ||
        r.keywords.some(k => k.toLowerCase().includes(searchLower))
      );
    }

    if (type) {
      filteredResources = filteredResources.filter(r => r.type === type);
    }

    if (category) {
      filteredResources = filteredResources.filter(r => r.category_slug === category);
    }

    if (status) {
      filteredResources = filteredResources.filter(r => r.status === status);
    }

    if (author) {
      const authorLower = author.toLowerCase();
      filteredResources = filteredResources.filter(r => 
        r.author.toLowerCase().includes(authorLower) ||
        r.author_institution.toLowerCase().includes(authorLower)
      );
    }

    // Apply sorting
    filteredResources.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'author':
          aValue = a.author;
          bValue = b.author;
          break;
        case 'publication_date':
          aValue = new Date(a.publication_date);
          bValue = new Date(b.publication_date);
          break;
        case 'downloads_count':
          aValue = a.downloads_count;
          bValue = b.downloads_count;
          break;
        case 'views_count':
          aValue = a.views_count;
          bValue = b.views_count;
          break;
        default: // created_at
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
      }

      if (typeof aValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    const total = filteredResources.length;
    const paginatedResources = filteredResources.slice(offset, offset + limit);

    return {
      resources: paginatedResources,
      total
    };
  }

  async getResourceById(id: number): Promise<Resource | null> {
    return this.resources.find(r => r.id === id) || null;
  }

  async getResourceBySlug(slug: string): Promise<Resource | null> {
    return this.resources.find(r => r.slug === slug) || null;
  }

  async createResource(data: any): Promise<Resource> {
    const category = this.resourceCategories.find(c => c.id === data.category_id);
    
    const resource: Resource = {
      id: this.resources.length + 1,
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: data.description,
      summary: data.summary,
      type: data.type,
      category_id: data.category_id,
      category_name: category ? category.name : '',
      category_slug: category ? category.slug : '',
      author: data.author,
      author_institution: data.author_institution,
      created_by: data.created_by || 1,
      creator_name: data.creator_name || 'Admin',
      file_url: data.file_url || '',
      file_size: data.file_size || 0,
      file_type: data.file_type || '',
      download_url: data.download_url || '',
      external_url: data.external_url || '',
      language: data.language,
      publication_date: data.publication_date,
      keywords: Array.isArray(data.keywords) ? data.keywords : [],
      tags: Array.isArray(data.tags) ? data.tags : [],
      is_featured: data.is_featured,
      is_public: data.is_public,
      status: data.status,
      downloads_count: 0,
      views_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.resources.push(resource);
    return resource;
  }

  async updateResource(id: number, data: any): Promise<Resource | null> {
    const index = this.resources.findIndex(r => r.id === id);
    if (index === -1) return null;

    const category = this.resourceCategories.find(c => c.id === data.category_id);
    
    const updatedResource = {
      ...this.resources[index],
      title: data.title,
      slug: data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      description: data.description,
      summary: data.summary,
      type: data.type,
      category_id: data.category_id,
      category_name: category ? category.name : this.resources[index].category_name,
      category_slug: category ? category.slug : this.resources[index].category_slug,
      author: data.author,
      author_institution: data.author_institution,
      file_url: data.file_url || this.resources[index].file_url,
      file_size: data.file_size || this.resources[index].file_size,
      file_type: data.file_type || this.resources[index].file_type,
      download_url: data.download_url || this.resources[index].download_url,
      external_url: data.external_url || this.resources[index].external_url,
      language: data.language,
      publication_date: data.publication_date,
      keywords: Array.isArray(data.keywords) ? data.keywords : this.resources[index].keywords,
      tags: Array.isArray(data.tags) ? data.tags : this.resources[index].tags,
      is_featured: data.is_featured,
      is_public: data.is_public,
      status: data.status,
      updated_at: new Date().toISOString()
    };

    this.resources[index] = updatedResource;
    return updatedResource;
  }

  async deleteResource(id: number): Promise<boolean> {
    const index = this.resources.findIndex(r => r.id === id);
    if (index === -1) return false;
    
    this.resources.splice(index, 1);
    return true;
  }

  // Public Resources API Methods
  async getPublicResources(
    search: string = '', 
    type: string = '', 
    category: string = '', 
    author: string = '',
    sort: string = 'publication_date', 
    order: string = 'desc',
    limit: number = 12, 
    offset: number = 0
  ): Promise<{ resources: any[], total: number }> {
    let filteredResources = this.resources.filter(r => r.status === 'published' && r.is_public);

    // Apply filters
    if (search) {
      const searchLower = search.toLowerCase();
      filteredResources = filteredResources.filter(r => 
        r.title.toLowerCase().includes(searchLower) ||
        r.summary.toLowerCase().includes(searchLower) ||
        r.author.toLowerCase().includes(searchLower) ||
        r.keywords.some(k => k.toLowerCase().includes(searchLower))
      );
    }

    if (type) {
      filteredResources = filteredResources.filter(r => r.type === type);
    }

    if (category) {
      filteredResources = filteredResources.filter(r => r.category_slug === category);
    }

    if (author) {
      const authorLower = author.toLowerCase();
      filteredResources = filteredResources.filter(r => 
        r.author.toLowerCase().includes(authorLower) ||
        r.author_institution.toLowerCase().includes(authorLower)
      );
    }

    // Apply sorting
    filteredResources.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'author':
          aValue = a.author;
          bValue = b.author;
          break;
        case 'downloads_count':
          aValue = a.downloads_count;
          bValue = b.downloads_count;
          break;
        case 'views_count':
          aValue = a.views_count;
          bValue = b.views_count;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default: // publication_date
          aValue = new Date(a.publication_date);
          bValue = new Date(b.publication_date);
      }

      if (typeof aValue === 'string') {
        return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return order === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

    const total = filteredResources.length;
    const paginatedResources = filteredResources.slice(offset, offset + limit);

    // Transform to public format
    const publicResources = paginatedResources.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      type: r.type,
      category_name: r.category_name,
      category_slug: r.category_slug,
      author: r.author,
      author_institution: r.author_institution,
      publication_date: r.publication_date,
      language: r.language,
      file_type: r.file_type,
      file_size: r.file_size,
      external_url: r.external_url,
      keywords: r.keywords,
      tags: r.tags,
      downloads_count: r.downloads_count,
      views_count: r.views_count
    }));

    return {
      resources: publicResources,
      total
    };
  }

  async getPublicResourceBySlug(slug: string): Promise<any | null> {
    const resource = this.resources.find(r => r.slug === slug && r.status === 'published' && r.is_public);
    if (!resource) return null;

    // Increment view count
    resource.views_count += 1;

    return {
      id: resource.id,
      title: resource.title,
      slug: resource.slug,
      description: resource.description,
      summary: resource.summary,
      type: resource.type,
      category_name: resource.category_name,
      author: resource.author,
      author_institution: resource.author_institution,
      publication_date: resource.publication_date,
      language: resource.language,
      file_url: resource.file_url,
      file_type: resource.file_type,
      file_size: resource.file_size,
      download_url: resource.download_url,
      external_url: resource.external_url,
      keywords: resource.keywords,
      tags: resource.tags,
      downloads_count: resource.downloads_count,
      views_count: resource.views_count
    };
  }

  async getFeaturedResources(limit: number = 3): Promise<any[]> {
    const featuredResources = this.resources
      .filter(r => r.is_featured && r.status === 'published' && r.is_public)
      .sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime())
      .slice(0, limit);

    return featuredResources.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      type: r.type,
      category_name: r.category_name,
      category_slug: r.category_slug,
      author: r.author,
      author_institution: r.author_institution,
      publication_date: r.publication_date,
      language: r.language,
      file_type: r.file_type,
      file_size: r.file_size,
      external_url: r.external_url,
      keywords: r.keywords,
      tags: r.tags,
      downloads_count: r.downloads_count,
      views_count: r.views_count
    }));
  }

  async getResourcesByCategory(categorySlug: string, limit: number = 5): Promise<any[]> {
    const resources = this.resources
      .filter(r => r.category_slug === categorySlug && r.status === 'published' && r.is_public)
      .sort((a, b) => new Date(b.publication_date).getTime() - new Date(a.publication_date).getTime())
      .slice(0, limit);

    return resources.map(r => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      summary: r.summary,
      type: r.type,
      author: r.author,
      publication_date: r.publication_date,
      downloads_count: r.downloads_count,
      views_count: r.views_count
    }));
  }

  async downloadResource(slug: string): Promise<boolean> {
    const resource = this.resources.find(r => r.slug === slug && r.status === 'published' && r.is_public);
    if (!resource) return false;

    // Increment download count
    resource.downloads_count += 1;
    return true;
  }

  async getResourcesStats(): Promise<any> {
    const publishedResources = this.resources.filter(r => r.status === 'published');
    
    // Types stats
    const typesStats = new Map<string, number>();
    publishedResources.forEach(r => {
      typesStats.set(r.type, (typesStats.get(r.type) || 0) + 1);
    });

    // Categories stats
    const categoriesStats = new Map<string, number>();
    publishedResources.forEach(r => {
      if (r.category_name) {
        categoriesStats.set(r.category_name, (categoriesStats.get(r.category_name) || 0) + 1);
      }
    });

    return {
      totalResources: publishedResources.length,
      featuredResources: publishedResources.filter(r => r.is_featured).length,
      totalDownloads: publishedResources.reduce((sum, r) => sum + r.downloads_count, 0),
      totalViews: publishedResources.reduce((sum, r) => sum + r.views_count, 0),
      totalCategories: this.resourceCategories.length,
      resourceTypes: Array.from(typesStats.entries()).map(([type, count]) => ({
        type, count
      })).sort((a, b) => b.count - a.count),
      topCategories: Array.from(categoriesStats.entries()).map(([name, count]) => ({
        name, count
      })).sort((a, b) => b.count - a.count).slice(0, 5),
      languageStats: {
        'Español': publishedResources.filter(r => r.language.includes('Español')).length,
        'Inglés': publishedResources.filter(r => r.language.includes('Inglés')).length,
        'Español/Inglés': publishedResources.filter(r => r.language.includes('Español/Inglés')).length
      }
    };
  }
}

// Singleton instance
export const mockDb = new MockDatabase();

// Initialize password hashes for existing mock users
mockDb.passwordHashes.set('admin@codecti.choco.gov.co', mockPasswordHash);
mockDb.passwordHashes.set('investigador1@codecti.choco.gov.co', mockPasswordHash);
mockDb.passwordHashes.set('investigador2@codecti.choco.gov.co', mockPasswordHash);

// HU-12: Analytics - Export functions for getting all data
export function getAllProjects(): Project[] {
  return mockDb.projects;
}

export function getAllUsers(): User[] {
  return mockDb.users;
}

export function getAllNews(): NewsArticle[] {
  return mockDb.newsArticles;
}

export function getAllEvents(): Event[] {
  return mockDb.events;
}

export function getAllResources(): Resource[] {
  return mockDb.resources;
}