// components/forms/ProcessRefundForm.tsx
'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, DollarSign, CheckCircle, XCircle } from 'lucide-react';
import { useUpdateRefund } from '@/hooks/useRefunds';
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
  const [error, setError] = React.useState<string | null>(null);

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

  const formatCurrency = (amount: number) => `$${(amount / 100).toFixed(2)}`;

  const calculatedRefundAmount = (refund.amount * refundPercentage) / 100;

  const onSubmit: SubmitHandler<ProcessRefundFormData> = async (data) => {
    try {
      setError(null);

      const result = await updateRefund(refund.id, {
        status: data.status,
        refund_percentage: data.refund_percentage,
        admin_notes: data.admin_notes || undefined,
      });

      if (result) {
        onSuccess?.();
      }
    } catch (err: any) {
      console.error('Process refund error:', err);
      setError(
        err?.response?.data?.message ||
        'Failed to process refund. Please try again.'
      );
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
            <span className="text-sm text-gray-600">Original Amount:</span>
            <span className="text-sm font-medium">{formatCurrency(refund.amount)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t">
            <span className="text-sm font-semibold">Refund Amount:</span>
            <span className="text-lg font-bold text-green-600">
              {formatCurrency(calculatedRefundAmount)}
            </span>
          </div>
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
            Refund Amount: <span className="font-medium text-green-600">{formatCurrency(calculatedRefundAmount)}</span>
          </div>
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
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

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
