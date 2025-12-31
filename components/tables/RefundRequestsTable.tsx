// components/tables/RefundRequestsTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { DollarSign, Search, RefreshCw, Calendar, Receipt, User, FileText } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import type { RefundRequest, GetRefundRequestsParams, RefundStatus } from '@/types/refund';

interface RefundRequestsTableProps {
  title: string;
  data: RefundRequest[];
  isLoading?: boolean;
  onSearch?: (params: Partial<GetRefundRequestsParams>) => void;
  onRefresh?: () => void;
  onRowClick?: (refund: RefundRequest) => void;
}

export default function RefundRequestsTable({
  title,
  data,
  isLoading = false,
  onSearch,
  onRefresh,
  onRowClick
}: RefundRequestsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RefundStatus | ''>('');
  const [bookingIdSearch, setBookingIdSearch] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        customerName: searchTerm || undefined,
        status: statusFilter || undefined,
        booking_id: bookingIdSearch ? parseInt(bookingIdSearch) : undefined,
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getStatusBadge = (status: RefundStatus) => {
    const statusConfig: Record<RefundStatus, { bg: string; text: string; label: string }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pending' },
      approved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Completed' },
      processing: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Processing' },
      failed: { bg: 'bg-red-200', text: 'text-red-900', label: 'Failed' },
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return <Badge className={`${config.bg} ${config.text}`}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number) => {
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
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by customer name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <div className="relative flex-1">
              <Receipt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by booking ID..."
                value={bookingIdSearch}
                onChange={(e) => setBookingIdSearch(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RefundStatus | '')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              disabled={isLoading}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="failed">Failed</option>
            </select>
            <Button onClick={handleSearch} disabled={isLoading}>
              Search
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {isLoading && data.length === 0 && (
          <TableSkeleton rows={5} columns={7} />
        )}

        {!isLoading && data.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No refund requests found</p>
          </div>
        )}

        {!isLoading && data.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Refund %</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Request Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((refund) => (
                <TableRow key={refund.id ?? refund.booking_id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-500" />
                      <span className="font-mono text-sm">#{refund.booking_id}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-green-500" />
                      <span className="font-medium text-green-600">{formatCurrency(refund.amount)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {refund.refund_percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 max-w-[200px]">
                      <FileText className="w-3 h-3 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-600 truncate" title={refund.refund_reason || 'No reason'}>
                        {refund.refund_reason || <span className="text-gray-400 italic">No reason</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <span>{formatDate(refund.request_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(refund.status)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onRowClick?.(refund)}
                      disabled={isLoading}
                    >
                      View Details
                    </Button>
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
