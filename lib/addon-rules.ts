// lib/addon-rules.ts

/**
 * Rules the add-on catalogue has to respect (ADMIN_SETTINGS.md §1, add-ons).
 *
 * `PUT /admin/settings/addons/:id` takes `{ price?, name?, description?, duration? }`
 * — `type` is not updatable, and there is no create or delete.
 */

/**
 * The two rows the long-trip concession resolves **by exact name**.
 *
 * `BookingsService` looks the credit up by this literal name, so renaming one
 * 400s at the API and would silently zero the credit if it ever got through.
 * Their price is editable — and the price IS the credit a long-trip customer
 * receives, so changing it changes what customers get off their bill.
 */
export const CONCESSION_ADDON_NAMES = [
  '30 Minutes Lesson Of G',
  '30 Minutes Lesson Of G2',
] as const;

export function isAddonNameLocked(name: string): boolean {
  return (CONCESSION_ADDON_NAMES as readonly string[]).includes(name.trim());
}

/** `duration` is seconds on the wire, and null for mock tests. */
export function formatAddonDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return 'No fixed length';

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours} h` : `${hours} h ${remainder} min`;
}

export function secondsToMinutes(seconds: number | null | undefined): string {
  return seconds === null || seconds === undefined ? '' : String(Math.round(seconds / 60));
}

/** Add-on `type` pairs the row with a G or G2 booking; it is read-only here. */
export function formatAddonType(type: string): string {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => (part === 'g' || part === 'g2' ? part.toUpperCase() : part))
    .join(' ')
    .replace(/^\w/, (c) => c.toUpperCase());
}
