// components/tables/InstructorsTable.tsx - Updated to handle null values properly
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreVertical, User, Mail, Car, MapPin, Calendar, Star, Search, RefreshCw, Phone, AlertCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import InstructorDetailModal from '@/components/modals/InstructorDetailModal';
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
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to safely parse numbers
  const safeParseFloat = (value: any): number => {
    const parsed = parseFloat(value?.toString() || '0');
    return isNaN(parsed) ? 0 : parsed;
  };

  const safeParseInt = (value: any): number => {
    const parsed = parseInt(value?.toString() || '0', 10);
    return isNaN(parsed) ? 0 : parsed;
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

  const formatPrice = (price: number | string) => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `$${(numericPrice / 100).toFixed(2)}`;
  };

  const handleViewDetails = (instructorId: number) => {
    setSelectedInstructorId(instructorId.toString());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInstructorId(null);
  };

  // Check if instructor has vehicle info
  const hasVehicleInfo = (instructor: AdminInstructor) => {
    return instructor.vehicle_brand || 
           instructor.vehicle_model || 
           instructor.vehicle_year || 
           instructor.vehicle_color;
  };

  // Check if instructor is active (has any activity)
  const isActiveInstructor = (instructor: AdminInstructor) => {
    return safeParseInt(instructor.transferred_rides_count) > 0 ||
           safeParseFloat(instructor.wallet_balance) > 0 ||
           safeParseFloat(instructor.withdrawn_amount) > 0;
  };

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {title}
              <Badge variant="outline" className="text-xs">
                {data.length} total
              </Badge>
            </CardTitle>
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
          
          {/* Search Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <Input
              placeholder="Search by name..."
              value={instructorSearch}
              onChange={(e) => setInstructorSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm"
            />
            <Input
              placeholder="Search by email..."
              value={emailSearch}
              onChange={(e) => setEmailSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm"
            />
            <Input
              placeholder="Search by vehicle..."
              value={vehicleSearch}
              onChange={(e) => setVehicleSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="text-sm"
            />
            <Button onClick={handleSearch} disabled={isLoading}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && data.length === 0 ? (
            <TableSkeleton columns={8} rows={5} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Finances</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      <User className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No instructors found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((instructor, index) => (
                    <TableRow key={instructor.id || index} className={!isActiveInstructor(instructor) ? 'opacity-75' : ''}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isActiveInstructor(instructor) ? 'bg-primary' : 'bg-gray-400'}`}>
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-sm flex items-center gap-2">
                              {instructor.instructor_name}
                              {!isActiveInstructor(instructor) && (
                                <Badge variant="secondary" className="text-xs">New</Badge>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {instructor.address || (
                                <span className="flex items-center gap-1 text-orange-600">
                                  <AlertCircle className="w-3 h-3" />
                                  No address provided
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <span className="truncate max-w-[120px]">{instructor.email}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <span>{instructor.phone_number}</span>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        {hasVehicleInfo(instructor) ? (
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-blue-500" />
                            <div>
                              <div className="text-sm font-medium">
                                {[instructor.vehicle_brand, instructor.vehicle_model].filter(Boolean).join(' ') || 'Unknown Vehicle'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {[instructor.vehicle_year, instructor.vehicle_color].filter(Boolean).join(' • ') || 'No details'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-orange-600">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                              <div className="text-sm font-medium">No Vehicle</div>
                              <div className="text-xs">Not configured</div>
                            </div>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        {isActiveInstructor(instructor) ? (
                          <div className="space-y-1">
                            <div className="text-sm">
                              Avg: {formatPrice(safeParseFloat(instructor.average_wage_per_ride))}
                            </div>
                            <div className="text-xs text-gray-500">
                              {safeParseFloat(instructor.average_distance_per_ride).toFixed(1)}km • 
                              {safeParseFloat(instructor.average_time_per_ride).toFixed(1)}h
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-400">
                            <div className="text-sm">No Data</div>
                            <div className="text-xs">No rides yet</div>
                          </div>
                        )}
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`text-sm font-medium ${safeParseFloat(instructor.wallet_balance) > 0 ? 'text-green-600' : 'text-gray-500'}`}>
                            Balance: {formatPrice(safeParseFloat(instructor.wallet_balance))}
                          </div>
                          <div className="text-xs text-gray-500">
                            Withdrawn: {formatPrice(safeParseFloat(instructor.withdrawn_amount))}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="text-center">
                          <div className={`text-sm font-medium ${safeParseInt(instructor.transferred_rides_count) > 0 ? 'text-primary' : 'text-gray-400'}`}>
                            {safeParseInt(instructor.transferred_rides_count)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {safeParseInt(instructor.transferred_rides_count) === 0 ? 'No rides' : 'rides'}
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-xs">
                            {new Date(instructor.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleViewDetails(instructor.id)}
                          disabled={isLoading}
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

          {/* Loading overlay for refresh */}
          {isLoading && data.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Refreshing...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructor Detail Modal */}
      <InstructorDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        instructorId={selectedInstructorId}
      />
    </>
  );
}