// components/tables/BookingsTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ToggleSwitch from '@/components/ui/toggle-switch';
import { MoreVertical, User, MapPin, Calendar, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import BookingDetailModal from '@/components/modals/BookingDetailModal';
import { formatBookingStatus, formatCAD } from '@/lib/utils';
import { deriveBookingAdjustment } from '@/lib/utils/booking-calculations';
import type { AdminBooking } from '@/types/admin';

export interface BookingTableData {
  id: string;
  userName: string;
  userPhone: string;
  centerName: string;
  centerAddress: string;
  pickupLocation: string;
  dateTime: string;
  status: string;
  testResult?: string;
  hasInstructor: boolean;
  instructorName?: string;
  instructorPhone?: string;
  testType: 'G2' | 'G';
  totalPrice: number;
  basePrice: number;
  pickupPrice: number;
  addonsPrice: number;
  originalBooking: AdminBooking; // Add this to pass full booking data
}

interface BookingsTableProps {
  title: string;
  data: BookingTableData[];
  isLoading?: boolean;
  onAssignInstructor?: (bookingId: string) => void;
  onRefresh?: () => void;
}

export default function BookingsTable({
  title,
  data,
  isLoading = false,
  onAssignInstructor,
  onRefresh
}: BookingsTableProps) {
  const [showInstructorAttachedOnly, setShowInstructorAttachedOnly] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const getTestResultBadge = (result?: string) => {
    if (!result) return null;
    
    return result === 'PASS' ? (
      <Badge className="bg-green-100 text-green-800 ml-2">
        Passed
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800 ml-2">
        Failed
      </Badge>
    );
  };

  const formatPrice = (price: number) => formatCAD(price, { suffix: false });

  const formatPickupLocation = (booking: BookingTableData) => {
    if (booking.pickupLocation.includes('Meet at Center')) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-blue-700">Meet at Test Center</span>
        </div>
      );
    }

    // For dashboard, show a simplified version
    return (
      <div className="flex items-center gap-2 text-sm">
        <MapPin className="w-4 h-4 text-green-500" />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-green-700 truncate">Pickup Service</p>
          <p className="text-xs text-gray-600">Click for details</p>
        </div>
      </div>
    );
  };

  const handleViewDetails = (booking: BookingTableData) => {
    setSelectedBooking(booking.originalBooking);
    setIsDetailModalOpen(true);
  };

  const filteredData = data.filter((booking) => {
    if (showInstructorAttachedOnly && !booking.hasInstructor) return false;
    return true;
  });

  return (
    <ErrorBoundary>
      <>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">{title}</CardTitle>
              {!isLoading && (
                <div className="flex items-center gap-4">
                  <ToggleSwitch
                    checked={showInstructorAttachedOnly}
                    onCheckedChange={setShowInstructorAttachedOnly}
                    label="Has Instructor"
                    size="sm"
                  />
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading Skeleton */}
            {isLoading && (
              <TableSkeleton rows={5} columns={8} />
            )}

            {/* Table with Data */}
            {!isLoading && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Test Center</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Test Type</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Instructor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        {data.length === 0 ? 'No bookings found' : 'No bookings found matching the selected filters'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((booking) => (
                      <TableRow key={booking.id} onClick={() => handleViewDetails(booking)} className="hover:bg-gray-50 hover:cursor-pointer">
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
                            <div className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span className="text-sm font-medium">{booking.centerName}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{booking.centerAddress}</p>
                            <div className="mt-1">
                              {formatPickupLocation(booking)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span className="text-sm">{booking.dateTime}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {booking.testType}
                          </Badge>
                          {getTestResultBadge(booking.testResult)}
                        </TableCell>
                        <TableCell>
                          {/* The components do NOT sum to total_price when a
                              long-trip credit or a coupon applied, so the gap is
                              derived and shown rather than left unexplained. */}
                          {(() => {
                            const { adjustment } = deriveBookingAdjustment({
                              base_price: booking.basePrice,
                              pickup_price: booking.pickupPrice,
                              addons_price: booking.addonsPrice,
                              total_price: booking.totalPrice,
                            });
                            return (
                              <div className="text-sm">
                                <div className="flex items-center gap-1 font-medium text-green-600">
                                  {formatPrice(booking.totalPrice)}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Base: {formatPrice(booking.basePrice)}
                                  {booking.pickupPrice > 0 && ` + Pickup: ${formatPrice(booking.pickupPrice)}`}
                                  {booking.addonsPrice > 0 && ` + Addons: ${formatPrice(booking.addonsPrice)}`}
                                </div>
                                {adjustment > 0 && (
                                  <div className="text-xs text-red-600">
                                    − Adjustments: {formatPrice(adjustment)}
                                    {booking.originalBooking.coupon_code
                                      ? ` (${booking.originalBooking.coupon_code})`
                                      : ''}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onAssignInstructor?.(booking.id);
                              }}
                            >
                              Assign Instructor
                            </Button>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={formatBookingStatus(booking.status).className}>
                            {formatBookingStatus(booking.status).label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewDetails(booking);
                            }}
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
          onBookingUpdate={onRefresh}
        />
      </>
    </ErrorBoundary>
  );
}