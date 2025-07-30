// components/tables/InstructorsTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreVertical, User, Mail, Car, MapPin, Calendar, Star, Search, RefreshCw, Phone } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import type { AdminInstructor, AdminInstructorsParams } from '@/types/admin';

interface InstructorsTableProps {
  title: string;
  data: AdminInstructor[];
  isLoading?: boolean;
  onSearch?: (params: Partial<AdminInstructorsParams>) => void;
  onRefresh?: () => void;
}

export default function InstructorsTable({ 
  title, 
  data, 
  isLoading = false,
  onSearch,
  onRefresh
}: InstructorsTableProps) {
  const [instructorSearch, setInstructorSearch] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [vehicleSearch, setVehicleSearch] = useState('');

  // Helper function to safely parse numbers
  const safeParseFloat = (value: any): number => {
    const parsed = parseFloat(value?.toString() || '0');
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeParseInt = (value: any): number => {
    const parsed = parseInt(value?.toString() || '0', 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Format currency from cents to dollars safely
  const formatCurrency = (amount: number | string) => {
    const numAmount = safeParseFloat(amount);
    return `$${(numAmount / 100).toFixed(0)}`;
  };

  // Format time safely
  const formatTime = (time: any) => {
    const numTime = safeParseFloat(time);
    return numTime.toFixed(1);
  };

  // Format distance safely
  const formatDistance = (distance: any) => {
    const numDistance = safeParseFloat(distance);
    return numDistance.toFixed(1);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        instructorName: instructorSearch || undefined,
        email: emailSearch || undefined,
        vehicleBrand: vehicleSearch || undefined,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getVehicleDisplay = (instructor: AdminInstructor) => {
    return `${instructor.vehicle_year} ${instructor.vehicle_brand} ${instructor.vehicle_model}`;
  };

  return (
    <Card>
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
        
        {onSearch && (
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by instructor name..."
                value={instructorSearch}
                onChange={(e) => setInstructorSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by email..."
                value={emailSearch}
                onChange={(e) => setEmailSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <div className="relative flex-1">
              <Car className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by vehicle brand..."
                value={vehicleSearch}
                onChange={(e) => setVehicleSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading}>
              Search
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="relative">
        {/* Loading Skeleton */}
        {isLoading && data.length === 0 && (
          <TableSkeleton rows={5} columns={12} />
        )}

        {/* Empty State */}
        {!isLoading && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No instructors found</p>
          </div>
        )}

        {/* Table with Data */}
        {!isLoading && data.length > 0 && (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicle Details</TableHead>
                  <TableHead>Withdrawn</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Avg Wage/ride</TableHead>
                  <TableHead>Avg Time/ride</TableHead>
                  <TableHead>Avg Distance/ride</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Transfers</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((instructor) => (
                  <TableRow key={instructor.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{instructor.instructor_name}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">4.0 rating</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{instructor.email}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-gray-400" />
                          <span className="text-sm">{instructor.phone_number}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Car className="w-3 h-3 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium">{getVehicleDisplay(instructor)}</p>
                          <p className="text-xs text-gray-500">{instructor.vehicle_color}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-red-600">
                        {formatCurrency(instructor.withdrawn_amount)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-green-600">
                        {formatCurrency(instructor.wallet_balance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">
                        {formatCurrency(instructor.average_wage_per_ride)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{formatTime(instructor.average_time_per_ride)}hr</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{formatDistance(instructor.average_distance_per_ride)}km</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm max-w-[120px]">
                        <span className="truncate block">{instructor.address}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {safeParseInt(instructor.transferred_rides_count)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(instructor.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Loading overlay for refresh */}
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