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
    <Card className="border-gray-200">
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Add-on</TableHead>
                <TableHead>Sold with</TableHead>
                <TableHead>Length</TableHead>
                <TableHead>Price</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addons.map((addon) => (
                <TableRow key={addon.id}>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-gray-900">{addon.name}</span>
                      {isAddonNameLocked(addon.name) && (
                        <Lock className="h-3 w-3 text-gray-400" aria-label="Name cannot be changed" />
                      )}
                    </div>
                    {addon.description && (
                      <p className="text-xs text-gray-500">{addon.description}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">{formatAddonType(addon.type)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatAddonDuration(addon.duration)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium text-gray-900">
                      {formatCAD(addon.price, { suffix: false })}
                    </span>
                    {isAddonNameLocked(addon.name) && (
                      <p className="text-xs text-gray-500">also the long-trip credit</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setEditing(addon)}>
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
