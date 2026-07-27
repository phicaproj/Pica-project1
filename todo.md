# PICA — UAT (UI/UX Phase) Feedback: Audit & Action Plan

> Source: `PICA_UI-UX_Review_Comments.pdf` (client UAT feedback, 2026-07-26).
> This file audits **each** feedback item against the actual codebase and marks a
> verdict:
>
> - ✅ **DONE** — already implemented correctly; feedback is stale or was a
>   misobservation.
> - 🔴 **TODO** — real gap; needs work. Evidence + root cause below.
> - ⚠️ **NUANCED / INVALID** — the client's _diagnosis_ is technically wrong, but
>   there is often a legitimate underlying ask. Read the note before building.
>
> Backend = Express + Prisma + Zod (`backend/`). Frontend = Next.js (`my-app/`).
> All file:line references verified against current `main` (commit `1079534`).

---

## Scorecard

| #   | Item                                          | Verdict    | Priority     |
| --- | --------------------------------------------- | ---------- | ------------ |
| 1.1 | Session bleed / data leakage                  | 🔴 TODO    | **Critical** |
| 1.2 | Mandatory email verification                  | 🔴 TODO    | **Critical** |
| 1.3 | Auth for profile changes                      | ⚠️ NUANCED | High         |
| 1.4 | Missing legal pages (T&C / Privacy)           | 🔴 TODO    | **Critical** |
| 1.5 | Auto log-out after inactivity                 | 🔴 TODO    | High         |
| 2.1 | Registration fields (name/staff/sector/years) | 🔴 TODO    | High         |
| 2.2 | Profile data sync                             | ⚠️ NUANCED | High         |
| 2.3 | Settings tab missing (top-right)              | 🔴 TODO    | Medium       |
| 3.1 | Presentation vs Full PDF identical            | ⚠️ NUANCED | High         |
| 3.2 | Two reports generated per completion          | ⚠️ NUANCED | Medium       |
| 3.3 | Strategic Roadmap truncation                  | 🔴 TODO    | High         |
| 3.4 | Exec Summary at end of report                 | ⚠️ INVALID | Low          |
| 3.5 | Remove "Phase 2A/2B" nomenclature             | 🔴 TODO    | Medium       |
| 4.1 | Pricing copy: repeated "modules"              | 🔴 TODO    | Low          |
| 4.2 | Consultant calendar broken                    | 🔴 TODO    | **Critical** |
| 4.3 | Consultant mapping / routing error            | 🔴 TODO    | **Critical** |
| 4.4 | Booking button alignment                      | 🔴 TODO    | Low          |
| 5.1 | Separate admin login portal                   | 🔴 TODO    | Medium       |

---

# 1. Critical Priority: Data Integrity & Account Security

## 1.1 — Session Bleed / Data Leakage 🔴 TODO

**Client:** A free scan for one company loaded for a _different_ company after
signing up with a new email on the same laptop.

**Verdict: REAL and serious.** Two compounding defects — a client-side one and a
server-side one that is worse.

**Defect A — global localStorage session pointer, never cleared on account switch:**

- Anonymous Phase-1 sessionId is stored under a single global key
  `LAST_SESSION_ID_KEY = 'pica.lastSessionId'` — `my-app/lib/api/config.ts:20`.
- Written on free-scan start: `setLastSessionId(data.sessionId)` —
  `my-app/app/View/GeneralTestView.tsx:1016`.
- Dashboard reads whatever is there and fetches its result:
  `getLastSessionId()` → `fetch(.../result/${sessionId})` —
  `my-app/app/dashboard/page.tsx:761,836`.
- The key is **only** removed inside `clearSession()` (`config.ts:100`), which
  runs on logout / 401. It is **NOT** cleared on login or signup:
  `setSession()` writes tokens but never touches `pica.lastSessionId`
  (`config.ts:72-77`, `my-app/lib/api/auth.ts:135-137`).
- ⇒ Company A's stale pointer survives a new signup on the same browser and
  Company B sees A's scan.

**Defect B — the result endpoint has NO auth and NO ownership check (worse):**

- `resultRouter.get('/:sessionId', getResult)` — **no middleware** —
  `backend/src/module/result/result.routes.ts:16`.
- `getResultService(sessionId)` looks up purely by sessionId; never takes/checks
  a userId — `backend/src/module/result/result.service.ts:29-130`.
- ⇒ **Any** sessionId is publicly readable by anyone. This is an IDOR, not just
  a caching bug. (Phase 2A/2B reads _are_ ownership-checked —
  `assessment.service.ts:266-267` — so the gap is specific to Phase-1 results.)

**Fix:**

- [ ] Clear `pica.lastSessionId` on login, signup, and inside `setSession()`;
      ideally namespace the key per authenticated user.
- [ ] Gate `GET /result/:sessionId`: `softAuthenticate` + ownership match
      (`session.userId === req.user.id`, or match anonymous sessions by
      `leadEmail`). Reject cross-owner reads with 403/404.

---

## 1.2 — Mandatory Email Verification 🔴 TODO

**Client:** Email verification must occur _before_ full access.

**Verdict: REAL.** The field exists but the flow does not.

- `isVerified Boolean @default(false)` exists — `backend/prisma/schema.prisma:315`.
- `registerService` sends only a welcome email — no token, no verification email
  — `backend/src/module/auth/auth.service.ts:149-154`.
- `loginService` does **not** check `isVerified`; only blocks `DISABLED`
  accounts — `auth.service.ts:204-206`. A brand-new unverified user gets full
  tokens (`:240-260`).
- The one "verify" endpoint `POST /user/verify-email` just flips the flag with
  **no token/code** — it trusts the caller — `user.service.ts:120-147`. Not real
  proof of email ownership.

**Fix:**

- [ ] Issue a signed, expiring verification token at registration; email a
      verification link.
- [ ] Real `verify-email` that validates the token before setting `isVerified`.
- [ ] Gate access on `isVerified` (block login or restrict to a
      "verify your email" state until confirmed). Add resend-verification.

---

## 1.3 — Authentication for Profile Changes ⚠️ NUANCED

**Client:** Username & Business Name are editable _without authentication_.

**Verdict: The literal claim is FALSE; the underlying ask is valid.**

- Both mutation endpoints sit behind JWT auth:
  `userRouter.patch('/profile', authenticate, ...)` and
  `.patch('/business', authenticate, ...)` — `backend/src/module/user/user.routes.ts:16-17`.
  `authenticate` rejects missing/expired tokens and disabled accounts
  (`authMiddleware.ts:74-110`); the service scopes every write to the token's
  userId. **There is no anonymous edit path.**
- **Legitimate nuance:** there is no _step-up re-verification_ (auth email / OTP)
  for sensitive changes. Notably an email change resets `isVerified=false`
  (`user.service.ts:24-37`) but sends **no** confirmation to old or new address.

**Fix (reframed):**

- [ ] make the email field from the profile page not editable, if clicked, ask user to contact support if they want to change email address
- ~~"Add authentication to profile edits"~~ — already present; do not rebuild.

---

## 1.4 — Missing Legal Pages (Terms & Conditions / Privacy Policy) 🔴 TODO

**Client:** T&C and Privacy Policy pages 404. Hard regulatory blocker.

**Verdict: REAL.** Live consent-gate links point to non-existent routes.

- Signup consent checkbox links: `href="/terms"` (`signup/page.tsx:289`) and
  `href="/data-policy"` (`signup/page.tsx:296`).
- No `app/terms`, `app/data-policy`, or `app/privacy` directories exist ⇒ both
  resolve to Next.js 404 on the mandatory "I agree" gate.
- Related dead references (not the 404 source, but clean up once pages exist):
  footer anchors use `href="#"` (`login/page.tsx:229-239`, `signup/page.tsx:353`,
  `verify-code/page.tsx:211`, `forget-password/page.tsx:105`);
  `dashboard/layout.tsx:215` renders `PRIVACY POLICY` as a plain `<span>`.

**Fix:**

- [ ] Create `/terms` and `/data-policy` (and `/privacy` if referenced) pages
      with real content.
- [ ] Point all footer/dead `#` anchors at the new routes.

---

## 1.5 — Auto Log-out After Inactivity 🔴 TODO

**Client:** Auto-logout after a defined idle period (e.g. 15 min).

**Verdict: REAL — none exists, and token TTLs are far too long to serve as one.**

- `JWT_ACCESS_EXPIRE=14d`, `JWT_REFRESH_EXPIRE=30d` — `backend/.env:6-7`
  (applied `generateToken.ts:43,77`). Expiry-driven logout effectively never
  fires mid-session.
- Tokens live in `localStorage` (`config.ts:74-76`) — persist across restarts.
- No inactivity timer / `visibilitychange` / activity listener anywhere in FE.
  Only reactive clear is on a 401 (`config.ts:153`), which rarely triggers with
  14-day tokens.

**Fix:**

- [ ] Add a frontend idle-timer (reset on activity) that calls `clearSession()`
     - redirect after N minutes.
- [ ] Shorten access-token TTL (e.g. 15–60 min) and lean on refresh rotation;
      consider tab-scoped storage.

---

# 2. User Onboarding & Profile Sync

## 2.1 — Registration Fields 🔴 TODO

**Client:** Sign-up must include mandatory: Contact person name, Staff size,
Sector, Years in operation.

**Verdict: REAL** (these were deliberately moved off signup, but the client wants
them back on the front door).

| Field               | Sign-up form | Register schema | Lead form (free scan) | DB column                                          |
| ------------------- | ------------ | --------------- | --------------------- | -------------------------------------------------- |
| Contact person name | ✗            | ✗               | ✗                     | none (only `firstName`/`lastName`, never captured) |
| Staff size          | ✗            | optional        | **required**          | `staffSize?`                                       |
| Sector (industry)   | ✗            | optional        | **required**          | `industry?`                                        |
| Years in operation  | ✗            | optional        | **required**          | `operatingYears?`                                  |

- Sign-up form has only `businessName, email, phone, password` —
  `signup/page.tsx:64-69` (comment at `:59-63` says profile fields were moved to
  dashboard).
- Register schema: `auth.types.ts:10-37` (staff/industry/years all optional; no
  contact-person field).
- The three are mandatory **only** on the free-scan lead form
  (`GeneralTestView.tsx:969-987`). Contact person name exists nowhere.

**Fix:**

- [ ] Add the 4 fields to the sign-up form + make required.
- [ ] Make them required in `registerSchema` (`auth.types.ts`).
- [ ] Add a contact-person-name column (or repurpose `firstName`/`lastName`) and
      persist it. Migration needed.

---

## 2.2 — Profile Data Sync ⚠️ NUANCED

**Client:** Registration data not syncing to profile; profile edits fail to
update.

**Verdict: The persistence layer is CORRECT; the symptom is a UI bug.**

- Registration write, `meService` read, and both PATCH writes all use the same
  `User` model (`auth.service.ts:117-142`, `:571-635`; `user.service.ts:39-60`,
  `:87-115`). Endpoints wired (`user.routes.ts:16-17`), FE sends correct payloads
  (`lib/api/user.ts:9-35`), and settings re-fetches via `getMe()` after save.
  **Edits do persist.**
- **Actual cause of the "not syncing" perception — hardcoded placeholder
  defaults** masking real/empty values in the Business Info tab:
  `settings/page.tsx:594-600` (and mirror `:634-640`) default businessName to
  `"Aether Dynamics Global"`, industry `"Aerospace & Engineering"`, staff `"248"`,
  revenue `"$10M - $50M"`.
- Compounded by name never captured at signup (see 2.1) so name fields read
  blank. Secondary: on `getMe()` failure it falls back to `getStoredUser()`
  which lacks business fields (`:106-108`).

**Fix (reframed):**

- [ ] Remove hardcoded placeholder defaults at `settings/page.tsx:594-600` &
      `:634-640`; use empty strings so real (or genuinely empty) values show.
- [ ] Capture name at signup (ties to 2.1) so Profile isn't blank.
- ~~"Fix broken data binding"~~ — binding is fine; don't chase a phantom.

---

## 2.3 — Settings Navigation 🔴 TODO

**Client:** "Settings" tab missing from top right-hand corner.

**Verdict: REAL (placement).** Settings exists but only in the left sidebar.

- Settings is in `NAV_SUPPORT`, rendered in the sidebar Support group —
  `dashboard/layout.tsx:41,188-192`.
- The top-right header (`:136-160`) has only a bell + a **non-interactive** avatar
  `div` (no onClick, no Link, no dropdown).

**Fix:**

- [ ] Make the header avatar a dropdown menu (Settings + Logout) linking to
      `/dashboard/settings`, in the top-right corner.

---

# 3. PDF Reporting Engine

Primary file: `backend/src/service/shared/pdf.service.ts`. Delivery:
`assessment.service.ts` / `result.service.ts`.

## 3.1 — Presentation vs Full PDF Identical ⚠️ NUANCED

**Client:** Presentation and Full PDFs generate identical output; Full must pull
more content.

**Verdict: The observation is accurate but the mental model is wrong — there is no
"Full vs Presentation" content architecture.**

- Two builders exist: `generateReportPDF` (full multi-page, `pdf.service.ts:3264`)
  and `generateSnapshotPDF` (single-page free-tier snapshot, `:3363`, Phase-1
  only).
- What the client calls "Presentation" is **the same `generateReportPDF` rendered
  in a dark theme**, toggled by a query param: `theme = req.query.theme === 'dark'`
  (`result.controller.ts:41`); `-presentation` filename suffix only when dark
  (`result.service.ts:327`); both themes call the same builder
  (`result.service.ts:349-363`). Only the color palette differs
  (`getThemeColors`, `:39`).

**Fix (product decision needed):**

- [ ] Decide what "Full" vs "Presentation" should actually mean. If Presentation
      = condensed/branded deck and Full = detailed doc, build a genuinely distinct
      condensed builder — this is **net-new**, not a bug fix. Confirm scope with
      client before building.

---

## 3.2 — Multiple Reports Generated ⚠️ NUANCED

**Client:** Two reports (same content, different formats) transmitted per
completion; make it one by default with a format choice.

**Verdict: Only ONE PDF is generated/emailed at completion.**

- `deliverReportInBackground` generates exactly one buffer via a ternary
  (Phase-1 → snapshot, else → full), uploads once, emails once —
  `assessment.service.ts:408-419,423,436`.
- The "two reports" the client sees are the **light + dark theme download
  options** surfaced later at download time (`result.service.ts:333-363`) — same
  content, two palettes.

**Fix (reframed):**

- [ ] Backend already defaults to one. Add an explicit **format picker** at
      download (light/dark, or real formats once 3.1 is decided) instead of
      presenting two look-alike downloads.

---

## 3.3 — Formatting & Truncation (Strategic Roadmap) 🔴 TODO

**Client:** Report text truncated; Strategic Roadmap layout cuts off.

**Verdict: REAL — confirmed fixed-height boxes with hard ellipsis clipping, no
pagination.**

- Roadmap box is a fixed 125px `roundedRect` anchored near page bottom
  (`pdf.service.ts:2118-2128`), a 2×2 grid at fixed ~38px row offsets (`:2152-2156`).
- Every text call uses fixed `height` + `ellipsis:true`: title `height:10`
  (`:2177`), action items `height:14` (`:2195-2200`), recommendation `height:20`
  (`:2206-2211`). Anything longer is silently cut with "…".
- Same pattern truncates the pillar observation cards above (`obsH=92` fixed,
  `:2065`; body `height:50` ellipsis, `:2111-2112`).

**Fix:**

- [ ] Replace fixed-height + ellipsis with dynamic measured height + text
      wrapping; paginate/overflow to a new page when content exceeds the box.

---

## 3.4 — Executive Summary Position ⚠️ INVALID

**Client:** Executive Summary generates at the _end_; move to the beginning.

**Verdict: FALSE — it's already Page 2 (right after the cover).**

- Order in `generateReportPDF` (`:3305-3350`): Cover → **Executive Summary**
  (`:3308-3312`) → 7 Pillars → Next Steps → Legal → Closing → Spider Graph.
- What renders **last** is the "Analytical Annex / PICA Diagnostic Visualization"
  page whose card is titled **"EXECUTIVE PERFORMANCE SUMMARY"** (`:3023`) — a
  naming collision the tester almost certainly mistook for the Exec Summary.

**Fix:**

- [ ] No reorder needed. Rename the end-page card (`pdf.service.ts:3023`) to
      avoid the "Executive Summary" collision (e.g. "Performance Snapshot").

---

## 3.5 — Outdated Nomenclature ("Phase 2A / 2B") 🔴 TODO

**Client:** Remove all "Phase 2A & 2B" text references across reports and
platform; use the agreed commercial names.

**Verdict: REAL — many user-facing strings remain.** (Agreed labels:
Phase 1 → "Business Snapshot", 2A → "Strategic Scan", 2B → "Deep Dive Module".)

**In generated PDFs (`pdf.service.ts`):**

- `phaseLabel()` → "PICA Level 2A – Structured Diagnosis" / "…2B – Deep Dive"
  (`:129-130`), rendered on cover (`:720`) + PDF metadata Subject (`:3283`).
- Next Steps copy: `:2341-2342`, `:2345`, `:2347-2350`, `:2357`, `:2514`.
- Closing text: `:2879` ("PICA Level 2A operational assessment").

**In frontend (user-facing, excluding admin & enum identifiers):**

- `dashboard/insights/page.tsx:119,125` — "PHASE 1: DIAGNOSTIC" / "PHASE 2:
  INTEGRATION" roadmap list (confirm if these are assessment phases or generic
  roadmap copy).
- `dashboard/consultation/page.tsx:1766` — hardcoded `Phase 2A/2B`, bypasses
  `getPhaseLabel()`.
- Email templates: `backend/src/service/shared/email.service.ts` — needs a pass.

**Note:** Most FE already routes through `my-app/lib/phaseLabels.ts`
`getPhaseLabel()` — leave those. Do **not** rename internal enum identifiers
(`PHASE2A`, `PHASE2B_PILLAR`), route paths, or code comments. Admin dashboard
(`app/admin/**`) intentionally keeps raw phase names — leave it.

**Fix:**

- [ ] Replace the PDF display strings above with the agreed labels (add a helper
      mirroring FE `phaseLabels`).
- [ ] Fix the 3 stray FE strings and email templates.

---

# 4. Commercial Pricing & Consultant Booking Flow

## 4.1 — Pricing Copy: repeated "modules" 🔴 TODO

**Client:** Remove repeated "modules" in the 2nd bullet of each consultancy pack;
remove residual Phase 2A/2B in plan descriptions.

**Verdict: "modules" duplication REAL; Phase-2A/2B-in-copy is INVALID.**

- `dashboard/plans/page.tsx:496`:
  `label={`${getPhaseLabel("PHASE2B")} Modules`}` → `getPhaseLabel("PHASE2B")`
  returns `"Deep Dive Module"` (`phaseLabels.ts:4`) ⇒ renders **"Deep Dive Module
  Modules"**. Public `PricingView.tsx:410` is fine (hardcoded "Deep Dive
  Modules").
- No hardcoded "Phase 2A/2B" in customer plan cards — all via `getPhaseLabel()`.
  `plan.description` is admin-authored DB data (`plans/page.tsx:488`), so any
  residual phase text lives in the DB, not code.

**Fix:**

- [ ] Change `plans/page.tsx:496` label to `"Deep Dive Modules"` (or
      `getPhaseLabel("PHASE2B") + "s"`).
- [ ] Audit DB plan `description` values for stray "Phase 2A/2B" (data, not code).

---

## 4.2 — Consultant Calendar Bug 🔴 TODO

**Client:** Calendar is broken, won't open to future dates.

**Verdict: REAL — it's a hardcoded mock, not a real date picker.**
`my-app/app/dashboard/consultation/page.tsx`:

- Header hardcoded `September 2024` (past month) — `:1167`.
- Grid is `Array.from({ length: 14 })` — only days 1–14, no month nav — `:1181-1208`.
- Only 4 days selectable: `[4,5,11,12].includes(dayNum)` — `:1184`; all others
  disabled (`:1191,1198`).
- `selectedDate` defaults to `new Date().getDate()+1` (often a non-selectable
  cell) — `:1234`; submit builds `September ${selectedDate}, 2024` — `:419`.

**Fix:**

- [ ] Replace with a real date-picker bound to `selectedDate`, current month,
      future-date availability, and wire the chosen date into the booking payload.

---

## 4.3 — Consultant Mapping / Routing Error 🔴 TODO

**Client:** Dashboard showed a different consultant than selected; selecting a
consultant throws an error.

**Verdict: REAL — two distinct root causes.**
`my-app/app/dashboard/consultation/page.tsx`:

**(a) Wrong consultant displayed** — bookings persist only a _tier_, never the
chosen expert. 6 experts share 3 tiers, and rendering re-derives the expert by
first tier match:

- `EXPERTS.find((e) => e.tier === b.tier.tier) || EXPERTS[0]` — `:567-568`,
  and repeated at `:1508-1509`, `:1614-1615`.
- `handleBookSubmit` sends only `tierId/topic/notes/preferredTimes` — never
  `selectedExpert.id` (`:421-427`); backend `ConsultationBooking` has no expert
  field (`consultation.service.ts:444-456`). ⇒ booking Amara Okafor (tier 3)
  shows Dr. Aris Thorne (first tier-3 expert).

**(b) Error on selection** — hardcoded expert `tier: 1|2|3` mapped to admin-defined
DB tiers that may not be 1/2/3:

- `getDbTierForExpert = (e) => tiers.find(t => t.tier === e.tier) || tiers[0] || null`
  — `:338-340`. On mismatch → `null` → submit throws "Consultation tiers are
  currently unavailable." (`:408-410`); or a stale `tierId` → backend 404
  (`consultation.service.ts:407-410`).

**Fix:**

- [ ] Persist the selected consultant identity (add expert field to
      `ConsultationBooking`, send `selectedExpert.id`), or make experts 1:1 with tiers.
- [ ] Bind experts to real tier IDs fetched from the API instead of hardcoded
      `tier` numbers; handle empty/stale tiers gracefully.

---

## 4.4 — Action Button Alignment 🔴 TODO

**Client:** Move "Booking fee" to the top; align "Back to Expert" on the same
level as "Booking Fee", "Confirm", "Cancel".

**Verdict: REAL (layout).** `consultation/page.tsx` Step-2 form (`:1141-1358`):

- "← Back to experts" is at the **top** header block (`:1145-1151`) — outside the
  footer bar.
- Footer (`:1312`, `justify-between`) holds "Booking fee" as a **text span**
  (`:1322-1335`) + Cancel (`:1341-1347`) + Confirm (`:1348-1355`).

**Fix:**

- [ ] Move the "Booking fee" element to the top of the interface.
- [ ] Move "Back to experts" into the footer flex row (`:1312`) so it aligns with
      Confirm/Cancel. (Note: "Booking fee" is currently plain text — style as a
      button if the client expects one.)

---

# 5. General Admin & Interface Layout

## 5.1 — Separate Admin Login Portal 🔴 TODO

**Client:** Create a separate, isolated interface/portal for Admin Login.

**Verdict: REAL — no separate portal today (shared login + role routing + OTP).**

- No `app/admin/login` route exists. Admins & users use the same
  `Auth/login/page.tsx`.
- Backend returns `requiresOtp: true, role: 'ADMIN'` for admins
  (`lib/api/auth.ts:105-119`); login handler redirects admins to the shared OTP
  page `type=admin-login` (`login/page.tsx:75-80`), which routes to `/admin`
  (`verify-code/page.tsx:68-82`).
- Admin route protection is **client-side only** — a `useEffect` in
  `admin/layout.tsx:67-94` reads localStorage and redirects non-admins. No
  `middleware.ts` at the `my-app` root.

**Fix:**

- [ ] Build a dedicated admin login route/page (isolated UI).
- [ ] (Recommended, security) Add server-side route protection (Next middleware
      or server checks) rather than relying solely on a client `useEffect`.

---

## Suggested build order

1. **Security-critical first (client gate + liability):** 1.1 session bleed/IDOR,
   1.4 legal pages, 4.2 calendar, 4.3 consultant routing.
2. **Auth hardening:** 1.2 email verification → 1.3 step-up on email change →
   1.5 idle logout.
3. **Onboarding:** 2.1 registration fields (migration) → 2.2 remove placeholder
   defaults → 2.3 settings dropdown.
4. **PDF:** 3.3 truncation fix, 3.5 nomenclature, 3.4 rename annex; then decide
   3.1/3.2 (product call — Full vs Presentation semantics + format picker).
5. **Copy/layout polish:** 4.1 "modules", 4.4 button alignment.
6. **Admin:** 5.1 separate portal + server-side guard.

## Items needing a product/client decision before building

- **3.1 / 3.2** — What should "Full" vs "Presentation" actually contain? Today
  they differ only by color theme. This is net-new content design, not a bug.
- **3.5 / insights** — Are `insights/page.tsx` "PHASE 1/2/3 (DAY x-y)" strings
  the assessment phases or generic roadmap copy? Rename only if the former.
- **2.1** — Confirm "contact person name" should be a new field vs reusing
  `firstName`/`lastName`.
