# Frontend → Backend Endpoint Map

**Generated**: 2026-01-15T15:35:00+03:00  
**Repository**: shopify-marketing-ai  
**Branch**: development

## API Client Location
`frontend/src/lib/api.ts`

---

## Authentication

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.register` | POST | `/api/auth/register` | `auth.routes.ts` |
| `api.login` | POST | `/api/auth/login` | `auth.routes.ts` |

## Health

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.health` | GET | `/health` | `index.ts` |

## Email Campaigns & Lists

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.getLists` | GET | `/api/email-campaigns/lists` | `email-campaigns.routes.ts` |
| `api.createList` | POST | `/api/email-campaigns/lists` | `email-campaigns.routes.ts` |
| `api.deleteList` | DELETE | `/api/email-campaigns/lists/:listId` | `email-campaigns.routes.ts` |
| `api.getSubscribers` | GET | `/api/email-campaigns/lists/:listId/subscribers` | `email-campaigns.routes.ts` |
| `api.addSubscriber` | POST | `/api/email-campaigns/lists/:listId/subscribers` | `email-campaigns.routes.ts` |
| `api.importSubscribers` | POST | `/api/email-campaigns/lists/:listId/import` | `email-campaigns.routes.ts` |
| `api.getEmailCampaigns` | GET | `/api/email-campaigns` | `email-campaigns.routes.ts` |
| `api.createEmailCampaign` | POST | `/api/email-campaigns` | `email-campaigns.routes.ts` |
| `api.sendEmailCampaign` | POST | `/api/email-campaigns/:id/send` | `email-campaigns.routes.ts` |
| `api.getDashboardStats` | GET | `/api/email-campaigns/dashboard-stats` | `email-campaigns.routes.ts` |

## AI Generation

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.generateEmailContent` | POST | `/api/email-campaigns/generate` | `email-campaigns.routes.ts` |
| `api.generateAdCopy` | POST | `/api/email-campaigns/generate-ad-copy` | `email-campaigns.routes.ts` |
| `api.generateProductDescription` | POST | `/api/email-campaigns/generate-product-description` | `email-campaigns.routes.ts` |
| `api.generateImage` | POST | `/api/email-campaigns/generate-image` | `email-campaigns.routes.ts` |

## Ad Campaigns

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.getCampaigns` | GET | `/api/campaigns` | `campaigns.routes.ts` |
| `api.getCampaign` | GET | `/api/campaigns/:id` | `campaigns.routes.ts` |
| `api.createCampaign` | POST | `/api/campaigns` | `campaigns.routes.ts` |
| `api.updateCampaign` | PATCH | `/api/campaigns/:id` | `campaigns.routes.ts` |
| `api.deleteCampaign` | DELETE | `/api/campaigns/:id` | `campaigns.routes.ts` |
| `api.getCampaignMetrics` | GET | `/api/campaigns/:id/metrics` | `campaigns.routes.ts` |
| `api.optimizeCampaign` | POST | `/api/campaigns/:id/optimize` | `campaigns.routes.ts` |
| `api.deployCampaign` | POST | `/api/campaigns/:id/deploy` | `campaigns.routes.ts` |

## Campaign Wizard

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.createCampaignDraft` | POST | `/api/campaigns/wizard/draft` | `campaigns.wizard.routes.ts` |
| `api.getCampaignWizardData` | GET | `/api/campaigns/wizard/:id` | `campaigns.wizard.routes.ts` |
| `api.updateCampaignAudience` | PUT | `/api/campaigns/wizard/:id/audience` | `campaigns.wizard.routes.ts` |
| `api.updateCampaignContent` | PUT | `/api/campaigns/wizard/:id/content` | `campaigns.wizard.routes.ts` |
| `api.finalizeCampaign` | POST | `/api/campaigns/wizard/:id/finalize` | `campaigns.wizard.routes.ts` |
| `api.sendCampaignWizard` | POST | `/api/campaigns/wizard/:id/send` | `campaigns.wizard.routes.ts` |

## Approvals

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.getApprovals` | GET | `/api/approvals` | `approvals.routes.ts` |
| `api.approveRequest` | POST | `/api/approvals/:id/approve` | `approvals.routes.ts` |
| `api.rejectRequest` | POST | `/api/approvals/:id/reject` | `approvals.routes.ts` |

## Settings

| Frontend Method | HTTP | Path | Backend File |
|-----------------|------|------|--------------|
| `api.getIntegrationStatus` | GET | `/api/settings/integrations` | `settings.routes.ts` |
| `api.getSystemStatus` | GET | `/api/settings/system` | `settings.routes.ts` |

---

**Total Endpoints**: 36 (all matched)
