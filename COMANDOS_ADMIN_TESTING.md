# 🔧 Comandos para Reparar Admin en Testing

## 🚨 Problema Identificado
El mensaje "✅ No migrations to apply!" indica que las migraciones están aplicadas pero **la migración 0009 no se ejecutó correctamente** o ya existían migraciones previas.

## 🔍 Diagnóstico Manual

### 1. Verificar usuarios actuales:
```bash
wrangler d1 execute ctei-manager-testing --command "SELECT email, role, created_at FROM users;"
```

### 2. Ver estado de migraciones:
```bash
wrangler d1 migrations list ctei-manager-testing
```

### 3. Ver todas las migraciones disponibles:
```bash
ls -la migrations/
```

## 🛠️ Solución: Inserción Manual Directa

### Opción 1: Script Automático
```bash
./fix-admin-testing.sh
```

### Opción 2: Comandos Manuales

#### Insertar Admin:
```bash
wrangler d1 execute ctei-manager-testing --command "INSERT OR REPLACE INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES ('admin@demo.com', '\$2b\$10\$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi', 'Administrador Demo', 'ADMIN', datetime('now'), datetime('now'));"
```

#### Insertar Investigador:
```bash
wrangler d1 execute ctei-manager-testing --command "INSERT OR REPLACE INTO users (email, password_hash, full_name, role, created_at, updated_at) VALUES ('investigador@demo.com', '\$2b\$10\$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm', 'Dr. Investigador Demo', 'INVESTIGATOR', datetime('now'), datetime('now'));"
```

#### Verificar inserción:
```bash
wrangler d1 execute ctei-manager-testing --command "SELECT id, email, full_name, role FROM users;"
```

## 🔑 Hashes Bcrypt Validados
- **admin123** → `$2b$10$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi`
- **investigador123** → `$2b$10$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm`

Estos hashes están validados en `src/utils/jwt.ts` líneas 147-175.

## 🎯 Resultado Esperado
Después de ejecutar los comandos:
```
id|email|full_name|role
1|admin@demo.com|Administrador Demo|ADMIN
2|investigador@demo.com|Dr. Investigador Demo|INVESTIGATOR
```

## ⚠️ Por Qué Falló la Migración
Posibles causas:
1. **Base de datos pre-existente**: La BD ya tenía migraciones pero no la 0009
2. **Tracking de migraciones**: Wrangler considera que todas están aplicadas
3. **Orden de migraciones**: La 0009 no se detectó como nueva

## 🚀 Solución Permanente
Una vez que funcione manualmente, para futuros deploys usa:
```bash
# Después de git pull y antes de build
./fix-admin-testing.sh
npm run build
wrangler pages deploy dist --project-name ctei-manager-testing --commit-dirty=true
```

## 🔍 Troubleshooting Adicional

### Si sigue sin funcionar, verificar contraseña:
```bash
wrangler d1 execute ctei-manager-testing --command "SELECT email, password_hash FROM users WHERE email='admin@demo.com';"
```

### Limpiar y recrear BD (⚠️ BORRA TODOS LOS DATOS):
```bash
wrangler d1 delete ctei-manager-testing
wrangler d1 create ctei-manager-testing
wrangler d1 migrations apply ctei-manager-testing
```

¡Ejecuta el script de reparación y podrás acceder inmediatamente! 🎉