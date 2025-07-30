// components/tables/EnhancedBookingsTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, User, MapPin, Calendar, DollarSign, UserPlus, Phone, FileText, IdCard, ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import BookingDetailModal from '@/components/modals/BookingDetailModal';
import type { AdminBooking } from '@/types/admin';

export interface EnhancedBookingData {
  id: string;
  userName: string;
  userPhone: string;
  centerName: string;
  centerAddress: string;
  pickupLocation: string;
  dateTime: string;
  testType: 'G2' | 'G';
  totalPrice: number;
  basePrice: number;
  pickupPrice: number;
  addonsPrice: number;
  instructorName?: string;
  instructorPhone?: string;
  status: string;
  testResult?: string;
  hasInstructor: boolean;
  roadTestDocUrl?: string;
  g1LicenseDocUrl?: string;
  couponCode?: string;
  discountAmount?: number;
  originalBooking: AdminBooking; // Add this to pass full booking data
}

interface EnhancedBookingsTableProps {
  title: string;
  data: EnhancedBookingData[];
  showCreateButton?: boolean;
  isLoading?: boolean;
  onAssignInstructor?: (bookingId: string) => void;
}

export default function EnhancedBookingsTable({ 
  title, 
  data,
  showCreateButton = false,
  isLoading = false,
  onAssignInstructor
}: EnhancedBookingsTableProps) {
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const getStatusDisplay = (status: string) => {
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

    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getTestResultBadge = (result?: string) => {
    if (!result) return null;
    
    return result === 'PASS' ? (
      <Badge className="bg-green-100 text-green-800">
        ✓ Passed
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        ✗ Failed
      </Badge>
    );
  };

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)} CAD`;
  };

  const formatInstructorFee = (totalPrice: number) => {
    // Assuming instructor fee is 25% of total price (adjust as needed)
    const instructorFee = Math.round(totalPrice * 0.25);
    return formatPrice(instructorFee);
  };

  const formatPickupLocation = (booking: EnhancedBookingData) => {
    if (booking.pickupLocation.includes('Meet at Center')) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-blue-700">Meet at Test Center</span>
        </div>
      );
    }

    const [pickup, dropoff] = booking.pickupLocation.split(' --- ');
    return (
      <div className="space-y-1">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-green-700">Pickup:</p>
            <p className="text-xs text-gray-600 break-words">{pickup}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-6">
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700">Dropoff:</p>
            <p className="text-xs text-gray-600 break-words">{dropoff}</p>
          </div>
        </div>
      </div>
    );
  };

  const handleViewDetails = (booking: EnhancedBookingData) => {
    setSelectedBooking(booking.originalBooking);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            {showCreateButton && (
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                Create a Booking
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Loading Skeleton */}
          {isLoading && (
            <TableSkeleton rows={5} columns={10} />
          )}

          {/* Table with Data */}
          {!isLoading && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Details</TableHead>
                  <TableHead>Test Center</TableHead>
                  <TableHead className="min-w-[200px]">Pickup → Dropoff Location</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Test Type</TableHead>
                  <TableHead>Total Price</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Instructor Fee</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                      No bookings found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((booking) => (
                    <TableRow key={booking.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{booking.userName}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {booking.userPhone}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{booking.centerName}</p>
                          <p className="text-xs text-gray-500">{booking.centerAddress}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatPickupLocation(booking)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{booking.dateTime}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="font-medium">
                            {booking.testType}
                          </Badge>
                          {getTestResultBadge(booking.testResult)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="font-medium text-green-600">
                            {formatPrice(booking.totalPrice)}
                          </div>
                          <div className="text-xs text-gray-500 space-y-1">
                            <div>Base: {formatPrice(booking.basePrice)}</div>
                            {booking.pickupPrice > 0 && (
                              <div>Pickup: {formatPrice(booking.pickupPrice)}</div>
                            )}
                            {booking.addonsPrice > 0 && (
                              <div>Addons: {formatPrice(booking.addonsPrice)}</div>
                            )}
                            {booking.discountAmount && booking.discountAmount > 0 && (
                              <div className="text-red-600">
                                Discount: -{formatPrice(booking.discountAmount)}
                                {booking.couponCode && ` (${booking.couponCode})`}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.hasInstructor && booking.instructorName ? (
                          <div>
                            <p className="text-sm font-medium">{booking.instructorName}</p>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Phone className="w-3 h-3" />
                              {booking.instructorPhone}
                            </div>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs"
                            onClick={() => onAssignInstructor?.(booking.id)}
                          >
                            <UserPlus className="w-3 h-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium text-sm">
                          {formatInstructorFee(booking.totalPrice)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusDisplay(booking.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {booking.roadTestDocUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(booking.roadTestDocUrl, '_blank')}
                              title="Road Test Document"
                            >
                              <FileText className="w-3 h-3" />
                            </Button>
                          )}
                          {booking.g1LicenseDocUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(booking.g1LicenseDocUrl, '_blank')}
                              title="G1 License Document"
                            >
                              <IdCard className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(booking)}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Booking Detail Modal */}
      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        booking={selectedBooking}
      />
    </>
  );
}