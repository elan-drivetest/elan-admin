// hooks/useAdmin.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin';
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
  ApiError,
  DashboardAnalyticsResponse,
  AdminRideSessionDetailResponse,
  AdminRideSessionsParams,
  AdminRideSessionsResponse,
  AdminReferralCodeDetailResponse,
  AdminReferralCodesParams,
  AdminReferralCodesResponse,
  AdminCouponDetailResponse,
  AdminCouponsParams,
  AdminCouponsResponse,
  AdminCouponUsageParams,
  AdminCouponUsageResponse,
  TestCentersResponse,
  AddonsResponse,
  SystemSettingsResponse
} from '@/types/admin';

export function useRecentBookings(params?: AdminBookingsParams) {
  const [data, setData] = useState<AdminBookingsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRecentBookings = async (newParams?: AdminBookingsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getRecentBookings(newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Recent bookings fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch recent bookings',
        code: 'FETCH_RECENT_BOOKINGS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentBookings();
  }, []);

  return { data, isLoading, error, refetch: fetchRecentBookings };
}

// Updated hook for fetching all bookings with parameters
export function useAllBookings(params?: AdminBookingsParams) {
  const [data, setData] = useState<AdminBookingsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAllBookings = async (newParams?: AdminBookingsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getAllBookings(newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('All bookings fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch bookings',
        code: 'FETCH_ALL_BOOKINGS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  return { data, isLoading, error, refetch: fetchAllBookings };
}

// Custom hook for fetching available instructors for booking assignment
export function useBookingInstructors() {
  const [data, setData] = useState<AdminBookingInstructorsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  // Memoize the fetch function to prevent infinite loops
  const fetchInstructors = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Fetching booking instructors...');
      const response = await adminService.getBookingInstructors();
      console.log('Booking instructors response:', response);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Booking instructors fetch error:', err);
      
      let errorMessage = 'Failed to fetch booking instructors';
      let errorCode = 'FETCH_BOOKING_INSTRUCTORS_ERROR';
      
      if (err.response?.status === 401) {
        errorMessage = 'Authentication required. Please log in again.';
        errorCode = 'AUTHENTICATION_ERROR';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      setError({
        message: errorMessage,
        code: errorCode
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array since this function doesn't depend on any props or state

  // Only fetch on mount, not on every render
  useEffect(() => {
    fetchInstructors();
  }, []); // Empty dependency array to run only once

  return { data, isLoading, error, refetch: fetchInstructors };
}

// Custom hook for fetching customers with parameters
export function useCustomers(params?: AdminCustomersParams) {
  const [data, setData] = useState<AdminCustomersResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCustomers = async (newParams?: AdminCustomersParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCustomers(newParams || params);
      // Ensure response is always an array
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Customers fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch customers',
        code: 'FETCH_CUSTOMERS_ERROR'
      });
      setData([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { data, isLoading, error, refetch: fetchCustomers };
}

// Custom hook for fetching instructors with parameters
export function useInstructors(params?: AdminInstructorsParams) {
  const [data, setData] = useState<AdminInstructorsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchInstructors = async (newParams?: AdminInstructorsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getInstructors(newParams || params);
      // Ensure response is always an array
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Instructors fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch instructors',
        code: 'FETCH_INSTRUCTORS_ERROR'
      });
      setData([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  return { data, isLoading, error, refetch: fetchInstructors };
}

// Custom hook for fetching customer detail
export function useCustomerDetail(id: string) {
  const [data, setData] = useState<AdminCustomerDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCustomer = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCustomerById(id);
      setData(response);
    } catch (err: any) {
      setError({
        message: err?.response?.data?.message || 'Failed to fetch customer details',
        code: 'FETCH_CUSTOMER_DETAIL_ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCustomer();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchCustomer };
}

// Custom hook for fetching instructor detail
export function useInstructorDetail(id: string) {
  const [data, setData] = useState<AdminInstructorDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchInstructor = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getInstructorById(id);
      setData(response);
    } catch (err: any) {
      setError({
        message: err?.response?.data?.message || 'Failed to fetch instructor details',
        code: 'FETCH_INSTRUCTOR_DETAIL_ERROR'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInstructor();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchInstructor };
}

// Custom hook for fetching instructor rides
export function useInstructorRides(id: string, params?: AdminInstructorRidesParams) {
  const [data, setData] = useState<AdminInstructorRidesResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRides = async (newParams?: AdminInstructorRidesParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getInstructorRides(id, newParams || params);
      // Ensure response is always an array
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Instructor rides fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch instructor rides',
        code: 'FETCH_INSTRUCTOR_RIDES_ERROR'
      });
      setData([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRides();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchRides };
}

// Custom hook for fetching users dropdown
export function useUsersDropdown() {
  const [data, setData] = useState<AdminUsersDropdownResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchDropdown = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getUsersDropdown();
      // Ensure response is always an array
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Dropdown fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch dropdown data',
        code: 'FETCH_DROPDOWN_ERROR'
      });
      setData([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdown();
  }, []);

  return { data, isLoading, error, refetch: fetchDropdown };
}

export function useDashboardAnalytics() {
  const [data, setData] = useState<DashboardAnalyticsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getDashboardAnalytics();
      setData(response);
    } catch (err: any) {
      console.error('Dashboard analytics fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch dashboard analytics',
        code: 'FETCH_DASHBOARD_ANALYTICS_ERROR'
      });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  return { data, isLoading, error, refetch: fetchAnalytics };
}

export function useRideSessions(params?: AdminRideSessionsParams) {
  const [data, setData] = useState<AdminRideSessionsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRideSessions = async (newParams?: AdminRideSessionsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getRideSessions(newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Ride sessions fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch ride sessions',
        code: 'FETCH_RIDE_SESSIONS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRideSessions();
  }, []);

  return { data, isLoading, error, refetch: fetchRideSessions };
}

export function useRideSessionDetail(id: string) {
  const [data, setData] = useState<AdminRideSessionDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRideSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getRideSessionById(id);
      setData(response);
    } catch (err: any) {
      console.error('Ride session detail fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch ride session details',
        code: 'FETCH_RIDE_SESSION_DETAIL_ERROR'
      });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchRideSession();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchRideSession };
}

export function useReferralCodes(params?: AdminReferralCodesParams) {
  const [data, setData] = useState<AdminReferralCodesResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchReferralCodes = async (newParams?: AdminReferralCodesParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getReferralCodes(newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Referral codes fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch referral codes',
        code: 'FETCH_REFERRAL_CODES_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralCodes();
  }, []);

  return { data, isLoading, error, refetch: fetchReferralCodes };
}

export function useReferralCodeDetail(id: string) {
  const [data, setData] = useState<AdminReferralCodeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchReferralCode = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getReferralCodeById(id);
      setData(response);
    } catch (err: any) {
      console.error('Referral code detail fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch referral code details',
        code: 'FETCH_REFERRAL_CODE_DETAIL_ERROR'
      });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchReferralCode();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchReferralCode };
}

export function useCoupons(params?: AdminCouponsParams) {
  const [data, setData] = useState<AdminCouponsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCoupons = async (newParams?: AdminCouponsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCoupons(newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Coupons fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch coupons',
        code: 'FETCH_COUPONS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return { data, isLoading, error, refetch: fetchCoupons };
}

export function useExpiredCoupons(params?: AdminCouponsParams) {
  const [data, setData] = useState<AdminCouponsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchExpiredCoupons = async (newParams?: AdminCouponsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getExpiredCoupons(newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      setError({
        message: err?.response?.data?.message || 'Failed to fetch expired coupons',
        code: 'FETCH_EXPIRED_COUPONS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiredCoupons();
  }, []);

  return { data, isLoading, error, refetch: fetchExpiredCoupons };
}

export function useCouponDetail(id: string) {
  const [data, setData] = useState<AdminCouponDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCoupon = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCouponById(id);
      setData(response);
    } catch (err: any) {
      setError({
        message: err?.response?.data?.message || 'Failed to fetch coupon details',
        code: 'FETCH_COUPON_DETAIL_ERROR'
      });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCoupon();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchCoupon };
}

export function useCouponUsage(params?: AdminCouponUsageParams) {
  const [data, setData] = useState<AdminCouponUsageResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCouponUsage = async (newParams?: AdminCouponUsageParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCouponUsage(newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Coupon usage fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch coupon usage',
        code: 'FETCH_COUPON_USAGE_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponUsage();
  }, []);

  return { data, isLoading, error, refetch: fetchCouponUsage };
}

export function useCouponUsageById(id: string, params?: AdminCouponUsageParams) {
  const [data, setData] = useState<AdminCouponUsageResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCouponUsageById = async (newParams?: AdminCouponUsageParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCouponUsageById(id, newParams || params);
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Coupon usage by ID fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch coupon usage details',
        code: 'FETCH_COUPON_USAGE_BY_ID_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCouponUsageById();
    }
  }, [id]);

  return { data, isLoading, error, refetch: fetchCouponUsageById };
}

export function useTestCenters() {
  const [data, setData] = useState<TestCentersResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchTestCenters = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getTestCenters();
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Test centers fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch test centers',
        code: 'FETCH_TEST_CENTERS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTestCenters();
  }, [fetchTestCenters]);

  // Helper function to get center by ID
  const getCenterById = useCallback((id: number) => {
    return data.find(center => center.id === id) || null;
  }, [data]);

  return { 
    data, 
    isLoading, 
    error, 
    refetch: fetchTestCenters,
    getCenterById,
    centers: data // Alias for consistency
  };
}

export function useAddons() {
  const [data, setData] = useState<AddonsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAddons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getAddons();
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Addons fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch addons',
        code: 'FETCH_ADDONS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddons();
  }, [fetchAddons]);

  return { data, isLoading, error, refetch: fetchAddons };
}

export function useActiveCoupons() {
  const [data, setData] = useState<AdminCouponsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchActiveCoupons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      // Use the existing getCoupons method instead of getActiveCoupons
      const response = await adminService.getCoupons({
        limit: 50,
        orderBy: 'created_at',
        orderDirection: 'desc',
        is_active: true
      });
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('Active coupons fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch coupons',
        code: 'FETCH_ACTIVE_COUPONS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveCoupons();
  }, [fetchActiveCoupons]);

  return { data, isLoading, error, refetch: fetchActiveCoupons };
}

export function useInstructorById(id: string | null) {
  const [data, setData] = useState<AdminInstructorDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchInstructor = useCallback(async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getInstructorById(id);
      setData(response);
    } catch (err: any) {
      console.error('Instructor detail fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch instructor details',
        code: 'FETCH_INSTRUCTOR_DETAIL_ERROR'
      });
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchInstructor();
    } else {
      setData(null);
      setError(null);
      setIsLoading(false);
    }
  }, [id, fetchInstructor]);

  return { data, isLoading, error, refetch: fetchInstructor };
}

export function useSystemSettings() {
  const [data, setData] = useState<SystemSettingsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSystemSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getSystemSettings();
      setData(Array.isArray(response) ? response : []);
    } catch (err: any) {
      console.error('System settings fetch error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to fetch system settings',
        code: 'FETCH_SYSTEM_SETTINGS_ERROR'
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  return { data, isLoading, error, refetch: fetchSystemSettings };
}