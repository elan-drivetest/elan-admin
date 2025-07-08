// lib/customers-mock-data.ts
import type { CustomerData } from '@/components/tables/CustomersTable';
import type { MetricData } from '@/components/layouts/KeyMetrics';
import { Users, Car, CheckCircle, XCircle } from 'lucide-react';

// Mock metrics for customers page
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

// Mock customer data
export const mockCustomers: CustomerData[] = [
  {
    id: '1',
    fullName: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    contact: '+1 (416) 555-0123',
    hasRideBookedOrBookedism: true,
    totalRideCount: 5,
    passedFailed: 'passed',
  },
  {
    id: '2',
    fullName: 'Mike Chen',
    email: 'mike.chen@email.com',
    contact: '+1 (416) 555-0124',
    hasRideBookedOrBookedism: true,
    totalRideCount: 3,
    passedFailed: 'pending',
  },
  {
    id: '3',
    fullName: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    contact: '+1 (416) 555-0125',
    hasRideBookedOrBookedism: false,
    totalRideCount: 0,
    passedFailed: 'not_attempted',
  },
  {
    id: '4',
    fullName: 'David Kim',
    email: 'david.kim@email.com',
    contact: '+1 (416) 555-0126',
    hasRideBookedOrBookedism: true,
    totalRideCount: 7,
    passedFailed: 'failed',
  },
  {
    id: '5',
    fullName: 'Jessica Brown',
    email: 'jessica.brown@email.com',
    contact: '+1 (416) 555-0127',
    hasRideBookedOrBookedism: true,
    totalRideCount: 2,
    passedFailed: 'passed',
  },
  {
    id: '6',
    fullName: 'Robert Taylor',
    email: 'robert.taylor@email.com',
    contact: '+1 (416) 555-0128',
    hasRideBookedOrBookedism: false,
    totalRideCount: 0,
    passedFailed: 'not_attempted',
  },
  {
    id: '7',
    fullName: 'Amanda White',
    email: 'amanda.white@email.com',
    contact: '+1 (416) 555-0129',
    hasRideBookedOrBookedism: true,
    totalRideCount: 4,
    passedFailed: 'pending',
  },
  {
    id: '8',
    fullName: 'Kevin Lee',
    email: 'kevin.lee@email.com',
    contact: '+1 (416) 555-0130',
    hasRideBookedOrBookedism: true,
    totalRideCount: 6,
    passedFailed: 'passed',
  },
  {
    id: '9',
    fullName: 'Lisa Garcia',
    email: 'lisa.garcia@email.com',
    contact: '+1 (416) 555-0131',
    hasRideBookedOrBookedism: false,
    totalRideCount: 0,
    passedFailed: 'not_attempted',
  },
  {
    id: '10',
    fullName: 'Daniel Martinez',
    email: 'daniel.martinez@email.com',
    contact: '+1 (416) 555-0132',
    hasRideBookedOrBookedism: true,
    totalRideCount: 1,
    passedFailed: 'failed',
  },
];