// components/modals/InstructorDetailModal.tsx
'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, Mail, Phone, MapPin, Car, Calendar, Star, 
  DollarSign, Route, Clock, CreditCard, FileText,
  Shield, TrendingUp, Users, CheckCircle, XCircle
} from 'lucide-react';
import { useInstructorById } from '@/hooks/useAdmin';
import type { AdminInstructorDetail } from '@/types/admin';
import Image from 'next/image';
import FilePreviewerModal from './FilePreviewerModal';

interface InstructorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructorId: string | null;
}

export default function InstructorDetailModal({ 
  isOpen, 
  onClose, 
  instructorId 
}: InstructorDetailModalProps) {
  const { data: instructor, isLoading, error } = useInstructorById(instructorId);
  const [previewFile, setPreviewFile] = useState<{ url: string; title: string } | null>(null);

  const formatPrice = (price: number) => `$${(price / 100).toFixed(2)} CAD`;
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'SUSPENDED': 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{status}</Badge>;
  };

  if (!isOpen) return null;

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Instructor Details
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <div className="text-center py-8 text-red-600">
            <p>Error loading instructor details</p>
            <Button variant="outline" onClick={onClose} className="mt-2">Close</Button>
          </div>
        )}

        {instructor && (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center overflow-hidden">
                {instructor.photo_url ? (
                  <Image src={instructor.photo_url} alt={instructor.full_name} width={64} height={64} className="object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{instructor.full_name}</h3>
                  {getStatusBadge(instructor.status)}
                </div>
                <p className="text-gray-600 text-sm">ID: {instructor.identifier}</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">{instructor.rating?.toFixed(1) || 'N/A'}</span>
                    <span className="text-xs text-gray-500">({instructor.rating_count || 0} reviews)</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Profile: {instructor.profile_completion_percentage || 0}% complete
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{instructor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">{instructor.phone_number}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">{instructor.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm">Joined {formatDate(instructor.created_at)}</span>
                  </div>
                  {instructor.driving_school_name && (
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm">{instructor.driving_school_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Vehicle Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="w-4 h-4" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {instructor.vehicle ? (
                    <>
                      <div className="text-sm font-medium">
                        {instructor.vehicle.year} {instructor.vehicle.brand} {instructor.vehicle.model}
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-600">Color: {instructor.vehicle.color}</span>
                        <span className="text-sm text-gray-600">Plate: {instructor.vehicle.license_plate}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Status: {getStatusBadge(instructor.vehicle.status)}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {instructor.vehicle.registration_doc_url && (
                          <Button size="sm" variant="outline" onClick={() => setPreviewFile({ url: instructor.vehicle!.registration_doc_url!, title: 'Vehicle Registration' })}>
                            <FileText className="w-3 h-3 mr-1" />
                            Registration
                          </Button>
                        )}
                        {instructor.vehicle.insurance_doc_url && (
                          <Button size="sm" variant="outline" onClick={() => setPreviewFile({ url: instructor.vehicle!.insurance_doc_url!, title: 'Vehicle Insurance' })}>
                            <Shield className="w-3 h-3 mr-1" />
                            Insurance
                          </Button>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Car className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No vehicle information available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Statistics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold">{instructor.total_rides || 0}</div>
                  <div className="text-xs text-gray-600">Total Rides</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold">{formatPrice(instructor.total_earnings || 0)}</div>
                  <div className="text-xs text-gray-600">Total Earnings</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Route className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold">{(instructor.average_distance_per_ride || 0).toFixed(1)}km</div>
                  <div className="text-xs text-gray-600">Avg Distance</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Clock className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold">{(instructor.average_time_per_ride || 0).toFixed(1)}h</div>
                  <div className="text-xs text-gray-600">Avg Time</div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Rides */}
            {instructor.recent_rides && instructor.recent_rides.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recent Rides ({instructor.recent_rides.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {instructor.recent_rides.slice(0, 5).map((ride) => (
                      <div key={ride.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{ride.customer_name}</div>
                          <div className="text-xs text-gray-600">{ride.test_type} • {ride.center_name}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {formatDate(ride.start_time)} • {ride.total_distance}km • {ride.total_hours}h
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-sm text-green-600">
                            {formatPrice(ride.instructor_earnings)}
                          </div>
                          <Badge className={`text-xs ${ride.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {ride.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent rides available</p>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

      {/* File Previewer Modal */}
      <FilePreviewerModal
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        fileUrl={previewFile?.url || null}
        title={previewFile?.title || 'Document'}
      />
    </>
  );
}