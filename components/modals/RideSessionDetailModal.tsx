// components/modals/RideSessionDetailModal.tsx
'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  Gauge,
  Map,
  RefreshCw,
  ImageIcon,
  Loader2,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useRideSessionDetail } from '@/hooks/useAdmin';
import { adminService } from '@/services/admin';
import { TableSkeleton } from '@/components/ui/loading-state';
import { toast } from 'sonner';
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
  const { data: session, isLoading, error, refetch } = useRideSessionDetail(sessionId || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [routeImageUrl, setRouteImageUrl] = useState<string | null>(null);
  const [showRoutePoints, setShowRoutePoints] = useState(false);

  // Sync route image URL from session data
  React.useEffect(() => {
    if (session?.routeImageUrl) {
      setRouteImageUrl(session.routeImageUrl);
    } else {
      setRouteImageUrl(null);
    }
  }, [session?.routeImageUrl]);

  const handleRegenerateRouteImage = async () => {
    if (!sessionId) return;

    setIsRegenerating(true);
    try {
      const response = await adminService.regenerateRouteImage(sessionId);
      setRouteImageUrl(response.routeImageUrl);
      toast.success('Route map generated successfully');
      // Refetch session to update the data
      refetch();
    } catch (err: any) {
      console.error('Failed to regenerate route image:', err);
      toast.error(err?.response?.data?.message || 'Failed to generate route map');
    } finally {
      setIsRegenerating(false);
    }
  };

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
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Map className="w-4 h-4 text-indigo-600" />
                    Route Tracking
                    {session.routePoints && session.routePoints.length > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {session.routePoints.length} points
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateRouteImage}
                    disabled={isRegenerating || !session.routePoints || session.routePoints.length === 0}
                    className="gap-2"
                  >
                    {isRegenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        {routeImageUrl ? 'Regenerate Map' : 'Generate Map'}
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Route Map Image */}
                {routeImageUrl ? (
                  <div className="relative group">
                    <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden border bg-gray-50">
                      <Image
                        src={routeImageUrl}
                        alt="Route Map"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => window.open(routeImageUrl, '_blank')}
                        className="gap-1 shadow-md"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Full Size
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-600">No route map available</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {session.routePoints && session.routePoints.length > 0
                          ? 'Click "Generate Map" to create a visual route'
                          : 'No route points recorded for this session'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Route Points Collapsible */}
                {session.routePoints && session.routePoints.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setShowRoutePoints(!showRoutePoints)}
                      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Route className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">
                          Route Points Data
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {session.routePoints.length} points
                        </Badge>
                      </div>
                      {showRoutePoints ? (
                        <ChevronUp className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      )}
                    </button>

                    {showRoutePoints && (
                      <div className="p-3 border-t">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                          {session.routePoints.map((point, index) => (
                            <RoutePointCard key={index} point={point} index={index} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* No Route Points Message */}
                {(!session.routePoints || session.routePoints.length === 0) && !routeImageUrl && (
                  <div className="text-center py-4 text-gray-500">
                    <p className="text-sm">No route tracking data available for this session</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}