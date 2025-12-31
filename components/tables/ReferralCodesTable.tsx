// components/tables/ReferralCodesTable.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { MoreVertical, Gift, Search, RefreshCw, Users, Calendar, DollarSign, Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import ReferralCodeDetailModal from '@/components/modals/ReferralCodeDetailModal';
import CreateReferralCodeModal from '@/components/modals/CreateReferralCodeModal';
import type { AdminReferralCode, AdminReferralCodesParams } from '@/types/admin';

interface ReferralCodesTableProps {
  title: string;
  data: AdminReferralCode[];
  isLoading?: boolean;
  onSearch?: (params: Partial<AdminReferralCodesParams>) => void;
  onRefresh?: () => void;
  onCreateSuccess?: () => void;
}

export default function ReferralCodesTable({
  title,
  data,
  isLoading = false,
  onSearch,
  onRefresh,
  onCreateSuccess
}: ReferralCodesTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedCodeId, setSelectedCodeId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleViewDetails = (codeId: number) => {
    setSelectedCodeId(codeId.toString());
    setIsModalOpen(true);
  };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({
        search: searchTerm || undefined,
        status: statusFilter as any || undefined,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'active': { color: 'bg-green-100 text-green-800', text: 'Active' },
      'claimed': { color: 'bg-blue-100 text-blue-800', text: 'Claimed' },
      'pending_payment': { color: 'bg-yellow-100 text-yellow-800', text: 'Pending Payment' },
      'partially_paid': { color: 'bg-orange-100 text-orange-800', text: 'Partially Paid' },
      'fully_paid': { color: 'bg-purple-100 text-purple-800', text: 'Fully Paid' },
      'expired': { color: 'bg-red-100 text-red-800', text: 'Expired' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || 
                  { color: 'bg-gray-100 text-gray-800', text: status };
    
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const formatPrice = (amount: number) => {
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setIsCreateModalOpen(true)}
                disabled={isLoading}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Code
              </Button>
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
                  placeholder="Search by referral code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
                <option value="claimed">Claimed</option>
                <option value="pending_payment">Pending Payment</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="fully_paid">Fully Paid</option>
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
              <p>No referral codes found</p>
            </div>
          )}

          {!isLoading && data.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Instructor ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Min Rides</TableHead>
                  <TableHead>Rides Completed</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Used Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((code) => (
                  <TableRow key={code.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-primary" />
                        <span className="font-medium">{code.code}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3 text-gray-400" />
                        <span className="text-sm">#{code.instructor_id}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-500" />
                        <span className="font-medium text-green-600">{formatPrice(code.amount)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{code.min_rides_required}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium">{code.rides_completed_count}</span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(code.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {code.used_at ? new Date(code.used_at).toLocaleDateString() : 'Not used'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {new Date(code.created_at).toLocaleDateString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleViewDetails(code.id)}
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
        </CardContent>
      </Card>

      <ReferralCodeDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        codeId={selectedCodeId}
        onSuccess={() => onRefresh?.()}
      />

      <CreateReferralCodeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          onCreateSuccess?.();
          onRefresh?.();
        }}
      />
    </>
  );
}