// components/modals/RefundRequestDetailModal.tsx
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User, Mail, Phone, MapPin, DollarSign, Calendar,
  Receipt, CreditCard, FileText, AlertCircle, CheckCircle
} from 'lucide-react';
import { useRefundDetail } from '@/hooks/useRefunds';
import type { RefundRequest, RefundStatus } from '@/types/refund';
import ProcessRefundModal from './ProcessRefundModal';
import Link from 'next/link';

interface RefundRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundId: number | null;
  onUpdate?: () => void;
}

export default function RefundRequestDetailModal({
  isOpen,
  onClose,
  refundId,
  onUpdate
}: RefundRequestDetailModalProps) {
  const { refund, loading, error, refetch } = useRefundDetail(refundId);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

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
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending', icon: AlertCircle },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved', icon: CheckCircle },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected', icon: AlertCircle },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={`${config.bg} ${config.text} flex items-center gap-1 w-fit`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const handleProcessSuccess = () => {
    setIsProcessModalOpen(false);
    refetch();
    onUpdate?.();
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Refund Request Details
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
            <div className="space-y-6">
              {/* Header Section */}
              <div className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">Refund Request #{refund.id}</h3>
                    {getStatusBadge(refund.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Requested: {formatDate(refund.request_date)}</span>
                    </div>
                    {refund.processed_at && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Processed: {formatDate(refund.processed_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {refund.status === 'pending' && (
                  <Button onClick={() => setIsProcessModalOpen(true)}>
                    Process Refund
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Name</div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{refund.customer_name}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Email</div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{refund.customer_email}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Phone</div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{refund.customer_phone_number}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Address</div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-sm">{refund.customer_address}</span>
                      </div>
                    </div>
                    <div className="pt-2">
                      <Link href={`/customers?id=${refund.customer_id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          View Customer Profile
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Refund Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      Refund Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Booking ID</div>
                      <div className="flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-gray-500" />
                        <Link href={`/bookings?id=${refund.booking_id}`} className="text-sm text-primary hover:underline">
                          #{refund.booking_id}
                        </Link>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Original Amount</div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(refund.amount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Refund Percentage</div>
                      <div className="text-xl font-semibold text-primary">
                        {refund.refund_percentage}%
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Refund Amount</div>
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency((refund.amount * refund.refund_percentage) / 100)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Payment Transaction ID</div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-mono">#{refund.payment_transaction_id}</span>
                      </div>
                    </div>
                    {refund.stripe_refund_id && (
                      <div>
                        <div className="text-sm font-medium mb-1">Stripe Refund ID</div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-gray-500" />
                          <span className="text-xs font-mono">{refund.stripe_refund_id}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Refund Reason */}
              <Card>
                <CardHeader>
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
              {refund.admin_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Admin Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {refund.admin_notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Metadata */}
              {refund.metadata && Object.keys(refund.metadata).length > 0 && (
                <Card>
                  <CardHeader>
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Process Refund Modal */}
      {refund && (
        <ProcessRefundModal
          isOpen={isProcessModalOpen}
          onClose={() => setIsProcessModalOpen(false)}
          refund={refund}
          onSuccess={handleProcessSuccess}
        />
      )}
    </>
  );
}
