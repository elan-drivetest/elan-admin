// lib/mock-data.ts
import type { BookingTableData } from '@/components/tables/BookingsTable';
import type { MetricData } from '@/components/layouts/KeyMetrics';
import { DollarSign, Calendar, Users, Car } from 'lucide-react';

// Mock metrics data matching the UI design
export const mockDashboardMetrics: MetricData[] = [
  {
    title: 'Total bookings',
    value: '12',
    icon: Calendar,
  },
  {
    title: 'Total instructors',
    value: '07',
    icon: Users,
  },
  {
    title: 'Total Revenue',
    value: '$1,500',
    icon: DollarSign,
  },
  {
    title: 'Pending bookings',
    value: '03',
    icon: Car,
  }
];

// Mock recent bookings data
export const mockRecentBookings: BookingTableData[] = [
  {
    id: '1',
    userName: 'Sarah Johnson',
    centerName: 'Downsview',
    pickupLocation: '123 Main St, Toronto, ON',
    dateTime: 'Dec 15, 2024 - 2:30 PM',
    status: 'confirmed',
    hasInstructor: true,
    testType: 'G2',
    price: 150,
  },
  {
    id: '2',
    userName: 'Mike Chen',
    centerName: 'Etobicoke',
    pickupLocation: 'Meet at Center',
    dateTime: 'Dec 16, 2024 - 10:00 AM',
    status: 'pending',
    hasInstructor: false,
    testType: 'G',
    price: 85,
  },
  {
    id: '3',
    userName: 'Emily Rodriguez',
    centerName: 'Mississauga',
    pickupLocation: '456 Oak Ave, Mississauga, ON',
    dateTime: 'Dec 17, 2024 - 1:15 PM',
    status: 'confirmed',
    hasInstructor: false,
    testType: 'G2',
    price: 175,
  },
  {
    id: '4',
    userName: 'David Kim',
    centerName: 'North York',
    pickupLocation: '789 Pine Rd, North York, ON',
    dateTime: 'Dec 18, 2024 - 3:45 PM',
    status: 'pending',
    hasInstructor: false,
    testType: 'G',
    price: 165,
  },
  {
    id: '5',
    userName: 'Jessica Brown',
    centerName: 'Scarborough',
    pickupLocation: 'Meet at Center',
    dateTime: 'Dec 19, 2024 - 11:30 AM',
    status: 'completed',
    hasInstructor: true,
    testType: 'G2',
    price: 70,
  },
];