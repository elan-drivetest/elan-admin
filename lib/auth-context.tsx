// lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import type { User, LoginCredentials, AuthState, AuthError } from '@/types/auth';

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_ERROR'; payload: AuthError }
  | { type: 'LOGOUT' }
  | { type: 'SET_USER'; payload: User }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, isLoading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        error: null,
      };
    case 'LOGIN_ERROR':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
      };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        token: 'cookie-based', // Indicate we're using cookies
      };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

interface AuthContextValue extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get user from localStorage first (faster)
        const { user: cachedUser } = authService.getAuthData();
        
        if (cachedUser) {
          // Verify the session is still valid by fetching current user
          try {
            const currentUser = await authService.getCurrentUser();
            dispatch({ type: 'SET_USER', payload: currentUser });
            
            // Update localStorage with latest user data
            authService.setAuthData({
              user: currentUser,
              token: 'cookie-based',
              refreshToken: 'cookie-based',
              expiresIn: 0,
            });
          } catch (error) {
            // Session is invalid, clear cached data
            authService.clearAuthData();
            dispatch({ type: 'LOGOUT' });
          }
        } else {
          // No cached user, check if we have valid cookies
          try {
            const currentUser = await authService.getCurrentUser();
            dispatch({ type: 'SET_USER', payload: currentUser });
            
            // Cache user data
            authService.setAuthData({
              user: currentUser,
              token: 'cookie-based',
              refreshToken: 'cookie-based',
              expiresIn: 0,
            });
          } catch (error) {
            // No valid session
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        authService.clearAuthData();
        dispatch({ type: 'LOGOUT' });
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'LOGIN_START' });
      
      const authResponse = await authService.login(credentials);
      authService.setAuthData(authResponse);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: authResponse.user,
          token: authResponse.token,
        },
      });

      // Redirect based on user role
      const redirectPath = authResponse.user.role === 'customer' ? '/dashboard' : '/admin';
      router.push(redirectPath);
    } catch (error: any) {
      console.error('Login error:', error);
      
      const authError: AuthError = {
        message: error?.response?.data?.message || 
                error?.message || 
                'Login failed. Please check your credentials and try again.',
        code: error?.response?.data?.code || 'LOGIN_ERROR',
        field: error?.response?.data?.field,
      };
      
      dispatch({ type: 'LOGIN_ERROR', payload: authError });
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      dispatch({ type: 'LOGOUT' });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, clear local state
      authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
      router.push('/login');
    }
  };

  const refreshAuth = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      const authResponse = await authService.refreshToken();
      authService.setAuthData(authResponse);
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: authResponse.user,
          token: authResponse.token,
        },
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
      router.push('/login');
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const contextValue: AuthContextValue = {
    ...state,
    login,
    logout,
    clearError,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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