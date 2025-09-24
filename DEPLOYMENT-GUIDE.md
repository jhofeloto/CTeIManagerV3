# 🚀 Choco Inventa - Guía Completa de Despliegue Local

## 📋 Tabla de Contenidos

1. [Introducción](#-introducción)
2. [Prerrequisitos del Sistema](#-prerrequisitos-del-sistema)
3. [Instalación y Configuración](#-instalación-y-configuración)
4. [Configuración de Base de Datos](#-configuración-de-base-de-datos)
5. [Variables de Entorno](#-variables-de-entorno)
6. [Ejecución del Servidor](#-ejecución-del-servidor)
7. [Pruebas y Testing](#-pruebas-y-testing)
8. [Solución de Problemas](#-solución-de-problemas)
9. [Comandos Útiles](#-comandos-útiles)
10. [Estructura del Proyecto](#-estructura-del-proyecto)

---

## 🎯 Introducción

**Choco Inventa** es una plataforma avanzada de gestión de proyectos CTeI (Ciencia, Tecnología e Innovación) desarrollada para CODECTI Chocó. Esta guía proporciona instrucciones completas para desplegar y ejecutar la aplicación en un ambiente local de desarrollo.

### Características Principales
- ✅ **Arquitectura moderna** con Hono y Node.js
- 🤖 **Inteligencia Artificial integrada** con Workers AI
- 📊 **Analytics avanzado** con predicciones ML
- 🔮 **Sistema de forecasting** para proyectos
- 💾 **Cache multi-nivel** optimizado
- 📱 **Interfaz responsive** completa
- 🗄️ **Base de datos SQLite** para desarrollo local

---

## 💻 Prerrequisitos del Sistema

### Requisitos Mínimos
| Componente | Versión | Descripción |
|------------|---------|-------------|
| **Node.js** | >= 18.0.0 | Runtime de JavaScript |
| **npm** | >= 8.0.0 | Gestor de paquetes |
| **Git** | >= 2.30.0 | Control de versiones |
| **SQLite3** | >= 3.30.0 | Base de datos local |
| **RAM** | >= 4GB | Memoria recomendada |
| **Espacio en disco** | >= 2GB | Espacio libre |

### Verificación de Prerrequisitos

```bash
# Verificar Node.js
node --version
# Debe mostrar: v18.0.0 o superior

# Verificar npm
npm --version
# Debe mostrar: 8.0.0 o superior

# Verificar Git
git --version
# Debe mostrar: 2.30.0 o superior

# Verificar SQLite3
sqlite3 --version
# Debe mostrar la versión instalada
```

### Instalación de Prerrequisitos (macOS)

```bash
# Instalar Node.js con Homebrew
brew install node@18

# Instalar SQLite3
brew install sqlite

# Verificar instalaciones
node --version    # v18.x.x
npm --version     # 8.x.x
sqlite3 --version # 3.x.x
```

### Instalación de Prerrequisitos (Ubuntu/Debian)

```bash
# Actualizar sistema
sudo apt update

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar SQLite3
sudo apt-get install sqlite3

# Verificar instalaciones
node --version    # v18.x.x
npm --version     # 8.x.x
sqlite3 --version # 3.x.x
```

### Instalación de Prerrequisitos (Windows)

```bash
# Descargar Node.js 18 LTS desde:
# https://nodejs.org/dist/v18.x.x/node-v18.x.x-x64.msi

# Instalar SQLite3 desde:
# https://www.sqlite.org/download.html

# Verificar instalaciones en PowerShell
node --version    # v18.x.x
npm --version     # 8.x.x
sqlite3 --version # 3.x.x
```

---

## 📦 Instalación y Configuración

### Paso 1: Clonar el Repositorio

```bash
# Clonar desde GitHub (ajustar URL según sea necesario)
git clone https://github.com/codecti/choco-inventa.git
cd choco-inventa

# Verificar contenido
ls -la
```

### Paso 2: Instalar Dependencias

```bash
# Instalar dependencias de Node.js
npm install

# Verificar instalación exitosa
ls node_modules | head -10
```

**Dependencias Principales Instaladas:**
- `hono` - Framework web ultrarrápido
- `@hono/node-server` - Adaptador para Node.js
- `better-sqlite3` - Driver SQLite optimizado
- `bcryptjs` - Encriptación de contraseñas
- `jsonwebtoken` - JWT para autenticación
- `axios` - Cliente HTTP
- `dotenv` - Variables de entorno

### Paso 3: Configurar Variables de Entorno

```bash
# Copiar configuración de desarrollo
cp .env.development .env.local

# Verificar archivo creado
ls -la .env*
```

### Paso 4: Configurar Base de Datos

```bash
# Crear base de datos SQLite local
touch dev-database.sqlite

# Verificar creación
ls -la dev-database.sqlite
```

### Paso 5: Crear Directorios Necesarios

```bash
# Crear directorios para logs y uploads
mkdir -p logs uploads

# Verificar estructura
ls -la logs uploads
```

---

## 🗄️ Configuración de Base de Datos

### Estructura de Base de Datos

Choco Inventa utiliza **SQLite** para desarrollo local con la siguiente estructura:

```sql
-- Usuarios del sistema
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  institution VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Proyectos de investigación
CREATE TABLE projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  budget DECIMAL(15,2),
  start_date DATE,
  end_date DATE,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Noticias y publicaciones
CREATE TABLE news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR(500) NOT NULL,
  content TEXT,
  category VARCHAR(100),
  sentiment VARCHAR(50),
  keywords TEXT,
  published_at DATETIME,
  created_by INTEGER,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### Inicialización de Base de Datos

```bash
# Crear tablas básicas (si es necesario)
sqlite3 dev-database.sqlite < migrations/0001_initial_schema.sql

# Verificar tablas creadas
sqlite3 dev-database.sqlite ".tables"
```

### Datos de Prueba

El sistema incluye datos mock para desarrollo:

```bash
# Ejecutar script de datos de prueba
node scripts/seed-dev-data.js

# Verificar datos insertados
sqlite3 dev-database.sqlite "SELECT COUNT(*) FROM users;"
sqlite3 dev-database.sqlite "SELECT COUNT(*) FROM projects;"
```

---

## ⚙️ Variables de Entorno

### Archivo `.env.development`

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
DB_TYPE=sqlite
DB_PATH=./dev-database.sqlite
DB_URL=sqlite:./dev-database.sqlite

# Cloudflare Configuration (Mock)
CLOUDFLARE_API_TOKEN=dev-token-mock
CLOUDFLARE_ACCOUNT_ID=dev-account-mock
CLOUDFLARE_DATABASE_ID=dev-db-mock

# Workers AI Configuration (Mock)
WORKERS_AI_MODEL=llama-2-7b-chat
WORKERS_AI_API_KEY=dev-ai-key-mock
WORKERS_AI_ACCOUNT_ID=dev-ai-account-mock

# Cache Configuration
CACHE_TYPE=memory
CACHE_TTL=3600
CACHE_MAX_SIZE=1000

# File Storage
STORAGE_TYPE=local
STORAGE_PATH=./uploads
MAX_FILE_SIZE=10485760

# Authentication
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h
BCRYPT_ROUNDS=10

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:5173,http://localhost:8787
CORS_CREDENTIALS=true

# Logging
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_FILE=./logs/dev.log

# ML Service
ML_SERVICE_TYPE=mock
ML_FALLBACK_ENABLED=true
ML_CACHE_ENABLED=true
ML_TIMEOUT=30000

# Analytics
ANALYTICS_ENABLED=true
ANALYTICS_CACHE_TTL=1800

# Feature Flags
FEATURE_ML_ENABLED=true
FEATURE_ANALYTICS_ENABLED=true
FEATURE_FORECASTING_ENABLED=true
FEATURE_COLLABORATION_ENABLED=true
FEATURE_NOTIFICATIONS_ENABLED=true

# Development Settings
DEBUG=true
HOT_RELOAD=true
MOCK_DATA=true
SKIP_AUTH=false

# Admin User
ADMIN_EMAIL=admin@codecti.gov.co
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrador CODECTI
ADMIN_INSTITUTION=CODECTI Chocó
```

### Cargar Variables de Entorno

```bash
# Cargar variables en la sesión actual
source .env.local

# Verificar carga
echo $NODE_ENV
echo $PORT
echo $DB_TYPE
```

---

## 🚀 Ejecución del Servidor

### Método 1: Script Automático (Recomendado)

```bash
# Ejecutar script de inicio automático
./start-dev.sh
```

### Método 2: Comandos npm

```bash
# Instalar dependencias (si no están instaladas)
npm install

# Iniciar servidor de desarrollo
npm run dev

# O usando el script directo
npm start
```

### Método 3: Node.js Directo

```bash
# Ejecutar servidor directamente
node dev-server.mjs

# Con variables de entorno específicas
NODE_ENV=development PORT=3000 node dev-server.mjs
```

### Verificación de Inicio

```bash
# El servidor debe mostrar:
🚀 Iniciando Choco Inventa - Development Server
📍 Servidor local: http://localhost:3000
🔧 Modo: development
🤖 ML Service: Activado
📊 Base de datos: Mock Database (Desarrollo)
✅ Servidor listo! Presiona Ctrl+C para detener
```

### Acceso a la Aplicación

| URL | Descripción | Estado |
|-----|-------------|---------|
| http://localhost:3000 | 🏠 Página principal | ✅ Activo |
| http://localhost:3000/portal | 🏛️ Portal público | ✅ Activo |
| http://localhost:3000/dashboard | 📊 Dashboard | ✅ Activo |
| http://localhost:3000/api/projects | 🔌 API Proyectos | ✅ Activo |
| http://localhost:3000/api/analytics | 📈 Analytics ML | ✅ Activo |

---

## 🧪 Pruebas y Testing

### Pruebas de Endpoints API

#### 1. Verificar Servidor
```bash
curl http://localhost:3000
# Debe retornar HTML de la página principal
```

#### 2. Probar API de Proyectos
```bash
# GET - Listar proyectos
curl http://localhost:3000/api/projects

# POST - Crear proyecto con ML
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sistema de IA para salud",
    "description": "Desarrollo de algoritmos ML para diagnóstico",
    "category": "auto"
  }'
```

#### 3. Probar Analytics
```bash
# Dashboard completo
curl http://localhost:3000/api/analytics/dashboard

# Predicciones ML
curl http://localhost:3000/api/analytics/predictions

# Análisis de impacto
curl http://localhost:3000/api/analytics/impact
```

#### 4. Probar Forecasting
```bash
# Predicción de éxito
curl http://localhost:3000/api/forecasting/project-success

# Probabilidad de financiamiento
curl http://localhost:3000/api/forecasting/funding-probability

# Análisis de riesgos
curl http://localhost:3000/api/forecasting/risk-assessment
```

#### 5. Probar ML Service
```bash
# Métricas del sistema
curl http://localhost:3000/api/ml/metrics

# Health check
curl http://localhost:3000/api/ml/health

# Test de funcionalidades
curl -X POST http://localhost:3000/api/ml/test \
  -H "Content-Type: application/json" \
  -d '{"operation": "sentiment", "data": {"text": "Este proyecto es excelente"}}'
```

### Pruebas Funcionales

#### Crear Proyecto con IA
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Investigación en biotecnología marina",
    "description": "Estudio de organismos marinos para desarrollo de nuevos fármacos",
    "budget": 500000,
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'
```

#### Obtener Recomendaciones
```bash
curl "http://localhost:3000/api/projects/recommendations?category=biotechnology&limit=5"
```

#### Análisis de Sentimientos
```bash
curl -X POST http://localhost:3000/api/news/analyze-sentiment \
  -H "Content-Type: application/json" \
  -d '{"text": "Este proyecto representa un avance significativo en la investigación científica"}'
```

### Pruebas de Performance

#### Benchmark de Endpoints
```bash
# Instalar herramienta de benchmarking
npm install -g autocannon

# Probar endpoint de proyectos
autocannon -c 10 -d 10 http://localhost:3000/api/projects

# Probar dashboard analytics
autocannon -c 5 -d 5 http://localhost:3000/api/analytics/dashboard
```

#### Monitoreo de Recursos
```bash
# Monitorear uso de CPU y memoria
top -p $(pgrep -f "node dev-server.mjs")

# Ver logs en tiempo real
tail -f logs/dev.log
```

### Pruebas de Funcionalidades ML

#### Categorización Automática
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Desarrollo de vacuna contra el dengue",
    "description": "Investigación clínica para vacuna contra dengue",
    "category": "auto"
  }'
```

#### Generación de Resúmenes
```bash
curl -X POST http://localhost:3000/api/news/generate-summary \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Este proyecto de investigación busca desarrollar una vacuna contra el dengue utilizando tecnología de ARN mensajero. El estudio involucra múltiples fases clínicas y colaboración internacional.",
    "maxLength": 150
  }'
```

#### Extracción de Keywords
```bash
curl -X POST http://localhost:3000/api/news/extract-keywords \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Investigación en inteligencia artificial aplicada a diagnóstico médico",
    "maxKeywords": 10
  }'
```

---

## 🐛 Solución de Problemas

### Error: Puerto en Uso
```bash
# Identificar proceso usando el puerto
lsof -ti:3000

# Terminar proceso
kill -9 $(lsof -ti:3000)

# O usar puerto alternativo
PORT=3001 npm run dev
```

### Error: Módulo no Encontrado
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install

# Limpiar cache de npm
npm cache clean --force
```

### Error: Base de Datos
```bash
# Recrear base de datos
rm dev-database.sqlite
touch dev-database.sqlite

# Verificar permisos
chmod 666 dev-database.sqlite
```

### Error: Variables de Entorno
```bash
# Verificar archivos de entorno
ls -la .env*

# Recargar variables
source .env.local

# Verificar carga
echo $NODE_ENV $PORT $DB_TYPE
```

### Error: Permisos de Archivos
```bash
# Hacer script ejecutable
chmod +x start-dev.sh

# Verificar permisos
ls -la start-dev.sh
```

### Error: Memoria Insuficiente
```bash
# Aumentar límite de memoria de Node.js
NODE_OPTIONS="--max-old-space-size=4096" npm run dev

# Verificar uso de memoria
node -e "console.log('Memory:', Math.round(process.memoryUsage().heapUsed / 1024 / 1024), 'MB')"
```

### Error: ML Service no Responde
```bash
# Verificar configuración ML
curl http://localhost:3000/api/ml/health

# Verificar logs
tail -f logs/dev.log | grep -i ml

# Reiniciar servidor
pkill -f "node dev-server.mjs"
npm run dev
```

---

## 🛠️ Comandos Útiles

### Desarrollo
```bash
# Inicio rápido
./start-dev.sh

# Desarrollo estándar
npm run dev

# Servidor directo
node dev-server.mjs

# Con puerto específico
PORT=3001 npm run dev
```

### Base de Datos
```bash
# Verificar base de datos
sqlite3 dev-database.sqlite ".tables"

# Ver registros de usuarios
sqlite3 dev-database.sqlite "SELECT id, email, name FROM users;"

# Ver proyectos
sqlite3 dev-database.sqlite "SELECT id, title, category FROM projects LIMIT 5;"

# Backup de base de datos
cp dev-database.sqlite backup-$(date +%Y%m%d-%H%M%S).sqlite
```

### Logs y Monitoreo
```bash
# Ver logs en tiempo real
tail -f logs/dev.log

# Buscar errores específicos
tail -f logs/dev.log | grep -i error

# Limpiar logs antiguos
find logs/ -name "*.log" -mtime +7 -delete

# Ver métricas del sistema
curl http://localhost:3000/api/monitoring/metrics
```

### Mantenimiento
```bash
# Limpiar instalación
npm run clean

# Reset completo
npm run reset

# Actualizar dependencias
npm update

# Verificar instalación
npm run check
```

### Testing
```bash
# Probar todos los endpoints
curl -s http://localhost:3000/api/projects | head -c 100
curl -s http://localhost:3000/api/analytics/dashboard | head -c 100
curl -s http://localhost:3000/api/forecasting/project-success | head -c 100

# Benchmark de performance
autocannon -c 10 -d 10 http://localhost:3000/api/projects

# Verificar health check
curl http://localhost:3000/api/monitoring/health
```

---

## 📁 Estructura del Proyecto

```
chocoInventa/
├── 📁 src/                          # Código fuente
│   ├── 📁 routes/                   # Rutas de la API
│   │   ├── analytics.ts            # Analytics avanzado con ML
│   │   ├── forecasting.ts          # Sistema de predicciones
│   │   ├── ml.ts                   # Servicios de ML
│   │   ├── projects.ts             # Gestión de proyectos
│   │   └── ...                     # Otras rutas
│   ├── 📁 utils/                   # Utilidades
│   │   ├── cache.ts               # Sistema de cache
│   │   ├── mlService.ts           # Servicio de ML
│   │   ├── databasePool.ts        # Pool de conexiones DB
│   │   └── ...                     # Otras utilidades
│   ├── 📁 monitoring/              # Monitoreo y logs
│   │   ├── logger.ts              # Sistema de logging
│   │   ├── performance.ts         # Métricas de performance
│   │   └── ...                     # Otros módulos
│   ├── 📁 middleware/              # Middlewares
│   └── types.ts                    # Definiciones de tipos
│
├── 📁 public/                      # Archivos estáticos
│   ├── static/                     # CSS, JS, imágenes
│   └── ...                         # Otros archivos públicos
│
├── 📁 migrations/                  # Scripts de migración DB
├── 📁 scripts/                     # Scripts de utilidad
├── 📁 logs/                       # Logs de la aplicación
├── 📁 uploads/                     # Archivos subidos
│
├── dev-server.mjs                  # Servidor de desarrollo
├── start-dev.sh                    # Script de inicio rápido
├── .env.development               # Variables de entorno
├── package.json                    # Dependencias y scripts
├── README-DEV.md                   # Guía de desarrollo
├── DEPLOYMENT-GUIDE.md            # Esta guía
└── dev-database.sqlite            # Base de datos local
```

---

## 🎯 Próximos Pasos

### Después del Despliegue Exitoso

1. **Explorar la aplicación** en http://localhost:3000
2. **Probar funcionalidades ML** con los endpoints de API
3. **Revisar logs** para verificar funcionamiento correcto
4. **Personalizar configuración** según necesidades específicas
5. **Desarrollar nuevas funcionalidades** usando la estructura existente

### Para Producción

1. **Configurar Cloudflare Workers** para deployment real
2. **Configurar base de datos D1** en Cloudflare
3. **Configurar Workers AI** con API keys reales
4. **Optimizar configuración** para ambiente de producción
5. **Configurar CI/CD** para despliegue automatizado

---

## 📞 Soporte y Contacto

### Problemas Comunes
- **ML no funciona**: Verificar `ML_SERVICE_TYPE=mock`
- **Cache no funciona**: Verificar `CACHE_TYPE=memory`
- **Base de datos**: Verificar `dev-database.sqlite`
- **Puerto ocupado**: Usar `PORT=3001`

### Recursos Adicionales
- 📖 [Documentación de Hono](https://hono.dev/)
- 🤖 [Workers AI Documentation](https://developers.cloudflare.com/workers-ai/)
- 🗄️ [SQLite Documentation](https://www.sqlite.org/docs.html)
- 📊 [Cloudflare D1](https://developers.cloudflare.com/d1/)

### Equipo de Desarrollo
Para soporte técnico, contactar al equipo de desarrollo de CODECTI Chocó.

---

**¡Despliegue completado exitosamente!** 🎉

Choco Inventa está ahora ejecutándose en tu ambiente local con todas las funcionalidades de IA, analytics y forecasting disponibles para pruebas y desarrollo.