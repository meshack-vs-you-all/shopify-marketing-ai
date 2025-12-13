# Shopify Marketing Automation AI Agent

A comprehensive AI-powered marketing automation system for Shopify stores, automating ad campaigns, content generation, and performance optimization across Meta, Google Ads, and email platforms.

## 🚀 Features

- **Automated Campaign Management**: Create and manage Meta and Google Ads campaigns automatically
- **AI Content Generation**: Generate ad copy, product descriptions, and email content using GPT-4
- **Performance Monitoring**: Real-time tracking of campaign metrics and ROAS
- **Human-in-the-Loop**: Approval workflows for major decisions
- **Analytics Dashboard**: Comprehensive insights and reporting
- **Budget Optimization**: Automatic budget allocation based on performance

## 🏗️ Architecture

```
shopify-marketing-ai/
├── backend/          # Node.js/TypeScript API server
├── frontend/         # Next.js dashboard
├── shared/           # Shared types and utilities
├── docs/             # Documentation
└── scripts/          # Deployment and utility scripts
```

## 🛠️ Tech Stack

- **Backend**: Node.js 20+, TypeScript, Express.js
- **Frontend**: Next.js 14+, React 18+, Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: BullMQ with Redis
- **AI**: OpenAI GPT-4
- **Hosting**: Railway.app (recommended)

## 📋 Prerequisites

- Node.js 20+ and npm/yarn
- PostgreSQL 15+
- Redis 7+
- API credentials for:
  - Shopify Admin API
  - Meta Business Suite
  - Google Ads API
  - OpenAI API
  - Email platform (Klaviyo recommended)

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Set Up Environment Variables

Copy the example env files and fill in your credentials:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 3. Set Up Database

```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### 4. Start Development Servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3: Queue Worker
cd backend
npm run worker
```

Visit `http://localhost:3000` for the dashboard.

## 📚 Documentation

- [Setup Guide](docs/SETUP.md)
- [API Documentation](docs/API.md)
- [Configuration Guide](docs/CONFIGURATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🔐 Security

- All API keys stored in environment variables
- Database encryption at rest
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration

## 📝 License

MIT

## 🤝 Contributing

This is a private project. For questions or issues, please contact the development team.

