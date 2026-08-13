// components/modals/ReferralCodeDetailModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Gift, 
  Users, 
  DollarSign, 
  Calendar, 
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useReferralCodeDetail } from '@/hooks/useAdmin';
import { adminService } from '@/services/admin';
import { getApiErrorMessage, formatCAD } from '@/lib/utils';
import { resolveReferralPayout } from '@/lib/utils/referral-payout';
import { useLivePeerReferralBonus } from '@/hooks/useReferralBonus';
import type { UpdateReferralCodeStatusRequest } from '@/types/admin';

interface ReferralCodeDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  codeId: string | null;
  onSuccess?: () => void;
}

/**
 * What this code will actually pay. A peer referral reads the live bonus setting
 * at payout time and pays BOTH sides, ignoring the amount stored on the code
 * (ADMIN_SETTINGS.md 4.1); an admin promo code pays its frozen amount, once.
 */
function PayoutSummary({
  code,
  livePeerBonus,
}: {
  code: { amount: number; referral_type?: 'instructor' | 'admin' };
  livePeerBonus: number | null;
}) {
  const payout = resolveReferralPayout(code, livePeerBonus);

  return (
    <div>
      <h4 className="font-medium text-sm text-gray-700 mb-2">Payout</h4>
      <p className="text-lg font-medium text-green-600">
        {formatCAD(payout.perSide, { suffix: false })}
      </p>
      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
        {payout.sides === 2
          ? `Paid to the referrer and to the referee - ${formatCAD(payout.total, { suffix: false })} in all. Peer referrals are paid at the live bonus rate when the bonus is released, not the ${formatCAD(code.amount, { suffix: false })} stored on this code.`
          : 'Paid once to the instructor who claims this code, at the amount frozen when it was created.'}
      </p>
    </div>
  );
}

export default function ReferralCodeDetailModal({
  isOpen,
  onClose,
  codeId,
  onSuccess
}: ReferralCodeDetailModalProps) {
  const { data: referralCode, isLoading, error, refetch } = useReferralCodeDetail(codeId || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Admins only control availability: keep the code Active (claimable) or revoke
  // it (Expired). The claimed/payment statuses are driven by the system as the
  // code is used and payouts are processed, so they aren't admin-settable here.
  const [availability, setAvailability] = useState<'active' | 'expired'>('active');

  useEffect(() => {
    if (referralCode) {
      setAvailability(referralCode.status === 'expired' ? 'expired' : 'active');
    }
  }, [referralCode]);

  const handleStatusUpdate = async (newStatus: UpdateReferralCodeStatusRequest['status']) => {
    if (!referralCode) return;

    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      await adminService.updateReferralCodeStatus(referralCode.id.toString(), { status: newStatus });
      await refetch();
      onSuccess?.();
    } catch (error: any) {
      setUpdateError(getApiErrorMessage(error));
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

  const livePeerBonus = useLivePeerReferralBonus();

  const formatPrice = (amount: number) => formatCAD(amount);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-fit max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-primary" />
            Referral Code Details
            {referralCode && `- ${referralCode.code}`}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2">Loading referral code details...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}

        {updateError && (
          <Alert variant="destructive">
            <AlertDescription>{updateError}</AlertDescription>
          </Alert>
        )}

        {referralCode && !isLoading && (
          <div className="space-y-6">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Code</h4>
                    <p className="text-lg font-mono bg-gray-100 px-3 py-2 rounded">{referralCode.code}</p>
                  </div>
                  <PayoutSummary code={referralCode} livePeerBonus={livePeerBonus} />
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Owner</h4>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400" />
                      {referralCode.referrer ? (
                        <div>
                          <p className="font-medium">{referralCode.referrer.full_name}</p>
                          <p className="text-xs text-gray-500">{referralCode.referrer.email}</p>
                        </div>
                      ) : referralCode.referral_type === 'admin' ? (
                        <span>Admin-created</span>
                      ) : (
                        <span>{referralCode.instructor_id ? `#${referralCode.instructor_id}` : '—'}</span>
                      )}
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
                  Usage Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Rides Completed</h4>
                    <span className="text-lg font-medium">{referralCode.rides_completed_count}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Used By</h4>
                    {referralCode.referee ? (
                      <div>
                        <p className="font-medium">{referralCode.referee.full_name}</p>
                        <p className="text-xs text-gray-500">{referralCode.referee.email}</p>
                      </div>
                    ) : (
                      <span>{referralCode.used_by_instructor_id ? `#${referralCode.used_by_instructor_id}` : 'Not used yet'}</span>
                    )}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Referrer Paid</h4>
                    <span className="font-medium text-green-600">{formatPrice(referralCode.referrer_paid)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Referee Paid</h4>
                    <span className="font-medium text-green-600">{formatPrice(referralCode.referee_paid)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Referrer Payment Date</h4>
                    <span>{formatDate(referralCode.referrer_payment_date)}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Referee Payment Date</h4>
                    <span>{formatDate(referralCode.referee_payment_date)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manage availability */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-primary" />
                  Manage Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 leading-relaxed">
                  This code moves through its lifecycle <span className="font-medium">automatically</span> — it becomes{' '}
                  <span className="font-medium">Claimed</span> when an instructor uses it,{' '}
                  <span className="font-medium">Pending Payment</span> once they complete the required rides, then{' '}
                  <span className="font-medium">Partially / Fully Paid</span> as payouts are processed. As an admin you
                  control one thing: whether the code is <span className="font-medium">available</span> or{' '}
                  <span className="font-medium">revoked</span>.
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <div className="flex-1 space-y-1.5">
                    <label className="text-sm font-medium text-gray-700">Availability</label>
                    <Select
                      value={availability}
                      onValueChange={(v) => setAvailability(v as 'active' | 'expired')}
                      disabled={isUpdating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active — available to be claimed</SelectItem>
                        <SelectItem value="expired">Expired — revoked, no longer usable</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={() => handleStatusUpdate(availability)}
                    disabled={isUpdating || availability === referralCode.status}
                    className={availability === 'expired' ? 'bg-red-600 hover:bg-red-700' : undefined}
                  >
                    {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {availability === referralCode.status
                      ? 'No change'
                      : availability === 'expired'
                        ? 'Revoke Code'
                        : 'Make Active'}
                  </Button>
                </div>

                {!['active', 'expired'].includes(referralCode.status) && (
                  <p className="text-xs text-gray-500">
                    Current status is{' '}
                    <span className="font-medium">{referralCode.status.replace(/_/g, ' ')}</span> (set automatically).
                    You can still revoke the code, which marks it Expired.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}