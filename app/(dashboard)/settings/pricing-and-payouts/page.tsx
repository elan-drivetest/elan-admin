// app/(dashboard)/settings/pricing-and-payouts/page.tsx
'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ErrorBoundary from '@/components/ui/error-boundary';
import LoadingState from '@/components/ui/loading-state';
import SettingValueCard, {
  type AccentTone,
  type SettingImpact,
} from '@/components/settings/SettingValueCard';
import PickupFareExplorer from '@/components/settings/PickupFareExplorer';
import InstructorPayExplorer from '@/components/settings/InstructorPayExplorer';
import ReferralRewardFlow from '@/components/settings/ReferralRewardFlow';
import {
  AlertTriangle,
  ArrowLeft,
  Car,
  CheckCheck,
  Coins,
  Gauge,
  Gift,
  HeartHandshake,
  Info,
  RefreshCw,
  Route,
  Settings2,
  Ticket,
  TrendingDown,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSystemSettings } from '@/hooks/useAdmin';
import { formatCAD } from '@/lib/utils';
import {
  PICKUP_PRICING_FALLBACKS,
  REFERRAL_FALLBACKS,
  resolvePickupPricing,
  resolveRideEconomics,
} from '@/lib/pricing-config';
import { calculatePickupPrice, estimateRideEarnings } from '@/lib/utils/booking-calculations';
import {
  SETTING_COPY,
  SETTING_GROUPS,
  formatHours,
  formatSettingValue,
  getSettingCopy,
  parseSettingValue,
  type SettingGroupId,
} from '@/lib/settings-copy';
import type { SystemSetting } from '@/types/admin';

/** The example trip the summary tiles quote. Kept short — most pickups are local. */
const TYPICAL_DISTANCE_KM = 25;

const GROUP_ACCENT: Record<SettingGroupId, AccentTone> = {
  'pickup-fare': 'emerald',
  'instructor-pay': 'blue',
  referrals: 'violet',
};

const SETTING_ICON: Record<string, LucideIcon> = {
  base_distance: Route,
  base_rate: Coins,
  normal_rate: TrendingDown,
  instructor_rate: Wallet,
  average_distance_per_hour: Gauge,
  instructor_referral_price: HeartHandshake,
  admin_referral_price: Ticket,
  referral_min_rides: CheckCheck,
};

/** What happens when a key simply isn't in the settings table. */
const MISSING_CONSEQUENCE: Record<SettingGroupId, string> = {
  'pickup-fare':
    'Bookings still work — the system quietly falls back to its built-in value, which may not be the price you intend to charge.',
  'instructor-pay':
    'This one has no safety net. Until it is added, instructors cannot see the list of available jobs at all.',
  referrals: `Codes are still being created — they quietly use the built-in defaults instead of numbers you chose.`,
};

function SummaryTile({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
}) {
  return (
    <Card className="border-gray-200">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Icon className="h-4 w-4" />
          <p className="text-xs uppercase tracking-wide">{label}</p>
        </div>
        <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-900">{value}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-500">{note}</p>
      </CardContent>
    </Card>
  );
}

/** What the system uses when the row simply isn't there. Null where nothing is safe. */
function inForceWithout(settingKey: string): string | null {
  if (settingKey in PICKUP_PRICING_FALLBACKS) {
    const value = PICKUP_PRICING_FALLBACKS[settingKey as keyof typeof PICKUP_PRICING_FALLBACKS];
    return formatSettingValue(settingKey, String(value));
  }
  if (settingKey in REFERRAL_FALLBACKS) {
    const value = REFERRAL_FALLBACKS[settingKey as keyof typeof REFERRAL_FALLBACKS];
    return formatSettingValue(settingKey, String(value));
  }
  return null;
}

function MissingSettingCard({ settingKey, group }: { settingKey: string; group: SettingGroupId }) {
  const copy = getSettingCopy(settingKey);
  const inForce = inForceWithout(settingKey);
  return (
    <Card className="h-full border-dashed border-amber-300 bg-amber-50/40">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 rounded-lg bg-amber-100 p-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{copy?.label ?? settingKey}</h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">{copy?.meaning}</p>
          </div>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white/70 p-3 text-sm leading-relaxed text-amber-900">
          <p>
            <strong>This number is not set up on the server.</strong> {MISSING_CONSEQUENCE[group]}
          </p>
          {inForce && (
            <p className="mt-2">
              In force right now: <strong>{inForce}</strong>.
            </p>
          )}
        </div>
        <p className="mt-auto text-xs text-gray-500">
          It has to be added by your developer — this screen can change a number, but cannot create
          one.
        </p>
      </CardContent>
    </Card>
  );
}

export default function PricingAndPayoutsPage() {
  const { data: settings, isLoading, error, refetch } = useSystemSettings();
  const [distance, setDistance] = useState(TYPICAL_DISTANCE_KM);

  const rows = useMemo(() => (Array.isArray(settings) ? settings : []), [settings]);
  const byKey = useMemo(() => {
    const map = new Map<string, SystemSetting>();
    rows.forEach((row) => map.set(row.key, row));
    return map;
  }, [rows]);

  const { config: pricing, fellBackFor } = useMemo(() => resolvePickupPricing(rows), [rows]);
  const rideEconomics = useMemo(() => resolveRideEconomics(rows), [rows]);

  const readNumber = (key: string): number | null => {
    const raw = byKey.get(key)?.value;
    return raw === undefined ? null : parseSettingValue(raw);
  };

  // A missing referral row is not an error — the backend quietly creates codes
  // with its own default, so show the number actually in force and say so.
  const peerBonus = readNumber('instructor_referral_price') ?? REFERRAL_FALLBACKS.instructor_referral_price;
  const promoBonus = readNumber('admin_referral_price') ?? REFERRAL_FALLBACKS.admin_referral_price;
  const minRides = readNumber('referral_min_rides') ?? REFERRAL_FALLBACKS.referral_min_rides;
  const unsetReferralLabels = (
    ['instructor_referral_price', 'admin_referral_price', 'referral_min_rides'] as const
  )
    .filter((key) => readNumber(key) === null)
    .map((key) => getSettingCopy(key)?.label ?? key);

  const knownKeys = new Set(Object.keys(SETTING_COPY));
  const extraRows = rows.filter((row) => !knownKeys.has(row.key));

  /**
   * Impact previews: recompute the same worked example with one number swapped,
   * so an owner sees the consequence in dollars before saving.
   */
  const describeImpact = (
    groupId: SettingGroupId,
    key: string,
    nextValue: number,
  ): SettingImpact | null => {
    if (groupId === 'pickup-fare') {
      const next = {
        ...pricing,
        ...(key === 'base_distance' ? { baseDistance: nextValue } : {}),
        ...(key === 'base_rate' ? { baseRate: nextValue } : {}),
        ...(key === 'normal_rate' ? { normalRate: nextValue } : {}),
      };
      const before = calculatePickupPrice(distance, pricing);
      const after = calculatePickupPrice(distance, next);
      const difference = after - before;

      return {
        headline: `A ${distance} km pickup would be charged ${formatCAD(after, { suffix: false })} instead of ${formatCAD(before, { suffix: false })}.`,
        detail:
          difference === 0
            ? 'No change at this distance — drag the slider above to test a longer trip.'
            : `That is ${formatCAD(Math.abs(difference), { suffix: false })} ${difference > 0 ? 'more' : 'less'} per booking at this distance.`,
      };
    }

    if (groupId === 'instructor-pay') {
      if (!rideEconomics.available) return null;
      const next = {
        ...rideEconomics.config,
        ...(key === 'instructor_rate' ? { instructorRate: nextValue } : {}),
        ...(key === 'average_distance_per_hour' ? { averageDistancePerHour: nextValue } : {}),
      };
      if (next.averageDistancePerHour <= 0) {
        return {
          headline: 'A speed of zero switches the instructor job list off entirely.',
          detail: 'Keep this above zero — there is no safety net for it.',
          tone: 'warning',
        };
      }
      const before = estimateRideEarnings(distance, rideEconomics.config);
      const after = estimateRideEarnings(distance, next);

      return {
        headline: `The ${distance} km job would show as ${formatHours(after.rideHours)} and ${formatCAD(after.ridePrice, { suffix: false })}, instead of ${formatHours(before.rideHours)} and ${formatCAD(before.ridePrice, { suffix: false })}.`,
        detail: 'Work already accepted keeps the rate it was accepted at.',
      };
    }

    if (key === 'instructor_referral_price') {
      return {
        headline: `Each successful instructor referral would cost you ${formatCAD(nextValue * 2, { suffix: false })}.`,
        detail: `${formatCAD(nextValue, { suffix: false })} to the instructor who referred, and the same again to the one who joined.`,
      };
    }

    if (key === 'admin_referral_price') {
      return {
        headline: `New promo codes would default to ${formatCAD(nextValue, { suffix: false })} for the instructor who claims them.`,
        detail: 'Codes already handed out keep the amount they were created with.',
      };
    }

    return {
      headline: `New codes would need ${nextValue} completed ${nextValue === 1 ? 'ride' : 'rides'} before any bonus is released.`,
      detail: 'Existing codes keep their own requirement.',
    };
  };

  const typicalPickup = calculatePickupPrice(TYPICAL_DISTANCE_KM, pricing);

  return (
    <ErrorBoundary>
      <div className="space-y-8 px-6 pb-10">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/settings"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to settings
          </Link>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <h1 className="text-2xl font-semibold text-gray-900">Pricing &amp; Payouts</h1>
              <p className="mt-2 leading-relaxed text-gray-600">
                A handful of numbers decide what your customers are charged for a pickup, what
                instructors earn for driving, and what a referral costs you. This page explains each
                one in plain English, shows what it does with a real example, and lets you change it.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading ? (
          <LoadingState card text="Loading your pricing settings..." />
        ) : error ? (
          <Card className="border-red-200">
            <CardContent className="p-6">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                <div>
                  <p className="font-medium text-gray-900">These settings could not be loaded</p>
                  <p className="mt-1 text-sm text-gray-600">{error.message}</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()}>
                    Try again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* At a glance */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryTile
                icon={Car}
                label="Typical pickup"
                value={formatCAD(typicalPickup, { suffix: false })}
                note={`What a customer ${TYPICAL_DISTANCE_KM} km from the test centre pays for the drive, before the centre fee and add-ons.`}
              />
              <SummaryTile
                icon={Route}
                label="Cheaper rate starts at"
                value={`${pricing.baseDistance} km`}
                note="Past this point each kilometre costs the customer less — and the free-lesson credit on add-ons kicks in."
              />
              <SummaryTile
                icon={Wallet}
                label="Instructor pay"
                value={
                  rideEconomics.available
                    ? `${formatCAD(rideEconomics.config.instructorRate, { suffix: false })}/h`
                    : 'Not set'
                }
                note={
                  rideEconomics.available
                    ? 'Per hour of ride time, locked in when an instructor accepts a job.'
                    : 'Instructors cannot browse jobs until the hourly rate and speed are set.'
                }
              />
              <SummaryTile
                icon={Gift}
                label="Per instructor referral"
                value={formatCAD(peerBonus * 2, { suffix: false })}
                note="Both sides are paid, so one successful referral costs twice the bonus amount."
              />
            </div>

            {/* Unverified values warning */}
            {fellBackFor.length > 0 && (
              <Card className="border-amber-200 bg-amber-50/60">
                <CardContent className="flex gap-3 p-4">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="text-sm leading-relaxed text-amber-900">
                    <p className="font-medium">Some prices below are safety-net values, not yours</p>
                    <p className="mt-1">
                      {fellBackFor
                        .map((key) => getSettingCopy(key)?.label ?? key)
                        .join(', ')}{' '}
                      could not be read from the server, so the built-in defaults are being used —{' '}
                      {PICKUP_PRICING_FALLBACKS.base_distance} km,{' '}
                      {formatCAD(PICKUP_PRICING_FALLBACKS.base_rate, { suffix: false })}/km and{' '}
                      {formatCAD(PICKUP_PRICING_FALLBACKS.normal_rate, { suffix: false })}/km. Customers are
                      being charged those amounts right now. Ask your developer to add the missing rows.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* One group per business question */}
            {SETTING_GROUPS.map((group) => (
              <section key={group.id} className="space-y-4">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-semibold text-gray-900">{group.title}</h2>
                  <p className="mt-1 leading-relaxed text-gray-600">{group.summary}</p>
                </div>

                {group.id === 'pickup-fare' && (
                  <PickupFareExplorer
                    config={pricing}
                    distance={distance}
                    onDistanceChange={setDistance}
                    unverified={fellBackFor.length > 0}
                  />
                )}

                {group.id === 'instructor-pay' && (
                  <InstructorPayExplorer
                    rideEconomics={rideEconomics}
                    pricing={pricing}
                    distance={distance}
                  />
                )}

                {group.id === 'referrals' && (
                  <ReferralRewardFlow
                    instructorReferralPrice={peerBonus}
                    adminReferralPrice={promoBonus}
                    minRides={minRides}
                    unsetLabels={unsetReferralLabels}
                  />
                )}

                <div
                  className={`grid gap-4 ${
                    group.keys.length >= 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-2'
                  }`}
                >
                  {group.keys.map((key) => {
                    const setting = byKey.get(key);
                    if (!setting) {
                      return <MissingSettingCard key={key} settingKey={key} group={group.id} />;
                    }
                    return (
                      <SettingValueCard
                        key={key}
                        setting={setting}
                        copy={getSettingCopy(key)}
                        icon={SETTING_ICON[key]}
                        accent={GROUP_ACCENT[group.id]}
                        describeImpact={(nextValue) => describeImpact(group.id, key, nextValue)}
                        onUpdated={() => refetch()}
                      />
                    );
                  })}
                </div>
              </section>
            ))}

            {/* Anything the backend added that this screen has no wording for yet */}
            {extraRows.length > 0 && (
              <section className="space-y-4">
                <div className="max-w-3xl">
                  <h2 className="text-xl font-semibold text-gray-900">Other settings</h2>
                  <p className="mt-1 leading-relaxed text-gray-600">
                    These were added to the system after this page was written, so they are shown
                    exactly as the server describes them. Check with your developer before changing
                    one.
                  </p>
                </div>
                <div className="grid gap-4 lg:grid-cols-3">
                  {extraRows.map((setting) => (
                    <SettingValueCard
                      key={setting.key}
                      setting={setting}
                      icon={Settings2}
                      accent="slate"
                      onUpdated={() => refetch()}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Closing note */}
            <Card className="border-gray-200 bg-gray-50/60">
              <CardContent className="flex gap-3 p-5">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
                <div className="space-y-2 text-sm leading-relaxed text-gray-600">
                  <p>
                    <strong className="text-gray-900">Every number here is live.</strong> Saving a
                    change takes effect straight away for anything created afterwards — there is no
                    review step and nothing to deploy.
                  </p>
                  <p>
                    Work already in flight is protected: a booking keeps the price it was quoted, an
                    accepted job keeps the hourly rate it was accepted at, and a referral code keeps
                    the bonus it was created with.
                  </p>
                  <p>
                    The one thing to watch is the customer app. It shows its own price estimate while
                    someone books, using its own copy of the three pickup numbers. Change those
                    without a matching app update and customers will be quoted one price and charged
                    another.
                  </p>
                </div>
              </CardContent>
            </Card>

            <p className="text-xs text-gray-400">
              Showing {rows.length} configuration {rows.length === 1 ? 'value' : 'values'} from the
              server.{' '}
              {rows.length > 0 &&
                `Current values: ${rows
                  .map((row) => `${getSettingCopy(row.key)?.label ?? row.key} ${formatSettingValue(row.key, row.value)}`)
                  .join(' · ')}.`}
            </p>
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
