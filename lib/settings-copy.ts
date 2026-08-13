// lib/settings-copy.ts
import { formatCAD } from '@/lib/utils';

/**
 * Business-language copy for the rows in the backend `settings` table.
 *
 * The settings screen used to render each row as `key` + raw value, which only
 * means something to someone who has read the backend. Everything here exists to
 * answer three owner-level questions per row: what does this number decide, who
 * feels it, and when does a change start to bite.
 *
 * The wording is taken from BUSINESS_LOGIC.md §3.2 (the backend's own
 * description of every key) — do not invent behaviour here. If the backend
 * changes what a key does, change the sentence too.
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

export type SettingGroupId = 'pickup-fare' | 'instructor-pay' | 'referrals';

export interface SettingCopy {
  key: string;
  group: SettingGroupId;
  /** The name a non-technical owner would use for this number. */
  label: string;
  /** One sentence: what this number actually decides. */
  meaning: string;
  /** The concrete consequences of changing it, in order of importance. */
  affects: string[];
  unit: SettingUnit;
  /** When a change starts to matter. */
  takesEffect: string;
  /** Shown as a standing warning, not only while editing. */
  caution?: string;
}

export interface SettingGroup {
  id: SettingGroupId;
  /** The question this group of numbers answers. */
  title: string;
  /** Two lines of plain-English context above the cards. */
  summary: string;
  keys: string[];
}

export const SETTING_COPY: Record<string, SettingCopy> = {
  base_distance: {
    key: 'base_distance',
    group: 'pickup-fare',
    label: 'Included pickup distance',
    meaning:
      'The first stretch of the drive from the customer’s address to the test centre is charged at your higher per-kilometre price. This is where that stretch ends.',
    affects: [
      'Every kilometre up to this point is billed at the higher rate; every kilometre after it is billed at the cheaper rate.',
      'It is also the “long trip” line: on a pickup farther than this, a customer who buys any add-on gets a free 30-minute lesson taken off their bill.',
      'Raise it and long pickups cost customers more — but the free-lesson credit starts later, too. Both move together.',
    ],
    unit: 'km',
    takesEffect: 'The very next booking anyone makes.',
  },
  base_rate: {
    key: 'base_rate',
    group: 'pickup-fare',
    label: 'Price per kilometre — inside the included distance',
    meaning:
      'What the customer pays for each kilometre of that first stretch of the pickup drive.',
    affects: [
      'This is the biggest lever you have on pickup revenue — almost every booking sits entirely inside this range.',
      'It only prices the driving. The test-centre fee and any add-ons are charged on top.',
      'The customer’s app shows a live price estimate while they book. Change this without a matching app release and the estimate they see stops matching the amount they are charged.',
    ],
    unit: 'cents-per-km',
    takesEffect: 'The very next booking anyone makes.',
  },
  normal_rate: {
    key: 'normal_rate',
    group: 'pickup-fare',
    label: 'Price per kilometre — beyond the included distance',
    meaning:
      'The cheaper rate charged for every kilometre past the included distance, on the reasoning that the instructor is already committed to the trip.',
    affects: [
      'Only long-distance pickups ever reach this rate, so it moves a small share of bookings by a large amount each.',
      'Setting it close to the higher rate removes the long-distance discount entirely.',
      'Like the other two, the customer’s booking screen has its own copy of this number — treat a change as a coordinated release.',
    ],
    unit: 'cents-per-km',
    takesEffect: 'The very next booking anyone makes.',
  },
  instructor_rate: {
    key: 'instructor_rate',
    group: 'instructor-pay',
    label: 'Instructor pay per hour',
    meaning: 'What an instructor earns for each hour of ride time.',
    affects: [
      'The rate is locked in the moment an instructor accepts a job, so a change here never re-prices work that has already been accepted.',
      'It is also the rate shown on the instructor’s own dashboard as their current pay.',
      'Payouts are measured with the clock — start tap to stop tap — not from the estimate shown before accepting.',
    ],
    unit: 'cents-per-hour',
    takesEffect: 'Jobs accepted after you save. Accepted work keeps the old rate.',
    caution:
      'Jobs your team assigns to an instructor from the admin panel do not use this rate — they currently settle at $80.00/hour no matter what this says. Only jobs an instructor picks up themselves use the number below. This is a known backend defect, not a policy.',
  },
  average_distance_per_hour: {
    key: 'average_distance_per_hour',
    group: 'instructor-pay',
    label: 'Assumed driving speed',
    meaning:
      'How fast you assume a car moves when estimating how many hours a job will take.',
    affects: [
      'Used for one thing only: turning a pickup distance into an estimated length and value, so an instructor can judge a job before accepting it.',
      'A lower speed makes every job look longer and better paid; a higher speed makes jobs look shorter and cheaper.',
      'It never changes what anyone is actually paid. Real payouts use elapsed time on the job.',
    ],
    unit: 'km-per-hour',
    takesEffect: 'Immediately, on the job list instructors browse.',
    caution:
      'If this is ever blank or zero, the instructor job list stops working entirely — it has no safe fallback.',
  },
  instructor_referral_price: {
    key: 'instructor_referral_price',
    group: 'referrals',
    label: 'Instructor-to-instructor referral bonus',
    meaning: 'The bonus paid when one instructor brings another one onto the platform.',
    affects: [
      'It is paid to both sides — the instructor who referred and the one who joined — so each successful referral costs you twice this amount.',
      'Nothing is paid until the new instructor has completed the required number of rides.',
      'The amount is read fresh at payout time, so a change also affects referrals that are already in progress but have not paid out yet.',
    ],
    unit: 'cents',
    takesEffect: 'Any referral that has not paid out yet, including in-flight ones.',
  },
  admin_referral_price: {
    key: 'admin_referral_price',
    group: 'referrals',
    label: 'Default bonus on promo codes your team creates',
    meaning:
      'The bonus amount filled in automatically when your team creates a promo code for an instructor.',
    affects: [
      'Only the instructor who claims the code is paid — there is no referrer to pay, so a claimed code costs you this amount once.',
      'The amount is frozen onto each code the moment it is created, so changing it here never changes codes already handed out.',
      'It is only a default. Whoever creates the code can type a different amount instead.',
    ],
    unit: 'cents',
    takesEffect: 'Codes created after you save. Existing codes keep their amount.',
  },
  referral_min_rides: {
    key: 'referral_min_rides',
    group: 'referrals',
    label: 'Rides required before a bonus is paid',
    meaning:
      'How many rides a newly referred instructor must complete before anyone collects the bonus.',
    affects: [
      'This is your proof the referral was real — no completed rides, no payout.',
      'It is frozen onto each code when the code is created; codes already out there keep the number they were made with.',
      'Raise it to slow payouts down and discourage gaming; lower it to reward people faster.',
    ],
    unit: 'count',
    takesEffect: 'Codes created after you save. Existing codes keep their requirement.',
  },
};

export const SETTING_GROUPS: SettingGroup[] = [
  {
    id: 'pickup-fare',
    title: 'What customers pay to be picked up',
    summary:
      'Three numbers price the driving part of every booking — from the customer’s address to the test centre. The test-centre fee and any add-ons are set elsewhere and charged on top.',
    keys: ['base_distance', 'base_rate', 'normal_rate'],
  },
  {
    id: 'instructor-pay',
    title: 'What instructors earn',
    summary:
      'What you pay per hour of ride time, and the speed assumption used to show instructors what a job is worth before they take it.',
    keys: ['instructor_rate', 'average_distance_per_hour'],
  },
  {
    id: 'referrals',
    title: 'Referral and promo-code rewards',
    summary:
      'What it costs you when an instructor brings in another instructor, or when your team hands out a promo code — and how much work has to happen first.',
    keys: ['instructor_referral_price', 'admin_referral_price', 'referral_min_rides'],
  },
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

/** A short caption under the big number, e.g. "per kilometre driven". */
export function describeSettingUnit(unit: SettingUnit | undefined): string {
  switch (unit) {
    case 'cents':
      return 'one-off amount';
    case 'cents-per-km':
      return 'for every kilometre driven';
    case 'cents-per-hour':
      return 'for every hour worked';
    case 'km':
      return 'kilometres of driving';
    case 'km-per-hour':
      return 'kilometres per hour';
    case 'count':
      return 'completed rides';
    default:
      return '';
  }
}

/**
 * How the value should be typed in.
 *
 * Money is stored in cents but nobody thinks in cents — the editor takes dollars
 * and converts, so an owner types `1.25`, not `125`.
 */
export interface SettingEditorSpec {
  mode: 'dollars' | 'number';
  label: string;
  placeholder: string;
  /** Whole numbers only (a count of rides cannot be 2.5). */
  integerOnly: boolean;
  suffix?: string;
}

export function getSettingEditorSpec(unit: SettingUnit | undefined): SettingEditorSpec {
  switch (unit) {
    case 'cents':
      return { mode: 'dollars', label: 'Amount in dollars', placeholder: '100.00', integerOnly: false };
    case 'cents-per-km':
      return { mode: 'dollars', label: 'Dollars per kilometre', placeholder: '1.00', integerOnly: false, suffix: '/km' };
    case 'cents-per-hour':
      return { mode: 'dollars', label: 'Dollars per hour', placeholder: '40.00', integerOnly: false, suffix: '/hour' };
    case 'km':
      return { mode: 'number', label: 'Distance in kilometres', placeholder: '50', integerOnly: false, suffix: 'km' };
    case 'km-per-hour':
      return { mode: 'number', label: 'Speed in kilometres per hour', placeholder: '50', integerOnly: false, suffix: 'km/h' };
    case 'count':
      return { mode: 'number', label: 'Number of rides', placeholder: '5', integerOnly: true };
    default:
      return { mode: 'number', label: 'Value', placeholder: '', integerOnly: false };
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

/** What the editor typed turned back into the string the API stores. */
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

/** "1 h 12 m" from a fractional number of hours. */
export function formatHours(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 m';
  const whole = Math.floor(hours);
  const minutes = Math.round((hours - whole) * 60);
  if (whole === 0) return `${minutes} m`;
  if (minutes === 0) return `${whole} h`;
  return `${whole} h ${minutes} m`;
}
