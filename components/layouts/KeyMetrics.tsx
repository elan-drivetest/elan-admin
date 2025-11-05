// components/layouts/KeyMetrics.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

export interface MetricData {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
}

interface KeyMetricsProps {
  metrics: MetricData[];
}

export default function KeyMetrics({ metrics }: KeyMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            <metric.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            {metric.trend && (
              <p className="text-xs text-muted-foreground">{metric.trend}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}