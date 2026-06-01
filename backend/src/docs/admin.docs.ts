import { z } from 'zod'
import { registry, errorResponse } from './registry'

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
			createdAt: z.string().datetime(),
		})
		.openapi('AdminUserRow'),
)

const AdminUserDetailsSchema = registry.register(
	'AdminUserDetails',
	AdminUserRowSchema.extend({
		recentSessions: z.array(
			z.object({
				id: z.string().uuid(),
				status: z.string(),
				updatedAt: z.string().datetime(),
				phase: z.string(),
			}),
		),
		recentPayments: z.array(
			z.object({
				id: z.string().uuid(),
				amount: z.number(),
				plan: z.string(),
				updatedAt: z.string().datetime(),
			}),
		),
		totalSpent: z.number(),
		totalSessions: z.number(),
		completedSessions: z.number(),
	}).openapi('AdminUserDetails'),
)

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
			page: z.coerce.number().int().min(1).default(1).openapi({ param: { name: 'page', in: 'query' } }),
			pageSize: z.coerce.number().int().min(1).max(100).default(20).openapi({ param: { name: 'pageSize', in: 'query' } }),
			search: z.string().trim().min(1).max(100).optional().openapi({ param: { name: 'search', in: 'query' } }),
			businessSize: z.enum(['SMALL', 'MEDIUM']).optional().openapi({ param: { name: 'businessSize', in: 'query' } }),
			plan: z.enum(['PHASE2A', 'PHASE2B_PILLAR', 'FREE']).optional().openapi({ param: { name: 'plan', in: 'query' } }),
			active: z.coerce.boolean().optional().openapi({ param: { name: 'active', in: 'query' } }),
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
})

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
			id: z.string().uuid().openapi({ param: { name: 'id', in: 'path' } }),
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
})
