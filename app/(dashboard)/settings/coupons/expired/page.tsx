// app/(dashboard)/settings/coupons/expired/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CouponsTable from '@/components/tables/CouponsTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Gift, Calendar, DollarSign, ArrowLeft } from 'lucide-react';
import { useExpiredCoupons } from '@/hooks/useAdmin';
import type { AdminCouponsParams } from '@/types/admin';

export default function ExpiredCouponsPage() {
  const [searchParams, setSearchParams] = useState<AdminCouponsParams>({
    limit: 50,
    orderBy: 'expires_at',
    orderDirection: 'desc'
  });

  const { data: expiredCoupons, isLoading, error, refetch } = useExpiredCoupons(searchParams);

  const metrics = React.useMemo(() => {
    const totalExpired = expiredCoupons.length;
    const totalUsage = expiredCoupons.reduce((sum, c) => sum + c.usage_count, 0);
    const totalValue = expiredCoupons.reduce((sum, c) => sum + (c.discount * c.usage_count), 0);
    const avgUsage = totalExpired > 0 ? Math.round(totalUsage / totalExpired) : 0;

    return [
      { title: 'Expired Coupons', value: totalExpired.toString(), icon: Calendar },
      { title: 'Total Usage', value: totalUsage.toString(), icon: Gift },
      { title: 'Total Value Used', value: `$${(totalValue / 100).toLocaleString()}`, icon: DollarSign },
      { title: 'Avg Usage per Coupon', value: avgUsage.toString(), icon: Gift }
    ];
  }, [expiredCoupons]);

  const handleSearchUpdate = (newParams: Partial<AdminCouponsParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  if (isLoading && expiredCoupons.length === 0) {
    return (
      <ErrorBoundary>
        <div className="px-6 space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expired Coupons</h1>
              <p className="text-gray-600 mt-1">View and analyze expired coupon performance.</p>
            </div>
          </div>
          <CardSkeleton count={4} />
          <LoadingState card text="Loading expired coupons..." className="py-12" />
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
            <h1 className="text-3xl font-bold text-gray-900">Expired Coupons</h1>
            <p className="text-gray-600 mt-1">View and analyze expired coupon performance.</p>
          </div>
          <Link href="/settings/coupons">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Coupons
            </Button>
          </Link>
        </div>

        <KeyMetrics metrics={metrics} />

        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
              <p className="font-medium">Error loading expired coupons</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          <CouponsTable 
            title={`Expired Coupons (${expiredCoupons.length})`}
            data={expiredCoupons}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
          />

          {!isLoading && expiredCoupons.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No expired coupons found</p>
              <p className="text-sm">Expired coupons will appear here when they reach their expiration date.</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}