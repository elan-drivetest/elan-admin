// components/selectors/TestCenterSelector.tsx
'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, MapPin } from 'lucide-react';
import { useTestCenters } from '@/hooks/useAdmin';

interface TestCenterSelectorProps {
  onSelect: (centerId: number) => void;
  selectedCenterId?: number;
  placeholder?: string;
}

export default function TestCenterSelector({
  onSelect,
  selectedCenterId,
  placeholder = "Select a test center"
}: TestCenterSelectorProps) {
  const { data: testCenters, isLoading, error } = useTestCenters();

  const formatPrice = (price: number) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const formatCenterDisplay = (center: any) => {
    return `${center.name} - ${formatPrice(center.base_price)} - ${center.city}, ${center.province}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label>Test Center *</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md">
          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          <span className="text-sm text-gray-600">Loading test centers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Test Center *</Label>
        <Alert variant="destructive">
          <AlertDescription>Failed to load test centers: {error.message}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>Test Center *</Label>
      <Select
        value={selectedCenterId?.toString() || ''}
        onValueChange={(value) => onSelect(parseInt(value))}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {testCenters.map((center) => (
            <SelectItem key={center.id} value={center.id.toString()}>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <span>{formatCenterDisplay(center)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}