// app/(dashboard)/settings/test-centers/page.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  MapPin,
  RefreshCw,
  DollarSign,
  Map,
  Edit,
  CheckCircle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTestCenters, useUpdateTestCenter } from '@/hooks/useAdmin';
import { TableSkeleton } from '@/components/ui/loading-state';
import { toast } from 'sonner';
import type { TestCenter, UpdateTestCenterRequest } from '@/types/admin';

const PROVINCES = [
  { code: 'AB', name: 'Alberta' },
  { code: 'BC', name: 'British Columbia' },
  { code: 'MB', name: 'Manitoba' },
  { code: 'NB', name: 'New Brunswick' },
  { code: 'NL', name: 'Newfoundland and Labrador' },
  { code: 'NS', name: 'Nova Scotia' },
  { code: 'NT', name: 'Northwest Territories' },
  { code: 'NU', name: 'Nunavut' },
  { code: 'ON', name: 'Ontario' },
  { code: 'PE', name: 'Prince Edward Island' },
  { code: 'QC', name: 'Quebec' },
  { code: 'SK', name: 'Saskatchewan' },
  { code: 'YT', name: 'Yukon' },
];

export default function TestCentersPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState<TestCenter | null>(null);
  const [editForm, setEditForm] = useState<UpdateTestCenterRequest>({});
  const [priceDisplay, setPriceDisplay] = useState('');

  const { data: testCenters, isLoading, error, refetch } = useTestCenters();
  const { updateTestCenter, isLoading: isUpdating } = useUpdateTestCenter();

  // Filter test centers based on search term
  const filteredCenters = useMemo(() => {
    if (!searchTerm) return testCenters;

    return testCenters.filter((center) => {
      return (
        center.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.province.toLowerCase().includes(searchTerm.toLowerCase()) ||
        center.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    });
  }, [testCenters, searchTerm]);

  const openEditModal = (center: TestCenter) => {
    setSelectedCenter(center);
    setEditForm({
      province: center.province,
      city: center.city,
      address: center.address,
      base_price: center.base_price,
    });
    setPriceDisplay((center.base_price / 100).toFixed(2) || '0.00');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedCenter) return;

    try {
      const result = await updateTestCenter(selectedCenter.id, editForm);
      if (result) {
        toast.success(`Test center "${selectedCenter.name}" updated successfully`);
        setIsEditModalOpen(false);
        setSelectedCenter(null);
        setEditForm({});
        setPriceDisplay('');
        refetch();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update test center');
    }
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatCoordinates = (lat: number | string, lng: number | string) => {
    return `${parseFloat(String(lat)).toFixed(4)}, ${parseFloat(String(lng)).toFixed(4)}`;
  };

  return (
    <div className="px-6 space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, city, province, or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading test centers</p>
          <p className="text-sm">{error.message}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* Test Centers Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Test Centers ({filteredCenters.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading Skeleton */}
          {isLoading && testCenters.length === 0 && (
            <TableSkeleton rows={5} columns={7} />
          )}

          {/* Empty State */}
          {!isLoading && filteredCenters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No test centers found</p>
              {searchTerm && (
                <p className="text-sm">Try adjusting your search criteria</p>
              )}
            </div>
          )}

          {/* Table with Data */}
          {!isLoading && filteredCenters.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City / Province</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map((center) => (
                  <TableRow key={center.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{center.name}</p>
                          <p className="text-xs text-gray-500">{center.postal_code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 max-w-[200px] truncate block">
                        {center.address}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium">{center.city}</p>
                        <p className="text-gray-500">{center.province}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Map className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-600 font-mono">
                          {formatCoordinates(center.lat, center.lng)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-green-600" />
                        <span className="font-semibold text-green-700">
                          {formatPrice(center.base_price)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(center)}
                        disabled={isUpdating}
                        className="text-primary hover:text-primary hover:bg-primary/10"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Loading overlay for refresh */}
          {isLoading && testCenters.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Refreshing...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen} key={selectedCenter?.id}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Test Center
            </DialogTitle>
            <DialogDescription>
              Update details for <span className="font-semibold">{selectedCenter?.name}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Province */}
            <div className="space-y-2">
              <Label htmlFor="province">Province</Label>
              <Select
                value={editForm.province}
                onValueChange={(value) => setEditForm({ ...editForm, province: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((province) => (
                    <SelectItem key={province.code} value={province.name}>
                      {province.name} ({province.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={editForm.city || ''}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                placeholder="Enter city name"
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price (in dollars)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceDisplay}
                  onChange={(e) => {
                    setPriceDisplay(e.target.value);
                    const dollars = parseFloat(e.target.value);
                    if (!isNaN(dollars)) {
                      setEditForm({ ...editForm, base_price: Math.round(dollars * 100) });
                    }
                  }}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500">
                Original: {selectedCenter ? formatPrice(selectedCenter.base_price) : '-'}
              </p>
            </div>

            {/* Preview Changes */}
            {selectedCenter && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2 mt-4">
                <p className="text-sm font-medium text-gray-700">Preview Changes:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Location:</span>
                  <span>{editForm.city}, {editForm.province}</span>
                  <span className="text-gray-500">Address:</span>
                  <span className="truncate">{editForm.address}</span>
                  <span className="text-gray-500">Price:</span>
                  <span className="text-green-600 font-semibold">
                    {editForm.base_price !== undefined ? formatPrice(editForm.base_price) : '-'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditSubmit}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
