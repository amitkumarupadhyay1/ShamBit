# Marketplace API - Authentication Module

Production-ready NestJS authentication system with JWT, refresh tokens, and Neon PostgreSQL.

## Features

✅ **Complete Authentication System**
- User registration with validation
- Email/password login
- JWT access tokens (15min expiry)
- Refresh tokens with rotation (7 days)
- Secure logout with token denylist
- User profile management

✅ **Security Best Practices**
- Bcrypt password hashing (12 rounds)
- HTTP-only secure cookies
- CORS protection
- Helmet security headers
- Rate limiting (Throttler)
- Input validation & sanitization
- Token denylist for logout
- Refresh token rotation

✅ **Production Infrastructure**
- Neon PostgreSQL database
- Prisma ORM
- Global auth guard
- Comprehensive error handling
- Logging service
- Swagger API documentation

✅ **Testing**
- 21 unit tests (100% pass rate)
- Service layer tests
- Controller layer tests
- Mock implementations

## Tech Stack

- **Framework**: NestJS 10
- **Database**: Neon PostgreSQL (Serverless)
- **ORM**: Prisma 5.22
- **Authentication**: JWT + Passport
- **Validation**: class-validator
- **Testing**: Jest
- **Documentation**: Swagger/OpenAPI

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd api-nestjs
npm install
```

### Environment Variables

Create or update `.env`:

```env
NODE_ENV=development
PORT=3002

# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_1aMifZB8OyPw@ep-shy-mouse-ahf2c6ga-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Cookie Configuration
COOKIE_DOMAIN=localhost
```

### Database Setup

The database schema is already deployed to Neon. To sync or update:

```bash
# Generate Prisma Client
npx prisma generate

# Push schema changes (development)
npx prisma db push

# View database in Prisma Studio
npx prisma studio
```

### Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production build
npm run build
npm run start:prod
```

Server runs at: `http://localhost:3002`
API Docs: `http://localhost:3002/api/docs`

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:cov
```

## API Endpoints

### Authentication

All endpoints are prefixed with `/api/v1/auth`

#### Register User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phone": "+1234567890"
}
```

**Response**: Sets `accessToken` and `refreshToken` cookies
```json
{
  "message": "Registration successful",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "roles": ["BUYER"]
  }
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}
```

**Response**: Sets `accessToken` and `refreshToken` cookies
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "roles": ["BUYER"]
  }
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Cookie: refreshToken=<token>
```

**Response**: Sets new `accessToken` and `refreshToken` cookies
```json
{
  "message": "Token refreshed successfully",
  "user": { ... }
}
```

#### Get Profile (Protected)
```http
GET /api/v1/auth/me
Authorization: Bearer <accessToken>
# OR
Cookie: accessToken=<token>
```

**Response**:
```json
{
  "id": "uuid",
  "email": "john@example.com",
  "name": "John Doe",
  "phone": "+1234567890",
  "roles": ["BUYER"],
  "isEmailVerified": false,
  "status": "ACTIVE"
}
```

#### Logout (Protected)
```http
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

**Response**: Clears cookies and denylists token
```json
{
  "message": "Logged out successfully"
}
```

## Database Schema

### Users Table
```prisma
model User {
  id                    String       @id @default(uuid())
  email                 String       @unique
  name                  String
  password              String
  phone                 String?
  roles                 String[]     @default(["BUYER"])
  isEmailVerified       Boolean      @default(false)
  status                UserStatus   @default(ACTIVE)
  lastLoginAt           DateTime?
  refreshToken          String?
  refreshTokenExpiresAt DateTime?
  createdAt             DateTime     @default(now())
  updatedAt             DateTime     @updatedAt
}
```

## Project Structure

```
api-nestjs/
├── src/
│   ├── common/
│   │   ├── decorators/       # @Public(), @CurrentUser()
│   │   ├── guards/           # AuthGuard
│   │   └── types/            # UserRole enum, interfaces
│   ├── domains/
│   │   └── auth/
│   │       ├── dto/          # Validation DTOs
│   │       ├── strategies/   # JWT & Google strategies
│   │       ├── auth.controller.ts
│   │       ├── auth.service.ts
│   │       ├── auth.repository.ts
│   │       ├── auth.module.ts
│   │       ├── *.spec.ts     # Unit tests
│   ├── infrastructure/
│   │   ├── prisma/           # Database service
│   │   ├── security/         # Token denylist
│   │   └── observability/    # Logger service
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── .env
├── package.json
└── jest.config.js
```

## Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Token Management
- Access tokens: 15 minutes (short-lived)
- Refresh tokens: 7 days (stored in database)
- Automatic token rotation on refresh
- Token denylist for logout

### Cookie Security
- HTTP-only (prevents XSS)
- Secure flag in production (HTTPS only)
- SameSite=strict (CSRF protection)
- Domain-specific

### Rate Limiting
- Register: 5 attempts/minute
- Login: 10 attempts/minute
- Global: 100 requests/minute

## Testing

Test coverage includes:

**AuthService (13 tests)**
- User registration (success & conflicts)
- Login (success, invalid credentials, suspended users)
- Token refresh (success & invalid tokens)
- Logout (with/without access token)
- Profile retrieval
- Token generation

**AuthController (8 tests)**
- All endpoints with cookie handling
- Request/response validation
- Error scenarios

Run tests:
```bash
npm test
```

## Deployment

### Environment Variables for Production

Update `.env.production`:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=<production-neon-connection-string>
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_REFRESH_SECRET=<different-strong-random-secret>
ALLOWED_ORIGINS=https://yourdomain.com
COOKIE_DOMAIN=yourdomain.com
```

### Build & Run
```bash
npm run build
npm run start:prod
```

### Docker (Optional)
```bash
docker build -t marketplace-api .
docker run -p 3001:3001 --env-file .env.production marketplace-api
```

## Database Connection

**Neon Project**: wandering-cake-01299819
**Database**: neondb
**Region**: AWS US-East-1

The database uses Neon's serverless PostgreSQL with:
- Automatic scaling
- Scale-to-zero (cost-efficient)
- Connection pooling
- SSL/TLS encryption

## Troubleshooting

### Database Connection Issues
If you can't connect to Neon:
1. Check your internet connection
2. Verify the connection string in `.env`
3. Ensure SSL mode is enabled
4. Check if your IP is allowed (Neon allows all by default)

### Port Already in Use
Change the PORT in `.env` to an available port (e.g., 3002, 3003)

### Test Failures
```bash
# Clear Jest cache
npx jest --clearCache

# Run tests with verbose output
npm test -- --verbose
```

## Next Steps

### Recommended Enhancements
1. **Email Verification**: Implement email verification flow
2. **Password Reset**: Add forgot password functionality
3. **2FA**: Two-factor authentication
4. **OAuth**: Complete Google OAuth implementation
5. **Redis**: Replace in-memory token denylist with Redis
6. **Rate Limiting**: Use Redis for distributed rate limiting
7. **Audit Logs**: Track authentication events
8. **Session Management**: View/revoke active sessions

### Google OAuth Setup
To enable Google authentication:
1. Create OAuth credentials in Google Cloud Console
2. Update `.env` with `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
3. Implement token verification in `auth.service.ts`

## Support

For issues or questions:
- Check Swagger docs: `http://localhost:3002/api/docs`
- Review test files for usage examples
- Check NestJS documentation: https://docs.nestjs.com

## License

UNLICENSED - Private/Proprietary
