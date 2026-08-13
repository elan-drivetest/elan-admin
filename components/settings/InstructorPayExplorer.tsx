// components/settings/InstructorPayExplorer.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Timer } from 'lucide-react';
import { formatCAD } from '@/lib/utils';
import { calculatePickupPrice, estimateRideEarnings } from '@/lib/utils/booking-calculations';
import {
  RIDE_SESSION_DEFAULT_HOURLY_RATE,
  type PickupPricingConfig,
  type RideEconomicsResolution,
} from '@/lib/pricing-config';
import { formatHours } from '@/lib/settings-copy';

interface InstructorPayExplorerProps {
  rideEconomics: RideEconomicsResolution;
  pricing: PickupPricingConfig;
  distance: number;
}

/** One labelled bar in the money comparison. */
function MoneyBar({
  label,
  note,
  amount,
  max,
  tone,
}: {
  label: string;
  note: string;
  amount: number;
  max: number;
  tone: 'emerald' | 'blue' | 'amber';
}) {
  const fills = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    amber: 'bg-amber-500',
  } as const;

  const width = max > 0 ? Math.max((amount / max) * 100, 2) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-sm font-semibold text-gray-900">{formatCAD(amount, { suffix: false })}</p>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div className={`h-full rounded-full transition-all ${fills[tone]}`} style={{ width: `${width}%` }} />
      </div>
      <p className="text-xs leading-relaxed text-gray-500">{note}</p>
    </div>
  );
}

export default function InstructorPayExplorer({
  rideEconomics,
  pricing,
  distance,
}: InstructorPayExplorerProps) {
  if (!rideEconomics.available) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex gap-3 p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-medium text-gray-900">Instructors cannot see available jobs right now</p>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              The hourly rate and the assumed driving speed both need a sensible number before the
              app can work out what a job is worth. One of them is missing or set to zero
              ({rideEconomics.invalidKeys.join(', ')}), and unlike the pickup prices there is no
              safety net here — the instructor job list fails outright until it is fixed.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { averageDistancePerHour, instructorRate } = rideEconomics.config;
  const estimate = estimateRideEarnings(distance, rideEconomics.config);
  const customerDriveCharge = calculatePickupPrice(distance, pricing);
  const adminAssignedCost = Math.round(estimate.rideHours * RIDE_SESSION_DEFAULT_HOURLY_RATE);
  const max = Math.max(customerDriveCharge, estimate.ridePrice, adminAssignedCost, 1);
  const ratesDiffer = RIDE_SESSION_DEFAULT_HOURLY_RATE !== instructorRate;

  return (
    <Card className="border-blue-100">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base text-gray-900">
          <Timer className="h-4 w-4 text-blue-600" />
          The same {distance} km trip, from the instructor’s side
        </CardTitle>
        <p className="text-sm text-gray-600">
          Before an instructor takes a job, the app turns the distance into an estimated length and
          value using the two numbers below. Move the slider above to change the trip.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Distance</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{distance} km</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Estimated time</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">{formatHours(estimate.rideHours)}</p>
            <p className="text-xs text-gray-500">at {averageDistancePerHour} km/h</p>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50/70 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">Shown as worth</p>
            <p className="mt-1 text-lg font-semibold text-blue-700">
              {formatCAD(estimate.ridePrice, { suffix: false })}
            </p>
            <p className="text-xs text-gray-500">at {formatCAD(instructorRate, { suffix: false })}/hour</p>
          </div>
        </div>

        <div className="space-y-4 rounded-xl border border-gray-100 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Where that leaves you on the driving
          </p>

          <MoneyBar
            label="Customer pays for the drive"
            note="The pickup charge only. The test-centre fee and any add-ons are extra income on top of this."
            amount={customerDriveCharge}
            max={max}
            tone="emerald"
          />

          <MoneyBar
            label="Instructor picks the job up themselves"
            note={`Estimated at ${formatCAD(instructorRate, { suffix: false })}/hour. The final payout is measured on the clock, so a slow trip costs more than this and a quick one costs less.`}
            amount={estimate.ridePrice}
            max={max}
            tone="blue"
          />

          {ratesDiffer && (
            <MoneyBar
              label="Your team assigns the job instead"
              note={`The same work settles at ${formatCAD(RIDE_SESSION_DEFAULT_HOURLY_RATE, { suffix: false })}/hour, because an assigned job never picks up the rate below. Known defect — worth checking before assigning long trips by hand.`}
              amount={adminAssignedCost}
              max={max}
              tone="amber"
            />
          )}

          <p className="rounded-lg bg-gray-50 p-3 text-xs leading-relaxed text-gray-600">
            These are estimates for judging a job, not an accounting figure. Card processing fees,
            refunds, and the actual time on the road all move the real number.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
