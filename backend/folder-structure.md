src/
├── modules/
│ ├── assessment/
│ │ ├── assessment.controller.ts
│ │ ├── assessment.service.ts
│ │ ├── assessment.routes.ts
│ │ └── assessment.types.ts
│ │
│ ├── auth/
│ │ ├── auth.controller.ts
│ │ ├── auth.service.ts
│ │ ├── auth.route.ts
│ │ └── auth.types.ts
│ │
│ ├── question/
│ │ ├── question.controller.ts
│ │ ├── question.service.ts
│ │ ├── question.routes.ts
│ │ └── question.types.ts
│ │
│ ├── scoring/
│ │ ├── scoring.service.ts ← no controller, internal only
│ │ └── scoring.types.ts
│ │
│ ├── result/
│ │ ├── result.controller.ts
│ │ ├── result.service.ts
│ │ ├── result.routes.ts
│ │ └── result.types.ts
│ │
│ └── user/
│ ├── user.controller.ts
│ ├── user.service.ts
│ ├── user.routes.ts
│ └── user.types.ts
│
├── shared/
| ├──middleware/
| │ ├── auth.middleware.ts
| │ ├── validate.middleware.ts
| │ └── error.middleware.ts
| |
| └──shared/
│ ├── prisma.ts ← Prisma client singleton
│ ├── errors.ts ← Custom error classes
│ ├── response.ts ← Standard API response wrapper
│ └── types.ts ← Shared TS interfaces
│
├──
│
└── app.ts

<!-- API Integration Guide for Frontend -->

## Funnel Overview

PICA has a two-phase funnel:

1. **Phase 1 (free snapshot)** — guest user fills in lead-capture data, answers 14 questions (7 pillars × 2 featured questions tailored to their `businessSize`), submits, and receives a Phase 1 PDF + dashboard view via email.
2. **Account creation** — gated. Only users whose email matches a `COMPLETED`/`PAID`/`REPORT_GENERATED` Phase 1 session can register. `businessSize` and the lead fields are copied from the Phase 1 session onto the User at registration.
3. **Phase 2A (paid comprehensive diagnostic)** — authenticated user. 70 questions (7 pillars × 10), save-and-continue, then a payment wall before the full report unlocks.

`businessSize` (`SMALL` or `MEDIUM`) is computed once at Phase 1 lead capture from `staffSize` (free-text headcount, threshold > 50 = MEDIUM) and `annualRevenue` (Under 5M = SMALL; Mid-Range or Enterprise = MEDIUM). MEDIUM wins if either signal says MEDIUM. It is never recomputed.

## Auth Headers

Routes marked **(auth required)** need a JWT access token:

```
Authorization: Bearer <accessToken>
```

The access token is returned by `POST /api/auth/login`. `req.user.id` on the backend maps to `User.id`.

---

## Public API Endpoints

### 1. Get Phase 1 Questions

`GET /api/questions/phase1?businessSize=SMALL`

Query params:

- `businessSize` — required, `SMALL` or `MEDIUM`. Use the value the frontend computed at lead capture (or echo back what `POST /api/assessment/start` implicitly used).

Expected outcome:

- Returns all 7 Phase 1 pillars
- Each pillar contains exactly 2 featured questions for the supplied `businessSize`
- Each question contains 4 options
- No scoring metadata is returned to the frontend

Response shape:

```json
{
  "message": "Phase 1 questions fetched successfully",
  "pillars": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string | null",
      "displayOrder": 1,
      "questions": [
        {
          "id": "string",
          "questionCode": "string",
          "questionText": "string",
          "displayOrder": 1,
          "options": [
            {
              "id": "string",
              "optionLabel": "A",
              "optionText": "string",
              "displayOrder": 1
            }
          ]
        }
      ]
    }
  ]
}
```

Errors:

- `400` — `businessSize` missing or not one of `SMALL`/`MEDIUM`
- `404` — no Phase 1 questions configured for that size

---

### 2. Start Phase 1 Assessment Session

`POST /api/assessment/start`

Request body:

- `leadEmail` — required, valid email (will be normalized to lowercase + trimmed)
- `staffSize` — required (free-text headcount, e.g. `"35"`, `"around 120"`)
- `businessName` — required
- `industry` — required
- `location` — required
- `operatingYears` — required
- `annualRevenue` — required, one of: `"Under 5M"`, `"Mid-Range 5M-50M"`, `"Enterprise 50M+"`

Expected outcome:

- Creates (or resumes) an `IN_PROGRESS` Phase 1 `AssessmentSession`
- `businessSize` is computed and persisted on the session
- Returns `sessionId` for the frontend to drive the answer/submit flow

Response shape:

```json
{
  "message": "Assessment session started successfully",
  "sessionId": "string"
}
```

Errors:

- `409` — a `COMPLETED` session already exists for this email (FE should route to the result page or login)

---

### 3. Save One Answer (Phase 1 or Phase 2A)

`POST /api/assessment/:sessionId/answer`

**Auth required for Phase 2A sessions.** Phase 1 sessions are public.

Request body:

- `questionId` — required UUID
- `selectedOptionId` — required UUID

Expected outcome:

- Validates session exists and is `IN_PROGRESS`
- Phase 2A only: validates `questionId` is in the session's snapshotted question set and `req.user.id === session.userId`
- Saves/updates one `SessionResponse`
- Snapshots `scoreAtTime` and `riskTypeAtTime` from the database

Response shape:

```json
{
  "message": "Answer saved successfully",
  "sessionId": "string",
  "responseId": "string"
}
```

Errors:

- `403` — Phase 2A session belongs to a different user
- `409` — session no longer editable
- `422` — selected option does not belong to the question, or question is not in the Phase 2A snapshot

---

### 4. Submit Assessment (Phase 1 or Phase 2A)

`POST /api/assessment/:sessionId/submit`

**Auth required for Phase 2A sessions.** Phase 1 sessions are public.

Behavior branches on `session.phase`:

#### Phase 1
- Confirms all 14 featured questions answered
- Marks session `COMPLETED`, runs scoring, persists `SessionResult` + `SessionPillarScore`
- Generates the Phase 1 PDF and emails it (best-effort — failures are logged, not surfaced)
- Returns `redirectTo: "/result-gate"`

#### Phase 2A
- Confirms all 70 snapshot questions answered
- Marks session `COMPLETED`, runs scoring, persists `SessionResult` + `SessionPillarScore`
- **Does NOT generate a PDF and does NOT send email** — those are unlocked by the payment module
- Returns `redirectTo: "/payment"`

Response shape (both phases):

```json
{
  "message": "Assessment submitted successfully",
  "sessionId": "string",
  "redirectTo": "/result-gate" // or "/payment" for Phase 2A
}
```

Errors:

- `403` — Phase 2A session not owned by the requester
- `409` — session already submitted
- `422` — incomplete (number of expected vs answered surfaced in the message)

---

### 5. Get Result

`GET /api/result/:sessionId`

Returns the dashboard payload for both Phase 1 and Phase 2A.

Validation rules:

- Session must exist
- Session status must be `COMPLETED`, `PAID`, or `REPORT_GENERATED`

**Phase 2A redaction (paywall):** when a Phase 2A session is `COMPLETED` but not yet `PAID`/`REPORT_GENERATED`, the response is partially redacted:

| Field | Pre-payment (`COMPLETED`) | Post-payment (`PAID`/`REPORT_GENERATED`) |
|---|---|---|
| `result.totalScore` | full | full |
| `result.colorBand` | full | full |
| `pillarScores[].weightedScore` / `colorBand` | full | full |
| `pillarScores[].findings` | `[]` | full |
| `result.knockoutQuestionIds` | `[]` | full |
| `result.insightPayload` | `null` | full |
| `result.reportPdfUrl` | `null` | populated |
| `paywalled` | `true` | `false` |

Phase 1 always returns the full payload (no redaction). `paywalled` is `false` for Phase 1.

The frontend should use `paywalled` to decide whether to show the blurred preview + "Unlock report" CTA versus the full report.

Response shape:

```json
{
  "message": "Result fetched successfully",
  "paywalled": false,
  "result": {
    "id": "string",
    "sessionId": "string",
    "totalScore": 0,
    "colorBand": "RED",
    "hasAnyKnockout": false,
    "knockoutQuestionIds": ["string"],
    "insightPayload": {},
    "reportPdfUrl": null,
    "generatedAt": null,
    "createdAt": "date-time",
    "updatedAt": "date-time",
    "pillarScores": [
      {
        "id": "string",
        "pillarId": "string",
        "rawScore": 0,
        "maxPossibleScore": 0,
        "weightedScore": 0,
        "hasKnockout": false,
        "colorBand": "RED",
        "insightRuleApplied": "BOTH_NORMAL",
        "findings": [
          {
            "optionId": "string",
            "questionText": "string",
            "selectedLabel": "A",
            "observation": "string",
            "recommendation": "string",
            "riskType": "NORMAL",
            "score": 10
          }
        ],
        "pillar": {
          "id": "string",
          "code": "string",
          "name": "string",
          "description": "string | null",
          "displayOrder": 1
        }
      }
    ]
  }
}
```

---

## Auth Endpoints

### 6. Register

`POST /api/auth/register`

Request body:

- `email` — required, valid email (must match the `leadEmail` of a `COMPLETED`/`PAID`/`REPORT_GENERATED` Phase 1 session; comparison is case-insensitive)
- `password` — required, ≥ 8 chars with at least one upper, one lower, one digit, one special char
- `businessName` — required, 3–100 chars (this is the **registration** business name, not auto-filled from the Phase 1 session)
- `phone` — required, 10–15 digits, optional leading `+`

Expected outcome:

- Verifies a Phase 1 session exists for this email — if not, returns `403` with the message *"You must take the free Phase 1 scan before creating an account..."*
- Snapshots `businessSize`, `staffSize`, `industry`, `location`, `operatingYears`, `annualRevenue` from the Phase 1 session onto the new User
- Links any AssessmentSessions with this `leadEmail` to the new `userId`
- Sends a welcome email (best-effort)

Response shape:

```json
{
  "message": "Registration successful",
  "user": {
    "id": "string",
    "email": "string",
    "businessName": "string | null",
    "phone": "string | null",
    "isVerified": false
  }
}
```

Errors:

- `403` — no qualifying Phase 1 session for this email (FE should route the user to take the free scan)
- `409` — an account already exists for this email

---

### 7. Login

`POST /api/auth/login`

Request body:

- `email` — required (case-insensitive)
- `password` — required

Response shape:

```json
{
  "message": "Login successful",
  "user": {
    "id": "string",
    "email": "string",
    "businessName": "string | null",
    "phone": "string | null",
    "isVerified": false
  },
  "accessToken": "string",
  "refreshToken": "string"
}
```

Errors:

- `401` — invalid credentials

### 8. Forgot / Verify OTP / Reset Password

Standard 3-step flow (unchanged):

- `POST /api/auth/forgot-password` — body `{ email }` → returns `{ otpToken }` and emails a 5-digit code
- `POST /api/auth/verify-reset-otp` — body `{ email, code, otpToken }` → returns `{ passwordToken }`
- `POST /api/auth/reset-password` — body `{ passwordToken, newPassword }` → returns success

---

## Phase 2A Endpoints (auth required)

### 9. Start Phase 2A Session

`POST /api/assessment/phase2a/start` **(auth required)**

Request body:

- None

Expected outcome:

- Reads `businessSize` from the authenticated User (snapshotted from Phase 1 at registration)
- If an `IN_PROGRESS` Phase 2A session already exists for this user, returns its `sessionId` (resume)
- Otherwise creates a new Phase 2A `AssessmentSession` and **snapshots the 70 question IDs** (10 per pillar, deterministic by `displayOrder`) onto `selectedQuestionIds`
- The set is frozen — admin edits to questions afterwards will not change this user's set

Response shape:

```json
{
  "message": "Phase 2A session started successfully",
  "sessionId": "string"
}
```

Errors:

- `401` — missing/invalid token
- `403` — User has no `businessSize` set (Phase 1 not completed)
- `422` — Phase 2A question bank is not fully seeded for this `businessSize`

---

### 10. Get Phase 2A Questions (with progress)

`GET /api/questions/phase2a?sessionId=<uuid>` **(auth required)**

Query params:

- `sessionId` — required UUID, must belong to the authenticated user

Expected outcome:

- Validates ownership, that the session is Phase 2A, and that it is still `IN_PROGRESS`
- Returns the 70 snapshotted questions grouped by pillar
- Each question carries an `answered` flag and the `selectedOptionId` (or `null`) so the frontend can render save-and-continue progress / let users review prior answers
- The frontend is free to flatten and randomize question order — pillar metadata is included only so the FE can group internally if it wants to

No scoring metadata is returned.

Response shape:

```json
{
  "message": "Phase 2A questions fetched successfully",
  "sessionId": "string",
  "answeredCount": 0,
  "totalCount": 70,
  "pillars": [
    {
      "id": "string",
      "code": "string",
      "name": "string",
      "description": "string | null",
      "displayOrder": 1,
      "questions": [
        {
          "id": "string",
          "questionCode": "string",
          "questionText": "string",
          "displayOrder": 1,
          "answered": false,
          "selectedOptionId": null,
          "options": [
            {
              "id": "string",
              "optionLabel": "A",
              "optionText": "string",
              "displayOrder": 1
            }
          ]
        }
      ]
    }
  ]
}
```

Errors:

- `401` — missing/invalid token
- `403` — session belongs to a different user
- `404` — session not found
- `409` — session is not Phase 2A or is no longer `IN_PROGRESS`
- `422` — session has no question snapshot

---

## Recommended FE Flow

**Phase 1 (anonymous):**

1. User opens lead-capture form → submits → `POST /api/assessment/start` → store `sessionId` and `businessSize` in client state.
2. `GET /api/questions/phase1?businessSize=...` → render 14 questions.
3. For each answer: `POST /api/assessment/:sessionId/answer`.
4. On finish: `POST /api/assessment/:sessionId/submit` → follow `redirectTo` to result page.
5. `GET /api/result/:sessionId` → render dashboard. Phase 1 PDF arrives by email automatically.

**Phase 2A (authenticated, with save-and-continue):**

1. User opens "Get full diagnostic" CTA → if not registered: `POST /api/auth/register` (gated on Phase 1 completion). Otherwise `POST /api/auth/login`.
2. `POST /api/assessment/phase2a/start` → store `sessionId` (resumes if one exists).
3. `GET /api/questions/phase2a?sessionId=...` → render only questions where `answered === false` (or all of them with prior answers pre-selected, depending on UX). Use `answeredCount`/`totalCount` for the progress bar.
4. For each answer: `POST /api/assessment/:sessionId/answer` (with auth header).
5. On user-triggered "Save & exit": no special call — answers are already persisted. They can leave any time.
6. On final submit: `POST /api/assessment/:sessionId/submit` (with auth header) → `redirectTo: "/payment"`.
7. `GET /api/result/:sessionId` → renders dashboard with `paywalled: true`. Show partial scores + paywall CTA.
8. After payment confirmation (payment module — coming next): backend flips status to `PAID`, generates PDF, emails it, and `paywalled` becomes `false` on subsequent fetches.

---

## Validation Error Format

When a request is missing required fields or has invalid values, the API returns a clear field-level message like:

```json
{
  "message": "leadEmail: Lead email is required; businessName: Business name is required"
}
```

## Notes For Frontend

- `score`, `riskType`, `observation`, and `recommendation` are **never** returned by the questions endpoint, regardless of phase.
- The scoring service is internal only and is not exposed as a public endpoint.
- Email comparison (lead capture vs. registration vs. login) is case-insensitive and trimmed by the backend, so normalization on the FE is optional.
- `businessSize` is computed by the backend at Phase 1 start and is read from the User for Phase 2A. The FE never needs to send it on Phase 2A endpoints.
- Phase 2A questions are deterministically selected (first 10 active per pillar by `displayOrder` for the user's `businessSize`) and snapshotted on the session, so users get the same set if they leave and return.
- The FE is responsible for randomizing the **display order** of Phase 2A questions if the product wants users not to know which pillar each question belongs to. The backend always returns them grouped by pillar.
