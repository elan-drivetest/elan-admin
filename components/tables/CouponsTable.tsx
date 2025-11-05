// components/tables/CouponsTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreVertical, Gift, Search, RefreshCw, Calendar, DollarSign, Users } from 'lucide-react';
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
import type { AdminCoupon, AdminCouponsParams } from '@/types/admin';

interface CouponsTableProps {
  title: string;
  data: AdminCoupon[];
  isLoading?: boolean;
  onSearch?: (params: Partial<AdminCouponsParams>) => void;
  onRefresh?: () => void;
}

export default function CouponsTable({ 
  title, 
  data, 
  isLoading = false,
  onSearch,
  onRefresh
}: CouponsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [codeSearch, setCodeSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        search: searchTerm || undefined,
        code: codeSearch || undefined,
        is_active: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadge = (coupon: AdminCoupon) => {
    if (coupon.is_expired) {
      return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
    }
    if (!coupon.is_active) {
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>;
  };

  const getCouponTypeBadges = (coupon: AdminCoupon) => (
    <div className="flex gap-1">
      {coupon.is_recurrent && (
        <Badge variant="outline" className="text-xs">Recurring</Badge>
      )}
      {coupon.is_failure_coupon && (
        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">Failure</Badge>
      )}
    </div>
  );

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
              <Gift className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by coupon code..."
                value={codeSearch}
                onChange={(e) => setCodeSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              disabled={isLoading}
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
            </select>
            <Button onClick={handleSearch} disabled={isLoading}>
              Search
            </Button>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {isLoading && data.length === 0 && (
          <TableSkeleton rows={5} columns={8} />
        )}

        {!isLoading && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Gift className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No coupons found</p>
          </div>
        )}

        {!isLoading && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Coupon Details</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Purchase</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((coupon) => (
                <TableRow key={coupon.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-sm">{coupon.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{coupon.description}</p>
                      <div className="mt-1">
                        {getCouponTypeBadges(coupon)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-primary" />
                      <span className="font-mono font-medium">{coupon.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-green-600">{formatPrice(coupon.discount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{formatPrice(coupon.min_purchase_amount)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3 text-gray-400" />
                      <span className="text-sm font-medium">{coupon.usage_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(coupon.start_date)}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        to {formatDate(coupon.expires_at)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(coupon)}
                  </TableCell>
                  <TableCell>
                    <Link href={`/settings/coupons/${coupon.id}`}>
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