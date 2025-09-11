# CTeI-Manager 🧪

## Resumen del Proyecto

**CTeI-Manager** es una aplicación web full-stack para la gestión, visualización y análisis de proyectos y productos de Ciencia, Tecnología e Innovación (CTeI). La plataforma serve a diferentes roles (Administradores, Investigadores, Comunidad y Visitantes) con vistas públicas y privadas.

### 🎯 Objetivos Principales
- Gestión integral de proyectos de investigación
- Catalogación y clasificación de productos de CTeI
- Portal público para transparencia y acceso ciudadano
- Sistema de roles y permisos para diferentes tipos de usuarios
- Dashboard analítico para visualización de métricas

## 🌐 URLs del Proyecto

- **Portal Público**: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev
- **Dashboard Privado**: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev/dashboard
- **API Base**: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev/api
- **Estadísticas Públicas**: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev/api/public/stats

## 🏗️ Arquitectura Técnica

### Stack Tecnológico
- **Backend**: Hono.js sobre Cloudflare Workers
- **Frontend**: HTML5, TailwindCSS, JavaScript (Vanilla)
- **Base de Datos**: Cloudflare D1 (SQLite distribuida)
- **Build Tool**: Vite
- **Deployment**: Cloudflare Pages

### Estructura del Proyecto
```
ctei-manager/
├── src/
│   ├── index.tsx              # Aplicación principal Hono
│   ├── types/                 # Definiciones TypeScript
│   ├── utils/                 # Utilidades (JWT, etc.)
│   ├── middleware/            # Middleware de autenticación
│   └── routes/                # Rutas API organizadas
│       ├── auth.ts           # Autenticación y registro
│       ├── public.ts         # Endpoints públicos
│       ├── private.ts        # Endpoints privados
│       └── admin.ts          # Endpoints de administración
├── public/static/             # Archivos estáticos
│   ├── styles.css            # Estilos personalizados
│   ├── app.js                # JavaScript portal público
│   └── dashboard.js          # JavaScript dashboard privado
├── migrations/                # Migraciones de base de datos
├── ecosystem.config.cjs       # Configuración PM2
└── wrangler.jsonc            # Configuración Cloudflare
```

## 🗄️ Modelo de Datos

### Tablas Principales

#### `users`
- **Propósito**: Gestión de usuarios del sistema
- **Roles**: ADMIN, INVESTIGATOR, COMMUNITY
- **Campos**: id, email, password_hash, full_name, role, created_at, updated_at

#### `projects` 
- **Propósito**: Proyectos de investigación CTeI
- **Campos**: id, title, abstract, keywords, introduction, methodology, owner_id, is_public, created_at, updated_at

#### `products`
- **Propósito**: Productos de CTeI asociados a proyectos
- **Tipos**: TOP, A, B, ASC, DPC, FRH_A, FRH_B
- **Campos**: id, project_id, product_code, product_type, description, is_public, created_at, updated_at

#### `project_collaborators`
- **Propósito**: Relación muchos-a-muchos entre usuarios y proyectos
- **Campos**: project_id, user_id, added_at

### Servicios de Datos
- **Base de Datos**: Cloudflare D1 (SQLite distribuida globalmente)
- **Almacenamiento**: Sistema de archivos estáticos via Cloudflare Pages
- **Índices optimizados**: Para consultas por rol, visibilidad pública, y búsquedas

## 🔐 Sistema de Autenticación y Roles

### Roles y Permisos

#### 👤 Visitante (No autenticado)
- ✅ Ver portal público
- ✅ Ver proyectos y productos públicos (`is_public = 1`)
- ✅ Acceso a analíticas públicas
- ❌ Sin acceso a contenido privado

#### 🏛️ Comunidad (Autenticado)
- ✅ Todos los permisos del Visitante
- ✅ Gestión de perfil personal
- ✅ Iniciar/cerrar sesión

#### 🔬 Investigador (Autenticado)
- ✅ Todos los permisos de Comunidad
- ✅ Dashboard privado personalizado
- ✅ CRUD completo de sus propios proyectos
- ✅ Gestión de productos asociados a sus proyectos
- ✅ Publicar/despublicar sus propios contenidos
- ✅ Gestionar colaboradores en sus proyectos

#### ⚙️ Administrador (Autenticado)
- ✅ Todos los permisos del Investigador
- ✅ CRUD completo sobre TODOS los usuarios, proyectos y productos
- ✅ Cambiar roles de usuarios
- ✅ Dashboard global del sistema
- ✅ Gestión completa del sistema

### Autenticación JWT
- **Algoritmo**: HMAC-SHA256
- **Expiración**: 24 horas
- **Storage**: LocalStorage (frontend)
- **Middleware**: Protección automática de rutas privadas

## 🌍 API Endpoints

### Endpoints Públicos (`/api/public/*`)
```
GET  /api/public/projects        # Lista proyectos públicos (paginado)
GET  /api/public/projects/:id    # Detalle de proyecto público
GET  /api/public/products        # Lista productos públicos (paginado)  
GET  /api/public/stats           # Estadísticas públicas del sistema
```

### Autenticación (`/api/auth/*`)
```
POST /api/auth/register          # Registro de usuarios
POST /api/auth/login             # Inicio de sesión (retorna JWT)
```

### Endpoints Privados (`/api/me/*`) - Requieren JWT
```
GET    /api/me/profile           # Perfil del usuario actual
GET    /api/me/projects          # Proyectos del usuario
POST   /api/me/projects          # Crear nuevo proyecto
PUT    /api/me/projects/:id      # Actualizar proyecto propio
DELETE /api/me/projects/:id      # Eliminar proyecto propio
POST   /api/me/projects/:id/publish # Publicar/despublicar proyecto
GET    /api/me/projects/:id/products # Productos del proyecto
POST   /api/me/projects/:id/products # Crear producto
GET    /api/me/dashboard/stats   # Estadísticas personales
```

### Endpoints Admin (`/api/admin/*`) - Solo ADMIN
```
GET    /api/admin/users          # Gestión completa de usuarios
PUT    /api/admin/users/:id      # Actualizar cualquier usuario
DELETE /api/admin/users/:id      # Eliminar usuarios
GET    /api/admin/projects       # Todos los proyectos del sistema
DELETE /api/admin/projects/:id   # Eliminar cualquier proyecto
POST   /api/admin/projects/:id/publish # Publicar cualquier proyecto
GET    /api/admin/dashboard/stats # Estadísticas globales
```

## 👥 Guía de Usuario

### Para Visitantes
1. **Explorar Portal**: Navegar proyectos y productos públicos
2. **Buscar Contenido**: Usar barra de búsqueda para filtrar por título, resumen o palabras clave
3. **Ver Detalles**: Hacer clic en proyectos para ver información completa
4. **Registrarse**: Crear cuenta para acceder a funciones adicionales

### Para Investigadores
1. **Acceder al Dashboard**: Login → /dashboard
2. **Gestionar Proyectos**: Crear, editar, publicar proyectos propios
3. **Añadir Productos**: Documentar productos CTeI asociados a proyectos
4. **Colaborar**: Invitar otros investigadores como colaboradores
5. **Analizar Métricas**: Ver estadísticas personales de actividad

### Para Administradores
1. **Panel Global**: Acceso completo a todas las funciones del sistema
2. **Gestionar Usuarios**: Cambiar roles, eliminar usuarios problemáticos
3. **Moderar Contenido**: Publicar/despublicar cualquier proyecto
4. **Supervisar Sistema**: Dashboard con métricas globales y actividad reciente

## 📊 Funcionalidades Implementadas

### ✅ Completadas
- [x] **Backend API completo** - Todos los endpoints funcionando
- [x] **Sistema de autenticación JWT** - Login/registro/middleware
- [x] **Base de datos D1** - Esquema completo con datos de prueba
- [x] **Portal público responsive** - HTML/TailwindCSS/JavaScript
- [x] **Dashboard privado funcional** - Gestión de proyectos y perfil
- [x] **Sistema de roles y permisos** - 4 niveles de acceso
- [x] **API de búsqueda y filtrado** - Por título, contenido, tipo
- [x] **Gestión de proyectos CRUD** - Crear, leer, actualizar, eliminar
- [x] **Gestión de productos CTeI** - Asociados a proyectos
- [x] **Sistema de publicación** - Control de visibilidad pública/privada
- [x] **Analíticas básicas** - Estadísticas públicas y privadas
- [x] **Interfaz de usuario moderna** - Diseño consistente y profesional

### 🔄 Funcionalidades Próximas Sugeridas

#### Funcionalidades de Producto Avanzadas
- [ ] **Sistema de archivos adjuntos** - Subida de documentos PDF, imágenes
- [ ] **Gestión de colaboradores mejorada** - Invitaciones por email, permisos granulares
- [ ] **Versioning de proyectos** - Historial de cambios y versiones
- [ ] **Sistema de comentarios** - Feedback interno en proyectos
- [ ] **Dashboard de analíticas avanzado** - Gráficos interactivos con Chart.js
- [ ] **Exportación de datos** - PDF, Excel, CSV de proyectos y productos
- [ ] **Sistema de notificaciones** - Alertas de actividad y actualizaciones
- [ ] **API de integración externa** - Webhooks para sistemas externos
- [ ] **Búsqueda full-text** - Indexación de contenido completo
- [ ] **Sistema de etiquetas/tags** - Clasificación adicional de contenido

#### Mejoras Técnicas
- [ ] **Tests automatizados** - Suite de testing para backend y frontend
- [ ] **CI/CD pipeline** - Deployment automático con GitHub Actions
- [ ] **Monitoring y logs** - Cloudflare Analytics y error tracking
- [ ] **Rate limiting** - Protección contra abuso de API
- [ ] **Caching estratégico** - Optimización de performance
- [ ] **Migración de datos** - Herramientas para importar datos existentes

## 🚀 Estado del Deployment

- **Plataforma**: Cloudflare Pages (compatible)
- **Status**: ✅ **Desarrollo Funcional** 
- **Base de Datos**: ✅ D1 Local configurada y con datos
- **API**: ✅ Todos los endpoints funcionando
- **Frontend**: ✅ Portal público y dashboard operativos
- **Último Deploy**: 2024-09-11

### Usuarios de Prueba
```
Administrador:
- Email: admin@ctei.edu.co
- Password: password123

Investigador:
- Email: carlos.rodriguez@ctei.edu.co  
- Password: password123

Investigadora:
- Email: maria.lopez@ctei.edu.co
- Password: password123

Comunidad:
- Email: comunidad@ctei.edu.co
- Password: password123
```

## 🔧 Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Desarrollo con D1 local
npm run dev:sandbox

# Construir para producción  
npm run build

# Gestionar base de datos
npm run db:migrate:local      # Aplicar migraciones
npm run db:seed              # Insertar datos de prueba
npm run db:reset             # Reset completo de datos
npm run db:console:local     # Consola SQLite

# Limpiar y test
npm run clean-port           # Limpiar puerto 3000
npm run test                 # Test de conectividad

# Git helpers
npm run git:status           # Git status
npm run git:commit "mensaje" # Git commit
```

## 📋 Próximos Pasos Recomendados

1. **Setup de producción en Cloudflare**
   - Configurar API token de Cloudflare
   - Crear base de datos D1 de producción
   - Deploy inicial a Cloudflare Pages

2. **Mejoras de UX/UI**
   - Implementar vistas de administración completas
   - Mejorar formularios de edición de proyectos
   - Añadir confirmaciones para operaciones destructivas
   
3. **Funcionalidades adicionales**
   - Sistema de archivos adjuntos con R2
   - Notificaciones en tiempo real
   - Exportación de reportes

---

**Desarrollado con ❤️ para la gestión moderna de CTeI**

*Este proyecto demuestra la implementación completa de una aplicación web moderna usando tecnologías edge-first con Cloudflare Workers, Hono, y D1.*