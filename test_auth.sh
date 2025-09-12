#!/bin/bash

# Pruebas unitarias de autenticación para CTeI-Manager
# Ejecutar con: bash test_auth.sh

BASE_URL="http://localhost:3000"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

tests_executed=0
tests_passed=0
tests_failed=0

log() {
    local message=$1
    local type=${2:-"info"}
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case $type in
        "success")
            echo -e "${GREEN}[${timestamp}] ${message}${NC}"
            ;;
        "error")
            echo -e "${RED}[${timestamp}] ${message}${NC}"
            ;;
        "warning")
            echo -e "${YELLOW}[${timestamp}] ${message}${NC}"
            ;;
        "info")
            echo -e "${BLUE}[${timestamp}] ${message}${NC}"
            ;;
        *)
            echo "[${timestamp}] ${message}"
            ;;
    esac
}

run_test() {
    local test_name=$1
    local email=$2
    local password=$3
    local should_succeed=$4
    local expected_role=$5
    local expected_name=$6
    
    tests_executed=$((tests_executed + 1))
    
    log "🧪 Ejecutando: ${test_name}" "info"
    
    # Hacer request de login
    local response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/api/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"${email}\", \"password\": \"${password}\"}")
    
    # Separar el cuerpo de la respuesta del código HTTP
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)
    
    # Verificar si la respuesta fue exitosa según JSON
    local success=$(echo "$body" | grep -o '"success":[^,}]*' | grep -o '[^:]*$' | tr -d ' ')
    
    if [ "$should_succeed" = "true" ]; then
        # El test debería tener éxito
        if [ "$success" = "true" ]; then
            # Extraer datos del usuario
            local user_role=$(echo "$body" | grep -o '"role":"[^"]*"' | cut -d'"' -f4)
            local user_name=$(echo "$body" | grep -o '"full_name":"[^"]*"' | cut -d'"' -f4)
            local token=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
            
            # Validar rol si se especifica
            if [ -n "$expected_role" ] && [ "$user_role" != "$expected_role" ]; then
                log "❌ FAILED: ${test_name} - Rol esperado: ${expected_role}, recibido: ${user_role}" "error"
                tests_failed=$((tests_failed + 1))
                return
            fi
            
            # Validar nombre si se especifica
            if [ -n "$expected_name" ] && [ "$user_name" != "$expected_name" ]; then
                log "❌ FAILED: ${test_name} - Nombre esperado: ${expected_name}, recibido: ${user_name}" "error"
                tests_failed=$((tests_failed + 1))
                return
            fi
            
            # Probar token con endpoint protegido
            local profile_response=$(curl -s -H "Authorization: Bearer ${token}" "${BASE_URL}/api/private/profile")
            local profile_success=$(echo "$profile_response" | grep -o '"success":[^,}]*' | grep -o '[^:]*$' | tr -d ' ')
            
            if [ "$profile_success" != "true" ]; then
                log "❌ FAILED: ${test_name} - Token no válido para endpoint protegido" "error"
                tests_failed=$((tests_failed + 1))
                return
            fi
            
            log "✅ PASSED: ${test_name} - Usuario: ${user_name} (${user_role})" "success"
            tests_passed=$((tests_passed + 1))
        else
            local error_msg=$(echo "$body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
            log "❌ FAILED: ${test_name} - Login debería haber tenido éxito pero falló: ${error_msg}" "error"
            tests_failed=$((tests_failed + 1))
        fi
    else
        # El test debería fallar
        if [ "$success" != "true" ]; then
            local error_msg=$(echo "$body" | grep -o '"error":"[^"]*"' | cut -d'"' -f4)
            log "✅ PASSED: ${test_name} - Correctamente rechazado: ${error_msg}" "success"
            tests_passed=$((tests_passed + 1))
        else
            log "❌ FAILED: ${test_name} - Login debería haber fallado pero tuvo éxito" "error"
            tests_failed=$((tests_failed + 1))
        fi
    fi
}

test_endpoint_protection() {
    log "🧪 Probando protección de endpoint sin token" "info"
    
    local response=$(curl -s "${BASE_URL}/api/private/profile")
    local success=$(echo "$response" | grep -o '"success":[^,}]*' | grep -o '[^:]*$' | tr -d ' ')
    
    if [ "$success" != "true" ]; then
        log "✅ Endpoint protegido correctamente rechaza acceso sin token" "success"
    else
        log "❌ Endpoint protegido debería rechazar acceso sin token" "error"
    fi
}

# Función principal
main() {
    log "🎯 Iniciando pruebas unitarias de autenticación CTeI-Manager" "info"
    
    # Probar conexión al servidor
    if ! curl -s --max-time 5 "${BASE_URL}/" > /dev/null 2>&1; then
        log "❌ No se puede conectar al servidor. Asegúrate de que esté ejecutándose." "error"
        exit 1
    fi
    
    log "✅ Conexión al servidor establecida" "success"
    
    # Ejecutar pruebas de login
    run_test "Login Admin Válido" "admin@test.com" "admin123" "true" "ADMIN" "Admin CTeI"
    run_test "Login Investigador Válido" "carlos.rodriguez@ctei.edu.co" "password123" "true" "INVESTIGATOR" "Dr. Carlos Rodríguez"
    run_test "Login Email Incorrecto" "noexiste@test.com" "password123" "false"
    run_test "Login Password Incorrecto" "admin@test.com" "wrongpassword" "false"
    run_test "Login Campos Vacíos" "" "" "false"
    run_test "Login Email Vacío" "" "admin123" "false"
    run_test "Login Password Vacío" "admin@test.com" "" "false"
    
    # Probar protección de endpoints
    test_endpoint_protection
    
    # Reporte final
    echo
    log "📊 REPORTE FINAL:" "info"
    log "📋 Pruebas ejecutadas: ${tests_executed}" "info"
    log "✅ Pruebas exitosas: ${tests_passed}" "success"
    log "❌ Pruebas fallidas: ${tests_failed}" "$([ $tests_failed -gt 0 ] && echo "error" || echo "info")"
    
    if [ $tests_executed -gt 0 ]; then
        local success_rate=$(( (tests_passed * 100) / tests_executed ))
        log "📈 Tasa de éxito: ${success_rate}%" "$([ $success_rate -ge 90 ] && echo "success" || echo "warning")"
    fi
    
    if [ $tests_failed -eq 0 ]; then
        log "🎉 ¡Todas las pruebas pasaron exitosamente!" "success"
        exit 0
    else
        log "⚠️  Algunas pruebas fallaron. Revisa los errores anteriores." "warning"
        exit 1
    fi
}

# Ejecutar pruebas
main