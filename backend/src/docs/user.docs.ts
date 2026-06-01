import { z } from 'zod'
import { registry, errorResponse } from './registry'
import { updateProfileSchema, updateBusinessInfoSchema } from '../module/user/user.types'

const UserProfileSchema = registry.register(
	'UserProfile',
	z
		.object({
			id: z.string().uuid(),
			email: z.string().email(),
			firstName: z.string().nullable(),
			lastName: z.string().nullable(),
			businessName: z.string().nullable(),
			phone: z.string().nullable(),
			avatarUrl: z.string().url().nullable(),
			isVerified: z.boolean(),
			role: z.string(),
		})
		.openapi('UserProfile'),
)

const UserBusinessProfileSchema = registry.register(
	'UserBusinessProfile',
	z
		.object({
			id: z.string().uuid(),
			email: z.string().email(),
			businessName: z.string().nullable(),
			phone: z.string().nullable(),
			avatarUrl: z.string().url().nullable(),
			isVerified: z.boolean(),
			role: z.string(),
			businessSize: z.enum(['SMALL', 'MEDIUM']).nullable(),
			staffSize: z.string().nullable(),
			industry: z.string().nullable(),
			country: z.string().nullable(),
			state: z.string().nullable(),
			operatingYears: z.string().nullable(),
			annualRevenue: z.string().nullable(),
		})
		.openapi('UserBusinessProfile'),
)

// ----- PATCH /api/user/profile ----------------------------------------------

registry.registerPath({
	method: 'patch',
	path: '/api/user/profile',
	tags: ['User'],
	summary: 'Update user personal profile details',
	description:
		'Authenticated. Allows updating personal profile information. If email is changed and it is different from the current email, isVerified is reset to false.',
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			required: true,
			content: { 'application/json': { schema: updateProfileSchema } },
		},
	},
	responses: {
		200: {
			description: 'Profile updated successfully',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						user: UserProfileSchema,
					}),
				},
			},
		},
		400: errorResponse('Validation error'),
		401: errorResponse('Missing or invalid token'),
		409: errorResponse('Email already in use'),
	},
})

// ----- PATCH /api/user/business ----------------------------------------------

registry.registerPath({
	method: 'patch',
	path: '/api/user/business',
	tags: ['User'],
	summary: 'Update user business profile details',
	description:
		'Authenticated. Allows updating business information details including location, industry, staff size, revenue, etc.',
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			required: true,
			content: { 'application/json': { schema: updateBusinessInfoSchema } },
		},
	},
	responses: {
		200: {
			description: 'Business information updated successfully',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						user: UserBusinessProfileSchema,
					}),
				},
			},
		},
		400: errorResponse('Validation error'),
		401: errorResponse('Missing or invalid token'),
	},
})

// ----- POST /api/user/verify-email -------------------------------------------

registry.registerPath({
	method: 'post',
	path: '/api/user/verify-email',
	tags: ['User'],
	summary: 'Verify the user\'s email address',
	description:
		'Authenticated. Marks the authenticated user\'s account as verified.',
	security: [{ bearerAuth: [] }],
	responses: {
		200: {
			description: 'Email verified successfully',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						user: UserProfileSchema,
					}),
				},
			},
		},
		401: errorResponse('Missing or invalid token'),
	},
})

// ----- POST /api/user/avatar -------------------------------------------------

registry.registerPath({
	method: 'post',
	path: '/api/user/avatar',
	tags: ['User'],
	summary: 'Upload user avatar image',
	description:
		'Authenticated. Uploads a profile avatar image (strict 2MB limit, multipart/form-data with a single file parameter `avatar`). Cleans up previous avatar from R2 if one exists.',
	security: [{ bearerAuth: [] }],
	request: {
		body: {
			required: true,
			content: {
				'multipart/form-data': {
					schema: z.object({
						avatar: z.string().openapi({ type: 'string', format: 'binary', description: 'Avatar image file (max 2MB)' }),
					}),
				},
			},
		},
	},
	responses: {
		200: {
			description: 'Avatar uploaded successfully',
			content: {
				'application/json': {
					schema: z.object({
						message: z.string(),
						avatarUrl: z.string().url(),
						user: UserProfileSchema,
					}),
				},
			},
		},
		400: errorResponse('No avatar file provided or file too large'),
		401: errorResponse('Missing or invalid token'),
	},
})
