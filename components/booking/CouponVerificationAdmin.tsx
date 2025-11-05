// components/admin/booking/CouponVerificationAdmin.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, AlertCircle, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { adminService } from '@/services/admin';
import { bookingUtils } from '@/lib/utils/booking-calculations';
import type { CouponVerificationResponse } from '@/types/admin';

interface CouponVerificationAdminProps {
  onCouponApply?: (coupon: CouponVerificationResponse | null) => void;
  appliedCoupon?: CouponVerificationResponse | null;
  className?: string;
}

export default function CouponVerificationAdmin({
  onCouponApply,
  appliedCoupon,
  className
}: CouponVerificationAdminProps) {
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-populate input if coupon is already applied
  useEffect(() => {
    if (appliedCoupon) {
      setCouponCode(appliedCoupon.code);
    }
  }, [appliedCoupon]);

  const handleVerifyCoupon = async () => {
    if (!couponCode.trim()) {
      setError('Please enter a coupon code');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await adminService.verifyCouponCode({ code: couponCode.trim() });
      onCouponApply?.(response);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Invalid coupon code';
      setError(errorMessage);
      onCouponApply?.(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponCode('');
    setError(null);
    onCouponApply?.(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerifyCoupon();
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Promo Code</h3>
        <p className="text-sm text-gray-600 mb-3">
          Apply a discount coupon to reduce the total cost.
        </p>

        {/* Coupon Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              type="text"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="Enter coupon code"
              className={cn(
                'pr-10',
                error && 'border-red-300',
                appliedCoupon && 'bg-green-50 border-green-300'
              )}
              disabled={loading}
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {loading ? (
                <Loader2 size={16} className="animate-spin text-gray-400" />
              ) : appliedCoupon ? (
                <Check size={16} className="text-green-500" />
              ) : (
                <Gift size={16} className="text-gray-400" />
              )}
            </div>
          </div>

          {appliedCoupon ? (
            <Button
              type="button"
              variant="outline"
              onClick={handleRemoveCoupon}
              disabled={loading}
            >
              <X size={16} className="mr-2" />
              Remove
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleVerifyCoupon}
              disabled={loading || !couponCode.trim()}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Gift size={16} className="mr-2" />
              )}
              Apply
            </Button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 mt-2 text-red-600">
            <AlertCircle size={14} />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Applied Coupon Success */}
        {appliedCoupon && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-2">
              <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-green-800">
                    {`Coupon "${appliedCoupon.code}" Applied`}
                  </span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    {bookingUtils.formatPrice(appliedCoupon.discount)} OFF
                  </Badge>
                </div>
                <p className="text-sm text-green-700">
                  {appliedCoupon.description}
                </p>
                {appliedCoupon.min_purchase_amount > 0 && (
                  <p className="text-xs text-green-600 mt-1">
                    Minimum purchase: {bookingUtils.formatPrice(appliedCoupon.min_purchase_amount)}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}