# 🚀 Quick Railway Deployment

## 1-Minute Setup

### Step 1: Get Environment Variables
```bash
npm run railway:env
```
Copy the output - you'll need it for Railway.

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Railway will start building automatically

### Step 3: Add Environment Variables
1. In Railway dashboard, go to "Variables" tab
2. Paste all the variables from Step 1
3. **Important**: Update `ALLOWED_ORIGINS` with your Railway URL

### Step 4: Wait for Deployment
- Railway will build and deploy automatically
- Check build logs for any issues
- Your API will be available at: `https://your-app-name.railway.app`

### Step 5: Test Your API
```bash
curl https://your-app-name.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2024-01-13T..."
}
```

## Your Database is Ready!
✅ **Neon Database**: Already configured and connected
✅ **Connection String**: Included in environment variables
✅ **Migrations**: Will run automatically on deployment

## Next Steps (Optional)
- Add Redis: Railway dashboard → "New Service" → "Redis"
- Custom Domain: Railway dashboard → "Settings" → "Domains"
- Add OAuth: Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Add Email: Update SMTP variables

## Troubleshooting
- **Build fails**: Check Railway build logs
- **Database issues**: Verify Neon connection string
- **Health check fails**: Check `/health` endpoint
- **CORS errors**: Update `ALLOWED_ORIGINS` with your domain

## Support
Your API includes these health endpoints:
- `/health` - Basic health check
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

**Database**: Neon PostgreSQL (marketplace-api project)
**Region**: us-east-1
**Status**: ✅ Ready for deployment