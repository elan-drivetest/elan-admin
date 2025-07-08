// components/tables/BookingsTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ToggleSwitch from '@/components/ui/toggle-switch';
import { MoreVertical, User, MapPin, Calendar, Clock } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface BookingTableData {
  id: string;
  userName: string;
  centerName: string;
  pickupLocation: string;
  dateTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  hasInstructor: boolean;
  testType: 'G2' | 'G';
  price: number;
}

interface BookingsTableProps {
  title: string;
  data: BookingTableData[];
  showFilters?: boolean;
}

export default function BookingsTable({ 
  title, 
  data, 
  showFilters = true 
}: BookingsTableProps) {
  const [transformedRide, setTransformedRide] = useState(false);
  const [instructorAttached, setInstructorAttached] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredData = data.filter((booking) => {
    if (transformedRide && booking.pickupLocation === 'Meet at Center') return false;
    if (instructorAttached && !booking.hasInstructor) return false;
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {showFilters && (
            <div className="flex items-center gap-4">
              <ToggleSwitch
                checked={transformedRide}
                onCheckedChange={setTransformedRide}
                label="Transformed Ride"
                size="sm"
              />
              <ToggleSwitch
                checked={instructorAttached}
                onCheckedChange={setInstructorAttached}
                label="Instructor Attached"
                size="sm"
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Test Center</TableHead>
              <TableHead>Pickup/Location</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No bookings found matching the selected filters
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{booking.userName}</p>
                        <p className="text-xs text-gray-500">{booking.testType} Test</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{booking.centerName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[150px]">
                      <p className="truncate">{booking.pickupLocation}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{booking.dateTime}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(booking.status)}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {booking.hasInstructor ? (
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        John Doe
                      </Badge>
                    ) : (
                      <Button size="sm" variant="outline" className="text-xs">
                        Attach Instructors
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}