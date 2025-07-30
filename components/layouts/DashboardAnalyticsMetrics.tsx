// components/layouts/DashboardAnalyticsMetrics.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Users, RefreshCw, Clock, Calculator, Route } from 'lucide-react';
import type { DashboardAnalytics } from '@/types/admin';

interface DashboardAnalyticsMetricsProps {
  analytics: DashboardAnalytics;
}

export default function DashboardAnalyticsMetrics({ analytics }: DashboardAnalyticsMetricsProps) {
  const metrics = [
    {
      title: 'Total Bookings',
      value: analytics.total_bookings.toString(),
      icon: Calendar,
      description: 'All time bookings',
    },
    {
      title: 'Total Instructors', 
      value: analytics.total_instructors.toString(),
      icon: Users,
      description: 'Active instructors',
    },
    {
      title: 'Total Revenue',
      value: `$${(analytics.total_revenue / 100).toLocaleString()} CAD`,
      icon: DollarSign,
      description: 'All time earnings',
    },
    {
      title: 'Pending Bookings',
      value: analytics.pending_bookings.toString(),
      icon: Clock,
      description: 'Awaiting confirmation',
    },
    {
      title: 'Wants Refund',
      value: analytics.wants_refund_count.toString(),
      icon: RefreshCw,
      description: 'Refund requests',
    },
    {
      title: 'Avg Salary/Session',
      value: `$${(analytics.average_salary_per_session / 100).toFixed(0)} CAD`,
      icon: Calculator,
      description: 'Per session average',
    },
    {
      title: 'Avg Distance',
      value: `${analytics.average_distance_km.toFixed(1)}km`,
      icon: Route,
      description: 'Per session average',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <metric.icon className="w-5 h-5 text-primary" />
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary mb-1">{metric.value}</div>
            <div className="text-xs text-gray-600">{metric.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}