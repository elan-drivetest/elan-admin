// components/tables/CouponUsageTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreVertical, Gift, Search, RefreshCw, User, Mail, Phone, Calendar, DollarSign, MapPin, Car } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import Link from 'next/link';
import type { AdminCouponUsage, AdminCouponUsageParams } from '@/types/admin';

interface CouponUsageTableProps {
  title: string;
  data: AdminCouponUsage[];
  isLoading?: boolean;
  onSearch?: (params: Partial<AdminCouponUsageParams>) => void;
  onRefresh?: () => void;
  showCouponColumn?: boolean;
}

export default function CouponUsageTable({ 
  title, 
  data, 
  isLoading = false,
  onSearch,
  onRefresh,
  showCouponColumn = true
}: CouponUsageTableProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        customer_name: customerSearch || undefined,
        customer_email: customerSearch || undefined,
        coupon_code: couponSearch || undefined,
        booking_status: statusFilter || undefined,
        test_type: testTypeFilter || undefined,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getBookingStatusBadge = (status: string) => {
    const statusConfig = {
      'confirmed': { color: 'bg-green-100 text-green-800', text: 'Confirmed' },
      'completed': { color: 'bg-blue-100 text-blue-800', text: 'Completed' },
      'cancelled': { color: 'bg-red-100 text-red-800', text: 'Cancelled' },
      'pending': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      'active': { color: 'bg-purple-100 text-purple-800', text: 'Active' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', text: status };
    
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search customer..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            
            {showCouponColumn && (
              <div className="relative">
                <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search coupon..."
                  value={couponSearch}
                  onChange={(e) => setCouponSearch(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            )}
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              disabled={isLoading}
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="pending">Pending</option>
              <option value="active">Active</option>
            </select>
            
            <select
              value={testTypeFilter}
              onChange={(e) => setTestTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              disabled={isLoading}
            >
              <option value="">All Test Types</option>
              <option value="G2">G2</option>
              <option value="G">G (Full)</option>
            </select>
            
            <div className="sm:col-span-2 lg:col-span-4">
              <Button onClick={handleSearch} disabled={isLoading} className="w-full sm:w-auto">
                Search
              </Button>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading && data.length === 0 && (
          <TableSkeleton rows={5} columns={showCouponColumn ? 8 : 7} />
        )}

        {!isLoading && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No usage data found</p>
          </div>
        )}

        {!isLoading && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                {showCouponColumn && <TableHead>Coupon</TableHead>}
                <TableHead>Customer</TableHead>
                <TableHead>Booking Details</TableHead>
                <TableHead>Test Info</TableHead>
                <TableHead>Pricing</TableHead>
                <TableHead>Instructor</TableHead>
                <TableHead>Usage Date</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((usage) => (
                <TableRow key={usage.id} className="hover:bg-gray-50">
                  {showCouponColumn && (
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-primary" />
                          <span className="font-mono font-medium">{usage.coupon_code}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{usage.coupon_name}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <DollarSign className="w-3 h-3 text-green-500" />
                          <span className="text-sm font-medium text-green-600">{formatPrice(usage.discount_amount)}</span>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{usage.customer_name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Mail className="w-3 h-3" />
                          <span>{usage.customer_email}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          <span>{usage.customer_phone}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium">Booking #{usage.booking_id}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(usage.booking_date)}</span>
                      </div>
                      <div className="mt-1">
                        {getBookingStatusBadge(usage.booking_status)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div>
                      <Badge variant="outline" className="font-medium mb-1">
                        {usage.test_type}
                      </Badge>
                      <p className="text-sm font-medium">{usage.test_center_name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <MapPin className="w-3 h-3" />
                        <span>{usage.meet_at_center ? 'Meet at Center' : 'Pickup Service'}</span>
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="w-3 h-3 text-gray-400" />
                        <span className="line-through text-gray-500">{formatPrice(usage.total_price)}</span>
                      </div>
                      <div className="flex items-center gap-1 font-medium text-green-600">
                        <DollarSign className="w-3 h-3" />
                        <span>{formatPrice(usage.final_price)}</span>
                      </div>
                      <div className="text-xs text-red-600">
                        Saved: {formatPrice(usage.discount_amount)}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                        <Car className="w-3 h-3 text-blue-600" />
                      </div>
                      <span className="text-sm">{usage.instructor_name}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span className="text-sm">{formatDate(usage.created_at)}</span>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <Link href={`/bookings?booking_id=${usage.booking_id}`}>
                      <Button variant="ghost" size="sm" disabled={isLoading}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}