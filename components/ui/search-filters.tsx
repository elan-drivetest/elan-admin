// components/ui/search-filters.tsx
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import ToggleSwitch from '@/components/ui/toggle-switch';
import { Search, MapPin, User } from 'lucide-react';

interface SearchFiltersProps {
  centerSearch: string;
  onCenterSearchChange: (value: string) => void;
  userSearch: string;
  onUserSearchChange: (value: string) => void;
  filters: {
    failed: boolean;
    passed: boolean;
    completed: boolean;
    wantsRefund: boolean;
  };
  onFilterChange: (filterName: keyof SearchFiltersProps['filters'], value: boolean) => void;
}

export default function SearchFilters({
  centerSearch,
  onCenterSearchChange,
  userSearch,
  onUserSearchChange,
  filters,
  onFilterChange,
}: SearchFiltersProps) {
  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      {/* Search Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by center name"
            value={centerSearch}
            onChange={(e) => onCenterSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by user name"
            value={userSearch}
            onChange={(e) => onUserSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap items-center gap-6">
        <ToggleSwitch
          checked={filters.failed}
          onCheckedChange={(value) => onFilterChange('failed', value)}
          label="Failed"
          size="sm"
        />
        <ToggleSwitch
          checked={filters.passed}
          onCheckedChange={(value) => onFilterChange('passed', value)}
          label="Passed"
          size="sm"
        />
        <ToggleSwitch
          checked={filters.completed}
          onCheckedChange={(value) => onFilterChange('completed', value)}
          label="Completed"
          size="sm"
        />
        <ToggleSwitch
          checked={filters.wantsRefund}
          onCheckedChange={(value) => onFilterChange('wantsRefund', value)}
          label="Wants Refund"
          size="sm"
        />
      </div>
    </div>
  );
}