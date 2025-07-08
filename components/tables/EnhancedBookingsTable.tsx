// components/tables/EnhancedBookingsTable.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, User, MapPin, Calendar, DollarSign } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface EnhancedBookingData {
  id: string;
  userName: string;
  centerName: string;
  pickupLocation: string;
  dateTime: string;
  testType: 'G2' | 'G';
  price: number;
  instructorName: string;
  status: 'accepted' | 'on progress' | 'searching' | 'transferred' | 'completed' | 'failed' | 'passed' | 'wants_refund';
  paymentStatus: 'paid' | 'pending' | 'refund_requested';
}

interface EnhancedBookingsTableProps {
  title: string;
  data: EnhancedBookingData[];
  showCreateButton?: boolean;
}

export default function EnhancedBookingsTable({ 
  title, 
  data,
  showCreateButton = false
}: EnhancedBookingsTableProps) {

  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      'accepted': { color: 'bg-green-100 text-green-800', text: 'accepted' },
      'on progress': { color: 'bg-blue-100 text-blue-800', text: 'on progress' },
      'searching': { color: 'bg-yellow-100 text-yellow-800', text: 'Searching' },
      'transferred': { color: 'bg-red-100 text-red-800', text: 'Transferred' },
      'completed': { color: 'bg-gray-100 text-gray-800', text: 'completed' },
      'failed': { color: 'bg-red-100 text-red-800', text: 'failed' },
      'passed': { color: 'bg-green-100 text-green-800', text: 'passed' },
      'wants_refund': { color: 'bg-orange-100 text-orange-800', text: 'wants refund' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', text: status };

    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getPriceDisplay = (price: number, status: string) => {
    if (status === 'wants_refund') {
      return <span className="text-red-600 font-medium">${price} CAD</span>;
    }
    return <span className="text-green-600 font-medium">${price} CAD</span>;
  };

  return (
    <Card>
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User name</TableHead>
              <TableHead>Center Name</TableHead>
              <TableHead>Pickup --- dropoff Location</TableHead>
              <TableHead>date and time</TableHead>
              <TableHead>G2/G2</TableHead>
              <TableHead>$200 CAD</TableHead>
              <TableHead>Instructors name</TableHead>
              <TableHead>$50 CAD</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
                      <span className="font-medium text-sm">{booking.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{booking.centerName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[150px]">
                      <span className="truncate">{booking.pickupLocation}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{booking.dateTime}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {booking.testType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getPriceDisplay(booking.price, booking.status)}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{booking.instructorName}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">$50 CAD</span>
                  </TableCell>
                  <TableCell>
                    {getStatusDisplay(booking.status)}
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