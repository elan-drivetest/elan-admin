// components/booking/PricingBreakdownAdmin.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Car,
  User,
  Building2,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSettingCopy, formatSettingValue, SETTING_ORDER } from '@/lib/settings-copy';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  calculateBookingPrice,
  describePickupFare,
  explainConcession,
  explainCoupon,
  formatPrice,
  CouponMinimumNotMetError,
  type BookingTestType,
  type PricingBreakdown,
} from '@/lib/utils/booking-calculations';
import {
  isPricingCriticalSetting,
  type PickupPricingConfig,
  type PickupPricingKey,
} from '@/lib/pricing-config';
import type {
  TestCenter,
  CouponVerificationResponse,
  Addon,
  SystemSetting,
} from '@/types/admin';

interface PricingBreakdownAdminProps {
  testCenter?: TestCenter;
  distance?: number;
  addons?: Addon[];
  selectedAddon?: Addon;
  testType: BookingTestType;
  appliedCoupon?: CouponVerificationResponse;
  locationOption: 'pickup' | 'test-centre';
  pricing: PickupPricingConfig;
  pricingIsLoading?: boolean;
  pricingFellBackFor?: PickupPricingKey[];
  /** Raw settings rows, so the panel can name each config the way Settings does. */
  settings?: SystemSetting[];
  pickupLabel?: string;
  onRefreshConfig?: () => void;
  isRefreshingConfig?: boolean;
  distanceUnavailable?: boolean;
  className?: string;
}

/* -------------------------------------------------------------------------- */

/** An actionable hint. Only shown when there is something the admin can do. */
function Tip({
  tone = 'info',
  children,
}: {
  tone?: 'info' | 'warn';
  children: React.ReactNode;
}) {
  const Icon = tone === 'warn' ? AlertTriangle : Lightbulb;
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-lg border p-3',
        tone === 'warn' ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50/70',
      )}
    >
      <Icon
        className={cn(
          'mt-0.5 h-4 w-4 shrink-0',
          tone === 'warn' ? 'text-amber-600' : 'text-blue-500',
        )}
      />
      <p
        className={cn(
          'text-xs leading-relaxed',
          tone === 'warn' ? 'text-amber-900' : 'text-blue-900',
        )}
      >
        {children}
      </p>
    </div>
  );
}

/** Pickup address → test centre, with the distance the fare is charged on. */
function Trip({
  distance,
  pricing,
  pickupLabel,
  centerName,
  meetAtCentre,
}: {
  distance: number;
  pricing: PickupPricingConfig;
  pickupLabel?: string;
  centerName: string;
  meetAtCentre: boolean;
}) {
  const fare = describePickupFare(distance, pricing);

  return (
    <div className="flex items-start gap-2">
      <div className="flex w-24 shrink-0 flex-col items-center gap-1.5">
        <div
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-full ring-1',
            meetAtCentre
              ? 'bg-gray-100 text-gray-300 ring-gray-200'
              : 'bg-primary/10 text-primary ring-primary/20',
          )}
        >
          <User className="h-4 w-4" />
        </div>
        <p className="line-clamp-2 text-center text-[11px] leading-tight text-gray-500">
          {meetAtCentre ? 'No pickup' : pickupLabel || 'Pickup'}
        </p>
      </div>

      <div className="flex flex-1 flex-col items-center pt-3">
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
          {!meetAtCentre && (
            <>
              <div
                className="absolute inset-y-0 left-0 bg-primary"
                style={{
                  width: `${fare.crossesBaseDistance ? (fare.baseKm / distance) * 100 : 100}%`,
                }}
              />
              {fare.crossesBaseDistance && (
                <div
                  className="absolute inset-y-0 right-0 bg-blue-400"
                  style={{ width: `${(fare.excessKm / distance) * 100}%` }}
                />
              )}
            </>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2 py-0.5 shadow-sm">
          <Car className="h-3.5 w-3.5 text-gray-600" />
          <span className="text-[11px] font-medium tabular-nums text-gray-700">
            {meetAtCentre ? 'Meets at centre' : `${distance.toFixed(1)} km`}
          </span>
        </div>
      </div>

      <div className="flex w-24 shrink-0 flex-col items-center gap-1.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 ring-1 ring-slate-200">
          <Building2 className="h-4 w-4" />
        </div>
        <p className="line-clamp-2 text-center text-[11px] leading-tight text-gray-500">
          {centerName}
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/** A charge or a deduction, with the thing that controls it. */
interface Slice {
  key: string;
  label: string;
  amount: number;
  colour: string;
  source: string;
  deduction?: boolean;
}

export default function PricingBreakdownAdmin({
  testCenter,
  distance = 0,
  addons,
  selectedAddon,
  testType,
  appliedCoupon,
  locationOption,
  pricing,
  pricingIsLoading,
  pricingFellBackFor = [],
  settings = [],
  pickupLabel,
  onRefreshConfig,
  isRefreshingConfig,
  distanceUnavailable,
  className,
}: PricingBreakdownAdminProps) {
  const settingsUnavailable = pricingFellBackFor.length > 0;

  const header = (
    <CardHeader className="pb-4">
      <CardTitle className="flex items-center justify-between gap-3 text-base text-gray-900">
        <span>Price summary</span>
        {onRefreshConfig && (
          <button
            type="button"
            onClick={onRefreshConfig}
            disabled={isRefreshingConfig}
            title="Reload your rates from Settings"
            aria-label="Reload rates from Settings"
            className={cn(
              'flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-colors',
              'hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
            )}
          >
            <RefreshCw className={cn('h-3.5 w-3.5', isRefreshingConfig && 'animate-spin')} />
            {isRefreshingConfig ? 'Reloading' : 'Reload rates'}
          </button>
        )}
      </CardTitle>
    </CardHeader>
  );

  if (!testCenter) {
    return (
      <Card className={cn('border-gray-200', className)}>
        {header}
        <CardContent>
          <div className="rounded-lg border border-dashed border-gray-200 py-12 text-center">
            <Car className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-500">Pick a test centre to see the price</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (locationOption === 'pickup' && distanceUnavailable) {
    return (
      <Card className={cn('border-amber-300', className)}>
        {header}
        <CardContent>
          <Tip tone="warn">
            <strong className="block">We couldn&apos;t work out the price</strong>
            The distance to the test centre didn&apos;t come back, and the pickup fee
            depends on it. Pick the pickup address again to retry.
          </Tip>
        </CardContent>
      </Card>
    );
  }

  const meetAtCentre = locationOption === 'test-centre';
  const km = meetAtCentre ? 0 : distance;

  let breakdown: PricingBreakdown;
  let couponProblem: string | null = null;

  const args = {
    centerBasePrice: testCenter.base_price,
    distance: km,
    pricing,
    addons,
    selectedAddon,
    testType,
  };

  try {
    breakdown = calculateBookingPrice({ ...args, coupon: appliedCoupon });
  } catch (err) {
    if (err instanceof CouponMinimumNotMetError) {
      breakdown = calculateBookingPrice(args);
      couponProblem = `This booking is ${formatPrice(
        err.orderTotal,
      )}, but the code needs an order of at least ${formatPrice(
        err.minPurchaseAmount,
      )}. It won't be applied — remove it or add something to the booking.`;
    } else {
      throw err;
    }
  }

  const fare = describePickupFare(km, pricing);
  const concession = explainConcession({
    selectedAddon,
    distance: km,
    pricing,
    addons,
    testType,
  });
  const couponKind =
    appliedCoupon && !couponProblem
      ? explainCoupon(breakdown.preCouponTotal, appliedCoupon)
      : null;

  // Split so the two tiers always add back to the authoritative pickup fare.
  const tier1 = Math.min(Math.round(fare.baseAmount), breakdown.pickupPrice);
  const tier2 = breakdown.pickupPrice - tier1;

  const charges: Slice[] = [
    {
      key: 'centre',
      label: 'Test centre fee',
      amount: breakdown.basePrice,
      colour: 'bg-slate-400',
      source: `${testCenter.name} · set per test centre`,
    },
    ...(tier1 > 0
      ? [
          {
            key: 'tier1',
            label: `First ${fare.baseKm} km of the drive`,
            amount: tier1,
            colour: 'bg-primary',
            source: `Base Rate ${formatPrice(pricing.baseRate)}/km × Included distance`,
          },
        ]
      : []),
    ...(tier2 > 0
      ? [
          {
            key: 'tier2',
            label: `Remaining ${fare.excessKm.toFixed(1)} km`,
            amount: tier2,
            colour: 'bg-blue-400',
            source: `Normal Rate ${formatPrice(pricing.normalRate)}/km`,
          },
        ]
      : []),
    ...(breakdown.addonsPrice > 0 && selectedAddon
      ? [
          {
            key: 'addon',
            label: selectedAddon.name,
            amount: breakdown.addonsPrice,
            colour: 'bg-violet-400',
            source: 'Add-on price',
          },
        ]
      : []),
  ];

  const deductions: Slice[] = [
    ...(breakdown.concession > 0
      ? [
          {
            key: 'credit',
            label: 'Long-trip discount',
            amount: breakdown.concession,
            colour: 'bg-green-500',
            source: `Drives over ${pricing.baseDistance} km with an add-on`,
            deduction: true,
          },
        ]
      : []),
    ...(breakdown.discount > 0 && appliedCoupon
      ? [
          {
            key: 'coupon',
            label: `Promo code ${appliedCoupon.code}`,
            amount: breakdown.discount,
            colour: 'bg-green-500',
            source:
              couponKind?.kind === 'percentage'
                ? `${couponKind.ratePercent}% off`
                : 'Set amount off',
            deduction: true,
          },
        ]
      : []),
  ];

  const gross = charges.reduce((sum, s) => sum + s.amount, 0);

  return (
    <Card className={cn('border-gray-200', className)}>
      {header}

      <CardContent className="space-y-4">
        {/* ---------- The number ---------- */}
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
            Customer pays
          </p>
          <p className="mt-1 text-4xl font-bold tabular-nums text-gray-900">
            {formatPrice(breakdown.total)}
          </p>
        </div>

        {/* ---------- The trip the fare is based on ---------- */}
        <div className="rounded-lg border border-gray-200 bg-gradient-to-b from-white to-gray-50/60 p-3.5">
          <Trip
            distance={km}
            pricing={pricing}
            pickupLabel={pickupLabel}
            centerName={testCenter.name}
            meetAtCentre={meetAtCentre}
          />
          {!meetAtCentre && (
            // Same sentence the Pricing & Payouts screen leads with, so the two
            // screens describe the fare identically.
            <p className="mt-3 border-t border-gray-200 pt-2.5 text-xs leading-relaxed text-gray-500">
              First {pricing.baseDistance} km at {formatPrice(pricing.baseRate)}/km, then{' '}
              {formatPrice(pricing.normalRate)}/km. The test-centre fee and add-ons are
              charged on top.
            </p>
          )}
        </div>

        {/* ---------- Where the money comes from ---------- */}
        <div className="rounded-lg border border-gray-200 p-3.5">
          <p className="mb-2.5 text-sm font-medium text-gray-700">
            What makes up the price
          </p>

          <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
            {charges.map((s) => (
              <div
                key={s.key}
                className={s.colour}
                style={{ width: `${gross > 0 ? (s.amount / gross) * 100 : 0}%` }}
                title={`${s.label}: ${formatPrice(s.amount)}`}
              />
            ))}
          </div>

          <div className="mt-3 space-y-1">
            {charges.map((s) => (
              <div
                key={s.key}
                className="-mx-2 flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-gray-50"
              >
                <span
                  className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', s.colour)}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-gray-700">{s.label}</p>
                  <p className="truncate text-[11px] text-gray-400">{s.source}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs font-medium tabular-nums text-gray-900">
                    {formatPrice(s.amount)}
                  </p>
                  <p className="text-[11px] tabular-nums text-gray-400">
                    {gross > 0 ? Math.round((s.amount / gross) * 100) : 0}%
                  </p>
                </div>
              </div>
            ))}

            {deductions.map((s) => (
              <div
                key={s.key}
                className="-mx-2 flex items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-green-50/60"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full border border-dashed border-green-500"
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-green-700">{s.label}</p>
                  <p className="truncate text-[11px] text-gray-400">{s.source}</p>
                </div>
                <p className="shrink-0 text-xs font-medium tabular-nums text-green-700">
                  − {formatPrice(s.amount)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-2.5 flex items-center justify-between border-t border-gray-200 pt-2.5">
            <span className="text-sm font-semibold text-gray-900">Total</span>
            <span className="text-lg font-bold tabular-nums text-green-600">
              {formatPrice(breakdown.total)}
            </span>
          </div>
        </div>

        {/* ---------- Only advice you can act on ---------- */}
        {couponProblem && <Tip tone="warn">{couponProblem}</Tip>}

        {!concession.applied && concession.reason === 'no-addon-selected' && (
          <Tip>
            <strong className="block">The customer could save here</strong>
            This drive is over {pricing.baseDistance} km, so adding any lesson takes{' '}
            {formatPrice(concession.potentialAmount)} off the price of it. Right now no
            lesson is selected, so they miss out.
          </Tip>
        )}

        {settingsUnavailable && !pricingIsLoading && (
          <Tip tone="warn">
            <strong className="block">Using built-in defaults</strong>
            Some of your pickup rates couldn&apos;t be read from Settings, so this price is
            an estimate and may not match what the customer is charged. Open{' '}
            <span className="font-medium">Settings that control this price</span> below to
            see which, or try Reload rates.
          </Tip>
        )}

        <RatesSummary
          pricing={pricing}
          settings={settings}
          fellBackFor={pricingFellBackFor}
          isLoading={pricingIsLoading}
        />
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The settings behind the price, named the way the Settings screen names them.
 *
 * Only the settings that move the CUSTOMER's price are listed — the pickup-fare
 * trio plus the per-centre fee. Instructor pay and referral bonuses are real
 * settings but never change this total, so listing them here would mislead.
 *
 * Labels, units and ordering all come from `lib/settings-copy.ts`, the same
 * source `/settings/pricing-and-payouts` renders from, so a name here is the
 * name the admin will find when they go to change it.
 */
function RatesSummary({
  pricing,
  settings,
  fellBackFor,
  isLoading,
}: {
  pricing: PickupPricingConfig;
  settings: SystemSetting[];
  fellBackFor: PickupPricingKey[];
  isLoading?: boolean;
}) {
  const [open, setOpen] = React.useState(false);

  /** The value the preview is actually using, when the server row can't be. */
  const fallbackDisplay: Record<PickupPricingKey, string> = {
    base_distance: `${pricing.baseDistance} km`,
    base_rate: `${formatPrice(pricing.baseRate)}/km`,
    normal_rate: `${formatPrice(pricing.normalRate)}/km`,
  };

  // Derived from SETTING_ORDER so this list stays in step with the Settings
  // screen if the backend adds or reorders pricing keys.
  const rows = SETTING_ORDER.filter(isPricingCriticalSetting).map((key) => {
    const copy = getSettingCopy(key);
    const row = settings.find((s) => s.key === key);

    // The seeder only runs on an empty table, so a key added later is simply
    // absent rather than wrong — worth telling apart from a bad value.
    const status: 'live' | 'missing' | 'invalid' = isLoading
      ? 'live'
      : !row
        ? 'missing'
        : fellBackFor.includes(key)
          ? 'invalid'
          : 'live';

    return {
      key,
      name: copy?.label ?? key,
      role: copy?.meaning ?? '',
      value:
        status === 'live' && row
          ? formatSettingValue(key, row.value)
          : fallbackDisplay[key],
      status,
    };
  });

  const problems = rows.filter((r) => r.status !== 'live');

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 transition-colors hover:border-gray-300">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className={cn(
          'flex w-full items-center gap-2 px-3.5 py-2.5 text-left transition-colors',
          'hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
          open && 'bg-gray-50/70',
        )}
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
        )}
        <span className="flex-1 text-sm font-medium text-gray-600">
          Settings that control this price
        </span>
        <span className="shrink-0 text-xs text-gray-400">{rows.length + 1}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          <div className="divide-y divide-gray-100">
            {rows.map((r) => (
              <div
                key={r.key}
                className="flex items-start gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-gray-800">{r.name}</p>
                  <p className="mt-1 text-[11px] leading-relaxed text-gray-500">{r.role}</p>
                  {r.status === 'missing' && (
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                      Not set up on the server. The system uses its built-in default until a
                      developer adds the row.
                    </p>
                  )}
                  {r.status === 'invalid' && (
                    <p className="mt-1 text-[11px] leading-relaxed text-amber-700">
                      The saved value isn&apos;t a number the system can use, so it falls
                      back to its built-in default.
                    </p>
                  )}
                  {/* Same de-emphasised placement the Settings cards use, so the
                      key is findable without dominating the row. */}
                  <p className="mt-1 text-[10px] text-gray-400">{r.key}</p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums',
                    r.status === 'live'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-amber-100 text-amber-800',
                  )}
                >
                  {r.value}
                </span>
              </div>
            ))}

            <div className="flex items-start gap-3 px-3.5 py-2.5 transition-colors hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-gray-800">Test centre fee</span>
                <p className="mt-1 text-[11px] leading-relaxed text-gray-500">
                  A fixed amount set on each test centre, not a global rate.
                </p>
              </div>
              <Link
                href="/settings/test-centers"
                className="shrink-0 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Test Centers
              </Link>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-gray-100 bg-gray-50/70 px-3.5 py-2.5">
            <p className="text-[11px] leading-relaxed text-gray-500">
              Change these under{' '}
              <Link
                href="/settings/pricing-and-payouts"
                className="font-medium text-primary hover:underline"
              >
                Settings › Pricing &amp; Payouts
              </Link>
              . A new rate applies to the very next booking you create —{' '}
              <span className="font-medium text-gray-600">
                bookings already made keep the price they were charged
              </span>
              . Use Reload rates above after editing one.
            </p>
            {problems.length > 0 && !isLoading && (
              <p className="text-[11px] leading-relaxed text-amber-700">
                {problems.length === 1
                  ? 'One of these rates is using a built-in default'
                  : `${problems.length} of these rates are using built-in defaults`}
                , so this price is an estimate. Set them up in Settings and the customer
                will be charged exactly what you see here.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
