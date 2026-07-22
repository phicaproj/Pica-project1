# PICA — 2026-07-10 Change Request Implementation Plan

> Scope: six client-requested changes captured on 2026-07-10. Each feature is
> split into **BACKEND (BE)** and **FRONTEND (FE)** steps so we can ship them
> stage by stage. Do NOT start coding a stage until the one above it is
> confirmed working.
>
> Locked design decisions (2026-07-10):
> - **Phase display names (FE only, NOT admin dashboard):**
>   Phase 1 → **"Business Snapshot"**, Phase 2A → **"Strategic Scan"**,
>   Phase 2B → **"Deep Dive Module"**.
> - **Knockout scoring:** *gate + still scored* — a knockout question's
>   0-answer flags the knockout AND its score still contributes to the pillar.
> - **Phase 1 question pull:** N total, spread as evenly as possible across the
>   7 pillars, randomly picked within each pillar, re-randomized and snapshotted
>   per session (same freezing mechanism Phase 2A already uses).
> - **Knockout admin UI:** distinct "Add knockout question" action per phase
>   (2A live now, 2B build-but-off), each knockout question has its own
>   "show on Phase 1" toggle.
> - **Knockout + Phase 1:** knockout questions flagged `showOnPhase1` are ALWAYS
>   included in a Phase 1 session, in addition to (not counted within) the
>   random general-question pull.

---

## Feature 1 — Separate, admin-managed KNOCKOUT questions

**Problem:** Today ANY answer that scores 0 is treated as a knockout
(`deriveRiskType` in `question.admin.service.ts:31` returns `KNOCKOUT` for
`score === 0`; scoring reads `riskTypeAtTime === KNOCKOUT`). The client wants
knockouts to be **separate dedicated questions**. A general question scoring 0
must NO LONGER trigger a knockout. Knockout questions still use the existing
"0-score option = trigger" mechanic, but only knockout questions can fire.

### BE-1 — Backend
- [ ] **Schema:** add to `Question` model (`prisma/schema.prisma:238`):
  - `isKnockout Boolean @default(false) @map("is_knockout")`
  - `showOnPhase1 Boolean @default(false) @map("show_on_phase1")` (only
    meaningful when `isKnockout = true`).
  - Keep `phase` (a knockout question is created against PHASE2A or PHASE2B).
- [ ] **Migration:** one migration `.../<ts>_knockout_questions/migration.sql`.
  Backfill: set `isKnockout = false` for all existing rows (default handles it).
  **Decision needed at build time:** do existing 0-score general questions get
  auto-converted to knockout, or left as plain scored questions? Default plan =
  leave them as plain questions (client said knockouts are "different from the
  general question").
- [ ] **Risk-type derivation change** (`question.admin.service.ts:31`
  `deriveRiskType`): only emit `RiskType.KNOCKOUT` when the parent question has
  `isKnockout = true`. For general questions, a 0-score option becomes the
  lowest `RISK` tier, NOT `KNOCKOUT`. Update `resyncOptionRiskTypes` and the
  `hasKnockoutOption` flag logic accordingly (rename intent: it now means "this
  knockout question has its trigger option").
- [ ] **Create/update question services** (`question.admin.service.ts:266` /
  `:324`): accept `isKnockout` + `showOnPhase1`. Validate a knockout question
  has exactly one 0-score trigger option. Guard: `showOnPhase1` only settable
  when `isKnockout = true`.
- [ ] **Zod schemas** (`question.types.ts:141` create / `:186` update): add
  `isKnockout` + `showOnPhase1`; add the trigger-option validation refinement.
- [ ] **Scoring** (`scoring.service.ts`): `determineInsightRule` (`:102`) and
  pillar scoring (`:322`) already key off `riskTypeAtTime === KNOCKOUT`. Because
  derivation now restricts KNOCKOUT to knockout questions, this keeps working —
  but VERIFY the knockout question's score still adds to the pillar weighted
  score (decision = "gate + still scored", so do NOT exclude it from the sum).
- [ ] **Docs:** update `src/docs/*` (question/admin) for the new fields.

### FE-1 — Frontend
- [ ] **Admin question management** (`my-app/app/admin/.../questions` UI +
  `lib/api`): add a distinct **"Add knockout question"** action. Phase selector
  limited to Phase 2A (default) and Phase 2B. Under each knockout question, a
  **"Show on Phase 1"** toggle. Phase 2B knockouts can be created/saved but the
  feature stays dormant until activated (no special gating needed beyond the
  toggle + phase).
- [ ] **List view:** visually distinguish knockout questions (badge) from
  general questions; optionally a filter.
- [ ] Wire create/edit forms to send `isKnockout` + `showOnPhase1`.

---

## Feature 2 — Phase 1 = N random Phase 2A questions (even per pillar)

**Problem:** Phase 1 currently serves questions flagged `isPhase1Featured`
(`question.service.ts:57` `getPhase1QuestionsService`; validated at
`assessment.service.ts:187`; counted at `:24`; scored at `scoring.service.ts:193`).
Client wants Phase 1 to pull a configurable N random 2A questions, spread evenly
across pillars, plus any `showOnPhase1` knockout questions.

### BE-2 — Backend
- [ ] **Settings:** add `phase1PullTotal Int @default(15)` to `AppSettings`
  (`schema.prisma:205`). Expose in `settings.service.ts` get/update +
  `updateAppSettingsSchema` (`settings.types.ts`) + `AppSettingsPayload`.
- [ ] **Phase 1 session start** (`assessment.service.ts` `startAssessmentService`
  `:63`): snapshot the selected question set on the session (reuse the
  `selectedQuestionIds` mechanism Phase 2A uses at `question.service.ts:583`).
  Selection algorithm:
  - Load active PHASE2A general questions for the user's `businessSize`, grouped
    by active pillar.
  - Distribute `phase1PullTotal` as evenly as possible across pillars
    (`floor(N/7)` each, distribute remainder), randomly sampling within each
    pillar. If a pillar has fewer than its quota, redistribute the shortfall.
  - **Append** all `showOnPhase1 = true` knockout questions (PHASE2A) for that
    business size — always included, not counted in N.
  - Persist as `selectedQuestionIds` on the Phase 1 session.
  - ⚠️ Randomness: `Math.random()` is fine in app code (only banned inside
    Workflow scripts). Snapshot once at start so resume is stable.
- [ ] **Serve Phase 1 questions** (`getPhase1QuestionsService`
  `question.service.ts:57`): switch from `isPhase1Featured` filter to reading the
  session's `selectedQuestionIds` (mirror Phase 2A path at `:143`). Requires the
  endpoint to take a sessionId (confirm the FE resume/fetch contract).
- [ ] **Answer validation** (`assessment.service.ts:184`): replace the
  `!question.isPhase1Featured` check with "question id ∈ session snapshot".
- [ ] **Completion count** (`phase1QuestionCount` `:24`): count the session
  snapshot length instead of the featured count.
- [ ] **Scoring** (`scoring.service.ts:193`): for Phase 1 use the snapshot
  `questionIdScope` instead of `isPhase1Featured: true` (the scope param already
  exists — just feed it).
- [ ] **Deprecate `isPhase1Featured`:** stop reading it everywhere. Keep the
  column for one release (drop in a later migration) OR drop now — decide at
  build time. Remove it from admin create/update if we drop the FE toggle.

### FE-2 — Frontend
- [ ] **Admin question settings page:** add a **"Phase 1 pull total"** number
  input (whole number ≥ 7 recommended) alongside the existing Phase 2A/2B
  question-limit settings (`my-app/app/admin/settings/page.tsx` ~L208).
- [ ] **Remove** the per-question "Phase 1 featured" toggle from the question
  editor (superseded by the random pull + knockout `showOnPhase1`).
- [ ] **Phase 1 test flow** (`my-app/app/View/GeneralTestView.tsx`): confirm it
  fetches Phase 1 questions by sessionId (from the snapshot) rather than the old
  featured list. Adjust the resume/fetch call if the contract changed.

---

## Feature 3 — Staff size must be a whole number

**Problem:** `staffSize` is a free string (`assessment.types.ts:16`
`requiredText`), FE input is `type='text'` (`GeneralTestView.tsx:345`), and
`computeBusinessSize` (`assessment.service.ts:37`) regex-extracts the first
integer — so "25.5" silently parses to 25 with no error. Registration schema
also has `staffSize` optional string (`auth.types.ts:26`).

### BE-3 — Backend
- [ ] **Zod:** change `staffSize` in `assessment.types.ts:16` to a whole-number
  rule — coerce/validate a positive integer, reject decimals/non-numerics with a
  clear message (e.g. `z.coerce.number().int().positive()`; if the column stays
  a string, `.regex(/^\d+$/)` then store as-is). Mirror the same rule in
  `auth.types.ts:26` (keep optional there).
- [ ] **`computeBusinessSize`:** simplify to parse a validated integer (no more
  loose regex fallback that hides bad input).

### FE-3 — Frontend
- [ ] **Lead form input** (`GeneralTestView.tsx:338`): use `type='number'` with
  `min=1` `step=1`, block decimal/`e`/`-` entry, and surface the backend
  validation error inline. Apply the same to any registration staff-size input.

---

## Feature 4 — Phase 1 report → one-page snapshot

**Problem:** The Phase 1 PDF is the full ~13-page diagnostic
(`pdf.service.ts:3264` `generateReportPDF`: cover + exec summary + 7 pillar
pages + next steps + legal + attestation + spider). Too detailed for a free
deliverable.

### BE-4 — Backend
- [ ] **New builder** in `pdf.service.ts`: `generateSnapshotPDF(result,
  businessName, metadata)` producing a **single page**: business name/date
  header, composite health score, a compact per-pillar score strip (name +
  band color + score), a knockout alert line if any, and a short "unlock the
  full Strategic Scan" CTA. Reuse existing draw helpers/palette where possible.
- [ ] **Route Phase 1 through it:** in `deliverReportInBackground`
  (`assessment.service.ts:278`, called from `submitPhase1Service` ~L420), call
  `generateSnapshotPDF` when `phase === PHASE1`; keep `generateReportPDF` for
  2A/2B. R2 key stays `reports/phase1/<sessionId>.pdf` (overwrite-safe).
- [ ] Leave 2A/2B PDFs untouched.

### FE-4 — Frontend
- [ ] Mostly transparent (same download URL). Update any Phase 1 copy that
  promises a "full report" to say "one-page snapshot". Pairs with Feature 5
  naming.

---

## Feature 5 — Frontend phase display names (NOT admin dashboard)

**Problem:** User-facing strings say "Phase 1 / Phase 2A / Phase 2B" in many
places; some already use "Strategic Scan"/"Deep Dive". No central label map.
Admin dashboard (`my-app/app/admin/**`) must keep the raw phase names.

### FE-5 — Frontend only (no BE)
- [ ] **Add a central label map** (e.g. `my-app/lib/phaseLabels.ts`):
  `PHASE1 → "Business Snapshot"`, `PHASE2A → "Strategic Scan"`,
  `PHASE2B → "Deep Dive Module"`. Export a helper for inline use.
- [ ] **Replace user-facing occurrences** in (non-exhaustive, from search):
  `app/dashboard/layout.tsx`, `app/dashboard/page.tsx` (`phaseDisplayName`),
  `app/dashboard/strategic-scan/page.tsx`, `app/dashboard/subscription/page.tsx`,
  `app/dashboard/plans/page.tsx`, `app/dashboard/settings/page.tsx`,
  `app/dashboard/deep-dive/page.tsx`, `app/dashboard/consultation/page.tsx`,
  `app/View/PricingView.tsx`, `app/View/GeneralTestView.tsx`.
- [ ] **Do NOT touch** `app/admin/**` label helpers (users, coupons, settings).
- [ ] Keep API enum values (`PHASE2A`, `PHASE2B_PILLAR`, …) unchanged — display
  layer only.

---

## Feature 6 — Resend admin invite + hide button once onboarded

**Problem:** `inviteAdminService` (`admin.service.ts:690`) has no resend path;
expired 24h links strand invitees. Admin users list doesn't expose pending vs
onboarded (`passwordHash` not selected), so we can't conditionally show a
resend button. `passwordHash: null` = pending (see [[admin-invite-flow]]).

### BE-6 — Backend
- [ ] **Expose pending status:** in `getAllUsersService` (`admin.service.ts:32`)
  select `passwordHash` and derive a boolean `pendingInvite` (true when
  `role = ADMIN && passwordHash === null`) on `AdminUserRow`. Do NOT leak the
  hash itself — only the derived flag.
- [ ] **Resend endpoint:** `POST /api/admin/users/:id/resend-invite` (gated
  `users:write`). New `resendAdminInviteService(id)`:
  - Load the target; 404 if not found.
  - Reject with 409 if `passwordHash !== null` ("already onboarded").
  - Reject if not an ADMIN / not a pending invite.
  - Regenerate a fresh 24h invite token + link and re-send via
    `sendAdminInviteEmail` (reuse existing template). No DB mutation needed
    (account row already exists) beyond an optional `updatedAt` touch.
- [ ] Register route in `admin.routes.ts` near the invite route (~L?).
- [ ] Docs: add to `src/docs/admin.docs.ts`.

### FE-6 — Frontend
- [ ] **Users/staff list** (`app/admin/users/page.tsx` and/or
  `app/admin/settings/page.tsx` staff section): show a **"Pending activation"**
  badge when `pendingInvite`. Render a **"Resend invite"** button ONLY for
  pending rows; hide it once onboarded.
- [ ] **API wrapper** in `lib/api` for the resend endpoint; success/error toast
  ("Invitation re-sent — valid 24 hours").

---

## Cross-cutting / order of execution

Suggested build order (independent features can interleave, but this minimizes
churn):
1. **Feature 3** (staff size) — smallest, self-contained.
2. **Feature 6** (resend invite) — isolated to admin module.
3. **Feature 1** (knockout questions) — schema + scoring; unblocks Phase 1 pull.
4. **Feature 2** (Phase 1 random pull) — depends on Feature 1's `showOnPhase1`.
5. **Feature 4** (Phase 1 snapshot PDF).
6. **Feature 5** (FE phase names) — pure copy, do last so it wraps everything.

Notes:
- One Prisma migration per model group (Feature 1 = Question fields;
  Feature 2 = AppSettings field). Run `prisma migrate dev` before testing;
  `migrate deploy` before merge.
- Update `src/docs/*` swagger for every new/changed endpoint.
- No new admin permission keys needed (reuse `questions:*`, `ledger:*`,
  `users:*`).
- Follow existing module/style conventions (see [[backend_architecture]]):
  AppError + http constants, Zod in controllers, Prisma `select`.
