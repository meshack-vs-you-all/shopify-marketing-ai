---
description: Test Newsletter & Auth Workflows
---
// turbo-all

# Newsletter & Authentication Test Workflow

## Prerequisites

1. Start Docker (for PostgreSQL & Redis):
```bash
cd /home/meshack/crafted-edge-solutions-clients/Negus/shopify-marketing-ai
docker-compose up -d
```

2. Run database migrations:
```bash
cd backend
npx prisma migrate dev
```

3. Seed a test user:
```bash
cd backend
npx ts-node scripts/seed-user.ts
```

---

## Test 1: Login Workflow

### Backend (Terminal 1)
```bash
cd /home/meshack/crafted-edge-solutions-clients/Negus/shopify-marketing-ai/backend
npm run dev
```

### Frontend (Terminal 2)
```bash
cd /home/meshack/crafted-edge-solutions-clients/Negus/shopify-marketing-ai/frontend
npm run dev
```

### Steps
1. Open http://localhost:3000
2. You should be redirected to /login
3. Login with:
   - Email: `admin@glowify.com`
   - Password: `password123`
4. ✅ Should redirect to dashboard

---

## Test 2: Email List Management

1. Navigate to Email Marketing → Manage Lists
2. Create a new list: "Newsletter Subscribers"
3. ✅ List should appear in the grid

---

## Test 3: CSV Import

1. On a list, click "Import CSV"
2. Upload `subscribers.csv` (format: email, firstName, lastName)
3. ✅ Should show success message
4. Subscriber count should update

---

## Test 4: Create & Send Newsletter

1. Navigate to Email Marketing → Create Newsletter
2. Select "Newsletter Subscribers" list
3. Enter subject: "Test Newsletter"
4. Enter HTML content: `<h1>Hello!</h1><p>This is a test.</p>`
5. Click "Send Newsletter"
6. ✅ Should queue newsletter for sending

---

## Test 5: Dashboard Stats

1. Return to Email Marketing dashboard
2. ✅ Should show:
   - Total Subscribers (from lists)
   - Campaigns sent count
   - Emails delivered count
   - Average open rate

---

## Test 6: Logout

1. Click logout button in sidebar (bottom right)
2. ✅ Should redirect to /login
3. Trying to access /email/dashboard directly should redirect to /login

---

## Test 7: Protected API Routes

```bash
# Without auth - should return 401
curl http://localhost:5000/api/email-campaigns/lists

# With auth - should return lists
TOKEN="<your-jwt-token>"
curl -H "Authorization: Bearer $TOKEN" http://localhost:5000/api/email-campaigns/lists
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Login fails | Check backend is running, database has seeded user |
| 401 on API calls | Token expired or missing - try logging in again |
| Redis connection error | Run `docker-compose up -d` to start Redis |
| Database error | Run `npx prisma migrate dev` |
