// components/tables/CouponUsageTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ChevronRight, Gift, Search, RefreshCw, User, Mail, Phone, Calendar, MapPin, Car } from 'lucide-react';
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
import { formatCAD } from '@/lib/utils';
import type { AdminCouponUsage, AdminCouponUsageParams, AdminBooking } from '@/types/admin';

interface CouponUsageTableProps {
  title: string;
  data: AdminCouponUsage[];
  isLoading?: boolean;
  onSearch?: (params: Partial<AdminCouponUsageParams>) => void;
  onRefresh?: () => void;
  showCouponColumn?: boolean;
  /** Map of coupon code -> real discount in cents (the usage record's discount_amount is unreliable). */
  couponDiscounts?: Record<string, number>;
}

// Map a usage record into a (partial) AdminBooking for the detail modal.
// There is no single-booking GET endpoint, so we surface what the usage row carries.
function usageToBooking(usage: AdminCouponUsage, discount: number): AdminBooking {
  return {
    id: usage.booking_id,
    user_id: 0,
    full_name: usage.customer_name,
    phone_number: usage.customer_phone,
    instructor_full_name: usage.instructor_name || undefined,
    test_center_id: 0,
    test_center_name: usage.test_center_name,
    test_center_address: '',
    test_type: (usage.test_type as 'G2' | 'G') || 'G2',
    test_date: usage.booking_date,
    meet_at_center: usage.meet_at_center,
    pickup_address: usage.pickup_address || undefined,
    // No line-item breakdown in the usage record. Set base to the pre-coupon
    // amount (charged + discount) so the modal's breakdown reconciles to the total.
    base_price: usage.total_price + discount,
    pickup_price: 0,
    addons_price: 0,
    total_price: usage.total_price,
    status: usage.booking_status,
    coupon_code: usage.coupon_code,
    discount_amount: discount,
    is_rescheduled: false,
    timezone: 'America/Toronto',
    created_at: usage.booking_created_at || usage.created_at,
    updated_at: usage.booking_created_at || usage.created_at,
  };
}

export default function CouponUsageTable({ 
  title, 
  data, 
  isLoading = false,
  onSearch,
  onRefresh,
  showCouponColumn = true,
  couponDiscounts,
}: CouponUsageTableProps) {
  const [customerSearch, setCustomerSearch] = useState('');
  const [couponSearch, setCouponSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [testTypeFilter, setTestTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  // The usage record's discount_amount is unreliable; prefer the coupon's real discount.
  const realDiscount = (usage: AdminCouponUsage): number =>
    couponDiscounts?.[usage.coupon_code] ?? usage.discount_amount;

  const handleSearch = () => {
    if (onSearch) {
      // The backend ANDs customer_name and customer_email, so sending the same term
      // to both matches nothing. Route by whether the term looks like an email.
      const term = customerSearch.trim();
      const isEmail = term.includes('@');
      onSearch({
        customer_name: term && !isEmail ? term : undefined,
        customer_email: term && isEmail ? term : undefined,
        coupon_code: couponSearch || undefined,
        booking_status: statusFilter || undefined,
        test_type: testTypeFilter || undefined,
        usage_date_from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
        usage_date_to: dateTo ? new Date(dateTo).toISOString() : undefined,
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

            <div>
              <label className="text-xs text-gray-500">Used from</label>
              <Input type="datetime-local" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} disabled={isLoading} className="text-sm" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Used to</label>
              <Input type="datetime-local" value={dateTo} onChange={(e) => setDateTo(e.target.value)} disabled={isLoading} className="text-sm" />
            </div>

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
                <TableRow
                  key={usage.id}
                  onClick={() => setSelectedBooking(usageToBooking(usage, realDiscount(usage)))}
                  className="hover:bg-gray-50 hover:cursor-pointer"
                >
                  {showCouponColumn && (
                    <TableCell>
                      <div>
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-primary" />
                          <span className="font-mono font-medium">{usage.coupon_code}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{usage.coupon_name}</p>
                        <div className="mt-1">
                          <span className="text-sm font-medium text-green-600">{formatCAD(realDiscount(usage))} off</span>
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
                      <div className="font-medium">
                        <span className="line-through text-gray-500">{formatCAD(usage.total_price + realDiscount(usage))}</span>
                      </div>
                      <div className="font-medium text-green-600">{formatCAD(usage.total_price)}</div>
                      <div className="text-xs text-red-600">Saved: {formatCAD(realDiscount(usage))}</div>
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
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>

    <BookingDetailModal
      isOpen={selectedBooking !== null}
      onClose={() => setSelectedBooking(null)}
      booking={selectedBooking}
      onBookingUpdate={onRefresh}
    />
    </>
  );
}