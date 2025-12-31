// components/modals/BookingDetailModal.tsx
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  Car,
  CreditCard,
  GraduationCap,
  ExternalLink,
  IdCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { useUpdateTestResult } from '@/hooks/useAdmin';
import type { AdminBooking, TestResult } from '@/types/admin';
import InstructorDetailModal from './InstructorDetailModal';
import Image from 'next/image';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: AdminBooking | null;
  onBookingUpdate?: () => void;
}

export default function BookingDetailModal({
  isOpen,
  onClose,
  booking,
  onBookingUpdate
}: BookingDetailModalProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingResult, setPendingResult] = useState<TestResult | null>(null);
  const [isInstructorModalOpen, setIsInstructorModalOpen] = useState(false);

  const { updateTestResult, isLoading: isUpdating } = useUpdateTestResult();

  if (!booking) return null;

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)} CAD`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  // Helper function to safely format distance
  const formatDistance = (distance: number | string | undefined) => {
    if (distance === undefined || distance === null) return null;
    const numDistance = typeof distance === 'string' ? parseFloat(distance) : distance;
    if (isNaN(numDistance)) return null;
    return numDistance.toFixed(1);
  };

  // Helper function to safely format coordinates
  const formatCoordinate = (coord: number | string | undefined) => {
    if (coord === undefined || coord === null) return null;
    const numCoord = typeof coord === 'string' ? parseFloat(coord) : coord;
    if (isNaN(numCoord)) return null;
    return numCoord.toFixed(6);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; text: string }> = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'confirmed': { color: 'bg-green-100 text-green-800', text: 'Confirmed' },
      'succeeded': { color: 'bg-green-100 text-green-800', text: 'Succeeded' },
      'active': { color: 'bg-blue-100 text-blue-800', text: 'Active' },
      'in_progress': { color: 'bg-purple-100 text-purple-800', text: 'In Progress' },
      'completed': { color: 'bg-gray-100 text-gray-800', text: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
    };

    const config = statusConfig[status.toLowerCase()] ||
      { color: 'bg-gray-100 text-gray-800', text: status };

    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getTestResultBadge = (result?: string) => {
    if (!result) return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;

    return result === 'PASS' ? (
      <Badge className="bg-green-100 text-green-800">✓ Passed</Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">✗ Failed</Badge>
    );
  };

  const handleTestResultClick = (result: TestResult) => {
    setPendingResult(result);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmTestResult = async () => {
    if (!pendingResult) return;

    try {
      await updateTestResult(booking.id, pendingResult);
      toast.success(`Test result updated to ${pendingResult === 'PASS' ? 'Passed' : 'Failed'}`);
      setIsConfirmModalOpen(false);
      setPendingResult(null);
      onBookingUpdate?.();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update test result');
    }
  };

  const pickupInfo = booking.meet_at_center
    ? 'Meet at Test Center'
    : `${booking.pickup_address || 'Pickup Address'} → ${booking.test_center_address}`;

  const distanceFormatted = formatDistance(booking.pickup_distance);
  const latitudeFormatted = formatCoordinate(booking.pickup_latitude);
  const longitudeFormatted = formatCoordinate(booking.pickup_longitude);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="min-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Booking Details - #{booking.id}
            </DialogTitle>
          </DialogHeader>

          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

            {/* Test Information - Large Featured Card (spans 2 cols, 2 rows) */}
            <Card className="lg:col-span-2 lg:row-span-2 border-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="w-5 h-5 text-primary" />
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">Test Type</p>
                    <Badge variant="outline" className="font-semibold text-base px-3 py-1">
                      {booking.test_type}
                    </Badge>
                  </div>
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    {getStatusBadge(booking.status)}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-4 border">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium">Test Result</span>
                    {getTestResultBadge(booking.test_result)}
                  </div>

                  {/* Update Test Result Buttons - Always visible for admin */}
                  <div className="pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-2">Update Result:</p>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestResultClick('PASS')}
                        disabled={isUpdating || booking.test_result === 'PASS'}
                        className={`flex-1 border ${
                          booking.test_result === 'PASS'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Pass
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleTestResultClick('FAIL')}
                        disabled={isUpdating || booking.test_result === 'FAIL'}
                        className={`flex-1 border ${
                          booking.test_result === 'FAIL'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                        }`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Fail
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-sm bg-white rounded-lg p-3 border">
                  <Calendar className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium">{formatDateTime(booking.test_date)}</p>
                    <p className="text-xs text-gray-500">Timezone: {booking.timezone}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information - Medium Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-blue-600" />
                  Customer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-semibold text-base">{booking.full_name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-3 h-3" />
                  <span>{booking.phone_number}</span>
                </div>
                <p className="text-xs text-gray-500">ID: #{booking.user_id}</p>
              </CardContent>
            </Card>

            {/* Instructor Information - Medium Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <GraduationCap className="w-4 h-4 text-orange-600" />
                  Instructor
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.instructor_id ? (
                  <>
                    <p className="font-semibold text-base">{booking.instructor_full_name}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      <span>{booking.instructor_phone_number}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setIsInstructorModalOpen(true)}
                    >
                      View Details
                    </Button>
                  </>
                ) : (
                  <div className="text-center py-2 text-gray-400">
                    <GraduationCap className="w-6 h-6 mx-auto mb-1" />
                    <p className="text-xs">Not assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing - Featured Card (spans 2 cols) */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Pricing Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between gap-8">
                      <span className="text-gray-600">Base:</span>
                      <span>{formatPrice(booking.base_price)}</span>
                    </div>
                    {booking.pickup_price > 0 && (
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-600">Pickup:</span>
                        <span>{formatPrice(booking.pickup_price)}</span>
                      </div>
                    )}
                    {booking.addons_price > 0 && (
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-600">Addons:</span>
                        <span>{formatPrice(booking.addons_price)}</span>
                      </div>
                    )}
                    {booking.discount_amount && booking.discount_amount > 0 && (
                      <div className="flex justify-between gap-8 text-red-600">
                        <span>Discount:</span>
                        <span>-{formatPrice(booking.discount_amount)}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="text-3xl font-bold text-green-600">{formatPrice(booking.total_price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Location - Wide Card (spans 2 cols) */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Route visualization */}
                <div className="flex items-stretch gap-3">
                  {/* From - Pickup Location */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        {booking.meet_at_center ? 'Meeting Point' : 'Pickup'}
                      </span>
                    </div>
                    <p className="text-sm font-medium">
                      {booking.meet_at_center ? booking.test_center_name : (booking.pickup_address || 'Address not provided')}
                    </p>
                    {!booking.meet_at_center && distanceFormatted && (
                      <p className="text-xs text-gray-500 mt-0.5">{distanceFormatted} km from center</p>
                    )}
                  </div>

                  {/* Arrow connector */}
                  <div className="flex flex-col items-center justify-center px-2 shrink-0">
                    <div className="w-px h-2 bg-gray-300" />
                    <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                      <span className="text-gray-400 text-xs">→</span>
                    </div>
                    <div className="w-px h-2 bg-gray-300" />
                  </div>

                  {/* To - Test Center */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Test Center</span>
                    </div>
                    <p className="text-sm font-medium">{booking.test_center_name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{booking.test_center_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents - Compact Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <IdCard className="w-4 h-4 text-indigo-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.road_test_doc_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.road_test_doc_url, '_blank')}
                    className="w-full justify-between text-xs h-8"
                  >
                    <span className="flex items-center"><FileText className="w-3 h-3 mr-1" />Road Test</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400">No road test doc</p>
                )}
                {booking.g1_license_doc_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.g1_license_doc_url, '_blank')}
                    className="w-full justify-between text-xs h-8"
                  >
                    <span className="flex items-center"><IdCard className="w-3 h-3 mr-1" />G1 License</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400">No G1 license doc</p>
                )}
              </CardContent>
            </Card>

            {/* Payment - Compact Card */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {booking.payment_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.payment_url, '_blank')}
                    className="w-full justify-between text-xs h-8"
                  >
                    <span className="flex items-center"><CreditCard className="w-3 h-3 mr-1" />View Payment</span>
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                ) : (
                  <p className="text-xs text-gray-400">No payment link</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <span>Via</span>
                  <Image src="/stripe.png" alt="Stripe" width={40} height={16} className="h-4 w-auto" />
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Footer - Additional Info */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-gray-500">
              <div className="flex items-center gap-4">
                {booking.addon_id && (
                  <span>Addon ID: <span className="font-medium text-gray-700">#{booking.addon_id}</span></span>
                )}
                {booking.addon_duration && (
                  <span>Duration: <span className="font-medium text-gray-700">{booking.addon_duration}h</span></span>
                )}
                {booking.is_rescheduled && (
                  <Badge className="bg-orange-100 text-orange-800 text-xs">
                    Rescheduled {booking.previous_booking_id && `from #${booking.previous_booking_id}`}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <span>Created: <span className="font-medium text-gray-700">{formatDateTime(booking.created_at)}</span></span>
                <span>Updated: <span className="font-medium text-gray-700">{formatDateTime(booking.updated_at)}</span></span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Test Result Confirmation Modal */}
      <Dialog open={isConfirmModalOpen} onOpenChange={setIsConfirmModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Confirm Test Result
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to update the test result for booking #{booking.id}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Customer:</span>
                <span className="font-medium">{booking.full_name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Test Type:</span>
                <Badge variant="outline">{booking.test_type}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Test Date:</span>
                <span>{new Date(booking.test_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-500">Current Result:</span>
                {getTestResultBadge(booking.test_result)}
              </div>
              <div className="flex justify-between text-sm items-center pt-2 border-t">
                <span className="text-gray-500 font-medium">New Result:</span>
                {pendingResult === 'PASS' ? (
                  <Badge className="bg-green-100 text-green-800">✓ Passed</Badge>
                ) : (
                  <Badge className="bg-red-100 text-red-800">✗ Failed</Badge>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmTestResult}
              disabled={isUpdating}
              className={pendingResult === 'PASS' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                `Confirm ${pendingResult === 'PASS' ? 'Pass' : 'Fail'}`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Instructor Detail Modal */}
      <InstructorDetailModal
        isOpen={isInstructorModalOpen}
        onClose={() => setIsInstructorModalOpen(false)}
        instructorId={booking?.instructor_id?.toString() || null}
      />
    </>
  );
}
