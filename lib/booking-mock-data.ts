// lib/booking-mock-data.ts
import type { EnhancedBookingData } from '@/components/tables/EnhancedBookingsTable';
import type { MetricData } from '@/components/layouts/KeyMetrics';
import { Calendar, Users, RefreshCw, Clock } from 'lucide-react';

// Mock metrics for booking page
export const mockBookingMetrics: MetricData[] = [
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
    title: 'Wants Refund',
    value: '01',
    icon: RefreshCw,
  },
  {
    title: 'Pending bookings',
    value: '03',
    icon: Clock,
  }
];

// Mock booking data for the enhanced table
export const mockAllBookings: EnhancedBookingData[] = [
  {
    id: '1',
    userName: 'Sarah Johnson',
    centerName: 'Downsview',
    pickupLocation: '123 Main St, Toronto --- 456 Oak Ave',
    dateTime: 'Dec 15, 2024 - 2:30 PM',
    testType: 'G2',
    price: 200,
    instructorName: 'John Smith',
    status: 'accepted',
    paymentStatus: 'paid',
  },
  {
    id: '2',
    userName: 'Mike Chen',
    centerName: 'Etobicoke',
    pickupLocation: 'Meet at Center --- Meet at Center',
    dateTime: 'Dec 16, 2024 - 10:00 AM',
    testType: 'G',
    price: 200,
    instructorName: 'Emily Davis',
    status: 'on progress',
    paymentStatus: 'paid',
  },
  {
    id: '3',
    userName: 'Emily Rodriguez',
    centerName: 'Mississauga',
    pickupLocation: '789 Pine Rd --- 321 Elm St',
    dateTime: 'Dec 17, 2024 - 1:15 PM',
    testType: 'G2',
    price: 200,
    instructorName: 'Michael Brown',
    status: 'searching',
    paymentStatus: 'paid',
  },
  {
    id: '4',
    userName: 'David Kim',
    centerName: 'North York',
    pickupLocation: '555 Maple Ave --- 777 Cedar Dr',
    dateTime: 'Dec 18, 2024 - 3:45 PM',
    testType: 'G',
    price: 200,
    instructorName: 'Sarah Wilson',
    status: 'transferred',
    paymentStatus: 'paid',
  },
  {
    id: '5',
    userName: 'Jessica Brown',
    centerName: 'Scarborough',
    pickupLocation: 'Meet at Center --- Meet at Center',
    dateTime: 'Dec 19, 2024 - 11:30 AM',
    testType: 'G2',
    price: 200,
    instructorName: 'Alex Johnson',
    status: 'completed',
    paymentStatus: 'paid',
  },
  {
    id: '6',
    userName: 'Robert Taylor',
    centerName: 'Markham',
    pickupLocation: '999 Birch St --- 111 Spruce Ave',
    dateTime: 'Dec 20, 2024 - 9:00 AM',
    testType: 'G',
    price: 200,
    instructorName: 'Lisa Anderson',
    status: 'failed',
    paymentStatus: 'paid',
  },
  {
    id: '7',
    userName: 'Amanda White',
    centerName: 'Richmond Hill',
    pickupLocation: '222 Willow Rd --- 333 Poplar St',
    dateTime: 'Dec 21, 2024 - 4:00 PM',
    testType: 'G2',
    price: 200,
    instructorName: 'David Martinez',
    status: 'passed',
    paymentStatus: 'paid',
  },
  {
    id: '8',
    userName: 'Kevin Lee',
    centerName: 'Vaughan',
    pickupLocation: '444 Cherry Lane --- 666 Pine Ridge',
    dateTime: 'Dec 22, 2024 - 12:00 PM',
    testType: 'G',
    price: 200,
    instructorName: 'Jennifer Garcia',
    status: 'wants_refund',
    paymentStatus: 'refund_requested',
  },
];