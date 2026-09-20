// components/layouts/InstructorPerformanceCards.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Route, Users } from 'lucide-react';
import type { DashboardAnalytics } from '@/types/admin';

interface InstructorPerformanceCardsProps {
  analytics: DashboardAnalytics;
}

export default function InstructorPerformanceCards({ analytics }: InstructorPerformanceCardsProps) {
  const performanceMetrics: {
    title: string;
    amount: string | null;
    instructorName: string;
    icon: typeof Trophy;
    description: string;
    caveat?: string;
  }[] = [
    {
      title: 'Busiest Instructor',
      // The endpoint ranks by SUM(hourly_rate * total_hours). Since the pay rework
      // on 2026-09-19 that is not what anyone was paid — real earnings are
      // base_amount + transportation_amount, frozen at accept, and total_hours is
      // wall clock, which moves no money. The ranking is still meaningful; the
      // dollar figure is not, so it is deliberately not rendered. Per-instructor
      // earnings come from the server on the instructor detail modal.
      amount: null,
      instructorName: analytics.top_earner.name,
      icon: Trophy,
      description: analytics.top_earner.description,
      caveat: 'Ranked by recorded hours × rate — not by what was paid.',
    },
    {
      title: 'Most Distance',
      // SUM(ride_sessions.total_distance) — KILOMETRES, not cents. Dividing this
      // by 100 understated every distance by two orders of magnitude.
      amount: `${analytics.most_distance_instructor.value.toFixed(1)} km total`,
      instructorName: analytics.most_distance_instructor.name,
      icon: Route,
      description: analytics.most_distance_instructor.description,
    },
    {
      title: 'Most Rides',
      amount: `${analytics.most_rides_instructor.value} rides`,
      instructorName: analytics.most_rides_instructor.name,
      icon: Users,
      description: analytics.most_rides_instructor.description,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
      {performanceMetrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <metric.icon className="w-5 h-5 text-primary" />
              {metric.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metric.amount ? (
              <>
                <div className="text-2xl font-bold text-primary mb-1">{metric.amount}</div>
                <div className="text-sm font-medium text-gray-900 mb-1">{metric.instructorName}</div>
              </>
            ) : (
              <div className="text-2xl font-bold text-primary mb-1">{metric.instructorName}</div>
            )}
            <div className="text-xs text-gray-600">{metric.description}</div>
            {metric.caveat && <div className="mt-1 text-xs text-gray-400">{metric.caveat}</div>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}