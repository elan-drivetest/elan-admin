// components/layouts/DashboardAnalyticsMetrics.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Calendar, Users, RefreshCw, Clock, Calculator, Route, Trophy, MapPin, Award } from 'lucide-react';
import type { DashboardAnalytics, InstructorMetric } from '@/types/admin';
import { formatCAD } from '@/lib/utils';
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
      value: formatCAD(analytics.total_revenue),
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
      // The backend computes AVG(ride_sessions.hourly_rate) over completed rides,
      // so this is an average HOURLY RATE, not a per-session payout.
      title: 'Avg Hourly Rate',
      value: `${formatCAD(analytics.average_salary_per_session)}/h`,
      icon: Calculator,
      description: 'Average across completed rides',
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

  // Top-performer highlights returned by the analytics endpoint.
  const highlights: { title: string; icon: typeof Trophy; accent: string; metric?: InstructorMetric }[] = [
    { title: 'Top Earner', icon: Trophy, accent: 'text-yellow-600', metric: analytics.top_earner },
    { title: 'Most Rides', icon: Award, accent: 'text-blue-600', metric: analytics.most_rides_instructor },
    { title: 'Most Distance', icon: MapPin, accent: 'text-green-600', metric: analytics.most_distance_instructor },
  ].filter((h) => h.metric && h.metric.name);

  return (
    <div className="space-y-6">
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

      {/* Top performer highlights */}
      {highlights.length > 0 && (
        <div className="px-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Top Performers</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {highlights.map((h, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-gray-600">
                    <h.icon className={`w-5 h-5 ${h.accent}`} />
                    {h.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold text-gray-900">{h.metric!.name}</div>
                  <div className="text-xs text-gray-600 mt-1">{h.metric!.description}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}