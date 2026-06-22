import { z } from 'zod';
import { ConsultationBookingStatus } from '@prisma/client';

// ============================================================
// PUBLIC + USER-FACING TYPES
// ============================================================

export type ConsultationTierPublic = {
  id: string;
  tier: number;
  name: string;
  description: string;
  priceUsd: number;
  durationMinutes: number;
  displayOrder: number;
  // Bonus: every confirmed booking on this tier grants `freeP2ARuns` PICA 2A
  // credits valid for `freeP2ACreditWindowDays` days. Zero disables the bonus
  // — the FE hides the chip when freeP2ARuns === 0.
  freeP2ARuns: number;
  freeP2ACreditWindowDays: number;
};

export type ConsultationTierAdmin = ConsultationTierPublic & {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

// One row in the user's "previous results to attach" dropdown. The user can
// pick which completed+unlocked SessionResult they want to consult on so the
// consultant lands with context.
export type CompletedResultOption = {
  sessionResultId: string;
  sessionId: string;
  phase: 'PHASE2A' | 'PHASE2B';
  // null for Phase 2A (the whole-business scan); set for Phase 2B (pillar deep dive)
  pillarCode: string | null;
  pillarName: string | null;
  totalScore: number;
  colorBand: string;
  generatedAt: string | null;
};

export type ConsultationBookingPayload = {
  id: string;
  tier: ConsultationTierPublic;
  status: ConsultationBookingStatus;
  topic: string;
  notes: string;
  preferredTimes: string | null;
  relatedResult: CompletedResultOption | null;
  scheduledAt: string | null;
  meetingLink: string | null;
  coveredBySubscription: boolean;
  // Paywall path: present until SUCCESS, then "paid" and the FE shows the
  // booking as ready-to-confirm.
  payment: {
    reference: string;
    status: string;
    amount: number;
    currency: string;
    authorizationUrl: string | null;
  } | null;
  // Admin-authored client feedback. `adminNotes === null` means no notes yet;
  // the FE hides the panel in that case. `adminNotesUpdatedBy` is the staff
  // user who last edited — shown as "from <name>" on the user's dashboard.
  // Note: `adminNotesNotifiedAt` is intentionally NOT exposed — it's an
  // admin-internal single-shot email gate.
  adminNotes: string | null;
  adminNotesUpdatedAt: string | null;
  adminNotesUpdatedBy: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  } | null;
  requestedAt: string;
};

// ============================================================
// USER ENDPOINTS
// ============================================================

export type ListConsultationTiersResponse = {
  message: string;
  currency: 'USD';
  usdToNgn: number;
  tiers: ConsultationTierPublic[];
};

export type MyCompletedResultsResponse = {
  message: string;
  results: CompletedResultOption[];
};

export type MyConsultationsResponse = {
  message: string;
  bookings: ConsultationBookingPayload[];
};

// GET /api/consultation/phase2a-credits — surfaced on the strategic-scan page
// so the FE can show "Your consultation credit covers this — no charge"
// before the user clicks Start. Returns only unconsumed, unexpired credits.
export type MyPhase2ACreditPublic = {
  id: string;
  expiresAt: string;
  consultationBookingId: string;
};

export type MyPhase2ACreditsResponse = {
  message: string;
  credits: MyPhase2ACreditPublic[];
};

// Topic + tier are required; everything else optional so users can skip the
// long-form context fields. preferredTimes is freeform (admin reads, manually
// schedules).
export const bookConsultationSchema = z.object({
  tierId: z.string().uuid('tierId must be a valid uuid'),
  topic: z.string().trim().min(3, 'topic must be at least 3 characters').max(200),
  notes: z.string().trim().max(2000).default(''),
  preferredTimes: z.string().trim().max(500).optional(),
  relatedSessionResultId: z.string().uuid().optional(),
});

export type BookConsultationInput = z.infer<typeof bookConsultationSchema>;

export type BookConsultationResponse = {
  message: string;
  // True when subscription quota covered the booking — no payment needed,
  // booking is REQUESTED and the admin sees it straight away.
  coveredBySubscription: boolean;
  booking: ConsultationBookingPayload;
};

// ============================================================
// ADMIN — tier CRUD
// ============================================================

const nonNegativeInt = z
  .number()
  .int('must be an integer')
  .min(0, 'must be zero or greater');

export const createConsultationTierSchema = z.object({
  tier: z.number().int().min(1, 'tier must be 1 or greater'),
  name: z.string().trim().min(1, 'name is required').max(80),
  description: z.string().trim().max(500).default(''),
  priceUsd: z
    .number()
    .gt(0, 'priceUsd must be greater than 0')
    .max(100_000, 'priceUsd looks unreasonably large'),
  durationMinutes: z
    .number()
    .int('durationMinutes must be an integer')
    .min(5, 'durationMinutes must be at least 5')
    .max(600, 'durationMinutes must not exceed 600'),
  // 0 disables the bonus; non-zero grants `freeP2ARuns` credits per booking
  // valid for `freeP2ACreditWindowDays`. Defaults match the PDF (5 / 90).
  freeP2ARuns: nonNegativeInt.default(5),
  freeP2ACreditWindowDays: z
    .number()
    .int('freeP2ACreditWindowDays must be an integer')
    .min(1, 'freeP2ACreditWindowDays must be at least 1')
    .max(365, 'freeP2ACreditWindowDays cannot exceed 365')
    .default(90),
  isActive: z.boolean().default(true),
  displayOrder: nonNegativeInt.default(0),
});

export type CreateConsultationTierInput = z.infer<typeof createConsultationTierSchema>;

export const updateConsultationTierSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    description: z.string().trim().max(500).optional(),
    priceUsd: z
      .number()
      .gt(0, 'priceUsd must be greater than 0')
      .max(100_000, 'priceUsd looks unreasonably large')
      .optional(),
    durationMinutes: z
      .number()
      .int('durationMinutes must be an integer')
      .min(5)
      .max(600)
      .optional(),
    freeP2ARuns: nonNegativeInt.optional(),
    freeP2ACreditWindowDays: z
      .number()
      .int()
      .min(1)
      .max(365)
      .optional(),
    isActive: z.boolean().optional(),
    displayOrder: nonNegativeInt.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type UpdateConsultationTierInput = z.infer<typeof updateConsultationTierSchema>;

export type AdminConsultationTierResponse = {
  message: string;
  tier: ConsultationTierAdmin;
};

export type AdminListConsultationTiersResponse = {
  message: string;
  tiers: ConsultationTierAdmin[];
};

// ============================================================
// ADMIN — booking management
// ============================================================

export type AdminBookingRow = ConsultationBookingPayload & {
  user: {
    id: string;
    email: string;
    businessName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

export const listAdminBookingsQuerySchema = z.object({
  status: z
    .enum(['REQUESTED', 'CONFIRMED', 'ATTENDED', 'NO_SHOW', 'CANCELLED'])
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export type ListAdminBookingsQuery = z.infer<typeof listAdminBookingsQuerySchema>;

export type AdminListBookingsResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  bookings: AdminBookingRow[];
};

// Confirm sets the date/time + meeting link and flips status to CONFIRMED.
// Both fields are required at this step — that's the whole point.
export const confirmBookingSchema = z.object({
  scheduledAt: z.string().datetime({ message: 'scheduledAt must be ISO-8601' }),
  meetingLink: z
    .string()
    .trim()
    .url('meetingLink must be a valid URL')
    .max(500),
});

export type ConfirmBookingInput = z.infer<typeof confirmBookingSchema>;

// Generic status transition for the post-confirm flow.
export const updateBookingStatusSchema = z.object({
  status: z.enum(['ATTENDED', 'NO_SHOW', 'CANCELLED']),
});

export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;

// Admin notes save. Empty/whitespace-only string clears the notes (sets the
// column back to NULL on the service side). 5k character cap is generous;
// the textarea on the FE side enforces the same.
export const updateAdminNotesSchema = z.object({
  adminNotes: z
    .string()
    .max(5000, { message: 'adminNotes must be 5000 characters or fewer' }),
});

export type UpdateAdminNotesInput = z.infer<typeof updateAdminNotesSchema>;

export type AdminBookingResponse = {
  message: string;
  booking: AdminBookingRow;
};

// Client-history modal payload. `results` carries the last N completed
// Phase 2A/2B sessions for this booking's user with R2 PDF URLs so the
// admin can render Download buttons. `user.createdAt` is the user's
// signup date — surfaces "client since <date>" at the top of the modal.
export type AdminClientHistoryResponse = {
  message: string;
  user: {
    id: string;
    email: string;
    businessName: string | null;
    firstName: string | null;
    lastName: string | null;
    createdAt: string;
  };
  results: Array<
    CompletedResultOption & {
      reportPdfUrl: string | null;
    }
  >;
};
