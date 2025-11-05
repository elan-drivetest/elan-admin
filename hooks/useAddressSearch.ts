// hooks/useAddressSearch.ts
'use client';

import { useState, useCallback } from 'react';
import { adminService } from '@/services/admin';
import type { AddressSearchResponse } from '@/types/admin';

interface UseAddressSearchReturn {
  results: AddressSearchResponse[];
  loading: boolean;
  error: string | null;
  searchAddresses: (query: string) => Promise<AddressSearchResponse[]>;
  clearResults: () => void;
}

export function useAddressSearch(): UseAddressSearchReturn {
  const [results, setResults] = useState<AddressSearchResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchAddresses = useCallback(async (query: string): Promise<AddressSearchResponse[]> => {
    if (!query || query.length < 3) {
      setResults([]);
      return [];
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await adminService.searchAddresses({ address: query });
      setResults(response);
      return response;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Failed to search addresses';
      setError(errorMessage);
      setResults([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    searchAddresses,
    clearResults,
  };
}