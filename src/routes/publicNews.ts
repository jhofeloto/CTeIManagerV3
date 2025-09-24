// CODECTI Platform - Public News Routes (No Authentication Required)
// HU-09: Sistema de Noticias/Blog - Public Access

import { Hono } from 'hono';
import type { Bindings, NewsPublicResponse, PublicNewsArticleResponse } from '../types';
import { logger } from '../monitoring/logger';

const publicNewsRoutes = new Hono<{ Bindings: Bindings }>();

// IMPORTANT: Put specific routes BEFORE parameterized routes

// GET /api/public/news/featured - Obtener artículos destacados  
publicNewsRoutes.get('/featured', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '3');

    logger.info('PUBLIC_NEWS_FEATURED_ACCESS', {
      limit,
      userAgent: c.req.header('User-Agent')
    });

    let articles: any[] = [];

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare(`
        SELECT 
          n.id,
          n.title,
          n.slug,
          n.summary,
          n.featured_image,
          n.views_count,
          n.published_at,
          u.name as author_name,
          c.name as category_name,
          c.slug as category_slug
        FROM news_articles n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN news_categories c ON n.category_id = c.id
        WHERE n.status = 'published' AND n.is_featured = 1
        ORDER BY n.published_at DESC
        LIMIT ?
      `).bind(limit).all();
      
      articles = result.results || [];
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      articles = await mockDb.getFeaturedNewsArticles(limit);
    }

    return c.json({
      success: true,
      articles
    });

  } catch (error) {
    logger.error('PUBLIC_NEWS_FEATURED_ERROR', error as Error, 'PUBLIC_NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar artículos destacados',
      articles: []
    }, 500);
  }
});

// GET /api/public/news/recent - Obtener artículos recientes
publicNewsRoutes.get('/recent', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '5');

    logger.info('PUBLIC_NEWS_RECENT_ACCESS', {
      limit,
      userAgent: c.req.header('User-Agent')
    });

    let articles: any[] = [];

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare(`
        SELECT 
          n.id,
          n.title,
          n.slug,
          n.summary,
          n.views_count,
          n.published_at,
          u.name as author_name,
          c.name as category_name
        FROM news_articles n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN news_categories c ON n.category_id = c.id
        WHERE n.status = 'published'
        ORDER BY n.published_at DESC
        LIMIT ?
      `).bind(limit).all();
      
      articles = result.results || [];
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      articles = await mockDb.getRecentNewsArticles(limit);
    }

    return c.json({
      success: true,
      articles
    });

  } catch (error) {
    logger.error('PUBLIC_NEWS_RECENT_ERROR', error as Error, 'PUBLIC_NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar artículos recientes',
      articles: []
    }, 500);
  }
});

// GET /api/public/news/stats - Estadísticas públicas de noticias
publicNewsRoutes.get('/stats', async (c) => {
  try {
    logger.info('PUBLIC_NEWS_STATS_ACCESS', {
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || 'unknown'
    });

    let stats: any = {};

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const queries = await Promise.all([
        // Total published articles
        c.env.DB.prepare("SELECT COUNT(*) as count FROM news_articles WHERE status = 'published'").first(),
        // Featured articles
        c.env.DB.prepare("SELECT COUNT(*) as count FROM news_articles WHERE status = 'published' AND is_featured = 1").first(),
        // Total views
        c.env.DB.prepare("SELECT SUM(views_count) as total FROM news_articles WHERE status = 'published'").first(),
        // Top categories
        c.env.DB.prepare(`
          SELECT c.name, COUNT(*) as count 
          FROM news_articles n
          JOIN news_categories c ON n.category_id = c.id
          WHERE n.status = 'published'
          GROUP BY c.name 
          ORDER BY count DESC 
          LIMIT 5
        `).all(),
        // Recent articles
        c.env.DB.prepare(`
          SELECT n.title, n.slug, n.published_at, c.name as category_name
          FROM news_articles n
          LEFT JOIN news_categories c ON n.category_id = c.id
          WHERE n.status = 'published'
          ORDER BY n.published_at DESC
          LIMIT 3
        `).all()
      ]);

      stats = {
        totalArticles: queries[0]?.count || 0,
        featuredArticles: queries[1]?.count || 0,
        totalViews: queries[2]?.total || 0,
        totalCategories: await c.env.DB.prepare("SELECT COUNT(*) as count FROM news_categories").first().then(r => r?.count || 0),
        topCategories: queries[3]?.results || [],
        recentArticles: queries[4]?.results || []
      };
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      stats = await mockDb.getNewsStats();
    }

    return c.json({
      success: true,
      stats
    });

  } catch (error) {
    logger.error('PUBLIC_NEWS_STATS_ERROR', error as Error, 'PUBLIC_NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar estadísticas de noticias',
      stats: {}
    }, 500);
  }
});

// GET /api/public/news/categories - Lista pública de categorías
publicNewsRoutes.get('/categories', async (c) => {
  try {
    let categories: any[] = [];

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare(`
        SELECT c.*, COUNT(n.id) as articles_count
        FROM news_categories c
        LEFT JOIN news_articles n ON c.id = n.category_id AND n.status = 'published'
        GROUP BY c.id
        ORDER BY c.name ASC
      `).all();
      
      categories = result.results || [];
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      categories = await mockDb.getNewsCategories();
      
      // Add articles count for each category
      categories = categories.map(category => ({
        ...category,
        articles_count: mockDb.newsArticles.filter(
          article => article.category_id === category.id && article.status === 'published'
        ).length
      }));
    }

    return c.json({
      success: true,
      categories
    });

  } catch (error) {
    logger.error('PUBLIC_NEWS_CATEGORIES_ERROR', error as Error, 'PUBLIC_NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar categorías públicas',
      categories: []
    }, 500);
  }
});

// GET /api/public/news - Lista pública de noticias (sin autenticación)
publicNewsRoutes.get('/', async (c) => {
  try {
    const search = c.req.query('search') || '';
    const category = c.req.query('category') || '';
    const tag = c.req.query('tag') || '';
    const sort = c.req.query('sort') || 'published_at';
    const order = c.req.query('order') || 'desc';
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '12');
    const offset = (page - 1) * limit;

    // Log public access
    logger.info('PUBLIC_NEWS_ACCESS', {
      endpoint: '/api/public/news',
      params: { search, category, tag, sort, order, page, limit },
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || 'unknown'
    });

    let result: any;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const whereConditions: string[] = ['n.status = ?'];
      const params: any[] = ['published'];

      if (search) {
        whereConditions.push(`(n.title LIKE ? OR n.summary LIKE ? OR c.name LIKE ?)`);
        params.push(`%${search}%`, `%${search}%`, `%${search}%`);
      }

      if (category) {
        whereConditions.push('(c.slug = ? OR c.name LIKE ?)');
        params.push(category, `%${category}%`);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;
      
      let query = `
        SELECT 
          n.id,
          n.title,
          n.slug,
          n.summary,
          n.featured_image,
          n.views_count,
          n.published_at,
          u.name as author_name,
          c.name as category_name,
          c.slug as category_slug
        FROM news_articles n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN news_categories c ON n.category_id = c.id
        ${whereClause}
      `;

      // Tag filtering requires additional JOIN
      if (tag) {
        query += ` AND n.id IN (
          SELECT nat.article_id 
          FROM news_article_tags nat
          JOIN news_tags t ON nat.tag_id = t.id
          WHERE t.slug = ? OR t.name LIKE ?
        )`;
        params.push(tag, `%${tag}%`);
      }

      query += ` ORDER BY n.${sort} ${order.toUpperCase()} LIMIT ? OFFSET ?`;

      const countQuery = `
        SELECT COUNT(*) as total 
        FROM news_articles n
        LEFT JOIN news_categories c ON n.category_id = c.id
        ${whereClause}
        ${tag ? `AND n.id IN (
          SELECT nat.article_id 
          FROM news_article_tags nat
          JOIN news_tags t ON nat.tag_id = t.id
          WHERE t.slug = ? OR t.name LIKE ?
        )` : ''}
      `;

      const countParams = tag ? [...params.slice(0, -2), tag, `%${tag}%`] : params.slice(0, -2);
      params.push(limit, offset);

      const [articlesResult, countResult] = await Promise.all([
        c.env.DB.prepare(query).bind(...params).all(),
        c.env.DB.prepare(countQuery).bind(...countParams).first()
      ]);
      
      // Get tags for each article
      const articlesWithTags = await Promise.all(
        (articlesResult.results || []).map(async (article: any) => {
          const tagsResult = await c.env.DB.prepare(`
            SELECT t.name
            FROM news_tags t
            JOIN news_article_tags nat ON t.id = nat.tag_id
            WHERE nat.article_id = ?
          `).bind(article.id).all();

          return {
            ...article,
            tags: (tagsResult.results || []).map((t: any) => t.name)
          };
        })
      );

      result = {
        articles: articlesWithTags,
        total: (countResult as any)?.total || 0
      };
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      result = await mockDb.getPublicNewsArticles(search, category, tag, sort, order, limit, offset);
    }

    const totalPages = Math.ceil(result.total / limit);

    logger.info('PUBLIC_NEWS_SERVED', {
      count: result.articles.length,
      total: result.total,
      page,
      filters: { search, category, tag }
    });

    const response: NewsPublicResponse = {
      success: true,
      articles: result.articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        featured_image: article.featured_image,
        author_name: article.author_name,
        category_name: article.category_name,
        category_slug: article.category_slug,
        views_count: article.views_count,
        published_at: article.published_at,
        tags: article.tags || []
      })),
      total: result.total,
      page,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      limit
    };

    return c.json(response);
  } catch (error) {
    logger.error('PUBLIC_NEWS_ERROR', error as Error, 'PUBLIC_NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar noticias públicas',
      articles: [],
      total: 0,
      page: 1,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      limit: 12
    } as NewsPublicResponse, 500);
  }
});

// GET /api/public/news/:slug - Obtener artículo específico por slug (público)
// IMPORTANT: This MUST be at the end to avoid conflicts with specific routes above
publicNewsRoutes.get('/:slug', async (c) => {
  try {
    const slug = c.req.param('slug');

    // Log public access
    logger.info('PUBLIC_NEWS_ARTICLE_ACCESS', {
      slug,
      userAgent: c.req.header('User-Agent'),
      ip: c.req.header('CF-Connecting-IP') || 'unknown'
    });

    let article: any = null;

    if (c.env?.DB && process.env.NODE_ENV === 'production') {
      // Production: Use Cloudflare D1
      const result = await c.env.DB.prepare(`
        SELECT 
          n.*,
          u.name as author_name,
          c.name as category_name,
          c.slug as category_slug
        FROM news_articles n
        LEFT JOIN users u ON n.author_id = u.id
        LEFT JOIN news_categories c ON n.category_id = c.id
        WHERE n.slug = ? AND n.status = 'published'
      `).bind(slug).first();
      
      if (result) {
        // Get tags for this article
        const tagsResult = await c.env.DB.prepare(`
          SELECT t.name
          FROM news_tags t
          JOIN news_article_tags nat ON t.id = nat.tag_id
          WHERE nat.article_id = ?
        `).bind(result.id).all();

        // Increment views count
        await c.env.DB.prepare(`
          UPDATE news_articles 
          SET views_count = views_count + 1 
          WHERE id = ?
        `).bind(result.id).run();

        article = {
          ...result,
          tags: (tagsResult.results || []).map((t: any) => t.name)
        };
      }
    } else {
      // Development: Use mock database
      const { mockDb } = await import('../utils/mockDb');
      article = await mockDb.getPublicNewsArticleBySlug(slug);
    }

    if (!article) {
      return c.json({
        success: false,
        message: 'Artículo no encontrado'
      } as PublicNewsArticleResponse, 404);
    }

    logger.info('PUBLIC_NEWS_ARTICLE_SERVED', {
      articleId: article.id,
      slug: article.slug,
      title: article.title
    });

    const response: PublicNewsArticleResponse = {
      success: true,
      article: {
        id: article.id,
        title: article.title,
        slug: article.slug,
        summary: article.summary,
        content: article.content,
        featured_image: article.featured_image,
        author_name: article.author_name,
        category_name: article.category_name,
        category_slug: article.category_slug,
        tags: article.tags || [],
        views_count: article.views_count,
        published_at: article.published_at,
        created_at: article.created_at,
        updated_at: article.updated_at
      }
    };

    return c.json(response);

  } catch (error) {
    logger.error('PUBLIC_NEWS_ARTICLE_ERROR', error as Error, 'PUBLIC_NEWS');
    return c.json({
      success: false,
      message: 'Error al cargar artículo'
    } as PublicNewsArticleResponse, 500);
  }
});

export default publicNewsRoutes;