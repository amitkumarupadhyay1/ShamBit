# 🚀 Quick Railway Deployment (Fixed for Subdirectory)

## The Issue
Railway couldn't detect your Node.js project because it's in the `api-nestjs` subdirectory. This is now fixed!

## 1-Minute Setup (Updated)

### Step 1: Get Environment Variables
```bash
cd api-nestjs
npm run railway:env
```
Copy the output - you'll need it for Railway.

### Step 2: Deploy to Railway
1. Go to [Railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository (root directory)
4. Railway will now detect the Node.js project correctly

### Step 3: Add Environment Variables
1. In Railway dashboard, go to "Variables" tab
2. Paste all the variables from Step 1
3. **Important**: Update `ALLOWED_ORIGINS` with your Railway URL

### Step 4: Wait for Deployment
- Railway will build using the root configuration
- It will automatically navigate to the `api-nestjs` directory
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

## What I Fixed
✅ **Root package.json**: Railway can now detect Node.js project
✅ **Root Dockerfile**: Handles subdirectory deployment
✅ **Root railway.json**: Proper build configuration
✅ **Root nixpacks.toml**: Alternative build method
✅ **Subdirectory navigation**: All commands now use `cd api-nestjs`
✅ **Dependency conflicts**: Fixed @nestjs/axios version compatibility
✅ **NPM configuration**: Added --legacy-peer-deps for smooth builds

## Your Database is Ready!
✅ **Neon Database**: Already configured and connected
✅ **Connection String**: Included in environment variables
✅ **Migrations**: Will run automatically on deployment

## Build Process Now:
1. Railway detects Node.js project in root
2. Installs dependencies in `api-nestjs/`
3. Generates Prisma client
4. Builds NestJS application
5. Runs migrations and starts server

## Next Steps (Optional)
- Add Redis: Railway dashboard → "New Service" → "Redis"
- Custom Domain: Railway dashboard → "Settings" → "Domains"
- Add OAuth: Update `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Add Email: Update SMTP variables

## Troubleshooting
- **Build fails**: Check Railway build logs
- **"Script start.sh not found"**: Fixed with root configuration
- **"ERESOLVE could not resolve"**: Fixed with --legacy-peer-deps
- **Dependency conflicts**: Fixed @nestjs/axios version compatibility
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