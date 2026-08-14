// hooks/useReferralBonus.ts
'use client';

import { useMemo } from 'react';
import { usePricingConfig } from '@/hooks/usePricingConfig';
import { parseSettingValue } from '@/lib/settings-copy';

/**
 * The live `instructor_referral_price`, in cents.
 *
 * Peer referral payouts read this setting at payout time rather than the amount
 * frozen on the code (ADMIN_SETTINGS.md §4.1), so any screen showing what a peer
 * referral pays has to read it too. Goes through `usePricingConfig`, which shares
 * one cached `GET /admin/settings` across the page.
 *
 * Returns null when the row is missing or unreadable — the backend then falls
 * back to its own default, so callers should say so rather than showing a blank.
 */
export function useLivePeerReferralBonus(): number | null {
  const { settings } = usePricingConfig();

  return useMemo(() => {
    const raw = settings.find((setting) => setting.key === 'instructor_referral_price')?.value;
    return raw === undefined ? null : parseSettingValue(raw);
  }, [settings]);
}

/** Mirrors the backend's own defaults for a promo code (ADMIN_SETTINGS.md §3). */
export const REFERRAL_CODE_FALLBACKS = {
  amountCents: 10000,
  minRides: 5,
} as const;

export interface ReferralCodeDefaults {
  /** `admin_referral_price` — what a newly created promo code pays, in cents. */
  amountCents: number;
  /** `referral_min_rides` — rides required before the bonus is released. */
  minRides: number;
  /** True while the first `GET /admin/settings` is still in flight. */
  isLoading: boolean;
  /** True when either value came from the fallback rather than the server. */
  usedFallback: boolean;
}

/**
 * The values the create-promo-code form should start on.
 *
 * `admin_referral_price` and `referral_min_rides` are the *defaults the server
 * applies to a new code* — the admin can still override either per code, but the
 * form should open on what the business configured, not on a literal that drifts
 * the moment someone edits Settings.
 */
export function useReferralCodeDefaults(): ReferralCodeDefaults {
  const { settings, isLoading } = usePricingConfig();

  return useMemo(() => {
    const read = (key: string): number | null => {
      const raw = settings.find((setting) => setting.key === key)?.value;
      if (raw === undefined) return null;
      const parsed = parseSettingValue(raw);
      return parsed === null || parsed <= 0 ? null : parsed;
    };

    const amount = read('admin_referral_price');
    const rides = read('referral_min_rides');

    return {
      amountCents: amount ?? REFERRAL_CODE_FALLBACKS.amountCents,
      minRides: rides ?? REFERRAL_CODE_FALLBACKS.minRides,
      isLoading,
      usedFallback: amount === null || rides === null,
    };
  }, [settings, isLoading]);
}
