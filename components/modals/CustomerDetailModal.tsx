// components/modals/CustomerDetailModal.tsx
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign,
  Car,
  FileText,
  ExternalLink,
  Users
} from 'lucide-react';
import { useCustomerDetail } from '@/hooks/useAdmin';
import type { AdminCustomerDetail, CustomerBooking } from '@/types/admin';
import Image from 'next/image';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string | null;
}

export default function CustomerDetailModal({
  isOpen,
  onClose,
  customerId
}: CustomerDetailModalProps) {
  const { data: customer, isLoading, error } = useCustomerDetail(customerId || '');

  // Format currency from cents to dollars
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)} CAD`;
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ACTIVE': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'INACTIVE': { color: 'bg-gray-100 text-gray-800', icon: XCircle },
      'SUSPENDED': { color: 'bg-red-100 text-red-800', icon: XCircle },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', icon: Clock };
    
    return (
      <Badge className={config.color}>
        <config.icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  // Get booking status badge
  const getBookingStatusBadge = (status: string) => {
    const statusConfig = {
      'CONFIRMED': { color: 'bg-blue-100 text-blue-800', text: 'Confirmed' },
      'COMPLETED': { color: 'bg-green-100 text-green-800', text: 'Completed' },
      'CANCELLED': { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', text: status };
    
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  // Get test result badge
  const getTestResultBadge = (result: string) => {
    if (result === 'PASS') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed
        </Badge>
      );
    } else if (result === 'FAIL') {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
    return (
      <Badge className="bg-gray-100 text-gray-800">
        <Clock className="w-3 h-3 mr-1" />
        {result || 'Pending'}
      </Badge>
    );
  };

  // Render booking card
  const BookingCard = ({ booking }: { booking: CustomerBooking }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            {booking.test_type} Road Test
          </CardTitle>
          <div className="flex items-center gap-2">
            {getBookingStatusBadge(booking.status)}
            {booking.test_result && getTestResultBadge(booking.test_result)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Test Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Test Date & Time</h4>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(booking.test_date).toLocaleString()}
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Test Center</h4>
              <div className="space-y-1">
                <p className="text-sm font-medium">{booking.test_center_name}</p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {booking.test_center_address}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Total Price</h4>
              <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                <DollarSign className="w-4 h-4" />
                {formatPrice(booking.total_price)}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Instructor</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  {booking.instructor_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  {booking.instructor_phone}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Pickup Location</h4>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-400" />
                {booking.meet_at_center ? 'Meet at Test Center' : booking.pickup_address}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-1">Booked Date</h4>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4 text-gray-400" />
                {new Date(booking.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        {(booking.road_test_doc_url || booking.g1_license_doc_url) && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm text-gray-700 mb-2">Documents</h4>
            <div className="flex flex-wrap gap-2">
              {booking.road_test_doc_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.open(booking.road_test_doc_url, '_blank')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Road Test Document
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              )}
              {booking.g1_license_doc_url && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(booking.g1_license_doc_url, '_blank')}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  G1 License
                  <ExternalLink className="w-3 h-3 ml-2" />
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="min-w-fit max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Customer Details
          </DialogTitle>
        </DialogHeader>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading customer details...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading customer details</p>
            <p className="text-sm">{error.message}</p>
          </div>
        )}

        {/* Customer Data */}
        {customer && (
          <div className="space-y-6">
            {/* Customer Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Profile Information
                  </span>
                  {getStatusBadge(customer.status)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Picture & Basic Info */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {customer.photo_url ? (
                        <Image 
                          src={customer.photo_url} 
                          alt={customer.full_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                          <User className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold">{customer.full_name}</h3>
                        <p className="text-sm text-gray-600">Customer ID: #{customer.id}</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{customer.email}</span>
                        {customer.email_verified_at && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{customer.phone_number}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{customer.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-700">Statistics</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{customer.total_bookings}</div>
                        <div className="text-sm text-gray-600">Total Bookings</div>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{customer.passed_tests}</div>
                        <div className="text-sm text-gray-600">Passed Tests</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{customer.failed_tests}</div>
                        <div className="text-sm text-gray-600">Failed Tests</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Member Since:</span>
                        <span>{new Date(customer.created_at).toLocaleDateString()}</span>
                      </div>
                      {customer.email_verified_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Email Verified:</span>
                          <span>{new Date(customer.email_verified_at).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bookings History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5 text-blue-600" />
                  Booking History ({customer.bookings?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.bookings && customer.bookings.length > 0 ? (
                  <div className="space-y-4">
                    {customer.bookings.map((booking) => (
                      <BookingCard key={booking.id} booking={booking} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No bookings found for this customer</p>
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