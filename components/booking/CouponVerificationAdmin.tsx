// components/admin/booking/CouponVerificationAdmin.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { adminService } from '@/services/admin';
import { formatPrice } from '@/lib/utils/booking-calculations';
import { getApiErrorMessages, formatCouponDiscount } from '@/lib/utils';
import type { CouponVerificationResponse, AdminCoupon } from '@/types/admin';

interface CouponVerificationAdminProps {
  onCouponApply?: (coupon: CouponVerificationResponse | null) => void;
  appliedCoupon?: CouponVerificationResponse | null;
  className?: string;
}

// The verification response and the coupon list row share the same shape, so a
// selected coupon can be applied directly without a second verify round-trip.
const toVerification = (c: AdminCoupon): CouponVerificationResponse => ({
  id: c.id,
  name: c.name,
  description: c.description,
  code: c.code,
  discount: c.discount,
  // Carried through so the price preview knows whether `discount` is cents or
  // percent — dropping it here made every percentage coupon read as $0.10.
  discount_type: c.discount_type,
  is_recurrent: c.is_recurrent,
  is_failure_coupon: c.is_failure_coupon,
  min_purchase_amount: c.min_purchase_amount,
  start_date: c.start_date,
  expires_at: c.expires_at,
  created_at: c.created_at,
  updated_at: c.updated_at,
});

export default function CouponVerificationAdmin({
  onCouponApply,
  appliedCoupon,
  className
}: CouponVerificationAdminProps) {
  const [coupons, setCoupons] = useState<AdminCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load the available coupons the admin can apply (active and not expired).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // NOTE: only send is_active=true. The backend DTO coerces query booleans
        // with Boolean(value), so is_expired=false would be read as TRUE and wrongly
        // return only expired coupons. is_active=true already means started & not expired.
        const { data } = await adminService.getCoupons({ limit: 100, is_active: true });
        if (!cancelled) setCoupons(data);
      } catch (err: any) {
        if (!cancelled) setError(getApiErrorMessages(err).join(' '));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSelect = (value: number | string | null) => {
    if (value === null) {
      onCouponApply?.(null);
      return;
    }
    const coupon = coupons.find((c) => c.id === value);
    onCouponApply?.(coupon ? toVerification(coupon) : null);
  };

  const handleRemoveCoupon = () => {
    onCouponApply?.(null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <h3 className="text-lg font-medium text-gray-900">Promo Code</h3>
        <p className="text-sm text-gray-600">
          Apply a discount coupon to reduce the total cost.
        </p>
      </div>

      {appliedCoupon ? (
        // Applied coupon summary + remove
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-medium text-green-800">
                  {`Coupon "${appliedCoupon.code}" applied`}
                </span>
                <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                  {formatCouponDiscount(appliedCoupon, { suffix: false })} OFF
                </Badge>
              </div>
              {appliedCoupon.description && (
                <p className="text-sm text-green-700">{appliedCoupon.description}</p>
              )}
              {appliedCoupon.min_purchase_amount > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Minimum purchase: {formatPrice(appliedCoupon.min_purchase_amount)}
                </p>
              )}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleRemoveCoupon}>
              <X size={14} className="mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <SearchableSelect
          label=""
          options={coupons.map((c) => ({
            id: c.id,
            label: c.code,
            subtitle: c.description || c.name,
            badge: `${formatCouponDiscount(c, { suffix: false })} OFF`,
          }))}
          value={null}
          onSelect={handleSelect}
          placeholder={loading ? 'Loading coupons…' : 'Select a promo code (optional)'}
          required={false}
          isLoading={loading}
          allowClear={false}
          emptyMessage="No active coupons available"
        />
      )}

      {error && (
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle size={14} />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}
