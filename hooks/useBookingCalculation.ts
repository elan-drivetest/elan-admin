// hooks/useBookingCalculation.ts
'use client';

import { useState, useCallback } from 'react';
import { adminService } from '@/services/admin';
import { bookingUtils } from '@/lib/utils/booking-calculations';
import type { DistanceCalculationRequest, TestCenter } from '@/types/admin';

interface UseDistanceCalculationReturn {
  distance: number | null;
  loading: boolean;
  error: string | null;
  calculateDistance: (pickup: { lat: number; lng: number }, testCenter: TestCenter) => Promise<number | null>;
  clearDistance: () => void;
}

export function useDistanceCalculation(): UseDistanceCalculationReturn {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateDistance = useCallback(async (
    pickup: { lat: number; lng: number }, 
    testCenter: TestCenter
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
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to calculate distance';
      setError(errorMessage);
      
      // Fallback to local calculation
      const localDistance = bookingUtils.calculateDistanceLocal(
        pickup.lat,
        pickup.lng,
        parseFloat(String(testCenter.lat)),
        parseFloat(String(testCenter.lng))
      );
      setDistance(localDistance);
      return localDistance;
    } finally {
      setLoading(false);
    }
  }, []);

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

interface UsePricingCalculationReturn {
  pricing: {
    basePrice: number;
    pickupPrice: number;
    addonsPrice: number;
    discountAmount: number;
    totalPrice: number;
  } | null;
  perks: {
    free_dropoff: boolean;
    free_30min_lesson: boolean;
    free_1hr_lesson: boolean;
  } | null;
  updatePricing: (params: {
    testCenter?: TestCenter;
    distance?: number;
    addonPrice?: number;
    discountAmount?: number;
  }) => void;
}

export function usePricingCalculation(): UsePricingCalculationReturn {
  const [pricing, setPricing] = useState<any>(null);
  const [perks, setPerks] = useState<any>(null);

  const updatePricing = useCallback((params: {
    testCenter?: TestCenter;
    distance?: number;
    addonPrice?: number;
    discountAmount?: number;
  }) => {
    const {
      testCenter,
      distance = 0,
      addonPrice = 0,
      discountAmount = 0,
    } = params;

    if (!testCenter) {
      setPricing(null);
      setPerks(null);
      return;
    }

    const basePrice = testCenter.base_price;
    const pickupPrice = bookingUtils.calculatePickupPrice(distance);
    const totalPrice = bookingUtils.calculateTotalPrice({
      basePrice,
      pickupPrice,
      addonsPrice: addonPrice,
      discountAmount,
    });

    const distancePerks = bookingUtils.getDistancePerks(distance);

    setPricing({
      basePrice,
      pickupPrice,
      addonsPrice: addonPrice,
      discountAmount,
      totalPrice,
    });

    setPerks(distancePerks);
  }, []);

  return {
    pricing,
    perks,
    updatePricing,
  };
}