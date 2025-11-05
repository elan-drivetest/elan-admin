// components/booking/TestCenterDropdownAdmin.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronDown, Check, Search, X, MapPin, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTestCenters } from '@/hooks/useAdmin';
import { bookingUtils } from '@/lib/utils/booking-calculations';
import type { TestCenter } from '@/types/admin';

interface TestCenterDropdownAdminProps {
  selectedCenter: TestCenter | null;
  onSelect: (center: TestCenter) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function TestCenterDropdownAdmin({
  selectedCenter,
  onSelect,
  className = '',
  placeholder = 'Select a test center',
  disabled = false
}: TestCenterDropdownAdminProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: centers, isLoading: loading, error, refetch } = useTestCenters();

  // Optimized filtered and grouped centers
  const { filteredCenters, groupedCenters } = useMemo(() => {
    if (!centers || centers.length === 0) {
      return { filteredCenters: [], groupedCenters: {} };
    }

    const searchLower = searchTerm.toLowerCase();
    const filtered = centers.filter(center => {
      if (!center?.name) return false;
      
      const searchableText = [
        center.name,
        center.city,
        center.province,
        center.address
      ].filter(Boolean).join(' ').toLowerCase();
      
      return searchableText.includes(searchLower);
    });

    // Group by province
    const grouped = filtered.reduce((acc, center) => {
      const province = center.province || 'Other';
      if (!acc[province]) {
        acc[province] = [];
      }
      acc[province].push(center);
      return acc;
    }, {} as Record<string, TestCenter[]>);

    // Sort centers within each province
    Object.keys(grouped).forEach(province => {
      grouped[province].sort((a, b) => {
        const cityComparison = (a.city || '').localeCompare(b.city || '');
        return cityComparison !== 0 ? cityComparison : a.name.localeCompare(b.name);
      });
    });

    return { filteredCenters: filtered, groupedCenters: grouped };
  }, [centers, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (disabled) return;
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm('');
    }
  };

  const handleCenterSelect = (center: TestCenter) => {
    onSelect(center);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSearch = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const getDisplayText = (center: TestCenter) => {
    return `${center.name} - ${center.city}, ${center.province}`;
  };

  const getPriceDisplay = (center: TestCenter) => {
    return bookingUtils.formatPrice(center.base_price);
  };

  return (
    <div className={cn('relative w-full', className)} ref={dropdownRef}>
      {/* Main Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled || loading}
        className={cn(
          'w-full flex items-center justify-between px-4 py-3 text-left',
          'border border-gray-300 rounded-lg transition-all duration-200',
          'hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500',
          disabled && 'opacity-50 cursor-not-allowed',
          loading && 'cursor-wait',
          isOpen && 'border-green-500 ring-2 ring-green-500/20',
          selectedCenter ? 'text-gray-900' : 'text-gray-500'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading test centers...</span>
              </div>
            ) : selectedCenter ? (
              <div>
                <div className="font-medium truncate">
                  {getDisplayText(selectedCenter)}
                </div>
                <div className="text-sm text-gray-500">
                  Base Price: {getPriceDisplay(selectedCenter)}
                </div>
              </div>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
        </div>
        
        <ChevronDown
          className={cn(
            'w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0',
            isOpen && 'transform rotate-180'
          )}
        />
      </button>

      {/* Error State */}
      {error && !isOpen && (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-700">Failed to load test centers</span>
            </div>
            <button
              onClick={refetch}
              className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
          {/* Search Bar */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search test centers..."
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500"
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">Loading test centers...</p>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-400" />
                <p className="text-red-600 mb-3">Failed to load test centers</p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredCenters.length === 0 ? (
              <div className="p-6 text-center">
                <MapPin className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-gray-500">
                  {searchTerm ? 'No test centers found matching your search.' : 'No test centers available.'}
                </p>
                {searchTerm && (
                  <button
                    onClick={clearSearch}
                    className="mt-2 text-green-600 hover:text-green-700"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <div>
                {Object.entries(groupedCenters).map(([province, provinceCenters]) => (
                  <div key={province}>
                    {/* Province Header */}
                    <div className="sticky top-0 bg-gray-50 px-4 py-2 border-b border-gray-200">
                      <h4 className="font-medium text-gray-700">{province}</h4>
                      <p className="text-xs text-gray-500">{provinceCenters.length} centers</p>
                    </div>
                    
                    {/* Centers List */}
                    {provinceCenters.map((center) => (
                      <button
                        key={center.id}
                        onClick={() => handleCenterSelect(center)}
                        className={cn(
                          'w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0',
                          selectedCenter?.id === center.id && 'bg-green-50 border-green-200'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900 truncate">
                                {center.name}
                              </span>
                              {selectedCenter?.id === center.id && (
                                <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate">
                              {center.city}
                            </p>
                            {center.address && (
                              <p className="text-xs text-gray-500 mt-1 truncate">
                                {center.address}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {getPriceDisplay(center)}
                            </div>
                            <div className="text-xs text-gray-500">Base Price</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}