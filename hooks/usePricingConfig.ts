// hooks/usePricingConfig.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import {
  BOOKING_RULE_FALLBACKS,
  PICKUP_PRICING_FALLBACKS,
  resolveBookingRules,
  resolvePickupPricing,
  type BookingRuleKey,
  type BookingRulesConfig,
  type PickupPricingConfig,
  type PickupPricingKey,
} from '@/lib/pricing-config';
import type { ApiError, SystemSetting } from '@/types/admin';

/**
 * Shared, cached read of the server's pickup pricing configuration.
 *
 * Several components on the create-booking screen need the same three settings.
 * They are fetched once per page load and shared through this module-level cache
 * so the price preview does not fire `GET /admin/settings` several times over.
 *
 * Call `invalidatePricingConfig()` after an admin edits a setting so the next
 * consumer re-reads instead of serving a stale price.
 */
let settingsCache: Promise<SystemSetting[]> | null = null;

function loadSettings(force = false): Promise<SystemSetting[]> {
  if (!settingsCache || force) {
    settingsCache = adminService.getSystemSettings().catch((err) => {
      // Never cache a rejection — the next consumer should get a fresh attempt.
      settingsCache = null;
      throw err;
    });
  }
  return settingsCache;
}

export function invalidatePricingConfig(): void {
  settingsCache = null;
}

const FALLBACK_CONFIG: PickupPricingConfig = {
  baseDistance: PICKUP_PRICING_FALLBACKS.base_distance,
  baseRate: PICKUP_PRICING_FALLBACKS.base_rate,
  normalRate: PICKUP_PRICING_FALLBACKS.normal_rate,
};

const FALLBACK_BOOKING_RULES: BookingRulesConfig = {
  minLeadDays: BOOKING_RULE_FALLBACKS.booking_min_lead_days,
};

export interface UsePricingConfigReturn {
  config: PickupPricingConfig;
  /** The raw `/admin/settings` rows, so the UI can show each setting's real name. */
  settings: SystemSetting[];
  /** Settings keys that could not be read from the server and fell back. */
  fellBackFor: PickupPricingKey[];
  /**
   * Booking-creation rules from the same fetch — currently the minimum notice
   * the create-booking form's date picker enforces.
   */
  bookingRules: BookingRulesConfig;
  bookingRulesFellBackFor: BookingRuleKey[];
  /** True while the first read is in flight — the preview should not be trusted yet. */
  isLoading: boolean;
  /** True while a manual refresh is in flight (initial load excluded). */
  isRefreshing: boolean;
  error: ApiError | null;
  refetch: () => Promise<void>;
}

export function usePricingConfig(): UsePricingConfigReturn {
  const [config, setConfig] = useState<PickupPricingConfig>(FALLBACK_CONFIG);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [fellBackFor, setFellBackFor] = useState<PickupPricingKey[]>([]);
  const [bookingRules, setBookingRules] = useState<BookingRulesConfig>(FALLBACK_BOOKING_RULES);
  const [bookingRulesFellBackFor, setBookingRulesFellBackFor] = useState<BookingRuleKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const load = useCallback(async (force = false) => {
    try {
      if (force) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      const rows = await loadSettings(force);
      const { config: resolved, fellBackFor: fallbacks } = resolvePickupPricing(rows);
      const rules = resolveBookingRules(rows);
      setSettings(rows);
      setConfig(resolved);
      setFellBackFor(fallbacks);
      setBookingRules(rules.config);
      setBookingRulesFellBackFor(rules.fellBackFor);
    } catch (err: unknown) {
      console.error('Pricing config fetch error:', err);
      setError({
        message: getApiErrorMessages(err)[0],
        code: 'FETCH_PRICING_CONFIG_ERROR',
      });
      // The server falls back to these same literals, so the preview stays as
      // close to the charged amount as it can be — but flag every key as
      // unverified so the UI can say the estimate is not server-confirmed.
      setConfig(FALLBACK_CONFIG);
      setFellBackFor(['base_distance', 'base_rate', 'normal_rate']);
      // Same treatment for the notice rule: the server falls back to 2 days, so
      // the picker stays usable, but the key is flagged as unverified.
      setBookingRules(FALLBACK_BOOKING_RULES);
      setBookingRulesFellBackFor(['booking_min_lead_days']);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refetch = useCallback(async () => {
    // force bypasses the module cache so an edit made on the settings screen
    // (in another tab or earlier in this session) is picked up.
    await load(true);
  }, [load]);

  return {
    config,
    settings,
    fellBackFor,
    bookingRules,
    bookingRulesFellBackFor,
    isLoading,
    isRefreshing,
    error,
    refetch,
  };
}
