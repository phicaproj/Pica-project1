import { PaymentStatus, Prisma, UserRole } from '@prisma/client';
import prisma from '../../Config/db';
import type {
  ListUsersQuery,
  ListUsersResponse,
  ListUserPaymentsResponse,
  ListUserSessionsResponse,
  AdminUserRow,
  AdminSessionResponseRow,
  ShowSessionResponse,
  ShowUserResponse,
  UserSubListQuery,
} from './admin.types';
import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';

const ACTIVE_WINDOW_DAYS = 30;

export async function getAllUsersService(query: ListUsersQuery): Promise<ListUsersResponse> {
  const { page, search, businessSize, plan, active } = query;
  const pageSize = query.limit ?? query.pageSize;

  const where: Prisma.UserWhereInput = {
    role: UserRole.USER,
    ...(businessSize ? { businessSize } : {}),
    ...(search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { businessName: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    // SUBSCRIPTION filter: 'FREE' = no successful payment; a plan value = at
    // least one SUCCESS payment on that plan.
    ...(plan === 'FREE'
      ? { payments: { none: { status: PaymentStatus.SUCCESS } } }
      : plan
        ? { payments: { some: { status: PaymentStatus.SUCCESS, plan } } }
        : {}),
  };

  const skip = (page - 1) * pageSize;

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        businessName: true,
        businessSize: true,
        industry: true,
        createdAt: true,
        // SUBSCRIPTION — the user's last paid plan: most recent SUCCESS payment.
        payments: {
          where: { status: PaymentStatus.SUCCESS },
          orderBy: { paidAt: 'desc' },
          take: 1,
          select: { plan: true },
        },
        // LAST SEEN — most recent session activity.
        sessions: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { updatedAt: true },
        },
      },
    }),
  ]);

  const activeThreshold = new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  let users: AdminUserRow[] = rows.map((row) => {
    const lastSeenAt = row.sessions[0]?.updatedAt ?? null;
    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      avatarUrl: row.avatarUrl,
      businessName: row.businessName,
      businessSize: row.businessSize,
      industry: row.industry,
      subscriptionPlan: row.payments[0]?.plan ?? null,
      isActive: lastSeenAt !== null && lastSeenAt >= activeThreshold,
      lastSeenAt,
      createdAt: row.createdAt,
    };
  });

  // ACTIVE STATUS is derived (not a DB column), so the `active` filter is
  // applied in memory after derivation. Note: this filters the current page
  // only; `total` still reflects the unfiltered count.
  if (active !== undefined) {
    users = users.filter((u) => u.isActive === active);
  }

  return {
    message: 'Users fetched successfully',
    page,
    pageSize,
    limit: pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    users,
  };
}

export async function getUserDetailsService(userId: string): Promise<ShowUserResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatarUrl: true,
      businessName: true,
      businessSize: true,
      industry: true,
      createdAt: true,
      payments: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          plan: true,
          amount: true,
          currency: true,
          status: true,
          providerReference: true,
          paidAt: true,
          updatedAt: true,
        },
      },
      sessions: {
        orderBy: { updatedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          updatedAt: true,
          status: true,
          phase: true,
          pillarId: true,
          pillar: { select: { name: true } },
          result: { select: { reportPdfUrl: true } },
        },
      },
    },
  });

  if (!user) throw new AppError('User not found', NOT_FOUND);

  const [totalSessions, completedSessions, totalSuccessfulPayments, spend, lastPaid] = await Promise.all([
    prisma.assessmentSession.count({ where: { userId } }),
    prisma.assessmentSession.count({
      where: { userId, status: { in: ['COMPLETED', 'PAID', 'REPORT_GENERATED'] } },
    }),
    prisma.payment.count({ where: { userId, status: PaymentStatus.SUCCESS } }),
    prisma.payment.aggregate({ _sum: { amount: true }, where: { userId, status: 'SUCCESS' } }),
    prisma.payment.findFirst({
      where: { userId, status: 'SUCCESS' },
      orderBy: { paidAt: 'desc' },
      select: { plan: true },
    }),
  ]);

  const totalSpent = spend._sum.amount?.toNumber() ?? 0;

  const isActive =
    user.sessions.length > 0 &&
    user.sessions[0].updatedAt >= new Date(Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const lastSeenAt = user.sessions[0]?.updatedAt ?? null;

  return {
    message: 'User details fetched successfully',
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      businessName: user.businessName,
      businessSize: user.businessSize,
      industry: user.industry,
      subscriptionPlan: lastPaid?.plan ?? null,
      isActive,
      lastSeenAt,
      createdAt: user.createdAt,
      recentSessions: user.sessions.map((session) => ({
        id: session.id,
        updatedAt: session.updatedAt,
        status: session.status,
        phase: session.phase,
        pillarId: session.pillarId,
        pillarName: session.pillar?.name ?? null,
        reportPdfUrl: session.result?.reportPdfUrl ?? null,
      })),
      recentPayments: user.payments.map((payment) => ({
        id: payment.id,
        plan: payment.plan,
        amount: payment.amount.toNumber(),
        status: payment.status,
        currency: payment.currency,
        reference: payment.providerReference,
        paidAt: payment.paidAt,
        updatedAt: payment.updatedAt,
      })),
      totalSpent,
      totalSessions,
      completedSessions,
      totalSuccessfulPayments,
    },
  };
}

/** Throws NOT_FOUND unless a user with this id exists. */
async function assertUserExists(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new AppError('User not found', NOT_FOUND);
}

/**
 * Paginated session history for one user — backs the user detail page's
 * sessions table (5 per page by default). Includes the result summary so the
 * row can show the score/band without opening the session modal.
 */
export async function listUserSessionsService(
  userId: string,
  query: UserSubListQuery
): Promise<ListUserSessionsResponse> {
  await assertUserExists(userId);

  const { page, pageSize } = query;
  const where: Prisma.AssessmentSessionWhereInput = { userId };

  const [total, sessions] = await Promise.all([
    prisma.assessmentSession.count({ where }),
    prisma.assessmentSession.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        updatedAt: true,
        status: true,
        phase: true,
        pillarId: true,
        startedAt: true,
        completedAt: true,
        pillar: { select: { name: true } },
        result: {
          select: { reportPdfUrl: true, totalScore: true, colorBand: true },
        },
      },
    }),
  ]);

  return {
    message: 'User sessions fetched successfully',
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    sessions: sessions.map((session) => ({
      id: session.id,
      updatedAt: session.updatedAt,
      status: session.status,
      phase: session.phase,
      pillarId: session.pillarId,
      pillarName: session.pillar?.name ?? null,
      reportPdfUrl: session.result?.reportPdfUrl ?? null,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      totalScore: session.result ? Number(session.result.totalScore) : null,
      colorBand: session.result?.colorBand ?? null,
    })),
  };
}

/**
 * Paginated payment history for one user — backs the user detail page's
 * payments table (5 per page by default).
 */
export async function listUserPaymentsService(
  userId: string,
  query: UserSubListQuery
): Promise<ListUserPaymentsResponse> {
  await assertUserExists(userId);

  const { page, pageSize } = query;
  const where: Prisma.PaymentWhereInput = { userId };

  const [total, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        plan: true,
        amount: true,
        currency: true,
        status: true,
        providerReference: true,
        paidAt: true,
        updatedAt: true,
      },
    }),
  ]);

  return {
    message: 'User payments fetched successfully',
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    payments: payments.map((payment) => ({
      id: payment.id,
      plan: payment.plan,
      amount: payment.amount.toNumber(),
      status: payment.status,
      currency: payment.currency,
      reference: payment.providerReference,
      paidAt: payment.paidAt,
      updatedAt: payment.updatedAt,
    })),
  };
}

/**
 * Full session breakdown for the admin session modal: result summary,
 * per-pillar scores, and every answered question with the selected option.
 * NOT paywalled — unlike the public result endpoint, admins always see the
 * full data. Works for in-progress sessions too (result is just null and the
 * responses list shows what's been answered so far).
 */
export async function getSessionDetailsService(sessionId: string): Promise<ShowSessionResponse> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      phase: true,
      status: true,
      businessSize: true,
      pillarId: true,
      startedAt: true,
      completedAt: true,
      leadEmail: true,
      pillar: { select: { name: true } },
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      result: {
        select: {
          totalScore: true,
          colorBand: true,
          hasAnyKnockout: true,
          isPaid: true,
          reportPdfUrl: true,
        },
      },
    },
  });

  if (!session) throw new AppError('Assessment session not found', NOT_FOUND);

  const [pillarScores, responses] = await Promise.all([
    prisma.sessionPillarScore.findMany({
      where: { sessionId },
      select: {
        pillarId: true,
        rawScore: true,
        maxPossibleScore: true,
        weightedScore: true,
        hasKnockout: true,
        colorBand: true,
        insightRuleApplied: true,
        pillar: { select: { code: true, name: true, displayOrder: true } },
      },
      orderBy: { pillar: { displayOrder: 'asc' } },
    }),
    prisma.sessionResponse.findMany({
      where: { sessionId },
      select: {
        questionId: true,
        scoreAtTime: true,
        riskTypeAtTime: true,
        answeredAt: true,
        question: {
          select: {
            questionCode: true,
            questionText: true,
            pillar: { select: { code: true, name: true, displayOrder: true } },
            options: { select: { score: true } },
          },
        },
        selectedOption: { select: { optionLabel: true, optionText: true } },
      },
      orderBy: [
        { question: { pillar: { displayOrder: 'asc' } } },
        { question: { displayOrder: 'asc' } },
      ],
    }),
  ]);

  const userName = session.user
    ? `${session.user.firstName ?? ''} ${session.user.lastName ?? ''}`.trim() || null
    : null;

  return {
    message: 'Session details fetched successfully',
    session: {
      id: session.id,
      phase: session.phase,
      status: session.status,
      businessSize: session.businessSize,
      pillarId: session.pillarId,
      pillarName: session.pillar?.name ?? null,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      user: {
        id: session.user?.id ?? null,
        name: userName,
        email: session.user?.email ?? session.leadEmail ?? null,
      },
      result: session.result
        ? {
            totalScore: Number(session.result.totalScore),
            colorBand: session.result.colorBand,
            hasAnyKnockout: session.result.hasAnyKnockout,
            isPaid: session.result.isPaid,
            reportPdfUrl: session.result.reportPdfUrl,
          }
        : null,
      pillarScores: pillarScores.map((score) => ({
        pillarId: score.pillarId,
        pillarCode: score.pillar.code,
        pillarName: score.pillar.name,
        rawScore: score.rawScore,
        maxPossibleScore: score.maxPossibleScore,
        weightedScore: Number(score.weightedScore),
        hasKnockout: score.hasKnockout,
        colorBand: score.colorBand,
        insightRuleApplied: score.insightRuleApplied,
      })),
      responses: responses.map<AdminSessionResponseRow>((response) => ({
        questionId: response.questionId,
        pillarCode: response.question.pillar.code,
        pillarName: response.question.pillar.name,
        questionCode: response.question.questionCode,
        questionText: response.question.questionText,
        selectedLabel: response.selectedOption.optionLabel,
        selectedText: response.selectedOption.optionText,
        scoreAtTime: response.scoreAtTime,
        maxScore: response.question.options.reduce((max, o) => Math.max(max, o.score), 0),
        riskTypeAtTime: response.riskTypeAtTime,
        answeredAt: response.answeredAt,
      })),
    },
  };
}
