# 🎯 Instrucciones Exactas para Ver el Botón de Editar

## ⚠️ **PROBLEMA IDENTIFICADO**
El botón de editar **SÍ ESTÁ implementado** en el código, pero podría no verse por:
1. No estar usando la cuenta de administrador correcta
2. Estar viendo la vista incorrecta
3. Caché del navegador

## 🔧 **SOLUCIÓN PASO A PASO**

### **PASO 1: Limpiar Caché del Navegador**
1. Presiona **Ctrl + Shift + R** (o Cmd + Shift + R en Mac)
2. O ve a Configuración del navegador → Limpiar datos de navegación
3. Asegúrate de limpiar **caché e imágenes**

### **PASO 2: Acceder Como Administrador**
1. Ve a: https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev
2. Si ya estás logueado, haz **logout primero**
3. Haz click en **"Ingresar"**
4. Usa EXACTAMENTE estas credenciales:
   - **Email**: `admin@test.com`
   - **Password**: `admin123`
5. Confirma que el login sea exitoso

### **PASO 3: Verificar que Eres Administrador**
1. Después del login, deberías ver el menú lateral con opciones de administrador:
   ```
   📊 Dashboard
   📁 Mis Proyectos  
   🧪 Mis Productos
   👤 Mi Perfil
   👥 Gestión de Usuarios      ← DEBE APARECER (solo para admin)
   ⚙️  Todos los Proyectos      ← DEBE APARECER (solo para admin)
   🏷️  Categorías de Productos ← DEBE APARECER (solo para admin)
   ```

### **PASO 4: Ir a la Vista Correcta**
1. Haz click en **"Todos los Proyectos"** (NO "Mis Proyectos")
2. La URL debe ser algo como: `.../dashboard` con vista de admin
3. Deberías ver el título: **"Todos los Proyectos"**
4. Subtítulo: **"Administrar todos los proyectos del sistema CTeI-Manager"**

### **PASO 5: Verificar los Botones**
En la tabla de proyectos, cada fila debe tener **3 botones** en la columna "Acciones":

```
┌─────────────┬─────────────┬─────────┬────────┬─────────────────────────────┐
│ Proyecto    │ Propietario │ Estado  │ Fecha  │ Acciones                    │
├─────────────┼─────────────┼─────────┼────────┼─────────────────────────────┤
│ EcoMar 4.0  │ Dr. Carlos  │ Activo  │ Sep 11 │ [✏️] [👁️] [🗑️]            │
│             │ Rodríguez   │         │        │                             │
└─────────────┴─────────────┴─────────┴────────┴─────────────────────────────┘
```

**Orden de botones (de izquierda a derecha):**
1. **✏️ (gris)** - Editar proyecto
2. **👁️ (verde/gris)** - Publicar/Ocultar proyecto  
3. **🗑️ (rojo)** - Eliminar proyecto

### **PASO 6: Usar el Botón de Editar**
1. Haz click en el **primer botón** (✏️ ícono de lápiz)
2. Debe abrir un modal titulado: **"Editar Proyecto (Admin)"**
3. El modal debe mostrar:
   - Campos editables (Título, Resumen, etc.)
   - Panel con información del propietario original
   - Botones "Cancelar" y "Actualizar Proyecto"

---

## 🔍 **SI NO VES LOS BOTONES DE ADMIN**

### **Verifica que eres admin:**
1. Abre la consola del navegador (F12)
2. Ve a la pestaña "Console"
3. Escribe: `axios.get('/api/me')`
4. Presiona Enter
5. Deberías ver: `"role": "ADMIN"`

### **Verifica las funciones:**
En la consola del navegador, escribe:
```javascript
console.log(typeof editAdminProject);  // Debe mostrar "function"
console.log(typeof loadAdminProjects); // Debe mostrar "function"
```

### **Verifica el HTML:**
En la consola, escribe:
```javascript
document.getElementById('projectsContainer').innerHTML;
```
Deberías ver HTML con botones que contienen `onclick="editAdminProject(`

---

## 🚨 **TROUBLESHOOTING**

### **Problema: Solo veo 2 botones (👁️ 🗑️)**
- **Causa**: Estás viendo "Mis Proyectos", no "Todos los Proyectos"
- **Solución**: Haz click en "Todos los Proyectos" en el menú lateral

### **Problema: No veo opciones de admin en el menú**
- **Causa**: No estás logueado como administrador
- **Solución**: Logout y login con `admin@test.com` / `admin123`

### **Problema: Los botones no aparecen**
- **Causa**: Caché del navegador
- **Solución**: Ctrl + Shift + R para limpiar caché

### **Problema: Error al hacer login**
- **Causa**: Credenciales incorrectas
- **Solución**: Verifica email exacto: `admin@test.com` (sin espacios)

---

## 📱 **CAPTURAS DE PANTALLA ESPERADAS**

### **Vista Correcta (Todos los Proyectos):**
```
Todos los Proyectos                           [🔍 Buscar] [🔄 Limpiar]
Administrar todos los proyectos del sistema CTeI-Manager

┌─────────────────────┬──────────────┬────────┬────────┬─────────────┐
│ Proyecto            │ Propietario  │ Estado │ Fecha  │ Acciones    │
├─────────────────────┼──────────────┼────────┼────────┼─────────────┤
│ EcoMar 4.0: Sost... │ Dr. Carlos   │ Activo │ Sep 11 │ ✏️ 👁️ 🗑️    │
│ InnovaAgro: Agr...  │ Dra. María   │ Activo │ Sep 11 │ ✏️ 👁️ 🗑️    │
│ Proyecto Interno... │ Dr. Carlos   │ Borr.. │ Sep 11 │ ✏️ 👁️ 🗑️    │
└─────────────────────┴──────────────┴────────┴────────┴─────────────┘
```

### **Vista Incorrecta (Mis Proyectos):**
```
Mis Proyectos                                 [+ Nuevo Proyecto]

┌─────────────────────┬─────────────────────┐
│ Mi Proyecto         │ ✏️ 👁️              │  ← Solo 2 botones
│ Descripción...      │                     │
└─────────────────────┴─────────────────────┘
```

---

## ✅ **CONFIRMACIÓN FINAL**

Si sigues estos pasos exactos, DEBES ver el botón de editar. El código está implementado y funcionando. Si aún no lo ves después de estos pasos, entonces hay un problema específico en tu navegador o configuración.

**Credenciales de Admin:**
- Email: `admin@test.com`  
- Password: `admin123`

**URL Dashboard:** https://3000-ikn1warb4441jlaxw6wn4-6532622b.e2b.dev/dashboard

---

*El botón de editar está implementado al 100%. Estos pasos te ayudarán a encontrarlo.*