// components/settings/SettingValueCard.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import FormErrorAlert from '@/components/ui/form-error-alert';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Clock3,
  Loader2,
  Pencil,
  Settings2,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { adminService } from '@/services/admin';
import { getApiErrorMessages } from '@/lib/utils';
import { isPricingCriticalSetting } from '@/lib/pricing-config';
import { invalidatePricingConfig } from '@/hooks/usePricingConfig';
import {
  describeSettingUnit,
  formatSettingValue,
  fromEditorValue,
  getSettingEditorSpec,
  toEditorValue,
  type SettingCopy,
} from '@/lib/settings-copy';
import type { SystemSetting, UpdateSystemSettingRequest } from '@/types/admin';

export type AccentTone = 'emerald' | 'blue' | 'violet' | 'slate';

const ACCENTS: Record<AccentTone, { iconBg: string; iconText: string; border: string; bullet: string }> = {
  emerald: {
    iconBg: 'bg-emerald-50',
    iconText: 'text-emerald-600',
    border: 'hover:border-emerald-300',
    bullet: 'text-emerald-600',
  },
  blue: {
    iconBg: 'bg-blue-50',
    iconText: 'text-blue-600',
    border: 'hover:border-blue-300',
    bullet: 'text-blue-600',
  },
  violet: {
    iconBg: 'bg-violet-50',
    iconText: 'text-violet-600',
    border: 'hover:border-violet-300',
    bullet: 'text-violet-600',
  },
  slate: {
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
    border: 'hover:border-gray-300',
    bullet: 'text-gray-500',
  },
};

/**
 * A plain-English preview of what a typed value would do. Deliberately data,
 * not markup, so the page that knows the business rules doesn't have to return
 * JSX from a callback.
 */
export interface SettingImpact {
  /** The consequence, in one sentence. */
  headline: string;
  /** Optional qualifier — what stays unchanged, what to watch for. */
  detail?: string;
  tone?: 'neutral' | 'warning';
}

interface SettingValueCardProps {
  setting: SystemSetting;
  /** Absent for a key the backend added that this screen has no wording for yet. */
  copy?: SettingCopy;
  icon?: LucideIcon;
  accent?: AccentTone;
  /** Given the value in the unit it is stored in (cents, km, …). */
  describeImpact?: (nextValue: number) => SettingImpact | null;
  onUpdated: (updated: SystemSetting) => void;
}

export default function SettingValueCard({
  setting,
  copy,
  icon,
  accent = 'slate',
  describeImpact,
  onUpdated,
}: SettingValueCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(() => toEditorValue(copy?.unit, setting.value));
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const tone = ACCENTS[accent];
  const Icon = icon ?? Settings2;
  const spec = getSettingEditorSpec(copy?.unit);
  const parsedEdit = fromEditorValue(copy?.unit, editValue);
  const isPricingCritical = isPricingCriticalSetting(setting.key);
  const isUnchanged = parsedEdit.ok && parsedEdit.storedValue === String(setting.value).trim();
  const impact = parsedEdit.ok && !isUnchanged ? describeImpact?.(parsedEdit.numericValue) : null;

  const startEditing = () => {
    setEditValue(toEditorValue(copy?.unit, setting.value));
    setErrors([]);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setEditValue(toEditorValue(copy?.unit, setting.value));
    setErrors([]);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!setting.key) {
      setErrors(['This setting has no key and cannot be saved.']);
      return;
    }
    if (!parsedEdit.ok) {
      setErrors([parsedEdit.error]);
      return;
    }

    setIsSaving(true);
    setErrors([]);

    try {
      const payload: UpdateSystemSettingRequest = { value: parsedEdit.storedValue };
      const updated = await adminService.updateSystemSettingByKey(setting.key, payload);

      // The booking price preview caches these values — drop the cache so the
      // next quote uses the new number instead of the one just replaced.
      invalidatePricingConfig();
      onUpdated(updated);
      setIsEditing(false);
    } catch (err: unknown) {
      setErrors(getApiErrorMessages(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className={`h-full border-gray-200 transition-colors ${tone.border}`}>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        {/* Name + what it is */}
        <div className="flex items-start gap-3">
          <div className={`shrink-0 rounded-lg p-2 ${tone.iconBg}`}>
            <Icon className={`h-5 w-5 ${tone.iconText}`} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold leading-snug text-gray-900">
              {copy?.label ?? setting.name ?? setting.key}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-gray-600">
              {copy?.meaning ?? setting.description ?? 'No description available for this setting.'}
            </p>
          </div>
        </div>

        {/* The number itself */}
        <div className="rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-2xl font-semibold tracking-tight text-gray-900">
              {formatSettingValue(setting.key, setting.value)}
            </span>
            <span className="text-xs text-gray-500">{describeSettingUnit(copy?.unit)}</span>
          </div>
        </div>

        {/* What changing it does */}
        {copy?.affects?.length ? (
          <ul className="space-y-2">
            {copy.affects.map((line) => (
              <li key={line} className="flex gap-2 text-sm leading-relaxed text-gray-700">
                <Check className={`mt-0.5 h-4 w-4 shrink-0 ${tone.bullet}`} />
                <span>{line}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {copy?.caution && (
          <div className="flex gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p className="text-xs leading-relaxed text-amber-900">{copy.caution}</p>
          </div>
        )}

        <div className="mt-auto space-y-3">
          {copy?.takesEffect && (
            <p className="flex items-start gap-2 text-xs text-gray-500">
              <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                <span className="font-medium text-gray-700">When a change kicks in: </span>
                {copy.takesEffect}
              </span>
            </p>
          )}

          {isEditing ? (
            <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-3">
              {/* base_distance / base_rate / normal_rate take effect on the very
                  next booking with no deploy, and the customer client still
                  hardcodes them — so an edit here is a coordinated release. */}
              {isPricingCritical && (
                <div className="rounded-md border border-amber-200 bg-amber-50 p-2.5">
                  <p className="text-xs leading-relaxed text-amber-900">
                    <strong>This changes what customers are charged.</strong> It applies to the
                    next booking taken, with nothing to deploy or approve. The customer app still
                    carries its own copy of this number for the price it previews — line this
                    change up with a customer-app release, or people will be quoted one price and
                    charged another.
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor={`setting-${setting.key}`} className="text-xs text-gray-600">
                  {spec.label}
                </Label>
                <div className="flex items-center gap-2">
                  {spec.mode === 'dollars' && <span className="text-sm text-gray-500">$</span>}
                  <Input
                    id={`setting-${setting.key}`}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    placeholder={spec.placeholder}
                    inputMode="decimal"
                    className="text-sm"
                  />
                  {spec.suffix && <span className="text-sm text-gray-500">{spec.suffix}</span>}
                </div>
              </div>

              {/* Before → after, so the consequence is visible before saving. */}
              {parsedEdit.ok && !isUnchanged && (
                <div className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-500 line-through">
                      {formatSettingValue(setting.key, setting.value)}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400" />
                    <span className="font-semibold text-gray-900">
                      {formatSettingValue(setting.key, parsedEdit.storedValue)}
                    </span>
                  </div>
                  {impact && (
                    <p
                      className={`text-xs leading-relaxed ${
                        impact.tone === 'warning' ? 'text-red-600' : 'text-gray-600'
                      }`}
                    >
                      <span className="font-medium text-gray-900">{impact.headline}</span>
                      {impact.detail ? ` ${impact.detail}` : ''}
                    </p>
                  )}
                </div>
              )}

              {!parsedEdit.ok && editValue.trim() !== '' && (
                <p className="text-xs text-red-600">{parsedEdit.error}</p>
              )}

              <FormErrorAlert messages={errors} />

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isSaving || !parsedEdit.ok || isUnchanged}
                  className="flex-1"
                >
                  {isSaving ? (
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Check className="mr-1 h-3.5 w-3.5" />
                  )}
                  Save change
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  disabled={isSaving}
                  className="flex-1"
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-3">
              <span className="truncate text-[11px] text-gray-400" title={setting.key}>
                {setting.updated_at
                  ? `Last changed ${new Date(setting.updated_at).toLocaleDateString('en-CA', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}`
                  : 'Never changed'}
              </span>
              <Button variant="outline" size="sm" onClick={startEditing}>
                <Pencil className="mr-1 h-3.5 w-3.5" />
                Change
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
