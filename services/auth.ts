// services/auth.ts
import axios from 'axios';
import type { LoginCredentials, AuthResponse, User } from '@/types/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.elanroadtestrental.ca/v1';

const authClient = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await authClient.post('/auth/admin/login', credentials);
    
    const user = await this.getCurrentUser();
    
    return {
      user,
      token: 'cookie-based',
      refreshToken: 'cookie-based',
      expiresIn: 0,
    };
  },

  async logout(): Promise<void> {
    try {
      await authClient.post('/auth/admin/logout');
    } finally {
      this.clearAuthData();
    }
  },

  async getCurrentUser(): Promise<User> {
    try {
      const response = await authClient.get('/auth/admin/me');
      
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
        lastLoginAt: apiUser.updated_at,
      };
    } catch (error) {
      this.clearAuthData();
      throw error;
    }
  },

  async refreshToken(): Promise<AuthResponse> {
    const response = await authClient.post('/auth/admin/refresh');
    const user = await this.getCurrentUser();
    
    return {
      user,
      token: 'cookie-based',
      refreshToken: 'cookie-based',
      expiresIn: 0,
    };
  },

  async updateProfile(data: {
    full_name?: string;
    email?: string;
    password?: string;
    oldPassword?: string;
    phone_number?: string;
    address?: string;
    photo_url?: string;
  }): Promise<User> {
    const response = await authClient.patch('/auth/admin/me', data);
    
    const apiUser = response.data;
    const user = {
      id: apiUser.id.toString(),
      email: apiUser.email,
      name: apiUser.full_name,
      role: this.mapUserTypeToRole(apiUser.user_type),
      avatar: apiUser.photo_url,
      phone: apiUser.phone_number,
      address: apiUser.address,
      createdAt: apiUser.created_at,
      lastLoginAt: apiUser.updated_at,
    };
    
    this.setAuthData({ user, token: 'cookie-based', refreshToken: 'cookie-based', expiresIn: 0 });
    
    return user;
  },

  async createAdmin(data: {
    full_name: string;
    email: string;
    phone_number: string;
  }): Promise<void> {
    await authClient.post('/auth/admin/create-admin', data);
  },

  mapUserTypeToRole(userType: string): 'admin' | 'customer' {
    switch (userType) {
      case 'admin':
        return 'admin';
      case 'customer':
        return 'customer';
      default:
        return 'admin';
    }
  },

  setAuthData(authResponse: AuthResponse): void {
    try {
      localStorage.setItem('user', JSON.stringify(authResponse.user));
    } catch (error) {
      console.error('Error saving auth data:', error);
    }
  },

  getAuthData(): { token: string | null; user: User | null } {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      return { 
        token: user ? 'cookie-based' : null,
        user 
      };
    } catch (error) {
      console.error('Error parsing cached user data:', error);
      this.clearAuthData();
      return { token: null, user: null };
    }
  },

  clearAuthData(): void {
    try {
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  },

  async checkAuthStatus(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  },
};