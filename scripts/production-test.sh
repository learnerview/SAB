#!/bin/bash
# Production Environment Testing Script for SAB
# Tests all production components and provides health status

set -euo pipefail

# Configuration
BASE_URL="${BASE_URL:-https://localhost}"
API_URL="${BASE_URL}/api/v1"
ADMIN_API_KEY="${ADMIN_API_KEY:-}"
TIMEOUT=30

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

# Function to log messages
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

log_error() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARN: $1${NC}"
}

# Function to test HTTP endpoint
test_endpoint() {
    local url="$1"
    local method="${2:-GET}"
    local expected_status="${3:-200}"
    local description="$4"
    
    log "Testing: $description"
    
    if command -v curl &> /dev/null; then
        local status_code
        status_code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" --connect-timeout "$TIMEOUT" "$url" 2>/dev/null || echo "000")
        
        if [[ "$status_code" == "$expected_status" ]]; then
            log_success "$description (HTTP $status_code)"
            return 0
        else
            log_error "$description (HTTP $status_code, expected $expected_status)"
            return 1
        fi
    else
        log_error "curl not available for testing"
        return 1
    fi
}

# Function to test API with authentication
test_api_endpoint() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="${3:-}"
    local description="$4"
    
    log "Testing: $description"
    
    local curl_cmd="curl -s -o /dev/null -w '%{http_code}' -X '$method' --connect-timeout $TIMEOUT"
    curl_cmd="$curl_cmd -H 'X-API-KEY: $ADMIN_API_KEY' -H 'Content-Type: application/json'"
    
    if [[ -n "$data" ]]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_URL$endpoint'"
    
    local status_code
    status_code=$(eval "$curl_cmd" 2>/dev/null || echo "000")
    
    if [[ "$status_code" =~ ^[23] ]]; then
        log_success "$description (HTTP $status_code)"
        return 0
    else
        log_error "$description (HTTP $status_code)"
        return 1
    fi
}

# Function to test Docker services
test_docker_services() {
    log "Testing Docker services..."
    
    local services=("app" "postgres" "redis" "nginx")
    for service in "${services[@]}"; do
        if docker-compose ps "$service" | grep -q "Up"; then
            log_success "$service container is running"
        else
            log_error "$service container is not running"
        fi
    done
}

# Function to test SSL certificate
test_ssl_certificate() {
    log "Testing SSL certificate..."
    
    if [[ -f "nginx/ssl/sab.crt" ]]; then
        if openssl x509 -in "nginx/ssl/sab.crt" -checkend 86400 -noout 2>/dev/null; then
            log_success "SSL certificate is valid"
        else
            log_warning "SSL certificate is expiring soon or invalid"
        fi
    else
        log_error "SSL certificate not found"
    fi
}

# Function to test database connectivity
test_database() {
    log "Testing database connectivity..."
    
    if docker-compose exec -T postgres pg_isready -U sab >/dev/null 2>&1; then
        log_success "PostgreSQL is ready"
        
        # Test database connection
        if docker-compose exec -T postgres psql -U sab -d sab -c "SELECT 1;" >/dev/null 2>&1; then
            log_success "Database connection successful"
        else
            log_error "Database connection failed"
        fi
    else
        log_error "PostgreSQL is not ready"
    fi
}

# Function to test Redis connectivity
test_redis() {
    log "Testing Redis connectivity..."
    
    if docker-compose exec -T redis redis-cli ping >/dev/null 2>&1; then
        log_success "Redis is responding"
        
        # Test Redis data
        local key_count
        key_count=$(docker-compose exec -T redis redis-cli dbsize 2>/dev/null || echo "0")
        log_success "Redis contains $key_count keys"
    else
        log_error "Redis is not responding"
    fi
}

# Function to test monitoring stack
test_monitoring() {
    log "Testing monitoring stack..."
    
    # Test Prometheus
    test_endpoint "http://localhost:9090/-/healthy" "GET" "200" "Prometheus health check"
    
    # Test Grafana
    test_endpoint "http://localhost:3000/api/health" "GET" "200" "Grafana health check"
    
    # Test OpenTelemetry Collector
    test_endpoint "http://localhost:8888/metrics" "GET" "200" "OpenTelemetry metrics endpoint"
}

# Function to test job submission
test_job_submission() {
    log "Testing job submission..."
    
    local job_data='{"jobType":"production-test","idempotencyKey":"test-'$(date +%s)'","priority":"NORMAL","execution":{"type":"HTTP","endpoint":"https://httpbin.org/post"},"payload":{"test":"production","timestamp":"'$(date -Iseconds)'"}}'
    
    if test_api_endpoint "/jobs" "POST" "$job_data" "Job submission"; then
        log_success "Job submission test completed"
        
        # Test job retrieval
        test_api_endpoint "/jobs" "GET" "" "Job retrieval"
    fi
}

# Function to test backup system
test_backup_system() {
    log "Testing backup system..."
    
    if [[ -d "backups" ]]; then
        local backup_count
        backup_count=$(find backups -name "sab_backup_*.sql.gz" 2>/dev/null | wc -l)
        
        if [[ "$backup_count" -gt 0 ]]; then
            log_success "Found $backup_count backup files"
            
            # Check latest backup
            local latest_backup
            latest_backup=$(find backups -name "sab_backup_*.sql.gz" -type f -printf '%T@ %p\n' 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
            
            if [[ -n "$latest_backup" && -f "$latest_backup" ]]; then
                local backup_size
                backup_size=$(stat -c%s "$latest_backup" 2>/dev/null || echo "0")
                log_success "Latest backup: $(basename "$latest_backup") ($(numfmt --to=iec "$backup_size"))"
            fi
        else
            log_warning "No backup files found"
        fi
    else
        log_warning "Backup directory not found"
    fi
}

# Function to test resource usage
test_resource_usage() {
    log "Testing resource usage..."
    
    if command -v docker &> /dev/null; then
        local memory_usage
        local cpu_usage
        
        # Get container stats
        while IFS= read -r line; do
            local container=$(echo "$line" | awk '{print $1}')
            local mem_percent=$(echo "$line" | awk '{print $3}' | sed 's/%//')
            local cpu_percent=$(echo "$line" | awk '{print $2}' | sed 's/%//')
            
            if [[ "$container" != "CONTAINER" ]]; then
                if (( $(echo "$mem_percent > 90" | bc -l) )); then
                    log_warning "$container: High memory usage (${mem_percent}%)"
                else
                    log_success "$container: Memory usage OK (${mem_percent}%)"
                fi
                
                if (( $(echo "$cpu_percent > 80" | bc -l) )); then
                    log_warning "$container: High CPU usage (${cpu_percent}%)"
                else
                    log_success "$container: CPU usage OK (${cpu_percent}%)"
                fi
            fi
        done <<< "$(docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemPerc}}" 2>/dev/null)"
    else
        log_warning "Docker stats not available"
    fi
}

# Function to generate test report
generate_report() {
    log ""
    log "=== PRODUCTION TEST REPORT ==="
    log "Tests Passed: $TESTS_PASSED"
    log "Tests Failed: $TESTS_FAILED"
    log "Total Tests: $((TESTS_PASSED + TESTS_FAILED))"
    
    if [[ "$TESTS_FAILED" -eq 0 ]]; then
        log_success "All tests passed! Production environment is healthy."
    else
        log_error "$TESTS_FAILED tests failed. Please review and fix issues."
        exit 1
    fi
    
    log "=== END REPORT ==="
}

# Function to check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    if [[ -z "$ADMIN_API_KEY" ]]; then
        log_error "ADMIN_API_KEY environment variable is required"
        exit 1
    fi
    
    # Check Docker
    if command -v docker &> /dev/null; then
        log_success "Docker is available"
    else
        log_error "Docker is not available"
        exit 1
    fi
    
    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        log_success "Docker Compose is available"
    else
        log_error "Docker Compose is not available"
        exit 1
    fi
    
    # Check configuration files
    local config_files=("docker-compose.production.yml" "nginx/nginx.conf" "monitoring/prometheus.yml")
    for file in "${config_files[@]}"; do
        if [[ -f "$file" ]]; then
            log_success "Configuration file exists: $file"
        else
            log_error "Configuration file missing: $file"
        fi
    done
}

# Main execution
main() {
    log "=== SAB Production Environment Test ==="
    log "Starting comprehensive production tests..."
    
    # Check prerequisites
    check_prerequisites
    
    # Test Docker services
    test_docker_services
    
    # Test SSL certificate
    test_ssl_certificate
    
    # Test database
    test_database
    
    # Test Redis
    test_redis
    
    # Test monitoring stack
    test_monitoring
    
    # Test API endpoints
    test_endpoint "${BASE_URL}/actuator/health" "GET" "200" "Application health endpoint"
    test_endpoint "${BASE_URL}/" "GET" "200" "Web UI"
    
    # Test API with authentication
    test_api_endpoint "/admin/stats" "GET" "" "Admin stats endpoint"
    test_api_endpoint "/jobs" "GET" "" "Jobs list endpoint"
    
    # Test job submission
    test_job_submission
    
    # Test backup system
    test_backup_system
    
    # Test resource usage
    test_resource_usage
    
    # Generate report
    generate_report
}

# Execute main function
main "$@"
