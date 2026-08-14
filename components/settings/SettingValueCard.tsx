// components/settings/SettingValueCard.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import FormErrorAlert from '@/components/ui/form-error-alert';
import { AlertTriangle, ArrowRight, Check, Loader2, Pencil, X } from 'lucide-react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import { invalidatePricingConfig } from '@/hooks/usePricingConfig';
import {
  formatSettingValue,
  getSettingCopy,
  getSettingEditorSpec,
  getSettingUnit,
  isMoneyUnit,
  parseSettingInput,
  toEditorValue,
} from '@/lib/settings-copy';
import type { SystemSetting, UpdateSystemSettingRequest } from '@/types/admin';

interface SettingValueCardProps {
  setting: SystemSetting;
  /** One line of what the current value means in practice. */
  inPractice?: string | null;
  /** One line of consequence for the typed value, e.g. a re-priced example trip. */
  describeImpact?: (nextValue: number) => string | null;
  /** Rules that need a sibling setting — returns an error message or null. */
  validate?: (nextValue: number) => string | null;
  onUpdated: () => void;
}

export default function SettingValueCard({
  setting,
  inPractice,
  describeImpact,
  validate,
  onUpdated,
}: SettingValueCardProps) {
  const copy = getSettingCopy(setting.key);
  const spec = getSettingEditorSpec(setting.key);
  const unit = getSettingUnit(setting.key);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(() => toEditorValue(setting.key, setting.value));
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const parsed = parseSettingInput(setting.key, editValue);
  const isUnchanged = parsed.ok && parsed.storedValue === String(setting.value).trim();
  const siblingError = parsed.ok && !isUnchanged ? validate?.(parsed.numericValue) ?? null : null;
  const impact = parsed.ok && !isUnchanged ? describeImpact?.(parsed.numericValue) : null;
  const canSave = parsed.ok && !isUnchanged && !siblingError;

  /** §4.4: the high and medium keys are confirmed before they are written. */
  const needsConfirmation = copy?.risk === 'high' || copy?.risk === 'medium';

  const performSave = async () => {
    if (!parsed.ok) return;

    setIsSaving(true);
    setErrors([]);

    try {
      // `value` is @IsString() on the server with no implicit conversion — a JSON
      // number 400s (ADMIN_SETTINGS.md §2.2), so it always goes as a string.
      const payload: UpdateSystemSettingRequest = { value: parsed.storedValue };
      await adminService.updateSystemSettingByKey(setting.key, payload);

      // The booking price preview caches these values — drop the cache so the
      // next quote uses the new number instead of the one just replaced.
      invalidatePricingConfig();
      onUpdated();
      setIsConfirming(false);
      setIsEditing(false);
    } catch (err: unknown) {
      setErrors(getApiErrorMessages(err));
      setIsConfirming(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveClick = () => {
    if (!canSave) return;
    if (needsConfirmation) {
      setIsConfirming(true);
      return;
    }
    performSave();
  };

  return (
    <Card
      className={`h-full shadow-sm transition-all hover:shadow-md ${
        copy?.risk === 'high'
          ? 'border-amber-200 hover:border-amber-300'
          : 'border-gray-200 hover:border-primary/30'
      }`}
    >
      <CardContent className="flex h-full flex-col gap-3 px-6 py-0">
        <div>
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900">
              {copy?.label ?? setting.name ?? setting.key}
            </h3>
            {copy?.risk === 'high' && (
              <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
                High impact
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {copy?.meaning ?? setting.description}
          </p>
        </div>

        <div className="rounded-lg border border-primary/10 bg-primary/[0.04] px-3 py-2.5">
          <p className="text-2xl font-semibold tracking-tight text-primary tabular-nums">
            {formatSettingValue(setting.key, setting.value)}
          </p>
          {inPractice && <p className="mt-1 text-sm leading-relaxed text-gray-600">{inPractice}</p>}
        </div>

        {isEditing ? (
          <div className="mt-auto space-y-3">
            {/* §4 blast radius: the admin is told what a save does before doing it */}
            {copy?.warning && (
              <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-relaxed text-amber-900">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{copy.warning}</span>
              </p>
            )}

            <div className="flex items-center gap-2">
              {spec.mode === 'dollars' && <span className="text-sm text-gray-500">$</span>}
              <Input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder={spec.placeholder}
                inputMode="decimal"
                aria-label={copy?.label ?? setting.key}
                className="text-sm"
              />
              {spec.suffix && <span className="whitespace-nowrap text-sm text-gray-500">{spec.suffix}</span>}
            </div>

            {/* Typing 40 where 4000 belongs is a 100x error — show both readings */}
            {parsed.ok && isMoneyUnit(unit) && (
              <p className="text-xs text-gray-500">
                = {formatSettingValue(setting.key, parsed.storedValue)} · saved as{' '}
                {parsed.storedValue}
              </p>
            )}

            {parsed.ok && !isUnchanged && !siblingError && (
              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 line-through">
                    {formatSettingValue(setting.key, setting.value)}
                  </span>
                  <ArrowRight className="h-3 w-3 text-gray-400" />
                  <span className="font-medium text-gray-900">
                    {formatSettingValue(setting.key, parsed.storedValue)}
                  </span>
                </div>
                {impact && <p>{impact}</p>}
              </div>
            )}

            {!parsed.ok && editValue.trim() !== '' && (
              <p className="text-xs text-red-600">{parsed.error}</p>
            )}
            {siblingError && <p className="text-xs text-red-600">{siblingError}</p>}

            <FormErrorAlert messages={errors} />

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSaveClick}
                disabled={isSaving || !canSave}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="mr-1 h-3.5 w-3.5" />
                )}
                Save
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditValue(toEditorValue(setting.key, setting.value));
                  setErrors([]);
                  setIsEditing(false);
                }}
                disabled={isSaving}
                className="flex-1"
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
            <span className="truncate text-xs text-gray-400">{setting.key}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              className="shrink-0 hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
            >
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Change
            </Button>
          </div>
        )}
      </CardContent>

      <Dialog open={isConfirming} onOpenChange={(open) => !isSaving && setIsConfirming(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm this change</DialogTitle>
            <DialogDescription>
              {copy?.label ?? setting.key} — this one carries real consequences.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm">
              <span className="text-gray-500 line-through">
                {formatSettingValue(setting.key, setting.value)}
              </span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-gray-900">
                {parsed.ok ? formatSettingValue(setting.key, parsed.storedValue) : ''}
              </span>
            </div>

            {copy?.warning && (
              <p className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed text-amber-900">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{copy.warning}</span>
              </p>
            )}

            {impact && <p className="text-sm text-gray-600">{impact}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirming(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={performSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Save change
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
