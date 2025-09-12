#!/bin/bash

# Prueba de autenticación frontend - Simular comportamientos del formulario
# Este script verifica que no haya bypass de autenticación

BASE_URL="http://localhost:3000"

log() {
    local message=$1
    local type=${2:-"info"}
    local timestamp=$(date '+%H:%M:%S')
    
    case $type in
        "success") echo -e "\033[0;32m[${timestamp}] ✅ ${message}\033[0m" ;;
        "error")   echo -e "\033[0;31m[${timestamp}] ❌ ${message}\033[0m" ;;
        "info")    echo -e "\033[0;34m[${timestamp}] ℹ️  ${message}\033[0m" ;;
    esac
}

# Simular diferentes tipos de requests que podrían venir del frontend
test_scenarios() {
    log "Probando escenarios de autenticación frontend" "info"
    
    # Escenario 1: Campos completamente vacíos
    log "Escenario 1: Campos completamente vacíos" "info"
    local response1=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "", "password": ""}')
    
    if echo "$response1" | grep -q '"success":false'; then
        log "Campos vacíos correctamente rechazados" "success"
    else
        log "ERROR: Campos vacíos no fueron rechazados" "error"
    fi
    
    # Escenario 2: Solo email vacío
    log "Escenario 2: Solo email vacío" "info"
    local response2=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "", "password": "somepassword"}')
    
    if echo "$response2" | grep -q '"success":false'; then
        log "Email vacío correctamente rechazado" "success"
    else
        log "ERROR: Email vacío no fue rechazado" "error"
    fi
    
    # Escenario 3: Solo password vacío
    log "Escenario 3: Solo password vacío" "info"
    local response3=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "some@email.com", "password": ""}')
    
    if echo "$response3" | grep -q '"success":false'; then
        log "Password vacío correctamente rechazado" "success"
    else
        log "ERROR: Password vacío no fue rechazado" "error"
    fi
    
    # Escenario 4: Campos null
    log "Escenario 4: Campos null" "info"
    local response4=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": null, "password": null}')
    
    if echo "$response4" | grep -q '"success":false'; then
        log "Campos null correctamente rechazados" "success"
    else
        log "ERROR: Campos null no fueron rechazados" "error"
    fi
    
    # Escenario 5: Request sin campos
    log "Escenario 5: Request sin campos" "info"
    local response5=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{}')
    
    if echo "$response5" | grep -q '"success":false'; then
        log "Request sin campos correctamente rechazado" "success"
    else
        log "ERROR: Request sin campos no fue rechazado" "error"
    fi
    
    # Escenario 6: Credenciales correctas (debe funcionar)
    log "Escenario 6: Credenciales correctas" "info"
    local response6=$(curl -s -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email": "admin@test.com", "password": "admin123"}')
    
    if echo "$response6" | grep -q '"success":true'; then
        log "Credenciales correctas funcionan" "success"
    else
        log "ERROR: Credenciales correctas no funcionan" "error"
    fi
}

# Verificar que no existan rutas de bypass
test_bypass_attempts() {
    log "Probando intentos de bypass de autenticación" "info"
    
    # Intento 1: Acceso directo a endpoints protegidos
    local profile_response=$(curl -s "${BASE_URL}/api/private/profile")
    if echo "$profile_response" | grep -q '"success":false'; then
        log "Acceso sin token correctamente bloqueado" "success"
    else
        log "ERROR: Acceso sin token no fue bloqueado" "error"
    fi
    
    # Intento 2: Token inválido
    local invalid_token_response=$(curl -s -H "Authorization: Bearer invalid_token" "${BASE_URL}/api/private/profile")
    if echo "$invalid_token_response" | grep -q '"success":false'; then
        log "Token inválido correctamente rechazado" "success"
    else
        log "ERROR: Token inválido no fue rechazado" "error"
    fi
}

# Función principal
main() {
    log "🎯 Iniciando pruebas de seguridad de autenticación frontend" "info"
    
    # Verificar conectividad
    if ! curl -s --max-time 5 "${BASE_URL}/" > /dev/null 2>&1; then
        log "No se puede conectar al servidor" "error"
        exit 1
    fi
    
    test_scenarios
    test_bypass_attempts
    
    log "🎉 Pruebas de seguridad completadas" "success"
}

main