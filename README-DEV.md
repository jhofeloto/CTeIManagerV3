# 🚀 Choco Inventa - Desarrollo Local

Guía completa para ejecutar **Choco Inventa** en ambiente local de desarrollo.

## 📋 Prerrequisitos

### Requisitos del Sistema
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0 o **yarn** >= 1.22.0
- **Git** >= 2.30.0
- **SQLite3** (para base de datos local)

### Verificar Instalación
```bash
node --version    # Debe ser >= 18.0.0
npm --version     # Debe ser >= 8.0.0
git --version     # Debe ser >= 2.30.0
```

## 🛠️ Instalación

### 1. Clonar el Repositorio
```bash
git clone <repository-url>
cd chocoInventa
```

### 2. Instalar Dependencias
```bash
# Con npm
npm install

# Con yarn
yarn install
```

### 3. Configurar Variables de Entorno
```bash
# Copiar archivo de configuración de desarrollo
cp .env.development .env.local

# El archivo .env.development ya contiene todas las configuraciones necesarias
```

### 4. Configurar Base de Datos Local
```bash
# Crear base de datos SQLite local
touch dev-database.sqlite

# Ejecutar migraciones (si es necesario)
npm run migrate:dev
```

### 5. Instalar Dependencias Adicionales
```bash
# Instalar dependencias de desarrollo
npm install --save-dev @types/node typescript tsx

# Instalar Hono y dependencias necesarias
npm install hono @hono/node-server
```

## 🚀 Ejecución

### Modo Desarrollo (Recomendado)
```bash
# Ejecutar servidor de desarrollo
npm run dev

# O directamente con Node.js
node dev-server.mjs
```

### Modo Producción Local
```bash
# Construir aplicación
npm run build

# Ejecutar en modo producción
npm run start
```

### Verificación de Funcionamiento
```bash
# El servidor debería iniciar en http://localhost:3000
curl http://localhost:3000

# Verificar API
curl http://localhost:3000/api/projects
```

## 📁 Estructura del Proyecto

```
chocoInventa/
├── src/                    # Código fuente
│   ├── routes/            # Rutas de la API
│   │   ├── analytics.ts   # Analytics avanzado con ML
│   │   ├── forecasting.ts # Sistema de predicciones
│   │   ├── ml.ts          # Servicios de ML
│   │   ├── projects.ts    # Gestión de proyectos
│   │   └── ...
│   ├── utils/             # Utilidades
│   │   ├── cache.ts       # Sistema de cache
│   │   ├── mlService.ts   # Servicio de ML
│   │   └── ...
│   ├── monitoring/        # Monitoreo y logs
│   └── types.ts           # Definiciones de tipos
├── public/                # Archivos estáticos
├── dev-server.mjs         # Servidor de desarrollo
├── .env.development       # Variables de entorno
└── package.json           # Dependencias
```

## 🔧 Configuración

### Variables de Entorno Importantes

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `NODE_ENV` | `development` | Modo de desarrollo |
| `PORT` | `3000` | Puerto del servidor |
| `DB_TYPE` | `sqlite` | Tipo de base de datos |
| `ML_SERVICE_TYPE` | `mock` | Tipo de servicio ML |
| `CACHE_TYPE` | `memory` | Tipo de cache |

### Configuración de ML Local

Para desarrollo local, el sistema usa **servicios simulados**:

- **Categorización**: Basada en keywords
- **Análisis de Sentimientos**: Reglas predefinidas
- **Recomendaciones**: Basadas en similitud de texto
- **Predicciones**: Algoritmos deterministas

## 🧪 Pruebas

### Probar Endpoints Principales

```bash
# 1. Verificar servidor
curl http://localhost:3000

# 2. Probar API de proyectos
curl http://localhost:3000/api/projects

# 3. Probar ML Service
curl http://localhost:3000/api/ml/metrics

# 4. Probar Analytics
curl http://localhost:3000/api/analytics/dashboard

# 5. Probar Forecasting
curl http://localhost:3000/api/forecasting/project-success
```

### Probar Funcionalidades ML

```bash
# Crear proyecto con categorización automática
curl -X POST http://localhost:3000/api/projects \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Investigación en IA para salud",
    "description": "Desarrollo de algoritmos de IA para diagnóstico médico",
    "category": "auto"
  }'

# Obtener recomendaciones
curl http://localhost:3000/api/projects/recommendations?category=health

# Análisis de sentimientos
curl -X POST http://localhost:3000/api/news/analyze-sentiment \\
  -H "Content-Type: application/json" \\
  -d '{"text": "Este proyecto es excelente para la comunidad"}'
```

## 🐛 Solución de Problemas

### Error: Puerto en Uso
```bash
# Verificar qué proceso usa el puerto 3000
lsof -ti:3000

# Matar proceso
kill -9 $(lsof -ti:3000)

# O usar otro puerto
PORT=3001 npm run dev
```

### Error: Módulo no encontrado
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

### Error: Base de datos
```bash
# Recrear base de datos
rm dev-database.sqlite
touch dev-database.sqlite
```

### Error: Variables de entorno
```bash
# Verificar que .env.local existe
ls -la .env*

# Recargar variables
source .env.local
```

## 📊 Monitoreo

### Logs de Desarrollo
```bash
# Ver logs en tiempo real
tail -f logs/dev.log

# O ver últimos logs
cat logs/dev.log | tail -20
```

### Métricas de Performance
```bash
# Ver métricas del sistema
curl http://localhost:3000/api/monitoring/metrics

# Ver health check
curl http://localhost:3000/api/monitoring/health
```

## 🔄 Desarrollo

### Agregar Nueva Ruta
1. Crear archivo en `src/routes/`
2. Exportar la ruta
3. Agregarla en `dev-server.mjs`
4. Reiniciar servidor

### Modificar Funcionalidad ML
1. Editar `src/utils/mlService.ts`
2. Actualizar lógica en rutas correspondientes
3. Probar con endpoints de test

### Agregar Middleware
1. Crear middleware en `src/middleware/`
2. Agregarlo en `dev-server.mjs`
3. Verificar funcionamiento

## 🚀 Despliegue

### Preparar para Producción
```bash
# Construir aplicación
npm run build

# Ejecutar pruebas
npm run test

# Verificar configuración
npm run check
```

### Variables de Producción
```bash
# Crear archivo .env.production
cp .env.development .env.production

# Modificar valores para producción
# - Configurar Cloudflare Workers
# - Configurar base de datos real
# - Configurar servicios ML reales
```

## 📞 Soporte

### Problemas Comunes
- **ML no funciona**: Verificar `ML_SERVICE_TYPE=mock`
- **Cache no funciona**: Verificar `CACHE_TYPE=memory`
- **Base de datos**: Verificar `dev-database.sqlite`

### Contacto
Para soporte técnico, contactar al equipo de desarrollo de CODECTI.

---

**¡Listo para desarrollar!** 🎉

Con esta configuración, puedes ejecutar **Choco Inventa** localmente con todas las funcionalidades de IA y analytics funcionando.