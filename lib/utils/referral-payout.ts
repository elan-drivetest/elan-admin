// lib/utils/referral-payout.ts
import type { AdminReferralCode } from '@/types/admin';

/**
 * What a referral code will actually pay — which is not always what is stored on it.
 *
 * Port of `ReferralCodesService.processReferralPayment` (ADMIN_SETTINGS.md §4.1):
 *
 *   const amount = claim.referral_type === ReferralCodeType.ADMIN
 *     ? referralCode.amount                                     // frozen on the code
 *     : await this.getBonusAmount(ReferralCodeType.INSTRUCTOR); // LIVE setting
 *
 * A peer (instructor) code stores an `amount` at creation and the payout ignores
 * it, reading `instructor_referral_price` at the moment the bonus is released —
 * and paying it to BOTH sides. Showing `referral_codes.amount` for a peer code
 * therefore reports a number nobody receives.
 */

/** Mirrors `DEFAULT_BONUS_CENTS` in `ReferralCodesService` — used when the row is absent. */
export const REFERRAL_BONUS_FALLBACK_CENTS = 10000;

export interface ReferralPayout {
  /** Cents each recipient gets. */
  perSide: number;
  /** Peer referrals pay the referrer and the referee; admin codes pay one person. */
  sides: 1 | 2;
  /** What the code costs the business in total. */
  total: number;
  /** True when the figure came from the live setting rather than the code row. */
  isLive: boolean;
}

export function resolveReferralPayout(
  code: Pick<AdminReferralCode, 'amount' | 'referral_type'>,
  /** The live `instructor_referral_price`, or null when it could not be read. */
  livePeerBonus: number | null,
): ReferralPayout {
  if (code.referral_type === 'admin') {
    return { perSide: code.amount, sides: 1, total: code.amount, isLive: false };
  }

  const perSide = livePeerBonus ?? REFERRAL_BONUS_FALLBACK_CENTS;
  return { perSide, sides: 2, total: perSide * 2, isLive: true };
}
