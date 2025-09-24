// CODECTI Platform - Settings Routes

import { Hono } from 'hono';
import type { Bindings } from '../types';
import { adminMiddleware } from '../utils/middleware';

const settings = new Hono<{ Bindings: Bindings }>();

// Mock storage for settings (in production, this would be in D1 database)
const settingsStorage: Record<string, any> = {
  logo: {
    enabled: true,
    url: '/static/logo-choco-inventa.png',
    alt: 'Choco Inventa',
    fallbackText: 'CODECTI Chocó'
  },
  branding: {
    platformName: 'Choco Inventa - CODECTI Chocó',
    shortName: 'Choco Inventa',
    description: 'Plataforma de innovación y conocimiento para proyectos de Ciencia, Tecnología e Innovación del Chocó'
  }
};

// Get all settings (public endpoint)
settings.get('/', async (c) => {
  try {
    return c.json({
      success: true,
      data: settingsStorage
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Error al obtener configuración'
    }, 500);
  }
});

// Get logo configuration specifically (public endpoint)
settings.get('/logo', async (c) => {
  try {
    return c.json({
      success: true,
      data: settingsStorage.logo
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Error al obtener configuración del logo'
    }, 500);
  }
});

// Update logo configuration (admin only)
settings.put('/logo', adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    const { enabled, url, alt, fallbackText } = body;
    
    if (typeof enabled !== 'boolean') {
      return c.json({
        success: false,
        message: 'El campo "enabled" es requerido y debe ser boolean'
      }, 400);
    }

    if (enabled && !url) {
      return c.json({
        success: false,
        message: 'URL del logo es requerida cuando está habilitado'
      }, 400);
    }

    // Update logo settings
    settingsStorage.logo = {
      enabled,
      url: url || '',
      alt: alt || 'Logo',
      fallbackText: fallbackText || 'CODECTI Chocó'
    };

    return c.json({
      success: true,
      message: 'Configuración del logo actualizada',
      data: settingsStorage.logo
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Error al actualizar configuración del logo'
    }, 500);
  }
});

// Update branding configuration (admin only)
settings.put('/branding', adminMiddleware, async (c) => {
  try {
    const body = await c.req.json();
    
    // Update branding settings
    if (body.platformName) settingsStorage.branding.platformName = body.platformName;
    if (body.shortName) settingsStorage.branding.shortName = body.shortName;
    if (body.description) settingsStorage.branding.description = body.description;

    return c.json({
      success: true,
      message: 'Configuración de branding actualizada',
      data: settingsStorage.branding
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Error al actualizar configuración de branding'
    }, 500);
  }
});

// Upload logo endpoint (admin only)
settings.post('/logo/upload', adminMiddleware, async (c) => {
  try {
    // In a real implementation, this would handle file upload to R2 or similar
    // For now, we'll return a mock response
    const body = await c.req.json();
    
    if (!body.filename) {
      return c.json({
        success: false,
        message: 'Nombre de archivo requerido'
      }, 400);
    }

    // Mock file upload - in production this would save to R2 storage
    const mockUrl = `/static/uploads/${body.filename}`;
    
    return c.json({
      success: true,
      message: 'Logo subido exitosamente',
      data: {
        url: mockUrl,
        filename: body.filename
      }
    });
  } catch (error) {
    return c.json({
      success: false,
      message: 'Error al subir logo'
    }, 500);
  }
});

export default settings;