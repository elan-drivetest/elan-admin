// app/(dashboard)/settings/coupons/[id]/usage/page.tsx
'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CouponUsageTable from '@/components/tables/CouponUsageTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Gift, Users, DollarSign, Calendar, ArrowLeft, Loader2 } from 'lucide-react';
import { useCouponUsageById, useCouponDetail } from '@/hooks/useAdmin';
import type { AdminCouponUsageParams } from '@/types/admin';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CouponUsageDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const [searchParams, setSearchParams] = useState<AdminCouponUsageParams>({
    limit: 50,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: coupon, isLoading: couponLoading } = useCouponDetail(resolvedParams.id);
  const { data: usageData, isLoading, error, refetch } = useCouponUsageById(resolvedParams.id, searchParams);

  const metrics = React.useMemo(() => {
    const totalUsages = usageData.length;
    const totalDiscount = usageData.reduce((sum, u) => sum + u.discount_amount, 0);
    const uniqueCustomers = new Set(usageData.map(u => u.customer_email)).size;
    const avgBookingValue = usageData.length > 0 
      ? usageData.reduce((sum, u) => sum + u.total_price, 0) / usageData.length 
      : 0;

    return [
      { title: 'Total Usage', value: totalUsages.toString(), icon: Gift },
      { title: 'Unique Customers', value: uniqueCustomers.toString(), icon: Users },
      { title: 'Total Discount Given', value: `$${(totalDiscount / 100).toLocaleString()}`, icon: DollarSign },
      { title: 'Avg Booking Value', value: `$${(avgBookingValue / 100).toFixed(0)}`, icon: Calendar }
    ];
  }, [usageData]);

  const handleSearchUpdate = (newParams: Partial<AdminCouponUsageParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  if (couponLoading || (isLoading && usageData.length === 0)) {
    return (
      <ErrorBoundary>
        <div className="px-6 space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coupon Usage Details</h1>
              <p className="text-gray-600 mt-1">Loading usage information...</p>
            </div>
            <Link href={`/settings/coupons/${resolvedParams.id}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Coupon
              </Button>
            </Link>
          </div>
          <CardSkeleton count={4} />
          <LoadingState card text="Loading usage details..." className="py-12" />
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
            <h1 className="text-3xl font-bold text-gray-900">
              {coupon ? `${coupon.name === null ? 'Unnamed' : coupon.name} Usage` : 'Coupon Usage Details'}
            </h1>
            <p className="text-gray-600 mt-1">
              {coupon ? `Code: ${coupon.code}` : 'Track how this coupon is being used.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/settings/coupons/usage">
              <Button variant="outline">
                <Gift className="h-4 w-4 mr-2" />
                All Usage
              </Button>
            </Link>
            <Link href={`/settings/coupons/${resolvedParams.id}`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Coupon
              </Button>
            </Link>
          </div>
        </div>

        <KeyMetrics metrics={metrics} />

        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
              <p className="font-medium">Error loading usage details</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          <CouponUsageTable 
            title={`Usage Details (${usageData.length})`}
            data={usageData}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
            showCouponColumn={false}
          />

          {!isLoading && usageData.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
              <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No usage found for this coupon</p>
              <p className="text-sm">Usage data will appear here when customers use this coupon.</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}