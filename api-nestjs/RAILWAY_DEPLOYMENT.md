# Railway Deployment Guide

## Quick Setup Steps

### 1. Create Railway Account
- Go to [Railway.app](https://railway.app)
- Sign up with GitHub account
- Click "New Project"

### 2. Deploy from GitHub
- Choose "Deploy from GitHub repo"
- Select this repository
- Railway will auto-detect Node.js project

### 3. Configure Environment Variables
Copy all variables from `.env.railway` file to Railway dashboard:

**Essential Variables (MUST SET):**
```
DATABASE_URL=postgresql://neondb_owner:npg_MNme3xyqJ8hl@ep-dark-dawn-ahpsbaax-pooler.c-3.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
NODE_ENV=production
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-railway-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production-railway-2024
COOKIE_SECRET=your-cookie-secret-key-change-this-in-production-railway-2024
INTERNAL_API_TOKEN=your-internal-api-token-change-this-railway-2024
ENCRYPTION_KEY=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

### 4. Update Build Settings (if needed)
- Build Command: `npm run build:railway`
- Start Command: `npm run railway:deploy`

### 5. Deploy!
- Push changes to GitHub
- Railway will automatically build and deploy
- Get your app URL: `https://your-app-name.railway.app`

### 6. Post-Deployment
1. Test API: `https://your-app-name.railway.app/api/v1/health`
2. Update CORS: Set `ALLOWED_ORIGINS` to your Railway URL
3. Update OAuth: Set `GOOGLE_CALLBACK_URL` to your Railway URL

## Optional: Add Redis
1. In Railway project, click "New Service"
2. Choose "Database" → "Redis"
3. Railway provides `REDIS_URL` automatically

## Optional: Custom Domain
1. Railway Settings → Domains
2. Add your domain
3. Update DNS records
4. Update environment variables with new domain

## Troubleshooting
- Check build logs in Railway dashboard
- Ensure all environment variables are set
- Verify Neon database connection
- Check Prisma migrations run successfully

## Your Database Connection
- **Neon Project**: marketplace-api
- **Connection String**: Already configured in `.env.railway`
- **Database**: neondb
- **Region**: us-east-1