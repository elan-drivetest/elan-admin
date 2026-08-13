// components/settings/SettingValueCard.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FormErrorAlert from '@/components/ui/form-error-alert';
import { ArrowRight, Check, Loader2, Pencil, X } from 'lucide-react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import { isPricingCriticalSetting } from '@/lib/pricing-config';
import { invalidatePricingConfig } from '@/hooks/usePricingConfig';
import {
  formatSettingValue,
  fromEditorValue,
  getSettingCopy,
  getSettingEditorSpec,
  getSettingUnit,
  toEditorValue,
} from '@/lib/settings-copy';
import type { SystemSetting, UpdateSystemSettingRequest } from '@/types/admin';

interface SettingValueCardProps {
  setting: SystemSetting;
  /** One line of consequence for the typed value, e.g. a re-priced example trip. */
  describeImpact?: (nextValue: number) => string | null;
  onUpdated: () => void;
}

export default function SettingValueCard({
  setting,
  describeImpact,
  onUpdated,
}: SettingValueCardProps) {
  const copy = getSettingCopy(setting.key);
  const unit = getSettingUnit(setting.key);
  const spec = getSettingEditorSpec(unit);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(() => toEditorValue(unit, setting.value));
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const parsed = fromEditorValue(unit, editValue);
  const isUnchanged = parsed.ok && parsed.storedValue === String(setting.value).trim();
  const impact = parsed.ok && !isUnchanged ? describeImpact?.(parsed.numericValue) : null;

  const handleSave = async () => {
    if (!parsed.ok) return;

    setIsSaving(true);
    setErrors([]);

    try {
      const payload: UpdateSystemSettingRequest = { value: parsed.storedValue };
      await adminService.updateSystemSettingByKey(setting.key, payload);

      // The booking price preview caches these values — drop the cache so the
      // next quote uses the new number instead of the one just replaced.
      invalidatePricingConfig();
      onUpdated();
      setIsEditing(false);
    } catch (err: unknown) {
      setErrors(getApiErrorMessages(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-full border-gray-200">
      <CardContent className="flex h-full flex-col gap-3 p-5">
        <div>
          <h3 className="font-medium text-gray-900">{copy?.label ?? setting.name ?? setting.key}</h3>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {copy?.meaning ?? setting.description}
          </p>
        </div>

        <p className="text-2xl font-semibold tracking-tight text-gray-900">
          {formatSettingValue(setting.key, setting.value)}
        </p>

        {isEditing ? (
          <div className="mt-auto space-y-3">
            {/* base_distance / base_rate / normal_rate take effect on the very
                next booking with no deploy, and the customer app still hardcodes
                them — so an edit here is a coordinated release. */}
            {isPricingCriticalSetting(setting.key) && (
              <p className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs leading-relaxed text-amber-900">
                Changes what customers are charged on the next booking. The customer app has its own
                copy of this number — release both together.
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
              {spec.suffix && <span className="text-sm text-gray-500">{spec.suffix}</span>}
            </div>

            {parsed.ok && !isUnchanged && (
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

            <FormErrorAlert messages={errors} />

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={isSaving || !parsed.ok || isUnchanged}
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
                  setEditValue(toEditorValue(unit, setting.value));
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
          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <span className="text-xs text-gray-400">{setting.key}</span>
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Change
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
