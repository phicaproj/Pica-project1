import z from 'zod';
import type { AssessmentSession, BusinessSize, Payment, Plan } from '@prisma/client';

export const listUsersQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
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
  }[];
  recentPayments: {
    id: string;
    amount: number;
    plan: Payment['plan'];
    updatedAt: Payment['updatedAt'];
  }[];
  totalSpent: number;
  totalSessions: number;
  completedSessions: number;
};

export type ListUsersResponse = {
  message: string;
  page: number;
  pageSize: number;
  total: number;
  users: AdminUserRow[];
};

export type ShowUserResponse = {
  message: string;
  user: AdminUserDetails;
};
