# Shambit Customer Portal

A Next.js customer portal integrated with Better Auth authentication system.

## Features

- 🔐 **Secure Authentication** - Powered by Better Auth via NestJS API
- 🎨 **Modern UI** - Built with Tailwind CSS
- 📱 **Responsive Design** - Works on all devices
- 🚀 **Fast Performance** - Next.js App Router with TypeScript
- 🛡️ **Protected Routes** - Middleware-based route protection
- 👤 **User Management** - Profile, dashboard, and account features

## Architecture

```
Customer Portal (Next.js) → NestJS API → Better Auth → Neon PostgreSQL
```

The customer portal communicates with your existing NestJS API which handles all authentication through Better Auth, storing user data in your Neon PostgreSQL database.

## Setup

### Prerequisites

1. **NestJS API running** on `http://localhost:3001`
2. **Better Auth configured** in the NestJS API
3. **Database connection** established in NestJS API

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment setup:**
   The `.env.local` file is already configured to point to your NestJS API:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
   NEXT_PUBLIC_AUTH_URL=http://localhost:3001/api/v1/auth/v2
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

### Authentication Flow

1. **Sign Up:** Create a new account at `/auth/signup`
2. **Sign In:** Login at `/auth/signin`
3. **Dashboard:** Access protected content at `/dashboard`
4. **Sign Out:** Use the user menu to sign out

### API Integration

The portal automatically handles:
- JWT token storage in secure cookies
- Automatic token inclusion in API requests
- Token refresh and error handling
- Redirect to login on authentication errors

### Protected Routes

Routes are protected at multiple levels:
- **Middleware:** Server-side route protection
- **Context:** Client-side authentication state
- **Components:** Protected route wrappers

## Development

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Protected dashboard
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── Header.tsx         # Navigation header
│   ├── UserMenu.tsx       # User dropdown menu
│   └── ProtectedRoute.tsx # Route protection
├── contexts/              # React contexts
│   └── AuthContext.tsx    # Authentication state
├── lib/                   # Utilities
│   └── auth-client.ts     # API client for auth
└── middleware.ts          # Route protection middleware
```

### Key Components

- **AuthContext:** Global authentication state management
- **AuthClient:** HTTP client for API communication
- **ProtectedRoute:** Component-level route protection
- **UserMenu:** User profile and navigation menu

## API Endpoints

The portal communicates with these NestJS API endpoints:

- `POST /auth/v2/signup` - Create new user account
- `POST /auth/v2/signin` - Authenticate user
- `POST /auth/v2/signout` - Sign out user
- `GET /auth/v2/me` - Get current user info
- `GET /auth/v2/session` - Get current session

## Testing

To test the authentication system:

1. **Start your NestJS API** on port 3001
2. **Start the customer portal** on port 3000
3. **Create a test account** via the signup form
4. **Verify authentication** by accessing the dashboard

## Troubleshooting

### Common Issues

1. **API Connection Failed:**
   - Ensure NestJS API is running on `http://localhost:3001`
   - Check CORS settings in your NestJS API

2. **Authentication Errors:**
   - Verify Better Auth is properly configured in NestJS
   - Check database connection in NestJS API

3. **Token Issues:**
   - Clear browser cookies and try again
   - Check browser developer tools for error messages

### Debug Mode

Enable debug logging by adding to `.env.local`:
```
NODE_ENV=development
```

## Next Steps

- [ ] Add email verification flow
- [ ] Implement password reset functionality
- [ ] Add social login providers
- [ ] Create user profile management
- [ ] Add shopping cart functionality
- [ ] Implement order management

## Support

For issues related to:
- **Authentication:** Check your NestJS API and Better Auth configuration
- **UI/UX:** Review the component implementations
- **API Integration:** Verify the auth-client.ts configuration