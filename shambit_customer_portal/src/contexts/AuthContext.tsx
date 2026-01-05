'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authClient, User, SignUpData, SignInData } from '@/lib/auth-client';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (data: SignInData) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  // Load user data on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      if (authClient.isAuthenticated()) {
        const userData = await authClient.getCurrentUser();
        if (userData) {
          setUser(userData.user);
        }
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      // Clear invalid session silently without redirecting
      try {
        await authClient.signOut();
      } catch (signOutError) {
        // If signOut fails, just clear the token locally
        console.error('Sign out failed:', signOutError);
      }
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      setLoading(true);
      const response = await authClient.signUp(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    try {
      setLoading(true);
      const response = await authClient.signIn(data);
      setUser(response.user);
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authClient.signOut();
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
      // Clear state even if API call fails
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await authClient.getCurrentUser();
      if (userData) {
        setUser(userData.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Custom hook for protected routes
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth();
  
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      window.location.href = '/auth/signin';
    }
  }, [isAuthenticated, loading]);

  return { isAuthenticated, loading };
}