// services/auth.ts
import axios from 'axios';
import type { LoginCredentials, AuthResponse, User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.elanroadtestrental.ca/v1';

const authClient = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: This enables cookies to be sent with requests
});

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authClient.post('/auth/customer/email/login', credentials);
    
    // Since the API only returns status 200 and sets cookies,
    // we need to get the user data separately
    const user = await this.getCurrentUser();
    
    return {
      user,
      // These are now handled by HTTP-only cookies
      token: 'cookie-based',
      refreshToken: 'cookie-based',
      expiresIn: 0, // Not provided by API
    };
  },

  async logout(): Promise<void> {
    try {
      await authClient.post('/auth/customer/logout');
    } finally {
      // Clear any local storage if used
      this.clearAuthData();
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await authClient.post('/auth/customer/refresh');
    
    // Get updated user data after refresh
    const user = await this.getCurrentUser();
    
    return {
      user,
      token: 'cookie-based',
      refreshToken: 'cookie-based',
      expiresIn: 0,
    };
  },

  async getCurrentUser(): Promise<User> {
    const response = await authClient.get('/auth/customer/me');
    
    // Transform API response to match our User type
    const apiUser = response.data;
    return {
      id: apiUser.id.toString(),
      email: apiUser.email,
      name: apiUser.full_name,
      role: this.mapUserTypeToRole(apiUser.user_type),
      avatar: apiUser.photo_url,
      phone: apiUser.phone_number,
      address: apiUser.address,
      createdAt: apiUser.created_at,
      lastLoginAt: apiUser.updated_at, // Using updated_at as proxy for last login
    };
  },

  async forgotPassword(email: string): Promise<void> {
    // This endpoint is not documented yet, implement when available
    throw new Error('Forgot password functionality not yet implemented');
  },

  async resetPassword(token: string, password: string): Promise<void> {
    // This endpoint is not documented yet, implement when available
    throw new Error('Reset password functionality not yet implemented');
  },

  // Helper method to map API user_type to our role system
  mapUserTypeToRole(userType: string): 'admin' | 'super_admin' | 'manager' | 'customer' | 'instructor' {
    switch (userType) {
      case 'admin':
        return 'admin';
      case 'customer':
        return 'customer';
      case 'instructor':
        return 'instructor';
      default:
        return 'customer'; // Default fallback
    }
  },

  // Since we're using HTTP-only cookies, these methods are simplified
  setAuthData(authResponse: AuthResponse): void {
    // Store user data in localStorage for quick access
    // Tokens are handled by HTTP-only cookies
    localStorage.setItem('user', JSON.stringify(authResponse.user));
  },

  getAuthData(): { token: string | null; user: User | null } {
    // Tokens are in HTTP-only cookies, so we can't access them
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    return { 
      token: 'cookie-based', // Indicate that we're using cookies
      user 
    };
  },

  clearAuthData(): void {
    localStorage.removeItem('user');
    // Cookies are cleared by the logout endpoint
  },

  // Check if user is authenticated by trying to get current user
  async checkAuthStatus(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  },
};