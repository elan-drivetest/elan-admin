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

  // Check if test result can be updated
  const canUpdateTestResult = () => {
    const status = booking.status.toLowerCase();
    // Allow updating for completed, active, in_progress bookings
    return ['completed', 'active', 'in_progress'].includes(status);
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
        <DialogContent className="min-w-fit max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Booking Details - #{booking.id}
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <User className="w-4 h-4 text-blue-600" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{booking.full_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span>{booking.phone_number}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Customer ID: #{booking.user_id}
                </div>
              </CardContent>
            </Card>

            {/* Test Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Car className="w-4 h-4 text-green-600" />
                  Test Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Test Type:</span>
                  <Badge variant="outline" className="font-medium">
                    {booking.test_type}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  {getStatusBadge(booking.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span>Result:</span>
                  <div className="flex items-center gap-2">
                    {getTestResultBadge(booking.test_result)}
                  </div>
                </div>

                {/* Update Test Result Buttons */}
                {canUpdateTestResult() && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-gray-500 mb-2">Update Test Result:</p>
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
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{formatDateTime(booking.test_date)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Timezone: {booking.timezone}
                </div>
              </CardContent>
            </Card>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Location Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Test Center:</p>
                  <p className="text-sm">{booking.test_center_name}</p>
                  <p className="text-xs text-gray-500">{booking.test_center_address}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Pickup/Dropoff:</p>
                  <p className="text-sm">{pickupInfo}</p>
                  {distanceFormatted && (
                    <p className="text-xs text-gray-500">
                      Distance: {distanceFormatted} km
                    </p>
                  )}
                </div>

                {!booking.meet_at_center && latitudeFormatted && longitudeFormatted && (
                  <div className="text-xs text-gray-500">
                    Coordinates: {latitudeFormatted}, {longitudeFormatted}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructor Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GraduationCap className="w-4 h-4 text-orange-600" />
                  Instructor Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.instructor_id ? (
                  <>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="font-medium">{booking.instructor_full_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{booking.instructor_phone_number}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Instructor ID: #{booking.instructor_id}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No instructor assigned</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pricing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Pricing Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Base Price:</span>
                  <span>{formatPrice(booking.base_price)}</span>
                </div>
                {booking.pickup_price > 0 && (
                  <div className="flex justify-between">
                    <span>Pickup Fee:</span>
                    <span>{formatPrice(booking.pickup_price)}</span>
                  </div>
                )}
                {booking.addons_price > 0 && (
                  <div className="flex justify-between">
                    <span>Addons:</span>
                    <span>{formatPrice(booking.addons_price)}</span>
                  </div>
                )}
                {booking.discount_amount && booking.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount {booking.coupon_code && `(${booking.coupon_code})`}:</span>
                    <span>-{formatPrice(booking.discount_amount)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span className="text-green-600">{formatPrice(booking.total_price)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-gray-600" />
                  Additional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.addon_id && (
                  <div className="flex justify-between">
                    <span>Addon ID:</span>
                    <span>#{booking.addon_id}</span>
                  </div>
                )}
                {booking.addon_duration && (
                  <div className="flex justify-between">
                    <span>Addon Duration:</span>
                    <span>{booking.addon_duration}h</span>
                  </div>
                )}
                {booking.is_rescheduled && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-orange-100 text-orange-800">Rescheduled</Badge>
                    {booking.previous_booking_id && (
                      <span className="text-xs text-gray-500">
                        From: #{booking.previous_booking_id}
                      </span>
                    )}
                  </div>
                )}
                <div className="text-xs text-gray-500 space-y-1">
                  <div>Created: {formatDateTime(booking.created_at)}</div>
                  <div>Updated: {formatDateTime(booking.updated_at)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documents and Payment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Documents */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <IdCard className="w-4 h-4 text-indigo-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.road_test_doc_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.road_test_doc_url, '_blank')}
                    className="w-full justify-start"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Road Test Document
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                ) : (
                  <div className="text-sm text-gray-500">No road test document</div>
                )}

                {booking.g1_license_doc_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.g1_license_doc_url, '_blank')}
                    className="w-full justify-start"
                  >
                    <IdCard className="w-4 h-4 mr-2" />
                    G1 License Document
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                ) : (
                  <div className="text-sm text-gray-500">No G1 license document</div>
                )}
              </CardContent>
            </Card>

            {/* Payment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Payment Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {booking.payment_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(booking.payment_url, '_blank')}
                    className="w-full justify-start"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Payment Link
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </Button>
                ) : (
                  <div className="text-sm text-gray-500">No payment link available</div>
                )}

                <div className="text-xs text-gray-500">
                  Payment processed through Stripe
                </div>
              </CardContent>
            </Card>
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
    </>
  );
}
