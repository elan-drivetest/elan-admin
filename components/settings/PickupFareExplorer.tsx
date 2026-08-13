// components/settings/PickupFareExplorer.tsx
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Car, MapPin } from 'lucide-react';
import { formatCAD } from '@/lib/utils';
import { calculatePickupPrice, describePickupFare } from '@/lib/utils/booking-calculations';
import type { PickupPricingConfig } from '@/lib/pricing-config';

const MAX_DISTANCE_KM = 120;
const QUICK_DISTANCES = [5, 15, 30, 60, 100];

/** Chart geometry — the curve is piecewise linear, so three points describe it exactly. */
const CHART = { width: 640, height: 220, padLeft: 56, padRight: 16, padTop: 16, padBottom: 32 };

interface PickupFareExplorerProps {
  config: PickupPricingConfig;
  distance: number;
  onDistanceChange: (distance: number) => void;
  /** True when one of the three numbers could not be read from the server. */
  unverified?: boolean;
}

export default function PickupFareExplorer({
  config,
  distance,
  onDistanceChange,
  unverified = false,
}: PickupFareExplorerProps) {
  const fare = describePickupFare(distance, config);

  const chart = useMemo(() => {
    const { width, height, padLeft, padRight, padTop, padBottom } = CHART;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    const maxFare = Math.max(calculatePickupPrice(MAX_DISTANCE_KM, config), 1);
    const x = (km: number) => padLeft + (Math.min(km, MAX_DISTANCE_KM) / MAX_DISTANCE_KM) * plotWidth;
    const y = (cents: number) => padTop + plotHeight - (Math.min(cents, maxFare) / maxFare) * plotHeight;

    // (0, 0) → the kink where the cheaper rate starts → the far end of the range.
    const kneeKm = Math.min(config.baseDistance, MAX_DISTANCE_KM);
    const points = [
      { km: 0, cents: 0 },
      { km: kneeKm, cents: calculatePickupPrice(kneeKm, config) },
      { km: MAX_DISTANCE_KM, cents: calculatePickupPrice(MAX_DISTANCE_KM, config) },
    ].filter((p, i, all) => i === 0 || p.km > all[i - 1].km);

    const line = points.map((p) => `${x(p.km)},${y(p.cents)}`).join(' ');
    const area = `${x(0)},${y(0)} ${line} ${x(MAX_DISTANCE_KM)},${y(0)}`;

    return {
      x,
      y,
      maxFare,
      line,
      area,
      kneeVisible: config.baseDistance < MAX_DISTANCE_KM,
      baseline: y(0),
    };
  }, [config]);

  const marker = { x: chart.x(distance), y: chart.y(fare.total) };
  const basePercent = fare.total > 0 ? (fare.baseAmount / (fare.baseAmount + fare.excessAmount)) * 100 : 100;

  return (
    <Card className="border-emerald-100">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base text-gray-900">
            <Car className="h-4 w-4 text-emerald-600" />
            Try it: what would a pickup cost?
          </CardTitle>
          {unverified && (
            <Badge variant="secondary" className="border-amber-200 bg-amber-50 text-amber-800">
              Using safety-net values
            </Badge>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Drag the slider to a distance and see exactly what the customer is charged for the drive,
          using the three numbers set below.
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* The example trip */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Distance to the test centre</p>
              <p className="text-2xl font-semibold text-gray-900">{distance} km</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500">Charged for the drive</p>
              <p className="text-2xl font-semibold text-emerald-700">
                {formatCAD(fare.total, { suffix: false })}
              </p>
            </div>
          </div>

          <Slider
            value={[distance]}
            min={1}
            max={MAX_DISTANCE_KM}
            step={1}
            onValueChange={([next]) => onDistanceChange(next)}
            aria-label="Pickup distance in kilometres"
          />

          <div className="flex flex-wrap gap-2">
            {QUICK_DISTANCES.map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => onDistanceChange(km)}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                  distance === km
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                    : 'border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/60'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>

        {/* Where the money comes from */}
        <div className="space-y-3">
          <div className="flex h-9 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
            <div
              className="flex items-center justify-center bg-emerald-500/90 text-xs font-medium text-white transition-all"
              style={{ width: `${Math.max(basePercent, fare.baseAmount > 0 ? 12 : 0)}%` }}
            >
              {fare.baseAmount > 0 && formatCAD(Math.round(fare.baseAmount), { suffix: false })}
            </div>
            {fare.crossesBaseDistance && (
              <div
                className="flex flex-1 items-center justify-center bg-sky-500/90 text-xs font-medium text-white transition-all"
              >
                {formatCAD(Math.round(fare.excessAmount), { suffix: false })}
              </div>
            )}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/60 p-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <p className="text-sm font-medium text-gray-900">
                  First {fare.baseKm.toFixed(fare.baseKm % 1 ? 1 : 0)} km
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Billed at {formatCAD(config.baseRate, { suffix: false })} per km — your standard
                pickup rate.
              </p>
            </div>

            <div
              className={`rounded-lg border p-3 ${
                fare.crossesBaseDistance
                  ? 'border-sky-100 bg-sky-50/60'
                  : 'border-gray-100 bg-gray-50/60 opacity-70'
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    fare.crossesBaseDistance ? 'bg-sky-500' : 'bg-gray-300'
                  }`}
                />
                <p className="text-sm font-medium text-gray-900">
                  {fare.crossesBaseDistance
                    ? `The extra ${fare.excessKm.toFixed(fare.excessKm % 1 ? 1 : 0)} km`
                    : 'Beyond the included distance'}
                </p>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {fare.crossesBaseDistance
                  ? `Billed at the cheaper ${formatCAD(config.normalRate, { suffix: false })} per km.`
                  : `This trip stays inside your ${config.baseDistance} km included distance, so the cheaper rate never applies.`}
              </p>
            </div>
          </div>

          <p className="rounded-lg bg-gray-50 p-3 text-sm leading-relaxed text-gray-700">
            <MapPin className="mr-1 inline h-3.5 w-3.5 text-gray-400" />
            A customer {distance} km from the test centre pays{' '}
            <strong className="text-gray-900">{formatCAD(fare.total, { suffix: false })}</strong> for
            the drive
            {fare.crossesBaseDistance
              ? ` — ${config.baseDistance} km at ${formatCAD(config.baseRate, { suffix: false })} plus ${fare.excessKm.toFixed(
                  fare.excessKm % 1 ? 1 : 0,
                )} km at ${formatCAD(config.normalRate, { suffix: false })}`
              : ` — ${distance} km at ${formatCAD(config.baseRate, { suffix: false })} each`}
            . The test-centre fee and any add-ons they choose are charged on top of this.
          </p>
        </div>

        {/* The whole price curve */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            The drive charge at every distance
          </p>
          <svg viewBox={`0 0 ${CHART.width} ${CHART.height}`} className="w-full" role="img"
            aria-label={`Pickup charge rises with distance, bending at ${config.baseDistance} kilometres`}>
            {/* horizontal guides */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const yPos = CHART.padTop + (CHART.height - CHART.padTop - CHART.padBottom) * (1 - t);
              return (
                <g key={t}>
                  <line
                    x1={CHART.padLeft}
                    x2={CHART.width - CHART.padRight}
                    y1={yPos}
                    y2={yPos}
                    className="stroke-gray-200"
                    strokeWidth={1}
                    strokeDasharray={t === 0 ? undefined : '4 4'}
                  />
                  <text x={CHART.padLeft - 8} y={yPos + 4} textAnchor="end" className="fill-gray-400 text-[11px]">
                    {formatCAD(Math.round(chart.maxFare * t), { suffix: false })}
                  </text>
                </g>
              );
            })}

            <polygon points={chart.area} className="fill-emerald-500/10" />
            <polyline points={chart.line} className="stroke-emerald-500" strokeWidth={2.5} fill="none" />

            {/* where the cheaper rate takes over */}
            {chart.kneeVisible && (
              <g>
                <line
                  x1={chart.x(config.baseDistance)}
                  x2={chart.x(config.baseDistance)}
                  y1={CHART.padTop}
                  y2={chart.baseline}
                  className="stroke-sky-400"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                />
                <text
                  x={chart.x(config.baseDistance) + 6}
                  y={CHART.padTop + 12}
                  className="fill-sky-600 text-[11px]"
                >
                  {config.baseDistance} km — cheaper rate starts
                </text>
              </g>
            )}

            {/* the trip currently selected above */}
            <line
              x1={marker.x}
              x2={marker.x}
              y1={marker.y}
              y2={chart.baseline}
              className="stroke-gray-400"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={marker.x} cy={marker.y} r={6} className="fill-white stroke-emerald-600" strokeWidth={2.5} />
            <text
              x={Math.min(marker.x + 10, CHART.width - CHART.padRight - 60)}
              y={Math.max(marker.y - 10, CHART.padTop + 10)}
              className="fill-gray-900 text-[12px] font-semibold"
            >
              {formatCAD(fare.total, { suffix: false })}
            </text>

            {/* x axis */}
            {[0, 30, 60, 90, 120].map((km) => (
              <text
                key={km}
                x={chart.x(km)}
                y={CHART.height - 10}
                textAnchor="middle"
                className="fill-gray-400 text-[11px]"
              >
                {km} km
              </text>
            ))}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
