// lib/utils/instructor-pay.ts

/**
 * Reading the instructor pay breakdown the API returns.
 *
 * This is deliberately NOT a pricing engine. Since 2026-09-19 pay is computed
 * once on the server and frozen onto the ride the moment an instructor accepts
 * (BUSINESS_LOGIC.md §6), so an accepted ride keeps the rate it was accepted at
 * and any client-side recomputation drifts the first time an admin edits
 * `instructor_rate`. Every number below is read from the response.
 *
 * The shape, for reference only:
 *   base_amount           = hourly_rate x 3      the road test, on every ride
 *   transportation_amount = round(transportation_hours x hourly_rate)
 *   ride_price / instructor_earnings = the sum of those two
 *
 * `transportation_hours` is 0 for a meet-at-centre booking, which therefore pays
 * the base alone. The instructor's own commute to the pickup address is never
 * paid — it would make the same job worth a different amount to every instructor.
 */

export interface InstructorPayBreakdown {
  /** Cents. The road-test portion, frozen at accept. */
  baseAmount: number;
  /** Hours spent driving the customer: pickup → centre → drop-off. */
  transportationHours: number;
  /** Cents. */
  transportationAmount: number;
  /** Cents per TRANSPORTATION hour — not per hour of the appointment. */
  hourlyRate: number;
  /** Cents. Server-provided total, never re-derived here. */
  total: number;
  /** True when there is driving to show; a meet-at-centre ride has none. */
  hasTransportation: boolean;
}

/**
 * Both spellings the API uses: snake_case on the admin and booking routes,
 * camelCase on the instructor's own completed-rides route (§17.5 — two naming
 * conventions coexist).
 */
export interface PayBreakdownSource {
  base_amount?: number | null;
  baseAmount?: number | null;
  transportation_hours?: number | string | null;
  transportationHours?: number | string | null;
  transportation_amount?: number | null;
  transportationAmount?: number | null;
  hourly_rate?: number | null;
  hourlyRate?: number | null;
}

/** `numeric` columns arrive as strings from the API on some routes. */
const num = (value: unknown): number => {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return typeof parsed === 'number' && Number.isFinite(parsed) ? parsed : 0;
};

/**
 * A ride's breakdown, or `null` when the ride predates the new pay model.
 *
 * Rides accepted before the 2026-09-19 deploy have `base_amount` 0 and settle on
 * the old wall-clock arithmetic; nothing was backfilled. Their total is still
 * correct, so callers fall back to showing the total alone rather than a
 * breakdown that would read as $0 base.
 *
 * Accepts either the snake_case admin shape or the camelCase instructor shape.
 */
export function readPayBreakdown(
  ride: PayBreakdownSource | null | undefined,
  totalCents: number,
): InstructorPayBreakdown | null {
  if (!ride) return null;

  const baseAmount = num(ride.base_amount ?? ride.baseAmount);
  if (baseAmount <= 0) return null;

  const transportationHours = num(ride.transportation_hours ?? ride.transportationHours);
  const transportationAmount = num(ride.transportation_amount ?? ride.transportationAmount);
  const hourlyRate = num(ride.hourly_rate ?? ride.hourlyRate);

  return {
    baseAmount,
    transportationHours,
    transportationAmount,
    hourlyRate,
    total: totalCents,
    hasTransportation: transportationHours > 0 || transportationAmount > 0,
  };
}

/**
 * Driving time as a duration. 0.6 reads "36 min", not "0.6 hrs" — nobody judges
 * a job in decimal hours.
 */
export function formatDrivingTime(hours: number): string {
  if (!Number.isFinite(hours) || hours <= 0) return '0 min';
  const totalMinutes = Math.round(hours * 60);
  const whole = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (whole === 0) return `${minutes} min`;
  if (minutes === 0) return `${whole} h`;
  return `${whole} h ${minutes} min`;
}
