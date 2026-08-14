// components/settings/AddonCatalogue.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableSkeleton } from '@/components/ui/loading-state';
import { Lock, Pencil } from 'lucide-react';
import AddonEditModal from '@/components/settings/AddonEditModal';
import { formatCAD } from '@/lib/utils';
import { formatAddonDuration, formatAddonType, isAddonNameLocked } from '@/lib/addon-rules';
import type { Addon } from '@/types/admin';

interface AddonCatalogueProps {
  addons: Addon[];
  isLoading?: boolean;
  error?: string | null;
  onUpdated: () => void;
}

export default function AddonCatalogue({
  addons,
  isLoading = false,
  error = null,
  onUpdated,
}: AddonCatalogueProps) {
  const [editing, setEditing] = useState<Addon | null>(null);

  return (
    <Card className="overflow-hidden border-gray-200 py-0 shadow-sm">
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-5">
            <TableSkeleton rows={4} />
          </div>
        ) : error ? (
          <div className="p-5">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : addons.length === 0 ? (
          <div className="p-5">
            <p className="text-sm text-gray-500">No add-ons are set up on this server.</p>
          </div>
        ) : (
          /* Fixed layout so the name column keeps its share instead of being
             squeezed by whichever description happens to be longest. */
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="border-gray-200 bg-primary/[0.06] hover:bg-primary/[0.06]">
                <TableHead className="w-[38%] px-5 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Add-on
                </TableHead>
                <TableHead className="w-[17%] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Sold with
                </TableHead>
                <TableHead className="w-[13%] px-3 py-3 text-xs font-semibold uppercase tracking-wide text-primary">
                  Length
                </TableHead>
                <TableHead className="w-[18%] px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-primary">
                  Price
                </TableHead>
                <TableHead className="w-[14%] px-5 py-3" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.map((addon) => (
                <TableRow key={addon.id} className="border-gray-100 hover:bg-primary/[0.03]">
                  <TableCell className="whitespace-normal px-5 py-3.5 align-top">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900">{addon.name}</span>
                      {isAddonNameLocked(addon.name) && (
                        <Lock className="h-3 w-3 shrink-0 text-gray-400" aria-label="Name cannot be changed" />
                      )}
                    </div>
                    {addon.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                        {addon.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-normal px-3 py-3.5 align-top">
                    <span className="text-sm text-gray-600">{formatAddonType(addon.type)}</span>
                  </TableCell>
                  <TableCell className="px-3 py-3.5 align-top">
                    <span className="text-sm text-gray-600">
                      {formatAddonDuration(addon.duration)}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-normal px-3 py-3.5 text-right align-top">
                    <span className="font-semibold text-gray-900 tabular-nums">
                      {formatCAD(addon.price, { suffix: false })}
                    </span>
                    {isAddonNameLocked(addon.name) && (
                      <p className="mt-0.5 text-xs leading-relaxed text-primary/80">
                        also the long-trip credit
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="px-5 py-3.5 text-right align-top">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(addon)}
                      className="hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <AddonEditModal
        addon={editing}
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        onSaved={onUpdated}
      />
    </Card>
  );
}
