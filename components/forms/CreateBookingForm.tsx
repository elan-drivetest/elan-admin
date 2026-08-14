// components/forms/CreateBookingForm.tsx - Fixed Confirmation Flow
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, X, AlertTriangle, Check, MapPin, Calendar, User } from 'lucide-react';
import { adminService } from '@/services/admin';
import SearchableSelect from '@/components/ui/SearchableSelect';
import FileUploader from '@/components/ui/FileUploader';
import { useSettingsAddons, useCustomers, useBookingInstructors } from '@/hooks/useAdmin';
import { usePricingConfig } from '@/hooks/usePricingConfig';
import {
  calculateBookingPrice,
  calculateConcession,
  describeMinimumNotice,
  earliestSelectableTestDate,
  formatPrice,
  isTestDateTooSoon,
  toDateTimeLocalValue,
  CouponMinimumNotMetError,
  type PricingBreakdown,
} from '@/lib/utils/booking-calculations';
import { getApiErrorMessages } from '@/lib/utils';
import FormErrorAlert from '@/components/ui/form-error-alert';
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
  instructor_id: z.number().nullable().optional(),
  addon_id: z.number().optional(),
  coupon_code: z.string().optional(),
  // Backend requires both documents as valid URLs.
  road_test_doc_url: z.string().min(1, 'Road test document is required').url('Upload a valid road test document'),
  g1_license_doc_url: z.string().min(1, 'License document is required').url('Upload a valid license document'),
  timezone: z.string(),
}).refine(
  (d) => d.meet_at_center || !!(d.pickup_address && d.pickup_address.trim()),
  { message: 'Select a pickup address (or choose "Meet at test center")', path: ['pickup_address'] },
);

type CreateBookingFormData = z.infer<typeof createBookingSchema>;

interface CreateBookingFormProps {
  onSuccess?: (booking: any) => void;
  onCancel?: () => void;
}

// A titled card that groups related fields so the long booking form reads as a
// short sequence of clear steps instead of one tall column.
function FormSection({
  step,
  title,
  description,
  children,
}: {
  step: number;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-green-100 text-sm font-semibold text-green-700">
          {step}
        </span>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          {description && <p className="text-xs text-gray-500">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

export default function CreateBookingForm({ onSuccess, onCancel }: CreateBookingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessages, setErrorMessages] = useState<string[]>([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formDataToSubmit, setFormDataToSubmit] = useState<CreateBookingFormData | null>(null);
  const errorRef = React.useRef<HTMLDivElement>(null);
  
  // Enhanced state management
  const [selectedTestCenter, setSelectedTestCenter] = useState<TestCenter | null>(null);
  const [locationOption, setLocationOption] = useState<'pickup' | 'test-centre'>('test-centre');
  const [pickupDistance, setPickupDistance] = useState<number | undefined>();
  const [selectedAddon, setSelectedAddon] = useState<Addon | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<CouponVerificationResponse | null>(null);
  const [distanceUnavailable, setDistanceUnavailable] = useState(false);

  // API hooks.
  //
  // Add-ons come from the SAME admin route the Pricing & Payouts screen edits
  // (`GET /admin/settings/addons`), not the customer-facing `GET /addons`. Both
  // carry live prices, but the customer route serialises with group ['me'] and
  // drops `description`, so the picker below could never show one. Reading the
  // admin route also means "what I just edited" is literally what this preview
  // uses — including the 30-minute lesson price that IS the long-trip credit.
  const { data: addons, refetch: refetchAddons } = useSettingsAddons();
  const {
    config: pricingConfig,
    settings: pricingSettings,
    fellBackFor: pricingFellBackFor,
    bookingRules,
    isLoading: pricingLoading,
    isRefreshing: pricingRefreshing,
    refetch: refetchPricingConfig,
  } = usePricingConfig();

  // The reload button promises current rates, and an add-on price is a rate —
  // refreshing only `/admin/settings` would leave the credit stale.
  const [isRefreshingConfig, setIsRefreshingConfig] = useState(false);
  const handleRefreshConfig = useCallback(async () => {
    setIsRefreshingConfig(true);
    try {
      await Promise.all([refetchPricingConfig(), refetchAddons()]);
    } finally {
      setIsRefreshingConfig(false);
    }
  }, [refetchPricingConfig, refetchAddons]);
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

  // Distance the server will price on: 0 when meeting at the centre.
  const effectiveDistance = locationOption === 'test-centre' ? 0 : (pickupDistance ?? 0);

  // The add-ons this booking can actually buy. The server files mock tests under
  // LESSON_G / LESSON_G2 too, so the type filter is the whole catalogue for a
  // test type (BUSINESS_LOGIC.md §4.2).
  const addonsForTestType = useMemo(
    () => addons.filter((addon) => addon.type === (testType === 'G' ? 'LESSON_G' : 'LESSON_G2')),
    [addons, testType],
  );

  // The long-trip credit that WILL apply if an add-on is selected. Passed to the
  // add-on picker so it can show the real effect of choosing one.
  const availableConcession = calculateConcession({
    // Probe with the currently-selected add-on, or any the picker actually
    // offers — the credit amount does not depend on which one, but claiming a
    // credit for a test type with nothing to select would be a lie.
    selectedAddon: selectedAddon ?? addonsForTestType[0] ?? null,
    distance: effectiveDistance,
    pricing: pricingConfig,
    addons,
    testType,
  });

  // STEP 0 of the server's pipeline, enforced here so the admin finds out before
  // uploading two documents. `booking_min_lead_days` is a live setting, so the
  // boundary and the copy both come from it rather than a literal.
  const testDateValue = watch('test_date');
  const earliestTestDate = earliestSelectableTestDate(bookingRules);
  const testDateTooSoon = isTestDateTooSoon(testDateValue, bookingRules);

  // Mirrors the server's pipeline. Throws only on the coupon minimum, which we
  // surface as a blocking form error rather than letting the API reject it.
  let pricing: PricingBreakdown | null = null;
  let couponMinimumError: string | null = null;

  if (selectedTestCenter) {
    const priceArgs = {
      centerBasePrice: selectedTestCenter.base_price,
      distance: effectiveDistance,
      pricing: pricingConfig,
      addons,
      selectedAddon,
      testType,
    };
    try {
      pricing = calculateBookingPrice({ ...priceArgs, coupon: appliedCoupon });
    } catch (err) {
      if (err instanceof CouponMinimumNotMetError) {
        pricing = calculateBookingPrice(priceArgs);
        couponMinimumError = `Coupon "${appliedCoupon?.code}" requires a minimum order of ${formatPrice(
          err.minPurchaseAmount,
        )}; this booking totals ${formatPrice(err.orderTotal)}. Remove the coupon or change the booking.`;
      } else {
        throw err;
      }
    }
  }

  // A pickup we cannot price, or a coupon the server will reject, must not reach
  // the confirmation dialog with a confident-looking total on it.
  const pickupNeedsDistance = locationOption === 'pickup' && distanceUnavailable;
  const submitBlockedReason = testDateTooSoon
    ? `${describeMinimumNotice(bookingRules)} The server rejects anything sooner, so pick ${earliestTestDate.toLocaleString()} or later.`
    : pickupNeedsDistance
    ? 'The driving distance could not be calculated, so this booking cannot be priced. Re-select the pickup address.'
    : couponMinimumError;

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
      setDistanceUnavailable(false);
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

  // Switching G2 → G leaves an add-on the picker no longer lists but the price
  // was still charging for. Drop it so the total matches what is on screen.
  useEffect(() => {
    if (selectedAddon && !addonsForTestType.some((addon) => addon.id === selectedAddon.id)) {
      setSelectedAddon(null);
    }
  }, [addonsForTestType, selectedAddon]);

  // Update form when coupon changes
  useEffect(() => {
    setValue('coupon_code', appliedCoupon?.code || '');
  }, [appliedCoupon, setValue]);

  const handleLocationSelect = (location: {
    address: string;
    coordinates: { lat: number; lng: number };
    distance?: number;
  }) => {
    setValue('pickup_address', location.address, { shouldValidate: true });
    setValue('pickup_latitude', location.coordinates.lat);
    setValue('pickup_longitude', location.coordinates.lng);
    setValue('pickup_distance', location.distance);
    setPickupDistance(location.distance);
  };

  const onSubmitHandler: SubmitHandler<CreateBookingFormData> = async (data) => {
    // Refuse to show a confirmation total we know is wrong or will be rejected.
    if (submitBlockedReason) {
      setErrorMessages([submitBlockedReason]);
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    setFormDataToSubmit(data);
    setShowConfirmation(true);
  };

  // FIXED: This actually creates the booking AFTER user confirms
  const handleConfirmAndCreate = async () => {
    if (!formDataToSubmit) return;

    try {
      setShowConfirmation(false); // Close confirmation modal
      setIsLoading(true); // Set local loading
      setErrorMessages([]);
      
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
      setErrorMessages(getApiErrorMessages(error));
      // Bring the error into view since the form is long.
      requestAnimationFrame(() => {
        errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
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
      // The discount the pipeline actually computed — not the raw `discount`
      // field, which is a percent for percentage coupons.
      couponDiscount: pricing ? formatPrice(pricing.discount) : '',
      totalPrice: pricing ? formatPrice(pricing.total) : '—',
    };
  };

  return (
    <>
      {/* 5-col split: the form needs 3, the price panel needs 2 to stay legible. */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Main Form - Left Column */}
        <div className="lg:col-span-3 space-y-6">
          <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-5">
            {/* Step 1 — Customer & test */}
            <FormSection
              step={1}
              title="Customer & Test"
              description="Who the booking is for and which road test."
            >
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
                    // Both the boundary and the sentence below it come from
                    // `booking_min_lead_days`, so raising the notice period in
                    // Settings moves this picker without a deploy.
                    min={toDateTimeLocalValue(earliestTestDate)}
                    aria-invalid={testDateTooSoon || undefined}
                    className={testDateTooSoon ? 'border-red-300 focus-visible:ring-red-200' : undefined}
                    {...register('test_date')}
                  />
                  {errors.test_date ? (
                    <p className="text-sm text-red-600">{errors.test_date.message}</p>
                  ) : testDateTooSoon ? (
                    <p className="text-sm text-red-600">
                      Too soon. {describeMinimumNotice(bookingRules)} The earliest you can book is{' '}
                      {earliestTestDate.toLocaleString()}.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">{describeMinimumNotice(bookingRules)}</p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Step 2 — Pickup / meeting location */}
            <FormSection
              step={2}
              title="Meeting Location"
              description="Meet at the test center, or set a pickup address."
            >
              <LocationSelectionAdmin
                selectedOption={locationOption}
                onOptionChange={setLocationOption}
                onLocationSelect={handleLocationSelect}
                onDistanceUnavailableChange={setDistanceUnavailable}
                testCenter={selectedTestCenter || undefined}
              />
              {errors.pickup_address && (
                <p className="text-sm text-red-600">{errors.pickup_address.message}</p>
              )}
            </FormSection>

            {/* Step 3 — Extras */}
            <FormSection
              step={3}
              title="Add-ons, Promo & Instructor"
              description="Optional lesson add-on, discount code, and instructor."
            >
              <AddOnSelectionAdmin
                addons={addons}
                selectedAddon={selectedAddon}
                onAddonSelect={setSelectedAddon}
                testType={testType}
                concession={availableConcession}
                baseDistanceKm={pricingConfig.baseDistance}
              />

              <CouponVerificationAdmin
                onCouponApply={setAppliedCoupon}
                appliedCoupon={appliedCoupon}
              />

              <div>
                <SearchableSelect
                  label="Instructor (Optional)"
                  options={instructors.map(instructor => ({
                    id: instructor.user_id,
                    label: instructor.fullName,
                    subtitle: instructor.phoneNumber,
                    badge: instructor.rating ? `★ ${instructor.rating.toFixed(1)}` : undefined
                  }))}
                  value={watch('instructor_id') || null}
                  onSelect={(value) => setValue('instructor_id', value === null ? undefined : (value as number), { shouldValidate: true })}
                  placeholder="Select an instructor (optional)"
                  required={false}
                  isLoading={instructorsLoading}
                  allowClear={true}
                />
                {!instructorsLoading && instructors.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">
                    No eligible instructors — only active, bank-connected instructors with a 100% complete profile can be assigned.
                  </p>
                )}
              </div>
            </FormSection>

            {/* Step 4 — Documents */}
            <FormSection
              step={4}
              title="Documents"
              description="Both documents are required to create the booking."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <FileUploader
                    label="Road Test Document"
                    value={watch('road_test_doc_url') || ''}
                    onUpload={(url) => setValue('road_test_doc_url', url, { shouldValidate: true })}
                    acceptedTypes={['image/*', '.pdf']}
                    required={true}
                  />
                  {errors.road_test_doc_url && (
                    <p className="text-sm text-red-600 mt-1">{errors.road_test_doc_url.message}</p>
                  )}
                </div>

                <div>
                  <FileUploader
                    label={`${testType} License Document`}
                    value={watch('g1_license_doc_url') || ''}
                    onUpload={(url) => setValue('g1_license_doc_url', url, { shouldValidate: true })}
                    acceptedTypes={['image/*', '.pdf']}
                    required={true}
                  />
                  {errors.g1_license_doc_url && (
                    <p className="text-sm text-red-600 mt-1">{errors.g1_license_doc_url.message}</p>
                  )}
                </div>
              </div>
            </FormSection>

            {/* Error Display */}
            <div ref={errorRef}>
              <FormErrorAlert messages={errorMessages} />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
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
        <div className="lg:col-span-2">
          <div className="sticky top-6">
            <PricingBreakdownAdmin
              testCenter={selectedTestCenter || undefined}
              distance={pickupDistance}
              addons={addons}
              selectedAddon={selectedAddon || undefined}
              testType={testType}
              appliedCoupon={appliedCoupon || undefined}
              locationOption={locationOption}
              pricing={pricingConfig}
              pricingIsLoading={pricingLoading}
              pricingFellBackFor={pricingFellBackFor}
              settings={pricingSettings}
              pickupLabel={watch('pickup_address')}
              onRefreshConfig={handleRefreshConfig}
              isRefreshingConfig={pricingRefreshing || isRefreshingConfig}
              distanceUnavailable={distanceUnavailable}
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

                {/* Price breakdown. The components do not sum to the total when a
                    credit or coupon applied, so every adjustment is itemised. */}
                {pricing && (
                  <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Test centre fee</span>
                        <span className="font-medium">{formatPrice(pricing.basePrice)}</span>
                      </div>
                      {pricing.pickupPrice > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">
                            Pickup ({effectiveDistance.toFixed(1)} km)
                          </span>
                          <span className="font-medium">+ {formatPrice(pricing.pickupPrice)}</span>
                        </div>
                      )}
                      {pricing.addonsPrice > 0 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">{selectedAddon?.name}</span>
                          <span className="font-medium">+ {formatPrice(pricing.addonsPrice)}</span>
                        </div>
                      )}
                      {pricing.concession > 0 && (
                        <div className="flex justify-between text-green-700">
                          <span>Long-trip credit</span>
                          <span className="font-medium">− {formatPrice(pricing.concession)}</span>
                        </div>
                      )}
                      {pricing.discount > 0 && (
                        <div className="flex justify-between text-red-600">
                          <span>Discount ({appliedCoupon?.code})</span>
                          <span className="font-medium">− {formatPrice(pricing.discount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                      <span className="text-lg font-medium text-gray-900">Total Price:</span>
                      <span className="text-2xl font-bold text-green-600">
                        {formatPrice(pricing.total)}
                      </span>
                    </div>
                    {pricingFellBackFor.length > 0 && (
                      <p className="mt-2 text-xs text-amber-700">
                        Pricing configuration could not be read from the server
                        ({pricingFellBackFor.join(', ')}); this total may differ from the
                        amount charged.
                      </p>
                    )}
                  </div>
                )}
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