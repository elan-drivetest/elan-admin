'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useAddressSearch } from '@/hooks/useAddressSearch';
import { cn } from '@/lib/utils';
import type { AddressSearchResponse } from '@/types/admin';

interface AddressAutocompleteProps {
  /** Called with the chosen address (formatted_address + lat/lng + city/province/postal). */
  onSelect: (result: AddressSearchResponse) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Address search autocomplete (backed by /address-search). Picking a suggestion
 * resolves coordinates + city/province/postal_code so callers can autofill a form.
 */
export default function AddressAutocomplete({ onSelect, placeholder, className }: AddressAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, loading, error, searchAddresses, clearResults } = useAddressSearch();
  const boxRef = useRef<HTMLDivElement>(null);

  const handleChange = async (value: string) => {
    setQuery(value);
    if (value.trim().length >= 3) {
      await searchAddresses(value);
      setOpen(true);
    } else {
      clearResults();
      setOpen(false);
    }
  };

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) {
      document.addEventListener('mousedown', onDocClick);
      return () => document.removeEventListener('mousedown', onDocClick);
    }
  }, [open]);

  return (
    <div ref={boxRef} className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (results.length) setOpen(true); }}
          placeholder={placeholder || 'Search an address to autofill…'}
          className="pl-10"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {open && (query.trim().length >= 3) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            results.map((r, i) => (
              <button
                type="button"
                key={i}
                onClick={() => {
                  onSelect(r);
                  setQuery(r.formatted_address);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.formatted_address}</p>
                    {(r.city || r.province) && (
                      <p className="text-xs text-gray-500">
                        {[r.city, r.province, r.postal_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))
          ) : (
            <p className="px-3 py-3 text-xs text-gray-400">
              {loading ? 'Searching…' : error || 'No matching addresses found.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
