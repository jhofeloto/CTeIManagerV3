// Servicio de ML Base para Choco Inventa
// Integración con Cloudflare Workers AI y modelos locales

export interface MLModelConfig {
  name: string;
  version: string;
  endpoint: string;
  apiKey?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface MLRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  context?: string;
}

export interface MLResponse {
  success: boolean;
  result?: string;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  processingTime: number;
}

export interface TextClassificationResult {
  label: string;
  confidence: number;
  categories: Array<{
    label: string;
    confidence: number;
  }>;
}

export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  score: number; // -1 a 1
}

export class MLService {
  private config: MLModelConfig;
  private cache: Map<string, MLResponse> = new Map();
  private readonly CACHE_TTL = 3600; // 1 hora

  constructor(config: MLModelConfig) {
    this.config = config;
  }

  // Análisis de sentimientos en texto
  async analyzeSentiment(text: string): Promise<SentimentAnalysisResult> {
    const cacheKey = `sentiment:${text.substring(0, 100)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.processingTime < this.CACHE_TTL * 1000) {
      return JSON.parse(cached.result || '{}');
    }

    try {
      const response = await this.callWorkersAI({
        prompt: `Analiza el sentimiento del siguiente texto y responde con formato JSON:
        Texto: "${text}"

        Responde ÚNICAMENTE con JSON en este formato:
        {"sentiment": "positive|negative|neutral", "confidence": 0.95, "score": 0.8}`,
        model: 'llama-2-7b-chat',
        maxTokens: 150,
        temperature: 0.1
      });

      if (response.success && response.result) {
        const result = JSON.parse(response.result);
        this.cache.set(cacheKey, response);
        return result;
      }

      throw new Error(response.error || 'Error en análisis de sentimiento');
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return {
        sentiment: 'neutral',
        confidence: 0,
        score: 0
      };
    }
  }

  // Clasificación de texto
  async classifyText(text: string, categories: string[]): Promise<TextClassificationResult> {
    const cacheKey = `classify:${text.substring(0, 100)}:${categories.join(',')}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.processingTime < this.CACHE_TTL * 1000) {
      return JSON.parse(cached.result || '{}');
    }

    try {
      const categoriesStr = categories.join('", "');
      const response = await this.callWorkersAI({
        prompt: `Clasifica el siguiente texto en una de las categorías: "${categoriesStr}"

        Texto: "${text}"

        Responde ÚNICAMENTE con JSON en este formato:
        {"label": "categoria", "confidence": 0.95, "categories": [{"label": "cat1", "confidence": 0.8}, {"label": "cat2", "confidence": 0.15}]}`,
        model: 'llama-2-7b-chat',
        maxTokens: 200,
        temperature: 0.1
      });

      if (response.success && response.result) {
        const result = JSON.parse(response.result);
        this.cache.set(cacheKey, response);
        return result;
      }

      throw new Error(response.error || 'Error en clasificación de texto');
    } catch (error) {
      console.error('Text classification error:', error);
      return {
        label: categories[0] || 'unknown',
        confidence: 0,
        categories: categories.map(cat => ({ label: cat, confidence: 0 }))
      };
    }
  }

  // Generación de resúmenes
  async generateSummary(text: string, maxLength: number = 150): Promise<string> {
    const cacheKey = `summary:${text.substring(0, 200)}:${maxLength}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.processingTime < this.CACHE_TTL * 1000) {
      return cached.result || '';
    }

    try {
      const response = await this.callWorkersAI({
        prompt: `Resume el siguiente texto en máximo ${maxLength} caracteres. Mantén los puntos clave:

        Texto: "${text}"

        Resumen:`,
        model: 'llama-2-7b-chat',
        maxTokens: Math.ceil(maxLength / 4), // Aproximado
        temperature: 0.3
      });

      if (response.success && response.result) {
        const summary = response.result.trim();
        this.cache.set(cacheKey, response);
        return summary;
      }

      throw new Error(response.error || 'Error generando resumen');
    } catch (error) {
      console.error('Summary generation error:', error);
      return text.substring(0, maxLength) + '...';
    }
  }

  // Extracción de palabras clave
  async extractKeywords(text: string, maxKeywords: number = 10): Promise<string[]> {
    const cacheKey = `keywords:${text.substring(0, 200)}:${maxKeywords}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.processingTime < this.CACHE_TTL * 1000) {
      return JSON.parse(cached.result || '[]');
    }

    try {
      const response = await this.callWorkersAI({
        prompt: `Extrae las ${maxKeywords} palabras clave más importantes del siguiente texto.
        Responde ÚNICAMENTE con un array JSON de palabras clave:

        Texto: "${text}"

        Palabras clave:`,
        model: 'llama-2-7b-chat',
        maxTokens: 100,
        temperature: 0.1
      });

      if (response.success && response.result) {
        const keywords = JSON.parse(response.result);
        this.cache.set(cacheKey, response);
        return Array.isArray(keywords) ? keywords : [];
      }

      throw new Error(response.error || 'Error extrayendo palabras clave');
    } catch (error) {
      console.error('Keyword extraction error:', error);
      // Fallback: extracción simple por frecuencia
      return this.extractKeywordsSimple(text, maxKeywords);
    }
  }

  // Categorización automática de proyectos
  async categorizeProject(title: string, summary: string): Promise<string[]> {
    const categories = [
      'Biodiversidad y Ecosistemas',
      'Tecnología Ambiental',
      'Desarrollo Rural y Agrícola',
      'Medicina y Salud',
      'Cambio Climático',
      'Acuicultura y Pesca',
      'Patrimonio Cultural',
      'Innovación Social',
      'Educación Científica',
      'Transferencia Tecnológica'
    ];

    const cacheKey = `project_category:${title}:${summary.substring(0, 100)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.processingTime < this.CACHE_TTL * 1000) {
      return JSON.parse(cached.result || '[]');
    }

    try {
      const result = await this.classifyText(
        `Título: ${title}\nResumen: ${summary}`,
        categories
      );

      const topCategories = result.categories
        .filter(cat => cat.confidence > 0.3)
        .map(cat => cat.label)
        .slice(0, 3);

      this.cache.set(cacheKey, {
        success: true,
        result: JSON.stringify(topCategories),
        processingTime: Date.now()
      });

      return topCategories;
    } catch (error) {
      console.error('Project categorization error:', error);
      return ['Investigación General'];
    }
  }

  // Llamada a Cloudflare Workers AI
  private async callWorkersAI(request: MLRequest): Promise<MLResponse> {
    const startTime = Date.now();

    try {
      // Usar la API de Cloudflare Workers AI
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${this.config.apiKey}/ai/run/@cf/meta/${request.model || 'llama-2-7b-chat-int8'}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: request.prompt
            }
          ],
          max_tokens: request.maxTokens || 100,
          temperature: request.temperature || 0.1,
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`Workers AI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      return {
        success: true,
        result: data.result?.response || data.response || 'Sin respuesta',
        usage: {
          promptTokens: data.usage?.prompt_tokens || 0,
          completionTokens: data.usage?.completion_tokens || 0,
          totalTokens: data.usage?.total_tokens || 0
        },
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      console.error('Workers AI call error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        processingTime: Date.now() - startTime
      };
    }
  }

  // Método de respaldo para extracción de palabras clave
  private extractKeywordsSimple(text: string, maxKeywords: number): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !this.isStopWord(word));

    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxKeywords)
      .map(([word]) => word);
  }

  // Verificar si es una palabra vacía (stop word)
  private isStopWord(word: string): boolean {
    const stopWords = ['que', 'los', 'las', 'del', 'con', 'para', 'una', 'como', 'pero', 'sobre', 'desde', 'hasta', 'también', 'cuando', 'donde', 'quien', 'cual', 'cuyo'];
    return stopWords.includes(word);
  }

  // Limpiar cache
  clearCache(): void {
    this.cache.clear();
  }

  // Obtener estadísticas del cache
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0 // Implementar lógica de hit rate si es necesario
    };
  }
}

// Instancia global del servicio ML
export const mlService = new MLService({
  name: 'ChocoInventa-ML',
  version: '1.0.0',
  endpoint: 'https://api.cloudflare.com/client/v4/accounts',
  apiKey: 'placeholder', // Se configurará desde environment variables
  maxTokens: 500,
  temperature: 0.1
});

// Funciones helper para casos de uso específicos
export const mlHelpers = {
  // Categorizar proyectos automáticamente
  categorizeProject: (title: string, summary: string) =>
    mlService.categorizeProject(title, summary),

  // Analizar sentimiento de noticias
  analyzeNewsSentiment: (content: string) =>
    mlService.analyzeSentiment(content),

  // Generar resumen de proyectos
  summarizeProject: (title: string, description: string) =>
    mlService.generateSummary(`${title}. ${description}`, 200),

  // Extraer palabras clave de recursos
  extractResourceKeywords: (title: string, description: string) =>
    mlService.extractKeywords(`${title}. ${description}`, 8)
};