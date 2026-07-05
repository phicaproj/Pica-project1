# PICA — Pricing Model Gap Implementation Plan

> Scope: changes required by the official `PICA PRICING MODEL FOR DEVELOPERS.pdf`
> that cannot be solved from the existing admin dashboard.
> Cosmetic / numerical edits (prices, quotas, feature bullets, FX rate, section
> on/off toggles, tier display order) are intentionally **excluded** — the admin
> can already do those today via Settings → App Settings, `/admin/subscription`
> tier tabs, and `/admin/consultations`.
> Last updated 2026-06-22 (Admin Consultation Notes batch).

---

## ⚠️ Blockers — confirm with client before coding

### CL-0 — Authoritative Phase 2B multi-pillar discount schedule
The PDF disagrees with itself in two places:
- **Page 2** says: *"discount scales by 5% per pillar added, capped at a flat 80,000 for 5 or more pillars."*
- **Page 4 table** says: 5 pillars = ₦40,000 flat (not ₦80,000); also says "1 Pillar … Actual Cost ₦20,000" on a ₦10,000 base (which is impossible).

We need ONE definitive table from the client before BE-1 / FE-1 can ship. Suggested ask:

> "Could you confirm the final Phase 2B discount table? For each pillar count
> 1–7, what is (a) the base, (b) the discount %, and (c) the flat-rate cap
> if any? Page 2 says cap at ₦80,000 for 5+; page 4 says ₦40,000. Which one is current?"

### CL-1 — "90-Day Free PICA™ 2A Access" consultation bonus ✅ RESOLVED (2026-06-22)
Client confirmed (a)-with-multiplier reading: every confirmed consultation booking
grants **5 free PICA 2A credits valid for 90 days** from confirm. Per-tier
admin-configurable via `ConsultationTier.freeP2ARuns` + `freeP2ACreditWindowDays`
(defaults 5 / 90), so the client can later tune any tier without a code change.
Built — see BE-3 / FE-3 below.

### CL-2 — PICA 2A canonical price
PDF page 2 lists 2A as ₦25,000 in one paragraph and ₦50,000 ("Comprehensive PDF Report") in the adjacent table. Trivial to fix in admin once the client confirms — flagging here so it doesn't get implemented incorrectly elsewhere.

### CL-3 — PICA Execute monthly ceiling for Tier 3
PDF page 10 says Tier 3 is "₦350,000 – ₦1,000,000+ / month" — a range, not a fixed price. The current `SubscriptionPlan.priceUsd` is a single Decimal. Decide with client:
- (a) Pick one number (admin-fudgeable now, no code change).
- (b) Add `priceUsdMax` + a "From $X" display mode (BE-5 / FE-5).
- (c) Switch Tier 3 to "Custom — contact sales" with a lead form (BE-5 / FE-5).

---

# BACKEND TASKS

## BE-1 — Phase 2B multi-pillar bundle checkout + compound discount
**Why:** Today `initPaymentService` charges exactly one pillar per checkout
(`PHASE2B_PILLAR` + `pillarId`). The PDF mandates buying N pillars in one
transaction with a per-pillar % discount and a flat-rate cap for 5+ pillars.
This is the single biggest gap.

- [x] **Discount schedule config.** Resolved CL-0 → percentage ladder
  (1→0%, +5%/extra, capped at 5 pillars = 20%; cap hidden from customers).
  Stored on `AppSettings` (`phase2bDiscountPctPerPillar`, `phase2bDiscountMaxPillars`)
  so the admin can edit pct + cap. Formula:
  `discountPct = min(count−1, maxPillars−1) × pctPerPillar`. No flat-rate cap.
- [x] **Pricing helper.** `resolvePhase2BBundlePrice(pillarIds: string[])`
  in `pricing.service.ts` returns `{ basePriceUsd, discountUsd, finalPriceUsd, discountPct, perPillar }`.
- [x] **Init payment changes** in `payment/payment.service.ts`:
  - Accepts `pillarIds: string[]` (length 1–7, distinct) for `Plan.PHASE2B_PILLAR`;
    single `pillarId` still accepted and normalized to an array.
  - Validates every pillar exists, is active, and has no open unlock.
  - Computes total via `resolvePhase2BBundlePrice`.
  - One `Payment` row covers the whole bundle (`pillarId = ids[0]` when length 1,
    else null; list persisted on `pillarIds`).
- [x] **Schema additions:**
  - `Payment.pillarIds String[]` populated for bundles.
  - `Payment.pillarId` kept for single-pillar back-compat.
  - `Phase2BPillarUnlock` composite `@@unique([paymentId, pillarId])` so one
    payment grants N unlocks idempotently.
  - Migration: `prisma/migrations/20260619000000_phase2b_bundles/migration.sql` (applied).
- [x] **Entitlement grant** in `grantSuccessEntitlements`: loops `payment.pillarIds`,
  upserting one `Phase2BPillarUnlock` per pillar keyed on `(paymentId, pillarId)`;
  all rows share the same `paymentId`.
- [x] **Subscription quota path:** if `remaining >= N`, consume N (via
  `consumeSubscriptionQuota(count)`) and free-grant all N; else fall through to
  the paid bundle with no quota consumption.
- [x] **Coupon math:** coupon applies to the discounted bundle total (unchanged —
  base already = discounted total).
- [x] **Webhook idempotency:** preserved by the composite unique + `update: {}` upsert.
- [x] **Docs:** `src/docs/payment.docs.ts` documents the `pillarIds` array;
  `src/docs/admin.docs.ts` documents the two new app-settings fields.

## BE-2 — Annual subscription billing cycle ✅ DONE (2026-06-22)
**Why:** PDF page 9–10 explicitly mentions *"For Annual Subscription, access is
valid for one year"* on every tier. Today `UserSubscription.currentPeriodEnd`
rolls 30 days from each charge; there's no annual concept.

Resolution: per-tier admin-set `annualDiscountPct` (0–80) instead of a raw
`priceUsdAnnual`. The list response derives `priceUsdAnnual = priceUsd × 12 ×
(1 − pct/100)` server-side so the FE never recomputes. Monthly quota cadence
preserved inside the annual term (matches PDF page 9 emphasis).

- [x] **Schema:** `SubscriptionPlan.annualDiscountPct` (Int, 0 = no annual
  option) + `paystackPlanCodeUsdAnnual` / `paystackPlanCodeNgnAnnual`.
  `UserSubscription.billingInterval` snapshot (new `BillingInterval { MONTHLY,
  ANNUAL }` enum). Migration:
  `prisma/migrations/20260622000000_consult_2a_bonus_annual_billing/migration.sql`.
- [x] **Paystack plan creation** in `subscription.service.ts`: eagerly mints the
  USD-annual plan when admin saves a tier with `annualDiscountPct > 0`; lazily
  mints NGN-annual on first NG annual subscriber. `adminUpdatePlanService`
  resyncs annual mirrors when price or discount changes.
- [x] **Subscribe endpoint** accepts `interval: 'MONTHLY' | 'ANNUAL'` (default
  MONTHLY). Picks the right plan code, lazy-creates the missing one, persists
  `UserSubscription.billingInterval`, threads `interval` through Paystack
  metadata for the webhook.
- [x] **Period roll** — `nextPeriodEnd(start, interval)` helper (365d for
  ANNUAL, 30d for MONTHLY). Wired in `handleSubscriptionChargeSuccess` and
  `handleSubscriptionEvent`. `expireLapsedSubscriptions` is interval-agnostic
  (date-based), no change needed.
- [x] **Quota meaning:** monthly cadence preserved inside an annual term
  (`SubscriptionUsage(periodStart)` model untouched).
- [x] **`GET /subscription/plans`** returns `annualDiscountPct` + derived
  `priceUsdAnnual` on every public plan row.
- [x] **Admin tier CRUD:** `createPlanSchema` / `updatePlanSchema` gain
  `annualDiscountPct`. `MySubscriptionPayload` carries `billingInterval`.
- [x] **Docs:** `src/docs/subscription.docs.ts` — annual fields on
  `SubscriptionPlanPublic/Admin`, `billingInterval` on `MySubscriptionPayload`,
  interval semantics documented on the subscribe endpoint.

## BE-3 — Consultation → free PICA 2A credit grant ✅ DONE (2026-06-22)
**Why:** PDF page 6 lists "90-Day Free PICA 2A Access" as a bonus on all three
consultation options. CL-1 resolved to "N credits per booking, valid M days,
per-tier configurable". Defaults match PDF (5 / 90).

- [x] **Schema:** new `Phase2ACredit { id, userId, consultationBookingId,
  sequence, expiresAt, consumedAt?, consumedPaymentId? }` model with
  `(consultationBookingId, sequence)` unique (idempotent confirm) and
  `(userId, consumedAt, expiresAt)` index (hot lookup). `ConsultationTier` gains
  `freeP2ARuns` + `freeP2ACreditWindowDays` (defaults 5 / 90 — admin editable).
- [x] **Confirm flow:** `adminConfirmBookingService` wraps the status flip +
  N upserts in one `$transaction`. Idempotent on `(bookingId, sequence)` so
  re-confirm refreshes the expiry on unconsumed rows without duplicating.
- [x] **Phase 2A short-circuit:** `initPaymentService` checks for the
  oldest unconsumed unexpired credit BEFORE the subscription quota path.
  Atomic claim via `updateMany + consumedAt: null` filter (race-safe). Returns
  `free: true`, `paymentMethod: 'consultation-credit'`, marks SessionResult
  paid via the existing `grantSuccessEntitlements`.
- [x] **New endpoint** `GET /api/consultation/phase2a-credits` —
  unconsumed unexpired credits for the FE banner.
- [x] **Docs:** `src/docs/consultation.docs.ts` documents the bonus columns
  + new endpoint; `src/docs/payment.docs.ts` documents the credit
  short-circuit on `/payment/init`.

## BE-4 — Admin Consultation Notes + Client History modal ✅ DONE (2026-06-22)
**Why:** Original 30-day-checkpoint scope was dropped — that's marketing copy,
admins handle outreach manually. Reframed into: let admins browse the user
behind each consultation booking, view their last 5 assessment sessions
with PDF download links, and leave free-form feedback the user can read on
their dashboard. Lighter than a notes thread by design — single text column,
single email on first save, no read/unread tracking.

- [x] **Schema:** four nullable columns on `ConsultationBooking` — `adminNotes
  String?`, `adminNotesUpdatedAt DateTime?`, `adminNotesUpdatedById String?`
  (FK on `users.id`, SET NULL on delete), `adminNotesNotifiedAt DateTime?`
  (single-shot email gate). Back-relation `User.consultationAdminNotes`
  via `@relation("ConsultationAdminNotes")`. Migration:
  `prisma/migrations/20260623000000_consultation_admin_notes/migration.sql`.
- [x] **Service:** `adminUpdateBookingNotesService(id, adminId, input)` —
  fetches existing booking, computes `shouldNotify = (adminNotesNotifiedAt
  === null && trimmed.length > 0)`, single UPDATE sets text + timestamp +
  author + (conditionally) `adminNotesNotifiedAt`. Email fires only when
  `shouldNotify` so re-edits never re-notify. Empty/whitespace string
  clears `adminNotes` back to null.
- [x] **Service:** `adminGetClientHistoryService(bookingId)` — resolves
  booking → user, returns identity block + last 5 completed Phase 2A/2B
  results via shared helper `listCompletedResultsForUser(userId, limit)`
  (extracted from the existing `listMyCompletedResultsService` — no
  regression). Joins `SessionResult.reportPdfUrl` in a second keyed-IN
  query so the modal can render Download buttons.
- [x] **Email:** new `sendConsultationNoteUpdatedEmail` in `email.service.ts`
  + fire-and-forget wrapper `sendConsultationNoteUpdatedEmailBestEffort`
  in `consultation.email.ts`. Body says "your consultant left feedback —
  sign in to read" without quoting the note text (lighter-version scope).
- [x] **Routes:** PATCH `/api/admin/consultation-bookings/:id/notes`
  (`consultations:write`) + GET `/client-history` (`consultations:read`).
  Both reuse the existing permission pair — no new permission keys.
- [x] **Payload:** `ConsultationBookingPayload` + `AdminBookingRow` carry
  `adminNotes`, `adminNotesUpdatedAt`, and `adminNotesUpdatedBy` (id +
  email + first/last name). `adminNotesNotifiedAt` is intentionally NOT
  exposed — admin-internal.
- [x] **Docs:** `src/docs/consultation.docs.ts` registers both endpoints
  + extends the booking-payload Zod schema with the three public note fields.

## BE-5 — PICA Execute Tier 3 "From $X" / "Custom quote" pricing (BLOCKED on CL-3)
**Why:** PDF Tier 3 is ₦350k–₦1M+ — a range, not a fixed monthly price.
Awaiting CL-3 decision. If client picks one number (option a), no code change
— admin updates the field. If they pick (b) or (c):

- [ ] **(b) Range display:** add `SubscriptionPlan.priceUsdMax Decimal?`. When
  non-null, public list response includes both; FE renders "From $X / month".
  Subscribe still charges `priceUsd` (the low end).
- [ ] **(c) Contact-sales mode:** add
  `SubscriptionPlan.pricingMode enum('FIXED'|'RANGE'|'CUSTOM_QUOTE')`. For
  `CUSTOM_QUOTE`, the subscribe endpoint refuses with a 422 — FE renders a
  lead-capture form instead, posting to a new `enterprise_inquiries` table
  (`POST /api/subscription/enterprise-inquiry`).

## BE-6 — PICA TRANSFORM lead-capture stub (lowest priority)
**Why:** PDF page 1 lists Level 6 PICA TRANSFORM as a project-based tier.
PDF page 8 calls it "Coming soon". A landing-page card + lead capture is
enough for now — no need to model the actual engagement.

- [ ] **Schema:** `TransformInquiry { id, userId?, email, businessName, phone?, message, createdAt, status }`.
- [ ] **Endpoint:** `POST /api/transform/inquiry` (public, unauthenticated OK).
- [ ] **Admin:** `GET /api/admin/transform-inquiries` under a new
  `transform:read` / `transform:write` permission pair, or piggyback on
  `consultations:*` if the client treats it as ops work.
- [ ] **Email:** notify ops on new inquiry (template in `email.service.ts`).

## BE-7 — Tier price reconciliation (touch only if CL-2 / CL-3 land mid-sprint)
- [ ] Update seeded `PlanPrice` for PHASE2A once CL-2 lands.
- [ ] Update seeded `SubscriptionPlan.priceUsd` if CL-3 picks fixed numbers.
- [ ] Update seeded `ConsultationTier.priceUsd` to match PDF (₦30k / ₦50k / ₦75k)
  if currently off.
- *(These are normally admin-UI tasks; only land them as migrations if you
  want the seed values in version control.)*

---

# FRONTEND TASKS

## FE-1 — Phase 2B multi-pillar bundle picker (pairs with BE-1)
**Why:** Today `/dashboard/subscription` (the pay-per-use page) and
`View/PricingView.tsx` (anonymous) let a user buy one pillar at a time. PDF
demands a multi-select bundle with a live discount preview.

- [x] **Multi-select pillar picker** (`PillarPickerModal.tsx`): checkbox grid of
  all 7 pillars, "Select all"/"Clear all" shortcuts, owned pillars disabled with
  an "Already owned" badge.
- [x] **Live total** strip: base × N → discounted total → savings line. Discount
  config pulled from `getPublicPricing().phase2bDiscount` (not hardcoded).
- [x] **Checkout call** sends `pillarIds: string[]`.
- [x] **Coupon flow** keeps working — coupon applies after the bundle discount.
- [x] **Success screen** lists every pillar unlocked.
- [x] **Anonymous pricing page** (`View/PricingView.tsx`): "Bundle & save" discount
  ladder rendered beneath the Phase 2B card.

> Note: live browser click-through of the full Paystack purchase path is still
> unverified — code compiles and both apps typecheck clean.

## FE-2 — Monthly vs Annual subscription toggle ✅ DONE (2026-06-22)
**Why:** No way today to pick annual on `/dashboard/plans`.

- [x] **Billing-interval toggle** at the top of `/dashboard/plans`: pill
  selector "Monthly / Annual". Hidden when no tier has `annualDiscountPct > 0`.
  *(Local component state rather than URL query — simpler; URL persistence
  can be added later if shareable links are needed.)*
- [x] **Card pricing** swaps based on the toggle. "Save X% vs monthly" badge
  on annual using the per-tier `annualDiscountPct`. Cadence label switches
  to "/ year".
- [x] **Subscribe modal** sends `interval` alongside `planId` and `couponCode`.
  Coupon validation uses the discounted annual price as the base.
- [x] **Settings → Billing → Subscription sub-tab** ManageView reads
  `sub.billingInterval`, shows "billed monthly" vs "billed annually" + the
  correct sticker (`stickerUsd` = annual when ANNUAL).
- [x] **Admin tier CRUD** (`/admin/subscription` Subscription Tiers tab):
  "Annual discount (%)" input alongside the monthly price with a live
  preview of the resulting annual sticker.

## FE-3 — Consultation booking shows free-2A bonus ✅ DONE (2026-06-22)
- [x] **Tier cards on `/dashboard/consultation`** render a "+ N free Strategic
  Scans (D days)" chip below the price using `tier.freeP2ARuns` /
  `tier.freeP2ACreditWindowDays`. Chip hides when `freeP2ARuns === 0`.
- [x] **Strategic-scan landing banner** (`/dashboard/strategic-scan`) shows
  "Your consultation credit covers this Strategic Scan — no charge. Valid
  until {date}." when `GET /api/consultation/phase2a-credits` returns a fresh
  credit. Uses the earliest-expiring credit's `expiresAt`.
- [x] **Admin consultation tier form** gains "Free PICA 2A runs per booking"
  and "Credit validity (days)" inputs.

> Optional follow-up (not blocking): a tier-specific copy line on the
> booking success toast after a paid consultation lands. Today the chip
> on the tier card communicates the bonus pre-purchase, which is the
> dominant moment users care about.

## FE-4 — Admin Consultation Notes UI (pairs with BE-4) ✅ DONE (2026-06-22)
- [x] **Admin Consultations Inbox** (`/admin/consultations` →
  `ConsultationsInboxTab` in `_tabs.tsx`): every `BookingRow` gains a
  "View client" button (visible regardless of booking status so notes can
  be saved on ATTENDED/CANCELLED rows too). A right-aligned "Notes saved ·
  {date}" chip appears once an admin has written notes on the row.
- [x] **`ClientHistoryModal`** — sibling of `ConfirmBookingModal`:
  fetches `adminGetClientHistory(bookingId)`, renders user header
  (business name + email + name + client-since date), last-5 assessment
  table (phase, pillar, score, color band, generated date) with per-row
  "Download PDF" anchors pointing at `SessionResult.reportPdfUrl`, plus a
  5000-char textarea + Save button calling
  `adminUpdateConsultationBookingNotes`. Inline "Saved {date} by {name}"
  hint appears post-save; the email-once disclosure is shown beside it.
- [x] **User dashboard** (`/dashboard/consultation` → `BookingCard`):
  when `booking.adminNotes` is non-null, render a collapsed
  "Consultant left feedback" panel with a View notes / Hide toggle. Opens
  to show the full text (`whitespace-pre-wrap`) plus "Updated {date} ·
  {consultant name}".
- [x] **API wrappers:** `lib/api/consultation.ts` adds
  `adminGetClientHistory` + `adminUpdateConsultationBookingNotes` +
  `AdminClientHistoryResponse` / `AdminClientHistoryResult` types and
  extends `ConsultationBookingPayload` with the three public note fields.
  Re-exported automatically through `@/lib/authClient`.

## FE-5 — Tier 3 "From $X" / "Contact sales" display (BLOCKED on CL-3 → BE-5)
- [ ] **(b) Range mode:** plan card renders "From $X / month" with a "Up to $Y"
  tooltip. Subscribe button proceeds as normal.
- [ ] **(c) Custom-quote mode:** plan card replaces price + Subscribe button
  with a "Contact sales" CTA → inline lead form (or modal) posting to the
  new BE-5 endpoint.

## FE-6 — PICA TRANSFORM landing card (pairs with BE-6)
- [ ] **Anonymous pricing page** (`View/PricingView.tsx`): add a 4th section
  below Subscription titled "PICA Transform — Full Business Transformation"
  with a "Request access" CTA → inquiry form.
- [ ] **Dashboard discovery card** on `/dashboard` home: same CTA for
  logged-in users (prefill email + businessName).
- [ ] **Admin Inquiries** screen at `/admin/transform-inquiries` (sidebar
  entry gated by the new permission).

---

# Cross-cutting

- [x] Every new endpoint added to `src/docs/*` (swagger) — payment.docs,
  subscription.docs, consultation.docs updated for the 2026-06-22 batch.
- [x] One logical migration per model group:
  `20260622000000_consult_2a_bonus_annual_billing/migration.sql` covers
  both the consultation 2A bonus and the annual subscription cadence.
  *Migration is NOT yet applied to dev/prod — run `prisma migrate dev`
  (or `migrate deploy`) before merging.*
- [x] No new env vars required — Paystack `annually` reuses
  `PAYSTACK_SECRET_KEY`; plan codes live on `SubscriptionPlan` rows, not env.
- [x] No new admin permission keys — the new endpoints reuse the existing
  `subscriptions:*` / `consultations:*` gates already wired on
  `/admin/subscription-plans` and `/admin/consultation-tiers`.
- [x] Module layout respected — additions stayed in the existing
  consultation, subscription, and payment modules; no new modules created.

**2026-06-22 follow-up (annual-toggle visibility + emphasis):**
- [x] **Monthly/Annual toggle** on `/dashboard/plans` and the anonymous
  `View/PricingView.tsx` was previously hidden by an `annualAvailable`
  guard — invisible to clients on a fresh DB. Reworked: the toggle is
  always rendered, with the Annual side disabled (with a tooltip / nudge
  copy) when no live tier has `annualDiscountPct > 0`. The control is
  larger, bolder, centred above the grid (orange-on-dark active state),
  and each tier card now carries its own Monthly/Annual pill (driving
  the same global state) so the cadence is visible on every box per
  client direction.
- [x] **Hero copy** — replaced "Monthly Plans" badge with "Subscription
  Plans" and the subhead now reads "Pick monthly or annual billing".
- [x] **Checkout modal** — "Monthly price" label swaps to "Annual price"
  on annual; "Then $X every month" footer swaps to "every year".

**Open cross-cutting work (BE-5 / BE-6 dependent):**
- [ ] When BE-6 ships, add the `transform:read` / `transform:write`
  permission keys to `admin.types.PERMISSION_KEYS` + the role-management UI.
- [ ] When BE-5 (option c) ships, the new
  `POST /api/subscription/enterprise-inquiry` endpoint goes in swagger.

---

# Out of scope (admin can do this today from the dashboard)
For reference, the client may also ask for these — point them at the admin UI:

- Editing PICA 2A price → Admin → `/admin/subscription` → Pay-Per-Use tab.
- Editing per-pillar Phase 2B base price → same tab.
- Editing subscription tier monthly price / quotas / features → Subscription Tiers tab.
- Editing consultation tier price / duration / features → Consultation Tiers tab.
- Editing USD→NGN FX rate → Settings → App Settings.
- Turning Pay-Per-Use or Subscription sections on/off → Settings → App Settings.
- Confirming + scheduling consultation bookings → `/admin/consultations`.
