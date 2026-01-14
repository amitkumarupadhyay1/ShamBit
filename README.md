# Marketplace API

A modern NestJS-based marketplace API with PostgreSQL and Prisma.

## Quick Start

```bash
cd api-nestjs
npm install
cp .env.example .env
# Edit .env with your database URL
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

## Deployment

See [api-nestjs/DEPLOYMENT.md](api-nestjs/DEPLOYMENT.md) for Railway deployment instructions.

## Project Structure

- `api-nestjs/` - Main NestJS application
- `api-nestjs/src/` - Source code
- `api-nestjs/prisma/` - Database schema and migrations

## Key Features

- Authentication & Authorization
- Product Management
- Order Processing
- Notification System
- Search & Filtering
- Payment Integration
- Multi-tenant Support