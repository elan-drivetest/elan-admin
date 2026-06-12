// lib/auth-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/services/auth';
import { refreshAuthToken } from '@/lib/axios';
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
        token: 'cookie-based',
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
  updateProfile: (data: any) => Promise<void>;
  refreshAuth: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if we have cached user data
        const { user: cachedUser } = authService.getAuthData();

        if (cachedUser) {
          // Optimistically set the cached user while we validate
          dispatch({ type: 'SET_USER', payload: cachedUser });
        }

        // Try to get current user from API
        // The axios interceptor will automatically handle token refresh if needed
        try {
          const currentUser = await authService.getCurrentUser();
          dispatch({ type: 'SET_USER', payload: currentUser });
          authService.setAuthData({
            user: currentUser,
            token: 'cookie-based',
            refreshToken: 'cookie-based',
            expiresIn: 0,
          });
        } catch (error: any) {
          // If we get here, the interceptor already tried to refresh and failed
          // This means the user truly needs to log in again
          if (!cachedUser) {
            // Only set loading to false if we didn't have cached user
            dispatch({ type: 'SET_LOADING', payload: false });
          } else {
            // Clear the cached user since session is invalid
            authService.clearAuthData();
            dispatch({ type: 'LOGOUT' });
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

  // Proactive silent refresh: keep the session alive while the app is open.
  // The backend access token (`AUTH_JWT_TOKEN_EXPIRES_IN`) is ~15 min and the
  // /auth/admin/refresh endpoint rotates BOTH cookies, so refreshing comfortably
  // before the access token lapses slides the whole session forward. The reactive
  // 401 interceptor in lib/axios.ts remains the fallback.
  useEffect(() => {
    if (!state.isAuthenticated) return;

    const REFRESH_INTERVAL_MS = 12 * 60 * 1000; // < 15 min access lifetime, ~3 min buffer

    // Silent — never toggles loading or logs out on a transient failure; if the
    // refresh token has truly expired, the next real request's 401 path handles logout.
    const silentRefresh = () => { void refreshAuthToken(); };

    const intervalId = setInterval(silentRefresh, REFRESH_INTERVAL_MS);

    // Background tabs throttle timers, so also refresh when the tab regains focus
    // (covers laptop sleep / long-hidden tabs).
    const onVisibility = () => {
      if (document.visibilityState === 'visible') silentRefresh();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [state.isAuthenticated]);

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

      router.push('/dashboard');
    } catch (error: any) {
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
      authService.clearAuthData();
      dispatch({ type: 'LOGOUT' });
      router.push('/login');
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      dispatch({ type: 'SET_USER', payload: updatedUser });
    } catch (error: any) {
      const authError: AuthError = {
        message: error?.response?.data?.message || 'Failed to update profile',
        code: 'PROFILE_UPDATE_ERROR',
      };
      dispatch({ type: 'LOGIN_ERROR', payload: authError });
      throw error;
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
    } catch (error: any) {
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
    updateProfile,
    refreshAuth,
    clearError,
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
