// lib/pricing-config.ts
import type { SystemSetting } from '@/types/admin';

/**
 * Server-backed pickup pricing configuration.
 *
 * These three values live in the backend `settings` table and became live,
 * admin-editable pricing inputs on 2026-08-12. They must never be hardcoded in
 * a price the user sees — read them through `usePricingConfig()`.
 *
 * This module is a faithful port of `BookingsService.getPickupPricingSettings()`
 * (elan-backend `src/bookings/bookings.service.ts:80-122`). Keep the two in step:
 * the parsing and fallback rules below are deliberately identical, so a value the
 * server rejects is also rejected here and both land on the same number.
 */

export interface PickupPricingConfig {
  /** km charged at the higher rate (`base_distance`) */
  baseDistance: number;
  /** cents per km inside `baseDistance` (`base_rate`) */
  baseRate: number;
  /** cents per km beyond `baseDistance` (`normal_rate`) */
  normalRate: number;
}

/** Mirrors `BookingsService.PICKUP_PRICING_FALLBACKS`. */
export const PICKUP_PRICING_FALLBACKS = {
  base_distance: 50,
  base_rate: 100,
  normal_rate: 50,
} as const;

export type PickupPricingKey = keyof typeof PICKUP_PRICING_FALLBACKS;

export const PICKUP_PRICING_KEYS: PickupPricingKey[] = [
  'base_distance',
  'base_rate',
  'normal_rate',
];

export interface PickupPricingResolution {
  config: PickupPricingConfig;
  /** Keys that could not be read and fell back. Empty means fully server-driven. */
  fellBackFor: PickupPricingKey[];
}

/**
 * Resolve one key exactly the way the server does: `Number(value)`, then reject
 * anything non-finite or negative in favour of the fallback. `Number()` (not
 * `parseInt`) is deliberate — "50.5" is honoured as 50.5, and "$1.00" falls back
 * rather than poisoning the price with NaN.
 */
function readSetting(
  settings: SystemSetting[] | null | undefined,
  key: PickupPricingKey,
): { value: number; fellBack: boolean } {
  const fallback = PICKUP_PRICING_FALLBACKS[key];
  const setting = settings?.find((s) => s.key === key);

  if (!setting) {
    console.warn(`Setting '${key}' could not be read — using fallback ${fallback}`);
    return { value: fallback, fellBack: true };
  }

  const parsed = Number(setting.value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(
      `Setting '${key}' is not a valid non-negative number (got '${setting.value}') — using fallback ${fallback}`,
    );
    return { value: fallback, fellBack: true };
  }

  return { value: parsed, fellBack: false };
}

/** Port of `getPickupPricingSettings()` over an already-fetched settings list. */
export function resolvePickupPricing(
  settings: SystemSetting[] | null | undefined,
): PickupPricingResolution {
  const baseDistance = readSetting(settings, 'base_distance');
  const baseRate = readSetting(settings, 'base_rate');
  const normalRate = readSetting(settings, 'normal_rate');

  const fellBackFor = PICKUP_PRICING_KEYS.filter(
    (key) =>
      ({ base_distance: baseDistance, base_rate: baseRate, normal_rate: normalRate })[key]
        .fellBack,
  );

  return {
    config: {
      baseDistance: baseDistance.value,
      baseRate: baseRate.value,
      normalRate: normalRate.value,
    },
    fellBackFor,
  };
}

/**
 * The keys whose values the booking price preview duplicates. The settings
 * screen warns against editing these without a coordinated client release.
 */
export function isPricingCriticalSetting(key: string): key is PickupPricingKey {
  return (PICKUP_PRICING_KEYS as string[]).includes(key);
}

// ---------------------------------------------------------------------------
// The refund ladder
// ---------------------------------------------------------------------------

/**
 * Mirrors the refund slice of `BUSINESS_RULE_FALLBACKS` in the backend's
 * `SettingsService` — the literals these settings replaced, which double as the
 * fallback when a row is missing, blank or non-numeric.
 */
export const REFUND_POLICY_FALLBACKS = {
  refund_full_hours: 48,
  refund_partial_hours: 24,
  refund_partial_percentage: 50,
} as const;

export type RefundPolicyKey = keyof typeof REFUND_POLICY_FALLBACKS;

export const REFUND_POLICY_KEYS: RefundPolicyKey[] = [
  'refund_full_hours',
  'refund_partial_hours',
  'refund_partial_percentage',
];

export interface RefundPolicyConfig {
  /** Hours before the test at or above which the refund is 100%. */
  fullHours: number;
  /** Hours before the test at or above which the partial rate applies. */
  partialHours: number;
  /** The partial rate, as a percentage. */
  partialPercentage: number;
}

export interface RefundPolicyResolution {
  config: RefundPolicyConfig;
  /** Keys that could not be read and fell back. Empty means fully server-driven. */
  fellBackFor: RefundPolicyKey[];
}

/**
 * Read one key the way `SettingsService.readNumericSetting()` does: `Number()`,
 * then reject anything non-finite or negative in favour of the fallback. Same
 * rule as `readSetting` above, without the pickup-only key type.
 */
function readServerNumber(
  settings: SystemSetting[] | null | undefined,
  key: string,
  fallback: number,
): { value: number; fellBack: boolean } {
  const setting = settings?.find((s) => s.key === key);
  const parsed = Number(setting?.value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    console.warn(
      `Setting '${key}' is not a valid non-negative number (got '${setting?.value}') - using fallback ${fallback}`,
    );
    return { value: fallback, fellBack: true };
  }

  return { value: parsed, fellBack: false };
}

/**
 * Port of `RefundRequestsService.calculateRefundPercentage()`'s configuration
 * read. These three were hardcoded 48 / 24 / 50 until 2026-08-13 and are now
 * admin-editable, so nothing client-side may assume the old numbers.
 */
export function resolveRefundPolicy(
  settings: SystemSetting[] | null | undefined,
): RefundPolicyResolution {
  const full = readServerNumber(settings, 'refund_full_hours', REFUND_POLICY_FALLBACKS.refund_full_hours);
  const partial = readServerNumber(
    settings,
    'refund_partial_hours',
    REFUND_POLICY_FALLBACKS.refund_partial_hours,
  );
  const percentage = readServerNumber(
    settings,
    'refund_partial_percentage',
    REFUND_POLICY_FALLBACKS.refund_partial_percentage,
  );

  const fellBackFor = REFUND_POLICY_KEYS.filter(
    (key) =>
      ({
        refund_full_hours: full,
        refund_partial_hours: partial,
        refund_partial_percentage: percentage,
      })[key].fellBack,
  );

  return {
    config: {
      fullHours: full.value,
      partialHours: partial.value,
      partialPercentage: percentage.value,
    },
    fellBackFor,
  };
}
// ---------------------------------------------------------------------------
// Instructor economics (a DIFFERENT contract from the pickup trio)
// ---------------------------------------------------------------------------

/**
 * `average_distance_per_hour` and `instructor_rate`, as read by
 * `RidesService.findAvailableByInstructor()` (elan-backend
 * `src/rides/rides.service.ts:84-108`).
 *
 * Two deliberate differences from the pickup pricing above — do not "unify" them:
 *   1. Parsed with `parseInt`, NOT `Number`. "50.5" becomes 50, not 50.5.
 *   2. There is NO fallback. Either value non-finite or <= 0 makes the whole
 *      `GET /rides/available` endpoint throw 500 "Ride pricing is temporarily
 *      unavailable". So we report unavailability rather than substituting a
 *      number the server would never have used.
 */
export interface RideEconomicsConfig {
  averageDistancePerHour: number;
  instructorRate: number;
}

export type RideEconomicsResolution =
  | { available: true; config: RideEconomicsConfig }
  | { available: false; invalidKeys: string[] };

/**
 * The rate the `ride_sessions.hourly_rate` column defaults to.
 *
 * Admin-assigned rides are created without an explicit rate and therefore land
 * on this default, while an instructor who self-accepts gets `instructor_rate`
 * snapshotted instead (`getInstructorRateFromSettings()`, which also falls back
 * to this value). With the seeded settings that means admin-assigned rides pay
 * double for identical work — a known backend inconsistency, surfaced rather
 * than hidden.
 */
export const RIDE_SESSION_DEFAULT_HOURLY_RATE = 8000;

export function resolveRideEconomics(
  settings: SystemSetting[] | null | undefined,
): RideEconomicsResolution {
  const read = (key: string): number => {
    const raw = settings?.find((s) => s.key === key)?.value;
    // parseInt, matching the server exactly.
    return parseInt(raw as string, 10);
  };

  const averageDistancePerHour = read('average_distance_per_hour');
  const instructorRate = read('instructor_rate');

  const invalidKeys: string[] = [];
  if (!Number.isFinite(averageDistancePerHour) || averageDistancePerHour <= 0) {
    invalidKeys.push('average_distance_per_hour');
  }
  if (!Number.isFinite(instructorRate) || instructorRate <= 0) {
    invalidKeys.push('instructor_rate');
  }

  if (invalidKeys.length > 0) {
    return { available: false, invalidKeys };
  }

  return { available: true, config: { averageDistancePerHour, instructorRate } };
}
