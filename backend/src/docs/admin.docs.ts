import { z } from 'zod';
import { registry, errorResponse } from './registry';
import {
  assignRoleSchema,
  createRoleSchema,
  inviteAdminSchema,
  PERMISSION_KEYS,
  updateAdminAccessSchema,
  updateAdminProfileSchema,
  updateRoleSchema,
} from '../module/admin/admin.types';
import { updateAppSettingsSchema } from '../module/settings/settings.types';
import {
  addOptionSchema,
  createQuestionSchema,
  listAdminQuestionsQuerySchema,
  updateOptionSchema,
  updateQuestionSchema,
} from '../module/question/question.types';

const AdminUserRowSchema = registry.register(
  'AdminUserRow',
  z
    .object({
      id: z.string().uuid(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      email: z.string().email(),
      phone: z.string().nullable(),
      avatarUrl: z.string().url().nullable(),
      businessName: z.string().nullable(),
      businessSize: z.enum(['SMALL', 'MEDIUM']).nullable(),
      industry: z.string().nullable(),
      subscriptionPlan: z.enum(['PHASE2A', 'PHASE2B_PILLAR', 'FREE']).nullable(),
      isActive: z.boolean(),
      lastSeenAt: z.string().datetime().nullable(),
      status: z.enum(['ACTIVE', 'DISABLED']),
      createdAt: z.string().datetime(),
    })
    .openapi('AdminUserRow')
);

const AdminUserDetailsSchema = registry.register(
  'AdminUserDetails',
  AdminUserRowSchema.extend({
    recentSessions: z.array(
      z.object({
        id: z.string().uuid(),
        status: z.string(),
        updatedAt: z.string().datetime(),
        phase: z.string(),
      })
    ),
    recentPayments: z.array(
      z.object({
        id: z.string().uuid(),
        amount: z.number(),
        plan: z.string(),
        updatedAt: z.string().datetime(),
      })
    ),
    totalSpent: z.number(),
    totalSessions: z.number(),
    completedSessions: z.number(),
  }).openapi('AdminUserDetails')
);

// ----- GET /api/admin/users --------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/users',
  tags: ['Admin'],
  summary: 'List users registered on the platform',
  description:
    'Admin-only. Returns a paginated list of users, with support for searching, filtering by business size, subscription plan, or activity status.',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      page: z.coerce
        .number()
        .int()
        .min(1)
        .default(1)
        .openapi({ param: { name: 'page', in: 'query' } }),
      pageSize: z.coerce
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .openapi({ param: { name: 'pageSize', in: 'query' } }),
      search: z
        .string()
        .trim()
        .min(1)
        .max(100)
        .optional()
        .openapi({ param: { name: 'search', in: 'query' } }),
      businessSize: z
        .enum(['SMALL', 'MEDIUM'])
        .optional()
        .openapi({ param: { name: 'businessSize', in: 'query' } }),
      plan: z
        .enum(['PHASE2A', 'PHASE2B_PILLAR', 'FREE'])
        .optional()
        .openapi({ param: { name: 'plan', in: 'query' } }),
      active: z.coerce
        .boolean()
        .optional()
        .openapi({ param: { name: 'active', in: 'query' } }),
    }),
  },
  responses: {
    200: {
      description: 'Users list retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            page: z.number(),
            pageSize: z.number(),
            total: z.number(),
            users: z.array(AdminUserRowSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
  },
});

// ----- GET /api/admin/users/:id ----------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/users/{id}',
  tags: ['Admin'],
  summary: 'Get details of a specific user',
  description:
    'Admin-only. Returns comprehensive details of a user by their UUID, including their recent assessment sessions, payment history, total spending, and usage metrics.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
  },
  responses: {
    200: {
      description: 'User details retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            user: AdminUserDetailsSchema,
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('User not found'),
  },
});

// ----- PATCH /api/admin/users/:id/status --------------------------------------

registry.registerPath({
  method: 'patch',
  path: '/api/admin/users/{id}/status',
  tags: ['Admin'],
  summary: 'Suspend or reactivate a user',
  description:
    'Admin-only. DISABLED blocks login and revokes access immediately — the auth middleware re-checks status on every request, so live tokens stop working too. Admin accounts cannot be suspended.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({ status: z.enum(['ACTIVE', 'DISABLED']) }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'User status updated successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            user: z.object({
              id: z.string().uuid(),
              status: z.enum(['ACTIVE', 'DISABLED']),
            }),
          }),
        },
      },
    },
    400: errorResponse('Validation failed'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('User not found'),
    409: errorResponse('Admin accounts cannot be suspended'),
  },
});

// ============================================================
// User detail page — paginated sessions/payments + session detail
// ============================================================

const subListQuery = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1)
    .openapi({ param: { name: 'page', in: 'query' } }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(5)
    .openapi({ param: { name: 'pageSize', in: 'query' } }),
});

const AdminUserSessionRowSchema = registry.register(
  'AdminUserSessionRow',
  z
    .object({
      id: z.string().uuid(),
      phase: z.string(),
      status: z.string(),
      pillarId: z.string().uuid().nullable(),
      pillarName: z.string().nullable(),
      reportPdfUrl: z.string().url().nullable(),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime().nullable(),
      updatedAt: z.string().datetime(),
      totalScore: z.number().nullable(),
      colorBand: z.enum(['RED', 'AMBER', 'GREEN']).nullable(),
    })
    .openapi('AdminUserSessionRow')
);

const AdminUserPaymentRowSchema = registry.register(
  'AdminUserPaymentRow',
  z
    .object({
      id: z.string().uuid(),
      plan: z.string(),
      amount: z.number(),
      currency: z.string(),
      status: z.string(),
      reference: z.string(),
      paidAt: z.string().datetime().nullable(),
      updatedAt: z.string().datetime(),
    })
    .openapi('AdminUserPaymentRow')
);

const AdminSessionDetailSchema = registry.register(
  'AdminSessionDetail',
  z
    .object({
      id: z.string().uuid(),
      phase: z.string(),
      status: z.string(),
      businessSize: z.enum(['SMALL', 'MEDIUM']).nullable(),
      pillarId: z.string().uuid().nullable(),
      pillarName: z.string().nullable(),
      startedAt: z.string().datetime(),
      completedAt: z.string().datetime().nullable(),
      user: z.object({
        id: z.string().uuid().nullable(),
        name: z.string().nullable(),
        email: z.string().nullable(),
      }),
      result: z
        .object({
          totalScore: z.number(),
          colorBand: z.enum(['RED', 'AMBER', 'GREEN']),
          hasAnyKnockout: z.boolean(),
          isPaid: z.boolean(),
          reportPdfUrl: z.string().url().nullable(),
        })
        .nullable(),
      pillarScores: z.array(
        z.object({
          pillarId: z.string().uuid(),
          pillarCode: z.string(),
          pillarName: z.string(),
          rawScore: z.number().int(),
          maxPossibleScore: z.number().int(),
          weightedScore: z.number(),
          hasKnockout: z.boolean(),
          colorBand: z.enum(['RED', 'AMBER', 'GREEN']),
          insightRuleApplied: z.string(),
        })
      ),
      responses: z.array(
        z.object({
          questionId: z.string().uuid(),
          pillarCode: z.string(),
          pillarName: z.string(),
          questionCode: z.string(),
          questionText: z.string(),
          selectedLabel: z.string(),
          selectedText: z.string(),
          scoreAtTime: z.number().int(),
          maxScore: z.number().int(),
          riskTypeAtTime: z.enum(['NORMAL', 'RISK', 'KNOCKOUT']),
          answeredAt: z.string().datetime(),
        })
      ),
    })
    .openapi('AdminSessionDetail')
);

// ----- GET /api/admin/users/:id/sessions -----------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/users/{id}/sessions',
  tags: ['Admin'],
  summary: "Paginated list of a user's assessment sessions",
  description:
    "Admin-only. Returns the user's session history, newest first, 5 per page by default. Each row includes the result summary (score + band) when the session has been scored.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
    query: subListQuery,
  },
  responses: {
    200: {
      description: 'User sessions retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            page: z.number(),
            pageSize: z.number(),
            total: z.number(),
            totalPages: z.number(),
            sessions: z.array(AdminUserSessionRowSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('User not found'),
  },
});

// ----- GET /api/admin/users/:id/payments -----------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/users/{id}/payments',
  tags: ['Admin'],
  summary: "Paginated list of a user's payments",
  description:
    "Admin-only. Returns the user's payment history, newest first, 5 per page by default.",
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
    query: subListQuery,
  },
  responses: {
    200: {
      description: 'User payments retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            page: z.number(),
            pageSize: z.number(),
            total: z.number(),
            totalPages: z.number(),
            payments: z.array(AdminUserPaymentRowSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('User not found'),
  },
});

// ----- GET /api/admin/sessions/:id -------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/sessions/{id}',
  tags: ['Admin'],
  summary: 'Full session breakdown (score + answered questions)',
  description:
    'Admin-only. Returns the session result, per-pillar scores, and every answered question with the selected option, its score, and risk type. Not paywalled — admins always see the full breakdown, even for unpaid results or in-progress sessions (result is null until scored).',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({
      id: z
        .string()
        .uuid()
        .openapi({ param: { name: 'id', in: 'path' } }),
    }),
  },
  responses: {
    200: {
      description: 'Session details retrieved successfully',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            session: AdminSessionDetailSchema,
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('Assessment session not found'),
  },
});

// ============================================================
// Scoring page — pillar weights & score interpretation
// ============================================================

const AdminPillarSchema = registry.register(
  'AdminPillar',
  z
    .object({
      id: z.string().uuid(),
      code: z.string(),
      name: z.string(),
      description: z.string().nullable(),
      weight: z.number(),
      displayOrder: z.number().int(),
      isActive: z.boolean(),
      activeQuestionCount: z.number().int(),
      totalQuestionCount: z.number().int(),
    })
    .openapi('AdminPillar')
);

const AdminPillarListResponseSchema = z.object({
  message: z.string(),
  pillars: z.array(AdminPillarSchema),
});

const ScoringSettingsSchema = registry.register(
  'ScoringSettings',
  z
    .object({
      amberMin: z.number(),
      greenMin: z.number(),
      redLabel: z.string(),
      redDescription: z.string(),
      amberLabel: z.string(),
      amberDescription: z.string(),
      greenLabel: z.string(),
      greenDescription: z.string(),
      updatedAt: z.string().datetime(),
    })
    .openapi('ScoringSettings')
);

const ScoringSettingsResponseSchema = z.object({
  message: z.string(),
  settings: ScoringSettingsSchema,
});

// ----- GET /api/admin/pillars --------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/pillars',
  tags: ['Admin'],
  summary: 'List all pillars with weights and question counts',
  description:
    'Admin-only. Returns every pillar (active and inactive) with its weight, description, and active/total question counts. Backs the admin scoring page.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Pillars retrieved successfully',
      content: { 'application/json': { schema: AdminPillarListResponseSchema } },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
  },
});

// ----- PATCH /api/admin/pillars/weights ----------------------------------------

registry.registerPath({
  method: 'patch',
  path: '/api/admin/pillars/weights',
  tags: ['Admin'],
  summary: 'Bulk-save pillar weights',
  description:
    'Admin-only. Atomically updates the weight of every pillar in the payload (one transaction). Weights are relative shares — scoring normalizes by the total — and only affect assessments submitted after the save.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            weights: z
              .array(
                z.object({
                  pillarId: z.string().uuid(),
                  weight: z.number().gt(0).max(999.99),
                })
              )
              .min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Pillar weights saved successfully',
      content: { 'application/json': { schema: AdminPillarListResponseSchema } },
    },
    400: errorResponse('Validation failed'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    404: errorResponse('Pillar not found'),
  },
});

// ----- GET /api/admin/scoring-settings ------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/admin/scoring-settings',
  tags: ['Admin'],
  summary: 'Get score interpretation settings',
  description:
    'Admin-only. Returns the RED/AMBER/GREEN color-band cutoffs and the label/description shown for each band. Bands: score >= greenMin is GREEN, score >= amberMin is AMBER, below amberMin is RED.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Scoring settings retrieved successfully',
      content: { 'application/json': { schema: ScoringSettingsResponseSchema } },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
  },
});

// ----- PATCH /api/admin/scoring-settings ----------------------------------------

registry.registerPath({
  method: 'patch',
  path: '/api/admin/scoring-settings',
  tags: ['Admin'],
  summary: 'Update score interpretation settings',
  description:
    'Admin-only. Partially updates the band cutoffs and/or labels. Cutoffs must satisfy 0 < amberMin < greenMin <= 100 (validated against stored values when only one is sent). Changes apply to assessments submitted after the save; existing results keep their stored band.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            amberMin: z.number().gt(0).max(100).optional(),
            greenMin: z.number().gt(0).max(100).optional(),
            redLabel: z.string().min(1).max(50).optional(),
            redDescription: z.string().min(1).max(200).optional(),
            amberLabel: z.string().min(1).max(50).optional(),
            amberDescription: z.string().min(1).max(200).optional(),
            greenLabel: z.string().min(1).max(50).optional(),
            greenDescription: z.string().min(1).max(200).optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: 'Scoring settings updated successfully',
      content: { 'application/json': { schema: ScoringSettingsResponseSchema } },
    },
    400: errorResponse('Validation failed'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Forbidden: User is not an admin'),
    422: errorResponse('amberMin must be less than greenMin'),
  },
});

// ============================================================
// ADMIN — self profile (/api/admin/me)
// ============================================================
//
// Both endpoints below are available to any authenticated admin (no per-page
// permission gate) so a staff member can read or edit their own personal info
// without needing `users:read` / `users:write` on themselves.

const AdminProfilePayloadSchema = registry.register(
  'AdminProfilePayload',
  z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      firstName: z.string().nullable(),
      lastName: z.string().nullable(),
      phone: z.string().nullable(),
      businessName: z.string().nullable(),
      avatarUrl: z.string().url().nullable(),
    })
    .openapi('AdminProfilePayload')
);

registry.registerPath({
  method: 'get',
  path: '/api/admin/me',
  tags: ['Admin'],
  summary: 'Get the authenticated admin\'s self profile',
  description: 'Admin only. Returns the calling staff member\'s own personal info.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Admin profile',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), profile: AdminProfilePayloadSchema }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/me',
  tags: ['Admin'],
  summary: 'Update the authenticated admin\'s self profile',
  description:
    'Admin only. Self-service — does NOT require any per-page permission. Cannot change email, role, department, or permissions; those live on POST /invite and PATCH /users/:id/access.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: updateAdminProfileSchema } },
    },
  },
  responses: {
    200: {
      description: 'Profile updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), profile: AdminProfilePayloadSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
  },
});

// ============================================================
// ADMIN — RBAC roles (/api/admin/roles)
// ============================================================

const AdminRoleSchema = registry.register(
  'AdminRole',
  z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      description: z.string().nullable(),
      permissions: z.array(z.enum(PERMISSION_KEYS)),
      memberCount: z.number().int(),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .openapi('AdminRole')
);

registry.registerPath({
  method: 'get',
  path: '/api/admin/roles',
  tags: ['Admin'],
  summary: 'List admin roles',
  description: 'Admin only — requires `settings:read`. Returns every defined RBAC role.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Roles',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), roles: z.array(AdminRoleSchema) }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing settings:read permission'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/roles',
  tags: ['Admin'],
  summary: 'Create an admin role',
  description: 'Admin only — requires `settings:write`. Permissions must be drawn from PERMISSION_KEYS.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createRoleSchema } },
    },
  },
  responses: {
    201: {
      description: 'Role created',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), role: AdminRoleSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing settings:write permission'),
    409: errorResponse('Role name already exists'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/roles/{id}',
  tags: ['Admin'],
  summary: 'Update an admin role',
  description: 'Admin only — requires `settings:write`. Replacing `permissions` cascades to every admin attached to this role.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateRoleSchema } },
    },
  },
  responses: {
    200: {
      description: 'Role updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), role: AdminRoleSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing settings:write permission'),
    404: errorResponse('Role not found'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/roles/{id}',
  tags: ['Admin'],
  summary: 'Delete an admin role',
  description: 'Admin only — requires `settings:write`. Refuses when any admin still references the role; reassign or remove members first.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Role removed',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing settings:write permission'),
    404: errorResponse('Role not found'),
    409: errorResponse('Role is still assigned to one or more admins'),
  },
});

// ============================================================
// ADMIN — staff onboarding + access
// ============================================================

registry.registerPath({
  method: 'patch',
  path: '/api/admin/users/{id}/role',
  tags: ['Admin'],
  summary: 'Assign or detach an admin role',
  description: 'Admin only — requires `users:write`. Passing `adminRoleId: null` detaches the user from any role; their per-person permissions stay intact.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: assignRoleSchema } },
    },
  },
  responses: {
    200: {
      description: 'Role assignment updated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing users:write permission'),
    404: errorResponse('User or role not found'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/users/{id}/access',
  tags: ['Admin'],
  summary: 'Edit an admin\'s department + per-person permissions',
  description: 'Admin only — requires `users:write`. The submitted `permissions` array fully replaces the user\'s existing per-person grants (role-derived permissions are still merged in at request time).',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateAdminAccessSchema } },
    },
  },
  responses: {
    200: {
      description: 'Access updated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing users:write permission'),
    404: errorResponse('Admin user not found'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/invite',
  tags: ['Admin'],
  summary: 'Invite a new staff member',
  description:
    'Admin only — requires `users:write`. Creates an ADMIN account with `passwordHash: null` and a 24-hour invite token, then emails the invitee a link to /accept-invite. Re-inviting an existing-but-unaccepted address rotates the token.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: inviteAdminSchema } },
    },
  },
  responses: {
    201: {
      description: 'Invite sent',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            admin: z.object({
              id: z.string().uuid(),
              email: z.string().email(),
              department: z.string().nullable(),
              permissions: z.array(z.enum(PERMISSION_KEYS)),
            }),
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing users:write permission'),
    409: errorResponse('Email already belongs to an accepted account'),
  },
});

// ============================================================
// ADMIN — app-wide settings (FX rate + storefront toggles)
// ============================================================

const AppSettingsPayloadSchema = registry.register(
  'AppSettingsPayload',
  z
    .object({
      usdToNgn: z.number(),
      payPerUseActive: z.boolean(),
      subscriptionActive: z.boolean(),
      updatedBy: z.string().uuid().nullable(),
      updatedAt: z.string().datetime(),
    })
    .openapi('AppSettingsPayload')
);

registry.registerPath({
  method: 'get',
  path: '/api/admin/app-settings',
  tags: ['Admin'],
  summary: 'Read app-wide settings',
  description: 'Admin only — requires `settings:read`. Returns the singleton settings row (USD→NGN rate + storefront on/off toggles).',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Settings',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), settings: AppSettingsPayloadSchema }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing settings:read permission'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/app-settings',
  tags: ['Admin'],
  summary: 'Update app-wide settings',
  description:
    'Admin only — requires `settings:write`. Every field is optional but the service enforces "at least one storefront section must remain live" after merging — disabling both pay-per-use and subscription in the same patch is rejected.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: updateAppSettingsSchema } },
    },
  },
  responses: {
    200: {
      description: 'Settings updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), settings: AppSettingsPayloadSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing settings:write permission'),
    422: errorResponse('At least one storefront section must stay active'),
  },
});

// ============================================================
// ADMIN — questions + options CRUD
// ============================================================

// Shared response shape (kept inline — the full TS type is large and only the
// shape readers care about is captured here).
const AdminOptionSchema = registry.register(
  'AdminOption',
  z
    .object({
      id: z.string().uuid(),
      label: z.string(),
      value: z.string(),
      score: z.number(),
      displayOrder: z.number().int(),
    })
    .openapi('AdminOption')
);

const AdminQuestionSchema = registry.register(
  'AdminQuestion',
  z
    .object({
      id: z.string().uuid(),
      text: z.string(),
      phase: z.enum(['PHASE1', 'PHASE2A', 'PHASE2B']),
      pillarId: z.string().uuid().nullable(),
      pillarCode: z.string().nullable(),
      pillarName: z.string().nullable(),
      businessSize: z.enum(['SMALL', 'MEDIUM']).nullable(),
      displayOrder: z.number().int(),
      isActive: z.boolean(),
      options: z.array(AdminOptionSchema),
      createdAt: z.string().datetime(),
      updatedAt: z.string().datetime(),
    })
    .openapi('AdminQuestion')
);

registry.registerPath({
  method: 'get',
  path: '/api/admin/questions',
  tags: ['Admin'],
  summary: 'List questions with filters',
  description: 'Admin only — requires `questions:read`. Filterable by phase, pillar, business size, and active flag.',
  security: [{ bearerAuth: [] }],
  request: { query: listAdminQuestionsQuerySchema },
  responses: {
    200: {
      description: 'Questions',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            total: z.number().int(),
            questions: z.array(AdminQuestionSchema),
          }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:read permission'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/questions',
  tags: ['Admin'],
  summary: 'Create a question',
  description: 'Admin only — requires `questions:write`. Options can be provided inline or added afterwards via POST /questions/{id}/options.',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: createQuestionSchema } },
    },
  },
  responses: {
    201: {
      description: 'Question created',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), question: AdminQuestionSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:write permission'),
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/admin/questions/{id}',
  tags: ['Admin'],
  summary: 'Get a single question by id',
  description: 'Admin only — requires `questions:read`.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Question',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), question: AdminQuestionSchema }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:read permission'),
    404: errorResponse('Question not found'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/questions/{id}',
  tags: ['Admin'],
  summary: 'Update a question',
  description: 'Admin only — requires `questions:write`. Updating an existing question DOES NOT retroactively rescore historical sessions.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateQuestionSchema } },
    },
  },
  responses: {
    200: {
      description: 'Question updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), question: AdminQuestionSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:write permission'),
    404: errorResponse('Question not found'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/questions/{id}',
  tags: ['Admin'],
  summary: 'Delete a question',
  description: 'Admin only — requires `questions:write`. Soft-deactivates when any historical answer references the question; hard-deletes otherwise.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Question removed or deactivated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:write permission'),
    404: errorResponse('Question not found'),
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/admin/questions/{id}/options',
  tags: ['Admin'],
  summary: 'Add an option to a question',
  description: 'Admin only — requires `questions:write`.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: addOptionSchema } },
    },
  },
  responses: {
    201: {
      description: 'Option added',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), option: AdminOptionSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:write permission'),
    404: errorResponse('Question not found'),
  },
});

registry.registerPath({
  method: 'patch',
  path: '/api/admin/options/{id}',
  tags: ['Admin'],
  summary: 'Update a question option',
  description: 'Admin only — requires `questions:write`.',
  security: [{ bearerAuth: [] }],
  request: {
    params: z.object({ id: z.string().uuid() }),
    body: {
      required: true,
      content: { 'application/json': { schema: updateOptionSchema } },
    },
  },
  responses: {
    200: {
      description: 'Option updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), option: AdminOptionSchema }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:write permission'),
    404: errorResponse('Option not found'),
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/admin/options/{id}',
  tags: ['Admin'],
  summary: 'Delete a question option',
  description: 'Admin only — requires `questions:write`. Soft-deactivates when referenced by historical answers; hard-deletes otherwise.',
  security: [{ bearerAuth: [] }],
  request: { params: z.object({ id: z.string().uuid() }) },
  responses: {
    200: {
      description: 'Option removed or deactivated',
      content: { 'application/json': { schema: z.object({ message: z.string() }) } },
    },
    401: errorResponse('Missing or invalid token'),
    403: errorResponse('Missing questions:write permission'),
    404: errorResponse('Option not found'),
  },
});
