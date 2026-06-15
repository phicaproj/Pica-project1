import z from 'zod';
import { UserStatus } from '@prisma/client';
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
  role: z.enum(['USER', 'ADMIN']).optional(),
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
  // Account standing — ACTIVE or DISABLED (suspended). Distinct from
  // isActive, which is derived from recent session activity.
  status: UserStatus;

  // Roles assignment (for admin users)
  adminRoleId?: string | null;
  adminRole?: {
    id: string;
    name: string;
    permissions: string[];
  } | null;

  // Per-person admin access (source of truth for new admins).
  department?: string | null;
  permissions?: string[];

  createdAt: Date;
};

// Suspend / reactivate payload for PATCH /api/admin/users/:id/status.
export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus, {
    message: 'status must be one of: ACTIVE, DISABLED',
  }),
});

export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

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
    // USD-normalised amount (null only for legacy rows missing back-fill).
    // FE rolls totals up off this, but renders per-row in the captured
    // `currency` for fidelity.
    amountUsd: number | null;
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

// ── Admin Roles & Permissions Schemas ──────────────────────────────────────────
export const createRoleSchema = z.object({
  name: z.string().trim().min(1, 'Role name cannot be empty').max(50),
  description: z.string().trim().max(255).optional(),
  permissions: z.array(z.string()).default([]),
});

export const updateRoleSchema = z.object({
  name: z.string().trim().min(1).max(50).optional(),
  description: z.string().trim().max(255).optional(),
  permissions: z.array(z.string()).optional(),
});

export const assignRoleSchema = z.object({
  adminRoleId: z.string().uuid().nullable(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;

// Canonical granular permission keys. MUST stay in sync with the frontend
// PERMISSIONS_LIST in my-app/app/admin/settings/page.tsx — both derive from the
// same permission taxonomy. Used to validate invite / access-edit payloads so
// arbitrary strings can't be written to a User's permissions.
export const PERMISSION_KEYS = [
  'users:read',
  'users:write',
  'questions:read',
  'questions:write',
  'scoring:read',
  'scoring:write',
  'coupons:read',
  'coupons:write',
  'analytics:read',
  'ledger:read',
  'ledger:write',
  'settings:read',
  'settings:write',
] as const;

const permissionKeySchema = z.enum(PERMISSION_KEYS);

// ── Admin Onboarding (invite staff) ─────────────────────────────────────────
export const inviteAdminSchema = z.object({
  email: z.email('Invalid email address'),
  department: z.string().trim().min(1, 'Department is required').max(60),
  permissions: z.array(permissionKeySchema).default([]),
});

export type InviteAdminInput = z.infer<typeof inviteAdminSchema>;

export type InviteAdminResponse = {
  message: string;
  admin: {
    id: string;
    email: string;
    department: string | null;
    permissions: string[];
  };
};

// ── Edit an existing admin's access (department + per-person permissions) ────
export const updateAdminAccessSchema = z.object({
  department: z.string().trim().min(1).max(60).optional(),
  permissions: z.array(permissionKeySchema).optional(),
});

export type UpdateAdminAccessInput = z.infer<typeof updateAdminAccessSchema>;

// ── Admin self-service profile (personal info) ──────────────────────────────
export const updateAdminProfileSchema = z.object({
  firstName: z.string().trim().min(1).max(60).optional(),
  lastName: z.string().trim().min(1).max(60).optional(),
  phone: z
    .string()
    .regex(/^\+?\d{10,15}$/, 'Phone number must be 10–15 digits, optionally starting with +')
    .optional(),
  businessName: z.string().trim().min(1).max(100).optional(),
});

export type UpdateAdminProfileInput = z.infer<typeof updateAdminProfileSchema>;

export type AdminProfileResponse = {
  message: string;
  profile: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    businessName: string | null;
    avatarUrl: string | null;
  };
};
