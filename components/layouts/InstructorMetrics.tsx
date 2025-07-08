// components/layouts/InstructorMetrics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export interface InstructorMetricData {
  title: string;
  amount: string;
  instructorName: string;
}

interface InstructorMetricsProps {
  metrics: InstructorMetricData[];
}

export default function InstructorMetrics({ metrics }: InstructorMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{metric.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 mb-1">{metric.amount}</div>
            <div className="text-sm font-medium text-gray-900">{metric.instructorName}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}