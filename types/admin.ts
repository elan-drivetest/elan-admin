// types/admin.ts

// Common types
export interface ApiError {
  message: string;
  code: string;
  errors?: Record<string, string[]>;
}

// Pagination parameters
export interface PaginationParams {
  limit?: number;
  cursor?: string;
  direction?: 'forward' | 'backward';
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
  search?: string;
  baseUrl?: string;
}

// Customer types
export interface AdminCustomer {
  id: number;
  full_name: string;
  email: string;
  contact: string;
  any_ride_booked: boolean;
  total_ride_count: string | number; // API returns as string
  passed_count: string | number; // API returns as string
  failed_count: string | number; // API returns as string
  created_at: string;
}

export interface AdminCustomersParams extends PaginationParams {
  fullName?: string;
  email?: string;
  contact?: string;
}

export interface AdminCustomersParams extends PaginationParams {
  fullName?: string;
  email?: string;
  contact?: string;
}

export type AdminCustomersResponse = AdminCustomer[];

export interface CustomerBooking {
  id: number;
  test_type: string;
  test_date: string;
  status: string;
  test_result: string;
  total_price: number;
  test_center_name: string;
  test_center_address: string;
  instructor_name: string;
  instructor_phone: string;
  pickup_address: string;
  meet_at_center: boolean;
  created_at: string;
  road_test_doc_url: string;
  g1_license_doc_url: string;
}

export interface AdminCustomerDetail {
  id: number;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  status: string;
  photo_url: string;
  created_at: string;
  email_verified_at: string;
  bookings: CustomerBooking[];
  total_bookings: number;
  passed_tests: number;
  failed_tests: number;
}

export type AdminCustomerDetailResponse = AdminCustomerDetail;

// Instructor types
export interface AdminInstructor {
  id: number;
  instructor_name: string;
  email: string;
  phone_number: string;
  address: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_color: string;
  withdrawn_amount: number | string;
  wallet_balance: number | string;
  average_wage_per_ride: number | string;
  average_time_per_ride: number | string;
  average_distance_per_ride: number | string;
  transferred_rides_count: number | string;
  created_at: string;
}

export interface AdminInstructorsParams extends PaginationParams {
  instructorName?: string;
  email?: string;
  phoneNumber?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  address?: string;
}

export type AdminInstructorsResponse = AdminInstructor[];

export interface InstructorVehicle {
  id: number;
  brand: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  registration_doc_url: string;
  insurance_doc_url: string;
  vehicle_image_url: string;
  status: string;
}

export interface InstructorRecentRide {
  id: number;
  booking_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  status: string;
  total_distance: string;
  total_hours: string;
  hourly_rate: number;
  instructor_earnings: number;
  pickup_location: string;
  dropoff_location: string;
  test_type: string;
  center_name: string;
  payment_scheduled_at: string;
  payment_processed_at: string;
}

export interface AdminInstructorDetail {
  id: number;
  identifier: string;
  full_name: string;
  email: string;
  phone_number: string;
  address: string;
  status: string;
  photo_url: string;
  driving_school_name: string;
  license_number: string;
  license_validity_date: string;
  profile_completion_percentage: number;
  rating: number;
  rating_count: number;
  transfer_count: number;
  wallet_balance: number;
  referral_code: string;
  stripe_account_id: string;
  stripe_account_status: string;
  stripe_payouts_enabled: boolean;
  stripe_charges_enabled: boolean;
  created_at: string;
  vehicle: InstructorVehicle;
  recent_rides: InstructorRecentRide[];
  total_rides: number;
  total_earnings: number;
  total_withdrawn: number;
  average_wage_per_ride: number;
  average_time_per_ride: number;
  average_distance_per_ride: number;
}

export type AdminInstructorDetailResponse = AdminInstructorDetail;

// Instructor rides types
export interface InstructorRide {
  id: number;
  booking_id: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  status: string;
  total_distance: string;
  total_hours: string;
  hourly_rate: number;
  instructor_earnings: number;
  pickup_location: string;
  dropoff_location: string;
  test_type: string;
  center_name: string;
  payment_scheduled_at: string;
  payment_processed_at: string;
  created_at: string;
}

export interface AdminInstructorRidesParams extends PaginationParams {
  customerName?: string;
  bookingId?: string;
  status?: string;
  testType?: string;
  centerName?: string;
  startDate?: string;
  endDate?: string;
  minEarnings?: number;
  maxEarnings?: number;
}

export type AdminInstructorRidesResponse = InstructorRide[];

// Dropdown types
export interface AdminUserDropdown {
  id: number;
  full_name: string;
  email: string;
}

export type AdminUsersDropdownResponse = AdminUserDropdown[];

export interface AdminBooking {
  id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  instructor_id?: number;
  instructor_full_name?: string;
  instructor_phone_number?: string;
  test_center_id: number;
  test_center_name: string;
  test_center_address: string;
  test_type: 'G2' | 'G';
  test_date: string;
  meet_at_center: boolean;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_distance?: number;
  base_price: number;
  pickup_price: number;
  addons_price: number;
  total_price: number;
  status: string;
  test_result?: string;
  coupon_code?: string;
  discount_amount?: number;
  is_rescheduled: boolean;
  previous_booking_id?: number;
  timezone: string;
  addon_id?: number;
  addon_duration?: number;
  road_test_doc_url?: string;
  g1_license_doc_url?: string;
  payment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AdminBookingsParams extends PaginationParams {
  transferred_ride?: boolean;
  is_instructor_attached?: boolean;
  testType?: string;
  startDate?: string; // ISO datetime string
  endDate?: string; // ISO datetime string
  status?: string;
  test_result?: string;
}

export type AdminBookingsResponse = AdminBooking[];

export interface BookingInstructor {
  user_id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  vehicle_info?: string;
  rating?: number;
  is_available?: boolean;
}

export type AdminBookingInstructorsResponse = BookingInstructor[];

export interface CreateBookingRequest {
  test_center_id: number;
  road_test_doc_url?: string;
  g1_license_doc_url?: string;
  test_type: 'G2' | 'G';
  test_date: string; // Format: "2023-01-01 11:10:00"
  meet_at_center: boolean;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  addon_id?: number;
  coupon_code?: string;
  timezone: string; // Default: "America/Toronto"
  user_id: number;
  instructor_id?: number;
}

export interface CreateBookingResponse {
  id: number;
  user_id: number;
  full_name: string;
  phone_number: string;
  instructor_id?: number;
  instructor_full_name?: string;
  instructor_phone_number?: string;
  test_center_id: number;
  test_center_name: string;
  test_center_address: string;
  test_type: 'G2' | 'G';
  test_date: string;
  meet_at_center: boolean;
  pickup_address?: string;
  pickup_latitude?: number;
  pickup_longitude?: number;
  pickup_distance?: number;
  base_price: number;
  pickup_price: number;
  addons_price: number;
  total_price: number;
  status: string;
  test_result?: string;
  coupon_code?: string;
  discount_amount?: number;
  is_rescheduled: boolean;
  previous_booking_id?: number;
  timezone: string;
  addon_id?: number;
  addon_duration?: number;
  road_test_doc_url?: string;
  g1_license_doc_url?: string;
  payment_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignInstructorRequest {
  booking_id: number;
  instructor_id: number;
}

export interface InstructorMetric {
  name: string;
  value: number;
  description: string;
}

export interface DashboardAnalytics {
  total_bookings: number;
  total_instructors: number;
  total_revenue: number;
  pending_bookings: number;
  wants_refund_count: number;
  average_salary_per_session: number;
  average_distance_km: number;
  top_earner: InstructorMetric;
  most_distance_instructor: InstructorMetric;
  most_rides_instructor: InstructorMetric;
}

export type DashboardAnalyticsResponse = DashboardAnalytics;

export interface AdminRideSession {
  id: number;
  username: string;
  instructorName: string;
  centerName: string;
  pickupLocation: string;
  dropoffLocation: string;
  dateTime: string;
  testType: string;
  totalPrice: number;
  instructorEarnings: number;
  totalDistance: string;
  totalHours: string;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  timestamp: string;
  speed: number;
}

export interface AdminRideSessionDetail extends AdminRideSession {
  userName: string;
  testDate: string;
  dropLocation: string;
  userContact: string;
  instructorContact: string;
  instructorPayments: number;
  routePoints: RoutePoint[];
}

export interface AdminRideSessionsParams extends PaginationParams {
  centerName?: string;
  instructorName?: string;
  customerName?: string;
  startDate?: string;
  endDate?: string;
  testType?: string;
}

export type AdminRideSessionsResponse = AdminRideSession[];
export type AdminRideSessionDetailResponse = AdminRideSessionDetail;