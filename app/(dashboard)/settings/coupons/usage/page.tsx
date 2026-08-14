// app/(dashboard)/settings/coupons/usage/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CouponUsageTable from '@/components/tables/CouponUsageTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { Gift, Users, DollarSign, Calendar, ArrowLeft } from 'lucide-react';
import { useCouponUsage, useCoupons } from '@/hooks/useAdmin';
import CursorPagination from '@/components/ui/CursorPagination';
import type { AdminCouponUsageParams } from '@/types/admin';
import { formatCAD, isPercentageCoupon } from '@/lib/utils';

export default function CouponUsagePage() {
  const [searchParams, setSearchParams] = useState<AdminCouponUsageParams>({
    limit: 10,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: usageData, meta, isLoading, error, refetch } = useCouponUsage(searchParams);
  // The usage record's discount_amount is unreliable; use each coupon's real discount.
  const { data: coupons } = useCoupons({ limit: 100 });
  // Only FIXED coupons can have their face value substituted here — a
  // percentage coupon's `discount` is a percent, so mapping it in would report
  // "10 cents" as the discount. Those fall back to the usage row's own amount.
  const couponDiscounts = React.useMemo(() => {
    const map: Record<string, number> = {};
    coupons.forEach((c) => {
      if (!isPercentageCoupon(c)) map[c.code] = c.discount;
    });
    return map;
  }, [coupons]);

  const metrics = React.useMemo(() => {
    const totalUsages = meta?.total ?? usageData.length;
    const uniqueCoupons = new Set(usageData.map(u => u.coupon_code)).size;
    const totalDiscount = usageData.reduce((sum, u) => sum + (couponDiscounts[u.coupon_code] ?? u.discount_amount), 0);
    const uniqueCustomers = new Set(usageData.map(u => u.customer_email)).size;

    return [
      { title: meta?.total ? 'Total Usage' : 'Usage (page)', value: totalUsages.toString(), icon: Gift },
      { title: 'Coupons (page)', value: uniqueCoupons.toString(), icon: Calendar },
      { title: 'Discount (page)', value: formatCAD(totalDiscount, { suffix: false }), icon: DollarSign },
      { title: 'Customers (page)', value: uniqueCustomers.toString(), icon: Users }
    ];
  }, [usageData, meta, couponDiscounts]);

  const handleSearchUpdate = (newParams: Partial<AdminCouponUsageParams>) => {
    const updatedParams = { ...searchParams, ...newParams, cursor: undefined, direction: undefined };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  const goToPage = (cursor: string, direction: 'forward' | 'backward') => {
    const next = { ...searchParams, cursor, direction };
    setSearchParams(next);
    refetch(next);
  };

  if (isLoading && usageData.length === 0) {
    return (
      <ErrorBoundary>
        <div className="px-6 space-y-6 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Coupon Usage Analytics</h1>
              <p className="text-gray-600 mt-1">Track coupon usage across all bookings.</p>
            </div>
          </div>
          <CardSkeleton count={4} />
          <LoadingState card text="Loading usage analytics..." className="py-12" />
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
            <h1 className="text-3xl font-bold text-gray-900">Coupon Usage Analytics</h1>
            <p className="text-gray-600 mt-1">Track coupon usage across all bookings.</p>
          </div>
          <Link href="/settings/coupons">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coupons
            </Button>
          </Link>
        </div>

        <KeyMetrics metrics={metrics} />

        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md mb-6">
              <p className="font-medium">Error loading usage analytics</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          <CouponUsageTable
            title={`All Coupon Usage (${meta?.total ?? usageData.length})`}
            data={usageData}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
            showCouponColumn={true}
            couponDiscounts={couponDiscounts}
          />

          <CursorPagination
            meta={meta}
            count={usageData.length}
            isLoading={isLoading}
            onNext={() => meta?.nextCursor && goToPage(meta.nextCursor, 'forward')}
            onPrev={() => meta?.prevCursor && goToPage(meta.prevCursor, 'backward')}
          />

          {!isLoading && usageData.length === 0 && (
            <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
              <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No coupon usage found</p>
              <p className="text-sm">Usage data will appear here when customers use coupons.</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}