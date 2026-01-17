#!/bin/bash
# =============================================================================
# OpenRouter Multi-Model Local Setup Script
# =============================================================================
# This script sets up the local development environment for testing the 
# OpenRouter multi-model AI architecture.
#
# Usage: ./scripts/setup-openrouter.sh
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKEND_DIR="$PROJECT_ROOT/backend"

echo "🚀 OpenRouter Multi-Model Setup"
echo "================================"

# Check for required environment variables
check_env() {
    echo ""
    echo "📋 Checking environment configuration..."
    
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        echo "❌ backend/.env not found. Creating from example..."
        if [ -f "$BACKEND_DIR/.env.example" ]; then
            cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
            echo "✅ Created backend/.env from example"
        else
            echo "❌ No .env.example found. Please create backend/.env manually."
            exit 1
        fi
    fi

    # Source the .env file
    source "$BACKEND_DIR/.env" 2>/dev/null || true

    echo ""
    echo "Environment Status:"
    echo "-------------------"
    
    # Check OpenRouter
    if [ -n "$OPENROUTER_API_KEY" ] && [ "$OPENROUTER_API_KEY" != "sk-or-v1-your_openrouter_api_key" ]; then
        echo "✅ OPENROUTER_API_KEY: configured"
    else
        echo "⚠️  OPENROUTER_API_KEY: not configured (OpenRouter features disabled)"
        echo "   Get your key at: https://openrouter.ai/keys"
    fi
    
    # Check Gemini fallback
    if [ -n "$GEMINI_API_KEY" ] && [ "$GEMINI_API_KEY" != "your_gemini_api_key" ]; then
        echo "✅ GEMINI_API_KEY: configured (fallback enabled)"
    else
        echo "⚠️  GEMINI_API_KEY: not configured (no fallback)"
    fi
    
    # Check AI provider setting
    if [ "$AI_PROVIDER" = "openrouter" ]; then
        echo "✅ AI_PROVIDER: openrouter"
    else
        echo "ℹ️  AI_PROVIDER: ${AI_PROVIDER:-gemini} (default)"
    fi
    
    # Check verbose logging
    if [ "$AI_VERBOSE_LOGGING" = "true" ]; then
        echo "✅ AI_VERBOSE_LOGGING: enabled"
    else
        echo "ℹ️  AI_VERBOSE_LOGGING: disabled (set to 'true' for dev debugging)"
    fi
    
    # Check database
    if [ -n "$DATABASE_URL" ]; then
        echo "✅ DATABASE_URL: configured"
    else
        echo "❌ DATABASE_URL: not configured"
        exit 1
    fi
}

# Run Prisma migrations
run_migrations() {
    echo ""
    echo "📦 Running database migrations..."
    cd "$BACKEND_DIR"
    
    npx prisma generate
    npx prisma migrate dev --name add_ai_models 2>/dev/null || npx prisma db push
    
    echo "✅ Database schema updated"
}

# Seed default AI settings
seed_settings() {
    echo ""
    echo "🌱 Seeding default AI settings..."
    
    cd "$BACKEND_DIR"
    
    # Create a temporary seed script
    cat > /tmp/seed-ai-settings.ts << 'EOF'
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const settings = await prisma.aISettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      defaultModel: 'anthropic/claude-3.5-sonnet',
      defaultTemperature: 0.7,
      defaultMaxTokens: 2048,
      dailyBudgetLimit: 50,
      monthlyBudgetLimit: 500,
      perRequestLimit: 1,
      taskOverrides: {},
      enabledModels: [
        'anthropic/claude-3.5-sonnet',
        'anthropic/claude-3-haiku',
        'openai/gpt-4.1',
        'openai/gpt-4.1-mini',
        'meta-llama/llama-3.1-70b-instruct',
        'google/gemini-2.0-flash',
      ],
      enableFallbacks: true,
      enableCostTracking: true,
    },
  });
  
  console.log('✅ AI Settings seeded:', settings.id);
  console.log('   Default model:', settings.defaultModel);
  console.log('   Daily budget: $' + settings.dailyBudgetLimit);
  console.log('   Monthly budget: $' + settings.monthlyBudgetLimit);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
EOF

    npx ts-node /tmp/seed-ai-settings.ts
    rm /tmp/seed-ai-settings.ts
}

# Print next steps
print_next_steps() {
    echo ""
    echo "============================================"
    echo "✅ Setup Complete!"
    echo "============================================"
    echo ""
    echo "Next Steps:"
    echo "-----------"
    echo "1. Add your OpenRouter API key to backend/.env:"
    echo "   OPENROUTER_API_KEY=sk-or-v1-your-key"
    echo "   AI_PROVIDER=openrouter"
    echo "   AI_VERBOSE_LOGGING=true"
    echo ""
    echo "2. Start the backend:"
    echo "   cd backend && npm run dev"
    echo ""
    echo "3. Test the AI endpoints:"
    echo "   # Health check"
    echo "   curl http://localhost:5000/api/ai/health"
    echo ""
    echo "   # List models (requires auth)"
    echo "   curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:5000/api/ai/models"
    echo ""
    echo "4. Run smoke tests:"
    echo "   ./scripts/test-openrouter.sh"
    echo ""
}

# Main execution
main() {
    check_env
    run_migrations
    seed_settings
    print_next_steps
}

main "$@"
