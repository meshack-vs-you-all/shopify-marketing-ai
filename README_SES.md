# Amazon SES Integration & Email Marketing System

This document outlines the architecture and setup for the Email Marketing system using Amazon SES, integrated into the existing Node.js/TypeScript backend.

## Architecture

The email marketing system is built as a modular service within the backend, leveraging:
- **Amazon SES**: For high-deliverability email sending.
- **Prisma**: For data modeling (Campaigns, Lists, Subscribers, Logs).
- **BullMQ**: For reliable, background email processing and rate limiting.
- **Google Gemini**: For AI-powered content generation.

### New Components

1.  **Email Service** (`src/services/email.service.ts`):
    - Wrapper around AWS SDK v3 SES Client.
    - Handles raw email construction (MIME).
    - Supports CC, BCC, Reply-To, Attachments.
    - Error handling and logging.

2.  **Campaign Service** (`src/services/email-campaign.service.ts`):
    - Manages Email Lists and Subscribers.
    - Handles Campaign creation, scheduling, and status management.
    - Orchestrates the sending process via the Worker.

3.  **Worker** (`src/workers/email.worker.ts`):
    - Processes email sending jobs.
    - Handles batching and rate limiting (SES limits).
    - Updates delivery logs and campaign status.
    - Retries failed sends with exponential backoff.

4.  **API Endpoints** (`src/api/email-campaigns.routes.ts`):
    - RESTful API for frontend consumption.
    - Endpoints for Lists, Subscribers, Campaigns, Analytics.
    - Integration with Shopify for product data injection.

## Setup

### Environment Variables

Add the following to your `.env` file:

```bash
# Amazon SES Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
SES_FROM_EMAIL=marketing@yourdomain.com

# Rate Limiting (Optional override)
SES_RATE_LIMIT=14 # emails per second
```

### Database Schema

New models added to `schema.prisma`:
- `EmailList`
- `Subscriber`
- `EmailCampaign` (Updated)
- `EmailDeliveryLog`

### Dependencies

Run:
```bash
npm install @aws-sdk/client-ses nodemailer
```
*(Note: `nodemailer` is used for easy MIME message composition, which SES SendRawEmail requires for attachments/complex bodies.)*

## Usage

### Sending an Email (Programmatic)

```typescript
import emailService from '../services/email.service';

await emailService.sendMarketingEmail({
  to: 'user@example.com',
  subject: 'Hello!',
  htmlBody: '<h1>Welcome</h1>',
  textBody: 'Welcome',
  fromEmail: 'marketing@yourdomain.com'
});
```

### creating a Campaign (API)

POST `/api/campaigns/email`
```json
{
  "name": "Summer Sale",
  "subject": "50% Off Everything",
  "listId": "list_123",
  "htmlContent": "..."
}
```

## Testing

Run tests with:
```bash
npm test tests/email
```
