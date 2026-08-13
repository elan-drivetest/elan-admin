// app/(dashboard)/settings/pricing-and-payouts/page.tsx
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ui/error-boundary';
import LoadingState from '@/components/ui/loading-state';
import SettingValueCard from '@/components/settings/SettingValueCard';
import MissingSettingCard from '@/components/settings/MissingSettingCard';
import { useSystemSettings } from '@/hooks/useAdmin';
import { formatCAD } from '@/lib/utils';
import { isPricingCriticalSetting, resolvePickupPricing } from '@/lib/pricing-config';
import { calculatePickupPrice } from '@/lib/utils/booking-calculations';
import { SETTING_ORDER, describeInPractice, parseSettingValue } from '@/lib/settings-copy';

/** Sample trips for the worked example — short, typical, and past the base distance. */
const EXAMPLE_DISTANCES = [10, 30, 60];

export default function PricingAndPayoutsPage() {
  const { data, isLoading, error, refetch } = useSystemSettings();

  const rows = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const { config: pricing } = useMemo(() => resolvePickupPricing(rows), [rows]);

  const byKey = useMemo(() => new Map(rows.map((row) => [row.key, row])), [rows]);

  /**
   * The values the system is really running on, for the worked one-liners. The
   * pickup trio comes through the resolver so an absent row reports the fallback
   * customers are actually being charged, not a blank.
   */
  const effectiveValues = useMemo<Record<string, number | null>>(() => {
    const read = (key: string) => {
      const raw = byKey.get(key)?.value;
      return raw === undefined ? null : parseSettingValue(raw);
    };
    return {
      base_distance: pricing.baseDistance,
      base_rate: pricing.baseRate,
      normal_rate: pricing.normalRate,
      instructor_rate: read('instructor_rate'),
      average_distance_per_hour: read('average_distance_per_hour'),
      instructor_referral_price: read('instructor_referral_price'),
      admin_referral_price: read('admin_referral_price'),
      referral_min_rides: read('referral_min_rides'),
    };
  }, [byKey, pricing]);

  /** Anything the backend added that this screen has no wording for yet. */
  const extraRows = useMemo(
    () => rows.filter((row) => !SETTING_ORDER.includes(row.key)),
    [rows],
  );

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

            {/* The whole catalogue, present or not — an absent row is the thing
                an admin most needs to see (ADMIN_SETTINGS.md §6). */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {SETTING_ORDER.map((key) => {
                const setting = byKey.get(key);
                if (!setting) return <MissingSettingCard key={key} settingKey={key} />;

                return (
                  <SettingValueCard
                    key={key}
                    setting={setting}
                    inPractice={describeInPractice(key, effectiveValues)}
                    describeImpact={describePickupImpact(key)}
                    onUpdated={() => refetch()}
                  />
                );
              })}

              {extraRows.map((setting) => (
                <SettingValueCard
                  key={setting.key}
                  setting={setting}
                  onUpdated={() => refetch()}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
