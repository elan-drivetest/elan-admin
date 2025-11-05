// components/admin/booking/AddOnSelectionAdmin.tsx
'use client';

import React from 'react';
import { Check, Clock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { bookingUtils } from '@/lib/utils/booking-calculations';
import type { Addon } from '@/types/admin';

interface AddOnSelectionAdminProps {
  addons: Addon[];
  selectedAddon?: Addon | null;
  onAddonSelect: (addon: Addon | null) => void;
  testType: 'G2' | 'G';
  freePerks?: {
    free_30min_lesson: boolean;
    free_1hr_lesson: boolean;
  };
  className?: string;
}

interface AddOnCardProps {
  addon: Addon;
  isSelected: boolean;
  onSelect: () => void;
  isUpgrade?: boolean;
  upgradeFrom?: string;
  originalPrice?: number;
}

const AddOnCard: React.FC<AddOnCardProps> = ({
  addon,
  isSelected,
  onSelect,
  isUpgrade = false,
  upgradeFrom,
  originalPrice
}) => {
  const formatDuration = (duration: number | null): string => {
    if (!duration) return 'Mock Test';
    
    const minutes = Math.round(duration / 60);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours} hour${hours > 1 ? 's' : ''}`;
    }
    return `${minutes} minutes`;
  };

  const getIcon = () => {
    if (addon.name.toLowerCase().includes('mock')) {
      return <GraduationCap size={20} className="text-blue-500" />;
    }
    return <Clock size={20} className="text-green-500" />;
  };

  const getPriceDisplay = () => {
    if (isUpgrade && originalPrice !== undefined) {
      const savings = originalPrice - addon.price;
      return (
        <div className="text-right">
          <div className="text-lg font-bold text-green-600">
            {bookingUtils.formatPrice(addon.price)}
          </div>
          <div className="text-xs text-gray-500 line-through">
            {bookingUtils.formatPrice(originalPrice)}
          </div>
          {savings > 0 && (
            <div className="text-xs text-green-600">
              Save {bookingUtils.formatPrice(savings)}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="text-lg font-bold text-gray-900">
        {bookingUtils.formatPrice(addon.price)}
      </div>
    );
  };

  return (
    <Card
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md',
        isSelected 
          ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' 
          : 'border-gray-200 hover:border-gray-300'
      )}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-shrink-0 mt-1">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className={cn(
                  'font-medium text-base',
                  isSelected ? 'text-green-800' : 'text-gray-900'
                )}>
                  {formatDuration(addon.duration)}
                  {addon.name.toLowerCase().includes('mock') && ' Mock Test'}
                  {addon.name.toLowerCase().includes('lesson') && ' Driving Lesson'}
                </h3>
                {isUpgrade && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
                    Upgrade
                  </Badge>
                )}
              </div>
              
              {addon.description && (
                <p className="text-sm text-gray-600 mb-2">
                  {addon.description}
                </p>
              )}

              {isUpgrade && upgradeFrom && (
                <p className="text-xs text-blue-600">
                  Upgrade from {upgradeFrom}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            {getPriceDisplay()}
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
  freePerks,
  className
}: AddOnSelectionAdminProps) {
  // Filter addons by test type
  const filteredAddons = addons.filter(addon => {
    if (testType === 'G2') return addon.type === 'LESSON_G2';
    if (testType === 'G') return addon.type === 'LESSON_G';
    return true;
  });

  // Get mock test and lesson addons
  const mockTestAddon = filteredAddons.find(addon => 
    addon.name.toLowerCase().includes('mock')
  );
  const lessonAddon = filteredAddons.find(addon => 
    addon.name.toLowerCase().includes('lesson') && 
    addon.name.toLowerCase().includes('1 hour')
  );

  // Calculate upgrade pricing
  const getUpgradeInfo = (addon: Addon) => {
    const isMockTest = addon.name.toLowerCase().includes('mock');
    const isLesson = addon.name.toLowerCase().includes('lesson');

    if (freePerks?.free_30min_lesson && !freePerks.free_1hr_lesson) {
      // Has free 30-min lesson
      if (isMockTest) {
        const basePrice = testType === 'G2' ? 5499 : 6499; // Full mock test price
        const upgradePrice = testType === 'G2' ? 2999 : 3499; // Upgrade price
        return {
          isUpgrade: true,
          upgradeFrom: 'Free 30-minute lesson',
          originalPrice: basePrice,
          actualPrice: upgradePrice
        };
      }
      if (isLesson) {
        const basePrice = testType === 'G2' ? 5000 : 6000; // Full lesson price
        const upgradePrice = testType === 'G2' ? 2500 : 3000; // Upgrade price
        return {
          isUpgrade: true,
          upgradeFrom: 'Free 30-minute lesson',
          originalPrice: basePrice,
          actualPrice: upgradePrice
        };
      }
    }

    if (freePerks?.free_1hr_lesson) {
      // Has free 1-hour lesson
      if (isMockTest) {
        const basePrice = testType === 'G2' ? 5499 : 6499; // Full mock test price
        const upgradePrice = 499; // Fixed upgrade price for both G2 and G
        return {
          isUpgrade: true,
          upgradeFrom: 'Free 1-hour lesson',
          originalPrice: basePrice,
          actualPrice: upgradePrice
        };
      }
    }

    return { isUpgrade: false };
  };

  const handleAddonSelect = (addon: Addon) => {
    if (selectedAddon?.id === addon.id) {
      onAddonSelect(null); // Deselect if already selected
    } else {
      onAddonSelect(addon);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Add-ons</h3>
        <p className="text-sm text-gray-600 mb-4">
          Enhance your road test experience with professional instruction or practice.
        </p>
      </div>

      {/* Show free perks info */}
      {(freePerks?.free_30min_lesson || freePerks?.free_1hr_lesson) && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex items-center gap-2 mb-1">
            <Check size={16} className="text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Free Perk Included!
            </span>
          </div>
          <p className="text-sm text-green-700">
            {freePerks.free_1hr_lesson 
              ? 'You get a free 1-hour driving lesson with this booking'
              : 'You get a free 30-minute driving lesson with this booking'
            }
          </p>
          <p className="text-xs text-green-600 mt-1">
            You can upgrade to other options below for additional cost.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {/* Mock Test Option */}
        {mockTestAddon && (
          <AddOnCard
            addon={mockTestAddon}
            isSelected={selectedAddon?.id === mockTestAddon.id}
            onSelect={() => handleAddonSelect(mockTestAddon)}
            {...getUpgradeInfo(mockTestAddon)}
          />
        )}

        {/* Driving Lesson Option */}
        {lessonAddon && !freePerks?.free_1hr_lesson && (
          <AddOnCard
            addon={lessonAddon}
            isSelected={selectedAddon?.id === lessonAddon.id}
            onSelect={() => handleAddonSelect(lessonAddon)}
            {...getUpgradeInfo(lessonAddon)}
          />
        )}
      </div>

      {/* No add-on option */}
      <Card
        className={cn(
          'cursor-pointer transition-all duration-200 hover:shadow-md',
          !selectedAddon 
            ? 'border-green-500 bg-green-50 ring-2 ring-green-500/20' 
            : 'border-gray-200 hover:border-gray-300'
        )}
        onClick={() => onAddonSelect(null)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center">
                {!selectedAddon && <Check size={12} className="text-green-500" />}
              </div>
              <span className="font-medium text-gray-900">
                No additional add-on
              </span>
            </div>
            <span className="text-sm text-gray-600">$0.00</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}