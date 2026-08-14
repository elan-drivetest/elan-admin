// components/forms/ProcessRefundForm.tsx
'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormErrorAlert from '@/components/ui/form-error-alert';
import { Loader2, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useUpdateRefund } from '@/hooks/useRefunds';
import { getApiErrorMessages, formatCAD } from '@/lib/utils';
import { previewRefund } from '@/lib/utils/refund-calculations';
import RefundPolicyNote from '@/components/refunds/RefundPolicyNote';
import { RefundRequest, RefundStatus } from '@/types/refund';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const processRefundSchema = z.object({
  status: z.enum(['approved', 'rejected'] as const, {
    required_error: 'Please select a status',
  }),
  refund_percentage: z.number()
    .min(0, 'Refund percentage must be at least 0%')
    .max(100, 'Refund percentage cannot exceed 100%'),
  admin_notes: z.string().optional(),
});

type ProcessRefundFormData = z.infer<typeof processRefundSchema>;

interface ProcessRefundFormProps {
  refund: RefundRequest;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ProcessRefundForm({ refund, onSuccess, onCancel }: ProcessRefundFormProps) {
  const { updateRefund, loading } = useUpdateRefund();
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProcessRefundFormData>({
    resolver: zodResolver(processRefundSchema),
    defaultValues: {
      status: 'approved',
      refund_percentage: refund.refund_percentage,
      admin_notes: '',
    },
  });

  const selectedStatus = watch('status');
  const refundPercentage = watch('refund_percentage');

  const formatCurrency = (amount: number) => formatCAD(amount, { suffix: false });

  // `refund.amount` is already floor(booking_total * refund_percentage / 100).
  // Re-applying the percentage here halved every partial refund; previewRefund
  // reconstructs the booking total and re-floors exactly like the server does.
  const preview = previewRefund(refund, refundPercentage);

  const onSubmit: SubmitHandler<ProcessRefundFormData> = async (data) => {
    try {
      setErrorMessages([]);

      // Use id if available, otherwise fallback to booking_id
      const refundIdentifier = refund.id ?? refund.booking_id;

      const result = await updateRefund(refundIdentifier, {
        status: data.status,
        refund_percentage: data.refund_percentage,
        admin_notes: data.admin_notes || undefined,
      });

      if (result) {
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Process refund error:', err);
      setErrorMessages(getApiErrorMessages(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Refund Summary */}
      <Card className="bg-gray-50">
        <CardHeader>
          <CardTitle className="text-base">Refund Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Customer:</span>
            <span className="text-sm font-medium">{refund.customer_name}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Booking ID:</span>
            <span className="text-sm font-medium">#{refund.booking_id}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Booking total:</span>
            <span className="text-sm font-medium">
              {formatCurrency(preview.bookingTotal)}
              {!preview.exact && <span className="text-gray-400"> (approx.)</span>}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              Requested refund ({refund.refund_percentage}%):
            </span>
            <span className="text-sm font-medium">{formatCurrency(refund.amount)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-semibold">
              Refund at {refundPercentage}%:
            </span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(preview.amount)}
            </span>
          </div>
          {!preview.exact && (
            <p className="text-xs text-gray-500">
              The booking total is not included in the refund payload, so this
              override is estimated to within a cent. The server recomputes the
              exact amount from the booking when you approve.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Decision */}
      <div className="space-y-2">
        <Label htmlFor="status" className="text-sm font-medium">
          Decision <span className="text-red-500">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setValue('status', 'approved')}
            className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
              selectedStatus === 'approved'
                ? 'border-green-500 bg-green-50 text-green-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Approve</span>
          </button>
          <button
            type="button"
            onClick={() => setValue('status', 'rejected')}
            className={`flex items-center justify-center gap-2 p-4 border-2 rounded-lg transition-all ${
              selectedStatus === 'rejected'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <XCircle className="w-5 h-5" />
            <span className="font-medium">Reject</span>
          </button>
        </div>
        {errors.status && (
          <p className="text-sm text-red-600">{errors.status.message}</p>
        )}
      </div>

      {/* Refund Percentage */}
      {selectedStatus === 'approved' && (
        <div className="space-y-2">
          <Label htmlFor="refund_percentage" className="text-sm font-medium">
            Refund Percentage (%) <span className="text-red-500">*</span>
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="refund_percentage"
              type="number"
              step="1"
              min="0"
              max="100"
              {...register('refund_percentage', { valueAsNumber: true })}
              className="pl-10"
              disabled={loading}
            />
          </div>
          <div className="text-sm text-gray-600">
            Refund Amount: <span className="font-medium text-green-600">{formatCurrency(preview.amount)}</span>
          </div>
          <RefundPolicyNote
            testDate={refund.booking_test_date}
            requestDate={refund.request_date}
            storedPercentage={refund.refund_percentage}
          />
          {errors.refund_percentage && (
            <p className="text-sm text-red-600">{errors.refund_percentage.message}</p>
          )}
        </div>
      )}

      {/* Admin Notes */}
      <div className="space-y-2">
        <Label htmlFor="admin_notes" className="text-sm font-medium">
          Admin Notes
        </Label>
        <textarea
          id="admin_notes"
          {...register('admin_notes')}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
          placeholder="Add any notes about this decision..."
          disabled={loading}
        />
        {errors.admin_notes && (
          <p className="text-sm text-red-600">{errors.admin_notes.message}</p>
        )}
      </div>

      {/* Error Message */}
      <FormErrorAlert messages={errorMessages} />

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className={selectedStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              {selectedStatus === 'approved' ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Approve Refund
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Refund
                </>
              )}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
