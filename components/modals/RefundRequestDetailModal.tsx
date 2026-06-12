// components/modals/RefundRequestDetailModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  User, DollarSign, Calendar,
  Receipt, CreditCard, FileText, AlertCircle, CheckCircle,
  XCircle, Loader2
} from 'lucide-react';
import { useRefundDetail, useUpdateRefund } from '@/hooks/useRefunds';
import FormErrorAlert from '@/components/ui/form-error-alert';
import type { RefundStatus } from '@/types/refund';
import CustomerDetailModal from './CustomerDetailModal';
import Link from 'next/link';
import { toast } from 'sonner';

interface RefundRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundId: number | null;
  onUpdate?: () => void;
}

// The admin's decision on a pending request. Approve issues the refund; reject declines it.
// processing/completed/failed are workflow-internal states the backend sets after the actual
// Stripe refund runs, so admins never set them directly.
type Decision = 'none' | 'approve' | 'reject';

export default function RefundRequestDetailModal({
  isOpen,
  onClose,
  refundId,
  onUpdate
}: RefundRequestDetailModalProps) {
  const { refund, loading, error, refetch } = useRefundDetail(refundId);
  const { updateRefund, loading: updating, error: updateError } = useUpdateRefund();

  // Decision flow state
  const [decision, setDecision] = useState<Decision>('none');
  const [editPercentage, setEditPercentage] = useState(100);
  const [editNotes, setEditNotes] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Reset the decision flow whenever the refund loads or the modal closes.
  useEffect(() => {
    if (refund) {
      setDecision('none');
      setEditPercentage(refund.refund_percentage || 100);
      setEditNotes(refund.admin_notes || '');
    }
  }, [refund]);

  useEffect(() => {
    if (!isOpen) setDecision('none');
  }, [isOpen]);

  const isPending = refund?.status === 'pending';
  const isDeciding = decision !== 'none';

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: RefundStatus) => {
    const statusConfig: Record<RefundStatus, { bg: string; text: string; label: string; icon: typeof AlertCircle }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: AlertCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: AlertCircle },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed', icon: CheckCircle },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Processing', icon: AlertCircle },
      failed: { bg: 'bg-red-200', text: 'text-red-900', label: 'Failed', icon: AlertCircle },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge className={`${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleSubmitDecision = async () => {
    if (!refund || decision === 'none') return;

    const refundIdentifier = refund.id ?? refund.booking_id;
    const status: RefundStatus = decision === 'approve' ? 'approved' : 'rejected';

    const result = await updateRefund(refundIdentifier, {
      status,
      refund_percentage: decision === 'approve' ? editPercentage : 0,
      admin_notes: editNotes || undefined,
    });

    if (result) {
      setDecision('none');
      refetch();
      onUpdate?.();
      toast.success(decision === 'approve' ? 'Refund approved' : 'Refund request rejected');
    }
  };

  const calculatedRefundAmount = refund ? (refund.amount * editPercentage) / 100 : 0;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Refund Request
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>Error loading refund details</p>
            <Button variant="outline" onClick={onClose} className="mt-2">Close</Button>
          </div>
        )}

        {refund && (
          <div className="space-y-5">
            {/* Inline save error */}
            {isDeciding && updateError && <FormErrorAlert messages={[updateError]} />}

            {/* Header Section */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-semibold">
                    {refund.id ? `Refund Request #${refund.id}` : `Booking #${refund.booking_id} Refund`}
                  </h3>
                  {getStatusBadge(refund.status)}
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Requested {formatDate(refund.request_date)}</span>
                  </div>
                  {refund.processed_at && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Processed {formatDate(refund.processed_at)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== VVIP: Decision panel — the first thing the admin acts on ===== */}
            {isPending ? (
              decision === 'approve' ? (
                <Card className="border-green-300 bg-green-50 shadow-sm">
                  <CardContent className="pt-4 flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-green-900">
                      Approving a <span className="font-semibold">{formatCurrency(calculatedRefundAmount)}</span> ({editPercentage}%) refund to{' '}
                      <span className="font-medium">{refund.customer_name || 'the customer'}</span>. Adjust the percentage below, then confirm at the bottom.
                    </p>
                  </CardContent>
                </Card>
              ) : decision === 'reject' ? (
                <Card className="border-red-300 bg-red-50 shadow-sm">
                  <CardContent className="pt-4 flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-900">
                      Rejecting this request — no refund will be issued. Add a reason below, then confirm at the bottom.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-2 border-primary/40 bg-primary/5 shadow-sm">
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <p className="text-sm font-semibold">Process this refund request</p>
                    </div>
                    <p className="text-xs text-gray-600 mb-4">
                      {refund.customer_name || 'The customer'} requested a {refund.refund_percentage}% refund
                      (<span className="font-medium">{formatCurrency((refund.amount * refund.refund_percentage) / 100)}</span> of {formatCurrency(refund.amount)}).
                      Approve to issue the refund, or reject the request.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="outline"
                        className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                        onClick={() => setDecision('reject')}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject Request
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => { setEditPercentage(refund.refund_percentage || 100); setDecision('approve'); }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Refund
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="bg-gray-50">
                <CardContent className="pt-4 text-sm text-gray-700">
                  This request has already been <span className="font-medium">{refund.status}</span>
                  {refund.processed_at ? ` on ${formatDate(refund.processed_at)}` : ''}. It can no longer be changed.
                </CardContent>
              </Card>
            )}

            {/* ===== PRIMARY: Refund Information ===== */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Refund Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Amounts row */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Original Amount</div>
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(refund.amount)}
                    </div>
                  </div>
                  {decision === 'reject' ? (
                    <div className="p-3 rounded-lg bg-red-50 border-2 border-red-200">
                      <div className="text-xs font-medium mb-0.5 text-red-800">Refund Amount</div>
                      <div className="text-2xl font-bold text-red-600">{formatCurrency(0)}</div>
                      <div className="text-[11px] text-red-700 mt-0.5">No refund — request rejected.</div>
                    </div>
                  ) : (
                    <div className={`p-3 rounded-lg ${decision === 'approve' ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                      <div className="text-xs font-medium mb-0.5 text-gray-600">
                        {decision === 'approve' ? 'Refund to issue' : 'Refund Amount'}
                      </div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(decision === 'approve' ? calculatedRefundAmount : (refund.amount * refund.refund_percentage) / 100)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Refund Percentage */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">
                      {decision === 'approve' ? 'Refund Percentage' : 'Requested Percentage'}
                    </div>
                    <div className="text-xl font-semibold text-primary">
                      {decision === 'approve' ? editPercentage : refund.refund_percentage}%
                    </div>
                  </div>

                  {decision === 'approve' ? (
                    <div className="space-y-2">
                      <Slider
                        value={[editPercentage]}
                        onValueChange={(value) => setEditPercentage(value[0])}
                        max={100}
                        min={0}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${refund.refund_percentage}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Reference fields */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 pt-1 border-t">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Booking</div>
                    <div className="flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-gray-400" />
                      <Link href={`/bookings?id=${refund.booking_id}`} className="text-sm text-primary hover:underline">
                        #{refund.booking_id}
                      </Link>
                    </div>
                  </div>
                  {refund.payment_transaction_id && (
                    <div>
                      <div className="text-xs font-medium text-gray-500 mb-1">Payment Transaction</div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-mono">#{refund.payment_transaction_id}</span>
                      </div>
                    </div>
                  )}
                  {refund.stripe_refund_id && (
                    <div className="col-span-2">
                      <div className="text-xs font-medium text-gray-500 mb-1">Stripe Refund ID</div>
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs font-mono">{refund.stripe_refund_id}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Subtle customer helper — click to open the full customer profile */}
            <button
              type="button"
              onClick={() => setIsCustomerModalOpen(true)}
              className="w-full flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-left transition-colors hover:bg-gray-100 hover:border-gray-300"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-600">
                <User className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">
                  {refund.customer_name || `Customer #${refund.customer_id}`}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {refund.customer_email || refund.customer_phone_number || `ID #${refund.customer_id}`}
                </div>
              </div>
              <span className="shrink-0 text-xs font-medium text-primary">View profile →</span>
            </button>

            {/* Refund Reason */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Refund Reason
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {refund.refund_reason || 'No reason provided'}
                </p>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card className={isDeciding ? 'border-2 border-primary' : ''}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Admin Notes
                  {isDeciding && <Badge variant="outline" className="ml-2">Editing</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isDeciding ? (
                  <div className="space-y-2">
                    <Label htmlFor="admin_notes" className="text-sm text-gray-600">
                      {decision === 'approve' ? 'Add a note about this approval (optional)' : 'Why are you rejecting this request? (recommended)'}
                    </Label>
                    <textarea
                      id="admin_notes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm resize-none"
                      placeholder={decision === 'approve' ? 'e.g., approved per policy, partial refund agreed with customer…' : 'e.g., outside the refund window, no-show, duplicate request…'}
                    />
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {refund.admin_notes || <span className="text-gray-400 italic">No admin notes</span>}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Metadata */}
            {refund.metadata && Object.keys(refund.metadata).length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Additional Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto">
                    {JSON.stringify(refund.metadata, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Timestamps */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500 pt-2 border-t">
              <span>Created: <span className="font-medium text-gray-700">{formatDate(refund.created_at)}</span></span>
              <span>Updated: <span className="font-medium text-gray-700">{formatDate(refund.updated_at)}</span></span>
              {refund.id && <span>Request ID: <span className="font-medium text-gray-700">#{refund.id}</span></span>}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {isDeciding ? (
                <>
                  <Button variant="outline" onClick={() => setDecision('none')} disabled={updating}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitDecision}
                    disabled={updating}
                    className={decision === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : decision === 'approve' ? (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    ) : (
                      <XCircle className="w-4 h-4 mr-2" />
                    )}
                    {decision === 'approve' ? `Approve & Refund ${formatCurrency(calculatedRefundAmount)}` : 'Reject Request'}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        customerId={refund?.customer_id?.toString() || null}
      />
    </Dialog>
  );
}
