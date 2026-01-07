
# 🔐 Credentials Audit Report

**Date:** 2026-01-07
**System:** Shopify Marketing AI Platform
**Status:** ⚠️ Action Required (Multiple Missing Credentials)

---

## 📋 Executive Summary
The platform requires specific API keys and credentials to connect with Shopify, Meta (Facebook Ads), Google Ads, and Email providers. Currently, most integrations are unconfigured or using expired dev tokens.

**Action Required:** Please review the "Missing Credentials" table below and provide the updated values securely.

---

## 🔴 Missing / Action Required

These credentials are **required** for core functionality but are currently missing, expired, or were removed for security reasons.

### 🛍️ Shopify Integration
*Required to sync products and orders.*

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `SHOPIFY_STORE_URL` | Your store URL (e.g., `store.myshopify.com`) | Shopify Admin > Settings |
| `SHOPIFY_ACCESS_TOKEN` | Admin API Access Token | Shopify Admin > Apps > App development > Create new app |
| `SHOPIFY_API_KEY` | Public API Key | Same as above |
| `SHOPIFY_API_SECRET` | Secret API Key | Same as above |

### 📱 Meta (Facebook) Ads
*Required to create and manage ad campaigns.*

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `META_APP_ID` | Facebook App ID | developers.facebook.com > My Apps |
| `META_APP_SECRET` | Facebook App Secret | developers.facebook.com > Settings > Basic |
| `META_ACCESS_TOKEN` | System/User Access Token | Graph API Explorer or System User |
| `META_AD_ACCOUNT_ID` | Ad Account ID (starts with `act_`) | Facebook Ads Manager |
| `META_PAGE_ID` | Facebook Page ID | Page Settings > About |

### 📧 Email Delivery (AWS SES or SMTP)
*Required to send marketing emails. Choose one method (AWS SES recommended).*

**Option A: AWS SES (Recommended)**
| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `AWS_ACCESS_KEY_ID` | IAM User Access Key | AWS Console > IAM |
| `AWS_SECRET_ACCESS_KEY` | IAM User Secret | AWS Console > IAM |
| `AWS_REGION` | Region (e.g., `us-east-1`) | AWS Console |
| `SES_FROM_EMAIL` | Verified Sender Email | AWS Console > SES |

**Option B: SMTP (Gmail/Outlook - Dev Only)**
| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `SMTP_HOST` | Host (e.g., `smtp.gmail.com`) | Email Provider Settings |
| `SMTP_USER` | Email Address | Your Email |
| `SMTP_PASS` | App Password (NOT login password) | Google Account > Security > App Passwords |

### 🧠 AI Generation (Google Gemini)
*Required for generating ad copy and content.*

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `GEMINI_API_KEY` | API Key for Gemini Pro | aistudio.google.com/app/apikey |

---

## 🟡 Optional / Future Expansion

These are supported but not critically required for launch.

### 📈 Google Ads
| Variable | Description |
|----------|-------------|
| `GOOGLE_ADS_CUSTOMER_ID` | 10-digit Customer ID |
| `GOOGLE_ADS_DEVELOPER_TOKEN` | Google Ads API Developer Token |
| `GOOGLE_ADS_CLIENT_ID` | OAuth Client ID |
| `GOOGLE_ADS_CLIENT_SECRET` | OAuth Client Secret |
| `GOOGLE_ADS_REFRESH_TOKEN` | OAuth Refresh Token |

---

## 🔒 Security Note
**NEVER send these credentials via plain text email or chat.**
Please share them via a secure password manager (e.g., 1Password, LastPass) or a secure one-time secret link (e.g., onetimesecret.com).
