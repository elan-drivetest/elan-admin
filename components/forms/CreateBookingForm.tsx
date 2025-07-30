// components/forms/CreateBookingForm.tsx
'use client';

import React, { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, MapPin, Calendar, DollarSign, FileText } from 'lucide-react';
import { adminService } from '@/services/admin';
import type { CreateBookingRequest } from '@/types/admin';

const createBookingSchema = z.object({
  user_id: z.number().min(1, 'Customer ID is required'),
  test_center_id: z.number().min(1, 'Test center is required'),
  test_type: z.enum(['G2', 'G'], { required_error: 'Test type is required' }),
  test_date: z.string().min(1, 'Test date is required'),
  meet_at_center: z.boolean(),
  pickup_address: z.string().optional(),
  pickup_latitude: z.number().optional(),
  pickup_longitude: z.number().optional(),
  instructor_id: z.number().optional(),
  addon_id: z.number().optional(),
  coupon_code: z.string().optional(),
  road_test_doc_url: z.string().url().optional().or(z.literal('')),
  g1_license_doc_url: z.string().url().optional().or(z.literal('')),
  timezone: z.string(),
});

type CreateBookingFormData = z.infer<typeof createBookingSchema>;

interface CreateBookingFormProps {
  onSuccess?: (booking: any) => void;
  onCancel?: () => void;
}

const mockTestCenters = [
  { id: 1, name: 'Toronto Test Center', address: '123 Main Street, Toronto, ON' },
  { id: 2, name: 'Mississauga Test Center', address: '456 Queen Street, Mississauga, ON' },
  { id: 3, name: 'Markham Test Center', address: '789 King Street, Markham, ON' },
];

export default function CreateBookingForm({ onSuccess, onCancel }: CreateBookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateBookingFormData>({
    resolver: zodResolver(createBookingSchema),
    defaultValues: {
      user_id: 0,
      test_center_id: 0,
      test_type: 'G2',
      test_date: '',
      meet_at_center: true,
      pickup_address: '',
      pickup_latitude: undefined,
      pickup_longitude: undefined,
      instructor_id: undefined,
      addon_id: undefined,
      coupon_code: '',
      road_test_doc_url: '',
      g1_license_doc_url: '',
      timezone: 'America/Toronto',
    },
  });

  const meetAtCenter = watch('meet_at_center');
  const testType = watch('test_type');

  const onSubmit: SubmitHandler<CreateBookingFormData> = async (data) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Format the date to match API expectations: "2023-01-01 11:10:00"
      const formattedDate = data.test_date.replace('T', ' ') + ':00';
      
      const bookingData: CreateBookingRequest = {
        ...data,
        test_date: formattedDate,
        pickup_address: meetAtCenter ? undefined : data.pickup_address,
        pickup_latitude: meetAtCenter ? undefined : data.pickup_latitude,
        pickup_longitude: meetAtCenter ? undefined : data.pickup_longitude,
        road_test_doc_url: data.road_test_doc_url || undefined,
        g1_license_doc_url: data.g1_license_doc_url || undefined,
        coupon_code: data.coupon_code || undefined,
        addon_id: data.addon_id || undefined,
        instructor_id: data.instructor_id || undefined,
      };
      
      const newBooking = await adminService.createBooking(bookingData);
      onSuccess?.(newBooking);
      
    } catch (error: any) {
      console.error('Create booking error:', error);
      setError(
        error?.response?.data?.message || 
        'Failed to create booking. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Customer ID */}
      <div className="space-y-2">
        <Label htmlFor="user_id" className="text-sm font-medium text-gray-700">
          Customer ID
        </Label>
        <Input
          id="user_id"
          type="number"
          placeholder="Enter customer ID"
          {...register('user_id', { valueAsNumber: true })}
          className={errors.user_id ? 'border-red-500' : ''}
          disabled={isLoading}
        />
        {errors.user_id && (
          <p className="text-sm text-red-600">{errors.user_id.message}</p>
        )}
      </div>

      {/* Test Center Selection */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-gray-700">Test Center</Label>
        <Select onValueChange={(value) => setValue('test_center_id', parseInt(value))}>
          <SelectTrigger className={errors.test_center_id ? 'border-red-500' : ''}>
            <SelectValue placeholder="Select test center" />
          </SelectTrigger>
          <SelectContent>
            {mockTestCenters.map((center) => (
              <SelectItem key={center.id} value={center.id.toString()}>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium">{center.name}</p>
                    <p className="text-xs text-gray-500">{center.address}</p>
                  </div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.test_center_id && (
          <p className="text-sm text-red-600">{errors.test_center_id.message}</p>
        )}
      </div>

      {/* Test Type and Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-gray-700">Test Type</Label>
          <Select value={testType} onValueChange={(value) => setValue('test_type', value as 'G2' | 'G')}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="G2">G2 Road Test</SelectItem>
              <SelectItem value="G">G (Full) Road Test</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="test_date" className="text-sm font-medium text-gray-700">
            Test Date & Time
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="test_date"
              type="datetime-local"
              {...register('test_date')}
              className={`pl-10 ${errors.test_date ? 'border-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.test_date && (
            <p className="text-sm text-red-600">{errors.test_date.message}</p>
          )}
        </div>
      </div>

      {/* Pickup Options */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="meet_at_center"
            checked={meetAtCenter}
            onCheckedChange={(checked) => setValue('meet_at_center', !!checked)}
          />
          <Label htmlFor="meet_at_center" className="text-sm text-gray-700">
            Meet at test center
          </Label>
        </div>

        {!meetAtCenter && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pickup_address" className="text-sm font-medium text-gray-700">
                Pickup Address
              </Label>
              <Input
                id="pickup_address"
                type="text"
                placeholder="Enter pickup address"
                {...register('pickup_address')}
                disabled={isLoading}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pickup_latitude" className="text-sm font-medium text-gray-700">
                  Latitude
                </Label>
                <Input
                  id="pickup_latitude"
                  type="number"
                  step="any"
                  placeholder="43.6532"
                  {...register('pickup_latitude', { valueAsNumber: true })}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pickup_longitude" className="text-sm font-medium text-gray-700">
                  Longitude
                </Label>
                <Input
                  id="pickup_longitude"
                  type="number"
                  step="any"
                  placeholder="-79.3832"
                  {...register('pickup_longitude', { valueAsNumber: true })}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="instructor_id" className="text-sm font-medium text-gray-700">
            Instructor ID (Optional)
          </Label>
          <Input
            id="instructor_id"
            type="number"
            placeholder="Enter instructor ID"
            {...register('instructor_id', { valueAsNumber: true })}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="coupon_code" className="text-sm font-medium text-gray-700">
            Coupon Code (Optional)
          </Label>
          <Input
            id="coupon_code"
            type="text"
            placeholder="Enter coupon code"
            {...register('coupon_code')}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Document URLs */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="road_test_doc_url" className="text-sm font-medium text-gray-700">
            Road Test Document URL (Optional)
          </Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="road_test_doc_url"
              type="url"
              placeholder="https://example.com/document.pdf"
              {...register('road_test_doc_url')}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="g1_license_doc_url" className="text-sm font-medium text-gray-700">
            G1 License Document URL (Optional)
          </Label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              id="g1_license_doc_url"
              type="url"
              placeholder="https://example.com/license.pdf"
              {...register('g1_license_doc_url')}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
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
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Booking...
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Create Booking
            </>
          )}
        </Button>
        
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}