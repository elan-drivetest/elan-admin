// components/booking/LocationSelectionAdmin.tsx
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Check, MapPin, Navigation, Loader2, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useDistanceCalculation } from '@/hooks/useBookingCalculation';
import { usePricingConfig } from '@/hooks/usePricingConfig';
import { calculatePickupPrice, formatPrice } from '@/lib/utils/booking-calculations';
import type { AddressSearchResponse, TestCenter } from '@/types/admin';
import { useAddressSearch } from '@/hooks/useAddressSearch';

export type LocationOption = 'test-centre' | 'pickup';

interface LocationSelectionAdminProps {
  selectedOption: LocationOption;
  onOptionChange: (option: LocationOption) => void;
  onLocationSelect?: (location: {
    address: string;
    coordinates: { lat: number; lng: number };
    distance?: number;
  }) => void;
  /**
   * Raised when a pickup address is chosen but the server distance could not be
   * fetched, so the booking cannot be priced. The parent blocks submission.
   */
  onDistanceUnavailableChange?: (unavailable: boolean) => void;
  testCenter?: TestCenter;
  className?: string;
}

interface LocationOptionProps {
  option: LocationOption;
  selected: boolean;
  title: string;
  description: string;
  onClick: () => void;
}

const LocationOptionItem: React.FC<LocationOptionProps> = ({
  selected,
  title,
  description,
  onClick,
}) => (
  <div
    className={cn(
      'border rounded-lg p-4 cursor-pointer transition-all duration-200 mb-4 hover:shadow-sm',
      selected ? 'border-green-600 bg-green-50 ring-1 ring-green-600/20' : 'border-gray-200 hover:border-gray-300'
    )}
    onClick={onClick}
  >
    <div className="flex justify-between items-start">
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <div className={cn(
        'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
        selected ? 'border-green-600 bg-green-600' : 'border-gray-300'
      )}>
        {selected && <Check size={14} className="text-white" />}
      </div>
    </div>
  </div>
);

export default function LocationSelectionAdmin({
  selectedOption,
  onOptionChange,
  onLocationSelect,
  onDistanceUnavailableChange,
  testCenter,
  className,
}: LocationSelectionAdminProps) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [selectedResult, setSelectedResult] = useState<AddressSearchResponse | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const { results, loading: searchLoading, error: searchError, searchAddresses, clearResults } = useAddressSearch();
  const {
    distance,
    loading: distanceLoading,
    error: distanceError,
    calculateDistance,
  } = useDistanceCalculation();
  const { config: pricing, isLoading: pricingLoading } = usePricingConfig();

  // The pickup fee mirrors the server's tiers using the live settings values —
  // it is never derived from hardcoded rates.
  const pickupPrice =
    distance !== null ? calculatePickupPrice(distance, pricing) : null;

  const handleLocationInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPickupLocation(value);
    setSelectedResult(null);
    setLocationError(null);

    if (value.length >= 3) {
      await searchAddresses(value);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      clearResults();
    }
  };

  const handleSuggestionSelect = async (result: AddressSearchResponse) => {
    const address = result.formatted_address || '';
    const lat = result.latitude || 0;
    const lng = result.longitude || 0;

    setPickupLocation(address);
    setSelectedResult(result);
    setShowSuggestions(false);
    setLocationError(null);

    if (testCenter && lat && lng) {
      const calculatedDistance = await calculateDistance({ lat, lng }, testCenter);

      onDistanceUnavailableChange?.(calculatedDistance === null);

      onLocationSelect?.({
        address,
        coordinates: { lat, lng },
        distance: calculatedDistance ?? undefined,
      });
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser.');
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const address = `Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
        
        setPickupLocation(address);
        setSelectedResult({
          formatted_address: address,
          latitude,
          longitude,
        });

        if (testCenter) {
          const calculatedDistance = await calculateDistance({ lat: latitude, lng: longitude }, testCenter);

          onDistanceUnavailableChange?.(calculatedDistance === null);

          onLocationSelect?.({
            address,
            coordinates: { lat: latitude, lng: longitude },
            distance: calculatedDistance ?? undefined,
          });
        }

        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('Unable to get your current location.');
            break;
        }
      }
    );
  };

  const handleOptionChange = (option: LocationOption) => {
    onOptionChange(option);
    
    if (option === 'test-centre') {
      setPickupLocation('');
      setSelectedResult(null);
      setLocationError(null);
      clearResults();
      setShowSuggestions(false);
      // Meeting at the centre prices at distance 0 — nothing left to block on.
      onDistanceUnavailableChange?.(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSuggestions]);

  return (
    <div className={cn('mb-6', className)}>
      <h2 className="text-xl font-semibold mb-4 text-gray-900">Pick up or Meet at Drive Test Centre</h2>
      
      <LocationOptionItem
        option="pickup"
        selected={selectedOption === 'pickup'}
        title="Pick up from location"
        description="Instructor will pick up from specified address and drop off after the test"
        onClick={() => handleOptionChange('pickup')}
      />
      
      <LocationOptionItem
        option="test-centre"
        selected={selectedOption === 'test-centre'}
        title="Meet at test centre"
        description="Customer will meet instructor directly at the test centre"
        onClick={() => handleOptionChange('test-centre')}
      />
      
      {selectedOption === 'pickup' && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium text-gray-900">Pickup Location</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCurrentLocation}
              disabled={isGettingLocation}
            >
              {isGettingLocation ? (
                <Loader2 size={14} className="animate-spin mr-2" />
              ) : (
                <Navigation size={14} className="mr-2" />
              )}
              Current Location
            </Button>
          </div>
          
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              value={pickupLocation}
              onChange={handleLocationInputChange}
              placeholder="Enter pickup address..."
              className={cn(
                'w-full pl-10',
                (locationError || searchError) && 'border-red-300',
                selectedResult && 'bg-green-50 border-green-300'
              )}
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              {searchLoading || distanceLoading ? (
                <Loader2 size={18} className="text-gray-400 animate-spin" />
              ) : selectedResult ? (
                <Check size={18} className="text-green-500" />
              ) : (
                <MapPin size={18} className="text-gray-400" />
              )}
            </div>

            {/* Address Suggestions */}
            {showSuggestions && results.length > 0 && (
              <div 
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {results.map((result, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSuggestionSelect(result)}
                  >
                    <div className="flex items-start gap-3">
                      <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {result.formatted_address}
                        </p>
                        {(result.city || result.province) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {[result.city, result.province, result.postal_code].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Errors */}
          {(locationError || searchError) && (
            <div className="flex items-center gap-2 mt-2 text-red-600">
              <AlertTriangle size={14} />
              <span className="text-sm">{locationError || searchError}</span>
            </div>
          )}

          {/* The distance call drives the whole pickup fare, so a failure here is
              surfaced rather than silently replaced with a local estimate. */}
          {distanceError && (
            <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-red-600" />
              <span className="text-sm text-red-800">{distanceError}</span>
            </div>
          )}

          {/* Selected Location Confirmation */}
          {selectedResult && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-2">
                <Check size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Location Selected</p>
                  <p className="text-sm text-green-700 mt-1">{selectedResult.formatted_address}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedResult(null);
                    setPickupLocation('');
                    setLocationError(null);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Distance and pickup fare. The full total — including the add-on
              concession and any coupon — lives in the pricing sidebar. */}
          {distance !== null && pickupPrice !== null && !pricingLoading && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Distance &amp; Pickup Fare</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p>• Driving distance: {distance.toFixed(1)} km</p>
                <p>• Pickup fee: {formatPrice(pickupPrice)}</p>
                {distance > pricing.baseDistance && (
                  <p className="text-xs text-blue-700">
                    Beyond {pricing.baseDistance} km, so the reduced{' '}
                    {formatPrice(pricing.normalRate)}/km rate applies to the excess.
                    Adding an add-on also credits a 30-minute lesson.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}