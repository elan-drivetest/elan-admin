// components/forms/CreateBookingForm.tsx - Fixed Confirmation Flow
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, X, AlertTriangle, Check, MapPin, Calendar, User } from 'lucide-react';
import { adminService } from '@/services/admin';
import SearchableSelect from '@/components/ui/SearchableSelect';
import FileUploader from '@/components/ui/FileUploader';
import { useAddons, useCustomers, useBookingInstructors } from '@/hooks/useAdmin';
import { bookingUtils } from '@/lib/utils/booking-calculations';
import TestCenterDropdownAdmin from '@/components/booking/TestCenterDropdownAdmin';
import LocationSelectionAdmin from '@/components/booking/LocationSelectionAdmin';
import AddOnSelectionAdmin from '@/components/booking/AddOnSelectionAdmin';
import PricingBreakdownAdmin from '@/components/booking/PricingBreakdownAdmin';
import CouponVerificationAdmin from '@/components/booking/CouponVerificationAdmin';
import type { CreateBookingRequest, TestCenter, Addon, CouponVerificationResponse } from '@/types/admin';

const createBookingSchema = z.object({
  user_id: z.number().min(1, 'Customer ID is required'),
  test_center_id: z.number().min(1, 'Test center is required'),
  test_type: z.enum(['G2', 'G'], { required_error: 'Test type is required' }),
  test_date: z.string().min(1, 'Test date is required'),
  meet_at_center: z.boolean(),
  pickup_address: z.string().optional(),
  pickup_latitude: z.number().optional(),
  pickup_longitude: z.number().optional(),
  pickup_distance: z.number().optional(),
  instructor_id: z.number().optional(),
  addon_id: z.number().optional(),
  coupon_code: z.string().optional(),
  road_test_doc_url: z.string().optional(),
  g1_license_doc_url: z.string().optional(),
  timezone: z.string(),
});

type CreateBookingFormData = z.infer<typeof createBookingSchema>;

interface CreateBookingFormProps {
  onSuccess?: (booking: any) => void;
  onError?: (error: string) => void;
  onLoading?: () => void;
  onCancel?: () => void;
}

export default function CreateBookingForm({ onSuccess, onError, onLoading, onCancel }: CreateBookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<CreateBookingFormData | null>(null);
  
  // Enhanced state management
  const [selectedTestCenter, setSelectedTestCenter] = useState<TestCenter | null>(null);
  const [locationOption, setLocationOption] = useState<'pickup' | 'test-centre'>('test-centre');
  const [pickupDistance, setPickupDistance] = useState<number | undefined>();
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponVerificationResponse | null>(null);

  // API hooks
  const { data: addons } = useAddons();
  const { data: customers, isLoading: customersLoading } = useCustomers();
  const { data: instructors, isLoading: instructorsLoading } = useBookingInstructors();

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
      timezone: 'America/Toronto',
    },
  });

  const testType = watch('test_type');

  // Calculate free perks based on distance
  const freePerks = pickupDistance ? bookingUtils.getDistancePerks(pickupDistance) : undefined;

  // Get selected customer name for confirmation
  const getSelectedCustomer = () => {
    const userId = watch('user_id');
    return customers.find(c => c.id === userId);
  };

  // Get selected instructor name for confirmation
  const getSelectedInstructor = () => {
    const instructorId = watch('instructor_id');
    return instructors.find(i => i.user_id === instructorId);
  };

  // Update form when location option changes
  useEffect(() => {
    setValue('meet_at_center', locationOption === 'test-centre');
    if (locationOption === 'test-centre') {
      setValue('pickup_address', undefined);
      setValue('pickup_latitude', undefined);
      setValue('pickup_longitude', undefined);
      setValue('pickup_distance', undefined);
      setPickupDistance(undefined);
    }
  }, [locationOption, setValue]);

  // Update form when test center changes
  useEffect(() => {
    if (selectedTestCenter) {
      setValue('test_center_id', selectedTestCenter.id);
    }
  }, [selectedTestCenter, setValue]);

  // Update form when addon changes
  useEffect(() => {
    setValue('addon_id', selectedAddon?.id);
  }, [selectedAddon, setValue]);

  // Update form when coupon changes
  useEffect(() => {
    setValue('coupon_code', appliedCoupon?.code || '');
  }, [appliedCoupon, setValue]);

  const handleLocationSelect = (location: {
    address: string;
    coordinates: { lat: number; lng: number };
    distance?: number;
  }) => {
    setValue('pickup_address', location.address);
    setValue('pickup_latitude', location.coordinates.lat);
    setValue('pickup_longitude', location.coordinates.lng);
    setValue('pickup_distance', location.distance);
    setPickupDistance(location.distance);
  };

  // Calculate total price for confirmation
  const calculateTotalPrice = () => {
    if (!selectedTestCenter) return 0;
    
    const basePrice = selectedTestCenter.base_price;
    const pickupPrice = pickupDistance ? bookingUtils.calculatePickupPrice(pickupDistance) : 0;
    const addonPrice = selectedAddon?.price || 0;
    const discountAmount = appliedCoupon?.discount || 0;
    
    return Math.max(0, basePrice + pickupPrice + addonPrice - discountAmount);
  };

  // FIXED: This handles form submission and shows confirmation modal FIRST
  const onSubmitHandler: SubmitHandler<CreateBookingFormData> = async (data) => {
    // Store form data and show confirmation modal BEFORE API call
    setFormDataToSubmit(data);
    setShowConfirmation(true);
  };

  // FIXED: This actually creates the booking AFTER user confirms
  const handleConfirmAndCreate = async () => {
    if (!formDataToSubmit) return;

    try {
      setShowConfirmation(false); // Close confirmation modal
      setIsLoading(true); // Set local loading
      onLoading?.(); // Trigger parent loading state
      setError(null);
      
      const formattedDate = formDataToSubmit.test_date.replace('T', ' ') + ':00';
      
      const bookingData: CreateBookingRequest = {
        ...formDataToSubmit,
        test_date: formattedDate,
        pickup_address: locationOption === 'test-centre' ? undefined : formDataToSubmit.pickup_address,
        pickup_latitude: locationOption === 'test-centre' ? undefined : formDataToSubmit.pickup_latitude,
        pickup_longitude: locationOption === 'test-centre' ? undefined : formDataToSubmit.pickup_longitude,
        pickup_distance: locationOption === 'test-centre' ? undefined : formDataToSubmit.pickup_distance,
        road_test_doc_url: formDataToSubmit.road_test_doc_url || undefined,
        g1_license_doc_url: formDataToSubmit.g1_license_doc_url || undefined,
        coupon_code: formDataToSubmit.coupon_code || undefined,
        addon_id: formDataToSubmit.addon_id || undefined,
        instructor_id: formDataToSubmit.instructor_id || undefined,
      };
      
      const newBooking = await adminService.createBooking(bookingData);
      onSuccess?.(newBooking);
      
    } catch (error: any) {
      console.error('Create booking error:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to create booking. Please try again.';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    setShowConfirmation(false);
    setFormDataToSubmit(null);
  };

  // Generate confirmation summary
  const generateConfirmationSummary = () => {
    const customer = getSelectedCustomer();
    const instructor = getSelectedInstructor();
    const totalPrice = calculateTotalPrice();

    return {
      customer: customer?.full_name || 'Unknown Customer',
      customerEmail: customer?.email || '',
      customerPhone: customer?.contact || '',
      testCenter: selectedTestCenter?.name || 'No test center selected',
      testCenterAddress: selectedTestCenter?.address || '',
      testType: watch('test_type'),
      testDate: new Date(watch('test_date')).toLocaleString(),
      location: locationOption === 'pickup' ? watch('pickup_address') || 'Pickup location' : 'Meet at test center',
      instructor: instructor?.fullName || 'No instructor assigned',
      addon: selectedAddon?.name || 'No add-on selected',
      coupon: appliedCoupon?.code || 'No coupon applied',
      couponDiscount: appliedCoupon ? bookingUtils.formatPrice(appliedCoupon.discount) : '',
      totalPrice: bookingUtils.formatPrice(totalPrice),
      freePerks: freePerks
    };
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-6">
            {/* Customer Selection */}
            <SearchableSelect
              label="Customer"
              options={customers.map(customer => ({
                id: customer.id,
                label: customer.full_name,
                subtitle: `${customer.email} • ${customer.contact}`
              }))}
              value={watch('user_id') || null}
              onSelect={(value) => setValue('user_id', value as number)}
              placeholder="Select a customer"
              required={true}
              isLoading={customersLoading}
              allowClear={false}
            />

            {/* Test Center Selection */}
            <div className="space-y-2">
              <Label>Test Center *</Label>
              <TestCenterDropdownAdmin
                selectedCenter={selectedTestCenter}
                onSelect={setSelectedTestCenter}
                placeholder="Select a test center"
              />
              {errors.test_center_id && (
                <p className="text-sm text-red-600">{errors.test_center_id.message}</p>
              )}
            </div>

            {/* Test Type & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Type *</Label>
                <Select value={testType} onValueChange={(value: 'G2' | 'G') => setValue('test_type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="G2">G2 Road Test</SelectItem>
                    <SelectItem value="G">G Road Test</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="test_date">Test Date & Time *</Label>
                <Input
                  id="test_date"
                  type="datetime-local"
                  {...register('test_date')}
                />
                {errors.test_date && (
                  <p className="text-sm text-red-600">{errors.test_date.message}</p>
                )}
              </div>
            </div>

            {/* Location Selection */}
            <LocationSelectionAdmin
              selectedOption={locationOption}
              onOptionChange={setLocationOption}
              onLocationSelect={handleLocationSelect}
              testCenter={selectedTestCenter || undefined}
            />

            {/* Add-on Selection */}
            <AddOnSelectionAdmin
              addons={addons}
              selectedAddon={selectedAddon}
              onAddonSelect={setSelectedAddon}
              testType={testType}
              freePerks={freePerks}
            />

            {/* Coupon Application */}
            <CouponVerificationAdmin
              onCouponApply={setAppliedCoupon}
              appliedCoupon={appliedCoupon}
            />

            {/* Instructor Selection */}
            <SearchableSelect
              label="Instructor (Optional)"
              options={instructors.map(instructor => ({
                id: instructor.user_id,
                label: instructor.fullName,
                subtitle: instructor.phoneNumber,
                badge: instructor.rating ? `★ ${instructor.rating.toFixed(1)}` : undefined
              }))}
              value={watch('instructor_id') || null}
              onSelect={(value) => setValue('instructor_id', value as number | undefined)}
              placeholder="Select an instructor (optional)"
              required={false}
              isLoading={instructorsLoading}
              allowClear={true}
            />

            {/* Document Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUploader
                label="Road Test Document"
                value={watch('road_test_doc_url') || ''}
                onUpload={(url) => setValue('road_test_doc_url', url)}
                acceptedTypes={['image/*', '.pdf']}
                required={true}
              />

              <FileUploader
                label={`${testType} License Document`}
                value={watch('g1_license_doc_url') || ''}
                onUpload={(url) => setValue('g1_license_doc_url', url)}
                acceptedTypes={['image/*', '.pdf']}
                required={true}
              />
            </div>

            {/* Error Display */}
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
                className="bg-green-600 hover:bg-green-700"
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
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Pricing Sidebar - Right Column */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <PricingBreakdownAdmin
              testCenter={selectedTestCenter || undefined}
              distance={pickupDistance}
              selectedAddon={selectedAddon || undefined}
              appliedCoupon={appliedCoupon || undefined}
              locationOption={locationOption}
              freePerks={freePerks}
            />
          </div>
        </div>
      </div>

      {/* FIXED: Confirmation Dialog - Shows BEFORE API call */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Confirm Booking Details
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>⚠️ Please review all details carefully before creating the booking.</strong>
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Once created, the customer will receive a confirmation email and the booking will be active in the system.
              </p>
            </div>

            {formDataToSubmit && (
              <div className="space-y-4">
                {(() => {
                  const summary = generateConfirmationSummary();
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Customer & Test Info */}
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <User className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">Customer</h4>
                            <p className="text-sm text-gray-600">{summary.customer}</p>
                            <p className="text-xs text-gray-500">{summary.customerEmail}</p>
                            <p className="text-xs text-gray-500">{summary.customerPhone}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">Test Details</h4>
                            <p className="text-sm text-gray-600">{summary.testType} Road Test</p>
                            <p className="text-xs text-gray-500">{summary.testDate}</p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-green-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-gray-900">Test Center</h4>
                            <p className="text-sm text-gray-600">{summary.testCenter}</p>
                            <p className="text-xs text-gray-500">{summary.testCenterAddress}</p>
                          </div>
                        </div>
                      </div>

                      {/* Booking Details */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900">Meeting Location</h4>
                          <p className="text-sm text-gray-600">{summary.location}</p>
                          {pickupDistance && (
                            <p className="text-xs text-gray-500">Distance: {pickupDistance.toFixed(1)}km</p>
                          )}
                        </div>

                        {summary.instructor !== 'No instructor assigned' && (
                          <div>
                            <h4 className="font-medium text-gray-900">Instructor</h4>
                            <p className="text-sm text-gray-600">{summary.instructor}</p>
                          </div>
                        )}

                        {summary.addon !== 'No add-on selected' && (
                          <div>
                            <h4 className="font-medium text-gray-900">Add-on</h4>
                            <p className="text-sm text-gray-600">{summary.addon}</p>
                          </div>
                        )}

                        {summary.coupon !== 'No coupon applied' && (
                          <div>
                            <h4 className="font-medium text-gray-900">Coupon Applied</h4>
                            <p className="text-sm text-gray-600">{summary.coupon}</p>
                            <p className="text-xs text-green-600">Discount: {summary.couponDiscount}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Free Perks */}
                {freePerks && (freePerks.free_dropoff || freePerks.free_30min_lesson || freePerks.free_1hr_lesson) && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">🎉 Free Perks Included:</h4>
                    <div className="flex flex-wrap gap-2">
                      {freePerks.free_dropoff && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Free Dropoff Service
                        </Badge>
                      )}
                      {freePerks.free_30min_lesson && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Free 30-min Lesson
                        </Badge>
                      )}
                      {freePerks.free_1hr_lesson && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Free 1-hour Lesson
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Total Price */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Price:</span>
                    <span className="text-2xl font-bold text-green-600">{generateConfirmationSummary().totalPrice}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCancelConfirmation}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAndCreate}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Yes, Create Booking
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}