// components/settings/AddonEditModal.tsx
'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormErrorAlert from '@/components/ui/form-error-alert';
import { AlertTriangle, Loader2, Lock } from 'lucide-react';
import { adminService } from '@/services/admin';
import { formatCAD, getApiErrorMessages } from '@/lib/utils';
import { isAddonNameLocked, secondsToMinutes } from '@/lib/addon-rules';
import type { Addon, UpdateAddonRequest } from '@/types/admin';

interface AddonEditModalProps {
  addon: Addon | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function AddonEditModal({ addon, isOpen, onClose, onSaved }: AddonEditModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceDollars, setPriceDollars] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (!addon) return;
    setName(addon.name);
    setDescription(addon.description ?? '');
    setPriceDollars((addon.price / 100).toFixed(2));
    setDurationMinutes(secondsToMinutes(addon.duration));
    setErrors([]);
  }, [addon]);

  if (!addon) return null;

  const nameLocked = isAddonNameLocked(addon.name);

  const parsedPrice = Number(priceDollars.trim().replace(/^\$/, '').replace(/,/g, ''));
  const priceValid = priceDollars.trim() !== '' && Number.isFinite(parsedPrice) && parsedPrice >= 0;
  // `price` is @IsInt() @Min(0) in cents — unlike settings.value it is a real
  // number on the wire, so it must be a whole number of cents.
  const priceCents = priceValid ? Math.round(parsedPrice * 100) : null;

  const parsedMinutes = durationMinutes.trim() === '' ? null : Number(durationMinutes.trim());
  const durationValid =
    parsedMinutes === null ||
    (Number.isFinite(parsedMinutes) && parsedMinutes >= 0 && Number.isInteger(parsedMinutes));
  const durationSeconds = parsedMinutes === null ? null : Math.round(parsedMinutes * 60);

  const nameValid = nameLocked || name.trim() !== '';
  const canSave = priceValid && durationValid && nameValid;

  const priceChanged = priceCents !== null && priceCents !== addon.price;
  const concessionWarning = nameLocked && priceChanged;

  const handleSave = async () => {
    if (!canSave || priceCents === null) return;

    const payload: UpdateAddonRequest = {};
    if (priceCents !== addon.price) payload.price = priceCents;
    if (!nameLocked && name.trim() !== addon.name) payload.name = name.trim();
    if (description.trim() !== (addon.description ?? '')) payload.description = description.trim();
    if (durationSeconds !== null && durationSeconds !== addon.duration) {
      payload.duration = durationSeconds;
    }

    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    setIsSaving(true);
    setErrors([]);

    try {
      await adminService.updateSettingsAddon(addon.id, payload);
      onSaved();
      onClose();
    } catch (err: unknown) {
      setErrors(getApiErrorMessages(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !isSaving && !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit add-on</DialogTitle>
          <DialogDescription>
            Sold with {addon.type.includes('G2') ? 'G2' : 'G'} bookings. The type cannot be changed,
            and add-ons cannot be created or removed here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="addon-name" className="text-xs text-gray-600">
              Name
            </Label>
            <Input
              id="addon-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={nameLocked}
              className="text-sm"
            />
            {nameLocked && (
              <p className="flex gap-1.5 text-xs leading-relaxed text-gray-500">
                <Lock className="mt-0.5 h-3 w-3 shrink-0" />
                <span>
                  This name is locked. The free-lesson credit on long pickups is found by this exact
                  name, so renaming it is rejected — and would quietly cancel the credit if it were
                  allowed.
                </span>
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addon-price" className="text-xs text-gray-600">
              Price
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <Input
                id="addon-price"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                inputMode="decimal"
                placeholder="60.00"
                className="text-sm"
              />
            </div>
            {priceValid ? (
              <p className="text-xs text-gray-500">
                = {formatCAD(priceCents ?? 0, { suffix: false })} · saved as {priceCents}
              </p>
            ) : (
              priceDollars.trim() !== '' && (
                <p className="text-xs text-red-600">Enter a price, for example 60.00.</p>
              )
            )}
          </div>

          {concessionWarning && (
            <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-relaxed text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                This price is also the long-trip credit. On a pickup past the included distance, a
                customer who buys any add-on gets this amount off their bill — so you are changing
                that credit from {formatCAD(addon.price, { suffix: false })} to{' '}
                {formatCAD(priceCents ?? 0, { suffix: false })} at the same time.
              </span>
            </p>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="addon-duration" className="text-xs text-gray-600">
              Length in minutes
            </Label>
            <Input
              id="addon-duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              inputMode="numeric"
              placeholder="Leave blank for no fixed length"
              className="text-sm"
            />
            {!durationValid && (
              <p className="text-xs text-red-600">Enter a whole number of minutes.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="addon-description" className="text-xs text-gray-600">
              Description
            </Label>
            <Input
              id="addon-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-sm"
            />
          </div>

          <FormErrorAlert messages={errors} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !canSave}>
            {isSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
            Save add-on
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
