// app/(dashboard)/settings/test-centers/page.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import ToggleSwitch from '@/components/ui/toggle-switch';
import AddressAutocomplete from '@/components/ui/AddressAutocomplete';
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
  CheckCircle,
  ChevronRight,
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
import { getApiErrorMessages, formatCAD } from '@/lib/utils';
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

  // The public list endpoint doesn't return `status`, so we track it locally and
  // persist to localStorage so toggles survive a refresh (stopgap until the backend
  // adds `status` to GET /drive-test-centers).
  const [statusById, setStatusById] = useState<Record<number, string>>(() => {
    if (typeof window === 'undefined') return {};
    try { return JSON.parse(localStorage.getItem('tc_status') || '{}'); } catch { return {}; }
  });
  const [togglingId, setTogglingId] = useState<number | null>(null);

  useEffect(() => {
    try { localStorage.setItem('tc_status', JSON.stringify(statusById)); } catch { /* ignore */ }
  }, [statusById]);

  const { data: testCenters, isLoading, error, refetch } = useTestCenters();
  const { updateTestCenter, isLoading: isUpdating } = useUpdateTestCenter();

  const getStatus = (center: TestCenter): string =>
    statusById[center.id] ?? center.status ?? 'ACTIVE';
  const isActive = (center: TestCenter) => getStatus(center) === 'ACTIVE';

  const filteredCenters = useMemo(() => {
    if (!searchTerm) return testCenters;
    const q = searchTerm.toLowerCase();
    return testCenters.filter(
      (center) =>
        center.name.toLowerCase().includes(q) ||
        center.city.toLowerCase().includes(q) ||
        center.province.toLowerCase().includes(q) ||
        center.address.toLowerCase().includes(q) ||
        center.postal_code.toLowerCase().includes(q)
    );
  }, [testCenters, searchTerm]);

  const formatPrice = (cents: number) => formatCAD(cents);
  const formatCoordinates = (lat: number | string, lng: number | string) =>
    `${parseFloat(String(lat)).toFixed(4)}, ${parseFloat(String(lng)).toFixed(4)}`;

  const openEditModal = (center: TestCenter) => {
    setSelectedCenter(center);
    setEditForm({
      name: center.name,
      province: center.province,
      city: center.city,
      address: center.address,
      postal_code: center.postal_code,
      lat: center.lat,
      lng: center.lng,
      base_price: center.base_price,
      status: getStatus(center),
    });
    setPriceDisplay((center.base_price / 100).toFixed(2));
    setIsEditModalOpen(true);
  };

  // Inline quick toggle from the table row.
  // NOTE: the backend only persists a FULL payload — a partial `{status}` body
  // returns 200 but is silently dropped — so send the whole centre with the new status.
  const handleToggleStatus = async (center: TestCenter) => {
    const current = getStatus(center);
    const next = current === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setStatusById((prev) => ({ ...prev, [center.id]: next })); // optimistic
    setTogglingId(center.id);
    try {
      const updated = await updateTestCenter(center.id, {
        name: center.name,
        province: center.province,
        city: center.city,
        address: center.address,
        postal_code: center.postal_code,
        lat: center.lat,
        lng: center.lng,
        base_price: center.base_price,
        status: next,
      });
      setStatusById((prev) => ({ ...prev, [center.id]: updated?.status ?? next }));
      toast.success(`"${center.name}" is now ${next === 'ACTIVE' ? 'Active' : 'Inactive'}`);
    } catch (err) {
      setStatusById((prev) => ({ ...prev, [center.id]: current })); // revert
      toast.error(getApiErrorMessages(err).join(' '));
    } finally {
      setTogglingId(null);
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedCenter) return;
    try {
      const updated = await updateTestCenter(selectedCenter.id, editForm);
      if (updated) {
        setStatusById((prev) => ({
          ...prev,
          [selectedCenter.id]: updated.status ?? editForm.status ?? 'ACTIVE',
        }));
        toast.success(`Test center "${updated.name || selectedCenter.name}" updated successfully`);
        setIsEditModalOpen(false);
        setSelectedCenter(null);
        setEditForm({});
        setPriceDisplay('');
        refetch();
      }
    } catch (err) {
      toast.error(getApiErrorMessages(err).join(' '));
    }
  };

  return (
    <div className="px-6 space-y-6">
      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search by name, city, province, address, or postal code…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
          <p className="font-medium">Error loading test centers</p>
          <p className="text-sm">{error.message}</p>
          <button onClick={() => refetch()} className="mt-2 text-sm underline hover:no-underline">
            Try again
          </button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Test Centers ({filteredCenters.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="relative">
          {isLoading && testCenters.length === 0 && <TableSkeleton rows={6} columns={7} />}

          {!isLoading && filteredCenters.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <MapPin className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No test centers found</p>
              {searchTerm && <p className="text-sm">Try adjusting your search criteria</p>}
            </div>
          )}

          {!isLoading && filteredCenters.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>City / Province</TableHead>
                  <TableHead>Coordinates</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCenters.map((center) => (
                  <TableRow
                    key={center.id}
                    onClick={() => openEditModal(center)}
                    className="hover:bg-gray-50 hover:cursor-pointer"
                  >
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
                      <span className="text-sm text-gray-600 max-w-[220px] truncate block">
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
                      <span className="font-semibold text-green-700">
                        {formatPrice(center.base_price)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {/* Stop propagation so toggling doesn't open the edit modal */}
                      <span onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-2">
                        <ToggleSwitch
                          checked={isActive(center)}
                          onCheckedChange={() => handleToggleStatus(center)}
                          disabled={togglingId === center.id || isUpdating}
                          size="sm"
                        />
                        <Badge
                          className={
                            isActive(center)
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-700'
                          }
                        >
                          {isActive(center) ? 'Active' : 'Inactive'}
                        </Badge>
                      </span>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {isLoading && testCenters.length > 0 && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span className="text-sm">Refreshing…</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen} key={selectedCenter?.id}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              {selectedCenter?.name || 'Test Center'}
            </DialogTitle>
            <DialogDescription>Update this drive test centre&apos;s details.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Status toggle */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Status</p>
                <p className="text-xs text-gray-500">
                  Inactive centres can&apos;t be selected for new bookings.
                </p>
              </div>
              <ToggleSwitch
                checked={editForm.status === 'ACTIVE'}
                onCheckedChange={(checked) =>
                  setEditForm({ ...editForm, status: checked ? 'ACTIVE' : 'INACTIVE' })
                }
                label={editForm.status === 'ACTIVE' ? 'Active' : 'Inactive'}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Center Name</Label>
              <Input
                id="name"
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Center name"
              />
            </div>

            {/* Address picker */}
            <div className="space-y-2">
              <Label>Find Address (autofill)</Label>
              <AddressAutocomplete
                placeholder="Search an address to autofill the fields below…"
                onSelect={(r) =>
                  setEditForm((prev) => ({
                    ...prev,
                    address: r.formatted_address || prev.address,
                    city: r.city || prev.city,
                    province: r.province || prev.province,
                    postal_code: r.postal_code || prev.postal_code,
                    lat: r.latitude ?? prev.lat,
                    lng: r.longitude ?? prev.lng,
                  }))
                }
              />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={editForm.address || ''}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                placeholder="Full address"
              />
            </div>

            {/* City + Postal */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={editForm.city || ''}
                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={editForm.postal_code || ''}
                  onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                  placeholder="A1A 1A1"
                />
              </div>
            </div>

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

            {/* Lat + Lng */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="lat">Latitude</Label>
                <Input
                  id="lat"
                  value={editForm.lat ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, lat: e.target.value })}
                  placeholder="45.0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lng">Longitude</Label>
                <Input
                  id="lng"
                  value={editForm.lng ?? ''}
                  onChange={(e) => setEditForm({ ...editForm, lng: e.target.value })}
                  placeholder="-79.0000"
                />
              </div>
            </div>

            {/* Base Price */}
            <div className="space-y-2">
              <Label htmlFor="base_price">Base Price (in dollars)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={priceDisplay}
                  onChange={(e) => {
                    setPriceDisplay(e.target.value);
                    const dollars = parseFloat(e.target.value);
                    setEditForm({
                      ...editForm,
                      base_price: isNaN(dollars) ? 0 : Math.round(dollars * 100),
                    });
                  }}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500">
                Original: {selectedCenter ? formatPrice(selectedCenter.base_price) : '-'}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleEditSubmit} disabled={isUpdating}>
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving…
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
