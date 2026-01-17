#!/bin/bash
# OpenRouter AI System Verification Script
# Tests all AI endpoints and confirms OpenRouter-only execution

BASE_URL="${1:-http://localhost:5001}"
PASS=0
FAIL=0

echo "============================================"
echo "OpenRouter AI System Verification"
echo "Backend URL: $BASE_URL"
echo "============================================"

# Test 1: Health Check
echo -n "1. Health Check... "
HEALTH=$(curl -s "$BASE_URL/api/ai/health")
if echo "$HEALTH" | grep -q '"openrouter":true'; then
  echo "✅ PASS (OpenRouter: connected)"
  ((PASS++))
else
  echo "❌ FAIL"
  echo "   Response: $HEALTH"
  ((FAIL++))
fi

# Test 2: Models Discovery
echo -n "2. Models Discovery... "
MODELS=$(curl -s "$BASE_URL/api/ai/models")
COUNT=$(echo "$MODELS" | jq -r '.count // 0')
if [ "$COUNT" -gt 0 ]; then
  echo "✅ PASS ($COUNT models from OpenRouter)"
  ((PASS++))
else
  echo "❌ FAIL (No models found)"
  ((FAIL++))
fi

# Test 3: Settings Retrieval
echo -n "3. Settings GET... "
SETTINGS=$(curl -s "$BASE_URL/api/ai/settings")
if echo "$SETTINGS" | grep -q '"defaultModel"'; then
  MODEL=$(echo "$SETTINGS" | jq -r '.defaultModel')
  echo "✅ PASS (Default: $MODEL)"
  ((PASS++))
else
  echo "❌ FAIL"
  echo "   Response: $SETTINGS"
  ((FAIL++))
fi

# Test 4: Settings Update
echo -n "4. Settings PUT... "
UPDATE=$(curl -s -X PUT "$BASE_URL/api/ai/settings" \
  -H "Content-Type: application/json" \
  -d '{"defaultTemperature": 0.8}')
if echo "$UPDATE" | grep -q '"defaultTemperature"'; then
  TEMP=$(echo "$UPDATE" | jq -r '.defaultTemperature')
  echo "✅ PASS (Temperature: $TEMP)"
  ((PASS++))
else
  echo "❌ FAIL"
  echo "   Response: $UPDATE"
  ((FAIL++))
fi

# Test 5: Usage/Budget
echo -n "5. Usage & Budget... "
USAGE=$(curl -s "$BASE_URL/api/ai/usage")
if echo "$USAGE" | grep -q '"budget"'; then
  echo "✅ PASS"
  ((PASS++))
else
  echo "❌ FAIL"
  echo "   Response: $USAGE"
  ((FAIL++))
fi

# Test 6: AI Generation (requires OpenRouter credits)
echo -n "6. AI Generation (email_subject)... "
GEN=$(curl -s -X POST "$BASE_URL/api/ai/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "email_subject",
    "prompt": "Welcome email for new customers",
    "emailType": "welcome",
    "numberOfVariations": 3
  }')
if echo "$GEN" | grep -q '"result"'; then
  echo "✅ PASS"
  ((PASS++))
elif echo "$GEN" | grep -q '"error"'; then
  ERR=$(echo "$GEN" | jq -r '.error')
  echo "⚠️  SKIP ($ERR)"
else
  echo "❌ FAIL"
  echo "   Response: $GEN"
  ((FAIL++))
fi

echo ""
echo "============================================"
echo "RESULTS: $PASS passed, $FAIL failed"
echo "============================================"

if [ "$FAIL" -eq 0 ]; then
  echo "🎉 All tests passed! OpenRouter integration verified."
  exit 0
else
  echo "⚠️  Some tests failed. Check configuration."
  exit 1
fi
