import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const AUTH_BASE_URL = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:3001/api/v1/auth';

// Create axios instance for auth requests
const authApi = axios.create({
  baseURL: AUTH_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
authApi.interceptors.request.use((config) => {
  const token = Cookies.get('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor to handle auth errors
authApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token but don't redirect automatically
      Cookies.remove('auth-token');
      // Only redirect if we're on a protected route
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const protectedRoutes = ['/dashboard', '/account', '/profile'];
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
        
        if (isProtectedRoute) {
          window.location.href = '/auth/signin';
        }
      }
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  roles: string[];
  status: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export class AuthClient {
  // Sign up new user
  async signUp(data: SignUpData): Promise<AuthResponse> {
    try {
      const response = await authApi.post('/register', data);
      const authData = response.data;
      
      // Store token in cookie if provided
      if (authData.accessToken) {
        Cookies.set('auth-token', authData.accessToken, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
      
      return authData;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Sign up failed');
    }
  }

  // Sign in user
  async signIn(data: SignInData): Promise<AuthResponse> {
    try {
      const response = await authApi.post('/login', data);
      const authData = response.data;
      
      // Store token in cookie if provided
      if (authData.accessToken) {
        Cookies.set('auth-token', authData.accessToken, {
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });
      }
      
      return authData;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Sign in failed');
    }
  }

  // Sign out user
  async signOut(): Promise<void> {
    try {
      await authApi.post('/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Sign out API call failed:', error);
    } finally {
      // Always remove token
      Cookies.remove('auth-token');
    }
  }

  // Get current user
  async getCurrentUser(): Promise<{ user: User } | null> {
    try {
      const response = await authApi.get('/me');
      return { user: response.data.user };
    } catch (error) {
      return null;
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!Cookies.get('auth-token');
  }

  // Get stored token
  getToken(): string | undefined {
    return Cookies.get('auth-token');
  }
}

// Export singleton instance
export const authClient = new AuthClient();

// Export API instance for other requests
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add auth interceptor to API client
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('auth-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth-token');
      // Only redirect if we're on a protected route
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname;
        const protectedRoutes = ['/dashboard', '/account', '/profile'];
        const isProtectedRoute = protectedRoutes.some(route => currentPath.startsWith(route));
        
        if (isProtectedRoute) {
          window.location.href = '/auth/signin';
        }
      }
    }
    return Promise.reject(error);
  }
);