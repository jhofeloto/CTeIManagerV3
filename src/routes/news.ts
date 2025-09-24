// CODECTI Platform - News/Blog Routes
// HU-09: Sistema de Noticias/Blog

import { Hono } from 'hono';
import type {
  Bindings,
  NewsArticle,
  NewsListResponse,
  NewsArticleResponse,
  CreateNewsArticleRequest,
  UpdateNewsArticleRequest
} from '../types';
import { logger } from '../monitoring/logger';
import { authMiddleware } from '../utils/middleware';
import { mlHelpers } from '../utils/mlService';

const newsRoutes = new Hono<{ Bindings: Bindings }>();

// Apply authentication middleware to all news admin routes
newsRoutes.use('/*', authMiddleware);

// GET /api/news - List all news articles (Admin only)
newsRoutes.get('/', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const status = c.req.query('status') || '';
    const category = c.req.query('category') || '';
    const author = c.req.query('author') || '';
    const sort = c.req.query('sort') || 'created_at';
    const order = c.req.query('order') || 'desc';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = (page - 1) * limit;

    // Log admin access
    logger.info('NEWS_ADMIN_ACCESS', {
      endpoint: '/api/news',
      params: { search, status, category, author, sort, order, page, limit },
      userEmail: c.get('user')?.email,
      userRole: c.get('user')?.role
    });

    let result: any;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const whereConditions: string[] = [];
      const params: any[] = [];

      if (search) {
        whereConditions.push(`(n.title LIKE ? OR n.summary LIKE ? OR n.content LIKE ? OR u.name LIKE ?)`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (status) {
        whereConditions.push('n.status = ?');
        params.push(status);
      }

      if (category) {
        whereConditions.push('(c.slug = ? OR c.name LIKE ?)');
        params.push(category, `%${category}%`);
      }

      if (author) {
        whereConditions.push('(u.name LIKE ? OR u.email LIKE ?)');
        params.push(`%${author}%`, `%${author}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      
      const query = `
        SELECT 
          n.*,
          u.name as author_name,
          u.email as author_email,
          c.name as category_name,
          c.slug as category_slug
        FROM news_articles n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN news_categories c ON n.category_id = c.id
        ${whereClause}
        ORDER BY n.${sort} ${order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM news_articles n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN news_categories c ON n.category_id = c.id
        ${whereClause}
      `;

      params.push(limit, offset);

      const [articlesResult, countResult] = await Promise.all([
        c.env.DB.prepare(query).bind(...params).all(),
        c.env.DB.prepare(countQuery).bind(...params.slice(0, -2)).first()
      ]);
      
      result = {
        articles: articlesResult.results || [],
        total: (countResult as any)?.total || 0
      };
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      result = await mockDb.getNewsArticles(search, status, category, author, sort, order, limit, offset);
    }

    const totalPages = Math.ceil(result.total / limit);

    logger.info('NEWS_ARTICLES_SERVED', {
      count: result.articles.length,
      total: result.total,
      page,
      filters: { search, status, category, author }
    });

    const response: NewsListResponse = {
      success: true,
      articles: result.articles,
      total: result.total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    };

    return c.json(response);
  } catch (error) {
    logger.error('NEWS_ARTICLES_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar artículos de noticias',
      articles: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      limit: 10
    } as NewsListResponse, 500);
  }
});

// GET /api/news/:id - Get specific news article (Admin)
newsRoutes.get('/:id', async (c) => {
  try {
    const articleId = parseInt(c.req.param('id'));
    
    if (isNaN(articleId)) {
      return c.json({
        success: false,
        message: 'ID de artículo inválido'
      } as NewsArticleResponse, 400);
    }

    let article: NewsArticle | null = null;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare(`
        SELECT 
          n.*,
          u.name as author_name,
          u.email as author_email,
          c.name as category_name,
          c.slug as category_slug
        FROM news_articles n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN news_categories c ON n.category_id = c.id
        WHERE n.id = ?
      `).bind(articleId).first();
      
      if (result) {
        // Get tags for this article
        const tagsResult = await c.env.DB.prepare(`
          SELECT t.id, t.name, t.slug, t.created_at
          FROM news_tags t
          JOIN news_article_tags nat ON t.id = nat.tag_id
          WHERE nat.article_id = ?
        `).bind(articleId).all();

        article = {
          ...result,
          tags: tagsResult.results || []
        } as NewsArticle;
      }
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      article = await mockDb.getNewsArticleById(articleId);
    }

    if (!article) {
      return c.json({
        success: false,
        message: 'Artículo no encontrado'
      } as NewsArticleResponse, 404);
    }

    logger.info('NEWS_ARTICLE_ACCESSED', {
      articleId,
      userEmail: c.get('user')?.email
    });

    return c.json({
      success: true,
      article
    } as NewsArticleResponse);

  } catch (error) {
    logger.error('NEWS_ARTICLE_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar artículo'
    } as NewsArticleResponse, 500);
  }
});

// POST /api/news - Create new news article (Admin/Author)
newsRoutes.post('/', async (c) => {
  try {
    const user = c.get('user');
    
    // Only admins and collaborators can create news articles
    if (!['admin', 'collaborator'].includes(user?.role || '')) {
      return c.json({
        success: false,
        message: 'No tienes permisos para crear artículos'
      } as NewsArticleResponse, 403);
    }

    const data: CreateNewsArticleRequest = await c.req.json();

    // Validate required fields
    if (!data.title || !data.summary || !data.content || !data.category_id) {
      return c.json({
        success: false,
        message: 'Campos requeridos: título, resumen, contenido y categoría'
      } as NewsArticleResponse, 400);
    }

    let article: NewsArticle | null = null;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      // TODO: Implement D1 database operations
      return c.json({
        success: false,
        message: 'Funcionalidad no disponible en producción aún'
      } as NewsArticleResponse, 501);
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      article = await mockDb.createNewsArticle({
        title: data.title,
        summary: data.summary,
        content: data.content,
        featured_image: data.featured_image,
        author_id: user.userId,
        category_id: data.category_id,
        tag_ids: data.tag_ids || [],
        status: data.status || 'draft',
        is_featured: data.is_featured || false,
        published_at: data.published_at
      });
    }

    if (!article) {
      return c.json({
        success: false,
        message: 'Error al crear artículo'
      } as NewsArticleResponse, 500);
    }

    logger.info('NEWS_ARTICLE_CREATED', {
      articleId: article.id,
      title: article.title,
      authorId: user.userId,
      authorEmail: user.email,
      status: article.status
    });

    return c.json({
      success: true,
      article,
      message: 'Artículo creado exitosamente'
    } as NewsArticleResponse, 201);

  } catch (error) {
    logger.error('NEWS_CREATE_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al crear artículo'
    } as NewsArticleResponse, 500);
  }
});

// PUT /api/news/:id - Update news article (Admin/Author)
newsRoutes.put('/:id', async (c) => {
  try {
    const user = c.get('user');
    const articleId = parseInt(c.req.param('id'));
    
    if (isNaN(articleId)) {
      return c.json({
        success: false,
        message: 'ID de artículo inválido'
      } as NewsArticleResponse, 400);
    }

    // Only admins and collaborators can update news articles
    if (!['admin', 'collaborator'].includes(user?.role || '')) {
      return c.json({
        success: false,
        message: 'No tienes permisos para editar artículos'
      } as NewsArticleResponse, 403);
    }

    const data: UpdateNewsArticleRequest = await c.req.json();

    let article: NewsArticle | null = null;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      // TODO: Implement D1 database operations
      return c.json({
        success: false,
        message: 'Funcionalidad no disponible en producción aún'
      } as NewsArticleResponse, 501);
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      article = await mockDb.updateNewsArticle(articleId, data);
    }

    if (!article) {
      return c.json({
        success: false,
        message: 'Artículo no encontrado'
      } as NewsArticleResponse, 404);
    }

    logger.info('NEWS_ARTICLE_UPDATED', {
      articleId,
      title: article.title,
      editorId: user.userId,
      editorEmail: user.email,
      status: article.status
    });

    return c.json({
      success: true,
      article,
      message: 'Artículo actualizado exitosamente'
    } as NewsArticleResponse);

  } catch (error) {
    logger.error('NEWS_UPDATE_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al actualizar artículo'
    } as NewsArticleResponse, 500);
  }
});

// DELETE /api/news/:id - Delete news article (Admin only)
newsRoutes.delete('/:id', async (c) => {
  try {
    const user = c.get('user');
    const articleId = parseInt(c.req.param('id'));
    
    if (isNaN(articleId)) {
      return c.json({
        success: false,
        message: 'ID de artículo inválido'
      }, 400);
    }

    // Only admins can delete news articles
    if (user?.role !== 'admin') {
      return c.json({
        success: false,
        message: 'Solo los administradores pueden eliminar artículos'
      }, 403);
    }

    let deleted = false;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      // TODO: Implement D1 database operations
      return c.json({
        success: false,
        message: 'Funcionalidad no disponible en producción aún'
      }, 501);
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      deleted = await mockDb.deleteNewsArticle(articleId);
    }

    if (!deleted) {
      return c.json({
        success: false,
        message: 'Artículo no encontrado'
      }, 404);
    }

    logger.info('NEWS_ARTICLE_DELETED', {
      articleId,
      deletedBy: user.userId,
      deletedByEmail: user.email
    });

    return c.json({
      success: true,
      message: 'Artículo eliminado exitosamente'
    });

  } catch (error) {
    logger.error('NEWS_DELETE_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al eliminar artículo'
    }, 500);
  }
});

// GET /api/news/categories - Get all news categories
newsRoutes.get('/categories', async (c) => {
  try {
    let categories: any[] = [];

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare('SELECT * FROM news_categories ORDER BY name ASC').all();
      categories = result.results || [];
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      categories = await mockDb.getNewsCategories();
    }

    return c.json({
      success: true,
      categories
    });

  } catch (error) {
    logger.error('NEWS_CATEGORIES_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar categorías',
      categories: []
    }, 500);
  }
});

// GET /api/news/tags - Get all news tags
newsRoutes.get('/tags', async (c) => {
  try {
    let tags: any[] = [];

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare('SELECT * FROM news_tags ORDER BY name ASC').all();
      tags = result.results || [];
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      tags = await mockDb.getNewsTags();
    }

    return c.json({
      success: true,
      tags
    });

  } catch (error) {
    logger.error('NEWS_TAGS_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar tags',
      tags: []
    }, 500);
  }
});

// POST /api/news/analyze-sentiment - Analyze sentiment of news content (ML-powered)
newsRoutes.post('/analyze-sentiment', async (c) => {
  try {
    const { content, title } = await c.req.json();

    if (!content) {
      return c.json({
        success: false,
        message: 'Contenido es requerido para análisis de sentimiento'
      }, 400);
    }

    // ML-powered sentiment analysis (with fallback)
    let sentimentResult;
    try {
      const fullText = title ? `${title}. ${content}` : content;
      sentimentResult = await mlHelpers.analyzeNewsSentiment(fullText);
    } catch (error) {
      console.warn('ML sentiment analysis failed, using fallback:', error);
      // Fallback: simple keyword-based sentiment analysis
      sentimentResult = analyzeSentimentFallback(content);
    }

    logger.info('NEWS_SENTIMENT_ANALYZED', {
      contentLength: content.length,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
      userEmail: c.get('user')?.email
    });

    return c.json({
      success: true,
      sentiment: sentimentResult.sentiment,
      confidence: sentimentResult.confidence,
      score: sentimentResult.score,
      message: `Análisis completado. Sentimiento detectado: ${sentimentResult.sentiment}`
    });

  } catch (error) {
    logger.error('NEWS_SENTIMENT_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al analizar sentimiento del contenido'
    }, 500);
  }
});

// POST /api/news/generate-summary - Generate summary of news content (ML-powered)
newsRoutes.post('/generate-summary', async (c) => {
  try {
    const { content, maxLength = 150 } = await c.req.json();

    if (!content) {
      return c.json({
        success: false,
        message: 'Contenido es requerido para generar resumen'
      }, 400);
    }

    // ML-powered summary generation (with fallback)
    let summary;
    try {
      summary = await mlHelpers.summarizeProject(content, maxLength);
    } catch (error) {
      console.warn('ML summary generation failed, using fallback:', error);
      // Fallback: simple extractive summary
      summary = generateSummaryFallback(content, maxLength);
    }

    logger.info('NEWS_SUMMARY_GENERATED', {
      contentLength: content.length,
      summaryLength: summary.length,
      userEmail: c.get('user')?.email
    });

    return c.json({
      success: true,
      summary,
      originalLength: content.length,
      summaryLength: summary.length,
      message: 'Resumen generado exitosamente'
    });

  } catch (error) {
    logger.error('NEWS_SUMMARY_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al generar resumen del contenido'
    }, 500);
  }
});

// POST /api/news/extract-keywords - Extract keywords from news content (ML-powered)
newsRoutes.post('/extract-keywords', async (c) => {
  try {
    const { content, maxKeywords = 10 } = await c.req.json();

    if (!content) {
      return c.json({
        success: false,
        message: 'Contenido es requerido para extraer palabras clave'
      }, 400);
    }

    // ML-powered keyword extraction (with fallback)
    let keywords;
    try {
      keywords = await mlHelpers.extractResourceKeywords(content, maxKeywords);
    } catch (error) {
      console.warn('ML keyword extraction failed, using fallback:', error);
      // Fallback: simple frequency-based extraction
      keywords = extractKeywordsFallback(content, maxKeywords);
    }

    logger.info('NEWS_KEYWORDS_EXTRACTED', {
      contentLength: content.length,
      keywordsCount: keywords.length,
      userEmail: c.get('user')?.email
    });

    return c.json({
      success: true,
      keywords,
      count: keywords.length,
      message: 'Palabras clave extraídas exitosamente'
    });

  } catch (error) {
    logger.error('NEWS_KEYWORDS_ERROR', error as Error, 'NEWS');
    return c.json({
      success: false,
      message: 'Error al extraer palabras clave del contenido'
    }, 500);
  }
});

// Fallback function for sentiment analysis when ML is not available
function analyzeSentimentFallback(text: string) {
  const positiveWords = ['excelente', 'positivo', 'bueno', 'mejor', 'avance', 'éxito', 'logro', 'beneficio', 'oportunidad', 'desarrollo', 'innovación', 'crecimiento'];
  const negativeWords = ['problema', 'negativo', 'malo', 'peor', 'fracaso', 'pérdida', 'daño', 'crisis', 'conflicto', 'dificultad', 'obstáculo', 'retraso'];

  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  let positiveScore = 0;
  let negativeScore = 0;

  words.forEach(word => {
    if (positiveWords.some(pw => word.includes(pw))) positiveScore++;
    if (negativeWords.some(nw => word.includes(nw))) negativeScore++;
  });

  const total = positiveScore + negativeScore;
  if (total === 0) {
    return { sentiment: 'neutral' as const, confidence: 0.5, score: 0 };
  }

  const score = (positiveScore - negativeScore) / total;
  const confidence = Math.min(total / 10, 1); // Confidence based on evidence

  let sentiment: 'positive' | 'negative' | 'neutral';
  if (score > 0.1) sentiment = 'positive';
  else if (score < -0.1) sentiment = 'negative';
  else sentiment = 'neutral';

  return { sentiment, confidence, score };
}

// Fallback function for summary generation
function generateSummaryFallback(text: string, maxLength: number): string {
  // Simple extractive summary: take first and last sentences
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);

  if (sentences.length <= 2) {
    return text.substring(0, maxLength) + '...';
  }

  const firstSentence = sentences[0].trim();
  const lastSentence = sentences[sentences.length - 1].trim();

  const summary = `${firstSentence}. ${lastSentence}`;
  return summary.length <= maxLength ? summary : summary.substring(0, maxLength - 3) + '...';
}

// Fallback function for keyword extraction
function extractKeywordsFallback(text: string, maxKeywords: number): string[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['que', 'los', 'las', 'del', 'con', 'para', 'una', 'como', 'pero', 'sobre', 'desde', 'hasta', 'también', 'cuando', 'donde', 'quien', 'cual', 'cuyo'].includes(word));

  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

export default newsRoutes;