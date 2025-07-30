// services/admin.ts
import axios from 'axios';
import type { 
  AdminCustomersResponse, 
  AdminInstructorsResponse,
  AdminCustomerDetailResponse,
  AdminInstructorDetailResponse,
  AdminInstructorRidesResponse,
  AdminUsersDropdownResponse,
  AdminBookingsResponse,
  AdminBookingInstructorsResponse,
  AdminCustomersParams,
  AdminInstructorsParams,
  AdminInstructorRidesParams,
  AdminBookingsParams,
  CreateBookingRequest,
  CreateBookingResponse,
  AssignInstructorRequest,
  DashboardAnalyticsResponse,
  AdminRideSessionsParams,
  AdminRideSessionDetailResponse,
  AdminRideSessionsResponse
} from '@/types/admin';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api-dev.elanroadtestrental.ca/v1';

const adminClient = axios.create({
  baseURL: `${API_BASE_URL}`,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

adminClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed - 401 Unauthorized');
      // Could trigger a redirect or auth refresh here if needed
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // Get all customers with pagination and search
  async getCustomers(params?: AdminCustomersParams): Promise<AdminCustomersResponse> {
    const response = await adminClient.get('/admin/users/customers', { params });
    // Extract data array from wrapped response
    return response.data.data || [];
  },

  // Get all instructors with pagination and search
  async getInstructors(params?: AdminInstructorsParams): Promise<AdminInstructorsResponse> {
    const response = await adminClient.get('/admin/users/instructors', { params });
    // Extract data array from wrapped response
    return response.data.data || [];
  },

  // Get customer details by ID
  async getCustomerById(id: string): Promise<AdminCustomerDetailResponse> {
    const response = await adminClient.get(`/admin/users/customers/${id}`);
    return response.data;
  },

  // Get instructor details by ID
  async getInstructorById(id: string): Promise<AdminInstructorDetailResponse> {
    const response = await adminClient.get(`/admin/users/instructors/${id}`);
    return response.data;
  },

  // Get instructor rides by instructor ID with pagination and filters
  async getInstructorRides(id: string, params?: AdminInstructorRidesParams): Promise<AdminInstructorRidesResponse> {
    const response = await adminClient.get(`/admin/users/instructors/${id}/rides`, { params });
    // Extract data array from wrapped response
    return response.data.data || [];
  },

  // Get users dropdown data
  async getUsersDropdown(): Promise<AdminUsersDropdownResponse> {
    const response = await adminClient.get('/admin/users/dropdown');
    return response.data;
  },

  // Booking methods
  async getRecentBookings(params?: AdminBookingsParams): Promise<AdminBookingsResponse> {
    const response = await adminClient.get('/admin/bookings/recent', { params });
    return response.data.data || [];
  },

  async getAllBookings(params?: AdminBookingsParams): Promise<AdminBookingsResponse> {
    const response = await adminClient.get('/admin/bookings/all', { params });
    return response.data.data || [];
  },

  // Fix this method - ensure it returns the data correctly
  async getBookingInstructors(): Promise<AdminBookingInstructorsResponse> {
    const response = await adminClient.get('/admin/bookings/instructors');
    return Array.isArray(response.data) ? response.data : [];
  },

  async testAuth(): Promise<any> {
    try {
      const response = await adminClient.get('/auth/admin/me');
      console.log('Auth test successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Auth test failed:', error);
      throw error;
    }
  },

  async assignInstructor(data: AssignInstructorRequest): Promise<void> {
    await adminClient.patch('/admin/bookings/assign-instructor', data);
  },

  async createBooking(data: CreateBookingRequest): Promise<CreateBookingResponse> {
    const response = await adminClient.post('/admin/bookings', data);
    return response.data;
  },

  // Dashboard analytics
  async getDashboardAnalytics(): Promise<DashboardAnalyticsResponse> {
    const response = await adminClient.get('/admin/dashboard/analytics');
    return response.data;
  },
  
  // Ride session methods
  async getRideSessions(params?: AdminRideSessionsParams): Promise<AdminRideSessionsResponse> {
    const response = await adminClient.get('/admin/rides/sessions', { params });
    return Array.isArray(response.data) ? response.data : [];
  },

  async getRideSessionById(id: string): Promise<AdminRideSessionDetailResponse> {
    const response = await adminClient.get(`/admin/rides/sessions/${id}`);
    return response.data;
  },
};
