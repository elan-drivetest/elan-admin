// components/tables/RideSessionsTable.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, User, Calendar, Route, GraduationCap, RefreshCw, MapPin, ArrowRight } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import type { AdminRideSession, AdminRideSessionsParams } from '@/types/admin';

interface RideSessionsTableProps {
  title: string;
  data: AdminRideSession[];
  isLoading?: boolean;
  onSearch?: (params: Partial<AdminRideSessionsParams>) => void;
  onRefresh?: () => void;
  onViewDetails?: (sessionId: string) => void;
}

export default function RideSessionsTable({ 
  title, 
  data, 
  isLoading = false,
  onSearch,
  onRefresh,
  onViewDetails
}: RideSessionsTableProps) {
  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(0)} CAD`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPickupDropoff = (session: AdminRideSession) => {
    const isMeetAtCenter = session.pickupLocation?.toLowerCase().includes('meet at center') ||
                           session.pickupLocation === session.dropoffLocation;

    if (isMeetAtCenter) {
      return (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-blue-500" />
          <span className="font-medium text-blue-700">Meet at Test Center</span>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        <div className="flex items-start gap-2 text-sm">
          <MapPin className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-green-700">Pickup:</p>
            <p className="text-xs text-gray-600 break-words">{session.pickupLocation || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-6">
          <ArrowRight className="w-3 h-3 text-gray-400" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-gray-700">Dropoff:</p>
            <p className="text-xs text-gray-600 break-words">{session.dropoffLocation || 'N/A'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <div className="flex items-center gap-2">
            {onRefresh && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRefresh}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && data.length === 0 && (
          <TableSkeleton rows={5} columns={11} />
        )}

        {!isLoading && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No ride sessions found</p>
          </div>
        )}

        {!isLoading && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User name</TableHead>
                <TableHead>Center Name</TableHead>
                <TableHead className="min-w-[200px]">Pickup → Dropoff Location</TableHead>
                <TableHead>Date and time</TableHead>
                <TableHead>Test Type</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Instructors Name</TableHead>
                <TableHead>Instructor Earnings</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((session) => (
                <TableRow key={session.id} onClick={() => onViewDetails?.(session.id.toString())} className="hover:bg-gray-50 hover:cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="font-medium text-sm">{session.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{session.centerName}</span>
                  </TableCell>
                  <TableCell>
                    {formatPickupDropoff(session)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{formatDateTime(session.dateTime)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {session.testType}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 font-medium">{formatPrice(session.totalPrice)}</span>
                    </div>
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
                    <div className="flex items-center gap-1">
                      <span className="text-green-600 font-medium">{formatPrice(session.instructorEarnings)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Route className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{session.totalDistance}km</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{session.totalHours}hr</span>
                  </TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onViewDetails?.(session.id.toString())}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {isLoading && data.length > 0 && (
          <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
              <RefreshCw className="w-4 h-4 animate-spin text-primary" />
              <span className="text-sm">Refreshing...</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}