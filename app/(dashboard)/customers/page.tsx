// app/(dashboard)/customers/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CustomersTable from '@/components/tables/CustomersTable';
import LoadingState, { CardSkeleton, TableSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { useCustomers } from '@/hooks/useAdmin';
import { Users, Car, CheckCircle, XCircle } from 'lucide-react';
import type { AdminCustomersParams } from '@/types/admin';

export default function CustomersPage() {
  const [searchParams, setSearchParams] = useState<AdminCustomersParams>({
    limit: 50,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: customers, isLoading, error, refetch } = useCustomers(searchParams);

  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.any_ride_booked).length;
    const totalRides = customers.reduce((sum, c) => sum + parseInt(c.total_ride_count?.toString() || '0', 10), 0);
    const passedTests = customers.reduce((sum, c) => sum + parseInt(c.passed_count?.toString() || '0', 10), 0);

    return [
      { title: 'Total Customers', value: totalCustomers.toString(), icon: Users },
      { title: 'Active Customers', value: activeCustomers.toString(), icon: Users },
      { title: 'Total Rides', value: totalRides.toString(), icon: Car },
      { title: 'Passed Tests', value: passedTests.toString(), icon: CheckCircle }
    ];
  }, [customers]);

  const handleSearchUpdate = (newParams: Partial<AdminCustomersParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    setSearchParams(updatedParams);
    refetch(updatedParams);
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

        <KeyMetrics metrics={metrics} />

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
        </div>
      </>
    </ErrorBoundary>
  );
}