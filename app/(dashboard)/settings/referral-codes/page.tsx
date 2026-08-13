// app/(dashboard)/settings/referral-codes/page.tsx
'use client';

import React, { useState } from 'react';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import ReferralCodesTable from '@/components/tables/ReferralCodesTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Gift, Users, DollarSign, CheckCircle } from 'lucide-react';
import { useReferralCodes } from '@/hooks/useAdmin';
import CursorPagination from '@/components/ui/CursorPagination';
import type { AdminReferralCodesParams } from '@/types/admin';
import { formatCAD } from '@/lib/utils';
import { resolveReferralPayout } from '@/lib/utils/referral-payout';
import { useLivePeerReferralBonus } from '@/hooks/useReferralBonus';

export default function ReferralCodesPage() {
  const [searchParams, setSearchParams] = useState<AdminReferralCodesParams>({
    limit: 10,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: referralCodes, meta, isLoading, error, refetch } = useReferralCodes(searchParams);
  // Peer codes pay the live setting, not their stored amount (ADMIN_SETTINGS.md 4.1)
  const livePeerBonus = useLivePeerReferralBonus();

  const metrics = React.useMemo(() => {
    const totalCodes = meta?.total ?? referralCodes.length;
    const activeCodes = referralCodes.filter(c => c.status === 'active').length;
    const claimedCodes = referralCodes.filter(c => c.status === 'claimed').length;
    const totalAmount = referralCodes.reduce(
      (sum, c) => sum + resolveReferralPayout(c, livePeerBonus).total,
      0,
    );

    return [
      { title: meta?.total ? 'Total Codes' : 'Codes (page)', value: totalCodes.toString(), icon: Gift },
      { title: 'Active (page)', value: activeCodes.toString(), icon: Users },
      { title: 'Claimed (page)', value: claimedCodes.toString(), icon: CheckCircle },
      { title: 'Payout value (page)', value: formatCAD(totalAmount, { suffix: false }), icon: DollarSign }
    ];
  }, [referralCodes, meta, livePeerBonus]);

  const handleSearchUpdate = (newParams: Partial<AdminReferralCodesParams>) => {
    const updatedParams = { ...searchParams, ...newParams, cursor: undefined, direction: undefined };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  const goToPage = (cursor: string, direction: 'forward' | 'backward') => {
    const next = { ...searchParams, cursor, direction };
    setSearchParams(next);
    refetch(next);
  };

  if (isLoading && referralCodes.length === 0) {
    return (
      <ErrorBoundary>
        <div className="px-6 space-y-6 pt-6">
          <CardSkeleton count={4} />
          <LoadingState card text="Loading referral codes..." className="py-12" />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="px-6 space-y-6">
        <KeyMetrics metrics={metrics} />

        <div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading referral codes</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          <ReferralCodesTable
            title={`All Referral Codes (${meta?.total ?? referralCodes.length})`}
            data={referralCodes}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
          />

          <CursorPagination
            meta={meta}
            count={referralCodes.length}
            isLoading={isLoading}
            onNext={() => meta?.nextCursor && goToPage(meta.nextCursor, 'forward')}
            onPrev={() => meta?.prevCursor && goToPage(meta.prevCursor, 'backward')}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}