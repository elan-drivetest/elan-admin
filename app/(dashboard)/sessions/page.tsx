// app/(dashboard)/sessions/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import RideSessionFilters from '@/components/ui/ride-session-filters';
import RideSessionsTable from '@/components/tables/RideSessionsTable';
import { mockRideSessionMetrics, mockRideSessions } from '@/lib/ride-session-mock-data';
import type { RideSessionData } from '@/components/tables/RideSessionsTable';

export default function RideSessionsPage() {
  // Search states
  const [centerSearch, setCenterSearch] = useState('');
  const [instructorSearch, setInstructorSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [dateSearch, setDateSearch] = useState('');

  // Filter the ride sessions based on search criteria
  const filteredSessions = useMemo(() => {
    return mockRideSessions.filter((session: RideSessionData) => {
      // Center name search
      const matchesCenter = centerSearch === '' || 
        session.centerName.toLowerCase().includes(centerSearch.toLowerCase());
      
      // User name search
      const matchesUser = userSearch === '' || 
        session.userName.toLowerCase().includes(userSearch.toLowerCase());

      // Instructor name search
      const matchesInstructor = instructorSearch === '' || 
        session.instructorName.toLowerCase().includes(instructorSearch.toLowerCase());

      // Date search - convert date input to match our date format
      const matchesDate = dateSearch === '' || (() => {
        const searchDate = new Date(dateSearch);
        const sessionDateStr = session.dateTime;
        
        // Extract date part from "Dec 15, 2024 - 2:30 PM" format
        const sessionDatePart = sessionDateStr.split(' - ')[0];
        
        // Parse the session date
        const sessionDate = new Date(sessionDatePart);
        
        // Compare dates (ignore time)
        return searchDate.toDateString() === sessionDate.toDateString();
      })();

      return matchesCenter && matchesUser && matchesInstructor && matchesDate;
    });
  }, [centerSearch, instructorSearch, userSearch, dateSearch]);

  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Ride Sessions"
        subtitle="Manage driving lessons and track session progress."
      />

      {/* Key Metrics */}
      <KeyMetrics metrics={mockRideSessionMetrics} />

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* Search Filters */}
        <RideSessionFilters
          centerSearch={centerSearch}
          onCenterSearchChange={setCenterSearch}
          instructorSearch={instructorSearch}
          onInstructorSearchChange={setInstructorSearch}
          userSearch={userSearch}
          onUserSearchChange={setUserSearch}
          dateSearch={dateSearch}
          onDateSearchChange={setDateSearch}
        />

        {/* All Ride Sessions Table */}
        <RideSessionsTable 
          title="All Ride Sessions"
          data={filteredSessions}
        />
      </div>
    </>
  );
}