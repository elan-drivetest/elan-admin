// lib/instructors-mock-data.ts
import type { InstructorMetricData } from '@/components/layouts/InstructorMetrics';
import type { AdminInstructor } from '@/types/admin';

// Updated to use AdminInstructor interface instead of old InstructorData
// This file is now deprecated in favor of real API data from useInstructors hook

// Legacy mock performance metrics for instructors page (deprecated - now calculated from real data)
export const mockInstructorPerformanceMetrics: InstructorMetricData[] = [
  {
    title: 'Top Earner',
    amount: '$1,580 CAD',
    instructorName: 'Rob Lorence',
  },
  {
    title: 'Most distance covered',
    amount: '$1,580 CAD',
    instructorName: 'John Doe',
  },
  {
    title: 'Most ride accepted',
    amount: '$1,580 CAD',
    instructorName: 'Mira Mir',
  },
];

// Legacy mock instructor data (deprecated - now using AdminInstructor from API)
export const mockInstructors: AdminInstructor[] = [
  {
    id: 1,
    instructor_name: 'Rob Lorence',
    email: 'rob.lorence@email.com',
    phone_number: '+1234567890',
    address: '123 Main St, Toronto, ON',
    vehicle_brand: 'Honda',
    vehicle_model: 'Civic',
    vehicle_year: 2022,
    vehicle_color: 'Blue',
    withdrawn_amount: 120000, // $1200 in cents
    wallet_balance: 38000, // $380 in cents
    average_wage_per_ride: 7500, // $75 in cents
    average_time_per_ride: 2.5,
    average_distance_per_ride: 45.0,
    transferred_rides_count: 2,
    created_at: '2024-01-15T10:30:00.000Z',
  },
  {
    id: 2,
    instructor_name: 'John Doe',
    email: 'john.doe@email.com',
    phone_number: '+1234567891',
    address: '456 Oak Ave, Mississauga, ON',
    vehicle_brand: 'Toyota',
    vehicle_model: 'Corolla',
    vehicle_year: 2023,
    vehicle_color: 'White',
    withdrawn_amount: 98000, // $980 in cents
    wallet_balance: 60000, // $600 in cents
    average_wage_per_ride: 6800, // $68 in cents
    average_time_per_ride: 3.2,
    average_distance_per_ride: 52.0,
    transferred_rides_count: 1,
    created_at: '2024-01-16T10:30:00.000Z',
  },
  {
    id: 3,
    instructor_name: 'Mira Mir',
    email: 'mira.mir@email.com',
    phone_number: '+1234567892',
    address: '789 Pine Rd, North York, ON',
    vehicle_brand: 'Nissan',
    vehicle_model: 'Sentra',
    vehicle_year: 2021,
    vehicle_color: 'Silver',
    withdrawn_amount: 145000, // $1450 in cents
    wallet_balance: 13000, // $130 in cents
    average_wage_per_ride: 8200, // $82 in cents
    average_time_per_ride: 2.8,
    average_distance_per_ride: 38.0,
    transferred_rides_count: 0,
    created_at: '2024-01-17T10:30:00.000Z',
  },
  {
    id: 4,
    instructor_name: 'Sarah Wilson',
    email: 'sarah.wilson@email.com',
    phone_number: '+1234567893',
    address: '321 Elm St, Etobicoke, ON',
    vehicle_brand: 'Hyundai',
    vehicle_model: 'Elantra',
    vehicle_year: 2022,
    vehicle_color: 'Red',
    withdrawn_amount: 75600, // $756 in cents
    wallet_balance: 82400, // $824 in cents
    average_wage_per_ride: 7100, // $71 in cents
    average_time_per_ride: 2.1,
    average_distance_per_ride: 41.0,
    transferred_rides_count: 1,
    created_at: '2024-01-18T10:30:00.000Z',
  },
  {
    id: 5,
    instructor_name: 'Michael Brown',
    email: 'michael.brown@email.com',
    phone_number: '+1234567894',
    address: '654 Maple Ave, Scarborough, ON',
    vehicle_brand: 'Mazda',
    vehicle_model: 'Mazda3',
    vehicle_year: 2023,
    vehicle_color: 'Black',
    withdrawn_amount: 108900, // $1089 in cents
    wallet_balance: 49100, // $491 in cents
    average_wage_per_ride: 7900, // $79 in cents
    average_time_per_ride: 2.9,
    average_distance_per_ride: 47.0,
    transferred_rides_count: 3,
    created_at: '2024-01-19T10:30:00.000Z',
  },
];

// Utility function to transform old InstructorData to AdminInstructor (for backward compatibility)
export function transformLegacyInstructorData(oldData: any[]): AdminInstructor[] {
  return oldData.map((instructor, index) => ({
    id: parseInt(instructor.id) || index + 1,
    instructor_name: instructor.fullName || instructor.instructor_name,
    email: instructor.email,
    phone_number: instructor.phoneNumber || instructor.phone_number || 'N/A',
    address: instructor.address,
    vehicle_brand: instructor.carDetails?.split(' ')[1] || instructor.vehicle_brand || 'Unknown',
    vehicle_model: instructor.carDetails?.split(' ')[2] || instructor.vehicle_model || 'Unknown',
    vehicle_year: instructor.carDetails ? parseInt(instructor.carDetails.split(' ')[0]) : instructor.vehicle_year || 2020,
    vehicle_color: instructor.vehicle_color || 'Unknown',
    withdrawn_amount: (instructor.withdrawnAmount || instructor.withdrawn_amount || 0) * 100, // Convert to cents
    wallet_balance: (instructor.vaultAmount || instructor.wallet_balance || 0) * 100, // Convert to cents
    average_wage_per_ride: (instructor.avgWage || instructor.average_wage_per_ride || 0) * 100, // Convert to cents
    average_time_per_ride: parseFloat(instructor.avgTime) || instructor.average_time_per_ride || 0,
    average_distance_per_ride: parseFloat(instructor.avgDistance) || instructor.average_distance_per_ride || 0,
    transferred_rides_count: instructor.transferred_rides_count || 0,
    created_at: instructor.created_at || new Date().toISOString(),
  }));
}