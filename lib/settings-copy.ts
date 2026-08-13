// lib/settings-copy.ts
import { formatCAD } from '@/lib/utils';

/**
 * Plain-English names and one-line descriptions for the rows in the backend
 * `settings` table, so the settings screen doesn't render `base_rate  100`.
 *
 * Wording is taken from BUSINESS_LOGIC.md §3.2 — don't invent behaviour here.
 */

/**
 * Units per settings key, taken from the backend's own table rather than
 * guessed from substrings. Substring matching got `average_distance_per_hour`
 * wrong (it matched `distance` before `hour` and rendered a speed as "25 km").
 */
export type SettingUnit =
  | 'cents'
  | 'cents-per-km'
  | 'cents-per-hour'
  | 'km'
  | 'km-per-hour'
  | 'count';

export interface SettingCopy {
  label: string;
  meaning: string;
  unit: SettingUnit;
}

export const SETTING_COPY: Record<string, SettingCopy> = {
  base_distance: {
    label: 'Included pickup distance',
    meaning:
      'Pickups are charged at the higher rate up to this distance, and at the cheaper rate beyond it.',
    unit: 'km',
  },
  base_rate: {
    label: 'Pickup rate — inside the included distance',
    meaning: 'What each kilometre costs the customer up to the included distance.',
    unit: 'cents-per-km',
  },
  normal_rate: {
    label: 'Pickup rate — beyond the included distance',
    meaning: 'What each kilometre costs the customer past the included distance.',
    unit: 'cents-per-km',
  },
  instructor_rate: {
    label: 'Instructor pay per hour',
    meaning:
      'What an instructor earns per hour of ride time. Locked in when they accept a job, so a change never re-prices accepted work.',
    unit: 'cents-per-hour',
  },
  average_distance_per_hour: {
    label: 'Assumed driving speed',
    meaning:
      'Used only to estimate how long a job takes, so instructors can judge it before accepting. Real payouts use the clock.',
    unit: 'km-per-hour',
  },
  instructor_referral_price: {
    label: 'Instructor referral bonus',
    meaning:
      'Paid to both the instructor who referred and the one who joined — so each successful referral costs twice this.',
    unit: 'cents',
  },
  admin_referral_price: {
    label: 'Promo code bonus',
    meaning:
      'Default bonus on promo codes your team creates, paid to the instructor who claims one. Frozen onto each code at creation.',
    unit: 'cents',
  },
  referral_min_rides: {
    label: 'Rides required for a bonus',
    meaning: 'How many rides a referred instructor must complete before any bonus is paid.',
    unit: 'count',
  },
};

/** Display order. Anything the backend adds later falls to the end. */
export const SETTING_ORDER = [
  'base_distance',
  'base_rate',
  'normal_rate',
  'instructor_rate',
  'average_distance_per_hour',
  'instructor_referral_price',
  'admin_referral_price',
  'referral_min_rides',
];

export function getSettingCopy(key: string): SettingCopy | undefined {
  return SETTING_COPY[key];
}

export function getSettingUnit(key: string): SettingUnit | undefined {
  return SETTING_COPY[key]?.unit;
}

/**
 * The server parses with `Number()` and rejects non-finite or negative values in
 * favour of a fallback, so mirror that judgement instead of rendering "$NaN".
 */
export function parseSettingValue(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** The stored value rendered the way a person would say it out loud. */
export function formatSettingValue(key: string, value: string): string {
  const unit = getSettingUnit(key);
  const parsed = parseSettingValue(value);

  if (!unit || parsed === null) return value;

  switch (unit) {
    case 'cents':
      return formatCAD(parsed, { suffix: false });
    case 'cents-per-km':
      return `${formatCAD(parsed, { suffix: false })}/km`;
    case 'cents-per-hour':
      return `${formatCAD(parsed, { suffix: false })}/hour`;
    case 'km':
      return `${parsed} km`;
    case 'km-per-hour':
      return `${parsed} km/h`;
    case 'count':
      return String(parsed);
  }
}

/**
 * How the value should be typed in. Money is stored in cents but nobody thinks
 * in cents, so the editor takes dollars and converts.
 */
export interface SettingEditorSpec {
  mode: 'dollars' | 'number';
  placeholder: string;
  /** Whole numbers only (a count of rides cannot be 2.5). */
  integerOnly: boolean;
  suffix?: string;
}

export function getSettingEditorSpec(unit: SettingUnit | undefined): SettingEditorSpec {
  switch (unit) {
    case 'cents':
      return { mode: 'dollars', placeholder: '100.00', integerOnly: false };
    case 'cents-per-km':
      return { mode: 'dollars', placeholder: '1.00', integerOnly: false, suffix: '/km' };
    case 'cents-per-hour':
      return { mode: 'dollars', placeholder: '40.00', integerOnly: false, suffix: '/hour' };
    case 'km':
      return { mode: 'number', placeholder: '50', integerOnly: false, suffix: 'km' };
    case 'km-per-hour':
      return { mode: 'number', placeholder: '50', integerOnly: false, suffix: 'km/h' };
    case 'count':
      return { mode: 'number', placeholder: '5', integerOnly: true };
    default:
      return { mode: 'number', placeholder: '', integerOnly: false };
  }
}

/** The stored string turned into what the editor should show. */
export function toEditorValue(unit: SettingUnit | undefined, storedValue: string): string {
  const parsed = parseSettingValue(storedValue);
  if (parsed === null) return storedValue;
  return getSettingEditorSpec(unit).mode === 'dollars' ? (parsed / 100).toFixed(2) : String(parsed);
}

export type EditorParseResult =
  | { ok: true; storedValue: string; numericValue: number }
  | { ok: false; error: string };

/** What was typed turned back into the string the API stores. */
export function fromEditorValue(unit: SettingUnit | undefined, input: string): EditorParseResult {
  const spec = getSettingEditorSpec(unit);
  const trimmed = input.trim().replace(/^\$/, '').replace(/,/g, '');

  if (trimmed === '') return { ok: false, error: 'Enter a value.' };

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return { ok: false, error: 'Enter a number, for example 1.00.' };
  if (parsed < 0) return { ok: false, error: 'This cannot be a negative number.' };

  const numericValue = spec.mode === 'dollars' ? Math.round(parsed * 100) : parsed;

  if (spec.integerOnly && !Number.isInteger(numericValue)) {
    return { ok: false, error: 'Enter a whole number.' };
  }

  return { ok: true, storedValue: String(numericValue), numericValue };
}
