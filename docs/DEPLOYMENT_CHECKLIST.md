# Pre-Deployment Checklist - Shopify Marketing AI Platform

## 🎯 Overview
This checklist ensures your application is fully prepared for production deployment. Complete all items before deploying.

**Deployment Target:** _______________  
**Deployment Date:** _______________  
**Deployed By:** _______________  
**Version:** _______________

---

## ✅ Phase 1: Environment Setup

### Local Verification
- [ ] All environment variables are set in `backend/.env`
- [ ] All environment variables are set in `frontend/.env.local`
- [ ] No placeholder values remain (search for "your-", "xxx", "changeme")
- [ ] API keys are valid and tested
- [ ] Database connection string is correct
- [ ] Redis connection string is correct

### Secret Management
- [ ] All secrets are unique (no reused passwords)
- [ ] Secrets are 32+ characters long
- [ ] Secrets are stored securely (not in code)
- [ ] API_KEY matches between backend and frontend
- [ ] JWT_SECRET is set and secure

### Third-Party Services
- [ ] Shopify credentials verified
  - [ ] Store URL is correct
  - [ ] Access token has required scopes
  - [ ] API key and secret are valid
- [ ] Gemini API key is active and has quota
- [ ] AWS SES is configured (if using email)
  - [ ] Sender email is verified
  - [ ] Out of sandbox mode (or test recipients added)
- [ ] Meta Ads credentials are valid (if using)
- [ ] Google Ads credentials are valid (if using)

```bash
# Verify environment
bash scripts/check-env.sh
```

---

## ✅ Phase 2: Code Readiness

### Build Verification
- [ ] Production build completes without errors
- [ ] No TypeScript errors
- [ ] No ESLint errors (or only approved warnings)
- [ ] All dependencies are production versions
- [ ] Package vulnerabilities checked (`npm audit`)

```bash
# Run production build
bash scripts/build-production.sh

# Check for vulnerabilities
npm audit
cd backend && npm audit && cd ..
cd frontend && npm audit && cd ..
```

### Database
- [ ] Migrations are up to date
- [ ] Database schema matches code
- [ ] Indexes are created for frequently queried fields
- [ ] Seed data prepared (if needed)

```bash
# Verify migrations
cd backend
npx prisma migrate status
npx prisma validate
```

### Testing
- [ ] All unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed for critical paths:
  - [ ] User authentication
  - [ ] Campaign creation
  - [ ] AI content generation
  - [ ] Email sending (if configured)
  - [ ] Shopify sync
  - [ ] Analytics dashboard
  - [ ] Approval workflow

```bash
# Run tests
npm test
cd backend && npm test && cd ..
cd frontend && npm test && cd ..
```

---

## ✅ Phase 3: Security Review

### Authentication & Authorization
- [ ] Authentication is required for all API endpoints (except /health)
- [ ] API key validation is working
- [ ] JWT tokens expire appropriately
- [ ] No sensitive data in JWT payload
- [ ] Rate limiting is configured

### Data Security
- [ ] No sensitive data logged
- [ ] PII is properly handled
- [ ] SQL injection prevention verified (using Prisma)
- [ ] XSS protection enabled
- [ ] CORS configured correctly
- [ ] Security headers set (Helmet.js)

### Environment Security
- [ ] Production uses HTTPS only
- [ ] Secure cookies enabled (if using)
- [ ] No debug mode in production
- [ ] Error messages don't leak sensitive info

```bash
# Security scan
npm audit --production
```

---

## ✅ Phase 4: Performance Optimization

### Backend Optimization
- [ ] Database queries are optimized
- [ ] N+1 queries eliminated
- [ ] Pagination implemented for large datasets
- [ ] Caching strategy in place (Redis)
- [ ] Background jobs configured properly

### Frontend Optimization
- [ ] Images are optimized
- [ ] Code splitting implemented
- [ ] Bundle size is reasonable (<500KB initial)
- [ ] Lazy loading implemented where appropriate
- [ ] SEO meta tags configured

### Infrastructure
- [ ] Health check endpoints working
- [ ] Graceful shutdown implemented
- [ ] Memory limits configured
- [ ] CPU limits configured
- [ ] Auto-scaling configured (if applicable)

```bash
# Check bundle size
cd frontend && npm run analyze
```

---

## ✅ Phase 5: Documentation

### Code Documentation
- [ ] README.md is up to date
- [ ] API documentation is complete
- [ ] Environment variables documented
- [ ] Deployment guide is current
- [ ] Troubleshooting guide exists

### Operational Documentation
- [ ] Runbook created for common issues
- [ ] Monitoring alerts documented
- [ ] Backup procedures documented
- [ ] Recovery procedures documented
- [ ] Contact list for emergencies

---

## ✅ Phase 6: Deployment Preparation

### Infrastructure Setup
- [ ] Production servers/services provisioned
- [ ] Domain names configured
- [ ] SSL certificates obtained
- [ ] CDN configured (if using)
- [ ] Load balancer configured (if using)

### Database Setup
- [ ] Production database created
- [ ] Database backups configured
- [ ] Database monitoring enabled
- [ ] Connection pooling configured
- [ ] Read replicas set up (if needed)

### Monitoring & Logging
- [ ] Application monitoring configured
- [ ] Error tracking enabled (e.g., Sentry)
- [ ] Log aggregation set up
- [ ] Alerts configured for:
  - [ ] High error rate
  - [ ] Low disk space
  - [ ] High memory usage
  - [ ] High CPU usage
  - [ ] Service downtime

---

## ✅ Phase 7: Deployment Execution

### Pre-Deployment
- [ ] Deployment window scheduled
- [ ] Stakeholders notified
- [ ] Rollback plan prepared
- [ ] Database backed up
- [ ] Current version tagged in Git

```bash
# Tag release
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0
```

### Deployment Steps
- [ ] Set maintenance mode (if applicable)
- [ ] Deploy database migrations
- [ ] Deploy backend service
- [ ] Deploy frontend service
- [ ] Deploy worker service
- [ ] Update environment variables
- [ ] Clear caches

### Railway Specific
```bash
# Deploy to Railway
railway up

# Run migrations
railway run --service backend npx prisma migrate deploy

# Verify deployment
railway status
```

---

## ✅ Phase 8: Post-Deployment Verification

### Immediate Checks (First 5 minutes)
- [ ] Application loads successfully
- [ ] Health checks passing
- [ ] Can log in successfully
- [ ] Database connections working
- [ ] Redis connections working
- [ ] No critical errors in logs

```bash
# Health checks
curl https://api.yourdomain.com/health
curl https://app.yourdomain.com

# Check logs
railway logs --service backend --tail
railway logs --service frontend --tail
railway logs --service worker --tail
```

### Functional Testing (First 30 minutes)
- [ ] Create test campaign
- [ ] Generate AI content
- [ ] View analytics dashboard
- [ ] Test approval workflow
- [ ] Verify Shopify integration
- [ ] Send test email (if configured)
- [ ] Check performance metrics

### Monitoring (First 24 hours)
- [ ] Error rate is acceptable (<1%)
- [ ] Response times are good (<500ms p95)
- [ ] Memory usage is stable
- [ ] CPU usage is normal
- [ ] No memory leaks detected
- [ ] Background jobs processing

---

## 📋 Rollback Procedure

If critical issues are discovered:

1. **Immediate Actions**
   ```bash
   # Rollback to previous version
   railway rollback
   
   # Or manually revert
   git revert HEAD
   railway up
   ```

2. **Database Rollback** (if schema changed)
   ```bash
   # Restore from backup
   pg_restore -d $DATABASE_URL backup_pre_deployment.sql
   ```

3. **Notify Stakeholders**
   - Send rollback notification
   - Document issues encountered
   - Plan remediation

---

## 📊 Sign-Off

### Technical Approval
- [ ] Backend Developer: _____________ Date: _______
- [ ] Frontend Developer: _____________ Date: _______
- [ ] DevOps Engineer: _____________ Date: _______
- [ ] Security Review: _____________ Date: _______

### Business Approval
- [ ] Product Owner: _____________ Date: _______
- [ ] Project Manager: _____________ Date: _______
- [ ] Stakeholder: _____________ Date: _______

---

## 📝 Notes

**Known Issues:**
_List any known issues or limitations_

**Monitoring Dashboard:**
_Link to monitoring dashboard_

**Emergency Contacts:**
- On-call Engineer: _______________
- Database Admin: _______________
- DevOps Lead: _______________

---

## 🎉 Deployment Complete!

**Production URL:** _______________  
**API URL:** _______________  
**Deployment Time:** _______________  
**Total Downtime:** _______________  

---

*Generated from template v1.0 - December 2024*