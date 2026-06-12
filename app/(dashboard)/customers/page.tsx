// app/(dashboard)/customers/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CustomersTable from '@/components/tables/CustomersTable';
import LoadingState, { CardSkeleton, TableSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { useCustomers } from '@/hooks/useAdmin';
import CursorPagination from '@/components/ui/CursorPagination';
import { Users, Car, CheckCircle } from 'lucide-react';
import type { AdminCustomersParams } from '@/types/admin';

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useState<AdminCustomersParams>({
    limit: 10,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: customers, meta, isLoading, error, refetch } = useCustomers(searchParams);

  const metrics = useMemo(() => {
    const totalCustomers = meta?.total ?? customers.length;
    const activeCustomers = customers.filter(c => c.any_ride_booked).length;
    const totalRides = customers.reduce((sum, c) => sum + parseInt(c.total_ride_count?.toString() || '0', 10), 0);
    const passedTests = customers.reduce((sum, c) => sum + parseInt(c.passed_count?.toString() || '0', 10), 0);

    return [
      { title: meta?.total ? 'Total Customers' : 'Customers (page)', value: totalCustomers.toString(), icon: Users },
      { title: 'Active (page)', value: activeCustomers.toString(), icon: Users },
      { title: 'Rides (page)', value: totalRides.toString(), icon: Car },
      { title: 'Passed (page)', value: passedTests.toString(), icon: CheckCircle }
    ];
  }, [customers, meta]);

  const handleSearchUpdate = (newParams: Partial<AdminCustomersParams>) => {
    // Reset pagination whenever filters change.
    const updatedParams = { ...searchParams, ...newParams, cursor: undefined, direction: undefined };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  const goToPage = (cursor: string, direction: 'forward' | 'backward') => {
    const next = { ...searchParams, cursor, direction };
    setSearchParams(next);
    refetch(next);
  };

  // Show loading state for initial load
  if (isLoading && customers.length === 0) {
    return (
      <ErrorBoundary>
        <>
          <DashboardHeader
            title="Customers"
            subtitle="Manage customer accounts and track their progress."
          />
          
          <div className="px-6 space-y-6">
            <CardSkeleton count={4} />
            <LoadingState 
              card 
              text="Loading customers..." 
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
          title="Customers"
          subtitle="Manage customer accounts and track their progress."
        />

        <div className='px-6'>
          <KeyMetrics metrics={metrics} />
        </div>

        <div className="px-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading customers</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          <CustomersTable
            title="All Customers"
            data={customers}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
          />

          <CursorPagination
            meta={meta}
            count={customers.length}
            isLoading={isLoading}
            onNext={() => meta?.nextCursor && goToPage(meta.nextCursor, 'forward')}
            onPrev={() => meta?.prevCursor && goToPage(meta.prevCursor, 'backward')}
          />
        </div>
      </>
    </ErrorBoundary>
  );
}