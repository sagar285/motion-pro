// hooks/useAuth.ts
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string;
  phone?: string;
  email_verified?: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface LoginResult {
  success: boolean;
  error?: string;
  requiresVerification?: boolean;
  email?: string;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false
  });
  
  const router = useRouter();

  // Check authentication status
  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const userData = await response.json();
        setAuthState({
          user: userData.user,
          isLoading: false,
          isAuthenticated: true
        });
      } else {
        setAuthState({
          user: null,
          isLoading: false,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
    }
  };

  // Login function (works with your existing login API)
  const login = async (email: string, password: string, rememberMe: boolean = false): Promise<LoginResult> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ email, password, rememberMe })
      });

      const data = await response.json();

      if (response.ok) {
        // Update auth state with user data from your login response
        setAuthState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true
        });
        
        // Redirect to dashboard
        router.push('/dashboard');
        return { success: true };
      } else {
        // Handle different error cases from your login API
        if (response.status === 403 && data.requiresVerification) {
          return { 
            success: false, 
            error: data.error,
            requiresVerification: true,
            email: data.email
          };
        }
        
        return { 
          success: false, 
          error: data.error || 'Login failed'
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });

      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout on client side even if API call fails
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false
      });
      router.push('/login');
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return {
    ...authState,
    login,
    logout,
    checkAuth
  };
};