# CI/CD Pipeline Setup Guide

## Overview

The CI/CD pipeline automatically tests, builds, and deploys your application using GitHub Actions.

## Pipeline Stages

### 1. Test & Lint
- Runs on every push and pull request
- Executes all unit tests (21 tests)
- Generates coverage reports
- Uploads to Codecov

### 2. Build
- Compiles TypeScript to JavaScript
- Generates Prisma Client
- Creates production artifacts
- Stores build for deployment

### 3. Security Scan
- Runs npm audit
- Scans with Snyk (optional)
- Checks for vulnerabilities

### 4. Deploy to Staging
- Triggers on push to `develop` branch
- Deploys to staging environment
- Runs database migrations
- Sends Slack notification

### 5. Deploy to Production
- Triggers on push to `main` branch
- Deploys to production environment
- Runs database migrations
- Performs health check
- Creates GitHub release
- Sends Slack notification

---

## Setup Instructions

### Step 1: GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add these secrets:

#### Database Secrets
```
DATABASE_URL_TEST=postgresql://test_user:test_pass@localhost:5432/test_db
DATABASE_URL_STAGING=<your-neon-staging-connection-string>
DATABASE_URL_PRODUCTION=<your-neon-production-connection-string>
```

#### Railway Secrets (for deployment)
```
RAILWAY_TOKEN=<your-railway-api-token>
RAILWAY_PROJECT_ID_STAGING=<staging-project-id>
RAILWAY_PROJECT_ID_PRODUCTION=<production-project-id>
```

**Get Railway Token:**
1. Go to https://railway.app
2. Account Settings → Tokens
3. Create new token
4. Copy and add to GitHub secrets

**Get Railway Project IDs:**
1. Open your Railway project
2. Settings → General
3. Copy Project ID

#### Optional: Slack Notifications
```
SLACK_WEBHOOK=<your-slack-webhook-url>
```

**Get Slack Webhook:**
1. Go to https://api.slack.com/apps
2. Create new app
3. Incoming Webhooks → Activate
4. Add New Webhook to Workspace
5. Copy webhook URL

#### Optional: Snyk Security Scanning
```
SNYK_TOKEN=<your-snyk-api-token>
```

**Get Snyk Token:**
1. Sign up at https://snyk.io
2. Account Settings → API Token
3. Copy token

---

### Step 2: Railway Setup

#### Create Railway Projects

1. **Staging Environment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create staging project
railway init
# Name: marketplace-api-staging

# Add Neon database
railway add
# Select: PostgreSQL (or link existing Neon)

# Set environment variables
railway variables set NODE_ENV=staging
railway variables set PORT=3001
railway variables set JWT_SECRET=<generate-strong-secret>
railway variables set JWT_REFRESH_SECRET=<generate-strong-secret>
railway variables set ALLOWED_ORIGINS=https://staging.yourdomain.com
```

2. **Production Environment**
```bash
# Create production project
railway init
# Name: marketplace-api-production

# Add Neon database
railway add

# Set environment variables
railway variables set NODE_ENV=production
railway variables set PORT=3001
railway variables set JWT_SECRET=<generate-strong-secret>
railway variables set JWT_REFRESH_SECRET=<generate-strong-secret>
railway variables set ALLOWED_ORIGINS=https://yourdomain.com
railway variables set COOKIE_DOMAIN=yourdomain.com
```

---

### Step 3: Branch Strategy

#### Main Branches
- `main` - Production (auto-deploys to production)
- `develop` - Staging (auto-deploys to staging)
- `feature/*` - Feature branches (runs tests only)

#### Workflow
```bash
# Create feature branch
git checkout -b feature/new-feature

# Make changes and commit
git add .
git commit -m "Add new feature"

# Push to GitHub (triggers tests)
git push origin feature/new-feature

# Create pull request to develop
# After review, merge to develop (deploys to staging)

# After staging validation, merge develop to main (deploys to production)
```

---

### Step 4: Environment Variables

#### Required for All Environments

```env
# Application
NODE_ENV=production
PORT=3001

# Database (Neon)
DATABASE_URL=<neon-connection-string>

# JWT
JWT_SECRET=<min-32-char-random-string>
JWT_REFRESH_SECRET=<different-min-32-char-random-string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Security
ALLOWED_ORIGINS=https://yourdomain.com
COOKIE_DOMAIN=yourdomain.com

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100
```

#### Generate Secure Secrets

```bash
# Generate JWT secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or use OpenSSL
openssl rand -hex 32
```

---

### Step 5: Neon Database Setup

#### Create Separate Databases

1. **Staging Database**
```bash
# Using Neon CLI or Web Console
# Create new project: marketplace-api-staging
# Copy connection string
```

2. **Production Database**
```bash
# Create new project: marketplace-api-production
# Copy connection string
```

#### Run Migrations

```bash
# Staging
DATABASE_URL=<staging-url> npx prisma migrate deploy

# Production
DATABASE_URL=<production-url> npx prisma migrate deploy
```

---

### Step 6: Testing the Pipeline

#### Test CI/CD Locally

```bash
# Install act (GitHub Actions local runner)
# Windows (using Chocolatey)
choco install act-cli

# Or download from: https://github.com/nektos/act

# Run tests locally
act -j test

# Run full pipeline
act
```

#### Trigger Pipeline

```bash
# Push to develop (triggers staging deployment)
git checkout develop
git push origin develop

# Push to main (triggers production deployment)
git checkout main
git merge develop
git push origin main
```

---

### Step 7: Monitoring & Notifications

#### Slack Integration (Optional)

1. Create Slack channel: `#deployments`
2. Add webhook to GitHub secrets
3. Receive notifications for:
   - Deployment start
   - Deployment success/failure
   - Test results

#### GitHub Actions Dashboard

Monitor pipeline at:
```
https://github.com/YOUR_USERNAME/YOUR_REPO/actions
```

---

## Alternative Deployment Options

### Option 1: Vercel (Recommended for Next.js frontend)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Option 2: Netlify (For static sites)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod
```

### Option 3: Docker + Any Cloud Provider

```bash
# Build Docker image
docker build -t marketplace-api .

# Push to registry
docker push your-registry/marketplace-api

# Deploy to cloud (AWS, GCP, Azure, etc.)
```

### Option 4: Heroku

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create app
heroku create marketplace-api

# Deploy
git push heroku main
```

---

## Pipeline Configuration

### Customize Triggers

Edit `.github/workflows/ci-cd.yml`:

```yaml
# Run on specific branches
on:
  push:
    branches: [main, develop, staging]
  
# Run on schedule (daily at midnight)
on:
  schedule:
    - cron: '0 0 * * *'

# Run manually
on:
  workflow_dispatch:
```

### Add More Jobs

```yaml
# Example: E2E tests
e2e-tests:
  name: E2E Tests
  runs-on: ubuntu-latest
  needs: build
  steps:
    - name: Run Playwright tests
      run: npm run test:e2e
```

---

## Troubleshooting

### Pipeline Fails on Tests

```bash
# Check test logs in GitHub Actions
# Run tests locally
npm test

# Check for environment variable issues
```

### Deployment Fails

```bash
# Check Railway logs
railway logs

# Verify environment variables
railway variables

# Check database connection
railway run npx prisma db push
```

### Database Migration Fails

```bash
# Reset database (CAUTION: deletes data)
npx prisma migrate reset

# Or manually run migrations
npx prisma migrate deploy
```

---

## Security Best Practices

### 1. Secrets Management
- ✅ Never commit secrets to Git
- ✅ Use GitHub Secrets for CI/CD
- ✅ Rotate secrets regularly
- ✅ Use different secrets per environment

### 2. Branch Protection
Enable in GitHub Settings → Branches:
- ✅ Require pull request reviews
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict who can push to main

### 3. Environment Protection
Enable in GitHub Settings → Environments:
- ✅ Required reviewers for production
- ✅ Wait timer before deployment
- ✅ Deployment branches (main only)

---

## Cost Optimization

### Free Tier Limits

**GitHub Actions:**
- 2,000 minutes/month (free)
- Unlimited for public repos

**Railway:**
- $5 credit/month (free tier)
- Pay-as-you-go after

**Neon:**
- 1 project free
- 3 GB storage
- 100 hours compute/month

### Reduce Costs

1. **Cache dependencies**
   ```yaml
   - uses: actions/cache@v3
     with:
       path: ~/.npm
       key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
   ```

2. **Run tests in parallel**
   ```yaml
   strategy:
     matrix:
       node-version: [18.x, 20.x]
   ```

3. **Skip redundant builds**
   ```yaml
   if: github.event_name == 'push'
   ```

---

## Next Steps

1. ✅ Set up GitHub secrets
2. ✅ Create Railway projects
3. ✅ Configure branch protection
4. ✅ Test pipeline with feature branch
5. ✅ Deploy to staging
6. ✅ Validate staging environment
7. ✅ Deploy to production
8. ✅ Set up monitoring

---

## Support

- GitHub Actions Docs: https://docs.github.com/actions
- Railway Docs: https://docs.railway.app
- Neon Docs: https://neon.tech/docs
- Prisma Docs: https://www.prisma.io/docs
