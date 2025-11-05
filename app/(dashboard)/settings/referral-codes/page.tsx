// app/(dashboard)/settings/referral-codes/page.tsx
'use client';

import React, { useState } from 'react';
import KeyMetrics from '@/components/layouts/KeyMetrics';
import ReferralCodesTable from '@/components/tables/ReferralCodesTable';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Gift, Users, DollarSign, CheckCircle } from 'lucide-react';
import { useReferralCodes } from '@/hooks/useAdmin';
import type { AdminReferralCodesParams } from '@/types/admin';

export default function ReferralCodesPage() {
  const [searchParams, setSearchParams] = useState<AdminReferralCodesParams>({
    limit: 50,
    orderBy: 'created_at',
    orderDirection: 'desc'
  });

  const { data: referralCodes, isLoading, error, refetch } = useReferralCodes(searchParams);

  const metrics = React.useMemo(() => {
    const totalCodes = referralCodes.length;
    const activeCodes = referralCodes.filter(c => c.status === 'active').length;
    const claimedCodes = referralCodes.filter(c => c.status === 'claimed').length;
    const totalAmount = referralCodes.reduce((sum, c) => sum + c.amount, 0);

    return [
      { title: 'Total Codes', value: totalCodes.toString(), icon: Gift },
      { title: 'Active Codes', value: activeCodes.toString(), icon: Users },
      { title: 'Claimed Codes', value: claimedCodes.toString(), icon: CheckCircle },
      { title: 'Total Value', value: `$${(totalAmount / 100).toLocaleString()}`, icon: DollarSign }
    ];
  }, [referralCodes]);

  const handleSearchUpdate = (newParams: Partial<AdminReferralCodesParams>) => {
    const updatedParams = { ...searchParams, ...newParams };
    setSearchParams(updatedParams);
    refetch(updatedParams);
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
            title={`All Referral Codes (${referralCodes.length})`}
            data={referralCodes}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
}