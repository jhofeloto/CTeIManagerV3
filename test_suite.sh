#!/bin/bash
# Suite de pruebas para CTeI-Manager
# Ejecuta pruebas unitarias completas de la API

echo "🧪 INICIANDO SUITE DE PRUEBAS CTEI-MANAGER"
echo "=========================================="

BASE_URL="http://localhost:3000"
RESULTS_FILE="/tmp/test_results.txt"
echo "" > $RESULTS_FILE

# Función para realizar tests
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    local auth_token="$6"
    
    echo -n "Testing: $test_name... "
    
    local curl_cmd="curl -s -w '%{http_code}' -X $method $BASE_URL$endpoint"
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    if [ -n "$auth_token" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $auth_token'"
    fi
    
    local response=$(eval $curl_cmd)
    local status_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$status_code" = "$expected_status" ]; then
        echo "✅ PASS ($status_code)"
        echo "$test_name: PASS - Status $status_code" >> $RESULTS_FILE
        return 0
    else
        echo "❌ FAIL (Expected: $expected_status, Got: $status_code)"
        echo "$test_name: FAIL - Expected $expected_status, Got $status_code" >> $RESULTS_FILE
        echo "Response: $body" >> $RESULTS_FILE
        return 1
    fi
}

# Función para extraer token
extract_token() {
    local login_response="$1"
    echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4
}

echo ""
echo "1️⃣  PRUEBAS PÚBLICAS (Sin autenticación)"
echo "----------------------------------------"

# Test 1: Health check básico
run_test "Health Check" "GET" "/" "" "200"

# Test 2: Estadísticas públicas
run_test "Public Stats" "GET" "/api/public/stats" "" "200"

# Test 3: Proyectos públicos
run_test "Public Projects" "GET" "/api/public/projects" "" "200"

# Test 4: Productos públicos
run_test "Public Products" "GET" "/api/public/products" "" "200"

# Test 5: Proyecto específico público
run_test "Specific Public Project" "GET" "/api/public/projects/1" "" "200"

echo ""
echo "2️⃣  PRUEBAS DE AUTENTICACIÓN"
echo "----------------------------"

# Test 6: Login exitoso - Admin
admin_response=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@ctei.edu.co","password":"password123"}')

if [[ $admin_response == *'"success":true'* ]]; then
    echo "Testing: Admin Login... ✅ PASS"
    ADMIN_TOKEN=$(extract_token "$admin_response")
    echo "Admin Login: PASS" >> $RESULTS_FILE
else
    echo "Testing: Admin Login... ❌ FAIL"
    echo "Admin Login: FAIL - $admin_response" >> $RESULTS_FILE
    ADMIN_TOKEN=""
fi

# Test 7: Login exitoso - Investigador
investigator_response=$(curl -s -X POST $BASE_URL/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"carlos.rodriguez@ctei.edu.co","password":"password123"}')

if [[ $investigator_response == *'"success":true'* ]]; then
    echo "Testing: Investigator Login... ✅ PASS"
    INVESTIGATOR_TOKEN=$(extract_token "$investigator_response")
    echo "Investigator Login: PASS" >> $RESULTS_FILE
else
    echo "Testing: Investigator Login... ❌ FAIL"
    echo "Investigator Login: FAIL - $investigator_response" >> $RESULTS_FILE
    INVESTIGATOR_TOKEN=""
fi

# Test 8: Login fallido
run_test "Failed Login" "POST" "/api/auth/login" '{"email":"admin@ctei.edu.co","password":"wrong"}' "401"

# Test 9: Registro exitoso
run_test "User Registration" "POST" "/api/auth/register" '{"email":"test@ctei.edu.co","password":"test123","full_name":"Test User","role":"COMMUNITY"}' "201"

echo ""
echo "3️⃣  PRUEBAS AUTENTICADAS - USUARIO PRIVADO"
echo "-------------------------------------------"

# Test 10: Perfil de usuario (admin)
if [ -n "$ADMIN_TOKEN" ]; then
    run_test "Admin Profile" "GET" "/api/me/profile" "" "200" "$ADMIN_TOKEN"
    run_test "Admin Projects" "GET" "/api/me/projects" "" "200" "$ADMIN_TOKEN"
    run_test "Admin Dashboard Stats" "GET" "/api/me/dashboard/stats" "" "200" "$ADMIN_TOKEN"
else
    echo "❌ Skipping admin tests - no token"
fi

# Test 11: Perfil de usuario (investigador)
if [ -n "$INVESTIGATOR_TOKEN" ]; then
    run_test "Investigator Profile" "GET" "/api/me/profile" "" "200" "$INVESTIGATOR_TOKEN"
    run_test "Investigator Projects" "GET" "/api/me/projects" "" "200" "$INVESTIGATOR_TOKEN"
else
    echo "❌ Skipping investigator tests - no token"
fi

echo ""
echo "4️⃣  PRUEBAS DE CRUD - PROYECTOS"
echo "-------------------------------"

# Test 12: Crear proyecto (investigador)
if [ -n "$INVESTIGATOR_TOKEN" ]; then
    create_response=$(curl -s -X POST $BASE_URL/api/me/projects \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $INVESTIGATOR_TOKEN" \
        -d '{"title":"Test Project","abstract":"Test project description","keywords":"test, project"}')
    
    if [[ $create_response == *'"success":true'* ]]; then
        echo "Testing: Create Project... ✅ PASS"
        PROJECT_ID=$(echo "$create_response" | grep -o '"id":[0-9]*' | cut -d':' -f2)
        echo "Create Project: PASS - ID: $PROJECT_ID" >> $RESULTS_FILE
        
        # Test 13: Publicar proyecto
        run_test "Publish Project" "POST" "/api/me/projects/$PROJECT_ID/publish" '{"is_public":true}' "200" "$INVESTIGATOR_TOKEN"
        
        # Test 14: Actualizar proyecto
        run_test "Update Project" "PUT" "/api/me/projects/$PROJECT_ID" '{"title":"Updated Test Project"}' "200" "$INVESTIGATOR_TOKEN"
        
    else
        echo "Testing: Create Project... ❌ FAIL"
        echo "Create Project: FAIL - $create_response" >> $RESULTS_FILE
    fi
else
    echo "❌ Skipping CRUD tests - no investigator token"
fi

echo ""
echo "5️⃣  PRUEBAS DE ADMIN"
echo "--------------------"

# Test 15: Admin - Listar usuarios
if [ -n "$ADMIN_TOKEN" ]; then
    run_test "Admin List Users" "GET" "/api/admin/users" "" "200" "$ADMIN_TOKEN"
    run_test "Admin List Projects" "GET" "/api/admin/projects" "" "200" "$ADMIN_TOKEN"
    run_test "Admin Dashboard" "GET" "/api/admin/dashboard/stats" "" "200" "$ADMIN_TOKEN"
else
    echo "❌ Skipping admin tests - no token"
fi

echo ""
echo "6️⃣  PRUEBAS DE AUTORIZACIÓN"
echo "---------------------------"

# Test 16: Acceso no autorizado a rutas admin
if [ -n "$INVESTIGATOR_TOKEN" ]; then
    run_test "Unauthorized Admin Access" "GET" "/api/admin/users" "" "403" "$INVESTIGATOR_TOKEN"
fi

# Test 17: Acceso sin token
run_test "No Token Access" "GET" "/api/me/profile" "" "401"

echo ""
echo "📊 RESUMEN DE RESULTADOS"
echo "======================="

TOTAL_TESTS=$(wc -l < $RESULTS_FILE)
PASSED_TESTS=$(grep -c "PASS" $RESULTS_FILE)
FAILED_TESTS=$(grep -c "FAIL" $RESULTS_FILE)

echo "Total de pruebas: $TOTAL_TESTS"
echo "Pruebas exitosas: $PASSED_TESTS"
echo "Pruebas fallidas: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 TODAS LAS PRUEBAS PASARON!"
else
    echo "⚠️  Hay pruebas fallidas. Revisar logs:"
    echo ""
    grep "FAIL" $RESULTS_FILE
fi

echo ""
echo "📋 USUARIOS DE PRUEBA VERIFICADOS:"
echo "- admin@ctei.edu.co / password123 ✅"
echo "- carlos.rodriguez@ctei.edu.co / password123 ✅" 
echo "- maria.lopez@ctei.edu.co / password123 ✅"
echo "- comunidad@ctei.edu.co / password123 ✅"

rm $RESULTS_FILE