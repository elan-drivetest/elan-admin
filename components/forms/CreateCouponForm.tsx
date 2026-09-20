// components/forms/CreateCouponForm.tsx
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FormErrorAlert from '@/components/ui/form-error-alert';
import { Loader2, Gift, ArrowLeft, DollarSign, Percent, Calendar } from 'lucide-react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import type { CreateCouponRequest } from '@/types/admin';

const createCouponSchema = z.object({
  name: z.string().min(1, 'Coupon name is required').min(2, 'Name must be at least 2 characters'),
  description: z.string().min(1, 'Description is required'),
  code: z.string().min(1, 'Coupon code is required').min(3, 'Code must be at least 3 characters').toUpperCase(),
  // Units depend on discount_type: CENTS for 'fixed', WHOLE PERCENT for 'percentage'.
  discount: z.number().min(1, 'Discount amount is required'),
  discount_type: z.enum(['fixed', 'percentage']),
  is_recurrent: z.boolean(),
  is_failure_coupon: z.boolean(),
  min_purchase_amount: z.number().min(0, 'Minimum purchase amount must be positive'),
  /**
   * Activation is a two-state choice, not a date the admin has to reason about.
   *
   * 'now' sends `activate_now: true` and no `start_date` at all. The server
   * rejects any past `start_date`, and a picker's "today" is midnight — which
   * for a bare date is midnight UTC, i.e. 8pm yesterday in Toronto. Every such
   * value is in the past, so the earliest start an admin could previously get
   * accepted was tomorrow and coupons took 24 hours to go live.
   */
  activation: z.enum(['now', 'scheduled']),
  start_date: z.string(),
  // Optional — a blank expiry means the coupon never expires.
  expires_at: z.string().optional(),
}).refine(
  (data) => data.activation === 'now' || data.start_date.trim() !== '',
  { message: 'Pick the date and time this coupon should start.', path: ['start_date'] },
).refine(
  // Mirrors the server: a scheduled start must be in the future. "Now" is the
  // other branch, not a date you can type.
  (data) =>
    data.activation === 'now' ||
    !data.start_date ||
    new Date(data.start_date).getTime() > Date.now(),
  {
    message: 'That start time has already passed. Choose "Start immediately" or a future time.',
    path: ['start_date'],
  },
).refine((data) => {
  if (!data.expires_at) return true; // no expiry is allowed
  // Against the real start: for an immediate coupon that is now, not a field.
  const start = data.activation === 'now' ? new Date() : new Date(data.start_date);
  return new Date(data.expires_at) > start;
}, {
  message: "Expiration date must be after the start",
  path: ["expires_at"],
}).refine(
  (data) => data.discount_type !== 'percentage' || data.discount <= 100,
  { message: 'A percentage discount cannot exceed 100%', path: ['discount'] },
).refine(
  (data) => data.discount_type !== 'fixed' || data.discount >= 100,
  { message: 'Minimum fixed discount is $1.00', path: ['discount'] },
);

type CreateCouponFormData = z.infer<typeof createCouponSchema>;

interface CreateCouponFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateCouponForm({ onSuccess, onCancel }: CreateCouponFormProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessages, setErrorMessages] = React.useState<string[]>([]);
  const [success, setSuccess] = React.useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateCouponFormData>({
    resolver: zodResolver(createCouponSchema),
      defaultValues: {
      name: '',
      description: '',
      code: '',
      discount: 1000, // $10.00 in cents (default type is 'fixed')
      discount_type: 'fixed',
      is_recurrent: false,
      is_failure_coupon: false,
      min_purchase_amount: 0,
      // Immediate is the default: it is what an admin creating a promo almost
      // always wants, and the only start that is live the moment they save.
      activation: 'now',
      start_date: '',
      expires_at: '',
    },
  });

  const activation = watch('activation');
  const isScheduled = activation === 'scheduled';
  const isRecurrent = watch('is_recurrent');
  const isFailureCoupon = watch('is_failure_coupon');
  const discountType = watch('discount_type');
  // The pricing engine treats every failed-test coupon as a percentage
  // regardless of discount_type, so force the input to match what will happen.
  const isPercentage = discountType === 'percentage' || isFailureCoupon;

  React.useEffect(() => {
    if (isFailureCoupon && discountType !== 'percentage') {
      setValue('discount_type', 'percentage');
    }
  }, [isFailureCoupon, discountType, setValue]);

  const onSubmit: SubmitHandler<CreateCouponFormData> = async (data) => {
    try {
      setIsLoading(true);
      setErrorMessages([]);

      const { activation: _activation, start_date, ...rest } = data;

      // `activate_now` wins over `start_date` server-side, but send only one so
      // the request says plainly which branch was chosen.
      const couponData: CreateCouponRequest = {
        ...rest,
        ...(isScheduled
          ? { start_date: new Date(start_date).toISOString() }
          : { activate_now: true }),
        expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : undefined,
      };

      await adminService.createCoupon(couponData);
      
      setSuccess(true);
      reset();
      
      setTimeout(() => {
        setSuccess(false);
        onSuccess?.();
      }, 2000);
      
    } catch (error: any) {
      console.error('Create coupon error:', error);
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
            placeholder="Enter coupon name"
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
          <div className="relative">
            <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="code"
              type="text"
              placeholder="WELCOME10"
              {...register('code')}
              className={`pl-10 font-mono ${errors.code ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
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
          placeholder="Enter coupon description"
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
              setValue('discount_type', value);
              // The stored number changes meaning entirely, so reset it to a
              // sensible default for the new unit instead of reinterpreting
              // 1000 cents as 1000 percent.
              setValue('discount', value === 'percentage' ? 10 : 1000);
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
              min={isPercentage ? '1' : '1'}
              max={isPercentage ? '100' : undefined}
              placeholder={isPercentage ? '10' : '10.00'}
              key={isPercentage ? 'pct' : 'fixed'}
              onChange={(e) =>
                setValue(
                  'discount',
                  isPercentage
                    ? Math.round(parseFloat(e.target.value) || 0)
                    : formatCentsInput(e.target.value),
                )
              }
              defaultValue={
                isPercentage
                  ? String(watch('discount') || 10)
                  : formatCentsDisplay(watch('discount') || 1000)
              }
              className={`pl-10 ${errors.discount ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          <p className="text-xs text-gray-500">
            {isPercentage
              ? 'Percent taken off the order total, after any long-trip credit.'
              : 'Flat amount off, capped at the order total.'}
          </p>
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
              placeholder="0.00"
              onChange={(e) => setValue('min_purchase_amount', formatCentsInput(e.target.value))}
              defaultValue={formatCentsDisplay(watch('min_purchase_amount') || 0)}
              className={`pl-10 ${errors.min_purchase_amount ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.min_purchase_amount && (
            <p className="text-sm text-red-600">{errors.min_purchase_amount.message}</p>
          )}
        </div>
      </div>

      {/* Activation */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">Activation</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {([
            {
              value: 'now' as const,
              title: 'Start immediately',
              detail: 'Customers can use the code as soon as you save.',
            },
            {
              value: 'scheduled' as const,
              title: 'Schedule for later',
              detail: 'Pick the exact date and time it goes live.',
            },
          ]).map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer gap-3 rounded-lg border p-3 transition-colors ${
                activation === option.value
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="activation"
                value={option.value}
                checked={activation === option.value}
                onChange={() => setValue('activation', option.value)}
                disabled={isLoading}
                className="mt-0.5 h-4 w-4 accent-primary"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">{option.title}</span>
                <span className="block text-xs text-gray-500">{option.detail}</span>
              </span>
            </label>
          ))}
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
              disabled={isLoading || !isScheduled}
            />
          </div>
          {isScheduled ? (
            errors.start_date && (
              <p className="text-sm text-red-600">{errors.start_date.message}</p>
            )
          ) : (
            <p className="text-xs text-gray-500">
              Not needed — the coupon starts the moment you save it.
            </p>
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
            {/* Off is once IN TOTAL, across all customers — not once each. An
                easy thing to misread when creating a promo. */}
            <span className="text-xs text-gray-500">
              (Off = the code can be redeemed <strong>once in total</strong>, by whoever uses it
              first — not once per customer)
            </span>
          </label>
          
          <label className="flex items-center gap-2">
            <Checkbox
              checked={isFailureCoupon}
              onCheckedChange={(checked) => setValue('is_failure_coupon', !!checked)}
              disabled={isLoading}
            />
            <span className="text-sm text-gray-700">Failure Coupon</span>
            <span className="text-xs text-gray-500">(Special discount for customers who failed their test)</span>
          </label>
        </div>
      </div>

      {/* Success Alert */}
      {success && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            Coupon created successfully! Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {/* Error Alert */}
      <FormErrorAlert messages={errorMessages} />

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          disabled={isLoading || success}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Coupon...
            </>
          ) : (
            <>
              <Gift className="mr-2 h-4 w-4" />
              Create Coupon
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}