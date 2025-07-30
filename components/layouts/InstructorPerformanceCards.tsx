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
  const performanceMetrics = [
    {
      title: 'Top Earner',
      amount: `$${(analytics.top_earner.value / 100).toFixed(0)} CAD`,
      instructorName: analytics.top_earner.name,
      icon: Trophy,
      description: analytics.top_earner.description,
    },
    {
      title: 'Most Distance',
      amount: `${(analytics.most_distance_instructor.value / 100).toFixed(1)}km total`,
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
            <div className="text-2xl font-bold text-primary mb-1">{metric.amount}</div>
            <div className="text-sm font-medium text-gray-900 mb-1">{metric.instructorName}</div>
            <div className="text-xs text-gray-600">{metric.description}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}