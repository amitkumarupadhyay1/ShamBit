# CI/CD Pipeline - Quick Start Guide

## ✅ Pipeline Test Results

**Status**: PASSED ✅
**All Tests**: 21/21 passing
**Build**: Successful
**Time**: ~60 seconds

Your pipeline is ready to use!

---

## 🚀 Quick Start (5 Minutes)

### Step 1: Push to GitHub (1 minute)

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit with CI/CD pipeline"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push to GitHub
git push -u origin main
```

### Step 2: Configure GitHub Secrets (3 minutes)

Go to: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Click "New repository secret" and add:

**Required Secrets:**
```
DATABASE_URL_TEST=postgresql://localhost:5432/test_db
DATABASE_URL_STAGING=<your-neon-staging-url>
DATABASE_URL_PRODUCTION=<your-neon-production-url>
RAILWAY_TOKEN=<get-from-railway.app>
RAILWAY_PROJECT_ID_STAGING=<staging-project-id>
RAILWAY_PROJECT_ID_PRODUCTION=<production-project-id>
```

**Optional Secrets:**
```
SLACK_WEBHOOK=<your-slack-webhook>
SNYK_TOKEN=<your-snyk-token>
```

### Step 3: Enable GitHub Actions (1 minute)

1. Go to "Actions" tab in your repository
2. Click "I understand my workflows, go ahead and enable them"
3. Pipeline will run automatically on next push

---

## 🧪 Test the Pipeline

### Test 1: Feature Branch (Tests Only)

```bash
# Create feature branch
git checkout -b feature/test-pipeline

# Make a small change
echo "# Test" >> README.md

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin feature/test-pipeline

# Check GitHub Actions tab
# Should see: ✅ Tests passing
```

### Test 2: Staging Deployment

```bash
# Switch to develop branch
git checkout -b develop

# Merge feature
git merge feature/test-pipeline

# Push to trigger staging deployment
git push origin develop

# Check GitHub Actions tab
# Should see: ✅ Tests → ✅ Build → ✅ Deploy to Staging
```

### Test 3: Production Deployment

```bash
# Switch to main branch
git checkout main

# Merge develop
git merge develop

# Push to trigger production deployment
git push origin main

# Check GitHub Actions tab
# Should see: ✅ Tests → ✅ Build → ✅ Security → ✅ Deploy to Production
```

---

## 📊 What Happens When You Push?

### Push to Feature Branch
```
1. ✅ Run tests (21 tests)
2. ✅ Generate coverage report
3. ✅ Build application
4. ✅ Security scan
5. ⏸️ Stop (no deployment)
```

### Push to Develop Branch
```
1. ✅ Run tests
2. ✅ Build application
3. ✅ Deploy to staging
4. ✅ Run database migrations
5. ✅ Send Slack notification
```

### Push to Main Branch
```
1. ✅ Run tests
2. ✅ Build application
3. ✅ Security scan
4. ✅ Deploy to production
5. ✅ Run database migrations
6. ✅ Health check
7. ✅ Create GitHub release
8. ✅ Send Slack notification
```

---

## 🔧 Railway Setup (Optional - For Deployment)

### Create Staging Project

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init
# Name: marketplace-api-staging

# Link to GitHub
railway link

# Set environment variables
railway variables set NODE_ENV=staging
railway variables set PORT=3001
railway variables set JWT_SECRET=<generate-secret>
railway variables set JWT_REFRESH_SECRET=<generate-secret>

# Get project ID
railway status
# Copy Project ID to GitHub secrets
```

### Create Production Project

```bash
# Create new project
railway init
# Name: marketplace-api-production

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=<generate-secret>
railway variables set JWT_REFRESH_SECRET=<generate-secret>

# Get project ID
railway status
# Copy Project ID to GitHub secrets
```

---

## 📈 Monitor Your Pipeline

### GitHub Actions Dashboard

View all pipeline runs:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

### Check Specific Run

1. Click on workflow run
2. View logs for each job
3. Download artifacts
4. Re-run failed jobs

### Railway Dashboard

Monitor deployments:
```
https://railway.app/dashboard
```

---

## 🐛 Troubleshooting

### Pipeline Fails on Tests

**Check:**
```bash
# Run tests locally
npm test

# Check for errors
npm run build
```

**Fix:**
- Ensure all tests pass locally
- Check environment variables
- Verify dependencies are installed

### Deployment Fails

**Check:**
```bash
# Verify Railway token
railway whoami

# Check project ID
railway status

# Test deployment locally
railway up
```

**Fix:**
- Verify RAILWAY_TOKEN in GitHub secrets
- Check RAILWAY_PROJECT_ID is correct
- Ensure environment variables are set in Railway

### Health Check Fails

**Check:**
```bash
# Test health endpoint locally
curl http://localhost:3002/api/v1/health

# Check Railway logs
railway logs
```

**Fix:**
- Ensure server starts correctly
- Verify health endpoint is accessible
- Check database connection

---

## 📋 Checklist

### Before First Push
- [ ] Code committed to git
- [ ] .env in .gitignore
- [ ] Tests passing locally
- [ ] Build successful locally

### Before Enabling Deployments
- [ ] GitHub secrets configured
- [ ] Railway projects created
- [ ] Environment variables set
- [ ] Database migrations ready

### After First Deployment
- [ ] Staging deployment successful
- [ ] Health check passing
- [ ] Database connected
- [ ] API endpoints working

---

## 🎯 Success Criteria

Your pipeline is working correctly when:

✅ **Tests Stage**
- All 21 tests pass
- Coverage report generated
- No TypeScript errors

✅ **Build Stage**
- Application compiles
- dist/ folder created
- No build errors

✅ **Security Stage**
- npm audit completes
- Vulnerabilities reported
- No critical issues

✅ **Deployment Stage**
- Application deploys successfully
- Database migrations run
- Health check passes
- API responds correctly

---

## 📞 Need Help?

### Documentation
- Full guide: `CI_CD_SETUP_GUIDE.md`
- Test report: `CI_CD_PIPELINE_TEST_REPORT.md`
- GitHub Actions: https://docs.github.com/actions
- Railway: https://docs.railway.app

### Common Commands

```bash
# Run pipeline test locally
.\test-pipeline.ps1

# Check pipeline status
git push origin main
# Then check: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# View Railway logs
railway logs

# Re-run failed deployment
railway up
```

---

## 🎉 You're Ready!

Your CI/CD pipeline is:
- ✅ Tested and working
- ✅ Configured correctly
- ✅ Ready for production

**Next step**: Push to GitHub and watch it run! 🚀
