// components/ui/ride-session-filters.tsx
'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { MapPin, User, GraduationCap, Calendar } from 'lucide-react';

interface RideSessionFiltersProps {
  centerSearch: string;
  onCenterSearchChange: (value: string) => void;
  instructorSearch: string;
  onInstructorSearchChange: (value: string) => void;
  userSearch: string;
  onUserSearchChange: (value: string) => void;
  dateSearch: string;
  onDateSearchChange: (value: string) => void;
}

export default function RideSessionFilters({
  centerSearch,
  onCenterSearchChange,
  instructorSearch,
  onInstructorSearchChange,
  userSearch,
  onUserSearchChange,
  dateSearch,
  onDateSearchChange,
}: RideSessionFiltersProps) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search by center name */}
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

        {/* Search by instructor name */}
        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search by instructor name"
            value={instructorSearch}
            onChange={(e) => onInstructorSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search by user name */}
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

        {/* Search by date */}
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="date"
            placeholder="Search by date"
            value={dateSearch}
            onChange={(e) => onDateSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
    </div>
  );
}