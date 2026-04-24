src/
├── modules/
│ ├── assessment/
│ │ ├── assessment.controller.ts
│ │ ├── assessment.service.ts
│ │ ├── assessment.routes.ts
│ │ └── assessment.types.ts
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

## Public API Endpoints

### 1. Get Phase 1 Questions

`GET /api/questions/phase1`

Request body:

- None

Expected outcome:

- Returns all 7 pillars
- Each pillar contains 2 questions
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

### 2. Start Assessment Session

`POST /api/assessment/start`

Request body:

- `leadEmail` - required, valid email
- `staffSize` - required
- `businessName` - required
- `industry` - required
- `location` - required
- `operatingYears` - required
- `annualRevenue` - required

Expected outcome:

- Creates a new `AssessmentSession`
- Session status is `IN_PROGRESS`
- Returns `sessionId` for the frontend to continue the flow

Response shape:

```json
{
  "message": "Assessment session started successfully",
  "sessionId": "string"
}
```

### 3. Save One Answer

`POST /api/assessment/:sessionId/answer`

Request body:

- `questionId` - required UUID
- `selectedOptionId` - required UUID

Expected outcome:

- Validates the session exists
- Validates the session is still editable
- Validates the selected option belongs to the question
- Saves one `SessionResponse`
- Snapshots `scoreAtTime` and `riskTypeAtTime` from the database

Response shape:

```json
{
  "message": "Answer saved successfully",
  "sessionId": "string",
  "responseId": "string"
}
```

### 4. Submit Assessment

`POST /api/assessment/:sessionId/submit`

Request body:

- None

Expected outcome:

- Confirms the session exists
- Confirms the session is still `IN_PROGRESS`
- Confirms all Phase 1 questions have been answered
- Marks the session as `COMPLETED`
- Runs the internal scoring service
- Creates `SessionResult` and `SessionPillarScore` records
- Returns a frontend redirect hint for the result gate

Response shape:

```json
{
  "message": "Assessment submitted successfully",
  "sessionId": "string",
  "redirectTo": "/result-gate"
}
```

### 5. Get Result

`GET /api/result/:sessionId`

Request body:

- None

Validation rules:

- Session must exist
- Session status must be `COMPLETED`, `PAID`, or `REPORT_GENERATED`

Expected outcome:

- Returns the full `SessionResult`
- Returns all joined `SessionPillarScore` rows
- Each pillar score includes its pillar details
- This is the endpoint the frontend should use for the results dashboard and blurred report preview

Response shape:

```json
{
  "message": "Result fetched successfully",
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

## Validation Error Format

When a request is missing required fields or has invalid values, the API returns a clear field-level message like:

```json
{
  "message": "leadEmail: Lead email is required; businessName: Business name is required"
}
```

## Notes For Frontend

- `score`, `riskType`, `observation`, and `recommendation` are never returned by the questions endpoint.
- The scoring service is internal only and is not exposed as a public endpoint.
- Use the `sessionId` returned from `POST /api/assessment/start` for the answer, submit, and result requests.
