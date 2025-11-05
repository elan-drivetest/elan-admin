// app/(dashboard)/settings/coupons/create/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Gift } from 'lucide-react';
import CreateCouponForm from '@/components/forms/CreateCouponForm';

export default function CreateCouponPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/settings/coupons');
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Coupon</h1>
          <p className="text-gray-600 mt-1">Add a new discount coupon to the system.</p>
        </div>
        <Link href="/settings/coupons">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Coupons
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-blue-600" />
            Coupon Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateCouponForm
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Coupon Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="font-medium mb-2 text-blue-800">Regular Coupons</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Standard discount coupons</li>
                  <li>Can be one-time or recurring</li>
                  <li>Apply to any booking</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2 text-orange-800">Failure Coupons</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Special retry discounts</li>
                  <li>For customers who failed tests</li>
                  <li>Encourages rebooking</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}