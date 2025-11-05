// app/(dashboard)/bookings/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import EnhancedBookingsTable from '@/components/tables/EnhancedBookingsTable';
import CreateBookingModal from '@/components/modals/CreateBookingModal';
import AssignInstructorModal from '@/components/modals/AssignInstructorModal';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Calendar, Users, RefreshCw, Clock, Search } from 'lucide-react';
import { useAllBookings } from '@/hooks/useAdmin';
import type { EnhancedBookingData } from '@/components/tables/EnhancedBookingsTable';
import type { AdminBooking, AdminBookingsParams } from '@/types/admin';

// Transform API data to table format
const transformBookingData = (booking: AdminBooking): EnhancedBookingData => ({
  id: booking.id.toString(),
  userName: booking.full_name,
  userPhone: booking.phone_number,
  centerName: booking.test_center_name,
  centerAddress: booking.test_center_address,
  pickupLocation: booking.meet_at_center 
    ? 'Meet at Center --- Meet at Center' 
    : `${booking.pickup_address || 'Pickup Address'} --- ${booking.test_center_address}`,
  dateTime: new Date(booking.test_date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }),
  testType: booking.test_type,
  totalPrice: booking.total_price,
  basePrice: booking.base_price,
  pickupPrice: booking.pickup_price,
  addonsPrice: booking.addons_price,
  instructorName: booking.instructor_full_name,
  instructorPhone: booking.instructor_phone_number,
  status: booking.status,
  testResult: booking.test_result,
  hasInstructor: !!booking.instructor_id,
  roadTestDocUrl: booking.road_test_doc_url,
  g1LicenseDocUrl: booking.g1_license_doc_url,
  couponCode: booking.coupon_code,
  discountAmount: booking.discount_amount,
  originalBooking: booking, // Add the full booking object
});

export default function BookingsPage() {
  // API and state management
  const [searchParams, setSearchParams] = useState<AdminBookingsParams>({
    limit: 50,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });
  
  const { data: bookings, isLoading, error, refetch } = useAllBookings(searchParams);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    transferred_ride: false,
    is_instructor_attached: false,
    status: '',
    test_result: '',
    testType: '',
    startDate: '',
    endDate: '',
  });

  // Calculate metrics from real data
  const metrics = useMemo(() => {
    const totalBookings = bookings.length;
    const uniqueInstructors = new Set(bookings.filter(b => b.instructor_id).map(b => b.instructor_id)).size;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.total_price, 0);
    const pendingCount = bookings.filter(b => b.status === 'pending').length;

    return [
      { title: 'Total bookings', value: totalBookings.toString(), icon: Calendar },
      { title: 'Total instructors', value: uniqueInstructors.toString().padStart(2, '0'), icon: Users },
      { title: 'Total Revenue', value: `$${(totalRevenue / 100).toLocaleString()}`, icon: RefreshCw },
      { title: 'Pending bookings', value: pendingCount.toString().padStart(2, '0'), icon: Clock }
    ];
  }, [bookings]);

  // Handle search and filter updates
  const handleApplyFilters = () => {
    const updatedParams: AdminBookingsParams = {
      ...searchParams,
      search: searchTerm || undefined,
      transferred_ride: filters.transferred_ride || undefined,
      is_instructor_attached: filters.is_instructor_attached || undefined,
      status: filters.status || undefined,
      test_result: filters.test_result || undefined,
      testType: filters.testType || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
    };
    
    // Remove undefined values
    Object.keys(updatedParams).forEach(key => {
      if (updatedParams[key as keyof AdminBookingsParams] === undefined) {
        delete updatedParams[key as keyof AdminBookingsParams];
      }
    });
    
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  // Handle filter changes
  const handleFilterChange = (filterName: string, value: boolean | string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Transform data for table
  const transformedBookings = useMemo(() => {
    return bookings.map(transformBookingData);
  }, [bookings]);

  const handleCreateSuccess = () => {
    refetch();
  };

  const handleAssignSuccess = () => {
    refetch();
    setIsAssignModalOpen(false);
    setSelectedBookingId(null);
  };

  // Show loading state for initial load
  if (isLoading && bookings.length === 0) {
    return (
      <ErrorBoundary>
        <>
          <DashboardHeader
            title="Bookings"
            subtitle="Manage all road test bookings and track their progress."
          />
          
          <div className="px-6 space-y-6">
            <CardSkeleton count={4} />
            <LoadingState card text="Loading bookings..." className="py-12" />
          </div>
        </>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <>
        {/* Header */}
        <DashboardHeader
          title="Bookings"
          subtitle="Manage all road test bookings and track their progress."
          actions={
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Booking
            </Button>
          }
        />

        {/* Key Metrics */}
        <div className="px-6">
          <KeyMetrics metrics={metrics} />
        </div>

        {/* Main Content */}
        <div className="px-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading bookings</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          {/* Search and Filters */}
          <div className="bg-white border rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Search & Filters</h3>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {/* Test Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Test Type</label>
                <select
                  value={filters.testType}
                  onChange={(e) => handleFilterChange('testType', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="">All Types</option>
                  <option value="G2">G2</option>
                  <option value="G">G</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="active">Active</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Test Result Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Test Result</label>
                <select
                  value={filters.test_result}
                  onChange={(e) => handleFilterChange('test_result', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
                >
                  <option value="">All Results</option>
                  <option value="PASS">Pass</option>
                  <option value="FAIL">Fail</option>
                </select>
              </div>

              {/* Start Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Start Date</label>
                <Input
                  type="datetime-local"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="text-sm"
                />
              </div>

              {/* End Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">End Date</label>
                <Input
                  type="datetime-local"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="text-sm"
                />
              </div>
            </div>

            {/* Boolean Filters */}
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.transferred_ride}
                  onChange={(e) => handleFilterChange('transferred_ride', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Transferred Rides Only</span>
              </label>
              
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={filters.is_instructor_attached}
                  onChange={(e) => handleFilterChange('is_instructor_attached', e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-sm text-gray-700">Has Instructor</span>
              </label>
            </div>

            {/* Apply Filters Button */}
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setFilters({
                    transferred_ride: false,
                    is_instructor_attached: false,
                    status: '',
                    test_result: '',
                    testType: '',
                    startDate: '',
                    endDate: '',
                  });
                }}
              >
                Clear Filters
              </Button>
              <Button onClick={handleApplyFilters} disabled={isLoading}>
                {isLoading ? 'Searching...' : 'Apply Filters'}
              </Button>
            </div>
          </div>

          {/* All Bookings Table */}
          <EnhancedBookingsTable 
            title={`All Bookings (${transformedBookings.length})`}
            data={transformedBookings}
            showCreateButton={false}
            isLoading={isLoading}
            onAssignInstructor={(bookingId) => {
              setSelectedBookingId(parseInt(bookingId));
              setIsAssignModalOpen(true);
            }}
          />
        </div>

        {/* Modals */}
        <CreateBookingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />

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