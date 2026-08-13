// app/(dashboard)/settings/pricing-and-payouts/page.tsx
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ui/error-boundary';
import LoadingState from '@/components/ui/loading-state';
import SettingValueCard from '@/components/settings/SettingValueCard';
import { useSystemSettings } from '@/hooks/useAdmin';
import { formatCAD } from '@/lib/utils';
import { isPricingCriticalSetting, resolvePickupPricing } from '@/lib/pricing-config';
import { calculatePickupPrice } from '@/lib/utils/booking-calculations';
import { SETTING_ORDER, getSettingCopy } from '@/lib/settings-copy';

/** Sample trips for the worked example — short, typical, and past the base distance. */
const EXAMPLE_DISTANCES = [10, 30, 60];

export default function PricingAndPayoutsPage() {
  const { data, isLoading, error, refetch } = useSystemSettings();

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const { config: pricing } = useMemo(() => resolvePickupPricing(rows), [rows]);

  // Every row the server returns is shown — known keys first, in a sensible
  // order, anything added later falls to the end rather than disappearing.
  const ordered = useMemo(() => {
    const rank = (key: string) => {
      const index = SETTING_ORDER.indexOf(key);
      return index === -1 ? SETTING_ORDER.length : index;
    };
    return [...rows].sort((a, b) => rank(a.key) - rank(b.key));
  }, [rows]);

  const missing = SETTING_ORDER.filter((key) => !rows.some((row) => row.key === key));

  /** One line of consequence, for the three numbers that price a pickup. */
  const describePickupImpact = (key: string) => (nextValue: number) => {
    if (!isPricingCriticalSetting(key)) return null;

    const next = {
      ...pricing,
      ...(key === 'base_distance' ? { baseDistance: nextValue } : {}),
      ...(key === 'base_rate' ? { baseRate: nextValue } : {}),
      ...(key === 'normal_rate' ? { normalRate: nextValue } : {}),
    };
    const before = calculatePickupPrice(30, pricing);
    const after = calculatePickupPrice(30, next);

    return after === before
      ? 'No change to a 30 km pickup.'
      : `A 30 km pickup would cost ${formatCAD(after, { suffix: false })} instead of ${formatCAD(before, { suffix: false })}.`;
  };

  return (
    <ErrorBoundary>
      <div className="space-y-4 px-6 pb-10">
        {isLoading ? (
          <LoadingState card text="Loading configuration..." />
        ) : error ? (
          <Card className="border-red-200">
            <CardContent className="p-5">
              <p className="font-medium text-gray-900">Could not load these settings</p>
              <p className="mt-1 text-sm text-gray-600">{error.message}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* The pickup rates priced out, so the numbers below mean something */}
            <Card className="border-gray-200">
              <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-medium text-gray-900">What a pickup costs</p>
                  <p className="mt-1 text-sm text-gray-600">
                    First {pricing.baseDistance} km at{' '}
                    {formatCAD(pricing.baseRate, { suffix: false })}/km, then{' '}
                    {formatCAD(pricing.normalRate, { suffix: false })}/km. The test-centre fee and
                    add-ons are charged on top.
                  </p>
                </div>
                <div className="flex gap-6">
                  {EXAMPLE_DISTANCES.map((km) => (
                    <div key={km}>
                      <p className="text-xs text-gray-500">{km} km</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {formatCAD(calculatePickupPrice(km, pricing), { suffix: false })}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {ordered.map((setting) => (
                <SettingValueCard
                  key={setting.key}
                  setting={setting}
                  describeImpact={describePickupImpact(setting.key)}
                  onUpdated={() => refetch()}
                />
              ))}
            </div>

            {/* The seeder is all-or-nothing, so a key added later is simply absent */}
            {missing.length > 0 && (
              <p className="text-xs text-gray-500">
                Not set up on the server:{' '}
                {missing.map((key) => getSettingCopy(key)?.label ?? key).join(', ')}. The system uses
                its built-in defaults for these until a developer adds the rows.
              </p>
            )}
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
