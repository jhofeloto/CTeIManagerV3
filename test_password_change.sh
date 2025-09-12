#!/bin/bash

# Test para cambio de contraseña de administrador

echo "🔐 Probando funcionalidad de cambio de contraseña de administrador"

# 1. Login como administrador
echo "1. 🔑 Login como administrador..."
ADMIN_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@test.com", "password": "admin123"}')

echo "Respuesta login admin: $ADMIN_LOGIN"

ADMIN_TOKEN=$(echo $ADMIN_LOGIN | jq -r '.data.token // empty')

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Error: No se pudo obtener token de admin"
  exit 1
fi

echo "✅ Token de admin obtenido correctamente"

# 2. Obtener lista de usuarios para encontrar el ID del investigador
echo "2. 👥 Obteniendo lista de usuarios..."
USERS_RESPONSE=$(curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  http://localhost:3000/api/admin/users?limit=10)

echo "Usuarios encontrados:"
echo $USERS_RESPONSE | jq '.data.users[] | {id: .id, email: .email, full_name: .full_name, role: .role}'

# Buscar el ID del investigador
INVESTIGATOR_ID=$(echo $USERS_RESPONSE | jq -r '.data.users[] | select(.email == "investigador.test@choco.gov.co") | .id // empty')

if [ -z "$INVESTIGATOR_ID" ]; then
  echo "❌ Error: No se encontró el usuario investigador.test@choco.gov.co"
  exit 1
fi

echo "✅ Investigador encontrado con ID: $INVESTIGATOR_ID"

# 3. Cambiar contraseña del investigador
echo "3. 🔧 Cambiando contraseña del investigador..."
PASSWORD_CHANGE_RESPONSE=$(curl -s -X PUT \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"new_password": "NuevaPassword2024!"}' \
  http://localhost:3000/api/admin/users/$INVESTIGATOR_ID/password)

echo "Respuesta cambio de contraseña: $PASSWORD_CHANGE_RESPONSE"

# Verificar si fue exitoso
SUCCESS=$(echo $PASSWORD_CHANGE_RESPONSE | jq -r '.success // false')

if [ "$SUCCESS" = "true" ]; then
  echo "✅ Contraseña cambiada exitosamente"
  
  # 4. Probar login con nueva contraseña
  echo "4. 🧪 Probando login con nueva contraseña..."
  NEW_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "investigador.test@choco.gov.co", "password": "NuevaPassword2024!"}')
  
  echo "Login con nueva contraseña: $NEW_LOGIN"
  
  NEW_SUCCESS=$(echo $NEW_LOGIN | jq -r '.success // false')
  
  if [ "$NEW_SUCCESS" = "true" ]; then
    echo "✅ Login con nueva contraseña exitoso"
    
    # 5. Restaurar contraseña original
    echo "5. 🔄 Restaurando contraseña original..."
    RESTORE_RESPONSE=$(curl -s -X PUT \
      -H "Authorization: Bearer $ADMIN_TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"new_password": "ChocoCTeI2024"}' \
      http://localhost:3000/api/admin/users/$INVESTIGATOR_ID/password)
    
    echo "Restauración: $RESTORE_RESPONSE"
    
    RESTORE_SUCCESS=$(echo $RESTORE_RESPONSE | jq -r '.success // false')
    
    if [ "$RESTORE_SUCCESS" = "true" ]; then
      echo "✅ Contraseña original restaurada"
      
      # 6. Verificar login con contraseña original
      echo "6. ✔️ Verificando login con contraseña original..."
      ORIGINAL_LOGIN=$(curl -s -X POST http://localhost:3000/api/auth/login \
        -H "Content-Type: application/json" \
        -d '{"email": "investigador.test@choco.gov.co", "password": "ChocoCTeI2024"}')
      
      ORIGINAL_SUCCESS=$(echo $ORIGINAL_LOGIN | jq -r '.success // false')
      
      if [ "$ORIGINAL_SUCCESS" = "true" ]; then
        echo "✅ ¡TODAS LAS PRUEBAS EXITOSAS!"
        echo "🎉 Funcionalidad de cambio de contraseña funcionando correctamente"
        exit 0
      else
        echo "❌ Error: No se pudo hacer login con contraseña original"
        exit 1
      fi
    else
      echo "❌ Error restaurando contraseña original"
      exit 1
    fi
  else
    echo "❌ Error: No se pudo hacer login con nueva contraseña"
    exit 1
  fi
else
  echo "❌ Error cambiando contraseña"
  exit 1
fi