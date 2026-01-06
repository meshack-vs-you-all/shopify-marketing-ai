# 🤖 Shopify Marketing AI Platform

An advanced, AI-driven marketing platform designed to automate Shopify store growth through intelligent campaigns, customer segmentation, and multi-channel outreach.

---

## ⚡ Core Features

- **AI Content Studio**: Automated generate of ad copy, email subjects, and product descriptions using Gemini Pro.
- **Smart Campaigns**: Multi-channel orchestration (Meta, Google, Email) with budget optimization.
- **Shopify Integration**: Deep sync with products, orders, and customers.
- **Email Marketing**: High-deliverability system via AWS SES with built-in list management.
- **Production-Ready**: Structured logging, persistence, rate limiting, and CI/CD.

---

## 🛠️ Getting Started

To get the platform running locally in under 5 minutes, follow our **[Setup Guide](docs/SETUP.md)**.

### Quick Commands
```bash
# 1. Start Infrastructure (Postgres/Redis)
docker-compose up -d

# 2. Start all services safely (Helper script)
bash scripts/start-dev.sh
```

---

## 📂 Project Structure

```text
├── backend/            # Express.js API & Workers
├── frontend/           # Next.js 14 Dashboard
├── docs/               # Technical documentation & Strategies
├── scripts/            # DevOps and Helper scripts
└── docker-compose.yml  # Local stack orchestration
```

---

## 📚 Documentation

Detailed documentation is available in the **[`docs/`](docs/)** directory:

- **[Installation & Setup](docs/SETUP.md)**
- **[Shopify Strategy](docs/infra/SHOPIFY_WRITE_STRATEGY.md)**
- **[Email Architecture](docs/infra/EMAIL_DELIVERY_SES.md)**
- **[Testing Workflow](docs/testing/WORKFLOW.md)**
- **[Phased Roadmap](docs/roadmap/PHASED_EXECUTION_PLAN.md)**

---

## 🛡️ License

Private Collaboration - Crafted Edge Solutions.
