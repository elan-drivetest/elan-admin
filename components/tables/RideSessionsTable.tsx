// components/tables/RideSessionsTable.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, User, MapPin, Calendar, DollarSign, Route, GraduationCap } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface RideSessionData {
  id: string;
  userName: string;
  centerName: string;
  pickupLocation: string;
  dateTime: string;
  testType: 'G1' | 'G2';
  price: number;
  instructorName: string;
  distance: string;
  duration: string;
  status: 'on_progress' | 'completed' | 'cancelled' | 'scheduled';
}

interface RideSessionsTableProps {
  title: string;
  data: RideSessionData[];
}

export default function RideSessionsTable({ title, data }: RideSessionsTableProps) {
  const getStatusDisplay = (status: string) => {
    const statusConfig = {
      'on_progress': { color: 'bg-blue-100 text-blue-800', text: 'on progress' },
      'completed': { color: 'bg-green-100 text-green-800', text: 'completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'cancelled' },
      'scheduled': { color: 'bg-yellow-100 text-yellow-800', text: 'scheduled' },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', text: status };

    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getPriceDisplay = (price: number) => {
    return <span className="text-green-600 font-medium">${price} CAD</span>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User name</TableHead>
              <TableHead>Center Name</TableHead>
              <TableHead>Pickup --- dropoff Location</TableHead>
              <TableHead>date and time</TableHead>
              <TableHead>G1/G2</TableHead>
              <TableHead>$200 CAD</TableHead>
              <TableHead>Instructors Name</TableHead>
              <TableHead>$50 CAD</TableHead>
              <TableHead>120 km</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-gray-500">
                  No ride sessions found
                </TableCell>
              </TableRow>
            ) : (
              data.map((session) => (
                <TableRow key={session.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium text-sm">{session.userName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{session.centerName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[150px]">
                      <span className="truncate">{session.pickupLocation}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{session.dateTime}</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {session.testType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getPriceDisplay(session.price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium">{session.instructorName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-green-600 font-medium">$50 CAD</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Route className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{session.distance}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">{session.duration}</span>
                    </div>
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