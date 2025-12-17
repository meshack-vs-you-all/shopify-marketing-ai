# Google Workspace / Gmail SMTP Setup Guide

This guide explains how to configure **Shopify Marketing AI** to use Google's SMTP servers as a fallback (or primary) email transport. This is useful if you don't have AWS SES access or need a backup sending method.

## 🛠 Prerequisites

*   A **Google Workspace** account (recommended) or a personal **Gmail** account.
*   **2-Step Verification** enabled on your Google Account.

---

## 🔑 Step 1: Get Your Google App Password

You cannot use your standard Gmail password. You must generate a specific "App Password".

1.  **Go to your Google Account**:
    *   Click your profile icon (top right) > **Manage your Google Account**.
    *   Or visit: [myaccount.google.com](https://myaccount.google.com/)

2.  **Enable 2-Step Verification** (if not already done):
    *   Select **Security** from the left sidebar.
    *   Scroll to the "How you sign in to Google" section.
    *   Click **2-Step Verification** and follow the prompts to turn it on.

3.  **Generate App Password**:
    *   In the search bar at the top, type **"App passwords"** and select it (or look under "Security" > "2-Step Verification" > bottom of page).
    *   **App name**: Enter a custom name, e.g., `ShopifyMarketingApp`.
    *   Click **Create**.
    *   **Copy the 16-character password** displayed (e.g., `abcd efgh ijkl mnop`).
        *   *Note: You don't need the spaces when you use it, but keeping them is fine usually. Removing them is safer.*

---

## ⚙️ Step 2: Configure Environment Variables

Open your `.env` file in the project root and add (or update) these variables:

```env
# ==============================================
# SMTP / EMAIL CONFIGURATION
# ==============================================

# Use SES as primary? (The system defaults to SES, falls back to SMTP if SES fails)
# Ensure AWS keys are set for SES.
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# AWS_REGION=us-east-1

# SMTP Fallback Configuration (Google)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your_16_char_app_password

# Identity
SMTP_FROM_NAME="Shopify Marketing AI"
SMTP_FROM_EMAIL=your-email@gmail.com
```

### 📝 Variable Details

| Variable | Value | Description |
| :--- | :--- | :--- |
| `SMTP_HOST` | `smtp.gmail.com` | Google's SMTP server address. |
| `SMTP_PORT` | `587` | The port for TLS connections (standard for Gmail). |
| `SMTP_SECURE` | `false` | Use `false` for port 587 (STARTTLS). Use `true` if using port 465. |
| `SMTP_USER` | *Your Email* | Your full Gmail or Workspace email address. |
| `SMTP_PASS` | *App Password* | The 16-char password from Step 1. **NOT your login password.** |

---

## 🧪 Step 3: Local Test Checklist

Before running campaigns, verify your setup:

1.  **Check `.env`**: Ensure `SMTP_PASS` has no extra quotes unless necessary.
2.  **Run Connection Test**:
    *   (Once implemented) Use the **"Test Connection"** button in the dashboard.
    *   Or use the API endpoint: `POST /api/email/test-smtp`
3.  **Send a "Dry Run"**:
    *   Send a campaign with "Dry Run" mode enabled to check logic without actual delivery.

---

## ⚠️ Troubleshooting Common Errors

| Error Code | Potential Cause | Solution |
| :--- | :--- | :--- |
| `535-5.7.8` | **Auth Failed** | Check `SMTP_USER` and `SMTP_PASS`. Ensure you are using an **App Password**. |
| `534-5.7.9` | **App Password Req** | You are using your login password. Go back to Step 1 and generate an App Password. |
| `421 4.7.0` | **Rate Limited** | You are sending too many emails too fast. Gmail has a ~500/day limit (2000/day for Workspace). |
| `550 5.7.1` | **Bad Sender** | The `SMTP_FROM_EMAIL` must match your authenticated `SMTP_USER` (or be an alias). |
| `ETIMEDOUT` | **Network Block** | Your firewall or ISP might block port 587. Try checking your internet connection. |
