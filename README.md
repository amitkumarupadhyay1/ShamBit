# Marketplace API - Railway Deployment

This repository contains a NestJS marketplace API configured for Railway deployment.

## 🚀 Quick Deploy to Railway

The API is located in the `api-nestjs/` directory. Railway configuration is set up in the root to handle subdirectory deployment.

### Deploy Now:
1. Fork/clone this repository
2. Go to [Railway.app](https://railway.app)
3. Deploy from GitHub repo
4. Add environment variables (see instructions below)

### Get Environment Variables:
```bash
cd api-nestjs
npm run railway:env
```

## 📁 Project Structure
```
├── api-nestjs/          # NestJS API source code
├── package.json         # Root package.json for Railway detection
├── Dockerfile          # Railway deployment configuration
├── railway.json        # Railway service configuration
├── nixpacks.toml       # Alternative build configuration
└── README.md           # This file
```

## 🔗 Database
- **Provider**: Neon PostgreSQL
- **Connection**: Pre-configured in environment variables
- **Migrations**: Run automatically on deployment

## 📚 Documentation
- **Quick Start**: `api-nestjs/QUICK_DEPLOY.md`
- **Detailed Guide**: `api-nestjs/RAILWAY_DEPLOYMENT.md`
- **API Docs**: Available at `/api` endpoint after deployment

## 🏥 Health Checks
- `/health` - Basic health check
- `/health/ready` - Readiness probe  
- `/health/live` - Liveness probe

## 🛠 Local Development
```bash
cd api-nestjs
npm install
npm run start:dev
```

## 🚀 Railway Deployment Status
✅ Configured for Railway  
✅ Neon Database Connected  
✅ Environment Variables Ready  
✅ Health Checks Enabled  
✅ Subdirectory Deployment Fixed  

**Ready to deploy!**