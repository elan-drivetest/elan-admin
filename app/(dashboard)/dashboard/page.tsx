// app/(dashboard)/dashboard/page.tsx
'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import DashboardAnalyticsMetrics from '@/components/layouts/DashboardAnalyticsMetrics';
import BookingsTable, { type BookingTableData } from '@/components/tables/BookingsTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import AssignInstructorModal from '@/components/modals/AssignInstructorModal';
import { Calendar } from 'lucide-react';
import { useDashboardAnalytics, useRecentBookings } from '@/hooks/useAdmin';
import type { AdminBooking, AdminBookingsParams } from '@/types/admin';

const transformRecentBookingData = (booking: AdminBooking): BookingTableData => ({
  id: booking.id.toString(),
  userName: booking.full_name,
  userPhone: booking.phone_number,
  centerName: booking.test_center_name,
  centerAddress: booking.test_center_address,
  pickupLocation: booking.meet_at_center 
    ? 'Meet at Center' 
    : booking.pickup_address || 'Pickup Location',
  dateTime: new Date(booking.test_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }),
  status: booking.status,
  testResult: booking.test_result,
  hasInstructor: !!booking.instructor_id,
  instructorName: booking.instructor_full_name,
  instructorPhone: booking.instructor_phone_number,
  testType: booking.test_type,
  totalPrice: booking.total_price,
  basePrice: booking.base_price,
  pickupPrice: booking.pickup_price,
  addonsPrice: booking.addons_price,
  originalBooking: booking,
});

export default function DashboardPage() {
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useDashboardAnalytics();
  const { data: recentBookings, isLoading: bookingsLoading, error: bookingsError, refetch: refetchRecentBookings } = useRecentBookings({
    limit: 10,
    orderBy: 'created_at',
    orderDirection: 'desc',
  });

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);

  const handleAssignSuccess = () => {
    refetchRecentBookings();
    setIsAssignModalOpen(false);
    setSelectedBookingId(null);
  };

  const transformedBookings = React.useMemo(() => {
    return recentBookings.map(transformRecentBookingData);
  }, [recentBookings]);

  if (analyticsLoading) {
    return (
      <ErrorBoundary>
        <>
          <DashboardHeader
            title="Dashboard"
            subtitle="Welcome back! Here's what's happening with your road test bookings."
          />
          <div className="px-6 space-y-6">
            <CardSkeleton count={7} />
            <LoadingState card text="Loading dashboard..." className="py-12" />
          </div>
        </>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <DashboardHeader
          title="Dashboard"
          subtitle="Welcome back! Here's what's happening with your road test bookings."
        />

        {analyticsError && (
          <div className="px-6">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading dashboard analytics</p>
              <p className="text-sm">{analyticsError.message}</p>
            </div>
          </div>
        )}

        {analytics && <DashboardAnalyticsMetrics analytics={analytics} />}

        <div className="px-6 space-y-6">
          {bookingsError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading recent bookings</p>
              <p className="text-sm">{bookingsError.message}</p>
            </div>
          )}

          <BookingsTable 
            title="Recent Bookings"
            data={transformedBookings}
            onAssignInstructor={(bookingId) => {
              setSelectedBookingId(parseInt(bookingId));
              setIsAssignModalOpen(true);
            }}
            isLoading={bookingsLoading && recentBookings.length === 0}
          />

          {!bookingsLoading && recentBookings.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No recent bookings</p>
              <p className="text-sm">New bookings will appear here when they are created.</p>
            </div>
          )}
        </div>

        <AssignInstructorModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          bookingId={selectedBookingId}
          onSuccess={handleAssignSuccess}
        />
      </>
    </ErrorBoundary>
  );
}