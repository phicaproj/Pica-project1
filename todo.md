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

## A. Currency & FX (USD base, NGN for Nigeria)

- [ ] **Add an admin-set FX rate setting.** New singleton-style config (e.g. extend a settings table or add `AppSettings`/`FxRate` model) holding `usdToNgn: Decimal` + `updatedAt` + `updatedBy`. Admin-editable.
  - Files: `prisma/schema.prisma`, new `module/settings` (or extend admin module), migration.
- [ ] **Change base pricing to USD.**
  - `PlanPrice.price` now represents **USD**. Update `pricing.service.ts` `toPricingRow` to return `currency: 'USD'` and drop the hardcoded `'NGN'`.
  - `pricing.types.ts`: change `currency: 'NGN'` types → `'USD'` (and a runtime currency union `'USD' | 'NGN'` for resolved/checkout responses).
  - Decide migration of existing NGN price rows → convert to USD using a chosen rate (one-off data migration; document the rate used).
- [ ] **Resolve display + charge currency by user country at checkout.**
  - New helper `resolveCurrencyForUser(country)` → `'NGN'` if Nigeria else `'USD'`.
  - In `payment.service.ts initPaymentService`: compute `chargeCurrency`, and if NGN, convert USD base price → NGN using the FX rate. Pass the correct `currency` + amount to Paystack (NGN→kobo as today; USD→cents).
  - Persist `currency` + the **USD-equivalent** on every `Payment` for clean USD accounting (add `amountUsd Decimal` to `Payment`, keep `amount`/`currency` as the charged values).
  - Files: `payment.service.ts`, `payment.types.ts`, `prisma/schema.prisma` (+ migration), `Payment.currency` default review.
- [ ] **Public pricing endpoint returns both views.** `getPublicPricingService` (+ `/payment/pricing`) should return USD prices and, for convenience, the current FX rate so the FE can show NGN to NG visitors. Add optional `?country=` or derive from auth when present.
- [ ] **Coupons/discounts**: confirm `Discount.amountOff` semantics under USD base (it's currently NGN major units). Re-baseline to USD; verify `coupon.service.ts` math.
- [ ] **Admin transactions/analytics**: ensure revenue reporting sums in **USD** (`amountUsd`), not mixed currencies. Files: `payment.admin.service.ts`, `admin.service.ts` analytics.

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

## D. Subscriptions (Paystack recurring, 3 tiers)

- [ ] **New Prisma models** (+ migration):
  - `SubscriptionPlan` (admin-defined tier): `tier (1|2|3 or enum)`, `name`, `priceUsd Decimal`, `paystackPlanCode`, quotas → `phase2aPerMonth Int`, `phase2bPerMonth Int`, `consultationsPerMonth Int`, `isActive Boolean`, feature list (JSON or text[]), `displayOrder`.
  - `UserSubscription`: `userId`, `planId`, `status (ACTIVE|PAST_DUE|CANCELLED|EXPIRED)`, `paystackSubscriptionCode`, `paystackCustomerCode`, `currentPeriodStart/End`, `cancelAtPeriodEnd`.
  - `SubscriptionUsage`: per-user, per-period counters (`phase2aUsed`, `phase2bUsed`, `consultationsUsed`) keyed by `(userSubscriptionId, periodStart)`; or compute usage from existing tables — decide and document.
- [ ] **Paystack Plans integration.** On admin creating/updating a `SubscriptionPlan`, create/update the matching **Paystack Plan** (per currency — NGN plan + USD plan, since currency differs by country). Store the plan code(s).
- [ ] **Subscribe endpoint** (`POST /api/subscription/subscribe`): create Paystack subscription for the user's resolved currency; return auth URL.
- [ ] **Webhooks for recurring**: extend the existing webhook handler (`payment.service.ts` / `WebhookEvent`) to process `subscription.create`, `charge.success` (renewal), `subscription.disable`, `invoice.payment_failed` → update `UserSubscription.status` + roll period + reset usage. Keep idempotency on `providerEventId`.
- [ ] **Cancel endpoint** (`POST /api/subscription/cancel`) → Paystack disable; set `cancelAtPeriodEnd`.
- [ ] **Quota enforcement service.** Helper `assertSubscriptionQuota(userId, kind)` used by Phase 2A start, Phase 2B start, and consultation booking. Subscribers consume monthly quota; non-subscribers fall through to pay-per-use.
- [ ] **`GET /api/subscription/me`** → current plan, status, period end, remaining quotas. Backs dashboard subscription card.

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

## H. Show the right currency (USD for everyone, Naira only for Nigeria)

**Background:** Right now the whole app shows prices in Naira and always puts an "N" in front
of the number. The client wants the opposite: **USD is the main currency**. Nigerian users
should see and pay in **Naira**, and everyone else sees and pays in **USD**. The backend now
stores every price in USD and gives us a USD→Naira exchange rate to convert with.

- [ ] **Build one shared money-formatting helper instead of repeating the "N" prefix.**
  - *Why:* The "N" prefix is copy-pasted in many files. If we centralize it, switching between $ and ₦ is a one-line change everywhere.
  - *Where:* add it in `lib/utils.ts` (or `lib/authClient.ts`).
  - *How:* write `formatMoney(amount, currency)` that returns `"$1,200"` when currency is `USD` and `"₦1,800,000"` when currency is `NGN`. Then replace the existing `formatPrice` functions in `View/PricingView.tsx` and `admin/subscription/page.tsx` with it.
- [ ] **Decide which currency to show based on the user's country.**
  - *Why:* Nigerian users pay Naira; everyone else pays USD. We figure this out from the user's `country`.
  - *How:* if `country` is Nigeria → show Naira (take the USD price and multiply by the exchange rate the API gives us). Otherwise → show USD as-is. For visitors who aren't logged in yet (e.g. the public pricing page), default to USD or add a small country picker.
  - **Needs backend:** the public pricing API will return the USD prices and the current exchange rate.
- [ ] **Update the pricing types in `lib/authClient.ts`.**
  - *Why:* the types currently say currency is always `'NGN'`; that's no longer true.
  - *How:* change `currency: 'NGN'` to `currency: 'USD' | 'NGN'`, and read the new exchange-rate field from the pricing response.
- [ ] **Go through every screen that shows a price and switch it to the new helper.**
  - *Where:* `View/PricingView.tsx`, `dashboard/subscription`, `dashboard/deep-dive`, `admin/subscription`, `admin/payments`, `admin/analytics`, and the coupons screens.
  - *How:* search the frontend for `N` price prefixes / `formatPrice` and replace each with `formatMoney(...)`.

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

- [ ] **The progress bar doesn't show on mobile — make it visible.**
  - *Where:* `View/GeneralTestView.tsx` (progress bar markup around lines 523–562).
  - *How:* it's likely hidden by a responsive class or a width that collapses on small screens. Make sure the bar and its container render at mobile sizes.
- [ ] **Auto-scroll to the top when the question changes.**
  - *Why:* right now when you move to the next question, the page stays scrolled down and the user has to scroll up themselves.
  - *How:* when the current question index changes, scroll to the top — e.g. `window.scrollTo({ top: 0, behavior: 'smooth' })` (or scroll the question card into view) inside an effect that watches the question index.
- [ ] **Do a general mobile cleanup of the question screens.**
  - *How:* check spacing, button sizes (easy to tap), and the answer option cards on a phone-width screen.
- [ ] **Make the "show password" eye button respond instantly.**
  - *Why:* it currently lags when tapped.
  - *Where:* the Auth pages — `Auth/login`, `Auth/signup`, `Auth/new-password`.
  - *How:* the delay is usually a slow re-render or a CSS transition on the toggle. Make the toggle flip the input type immediately with no transition delay.

## L. Add "back to home" buttons

**Background:** Users can get stuck on certain pages with no easy way back to the homepage.

- [ ] **Add a back-to-home button on the question/test page** — `View/GeneralTestView.tsx`.
- [ ] **Add a back-to-home button on the Login and Registration pages** — `Auth/login/page.tsx` and `Auth/signup/page.tsx`.
  - *How:* a simple link/button (e.g. top-left, with a back arrow or the logo) that navigates to `/`.

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
  - *Implementation done:* banner on `dashboard/page.tsx` links to `/dashboard/settings`. Per-CTA disabling on strategic-scan / deep-dive / subscription entry points is **still TODO** — the backend already refuses Phase 2A/2B start when businessSize is missing, but the FE should grey out the buttons too.
- [x] **Build the profile-completion form** (most likely inside `dashboard/settings`) so users can fill in the missing details, after which the paid tests unlock.
  - *Implementation:* the existing settings page already wires `staffSize` + business fields through `updateUserBusiness`. No new form needed.

## N. Build the user's subscription screen

**Background:** `dashboard/subscription/page.tsx` is currently a "buy one scan" checkout.
The client wants real monthly subscriptions (3 tiers) that auto-renew through Paystack.

- [ ] **Rework `dashboard/subscription/page.tsx` to show subscriptions.**
  - *How:* show the 3 tiers and what each includes. Show the user's current plan, its status, when the current month/period ends, and **how many of each test they have left this month**. Add a "Subscribe" button (sends them to Paystack to pay) and a "Cancel" button.
  - **Needs backend:** `/subscription/me` (current plan + remaining quota), subscribe, and cancel endpoints.
- [ ] **Keep the pay-per-use (buy one test) option visible too**, side by side with subscriptions — matching the two offerings on the public pricing page.
- [ ] **Add the API helper functions** in `lib/authClient.ts`: `getSubscriptionPlans`, `getMySubscription`, `subscribe`, `cancelSubscription`.

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

- [ ] **Expand the admin pricing page** (`admin/subscription/page.tsx`) — today it only edits pay-per-use prices. Add:
  - **Subscription tiers (3):** create/edit/delete each tier's monthly price (USD) and its quotas (how many Phase 2A, Phase 2B, and consultations per month) plus its feature list.
    - *Note:* the feature list is currently saved only in the browser (localStorage). Move it to the backend so it's shared and permanent.
  - **Consultation tiers (3):** create/edit/delete each tier's price (USD) and duration (minutes/hours).
  - **On/off switches:** a toggle for each individual tier, plus two big section toggles — "Pay Per Use" and "Subscription". *Important:* the UI must stop the admin from turning BOTH sections off at the same time (at least one must stay live) — show an error/disabled state.
  - **Exchange rate editor:** a field where the admin sets the USD→Naira rate.
  - **Needs backend:** endpoints for subscription tiers, consultation tiers, section toggles, and the exchange rate.
- [ ] **Create a new admin "Consultation Management" page.**
  - *What it does:* lists all consultation requests by status (requested / confirmed / attended / cancelled). The admin can confirm a request, set the date/time and paste a meeting link, and later mark it attended or no-show.
  - *How:* add the page under `admin/`, and add a link to it in the admin sidebar (`admin/layout.tsx`). It will also need a permission key like the other admin pages.
  - **Needs backend:** consultation management endpoints.
- [ ] **Add the admin API helper functions** in `lib/authClient.ts` for subscription tiers, consultation tiers, consultation bookings, and the exchange rate.

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
