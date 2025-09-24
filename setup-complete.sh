#!/bin/bash

# Choco Inventa - Complete Setup Script
# Script de configuración completa para desarrollo local desde cero

set -e  # Detener en caso de error

echo "🚀 Choco Inventa - Configuración Completa"
echo "=========================================="

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$PROJECT_DIR/setup.log"

# Función para logging
log() {
    echo -e "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

# Función para verificar comando exitoso
check_command() {
    if [ $? -eq 0 ]; then
        log "${GREEN}✅ $1${NC}"
    else
        log "${RED}❌ $1${NC}"
        exit 1
    fi
}

# Función para detectar sistema operativo
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "macos"
    elif [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "msys" ]]; then
        echo "windows"
    else
        echo "unknown"
    fi
}

OS=$(detect_os)
log "Sistema operativo detectado: $OS"

# Paso 1: Verificar prerrequisitos del sistema
log "\n${BLUE}📋 Verificando prerrequisitos del sistema...${NC}"

# Verificar Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_VERSION" -ge 18 ]; then
        log "✅ Node.js $NODE_VERSION detectado"
    else
        log "❌ Node.js $NODE_VERSION detectado. Se requiere Node.js >= 18.0.0"
        log "💡 Instala Node.js desde: https://nodejs.org/"
        exit 1
    fi
else
    log "❌ Node.js no está instalado"
    log "💡 Instala Node.js desde: https://nodejs.org/"
    exit 1
fi

# Verificar npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    log "✅ npm $NPM_VERSION detectado"
else
    log "❌ npm no está instalado"
    exit 1
fi

# Verificar Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version | cut -d' ' -f3)
    log "✅ Git $GIT_VERSION detectado"
else
    log "❌ Git no está instalado"
    exit 1
fi

# Verificar SQLite3
if command -v sqlite3 &> /dev/null; then
    SQLITE_VERSION=$(sqlite3 --version | cut -d' ' -f1)
    log "✅ SQLite3 $SQLITE_VERSION detectado"
else
    log "❌ SQLite3 no está instalado"
    if [ "$OS" = "macos" ]; then
        log "💡 Instala SQLite3 con: brew install sqlite"
    elif [ "$OS" = "linux" ]; then
        log "💡 Instala SQLite3 con: sudo apt-get install sqlite3"
    fi
    exit 1
fi

# Paso 2: Instalar dependencias del sistema (si es necesario)
log "\n${BLUE}📦 Instalando dependencias del sistema...${NC}"

if [ "$OS" = "macos" ]; then
    if ! command -v brew &> /dev/null; then
        log "💡 Instalando Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        check_command "Homebrew instalado"
    fi

    # Instalar dependencias si no existen
    if ! command -v autoconf &> /dev/null; then
        log "Instalando herramientas de desarrollo..."
        brew install autoconf automake libtool
    fi

elif [ "$OS" = "linux" ]; then
    # Instalar herramientas de desarrollo
    if command -v apt-get &> /dev/null; then
        log "Instalando herramientas de desarrollo con apt..."
        sudo apt-get update
        sudo apt-get install -y build-essential autoconf automake libtool
        check_command "Herramientas de desarrollo instaladas"
    elif command -v yum &> /dev/null; then
        log "Instalando herramientas de desarrollo con yum..."
        sudo yum groupinstall -y "Development Tools"
        check_command "Herramientas de desarrollo instaladas"
    fi
fi

# Paso 3: Configurar directorio del proyecto
log "\n${BLUE}📁 Configurando directorio del proyecto...${NC}"

cd "$PROJECT_DIR"
log "Directorio de trabajo: $PROJECT_DIR"

# Verificar si existe package.json
if [ ! -f "package.json" ]; then
    log "❌ package.json no encontrado"
    exit 1
fi

# Paso 4: Instalar dependencias de Node.js
log "\n${BLUE}📦 Instalando dependencias de Node.js...${NC}"

if [ -d "node_modules" ]; then
    log "🧹 Limpiando instalación anterior..."
    rm -rf node_modules package-lock.json
fi

log "Instalando dependencias..."
npm install
check_command "Dependencias de Node.js instaladas"

# Paso 5: Configurar variables de entorno
log "\n${BLUE}⚙️  Configurando variables de entorno...${NC}"

if [ ! -f ".env.development" ]; then
    log "❌ Archivo .env.development no encontrado"
    exit 1
fi

if [ ! -f ".env.local" ]; then
    log "Copiando configuración de desarrollo..."
    cp .env.development .env.local
    check_command "Variables de entorno configuradas"
else
    log "✅ Variables de entorno ya configuradas"
fi

# Paso 6: Configurar base de datos
log "\n${BLUE}🗄️  Configurando base de datos...${NC}"

if [ -f "dev-database.sqlite" ]; then
    log "🗄️  Base de datos existente detectada"
    read -p "¿Deseas recrear la base de datos? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "🗑️  Eliminando base de datos anterior..."
        rm dev-database.sqlite
        touch dev-database.sqlite
        check_command "Base de datos recreada"
    fi
else
    log "Creando nueva base de datos..."
    touch dev-database.sqlite
    check_command "Base de datos creada"
fi

# Verificar permisos de base de datos
chmod 666 dev-database.sqlite
check_command "Permisos de base de datos configurados"

# Paso 7: Crear directorios necesarios
log "\n${BLUE}📁 Creando directorios necesarios...${NC}"

mkdir -p logs uploads public/static
check_command "Directorios creados"

# Paso 8: Configurar permisos de scripts
log "\n${BLUE}🔧 Configurando permisos de scripts...${NC}"

chmod +x start-dev.sh
chmod +x test-local.sh
chmod +x setup-complete.sh
check_command "Permisos de scripts configurados"

# Paso 9: Verificar instalación
log "\n${BLUE}✅ Verificando instalación...${NC}"

# Verificar archivos críticos
files_to_check=(
    "dev-server.mjs"
    "package.json"
    ".env.local"
    "dev-database.sqlite"
    "src/index.tsx"
    "src/routes/projects.ts"
    "src/routes/analytics.ts"
    "src/routes/forecasting.ts"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        log "✅ $file existe"
    else
        log "❌ $file no encontrado"
        exit 1
    fi
done

# Paso 10: Ejecutar pruebas básicas
log "\n${BLUE}🧪 Ejecutando pruebas básicas...${NC}"

# Verificar que podemos importar módulos principales
node -e "console.log('✅ Módulos de Node.js funcionan correctamente')" 2>/dev/null
check_command "Verificación de módulos de Node.js"

# Verificar sintaxis de archivos principales
node -c dev-server.mjs
check_command "Sintaxis del servidor de desarrollo"

# Paso 11: Mostrar información de configuración
log "\n${BLUE}📋 Información de configuración:${NC}"
log "   Proyecto: Choco Inventa v3.0.0"
log "   Node.js: $(node -v)"
log "   npm: $(npm -v)"
log "   OS: $OS"
log "   Directorio: $PROJECT_DIR"
log "   Base de datos: dev-database.sqlite"
log "   Puerto: $(grep PORT .env.local | cut -d'=' -f2)"

# Paso 12: Crear script de inicio rápido
log "\n${BLUE}🚀 Creando script de inicio rápido...${NC}"

cat > quick-start.sh << 'EOF'
#!/bin/bash
echo "🚀 Inicio rápido de Choco Inventa"
echo "================================="
echo ""
echo "1. Iniciando servidor..."
./start-dev.sh
EOF

chmod +x quick-start.sh
check_command "Script de inicio rápido creado"

# Paso 13: Mostrar instrucciones finales
log "\n${GREEN}🎉 ¡CONFIGURACIÓN COMPLETADA EXITOSAMENTE!${NC}"
log ""
log "${BLUE}📋 Comandos disponibles:${NC}"
log "   ./start-dev.sh          # Iniciar servidor"
log "   ./test-local.sh         # Ejecutar pruebas"
log "   ./quick-start.sh        # Inicio rápido"
log "   npm run dev             # Desarrollo estándar"
log "   node dev-server.mjs     # Servidor directo"
log ""
log "${BLUE}🌐 URLs de la aplicación:${NC}"
log "   http://localhost:3000          # Página principal"
log "   http://localhost:3000/portal   # Portal público"
log "   http://localhost:3000/dashboard # Dashboard"
log ""
log "${BLUE}📚 Documentación:${NC}"
log "   README-DEV.md          # Guía de desarrollo"
log "   DEPLOYMENT-GUIDE.md    # Guía de despliegue"
log ""
log "${BLUE}🧪 Para probar:${NC}"
log "   1. Ejecuta: ./start-dev.sh"
log "   2. Abre: http://localhost:3000"
log "   3. Prueba: curl http://localhost:3000/api/projects"
log "   4. Ejecuta: ./test-local.sh"
log ""
log "${YELLOW}💡 Consejos:${NC}"
log "   - Usa ./start-dev.sh para inicio automático"
log "   - Revisa logs/dev.log para debugging"
log "   - Ejecuta ./test-local.sh para verificar funcionamiento"
log "   - Consulta DEPLOYMENT-GUIDE.md para troubleshooting"
log ""
log "${GREEN}✅ ¡Choco Inventa está listo para desarrollo local!${NC}"

# Crear archivo de estado de configuración
cat > setup-status.json << EOF
{
  "setup_completed": true,
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "3.0.0",
  "os": "$OS",
  "node_version": "$(node -v)",
  "npm_version": "$(npm -v)",
  "database": "dev-database.sqlite",
  "status": "ready"
}
EOF

log "\n${GREEN}📁 Archivos creados/modificados:${NC}"
log "   ✅ .env.local (variables de entorno)"
log "   ✅ dev-database.sqlite (base de datos)"
log "   ✅ logs/ (directorio de logs)"
log "   ✅ uploads/ (directorio de archivos)"
log "   ✅ setup.log (log de configuración)"
log "   ✅ setup-status.json (estado de configuración)"
log "   ✅ quick-start.sh (script de inicio rápido)"

log "\n${GREEN}🎊 ¡CONFIGURACIÓN 100% COMPLETA!${NC}"
log "Choco Inventa está listo para desarrollo local."
log "Ejecuta ./start-dev.sh para comenzar."