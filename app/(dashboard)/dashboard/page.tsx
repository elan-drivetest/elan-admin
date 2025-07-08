// app/(dashboard)/dashboard/page.tsx
import React from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import BookingsTable from '@/components/tables/BookingsTable';
import { mockDashboardMetrics, mockRecentBookings } from '@/lib/mock-data';

export default function DashboardPage() {
  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Dashboard"
        subtitle="Welcome back! Here's what's happening with your road test bookings."
        // actions={<DefaultDashboardActions />}
      />

      {/* Key Metrics */}
      <KeyMetrics metrics={mockDashboardMetrics} />

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* Recent Bookings Table */}
        <BookingsTable 
          title="Recent Bookings"
          data={mockRecentBookings}
          showFilters={true}
        />
      </div>
    </>
  );
}

export const metadata = {
  title: 'Dashboard | Elan Admin',
  description: 'Admin dashboard for Elan road test booking system',
};