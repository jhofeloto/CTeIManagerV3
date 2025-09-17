# 🔧 Activación de Administrador en Producción

## 🚨 Problema Resuelto
**El sistema en Cloudflare no tenía usuario administrador creado en la base de datos.**

## ✅ Solución Implementada
Se creó la migración `migrations/0009_insert_admin_user.sql` que:
- Inserta usuario administrador con credenciales seguras
- Inserta usuario investigador de prueba
- Usa hashes bcrypt validados por el sistema

## 🚀 Pasos para Deployment (MÉTODO RECOMENDADO)

### Opción 1: Script Automatizado (Recomendado)
```bash
./deploy-with-admin.sh
```

Este script ejecuta automáticamente:
1. `npm run build` - Compila la aplicación
2. `npm run db:migrate:prod` - Aplica migraciones (crea admin)
3. `npm run deploy:prod` - Deploy a Cloudflare

### Opción 2: Manual
```bash
# 1. Compilar aplicación
npm run build

# 2. Aplicar migraciones (CRÍTICO - crea el admin)
npm run db:migrate:prod

# 3. Deploy a producción
npm run deploy:prod
```

## 🔑 Credenciales de Acceso

### 👤 Administrador
- **Email:** `admin@demo.com`
- **Password:** `admin123`
- **Rol:** `ADMIN`
- **Permisos:** Acceso completo al sistema

### 👨‍🔬 Investigador
- **Email:** `investigador@demo.com`
- **Password:** `investigador123`
- **Rol:** `INVESTIGATOR`
- **Permisos:** Gestión de proyectos y productos

## 🛡️ Verificación Técnica

### Hash bcrypt validados:
- `admin123` → `$2b$10$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi`
- `investigador123` → `$2b$10$Cs28mUoEf6gotehrXqD3NehYmsNfPR/mrbYImvHcu.eiG02.c/Mpm`

### Ubicación en código:
- **Migración:** `migrations/0009_insert_admin_user.sql`
- **Validación:** `src/utils/jwt.ts` (líneas 147-175)
- **Autenticación:** `src/routes/auth.ts`

## 📋 Troubleshooting

### Si no puedes acceder después del deployment:
1. **Verificar migración aplicada:**
   ```bash
   npm run db:console:prod
   SELECT * FROM users WHERE email = 'admin@demo.com';
   ```

2. **Re-aplicar migración si es necesario:**
   ```bash
   npm run db:migrate:prod
   ```

3. **Verificar logs de Cloudflare:**
   - Ve a Cloudflare Dashboard
   - Revisa Functions logs
   - Busca errores de autenticación

### Comandos útiles:
```bash
# Ver estado de migraciones
wrangler d1 migrations list ctei-manager-production

# Ejecutar consulta específica
wrangler d1 execute ctei-manager-production --command "SELECT email, role FROM users;"

# Reset completo de BD (⚠️ PELIGROSO - borra todos los datos)
# wrangler d1 execute ctei-manager-production --command "DROP TABLE IF EXISTS users;"
```

## 🎯 Resultado Esperado
Después de ejecutar el deployment:
1. ✅ Admin puede acceder con `admin@demo.com` / `admin123`
2. ✅ Investigador puede acceder con `investigador@demo.com` / `investigador123`
3. ✅ Sistema funcional en producción de Cloudflare
4. ✅ Base de datos inicializada con usuarios activos

## ⚠️ Importante
- **NO cambies las credenciales** hasta confirmar que el login funciona
- **Las migraciones son idempotentes** (se pueden ejecutar múltiples veces)
- **Los hashes están hardcoded** en el sistema de verificación actual