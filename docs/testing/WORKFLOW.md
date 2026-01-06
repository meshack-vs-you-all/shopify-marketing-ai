# Testing Workflow

This document outlines the step-by-step process to verify the application's core functionality, focusing on Email Marketing, AI Content Generation, and System Health.

## Prerequisites
1.  **Environment**: Ensure `backend/.env` and `frontend/.env.local` are configured.
2.  **Infrastructure**: Docker containers for Postgres and Redis must be running.
    ```bash
    docker-compose up -d
    ```
3.  **Dependencies**: Install dependencies in both `backend` and `frontend`.
    ```bash
    npm install
    ```

## 1. System Startup
Start both services in separate terminals:

**Backend (Port 5000):**
```bash
cd backend
npm run dev
```

**Frontend (Port 3000/3001):**
```bash
cd frontend
npm run dev
```

## 2. Health & Connections Verification
Before testing features, ensure the backend services are connected.

1.  **Check Health Endpoint**:
    - URL: `http://localhost:5000/health`
    - Expected: `{"status":"ok", ...}`
2.  **Verify Connections Script** (Backend):
    ```bash
    npx tsx backend/scripts/verify-all-credentials.ts
    ```
    - Expected: Green checks for Database, Redis, and Google SMTP.

## 3. Email System Verification
### A. Test SMTP Connection
1.  Navigate to **Dashboard** > **Settings** (if available) OR use Postman/Curl.
2.  **API Test**:
    ```bash
    curl -X POST http://localhost:5000/api/email-campaigns/test-smtp \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer <YOUR_TOKEN>" \
      -d '{"email": "your-test-email@gmail.com", "dryRun": false}'
    ```
    *Note: Get `<YOUR_TOKEN>` from the browser local storage after logging in.*

### B. Newsletter Management
1.  Open Frontend: `http://localhost:3001/email/lists`
2.  **Create List**: Click "New List", enter "Test List", and submit.
3.  **Add Subscriber**: Open the list, click "Add Manually", and add your email.
4.  **Import CSV**: Try importing a sample CSV file with `email,firstName` headers.

### C. Campaign Creation (Dry Run)
1.  Navigate to `http://localhost:3001/email/new` (or Campaigns).
2.  Create a new campaign.
3.  **AI Generation**: Click "Generate Content", enter a prompt (e.g., "Holiday Sale"), and verify AI populates the subject/body.
4.  **Dry Run**: Ensure "Dry Run" is checked (if available in UI) or proceed to send.
5.  **Verify**: Check logs on the backend terminal.

## 4. AI Content Studio
1.  Navigate to `http://localhost:3001/ai-studio`.
2.  Select "Email Marketing" type.
3.  Enter a prompt and click "Generate".
4.  Verify that content is generated using the configured Gemini model.

## 5. Troubleshooting
*   **CORS Errors**: Check `backend/src/index.ts` allows the frontend port.
*   **Database/Redis Errors**: Restart Docker containers: `docker-compose restart`.
*   **SMTP Errors**: Check `docs/GOOGLE_SMTP_SETUP.md` and verify "App Password" is correct.
