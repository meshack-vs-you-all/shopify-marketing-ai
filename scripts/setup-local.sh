#!/bin/bash

# Local Development Setup Script
# Sets up the project for local development

echo "🔧 Setting up Glowify Marketing AI for Local Development"
echo "======================================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "💡 Install Node.js 20+: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "⚠️  Node.js version is $NODE_VERSION, but 20+ is recommended"
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed!"
    echo "💡 Install PostgreSQL: sudo apt install postgresql"
    exit 1
fi

# Check Redis
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis is not installed!"
    echo "💡 Install Redis: sudo apt install redis-server"
    exit 1
fi

echo "✅ Prerequisites checked"
echo ""

# Create .env files if they don't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend/.env from .env.example..."
    cp backend/.env.example backend/.env
    echo "⚠️  Please edit backend/.env with your API keys"
else
    echo "✅ backend/.env exists"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo "📝 Creating frontend/.env.local from .env.local.example..."
    cp frontend/.env.local.example frontend/.env.local
    echo "✅ frontend/.env.local created"
else
    echo "✅ frontend/.env.local exists"
fi

# Install backend dependencies
echo ""
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Setup database
echo ""
echo "🗄️  Setting up database..."
echo "⚠️  Make sure PostgreSQL is running and DATABASE_URL is correct in backend/.env"
read -p "Run database migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cd backend
    npx prisma generate
    npx prisma migrate dev
    cd ..
fi

# Create logs directory
mkdir -p logs

echo ""
echo "======================================================"
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Edit backend/.env with your API keys"
echo "   2. Edit frontend/.env.local with your API URL"
echo "   3. Start PostgreSQL: sudo systemctl start postgresql"
echo "   4. Start Redis: sudo systemctl start redis"
echo "   5. Run: ./scripts/start-local.sh"
echo "======================================================"

