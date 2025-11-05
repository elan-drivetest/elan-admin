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
  AdminRideSessionsResponse,
  UpdateReferralCodeStatusRequest,
  AdminReferralCodeDetailResponse,
  AdminReferralCodesResponse,
  AdminReferralCodesParams,
  AdminCouponsParams,
  AdminCouponsResponse,
  AdminCouponUsageResponse,
  AdminCouponUsageParams,
  AdminCouponDetailResponse,
  UpdateCouponRequest,
  CreateCouponRequest,
  TestCentersResponse,
  AddressSearchRequest,
  AddressSearchResponse,
  CouponVerificationResponse,
  CouponVerificationRequest,
  AddonsResponse,
  DistanceCalculationRequest,
  DistanceCalculationResponse,
  SystemSettingsResponse,
  SystemSetting,
  UpdateSystemSettingRequest
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
    return Array.isArray(response.data.data) ? response.data.data : [];
  },

  async getRideSessionById(id: string): Promise<AdminRideSessionDetailResponse> {
    const response = await adminClient.get(`/admin/rides/sessions/${id}`);
    return response.data;
  },

  // Referral codes methods
  async getReferralCodes(params?: AdminReferralCodesParams): Promise<AdminReferralCodesResponse> {
    const response = await adminClient.get('/admin/referral-codes', { params });
    return response.data.data || [];
  },

  async getReferralCodeById(id: string): Promise<AdminReferralCodeDetailResponse> {
    const response = await adminClient.get(`/admin/referral-codes/${id}`);
    return response.data;
  },

  async updateReferralCodeStatus(id: string, data: UpdateReferralCodeStatusRequest): Promise<AdminReferralCodeDetailResponse> {
    const response = await adminClient.put(`/admin/referral-codes/${id}/status`, data);
    return response.data;
  },

    // Coupon methods
  async getCoupons(params?: AdminCouponsParams): Promise<AdminCouponsResponse> {
    const response = await adminClient.get('/admin/coupons', { params });
    return response.data.data || []; // Extract data array from wrapped response
  },

  async getExpiredCoupons(params?: AdminCouponsParams): Promise<AdminCouponsResponse> {
    const response = await adminClient.get('/admin/coupons/expired', { params });
    return response.data.data || [];
  },

  async getCouponUsage(params?: AdminCouponUsageParams): Promise<AdminCouponUsageResponse> {
    const response = await adminClient.get('/admin/coupons/usage', { params });
    return response.data.data || [];
  },

  async getCouponUsageById(id: string, params?: AdminCouponUsageParams): Promise<AdminCouponUsageResponse> {
    const response = await adminClient.get(`/admin/coupons/${id}/usage`, { params });
    return response.data.data || [];
  },

  // These return single objects, so keep as is
  async getCouponById(id: string): Promise<AdminCouponDetailResponse> {
    const response = await adminClient.get(`/admin/coupons/${id}`);
    return response.data;
  },

  async updateCoupon(id: string, data: UpdateCouponRequest): Promise<AdminCouponDetailResponse> {
    const response = await adminClient.put(`/admin/coupons/${id}`, data);
    return response.data;
  },

  async createCoupon(data: CreateCouponRequest): Promise<AdminCouponDetailResponse> {
    const response = await adminClient.post('/admin/coupons', data);
    return response.data;
  },

  // Get all test centers
  async getTestCenters(): Promise<TestCentersResponse> {
    const response = await adminClient.get('/drive-test-centers');
    return Array.isArray(response.data) ? response.data : [];
  },

    // Address search
  async searchAddress(data: AddressSearchRequest): Promise<AddressSearchResponse> {
    const response = await adminClient.post('/address-search', data);
    return response.data;
  },

  // Coupon verification
  async verifyCoupon(data: CouponVerificationRequest): Promise<CouponVerificationResponse> {
    const response = await adminClient.post('/coupons/verify', data);
    return response.data;
  },

  // Get all addons
  async getAddons(): Promise<AddonsResponse> {
    const response = await adminClient.get('/addons');
    return Array.isArray(response.data) ? response.data : [];
  },

  // NEW: Distance calculation endpoint
  async calculateDistance(data: DistanceCalculationRequest): Promise<DistanceCalculationResponse> {
    const response = await adminClient.post('/bookings/calculate-distance', data);
    return response.data;
  },

  // ENHANCED: Coupon verification with better error handling
  async verifyCouponCode(data: CouponVerificationRequest): Promise<CouponVerificationResponse> {
    const response = await adminClient.post('/coupons/verify', data);
    return response.data;
  },

  // Address search with better response handling
  async searchAddresses(data: AddressSearchRequest): Promise<AddressSearchResponse[]> {
    const response = await adminClient.post('/address-search', data);
    
    // Handle the actual API response structure: { "addresses": [...] }
    if (response.data && response.data.addresses && Array.isArray(response.data.addresses)) {
      return response.data.addresses;
    }
    
    // Fallback for other response formats
    if (Array.isArray(response.data)) {
      return response.data;
    }
    
    return response.data ? [response.data] : [];
  },

  // System Settings methods
  async getSystemSettings(): Promise<SystemSettingsResponse> {
    const response = await adminClient.get('/admin/settings');
    console.log('Raw API response:', response.data);
    return Array.isArray(response.data) ? response.data : [];
  },

  async getSystemSettingByKey(key: string): Promise<SystemSetting> {
    // Since we can't get ID from the list, let's try to find it by fetching individual settings
    // We'll need to iterate through possible IDs
    for (let id = 1; id <= 20; id++) { // Try IDs 1-20
      try {
        const response = await adminClient.get(`/admin/settings/${id}`);
        if (response.data && response.data.key === key) {
          console.log(`Found setting with key '${key}' at ID ${id}:`, response.data);
          return response.data;
        }
      } catch (error: any) {
        // Continue if this ID doesn't exist
        if (error.response?.status === 404) {
          continue;
        }
      }
    }
    throw new Error(`Setting with key '${key}' not found`);
  },

  async updateSystemSettingByKey(key: string, data: UpdateSystemSettingRequest): Promise<SystemSetting> {
    console.log('Updating setting with key:', key, 'data:', data);
    
    try {
      // Find the setting by iterating through possible IDs
      let foundId: number | null = null;
      
      for (let id = 1; id <= 50; id++) { // Increased range to be safe
        try {
          const response = await adminClient.get(`/admin/settings/${id}`);
          if (response.data && response.data.key === key) {
            console.log(`Found setting with key '${key}' at ID ${id}:`, response.data);
            foundId = id; // Use the ID from the URL, not from response.data.id
            break;
          }
        } catch (error: any) {
          if (error.response?.status === 404) {
            continue; // This ID doesn't exist, try next
          }
          throw error; // Some other error, don't continue
        }
      }
      
      if (!foundId) {
        throw new Error(`Setting with key '${key}' not found`);
      }
      
      console.log(`Using ID ${foundId} for key '${key}'`);
      
      // Now update using the found ID
      const response = await adminClient.put(`/admin/settings/${foundId}`, data);
      console.log('Update successful:', response.data);
      return response.data;
      
    } catch (error: any) {
      console.error('Update error:', error.response?.data || error.message);
      throw error;
    }
  },

  async updateSystemSetting(id: string, data: UpdateSystemSettingRequest): Promise<SystemSetting> {
    const response = await adminClient.put(`/admin/settings/${id}`, data);
    return response.data;
  },

  async createSystemSetting(data: SystemSetting): Promise<SystemSetting> {
    const response = await adminClient.post('/admin/settings', data);
    return response.data;
  },
};
