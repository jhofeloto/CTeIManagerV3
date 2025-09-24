#!/bin/bash

# Choco Inventa - Quick Start Script
# Script de inicio rápido para desarrollo local

echo "🚀 Iniciando Choco Inventa - Desarrollo Local"
echo "=============================================="

# Verificar Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor instale Node.js >= 18.0.0"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION detectada. Se requiere Node.js >= 18.0.0"
    exit 1
fi

echo "✅ Node.js $NODE_VERSION detectado"

# Verificar si existe package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json no encontrado. ¿Está en el directorio correcto?"
    exit 1
fi

# Instalar dependencias si no existen
if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Error al instalar dependencias"
        exit 1
    fi
fi

# Crear archivo .env.local si no existe
if [ ! -f ".env.local" ]; then
    echo "⚙️  Configurando variables de entorno..."
    cp .env.development .env.local
fi

# Crear base de datos local si no existe
if [ ! -f "dev-database.sqlite" ]; then
    echo "🗄️  Creando base de datos local..."
    touch dev-database.sqlite
fi

# Crear directorio de logs si no existe
if [ ! -d "logs" ]; then
    echo "📁 Creando directorio de logs..."
    mkdir -p logs
fi

# Crear directorio de uploads si no existe
if [ ! -d "uploads" ]; then
    echo "📁 Creando directorio de uploads..."
    mkdir -p uploads
fi

echo ""
echo "✅ Configuración completada!"
echo ""
echo "🌐 Iniciando servidor de desarrollo..."
echo "   URL: http://localhost:3000"
echo "   API: http://localhost:3000/api"
echo ""
echo "📋 Endpoints disponibles:"
echo "   GET  /                    - Página principal"
echo "   GET  /portal              - Portal público"
echo "   GET  /dashboard           - Dashboard"
echo "   GET  /api/projects        - API de proyectos"
echo "   GET  /api/analytics       - Analytics ML"
echo "   GET  /api/forecasting     - Forecasting"
echo "   GET  /api/ml              - ML Service"
echo ""
echo "🔧 Para detener el servidor: Ctrl+C"
echo ""

# Iniciar servidor
exec npx tsx dev-server.mjs