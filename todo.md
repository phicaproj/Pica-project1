# PICA — Post-Meeting Implementation Plan (Friday client meeting)

> Scope captured from the Friday client meeting + codebase audit on 2026-06-14.
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
- [ ] **Admin transactions/analytics**: `Payment.amountUsd` now back-fills every row, but admin services (`payment.admin.service.ts`, `admin.service.ts` analytics) still aggregate `amount` not `amountUsd`. **TODO:** flip the sums to `amountUsd` so revenue reporting is in one currency.

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

## E. Consultation (manual scheduling)

- [ ] **New Prisma models** (+ migration):
  - `ConsultationTier` (admin pricing): `tier (1|2|3)`, `name`, `priceUsd Decimal`, `durationMinutes Int`, `isActive`, `displayOrder`.
  - `ConsultationBooking`: `userId`, `tierId`, `status (REQUESTED|CONFIRMED|ATTENDED|CANCELLED|NO_SHOW)`, `requestedAt`, `scheduledAt?`, `meetingLink?`, `paymentId?` (null when covered by subscription quota), `coveredBySubscription Boolean`, form fields (topic, notes, preferred times).
- [ ] **Booking flow** (`POST /api/consultation/book`):
  1. Validate the submitted form.
  2. If user has an ACTIVE subscription **and** consultation quota remaining → create booking `coveredBySubscription=true`, decrement quota, status `REQUESTED`. No charge.
  3. Else → **paywall**: create a `Payment` for the chosen `ConsultationTier` price (USD/NGN per country) and return Paystack auth URL; booking is created `REQUESTED` only after payment success (verify/webhook).
- [ ] **Consultation pricing admin endpoints** (CRUD on `ConsultationTier`).
- [ ] **Admin consultation management endpoints**: list bookings (filter by status), confirm + set `scheduledAt`/`meetingLink`, mark attended/no-show, cancel. Email the user on confirm (reuse `email.service`).
- [ ] **User consultation endpoints**: `GET /api/consultation/me` (their bookings for the dashboard card), book-another reuses the book flow.

## F. Pricing-page plan activation toggles (admin)

- [ ] **Section + tier activation flags.**
  - Add `isActive` to `SubscriptionPlan` (above) and `ConsultationTier`.
  - Add a **section-level** toggle for the two storefront sections: **Pay-Per-Use** and **Subscription**. Store as two booleans in the settings/config model (e.g. `payPerUseActive`, `subscriptionActive`).
- [ ] **Invariant: at least one section must stay live.** Enforce in the admin service — reject a request that would deactivate both Pay-Per-Use and Subscription simultaneously (`AppError(... one pricing section must remain active ...)`).
- [ ] **Public pricing filters deactivated items.** `getPublicPricingService` must hide deactivated tiers and any deactivated section so users never see them. Pay-per-use (`PlanPrice`) visibility now also respects the section toggle.

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
  - *Where:* `View/PricingView.tsx` (the toggle is near the top of the file).
- [ ] **Pay Per Use section = the existing cards** (Free Scan, Plan 2A, Plan 2B).
  - *How:* keep the current cards; just make sure prices come from the pricing API and show in the right currency (task H).
- [ ] **Subscription section = the 3 new monthly tiers.**
  - *How:* show each tier's monthly price and what you get (e.g. "3 Phase 2A tests, 2 Phase 2B, 1 consultation per month"). Pull these from the new subscription API.
  - **Needs backend:** subscription plans endpoint.
- [ ] **Only show what the admin has turned on.**
  - *Why:* the admin can switch off individual tiers or a whole section. Users must never see something that's turned off.
  - *How:* just render whatever the API returns — don't hardcode tiers. If the API doesn't return a tier/section, it shouldn't appear.
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

## O. Rebuild the consultation page

**Background:** `dashboard/consultation/page.tsx` currently shows fake "consultant" cards and
has no real functionality. The client wants it to be a **form** the user fills in to request a
consultation. When they submit, if they're a subscriber with consultations left this month it's
free; otherwise they hit a paywall and must pay for the consultation before it's booked.

- [ ] **Remove the fake consultant cards and replace with a request form.**
  - *Where:* `dashboard/consultation/page.tsx` — delete the `consultants` mock array and its cards (around lines 37–90).
  - *How:* the form should collect things like topic, notes, and preferred times, plus which consultation tier they want.
- [ ] **On submit, check whether they need to pay.**
  - *How:* if they have an active subscription with a consultation left this month → submit the request for free. Otherwise → send them to Paystack to pay for the chosen consultation tier, and the booking is created once payment succeeds.
  - **Needs backend:** the booking endpoint handles this check and returns either "booked" or a Paystack payment link.
- [ ] **Show the user their consultation bookings + a "Book another" button.**
  - *Why:* the page currently makes no API calls at all — they can't see past/upcoming sessions.
  - *How:* list their bookings with status (requested / confirmed / attended) and add a button to start a new request.
- [ ] **Add the API helper functions** in `lib/authClient.ts`: `getConsultationTiers`, `bookConsultation`, `getMyConsultations`.

## P. Build the admin pricing & management screens

**Background:** Admins need to control all of the above: subscription tiers, consultation
tiers, what's turned on/off, the exchange rate, and consultation bookings.

- [x] **Subscription tier CRUD page** — new page at `admin/subscription-tiers/page.tsx` (distinct from `admin/subscription/page.tsx` which still owns the one-off pay-per-use pricing rows). Inline editor for price (USD), quotas, name, description, bonus features (newline-separated textarea), active flag, display order. Tier number is locked once a row is saved. Each row surfaces its Paystack USD/NGN plan code sync state. Soft-delete via "Deactivate" — existing subscribers keep working.
- [ ] **Admin sidebar link.** Add a sidebar entry for the new tier page in `admin/layout.tsx` (the page exists, but isn't yet linked from the nav).
- [ ] **Consultation tiers (3):** create/edit/delete each tier's price (USD) and duration (minutes/hours).
- [ ] **Section on/off switches.** Big toggles for "Pay Per Use" vs "Subscription" sections + the BE invariant ("at least one section must stay live"). Per-tier `isActive` is already in place.
- [ ] **Exchange rate editor in the admin UI.** BE endpoint `/api/admin/app-settings` already exists from Section A; the admin page still needs a small form to GET/PATCH the rate.
- [ ] **Move pay-per-use feature list out of localStorage** — today `admin/subscription/page.tsx` stores it under `FEATURE_STORAGE_KEY`. Should move to BE so it's shared and persistent.
- [ ] **Create a new admin "Consultation Management" page.**
  - *What it does:* lists all consultation requests by status (requested / confirmed / attended / cancelled). Admin confirms a request, sets the date/time and pastes a meeting link, marks attended or no-show.
  - *How:* add the page under `admin/`, link from sidebar (`admin/layout.tsx`). Will also need a permission key like the other admin pages.
  - **Needs backend:** consultation management endpoints (Section E).
- [x] **Admin subscription API helpers** added in `lib/api/subscription.ts`: `adminListSubscriptionPlans`, `adminCreateSubscriptionPlan`, `adminUpdateSubscriptionPlan`, `adminDeleteSubscriptionPlan`.
- [ ] **Add remaining admin helpers** in `lib/authClient.ts` for consultation tiers, consultation bookings, and the exchange rate (the rate endpoint already exists in `lib/api/admin.ts`? — verify and add if missing).

## Q. General notes

- [ ] **Slow loading is mostly the backend, not the frontend.** The backend runs on Render's free tier, which "sleeps" and takes a few seconds to wake up. This is a hosting limitation, not a code bug — worth telling the client. *Optional:* add loading skeletons/spinners so the wait feels smoother.
- [ ] **Match the existing look and feel.** Keep using the current dark/light theme and the established component styles so the new screens blend in.

---

# Open items to confirm with client / between devs
- [ ] Exact **subscription tier quotas & prices** (numbers per tier) — needed before seeding plans.
- [ ] Exact **consultation tier prices & durations** (3 tiers).
- [ ] **USD→NGN starting rate** + who maintains it.
- [ ] Whether deactivated **pay-per-use** also hides the Free Scan, or Free Scan always stays available.
- [ ] Copy for the profile-completion prompt and the SMALL/MEDIUM size hint.
- [ ] Confirm Paystack USD capability (BE-0) before building the currency split.
