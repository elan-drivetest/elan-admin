# Full Backend Integration Audit — elan-admin ↔ elan-backend (dev)

> Audit date: 2026-06-10
> Method: read the full **dev-branch** backend (`elan-backend/elan-backend-dev`) controllers, DTOs, domain serializers, repositories and services, then diffed each admin endpoint against the `elan-admin` frontend service → type → hook → component chain.
> Scope: every admin-facing route and the data it renders. This document is an **audit only** — nothing here is fixed yet.

## How to read this

- **Data gap** = backend returns a field the UI never shows, or the type claims a field the backend never sends.
- **Bug** = real correctness defect (wrong mapping, wrong math, enum mismatch, crash, stale state).
- **Error handling** = weak/raw error surfacing vs. the project's `getApiErrorMessages` + `FormErrorAlert` pattern.
- **Wrong/missing API usage** = wrong endpoint, unused filters/fields the backend supports, payloads the backend rejects/ignores, missing endpoints.

> ⚠️ **Code-vs-live discrepancies.** A few dev-branch serializer findings conflict with responses observed against the deployed `api-dev` earlier. These are marked **[VERIFY]** — confirm against the actual deployed API before acting, because the deployed build may differ from the dev branch on disk.

---

## 0. Cross-cutting issues (apply to almost every domain)

These are systemic and worth fixing once, centrally.

### 0.1 Cursor pagination is thrown away everywhere — **P0**
Every list service does `return response.data.data || []` and **discards `meta`** (`nextCursor`, `hasNextPage`, `total`, …). The backend is cursor-paginated across bookings, customers, instructors, all-users, rides, coupons, coupon-usage, referral codes, refunds. Consequences:
- Lists are silently capped at the hardcoded `limit` (10–50). Rows beyond that are **invisible** — there is no "load more"/next-page UI anywhere.
- KeyMetrics / dashboard counts computed from the fetched array (e.g. bookings "Total Revenue", coupons "Unique Customers", refunds pending count) are **page-local, not global** — wrong at scale.
- `meta.total` is available on most queries and ignored.

Affected: `services/admin.ts` (all `getX` list methods), `services/refund.ts`, every list page.

### 0.2 Error envelope only half-handled — **P1**
Backend envelope is `{ status_code, message, errors }` (and `message` can be an array for validation). The **forms** were standardized on `getApiErrorMessages` + `FormErrorAlert` (good), but **data hooks and several modals still read raw `err?.response?.data?.message`**, so field-level (`errors`) messages and validation arrays are lost and fall back to generic strings.
- Raw handling: most hooks in `hooks/useAdmin.ts` (`useRecentBookings`, `useAllBookings`, `useUpdateTestResult`, `useDashboardAnalytics`, `useTestCenters`, `useUpdateTestCenter`, `useAddons`, customer/instructor list hooks, ride hooks), `hooks/useRefunds.ts`, `hooks/useBookingCalculation.ts`, `RideSessionDetailModal` regenerate, `ReferralCode [id]/page.tsx`, `RefundRequestDetailModal` save path.

### 0.3 Serialization `@Expose({ groups })` drops fields the FE type assumes — **P1**
Several backend domains only expose certain fields under the `admin` group (and some list mappers don't populate join fields). The FE types declare them as always-present, so they silently come back `undefined`. Specific cases listed per domain. **Some of these conflict with live data — see [VERIFY] tags.**

### 0.4 List hooks ignore `params` changes; `refetch()` (no-arg) discards active filters — **P2**
All list hooks use `useEffect(..., [])` (fetch once on mount) and rely on pages calling `refetch(newParams)`. The "Try again" error buttons call `refetch()` with **no args**, which re-runs the original mount params and **drops any active search/filter**.

### 0.5 Dead / wrong-for-admin service methods — **P2**
- `verifyCoupon` / `verifyCouponCode` (`services/admin.ts`) POST to `/coupons/verify`, which is **customer-only** and 401s for admins. Admin correctly uses `verifyCouponForAdmin`. These two are dead and dangerous if reused.
- `searchAddress` (singular) returns raw `response.data` (won't unwrap `{addresses}`) — dead duplicate of `searchAddresses`.
- Leftover `console.log`s in production paths (`getSystemSettings`, `updateSystemSettingByKey`, `getSystemSettingByKey`).

---

## 1. Bookings

### 1.1 Data gaps
| Endpoint | Returned but NOT shown / type mismatch |
|---|---|
| `GET /admin/bookings/all` & `/recent` | `total_ride_hour`, `ride_price` are exposed to admin but **not typed in `AdminBooking` and never displayed** — these are the *real* instructor economics. |
| `PATCH /admin/bookings/assign-instructor` | Returns the updated `Booking`; FE types it `Promise<void>` and **ignores the body** (then refetches the whole list). |
| `PATCH /admin/bookings/:id/test-result` | Returns the updated `Booking`; FE ignores the body (only uses the local pending string). |
| `POST /admin/bookings` | Returns the created `Booking`; FE only reads `booking.id` for the toast. |
| `POST /admin/bookings/calculate-distance` | Backend returns **`{ distance }` only**; `DistanceCalculationResponse` declares a `duration` that is never returned (dead type field). |

**[VERIFY] — serialization claims that conflict with live data.** The dev-branch booking domain analysis reported that `road_test_doc_url`, `g1_license_doc_url`, `timezone`, `is_rescheduled`, `email` are **not** in the `admin` serialization group, which would make document buttons and the timezone/rescheduled badges silently break. **However, the deployed `api-dev` `/admin/bookings/all` response observed earlier DID include `road_test_doc_url`, `g1_license_doc_url`, `timezone`, and `is_rescheduled`.** So either the dev branch changed the groups or the analysis misread them. **Action: confirm against the deployed response before "fixing" — likely a non-issue in production, but worth a 1-line check.**

### 1.2 Bugs
1. **Fabricated instructor fee — P0.** `EnhancedBookingsTable.tsx:~104` computes "Instructor Fee" as `Math.round(totalPrice * 0.25)` (comment: "adjust as needed"). The backend exposes real `ride_price`/`total_ride_hour`. The whole column is fictional.
2. **Status filter offers non-existent enum values — P1.** Bookings page status `<select>` includes `active` and `completed`, which are **not** in `BookingStatusEnum` (`draft, pending, confirmed, in_progress, cancelled, succeeded, refunded, partially_refunded, failed, expired`). Selecting them returns zero rows. Real statuses `draft`, `partially_refunded`, `failed` are missing from the dropdown. `formatBookingStatus` (lib/utils.ts) also has styles for non-existent `paid`/`active`/`completed` and lacks `draft`/`partially_refunded` (falls back gracefully, but inconsistent).
3. **Metrics are page-local — P1.** Bookings page metrics (Total bookings / Total Revenue / Pending) are computed over the current ≤50-row page; `meta.total` is discarded (see 0.1).
4. **`recent` vs `all` are identical server-side — P2.** Both hit `getBookingsForAdmin`; `recent`'s only difference is forcing `orderDirection=desc`, which is also the FE default. The page only uses `/all`. No real "recent" semantics.
5. **`is_available` badge is meaningless — P2.** `AssignInstructorModal` renders Available/Busy from `instructor.is_available !== false`, but nothing ever sets `is_available` → always "Available".
6. **Confirmation pricing diverges from backend addon logic — P2.** Backend `createByAdmin` reduces addon price by a free-lesson amount when `distance > 50` (`reducedAddonPrice`); the FE confirmation total just sums `selectedAddon.price`. Display-only (backend recomputes), but the shown total can mislead.
7. **`BookingsTable` `showTransferredOnly` is a dead filter — P2.** It checks `pickupLocation.includes('transferred')`, which never matches the transformed string. The real filter is the backend `transferred_ride` param.
8. **Distance fallback silently diverges — P2.** `useBookingCalculation` catches a failed `/calculate-distance` and substitutes a local haversine estimate; pickup price preview can be based on straight-line distance while the backend uses Google road distance.

### 1.3 Error handling
- Good: `AssignInstructorModal`, `CreateBookingForm` use `getApiErrorMessages` + `FormErrorAlert`.
- Raw `err?.response?.data?.message`: `useRecentBookings`, `useAllBookings`, `useUpdateTestResult`, `useDistanceCalculation`.
- Silent failures: `useBookingInstructors` swallows per-instructor enrichment errors → instructor silently dropped from the assign list; distance fallback hides the API error.

### 1.4 Wrong/missing API usage
1. Pagination dropped (0.1) — bookings beyond 50 invisible.
2. `is_instructor_attached=false` can't express "unassigned only" (backend only applies the condition when truthy).
3. `/calculate-distance` `duration` requested in the type but never returned.
4. `assign-instructor` / `test-result` response bodies unused → extra refetch round-trip; `assignInstructor` typed `Promise<void>`.
5. **N+1 instructor enrichment + guard disabled — P1.** `useBookingInstructors` calls `getInstructorById` per dropdown instructor. The dropdown endpoint exists to avoid this. Note: `isInstructorAssignable` currently returns `!!d` (all real checks commented out — *intentionally disabled for dev*), so the N+1 yields no filtering benefit today. **Re-enable the status/profile/Stripe guards before production.**
6. **Create-booking payload issues — P1.** Backend requires `road_test_doc_url` & `g1_license_doc_url` (`@IsNotEmpty @IsUrl`), but the FE zod schema marks them `.optional()` → sends `undefined` → backend 400. Also `meet_at_center=false` requires `pickup_address/lat/lng` server-side with no FE conditional validation → 400s only surface after submit. FE also sends `pickup_distance`, which the backend Omits (dead).

---

## 2. Users / Customers / Instructors

### 2.1 Data gaps
| Endpoint | Returned but NOT shown |
|---|---|
| `GET /admin/users/all` | `provider`, `updated_at`, `email_verified_at`, `deleted_at` fetched but not shown. |
| `GET /admin/users/instructors/{id}` | **Recent rides truncated**: header shows `recent_rides.length` (up to 10) but body renders `.slice(0,5)`. |
| `GET /admin/users/instructors/{id}/rides` | **Entire endpoint + its 9 filters unused.** No component imports `useInstructorRides`; the modal shows `recent_rides` from the detail endpoint instead. Dead: `getInstructorRides`, `useInstructorRides`, `InstructorRide`, `AdminInstructorRidesParams`. |
| Customers/instructors lists | All list fields are rendered (good), but `meta` pagination dropped. |

### 2.2 Bugs
1. **`/admin/users/all` returns only admins — P0.** `findAllUsersForAdmin` hard-filters `user_type = ADMIN`. The `settings/admin-users` page offers a **Customer/Instructor type filter** and 3-way badges; selecting Customer/Instructor always yields zero rows. Either add a `userType` query param to the backend, or remove the misleading filter. The `userTypeFilter` is also **client-side only** (never sent to the API).
2. **Customer "Test Status" hides failures — P1.** `getTestStatusDisplay` checks `passed>0` first and returns "Passed (n)" without ever surfacing `failed_count`. A customer with 2 passed + 3 failed shows only "Passed (2)". `failed_count` is unreachable whenever `passed>0`.
3. **Instructor recent-rides count/rows mismatch — P2.** Header `(10)` vs `.slice(0,5)` rendered.
4. **Client-side re-filtering fights server search — P2.** admin-users page applies an in-memory `searchTerm`/`status` filter on top of server params; the displayed count `({filteredUsers.length})` diverges from what was fetched.
5. **`refetch()` (no-arg) discards active filters — P2.** The "Try again" button re-runs mount params (see 0.4).
6. **Type drift — P3.** `total_ride_count`/`passed_count`/`failed_count` and instructor numeric stats typed `string | number`, but backend now returns real numbers; defensive `parseInt`/`parseFloat` everywhere is harmless but unreconciled. `CustomerBooking` declares nullable backend fields (`instructor_name`, `pickup_address`, `test_result`, doc URLs) as non-null `string`.

### 2.3 Error handling
- User endpoints throw `{ status, errors: { user: '...' } }` with **no top-level `message`** for 404/422 (e.g. "User is not a customer", "Customer not found", "You cannot deactivate your own account"). The hooks read only `.message`, so these reasons fall through to generic fallbacks. `errors` is never read in this domain.
- `InstructorDetailModal` error state shows a generic message and ignores `error.message`, unlike `CustomerDetailModal`.

### 2.4 Wrong/missing API usage
- Pagination unused (0.1) — instructors/customers/all-users silently truncated at 50.
- **Instructor search drops `vehicleModel`, `phoneNumber`, `address`** — table sends only `instructorName`, `email`, `vehicleBrand`. The "Search by vehicle…" box maps to `vehicleBrand` only, so searching a model won't match.
- Customer search maps the name box to generic `search` (OK), but never uses the dedicated `fullName`/`contact` filters.
- admin-users page sends `status` to the API **and** filters by status client-side (redundant); never sends `userType`.
- `PATCH /admin/users/{id}/status` payload `{ status }` is correct.

---

## 3. Rides / Ride Sessions

### 3.1 Data gaps
| Endpoint | Returned but NOT shown / mismatch |
|---|---|
| `GET /admin/rides/sessions` | `meta` dropped (no pagination). List rows carry **no `status`**, so completed/cancelled/transferred sessions look identical in the table. |
| `GET /admin/rides/sessions/{id}` | `routePoints[]` only used for a count badge — `latitude/longitude/timestamp/speed` never rendered (no map of the GPS trail; only the static route image). |
| `POST .../regenerate-route-image` | Backend returns `{ success, routeImageUrl: string\|null, message }`; FE type omits `success` and types `routeImageUrl` non-null. |

### 3.2 Bugs
1. **Status badge `'active'` never matches — P1.** Real enum: `scheduled | in_progress | completed | cancelled | transferred`. Modal checks `status === 'active'`; `in_progress`/`scheduled`/`transferred` all fall to gray default.
2. **`orderBy: 'created_at'` likely invalid — P2.** Sessions page sends `orderBy: 'created_at'`, but the cursor query orders on `start_time`. May error or be ignored.
3. **Success toast fires even when no image produced — P2.** Regenerate shows "Route map generated successfully" without checking `success`/non-null `routeImageUrl`.
4. **No pagination — P1.** Capped at `limit: 50`; title `({rideSessions.length})` shows page size, not `meta.total`.
5. **`AdminRideSessionDetail extends AdminRideSession` is a lie — P2.** Detail lacks `username`/`dateTime`/`dropoffLocation`/`instructorEarnings`; those inherited fields are `undefined` at runtime.
6. **`startDate`/`endDate` sent as naive `datetime-local` strings — P3.** No seconds/TZ; backend expects `Date`.

### 3.3 Error handling
- Hooks consistent with project pattern. Regenerate error toasts raw `err?.response?.data?.message` (not `getApiErrorMessages`).
- No abort/retry on `useRideSessionDetail`.

### 3.4 Wrong/missing API usage
- Pagination + cursor unused (0.1).
- **`search` filter unused** — backend supports rich free-text search (center/customer/instructor); UI has no search box, only field-specific filters.
- No status filter/column (backend has no `status` query param either — backend gap).
- Backend admin rides endpoints don't join ride-transfer data, so `transferred` sessions show no transfer origin (backend gap).

---

## 4. Coupons & Referral Codes

### 4.1 Data gaps
| Endpoint | Returned but NOT shown |
|---|---|
| `GET /admin/coupons` | `created_at`/`updated_at` (detail only); `meta` dropped. |
| `GET /admin/coupons/usage` | `coupon_id`, `pickup_address`, `booking_created_at`. |
| `PUT /admin/coupons/:id` | Returns **bare `Coupon`** (no `usage_count`/`is_active`/`is_expired`), but FE types it as `AdminCoupon` — wrong type (harmless since response unused). |
| `POST /coupons/verify` | **Confirmed customer-only** (JwtAuthGuard + CustomerGuard). Admin's `verifyCouponForAdmin` workaround is correct. The public verify response only exposes `name/description/code/discount`, not the full `CouponVerificationResponse` the FE type claims. |
| `GET /admin/referral-codes` & `/:id` | **`referrer` & `referee` user objects** (`{id, full_name, email, phone_number, address}`) are joined by the backend on every row but **omitted from the FE type and UI** — the UI shows only raw numeric `#instructor_id`. Also unused: `referral_type`, `created_by_admin_id`, `used_by_instructor_id`, `referrer_paid`/`referee_paid` + payment dates, `updated_at`. |

### 4.2 Bugs
1. **`EditCouponForm` crashes on null expiry — P1.** `new Date(coupon.expires_at).toISOString().slice(0,16)`; backend allows `expires_at: null`. `new Date(undefined).toISOString()` **throws** → breaks the edit form. `formatDate(null)` also renders "Invalid Date" in tables/detail.
2. **`CreateReferralCodeModal` generates an over-length code — P1.** `generateRandomCode` produces `ADMIN` + 6 = **11 chars**, but backend `@Length(6,10)` → **400**. `Input maxLength={20}` also exceeds the limit.
3. **`CouponUsageTable` search returns nothing — P1.** `handleSearch` sets both `customer_name` and `customer_email` to the same term; backend **ANDs** them, so a search matches only if name AND email both contain the term.
4. **Referral `#instructor_id` shown for admin codes — P2.** Admin-created codes have `instructor_id: null` → renders `#null`/`#`. The distinguishing `referral_type` isn't in the FE type, so admin vs instructor codes are indistinguishable.
5. **`updateCoupon` return type wrong — P2.** Typed `AdminCouponDetailResponse`; backend returns bare coupon without computed fields.
6. **Create-coupon forces optional fields required — P2.** ✅ **FIXED** — expiry is now optional in create + edit forms (blank = never expires); `CreateCouponRequest.expires_at` made optional.
7. **"Expired" option in main `CouponsTable` dropdown is a no-op — P2.** Status dropdown only maps active/inactive → `is_active`; "expired" sends nothing. Expired coupons only reachable via the separate `/expired` route.

### 4.3 Error handling
- Good: `CreateCouponForm`, `EditCouponForm`, `CreateReferralCodeModal` use `getApiErrorMessages` + `FormErrorAlert`.
- Inconsistent: `ReferralCodeDetailModal` uses `getApiErrorMessage`, but `referral-codes/[id]/page.tsx` uses raw `error?.response?.data?.message`. Two near-duplicate detail UIs with divergent handling.

### 4.4 Wrong/missing API usage
- Pagination dropped (0.1) — coupons/usage/referrals >50 truncated; KeyMetrics computed off 50 rows.
- **Unused filters** the backend supports: coupons (`name`, `is_recurrent`, `is_failure_coupon`, `is_expired`, date ranges); coupon-usage (`coupon_name`, `instructor_name`, `test_center_name`, date ranges).
- `referrer`/`referee` join data is fetched (2 LEFT JOINs) but wasted.
- Dead/wrong-for-admin: `verifyCoupon`/`verifyCouponCode`.

---

## 5. Refunds

### 5.1 Data gaps
| Endpoint | Returned but NOT shown |
|---|---|
| `GET /admin/refund-requests` (list) | `customer_id`, `processed_at`, `stripe_refund_id`, `metadata`, `admin_notes`, `created_at`, `updated_at` not shown in the table. **`customer_name` is selected by the query but dropped by the list mapper (`toDomain` instead of `toDomainWithCustomer`) — never sent**, so the table can search by name but can't display it. |
| `GET /admin/refund-requests/{id}` (detail) | All fields surfaced. **`payment_transaction_id` is `@Exclude`d server-side (never sent) but the modal renders a block for it — dead branch.** |
| meta | Backend key is **`prevCursor`**, FE reads **`previousCursor`** — cursor paging silently broken. |

### 5.2 Bugs
1. **Refund-amount semantics are broken — P0.** `amount` is already the refund amount (computed at creation as `floor(total_price * originalPct/100)`). The detail modal and `ProcessRefundForm` compute "new refund amount" as `amount * newPct/100` — **double-applying the percentage**. Worse, `updateByAdmin` **only stores the new percentage; it never recomputes/persists `amount`**, and the eventual Stripe `processRefund` uses the stored `amount` — so **the admin's percentage edit has no effect on the money actually refunded**. At 100% the numbers coincide, masking the bug.
2. **Detail modal lets admins set workflow-internal statuses — P1.** `STATUS_OPTIONS` allows `processing`/`completed`/`failed`. `processing` is meant to be set by the backend only after a real Stripe refund. Setting it via PATCH writes the status with no Stripe refund / no `stripe_refund_id`/`processed_at`. `ProcessRefundForm` correctly restricts to `approved|rejected`; the detail modal is inconsistent.
3. **`usePendingRefundsCount` is wrong — P1.** Fetches `limit: 1` and reports `response.data.length` (max 1) as the count; `meta.total` isn't populated for this query. Count is effectively "0 or 1".
4. **`id ?? booking_id` fallbacks target the wrong resource — P2.** If `id` were ever absent, the code calls `GET/PATCH /admin/refund-requests/{booking_id}` — wrong id space. (Normally dead since list returns `id`.)
5. **No guard against editing a non-pending refund — P2.** Backend rejects update unless status is `PENDING` ("already processed"), but the modal still allows Edit → guaranteed 400.
6. **`ProcessRefundModal`/`ProcessRefundForm` appear orphaned — P3.** The refunds page only wires `RefundRequestDetailModal`; the cleaner approve/reject form seems unused while the buggier detail editor is the live path. (Confirm before removing.)

### 5.3 Error handling
- `ProcessRefundForm` uses `getApiErrorMessages` + `FormErrorAlert` (good). The **detail modal save path does not** — relies only on the hook toast, no inline errors.
- Hooks toast `err.response?.data?.message`; validation arrays render poorly.
- "Already processed" 400 only surfaces as a toast.

### 5.4 Wrong/missing API usage
- **`customerName` filter is silently ignored by the backend** — `getRefundRequestsForAdmin` never uses the DTO's `customerName`; only `search` covers names. The table sends `customerName` → no effect. Should send `search`.
- Pagination non-functional (key mismatch + dropped meta); list is first-page-only (`limit: 10`).
- **No admin route actually executes the Stripe refund.** `processRefund`/`getApprovedRefunds` are service methods with no admin controller route in this module — approving sets `status: approved` but money is sent elsewhere (cron/job). The admin UI gives no indication that "approved ≠ refunded" (key off `stripe_refund_id`/`processed_at`).

---

## 6. Settings / Dashboard / Auth / Addons / Address-search

### 6.1 Data gaps
| Endpoint | Returned but NOT shown |
|---|---|
| `GET /admin/dashboard/analytics` | All scalars + 3 instructor highlights shown. `InstructorMetric.value` unused (description already embeds the value — intentional). |
| `GET /admin/settings` | `created_at` not shown (minor). **`Setting.id` is `@Exclude`d — never returned** (drives a major bug, see 6.2.2). |
| `GET /drive-test-centers` | `status`, `created_at`, `updated_at` are `@Expose({groups:['admin']})` → **not on the public GET**; only the admin PUT returns them. FE handles `status` via optimistic local state. |
| `GET /auth/admin/me` | **`full_name`, `user_type`, `created_at`, `updated_at` are NOT exposed under the `me` group** (only `email/phone_number/address/photo_url`). |
| `GET /addons` | `description`, `created_at`, `updated_at` are `admin`-group only → **stripped on the `me`-group `/addons`**, but the UI renders `addon.description`. |
| `POST /address-search` | `country` unused. |

### 6.2 Bugs
1. **Admin profile is broken — P0.** `GET /auth/admin/me` doesn't expose `full_name`/`user_type`/`created_at`/`updated_at`. `services/auth.ts` maps them anyway:
   - `user.name = full_name` → `undefined` → profile header/avatar/sidebar name **blank**.
   - `role = mapUserTypeToRole(undefined)` → falls to `default 'admin'` (correct only by accident).
   - `createdAt`/`lastLoginAt` → `Invalid Date` → "Member Since"/"Last Login"/"Last updated" show **"Invalid Date"**.
   This is the single biggest defect found. (`PATCH /auth/admin/me` uses the same group, so post-update caching has the same gaps.)
2. **`Setting.id` never returned → brute-force ID scan — P0/P1.** Because `id` is excluded, `updateSystemSettingByKey` does sequential `GET /admin/settings/:id` for ids **1–50** to find the matching `key` (and `getSystemSettingByKey` loops 1–20). N sequential round-trips per save; breaks if a real id exceeds the ceiling. Needs backend to expose `id` or an update-by-key route.
3. **`SystemSettingsSection.formatValue` → `$NaN` — P2.** Assumes `value` is numeric for keys containing `rate`/`price` (`parseInt(value)/100`); `value` is a free string. Non-numeric value → "$NaN CAD". The edit input is `type="text"` with no numeric validation.
4. **`Addon.description` always empty in admin flow — P2.** `/addons` serializes under `me` group (strips `description`), but `AddOnSelectionAdmin` renders it. The component also leans on brittle `name.includes('mock'|'1 hour'|'lesson')` matching instead of `type`/`duration`.
5. **`Addon.type` enum likely too narrow — P2.** FE types `'LESSON_G' | 'LESSON_G2'` and filters on those; backend `BookingAddonTypeEnum` may include more (e.g. mock-test types) → addons with other types silently dropped by the filter.
6. **[VERIFY] Test-center partial PUT — P2 (conflict).** The **dev-branch** repo `update` merges `{ ...existingEntity, ...payload }`, so a `{status}`-only body *should* persist — contradicting the **observed deployed behavior** (you saw partial PUT return 200 but not persist; full payload required). The current FE sends the full payload (safe). **Action: keep the full-payload toggle until verified against deployed; the comment's rationale may not match the deployed build.**
7. **`createAdmin` payload — P3 [VERIFY].** `AdminCreateDto extends AuthRegisterLoginDto` (minus password). FE sends `{ full_name, email, phone_number }`. If `AuthRegisterLoginDto` requires more fields, create-admin could 422 — verify required fields.

### 6.3 Error handling
- Good: `ChangePasswordModal`, `CreateAdminForm`, test-centers page use `getApiErrorMessages` + `FormErrorAlert`.
- `SystemSettingsSection` uses `getApiErrorMessage` (singular) — inconsistent.
- `ProfileEditForm` surfaces only `error.message` from auth-context.
- Dashboard/test-center/addons/settings hooks read raw `.message` (0.2).
- **Backend `address-search.service.ts` has a positional-arg bug** — `handleTextAddressSearch(trimmedInput, limit)` passes `limit` into the **`sessionToken`** param, so the real limit defaults to 5 and a number is sent as a session token. Combined with a possibly-missing `gMapsKey` in dev and a hard-coded `country:ca`, this is why address search returns `{ addresses: [] }` in dev.

### 6.4 Wrong/missing API usage
- Settings: brute-force ID scan (6.2.2); `createSystemSetting` posts the full `SystemSetting` (incl. `id`/timestamps) instead of the create-DTO shape; `POST /admin/settings` (create) has a service method but no UI; no delete.
- Dead/wrong: `searchAddress` (singular), `verifyCoupon`/`verifyCouponCode`.
- Profile "Last Login" is mapped from `updated_at` (not a real login timestamp) — semantically wrong even once exposed.

---

## 7. Prioritized master action list

### P0 — correctness / data-integrity (do first)
- [~] **Profile broken** (6.2.1): **FE mitigation done** — dates now render "—" instead of "Invalid Date" (live `/auth/admin/me` *does* return `full_name`, so the name was never actually blank; only `created_at`/`updated_at`/`user_type` are missing). **Still needs backend** to expose timestamps/`user_type`.
- [ ] **Refund money logic** (5.2.1): **backend-blocked** — the `amount × percentage` recompute must happen server-side (`updateByAdmin` + `processRefund`). FE can't fix the money path; partially mitigated by restricting statuses (P1 below). Left open.
- [x] **Fabricated instructor fee** (1.2.1): **done** — removed `total × 0.25`; shows real `ride_price` when present, else "—" (API doesn't return it yet).
- [x] **`/admin/users/all` only returns admins** (2.2.1): **done** — removed the customer/instructor type filter; relabelled "Admin Users".
- [ ] **Settings id brute-force scan** (6.2.2): **backend-blocked** — needs `Setting.id` exposed or an update-by-key route.
- [x] **Pagination dropped everywhere** (0.1): **DONE on all 9 list pages** (bookings, customers, instructors, sessions, refunds, coupons, expired-coupons, coupon-usage, referral-codes, admin-users) via the shared `CursorPagination` component; verified against live API. NOTE: API doesn't return `meta.total`, so "total" counts are page-scoped (labelled "(page)"); default page size lowered to 10.

### P1 — broken UX / silent failures
- [x] Refund detail modal: restrict editable statuses to `approved|rejected`; disable Edit when not `pending` (5.2.2, 5.2.5). **done**
- [x] `EditCouponForm` null-expiry crash (4.2.1); referral code length >10 → 400 (4.2.2); coupon-usage AND-search returns nothing (4.2.3). **done**
- [x] Booking status filter enum mismatch (1.2.2); ride session status badge `'active'` never matches (3.2.1). **done**
- [~] Error envelope: route data hooks + detail-modal save paths through `getApiErrorMessages` (0.2). *(mostly done — bookings/customers/instructors/rides/coupons/referrals/users/refunds list hooks + ride regenerate + admin-users & referral status updates now use it; remaining: a few detail-modal save paths)*
- [x] Create-booking required doc URLs + pickup conditional validation (1.4.6). **done**
- [~] `usePendingRefundsCount` real count (5.2.3, backend-blocked — no total); refunds `customerName`→`search` (5.4) **done**; `prevCursor` key mismatch (5.1) **done**.
- [ ] Re-enable `isInstructorAssignable` guards before production (1.4.5). *(intentionally off for dev — owner's call)*

### P2 — data completeness / polish
- [x] Surface referral `referrer`/`referee` names instead of `#id`; guard `#null` (4.1, 4.2.4). **done** (table "Owner" column + both detail views show real names; admin-created codes labelled).
- [x] Instructor recent-rides count vs rows (2.2.3) **done**; unused instructor-rides endpoint (2.1) **deleted** (dead `useInstructorRides`/service/types; modal uses `recent_rides`).
- [x] Customer "Test Status" show passed AND failed (2.2.2). **done**
- [x] Expose unused filters: instructor vehicle box uses broad `search` (2.4) **done**; coupon "Expired" dropdown filter (4.4) **done**; rides have center/instructor/customer filters (3.4); coupon-usage **date-range (used from/to)** filter added **done**.
- [x] Fix `regenerate-route-image` response type + success-gated toast (3.2.3); `orderBy` start_time (3.2.2). **done**
- [~] Harden `SystemSettingsSection.formatValue` against `NaN` **done**; expose `Addon.description`/widen `Addon.type` (6.2.4–6.2.5, backend-dependent) pending.
- [x] `assignInstructor` typed to return the updated `AdminBooking` (was `void`); test-result already updates local state. Full refetch kept (correct & safe). (1.1)

### P3 — cleanup
- [x] Remove dead methods (`verifyCoupon`/`verifyCouponCode`, `searchAddress`), stray `console.log`s (0.5, 6.3). **done**
- [x] `string|number` stat types: **verified correct, no change** — the live API genuinely returns these as strings (`"2"`), so the union + defensive parsing is accurate. Nullable `CustomerBooking` fields left (cosmetic). (2.2.6)
- [~] Collapse `recent`/`all` bookings or give `recent` real semantics (1.2.4) pending; remove dead `is_available` badge (1.2.5) **done**; dead "Transferred Only" toggle (1.2.7) **done**.
- [x] Stop `AdminRideSessionDetail extends AdminRideSession` (3.2.5) **done**; normalize date-range inputs to ISO (3.2.6) **done** (rides + bookings filters).

### Backend changes the frontend needs (raise with backend team)
- Expose `status`/timestamps on `GET /drive-test-centers` (currently admin-group-only) so the toggle has a real source of truth.
- Expose `Setting.id` (or update-by-key) to kill the brute-force scan.
- Expose `full_name`/`user_type`/timestamps on `/auth/admin/me`.
- Add a `userType` filter to `/admin/users/all`.
- Recompute/persist refund `amount` on percentage change; add an admin-visible "refund executed" signal; expose an admin route (or status) distinguishing approved vs. refunded.
- Fix `address-search` positional-arg bug + ensure `gMapsKey` set in dev.
- Switch the refund **list** mapper to `toDomainWithCustomer` so `customer_name` is actually sent.
- Add `ride_price`/`total_ride_hour` to `AdminBooking` typing (already exposed) and consider a ride-session `status` field + free-text search.

---

## 9. Fix log (most recent first)

### Batch 8 — 2026-06-11 (refund modal: decision journey)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 40 | §5 Refund UX — "Edit" felt wrong | Reframed `RefundRequestDetailModal` from a generic **Edit → Save Changes** form into an explicit **decision journey**. A pending request now shows a "Process this refund request" card with **Reject Request** (red) / **Approve Refund** (green) actions instead of an Edit button. Choosing **Approve** reveals the percentage slider + a green "Refund to issue $X" card and an optional approval-note field; **Reject** shows a red "$0 — no refund" card and a recommended reason field. The footer becomes **Cancel** + a single confirm button labelled `Approve & Refund $X` / `Reject Request`. Non-pending requests show "This request has already been {status}" (read-only) — the backend rejects edits to non-pending refunds, so the path is removed entirely. Status maps to `approved`/`rejected` only (never workflow-internal states); `refund_percentage` is forced to 0 on reject. | `/refunds` → open a **pending** request → no "Edit" button; click **Approve Refund** → slider + green amount + note; click **Reject Request** → red $0 + reason; confirm → toast + list refetch. Open an **approved/rejected** request → read-only "already been…" card, only **Close**. |

**Verified:** `tsc --noEmit` clean, `next lint` clean. (Skipped `next build` to protect the dev server.)

### Batch 7 — 2026-06-11 (tiny leftovers)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 35 | §3.2.6 ISO date inputs | Ride-session + bookings date filters convert `datetime-local` → ISO before sending. | `/sessions` and `/bookings` → set a Start/End date filter → request sends ISO; results filter correctly. |
| 36 | §4.4 Usage date range | Added "Used from / Used to" date filters to the coupon usage table (`usage_date_from/to`). | `/settings/coupons/usage` → set the date range → Search → filters by usage date. |
| 37 | §2.1 Dead code removed | Deleted the unused instructor-rides endpoint wrapper (`useInstructorRides`, `getInstructorRides`, `InstructorRide`/params/response types). | No visible change; instructor modal still shows `recent_rides`. |
| 38 | §1.1 assignInstructor type | `assignInstructor` now returns the updated `AdminBooking` (was `void`). | No visible change; assign still works + list refetches. |
| 39 | §2.2.6 verified | Confirmed the API returns customer/instructor stats as **strings**, so `string\|number` typing is correct — **no change** (would have been a wrong "fix"). | n/a |

**Verified:** `tsc` clean, `next lint` clean.

### Batch 6 — 2026-06-10 (CAD formatter, coupon UX redesign, test-centers, usage calc)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 30 | **CAD formatter** (req #1) | Added `formatCAD(cents)` → `"$553.81 CAD"` in `lib/utils`; removed redundant `$`-icon next to amounts in coupons/usage/test-centre tables. | Coupon, usage, and test-centre tables show a single `$… CAD` string (no double `$`). |
| 31 | **Test-centres status** (req #2) | Status toggles now persist across refresh via localStorage (the GET still omits `status` — backend gap); amounts use `formatCAD`. | `/settings/test-centers` → toggle a centre Active/Inactive → **refresh** → it stays. |
| 32 | **Coupon usage calc** (req #3) | The usage record's `discount_amount` is a **backend bug** (returns `25`¢ for a `$10` coupon). The UI now uses each coupon's real `discount`: Original = charged + discount, Final = charged, Saved = real discount; metrics fixed. | `/settings/coupons/usage` → EID10OFF row now shows **$10.00 saved**, Original $563.81 → Final $553.81 (matches /bookings). |
| 33 | **Usage → booking detail** (req #4) | Removed the kebab link to `/bookings`; clicking a usage row opens **BookingDetailModal** (mapped from the usage record, since there's no single-booking GET endpoint). | `/settings/coupons/usage` → click a row → booking detail modal opens with reconciled pricing. |
| 34 | **CouponDetailModal** (req #5) | New `CouponDetailModal` (info + inline edit); the coupons **list row now opens it** instead of navigating to `/settings/coupons/[id]`. Hierarchy is now Page → row → modal, like the other domains. | `/settings/coupons` → click a coupon row → detail modal (with Edit + View Usage). |

**Backend bugs surfaced (handoff):**
- Coupon **usage `discount_amount` is wrong** — stores e.g. `25`¢ instead of the coupon's real `$10`; `final_price` is then `total_price − 25` (also wrong). FE mitigated by joining the coupon's real discount, but the stored value should be fixed.
- **No `GET /admin/bookings/:id`** — needed to open a full, accurate booking from the usage table (FE currently maps the usage row).
- `GET /drive-test-centers` still omits `status` (FE uses a localStorage stopgap).

**Verified:** `tsc` clean, `next lint` clean. (Skipped `next build` to protect the dev server.)

### Batch 5 — 2026-06-10 (filters, coupon no-expiry, polish)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 25 | §4.4 Coupon "Expired" filter | Status dropdown "Expired" now sends `is_expired: true` (was a no-op). | `/settings/coupons` → Status filter → **Expired** → returns expired coupons. |
| 26 | §2.4 Instructor vehicle search | Vehicle box now uses the broad `search` param (matches brand, model, address), not just brand. | `/instructors` → "Search by vehicle / address" → type a **model** → matches. |
| 27 | §4.2.6 Coupon no-expiry | Create/Edit forms now allow a blank expiry (= never expires); type made optional. | `/settings/coupons/create` (and Edit) → leave **Expiration Date** blank → saves a no-expiry coupon; editing a no-expiry coupon no longer breaks. |
| 28 | §5.3 Refund save errors | `useRefunds` hooks use `getApiErrorMessages`; the detail modal shows an **inline** error alert when a save fails. | `/refunds` → edit a refund and trigger a failure → real reason shows inline + toast. |
| 29 | §3.2.5 Type cleanup | `AdminRideSessionDetail` is now standalone (was extending the list type with fields the detail endpoint never returns). | Type-only; no visible change. |

**Verified:** `tsc --noEmit` clean, `next lint` clean. (Skipped `next build` to protect the running dev server.)

### Batch 4 — 2026-06-10 (finish pagination + referral names + error envelope)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 22 | §0.1 Pagination (rest) | Wired `CursorPagination` on the remaining 5 list areas: **/refunds, /settings/coupons, /settings/coupons/expired, /settings/coupons/usage, /settings/referral-codes, /settings/admin-users** (services/hooks now return `{data, meta}`; page size 10). | Each of those pages → with >10 rows a **Previous/Next** bar shows under the table; clicking pages loads new rows; filters reset to page 1. |
| 23 | §4.1/§4.2.4 Referral names | Backend already returns `referrer`/`referee` user objects — added to the type and shown as **Owner / Used By** (name + email) in the table and both detail views; admin-created codes show "Admin-created" instead of `#null`. | `/settings/referral-codes` → "Owner" column shows real names (or "Admin-created"); open a code → Owner/Used By show names. |
| 24 | §0.2 Error envelope | The coupon/referral/user/refund list hooks + the referral `[id]` status update now use `getApiErrorMessages`. | Trigger a failing action (e.g. a rejected status change) → the real backend reason shows. |

**Verified:** `tsc --noEmit` clean, `next lint` clean. (Skipped `next build` to avoid disrupting the running dev server; same patterns as Batch 3 which built cleanly.)

### Batch 3 — 2026-06-10 (pagination + error envelope)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 20 | §0.1 Cursor pagination | New `PaginationMeta`/`Paginated<T>` types + reusable `<CursorPagination>`; services (`getAllBookings`/`getCustomers`/`getInstructors`/`getRideSessions`) now return `{ data, meta }`; hooks expose `meta`; **Prev/Next** wired on **/bookings, /customers, /instructors, /sessions**. Filters reset the cursor. | `/bookings` (and /customers, /instructors, /sessions) → set **limit small** isn't needed; with >1 page the **Prev/Next** bar appears under the table. Click **Next** → different rows load; **Previous** enables. Apply a filter → resets to page 1. |
| 21 | §0.2 Error envelope (hooks) | The 4 list hooks now build their error message via `getApiErrorMessages` (so backend `errors`/validation arrays surface). | Trigger a failing list load (e.g. offline) → the inline "Error loading…" shows the real backend reason, not a generic string. |

**Notes:** cursor navigation verified live (page 2 returns distinct rows, `hasPreviousPage` flips). The API does **not** return `meta.total`, so per-page metric/title counts are labelled "(page)"; the Prev/Next bar shows "Showing N results". Remaining list pages (refunds, coupons, coupon-usage, referral-codes, admin-users) still need the same wiring.
**Verified:** `tsc` clean, `next lint` clean, `next build` succeeds (22/22).

### Batch 2 — 2026-06-10 (frontend, no backend changes)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 14 | §2.2.1 Admin-users filter | Removed the customer/instructor type filter (endpoint only returns admins); title now "Admin Users"; status-update errors via `getApiErrorMessages`. | `/settings/admin-users` → the **User Type** dropdown is gone; the list/search/status filter still work; deactivating a user shows the real backend reason on failure. |
| 15 | §6.2.3 Settings `$NaN` | `formatValue` guards non-numeric values. | `/settings` (System Settings) → numeric rate/price settings show `$x.xx`; a non-numeric value shows the raw value, never "$NaN". |
| 16 | §1.4.6 Create-booking validation | Doc URLs now required (valid URL) with inline errors; pickup address required unless "Meet at center". | `/bookings` → **Create Booking** → submit without uploading both documents → inline "…is required" errors (no backend 400). Choose "Pick up" without selecting an address → pickup error. |
| 17 | §5.1 Refund cursor key | Type uses `prevCursor` (matches backend). | Type-only; no visible change (groundwork for pagination). |
| 18 | §0.5 Dead methods + logs | Removed unused `verifyCoupon`/`verifyCouponCode`/`searchAddress`; stripped `console.log`s from settings service. | No visible change; coupon apply in Create-Booking still works via `verifyCouponForAdmin`. |
| 19 | §1.2.5 / §1.2.7 Dead UI | Removed the meaningless "Available/Busy" badge in the assign modal and the non-functional "Transferred Only" toggle on the dashboard table. | Assign-instructor modal → no fake "Available" badge. Dashboard "Recent Bookings" → only the working "Has Instructor" toggle remains. |

**Verified:** `tsc --noEmit` clean, `next lint` clean, `next build` succeeds (22/22 routes).

### Batch 1 — 2026-06-10 (frontend, no backend changes)

| # | Item | What changed | Where to test |
|---|---|---|---|
| 1 | §1.2.2 Booking status filter | Replaced bogus `active`/`completed` options with the real enum (`draft`, `partially_refunded`, `failed`, …); aligned `formatBookingStatus`. | `/bookings` → Search & Filters → **Status** dropdown. Pick **Succeeded**/**Expired**/**Pending** → rows return. Badges in the table/detail show correct colours; no more gray "active". |
| 2 | §3.2.1 Ride status badge | Badge now maps real `RideSessionStatus` (`scheduled/in_progress/completed/cancelled/transferred`). | `/sessions` → open a session → **Session Details → Status** badge shows the real coloured status (not gray). |
| 3 | §4.2.1 Edit coupon crash | `start_date`/`expires_at` parsed safely; no throw on null expiry. | `/settings/coupons` → open a coupon **with no/empty expiry** → click **Edit** → form opens (previously crashed/blanked). |
| 4 | §4.2.2 Referral code length | Generator now makes a 10-char code; input capped at 10; client guard 6–10. | `/settings/referral-codes` → **Create** → click **Generate** → code is 10 chars and saves without a 400. |
| 5 | §4.2.3 Coupon-usage search | Routes the term to `customer_name` **or** `customer_email` (by `@`), not both ANDed. | `/settings/coupons/usage` → search a **customer name** → results appear (previously empty). Searching an email also works. |
| 6 | §5.2.2/5.2.5 Refund statuses | Edit limited to **Approved/Rejected**; **Edit disabled** unless status is `pending`. | `/refunds` → open a **pending** refund → Edit → only Approved/Rejected. Open a **rejected/approved** refund → Edit button is disabled. |
| 7 | §5.4 Refund search | Sends `search` (which the backend honours) instead of the ignored `customerName`. | `/refunds` → search box → type a **customer name** → list filters (previously no effect). |
| 8 | §2.2.2 Customer test status | Shows **both** passed and failed counts. | `/customers` → a customer with both passes and fails shows "**n Passed**" **and** "**m Failed**". |
| 9 | §2.2.3 Instructor rides count | Header reads "Recent Rides (5 of N)" matching the rendered rows. | `/instructors` → open an instructor with >5 rides → header count matches the 5 rows shown. |
| 10 | §6.2.1 Profile dates (FE) | Missing/invalid dates render "—" instead of "Invalid Date". | `/profile` → **Member Since** and **Last updated** show "—" (until backend exposes the timestamps). Name still shows correctly. |
| 11 | §1.2.1 Instructor fee | Removed fabricated `total × 0.25`; shows real `ride_price` or "—". | `/bookings` table → **Instructor Fee** column shows "—" (API doesn't send `ride_price` yet) rather than a fake number. |
| 12 | §3.2.3 Regenerate route image | Toast gated on a real image; uses `getApiErrorMessages`; type includes `success`/nullable. | `/sessions` → open a session → **Generate/Regenerate** → success only when an image is produced; clear error otherwise. |
| 13 | §3.2.2 Sessions ordering | `orderBy` changed `created_at` → `start_time` (the column the backend cursor uses). | `/sessions` → list loads ordered by start time (no silent ordering mismatch). |

**Verified:** `tsc --noEmit` clean, `next lint` clean (only the pre-existing `<img>` warning).
**Resolved [VERIFY] items:** live `/admin/bookings/all` **does** return `road_test_doc_url`/`g1_license_doc_url`/`timezone`/`is_rescheduled` (so §1.1 needs no change); live `/admin/bookings/all` does **not** yet return `ride_price`/`total_ride_hour`; live `/auth/admin/me` returns `full_name` but not `user_type`/`created_at`/`updated_at`.

---

## 8. Notes on accuracy

- Items tagged **[VERIFY]** are dev-branch code findings that conflict with responses observed against the deployed `api-dev` (booking doc/timezone serialization in §1.1; test-center partial PUT in §6.2.6). Confirm against the live API before acting.
- The `isInstructorAssignable` guard being disabled (§1.4.5) is an **intentional dev toggle** (checks commented out with "will uncomment in production"), not an accidental bug — but it must be restored before release.
