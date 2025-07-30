// types/auth.ts
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
  avatar?: string | null;
  phone?: string;
  address?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ApiUserResponse {
  id: number;
  identifier: string;
  email: string;
  full_name: string;
  provider: string;
  phone_number: string;
  address: string;
  user_type: 'admin' | 'customer';
  stripe_customer_id: string;
  status: string;
  photo_url: string | null;
  email_verified_at: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthError {
  message: string;
  code: string;
  field?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: AuthError | null;
}