// lib/customers-mock-data.ts
import type { MetricData } from '@/components/layouts/KeyMetrics';
import type { AdminCustomer } from '@/types/admin';
import { Users, Car, CheckCircle, XCircle } from 'lucide-react';

// Updated to use AdminCustomer interface instead of old CustomerData
// This file is now deprecated in favor of real API data from useCustomers hook

// Legacy mock metrics for customers page (deprecated - now calculated from real data)
export const mockCustomerMetrics: MetricData[] = [
  {
    title: 'Total Customers',
    value: '156',
    icon: Users,
  },
  {
    title: 'Active Customers',
    value: '89',
    icon: Users,
  },
  {
    title: 'Total Rides',
    value: '342',
    icon: Car,
  },
  {
    title: 'Passed Tests',
    value: '78',
    icon: CheckCircle,
  }
];

// Legacy mock customer data (deprecated - now using AdminCustomer from API)
export const mockCustomers: AdminCustomer[] = [
  {
    id: 1,
    full_name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    contact: '+1 (416) 555-0123',
    any_ride_booked: true,
    total_ride_count: 5,
    passed_count: 1,
    failed_count: 0,
    created_at: '2024-01-15T10:30:00.000Z',
  },
  {
    id: 2,
    full_name: 'Mike Chen',
    email: 'mike.chen@email.com',
    contact: '+1 (416) 555-0124',
    any_ride_booked: true,
    total_ride_count: 3,
    passed_count: 0,
    failed_count: 0,
    created_at: '2024-01-16T10:30:00.000Z',
  },
  {
    id: 3,
    full_name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    contact: '+1 (416) 555-0125',
    any_ride_booked: false,
    total_ride_count: 0,
    passed_count: 0,
    failed_count: 0,
    created_at: '2024-01-17T10:30:00.000Z',
  },
  {
    id: 4,
    full_name: 'David Kim',
    email: 'david.kim@email.com',
    contact: '+1 (416) 555-0126',
    any_ride_booked: true,
    total_ride_count: 7,
    passed_count: 0,
    failed_count: 1,
    created_at: '2024-01-18T10:30:00.000Z',
  },
  {
    id: 5,
    full_name: 'Jessica Brown',
    email: 'jessica.brown@email.com',
    contact: '+1 (416) 555-0127',
    any_ride_booked: true,
    total_ride_count: 2,
    passed_count: 1,
    failed_count: 0,
    created_at: '2024-01-19T10:30:00.000Z',
  },
];

// Utility function to transform old CustomerData to AdminCustomer (for backward compatibility)
export function transformLegacyCustomerData(oldData: any[]): AdminCustomer[] {
  return oldData.map((customer, index) => ({
    id: parseInt(customer.id) || index + 1,
    full_name: customer.fullName || customer.full_name,
    email: customer.email,
    contact: customer.contact,
    any_ride_booked: customer.hasRideBookedOrBookedism || customer.any_ride_booked,
    total_ride_count: customer.totalRideCount || customer.total_ride_count,
    passed_count: customer.passedFailed === 'passed' ? 1 : customer.passed_count || 0,
    failed_count: customer.passedFailed === 'failed' ? 1 : customer.failed_count || 0,
    created_at: customer.created_at || new Date().toISOString(),
  }));
}