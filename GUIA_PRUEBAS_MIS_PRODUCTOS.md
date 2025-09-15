# 🧪 GUÍA DE PRUEBAS - MIS PRODUCTOS

## 🌐 URL Base del Sistema
**https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev**

## 🔐 Credenciales de Acceso

### 👤 **Usuario Investigador (3 productos)**
- **Email:** `investigador@demo.com`
- **Password:** `investigador123`
- **Rol:** INVESTIGATOR
- **Productos esperados:** 3 productos propios

### 👤 **Usuario Administrador (5 productos)**
- **Email:** `admin@demo.com`
- **Password:** `admin123`
- **Rol:** ADMIN
- **Productos esperados:** Todos los productos del sistema

## 📋 PLAN DE PRUEBAS PASO A PASO

### **FASE 1: Acceso a la Funcionalidad**

#### ✅ **Paso 1.1: Login y Navegación**
1. Ir a: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev
2. Hacer clic en **"Iniciar Sesión"**
3. Usar credenciales de **investigador@demo.com / investigador123**
4. Verificar redirección al dashboard
5. En el menú lateral, hacer clic en **"Mis Productos"** (icono de cubos)

#### ✅ **Resultado Esperado:**
- ✅ Login exitoso
- ✅ Dashboard carga correctamente
- ✅ Menú lateral visible con opción "Mis Productos"
- ✅ Navegación a vista de productos funciona

### **FASE 2: Verificación de Datos**

#### ✅ **Paso 2.1: Lista de Productos del Investigador**
**Con usuario:** `investigador@demo.com`

**Productos esperados:**
1. **ART-001-2024** - Artículo científico: Algoritmos de IA para especies marinas
   - Tipo: ARTICULO
   - Proyecto: IA para Conservación Marina del Pacífico
   - Estado: Público ✅

2. **SW-001-2024** - Plataforma web de monitoreo con IA
   - Tipo: SOFTWARE
   - Proyecto: IA para Conservación Marina del Pacífico
   - Estado: Público ✅

3. **DS-001-2024** - Dataset de sensores IoT de Quibdó
   - Tipo: DATASET
   - Proyecto: Redes IoT para Ciudades Inteligentes
   - Estado: Público ✅

#### ✅ **Paso 2.2: Lista de Productos del Admin**
1. **Cerrar sesión** (botón en menú superior)
2. **Login con:** `admin@demo.com / admin123`
3. **Navegar a:** "Mis Productos"

**Productos esperados (5 total):**
- Los 3 del investigador +
- **ART-002-2024** - Blockchain para trazabilidad agrícola
- **PROT-001-2024** - Prototipo blockchain (PRIVADO ❌)

### **FASE 3: Funcionalidades de Filtrado**

#### ✅ **Paso 3.1: Filtro por Estado**
1. En "Mis Productos", localizar **filtros superiores**
2. En "Estado", seleccionar **"Públicos"**
3. Verificar que solo aparezcan productos públicos
4. Cambiar a **"Privados"** (solo admin verá el prototipo)
5. Cambiar a **"Todos los estados"**

#### ✅ **Paso 3.2: Filtro por Categoría**
1. Abrir filtro **"Categoría"**
2. Seleccionar **"Artículo Científico"** 
3. Verificar que solo aparezcan artículos (ART-001-2024, ART-002-2024)
4. Seleccionar **"Software Científico"**
5. Verificar que aparezca SW-001-2024

#### ✅ **Paso 3.3: Búsqueda por Texto**
1. En el campo **"Buscar productos..."**
2. Escribir **"IA"**
3. Verificar que aparezcan productos relacionados con IA
4. Escribir **"blockchain"**
5. Verificar que aparezcan productos de blockchain
6. Borrar búsqueda para ver todos

### **FASE 4: Acciones sobre Productos**

#### ✅ **Paso 4.1: Ver Detalles de Producto**
1. Hacer clic en **cualquier producto** de la lista
2. Verificar que aparezca **información detallada**:
   - Código del producto
   - Descripción completa
   - Información del proyecto asociado
   - Categoría y metadatos
   - Enlaces (DOI, URL si existen)

#### ✅ **Paso 4.2: Botón "Nuevo Producto"**
1. Hacer clic en **"Nuevo Producto"** (botón superior derecho)
2. Verificar que aparezca **modal o formulario** de creación
3. **No completar** - solo verificar que la interfaz funciona

### **FASE 5: Casos Límite**

#### ✅ **Paso 5.1: Usuario sin Productos**
1. **Login con:** `community@demo.com / demo123`
2. Navegar a **"Mis Productos"**
3. Verificar **estado vacío** con mensaje apropiado

#### ✅ **Paso 5.2: Filtros sin Resultados**
1. **Con investigador loggeado**
2. Buscar texto que **no exista** (ej: "xyz123")
3. Verificar mensaje de **"sin resultados"**

### **FASE 6: Navegación y Enlaces**

#### ✅ **Paso 6.1: Enlaces de Proyecto**
1. En cualquier producto, hacer clic en **nombre del proyecto**
2. Verificar navegación a **vista del proyecto**
3. Usar **botón "Atrás"** para regresar

#### ✅ **Paso 6.2: Enlaces Externos**
1. Si un producto tiene **DOI o URL**, verificar que sean **enlaces clicables**
2. Verificar que abran en **nueva pestaña**

## 🔍 APIs PARA PRUEBAS TÉCNICAS

### **Endpoint Principal:**
```bash
GET /api/private/products
Authorization: Bearer [TOKEN]
```

### **Endpoints Relacionados:**
```bash
GET /api/public/product-categories
GET /api/private/products/search?q=[TÉRMINO]
GET /api/private/projects/:id/products
```

### **Obtener Token de Prueba:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "investigador@demo.com", "password": "investigador123"}'
```

## ✅ CHECKLIST DE VERIFICACIÓN

### **Funcionalidad Básica**
- [ ] Login y navegación a "Mis Productos" funciona
- [ ] Lista de productos se carga correctamente
- [ ] Productos muestran información completa
- [ ] Diferencia entre usuario investigador (3) y admin (5)

### **Filtros y Búsqueda**
- [ ] Filtro por estado (público/privado) funciona
- [ ] Filtro por categoría funciona
- [ ] Búsqueda de texto funciona
- [ ] Combinación de filtros funciona

### **Interfaz y UX**
- [ ] Botones y enlaces son clicables
- [ ] Estados de carga aparecen apropiadamente
- [ ] Estados vacíos tienen mensajes claros
- [ ] Navegación entre vistas es fluida

### **Permisos y Seguridad**
- [ ] Investigador solo ve sus productos
- [ ] Admin ve todos los productos
- [ ] Usuario community tiene acceso limitado
- [ ] Productos privados se manejan correctamente

## 🚨 PROBLEMAS CONOCIDOS Y SOLUCIONES

### **Si no aparecen productos:**
1. Verificar que el **login sea exitoso**
2. Comprobar **token de autenticación** en DevTools
3. Revisar **consola del navegador** para errores

### **Si los filtros no funcionan:**
1. **Recargar la página** completamente
2. Verificar que los **datos se hayan cargado**
3. Comprobar **red en DevTools**

### **Para depuración:**
1. Abrir **DevTools** (F12)
2. Ver pestaña **"Console"** para logs
3. Ver pestaña **"Network"** para llamadas API
4. Verificar **localStorage** para token

---

**🎯 Esta guía cubre todos los aspectos críticos de la funcionalidad "Mis Productos". Completar todos los pasos garantiza que la funcionalidad está operativa al 100%.**