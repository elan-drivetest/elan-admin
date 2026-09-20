// lib/utils/coupon-audit.ts
import type { AdminCoupon } from '@/types/admin';

/**
 * Finding coupons that a pre-2026-09-19 edit silently flattened.
 *
 * `PUT /v1/admin/coupons/:id` accepts a partial body, but the handler used to
 * run that body through the mapper used for INSERTS, which fills defaults for
 * anything absent. So a request changing one field also wrote
 * `discount_type: 'fixed'`, `is_recurrent: false`, `is_failure_coupon: false`,
 * `min_purchase_amount: 0` and `expires_at: null`.
 *
 * Concretely: renaming a 25% off coupon turned it into a 25 CENTS off coupon,
 * single-use, with no minimum and no expiry — and the response reflected the
 * corrupted row back as though it were intended, so nothing in the UI showed it.
 *
 * The backend no longer does this. But rows edited before the fix may already be
 * wrong, and the only way to find them is the shape they were flattened into.
 * This is the backend guide's audit query, run against the page in hand so an
 * admin can do it without database access.
 *
 * It is a HEURISTIC, not proof: a coupon deliberately created as a small fixed
 * discount with no minimum and no expiry looks identical. Treat a hit as "open
 * this and check", never as "this is broken".
 */

/** Below this, a `fixed` discount is more plausibly a stranded percentage. */
const SUSPICIOUS_FIXED_DISCOUNT_CENTS = 100;

export function looksFlattenedByPartialUpdate(coupon: AdminCoupon): boolean {
  const edited =
    !!coupon.updated_at &&
    !!coupon.created_at &&
    new Date(coupon.updated_at).getTime() > new Date(coupon.created_at).getTime();

  if (!edited) return false;

  const wearsEveryDefault =
    (coupon.discount_type ?? 'fixed') === 'fixed' &&
    coupon.min_purchase_amount === 0 &&
    !coupon.expires_at &&
    coupon.is_recurrent === false &&
    coupon.is_failure_coupon === false;

  // The tell: a "fixed" discount under $1.00 was almost certainly a percentage.
  return wearsEveryDefault && coupon.discount < SUSPICIOUS_FIXED_DISCOUNT_CENTS;
}

/** One line explaining the suspicion, for a tooltip or an alert. */
export function describeFlattenedSuspicion(coupon: AdminCoupon): string {
  return `This reads as ${(coupon.discount / 100).toFixed(2)} dollars off, but "${coupon.discount}" with every other field at its default is the signature of a coupon that was ${coupon.discount}% off before an edit reset it. Check it against what it was meant to be.`;
}
