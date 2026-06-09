import bcrypt from 'bcrypt';
import { PaymentStatus, Prisma, UserRole, UserStatus } from '@prisma/client';
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
  UpdateUserStatusInput,
  UserSubListQuery,
  CreateRoleInput,
  UpdateRoleInput,
  AssignRoleInput,
  InviteAdminInput,
  InviteAdminResponse,
  UpdateAdminProfileInput,
  AdminProfileResponse,
} from './admin.types';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND } from '../../service/shared/http';
import { generateInviteToken } from '../../service/shared/generateToken';
import { sendAdminInviteEmail } from '../../service/shared/email.service';
import { APP_URL } from '../../Config/env';

const ACTIVE_WINDOW_DAYS = 30;

export async function getAllUsersService(query: ListUsersQuery): Promise<ListUsersResponse> {
  const { page, search, businessSize, plan, active, role } = query;
  const pageSize = query.limit ?? query.pageSize;

  const targetRole = role === 'ADMIN' ? UserRole.ADMIN : UserRole.USER;

  const where: Prisma.UserWhereInput = {
    role: targetRole,
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
        status: true,
        adminRoleId: true,
        adminRole: {
          select: {
            id: true,
            name: true,
            permissions: true,
          },
        },
        createdAt: true,
        payments: {
          where: { status: PaymentStatus.SUCCESS },
          orderBy: { paidAt: 'desc' },
          take: 1,
          select: { plan: true },
        },
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
      status: row.status,
      adminRoleId: row.adminRoleId,
      adminRole: row.adminRole,
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
      status: true,
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
      status: user.status,
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

/**
 * Suspend or reactivate a user. DISABLED takes effect immediately: the login
 * services reject disabled accounts, and the authenticate middleware
 * re-checks status on every request so live tokens stop working too.
 * Admin accounts cannot be suspended through this endpoint.
 */
export async function updateUserStatusService(
  userId: string,
  input: UpdateUserStatusInput
): Promise<{ message: string; user: { id: string; status: UserStatus } }> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true },
  });

  if (!user) throw new AppError('User not found', NOT_FOUND);

  if (user.role === UserRole.ADMIN) {
    throw new AppError('Admin accounts cannot be suspended', CONFLICT);
  }

  if (user.status === input.status) {
    return {
      message: `User is already ${input.status}`,
      user: { id: user.id, status: user.status },
    };
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: input.status },
    select: { id: true, status: true },
  });

  return {
    message:
      input.status === UserStatus.DISABLED
        ? 'User suspended successfully'
        : 'User reactivated successfully',
    user: updated,
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

// ── Admin Roles & Permissions Services ──────────────────────────────────────────

export async function listRolesService() {
  return prisma.adminRole.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
}

export async function createRoleService(input: CreateRoleInput) {
  const existing = await prisma.adminRole.findUnique({
    where: { name: input.name.toUpperCase() },
  });
  if (existing) {
    throw new AppError('Role name already exists', CONFLICT);
  }
  return prisma.adminRole.create({
    data: {
      name: input.name.toUpperCase(),
      description: input.description,
      permissions: input.permissions,
    },
  });
}

export async function updateRoleService(id: string, input: UpdateRoleInput) {
  const role = await prisma.adminRole.findUnique({ where: { id } });
  if (!role) {
    throw new AppError('Role not found', NOT_FOUND);
  }
  if (role.name === 'SUPER ADMIN') {
    throw new AppError('The Super Admin role cannot be modified', CONFLICT);
  }
  if (input.name) {
    const existingName = await prisma.adminRole.findFirst({
      where: {
        name: input.name.toUpperCase(),
        NOT: { id },
      },
    });
    if (existingName) {
      throw new AppError('Another role with this name already exists', CONFLICT);
    }
  }
  return prisma.adminRole.update({
    where: { id },
    data: {
      ...(input.name ? { name: input.name.toUpperCase() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.permissions ? { permissions: input.permissions } : {}),
    },
  });
}

export async function deleteRoleService(id: string) {
  const role = await prisma.adminRole.findUnique({
    where: { id },
    include: {
      _count: {
        select: { users: true },
      },
    },
  });
  if (!role) {
    throw new AppError('Role not found', NOT_FOUND);
  }
  if (role.name === 'SUPER ADMIN') {
    throw new AppError('The Super Admin role cannot be deleted', CONFLICT);
  }
  if (role._count.users > 0) {
    throw new AppError('Cannot delete a role that is assigned to users. Reassign users first.', CONFLICT);
  }
  return prisma.adminRole.delete({ where: { id } });
}

export async function assignRoleToAdminService(adminId: string, roleId: string | null) {
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });
  if (!admin) {
    throw new AppError('Admin user not found', NOT_FOUND);
  }
  if (admin.role !== UserRole.ADMIN) {
    throw new AppError('User is not an administrator', CONFLICT);
  }

  if (roleId) {
    const role = await prisma.adminRole.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Role not found', NOT_FOUND);
    }
  }

  return prisma.user.update({
    where: { id: adminId },
    data: { adminRoleId: roleId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      adminRoleId: true,
      adminRole: {
        select: {
          id: true,
          name: true,
          permissions: true,
        },
      },
    },
  });
}

// ── Admin Onboarding (invite staff) ─────────────────────────────────────────
// Creates an ADMIN account with NO password set (passwordHash: null), so it
// cannot be logged into until the invitee activates it by setting their own
// password through the 24h tokenized link. The whole create + email is wrapped
// in a transaction: if the invite email fails to send, the half-provisioned
// account is rolled back so the email can be re-invited cleanly.
export async function inviteAdminService(input: InviteAdminInput): Promise<InviteAdminResponse> {
  const normalizedEmail = input.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });
  if (existingUser) {
    throw new AppError('This email already belongs to an existing account', CONFLICT);
  }

  if (input.adminRoleId) {
    const role = await prisma.adminRole.findUnique({ where: { id: input.adminRoleId } });
    if (!role) {
      throw new AppError('Role not found', NOT_FOUND);
    }
  }

  const admin = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash: null,
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
        adminRoleId: input.adminRoleId ?? null,
      },
      select: {
        id: true,
        email: true,
        adminRole: {
          select: { id: true, name: true, permissions: true },
        },
      },
    });

    const inviteToken = generateInviteToken({ email: normalizedEmail, purpose: 'admin-invite' });
    const inviteLink = `${APP_URL}/Auth/accept-invite?token=${encodeURIComponent(inviteToken)}`;

    const sent = await sendAdminInviteEmail(created.email, inviteLink, created.adminRole?.name);
    if (!sent.success) {
      // Throwing rolls back the transaction so no orphan account is left behind.
      throw new AppError(
        'Could not send the invitation email. Please verify the address and try again.',
        CONFLICT
      );
    }

    return created;
  });

  return {
    message: `Invitation sent to ${admin.email}`,
    admin: {
      id: admin.id,
      email: admin.email,
      adminRole: admin.adminRole,
    },
  };
}

// ── Admin self-service profile (personal info) ──────────────────────────────

function shapeAdminProfile(user: {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  businessName: string | null;
  avatarUrl: string | null;
}): AdminProfileResponse {
  return {
    message: 'Profile fetched successfully',
    profile: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      businessName: user.businessName,
      avatarUrl: user.avatarUrl,
    },
  };
}

export async function getAdminProfileService(userId: string): Promise<AdminProfileResponse> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      businessName: true,
      avatarUrl: true,
    },
  });
  if (!user) {
    throw new AppError('Admin user not found', NOT_FOUND);
  }
  return shapeAdminProfile(user);
}

export async function updateAdminProfileService(
  userId: string,
  input: UpdateAdminProfileInput
): Promise<AdminProfileResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new AppError('Admin user not found', NOT_FOUND);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.firstName !== undefined ? { firstName: input.firstName } : {}),
      ...(input.lastName !== undefined ? { lastName: input.lastName } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.businessName !== undefined ? { businessName: input.businessName } : {}),
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      businessName: true,
      avatarUrl: true,
    },
  });

  return { ...shapeAdminProfile(updated), message: 'Profile updated successfully' };
}
