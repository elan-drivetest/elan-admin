// types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string; // Maps to full_name from API
  role: 'admin' | 'super_admin' | 'manager' | 'customer' | 'instructor';
  avatar?: string | null; // Maps to photo_url from API
  phone?: string; // Maps to phone_number from API
  address?: string; // From API
  createdAt: string; // Maps to created_at from API
  lastLoginAt?: string; // Maps to updated_at from API
}

// API Response structure from /auth/customer/me
export interface ApiUserResponse {
  id: number;
  email: string;
  full_name: string;
  phone_number: string;
  address: string;
  photo_url: string | null;
  user_type: 'admin' | 'customer' | 'instructor';
  created_at: string;
  updated_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string; // Will be 'cookie-based' since we use HTTP-only cookies
  refreshToken: string; // Will be 'cookie-based' since we use HTTP-only cookies
  expiresIn: number; // Not provided by current API
}

export interface AuthError {
  message: string;
  code: string;
  field?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null; // Will be 'cookie-based' when authenticated
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}