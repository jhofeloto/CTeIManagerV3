#!/bin/bash

# Script para deployment completo con activación de usuario administrador
# Este script asegura que el admin quede activo después del deployment

echo "🚀 === DEPLOYMENT CON ACTIVACIÓN DE ADMINISTRADOR ==="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Paso 1: Compilando aplicación...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en la compilación. Abortando deployment.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Compilación exitosa${NC}"
echo ""

echo -e "${BLUE}🗄️ Paso 2: Aplicando migraciones en producción...${NC}"
echo -e "${YELLOW}⚠️  IMPORTANTE: Esto activará el usuario administrador${NC}"
npm run db:migrate:prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error aplicando migraciones. Abortando deployment.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Migraciones aplicadas exitosamente${NC}"
echo ""

echo -e "${BLUE}☁️ Paso 3: Deploying a Cloudflare Pages...${NC}"
npm run deploy:prod

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Error en deployment. Revisa logs de Cloudflare.${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}🎉 === DEPLOYMENT COMPLETADO EXITOSAMENTE ===${NC}"
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
echo -e "${GREEN}✅ El administrador ya puede acceder al sistema en producción${NC}"