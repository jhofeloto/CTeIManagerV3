# 🧪 Deployment Testing con Administrador Activo

## 🚨 El Problema que Tenías
Tu método anterior **NO aplicaba la migración** que crea el usuario administrador. Por eso no funcionaba el login.

## ✅ Solución: Tu Método + Migración

### Opción 1: Script Automatizado (RECOMENDADO)
```bash
# En ~/CodectiChocoV2-testing
./deploy-testing-with-admin.sh
```

### Opción 2: Tu Método Manual Actualizado
```bash
# 1.1 Ir a carpeta de testing
cd ~/CodectiChocoV2-testing

# 1.2 Obtener última versión de GitHub (AHORA INCLUYE LA MIGRACIÓN)
git pull origin main

# 1.3 Configurar para testing
cp wrangler.testing.jsonc wrangler.jsonc

# 1.4 ⭐ NUEVO PASO CRÍTICO: Aplicar migración que crea admin
wrangler d1 migrations apply ctei-manager-testing

# 1.5 Build
npm run build

# 1.6 Deploy a testing
wrangler pages deploy dist --project-name ctei-manager-testing --commit-dirty=true

# 1.7 Verificar
echo "🧪 Testing: https://main.ctei-manager-testing.pages.dev"
```

## 🔑 Lo Que Cambiaste que Faltaba

**ANTES (No funcionaba):**
```bash
git pull origin main
cp wrangler.testing.jsonc wrangler.jsonc  
npm run build
wrangler pages deploy dist --project-name ctei-manager-testing --commit-dirty=true
```

**AHORA (Funciona):**
```bash
git pull origin main
cp wrangler.testing.jsonc wrangler.jsonc  
wrangler d1 migrations apply ctei-manager-testing  # ← ¡ESTO ES LO QUE FALTABA!
npm run build
wrangler pages deploy dist --project-name ctei-manager-testing --commit-dirty=true
```

## 🔧 Qué Hace la Migración
El comando `wrangler d1 migrations apply ctei-manager-testing` ejecuta `migrations/0009_insert_admin_user.sql` que:

```sql
INSERT OR IGNORE INTO users (email, password_hash, full_name, role) VALUES 
('admin@demo.com', '$2b$10$D17E9JIeVicUsCATia4tOuLWliEFbrDlanp06g1CYYy0tGciN1fKi', 'Administrador Demo', 'ADMIN');
```

## 🎯 Credenciales Activas Después del Deploy

**👤 Administrador:**
- Email: `admin@demo.com`
- Password: `admin123`
- URL: https://main.ctei-manager-testing.pages.dev

**👨‍🔬 Investigador:**  
- Email: `investigador@demo.com`
- Password: `investigador123`

## 🔍 Verificación Manual
Si quieres verificar que el admin se creó:
```bash
wrangler d1 execute ctei-manager-testing --command "SELECT email, role FROM users;"
```

## ⚠️ Notas Importantes
1. **La migración es idempotente**: Puedes ejecutarla múltiples veces sin problemas
2. **Usa INSERT OR IGNORE**: No duplica usuarios si ya existen  
3. **El hash bcrypt está validado**: El sistema reconoce la password 'admin123'
4. **Funciona en testing Y producción**: Mismo proceso para ambos

## 🚀 Para Producción
Cuando quieras ir a producción, usa el mismo proceso pero:
```bash
wrangler d1 migrations apply ctei-manager-production
wrangler pages deploy dist --project-name ctei-manager
```

¡Ahora tu método funcionará perfectamente con el administrador activo! 🎉