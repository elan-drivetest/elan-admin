// components/settings/MissingSettingCard.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';
import { getSettingCopy } from '@/lib/settings-copy';

/**
 * A catalogue entry the server does not have.
 *
 * The seeder only fills a completely empty table (ADMIN_SETTINGS.md §6), so a key
 * added to the backend later never appears on an existing database. What that
 * costs differs per key — a quiet fallback for pickup prices, a broken instructor
 * job board for the ride ones — so the consequence is spelled out rather than
 * generalised.
 */
export default function MissingSettingCard({ settingKey }: { settingKey: string }) {
  const copy = getSettingCopy(settingKey);

  // Same padding rhythm as SettingValueCard so the two line up in the grid.
  return (
    <Card className="h-full border-dashed border-amber-300 bg-amber-50/50 shadow-none transition-colors hover:border-amber-400 hover:bg-amber-50">
      <CardContent className="flex h-full flex-col gap-3 px-6 py-0">
        <div>
          <h3 className="font-semibold text-gray-900">{copy?.label ?? settingKey}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">{copy?.meaning}</p>
        </div>

        <p className="flex gap-2 rounded-lg border border-amber-200 bg-white/70 px-3 py-2.5 text-sm leading-relaxed text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Not set up on this server.</strong> {copy?.missingConsequence}
          </span>
        </p>

        <div className="mt-auto border-t border-amber-200/70 pt-3">
          <span className="text-xs text-amber-700/70">{settingKey}</span>
        </div>
      </CardContent>
    </Card>
  );
}
