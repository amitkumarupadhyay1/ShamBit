# Google OAuth Setup Guide

## What You Need to Do

Setting up Google OAuth requires configuration on both Google Cloud Console and your application.

---

## Step 1: Google Cloud Console Setup

### 1.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: `Marketplace API`
4. Click "Create"

### 1.2 Enable Google+ API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google+ API"
3. Click on it and click "Enable"

### 1.3 Configure OAuth Consent Screen

1. Go to "APIs & Services" → "OAuth consent screen"
2. Select "External" (for public apps) or "Internal" (for organization only)
3. Click "Create"

**Fill in the form:**
- **App name**: Marketplace API
- **User support email**: your-email@example.com
- **App logo**: (optional) Upload your logo
- **Application home page**: https://yourdomain.com
- **Application privacy policy**: https://yourdomain.com/privacy
- **Application terms of service**: https://yourdomain.com/terms
- **Authorized domains**: 
  - yourdomain.com
  - localhost (for development)
- **Developer contact email**: your-email@example.com

4. Click "Save and Continue"

**Scopes:**
1. Click "Add or Remove Scopes"
2. Select these scopes:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
3. Click "Update" → "Save and Continue"

**Test users** (if using External):
1. Add your email for testing
2. Click "Save and Continue"

### 1.4 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Select "Web application"

**Configure:**
- **Name**: Marketplace API OAuth Client
- **Authorized JavaScript origins**:
  - http://localhost:3002 (development)
  - https://yourdomain.com (production)
- **Authorized redirect URIs**:
  - http://localhost:3002/api/v1/auth/google/callback (development)
  - https://yourdomain.com/api/v1/auth/google/callback (production)

4. Click "Create"
5. **IMPORTANT**: Copy the Client ID and Client Secret

---

## Step 2: Update Environment Variables

### 2.1 Development (.env)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
GOOGLE_CALLBACK_URL=http://localhost:3002/api/v1/auth/google/callback
```

### 2.2 Production

Add to Railway/Vercel/your hosting:
```env
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
GOOGLE_CALLBACK_URL=https://yourdomain.com/api/v1/auth/google/callback
```

---

## Step 3: Install Google Auth Library

```bash
cd api-nestjs
npm install google-auth-library
```

---

## Step 4: Update Auth Service

Replace the placeholder in `src/domains/auth/auth.service.ts`:

```typescript
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly tokenDenylistService: TokenDenylistService,
  ) {
    // Initialize Google OAuth client
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
      this.configService.get('GOOGLE_CALLBACK_URL'),
    );
  }

  async googleAuth(googleAuthDto: GoogleAuthDto): Promise<AuthResponseDto> {
    try {
      // Verify the Google ID token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: googleAuthDto.googleToken,
        audience: this.configService.get('GOOGLE_CLIENT_ID'),
      });

      const payload = ticket.getPayload();
      
      if (!payload || !payload.email) {
        throw new BadRequestException('Invalid Google token');
      }

      // Extract user info from Google
      const { email, name, picture, email_verified } = payload;

      // Check if user exists
      let user = await this.authRepository.findByEmail(email);

      if (!user) {
        // Create new user from Google data
        user = await this.authRepository.create({
          name: name || email.split('@')[0],
          email: email,
          password: await bcrypt.hash(Math.random().toString(36), 12), // Random password for OAuth users
          roles: [UserRole.BUYER],
          isEmailVerified: email_verified || false,
        });
      }

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.roles);
      await this.authRepository.saveRefreshToken(user.id, tokens.refreshToken);
      await this.authRepository.updateLastLogin(user.id);

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid Google token');
    }
  }
}
```

---

## Step 5: Frontend Integration

### 5.1 Install Google Sign-In Library

**For React:**
```bash
npm install @react-oauth/google
```

**For Vue:**
```bash
npm install vue3-google-login
```

**For Angular:**
```bash
npm install @abacritt/angularx-social-login
```

### 5.2 React Example

```typescript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

function App() {
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch('http://localhost:3002/api/v1/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({
          googleToken: credentialResponse.credential,
        }),
      });

      const data = await response.json();
      console.log('Login successful:', data);
      // Store tokens or redirect user
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => console.log('Login Failed')}
      />
    </GoogleOAuthProvider>
  );
}
```

### 5.3 Vue Example

```vue
<template>
  <div>
    <GoogleLogin :callback="handleGoogleLogin" />
  </div>
</template>

<script setup>
import { googleSdkLoaded } from 'vue3-google-login';

const handleGoogleLogin = async (response) => {
  try {
    const result = await fetch('http://localhost:3002/api/v1/auth/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        googleToken: response.credential,
      }),
    });

    const data = await result.json();
    console.log('Login successful:', data);
  } catch (error) {
    console.error('Login failed:', error);
  }
};
</script>
```

### 5.4 Plain JavaScript Example

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
<body>
  <div id="g_id_onload"
       data-client_id="YOUR_GOOGLE_CLIENT_ID"
       data-callback="handleCredentialResponse">
  </div>
  <div class="g_id_signin" data-type="standard"></div>

  <script>
    function handleCredentialResponse(response) {
      fetch('http://localhost:3002/api/v1/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          googleToken: response.credential,
        }),
      })
      .then(res => res.json())
      .then(data => {
        console.log('Login successful:', data);
        // Redirect or update UI
      })
      .catch(error => {
        console.error('Login failed:', error);
      });
    }
  </script>
</body>
</html>
```

---

## Step 6: Testing

### 6.1 Test with Postman

1. Get a Google ID token from:
   - https://developers.google.com/oauthplayground
   - Or use the frontend integration

2. Send POST request:
```http
POST http://localhost:3002/api/v1/auth/google
Content-Type: application/json

{
  "googleToken": "your-google-id-token-here"
}
```

### 6.2 Test Flow

1. User clicks "Sign in with Google" button
2. Google OAuth popup opens
3. User selects Google account
4. Google returns ID token to frontend
5. Frontend sends token to your API
6. API verifies token with Google
7. API creates/finds user in database
8. API returns JWT tokens
9. User is logged in

---

## Step 7: Security Considerations

### 7.1 Token Validation

✅ **Always verify tokens server-side**
- Never trust tokens from client
- Always validate with Google's servers
- Check token audience matches your client ID

### 7.2 HTTPS in Production

✅ **Use HTTPS for all OAuth flows**
- Google requires HTTPS for production
- Protects tokens in transit
- Prevents man-in-the-middle attacks

### 7.3 State Parameter

✅ **Use state parameter to prevent CSRF**
```typescript
// Generate random state
const state = crypto.randomBytes(32).toString('hex');

// Store in session
req.session.oauthState = state;

// Include in OAuth URL
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?
  client_id=${clientId}&
  redirect_uri=${redirectUri}&
  response_type=code&
  scope=email profile&
  state=${state}`;
```

### 7.4 Scope Limitation

✅ **Request only necessary scopes**
- email (user's email)
- profile (name, picture)
- openid (OpenID Connect)

Don't request unnecessary permissions.

---

## Troubleshooting

### Error: "redirect_uri_mismatch"

**Solution:**
1. Check redirect URI in Google Console matches exactly
2. Include protocol (http:// or https://)
3. Include port for localhost (http://localhost:3002)
4. No trailing slashes

### Error: "invalid_client"

**Solution:**
1. Verify Client ID and Secret are correct
2. Check environment variables are loaded
3. Ensure OAuth client is enabled in Google Console

### Error: "access_denied"

**Solution:**
1. User cancelled the OAuth flow
2. Check OAuth consent screen is configured
3. Verify user is added to test users (if in testing mode)

### Token Verification Fails

**Solution:**
1. Check token hasn't expired (tokens expire after 1 hour)
2. Verify audience matches your Client ID
3. Ensure google-auth-library is installed
4. Check network connectivity to Google servers

---

## Production Checklist

Before going live:

- [ ] OAuth consent screen fully configured
- [ ] Production redirect URIs added
- [ ] HTTPS enabled on your domain
- [ ] Environment variables set in production
- [ ] Test with real Google accounts
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Privacy policy published
- [ ] Terms of service published

---

## Cost

Google OAuth is **FREE** with these limits:
- Unlimited authentications
- 10,000 API calls/day (token verification)
- No credit card required

---

## Support Resources

- [Google OAuth Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Sign-In Guide](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth Playground](https://developers.google.com/oauthplayground)
- [Google Cloud Console](https://console.cloud.google.com/)

---

## Summary

**What you need to do:**
1. ✅ Create Google Cloud project
2. ✅ Enable Google+ API
3. ✅ Configure OAuth consent screen
4. ✅ Create OAuth credentials
5. ✅ Copy Client ID and Secret
6. ✅ Add to environment variables
7. ✅ Install google-auth-library
8. ✅ Update auth service code
9. ✅ Integrate in frontend
10. ✅ Test the flow

**Time required:** 15-30 minutes

**Difficulty:** Easy to Medium

**Cost:** Free
