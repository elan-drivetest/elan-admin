// components/ui/ride-session-filters.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, Users, MapPin, Car } from 'lucide-react';
import type { AdminRideSessionsParams } from '@/types/admin';

interface RideSessionFiltersProps {
  onSearch: (params: Partial<AdminRideSessionsParams>) => void;
  isLoading?: boolean;
}

export default function RideSessionFilters({ onSearch, isLoading = false }: RideSessionFiltersProps) {
  const [centerSearch, setCenterSearch] = useState('');
  const [instructorSearch, setInstructorSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [testTypeSearch, setTestTypeSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearch = () => {
    onSearch({
      centerName: centerSearch || undefined,
      instructorName: instructorSearch || undefined,
      customerName: customerSearch || undefined,
      testType: testTypeSearch || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const handleClearFilters = () => {
    setCenterSearch('');
    setInstructorSearch('');
    setCustomerSearch('');
    setTestTypeSearch('');
    setStartDate('');
    setEndDate('');
    onSearch({});
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Search & Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by center name..."
              value={centerSearch}
              onChange={(e) => setCenterSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by instructor name..."
              value={instructorSearch}
              onChange={(e) => setInstructorSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isLoading}
            />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by customer name..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              onKeyPress={handleKeyPress}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Test Type</label>
            <select
              value={testTypeSearch}
              onChange={(e) => setTestTypeSearch(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary text-sm"
              disabled={isLoading}
            >
              <option value="">All Types</option>
              <option value="G2">G2</option>
              <option value="G">G</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Start Date</label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">End Date</label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
              className="text-sm"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <Button 
            variant="outline"
            onClick={handleClearFilters}
            disabled={isLoading}
          >
            Clear Filters
          </Button>
          <Button 
            onClick={handleSearch} 
            disabled={isLoading}
          >
            {isLoading ? 'Searching...' : 'Apply Filters'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}