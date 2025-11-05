// app/(dashboard)/settings/coupons/[id]/page.tsx
'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Gift, 
  Users, 
  Calendar, 
  Edit,
  Loader2,
  DollarSign,
  TrendingUp,
  Activity,
  BarChart3
} from 'lucide-react';
import { useCouponDetail } from '@/hooks/useAdmin';
import EditCouponForm from '@/components/forms/EditCouponForm';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CouponDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { data: coupon, isLoading, error, refetch } = useCouponDetail(resolvedParams.id);
  const [isEditing, setIsEditing] = useState(false);

  const handleEditSuccess = async () => {
    setIsEditing(false);
    await refetch();
  };

  const getStatusBadge = (coupon: any) => {
    if (coupon.is_expired) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    if (!coupon.is_active) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)} CAD`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupon Details</h1>
            <p className="text-gray-600 mt-1">Loading coupon information...</p>
          </div>
          <Link href="/settings/coupons">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coupons
            </Button>
          </Link>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-2">Loading coupon details...</span>
        </div>
      </div>
    );
  }

  if (error || !coupon) {
    return (
      <div className="px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Coupon Details</h1>
            <p className="text-gray-600 mt-1">Error loading coupon information.</p>
          </div>
          <Link href="/settings/coupons">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coupons
            </Button>
          </Link>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            {error?.message || 'Coupon not found'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="px-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {coupon.name || <span className="text-gray-400 italic">Unnamed Coupon</span>}
          </h1>
          <p className="text-gray-600 mt-1">Coupon code: {coupon.code}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/settings/coupons/${coupon.id}/usage`}>
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              View Usage
            </Button>
          </Link>
          <Link href="/settings/coupons">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Coupons
            </Button>
          </Link>
          {!isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Coupon
            </Button>
          )}
        </div>
      </div>

      {isEditing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit Coupon</CardTitle>
          </CardHeader>
          <CardContent>
            <EditCouponForm
              coupon={coupon}
              onSuccess={handleEditSuccess}
              onCancel={() => setIsEditing(false)}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-blue-600" />
                    Basic Information
                  </span>
                  {getStatusBadge(coupon)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Coupon Code</h4>
                    <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">{coupon.code}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Discount Amount</h4>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      <span className="text-lg font-medium text-green-600">{formatPrice(coupon.discount)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Minimum Purchase</h4>
                    <span className="text-lg font-medium">{formatPrice(coupon.min_purchase_amount)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Total Usage</h4>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-lg font-medium">{coupon.usage_count}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-sm text-gray-700 mb-2">Description</h4>
                  <p className="text-gray-600">
                    {coupon.description || <span className="italic text-gray-400">No description provided</span>}
                  </p>
                </div>

                <div className="flex gap-2">
                  {coupon.is_recurrent && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      Recurring
                    </Badge>
                  )}
                  {coupon.is_failure_coupon && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      Failure Coupon
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Validity Period */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-green-600" />
                  Validity Period
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Start Date</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(coupon.start_date)}</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Expiration Date</h4>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span>{formatDate(coupon.expires_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Metadata */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Metadata</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">{formatDate(coupon.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 font-medium">{formatDate(coupon.updated_at)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Quick Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Usage Overview Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Activity className="w-4 h-4 text-primary" />
                  Usage Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-3 h-3 text-blue-600" />
                      <span className="text-xs font-medium text-blue-600">Uses</span>
                    </div>
                    <div className="text-xl font-bold text-blue-700">{coupon.usage_count}</div>
                  </div>

                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-600">Value</span>
                    </div>
                    <div className="text-sm font-bold text-green-700">
                      {formatPrice(coupon.discount * coupon.usage_count)}
                    </div>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        coupon.is_active && !coupon.is_expired 
                          ? 'bg-green-500' 
                          : 'bg-gray-400'
                      }`}></div>
                      <span className="text-sm font-medium">
                        {coupon.is_active && !coupon.is_expired ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Usage Rate */}
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3 h-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">Performance</span>
                  </div>
                  <div className="text-sm text-purple-700">
                    {coupon.usage_count > 0 ? (
                      <span>
                        <span className="font-semibold">{formatPrice(coupon.discount)}</span> per use
                      </span>
                    ) : (
                      <span className="text-gray-500">No usage yet</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="w-4 h-4 text-gray-600" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/settings/coupons/${coupon.id}/usage`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Detailed Usage Analytics
                  </Button>
                </Link>
                
                {coupon.usage_count > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="text-xs text-green-700 font-medium mb-1">Total Impact</div>
                    <div className="text-sm text-green-800">
                      <span className="font-semibold">{formatPrice(coupon.discount * coupon.usage_count)}</span> in discounts given
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Info Card */}
            <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
              <CardContent className="p-4">
                <div className="text-xs text-gray-600 mb-2">Quick Info</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium">
                      {coupon.is_failure_coupon ? 'Failure' : 'Regular'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Recurring:</span>
                    <span className="font-medium">
                      {coupon.is_recurrent ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Min Purchase:</span>
                    <span className="font-medium">
                      {formatPrice(coupon.min_purchase_amount)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}