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
import { formatCAD } from '@/lib/utils';

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

  const formatPrice = (price: number) => formatCAD(price);
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      'ACTIVE': 'bg-green-100 text-green-800',
      'INACTIVE': 'bg-red-100 text-red-800',
      'SUSPENDED': 'bg-yellow-100 text-yellow-800',
      'PENDING_VERIFICATION': 'bg-yellow-100 text-yellow-800',
    };
    const label = status
      ? status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Unknown';
    return <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>{label}</Badge>;
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
                  <Separator />
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">License #</p>
                      <p className="font-medium">{instructor.license_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">License Valid Until</p>
                      <p className="font-medium">
                        {instructor.license_validity_date ? formatDate(instructor.license_validity_date) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Referral Code</p>
                      <p className="font-medium font-mono">{instructor.referral_code || 'N/A'}</p>
                    </div>
                  </div>
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
                        {instructor.vehicle.vehicle_image_url && (
                          <Button size="sm" variant="outline" onClick={() => setPreviewFile({ url: instructor.vehicle!.vehicle_image_url!, title: 'Vehicle Photo' })}>
                            <Car className="w-3 h-3 mr-1" />
                            Photo
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

            {/* Financial / Wallet Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <CreditCard className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-xl font-bold">{formatPrice(instructor.wallet_balance || 0)}</div>
                  <div className="text-xs text-gray-600">Wallet Balance</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-xl font-bold">{formatPrice(instructor.total_withdrawn || 0)}</div>
                  <div className="text-xs text-gray-600">Total Withdrawn</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <TrendingUp className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-xl font-bold">{formatPrice(instructor.average_wage_per_ride || 0)}</div>
                  <div className="text-xs text-gray-600">Avg Wage / Ride</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Route className="w-6 h-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-xl font-bold">{instructor.transfer_count || 0}</div>
                  <div className="text-xs text-gray-600">Transferred Rides</div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Account (Stripe) */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Payment Account (Stripe)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {instructor.stripe_account_id ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Account ID</p>
                      <p className="font-mono text-xs break-all">{instructor.stripe_account_id}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Account Status</p>
                      <Badge className="bg-gray-100 text-gray-800">{instructor.stripe_account_status || 'N/A'}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Payouts</p>
                      {instructor.stripe_payouts_enabled ? (
                        <span className="flex items-center gap-1 text-green-700 text-sm"><CheckCircle className="w-3 h-3" /> Enabled</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-700 text-sm"><XCircle className="w-3 h-3" /> Disabled</span>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Charges</p>
                      {instructor.stripe_charges_enabled ? (
                        <span className="flex items-center gap-1 text-green-700 text-sm"><CheckCircle className="w-3 h-3" /> Enabled</span>
                      ) : (
                        <span className="flex items-center gap-1 text-red-700 text-sm"><XCircle className="w-3 h-3" /> Disabled</span>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No Stripe account connected</p>
                )}
              </CardContent>
            </Card>

            {/* Recent Rides */}
            {instructor.recent_rides && instructor.recent_rides.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recent Rides ({Math.min(instructor.recent_rides.length, 5)}
                    {instructor.recent_rides.length > 5 ? ` of ${instructor.recent_rides.length}` : ''})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {instructor.recent_rides.slice(0, 5).map((ride) => (
                      <div key={ride.id} className="p-3 bg-gray-50 rounded-lg space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {ride.customer_name}
                              <span className="text-xs text-gray-400 font-normal ml-2">Booking #{ride.booking_id}</span>
                            </div>
                            <div className="text-xs text-gray-500">{ride.customer_email} • {ride.customer_phone}</div>
                            <div className="text-xs text-gray-600 mt-0.5">{ride.test_type} • {ride.center_name}</div>
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
                        <div className="flex items-start gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                          <span className="break-all">{ride.pickup_location} → {ride.dropoff_location}</span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 text-xs text-gray-500 border-t pt-2">
                          <span>Start: <span className="text-gray-700">{formatDate(ride.start_time)}</span></span>
                          {ride.end_time && <span>End: <span className="text-gray-700">{formatDate(ride.end_time)}</span></span>}
                          <span>{ride.total_distance}km • {ride.total_hours}h</span>
                          <span>Rate: <span className="text-gray-700">{formatPrice(ride.hourly_rate)}/h</span></span>
                          {ride.payment_scheduled_at && (
                            <span>Payout due: <span className="text-gray-700">{formatDate(ride.payment_scheduled_at)}</span></span>
                          )}
                          <span>
                            Paid: <span className="text-gray-700">{ride.payment_processed_at ? formatDate(ride.payment_processed_at) : 'Not yet'}</span>
                          </span>
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