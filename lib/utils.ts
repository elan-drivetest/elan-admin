import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an amount stored in cents as a CAD currency string.
 * e.g. formatCAD(55381) -> "$553.81 CAD". Tolerates string/null inputs.
 * The returned string already contains "$" — do NOT pair it with a DollarSign icon.
 */
export function formatCAD(cents: number | string | null | undefined, opts?: { suffix?: boolean }): string {
  const n = typeof cents === 'string' ? parseFloat(cents) : cents ?? 0;
  const amount = typeof n === 'number' && !isNaN(n) ? n : 0;
  const base = `$${(amount / 100).toFixed(2)}`;
  return opts?.suffix === false ? base : `${base} CAD`;
}

// Add route utilities for sidebar
export function isActiveRoute(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard';
  }
  return pathname.startsWith(href);
}

export function getRouteDepth(pathname: string): number {
  return pathname.split('/').filter(Boolean).length;
}

/** Turn a snake_case / camelCase API field name into a human label, e.g. `road_test_doc_url` -> `Road Test Document`. */
function humanizeFieldName(field: string): string {
  let s = field
    .replace(/_url$/i, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2') // split camelCase
    .replace(/_/g, ' ')
    .trim();
  s = s.replace(/\bdoc\b/gi, 'document');
  s = s.replace(/\b\w/g, (c) => c.toUpperCase()); // title case
  s = s.replace(/\bId\b/g, 'ID').replace(/\bUrl\b/g, 'URL');
  return s;
}

/** Remove the leading raw field name that class-validator prepends to each constraint message. */
function stripFieldPrefix(message: string, field: string): string {
  const escaped = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return message.replace(new RegExp('^\\s*' + escaped + '\\s*', 'i'), '').trim();
}

/** Rewrite a single class-validator constraint (field prefix already removed) into friendlier wording. */
function friendlyConstraint(remainder: string): string {
  const r = remainder.toLowerCase().trim();
  if (!r) return 'is invalid';
  // Backend sometimes returns i18n keys as constraint messages (e.g. "incorrectOldPassword").
  if (r.includes('incorrect')) return 'is incorrect';
  if (r.includes('notempty')) return 'is required';
  if (r.includes('alreadyexists') || r.includes('already exists')) return 'already exists';
  if (r.includes('url')) return 'must be a valid URL';
  if (r.includes('email')) return 'must be a valid email address';
  if (/(must be a number|must be an integer|must be numeric)/.test(r)) return 'must be a number';
  if (r.includes('boolean')) return 'must be true or false';
  if (r.includes('date') || r.includes('iso')) return 'must be a valid date';
  if (r.startsWith('must be one of') || r.includes('valid enum')) return remainder.trim();
  if (r.includes('must be a string')) return 'must be text';
  return remainder.trim();
}

/** Collapse all of a field's constraint messages into one clean, human-readable line. */
function formatFieldError(field: string, rawMessages: string[]): string {
  const label = humanizeFieldName(field) || field;
  const msgs = rawMessages.filter(Boolean).map((m) => String(m));
  if (!msgs.length) return `${label} is invalid.`;

  const lower = msgs.map((m) => m.toLowerCase());
  // When the value is missing, the other constraint failures (must be a string/URL/etc.) are just noise.
  if (lower.some((m) => /should not be empty|must not be empty|is required/.test(m))) {
    return `${label} is required.`;
  }

  // Otherwise surface the most specific format rule, ignoring the generic "must be a string".
  const remainders = msgs.map((m) => stripFieldPrefix(m, field));
  const specific = remainders.find((r) => !/must be a string/i.test(r)) || remainders[0] || '';
  return `${label} ${friendlyConstraint(specific)}.`;
}

/** Group a flat NestJS `message: string[]` into `{ field: messages[] }`, keeping non-field sentences aside. */
function groupFlatMessages(messages: string[]): { grouped: Record<string, string[]>; standalone: string[] } {
  const grouped: Record<string, string[]> = {};
  const standalone: string[] = [];
  for (const m of messages) {
    const match = /^([a-zA-Z0-9_.]+)\s+(must |should |has to |is not |may not )/.exec(m);
    if (match) {
      const field = match[1];
      if (!grouped[field]) grouped[field] = [];
      grouped[field].push(m);
    } else {
      standalone.push(m);
    }
  }
  return { grouped, standalone };
}

/** Capitalize the first letter — the backend's exception filter lowercases all messages. */
function capitalizeFirst(s: string): string {
  const t = s.trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
}

// Keys the NestJS exception response uses for its envelope — NOT real DTO field names.
// When `errors` is the wrapped `{ statusCode, message, error }` object (a plain
// BadRequestException), these must be ignored so we don't render "Statuscode is invalid".
const RESERVED_ERROR_KEYS = new Set(['statuscode', 'status', 'status_code', 'error', 'message']);

/**
 * Normalizes any thrown error (axios/NestJS API errors, network failures, plain
 * Errors) into a clean list of human-readable messages, one per field/problem.
 *
 * Backend shapes (confirmed against the NestJS AllExceptionsFilter):
 *  - `{ message: "sorry...", errors: { road_test_doc_url: ["..."] } }`  -> grouped & humanized per field
 *  - `{ message: "customer already has a booking", errors: {statusCode,message,error} }` -> capitalized message
 *  - `{ errors: { field: "msg1, msg2" } }`                              -> comma-joined constraints, humanized
 *  - no response at all (network/timeout/CORS)                          -> friendly connection message
 */
export function getApiErrorMessages(error: unknown): string[] {
  const err = error as {
    response?: { data?: { message?: unknown; error?: unknown; errors?: unknown }; status?: number };
    request?: unknown;
    message?: string;
    code?: string;
  };

  // Request was made but no response received (network down, timeout, CORS, server unreachable)
  if (err?.request && !err?.response) {
    return ['Unable to reach the server. Please check your connection and try again.'];
  }

  const data = err?.response?.data;
  if (data) {
    // Standard NestJS validation array: ["field constraint", ...] — group by field, then humanize.
    if (Array.isArray(data.message)) {
      const all = data.message.filter(Boolean).map((m) => String(m));
      const { grouped, standalone } = groupFlatMessages(all);
      const lines = [
        ...Object.entries(grouped).map(([field, msgs]) => formatFieldError(field, msgs)),
        ...standalone,
      ];
      if (lines.length) return lines;
    }
    // Field-level errors: { errors: { field: string[] | "msg1, msg2" } }.
    // Checked BEFORE the generic `message` string, because endpoints returning these
    // also send a useless top-level message like "sorry something went wrong".
    // Reserved keys are skipped so a plain BadRequestException's wrapped response isn't mangled.
    if (data.errors && typeof data.errors === 'object' && !Array.isArray(data.errors)) {
      const lines = Object.entries(data.errors as Record<string, unknown>)
        .filter(([key, value]) => !RESERVED_ERROR_KEYS.has(key.toLowerCase()) && (Array.isArray(value) || typeof value === 'string'))
        .map(([field, value]) => {
          const raw = Array.isArray(value)
            ? value.filter(Boolean).map((m) => String(m))
            : String(value).split(',').map((s) => s.trim()).filter(Boolean); // comma-joined constraints
          return formatFieldError(field, raw);
        });
      if (lines.length) return lines;
    }
    // Generic single message (the filter lowercases these, so re-capitalize).
    if (typeof data.message === 'string' && data.message.trim()) {
      return [capitalizeFirst(data.message)];
    }
    if (typeof data.errors === 'string' && data.errors.trim()) {
      return [capitalizeFirst(data.errors)];
    }
    if (typeof data.error === 'string' && data.error.trim()) {
      return [capitalizeFirst(data.error)];
    }
  }

  if (typeof err?.message === 'string' && err.message.trim()) {
    return [err.message];
  }

  return ['Something went wrong. Please try again.'];
}

/** Single-string variant of {@link getApiErrorMessages}. */
export function getApiErrorMessage(error: unknown): string {
  return getApiErrorMessages(error).join('\n');
}

/**
 * Maps a backend booking status to a consistent badge style + label.
 * Covers every status the API actually emits (pending, succeeded, expired, ...),
 * falling back to a humanized version of any unknown status instead of raw text.
 */
export function formatBookingStatus(status: string): { className: string; label: string } {
  // Keys match the backend BookingStatusEnum exactly.
  const map: Record<string, { className: string; label: string }> = {
    draft: { className: 'bg-gray-100 text-gray-700', label: 'Draft' },
    pending: { className: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    confirmed: { className: 'bg-green-100 text-green-800', label: 'Confirmed' },
    in_progress: { className: 'bg-purple-100 text-purple-800', label: 'In Progress' },
    succeeded: { className: 'bg-green-100 text-green-800', label: 'Succeeded' },
    partially_refunded: { className: 'bg-orange-100 text-orange-800', label: 'Partially Refunded' },
    refunded: { className: 'bg-orange-100 text-orange-800', label: 'Refunded' },
    failed: { className: 'bg-red-100 text-red-800', label: 'Failed' },
    cancelled: { className: 'bg-red-100 text-red-800', label: 'Cancelled' },
    expired: { className: 'bg-amber-100 text-amber-800', label: 'Expired' },
  };
  const key = (status || '').toLowerCase();
  if (map[key]) return map[key];
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    : 'Unknown';
  return { className: 'bg-gray-100 text-gray-800', label };
}