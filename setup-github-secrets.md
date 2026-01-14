# GitHub Secrets Setup - Copy & Paste Guide

## 🔐 Required Secrets

Go to: **Your GitHub Repo → Settings → Secrets and variables → Actions → New repository secret**

---

## 1. Database URLs

### DATABASE_URL_TEST
```
postgresql://localhost:5432/test_db
```
*Note: This is for CI/CD testing only, doesn't need to be a real database*

### DATABASE_URL_STAGING
```
postgresql://neondb_owner:npg_1aMifZB8OyPw@ep-shy-mouse-ahf2c6ga-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```
*Note: You should create a separate Neon project for staging*

### DATABASE_URL_PRODUCTION
```
postgresql://neondb_owner:npg_1aMifZB8OyPw@ep-shy-mouse-ahf2c6ga-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```
*Note: You should create a separate Neon project for production*

---

## 2. Railway Configuration

### Get Railway Token:
1. Go to https://railway.app
2. Click your profile → Account Settings
3. Click "Tokens" tab
4. Click "Create Token"
5. Copy the token

### RAILWAY_TOKEN
```
<paste-your-railway-token-here>
```

### Get Railway Project IDs:

**For Staging:**
1. Create new project in Railway: "marketplace-api-staging"
2. Go to project Settings
3. Copy Project ID

### RAILWAY_PROJECT_ID_STAGING
```
<paste-staging-project-id-here>
```

**For Production:**
1. Create new project in Railway: "marketplace-api-production"
2. Go to project Settings
3. Copy Project ID

### RAILWAY_PROJECT_ID_PRODUCTION
```
<paste-production-project-id-here>
```

---

## 3. Optional: Slack Notifications

### Get Slack Webhook:
1. Go to https://api.slack.com/apps
2. Create new app
3. Enable "Incoming Webhooks"
4. Add webhook to workspace
5. Copy webhook URL

### SLACK_WEBHOOK (Optional)
```
https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 4. Optional: Snyk Security Scanning

### Get Snyk Token:
1. Sign up at https://snyk.io
2. Go to Account Settings
3. Copy API Token

### SNYK_TOKEN (Optional)
```
<paste-your-snyk-token-here>
```

---

## ✅ Verification Checklist

After adding all secrets, verify:

- [ ] DATABASE_URL_TEST added
- [ ] DATABASE_URL_STAGING added
- [ ] DATABASE_URL_PRODUCTION added
- [ ] RAILWAY_TOKEN added
- [ ] RAILWAY_PROJECT_ID_STAGING added
- [ ] RAILWAY_PROJECT_ID_PRODUCTION added
- [ ] SLACK_WEBHOOK added (optional)
- [ ] SNYK_TOKEN added (optional)

---

## 🚀 Next Steps

After adding secrets:

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add CI/CD pipeline"
   git push origin main
   ```

2. **Check Actions Tab**
   - Go to your repo → Actions tab
   - You should see the pipeline running

3. **Test with Feature Branch**
   ```bash
   git checkout -b feature/test-cicd
   git push origin feature/test-cicd
   ```

---

## 🆘 If You Don't Want to Use Railway

You can use other deployment platforms:

### Vercel
- No secrets needed
- Just connect GitHub repo
- Auto-deploys on push

### Heroku
- Get API key from Account Settings
- Add as HEROKU_API_KEY secret
- Update workflow to use Heroku CLI

### Docker + Any Cloud
- Build Docker image
- Push to registry
- Deploy to your cloud provider

---

## 📝 Notes

- **NEVER commit secrets to git**
- **Use different secrets for staging and production**
- **Rotate secrets every 90 days**
- **Keep this file secure** (it contains your connection strings)

---

## ⚠️ Security Notice

The database connection string shown above was exposed in our chat.
**You should rotate it immediately:**

1. Go to Neon Console
2. Select your project
3. Settings → Reset Password
4. Update the connection strings above
5. Update GitHub secrets
