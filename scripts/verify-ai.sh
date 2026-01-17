#!/bin/bash

BASE_URL="http://localhost:5000/api"

echo "🔍 Verifying AI System..."

# 1. Check Health
echo -n "1. Checking Health (/api/ai/health)... "
HEALTH_RESPONSE=$(curl -s $BASE_URL/ai/health)
if echo "$HEALTH_RESPONSE" | grep -q "openrouter"; then
  echo "✅ PASS"
  echo "   Response: $HEALTH_RESPONSE"
else
  echo "❌ FAIL"
  echo "   Response: $HEALTH_RESPONSE"
fi

# 2. Check Models
echo -n "2. Checking Models (/api/ai/models)... "
MODELS_RESPONSE=$(curl -s $BASE_URL/ai/models)
MODEL_COUNT=$(echo "$MODELS_RESPONSE" | grep -o "id" | wc -l)

if [ "$MODEL_COUNT" -gt 0 ]; then
  echo "✅ PASS ($MODEL_COUNT models found)"
else
  echo "❌ FAIL (No models found)"
  echo "   Response: $MODELS_RESPONSE"
fi

# 3. Check Settings Persistence
echo -n "3. Checking Settings (/api/ai/settings)... "
SETTINGS_RESPONSE=$(curl -s $BASE_URL/ai/settings)
if echo "$SETTINGS_RESPONSE" | grep -q "defaultModel"; then
  echo "✅ PASS"
else
  echo "❌ FAIL"
  echo "   Response: $SETTINGS_RESPONSE"
fi

# 4. End-to-End Generation
echo -n "4. Testing Generation (POST /api/ai/generate)... "
GEN_RESPONSE=$(curl -s -X POST $BASE_URL/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "taskType": "marketing_copy",
    "prompt": "Test product description",
    "productName": "Galaxy Tablet",
    "targetAudience": "Techies",
    "platform": "meta"
  }')

if echo "$GEN_RESPONSE" | grep -q "result"; then
  echo "✅ PASS"
  # Extract headlines if possible, simple grep
  HEADLINES=$(echo "$GEN_RESPONSE" | grep -o '"headlines":\[.*\]' | cut -c 1-100)
  echo "   Excerpt: $HEADLINES..."
else
  echo "❌ FAIL"
  echo "   Response: $GEN_RESPONSE"
fi
