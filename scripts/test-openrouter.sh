#!/bin/bash
# =============================================================================
# OpenRouter Smoke Test Script
# =============================================================================
# Tests the OpenRouter multi-model AI architecture locally.
# Requires backend to be running on localhost:5000
#
# Usage: ./scripts/test-openrouter.sh [AUTH_TOKEN]
# =============================================================================

set -e

API_URL="${API_URL:-http://localhost:5000}"
AUTH_TOKEN="${1:-$AUTH_TOKEN}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🧪 OpenRouter Smoke Tests"
echo "========================="
echo "API URL: $API_URL"
echo ""

# Check if AUTH_TOKEN is provided
if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${YELLOW}⚠️  No AUTH_TOKEN provided. Some tests may fail.${NC}"
    echo "   Usage: ./scripts/test-openrouter.sh YOUR_AUTH_TOKEN"
    echo ""
fi

# Helper function to make API calls
api_call() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    
    if [ "$method" = "GET" ]; then
        curl -s -X GET "$API_URL$endpoint" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json"
    else
        curl -s -X "$method" "$API_URL$endpoint" \
            -H "Authorization: Bearer $AUTH_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data"
    fi
}

# Test counter
PASSED=0
FAILED=0

test_result() {
    local name="$1"
    local condition="$2"
    
    if [ "$condition" = "true" ]; then
        echo -e "${GREEN}✅ $name${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ $name${NC}"
        ((FAILED++))
    fi
}

# =============================================================================
# Test 1: Health Check
# =============================================================================
echo ""
echo "Test 1: AI Health Check"
echo "-----------------------"

HEALTH=$(curl -s "$API_URL/api/ai/health" -H "Authorization: Bearer $AUTH_TOKEN")
echo "Response: $HEALTH"

if echo "$HEALTH" | grep -q "ok\|degraded"; then
    test_result "AI health endpoint responds" "true"
else
    test_result "AI health endpoint responds" "false"
fi

# =============================================================================
# Test 2: List Models
# =============================================================================
echo ""
echo "Test 2: List Available Models"
echo "-----------------------------"

MODELS=$(api_call GET "/api/ai/models")

if echo "$MODELS" | grep -q "models"; then
    MODEL_COUNT=$(echo "$MODELS" | grep -o '"count":[0-9]*' | cut -d: -f2)
    echo "Found $MODEL_COUNT models"
    test_result "Models endpoint returns data" "true"
    
    # Check for expected providers
    if echo "$MODELS" | grep -q "anthropic"; then
        test_result "Anthropic models available" "true"
    else
        test_result "Anthropic models available" "false"
    fi
    
    if echo "$MODELS" | grep -q "openai"; then
        test_result "OpenAI models available" "true"
    else
        test_result "OpenAI models available" "false"
    fi
else
    echo "Response: $MODELS"
    test_result "Models endpoint returns data" "false"
fi

# =============================================================================
# Test 3: Get AI Settings
# =============================================================================
echo ""
echo "Test 3: AI Settings"
echo "-------------------"

SETTINGS=$(api_call GET "/api/ai/settings")

if echo "$SETTINGS" | grep -q "defaultModel"; then
    DEFAULT_MODEL=$(echo "$SETTINGS" | grep -o '"defaultModel":"[^"]*"' | cut -d'"' -f4)
    echo "Default model: $DEFAULT_MODEL"
    test_result "Settings endpoint returns data" "true"
else
    echo "Response: $SETTINGS"
    test_result "Settings endpoint returns data" "false"
fi

# =============================================================================
# Test 4: Get Usage
# =============================================================================
echo ""
echo "Test 4: Usage & Budget"
echo "----------------------"

USAGE=$(api_call GET "/api/ai/usage")

if echo "$USAGE" | grep -q "budget"; then
    echo "Response: $USAGE"
    test_result "Usage endpoint returns data" "true"
else
    echo "Response: $USAGE"
    test_result "Usage endpoint returns data" "false"
fi

# =============================================================================
# Test 5: Email Subject Generation
# =============================================================================
echo ""
echo "Test 5: Email Subject Generation"
echo "---------------------------------"

GEN_RESULT=$(api_call POST "/api/ai/generate" '{
  "taskType": "email_subject",
  "prompt": "Generate subject lines for a summer sale",
  "emailType": "promotional",
  "context": "Summer Sale 50% off",
  "numberOfVariations": 3
}')

if echo "$GEN_RESULT" | grep -q "result"; then
    echo "Generated content received"
    test_result "Email subject generation works" "true"
    
    # Check for meta information
    if echo "$GEN_RESULT" | grep -q "meta"; then
        test_result "Generation includes metadata" "true"
    else
        test_result "Generation includes metadata" "false"
    fi
else
    echo "Response: $GEN_RESULT"
    test_result "Email subject generation works" "false"
fi

# =============================================================================
# Test 6: Budget Enforcement
# =============================================================================
echo ""
echo "Test 6: Budget Enforcement"
echo "--------------------------"

# First check current budget
BUDGET_CHECK=$(api_call GET "/api/ai/usage")

if echo "$BUDGET_CHECK" | grep -q '"allowed":true'; then
    test_result "Budget allows requests" "true"
else
    echo "Response: $BUDGET_CHECK"
    test_result "Budget allows requests" "false"
fi

# =============================================================================
# Test 7: Model Recommendations
# =============================================================================
echo ""
echo "Test 7: Model Recommendations"
echo "-----------------------------"

RECOMMENDATIONS=$(api_call GET "/api/ai/models/recommended/marketing_copy")

if echo "$RECOMMENDATIONS" | grep -q "recommendations"; then
    echo "Recommendations received"
    test_result "Recommendations endpoint works" "true"
else
    echo "Response: $RECOMMENDATIONS"
    test_result "Recommendations endpoint works" "false"
fi

# =============================================================================
# Test 8: Update Settings
# =============================================================================
echo ""
echo "Test 8: Update Settings"
echo "-----------------------"

UPDATE_RESULT=$(api_call PUT "/api/ai/settings" '{
  "defaultTemperature": 0.8
}')

if echo "$UPDATE_RESULT" | grep -q "defaultTemperature"; then
    test_result "Settings update works" "true"
else
    echo "Response: $UPDATE_RESULT"
    test_result "Settings update works" "false"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
echo "============================================"
echo "Test Summary"
echo "============================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the output above.${NC}"
    exit 1
fi
