#!/bin/bash

# Deployment Verification Script
# Tests all components of the Accessibility Analyzer

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me || curl -s ipinfo.io/ip)
BASE_URL="http://$PUBLIC_IP"

echo "🧪 Verifying Accessibility Analyzer Deployment"
echo "=============================================="
print_info "Testing URL: $BASE_URL"
echo ""

# Test 1: Health Check
print_test "1. Health Check Endpoint"
if curl -s -f "$BASE_URL:5000/health" > /dev/null; then
    print_pass "Health endpoint responding"
else
    print_fail "Health endpoint not responding"
    exit 1
fi

# Test 2: API Health
print_test "2. API Health Check"
if curl -s -f "$BASE_URL:5000/api/health" > /dev/null; then
    print_pass "API health endpoint responding"
else
    print_fail "API health endpoint not responding"
fi

# Test 3: Frontend Access
print_test "3. Frontend Accessibility"
if curl -s -f "$BASE_URL" | grep -q "Accessibility Analyzer"; then
    print_pass "Frontend loading successfully"
else
    print_fail "Frontend not loading properly"
fi

# Test 4: Docker Container Status
print_test "4. Docker Container Status"
if docker-compose ps | grep -q "Up"; then
    print_pass "Docker containers running"
else
    print_fail "Docker containers not running"
    docker-compose ps
fi

# Test 5: Playwright Browser Test
print_test "5. Playwright Browser Test"
if docker-compose exec -T accessibility-analyzer npx playwright --version > /dev/null 2>&1; then
    print_pass "Playwright installed and accessible"
else
    print_fail "Playwright not working"
fi

# Test 6: Firebase Connection (if configured)
print_test "6. Firebase Connection"
if [ -n "$FIREBASE_PROJECT_ID" ] && [ "$FIREBASE_PROJECT_ID" != "your-project-id" ]; then
    # Test Firebase by making an API call that uses Firebase
    if curl -s -f "$BASE_URL:5000/api/analysis" -X POST -H "Content-Type: application/json" -d '{"url":"https://example.com"}' > /dev/null; then
        print_pass "Firebase connection working"
    else
        print_fail "Firebase connection issues"
    fi
else
    print_info "Firebase not configured yet (update .env file)"
fi

# Test 7: Memory Usage
print_test "7. System Resources"
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
print_info "Memory usage: ${MEMORY_USAGE}%"

if (( $(echo "$MEMORY_USAGE < 80" | bc -l) )); then
    print_pass "Memory usage within limits"
else
    print_fail "High memory usage detected"
fi

# Test 8: Disk Space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
print_info "Disk usage: ${DISK_USAGE}%"

if [ "$DISK_USAGE" -lt 80 ]; then
    print_pass "Disk usage within limits"
else
    print_fail "High disk usage detected"
fi

echo ""
echo "=============================================="
print_info "Verification completed!"
echo ""
print_info "🌐 Your app is accessible at: $BASE_URL"
print_info "🔧 API endpoint: $BASE_URL:5000/api"
print_info "❤️ Health check: $BASE_URL:5000/health"
echo ""
print_info "📝 To test accessibility analysis:"
echo "   1. Visit: $BASE_URL"
echo "   2. Enter URL: https://example.com"
echo "   3. Click 'Analyze'"
echo "   4. Wait for results"
echo ""
print_info "🔍 To view logs: docker-compose logs -f"
print_info "🔄 To restart: docker-compose restart"
echo "=============================================="
