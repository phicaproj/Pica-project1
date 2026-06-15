import { z } from 'zod';
import { registry, errorResponse } from './registry';
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  verifyResetOtpSchema,
} from '../module/auth/auth.types';

// Response schemas — duplicate of the TS response types in auth.types.ts.
// Kept here (not in auth.types.ts) so docs deps don't leak into module code.

const AuthUserSchema = registry.register(
  'AuthUser',
  z
    .object({
      id: z.string().uuid(),
      email: z.string().email(),
      businessName: z.string().nullable(),
      phone: z.string().nullable(),
      isVerified: z.boolean(),
    })
    .openapi('AuthUser')
);

const MeUserSchema = registry.register(
  'MeUser',
  AuthUserSchema.extend({
    businessSize: z.enum(['SMALL', 'MEDIUM']).nullable(),
    hasAnyPaidPhase2AResult: z.boolean().openapi({
      description:
        'True iff the user owns at least one paid Phase 2A SessionResult. Coarse-grained flag — for per-result paywall UX, read `isPaid` off the result itself from GET /api/result/:sessionId.',
    }),
  }).openapi('MeUser')
);

// ----- POST /api/auth/register ----------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/auth/register',
  tags: ['Auth'],
  summary: 'Create a new user account',
  description: 'Public. Returns the created user. Email verification is a separate flow.',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: registerSchema } },
    },
  },
  responses: {
    201: {
      description: 'User created',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            user: AuthUserSchema,
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    409: errorResponse('Email already registered'),
  },
});

// ----- POST /api/auth/login -------------------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  tags: ['Auth'],
  summary: 'Exchange credentials for access + refresh tokens',
  description:
    'Public. Returns a JWT access token to send as `Authorization: Bearer <token>` on protected routes.',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: loginSchema } },
    },
  },
  responses: {
    200: {
      description: 'Authenticated',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            user: AuthUserSchema,
            accessToken: z.string(),
            refreshToken: z.string(),
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Invalid credentials'),
  },
});

// ----- POST /api/auth/forgot-password ---------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/auth/forgot-password',
  tags: ['Auth'],
  summary: 'Request a password-reset OTP by email',
  description:
    'Public. Emails a 5-digit OTP to the user and returns a short-lived `otpToken` that must be sent back to /verify-reset-otp.',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: forgotPasswordSchema } },
    },
  },
  responses: {
    200: {
      description: 'OTP sent',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            otpToken: z.string(),
          }),
        },
      },
    },
    400: errorResponse('Validation error'),
    404: errorResponse('No account with that email'),
  },
});

// ----- POST /api/auth/verify-reset-otp --------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/auth/verify-reset-otp',
  tags: ['Auth'],
  summary: 'Verify the OTP and obtain a password-reset token',
  description:
    'Public. Exchanges the OTP + `otpToken` (from /forgot-password) for a `passwordToken` that must be sent to /reset-password.',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: verifyResetOtpSchema } },
    },
  },
  responses: {
    200: {
      description: 'OTP verified',
      content: {
        'application/json': {
          schema: z.object({
            message: z.string(),
            passwordToken: z.string(),
          }),
        },
      },
    },
    400: errorResponse('Validation error or wrong OTP'),
    401: errorResponse('Invalid or expired OTP token'),
  },
});

// ----- POST /api/auth/reset-password ----------------------------------------

registry.registerPath({
  method: 'post',
  path: '/api/auth/reset-password',
  tags: ['Auth'],
  summary: 'Set a new password using the password-reset token',
  description: 'Public. Requires the `passwordToken` obtained from /verify-reset-otp.',
  request: {
    body: {
      required: true,
      content: { 'application/json': { schema: resetPasswordSchema } },
    },
  },
  responses: {
    200: {
      description: 'Password updated',
      content: {
        'application/json': {
          schema: z.object({ message: z.string() }),
        },
      },
    },
    400: errorResponse('Validation error'),
    401: errorResponse('Invalid or expired password token'),
  },
});

// ----- GET /api/auth/me -----------------------------------------------------

registry.registerPath({
  method: 'get',
  path: '/api/auth/me',
  tags: ['Auth'],
  summary: 'Get the authenticated user',
  description:
    'Returns the current user, business profile snapshot, and the derived `hasAnyPaidPhase2AResult` flag. Replaces the legacy `hasPaidPhase2A` field — the per-result paywall means individual results must be checked via GET /api/result/:sessionId.',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: 'Current user',
      content: {
        'application/json': {
          schema: z.object({ message: z.string(), user: MeUserSchema }),
        },
      },
    },
    401: errorResponse('Missing or invalid token'),
    404: errorResponse('User not found'),
  },
});
