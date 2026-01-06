# 🛠️ Platform Setup Guide

This guide provides everything you need to get the Shopify Marketing AI platform running locally for development and testing.

## 📋 Prerequisites

- **Node.js**: v20 or higher
- **Docker & Docker Compose**: For Database and Redis
- **Shopify Store**: A development store or test store
- **Google Gemini API Key**: For AI content generation

---

## 🚀 Quick Start (5 Minutes)

The fastest way to get the full stack running:

1. **Clone & Install**:
   ```bash
   git clone <repo-url>
   cd shopify-marketing-ai
   # Install all dependencies (Backend & Frontend)
   cd backend && npm install && cd ../frontend && npm install && cd ..
   ```

2. **Environment Setup**:
   Copy the example environment files:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.local.example frontend/.env.local
   ```
   *See [detailed configuration](#-detailed-configuration) below for required keys.*

3. **Launch Infrastructure**:
   ```bash
   docker-compose up -d
   ```

4. **Initialize Database**:
   ```bash
   cd backend
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Start Development Stack**:
   Use the provided helper script to safely start all services:
   ```bash
   bash scripts/start-dev.sh
   ```

---

## 🔐 Authentication

To log in to the local dashboard (http://localhost:3000/login):
- **API Key**: Use the value of `API_KEY` in your `backend/.env`.
- **Default**: `dev-api-key-change-in-production`

---

## ⚙️ Detailed Configuration

### Backend (.env)

| Variable | Requirement | Description |
| :------- | :---------- | :---------- |
| `DATABASE_URL` | **Required** | PostgreSQL connection string |
| `GEMINI_API_KEY` | **Required** | Google AI Key (MakerSuite) |
| `SHOPIFY_STORE_URL` | **Required** | `https://your-store.myshopify.com` |
| `SHOPIFY_ACCESS_TOKEN` | **Required** | Admin API Access Token |
| `REDIS_URL` | Optional | `redis://localhost:6379` |
| `AWS_ACCESS_KEY_ID` | Optional | For SES Email Sending |
| `AWS_SECRET_ACCESS_KEY`| Optional | For SES Email Sending |

### Frontend (.env.local)

| Variable | Default | Description |
| :------- | :------ | :---------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend API Endpoint |

---

## 🧪 Testing & Verification

1. **Health Check**:
   `curl http://localhost:5000/health`
   Should return JSON with `status: "ok"` and service connectivity status.

2. **Database GUI**:
   Run `npx prisma studio` in the `backend/` folder to view and edit data.

3. **Background Workers**:
   Monitor worker logs to ensure queue consumption:
   `docker-compose logs -f worker`

---

## 🆘 Troubleshooting

- **Port Conflicts**: If port 3000 or 5000 is taken, `scripts/start-dev.sh` will prompt to kill the conflicting process.
- **Database Connection**: Ensure `shopify_marketing_ai_db` container is running and healthy.
- **Secrets**: If AI generation fails, verify your `GEMINI_API_KEY` has permission to use the Gemini Pro model.
