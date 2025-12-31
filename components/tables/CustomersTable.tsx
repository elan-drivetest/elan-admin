// components/tables/CustomersTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreVertical, User, Mail, Phone, CheckCircle, XCircle, Search, RefreshCw, Users } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import type { AdminCustomer, AdminCustomersParams } from '@/types/admin';
import CustomerDetailModal from '../modals/CustomerDetailModal';

interface CustomersTableProps {
  title: string;
  data: AdminCustomer[];
  isLoading?: boolean;
  onSearch?: (params: Partial<AdminCustomersParams>) => void;
  onRefresh?: () => void;
}

export default function CustomersTable({ 
  title, 
  data, 
  isLoading = false,
  onSearch,
  onRefresh
}: CustomersTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (customerId: number) => {
    setSelectedCustomerId(customerId.toString());
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCustomerId(null);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        search: searchTerm || undefined,
        email: emailSearch || undefined,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getRideBookedDisplay = (hasBooked: boolean) => {
    return hasBooked ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Yes
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <XCircle className="w-3 h-3 mr-1" />
        No
      </Badge>
    );
  };

  const getTestStatusDisplay = (passedCount: string | number, failedCount: string | number, totalRides: string | number) => {
    const passed = parseInt(passedCount?.toString() || '0', 10);
    const failed = parseInt(failedCount?.toString() || '0', 10);
    const total = parseInt(totalRides?.toString() || '0', 10);
    
    if (total === 0) {
      return (
        <Badge className="bg-gray-100 text-gray-800">
          Not Attempted
        </Badge>
      );
    }
    
    if (passed > 0) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Passed ({passed})
        </Badge>
      );
    }
    
    if (failed > 0) {
      return (
        <Badge className="bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Failed ({failed})
        </Badge>
      );
    }

    return (
      <Badge className="bg-yellow-100 text-yellow-800">
        In Progress
      </Badge>
    );
  };

  return (
    <>
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
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <Button onClick={handleSearch} disabled={isLoading}>
                Search
              </Button>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {/* Loading Skeleton */}
          {isLoading && data.length === 0 && (
            <TableSkeleton rows={5} columns={8} />
          )}

          {/* Empty State */}
          {!isLoading && data.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No customers found</p>
            </div>
          )}

          {/* Table with Data */}
          {!isLoading && data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Full name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Any Ride Booked?</TableHead>
                  <TableHead>Total Rides</TableHead>
                  <TableHead>Test Status</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((customer) => (
                  <TableRow key={customer.id} onClick={() => handleViewDetails(customer.id)} className="hover:bg-gray-50 hover:cursor-pointer">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-600" />
                        </div>
                        <span className="font-medium text-sm">{customer.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{customer.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">{customer.contact}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRideBookedDisplay(customer.any_ride_booked)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{customer.total_ride_count}</span>
                    </TableCell>
                    <TableCell>
                      {getTestStatusDisplay(customer.passed_count, customer.failed_count, customer.total_ride_count)}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(customer.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(customer.id)}
                        disabled={isLoading}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Customer Detail Modal */}
      <CustomerDetailModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        customerId={selectedCustomerId}
      />
    </>
  );
}