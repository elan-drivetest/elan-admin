// components/modals/BookingDetailModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  FileText, 
  Clock,
  Car,
  CreditCard,
  GraduationCap,
  ExternalLink,
  IdCard
} from 'lucide-react';
import type { AdminBooking } from '@/types/admin';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: AdminBooking | null;
}

export default function BookingDetailModal({
  isOpen,
  onClose,
  booking
}: BookingDetailModalProps) {
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

  const pickupInfo = booking.meet_at_center 
    ? 'Meet at Test Center'
    : `${booking.pickup_address || 'Pickup Address'} → ${booking.test_center_address}`;

  const distanceFormatted = formatDistance(booking.pickup_distance);
  const latitudeFormatted = formatCoordinate(booking.pickup_latitude);
  const longitudeFormatted = formatCoordinate(booking.pickup_longitude);

  return (
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
                {getTestResultBadge(booking.test_result)}
              </div>
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
  );
}