// hooks/useAdmin.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import type {
  PaginationMeta,
  AdminCustomersResponse,
  AdminInstructorsResponse,
  AdminCustomerDetailResponse,
  AdminInstructorDetailResponse,
  AdminUsersDropdownResponse,
  AdminBookingsResponse,
  AdminBookingInstructorsResponse,
  AdminCustomersParams,
  AdminInstructorsParams,
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
  TestCenter,
  UpdateTestCenterRequest,
  AddonsResponse,
  SystemSettingsResponse,
  AdminAllUsersResponse,
  AdminAllUsersParams,
  AdminUserStatus,
  TestResult
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
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAllBookings = async (newParams?: AdminBookingsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getAllBookings(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('All bookings fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_ALL_BOOKINGS_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllBookings();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchAllBookings };
}

// An instructor may be assigned to a booking only when fully onboarded:
// active account, completed profile, and a connected bank (Stripe payouts + charges).
export function isInstructorAssignable(d: {
  status?: string;
  profile_completion_percentage?: number;
  stripe_payouts_enabled?: boolean;
  stripe_charges_enabled?: boolean;
} | null | undefined): boolean {
  return (
    !!d 
    // Instsructors Guard
    && d.status === 'ACTIVE' 
    && d.profile_completion_percentage === 100
    && d.stripe_payouts_enabled === true 
    && d.stripe_charges_enabled === true
  );
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

      const response = await adminService.getBookingInstructors();
      const list = Array.isArray(response) ? response : [];

      // The dropdown endpoint only returns id/name/phone, so enrich each
      // candidate with its detail to apply the assignability guard.
      const enriched = await Promise.all(
        list.map(async (instructor) => {
          try {
            const detail = await adminService.getInstructorById(String(instructor.user_id));
            return { instructor, detail };
          } catch {
            return { instructor, detail: null };
          }
        })
      );

      const eligible = enriched
        .filter(({ detail }) => isInstructorAssignable(detail))
        .map(({ instructor, detail }) => ({
          ...instructor,
          email: detail!.email,
          rating: detail!.rating,
          vehicle_info: detail!.vehicle
            ? `${detail!.vehicle.year} ${detail!.vehicle.brand} ${detail!.vehicle.model}`
            : undefined,
        }));

      setData(eligible);
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
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCustomers = async (newParams?: AdminCustomersParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCustomers(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Customers fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_CUSTOMERS_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchCustomers };
}

// Custom hook for fetching instructors with parameters
export function useInstructors(params?: AdminInstructorsParams) {
  const [data, setData] = useState<AdminInstructorsResponse>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchInstructors = async (newParams?: AdminInstructorsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getInstructors(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Instructors fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_INSTRUCTORS_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchInstructors };
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
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchRideSessions = async (newParams?: AdminRideSessionsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getRideSessions(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Ride sessions fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_RIDE_SESSIONS_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRideSessions();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchRideSessions };
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
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchReferralCodes = async (newParams?: AdminReferralCodesParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getReferralCodes(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Referral codes fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_REFERRAL_CODES_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReferralCodes();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchReferralCodes };
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
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCoupons = async (newParams?: AdminCouponsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCoupons(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Coupons fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_COUPONS_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchCoupons };
}

export function useExpiredCoupons(params?: AdminCouponsParams) {
  const [data, setData] = useState<AdminCouponsResponse>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchExpiredCoupons = async (newParams?: AdminCouponsParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getExpiredCoupons(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_EXPIRED_COUPONS_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiredCoupons();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchExpiredCoupons };
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
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCouponUsage = async (newParams?: AdminCouponUsageParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCouponUsage(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Coupon usage fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_COUPON_USAGE_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCouponUsage();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchCouponUsage };
}

export function useCouponUsageById(id: string, params?: AdminCouponUsageParams) {
  const [data, setData] = useState<AdminCouponUsageResponse>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchCouponUsageById = async (newParams?: AdminCouponUsageParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getCouponUsageById(id, newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('Coupon usage by ID fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_COUPON_USAGE_BY_ID_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCouponUsageById();
    }
  }, [id]);

  return { data, meta, isLoading, error, refetch: fetchCouponUsageById };
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

export function useUpdateTestCenter() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateTestCenter = useCallback(async (
    id: number,
    data: UpdateTestCenterRequest
  ): Promise<TestCenter | null> => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.updateTestCenter(id, data);
      return response;
    } catch (err: any) {
      console.error('Update test center error:', err);
      setError({
        message: err?.response?.data?.message || 'Failed to update test center',
        code: 'UPDATE_TEST_CENTER_ERROR'
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { updateTestCenter, isLoading, error };
}

/**
 * The add-on catalogue (`GET /admin/settings/addons`).
 *
 * This is the admin-namespaced read that pairs with the PUT, and the only one
 * this app uses. The customer-facing `GET /addons` returns the same rows
 * serialised with group `['me']`, which drops `description` — so an admin screen
 * reading it would show a poorer view of a catalogue it can edit.
 */
export function useSettingsAddons() {
  const [data, setData] = useState<AddonsResponse>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchSettingsAddons = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getSettingsAddons();
      setData(Array.isArray(response) ? response : []);
    } catch (err: unknown) {
      console.error('Settings addons fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_SETTINGS_ADDONS_ERROR',
      });
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettingsAddons();
  }, [fetchSettingsAddons]);

  return { data, isLoading, error, refetch: fetchSettingsAddons };
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

// Hook for fetching all users (admin, customer, instructor)
export function useAllUsers(params?: AdminAllUsersParams) {
  const [data, setData] = useState<AdminAllUsersResponse>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  const fetchAllUsers = async (newParams?: AdminAllUsersParams) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.getAllUsers(newParams || params);
      setData(response.data);
      setMeta(response.meta);
    } catch (err: any) {
      console.error('All users fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_ALL_USERS_ERROR'
      });
      setData([]);
      setMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  return { data, meta, isLoading, error, refetch: fetchAllUsers };
}

// Hook for updating user status
export function useUpdateUserStatus() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateStatus = async (userId: number, status: AdminUserStatus) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.updateUserStatus(userId, { status });
      return response;
    } catch (err: any) {
      console.error('Update user status error:', err);
      const apiError: ApiError = {
        message: err?.response?.data?.message || 'Failed to update user status',
        code: 'UPDATE_USER_STATUS_ERROR'
      };
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateStatus, isLoading, error };
}

// Hook for updating booking test result
export function useUpdateTestResult() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const updateTestResult = async (bookingId: number, testResult: TestResult) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminService.updateBookingTestResult(bookingId, { test_result: testResult });
      return response;
    } catch (err: any) {
      console.error('Update test result error:', err);
      const apiError: ApiError = {
        message: err?.response?.data?.message || 'Failed to update test result',
        code: 'UPDATE_TEST_RESULT_ERROR'
      };
      setError(apiError);
      throw apiError;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateTestResult, isLoading, error };
}