// components/ui/toggle-switch.tsx
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  size?: 'sm' | 'default' | 'lg';
  disabled?: boolean;
  className?: string;
}

export default function ToggleSwitch({
  checked,
  onCheckedChange,
  label,
  size = 'default',
  disabled = false,
  className,
}: ToggleSwitchProps) {
  const sizeClasses = {
    sm: 'w-8 h-4',
    default: 'w-10 h-5',
    lg: 'w-12 h-6',
  };

  const thumbSizeClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const translateClasses = {
    sm: checked ? 'translate-x-4' : 'translate-x-0.5',
    default: checked ? 'translate-x-5' : 'translate-x-0.5',
    lg: checked ? 'translate-x-6' : 'translate-x-0.5',
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          sizeClasses[size],
          checked ? 'bg-primary' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out',
            thumbSizeClasses[size],
            translateClasses[size]
          )}
        />
      </button>
      {label && (
        <span className={cn(
          'text-sm font-medium text-gray-900',
          disabled && 'text-gray-400'
        )}>
          {label}
        </span>
      )}
    </div>
  );
}