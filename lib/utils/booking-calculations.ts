// lib/utils/booking-calculations.ts
import { formatCAD } from '@/lib/utils';
import type { BookingRulesConfig, PickupPricingConfig } from '@/lib/pricing-config';
import type { Addon } from '@/types/admin';

/**
 * Client-side mirror of the server's booking pricing engine.
 *
 * Ported line-for-line from elan-backend (dev):
 *   - `BookingsService.calculatePickupPrice()`  src/bookings/bookings.service.ts:130-146
 *   - `BookingsService.create()`                :186-251
 *   - `BookingsService.createByAdmin()`         :799-869   (identical arithmetic)
 *
 * This duplication exists only because `CreateBookingDto` requires prices in the
 * request that the server then recomputes and overwrites. The server is always
 * authoritative — this is a preview. Any change here must be mirrored from the
 * backend, never invented, and every tunable must come from `PickupPricingConfig`
 * (which is read live from `GET /admin/settings`), never from a literal.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BookingTestType = 'G' | 'G2';

/** The subset of a coupon the discount step needs. */
export interface CouponLike {
  discount: number;
  discount_type?: 'percentage' | 'fixed' | null;
  is_failure_coupon?: boolean;
  min_purchase_amount?: number | null;
}

export interface PricingBreakdown {
  /** The test centre's `base_price`, verbatim. */
  basePrice: number;
  /** Distance fare. Stored by the server as `pickup_price`. */
  pickupPrice: number;
  /** FULL undiscounted price of the selected add-on. Stored as `addons_price`. */
  addonsPrice: number;
  /**
   * Long-trip credit: the 30-minute lesson price for this test type, deducted
   * when an add-on is selected and the pickup is beyond `baseDistance`.
   * The server calls this `reducedAddonPrice`; it is never persisted.
   */
  concession: number;
  /** Order total after the credit but BEFORE the coupon — the coupon's basis. */
  preCouponTotal: number;
  /** Coupon discount actually applied. Written to `coupon_usages`, not the booking. */
  discount: number;
  /** The amount that will be charged. Equals the server's `total_price`. */
  total: number;
}

export class CouponMinimumNotMetError extends Error {
  constructor(readonly minPurchaseAmount: number, readonly orderTotal: number) {
    // Same wording the backend throws, so the UI reads consistently whether the
    // check trips client-side or comes back from the API.
    super('Order total does not meet the minimum for this coupon');
    this.name = 'CouponMinimumNotMetError';
  }
}

// ---------------------------------------------------------------------------
// Step 0 — the test date must clear the minimum notice
// ---------------------------------------------------------------------------

/**
 * The earliest test date the server will accept.
 *
 * Port of STEP 0: `test_date` must be strictly greater than now plus
 * `booking_min_lead_days` days. Calendar arithmetic (`setDate`) rather than
 * adding milliseconds, so a notice period spanning a DST change still lands on
 * the same wall-clock time the admin sees in the picker.
 */
export function earliestAcceptableTestDate(
  rules: BookingRulesConfig,
  now: Date = new Date(),
): Date {
  const earliest = new Date(now.getTime());
  earliest.setDate(earliest.getDate() + rules.minLeadDays);
  return earliest;
}

/**
 * True when the server would reject this date with
 * 400 "Test date must be greater than N days".
 *
 * An unparseable or empty date is NOT reported as too soon — the required-field
 * rule already covers that, and flagging both at once reads as two problems.
 */
export function isTestDateTooSoon(
  testDate: string | Date | null | undefined,
  rules: BookingRulesConfig,
  now: Date = new Date(),
): boolean {
  if (!testDate) return false;

  const chosen = testDate instanceof Date ? testDate : new Date(testDate);
  if (Number.isNaN(chosen.getTime())) return false;

  return chosen.getTime() <= earliestAcceptableTestDate(rules, now).getTime();
}

/**
 * The earliest value a `datetime-local` picker should allow.
 *
 * The server's comparison is strictly greater, so the boundary minute itself is
 * rejected. Offering it as the input's `min` would let the admin pick the one
 * value the picker implies is legal and the form then refuses — so the minimum
 * is the next whole minute the input can represent.
 */
export function earliestSelectableTestDate(
  rules: BookingRulesConfig,
  now: Date = new Date(),
): Date {
  return new Date(earliestAcceptableTestDate(rules, now).getTime() + 60_000);
}

/**
 * A date as the `YYYY-MM-DDTHH:mm` a `datetime-local` input needs. Built from
 * the local parts — `toISOString()` would convert to UTC and shift the boundary
 * by the timezone offset.
 */
export function toDateTimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

/**
 * The notice rule as one sentence, for the field's helper text.
 *
 * Zero is a legitimate setting — it means same-day booking is allowed — and
 * "more than 0 days from now" is not a sentence, so it gets its own wording.
 */
export function describeMinimumNotice(rules: BookingRulesConfig): string {
  const { minLeadDays } = rules;

  if (minLeadDays <= 0) return 'The test date just has to be in the future.';
  if (minLeadDays === 1) return 'The test date has to be more than 1 day from now.';
  return `The test date has to be more than ${minLeadDays} days from now.`;
}

// ---------------------------------------------------------------------------
// Step 2 — pickup fare
// ---------------------------------------------------------------------------

/**
 * Distance-based pickup fare, in cents.
 *
 * Charged at `baseRate` per km for the first `baseDistance` km, then at
 * `normalRate` per km beyond it. Port of `calculatePickupPrice()`.
 */
export function calculatePickupPrice(
  distance: number,
  pricing: PickupPricingConfig,
): number {
  if (distance <= 0) {
    return 0;
  }

  const { baseDistance, baseRate, normalRate } = pricing;

  const raw =
    distance > baseDistance
      ? baseDistance * baseRate + (distance - baseDistance) * normalRate
      : distance * baseRate;

  return Math.round(raw);
}

export interface PickupFareTiers {
  /** km billed at `baseRate`. */
  baseKm: number;
  /** Exact cents contributed by the base tier (may be fractional). */
  baseAmount: number;
  /** km billed at `normalRate`; 0 when within `baseDistance`. */
  excessKm: number;
  /** Exact cents contributed by the excess tier (may be fractional). */
  excessAmount: number;
  /** The authoritative fare — `Math.round` of the exact sum, as the server does. */
  total: number;
  /** True when the excess tier is in play. */
  crossesBaseDistance: boolean;
}

/**
 * Break the pickup fare into its two rate tiers, for display.
 *
 * The server rounds the SUM once (not each tier), so `baseAmount` and
 * `excessAmount` are exact and may carry fractional cents; `total` is the
 * authoritative rounded figure from `calculatePickupPrice`.
 */
export function describePickupFare(
  distance: number,
  pricing: PickupPricingConfig,
): PickupFareTiers {
  const { baseDistance, baseRate, normalRate } = pricing;
  const d = Math.max(0, distance);
  const crossesBaseDistance = d > baseDistance;

  const baseKm = crossesBaseDistance ? baseDistance : d;
  const excessKm = crossesBaseDistance ? d - baseDistance : 0;

  return {
    baseKm,
    baseAmount: baseKm * baseRate,
    excessKm,
    excessAmount: excessKm * normalRate,
    total: calculatePickupPrice(distance, pricing),
    crossesBaseDistance,
  };
}

// ---------------------------------------------------------------------------
// Step 4 — the long-trip add-on concession
// ---------------------------------------------------------------------------

/**
 * The "30 minutes lesson" add-on matching a test type.
 *
 * The server matches on BOTH `type` and the exact seeded `name`, so this does
 * too — a renamed seed row silently disables the concession server-side, and the
 * preview must reproduce that rather than guess.
 */
export function findThirtyMinuteLesson(
  addons: Addon[] | null | undefined,
  testType: BookingTestType,
): Addon | undefined {
  const addonType = testType === 'G' ? 'LESSON_G' : 'LESSON_G2';
  const addonName =
    addonType === 'LESSON_G' ? '30 Minutes Lesson Of G' : '30 Minutes Lesson Of G2';

  return addons?.find((addon) => addon.type === addonType && addon.name === addonName);
}

/**
 * The credit applied when a customer buys any add-on on a long pickup.
 *
 * Fires only when all three hold (`bookings.service.ts:227`):
 *   - an add-on is selected,
 *   - `distance > baseDistance` (strictly greater),
 *   - the 30-minute lesson for this test type exists in the catalogue.
 *
 * Note it is a fixed dollar amount, not "the lesson is free" — picking the
 * 30-minute lesson itself on a long trip makes that add-on free.
 */
export function calculateConcession(args: {
  selectedAddon?: Addon | null;
  distance: number;
  pricing: PickupPricingConfig;
  addons?: Addon[] | null;
  testType: BookingTestType;
}): number {
  const { selectedAddon, distance, pricing, addons, testType } = args;

  if (!selectedAddon) return 0;
  if (!(distance > pricing.baseDistance)) return 0;

  const thirtyMinuteLesson = findThirtyMinuteLesson(addons, testType);
  return thirtyMinuteLesson ? thirtyMinuteLesson.price : 0;
}

/** Why the long-trip credit did or did not apply, for the price breakdown UI. */
export type ConcessionExplanation =
  | { applied: true; amount: number; lessonName: string }
  | {
      applied: false;
      /** What the credit WOULD be if the blocking condition were resolved. */
      potentialAmount: number;
      lessonName?: string;
      reason: 'no-addon-selected' | 'within-base-distance' | 'no-30min-lesson-in-catalogue';
    };

/**
 * Explains the concession decision rather than just returning a number, so the
 * breakdown can tell an admin *why* a long trip earned no credit.
 */
export function explainConcession(args: {
  selectedAddon?: Addon | null;
  distance: number;
  pricing: PickupPricingConfig;
  addons?: Addon[] | null;
  testType: BookingTestType;
}): ConcessionExplanation {
  const { selectedAddon, distance, pricing, addons, testType } = args;
  const lesson = findThirtyMinuteLesson(addons, testType);

  if (!lesson) {
    return {
      applied: false,
      potentialAmount: 0,
      reason: 'no-30min-lesson-in-catalogue',
    };
  }
  if (!(distance > pricing.baseDistance)) {
    return {
      applied: false,
      potentialAmount: lesson.price,
      lessonName: lesson.name,
      reason: 'within-base-distance',
    };
  }
  if (!selectedAddon) {
    return {
      applied: false,
      potentialAmount: lesson.price,
      lessonName: lesson.name,
      reason: 'no-addon-selected',
    };
  }

  return { applied: true, amount: lesson.price, lessonName: lesson.name };
}

// ---------------------------------------------------------------------------
// Step 5 — coupon
// ---------------------------------------------------------------------------

/**
 * Coupon discount in cents, given the running order total.
 *
 * `discount` means PERCENT for percentage coupons and for every failed-test
 * coupon; it means CENTS for fixed coupons. Port of `bookings.service.ts:245-250`.
 */
export function calculateCouponDiscount(price: number, coupon: CouponLike): number {
  const isPercentage =
    coupon.discount_type === 'percentage' || coupon.is_failure_coupon === true;

  return isPercentage
    ? Math.round((price * Math.min(coupon.discount, 100)) / 100)
    : Math.min(coupon.discount, price);
}

/** True when the coupon's minimum-purchase gate would reject this order total. */
export function isBelowCouponMinimum(price: number, coupon: CouponLike): boolean {
  return price < (coupon.min_purchase_amount ?? 0);
}

export interface CouponExplanation {
  /** How the engine will treat it — failure coupons are percentage regardless. */
  kind: 'percentage' | 'fixed';
  /** The order total the discount was computed against (after the credit). */
  basis: number;
  /** Resulting discount in cents. */
  amount: number;
  /** Percent applied, for percentage coupons (already clamped to 100). */
  ratePercent?: number;
  /** True when a fixed coupon was capped because it exceeded the order total. */
  capped: boolean;
  /** True when `is_failure_coupon` forced percentage treatment. */
  forcedPercentageByFailureFlag: boolean;
}

/** Describes the coupon step so the breakdown can show the actual arithmetic. */
export function explainCoupon(price: number, coupon: CouponLike): CouponExplanation {
  const forcedPercentageByFailureFlag =
    coupon.is_failure_coupon === true && coupon.discount_type !== 'percentage';
  const isPercentage =
    coupon.discount_type === 'percentage' || coupon.is_failure_coupon === true;
  const amount = calculateCouponDiscount(price, coupon);

  return {
    kind: isPercentage ? 'percentage' : 'fixed',
    basis: price,
    amount,
    ratePercent: isPercentage ? Math.min(coupon.discount, 100) : undefined,
    capped: !isPercentage && coupon.discount > price,
    forcedPercentageByFailureFlag,
  };
}

// ---------------------------------------------------------------------------
// The full pipeline
// ---------------------------------------------------------------------------

/**
 * Reproduces the server's price for a booking, in the server's order.
 *
 * Throws `CouponMinimumNotMetError` exactly where the server throws 400, so the
 * form can block submission instead of letting the API reject it.
 */
export function calculateBookingPrice(args: {
  centerBasePrice: number;
  distance: number;
  pricing: PickupPricingConfig;
  addons?: Addon[] | null;
  selectedAddon?: Addon | null;
  testType: BookingTestType;
  coupon?: CouponLike | null;
}): PricingBreakdown {
  const {
    centerBasePrice,
    distance,
    pricing,
    addons,
    selectedAddon,
    testType,
    coupon,
  } = args;

  // STEP 2 — pickup fare
  const pickupPrice = calculatePickupPrice(distance, pricing);
  let price = pickupPrice;

  // STEP 3 — base fare
  price += centerBasePrice;

  // STEP 4 — add-on, with the long-distance concession
  const addonsPrice = selectedAddon?.price ?? 0;
  const concession = calculateConcession({
    selectedAddon,
    distance,
    pricing,
    addons,
    testType,
  });

  if (selectedAddon) {
    price += addonsPrice - concession;
  }

  // STEP 5 — coupon
  const preCouponTotal = price;
  let discount = 0;
  if (coupon) {
    if (isBelowCouponMinimum(price, coupon)) {
      throw new CouponMinimumNotMetError(coupon.min_purchase_amount ?? 0, price);
    }
    discount = calculateCouponDiscount(price, coupon);
    price = Math.max(0, price - discount);
  }

  return {
    basePrice: centerBasePrice,
    pickupPrice,
    addonsPrice,
    concession,
    preCouponTotal,
    discount,
    total: price,
  };
}

/**
 * The adjustment between the stored component prices and `total_price`.
 *
 * `base_price + pickup_price + addons_price` does NOT equal `total_price` when a
 * concession or coupon applied, and the booking row exposes neither (its
 * `discount_amount` is always null). This is the derivation the backend guide
 * prescribes for reconciling a breakdown after the fact.
 */
export function deriveBookingAdjustment(booking: {
  base_price: number;
  pickup_price: number;
  addons_price: number;
  total_price: number;
}): { subtotal: number; adjustment: number } {
  const subtotal = booking.base_price + booking.pickup_price + booking.addons_price;
  return { subtotal, adjustment: Math.max(0, subtotal - booking.total_price) };
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/** Cents → "$12.34". Delegates to the single formatter in `lib/utils`. */
export function formatPrice(priceInCents: number): string {
  return formatCAD(priceInCents, { suffix: false });
}

export const bookingUtils = {
  earliestAcceptableTestDate,
  isTestDateTooSoon,
  describeMinimumNotice,
  calculatePickupPrice,
  describePickupFare,
  calculateConcession,
  explainConcession,
  calculateCouponDiscount,
  explainCoupon,
  calculateBookingPrice,
  findThirtyMinuteLesson,
  deriveBookingAdjustment,
  formatPrice,
};
