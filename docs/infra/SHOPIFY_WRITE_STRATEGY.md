# Shopify Integration Strategy (Write Capabilities)

> **Status:** Draft Strategy
> **Objective:** Define safe, scalable, and audit-aware write capabilities for Shopify Resources.

## 1. Requirement Analysis
The Marketing AI Platform requires "Write" access to execute campaigns. Read-only is insufficient for:
*   **Discount Creation**: Generating unique codes for email campaigns.
*   **Customer Tagging**: Segmenting users who engaged with AI content.
*   **Draft Orders**: Creating "Abandoned Cart" recovery offers.
*   **Metafields**: Storing AI-generated descriptions directly on products.

## 2. Scope & Permissions Strategy

### A. Core Scopes (Current vs Required)
| Resource | Current Scope | Required Scope | Justification |
| :--- | :--- | :--- | :--- |
| **Products** | `read_products` | `write_products` | AI Description/SEO updates. |
| **Orders** | `read_orders` | `read_orders` | Analytics only (Safety constraint). |
| **Discounts** | None | `write_discounts` | Campaign offers. |
| **Customers** | `read_customers` | `write_customers` | Tagging/Segmentation. |
| **Marketing** | None | `write_marketing_events` | Tracking ROI. |

### B. Risk Control (Blast Radius Containment)
we will **NOT** request blanket write access. We will use a "Least Privilege" approach:
1.  **Phase 1**: Only `write_discounts` and `write_customers`.
2.  **Phase 2**: Add `write_products` (Descriptions only) behind a Feature Flag.

## 3. Architecture for Write Operations

### A. The "Safety Valve" Pattern
All write operations must pass through a wrapper service `ShopifyWriteService` that enforces:
1.  **Rate Limiting**: Local leaky bucket to prevent hitting API limits.
2.  **Dry-Run Mode**: Env var `SHOPIFY_DRY_RUN=true` logs the mutation but skips execution.
3.  **Backup**: For Product updates, save the *original* description to DB before overwriting.

### B. Fallback & Retries
*   **429 Too Many Requests**: Automatic exponential backoff (handled by library, verified by us).
*   **4xx Client Errors**: Log -> Alert -> Do NOT retry (bad data).
*   **5xx Server Errors**: Retry 3x.

## 4. Implementation Plan
1.  **Update Scopes**: Modify `backend/src/services/shopify.service.ts` to include `write_discounts`, `write_customers`.
2.  **Re-Auth**: User must go through OAuth flow again to grant new permissions.
3.  **Safe Wrapper**: Implement `safeShopifyClient` with Dry-Run logic.
