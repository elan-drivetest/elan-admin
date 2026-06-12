# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`elan-admin` is the admin panel for **Elan**, a road-test car rental / driving-test booking platform (Ontario, Canada). It is a **frontend-only** Next.js app — there is no backend in this repo. All data comes from an external REST API (default `https://api-dev.elanroadtestrental.ca/v1`). The admin manages bookings, ride sessions, customers, instructors, refunds, coupons, referral codes, test centers, and admin users.

## Commands

```bash
npm run dev      # Dev server with Turbopack (http://localhost:3000)
npm run build    # Production build
npm run start    # Serve production build
npm run lint     # ESLint (next lint)
```

There is **no test framework** configured in this project.

## Environment

- `NEXT_PUBLIC_API_BASE_URL` — base URL of the backend API. Falls back to the dev API in `lib/axios.ts` if unset. This is the only env var the code reads.
- Env files (`.env*`) are gitignored.

## Stack

- Next.js 15 (App Router, React 19), TypeScript strict mode
- Tailwind CSS v4 (`@tailwindcss/postcss`, config-less — theme lives in `app/globals.css`)
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
- `lib/axios.ts` has a **response interceptor** that catches 401s, calls `POST /auth/admin/refresh` once, queues concurrent failed requests during the refresh, retries them, and on refresh failure clears `localStorage('user')` and hard-redirects to `/login`. Do not add manual token handling — rely on this interceptor.
- `lib/auth-context.tsx` (`AuthProvider` + `useAuth`) holds auth state via a `useReducer`. It optimistically restores the cached user from `localStorage`, then validates against `GET /auth/admin/me`. Wraps the whole app in `app/layout.tsx`.
- `components/auth/RouteProtection.tsx` gates rendering by `isAuthenticated` / `requiredRole`.
- The API user shape (`full_name`, `user_type`, `photo_url`, …) is mapped to the app's `User` shape (`name`, `role`, `avatar`, …) inside `services/auth.ts`. API↔app field renaming is a recurring pattern — see `mapUserTypeToRole`.

### Routing (App Router route groups)

- `app/(auth)/` — unauthenticated routes (login). Uses `app/(auth)/layout.tsx`.
- `app/(dashboard)/` — authenticated admin area. `app/(dashboard)/layout.tsx` wraps everything in `components/layouts/wrappers/DashboardLayout.tsx` (sidebar + mobile header + footer). The sidebar nav map lives in `components/layouts/wrappers/Sidebar.tsx`.
- Nearly all pages are `'use client'` components — data is fetched client-side through hooks, not Server Components / server actions.

### Services (`services/`)

Plain object modules (`adminService`, `authService`, `refundService`, `fileService`) that wrap `apiClient` calls. `services/admin.ts` is the large central service covering most admin domains. A common quirk: list endpoints return `{ data: [...] }`, so services unwrap with `response.data.data || []`.

### Hooks (`hooks/`)

`hooks/useAdmin.ts` exposes many small data hooks (e.g. `useAllBookings`, `useRecentBookings`, `useBookingInstructors`). They all follow the **same shape**: local `useState` for `data` / `isLoading` / `error`, a fetch function, a `useEffect` to fetch on mount, and a returned `{ data, isLoading, error, refetch }`. There is **no react-query / SWR** — caching and refetching are manual. Follow this existing pattern when adding a new data source rather than introducing a fetching library.

### Types (`types/`)

`types/admin.ts`, `types/auth.ts`, `types/refund.ts` define all API request/response shapes. These are the contract with the backend — when an endpoint changes, update the type here first; services and hooks import from it.

### Components

- `components/ui/` — shadcn primitives + a few custom ones (`FileUploader`, `loading-state`, `error-boundary`, `SearchableSelect`).
- Feature components are grouped by kind: `tables/`, `modals/`, `forms/`, `booking/`, `layouts/`, `selectors/`, `sections/`.
- Pages typically: fetch via a hook → transform API data into a table-row shape (see `transformBookingData` in the bookings page) → render a `tables/*` component, with `modals/*` for detail/create/edit flows.

### Money & booking math

Prices are handled **in cents** throughout. `lib/utils/booking-calculations.ts` (`bookingUtils`) is the single source for pickup-price tiers, distance perks, formatting (`formatPrice`), and dollar/cent conversion. Use it instead of re-deriving pricing rules. `hooks/useBookingCalculation.ts` and the `components/booking/*` components compose it for the create-booking flow.

### Images

Remote images are restricted by `next.config.ts` `images.remotePatterns` (AWS S3 buckets `*.s3.ca-central-1.amazonaws.com` for uploaded files/docs). Add a hostname there before using `next/image` with a new remote source.

## Conventions

- Most interactive files start with `'use client'`; many also carry a leading `// path/to/file` comment.
- Error handling pattern in hooks/services: catch, read `err?.response?.data?.message`, set a typed `{ message, code }` error object.
- `lib/customers-mock-data.ts` and `lib/instructors-mock-data.ts` are mock fixtures — confirm whether a screen is wired to the real API or to mocks before changing data behavior.
