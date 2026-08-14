# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`elan-admin` is the admin panel for **Elan**, a road-test car rental / driving-test booking platform (Ontario, Canada). It is a **frontend-only** Next.js app — there is no backend in this repo. All data comes from an external NestJS REST API (default `https://api-dev.elanroadtestrental.ca/v1`). The admin manages bookings, ride sessions, customers, instructors, refunds, coupons, referral codes, test centers, system settings, and admin users.

## Commands

```bash
npm run dev            # Dev server with Turbopack (http://localhost:3000)
npm run build          # Production build
npm run start          # Serve production build
npm run lint           # ESLint (next lint)
npx tsc --noEmit       # Type check only — the fastest way to validate a change
```

There is **no test framework** configured. `npx tsc --noEmit` plus `npm run build` is the verification loop.

**`next build` and `next dev` fight over `.next`.** With a dev server running, a build
fails at "Collecting page data" naming a random, often untouched page — and
`rm -rf .next` under a live dev server corrupts *that* server until it is restarted.
Build into a separate directory instead:

```bash
NEXT_BUILD_DIR=.next-verify npm run build   # distDir override in next.config.ts
```

## Environment

- `NEXT_PUBLIC_API_BASE_URL` — base URL of the backend API. Falls back to the dev API in `lib/axios.ts` if unset. This is the only env var the code reads.
- Env files (`.env*`) are gitignored.

## Stack

- Next.js 15 (App Router, React 19), TypeScript strict mode
- Tailwind CSS v4 (`@tailwindcss/postcss`, config-less — theme tokens live in `app/globals.css`; brand primary is Elan green `#0C8B44`)
- shadcn/ui (new-york style, stone base color) in `components/ui/`
- react-hook-form + zod for forms, axios for HTTP, sonner for toasts, framer-motion for animation, lucide-react for icons
- Path alias: `@/*` maps to the repo root (e.g. `@/services/admin`, `@/components/ui/button`).

## Architecture

The app follows a strict **layered data flow**. Respect these boundaries when adding features:

```
Page/Component → Hook (hooks/) → Service (services/) → apiClient (lib/axios.ts) → REST API
                                       ↑ types in types/
```

### Auth (cookie-based, the most important cross-cutting concern)

- Authentication is **HTTP-only-cookie based**. The frontend never holds a real JWT — `token` fields are literal placeholder strings (`'cookie-based'`). `apiClient` is created with `withCredentials: true` so cookies ride along automatically.
- `lib/axios.ts` has a **response interceptor** that catches 401s, calls `POST /auth/admin/refresh` once, queues concurrent failed requests during the refresh, retries them, and on refresh failure clears `localStorage('user')` and hard-redirects to `/login`. It deliberately skips the refresh path for `/auth/admin/refresh` and `/auth/admin/login`. Do not add manual token handling — rely on this interceptor.
- `lib/auth-context.tsx` (`AuthProvider` + `useAuth`) holds auth state via a `useReducer`. It optimistically restores the cached user from `localStorage`, then validates against `GET /auth/admin/me`. It also runs a **proactive silent refresh** — a 12-minute interval plus a `visibilitychange` handler — because the backend access token lives ~15 min and `/auth/admin/refresh` rotates both cookies, sliding the session forward. The 401 interceptor is the reactive fallback. Wraps the whole app in `app/layout.tsx`.
- `components/auth/RouteProtection.tsx` gates rendering by `isAuthenticated` / `requiredRole`.
- The API user shape (`full_name`, `user_type`, `photo_url`, …) is mapped to the app's `User` shape (`name`, `role`, `avatar`, …) inside `services/auth.ts`. API↔app field renaming is a recurring pattern — see `mapUserTypeToRole`.

### Routing (App Router route groups)

- `app/(auth)/` — unauthenticated routes (login). Uses `app/(auth)/layout.tsx`.
- `app/(dashboard)/` — authenticated admin area. `app/(dashboard)/layout.tsx` wraps everything in `components/layouts/wrappers/DashboardLayout.tsx` (sidebar + mobile header + footer). The sidebar nav map lives in `components/layouts/wrappers/Sidebar.tsx`.
- Nearly all pages are `'use client'` components — data is fetched client-side through hooks, not Server Components / server actions.

### Services (`services/`)

Plain object modules (`adminService`, `authService`, `refundService`, `fileService`) that wrap `apiClient` calls. `services/admin.ts` is the large central service covering most admin domains.

List endpoints are **cursor-paginated** and return `{ data, meta }`. Services normalize this through the local `unwrapPaginated<T>()` helper, which tolerates older bare-array responses and always yields `{ data: T[], meta: PaginationMeta }`. Do not go back to `response.data.data || []` for list endpoints — that silently throws away `meta` (and therefore pagination). A few genuinely un-paginated endpoints (`/drive-test-centers`, `/addons`, `/admin/settings`, `/admin/bookings/instructors`) do still return bare arrays and are guarded with `Array.isArray(...)`.

### Hooks (`hooks/`)

`hooks/useAdmin.ts` (~1k lines) exposes many small data hooks (`useAllBookings`, `useCustomers`, `useCoupons`, `useRideSessions`, …). They all follow the **same shape**: local `useState` for `data` / `meta` / `isLoading` / `error`, a fetch function that accepts an optional params override, a `useEffect` with an empty dep array to fetch on mount, and a returned `{ data, meta, isLoading, error, refetch }`.

Important consequence of that pattern: **hooks do not react to `params` changes.** Pages own the current params in `useState` and drive refetching by calling `refetch(newParams)` themselves. Note the trap this creates — a bare `refetch()` (e.g. from a "Try again" button) re-runs the original *mount* params and drops any active search/filter; pass the current params explicitly.

Mutation hooks (`useUpdateTestCenter`, `useUpdateUserStatus`, `useUpdateTestResult`) return `{ mutateFn, isLoading, error }` and do not hold data.

There is **no react-query / SWR** — caching and refetching are manual. Follow the existing pattern when adding a new data source rather than introducing a fetching library.

### Cursor pagination (page-level pattern)

Every list page implements the same loop:

```tsx
const [searchParams, setSearchParams] = useState<AdminXParams>({ limit: 10, orderBy: 'created_at', orderDirection: 'desc' });
const { data, meta, isLoading, error, refetch } = useX(searchParams);

// filters change → reset the cursor
const handleSearchUpdate = (p) => { const next = { ...searchParams, ...p, cursor: undefined, direction: undefined }; setSearchParams(next); refetch(next); };
// page change → carry the cursor + direction
const goToPage = (cursor, direction) => { const next = { ...searchParams, cursor, direction }; setSearchParams(next); refetch(next); };
```

and renders `components/ui/CursorPagination` (`meta`, `count`, `onNext`, `onPrev`) below the table.

Because only one page of rows is in memory, any metric derived from the fetched array is **page-local**. Use `meta.total` when the endpoint provides it, and label array-derived numbers accordingly (existing pages use a literal `"(page)"` suffix in the metric title — follow that instead of implying a global count).

### Types (`types/`)

`types/admin.ts` (~800 lines), `types/auth.ts`, `types/refund.ts` define all API request/response shapes, including `PaginationMeta` (`limit`, `hasNextPage`, `hasPreviousPage`, optional `nextCursor`/`total`). These are the contract with the backend — when an endpoint changes, update the type here first; services and hooks import from it.

### Error handling

The backend envelope is `{ status_code, message, errors }`, where `message` may be a string *or* a class-validator array, and `errors` may be a `{ field: string[] | "msg1, msg2" }` map *or* a wrapped `{ statusCode, message, error }` object.

`getApiErrorMessages(error)` in `lib/utils.ts` is the single normalizer for all of that: it groups constraints per field, humanizes field names (`road_test_doc_url` → "Road Test Document"), collapses noisy constraint stacks, filters the envelope's reserved keys, and handles network-failure and plain-`Error` cases. `getApiErrorMessage()` is the joined single-string variant.

Pair it with `components/ui/form-error-alert.tsx` (`FormErrorAlert`) in forms and modals — one message renders as a sentence, several as a bulleted list. Hooks convert it into their typed `{ message, code }` error object (`message: getApiErrorMessages(err)[0]`). Some older hooks still read `err?.response?.data?.message` directly; prefer `getApiErrorMessages` when touching them.

### Components

- `components/ui/` — shadcn primitives plus custom ones worth knowing: `CursorPagination`, `FormErrorAlert`, `FileUploader`, `AddressAutocomplete`, `SearchableSelect`, `search-filters`, `loading-state` (`LoadingState`, `CardSkeleton`, `TableSkeleton`), `error-boundary`.
- Feature components are grouped by kind: `tables/`, `modals/`, `forms/`, `booking/`, `layouts/`, `selectors/`, `sections/`.
- Pages typically: fetch via a hook → transform API data into a table-row shape (see `transformBookingData` in the bookings page) → wrap in `ErrorBoundary`, render `DashboardHeader` + `KeyMetrics` + a `tables/*` component + `CursorPagination`, with `modals/*` for detail/create/edit flows.

### Domain guards

Business rules that gate what an admin may select live in small predicate helpers — reuse them rather than re-checking fields inline:

- `isInstructorAssignable()` (`hooks/useAdmin.ts`) — an instructor may be assigned to a booking only when `status === 'ACTIVE'`, `profile_completion_percentage === 100`, and both `stripe_payouts_enabled` and `stripe_charges_enabled` are true. `useBookingInstructors` fetches each candidate's detail to apply it.
- `isTestCenterActive()` / `resolveTestCenterStatus()` (`lib/utils/test-center-status.ts`) — resolution order is local override → server `status` → `ACTIVE`. The `localStorage` map (`tc_status`) exists because `GET /drive-test-centers` used to omit `status`; **the dev API now returns it**, so the local override is a stale-data hazard rather than a necessity and the helper is a candidate for simplification.
- Coupon activity is checked client-side in `adminService.verifyCouponForAdmin` (see below).

### Money, formatting & booking math

Prices are handled **in cents** throughout.

- `formatCAD(cents)` in `lib/utils.ts` is the display formatter — it already includes `$`, so never pair it with a `DollarSign` icon.
- `formatBookingStatus(status)` in `lib/utils.ts` maps every backend `BookingStatusEnum` value to a badge class + label, with a humanized fallback for unknown statuses. Use it instead of ad-hoc status colour maps.
- `lib/utils/booking-calculations.ts` is a **line-for-line port of the server's pricing engine** (`BookingsService.create` / `.createByAdmin`): `calculatePickupPrice`, `calculateConcession`, `calculateCouponDiscount`, and `calculateBookingPrice` (the full pipeline, in the server's order). `deriveBookingAdjustment` reconciles a stored booking whose components don't sum to `total_price`. Mirror any change from the backend — never invent pricing rules here.
- **Nothing about pricing is hardcoded.** `base_distance` / `base_rate` / `normal_rate` come from `GET /admin/settings` via `hooks/usePricingConfig.ts` (shared module-level cache; call `invalidatePricingConfig()` after editing a setting). `lib/pricing-config.ts` ports the server's `getPickupPricingSettings()` parsing and fallback rules exactly, and reports which keys fell back so the UI can flag an unverified estimate.
- The **long-trip concession** fires only when an add-on is selected AND `distance > base_distance`, and deducts the 30-minute-lesson price for the test type. It is a real deduction, not a badge.
- **Add-ons are pricing config too**, and the create-booking form reads them from the
  admin route the settings screen edits — `useSettingsAddons()` (`GET /admin/settings/addons`),
  not `useAddons()` (`GET /addons`). The customer route serialises with group `['me']`
  and drops `description`, and the 30-minute-lesson price it returns *is* the long-trip
  credit, so the preview must read the same rows an admin just edited. The form's
  "Reload rates" button refetches settings **and** add-ons together —
  refreshing only `/admin/settings` leaves the credit stale. `GET /addons` is
  deliberately not wrapped anywhere in this app.
- **`booking_min_lead_days` is enforced in the form**, not just by the server.
  `resolveBookingRules()` (`lib/pricing-config.ts`) reads it;
  `earliestSelectableTestDate` / `isTestDateTooSoon` / `describeMinimumNotice`
  (`lib/utils/booking-calculations.ts`) drive the date picker's `min`, the inline
  error and the helper copy. The server compares **strictly greater**, so
  `earliestSelectableTestDate` is one minute past the boundary — advertising the
  boundary itself as `min` would offer a value the form then rejects.
  BUSINESS_LOGIC.md §17.13 names the date-picker minimum as the exact thing a
  client hardcodes; §5.1 STEP 0 is the rule.
- **Coupons:** `discount` is CENTS for `discount_type: 'fixed'` but WHOLE PERCENT for `'percentage'` — and every `is_failure_coupon` is treated as a percentage regardless. Use `formatCouponDiscount` / `isPercentageCoupon` / `sumFixedCouponValue` from `lib/utils.ts`; never format `coupon.discount` as money directly.
- `lib/utils/refund-calculations.ts` ports the refund math. `refund_requests.amount` is **already** `floor(total × pct/100)` — never re-apply the percentage. The payload omits the booking total, so `deriveBookingTotal()` reconstructs it (exact at 100%, ±1¢ otherwise) and the UI labels overrides as estimates.
- Distance is always the server's Google driving distance (`POST /admin/bookings/calculate-distance`). There is deliberately **no local Haversine fallback** — a straight-line distance underprices a pickup by roughly half. On failure the preview is withheld and submission blocked.
- **Instructor pay is never derived client-side.** Every screen reads each ride's own
  `hourly_rate` (`InstructorDetailModal`, `RideSessionsTable`, `DashboardAnalyticsMetrics`)
  and the server-stamped `payment_scheduled_at`, because an **admin-assigned** ride settles
  at the `ride_sessions.hourly_rate` column default (8000) while a self-accepting instructor
  snapshots the `instructor_rate` setting (4000). There used to be a port of the
  `/rides/available` estimate here — it was deleted once the booking modal stopped
  forecasting instructor earnings. If instructor economics is ever surfaced again, note the
  reader is a **different contract** from pickup pricing: `parseInt` (not `Number`) and **no
  fallback** — either value ≤ 0 and the backend's `/rides/available` throws 500, so report
  unavailable rather than substituting.
- `formatCAD(cents, { suffix })` in `lib/utils.ts` is the one money formatter; local `formatPrice` helpers delegate to it.

### Known backend quirks (do not "fix" these without checking the API)

- `POST /coupons/verify` is **customer-only** and 401s for admin sessions. `adminService.verifyCouponForAdmin()` instead searches `GET /admin/coupons` and validates expiry/active-window locally; the backend re-validates `coupon_code` at booking creation.
- `/admin/settings` has no lookup-by-key endpoint, so `getSystemSettingByKey` / `updateSystemSettingByKey` **brute-force IDs 1–20 / 1–50** until the `key` matches. Ugly but intentional.
- ~~`/drive-test-centers` omits `status`~~ — **no longer true.** `DriveTestCenter.status`
  carries no serialization-group decorator in the backend domain class, so it is
  returned to every audience. Re-verify the test-center guard above; it may be
  compensating for something that is already fixed.

### Images

Remote images are restricted by `next.config.ts` `images.remotePatterns` (AWS S3 buckets `*.s3.ca-central-1.amazonaws.com` for uploaded files/docs). Add a hostname there before using `next/image` with a new remote source.

## Conventions

- Most interactive files start with `'use client'`; many also carry a leading `// path/to/file` comment.
- Comments in this codebase tend to explain *why* an unusual workaround exists (backend quirk, endpoint restriction). Preserve them when refactoring — several encode API behaviour that isn't discoverable from the code.
- No mock fixtures remain — every screen is wired to the real API. The unreferenced
  `customers-mock-data` / `instructors-mock-data` files and `SessionExpiredModal` were
  deleted; don't reintroduce fixtures to stand in for an endpoint.

## Reference

### Backend API contract (primary source of truth)

`../elan-backend/elan-backend/docs/BUSINESS_LOGIC.md`

**Read it before writing or changing any API integration code.** Maintained in the
backend repo; covers pricing formulas with worked examples, every state machine,
per-audience response shapes, the settings/configuration model, and known traps.
**Never copy it into this repo** — read it in place so there is one version.
(`.claude/settings.json` already grants read access. If a session cannot reach it,
run `/add-dir ../elan-backend/elan-backend/docs`.)

Non-negotiables from that spec, repeated here so they are always in context:
- Money is **integer cents CAD**; base URL is `<host>/v1/...` with **no** `/api` prefix.
- Auth is **httpOnly cookies**, not bearer tokens. Lists are cursor-paginated.
- `total_price` is authoritative — the component prices do **not** sum to it when a
  coupon or the >50 km add-on concession applied.
- `booking.discount_amount` is **always `null`**; the discount lives in `coupon_usages`.
- Admin-created bookings get a **30-minute** payment reconciliation window (customer
  bookings get 2 minutes); the Stripe Checkout session itself expires in 30 minutes.
- Admin-**assigned** rides currently pay **$80/h** while instructor-**accepted** rides
  pay **$40/h**, because `ride_sessions.hourly_rate` is only snapshotted on self-accept.
  Known backend bug — surface `hourly_rate` rather than assuming a rate.

### The settings screen contract

`../elan-backend/elan-backend/docs/ADMIN_SETTINGS.md` is the operational reference
for `/settings/pricing-and-payouts` — endpoints, response shape, blast radius per
key, and the validation the UI must enforce. Read it before touching that screen.
Non-negotiables from it:

- **17 setting keys** (the original 8 plus 9 business rules added 2026-08-13:
  booking lead time, the refund ladder, failure-coupon terms, payout delay, ride
  start window, transfer cutoff). All are `settings` rows; all follow the same
  fallback contract. The screen renders the whole catalogue as a checklist —
  a missing row is the thing an admin most needs to see, because the seeder only
  fills an empty table and never backfills.
- `value` is **always a string on the wire**. `@IsString()` with no implicit
  conversion, so `{ value: 100 }` is a 400. Parse for display, serialize back.
- **Add-ons are the exception**: `GET|PUT /admin/settings/addons[/:id]` take
  `price` as a real **integer** in cents. `type` is not updatable; there is no
  create or delete. `30 Minutes Lesson Of G` / `…G2` **cannot be renamed** (400) —
  the long-trip concession resolves the credit by exact name, and their price *is*
  that credit. `lib/addon-rules.ts` owns those rules.
- `Setting.id` is `@Exclude`d from every response, yet `GET`/`PUT` need it in the
  path. That is why `updateSystemSettingByKey` brute-forces ids — **do not**
  "clean it up" without a backend change (an un-excluded `id` or a
  `PUT /admin/settings/by-key/:key`). There is **no DELETE** for settings.
- The backend accepts any non-empty string, so *all* validation is ours, in
  `lib/settings-copy.ts`: `parseSettingInput` (blanks, non-numbers, negatives,
  zero where zero breaks something, percentage ceilings, integer-only units) and
  `validateAgainstSiblings` (`refund_partial_hours` must stay **below**
  `refund_full_hours`, or the partial band is unreachable).
- Blast radius drives the warnings and the confirmation dialog (high + medium
  risk keys): `instructor_referral_price` is **retroactive** (peer payouts read it
  at payout time and pay both sides — `lib/utils/referral-payout.ts` is the port);
  `instructor_rate` / `average_distance_per_hour` **500 the instructor job board**
  if zero or absent; the pickup trio drifts against the customer app's preview
  until `elan-client` consumes the public `GET /v1/pricing-config`.
- Cents fields are typed in **dollars** and show `= $40.00/hour · saved as 4000`,
  because typing 40 where 4000 belongs is a 100x error.

**The refund ladder is config-driven too.** `refund_full_hours` /
`refund_partial_hours` / `refund_partial_percentage` stopped being literals on
2026-08-13, so `calculateRefundPercentage()` in `lib/utils/refund-calculations.ts`
takes a `RefundPolicyConfig` — read it with `useRefundPolicy()` (or
`resolveRefundPolicy()` outside React). Reproducing a stored decision means
passing that request's `request_date`, not `new Date()`: the server picks the
percentage when the request is created, so "now" reports a different band as time
passes. `components/refunds/RefundPolicyNote.tsx` shows the ladder on both refund
screens and flags a request whose stored percentage no longer matches the policy.

Nothing else client-side duplicates a business rule today (`booking_min_lead_days`
and the failure-coupon terms are enforced server-side only). If that changes,
thread the setting through rather than hardcoding the literal.
### Settings are live configuration

`base_distance` / `base_rate` / `normal_rate` became **live, admin-editable** pricing
inputs on 2026-08-12 (previously hardcoded and inert). Editing those rows in the
settings screen now changes customer prices on the **next booking, with no deploy**,
and the customer frontend still hardcodes the same three numbers in its price
preview. Treat any edit as a coordinated release with `elan-client`, and show a
warning next to those three rows. A missing/invalid row silently falls back to
50 / 100 / 50 and logs a warning rather than erroring.

Those rows are edited on their own screen — `/settings/pricing-and-payouts`
(`app/(dashboard)/settings/pricing-and-payouts/page.tsx`), which replaced the raw
key/value cards that used to sit inline on `/settings` (`SystemSettingsSection`,
now deleted). It renders **every row `GET /admin/settings` returns**, ordered by
`SETTING_ORDER` with unknown keys last, so a key the backend adds later still
shows up rather than disappearing.

- `lib/settings-copy.ts` holds the plain-English label + one-line description per
  key (paraphrased from BUSINESS_LOGIC.md §3.2 — mirror the spec, don't invent),
  the unit table, `formatSettingValue`, and the cents↔dollars editor conversion
  (money is typed in dollars, stored in cents).
- `components/settings/SettingValueCard.tsx` does the PUT and calls
  `invalidatePricingConfig()`. Its `describeImpact` prop returns a **string**,
  not JSX — a callback prop returning JSX trips `react/display-name` and fails
  the build.
- The breadcrumb and page title come from `app/(dashboard)/settings/layout.tsx`,
  which switches on `pathname`; a new settings route needs an entry in both
  `getBreadcrumbItems` and `SettingsHeader` or it inherits a generic "Settings"
  header.
### Older references

`full-backend-integration.md` is a dated (2026-06-10) audit of the admin frontend against the dev-branch backend, listing per-domain data gaps, bugs, and endpoint mismatches. It is useful background for how a domain is *supposed* to map, but **partially stale** — its P0 finding (cursor pagination discarded everywhere) has since been implemented. Verify against the live API before acting on any of its items.
