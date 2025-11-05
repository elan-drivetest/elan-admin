// components/forms/EditCouponForm.tsx
'use client';

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, X, DollarSign, Calendar } from 'lucide-react';
import { adminService } from '@/services/admin';
import type { AdminCoupon } from '@/types/admin';

const editCouponSchema = z.object({
  name: z.string().min(1, 'Coupon name is required').min(2, 'Name must be at least 2 characters'),
  description: z.string().min(1, 'Description is required'),
  code: z.string().min(1, 'Coupon code is required').min(3, 'Code must be at least 3 characters').toUpperCase(),
  discount: z.number().min(1, 'Discount amount is required').min(100, 'Minimum discount is $1.00'),
  is_recurrent: z.boolean(),
  is_failure_coupon: z.boolean(),
  min_purchase_amount: z.number().min(0, 'Minimum purchase amount must be positive'),
  start_date: z.string().min(1, 'Start date is required'),
  expires_at: z.string().min(1, 'Expiration date is required'),
}).refine((data) => {
  const startDate = new Date(data.start_date);
  const endDate = new Date(data.expires_at);
  return endDate > startDate;
}, {
  message: "Expiration date must be after start date",
  path: ["expires_at"],
});

type EditCouponFormData = z.infer<typeof editCouponSchema>;

interface EditCouponFormProps {
  coupon: AdminCoupon;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditCouponForm({ coupon, onSuccess, onCancel }: EditCouponFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<EditCouponFormData>({
    resolver: zodResolver(editCouponSchema),
    defaultValues: {
      name: coupon.name,
      description: coupon.description,
      code: coupon.code,
      discount: coupon.discount,
      is_recurrent: coupon.is_recurrent,
      is_failure_coupon: coupon.is_failure_coupon,
      min_purchase_amount: coupon.min_purchase_amount,
      start_date: new Date(coupon.start_date).toISOString().slice(0, 16),
      expires_at: new Date(coupon.expires_at).toISOString().slice(0, 16),
    },
  });

  const isRecurrent = watch('is_recurrent');
  const isFailureCoupon = watch('is_failure_coupon');

  const onSubmit: SubmitHandler<EditCouponFormData> = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const updateData = {
        ...data,
        start_date: new Date(data.start_date).toISOString(),
        expires_at: new Date(data.expires_at).toISOString(),
      };
      
      await adminService.updateCoupon(coupon.id.toString(), updateData);
      onSuccess();
      
    } catch (error: any) {
      console.error('Update coupon error:', error);
      setError(
        error?.response?.data?.message || 
        'Failed to update coupon. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatCentsInput = (value: string) => {
    const numValue = parseFloat(value) || 0;
    return Math.round(numValue * 100);
  };

  const formatCentsDisplay = (cents: number) => {
    return (cents / 100).toFixed(2);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium text-gray-700">
            Coupon Name
          </Label>
          <Input
            id="name"
            type="text"
            {...register('name')}
            className={errors.name ? 'border-red-500' : ''}
            disabled={isLoading}
          />
          {errors.name && (
            <p className="text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="code" className="text-sm font-medium text-gray-700">
            Coupon Code
          </Label>
          <Input
            id="code"
            type="text"
            {...register('code')}
            className={`font-mono ${errors.code ? 'border-red-500' : ''}`}
            disabled={isLoading}
          />
          {errors.code && (
            <p className="text-sm text-red-600">{errors.code.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium text-gray-700">
          Description
        </Label>
        <Input
          id="description"
          type="text"
          {...register('description')}
          className={errors.description ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      {/* Discount and Purchase Amount */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="discount" className="text-sm font-medium text-gray-700">
            Discount Amount (CAD)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="discount"
              type="number"
              step="0.01"
              min="1"
              onChange={(e) => setValue('discount', formatCentsInput(e.target.value))}
              defaultValue={formatCentsDisplay(watch('discount'))}
              className={`pl-10 ${errors.discount ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.discount && (
            <p className="text-sm text-red-600">{errors.discount.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="min_purchase_amount" className="text-sm font-medium text-gray-700">
            Minimum Purchase (CAD)
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="min_purchase_amount"
              type="number"
              step="0.01"
              min="0"
              onChange={(e) => setValue('min_purchase_amount', formatCentsInput(e.target.value))}
              defaultValue={formatCentsDisplay(watch('min_purchase_amount'))}
              className={`pl-10 ${errors.min_purchase_amount ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.min_purchase_amount && (
            <p className="text-sm text-red-600">{errors.min_purchase_amount.message}</p>
          )}
        </div>
      </div>

      {/* Date Range */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="start_date" className="text-sm font-medium text-gray-700">
            Start Date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="start_date"
              type="datetime-local"
              {...register('start_date')}
              className={`pl-10 ${errors.start_date ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.start_date && (
            <p className="text-sm text-red-600">{errors.start_date.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expires_at" className="text-sm font-medium text-gray-700">
            Expiration Date
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="expires_at"
              type="datetime-local"
              {...register('expires_at')}
              className={`pl-10 ${errors.expires_at ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.expires_at && (
            <p className="text-sm text-red-600">{errors.expires_at.message}</p>
          )}
        </div>
      </div>

      {/* Coupon Options */}
      <div className="space-y-4">
        <h4 className="font-medium text-gray-700">Coupon Options</h4>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isRecurrent}
              onCheckedChange={(checked) => setValue('is_recurrent', !!checked)}
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Recurring Coupon</span>
          </label>
          
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isFailureCoupon}
              onCheckedChange={(checked) => setValue('is_failure_coupon', !!checked)}
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Failure Coupon</span>
          </label>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || !isDirty}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
        
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
      </div>
    </form>
  );
}