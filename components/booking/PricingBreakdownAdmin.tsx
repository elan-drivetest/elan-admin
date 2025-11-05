// components/booking/PricingBreakdownAdmin.tsx
'use client';

import React from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bookingUtils } from '@/lib/utils/booking-calculations';
import type { TestCenter, CouponVerificationResponse, Addon } from '@/types/admin';

interface PricingItem {
  label: string;
  amount: number;
  description?: string;
  isFree?: boolean;
  isDiscount?: boolean;
  isTotal?: boolean;
}

interface PricingBreakdownAdminProps {
  testCenter?: TestCenter;
  distance?: number;
  selectedAddon?: Addon;
  appliedCoupon?: CouponVerificationResponse;
  locationOption: 'pickup' | 'test-centre';
  freePerks?: {
    free_dropoff: boolean;
    free_30min_lesson: boolean;
    free_1hr_lesson: boolean;
  };
  className?: string;
}

export default function PricingBreakdownAdmin({
  testCenter,
  distance = 0,
  selectedAddon,
  appliedCoupon,
  locationOption,
  freePerks,
  className
}: PricingBreakdownAdminProps) {
  const calculateBreakdown = (): PricingItem[] => {
    const breakdown: PricingItem[] = [];
    
    if (!testCenter) {
      return breakdown;
    }

    // Base price
    breakdown.push({
      label: 'Test Center Fee',
      amount: testCenter.base_price,
      description: `${testCenter.name} - ${testCenter.city}`,
    });

    // Pickup price
    if (locationOption === 'pickup' && distance > 0) {
      const pickupPrice = bookingUtils.calculatePickupPrice(distance);
      breakdown.push({
        label: `Pickup Service (${distance.toFixed(1)}km)`,
        amount: pickupPrice,
        description: distance <= 50 
          ? '$1.00/km for first 50km'
          : '$1.00/km for first 50km, $0.50/km thereafter',
      });

      // Free dropoff
      if (freePerks?.free_dropoff) {
        breakdown.push({
          label: '🎉 Free Dropoff Service',
          amount: 0,
          description: 'Included for distances over 50km',
          isFree: true,
        });
      }
    }

    // Add-on pricing
    if (selectedAddon) {
      breakdown.push({
        label: selectedAddon.name,
        amount: selectedAddon.price,
        description: selectedAddon.description,
      });
    }

    // Free lessons
    if (freePerks?.free_30min_lesson && !selectedAddon) {
      breakdown.push({
        label: '🎉 Free 30-minute Driving Lesson',
        amount: 0,
        description: 'Included for distances over 50km',
        isFree: true,
      });
    }

    if (freePerks?.free_1hr_lesson && !selectedAddon) {
      breakdown.push({
        label: '🎉 Free 1-hour Driving Lesson',
        amount: 0,
        description: 'Included for distances over 100km',
        isFree: true,
      });
    }

    // Applied coupon
    if (appliedCoupon) {
      breakdown.push({
        label: `Discount (${appliedCoupon.code})`,
        amount: appliedCoupon.discount,
        description: appliedCoupon.description,
        isDiscount: true,
      });
    }

    // Calculate total
    const subtotal = breakdown
      .filter(item => !item.isFree && !item.isDiscount)
      .reduce((sum, item) => sum + item.amount, 0);
    
    const discountAmount = breakdown
      .filter(item => item.isDiscount)
      .reduce((sum, item) => sum + item.amount, 0);

    const total = Math.max(0, subtotal - discountAmount);

    breakdown.push({
      label: 'Total Payment',
      amount: total,
      isTotal: true,
    });

    return breakdown;
  };

  const pricingItems = calculateBreakdown();
  const hasFreebies = pricingItems.some(item => item.isFree);

  if (!testCenter) {
    return (
      <Card className={cn('border-gray-200', className)}>
        <CardHeader>
          <CardTitle className="text-base text-gray-600">Pricing Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Select a test center to see pricing</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('border-gray-200', className)}>
      <CardHeader>
        <CardTitle className="text-base text-gray-900 flex items-center justify-between">
          Pricing Breakdown
          {hasFreebies && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Includes Free Perks
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {pricingItems.map((item, index) => (
          <div key={index} className={cn(
            'flex justify-between items-start',
            item.isTotal && 'pt-3 border-t border-gray-200 font-semibold text-lg',
            item.isFree && 'text-green-700',
            item.isDiscount && 'text-red-600'
          )}>
            <div className="flex-1 min-w-0">
              <div className={cn(
                'text-sm',
                item.isTotal ? 'text-gray-900 font-semibold' : 'text-gray-700'
              )}>
                {item.label}
              </div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-1">
                  {item.description}
                </div>
              )}
            </div>
            <div className={cn(
              'text-right flex-shrink-0 ml-3',
              item.isTotal && 'text-green-600 font-bold text-lg',
              item.isFree && 'text-green-600',
              item.isDiscount && 'text-red-600'
            )}>
              {item.isDiscount ? '-' : ''}
              {item.isFree ? 'FREE' : bookingUtils.formatPrice(item.amount)}
            </div>
          </div>
        ))}

        {/* Additional Info */}
        {distance > 0 && locationOption === 'pickup' && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Distance Benefits</h4>
            <div className="space-y-1 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Check size={12} className="text-green-500" />
                <span>Distance: {distance.toFixed(1)} km from test center</span>
              </div>
              {freePerks?.free_dropoff && (
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-green-500" />
                  <span>Free dropoff service included</span>
                </div>
              )}
              {(freePerks?.free_30min_lesson || freePerks?.free_1hr_lesson) && (
                <div className="flex items-center gap-2">
                  <Check size={12} className="text-green-500" />
                  <span>
                    Free {freePerks.free_1hr_lesson ? '1-hour' : '30-minute'} driving lesson included
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Coupon Info */}
        {appliedCoupon && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-green-700">
              <Check size={14} />
              <span className="text-sm font-medium">
                {`Coupon "${appliedCoupon.code}" applied`}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              You saved {bookingUtils.formatPrice(appliedCoupon.discount)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}