// components/modals/CouponDetailModal.tsx
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gift, Calendar, Users, Edit, Loader2, Activity, TrendingUp } from 'lucide-react';
import { useCouponDetail } from '@/hooks/useAdmin';
import { formatCAD } from '@/lib/utils';
import EditCouponForm from '@/components/forms/EditCouponForm';

interface CouponDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponId: string | null;
  onUpdate?: () => void;
}

const formatDate = (value?: string | null) => {
  if (!value) return 'No expiry';
  const d = new Date(value);
  return isNaN(d.getTime())
    ? 'No expiry'
    : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export default function CouponDetailModal({ isOpen, onClose, couponId, onUpdate }: CouponDetailModalProps) {
  const { data: coupon, isLoading, error, refetch } = useCouponDetail(couponId || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleEditSuccess = async () => {
    setIsEditing(false);
    await refetch();
    onUpdate?.();
  };

  const handleClose = () => {
    setIsEditing(false);
    onClose();
  };

  const statusBadge = (c: NonNullable<typeof coupon>) =>
    c.is_expired ? (
      <Badge className="bg-red-100 text-red-800">Expired</Badge>
    ) : !c.is_active ? (
      <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
    ) : (
      <Badge className="bg-green-100 text-green-800">Active</Badge>
    );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            {coupon ? coupon.name || 'Coupon' : 'Coupon Details'}
            {coupon && !isEditing && <span className="ml-2">{statusBadge(coupon)}</span>}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {error && !isLoading && (
          <div className="text-center py-8 text-red-600">
            <p>{error.message || 'Coupon not found'}</p>
          </div>
        )}

        {coupon && !isLoading && (
          isEditing ? (
            <EditCouponForm coupon={coupon} onSuccess={handleEditSuccess} onCancel={() => setIsEditing(false)} />
          ) : (
            <div className="space-y-4">
              {/* Key figures */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Code</p>
                  <p className="font-mono font-semibold">{coupon.code}</p>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Discount</p>
                  <p className="font-semibold text-green-600">{formatCAD(coupon.discount)}</p>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Min Purchase</p>
                  <p className="font-semibold">{formatCAD(coupon.min_purchase_amount)}</p>
                </div>
                <div className="bg-white border rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Uses</p>
                  <p className="font-semibold">{coupon.usage_count}</p>
                </div>
              </div>

              {/* Details */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Validity & Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Start Date</p>
                      <p className="font-medium">{formatDate(coupon.start_date)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Expiration Date</p>
                      <p className="font-medium">{formatDate(coupon.expires_at)}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Description</p>
                    <p className="text-gray-700">
                      {coupon.description || <span className="italic text-gray-400">No description</span>}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {coupon.is_recurrent && <Badge variant="outline" className="bg-blue-50 text-blue-700">Recurring</Badge>}
                    {coupon.is_failure_coupon && <Badge variant="outline" className="bg-orange-50 text-orange-700">Failure Coupon</Badge>}
                  </div>
                </CardContent>
              </Card>

              {/* Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-lg p-3 flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-xs text-green-700">Total discounts given</p>
                    <p className="font-semibold text-green-800">{formatCAD(coupon.discount * coupon.usage_count)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between text-xs text-gray-500">
                  <span>Created {formatDate(coupon.created_at)}</span>
                  <span>Updated {formatDate(coupon.updated_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t">
                <Link href={`/settings/coupons/${coupon.id}/usage`}>
                  <Button variant="outline" size="sm">
                    <Activity className="w-4 h-4 mr-2" />
                    View Usage ({coupon.usage_count})
                  </Button>
                </Link>
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Coupon
                </Button>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
