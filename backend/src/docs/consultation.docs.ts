import { z } from 'zod';
import { registry, errorResponse } from './registry';
import {
  bookConsultationSchema,
  confirmBookingSchema,
  createConsultationTierSchema,
  listAdminBookingsQuerySchema,
  updateAdminNotesSchema,
  updateBookingStatusSchema,
  updateConsultationTierSchema,
} from '../module/consultation/consultation.types';

// ----- Component schemas ----------------------------------------------------
//
// Public tier shape — the storefront cards on /dashboard/consultation. Prices
// are stored in USD; `usdToNgn` on the list response lets the FE render the
// wire amount in NGN without a second fetch.
const ConsultationTierPublicSchema = registry.register(
  'ConsultationTierPublic',
  z
    .object({
      id: z.string().uuid(),
      tier: z.number().int(),
      name: z.string(),
      description: z.string(),
      priceUsd: z.number(),
      durationMinutes: z.number().int(),
      displayOrder: z.number().int(),
      // PICA 2A bonus: every confirmed booking on this tier grants
      // `freeP2ARuns` credits valid for `freeP2ACreditWindowDays` days.
      // 0 disables — the FE hides the chip and no credits are minted.
      freeP2ARuns: z.number().int(),
      freeP2ACreditWindowDays: z.number().int(),
    })
    .openapi('ConsultationTierPublic')
);

const ConsultationTierAdminSchema = registry.register(
  'ConsultationTierAdmin',
  ConsultationTierPublicSchema.extend({
    isActive: z.boolean(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  }).openapi('ConsultationTierAdmin')
);

// One row in the user's "previous result to attach" picker. The dropdown only
// surfaces completed + unlocked Phase 2A/2B results so consultants land with
// real context to discuss.
const CompletedResultOptionSchema = registry.register(
  'CompletedResultOption',
  z
    .object({
      sessionResultId: z.string().uuid(),
      sessionId: z.string().uuid(),
      phase: z.enum(['PHASE2A', 'PHASE2B']),
      pillarCode: z.string().nullable(),
      pillarName: z.string().nullable(),
      totalScore: z.number(),
      colorBand: z.string(),
      generatedAt: z.string().datetime().nullable(),
    })
    .openapi('CompletedResultOption')
);

const ConsultationBookingPayloadSchema = registry.register(
  'ConsultationBookingPayload',
  z
    .object({
      id: z.string().uuid(),
      tier: ConsultationTierPublicSchema,
      status: z.enum(['REQUESTED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED']),
      topic: z.string(),
      notes: z.string(),
      preferredTimes: z.string().nullable(),
      relatedResult: CompletedResultOptionSchema.nullable(),
      scheduledAt: z.string().datetime().nullable(),
      meetingLink: z.string().nullable(),
      coveredBySubscription: z.boolean(),
      // The payment block is non-null only while a paid booking is awaiting
      // SUCCESS; subscription-covered bookings have payment = null from the
      // start. Once the webhook lands, status is "SUCCESS" and the FE flips
      // the card into the confirmed-pending state.
      payment: z
        .object({
          reference: z.string(),
          status: z.string(),
          amount: z.number(),
          currency: z.string(),
          authorizationUrl: z.string().nullable(),
        })
        .nullable(),
      // Admin-authored client feedback on this booking. `adminNotes` is null
      // when no admin has written anything yet (FE hides the panel).
      // `adminNotesUpdatedBy` identifies the staff user who last edited.
      // `adminNotesNotifiedAt` (the single-shot email gate) is intentionally
      // NOT exposed on this payload — it's an admin-internal field.
      adminNotes: z.string().nullable(),
      adminNotesUpdatedAt: z.string().datetime().nullable(),
      adminNotesUpdatedBy: z
        .object({
          id: z.string().uuid(),
          email: z.string().email(),
          firstName: z.string().nullable(),
          lastName: z.string().nullable(),
        })
        .nullable(),
      requestedAt: z.string().datetime(),
    })
    .openapi('ConsultationBookingPayload')
);

// Admin row adds the user-identity block so the staff dashboard can render
// "Acme Co. — alice@example.com" alongside the booking row.
const AdminBookingRowSchema = registry.register(
  'AdminBookingRow',
  ConsultationBookingPayloadSchema.extend({
    user: z.object({
      id: z.string().uuid(),
      email: z.string().email(),
      businessName: z.string().nullable(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
    }),
  }).openapi('AdminBookingRow')
);

// ----- User-facing endpoints -----------------------------------------------

// GET /api/consultation/tiers ------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/consultation/tiers',
  tags: ['Consultation'],
  summary: 'List active consultation tiers',
  description:
    'Public. Returns the consultation product catalogue ordered by `displayOrder`. Prices are quoted in USD; multiply `priceUsd` by `usdToNgn` for NGN-billed display.',
  responses: {
    200: {
      description: 'Tier catalogue',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            currency: z.literal('USD'),
            usdToNgn: z.number(),
            tiers: z.array(ConsultationTierPublicSchema),
          }),
        },
      },
    },
  },
});

// GET /api/consultation/me ---------------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/consultation/me',
  tags: ['Consultation'],
  summary: 'List my consultation bookings',
  description:
    'Returns every booking the authenticated user has placed, newest first. Includes the payment block while a paid booking is unsettled and the meeting link once an admin confirms.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Booking list',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            bookings: z.array(ConsultationBookingPayloadSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
  },
});

// GET /api/consultation/me/results ------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/consultation/me/results',
  tags: ['Consultation'],
  summary: 'List my completed results eligible to attach',
  description:
    'Returns the authenticated user\'s completed + unlocked Phase 2A and Phase 2B results, ordered newest first. The FE renders this list in the "Attach a previous result" dropdown on the booking form.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Eligible results',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            results: z.array(CompletedResultOptionSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
  },
});

// GET /api/consultation/phase2a-credits --------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/consultation/phase2a-credits',
  tags: ['Consultation'],
  summary: 'List my unconsumed PICA 2A credits',
  description:
    'Returns the authenticated user\'s unconsumed, unexpired PICA 2A credits — granted by confirmed consultation bookings via `ConsultationTier.freeP2ARuns`. Ordered oldest-expiring first; the FE renders the earliest expiry on the strategic-scan landing banner. Consumed in FIFO order by `POST /api/payment/init` (plan PHASE2A) before the subscription quota.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Available credits',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            credits: z.array(
              z.object({
                id: z.string().uuid(),
                expiresAt: z.string().datetime(),
                consultationBookingId: z.string().uuid(),
              }),
            ),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
  },
});

// POST /api/consultation/book ------------------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/consultation/book',
  tags: ['Consultation'],
  summary: 'Request a consultation booking',
  description: [
    'Two settlement paths:',
    '- **Subscription-covered**: the authenticated user has an active subscription with consultation quota remaining for the current period. `coveredBySubscription` is true, the booking is created in `REQUESTED` status with `payment = null`, and quota decrements.',
    '- **Paid**: no quota available. The BE initialises a Paystack transaction for the tier price and returns `payment.authorizationUrl` for the FE to redirect to. Booking remains in `REQUESTED` and only becomes visible to the admin queue once the webhook records SUCCESS.',
  ].join('\n'),
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: bookConsultationSchema } },
    },
  },
  responses: {
    201: {
      description: 'Booking placed (free or paid)',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            coveredBySubscription: z.boolean(),
            booking: ConsultationBookingPayloadSchema,
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    404: errorResponse('Tier or related result not found'),
  },
});

// ----- Admin endpoints (tier CRUD) -----------------------------------------

// GET /api/admin/consultation-tiers ------------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/admin/consultation-tiers',
  tags: ['Admin'],
  summary: 'List every consultation tier (admin)',
  description: 'Admin only — requires `ledger:read`. Returns active and inactive tiers.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Tiers',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            tiers: z.array(ConsultationTierAdminSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:read permission'),
  },
});

// POST /api/admin/consultation-tiers -----------------------------------------
registry.registerPath({
  method: 'post',
  path: '/api/admin/consultation-tiers',
  tags: ['Admin'],
  summary: 'Create a consultation tier',
  description: 'Admin only — requires `ledger:write`. Prices are USD-major-units.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createConsultationTierSchema } },
    },
  },
  responses: {
    201: {
      description: 'Tier created',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), tier: ConsultationTierAdminSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:write permission'),
  },
});

// PATCH /api/admin/consultation-tiers/{id} ----------------------------------
registry.registerPath({
  method: 'patch',
  path: '/api/admin/consultation-tiers/{id}',
  tags: ['Admin'],
  summary: 'Update a consultation tier',
  description:
    'Admin only — requires `ledger:write`. Every field is optional but at least one must be provided. `tier` is immutable post-create.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateConsultationTierSchema } },
    },
  },
  responses: {
    200: {
      description: 'Tier updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), tier: ConsultationTierAdminSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:write permission'),
    404: errorResponse('Tier not found'),
  },
});

// DELETE /api/admin/consultation-tiers/{id} ---------------------------------
registry.registerPath({
  method: 'delete',
  path: '/api/admin/consultation-tiers/{id}',
  tags: ['Admin'],
  summary: 'Delete a consultation tier',
  description:
    'Admin only — requires `ledger:write`. Soft-deactivates if any historical bookings reference the tier; hard-deletes otherwise.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Tier removed or deactivated',
      content: {
        'application/json': { schema: z.object({ message: z.string() }) },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing ledger:write permission'),
    404: errorResponse('Tier not found'),
  },
});

// ----- Admin endpoints (booking ops) ---------------------------------------

// GET /api/admin/consultation-bookings ---------------------------------------
registry.registerPath({
  method: 'get',
  path: '/api/admin/consultation-bookings',
  tags: ['Admin'],
  summary: 'List consultation bookings (admin)',
  description:
    'Admin only — requires `consultations:read`. Paginated. Filter by `status` to narrow to the open queue.',
  security: [{ bearerAuth: [] }],
  request: { query: listAdminBookingsQuerySchema },
  responses: {
    200: {
      description: 'Bookings page',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            page: z.number().int(),
            pageSize: z.number().int(),
            total: z.number().int(),
            totalPages: z.number().int(),
            bookings: z.array(AdminBookingRowSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing consultations:read permission'),
  },
});

// PATCH /api/admin/consultation-bookings/{id}/confirm -----------------------
registry.registerPath({
  method: 'patch',
  path: '/api/admin/consultation-bookings/{id}/confirm',
  tags: ['Admin'],
  summary: 'Confirm a consultation booking',
  description:
    'Admin only — requires `consultations:write`. Sets `scheduledAt` + `meetingLink` and flips status to `CONFIRMED`. Both fields are mandatory at this step. Triggers a confirmation email to the user.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: confirmBookingSchema } },
    },
  },
  responses: {
    200: {
      description: 'Booking confirmed',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), booking: AdminBookingRowSchema }),
        },
      },
    },
    400: errorResponse('Validation error or invalid status transition'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing consultations:write permission'),
    404: errorResponse('Booking not found'),
  },
});

// PATCH /api/admin/consultation-bookings/{id}/status ------------------------
registry.registerPath({
  method: 'patch',
  path: '/api/admin/consultation-bookings/{id}/status',
  tags: ['Admin'],
  summary: 'Post-confirm booking transition',
  description:
    'Admin only — requires `consultations:write`. Used to mark a confirmed booking as `ATTENDED`, `NO_SHOW`, or `CANCELLED` once the session has happened (or didn\'t).',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateBookingStatusSchema } },
    },
  },
  responses: {
    200: {
      description: 'Booking status updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), booking: AdminBookingRowSchema }),
        },
      },
    },
    400: errorResponse('Invalid status transition'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing consultations:write permission'),
    404: errorResponse('Booking not found'),
  },
});

// GET /api/admin/consultation-bookings/{id}/client-history -----------------
//
// Backing endpoint for the admin ClientHistoryModal. Resolves booking →
// userId, then returns the user identity block + their last 5 completed
// Phase 2A/2B results (with R2 PDF URLs so the modal can render Download
// anchors).
const AdminClientHistoryResultSchema = registry.register(
  'AdminClientHistoryResult',
  CompletedResultOptionSchema.extend({
    reportPdfUrl: z.string().nullable(),
  }).openapi('AdminClientHistoryResult'),
);

const AdminClientHistoryResponseSchema = registry.register(
  'AdminClientHistoryResponse',
  z
    .object({
      message: z.string(),
      user: z.object({
        id: z.string().uuid(),
        email: z.string().email(),
        businessName: z.string().nullable(),
        firstName: z.string().nullable(),
        lastName: z.string().nullable(),
        createdAt: z.string().datetime(),
      }),
      results: z.array(AdminClientHistoryResultSchema),
    })
    .openapi('AdminClientHistoryResponse'),
);

registry.registerPath({
  method: 'get',
  path: '/api/admin/consultation-bookings/{id}/client-history',
  tags: ['Admin'],
  summary: 'Get the booking user\'s recent assessment history',
  description:
    'Admin only — requires `consultations:read`. Returns the user identity block plus their last 5 completed Phase 2A/2B sessions, including the R2-hosted report PDF URL on each row so the admin UI can render per-result Download buttons. Backs the "View client" modal on /admin/consultations.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Client history',
      content: {
        'application/json': { schema: AdminClientHistoryResponseSchema },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing consultations:read permission'),
    404: errorResponse('Booking not found'),
  },
});

// PATCH /api/admin/consultation-bookings/{id}/notes ------------------------
//
// Save admin-authored client feedback. One-shot email gate: the user is
// emailed exactly once — on the first save that takes `adminNotes` from
// empty/null to non-empty. Subsequent edits update the text + timestamp +
// author but never re-fire the email.
registry.registerPath({
  method: 'patch',
  path: '/api/admin/consultation-bookings/{id}/notes',
  tags: ['Admin'],
  summary: 'Save admin-authored notes on a consultation booking',
  description:
    'Admin only — requires `consultations:write`. Updates `adminNotes`, `adminNotesUpdatedAt`, and the audit `adminNotesUpdatedById` (taken from the caller\'s JWT). The first save with non-empty notes also fires a one-time "your consultant left feedback" email to the user; subsequent edits never email again (guarded by `adminNotesNotifiedAt`). Saving an empty/whitespace string clears the notes back to null.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateAdminNotesSchema } },
    },
  },
  responses: {
    200: {
      description: 'Notes saved',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), booking: AdminBookingRowSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing consultations:write permission'),
    404: errorResponse('Booking not found'),
  },
});
