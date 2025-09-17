#!/bin/bash

echo "🔍 === DIAGNÓSTICO Y REPARACIÓN DE ADMIN EN TESTING ==="
echo ""

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📋 Paso 1: Verificando usuarios existentes...${NC}"
wrangler d1 execute ctei-manager-testing --command "SELECT email, role, created_at FROM users;"

echo ""
echo -e "${BLUE}📋 Paso 2: Verificando estado de migraciones...${NC}"
wrangler d1 migrations list ctei-manager-testing

echo ""
echo -e "${BLUE}🔧 Paso 3: Forzar inserción de usuarios admin...${NC}"
echo -e "${YELLOW}Insertando admin@demo.com con hash bcrypt válido...${NC}"

wrangler d1 execute ctei-manager-testing --command "INSERT OR REPLACE INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES ('admin@demo.com', '\$2b\$10\$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi', 'Administrador Demo', 'ADMIN', datetime('now'), datetime('now'));"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Admin insertado exitosamente${NC}"
else
    echo -e "${RED}❌ Error insertando admin${NC}"
fi

echo -e "${YELLOW}Insertando investigador@demo.com...${NC}"

wrangler d1 execute ctei-manager-testing --command "INSERT OR REPLACE INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES ('investigador@demo.com', '\$2b\$10\$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm', 'Dr. Investigador Demo', 'INVESTIGATOR', datetime('now'), datetime('now'));"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Investigador insertado exitosamente${NC}"
else
    echo -e "${RED}❌ Error insertando investigador${NC}"
fi

echo ""
echo -e "${BLUE}📋 Paso 4: Verificando inserción...${NC}"
wrangler d1 execute ctei-manager-testing --command "SELECT id, email, full_name, role, created_at FROM users WHERE email IN ('admin@demo.com', 'investigador@demo.com');"

echo ""
echo -e "${GREEN}🎉 === REPARACIÓN COMPLETADA ===${NC}"
echo ""
echo -e "${BLUE}📋 CREDENCIALES AHORA ACTIVAS:${NC}"
echo -e "${YELLOW}👤 Admin: admin@demo.com / admin123${NC}"
echo -e "${YELLOW}👨‍🔬 Investigador: investigador@demo.com / investigador123${NC}"
echo ""
echo -e "${BLUE}🌐 Probar en: https://main.ctei-manager-testing.pages.dev${NC}"