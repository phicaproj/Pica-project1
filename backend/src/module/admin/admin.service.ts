import { PaymentStatus, Prisma, UserRole } from '@prisma/client';
import prisma from '../../Config/db';
import type {
  ListUsersQuery,
  ListUsersResponse,
  AdminUserRow,
  ShowUserResponse,
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
