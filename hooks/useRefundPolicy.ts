// hooks/useRefundPolicy.ts
'use client';

import { useMemo } from 'react';
import { usePricingConfig } from '@/hooks/usePricingConfig';
import {
  REFUND_POLICY_FALLBACKS,
  resolveRefundPolicy,
  type RefundPolicyKey,
  type RefundPolicyConfig,
} from '@/lib/pricing-config';

export interface UseRefundPolicyReturn {
  policy: RefundPolicyConfig;
  /** Keys that could not be read from the server and fell back. */
  fellBackFor: RefundPolicyKey[];
  isLoading: boolean;
}

/**
 * The live refund ladder — `refund_full_hours`, `refund_partial_hours`,
 * `refund_partial_percentage`.
 *
 * Admin-editable since 2026-08-13, so the refund screens must read it rather
 * than assume 48 / 24 / 50. Goes through `usePricingConfig`, which shares one
 * cached `GET /admin/settings` across the page.
 */
export function useRefundPolicy(): UseRefundPolicyReturn {
  const { settings, isLoading } = usePricingConfig();

  return useMemo(() => {
    // Before the first read lands there is nothing to resolve; report the
    // server's own fallbacks rather than logging a warning per render.
    if (isLoading && settings.length === 0) {
      return {
        policy: {
          fullHours: REFUND_POLICY_FALLBACKS.refund_full_hours,
          partialHours: REFUND_POLICY_FALLBACKS.refund_partial_hours,
          partialPercentage: REFUND_POLICY_FALLBACKS.refund_partial_percentage,
        },
        fellBackFor: [],
        isLoading,
      };
    }

    const { config, fellBackFor } = resolveRefundPolicy(settings);
    return { policy: config, fellBackFor, isLoading };
  }, [settings, isLoading]);
}
