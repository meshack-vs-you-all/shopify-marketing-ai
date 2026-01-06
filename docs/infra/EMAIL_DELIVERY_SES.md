# Amazon SES Integration Plan

> **Status:** Draft
> **Objective:** Reliable email delivery using AWS SES.

## 1. Architecture
*   **Provider**: Amazon SES (Simple Email Service).
*   **Region**: `us-east-1` (or user preference).
*   **Transport**: `nodemailer` with `aws-sdk` (or SMTP).

## 2. Configuration
Required Environment Variables:
```
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
EMAIL_FROM=marketing@example.com
```

## 3. Implementation Steps
1.  **Backend**: Update `email.service.ts` to switch from `deployment` mock to `nodemailer.createTransport({ SES: sesClient })`.
2.  **Worker**: Ensure the background worker has access to these credentials.
3.  **Sandbox**: Handle "Message Rejected" errors gracefully if SES is in Sandbox mode (verify recipient emails).

## 4. Verification
*   Send test email to verified address.
*   Check SES console for delivery stats.
