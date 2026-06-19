# PICA — Pricing Model Gap Implementation Plan

> Scope: changes required by the official `PICA PRICING MODEL FOR DEVELOPERS.pdf`
> that cannot be solved from the existing admin dashboard.
> Cosmetic / numerical edits (prices, quotas, feature bullets, FX rate, section
> on/off toggles, tier display order) are intentionally **excluded** — the admin
> can already do those today via Settings → App Settings, `/admin/subscription`
> tier tabs, and `/admin/consultations`.
> Last updated 2026-06-17.

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

### CL-1 — "90-Day Free PICA™ 2A Access" consultation bonus
PDF page 6 grants every consultation tier (₦30k, ₦50k, ₦75k) "90-Day Free PICA™ 2A Access". This is almost certainly a copy/paste artefact — three issues:
1. PICA 2A is a one-off paid PDF (page 2 rule says "session ends" after download). "90 days of access" doesn't map.
2. All three tiers grant identical bonus despite 2.5× price difference — unusual.
3. The phrase is ambiguous between (a) a free 2A *credit* valid 90 days, (b) "dashboard access" (already free for logged-in users), or (c) leftover copy from a prior draft.

Ask the client all three at once:
> "On the consultation tiers, 'SaaS Platform Bonus: 90-Day Free PICA 2A Access' —
> does this mean (a) one free PICA 2A report credit valid for 90 days from booking,
> (b) the bonus should scale by tier (e.g. Option 1 = 1 credit, Option 3 = 3 credits),
> or (c) we should drop it as placeholder copy? Today it's listed identically on
> all three tiers, which we'd expect to differ."

**Do not build this until CL-1 is resolved.** Stub holder: BE-3 below.

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

## BE-2 — Annual subscription billing cycle
**Why:** PDF page 9–10 explicitly mentions *"For Annual Subscription, access is
valid for one year"* on every tier. Today `UserSubscription.currentPeriodEnd`
rolls 30 days from each charge; there's no annual concept.

- [ ] **Schema:**
  - `SubscriptionPlan.billingInterval` enum (`MONTHLY`, `ANNUAL`) — default `MONTHLY`.
    OR split: keep one plan row but add `priceUsdAnnual Decimal?`,
    `paystackPlanCodeUsdAnnual String?`, `paystackPlanCodeNgnAnnual String?`.
    Recommend the second shape — one logical "Starter" with two billing options,
    not two separate plan rows the admin has to mirror.
  - `UserSubscription.billingInterval` — snapshot at subscribe time so a plan
    price change doesn't retroactively re-bill.
  - Migration: `prisma/migrations/<ts>_subscription_annual_interval/migration.sql`.
- [ ] **Paystack plan creation** in `paystack.service.ts`: eagerly create the
  USD annual plan when admin saves a tier; lazily create NGN annual on first NG
  annual subscriber (mirrors the current monthly flow).
- [ ] **Subscribe endpoint** (`POST /api/subscription/subscribe`): accept
  `interval: 'MONTHLY' | 'ANNUAL'`; pick the right Paystack plan code; persist
  on the new `UserSubscription.billingInterval` column.
- [ ] **Period roll** in `handleSubscriptionChargeSuccess` and
  `expireLapsedSubscriptions`: 30 days for monthly, 365 days for annual.
- [ ] **Quota meaning:** quotas in `SubscriptionPlan` are `*PerMonth` today.
  Decide: do annual subscribers get `12 × monthly` upfront, or
  `monthly` quota that resets every 30 days inside the annual term?
  Recommend the latter — matches PDF's monthly cadence emphasis on page 9 and
  keeps the existing `SubscriptionUsage(periodStart)` model intact.
- [ ] **Frontend `GET /subscription/plans`:** return both prices side-by-side
  so the FE can render a monthly/annual toggle.
- [ ] **Admin tier CRUD:** add `priceUsdAnnual` to the create/update Zod schemas.
- [ ] **Docs:** `src/docs/subscription.docs.ts` — update plan + subscribe payloads.

## BE-3 — Consultation → free PICA 2A credit grant (BLOCKED on CL-1)
**Why:** PDF page 6 lists "90-Day Free PICA 2A Access" as a bonus on all three
consultation options. Awaiting CL-1 clarification before building. Shape the
work once the client answers:

- [ ] **If CL-1 = "one free 2A credit per consultation, valid 90 days":**
  - New `Phase2ACredit` table: `userId`, `expiresAt`, `consultationBookingId?`,
    `consumedAt? + consumedPaymentId?`.
  - On `confirmConsultationBooking`, insert a credit with
    `expiresAt = now + 90d` (gated by tier if the answer is "scales by tier").
  - In `initPaymentService` Phase 2A branch: before falling through to
    subscription quota, look for an unconsumed un-expired `Phase2ACredit` —
    if found, short-circuit to $0 Payment + mark `consumedAt`.
- [ ] **If CL-1 = "drop":** mark this section closed in code review notes.
- [ ] **If CL-1 = "scales by tier":** add `creditsGranted Int` column on
  `ConsultationTier`, default 1 / 2 / 3 (or whatever the client says).

## BE-4 — Tier 3 consultation "30-Day Checkpoint" follow-up
**Why:** PDF page 5 says Option 3 (₦75k) includes a *separate* 30-day
follow-up session. Today `ConsultationBooking` is flat — one row per session.

- [ ] **Schema:**
  - `ConsultationBooking.parentBookingId String?` self-FK with
    `relation("CheckpointChild", fields: [parentBookingId], references: [id])`.
  - `ConsultationBooking.isCheckpoint Boolean @default(false)`.
  - `ConsultationTier.includesCheckpoint Boolean @default(false)` — admin-editable.
  - Migration: `prisma/migrations/<ts>_consultation_checkpoints/migration.sql`.
- [ ] **Confirm flow** in `confirmConsultationBookingService`: after the
  primary booking is CONFIRMED, if the tier has `includesCheckpoint = true`,
  insert a child REQUESTED row with `parentBookingId = primary.id`,
  `isCheckpoint = true`, and a suggested `scheduledAt` 30 days out (admin
  re-confirms with actual meeting link later).
- [ ] **Admin inbox UI:** group child booking visually under its parent;
  prevent confirming a checkpoint whose parent is still REQUESTED / cancelled.
- [ ] **User dashboard:** surface the checkpoint as a linked "follow-up
  session" chip on the primary booking row.
- [ ] **Docs:** `src/docs/consultation.docs.ts` — describe parent/child shape.

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

## FE-2 — Monthly vs Annual subscription toggle (pairs with BE-2)
**Why:** No way today to pick annual on `/dashboard/plans`.

- [ ] **Billing-interval toggle** at the top of `/dashboard/plans`: pill
  selector "Monthly / Annual". Persists in URL query (`?interval=annual`)
  so the user can share the page in their chosen view.
- [ ] **Card pricing** swaps based on the toggle. Show "Save X%" badge on the
  annual option computed from `(monthly × 12 − annual) / (monthly × 12)`.
- [ ] **Subscribe modal** sends `interval` alongside `planId`.
- [ ] **Settings → Billing → Subscription sub-tab** ManageView shows the
  user's actual cadence + next renewal correctly when annual.
- [ ] **Admin tier CRUD** (`/admin/subscription` Subscription Tiers tab):
  add an Annual price input next to the existing USD price.

## FE-3 — Consultation booking shows free-2A bonus (BLOCKED on CL-1 → BE-3)
- [ ] Once CL-1 resolves and BE-3 ships: success-modal copy on
  `/dashboard/consultation` after a booking explains the free 2A credit
  (count + expiry). Banner on `/dashboard/strategic-scan` Phase 2A start
  CTA when the user has an unconsumed credit ("Your consultation bonus
  covers this — no charge").

## FE-4 — Checkpoint follow-up display (pairs with BE-4)
- [ ] **Consultation page bookings panel**: render checkpoint child as an
  indented row under its parent with an "Auto-scheduled 30 days after primary"
  hint chip.
- [ ] **Admin Consultations Inbox** (`/admin/consultations`): show
  parent/child grouping; surface a warning if a checkpoint is approaching
  without a confirmed meeting link.

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

- [ ] Every new endpoint added to `src/docs/*` (swagger).
- [ ] Every new admin permission key added to the role-management UI.
- [ ] Every new env var (Paystack annual plan ids, etc.) goes through
  `Config/env.ts getEnv()`.
- [ ] One logical migration per model group; verify on the `@prisma/adapter-pg`
  setup before merging.
- [ ] Follow the established module layout:
  `module/<name>/<name>.{controller,service,routes,types}.ts`, Zod-validated
  controllers, services using Prisma `select`, `AppError` + http constants.

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
