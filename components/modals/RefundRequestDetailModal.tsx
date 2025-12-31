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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  User, Mail, Phone, MapPin, DollarSign, Calendar,
  Receipt, CreditCard, FileText, AlertCircle, CheckCircle,
  Edit2, X, Save, Loader2
} from 'lucide-react';
import { useRefundDetail, useUpdateRefund } from '@/hooks/useRefunds';
import type { RefundStatus } from '@/types/refund';
import Link from 'next/link';
import { toast } from 'sonner';

interface RefundRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  refundId: number | null;
  onUpdate?: () => void;
}

const STATUS_OPTIONS: { value: RefundStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-yellow-500' },
  { value: 'approved', label: 'Approved', color: 'bg-green-500' },
  { value: 'rejected', label: 'Rejected', color: 'bg-red-500' },
  { value: 'processing', label: 'Processing', color: 'bg-purple-500' },
  { value: 'completed', label: 'Completed', color: 'bg-blue-500' },
  { value: 'failed', label: 'Failed', color: 'bg-red-700' },
];

export default function RefundRequestDetailModal({
  isOpen,
  onClose,
  refundId,
  onUpdate
}: RefundRequestDetailModalProps) {
  const { refund, loading, error, refetch } = useRefundDetail(refundId);
  const { updateRefund, loading: updating } = useUpdateRefund();

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editStatus, setEditStatus] = useState<RefundStatus>('pending');
  const [editPercentage, setEditPercentage] = useState(100);
  const [editNotes, setEditNotes] = useState('');

  // Initialize edit form when refund data loads
  useEffect(() => {
    if (refund) {
      setEditStatus(refund.status);
      setEditPercentage(refund.refund_percentage);
      setEditNotes(refund.admin_notes || '');
    }
  }, [refund]);

  // Reset edit mode when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditMode(false);
    }
  }, [isOpen]);

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

  const handleSave = async () => {
    if (!refund) return;

    // Use id if available, otherwise fallback to booking_id
    const refundIdentifier = refund.id ?? refund.booking_id;

    const result = await updateRefund(refundIdentifier, {
      status: editStatus,
      refund_percentage: editPercentage,
      admin_notes: editNotes || undefined,
    });

    if (result) {
      setIsEditMode(false);
      refetch();
      onUpdate?.();
      toast.success('Refund request updated successfully');
    }
  };

  const handleCancelEdit = () => {
    if (refund) {
      setEditStatus(refund.status);
      setEditPercentage(refund.refund_percentage);
      setEditNotes(refund.admin_notes || '');
    }
    setIsEditMode(false);
  };

  const calculatedRefundAmount = refund ? (refund.amount * editPercentage) / 100 : 0;

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Refund Request Details
            </div>
            {refund && !loading && (
              <div className="flex items-center gap-2">
                {isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      disabled={updating}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updating}
                    >
                      {updating ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-1" />
                      )}
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            )}
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
                  <h3 className="text-xl font-semibold">
                    {refund.id ? `Refund Request #${refund.id}` : `Booking #${refund.booking_id} Refund`}
                  </h3>
                  {isEditMode ? (
                    <Select value={editStatus} onValueChange={(value) => setEditStatus(value as RefundStatus)}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${option.color}`} />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    getStatusBadge(refund.status)
                  )}
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
                    <div className="text-sm font-medium mb-1">Customer ID</div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-mono">#{refund.customer_id}</span>
                    </div>
                  </div>
                  {refund.customer_name && (
                    <div>
                      <div className="text-sm font-medium mb-1">Name</div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{refund.customer_name}</span>
                      </div>
                    </div>
                  )}
                  {refund.customer_email && (
                    <div>
                      <div className="text-sm font-medium mb-1">Email</div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{refund.customer_email}</span>
                      </div>
                    </div>
                  )}
                  {refund.customer_phone_number && (
                    <div>
                      <div className="text-sm font-medium mb-1">Phone</div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-500" />
                        <span className="text-sm">{refund.customer_phone_number}</span>
                      </div>
                    </div>
                  )}
                  {refund.customer_address && (
                    <div>
                      <div className="text-sm font-medium mb-1">Address</div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-sm">{refund.customer_address}</span>
                      </div>
                    </div>
                  )}
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
                <CardContent className="space-y-4">
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

                  {/* Refund Percentage - Editable */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Refund Percentage</div>
                      <div className="text-xl font-semibold text-primary">
                        {isEditMode ? editPercentage : refund.refund_percentage}%
                      </div>
                    </div>

                    {isEditMode ? (
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

                  {/* Calculated Refund Amount */}
                  <div className={`p-4 rounded-lg ${isEditMode ? 'bg-green-50 border-2 border-green-200' : 'bg-gray-50'}`}>
                    <div className="text-sm font-medium mb-1">
                      {isEditMode ? 'New Refund Amount' : 'Refund Amount'}
                    </div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(isEditMode ? calculatedRefundAmount : (refund.amount * refund.refund_percentage) / 100)}
                    </div>
                    {isEditMode && editPercentage !== refund.refund_percentage && (
                      <div className="text-xs text-gray-500 mt-1">
                        Original: {formatCurrency((refund.amount * refund.refund_percentage) / 100)}
                      </div>
                    )}
                  </div>

                  {refund.payment_transaction_id && (
                    <div>
                      <div className="text-sm font-medium mb-1">Payment Transaction ID</div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-mono">#{refund.payment_transaction_id}</span>
                      </div>
                    </div>
                  )}

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

            {/* Admin Notes - Editable */}
            <Card className={isEditMode ? 'border-2 border-primary' : ''}>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Admin Notes
                  {isEditMode && <Badge variant="outline" className="ml-2">Editing</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <div className="space-y-2">
                    <Label htmlFor="admin_notes" className="text-sm text-gray-600">
                      Add notes about this refund decision
                    </Label>
                    <textarea
                      id="admin_notes"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm resize-none"
                      placeholder="Enter admin notes here... (e.g., reason for approval/rejection, special circumstances, etc.)"
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

            {/* Quick Actions for Edit Mode */}
            {isEditMode && (
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-blue-800 mr-2">Quick Actions:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditStatus('approved');
                        setEditPercentage(100);
                      }}
                      className="bg-green-100 border-green-300 text-green-700 hover:bg-green-200"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Full Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditStatus('approved');
                        setEditPercentage(50);
                      }}
                      className="bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200"
                    >
                      50% Refund
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditStatus('rejected');
                        setEditPercentage(0);
                      }}
                      className="bg-red-100 border-red-300 text-red-700 hover:bg-red-200"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Reject
                    </Button>
                  </div>
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
  );
}
