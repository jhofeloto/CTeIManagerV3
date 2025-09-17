#!/bin/bash

# Script para deployment de testing con activación de usuario administrador
# Adaptado al método específico de testing de CodectiChocoV2

echo "🧪 === DEPLOYMENT TESTING CON ACTIVACIÓN DE ADMINISTRADOR ==="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar que estamos en el directorio correcto
if [ ! -f "wrangler.testing.jsonc" ]; then
    echo -e "${RED}❌ Error: wrangler.testing.jsonc no encontrado${NC}"
    echo -e "${YELLOW}Asegúrate de estar en ~/CodectiChocoV2-testing${NC}"
    exit 1
fi

echo -e "${BLUE}📁 Paso 0: Verificando directorio de testing...${NC}"
pwd

echo -e "${BLUE}📥 Paso 1: Obteniendo última versión de GitHub...${NC}"
git pull origin main

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error al hacer pull. Verifica conexión a GitHub.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Código actualizado desde main${NC}"
echo ""

echo -e "${BLUE}⚙️ Paso 2: Configurando para testing...${NC}"
cp wrangler.testing.jsonc wrangler.jsonc

echo -e "${GREEN}✅ Configuración de testing aplicada${NC}"
echo ""

echo -e "${BLUE}🗄️ Paso 3: Aplicando migraciones en testing...${NC}"
echo -e "${YELLOW}⚠️  IMPORTANTE: Esto activará el usuario administrador en testing${NC}"

# Aplicar migraciones a la base de datos de testing
wrangler d1 migrations apply ctei-manager-testing

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error aplicando migraciones. Intentando crear database...${NC}"
    wrangler d1 create ctei-manager-testing
    echo -e "${BLUE}🔄 Reintentando migraciones...${NC}"
    wrangler d1 migrations apply ctei-manager-testing
    
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Error crítico con migraciones. Abortando.${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}✅ Migraciones aplicadas en testing - Admin creado${NC}"
echo ""

echo -e "${BLUE}📦 Paso 4: Compilando aplicación...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en la compilación. Abortando deployment.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Compilación exitosa${NC}"
echo ""

echo -e "${BLUE}☁️ Paso 5: Deploying a Cloudflare Testing...${NC}"
wrangler pages deploy dist --project-name ctei-manager-testing --commit-dirty=true

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en deployment de testing. Revisa logs.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 === DEPLOYMENT TESTING COMPLETADO EXITOSAMENTE ===${NC}"
echo ""
echo -e "${BLUE}🌐 URL de Testing: https://main.ctei-manager-testing.pages.dev${NC}"
echo ""
echo -e "${BLUE}📋 CREDENCIALES DE ADMINISTRADOR ACTIVADAS:${NC}"
echo -e "${YELLOW}👤 Email: admin@demo.com${NC}"
echo -e "${YELLOW}🔑 Password: admin123${NC}"
echo -e "${YELLOW}🛡️ Rol: ADMIN${NC}"
echo ""
echo -e "${BLUE}📋 CREDENCIALES DE INVESTIGADOR:${NC}"
echo -e "${YELLOW}👤 Email: investigador@demo.com${NC}"
echo -e "${YELLOW}🔑 Password: investigador123${NC}"
echo -e "${YELLOW}🛡️ Rol: INVESTIGATOR${NC}"
echo ""
echo -e "${GREEN}✅ El administrador ya puede acceder al sistema de testing${NC}"
echo -e "${BLUE}🧪 Verificar: https://main.ctei-manager-testing.pages.dev${NC}"