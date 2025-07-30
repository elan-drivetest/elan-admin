// components/modals/RideSessionDetailModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Route, 
  Clock,
  Car,
  GraduationCap,
  Navigation,
  Gauge
} from 'lucide-react';
import { useRideSessionDetail } from '@/hooks/useAdmin';
import { TableSkeleton } from '@/components/ui/loading-state';
import type { RoutePoint } from '@/types/admin';

interface RideSessionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string | null;
}

export default function RideSessionDetailModal({
  isOpen,
  onClose,
  sessionId
}: RideSessionDetailModalProps) {
  const { data: session, isLoading, error } = useRideSessionDetail(sessionId || '');

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

  const RoutePointCard = ({ point, index }: { point: RoutePoint; index: number }) => (
    <div className="p-3 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Point #{index + 1}</span>
        <Badge variant="outline" className="text-xs">
          <Gauge className="w-3 h-3 mr-1" />
          {point.speed.toFixed(1)} km/h
        </Badge>
      </div>
      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>{point.latitude.toFixed(6)}, {point.longitude.toFixed(6)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-fit max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="w-5 h-5 text-primary" />
            Ride Session Details
            {session && `- #${session.id}`}
          </DialogTitle>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <TableSkeleton rows={3} columns={2} />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading session details</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {/* Session Data */}
        {session && !isLoading && (
          <div className="space-y-6">
            {/* Session Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Customer & Instructor Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <User className="w-4 h-4 text-blue-600" />
                    Participants
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Customer</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{session.userName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{session.userContact}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Instructor</h4>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-gray-400" />
                        <span className="font-medium">{session.instructorName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{session.instructorContact}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Session Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Car className="w-4 h-4 text-green-600" />
                    Session Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Test Type:</span>
                    <Badge variant="outline" className="font-medium">
                      {session.testType}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Test Center:</span>
                    <span className="text-sm font-medium text-right max-w-[200px]">{session.centerName}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatDateTime(session.testDate)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium">{session.totalHours}h</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Distance:</span>
                    <span className="text-sm font-medium">{session.totalDistance}km</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Location Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Pickup Location</h4>
                    <div className="flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-green-500 mt-0.5" />
                      <span className="text-sm">{session.pickupLocation}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm text-gray-700 mb-2">Dropoff Location</h4>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                      <span className="text-sm">{session.dropLocation}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  Financial Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Price:</span>
                  <span className="font-medium text-green-600">{formatPrice(session.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Instructor Earnings:</span>
                  <span className="font-medium text-green-600">{formatPrice(session.instructorPayments)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Platform Fee:</span>
                    <span className="text-blue-600">{formatPrice(session.totalPrice - session.instructorPayments)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Route Tracking */}
            {session.routePoints && session.routePoints.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Route className="w-4 h-4 text-indigo-600" />
                    Route Tracking ({session.routePoints.length} points)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                    {session.routePoints.map((point, index) => (
                      <RoutePointCard key={index} point={point} index={index} />
                    ))}
                  </div>
                  
                  {session.routePoints.length > 6 && (
                    <div className="mt-4 text-center">
                      <Badge variant="outline" className="text-xs">
                        Showing all {session.routePoints.length} route points
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* No Route Points */}
            {(!session.routePoints || session.routePoints.length === 0) && (
              <Card>
                <CardContent className="text-center py-8 text-gray-500">
                  <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No route tracking data available for this session</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}