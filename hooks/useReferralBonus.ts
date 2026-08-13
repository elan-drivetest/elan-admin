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
