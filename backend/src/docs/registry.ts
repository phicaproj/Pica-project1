/**
 * Shared OpenAPI registry.
 *
 * One registry collects every route + schema across modules. Each
 * `<module>.docs.ts` file imports this registry and calls
 * `registry.registerPath(...)`. The final document is assembled in
 * `openapi.ts` from this registry.
 *
 * Why a single registry: $ref resolution. Components registered here
 * (e.g. ErrorResponse, AuthUser) can be referenced from any module's
 * paths without redeclaration.
 */

import {
	OpenAPIRegistry,
	extendZodWithOpenApi,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

// Adds .openapi(...) to Zod schemas. Must run before any schema uses it.
extendZodWithOpenApi(z)

export const registry = new OpenAPIRegistry()

// ----- Security schemes ------------------------------------------------------

// Bearer JWT — set on routes requiring authenticate / softAuthenticate.
export const bearerAuth = registry.registerComponent(
	'securitySchemes',
	'bearerAuth',
	{
		type: 'http',
		scheme: 'bearer',
		bearerFormat: 'JWT',
		description:
			'JWT access token obtained from POST /api/auth/login. Send as `Authorization: Bearer <token>`.',
	},
)

// ----- Shared response schemas ----------------------------------------------

/**
 * Standard error envelope thrown by AppError. Every 4xx/5xx response from
 * the API matches this shape (see service/middleware/errorHandler.ts).
 */
export const ErrorResponseSchema = registry.register(
	'ErrorResponse',
	z
		.object({
			message: z
				.string()
				.openapi({ example: 'Resource not found' }),
		})
		.openapi('ErrorResponse'),
)

/**
 * Convenience helper: returns the standard error response object
 * referencing ErrorResponseSchema. Use in `responses: { 404: errorResponse('...') }`.
 */
export const errorResponse = (description: string) => ({
	description,
	content: {
		'application/json': {
			schema: ErrorResponseSchema,
		},
	},
})
