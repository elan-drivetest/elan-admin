// lib/utils/refund-calculations.ts
import type { RefundRequest } from '@/types/refund';
import type { RefundPolicyConfig } from '@/lib/pricing-config';

/**
 * Client-side mirror of the server's refund arithmetic.
 *
 * Ported from elan-backend (dev) `src/refund-requests/refund-requests.service.ts`:
 *   - customer request        :95-97   `Math.floor(booking.total_price * pct / 100)`
 *   - admin override recompute :259-261 same formula, from `booking.total_price`
 *   - `calculateRefundPercentage()` :149-161
 *
 * Two things this file exists to prevent:
 *   1. FLOOR, not round. `.toFixed(2)` on a divided value rounds and can show a
 *      half-cent more than Stripe will actually refund.
 *   2. `refund_requests.amount` is ALREADY `floor(total * pct/100)`. Multiplying
 *      it by the percentage a second time halves a 50% refund.
 */

/** Port of `calculateRefundAmount` — the exact expression the server persists. */
export function calculateRefundAmount(
  bookingTotalPrice: number,
  percentage: number,
): number {
  return Math.floor((bookingTotalPrice * percentage) / 100);
}

/**
 * Port of `calculateRefundPercentage()`. Hours are measured against `test_date`.
 *
 * The ladder used to be hardcoded 48 / 24 / 50 here. Those three numbers became
 * admin-editable settings on 2026-08-13, so the policy is now passed in — read it
 * with `useRefundPolicy()` (or `resolveRefundPolicy()` outside React) rather than
 * assuming the old values.
 *
 * `now` matters: the server decides the percentage when the request is CREATED,
 * so reproducing a stored decision means passing that request's date, not today.
 */
export function calculateRefundPercentage(
  testDate: string | Date,
  policy: RefundPolicyConfig,
  now: Date = new Date(),
): number {
  const test = testDate instanceof Date ? testDate : new Date(testDate);
  if (Number.isNaN(test.getTime())) return 0;

  const hoursDiff = (test.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursDiff >= policy.fullHours) return 100;
  if (hoursDiff >= policy.partialHours) return policy.partialPercentage;
  return 0;
}

/** Hours between a request and the test it cancels. Negative once the test has passed. */
export function hoursBeforeTest(testDate: string | Date, at: string | Date): number | null {
  const test = testDate instanceof Date ? testDate : new Date(testDate);
  const moment = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(test.getTime()) || Number.isNaN(moment.getTime())) return null;

  return (test.getTime() - moment.getTime()) / (1000 * 60 * 60);
}

/** The live ladder as one sentence, for the refund screens. */
export function describeRefundLadder(policy: RefundPolicyConfig): string {
  return `Full refund ${policy.fullHours} h or more before the test, ${policy.partialPercentage}% from ${policy.partialHours} h, nothing inside ${policy.partialHours} h.`;
}

export interface DerivedBookingTotal {
  /** The booking's `total_price` in cents. */
  total: number;
  /**
   * False when the value was reconstructed through a floor and could be one
   * cent low. Callers must label a derived preview as an estimate.
   */
  exact: boolean;
}

/**
 * Recover the booking total a refund was computed from.
 *
 * `GET /admin/refund-requests` does not include the booking's `total_price`
 * (the query selects only `booking_test_date`), and there is no
 * `GET /admin/bookings/:id` to fetch it from — so an override preview has to
 * work backwards from `amount = floor(total * pct / 100)`.
 *
 * At 100% the amount IS the total, so the result is exact. At any other
 * percentage the floor discarded up to a cent, making the reconstruction
 * accurate to ±1 cent. The server always recomputes from the real booking
 * before charging, so this only ever affects what the admin is shown.
 *
 * The clean fix is for the backend to add `booking_total_price` to the refund
 * payload; `RefundRequest.booking_total_price` is already wired up to use it the
 * moment it appears.
 */
export function deriveBookingTotal(refund: {
  amount: number;
  refund_percentage: number;
  booking_total_price?: number;
}): DerivedBookingTotal {
  if (typeof refund.booking_total_price === 'number') {
    return { total: refund.booking_total_price, exact: true };
  }

  const pct = refund.refund_percentage;
  if (!pct || pct <= 0) {
    return { total: 0, exact: false };
  }
  if (pct === 100) {
    return { total: refund.amount, exact: true };
  }

  return { total: Math.round((refund.amount * 100) / pct), exact: false };
}

export interface RefundPreview {
  /** Cents that will actually be refunded at `percentage`. */
  amount: number;
  /** The booking total the amount was computed from. */
  bookingTotal: number;
  /** False when `bookingTotal` was reconstructed and may be a cent out. */
  exact: boolean;
}

/**
 * What the server will refund if the admin approves at `percentage`.
 *
 * When the percentage is unchanged from the stored request, the stored `amount`
 * is authoritative and returned verbatim — no reconstruction, no error.
 */
export function previewRefund(
  refund: Pick<RefundRequest, 'amount' | 'refund_percentage'> & {
    booking_total_price?: number;
  },
  percentage: number,
): RefundPreview {
  const derived = deriveBookingTotal(refund);

  if (percentage === refund.refund_percentage) {
    return { amount: refund.amount, bookingTotal: derived.total, exact: true };
  }

  return {
    amount: calculateRefundAmount(derived.total, percentage),
    bookingTotal: derived.total,
    exact: derived.exact,
  };
}
