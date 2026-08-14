// lib/settings-copy.ts
import { formatCAD } from '@/lib/utils';

/**
 * The settings catalogue, in business language.
 *
 * Source of truth: `../elan-backend/elan-backend/docs/ADMIN_SETTINGS.md` (§3 the
 * catalogue, §4 blast radius, §5 the validation the UI must enforce, §6 seeding)
 * cross-referenced with BUSINESS_LOGIC.md §3. Every sentence below is
 * paraphrased from those — do not invent behaviour here.
 *
 * Seventeen keys as of 2026-08-13 (the original eight plus nine business rules).
 * Four things live here that the backend will not do for us:
 *   1. `mustBePositive` / `maximum` — the API accepts any non-empty string, so a
 *      `0` that takes down the instructor job board has to be rejected here.
 *   2. `warning` — what an admin must be told BEFORE saving a risky key.
 *   3. `risk` — drives the confirmation dialog (§4.4).
 *   4. `missingConsequence` — what is actually happening while a row is absent,
 *      which differs per key (silent fallback vs hard 500).
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
  | 'count'
  | 'days'
  | 'hours'
  | 'months'
  | 'percent';

/** ADMIN_SETTINGS.md §4.4. Anything not low asks for confirmation before saving. */
export type SettingRisk = 'high' | 'medium' | 'low';

export type SettingGroupId = 'pickup' | 'rides' | 'bookings' | 'referrals';

export interface SettingCopy {
  label: string;
  meaning: string;
  unit: SettingUnit;
  group: SettingGroupId;
  risk: SettingRisk;
  /** Shown while editing, and repeated in the confirmation dialog. */
  warning?: string;
  /** What the system does while this row does not exist (§6). */
  missingConsequence: string;
  /** Reject 0 as well as negatives — 0 breaks something (§5). */
  mustBePositive?: boolean;
  /** Upper bound, for percentages. */
  maximum?: number;
}

export const SETTING_COPY: Record<string, SettingCopy> = {
  // --- Pickup pricing ------------------------------------------------------
  base_distance: {
    label: 'Included pickup distance',
    // Deliberately does not call either tier "higher" or "cheaper" — nothing
    // stops an admin setting the beyond-distance rate above the inside one, and
    // the worked line below states the real numbers either way.
    meaning:
      'Pickups are charged at one rate up to this distance, and at a different rate beyond it.',
    unit: 'km',
    group: 'pickup',
    risk: 'medium',
    mustBePositive: true,
    warning:
      'Changes what customers are charged from the next booking onward, and moves the point where an add-on booking earns its free 30-minute lesson. The customer app previews prices with its own copy of this number — until it reads the live pricing endpoint, customers can be quoted one price and charged another.',
    missingConsequence:
      'Bookings quietly fall back to 50 km. Nothing breaks, but the tier boundary is not yours.',
  },
  base_rate: {
    label: 'Pickup rate — inside the included distance',
    meaning: 'What each kilometre costs the customer up to the included distance.',
    unit: 'cents-per-km',
    group: 'pickup',
    risk: 'medium',
    warning:
      'Changes what customers are charged from the next booking onward. The customer app previews prices with its own copy of this number — until it reads the live pricing endpoint, customers can be quoted one price and charged another.',
    missingConsequence: 'Bookings quietly fall back to $1.00/km.',
  },
  normal_rate: {
    label: 'Pickup rate — beyond the included distance',
    meaning: 'What each kilometre costs the customer past the included distance.',
    unit: 'cents-per-km',
    group: 'pickup',
    risk: 'medium',
    warning:
      'Changes what long-distance customers are charged from the next booking onward. The customer app previews prices with its own copy of this number — until it reads the live pricing endpoint, customers can be quoted one price and charged another.',
    missingConsequence: 'Bookings quietly fall back to $0.50/km.',
  },

  // --- Instructor pay & rides ---------------------------------------------
  instructor_rate: {
    label: 'Instructor pay per hour',
    meaning:
      'What an instructor earns per hour of ride time. Locked in when they accept a job, so a change never re-prices accepted work.',
    unit: 'cents-per-hour',
    group: 'rides',
    risk: 'high',
    mustBePositive: true,
    warning:
      'The instructor job board reads this on every load and fails outright if it is zero or blank — no instructor would see any job. It also sets take-home pay on every job accepted from now on.',
    missingConsequence:
      'The instructor job board fails with an error, and any ride that does get accepted pays $80.00/hour — double the intended rate.',
  },
  average_distance_per_hour: {
    label: 'Assumed driving speed',
    meaning:
      'Used only to estimate how long a job takes, so instructors can judge it before accepting. Real payouts use the clock.',
    unit: 'km-per-hour',
    group: 'rides',
    risk: 'high',
    mustBePositive: true,
    warning:
      'The instructor job board reads this on every load and fails outright if it is zero or blank — no instructor would see any job. A lower speed also makes every job look longer and better paid than it is.',
    missingConsequence: 'The instructor job board fails with an error until this row exists.',
  },
  instructor_payout_delay_days: {
    label: 'Payout hold after a ride',
    meaning:
      'How long a finished ride’s earnings are held before the transfer to the instructor is created.',
    unit: 'days',
    group: 'rides',
    risk: 'low',
    warning:
      'Applies to rides finished from now on. Rides already completed keep the payout date they were stamped with.',
    missingConsequence: 'Payouts fall back to a 7-day hold.',
  },
  ride_start_window_hours: {
    label: 'How early a ride can start',
    meaning: 'How long before the test time an instructor is allowed to tap Start.',
    unit: 'hours',
    group: 'rides',
    risk: 'low',
    warning:
      'Pay is measured from Start to Stop. A large window lets a ride be started long before the test and inflates the hours you pay for.',
    missingConsequence: 'Falls back to a 6-hour window.',
  },
  ride_transfer_cutoff_hours: {
    label: 'Hand-back cutoff',
    meaning: 'How close to the start an instructor may still give a job back.',
    unit: 'hours',
    group: 'rides',
    risk: 'low',
    missingConsequence: 'Falls back to a 6-hour cutoff.',
  },

  // --- Bookings & refunds --------------------------------------------------
  booking_min_lead_days: {
    label: 'Minimum booking notice',
    meaning: 'How many days ahead of today a customer’s chosen test date must be.',
    unit: 'days',
    group: 'bookings',
    risk: 'low',
    warning:
      'Applies to the next booking attempt, on both the customer site and admin-created bookings. Raising it blocks last-minute business; lowering it leaves less time to assign an instructor.',
    missingConsequence: 'Falls back to 2 days’ notice.',
  },
  refund_full_hours: {
    label: 'Full-refund cutoff',
    meaning: 'Cancel this many hours or more before the test and the customer gets everything back.',
    unit: 'hours',
    group: 'bookings',
    risk: 'low',
    warning:
      'Applies to refund requests made from now on. Requests already submitted keep the percentage stored on them.',
    missingConsequence: 'Falls back to 48 hours.',
  },
  refund_partial_hours: {
    label: 'Partial-refund cutoff',
    meaning:
      'Cancel between this and the full-refund cutoff and the customer gets the partial rate. Inside it, nothing is refunded.',
    unit: 'hours',
    group: 'bookings',
    risk: 'low',
    warning:
      'This must stay below the full-refund cutoff. The system checks the full band first, so a higher number here makes the partial band unreachable.',
    missingConsequence: 'Falls back to 24 hours.',
  },
  refund_partial_percentage: {
    label: 'Partial refund rate',
    meaning: 'How much of the booking is returned inside the partial-refund window.',
    unit: 'percent',
    group: 'bookings',
    risk: 'low',
    maximum: 100,
    missingConsequence: 'Falls back to 50%.',
  },
  failure_coupon_percentage: {
    label: 'Failed-test apology discount',
    meaning: 'The discount on the coupon issued automatically when a test is recorded as failed.',
    unit: 'percent',
    group: 'bookings',
    risk: 'low',
    maximum: 100,
    missingConsequence: 'Falls back to 10%.',
  },
  failure_coupon_validity_months: {
    label: 'Apology coupon lifetime',
    meaning: 'How long a failed-test coupon stays usable after it is issued.',
    unit: 'months',
    group: 'bookings',
    risk: 'low',
    mustBePositive: true,
    missingConsequence: 'Falls back to 6 months.',
  },

  // --- Referrals -----------------------------------------------------------
  instructor_referral_price: {
    label: 'Instructor referral bonus',
    meaning:
      'Paid to both the instructor who referred and the one who joined — so each successful referral costs twice this.',
    unit: 'cents',
    group: 'referrals',
    risk: 'high',
    warning:
      'This is worked out when the bonus is paid, not when the code was claimed. Changing it changes what instructors who have already earned a bonus are about to receive — lowering it takes back money they believe they have earned.',
    missingConsequence: 'Referral payouts quietly fall back to $100.00 per side.',
  },
  admin_referral_price: {
    label: 'Promo code bonus',
    meaning:
      'Default bonus on promo codes your team creates, paid to the instructor who claims one. Frozen onto each code at creation.',
    unit: 'cents',
    group: 'referrals',
    risk: 'low',
    missingConsequence: 'New promo codes default to $100.00.',
  },
  referral_min_rides: {
    label: 'Rides required for a bonus',
    meaning: 'How many rides a referred instructor must complete before any bonus is paid.',
    unit: 'count',
    group: 'referrals',
    risk: 'low',
    mustBePositive: true,
    missingConsequence: 'New codes default to requiring 5 rides.',
  },
};

export interface SettingGroup {
  id: SettingGroupId;
  title: string;
  keys: string[];
}

/**
 * The full catalogue, grouped for scanning. The screen renders every key whether
 * or not the server returns it — the seeder only fills an empty table, so a key
 * added later is simply absent, and an absent key is exactly what an admin needs
 * to see (§6).
 */
export const SETTING_GROUPS: SettingGroup[] = [
  { id: 'pickup', title: 'Pickup pricing', keys: ['base_distance', 'base_rate', 'normal_rate'] },
  {
    id: 'rides',
    title: 'Instructor pay & rides',
    keys: [
      'instructor_rate',
      'average_distance_per_hour',
      'instructor_payout_delay_days',
      'ride_start_window_hours',
      'ride_transfer_cutoff_hours',
    ],
  },
  {
    id: 'bookings',
    title: 'Bookings & refunds',
    keys: [
      'booking_min_lead_days',
      'refund_full_hours',
      'refund_partial_hours',
      'refund_partial_percentage',
      'failure_coupon_percentage',
      'failure_coupon_validity_months',
    ],
  },
  {
    id: 'referrals',
    title: 'Referrals',
    keys: ['instructor_referral_price', 'admin_referral_price', 'referral_min_rides'],
  },
];

/** Every key this screen knows about, in display order. */
export const SETTING_ORDER = SETTING_GROUPS.flatMap((group) => group.keys);

export function getSettingCopy(key: string): SettingCopy | undefined {
  return SETTING_COPY[key];
}

export function getSettingUnit(key: string): SettingUnit | undefined {
  return SETTING_COPY[key]?.unit;
}

/** True for the units stored in cents, which are typed in dollars. */
export function isMoneyUnit(unit: SettingUnit | undefined): boolean {
  return unit === 'cents' || unit === 'cents-per-km' || unit === 'cents-per-hour';
}

/**
 * The server parses with `Number()` and rejects non-finite or negative values in
 * favour of a fallback, so mirror that judgement instead of rendering "$NaN".
 */
export function parseSettingValue(value: string): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

const plural = (count: number, word: string) => `${count} ${count === 1 ? word : `${word}s`}`;

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
    case 'days':
      return plural(parsed, 'day');
    case 'hours':
      return plural(parsed, 'hour');
    case 'months':
      return plural(parsed, 'month');
    case 'percent':
      return `${parsed}%`;
  }
}

/** "1 h 30 m" from a fractional number of hours. */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 m';
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes} m`;
  if (minutes === 0) return `${whole} h`;
  return `${whole} h ${minutes} m`;
}

/**
 * How the value should be typed in. Money is stored in cents but nobody thinks
 * in cents, so the editor takes dollars and converts — §5 calls typing dollars
 * into a cents field the single most likely admin mistake, and a 100x one.
 */
export interface SettingEditorSpec {
  mode: 'dollars' | 'number';
  placeholder: string;
  /** Whole numbers only (a count of rides cannot be 2.5). */
  integerOnly: boolean;
  suffix?: string;
}

export function getSettingEditorSpec(key: string): SettingEditorSpec {
  switch (getSettingUnit(key)) {
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
    case 'days':
      return { mode: 'number', placeholder: '2', integerOnly: true, suffix: 'days' };
    case 'hours':
      return { mode: 'number', placeholder: '48', integerOnly: false, suffix: 'hours' };
    case 'months':
      return { mode: 'number', placeholder: '6', integerOnly: true, suffix: 'months' };
    case 'percent':
      return { mode: 'number', placeholder: '50', integerOnly: false, suffix: '%' };
    default:
      return { mode: 'number', placeholder: '', integerOnly: false };
  }
}

/** The stored string turned into what the editor should show. */
export function toEditorValue(key: string, storedValue: string): string {
  const parsed = parseSettingValue(storedValue);
  if (parsed === null) return storedValue;
  return getSettingEditorSpec(key).mode === 'dollars' ? (parsed / 100).toFixed(2) : String(parsed);
}

export type EditorParseResult =
  | { ok: true; storedValue: string; numericValue: number }
  | { ok: false; error: string };

/**
 * What was typed turned back into the string the API stores.
 *
 * The backend takes any non-empty string and never checks that a numeric setting
 * is numeric (§5), so this is the only validation that exists.
 */
export function parseSettingInput(key: string, input: string): EditorParseResult {
  const spec = getSettingEditorSpec(key);
  const copy = getSettingCopy(key);
  const trimmed = input.trim().replace(/^\$/, '').replace(/,/g, '');

  if (trimmed === '') return { ok: false, error: 'Enter a value.' };

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return { ok: false, error: 'Enter a number, for example 1.00.' };
  if (parsed < 0) return { ok: false, error: 'This cannot be a negative number.' };

  const numericValue = spec.mode === 'dollars' ? Math.round(parsed * 100) : parsed;

  if (numericValue === 0 && copy?.mustBePositive) {
    return { ok: false, error: 'This cannot be zero — it would break bookings or the job board.' };
  }

  if (copy?.maximum !== undefined && numericValue > copy.maximum) {
    return { ok: false, error: `This cannot be more than ${copy.maximum}.` };
  }

  if (spec.integerOnly && !Number.isInteger(numericValue)) {
    return { ok: false, error: 'Enter a whole number.' };
  }

  return { ok: true, storedValue: String(numericValue), numericValue };
}

/**
 * Rules that need a sibling setting to judge.
 *
 * The refund ladder is checked full-band first, so a partial cutoff at or above
 * the full cutoff makes the partial band unreachable — every late cancellation
 * would get either everything or nothing (§3, the cancellation ladder).
 */
export function validateAgainstSiblings(
  key: string,
  nextValue: number,
  values: Record<string, number | null>,
): string | null {
  const full = key === 'refund_full_hours' ? nextValue : values.refund_full_hours;
  const partial = key === 'refund_partial_hours' ? nextValue : values.refund_partial_hours;

  if (
    (key === 'refund_full_hours' || key === 'refund_partial_hours') &&
    full !== null &&
    full !== undefined &&
    partial !== null &&
    partial !== undefined &&
    partial >= full
  ) {
    return `The partial cutoff (${partial} h) must be below the full-refund cutoff (${full} h), or nobody can ever get a partial refund.`;
  }

  return null;
}

/**
 * One line of what the current value means in practice, worked out from the live
 * numbers. `values` holds the effective value of each key in the unit it is
 * stored in; a null means the row is absent and the line is skipped.
 */
export function describeInPractice(
  key: string,
  values: Record<string, number | null>,
): string | null {
  const money = (cents: number) => formatCAD(Math.round(cents), { suffix: false });
  const baseDistance = values.base_distance;
  const baseRate = values.base_rate;
  const normalRate = values.normal_rate;
  const instructorRate = values.instructor_rate;
  const speed = values.average_distance_per_hour;
  const value = values[key];

  switch (key) {
    case 'base_distance': {
      if (baseDistance === null || baseRate === null || normalRate === null) return null;
      const sample = 70;
      if (sample <= baseDistance) {
        return `A ${sample} km pickup still sits inside the included distance, so it is all charged at ${money(baseRate)}/km — ${money(sample * baseRate)}.`;
      }
      const excess = sample - baseDistance;
      const total = baseDistance * baseRate + excess * normalRate;
      return `A ${sample} km pickup = ${baseDistance} km at ${money(baseRate)}/km plus ${excess} km at ${money(normalRate)}/km = ${money(total)}.`;
    }

    case 'base_rate':
      if (baseRate === null || baseDistance === null) return null;
      return `Every 10 km inside the first ${baseDistance} km adds ${money(baseRate * 10)} to the customer's bill.`;

    case 'normal_rate':
      if (normalRate === null || baseDistance === null) return null;
      return `Every 10 km past the first ${baseDistance} km adds ${money(normalRate * 10)} to the customer's bill.`;

    case 'instructor_rate':
      if (instructorRate === null) return null;
      return `A 90-minute job pays the instructor ${money(instructorRate * 1.5)}.`;

    case 'average_distance_per_hour': {
      if (speed === null || speed <= 0) return null;
      const sample = 75;
      const hours = sample / speed;
      const worth =
        instructorRate === null ? '' : ` — about ${money(hours * instructorRate)} to the instructor`;
      return `A ${sample} km job is shown to instructors as ${formatHours(hours)}${worth}.`;
    }

    case 'instructor_payout_delay_days':
      if (value === null) return null;
      return value === 0
        ? 'Earnings are released as soon as the ride is finished.'
        : `Earnings from a ride finished today reach the instructor ${plural(value, 'day')} later.`;

    case 'ride_start_window_hours':
      if (value === null) return null;
      return `An instructor can tap Start up to ${plural(value, 'hour')} before the test time.`;

    case 'ride_transfer_cutoff_hours':
      if (value === null) return null;
      return `A job can be handed back until ${plural(value, 'hour')} before it starts.`;

    case 'booking_min_lead_days':
      if (value === null) return null;
      return value === 0
        ? 'Customers can book a test for today.'
        : `A test date less than ${plural(value, 'day')} away is refused at booking.`;

    case 'refund_full_hours':
      if (value === null) return null;
      return `Cancel ${plural(value, 'hour')} or more before the test and the customer gets everything back.`;

    case 'refund_partial_hours': {
      if (value === null) return null;
      const full = values.refund_full_hours;
      const pct = values.refund_partial_percentage;
      const band = full === null ? 'the full-refund cutoff' : `${full} h`;
      const rate = pct === null ? 'the partial rate' : `${pct}%`;
      return `Cancel between ${value} h and ${band} before the test: ${rate} back. Inside ${plural(value, 'hour')}: nothing.`;
    }

    case 'refund_partial_percentage':
      if (value === null) return null;
      return `A late cancellation returns ${value}% — ${money((20000 * value) / 100)} on a $200.00 booking.`;

    case 'failure_coupon_percentage':
      if (value === null) return null;
      return `A failed test issues the customer a ${value}%-off coupon automatically.`;

    case 'failure_coupon_validity_months':
      if (value === null) return null;
      return `That apology coupon stops working ${plural(value, 'month')} after it is issued.`;

    case 'instructor_referral_price':
      if (value === null) return null;
      return `${money(value)} to each side — ${money(value * 2)} per successful referral.`;

    case 'admin_referral_price':
      if (value === null) return null;
      return `A claimed promo code pays ${money(value)}, once, to the instructor who claims it.`;

    case 'referral_min_rides':
      if (value === null) return null;
      return `Nothing is paid until the referred instructor completes ${plural(value, 'ride')}.`;

    default:
      return null;
  }
}
