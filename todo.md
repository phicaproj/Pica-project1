# PICA — Post-Meeting Implementation Plan (Friday client meeting)

> Scope captured from the Friday client meeting + codebase audit on 2026-06-14.
> Last updated 2026-06-16 — Sections A–F shipped, plus the post-Section-F
> subscription flow refactor. Open items live in Section R at the bottom.
> Split into **Backend** and **Frontend** sections for the two developers.
> Each item notes the files/areas it touches so work can start immediately.

## Decisions locked in (read first)

1. **Currency model — base prices move to USD.**
   - All prices are **stored and accounted in USD** (base currency).
   - **Nigeria users** (by `country`) see and **pay in Naira (NGN)**, converted from USD using an **admin-set fixed USD→NGN rate**.
   - **All other countries** see and pay in **USD**.
   - This **inverts today's NGN-default system** (Prisma `Payment.currency` default `"NGN"`, `pricing.service` hardcodes `'NGN'`, every formatter prefixes `N`).
2. **Subscriptions = Paystack recurring** (Paystack Plans + Subscriptions + renewal/cancel webhooks). Not a manual 30-day pass.
3. **Business size = staff size only.** Drop revenue from the calculation and the lead form. Keep `SMALL` (≤50) / `MEDIUM` (>50). **No Prisma enum change.**
4. **Consultation fulfilment = manual admin scheduling.** No calendar/Zoom/Calendly integration in this phase. Admin confirms + emails the meeting link.
5. **Paystack USD charging is a SETUP TASK / LAUNCH RISK** — see BE-0. Treat as a blocker until verified on the Paystack account.

---

## ⚠️ BE-0 — BLOCKER: Verify Paystack USD charging (do this first)
- Confirm the Paystack account can charge **USD** for international cards (some accounts are NGN-only).
- If USD charging is **not** available, escalate immediately — the whole "non-NG pays USD" requirement depends on it (fallback would be a second processor, e.g. Stripe/Flutterwave, which is a much larger change).
- Document the supported currencies + any per-currency Paystack subaccount/config needed.

---

# BACKEND TASKS

## A. Currency & FX (USD base, NGN for Nigeria) ✅ DONE (2026-06-15)

- [x] **Add an admin-set FX rate setting.** Singleton `AppSettings` model with `usdToNgn Decimal(12,4)` + `updatedBy → User` + audit timestamps; admin `GET/PATCH /api/admin/app-settings` under `settings:read`/`settings:write`. Service self-heals if the row is missing.
  - *Files added:* `prisma/schema.prisma` (AppSettings + reverse rel on User), `prisma/migrations/20260615120000_app_settings_fx/migration.sql` (seeded with placeholder 1500), `module/settings/{settings.types,settings.service,settings.controller}.ts`, wired into `admin.routes.ts`.
- [x] **Change base pricing to USD.** `PlanPrice.price` is now USD; one-off SQL divides every row by 1500 (matches the seeded `usdToNgn`). `pricing.service.toPricingRow` returns `currency: 'USD'`; `pricing.types` narrowed to `'USD'` on catalogue rows and `'USD' | 'NGN'` on checkout/init responses.
  - *Migration:* `prisma/migrations/20260615150000_plan_prices_to_usd/migration.sql` — single-shot, also re-baselines `Discount.amount_off` and back-fills `payments.amount_usd` for historical rows.
- [x] **Resolve display + charge currency by user country at checkout.** `resolveChargeCurrency(country)` in `payment.service` mirrors the FE helper. `initPaymentService` snapshots `usdToNgn` at init time, charges NG users in NGN, everyone else in USD, persists `Payment.amount` (wire), `Payment.amountUsd`, and `Payment.currency`. Paystack now receives the right `currency` field.
  - *Files:* `payment.service.ts`, `service/shared/paystack.service.ts` (accepts `currency: 'NGN' | 'USD'`), `prisma/schema.prisma` (`Payment.amountUsd`, `currency` default → `'USD'`).
- [x] **Public pricing endpoint returns both views.** `/api/payment/pricing` returns `{ currency: 'USD', usdToNgn, phase2A, phase2B }` — FE picks display currency from `me.country`. No `?country=` param added; derived client-side.
- [x] **Coupons/discounts**: `Discount.amountOff` re-baselined to USD by the same migration. `coupon.service` math is currency-agnostic (just a number); `initPaymentService` runs coupon math in USD, then converts the discount to wire currency before persisting.
- [x] **Admin transactions/analytics flipped to `amountUsd`** (2026-06-16). The K-suffix bug ("$541.0k" on pending payments) was the visible symptom — fixed by switching aggregates in `payment.admin.service.ts` + `admin.service.ts` to roll `amountUsd`, narrowing the report-service formatter to USD ('en-US' / no ₦ prefix), and bumping the compactAmount threshold from `>= 1_000` to `>= 10_000`.

## FE counterparts to Section A ✅ DONE (2026-06-15)

- [x] `lib/utils.ts`: `formatMoney(amount, currency)`, `resolveDisplayCurrency(country)`, `convertFromUsd(usd, target, rate)`, `Currency` type.
- [x] All `formatPrice` / `N`-prefix call sites swapped to `formatMoney` across `View/PricingView.tsx`, `dashboard/{subscription,deep-dive,settings}`, `admin/{subscription,payments,coupons,users/[id]}`. Per-payment rows honor the row's currency; admin roll-ups display USD.
- [x] Dashboard pricing renders in `resolveDisplayCurrency(me.country)`, converting via `convertFromUsd(price, target, pricing.usdToNgn)` — Nigerian users see ₦, everyone else $. Public landing `PricingView` stays USD by design.

## B. Business size by staff only (remove revenue) ✅ DONE (2026-06-15)

- [x] **Drop revenue from business-size logic.** In `assessment.service.ts` remove `classifyRevenue` + the revenue branch in `computeBusinessSize`; size = `classifyStaffSize(staffSize)` only (≤50 SMALL, >50 MEDIUM). Update the doc comment block (lines ~38–82).
- [x] **Make `annualRevenue` optional** in `assessment.types.ts startAssessmentInput` (or remove entirely if FE stops sending it). Confirm no downstream code requires it.
  - Note: `annualRevenue` columns exist on `User` + `AssessmentSession`. Keep columns for history; just stop requiring/using them for sizing. (Optional cleanup task to remove later.)
  - *Implementation:* AssessmentSession.annualRevenue defaults to `''` when FE omits it — no migration needed.
- [x] Confirm the SMALL/MEDIUM category ranges with client copy for the UI tooltip (≤50 = Small, >50 = Medium).

## C. Registration without Phase 1 (profile-completion gate instead) ✅ DONE (2026-06-15)

- [x] **Remove the hard Phase-1 gate** in `auth.service.ts registerService` (currently throws FORBIDDEN at ~line 86 if no completed Phase 1 session). Allow registration with the user's own details.
  - Registration must now collect/accept the profile fields previously snapshotted from Phase 1 (businessName, phone, staffSize/businessSize, industry, country, etc.) OR mark profile incomplete.
  - Add a `profileComplete` boolean (derive or store) so the dashboard can prompt. Minimum needed for Phase 2A = `businessSize` resolved (which needs `staffSize`).
  - *Implementation:* derived (`businessSize !== null`), not stored. Phase 1 snapshot still used as a fallback when present.
- [x] **Still link any existing Phase 1 sessions** by email on register (keep the `updateMany` that attaches `userId`).
- [x] **Gate paid tests on profile completion**, not on registration. In `assessment.service.ts` Phase 2A/2B start: if `businessSize`/required profile is missing → `AppError(... complete your profile ...)`. `GET /auth/me` should return `profileComplete` for the FE prompt.
  - *Note:* Phase 2B is implicitly gated (requires a paid pillar unlock, which requires `businessSize`). Phase 2A copy updated explicitly.
- [x] Update `auth.types.ts register schema` to accept the new self-entered fields.

## D. Subscriptions (Paystack recurring, 3 tiers) ✅ DONE (2026-06-15)

- [x] **New Prisma models** (+ migration `20260615200000_subscriptions`):
  - `SubscriptionPlan` — `tier Int`, `name`, `description`, `priceUsd Decimal(12,2)`, `phase2aPerMonth`, `phase2bPerMonth`, `consultationsPerMonth`, `features String[]`, `paystackPlanCodeUsd`/`paystackPlanCodeNgn`, `isActive`, `displayOrder`. Seeded with Starter (2/2/1 @ $40), Growth (4/4/2 @ $80), Scale (6/6/3 @ $120).
  - `UserSubscription` — `userId`, `planId`, `status (ACTIVE|PAST_DUE|CANCELLED|EXPIRED)`, Paystack codes (`subscriptionCode @unique`, `customerCode`, `emailToken`), `currency`, `currentPeriodStart/End`, `cancelAtPeriodEnd`. Card-on-file columns added by `20260615210000_subscription_card_on_file` (`cardLast4/Brand/Bank/ExpMonth/ExpYear/AuthorizationCode`).
  - `SubscriptionUsage` — `(userSubscriptionId, periodStart)` unique, `phase2aUsed`, `phase2bUsed`, `consultationsUsed`. Lazy-created on first consumption.
  - `Plan` enum extended with `SUBSCRIPTION` and `Payment.userSubscriptionId` FK added (`20260615220000_subscription_payment_link`) so every recurring charge persists an idempotent `Payment` row.
- [x] **Paystack Plans integration.** `paystack.service.ts` gained `createPaystackPlan`, `updatePaystackPlan`, `initializeSubscriptionTransaction`, `disablePaystackSubscription`. Admin save creates the USD Paystack plan eagerly; NGN plan is lazily created on first Nigerian subscriber (so admins don't need NGN config until they have an NG customer).
- [x] **Subscribe endpoint** (`POST /api/subscription/subscribe`): rejects if user already has ACTIVE/PAST_DUE, snapshots USD→NGN at init for NG users, returns Paystack hosted checkout URL.
- [x] **Webhooks for recurring** — `handleSubscriptionEvent` (subscription.create + subscription.disable) and `handleSubscriptionChargeSuccess` (charge.success with `metadata.kind === 'subscription'`). Idempotency anchor is `Payment.providerReference @unique` upsert — period only rolls when the upsert actually inserts. Card on file captured from `data.authorization` on every charge. `subscription.disable` flips status to CANCELLED locally; `expireLapsedSubscriptions()` self-heals to EXPIRED on next read.
- [x] **Cancel endpoint** (`POST /api/subscription/cancel`) — Paystack disable + `cancelAtPeriodEnd=true`. Rejects double-cancel via CONFLICT.
- [x] **Quota enforcement.** `assertSubscriptionQuota(userId, kind)` is non-throwing — returns `{ hasQuota: true, subscriptionId, periodStart, remaining }` or `{ hasQuota: false, reason: 'no-subscription' | 'quota-exhausted' | 'expired' }`. Wired into `initPaymentService`: subscription quota short-circuits the Paystack init for `PHASE2A` + `PHASE2B_PILLAR` — $0 Payment row + `consumeSubscriptionQuota` + entitlement grant in one `$transaction`. Falls through to pay-per-use when quota is unavailable. `assertSubscriptionQuota('consultation')` is exported and ready for Section E.
- [x] **`GET /api/subscription/me`** + **`GET /api/subscription/plans`** — current subscription with quota meters, card on file, period dates; public plan catalogue with USD prices + live `usdToNgn` for FE conversion.
- [x] **Admin tier CRUD** — `/api/admin/subscription-plans` GET/POST/PATCH/DELETE under `ledger:read`/`ledger:write`. Tier number is immutable post-create (changing it would shadow displayOrder). Soft-delete only — flips `isActive=false`, existing subscribers keep working.
- [x] **Hard period boundary.** No quota rollover. `expireLapsedSubscriptions()` runs on every quota check so even without a cron, lapsed subscriptions self-heal to EXPIRED at read time.

  *Files added:* `module/subscription/{types,service,controller,routes}.ts`, three migrations under `prisma/migrations/2026061520*`–`2026061522*`, helpers added to `paystack.service.ts`. Webhook dispatch lives in `payment.service.ts`.

## E. Consultation (manual scheduling) ✅ DONE (2026-06-16)

- [x] **New Prisma models** (`20260616000000_consultation_bookings`):
  - `ConsultationTier`: `tier (1|2|3)`, `name`, `description`, `priceUsd Decimal`, `durationMinutes Int`, `isActive`, `displayOrder`. Seeded with three default tiers.
  - `ConsultationBooking`: `userId`, `tierId`, `status (REQUESTED|CONFIRMED|ATTENDED|CANCELLED|NO_SHOW)`, `requestedAt`, `scheduledAt?`, `meetingLink?`, `paymentId?`, `coveredBySubscription Boolean`, `topic`, `notes`, `preferredTimes`, `relatedResultId?`.
  - `Plan` enum extended with `CONSULTATION` so consultation payments roll through the same idempotent `Payment` table.
- [x] **Booking flow** — `POST /api/consultation/book`:
  - Always creates a REQUESTED row first (this was a meeting decision so users can see their booking immediately regardless of payment outcome).
  - If `assertSubscriptionQuota(userId, 'consultation')` returns `hasQuota`, decrements consultation quota and marks `coveredBySubscription=true` — no charge.
  - Otherwise initialises Paystack and returns the auth URL; webhook back-fills `paymentId` + flips booking to CONFIRMED on success.
- [x] **Consultation tier admin CRUD** at `/api/admin/consultation-tiers` (GET/POST/PATCH/DELETE) under `consultations:read`/`consultations:write`. Soft-delete only.
- [x] **Admin booking management endpoints** under `consultations:write`:
  - `GET /api/admin/consultation-bookings` — list with status filter + pagination.
  - `PATCH /api/admin/consultation-bookings/:id/confirm` — sets `scheduledAt` + `meetingLink`, emails the user.
  - `PATCH /api/admin/consultation-bookings/:id/status` — mark ATTENDED / NO_SHOW / CANCELLED.
- [x] **User endpoints**: `GET /api/consultation/me` (their bookings), `GET /api/consultation/tiers` (public catalogue with USD prices + live `usdToNgn`).
- [x] **Permission keys**: `consultations:read` / `consultations:write` are distinct from `ledger:*` so ops staff can manage bookings without revenue access.

  *Files:* `module/consultation/{types,service,controller,routes}.ts`, admin endpoints in `module/admin/consultation.admin.{service,controller,routes}.ts`, migration `prisma/migrations/20260616000000_consultation_bookings`, email template added to `email.service.ts`.

## F. Pricing-page plan activation toggles (admin) ✅ DONE (2026-06-16)

- [x] **Section + tier activation flags.** `isActive` already lived on `SubscriptionPlan` + `ConsultationTier` from Sections D/E. Added two booleans on `AppSettings` for the storefront sections: `payPerUseActive` + `subscriptionActive` (`prisma/migrations/20260616000000_storefront_section_toggles`).
- [x] **Invariant: at least one section must stay live.** Enforced in `updateAppSettingsService` — rejects with `AppError('At least one pricing section ... must stay active.', UNPROCESSABLE_CONTENT)` when both would flip off.
- [x] **Public pricing filters deactivated items.** `getPublicPricingService` zeros `phase2A`/`phase2B` when `payPerUseActive=false`; `listPlansService` returns an empty `plans` array when `subscriptionActive=false`. Both responses include a new `sections: { payPerUse, subscription }` field so the FE can branch.
- [x] **FE admin toggles** in Settings → App Settings tab: two `SectionToggleRow`s with "Last live" copy on the only-active row to prevent the user from disabling both.
- [x] **FE public surfaces respect the toggles**: `View/PricingView.tsx` (landing), `/dashboard/plans` (subscription picker), `/dashboard/subscription` (pay-per-use checkout) all default to "live" when `sections` is missing (graceful during rollout) and render a paused state when their section is off.

## G. Cross-cutting / housekeeping

- [ ] All new modules follow the established pattern: `module/<name>/<name>.{controller,service,routes,types}.ts`, thin controllers + Zod, services with Prisma `select`, `AppError` + http constants, register routers in `app.ts` under `/api/<name>`. New env vars via `Config/env.ts getEnv()`.
- [ ] Add Paystack plan/subscription secrets + any USD config to `Config/env.ts`.
- [ ] Migrations: one logical migration per model group; verify against the `@prisma/adapter-pg` setup.
- [ ] Update `src/docs/*` (swagger/docs) for all new endpoints.

---

# FRONTEND TASKS

> **How to read this section:** Each task says **What to do**, **Why** (the reason behind it),
> **Where** (the files to open), and **How** (concrete steps). You don't need to read the
> Backend section first — but the backend must build the new API endpoints before some of
> these can be fully wired. Where a task depends on the backend, it's noted as **Needs backend:**.
> Use real data from the API wherever possible; avoid leaving hardcoded/mock values.

## H. Show the right currency (USD for everyone, Naira only for Nigeria) ✅ DONE (2026-06-15)

- [x] **Shared `formatMoney(amount, currency)` helper** in `lib/utils.ts` (+ `resolveDisplayCurrency(country)` and `convertFromUsd(usd, target, rate)`).
- [x] **Country-driven display.** `me.country === 'Nigeria'` (case-insensitive + aliases NG/NGA/Federal Republic of Nigeria) → NGN, everyone else → USD. Public `PricingView` (anonymous) defaults to USD; no country picker added yet.
- [x] **Pricing types updated.** `PricingRow.currency: 'USD'`, `PublicPricingResponse: { currency: 'USD', usdToNgn }`. `Currency = 'USD' | 'NGN'` union exported for downstream readers.
- [x] **All price-display call sites swapped.** Replaced `formatPrice` / `N`-prefix in `View/PricingView.tsx`, `dashboard/{subscription,deep-dive,settings}`, `admin/{subscription,payments,coupons,users/[id]}`. Per-payment rows honor the row's captured currency; admin roll-ups display USD.

## I. Rebuild the public pricing page into two offerings

**Background:** The landing pricing page (`View/PricingView.tsx`) currently has a
"Small Business / Medium Business" toggle. The client wants it changed to two clear choices:
**Pay Per Use** (buy one test at a time) and **Subscription Plan** (pay monthly, get a quota of tests).

- [ ] **Replace the Small/Medium toggle with a "Pay Per Use" vs "Subscription Plan" switch.**
  - *Where:* `View/PricingView.tsx` (the toggle is near the top of the file). Currently still shows the legacy Small/Medium toggle — the Section F section gating is wired underneath (`payPerUseActive` / `subscriptionActive`), but the top-of-page toggle hasn't been rebuilt.
- [ ] **Pay Per Use section = the existing cards** (Free Scan, Plan 2A, Plan 2B).
  - *How:* keep the current cards; just make sure prices come from the pricing API and show in the right currency (task H).
- [ ] **Subscription section = the 3 new monthly tiers.**
  - *How:* show each tier's monthly price and what you get (e.g. "3 Phase 2A tests, 2 Phase 2B, 1 consultation per month"). Pull these from the new subscription API.
  - **Needs backend:** subscription plans endpoint — already shipped in Section D.
- [x] **Only show what the admin has turned on.** Section F landed: `View/PricingView.tsx` already gates the pay-per-use grid on `pricing.sections.payPerUse` and shows a "One-off purchases paused" fallback when off.
- [ ] `pages/pricing/page.tsx` already just renders `PricingView` — no change needed there.

## J. Remove "Annual Revenue" from the free-test form ✅ DONE (2026-06-15)

**Background:** Business size (Small vs Medium) used to be decided by both staff count AND
annual revenue. The client is dropping revenue entirely — size is now based on **staff size
only** (50 or fewer = Small, more than 50 = Medium). So the revenue question should go away.

- [x] **Delete the "Annual Revenue Range" block from the form.**
  - *Where:* `View/GeneralTestView.tsx` (the revenue buttons are around lines 418–460).
  - *How:* remove that UI block, remove `annualRevenue` from the form's state (around line 871), and remove the revenue check from the form validation (around line 932).
- [x] **Keep the Staff Size field** — that's now the only thing that decides business size.
  - *Optional:* add a small hint under it like "50 or fewer = Small business, more than 50 = Medium business".
  - *Implementation:* hint added directly under the input.
- [x] **Stop sending `annualRevenue` when starting the assessment.**
  - *How:* remove it from the data sent to `/assessment/start`. (The backend is making this field optional, so this won't break.)

## K. Fix the mobile experience while taking the test

**Background:** Several issues were reported specifically on phones during the free test.

- [x] **Progress bar visible on mobile.** Bumped from `h-1` to `h-2` (the old 4px bar effectively vanished against the dark theme); added `overflow-hidden` and made the header `flex-wrap` so the pillar name + progress label don't collide on narrow widths.
- [x] **Auto-scroll to top when the question changes.** `useEffect` watching `currentIndex` calls `window.scrollTo({ top: 0, behavior: 'smooth' })` in `QuestionStep`.
- [ ] **Do a general mobile cleanup of the question screens.** *(deferred — not yet swept; spacing/tap-target audit still TODO)*
- [x] **Instant "show password" eye toggle.** Hoisted `EyeIcon` / `EyeOffIcon` out of every Auth page (they were being re-created each render, forcing a remount of the SVG subtree); removed the `transition` class on the toggle button so the icon swap is immediate. Applied to `Auth/login`, `Auth/signup`, `Auth/new-password`, `Auth/accept-invite`.

## L. Add "back to home" buttons ✅ DONE (2026-06-15)

- [x] **Back-to-home on the question/test page** — added on both `IntroStep` (absolute-positioned top-left) and `QuestionStep` (inline above the pillar header) in `View/GeneralTestView.tsx`.
- [x] **Back-to-home on Login and Registration** — uppercase tracking-widest link with a back-arrow SVG above the logo in `Auth/login/page.tsx` and `Auth/signup/page.tsx`.

## M. Let people register without taking the free scan first ✅ DONE (2026-06-15)

**Background:** Today you CAN'T create an account unless you've already finished the free
Phase 1 scan — the backend blocks it. The client wants to allow signup anytime. But to take
the paid tests later, the user must first complete their profile (the business details we used
to collect during the free scan). So we move the "gate" from registration to the dashboard.

- [x] **Update the signup page to work without a prior scan.**
  - *Where:* `Auth/signup/page.tsx`.
  - *Why:* since they may not have done the free scan, we no longer have their business details automatically — so the signup form needs to collect them (business name, phone, staff size, industry, country, etc.).
  - **Needs backend:** registration will stop requiring a prior Phase 1 scan and will accept these fields.
  - *Implementation:* added an optional "Business profile" block (staff size + industry + country + years) to the signup form. The `SignUp` helper only forwards filled fields.
- [x] **Show a "Complete your profile" prompt on the dashboard when the profile is incomplete.**
  - *Why:* a user who skipped the scan needs to fill in their details before they can take Phase 2A or any paid test.
  - *How:* the backend will tell us if the profile is complete (a `profileComplete` flag from `/auth/me`). If it's false, show a banner/modal and disable the buttons that start paid tests.
  - *Where:* dashboard home/layout, plus the entry points in `dashboard/strategic-scan`, `dashboard/deep-dive`, `dashboard/subscription`.
  - *Implementation done:* banner on `dashboard/page.tsx` links to `/dashboard/settings`. Per-CTA disabling now also in place on `dashboard/strategic-scan` (Start button + early-return guard in `handleStart`), `dashboard/deep-dive` (banner + greys out "Start New Module", sidebar "New Pillar Deep Dive", empty-state "Start your first Deep Dive"), and `dashboard/subscription` (PricingCard `disabled` now covers `!me.profileComplete` for any backendPlan, and the "we couldn't determine your business size" copy points at settings instead of the deprecated Phase 1 scan).
- [x] **Build the profile-completion form** (most likely inside `dashboard/settings`) so users can fill in the missing details, after which the paid tests unlock.
  - *Implementation:* the existing settings page already wires `staffSize` + business fields through `updateUserBusiness`. No new form needed.

## N. Build the user's subscription screen ✅ DONE (2026-06-15)

**Background:** `dashboard/subscription/page.tsx` is the one-off pay-per-use checkout — kept as-is.
The new recurring monthly tiers live at `/dashboard/plans` so the two flows stay distinct.

- [x] **New `dashboard/plans/page.tsx`** with two views in one page:
  - **Picker view** (no active sub): Starter / Growth / Scale cards. Each card shows price in `formatMoney(convertFromUsd(...), displayCurrency)` so Nigerian users see ₦, everyone else $. Quota lines (Phase 2A / 2B / consultations per month) render via `<QuotaLine>`; description renders inline above bonus features (matches the planning conversation). Subscribe button redirects to Paystack hosted checkout.
  - **Manage view** (active sub): status badge, quota meters with used / total and a "falls back to pay-per-use" hint when exhausted, billing card (USD price + next renewal), **card-on-file panel** rendering `Visa •••• 4242 — exp 12/27`, cancel button. Cancel modal calls out "quota stays through period end, no rollover after" before confirming.
- [x] **Pay-per-use stays linked** — a footer line on the picker view points back to `/dashboard/subscription` ("Already exhausted your quota? You can still pay per use").
- [x] **API helpers** added in `lib/api/subscription.ts` and re-exported through `authClient.ts`: `getSubscriptionPlans`, `getMySubscription`, `subscribeToPlan`, `cancelMySubscription`, plus the admin trio.

## O. Rebuild the consultation page ✅ DONE (2026-06-16)

- [x] **Replaced fake consultant cards with a real request form.** `dashboard/consultation/page.tsx` was completely rewritten with a hero strip + bookings grid + two-column request form (notes/topic/preferred times/related result on the left, three tier cards on the right). Matches the dashboard's `gap-6 / rounded-2xl / bg-[#111827]` spacing scale.
- [x] **Quota-vs-paywall branching on submit.** `bookConsultation` returns either `{ free: true }` (subscription credit consumed; booking immediately REQUESTED) or a Paystack auth URL (booking REQUESTED but pending; webhook flips to CONFIRMED on payment success).
- [x] **Bookings panel on the dashboard.** Lists current and past bookings with status chips (REQUESTED / CONFIRMED / ATTENDED / etc.), tier name, scheduled time, meeting-link button when CONFIRMED, related-result chip.
- [x] **API helpers** added in `lib/api/consultation.ts` and re-exported through `authClient.ts`: `getConsultationTiers`, `bookConsultation`, `getMyConsultations`, plus the admin trio.

## P. Build the admin pricing & management screens

**Background:** Admins need to control all of the above: subscription tiers, consultation
tiers, what's turned on/off, the exchange rate, and consultation bookings.

- [x] **Subscription tier CRUD lives as a tab on `/admin/subscription`** (post-Section-F polish merged the four scattered pages into tabs). Inline editor for price (USD), quotas, name, description, bonus features, active flag, display order. Tier number locked once saved. Soft-delete only. Cards re-styled to match the pay-per-use PlanCard shape — same `bg-[#1C1F2E]` shell, Crown icon, chip + title + price block + ticked feature list.
- [x] **Admin sidebar IA cleaned up.** No standalone `/admin/subscription-tiers` link — the four originally-planned new pages are now tabs on `/admin/subscription` (pay-per-use / subscription tiers / consultation tiers) and `/admin/settings` (app settings). Consultations Inbox moved to its own top-level `/admin/consultations` sidebar entry (2026-06-16) gated by `consultations:read`.
- [x] **Consultation tier CRUD** as a tab on `/admin/subscription`, mirroring the subscription tier card shape. Price (USD) + duration (minutes) + active flag.
- [x] **Section on/off switches** under Settings → App Settings (Section F).
- [x] **Exchange rate editor in the admin UI.** Lives under Settings → App Settings with a USD→NGN input, live three-card preview, and an audit line showing who last updated the rate.
- [ ] **Move pay-per-use feature list out of localStorage.** Today `admin/subscription/page.tsx` still stores feature bullets under `FEATURE_STORAGE_KEY`. Needs a `PricingFeature` table (or a `features String[]` column on `PlanPrice`) so the bullets are shared across admin sessions and persistent.
- [x] **Admin Consultations Inbox** at `/admin/consultations` (own sidebar slot from 2026-06-16). Status filter (All / Requested / Confirmed / Attended / No-show / Cancelled), confirm modal with `scheduledAt` + `meetingLink`, mark attended / no-show / cancel actions.
- [x] **Admin API helpers** added in `lib/api/{subscription,consultation,admin}.ts`: tier CRUD, booking CRUD, FX-rate GET/PATCH. All re-exported through `authClient.ts`.

## Q. General notes

- [ ] **Slow loading is mostly the backend, not the frontend.** The backend runs on Render's free tier, which "sleeps" and takes a few seconds to wake up. This is a hosting limitation, not a code bug — worth telling the client. *Optional:* add loading skeletons/spinners so the wait feels smoother.
- [ ] **Match the existing look and feel.** Keep using the current dark/light theme and the established component styles so the new screens blend in.

---

## R. Subscription flow refactor (post-F smoke-test fixes) ✅ DONE (2026-06-16)

User testing surfaced four flaws in how subscriptions actually behave end-to-end. All fixed in one slice:

**Backend**
- [x] **Coupons extend to subscriptions.** `Plan` enum already had `SUBSCRIPTION`; widened the public-facing coupon-plan union in `coupon.types.ts` + `coupon.service.ts` (response cast). Existing `validateAndPriceCoupon` was already plan-agnostic so no rule changes needed.
- [x] **Inline subscription checkout with coupon support.** `subscribeService(userId, planId, { couponCode })` now runs the same USD-first coupon math as `initPaymentService`. A 100%-off coupon short-circuits Paystack entirely — creates a `UserSubscription` (status ACTIVE, period now → +30d) + a $0 `Payment` row + bumps `Discount.usedCount` inside one transaction. Returns `{ free: true, ... }` mirroring `InitPaymentResponse`.
- [x] **No "payment received" email for $0 settlements.** Dropped the `sendSuccessEmailBestEffort` calls from the subscription-quota path (line 248) and the free-coupon path (line 351) in `payment.service.ts`. Same gate on the new free-subscription path. The $0 Payment row still exists for audit and billing-history.

**Frontend**
- [x] **`/dashboard/plans` rewritten as a pure picker.** ManageView dropped from this page. Current plan gets a green "Your plan" chip + disabled "Current plan" CTA; non-current plans on an active sub show "Cancel current to switch". Clicking opens `<SubscriptionCheckoutModal>` with coupon input, total breakdown, and inline Paystack popup (no full-page redirect). Free-coupon path skips Paystack and jumps to verify+success.
- [x] **Settings → Billing now has History / Subscription sub-tabs.** `BillingSettings` got a secondary tab strip and ported the old ManageView verbatim into the Subscription sub-tab (quota meters, billing card, card-on-file, cancel). Deep-link `?tab=Billing&billingTab=Subscription` is honored, and the "Manage subscription →" link on the plans page targets that URL.
- [x] **Pre-init quota probe on `/dashboard/subscription`.** `tryFreeShortCircuit` runs `initPayment` in `handlePickLockedScan` / `handlePickPillar` / the auto-pick branch *before* `setView("checkout")`. If the BE returns `free: true`, the user jumps straight to the success screen — never sees a checkout UI, never gets an email. Gated on having an active subscription so we don't accumulate orphaned PENDING rows for non-subscribers.
- [x] **Consultations Inbox moved out of `/admin/subscription`.** Now lives at `/admin/consultations` with its own sidebar slot (`NAV_MAIN`, gated by `consultations:read`). The subscription page keeps the Pay-per-use, Subscription Tiers, and Consultation Tiers tabs.

**Follow-ups deferred from this slice**
- [ ] **Webhook coupon-redemption for Paystack-paid subscriptions.** Free-coupon subs bump `Discount.usedCount` directly; paid-coupon subs pass `couponCode` through Paystack metadata, but `handleSubscriptionChargeSuccess` doesn't yet read it to increment `usedCount` or stamp `appliedCouponCode` onto the first-charge `Payment` row. Means a partial-discount coupon could be reused. Small follow-up.
- [ ] **Cheaper quota check.** `tryFreeShortCircuit` calls full `initPayment`, which creates a PENDING `Payment` row for non-free outcomes. Harmless but wasteful. Future cleanup: add `GET /subscription/quota-check?kind=PHASE2A` returning `{ hasQuota: bool }` with no row write.

## S. What's left (consolidated)

The big shippable items still open:

- [x] **BE-0** — Paystack USD charging is live on the account (confirmed 2026-06-16). Currency split no longer blocked.
- [ ] **Section I — Landing-page pricing rebuild.** Replace the Small/Medium toggle in `View/PricingView.tsx` with a Pay-Per-Use / Subscription Plan toggle that exposes the subscription tiers (rendered from the public API) alongside the existing pay-per-use cards.
- [ ] **Landing-page country picker** (Section H follow-up). Anonymous visitors currently see USD; we need a Nigeria/Other picker so NG visitors can convert via the live `usdToNgn` rate.
- [ ] **Section K mobile audit** — sweep dashboard pages for mobile spacing + tap-target sizing. Question-screen and auth-screen fixes already landed.
- [ ] **Section P — Pay-per-use feature bullets in DB.** Currently localStorage; needs a real table so admin sessions share state.
- [ ] **Section Q — Loading skeletons.** Replace the centered-spinner pattern with proper skeleton states on the dashboard list pages so the Render free-tier cold-start feels smoother.
- [ ] **Section R follow-ups** (above): webhook coupon-redemption tracking + cheap quota-check endpoint.

# Open items to confirm with client / between devs
- [x] Exact subscription tier quotas & prices — seeded as Starter (2/2/1 @ $40) / Growth (4/4/2 @ $80) / Scale (6/6/3 @ $120).
- [x] Consultation tier prices & durations — three tiers seeded by Section E migration.
- [x] USD→NGN starting rate + who maintains it — admin-owned via Settings → App Settings; seeded at 1500.
- [x] Free Scan always stays available — it's a lead magnet, not a paid product. When `payPerUseActive=false`, only Plan 2A + Plan 2B cards hide; the Free Scan card stays on screen.
- [x] Copy for the profile-completion prompt and SMALL/MEDIUM size hint — both shipped in Sections B + M.
- [x] Confirmed Paystack USD capability (2026-06-16) — see BE-0.
