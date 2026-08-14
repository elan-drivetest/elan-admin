// components/booking/AddOnSelectionAdmin.tsx
'use client';

import React from 'react';
import { Check, Clock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, type BookingTestType } from '@/lib/utils/booking-calculations';
import { formatAddonDuration, isAddonNameLocked } from '@/lib/addon-rules';
import type { Addon } from '@/types/admin';

interface AddOnSelectionAdminProps {
  addons: Addon[];
  selectedAddon?: Addon | null;
  onAddonSelect: (addon: Addon | null) => void;
  testType: BookingTestType;
  /**
   * The long-trip credit in cents that WILL apply if an add-on is selected
   * (0 when the pickup is not beyond `base_distance`). Computed by the parent
   * from the live pricing config so this component invents no prices of its own.
   */
  concession?: number;
  /** `base_distance` from settings, for the explanatory copy only. */
  baseDistanceKm?: number;
  className?: string;
}

interface AddOnCardProps {
  addon: Addon;
  isSelected: boolean;
  onSelect: () => void;
  concession: number;
}

const AddOnCard: React.FC<AddOnCardProps> = ({
  addon,
  isSelected,
  onSelect,
  concession,
}) => {
  // `duration` is null for mock tests — the seeder's own marker, rather than
  // sniffing the name (BUSINESS_LOGIC.md §4.2).
  const isMockTest = addon.duration === null || addon.duration === undefined;
  // This row's price IS the long-trip credit, so it is worth pointing out.
  const isCreditAddon = isAddonNameLocked(addon.name);
  // The credit is a flat amount, so the marginal cost of this add-on is its
  // price less the credit — floored at zero, exactly as the server's arithmetic
  // works out when the 30-minute lesson is the chosen add-on.
  const effectivePrice = Math.max(0, addon.price - concession);
  const hasCredit = concession > 0;

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected
          ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20'
          : 'border-gray-200 hover:border-gray-300',
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {isMockTest ? (
                <GraduationCap size={20} className="text-blue-500" />
              ) : (
                <Clock size={20} className="text-green-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3
                  className={cn(
                    'font-medium text-base',
                    isSelected ? 'text-green-800' : 'text-gray-900',
                  )}
                >
                  {addon.name}
                </h3>
                {!isMockTest ? (
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs">
                    {formatAddonDuration(addon.duration)}
                  </Badge>
                ) : null}
                {isCreditAddon && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    Sets the long-trip credit
                  </Badge>
                )}
              </div>

              {addon.description && (
                <p className="text-sm text-gray-600 mb-2">{addon.description}</p>
              )}

              {hasCredit && (
                <p className="text-xs text-green-700">
                  Long-trip credit of {formatPrice(concession)} applies to this booking
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">
                {formatPrice(addon.price)}
              </div>
              {hasCredit && (
                <div className="text-xs text-green-600">
                  {effectivePrice === 0
                    ? 'free after credit'
                    : `${formatPrice(effectivePrice)} after credit`}
                </div>
              )}
            </div>
            {isSelected && (
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <Check size={14} className="text-white" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function AddOnSelectionAdmin({
  addons,
  selectedAddon,
  onAddonSelect,
  testType,
  concession = 0,
  baseDistanceKm,
  className,
}: AddOnSelectionAdminProps) {
  // The server files mock tests under LESSON_G / LESSON_G2 too, so this single
  // type filter is the whole catalogue for a test type — every one of them is
  // selectable at its listed price.
  const addonType = testType === 'G' ? 'LESSON_G' : 'LESSON_G2';
  const filteredAddons = addons.filter((addon) => addon.type === addonType);

  const handleAddonSelect = (addon: Addon) => {
    if (selectedAddon?.id === addon.id) {
      onAddonSelect(null);
    } else {
      onAddonSelect(addon);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Add-ons</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enhance the road test with professional instruction or practice.
        </p>
      </div>

      {/* The credit only exists when an add-on is bought — say so, rather than
          advertising a free lesson the booking will never carry. */}
      {concession > 0 && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Check size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">
              {formatPrice(concession)} long-trip credit available
            </span>
          </div>
          <p className="text-sm text-green-700">
            This pickup is beyond {baseDistanceKm ?? 'the base'} km, so selecting any
            add-on below takes {formatPrice(concession)} off the total.
          </p>
          <p className="text-xs text-green-600 mt-1">
            The credit applies only if an add-on is selected — choosing none forfeits it.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {filteredAddons.length === 0 ? (
          <p className="text-sm text-gray-500">
            No add-ons available for a {testType} road test.
          </p>
        ) : (
          filteredAddons.map((addon) => (
            <AddOnCard
              key={addon.id}
              addon={addon}
              isSelected={selectedAddon?.id === addon.id}
              onSelect={() => handleAddonSelect(addon)}
              concession={concession}
            />
          ))
        )}
      </div>

      {/* No add-on option */}
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md',
          !selectedAddon
            ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20'
            : 'border-gray-200 hover:border-gray-300',
        )}
        onClick={() => onAddonSelect(null)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                {!selectedAddon && <Check size={12} className="text-green-500" />}
              </div>
              <span className="font-medium text-gray-900">No additional add-on</span>
            </div>
            <span className="text-sm text-gray-600">{formatPrice(0)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
