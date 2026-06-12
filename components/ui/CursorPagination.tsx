'use client';

import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PaginationMeta } from '@/types/admin';

interface CursorPaginationProps {
  meta?: PaginationMeta | null;
  /** Number of rows currently shown (this page). */
  count: number;
  isLoading?: boolean;
  onNext: () => void;
  onPrev: () => void;
}

/**
 * Footer for cursor-paginated lists. Always shows a "Showing N results" line so
 * the list gives feedback; the Prev/Next buttons appear only when there is more
 * than one page of data.
 */
export default function CursorPagination({ meta, count, isLoading, onNext, onPrev }: CursorPaginationProps) {
  if (!meta || count === 0) return null;
  const { hasNextPage, hasPreviousPage, total } = meta;
  const hasPages = hasNextPage || hasPreviousPage;

  return (
    <div className="flex items-center justify-between gap-4 pt-4 border-t mt-4">
      <p className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-700">{count}</span>
        {typeof total === 'number' ? <> of <span className="font-medium text-gray-700">{total}</span></> : null}
        {' '}result{count === 1 ? '' : 's'}
        {hasNextPage && typeof total !== 'number' ? ' (more available)' : ''}
      </p>
      {hasPages && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onPrev} disabled={!hasPreviousPage || isLoading}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronLeft className="w-4 h-4" />}
            <span className="ml-1">Previous</span>
          </Button>
          <Button variant="outline" size="sm" onClick={onNext} disabled={!hasNextPage || isLoading}>
            <span className="mr-1">Next</span>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      )}
    </div>
  );
}
