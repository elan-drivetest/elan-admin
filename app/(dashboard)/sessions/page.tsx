// app/(dashboard)/sessions/page.tsx
'use client';

import React, { useState } from 'react';
import DashboardHeader from '@/components/layouts/DashboardHeader';
import RideSessionFilters from '@/components/ui/ride-session-filters';
import RideSessionsTable from '@/components/tables/RideSessionsTable';
import RideSessionDetailModal from '@/components/modals/RideSessionDetailModal';
import LoadingState, { CardSkeleton } from '@/components/ui/loading-state';
import ErrorBoundary from '@/components/ui/error-boundary';
import { Route } from 'lucide-react';
import { useRideSessions } from '@/hooks/useAdmin';
import CursorPagination from '@/components/ui/CursorPagination';
import type { AdminRideSessionsParams } from '@/types/admin';

export default function RideSessionsPage() {
  const [searchParams, setSearchParams] = useState<AdminRideSessionsParams>({
    limit: 10,
    // Backend cursor query orders on start_time, not created_at.
    orderBy: 'start_time',
    orderDirection: 'desc'
  });

  const { data: rideSessions, meta, isLoading, error, refetch } = useRideSessions(searchParams);

  // Modal state management
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  const handleSearchUpdate = (newParams: Partial<AdminRideSessionsParams>) => {
    const updatedParams = { ...searchParams, ...newParams, cursor: undefined, direction: undefined };
    setSearchParams(updatedParams);
    refetch(updatedParams);
  };

  const goToPage = (cursor: string, direction: 'forward' | 'backward') => {
    const next = { ...searchParams, cursor, direction };
    setSearchParams(next);
    refetch(next);
  };

  const handleViewDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedSessionId(null);
  };

  if (isLoading && rideSessions.length === 0) {
    return (
      <ErrorBoundary>
        <>
          <DashboardHeader
            title="Ride Sessions"
            subtitle="Manage driving lessons and track session progress."
          />
          <div className="px-6 space-y-6">
            <CardSkeleton count={1} />
            <LoadingState 
              card 
              text="Loading ride sessions..." 
              className="py-12"
            />
          </div>
        </>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <>
        <DashboardHeader
          title="Ride Sessions"
          subtitle="Manage driving lessons and track session progress."
        />

        <div className="px-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
              <p className="font-medium">Error loading ride sessions</p>
              <p className="text-sm">{error.message}</p>
              <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
                Try again
              </button>
            </div>
          )}

          <RideSessionFilters 
            onSearch={handleSearchUpdate}
            isLoading={isLoading}
          />

          <RideSessionsTable
            title={`All Ride Sessions (${meta?.total ?? rideSessions.length})`}
            data={rideSessions}
            isLoading={isLoading}
            onSearch={handleSearchUpdate}
            onRefresh={() => refetch()}
            onViewDetails={handleViewDetails}
          />

          <CursorPagination
            meta={meta}
            count={rideSessions.length}
            isLoading={isLoading}
            onNext={() => meta?.nextCursor && goToPage(meta.nextCursor, 'forward')}
            onPrev={() => meta?.prevCursor && goToPage(meta.prevCursor, 'backward')}
          />

          {!isLoading && rideSessions.length === 0 && (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg border">
              <Route className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No ride sessions found</p>
              <p className="text-sm">Sessions will appear here when instructors complete rides.</p>
            </div>
          )}
        </div>

        {/* Ride Session Detail Modal */}
        <RideSessionDetailModal
          isOpen={isDetailModalOpen}
          onClose={handleCloseModal}
          sessionId={selectedSessionId}
        />
      </>
    </ErrorBoundary>
  );
}