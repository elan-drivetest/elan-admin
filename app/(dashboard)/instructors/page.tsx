// app/(dashboard)/instructors/page.tsx
'use client';

import React from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import InstructorMetrics from '@/components/layouts/InstructorMetrics';
import InstructorsTable from '@/components/tables/InstructorsTable';
import { mockInstructorPerformanceMetrics, mockInstructors } from '@/lib/instructors-mock-data';

export default function InstructorsPage() {
  return (
    <>
      {/* Header */}
      <DashboardHeader
        title="Instructors"
        subtitle="Manage instructor accounts, performance, and earnings."
      />

      {/* Performance Metrics */}
      <InstructorMetrics metrics={mockInstructorPerformanceMetrics} />

      {/* Main Content */}
      <div className="px-6 space-y-6 mt-6">
        {/* All Instructors Table */}
        <InstructorsTable 
          title="All Instructors"
          data={mockInstructors}
        />
      </div>
    </>
  );
}