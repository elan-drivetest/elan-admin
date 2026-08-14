// hooks/useBookingCalculation.ts
'use client';

import { useState, useCallback } from 'react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import type { DistanceCalculationRequest, TestCenter } from '@/types/admin';

interface UseDistanceCalculationReturn {
  distance: number | null;
  loading: boolean;
  error: string | null;
  calculateDistance: (
    pickup: { lat: number; lng: number },
    testCenter: TestCenter,
  ) => Promise<number | null>;
  clearDistance: () => void;
}

/**
 * Pickup → test-centre distance, from the server.
 *
 * `POST /admin/bookings/calculate-distance` returns the Google Distance Matrix
 * DRIVING distance, which is what the server prices the booking on.
 *
 * There is deliberately NO local fallback. A straight-line (Haversine) distance
 * is always shorter than the driving route — on a downtown-Toronto pickup it
 * came out at 12.3 km against the API's 23.7 km — so substituting it silently
 * understated the pickup fare by about half and the admin had no way to tell.
 * If this call fails we surface the error and withhold the price instead of
 * showing a confident wrong number.
 */
export function useDistanceCalculation(): UseDistanceCalculationReturn {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = useCallback(
    async (
      pickup: { lat: number; lng: number },
      testCenter: TestCenter,
    ): Promise<number | null> => {
      try {
        setLoading(true);
        setError(null);

        const request: DistanceCalculationRequest = {
          pickupLat: pickup.lat,
          pickupLng: pickup.lng,
          testCenterLat: parseFloat(String(testCenter.lat)),
          testCenterLng: parseFloat(String(testCenter.lng)),
        };

        const response = await adminService.calculateDistance(request);
        setDistance(response.distance);
        return response.distance;
      } catch (err: unknown) {
        console.error('Distance calculation error:', err);
        setError(
          `${getApiErrorMessages(err)[0]} Pricing needs the driving distance from the server, so the total cannot be previewed until this succeeds.`,
        );
        setDistance(null);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const clearDistance = useCallback(() => {
    setDistance(null);
    setError(null);
  }, []);

  return {
    distance,
    loading,
    error,
    calculateDistance,
    clearDistance,
  };
}
