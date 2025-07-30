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
  AdminRideSessionsResponse
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