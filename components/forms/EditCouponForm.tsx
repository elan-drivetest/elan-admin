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
import FormErrorAlert from '@/components/ui/form-error-alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Save, X, DollarSign, Percent, Calendar } from 'lucide-react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import type { AdminCoupon, UpdateCouponRequest } from '@/types/admin';

/**
 * An API date as a `datetime-local` value, in the admin's LOCAL time, or '' if absent.
 *
 * `toISOString().slice(0, 16)` looks right and is not: it yields UTC, which a
 * `datetime-local` input then reads as local. Round-tripping through this form
 * shifted every coupon's start and expiry by the timezone offset — four hours
 * earlier in Toronto — on every single save.
 */
function toDatetimeLocal(value?: string | null): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const editCouponSchema = z.object({
  name: z.string().min(1, 'Coupon name is required').min(2, 'Name must be at least 2 characters'),
  description: z.string().min(1, 'Description is required'),
  code: z.string().min(1, 'Coupon code is required').min(3, 'Code must be at least 3 characters').toUpperCase(),
  // Units depend on discount_type: CENTS for 'fixed', WHOLE PERCENT for 'percentage'.
  discount: z.number().min(1, 'Discount amount is required'),
  discount_type: z.enum(['fixed', 'percentage']),
  is_recurrent: z.boolean(),
  is_failure_coupon: z.boolean(),
  min_purchase_amount: z.number().min(0, 'Minimum purchase amount must be positive'),
  start_date: z.string().min(1, 'Start date is required'),
  // Optional — a blank expiry means the coupon never expires.
  expires_at: z.string().optional(),
}).refine((data) => {
  if (!data.expires_at) return true;
  return new Date(data.expires_at) > new Date(data.start_date);
}, {
  message: "Expiration date must be after start date",
  path: ["expires_at"],
}).refine(
  (data) => data.discount_type !== 'percentage' || data.discount <= 100,
  { message: 'A percentage discount cannot exceed 100%', path: ['discount'] },
).refine(
  (data) => data.discount_type !== 'fixed' || data.discount >= 100,
  { message: 'Minimum fixed discount is $1.00', path: ['discount'] },
);

type EditCouponFormData = z.infer<typeof editCouponSchema>;

interface EditCouponFormProps {
  coupon: AdminCoupon;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditCouponForm({ coupon, onSuccess, onCancel }: EditCouponFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);

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
      // Rows created before discount_type existed behave as 'fixed' server-side.
      discount_type: coupon.discount_type ?? 'fixed',
      is_recurrent: coupon.is_recurrent,
      is_failure_coupon: coupon.is_failure_coupon,
      min_purchase_amount: coupon.min_purchase_amount,
      // Guard against null/invalid dates — backend allows a null expiry.
      start_date: toDatetimeLocal(coupon.start_date),
      expires_at: toDatetimeLocal(coupon.expires_at),
    },
  });

  /**
   * A coupon whose start has not arrived yet can be brought forward with
   * `activate_now` — the panel does not have to guess a timestamp that the
   * server will accept as "now".
   */
  const startsInFuture = React.useMemo(() => {
    const start = new Date(coupon.start_date);
    return !isNaN(start.getTime()) && start.getTime() > Date.now();
  }, [coupon.start_date]);
  const [activateNow, setActivateNow] = React.useState(false);

  const isRecurrent = watch('is_recurrent');
  const isFailureCoupon = watch('is_failure_coupon');
  const discountType = watch('discount_type');
  // The pricing engine treats every failed-test coupon as a percentage
  // regardless of discount_type, so the input must match what will happen.
  const isPercentage = discountType === 'percentage' || isFailureCoupon;

  React.useEffect(() => {
    if (isFailureCoupon && discountType !== 'percentage') {
      setValue('discount_type', 'percentage', { shouldDirty: true });
    }
  }, [isFailureCoupon, discountType, setValue]);

  const onSubmit: SubmitHandler<EditCouponFormData> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessages([]);

      const updateData: UpdateCouponRequest = {
        ...data,
        // `activate_now` overrides start_date server-side; send it alone so the
        // request reads as the choice that was made.
        ...(activateNow
          ? { activate_now: true, start_date: undefined }
          : { start_date: new Date(data.start_date).toISOString() }),
        // NULL, not undefined. Since the partial-update fix an omitted key is
        // left alone, so sending `undefined` to clear an expiry silently keeps
        // the old one. `null` is the value that means "never expires".
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
      };

      await adminService.updateCoupon(coupon.id.toString(), updateData);
      onSuccess();
      
    } catch (error: any) {
      console.error('Update coupon error:', error);
      setErrorMessages(getApiErrorMessages(error));
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
          <Label htmlFor="discount_type" className="text-sm font-medium text-gray-700">
            Discount Type
          </Label>
          <Select
            value={isPercentage ? 'percentage' : 'fixed'}
            onValueChange={(value: 'fixed' | 'percentage') => {
              setValue('discount_type', value, { shouldDirty: true });
              // Switching units changes what the number means — reset rather than
              // reinterpret an existing 1000 cents as 1000 percent.
              setValue('discount', value === 'percentage' ? 10 : 1000, {
                shouldDirty: true,
              });
            }}
            disabled={isLoading || isFailureCoupon}
          >
            <SelectTrigger id="discount_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fixed">Fixed amount off (CAD)</SelectItem>
              <SelectItem value="percentage">Percentage off (%)</SelectItem>
            </SelectContent>
          </Select>
          {isFailureCoupon && (
            <p className="text-xs text-gray-500">
              Failed-test coupons are always applied as a percentage.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="discount" className="text-sm font-medium text-gray-700">
            {isPercentage ? 'Discount Percentage (%)' : 'Discount Amount (CAD)'}
          </Label>
          <div className="relative">
            {isPercentage ? (
              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            ) : (
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            )}
            <Input
              id="discount"
              type="number"
              step={isPercentage ? '1' : '0.01'}
              min="1"
              max={isPercentage ? '100' : undefined}
              key={isPercentage ? 'pct' : 'fixed'}
              onChange={(e) =>
                setValue(
                  'discount',
                  isPercentage
                    ? Math.round(parseFloat(e.target.value) || 0)
                    : formatCentsInput(e.target.value),
                  { shouldDirty: true },
                )
              }
              defaultValue={
                isPercentage
                  ? String(watch('discount'))
                  : formatCentsDisplay(watch('discount'))
              }
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
              disabled={isLoading || activateNow}
            />
          </div>
          {errors.start_date && !activateNow && (
            <p className="text-sm text-red-600">{errors.start_date.message}</p>
          )}

          {/* A scheduled coupon can be brought forward without inventing a
              timestamp the server will accept as "now". */}
          {startsInFuture && (
            <label className="mt-1 flex items-start gap-2 rounded-md border border-primary/20 bg-primary/5 p-2.5">
              <Checkbox
                checked={activateNow}
                onCheckedChange={(checked) => setActivateNow(!!checked)}
                disabled={isLoading}
                className="mt-0.5"
              />
              <span className="text-xs leading-relaxed text-gray-700">
                <span className="font-medium text-gray-900">Start this coupon now</span>
                <br />
                It is scheduled for {new Date(coupon.start_date).toLocaleString()}. Tick this and
                save to make it usable immediately.
              </span>
            </label>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="expires_at" className="text-sm font-medium text-gray-700">
            Expiration Date <span className="text-gray-400 font-normal">(optional — leave blank for no expiry)</span>
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
            <span className="text-sm text-gray-700">Reusable</span>
            {/* Off is once IN TOTAL, across all customers — not once each. */}
            <span className="text-xs text-gray-500">
              (Off = redeemable <strong>once in total</strong>, by whoever uses it first)
            </span>
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
      <FormErrorAlert messages={errorMessages} />

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          // `activateNow` lives outside the form, so it does not move isDirty —
          // without it, ticking "Start this coupon now" alone leaves Save dead.
          disabled={isLoading || (!isDirty && !activateNow)}
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