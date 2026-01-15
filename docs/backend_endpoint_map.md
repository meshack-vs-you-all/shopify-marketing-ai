# Backend Endpoint Inventory

**Generated**: 2026-01-15T15:35:00+03:00  
**Repository**: shopify-marketing-ai  
**Branch**: development

---

## Route Files

| File | Mount Path | Auth Required |
|------|------------|---------------|
| `auth.routes.ts` | `/api/auth` | No (public) |
| `campaigns.routes.ts` | `/api/campaigns` | Yes |
| `email-campaigns.routes.ts` | `/api/email-campaigns` | Yes |
| `campaigns.wizard.routes.ts` | `/api/campaigns/wizard` | Yes |
| `approvals.routes.ts` | `/api/approvals` | Yes |
| `settings.routes.ts` | `/api/settings` | Yes |

---

## Endpoints by File

### auth.routes.ts

| Method | Path | Handler | Validation |
|--------|------|---------|------------|
| POST | `/api/auth/register` | `authService.register` | `registerSchema` |
| POST | `/api/auth/login` | `authService.login` | `loginSchema` |
| GET | `/api/auth/me` | Inline (token decode) | None |

### campaigns.routes.ts

| Method | Path | Handler | Validation |
|--------|------|---------|------------|
| GET | `/api/campaigns` | Prisma query | `campaignQuerySchema` |
| GET | `/api/campaigns/:id` | Prisma query | `campaignIdSchema` |
| POST | `/api/campaigns` | `campaignService.createCampaign` | `createCampaignSchema` |
| PATCH | `/api/campaigns/:id` | Prisma update | `campaignIdSchema`, `updateCampaignSchema` |
| DELETE | `/api/campaigns/:id` | Prisma delete | `campaignIdSchema` |
| GET | `/api/campaigns/:id/metrics` | `campaignService.getCampaignMetrics` | `campaignIdSchema` |
| POST | `/api/campaigns/:id/optimize` | `campaignService.optimizeCampaign` | `campaignIdSchema` |
| POST | `/api/campaigns/:id/deploy` | `campaignService.deployCampaign` | `campaignIdSchema` |

### campaigns.wizard.routes.ts

| Method | Path | Handler | Validation |
|--------|------|---------|------------|
| POST | `/api/campaigns/wizard/draft` | `campaignService.createDraft` | None |
| GET | `/api/campaigns/wizard/:id` | `campaignService.getCampaign` | None |
| PUT | `/api/campaigns/wizard/:id/audience` | `campaignService.setAudience` | None |
| PUT | `/api/campaigns/wizard/:id/content` | `campaignService.updateContent` | None |
| POST | `/api/campaigns/wizard/:id/finalize` | `campaignService.finalize` | None |
| POST | `/api/campaigns/wizard/:id/send` | Queue + `campaignService.finalize` | None |

### email-campaigns.routes.ts

| Method | Path | Handler | Validation |
|--------|------|---------|------------|
| GET | `/api/email-campaigns/dashboard-stats` | `emailCampaignService.getDashboardMetrics` | None |
| GET | `/api/email-campaigns/lists` | `emailCampaignService.getLists` | None |
| POST | `/api/email-campaigns/lists` | `emailCampaignService.createList` | None |
| DELETE | `/api/email-campaigns/lists/:listId` | `emailCampaignService.deleteList` | None |
| POST | `/api/email-campaigns/lists/:listId/subscribers` | `emailCampaignService.addSubscriber` | None |
| POST | `/api/email-campaigns/lists/:listId/import` | `emailCampaignService.importSubscribersFromCsv` | Multer |
| GET | `/api/email-campaigns/lists/:listId/subscribers` | `emailCampaignService.getSubscribers` | None |
| GET | `/api/email-campaigns` | `emailCampaignService.getCampaigns` | None |
| POST | `/api/email-campaigns` | `emailCampaignService.createCampaign` | None |
| GET | `/api/email-campaigns/:id` | `emailCampaignService.getCampaign` | None |
| POST | `/api/email-campaigns/:id/send` | `emailCampaignService.sendCampaign` | None |
| GET | `/api/email-campaigns/:id/analytics` | `emailCampaignService.getCampaignAnalytics` | None |
| POST | `/api/email-campaigns/generate` | `aiService.generateEmailSubjectLines/Body` | None |
| POST | `/api/email-campaigns/generate-ad-copy` | `aiService.generateAdCopy` | None |
| POST | `/api/email-campaigns/generate-product-description` | `aiService.generateProductDescription` | None |
| POST | `/api/email-campaigns/generate-image` | `aiService.generateImage` | None |
| GET | `/api/email-campaigns/shopify/products` | `shopifyService.getProducts` | None |
| GET | `/api/email-campaigns/shopify/collections` | `shopifyService.getCollections` | None |
| GET | `/api/email-campaigns/verify-connection` | `emailService.verifyConnection` | None |
| POST | `/api/email-campaigns/test-smtp` | `emailService.sendMarketingEmail` | None |

### approvals.routes.ts

| Method | Path | Handler | Validation |
|--------|------|---------|------------|
| GET | `/api/approvals` | `approvalService.getPendingApprovals` | None |
| POST | `/api/approvals/:id/approve` | `approvalService.approve` | `approvalIdSchema`, `approveRequestSchema` |
| POST | `/api/approvals/:id/reject` | `approvalService.reject` | `approvalIdSchema`, `rejectRequestSchema` |

### settings.routes.ts

| Method | Path | Handler | Validation |
|--------|------|---------|------------|
| GET | `/api/settings/integrations` | Inline (Meta, Email, Shopify status) | None |
| GET | `/api/settings/system` | Inline (env info) | None |

### Other (index.ts)

| Method | Path | Handler | Auth |
|--------|------|---------|------|
| GET | `/health` | Inline (DB, Redis check) | No |
| GET | `/api/health` | Inline (simple) | No |
| GET | `/api/analytics` | Placeholder | Yes |

---

**Total Backend Endpoints**: 42
