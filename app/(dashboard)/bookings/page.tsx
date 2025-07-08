// app/(dashboard)/bookings/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import SearchFilters from '@/components/ui/search-filters';
import EnhancedBookingsTable from '@/components/tables/EnhancedBookingsTable';
import { mockBookingMetrics, mockAllBookings } from '@/lib/booking-mock-data';
import type { EnhancedBookingData } from '@/components/tables/EnhancedBookingsTable';

export default function BookingsPage() {
  // Search states
  const [centerSearch, setCenterSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  
  // Filter states
  const [filters, setFilters] = useState({
    failed: false,
    passed: false,
    completed: false,
    wantsRefund: false,
  });

  // Handle filter changes
  const handleFilterChange = (filterName: keyof typeof filters, value: boolean) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  // Filter the bookings based on search and filters
  const filteredBookings = useMemo(() => {
    return mockAllBookings.filter((booking: EnhancedBookingData) => {
      // Search filters
      const matchesCenter = centerSearch === '' || 
        booking.centerName.toLowerCase().includes(centerSearch.toLowerCase());
      
      const matchesUser = userSearch === '' || 
        booking.userName.toLowerCase().includes(userSearch.toLowerCase());

      // Status filters
      const hasActiveFilters = Object.values(filters).some(f => f);
      
      if (!hasActiveFilters) {
        return matchesCenter && matchesUser;
      }

      const matchesFilters = 
        (filters.failed && booking.status === 'failed') ||
        (filters.passed && booking.status === 'passed') ||
        (filters.completed && booking.status === 'completed') ||
        (filters.wantsRefund && booking.status === 'wants_refund');

      return matchesCenter && matchesUser && matchesFilters;
    });
  }, [centerSearch, userSearch, filters]);

  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Bookings"
        subtitle="Manage all road test bookings and track their progress."
      />

      {/* Key Metrics */}
      <KeyMetrics metrics={mockBookingMetrics} />

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* Search and Filters */}
        <SearchFilters
          centerSearch={centerSearch}
          onCenterSearchChange={setCenterSearch}
          userSearch={userSearch}
          onUserSearchChange={setUserSearch}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* All Bookings Table */}
        <EnhancedBookingsTable 
          title="All Bookings"
          data={filteredBookings}
          showCreateButton={true}
        />
      </div>
    </>
  );
}