// app/(dashboard)/instructors/page.tsx
'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import InstructorPerformanceCards from '@/components/layouts/InstructorPerformanceCards';
import InstructorsTable from '@/components/tables/InstructorsTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { useDashboardAnalytics, useInstructors } from '@/hooks/useAdmin';
import CursorPagination from '@/components/ui/CursorPagination';
import type { AdminInstructorsParams } from '@/types/admin';

export default function InstructorsPage() {
  const [searchParams, setSearchParams] = useState<AdminInstructorsParams>({
    limit: 10,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useDashboardAnalytics();
  const { data: instructors, meta, isLoading: instructorsLoading, error: instructorsError, refetch } = useInstructors(searchParams);

  const handleSearchUpdate = (newParams: Partial<AdminInstructorsParams>) => {
    const updatedParams = { ...searchParams, ...newParams, cursor: undefined, direction: undefined };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  const goToPage = (cursor: string, direction: 'forward' | 'backward') => {
    const next = { ...searchParams, cursor, direction };
    setSearchParams(next);
    refetch(next);
  };

  if (analyticsLoading && instructorsLoading) {
    return (
      <ErrorBoundary>
        <>
          <DashboardHeader
            title="Instructors"
            subtitle="Manage instructor accounts, performance, and earnings."
          />
          <div className="px-6 space-y-6">
            <CardSkeleton count={3} />
            <LoadingState 
              card 
              text="Loading instructors..." 
              className="py-12"
            />
          </div>
        </>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <DashboardHeader
          title="Instructors"
          subtitle="Manage instructor accounts, performance, and earnings."
        />

        {analyticsError && (
          <div className="px-6">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading instructor performance</p>
              <p className="text-sm">{analyticsError.message}</p>
            </div>
          </div>
        )}

        {analytics && <InstructorPerformanceCards analytics={analytics} />}

        <div className="px-6 space-y-6 mt-6">
          {instructorsError && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading instructors</p>
              <p className="text-sm">{instructorsError.message}</p>
            </div>
          )}

          <InstructorsTable
            title="All Instructors"
            data={instructors}
            isLoading={instructorsLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
          />

          <CursorPagination
            meta={meta}
            count={instructors.length}
            isLoading={instructorsLoading}
            onNext={() => meta?.nextCursor && goToPage(meta.nextCursor, 'forward')}
            onPrev={() => meta?.prevCursor && goToPage(meta.prevCursor, 'backward')}
          />
        </div>
      </>
    </ErrorBoundary>
  );
}