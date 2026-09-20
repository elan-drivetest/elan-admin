// app/(dashboard)/settings/coupons/page.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import CouponsTable from '@/components/tables/CouponsTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Gift, Users, DollarSign, Calendar, Plus } from 'lucide-react';
import { useCoupons } from '@/hooks/useAdmin';
import CursorPagination from '@/components/ui/CursorPagination';
import { formatCAD, sumFixedCouponValue } from '@/lib/utils';
import { looksFlattenedByPartialUpdate } from '@/lib/utils/coupon-audit';
import type { AdminCouponsParams } from '@/types/admin';

export default function CouponsPage() {
  const [searchParams, setSearchParams] = useState<AdminCouponsParams>({
    limit: 10,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: coupons, meta, isLoading, error, refetch } = useCoupons(searchParams);

  const metrics = React.useMemo(() => {
    const totalCoupons = meta?.total ?? coupons.length;
    const activeCoupons = coupons.filter(c => c.is_active && !c.is_expired).length;
    const totalUsage = coupons.reduce((sum, c) => sum + c.usage_count, 0);
    // Percentage coupons have no summable face value — see sumFixedCouponValue.
    const { total: totalValue, excludedPercentageCoupons } = sumFixedCouponValue(coupons);

    return [
      { title: meta?.total ? 'Total Coupons' : 'Coupons (page)', value: totalCoupons.toString(), icon: Gift },
      { title: 'Active (page)', value: activeCoupons.toString(), icon: Calendar },
      { title: 'Usage (page)', value: totalUsage.toString(), icon: Users },
      {
        title: excludedPercentageCoupons > 0 ? 'Fixed-coupon value (page)' : 'Value (page)',
        value: formatCAD(totalValue, { suffix: false }),
        icon: DollarSign,
        trend:
          excludedPercentageCoupons > 0
            ? `Excludes ${excludedPercentageCoupons} used % coupon${excludedPercentageCoupons === 1 ? '' : 's'}`
            : undefined,
      },
    ];
  }, [coupons, meta]);

  /**
   * Coupons that a pre-2026-09-19 edit may have flattened from a percentage into
   * a tiny fixed discount. Page-local — the check needs each row, so it can only
   * see what is loaded. A hit means "open this and check", not "this is broken".
   */
  const suspect = React.useMemo(
    () => coupons.filter(looksFlattenedByPartialUpdate),
    [coupons],
  );

  const handleSearchUpdate = (newParams: Partial<AdminCouponsParams>) => {
    const updatedParams = { ...searchParams, ...newParams, cursor: undefined, direction: undefined };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  const goToPage = (cursor: string, direction: 'forward' | 'backward') => {
    const next = { ...searchParams, cursor, direction };
    setSearchParams(next);
    refetch(next);
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

        {suspect.length > 0 && (
          <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="text-sm leading-relaxed">
              <p className="font-medium">
                {suspect.length === 1
                  ? '1 coupon on this page may have been reset by an old edit'
                  : `${suspect.length} coupons on this page may have been reset by an old edit`}
              </p>
              <p className="mt-1">
                Editing a coupon used to overwrite its discount type, minimum, expiry and reuse
                flag with defaults — turning <em>25% off</em> into <em>25 cents off</em>. The
                backend no longer does this, but rows edited before the fix can still be wrong.
                These read as a fixed discount under $1.00 with every other field at its default:{' '}
                {suspect.slice(0, 5).map((c) => c.code).join(', ')}
                {suspect.length > 5 ? ` and ${suspect.length - 5} more` : ''}. Open each and check
                it against what it was meant to be.
              </p>
            </div>
          </div>
        )}

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
            title={`All Coupons (${meta?.total ?? coupons.length})`}
            data={coupons}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
          />

          <CursorPagination
            meta={meta}
            count={coupons.length}
            isLoading={isLoading}
            onNext={() => meta?.nextCursor && goToPage(meta.nextCursor, 'forward')}
            onPrev={() => meta?.prevCursor && goToPage(meta.prevCursor, 'backward')}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}