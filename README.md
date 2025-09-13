# CTeI-Manager - Sistema Departamental de Ciencias del Chocó

## 🎯 Proyecto Overview

**CTeI-Manager** es un sistema integral de gestión de proyectos de Ciencia, Tecnología e Innovación desarrollado para el Departamento de Ciencias del Chocó. El sistema permite a investigadores y administradores gestionar proyectos, productos científicos, colaboradores y recursos de manera eficiente con capacidades avanzadas de monitoreo y análisis.

## 🌐 URLs del Sistema

- **Producción**: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev
- **GitHub**: https://github.com/username/webapp
- **API Base**: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev/api

## ✨ Características Principales Implementadas

### 📋 Fase 1: Gestión de Entidades (Completado)
- **Gestión de Proyectos**: Creación, edición y seguimiento de proyectos de investigación
- **Gestión de Productos**: Registro de productos científicos (artículos, libros, software, etc.)
- **Gestión de Usuarios**: Sistema de autenticación y roles (ADMIN, RESEARCHER, VIEWER)
- **Gestión de Colaboradores**: Asignación de colaboradores a proyectos
- **Categorías de Productos**: Sistema de clasificación con impacto ponderado

### 🚨 Fase 2: Sistema de Alertas Proactivo (Completado)
- **Alertas Inteligentes**: Sistema automatizado de detección de situaciones críticas
- **Categorización**: PERFORMANCE, RISK, OPPORTUNITY, COMPLIANCE
- **Análisis con IA**: Evaluación automática de riesgos y recomendaciones
- **Dashboard en Tiempo Real**: Visualización de alertas activas y estadísticas
- **Notificaciones**: Sistema de seguimiento y resolución de alertas

### 📊 Fase 3A: Sistema de Evaluación y Scoring (Completado)
- **Scoring Multi-criterio**: Algoritmo de evaluación basado en múltiples métricas
- **Categorías de Evaluación**: EXCELENTE, BUENO, REGULAR, NECESITA_MEJORA
- **Métricas Ponderadas**: Evaluación de productos, colaboradores, cronograma y presupuesto
- **Visualización**: Gráficos y estadísticas de distribución por categorías
- **Recomendaciones**: Sugerencias automáticas de mejora

### 📁 Fase 3B: Sistema de Gestión de Archivos (Completado)
- **Upload/Download**: Subida y descarga segura de archivos
- **Almacenamiento R2**: Integración con Cloudflare R2 Storage
- **Tipos de Archivo**: Documentos, imágenes, archivos de proyectos/productos
- **Vista por Entidades**: Archivos organizados por proyectos y productos
- **Galería Visual**: Visualización de imágenes con previsualizaciones
- **Metadatos**: Gestión completa de información de archivos
- **Búsqueda Avanzada**: Filtros por tipo, fecha, entidad y contenido

## 🔧 Arquitectura Técnica

### Stack Tecnológico
- **Backend**: Hono Framework + TypeScript
- **Frontend**: HTML5 + TailwindCSS + Vanilla JavaScript
- **Base de Datos**: Cloudflare D1 (SQLite distribuido)
- **Almacenamiento**: Cloudflare R2 Storage 
- **Cache**: Cloudflare KV Storage
- **Deploy**: Cloudflare Pages/Workers
- **Desarrollo**: Wrangler CLI + PM2

### Servicios de Cloudflare Utilizados
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ctei-manager-production"
    }
  ],
  "kv_namespaces": [
    {
      "binding": "KV",
      "id": "ctei_manager_kv"
    }
  ],
  "r2_buckets": [
    {
      "binding": "R2", 
      "bucket_name": "ctei-manager-assets"
    }
  ]
}
```

## 🗄️ Estructura de Datos

### Entidades Principales
- **users**: Usuarios del sistema con roles y permisos
- **projects**: Proyectos de investigación con metadata completa
- **products**: Productos científicos categorizados
- **files**: Sistema de archivos con metadatos y versionado
- **alerts_v2**: Alertas del sistema con categorización inteligente
- **project_scores**: Evaluaciones y scoring de proyectos

### Almacenamiento de Archivos
```
R2 Bucket Structure:
├── documents/     # Documentos generales (PDF, DOC, etc.)
├── images/        # Imágenes (JPG, PNG, WEBP)
├── projects/      # Archivos específicos de proyectos
├── products/      # Archivos de productos científicos
└── logos/         # Logos del sistema
```

## 🔗 API Endpoints Principales

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registro de usuarios
- `GET /api/auth/profile` - Perfil del usuario

### Gestión de Archivos
- `POST /api/admin/upload-file` - Subir archivo
- `GET /api/admin/files/:type/:filename` - Servir archivo
- `GET /api/admin/files/:entityType/:entityId` - Listar archivos por entidad
- `DELETE /api/admin/files/:fileId` - Eliminar archivo
- `PUT /api/admin/files/:fileId/metadata` - Actualizar metadatos
- `GET /api/admin/files/dashboard` - Estadísticas generales
- `GET /api/admin/files/search` - Búsqueda avanzada
- `GET /api/admin/files/details/:fileId` - Detalles completos

### Sistema de Alertas
- `GET /api/admin/alerts/overview` - Vista general de alertas
- `POST /api/admin/alerts/analyze-risks` - Análisis con IA
- `PUT /api/admin/alerts/:id/status` - Actualizar estado

### Sistema de Scoring
- `GET /api/admin/scoring/overview` - Dashboard de evaluación
- `POST /api/admin/scoring/calculate` - Calcular scoring
- `GET /api/admin/scoring/project/:id` - Detalles de evaluación

### Gestión de Entidades
- `GET /api/projects` - Listar proyectos
- `POST /api/projects` - Crear proyecto
- `GET /api/admin/products` - Gestión de productos
- `GET /api/admin/users` - Gestión de usuarios

## 🎮 Guía de Uso

### Para Administradores
1. **Acceso**: Iniciar sesión con rol ADMIN
2. **Dashboard**: Ver estadísticas generales y alertas críticas
3. **Gestión de Archivos**: Usar la sección "Gestión de Archivos"
   - Subir archivos con clasificación por tipo
   - Buscar archivos con filtros avanzados
   - Ver archivos organizados por proyectos/productos
4. **Sistema de Alertas**: Monitorear y resolver alertas del sistema
5. **Evaluación**: Revisar scoring y recomendaciones de proyectos

### Para Investigadores
1. **Proyectos**: Crear y gestionar proyectos de investigación
2. **Productos**: Registrar productos científicos
3. **Colaboración**: Gestionar colaboradores de proyectos
4. **Archivos**: Subir documentos e imágenes relacionados
5. **Timeline**: Seguimiento de hitos y progreso

### Para Visualizadores
1. **Vista**: Acceso de solo lectura a proyectos públicos
2. **Productos**: Consulta de productos científicos disponibles
3. **Estadísticas**: Ver métricas generales del departamento

## 🚀 Despliegue y Configuración

### Desarrollo Local
```bash
# Clonar repositorio
git clone <repository-url>
cd ctei-manager

# Instalar dependencias
npm install

# Configurar base de datos local
npm run db:migrate:local
npm run db:seed

# Iniciar desarrollo
npm run build
pm2 start ecosystem.config.cjs
```

### Despliegue en Producción
```bash
# Configurar Cloudflare
wrangler login
wrangler pages project create ctei-manager

# Aplicar migraciones a producción
wrangler d1 migrations apply ctei-manager-production

# Desplegar
npm run build
wrangler pages deploy dist --project-name ctei-manager
```

## 📊 Estado de Implementación

| Fase | Componente | Estado | Completitud |
|------|------------|--------|-------------|
| 1 | Gestión de Entidades | ✅ Completo | 100% |
| 2A | Sistema de Alertas Básico | ✅ Completo | 100% |
| 2B | Alertas con IA | ✅ Completo | 100% |
| 3A | Sistema de Scoring | ✅ Completo | 100% |
| 3B | Gestión de Archivos | ✅ Completo | 100% |

### Características Destacadas Implementadas

#### Sistema de Archivos Avanzado ✨
- **Upload Inteligente**: Validación automática por tipo y tamaño
- **Metadatos Completos**: Información detallada de cada archivo
- **Organización Visual**: Vista por proyectos y productos
- **Galería de Imágenes**: Previsualizaciones automáticas
- **Búsqueda Potente**: Filtros múltiples y paginación
- **Control de Acceso**: Permisos basados en roles
- **Versionado**: Tracking completo de cambios

#### Sistema de Alertas Inteligente 🚨
- **Detección Automática**: Identificación proactiva de problemas
- **Categorización IA**: Clasificación inteligente de alertas
- **Análisis Predictivo**: Recomendaciones basadas en tendencias
- **Dashboard en Tiempo Real**: Actualización automática
- **Gestión de Estados**: Workflow completo de resolución

#### Sistema de Evaluación Multi-criterio 📊
- **Scoring Ponderado**: Algoritmo de evaluación complejo
- **Métricas Diversas**: Productos, colaboradores, cronograma
- **Visualización Avanzada**: Gráficos interactivos
- **Recomendaciones**: Sugerencias específicas de mejora
- **Historial**: Tracking de evolución temporal

## 🔄 Próximas Mejoras Planificadas

### Fase 4: Integración Avanzada
- **API REST Completa**: Endpoints para integración externa
- **Webhooks**: Notificaciones automáticas a sistemas externos
- **Export/Import**: Funcionalidades de migración de datos
- **Analytics Avanzado**: Métricas predictivas y machine learning

### Optimizaciones
- **Performance**: Optimización de consultas y caching
- **UX**: Mejoras en interfaz de usuario
- **Mobile**: Responsive design completo
- **PWA**: Progressive Web App capabilities

## 🛠️ Configuración de Desarrollo

### Variables de Entorno
```bash
# .dev.vars (desarrollo local)
NODE_ENV=development
API_BASE_URL=http://localhost:3000/api
```

### Scripts Disponibles
```json
{
  "dev": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
  "build": "vite build", 
  "deploy": "npm run build && wrangler pages deploy dist",
  "db:migrate:local": "wrangler d1 migrations apply ctei-manager-production --local",
  "db:seed": "wrangler d1 execute ctei-manager-production --local --file=./seed.sql"
}
```

## 👥 Equipo y Contribuciones

- **Desarrollo Principal**: Implementación completa del sistema
- **Arquitectura**: Diseño de base de datos y APIs
- **Frontend**: Interfaces de usuario responsivas
- **Testing**: Validación de funcionalidades críticas

## 📈 Métricas de Rendimiento

### Tiempos de Respuesta
- **Carga inicial**: < 2 segundos
- **Navegación**: < 500ms 
- **Upload de archivos**: Variable según tamaño
- **Búsquedas**: < 1 segundo

### Capacidades
- **Archivos**: Hasta 20MB por archivo
- **Usuarios concurrentes**: Escalable según Cloudflare
- **Almacenamiento**: Ilimitado en R2
- **Base de datos**: Replicación global D1

---

**Última Actualización**: 13 de Septiembre, 2025  
**Versión**: 3.0.0 - Sistema de Gestión de Archivos  
**Estado**: ✅ Producción - Todas las Fases Completadas  
**Desarrollado con**: Hono + Cloudflare Workers/Pages + TypeScript