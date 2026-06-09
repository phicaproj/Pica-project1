import z from 'zod';
import type {
  AssessmentSession,
  BusinessSize,
  ColorBand,
  InsightRule,
  Payment,
  PaymentStatus,
  Plan,
  RiskType,
} from '@prisma/client';

export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().min(1).max(100).optional(),
  businessSize: z.enum(['SMALL', 'MEDIUM']).optional(),
  plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR', 'FREE']).optional(),
  active: z.coerce.boolean().optional(),
});

export const showUserQuery = z.object({
  id: z.uuid(),
});

export type ListUsersQuery = z.infer<typeof listUsersQuery>;
export type ShowUserQuery = z.infer<typeof showUserQuery>;

export type AdminUserRow = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  avatarUrl: string | null;

  // BUSINESS TYPE
  businessName: string | null;
  businessSize: BusinessSize | null;
  industry: string | null;

  subscriptionPlan: Plan | null;
  isActive: boolean;
  lastSeenAt: Date | null;

  createdAt: Date;
};

export type AdminUserDetails = AdminUserRow & {
  recentSessions: {
    id: string;
    status: AssessmentSession['status'];
    updatedAt: Date;
    phase: AssessmentSession['phase'];
    pillarId: string | null;
    pillarName: string | null;
    reportPdfUrl: string | null;
  }[];
  recentPayments: {
    id: string;
    amount: number;
    plan: Payment['plan'];
    status: PaymentStatus;
    currency: string;
    reference: string;
    paidAt: Date | null;
    updatedAt: Payment['updatedAt'];
  }[];
  totalSpent: number;
  totalSessions: number;
  completedSessions: number;
  totalSuccessfulPayments: number;
};

export type ListUsersResponse = {
  message: string;
  page: number;
  pageSize: number;
  limit: number;
  total: number;
  totalPages: number;
  users: AdminUserRow[];
};

export type ShowUserResponse = {
  message: string;
  user: AdminUserDetails;
};

// ── Paginated per-user sessions / payments ─────────────────────────────────
// Backs the user detail page tables: 5 rows per page by default.

export const userSubListQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(5),
});

export type UserSubListQuery = z.infer<typeof userSubListQuery>;

export type AdminUserSessionRow = AdminUserDetails['recentSessions'][number] & {
  startedAt: Date;
  completedAt: Date | null;
  totalScore: number | null;
  colorBand: ColorBand | null;
};

export type ListUserSessionsResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  sessions: AdminUserSessionRow[];
};

export type ListUserPaymentsResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  payments: AdminUserDetails['recentPayments'];
};

// ── Admin session detail (score + answered questions) ──────────────────────
// Backs the session modal on the user detail page. Unlike the public result
// endpoint this is NOT paywalled — admins always see the full breakdown.

export type AdminSessionResponseRow = {
  questionId: string;
  pillarCode: string;
  pillarName: string;
  questionCode: string;
  questionText: string;
  selectedLabel: string;
  selectedText: string;
  scoreAtTime: number;
  maxScore: number;
  riskTypeAtTime: RiskType;
  answeredAt: Date;
};

export type AdminSessionPillarScore = {
  pillarId: string;
  pillarCode: string;
  pillarName: string;
  rawScore: number;
  maxPossibleScore: number;
  weightedScore: number;
  hasKnockout: boolean;
  colorBand: ColorBand;
  insightRuleApplied: InsightRule;
};

export type AdminSessionDetail = {
  id: string;
  phase: AssessmentSession['phase'];
  status: AssessmentSession['status'];
  businessSize: BusinessSize | null;
  pillarId: string | null;
  pillarName: string | null;
  startedAt: Date;
  completedAt: Date | null;
  user: {
    id: string | null;
    name: string | null;
    email: string | null;
  };
  result: {
    totalScore: number;
    colorBand: ColorBand;
    hasAnyKnockout: boolean;
    isPaid: boolean;
    reportPdfUrl: string | null;
  } | null;
  pillarScores: AdminSessionPillarScore[];
  responses: AdminSessionResponseRow[];
};

export type ShowSessionResponse = {
  message: string;
  session: AdminSessionDetail;
};
