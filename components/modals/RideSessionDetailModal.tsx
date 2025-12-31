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
  Car,
  GraduationCap,
  Map,
  RefreshCw,
  ImageIcon,
  Loader2,
  ExternalLink
} from 'lucide-react';
import { useRideSessionDetail } from '@/hooks/useAdmin';
import { adminService } from '@/services/admin';
import { TableSkeleton } from '@/components/ui/loading-state';
import { toast } from 'sonner';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-7xl max-h-[90vh] overflow-y-auto">
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

        {/* Session Data - Bento Grid Layout */}
        {session && !isLoading && (
          <div className="space-y-4">
            {/* Bento Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">

              {/* Route Tracking - Large Featured Card (spans 2 cols, 2 rows) */}
              <Card className="lg:col-span-2 lg:row-span-2 border-2 border-primary/20">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Map className="w-5 h-5 text-primary" />
                      Route Tracking
                      {session.routePoints && session.routePoints.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {session.routePoints.length} points
                        </Badge>
                      )}
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerateRouteImage}
                      disabled={isRegenerating || !session.routePoints || session.routePoints.length === 0}
                      className="gap-1.5"
                    >
                      {isRegenerating ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-3 h-3" />
                          {routeImageUrl ? 'Regenerate' : 'Generate'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {routeImageUrl ? (
                    <div className="relative group">
                      <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden border bg-gray-50">
                        <Image
                          src={routeImageUrl}
                          alt="Route Map"
                          fill
                          className="object-cover"
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
                          Full Size
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full aspect-[4/3] rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon className="w-7 h-7 text-gray-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-gray-600">No route map available</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {session.routePoints && session.routePoints.length > 0
                            ? 'Click "Generate" to create a visual route'
                            : 'No route points recorded'}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Customer - Compact Card */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-blue-600" />
                    Customer
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-base">{session.userName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{session.userContact}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Instructor - Compact Card */}
              <Card className="lg:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <GraduationCap className="w-4 h-4 text-orange-600" />
                    Instructor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-semibold text-base">{session.instructorName}</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="w-3 h-3" />
                    <span>{session.instructorContact}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Session Info - Spans 2 cols */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Car className="w-4 h-4 text-green-600" />
                    Session Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Test Type</span>
                      <Badge variant="outline" className="font-medium">
                        {session.testType}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Status</span>
                      <Badge className={
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        session.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }>
                        {session.status ? session.status.charAt(0).toUpperCase() + session.status.slice(1) : 'Unknown'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Test Center</span>
                      <span className="text-sm font-medium text-right">{session.centerName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Duration</span>
                      <span className="text-sm font-medium">{parseFloat(session.totalHours).toFixed(2)}h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Distance</span>
                      <span className="text-sm font-medium">{parseFloat(session.totalDistance).toFixed(2)}km</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Route Info - Spans 2 cols */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    Route Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-stretch gap-3">
                    {/* Pickup Location */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Pickup</span>
                      </div>
                      <p className="text-sm font-medium">{session.pickupLocation}</p>
                    </div>

                    {/* Arrow connector */}
                    <div className="flex flex-col items-center justify-center px-2 shrink-0">
                      <div className="w-px h-2 bg-gray-300" />
                      <div className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">→</span>
                      </div>
                      <div className="w-px h-2 bg-gray-300" />
                    </div>

                    {/* Dropoff Location */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Dropoff</span>
                      </div>
                      <p className="text-sm font-medium">{session.dropLocation}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Financial - Spans 2 cols */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-green-600" />
                    Financial Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-600">Total Price:</span>
                        <span className="font-medium">{formatPrice(session.totalPrice)}</span>
                      </div>
                      <div className="flex justify-between gap-8">
                        <span className="text-gray-600">Instructor:</span>
                        <span className="font-medium">{formatPrice(session.instructorPayments)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Platform Fee</p>
                      <p className="text-2xl font-bold text-primary">{formatPrice(session.totalPrice - session.instructorPayments)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span>Test Date: <span className="font-medium text-gray-700">{formatDateTime(session.testDate)}</span></span>
                  {session.endTime && (
                    <span>End Time: <span className="font-medium text-gray-700">{formatDateTime(session.endTime)}</span></span>
                  )}
                </div>
                <span>Session ID: <span className="font-medium text-gray-700">#{session.id}</span></span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}