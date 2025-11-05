// app/(dashboard)/settings/coupons/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CouponsTable from '@/components/tables/CouponsTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Gift, Users, DollarSign, Calendar, Plus } from 'lucide-react';
import { useCoupons } from '@/hooks/useAdmin';
import type { AdminCouponsParams } from '@/types/admin';

export default function CouponsPage() {
  const [searchParams, setSearchParams] = useState<AdminCouponsParams>({
    limit: 50,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: coupons, isLoading, error, refetch } = useCoupons(searchParams);

  const metrics = React.useMemo(() => {
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.is_active && !c.is_expired).length;
    const totalUsage = coupons.reduce((sum, c) => sum + c.usage_count, 0);
    const totalValue = coupons.reduce((sum, c) => sum + (c.discount * c.usage_count), 0);

    return [
      { title: 'Total Coupons', value: totalCoupons.toString(), icon: Gift },
      { title: 'Active Coupons', value: activeCoupons.toString(), icon: Calendar },
      { title: 'Total Usage', value: totalUsage.toString(), icon: Users },
      { title: 'Total Value', value: `$${(totalValue / 100).toLocaleString()}`, icon: DollarSign }
    ];
  }, [coupons]);

  const handleSearchUpdate = (newParams: Partial<AdminCouponsParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  if (isLoading && coupons.length === 0) {
    return (
      <ErrorBoundary>
        <div className="px-6 space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coupons</h1>
              <p className="text-gray-600 mt-1">Manage discount coupons and track their usage.</p>
            </div>
          </div>
          <CardSkeleton count={4} />
          <LoadingState card text="Loading coupons..." className="py-12" />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="px-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Coupons</h1>
            <p className="text-gray-600 mt-1">Manage discount coupons and track their usage.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings/coupons/expired">
              <Button variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                View Expired
              </Button>
            </Link>
            <Link href="/settings/coupons/usage">
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Usage Analytics
              </Button>
            </Link>
            <Link href="/settings/coupons/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Coupon
              </Button>
            </Link>
          </div>
        </div>

        <KeyMetrics metrics={metrics} />

        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
              <p className="font-medium">Error loading coupons</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          <CouponsTable 
            title={`All Coupons (${coupons.length})`}
            data={coupons}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}