// components/layouts/DashboardAnalyticsMetrics.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Users, RefreshCw, Clock, Calculator, Route } from 'lucide-react';
import type { DashboardAnalytics } from '@/types/admin';
import Link from 'next/link';

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
      link: null,
    },
    {
      title: 'Total Instructors',
      value: analytics.total_instructors.toString(),
      icon: Users,
      description: 'Active instructors',
      link: null,
    },
    {
      title: 'Total Revenue',
      value: `$${(analytics.total_revenue / 100).toLocaleString()} CAD`,
      icon: DollarSign,
      description: 'All time earnings',
      link: null,
    },
    {
      title: 'Pending Bookings',
      value: analytics.pending_bookings.toString(),
      icon: Clock,
      description: 'Awaiting confirmation',
      link: null,
    },
    {
      title: 'Pending Refunds',
      value: analytics.wants_refund_count.toString(),
      icon: RefreshCw,
      description: 'Click to view refund requests',
      link: '/refunds?status=pending',
    },
    {
      title: 'Avg Salary/Session',
      value: `$${(analytics.average_salary_per_session / 100).toFixed(0)} CAD`,
      icon: Calculator,
      description: 'Per session average',
      link: null,
    },
    {
      title: 'Avg Distance',
      value: `${analytics.average_distance_km.toFixed(1)}km`,
      icon: Route,
      description: 'Per session average',
      link: null,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 px-6">
      {metrics.map((metric, index) => {
        const cardContent = (
          <Card className={metric.link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}>
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
        );

        return metric.link ? (
          <Link
            key={index}
            href={metric.link}
            className="block transition-transform hover:scale-105"
          >
            {cardContent}
          </Link>
        ) : (
          <div key={index}>{cardContent}</div>
        );
      })}
    </div>
  );
}