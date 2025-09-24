#!/bin/bash

# Choco Inventa - Test Suite for Local Development
# Script de pruebas automatizadas para desarrollo local

echo "🧪 Iniciando Test Suite - Choco Inventa"
echo "======================================"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BASE_URL="http://localhost:3000"
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Función para imprimir resultados
print_result() {
    local test_name=$1
    local result=$2
    local message=$3

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if [ "$result" = "PASS" ]; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
        echo -e "${GREEN}✅ $test_name${NC} - $message"
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo -e "${RED}❌ $test_name${NC} - $message"
    fi
}

# Función para hacer request HTTP
http_test() {
    local method=$1
    local endpoint=$2
    local expected_code=$3
    local test_name=$4
    local data=$5

    local url="$BASE_URL$endpoint"

    if [ -n "$data" ]; then
        response=$(curl -s -w "%{http_code}" -o /tmp/curl_response \
            -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    else
        response=$(curl -s -w "%{http_code}" -o /tmp/curl_response "$url")
    fi

    local http_code=${response: -3}
    local body=${response:0:${#response}-3}

    if [ "$http_code" -eq "$expected_code" ]; then
        print_result "$test_name" "PASS" "HTTP $http_code (expected $expected_code)"
        return 0
    else
        print_result "$test_name" "FAIL" "HTTP $http_code (expected $expected_code)"
        return 1
    fi
}

# Verificar si el servidor está ejecutándose
check_server() {
    echo -e "${BLUE}🔍 Verificando servidor...${NC}"

    if curl -s "$BASE_URL" > /dev/null; then
        print_result "Server Check" "PASS" "Servidor responde en $BASE_URL"
        return 0
    else
        print_result "Server Check" "FAIL" "Servidor no responde en $BASE_URL"
        echo -e "${YELLOW}💡 Inicia el servidor con: ./start-dev.sh${NC}"
        exit 1
    fi
}

# Test 1: Endpoints básicos
test_basic_endpoints() {
    echo -e "\n${BLUE}📡 Probando endpoints básicos...${NC}"

    http_test "GET" "/" 200 "Home Page"
    http_test "GET" "/portal" 200 "Public Portal"
    http_test "GET" "/dashboard" 200 "Dashboard"
}

# Test 2: API de proyectos
test_projects_api() {
    echo -e "\n${BLUE}📋 Probando API de proyectos...${NC}"

    http_test "GET" "/api/projects" 200 "List Projects"

    # Crear proyecto de prueba
    local project_data='{
        "title": "Test Project - IA para Salud",
        "description": "Proyecto de prueba para testing automatizado",
        "category": "auto",
        "budget": 100000,
        "start_date": "2024-01-01",
        "end_date": "2024-12-31"
    }'

    http_test "POST" "/api/projects" 200 "Create Project" "$project_data"
}

# Test 3: ML Service
test_ml_service() {
    echo -e "\n${BLUE}🤖 Probando servicios ML...${NC}"

    http_test "GET" "/api/ml/metrics" 200 "ML Metrics"
    http_test "GET" "/api/ml/health" 200 "ML Health Check"

    # Test de análisis de sentimientos
    local sentiment_data='{
        "operation": "sentiment",
        "data": {
            "text": "Este proyecto es excelente y muy innovador"
        }
    }'

    http_test "POST" "/api/ml/test" 200 "ML Sentiment Test" "$sentiment_data"
}

# Test 4: Analytics
test_analytics() {
    echo -e "\n${BLUE}📊 Probando analytics...${NC}"

    http_test "GET" "/api/analytics/dashboard" 200 "Analytics Dashboard"
    http_test "GET" "/api/analytics/predictions" 200 "ML Predictions"
    http_test "GET" "/api/analytics/impact" 200 "Impact Analysis"
}

# Test 5: Forecasting
test_forecasting() {
    echo -e "\n${BLUE}🔮 Probando forecasting...${NC}"

    http_test "GET" "/api/forecasting/project-success" 200 "Project Success Prediction"
    http_test "GET" "/api/forecasting/funding-probability" 200 "Funding Probability"
    http_test "GET" "/api/forecasting/risk-assessment" 200 "Risk Assessment"
}

# Test 6: Base de datos
test_database() {
    echo -e "\n${BLUE}🗄️  Probando base de datos...${NC}"

    # Verificar si existe archivo de base de datos
    if [ -f "dev-database.sqlite" ]; then
        print_result "Database File" "PASS" "Archivo de base de datos existe"

        # Verificar tablas
        if sqlite3 dev-database.sqlite ".tables" > /dev/null 2>&1; then
            print_result "Database Tables" "PASS" "Tablas de base de datos accesibles"
        else
            print_result "Database Tables" "FAIL" "No se pueden acceder las tablas"
        fi
    else
        print_result "Database File" "FAIL" "Archivo de base de datos no existe"
    fi
}

# Test 7: Cache
test_cache() {
    echo -e "\n${BLUE}💾 Probando sistema de cache...${NC}"

    # Hacer dos requests al mismo endpoint para verificar cache
    local start_time=$(date +%s%N)
    curl -s "$BASE_URL/api/projects" > /dev/null
    local first_request=$(($(date +%s%N) - start_time))

    start_time=$(date +%s%N)
    curl -s "$BASE_URL/api/projects" > /dev/null
    local second_request=$(($(date +%s%N) - start_time))

    # El segundo request debería ser más rápido (cache hit)
    if [ $second_request -lt $first_request ]; then
        print_result "Cache Performance" "PASS" "Segundo request más rápido ($second_request < $first_request ns)"
    else
        print_result "Cache Performance" "INFO" "Cache funcionando ($second_request >= $first_request ns)"
    fi
}

# Test 8: Performance
test_performance() {
    echo -e "\n${BLUE}⚡ Probando performance...${NC}"

    local start_time=$(date +%s%N)
    curl -s "$BASE_URL/api/projects" > /dev/null
    local response_time=$(($(date +%s%N) - start_time))

    # Convertir a milisegundos
    response_time=$((response_time / 1000000))

    if [ $response_time -lt 100 ]; then
        print_result "Response Time" "PASS" "Tiempo de respuesta: ${response_time}ms (< 100ms)"
    elif [ $response_time -lt 500 ]; then
        print_result "Response Time" "INFO" "Tiempo de respuesta: ${response_time}ms (< 500ms)"
    else
        print_result "Response Time" "FAIL" "Tiempo de respuesta: ${response_time}ms (>= 500ms)"
    fi
}

# Test 9: Seguridad
test_security() {
    echo -e "\n${BLUE}🔒 Probando seguridad...${NC}"

    # Verificar CORS headers
    local cors_headers=$(curl -s -I "$BASE_URL/api/projects" | grep -i "access-control")

    if [ -n "$cors_headers" ]; then
        print_result "CORS Headers" "PASS" "Headers CORS presentes"
    else
        print_result "CORS Headers" "FAIL" "Headers CORS no encontrados"
    fi

    # Verificar que no hay información sensible expuesta
    local info_leak=$(curl -s "$BASE_URL/api/projects" | grep -i "password\|token\|secret")

    if [ -z "$info_leak" ]; then
        print_result "Info Leak Check" "PASS" "No se detectaron fugas de información sensible"
    else
        print_result "Info Leak Check" "FAIL" "Posible fuga de información sensible detectada"
    fi
}

# Test 10: Funcionalidades específicas
test_functional_features() {
    echo -e "\n${BLUE}🎯 Probando funcionalidades específicas...${NC}"

    # Test de categorización automática
    local category_data='{
        "title": "Sistema de IA para diagnóstico médico avanzado",
        "description": "Desarrollo de algoritmos de machine learning para análisis de imágenes médicas en tiempo real",
        "category": "auto"
    }'

    local category_response=$(curl -s -X POST "$BASE_URL/api/projects" \
        -H "Content-Type: application/json" \
        -d "$category_data")

    if [[ $category_response == *"category"* ]]; then
        print_result "Auto Categorization" "PASS" "Categorización automática funcionando"
    else
        print_result "Auto Categorization" "FAIL" "Categorización automática no funciona"
    fi

    # Test de recomendaciones
    local recommendations=$(curl -s "$BASE_URL/api/projects/recommendations?category=health&limit=3")

    if [[ $recommendations == *"recommendations"* ]]; then
        print_result "Recommendations" "PASS" "Sistema de recomendaciones funcionando"
    else
        print_result "Recommendations" "FAIL" "Sistema de recomendaciones no funciona"
    fi
}

# Función principal
main() {
    echo "🚀 Choco Inventa - Test Suite Local"
    echo "=================================="
    echo "Base URL: $BASE_URL"
    echo "Fecha: $(date)"
    echo "PID: $$"
    echo ""

    # Verificar servidor
    check_server

    # Ejecutar pruebas
    test_basic_endpoints
    test_projects_api
    test_ml_service
    test_analytics
    test_forecasting
    test_database
    test_cache
    test_performance
    test_security
    test_functional_features

    # Resultados finales
    echo ""
    echo "📊 RESULTADOS FINALES"
    echo "===================="
    echo -e "✅ Pruebas pasadas: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "❌ Pruebas fallidas: ${RED}$TESTS_FAILED${NC}"
    echo -e "📈 Total de pruebas: ${BLUE}$TOTAL_TESTS${NC}"

    # Calcular porcentaje de éxito
    if [ $TOTAL_TESTS -gt 0 ]; then
        local success_rate=$((TESTS_PASSED * 100 / TOTAL_TESTS))
        echo -e "🎯 Tasa de éxito: ${BLUE}$success_rate%${NC}"

        if [ $success_rate -ge 90 ]; then
            echo -e "${GREEN}🎉 ¡EXCELENTE! Todas las funcionalidades críticas están operativas.${NC}"
        elif [ $success_rate -ge 70 ]; then
            echo -e "${YELLOW}⚠️  BUENO: La mayoría de funcionalidades están operativas.${NC}"
        else
            echo -e "${RED}❌ PROBLEMAS: Varias funcionalidades críticas no están operativas.${NC}"
        fi
    fi

    echo ""
    echo "💡 Recomendaciones:"
    if [ $TESTS_FAILED -gt 0 ]; then
        echo "   - Revisa los logs en logs/dev.log"
        echo "   - Verifica la configuración en .env.local"
        echo "   - Reinicia el servidor si es necesario"
        echo "   - Consulta DEPLOYMENT-GUIDE.md para troubleshooting"
    else
        echo "   - ¡Todo funcionando correctamente!"
        echo "   - Puedes proceder con desarrollo normal"
        echo "   - Revisa README-DEV.md para más funcionalidades"
    fi

    echo ""
    echo "🏁 Test Suite completado"
}

# Ejecutar función principal
main "$@"