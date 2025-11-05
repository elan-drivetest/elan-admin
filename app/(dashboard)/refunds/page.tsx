// app/(dashboard)/refunds/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import RefundRequestsTable from '@/components/tables/RefundRequestsTable';
import RefundRequestDetailModal from '@/components/modals/RefundRequestDetailModal';
import { useRefunds } from '@/hooks/useRefunds';
import { RefundRequest, GetRefundRequestsParams, RefundStatus } from '@/types/refund';

export default function RefundsPage() {
  const searchParams = useSearchParams();
  const statusFromUrl = searchParams.get('status') as RefundStatus | null;

  const [params, setParams] = useState<GetRefundRequestsParams>({
    limit: 10,
    orderBy: 'created_at',
    orderDirection: 'desc',
    status: statusFromUrl || undefined,
  });

  // Update params when URL changes
  useEffect(() => {
    if (statusFromUrl) {
      setParams(prev => ({
        ...prev,
        status: statusFromUrl,
      }));
    }
  }, [statusFromUrl]);

  const { refunds, loading, refetch } = useRefunds(params);
  const [selectedRefundId, setSelectedRefundId] = useState<number | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleSearch = (searchParams: Partial<GetRefundRequestsParams>) => {
    setParams((prev) => ({
      ...prev,
      ...searchParams,
    }));
    refetch(searchParams);
  };

  const handleRefresh = () => {
    refetch(params);
  };

  const handleRowClick = (refund: RefundRequest) => {
    setSelectedRefundId(refund.id);
    setIsDetailModalOpen(true);
  };

  const handleModalClose = () => {
    setIsDetailModalOpen(false);
    setSelectedRefundId(null);
  };

  const handleUpdate = () => {
    refetch(params);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Refund Requests</h1>
        <p className="text-gray-600 mt-1">Manage customer refund requests</p>
      </div>

      <RefundRequestsTable
        title="All Refund Requests"
        data={refunds}
        isLoading={loading}
        onSearch={handleSearch}
        onRefresh={handleRefresh}
        onRowClick={handleRowClick}
      />

      <RefundRequestDetailModal
        isOpen={isDetailModalOpen}
        onClose={handleModalClose}
        refundId={selectedRefundId}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
