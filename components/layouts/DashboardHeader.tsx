// components/layouts/DashboardHeader.tsx
import React from 'react';
import { Button } from '@/components/ui/button';
import { Eye, Plus } from 'lucide-react';

interface DashboardHeaderProps {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}

export default function DashboardHeader({ 
  title, 
  subtitle, 
  actions 
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 pb-0">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600 mt-1">{subtitle}</p>
      </div>
      {actions && (
        <div className="flex gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}

// Default actions component for dashboard
export function DefaultDashboardActions() {
  return (
    <>
      <Button size="sm" variant="outline">
        <Eye className="h-4 w-4 mr-2" />
        View Reports
      </Button>
      <Button size="sm">
        <Plus className="h-4 w-4 mr-2" />
        New Booking
      </Button>
    </>
  );
}