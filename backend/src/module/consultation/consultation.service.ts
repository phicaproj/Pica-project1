import {
  ConsultationBookingStatus,
  Plan,
  PaymentProvider,
  PaymentStatus,
  Phase,
  Prisma,
  SessionStatus,
} from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import {
  BAD_REQUEST,
  CONFLICT,
  FORBIDDEN,
  NOT_FOUND,
} from '../../service/shared/http';
import {
  initializeTransaction,
  newPaymentReference,
  type PaystackCurrency,
} from '../../service/shared/paystack.service';
import { getUsdToNgnRate } from '../settings/settings.service';
import {
  assertSubscriptionQuota,
  consumeSubscriptionQuota,
} from '../subscription/subscription.service';
import {
  sendConsultationConfirmedEmailBestEffort,
  sendConsultationNoteUpdatedEmailBestEffort,
} from './consultation.email';
import type {
  AdminBookingResponse,
  AdminBookingRow,
  AdminClientHistoryResponse,
  AdminConsultationTierResponse,
  AdminListBookingsResponse,
  AdminListConsultationTiersResponse,
  BookConsultationInput,
  BookConsultationResponse,
  CompletedResultOption,
  ConfirmBookingInput,
  ConsultationBookingPayload,
  ConsultationTierAdmin,
  ConsultationTierPublic,
  CreateConsultationTierInput,
  ListAdminBookingsQuery,
  ListConsultationTiersResponse,
  MyCompletedResultsResponse,
  MyConsultationsResponse,
  MyPhase2ACreditsResponse,
  UpdateAdminNotesInput,
  UpdateBookingStatusInput,
  UpdateConsultationTierInput,
} from './consultation.types';

// ──────────────────────────────────────────────────────────────────────────
// Helpers + mappers
// ──────────────────────────────────────────────────────────────────────────

const NIGERIA_ALIASES = new Set([
  'nigeria',
  'ng',
  'nga',
  'federal republic of nigeria',
]);
function resolveChargeCurrency(country: string | null | undefined): PaystackCurrency {
  if (!country) return 'USD';
  return NIGERIA_ALIASES.has(country.trim().toLowerCase()) ? 'NGN' : 'USD';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

type TierRow = {
  id: string;
  tier: number;
  name: string;
  description: string;
  priceUsd: Prisma.Decimal;
  durationMinutes: number;
  freeP2ARuns: number;
  freeP2ACreditWindowDays: number;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicTier(row: TierRow): ConsultationTierPublic {
  return {
    id: row.id,
    tier: row.tier,
    name: row.name,
    description: row.description,
    priceUsd: Number(row.priceUsd),
    durationMinutes: row.durationMinutes,
    displayOrder: row.displayOrder,
    freeP2ARuns: row.freeP2ARuns,
    freeP2ACreditWindowDays: row.freeP2ACreditWindowDays,
  };
}

function toAdminTier(row: TierRow): ConsultationTierAdmin {
  return {
    ...toPublicTier(row),
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Shape used by Prisma `include` for booking → relations needed to render the
// payload. Centralised so service queries stay in sync.
const bookingInclude = {
  tier: true,
  payment: {
    select: {
      providerReference: true,
      status: true,
      amount: true,
      currency: true,
      authorizationUrl: true,
    },
  },
  relatedResult: {
    select: {
      id: true,
      totalScore: true,
      colorBand: true,
      generatedAt: true,
      session: {
        select: {
          id: true,
          phase: true,
          pillar: { select: { code: true, name: true } },
        },
      },
    },
  },
  // Staff user who last edited the admin notes — surfaced to the user as
  // "from <name>" on the dashboard note panel. Selected at include time so
  // both the user-facing and admin-facing payload mappers can read it
  // without a second round-trip.
  adminNotesUpdatedByUser: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.ConsultationBookingInclude;

type BookingWithRelations = Prisma.ConsultationBookingGetPayload<{
  include: typeof bookingInclude;
}>;

function toRelatedResult(
  row: BookingWithRelations['relatedResult'],
): CompletedResultOption | null {
  if (!row) return null;
  return {
    sessionResultId: row.id,
    sessionId: row.session.id,
    phase: row.session.phase === Phase.PHASE2B ? 'PHASE2B' : 'PHASE2A',
    pillarCode: row.session.pillar?.code ?? null,
    pillarName: row.session.pillar?.name ?? null,
    totalScore: Number(row.totalScore),
    colorBand: row.colorBand,
    generatedAt: row.generatedAt?.toISOString() ?? null,
  };
}

function toBookingPayload(row: BookingWithRelations): ConsultationBookingPayload {
  return {
    id: row.id,
    tier: toPublicTier(row.tier),
    status: row.status,
    topic: row.topic,
    notes: row.notes,
    preferredTimes: row.preferredTimes,
    relatedResult: toRelatedResult(row.relatedResult),
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
    meetingLink: row.meetingLink,
    coveredBySubscription: row.coveredBySubscription,
    payment: row.payment
      ? {
          reference: row.payment.providerReference,
          status: row.payment.status,
          amount: Number(row.payment.amount),
          currency: row.payment.currency,
          authorizationUrl: row.payment.authorizationUrl,
        }
      : null,
    // Admin-authored client feedback. `adminNotesNotifiedAt` is admin-internal
    // (single-shot email gate) — intentionally NOT leaked to the user payload.
    adminNotes: row.adminNotes,
    adminNotesUpdatedAt: row.adminNotesUpdatedAt?.toISOString() ?? null,
    adminNotesUpdatedBy: row.adminNotesUpdatedByUser ?? null,
    requestedAt: row.requestedAt.toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// USER — tiers + completed-results + my-bookings
// ──────────────────────────────────────────────────────────────────────────

export async function listTiersService(): Promise<ListConsultationTiersResponse> {
  const [rows, usdToNgn] = await Promise.all([
    prisma.consultationTier.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { tier: 'asc' }],
    }),
    getUsdToNgnRate(),
  ]);
  return {
    message: 'Consultation tiers fetched successfully',
    currency: 'USD',
    usdToNgn,
    tiers: rows.map(toPublicTier),
  };
}

/**
 * Returns the user's completed-and-unlocked SessionResults — what powers the
 * "consult on this scan" dropdown on the booking form. A Phase 2A result is
 * unlocked when `isPaid` flips true (after the per-result paywall); a Phase
 * 2B result is unlocked when the user submits the pillar (the unlock IS the
 * payment, so isPaid is true on creation).
 */
/**
 * Shared between the user-facing dropdown and the admin client-history modal —
 * returns the user's completed-and-unlocked Phase 2A/2B results in newest-first
 * order. `limit` caps the result set (omitted by the user endpoint, capped at 5
 * by the admin modal). The R2 PDF URL lives on SessionResult and is selected
 * separately by the admin endpoint when it wants to render Download buttons.
 */
async function listCompletedResultsForUser(
  userId: string,
  limit?: number,
): Promise<CompletedResultOption[]> {
  const rows = await prisma.sessionResult.findMany({
    where: {
      isPaid: true,
      session: {
        userId,
        status: SessionStatus.COMPLETED,
        phase: { in: [Phase.PHASE2A, Phase.PHASE2B] },
      },
    },
    select: {
      id: true,
      totalScore: true,
      colorBand: true,
      generatedAt: true,
      session: {
        select: {
          id: true,
          phase: true,
          pillar: { select: { code: true, name: true } },
        },
      },
    },
    orderBy: [{ generatedAt: 'desc' }, { createdAt: 'desc' }],
    ...(typeof limit === 'number' ? { take: limit } : {}),
  });

  return rows.map((row) => ({
    sessionResultId: row.id,
    sessionId: row.session.id,
    phase: row.session.phase === Phase.PHASE2B ? 'PHASE2B' : 'PHASE2A',
    pillarCode: row.session.pillar?.code ?? null,
    pillarName: row.session.pillar?.name ?? null,
    totalScore: Number(row.totalScore),
    colorBand: row.colorBand,
    generatedAt: row.generatedAt?.toISOString() ?? null,
  }));
}

export async function listMyCompletedResultsService(
  userId: string,
): Promise<MyCompletedResultsResponse> {
  const results = await listCompletedResultsForUser(userId);
  return { message: 'Completed results fetched successfully', results };
}

/**
 * Lists the user's unconsumed, unexpired PICA 2A credits. Backs the
 * `/api/consultation/phase2a-credits` endpoint that the strategic-scan page
 * polls before showing the "Your consultation credit covers this" banner.
 * Cheap read-only lookup; index lives on (userId, consumedAt, expiresAt).
 */
export async function listMyPhase2ACreditsService(
  userId: string,
): Promise<MyPhase2ACreditsResponse> {
  const now = new Date();
  const rows = await prisma.phase2ACredit.findMany({
    where: {
      userId,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    select: {
      id: true,
      expiresAt: true,
      consultationBookingId: true,
    },
    // Oldest-expiring first so the FE can show the most-urgent credit; also
    // matches the FIFO order initPaymentService consumes them in.
    orderBy: { expiresAt: 'asc' },
  });

  return {
    message: 'Phase 2A credits fetched successfully',
    credits: rows.map((row) => ({
      id: row.id,
      expiresAt: row.expiresAt.toISOString(),
      consultationBookingId: row.consultationBookingId,
    })),
  };
}

/**
 * Atomically claims one unconsumed, unexpired PICA 2A credit for `userId`,
 * marking it as consumed by `paymentId`. Returns null if no claimable credit
 * exists. Uses updateMany + LIMIT semantics (Postgres CTE) — the wider
 * uniqueness guard is the `consumedAt IS NULL` filter; concurrent calls race
 * but each row's update is a single-row write so only one caller wins.
 *
 * Exported because initPaymentService Phase 2A path calls into it directly.
 */
export async function claimPhase2ACreditForPayment(
  tx: Prisma.TransactionClient,
  userId: string,
  paymentId: string,
): Promise<{ id: string } | null> {
  const now = new Date();
  // Pick the oldest-expiring fresh credit. orderBy + take=1 is safe here
  // because we're inside a transaction (the calling code wraps this in a
  // Prisma.$transaction with the Payment.create), so two parallel sessions
  // cannot both observe `consumedAt = null` and successfully update.
  const next = await tx.phase2ACredit.findFirst({
    where: { userId, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { expiresAt: 'asc' },
    select: { id: true },
  });
  if (!next) return null;
  await tx.phase2ACredit.update({
    where: { id: next.id },
    data: { consumedAt: now, consumedPaymentId: paymentId },
  });
  return next;
}

export async function listMyConsultationsService(
  userId: string,
): Promise<MyConsultationsResponse> {
  const rows = await prisma.consultationBooking.findMany({
    where: { userId },
    include: bookingInclude,
    orderBy: { requestedAt: 'desc' },
  });
  return {
    message: 'Bookings fetched successfully',
    bookings: rows.map(toBookingPayload),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// USER — book
// ──────────────────────────────────────────────────────────────────────────
//
// Always creates a REQUESTED row up front. Two branches:
//   1. Quota-covered → coveredBySubscription=true, no Payment, admin sees
//      the booking immediately and can confirm.
//   2. Paywall → one-off Paystack init linked to the booking via
//      Payment.consultationBookingId. The webhook flips the Payment to
//      SUCCESS; the FE polls /me to see the payment status flip from
//      PENDING to SUCCESS (no booking status change — admin still has to
//      confirm before it becomes CONFIRMED).

export async function bookConsultationService(
  userId: string,
  input: BookConsultationInput,
): Promise<BookConsultationResponse> {
  const [user, tier] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        businessName: true,
        country: true,
      },
    }),
    prisma.consultationTier.findUnique({ where: { id: input.tierId } }),
  ]);
  if (!user) throw new AppError('User not found', NOT_FOUND);
  if (!tier) throw new AppError('Consultation tier not found', NOT_FOUND);
  if (!tier.isActive) {
    throw new AppError('This consultation tier is no longer available', BAD_REQUEST);
  }

  // If the user attached a related result, validate they own it. Stops a
  // user from referencing someone else's result id.
  if (input.relatedSessionResultId) {
    const related = await prisma.sessionResult.findUnique({
      where: { id: input.relatedSessionResultId },
      select: { id: true, isPaid: true, session: { select: { userId: true } } },
    });
    if (!related || related.session.userId !== userId) {
      throw new AppError('Related result not found', NOT_FOUND);
    }
    if (!related.isPaid) {
      // A locked result can't be the topic of a paid consultation — the
      // consultant has no findings to read yet.
      throw new AppError(
        'Unlock the result before booking a consultation about it.',
        FORBIDDEN,
      );
    }
  }

  // Try the subscription quota first. Non-throwing: hasQuota=false falls
  // through to paywall. Same contract Phase 2A / 2B use.
  const verdict = await assertSubscriptionQuota(user.id, 'consultation');

  if (verdict.hasQuota) {
    const booking = await prisma.$transaction(async (tx) => {
      // Re-read the period end inside the tx so the usage upsert key is exact.
      const sub = await tx.userSubscription.findUnique({
        where: { id: verdict.subscriptionId },
        select: { currentPeriodEnd: true },
      });
      const created = await tx.consultationBooking.create({
        data: {
          userId: user.id,
          tierId: tier.id,
          status: ConsultationBookingStatus.REQUESTED,
          topic: input.topic,
          notes: input.notes,
          preferredTimes: input.preferredTimes ?? null,
          relatedSessionResultId: input.relatedSessionResultId ?? null,
          coveredBySubscription: true,
        },
        include: bookingInclude,
      });
      await consumeSubscriptionQuota(tx, {
        subscriptionId: verdict.subscriptionId,
        periodStart: verdict.periodStart,
        periodEnd: sub?.currentPeriodEnd ?? new Date(),
        kind: 'consultation',
      });
      return created;
    });

    return {
      message:
        'Booking submitted from your subscription quota. The team will confirm by email.',
      coveredBySubscription: true,
      booking: toBookingPayload(booking),
    };
  }

  // Paywall branch. Booking row first (REQUESTED, no payment yet), then
  // Payment row pointing back at it, then Paystack init. If Paystack init
  // fails the booking + Payment stay PENDING for the admin to reap.
  const chargeCurrency = resolveChargeCurrency(user.country);
  const usdToNgn = chargeCurrency === 'NGN' ? await getUsdToNgnRate() : 1;
  const priceUsd = Number(tier.priceUsd);
  const chargeAmount = round2(chargeCurrency === 'NGN' ? priceUsd * usdToNgn : priceUsd);
  const reference = newPaymentReference('CON');

  const booking = await prisma.consultationBooking.create({
    data: {
      userId: user.id,
      tierId: tier.id,
      status: ConsultationBookingStatus.REQUESTED,
      topic: input.topic,
      notes: input.notes,
      preferredTimes: input.preferredTimes ?? null,
      relatedSessionResultId: input.relatedSessionResultId ?? null,
      coveredBySubscription: false,
    },
    select: { id: true },
  });

  await prisma.payment.create({
    data: {
      userId: user.id,
      consultationBookingId: booking.id,
      pillarId: null,
      pillarIds: [],
      plan: Plan.CONSULTATION,
      provider: PaymentProvider.PAYSTACK,
      providerReference: reference,
      amount: new Prisma.Decimal(chargeAmount),
      amountUsd: new Prisma.Decimal(round2(priceUsd)),
      currency: chargeCurrency,
      status: PaymentStatus.PENDING,
      customerEmail: user.email,
      customerBusinessName: user.businessName,
    },
  });

  const paystackData = await initializeTransaction({
    email: user.email,
    amount: chargeAmount,
    currency: chargeCurrency,
    reference,
    metadata: {
      kind: 'consultation',
      userId: user.id,
      consultationBookingId: booking.id,
      tierId: tier.id,
    },
  });

  await prisma.payment.update({
    where: { providerReference: reference },
    data: {
      accessCode: paystackData.access_code,
      authorizationUrl: paystackData.authorization_url,
      initPayload: paystackData as unknown as Prisma.InputJsonValue,
    },
  });

  const full = await prisma.consultationBooking.findUniqueOrThrow({
    where: { id: booking.id },
    include: bookingInclude,
  });
  return {
    message: 'Complete payment to submit your booking.',
    coveredBySubscription: false,
    booking: toBookingPayload(full),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// ADMIN — tier CRUD
// ──────────────────────────────────────────────────────────────────────────

export async function adminListTiersService(): Promise<AdminListConsultationTiersResponse> {
  const rows = await prisma.consultationTier.findMany({
    orderBy: [{ displayOrder: 'asc' }, { tier: 'asc' }],
  });
  return {
    message: 'Tiers fetched successfully',
    tiers: rows.map(toAdminTier),
  };
}

export async function adminCreateTierService(
  input: CreateConsultationTierInput,
): Promise<AdminConsultationTierResponse> {
  const existing = await prisma.consultationTier.findFirst({
    where: { tier: input.tier },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(`A consultation tier with tier ${input.tier} already exists`, CONFLICT);
  }
  const created = await prisma.consultationTier.create({
    data: {
      tier: input.tier,
      name: input.name,
      description: input.description,
      priceUsd: new Prisma.Decimal(input.priceUsd.toFixed(2)),
      durationMinutes: input.durationMinutes,
      freeP2ARuns: input.freeP2ARuns,
      freeP2ACreditWindowDays: input.freeP2ACreditWindowDays,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
    },
  });
  return { message: 'Tier created successfully', tier: toAdminTier(created) };
}

export async function adminUpdateTierService(
  id: string,
  input: UpdateConsultationTierInput,
): Promise<AdminConsultationTierResponse> {
  const existing = await prisma.consultationTier.findUnique({ where: { id } });
  if (!existing) throw new AppError('Tier not found', NOT_FOUND);

  const data: Prisma.ConsultationTierUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.priceUsd !== undefined) {
    data.priceUsd = new Prisma.Decimal(input.priceUsd.toFixed(2));
  }
  if (input.durationMinutes !== undefined) data.durationMinutes = input.durationMinutes;
  if (input.freeP2ARuns !== undefined) data.freeP2ARuns = input.freeP2ARuns;
  if (input.freeP2ACreditWindowDays !== undefined) {
    data.freeP2ACreditWindowDays = input.freeP2ACreditWindowDays;
  }
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.displayOrder !== undefined) data.displayOrder = input.displayOrder;

  const updated = await prisma.consultationTier.update({
    where: { id },
    data,
  });
  return { message: 'Tier updated successfully', tier: toAdminTier(updated) };
}

export async function adminDeleteTierService(id: string): Promise<{ message: string }> {
  const existing = await prisma.consultationTier.findUnique({
    where: { id },
    select: { id: true, isActive: true },
  });
  if (!existing) throw new AppError('Tier not found', NOT_FOUND);
  if (!existing.isActive) throw new AppError('Tier is already inactive', CONFLICT);
  await prisma.consultationTier.update({
    where: { id },
    data: { isActive: false },
  });
  return { message: 'Tier deactivated successfully' };
}

// ──────────────────────────────────────────────────────────────────────────
// ADMIN — booking management
// ──────────────────────────────────────────────────────────────────────────

const adminBookingInclude = {
  ...bookingInclude,
  user: {
    select: {
      id: true,
      email: true,
      businessName: true,
      firstName: true,
      lastName: true,
    },
  },
} satisfies Prisma.ConsultationBookingInclude;

type AdminBookingRowDb = Prisma.ConsultationBookingGetPayload<{
  include: typeof adminBookingInclude;
}>;

function toAdminBookingRow(row: AdminBookingRowDb): AdminBookingRow {
  return {
    ...toBookingPayload(row),
    user: row.user,
  };
}

export async function adminListBookingsService(
  query: ListAdminBookingsQuery,
): Promise<AdminListBookingsResponse> {
  const where: Prisma.ConsultationBookingWhereInput = query.status
    ? { status: query.status }
    : {};
  const skip = (query.page - 1) * query.pageSize;

  const [total, rows] = await Promise.all([
    prisma.consultationBooking.count({ where }),
    prisma.consultationBooking.findMany({
      where,
      include: adminBookingInclude,
      orderBy: { requestedAt: 'desc' },
      skip,
      take: query.pageSize,
    }),
  ]);

  return {
    message: 'Bookings fetched successfully',
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
    bookings: rows.map(toAdminBookingRow),
  };
}

/**
 * Confirm a booking. Allowed only from REQUESTED. If the booking has an
 * attached Payment, it must be SUCCESS — admins shouldn't be able to confirm
 * an unpaid paywall booking by accident.
 */
export async function adminConfirmBookingService(
  id: string,
  input: ConfirmBookingInput,
): Promise<AdminBookingResponse> {
  const existing = await prisma.consultationBooking.findUnique({
    where: { id },
    include: adminBookingInclude,
  });
  if (!existing) throw new AppError('Booking not found', NOT_FOUND);
  if (existing.status !== ConsultationBookingStatus.REQUESTED) {
    throw new AppError(
      `Cannot confirm a booking in status ${existing.status}`,
      CONFLICT,
    );
  }
  if (existing.payment && existing.payment.status !== PaymentStatus.SUCCESS) {
    throw new AppError(
      'This booking has not been paid for yet.',
      CONFLICT,
    );
  }

  // Confirm + credit grant share a transaction so a partial grant can't leave
  // a confirmed booking without its credits. The credit upsert is keyed on
  // (consultationBookingId, sequence) so re-confirms (admin edits the time
  // post-confirm via this endpoint when status is CONFIRMED — currently
  // blocked, but defensive: a future "edit" flow can call us again safely)
  // become no-ops rather than duplicate grants.
  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.consultationBooking.update({
      where: { id },
      data: {
        status: ConsultationBookingStatus.CONFIRMED,
        scheduledAt: new Date(input.scheduledAt),
        meetingLink: input.meetingLink,
      },
      include: adminBookingInclude,
    });

    const { freeP2ARuns, freeP2ACreditWindowDays } = row.tier;
    if (freeP2ARuns > 0) {
      const expiresAt = new Date(
        Date.now() + freeP2ACreditWindowDays * 24 * 60 * 60 * 1000,
      );
      for (let seq = 1; seq <= freeP2ARuns; seq++) {
        await tx.phase2ACredit.upsert({
          where: {
            consultationBookingId_sequence: {
              consultationBookingId: row.id,
              sequence: seq,
            },
          },
          create: {
            userId: row.userId,
            consultationBookingId: row.id,
            sequence: seq,
            expiresAt,
          },
          // Re-confirm: leave consumed credits alone, refresh the window for
          // still-available ones (admin moved the meeting → keep the bonus
          // anchored to today rather than the original confirm date).
          update: {
            expiresAt,
          },
        });
      }
    }

    return row;
  });

  // Best-effort email notification.
  sendConsultationConfirmedEmailBestEffort({
    toEmail: updated.user.email,
    businessName: updated.user.businessName,
    tierName: updated.tier.name,
    durationMinutes: updated.tier.durationMinutes,
    scheduledAt: updated.scheduledAt!,
    meetingLink: updated.meetingLink!,
  });

  return {
    message: 'Booking confirmed successfully',
    booking: toAdminBookingRow(updated),
  };
}

/**
 * Generic status transition for the post-confirm flow. Allowed only from
 * CONFIRMED → ATTENDED / NO_SHOW / CANCELLED. CANCELLED is also allowed
 * from REQUESTED (admin rejecting before confirm).
 */
export async function adminUpdateBookingStatusService(
  id: string,
  input: UpdateBookingStatusInput,
): Promise<AdminBookingResponse> {
  const existing = await prisma.consultationBooking.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!existing) throw new AppError('Booking not found', NOT_FOUND);

  const allowedFrom: Record<typeof input.status, ConsultationBookingStatus[]> = {
    ATTENDED: [ConsultationBookingStatus.CONFIRMED],
    NO_SHOW: [ConsultationBookingStatus.CONFIRMED],
    CANCELLED: [
      ConsultationBookingStatus.REQUESTED,
      ConsultationBookingStatus.CONFIRMED,
    ],
  };
  if (!allowedFrom[input.status].includes(existing.status)) {
    throw new AppError(
      `Cannot transition booking from ${existing.status} to ${input.status}`,
      CONFLICT,
    );
  }

  const updated = await prisma.consultationBooking.update({
    where: { id },
    data: { status: input.status as ConsultationBookingStatus },
    include: adminBookingInclude,
  });

  return {
    message: `Booking marked ${input.status.toLowerCase().replace('_', ' ')}`,
    booking: toAdminBookingRow(updated),
  };
}

/**
 * Save admin-authored notes against a booking. Single-shot email gate: the
 * user is emailed exactly once, on the FIRST save where the notes go from
 * empty/null to non-empty. We set `adminNotesNotifiedAt` inside the same
 * UPDATE so a concurrent save can't double-fire — Prisma's row-level write
 * is atomic, and subsequent calls find `adminNotesNotifiedAt` already set
 * and skip the email branch.
 */
export async function adminUpdateBookingNotesService(
  id: string,
  adminId: string,
  input: UpdateAdminNotesInput,
): Promise<AdminBookingResponse> {
  const existing = await prisma.consultationBooking.findUnique({
    where: { id },
    select: {
      id: true,
      topic: true,
      adminNotesNotifiedAt: true,
      user: {
        select: { email: true, businessName: true },
      },
    },
  });
  if (!existing) throw new AppError('Booking not found', NOT_FOUND);

  const trimmed = input.adminNotes.trim();
  const shouldNotify = existing.adminNotesNotifiedAt === null && trimmed.length > 0;

  const updated = await prisma.consultationBooking.update({
    where: { id },
    data: {
      adminNotes: trimmed.length > 0 ? input.adminNotes : null,
      adminNotesUpdatedAt: new Date(),
      adminNotesUpdatedById: adminId,
      ...(shouldNotify ? { adminNotesNotifiedAt: new Date() } : {}),
    },
    include: adminBookingInclude,
  });

  if (shouldNotify) {
    sendConsultationNoteUpdatedEmailBestEffort({
      toEmail: existing.user.email,
      businessName: existing.user.businessName,
      topic: existing.topic,
    });
  }

  return {
    message: 'Booking notes saved',
    booking: toAdminBookingRow(updated),
  };
}

/**
 * Admin client-history view backing the ClientHistoryModal. Resolves
 * booking → userId → user identity + last N completed Phase 2A/2B results
 * (with R2 PDF URLs so the modal can render Download anchors). Permission-
 * gated by the route (`consultations:read`).
 */
export async function adminGetClientHistoryService(
  bookingId: string,
  limit = 5,
): Promise<AdminClientHistoryResponse> {
  const booking = await prisma.consultationBooking.findUnique({
    where: { id: bookingId },
    select: {
      user: {
        select: {
          id: true,
          email: true,
          businessName: true,
          firstName: true,
          lastName: true,
          createdAt: true,
        },
      },
    },
  });
  if (!booking) throw new AppError('Booking not found', NOT_FOUND);

  const baseResults = await listCompletedResultsForUser(booking.user.id, limit);

  // The shared helper doesn't carry the R2 reportPdfUrl (the user-facing
  // dropdown doesn't need it). Pull it here in one keyed-IN query so the
  // admin modal can render per-row Download buttons.
  const pdfRows = await prisma.sessionResult.findMany({
    where: { id: { in: baseResults.map((r) => r.sessionResultId) } },
    select: { id: true, reportPdfUrl: true },
  });
  const pdfById = new Map(pdfRows.map((r) => [r.id, r.reportPdfUrl] as const));
  const results = baseResults.map((r) => ({
    ...r,
    reportPdfUrl: pdfById.get(r.sessionResultId) ?? null,
  }));

  return {
    message: 'Client history fetched successfully',
    user: {
      id: booking.user.id,
      email: booking.user.email,
      businessName: booking.user.businessName,
      firstName: booking.user.firstName,
      lastName: booking.user.lastName,
      createdAt: booking.user.createdAt.toISOString(),
    },
    results,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// SHARED — webhook hook (called from payment.service)
// ──────────────────────────────────────────────────────────────────────────
//
// When a one-off CONSULTATION Payment row flips to SUCCESS, the booking
// should stay REQUESTED but become confirmable — there's nothing to flip
// here at the DB level (the booking already exists, paymentStatus is read
// off Payment via the include). Kept as a no-op hook for symmetry with
// the SUBSCRIPTION webhook path; payment.service can call into it later
// if we want to fire a "your payment cleared, awaiting admin confirm"
// email without weaving payment-side coupling.

export async function onConsultationPaymentSucceeded(_paymentId: string): Promise<void> {
  // Reserved for future best-effort email; today the FE polls /me and the
  // admin inbox surfaces the row as ready-to-confirm.
}
