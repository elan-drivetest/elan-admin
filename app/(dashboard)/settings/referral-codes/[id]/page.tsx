// app/(dashboard)/settings/referral-codes/[id]/page.tsx
'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  Gift, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useReferralCodeDetail } from '@/hooks/useAdmin';
import { adminService } from '@/services/admin';
import type { UpdateReferralCodeStatusRequest } from '@/types/admin';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ReferralCodeDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const { data: referralCode, isLoading, error, refetch } = useReferralCodeDetail(resolvedParams.id);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const handleStatusUpdate = async (newStatus: UpdateReferralCodeStatusRequest['status']) => {
    if (!referralCode) return;

    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      await adminService.updateReferralCodeStatus(referralCode.id.toString(), { status: newStatus });
      await refetch();
    } catch (error: any) {
      setUpdateError(error?.response?.data?.message || 'Failed to update status');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
      'claimed': { color: 'bg-blue-100 text-blue-800', text: 'Claimed' },
      'pending_payment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Payment' },
      'partially_paid': { color: 'bg-orange-100 text-orange-800', text: 'Partially Paid' },
      'fully_paid': { color: 'bg-purple-100 text-purple-800', text: 'Fully Paid' },
      'expired': { color: 'bg-red-100 text-red-800', text: 'Expired' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', text: status };
    
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)} CAD`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <>
        <DashboardHeader
          title="Referral Code Details"
          subtitle="Loading referral code information..."
          actions={
            <Link href="/settings/referral-codes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Referral Codes
              </Button>
            </Link>
          }
        />
        <div className="px-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-2">Loading referral code details...</span>
          </div>
        </div>
      </>
    );
  }

  if (error || !referralCode) {
    return (
      <>
        <DashboardHeader
          title="Referral Code Details"
          subtitle="Error loading referral code information."
          actions={
            <Link href="/settings/referral-codes">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Referral Codes
              </Button>
            </Link>
          }
        />
        <div className="px-6">
          <Alert variant="destructive">
            <AlertDescription>
              {error?.message || 'Referral code not found'}
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <DashboardHeader
        title={`Referral Code: ${referralCode.code}`}
        subtitle="View and manage referral code details."
        actions={
          <Link href="/settings/referral-codes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Referral Codes
            </Button>
          </Link>
        }
      />

      <div className="px-6 space-y-6">
        {updateError && (
          <Alert variant="destructive">
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-blue-600" />
                Basic Information
              </span>
              {getStatusBadge(referralCode.status)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Code</h4>
                <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">{referralCode.code}</p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Amount</h4>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  <span className="text-lg font-medium text-green-600">{formatPrice(referralCode.amount)}</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Instructor ID</h4>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>#{referralCode.instructor_id}</span>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Min Rides Required</h4>
                <span className="text-lg font-medium">{referralCode.min_rides_required}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Usage & Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Rides Completed</h4>
                <div className="text-2xl font-bold text-primary">
                  {referralCode.rides_completed_count} / {referralCode.min_rides_required}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min((referralCode.rides_completed_count / referralCode.min_rides_required) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Used By Instructor</h4>
                <span className="text-lg">
                  {referralCode.used_by_instructor_id ? `#${referralCode.used_by_instructor_id}` : 'Not used yet'}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-700 mb-2">Used Date</h4>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span>{formatDate(referralCode.used_at)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h5 className="font-medium text-gray-700">Referrer (Inviter)</h5>
                <div>
                  <h6 className="text-sm text-gray-600 mb-1">Amount Paid</h6>
                  <span className="text-lg font-medium text-green-600">{formatPrice(referralCode.referrer_paid)}</span>
                </div>
                <div>
                  <h6 className="text-sm text-gray-600 mb-1">Payment Date</h6>
                  <span>{formatDate(referralCode.referrer_payment_date)}</span>
                </div>
              </div>
              <div className="space-y-4">
                <h5 className="font-medium text-gray-700">Referee (Invitee)</h5>
                <div>
                  <h6 className="text-sm text-gray-600 mb-1">Amount Paid</h6>
                  <span className="text-lg font-medium text-green-600">{formatPrice(referralCode.referee_paid)}</span>
                </div>
                <div>
                  <h6 className="text-sm text-gray-600 mb-1">Payment Date</h6>
                  <span>{formatDate(referralCode.referee_payment_date)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status Update Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Update Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {['active', 'claimed', 'pending_payment', 'partially_paid', 'fully_paid', 'expired'].map((status) => (
                <Button
                  key={status}
                  variant={referralCode.status === status ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleStatusUpdate(status as any)}
                  disabled={isUpdating || referralCode.status === status}
                >
                  {isUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : null}
                  {status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}