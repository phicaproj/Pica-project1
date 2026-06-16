/**
 * Builds the OpenAPI 3.1 document from the shared registry.
 *
 * Side-effect imports register every route into the singleton registry.
 * Order doesn't matter for correctness, but grouping is by tag.
 */

import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';

// Side-effect imports — each module file calls registry.registerPath(...).
import './auth.docs';
import './assessment.docs';
import './question.docs';
import './result.docs';
import './payment.docs';
import './user.docs';
import './admin.docs';
import './report.docs';
import './consultation.docs';
import './coupon.docs';
import './subscription.docs';

export function buildOpenApiDocument() {
  const generator = new OpenApiGeneratorV31(registry.definitions);

  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'PICA API',
      version: '1.0.0',
      description: [
        'Frontend-facing API for the PICA assessment platform.',
        '',
        '**Auth:** Most authenticated routes accept a JWT access token via `Authorization: Bearer <token>`. Obtain one from POST /api/auth/login. Admin accounts use a two-stage login (password → OTP); see POST /api/auth/admin/login.',
        '',
        '**Currency:** USD is the base currency. Plan and tier prices are stored in USD; Nigerian users are billed in NGN by multiplying through the admin-controlled `usdToNgn` rate (returned on every listing endpoint that surfaces a price).',
        '',
        '**Payment model:**',
        '- *Pay-per-use:* Phase 2A (whole-business scan) and Phase 2B (per-pillar deep dive) are paywalled per result. Each Phase 2A SessionResult is unpaid until a Paystack SUCCESS is recorded for that specific session.',
        '- *Subscription:* monthly recurring plans purchased through Paystack. While a subscription is `ACTIVE`/`PAST_DUE` and within its quota, paid-action endpoints (Phase 2A PDF download, Phase 2B start, consultation booking) short-circuit checkout and consume one unit from the subscription instead.',
        '',
        'The cheap, side-effect-free GET /api/subscription/quota-check is the recommended FE probe before initiating any paid action.',
      ].join('\n'),
    },
    servers: [{ url: '/', description: 'Same-origin (recommended)' }],
    tags: [
      { name: 'Auth', description: 'Registration, login (user + admin OTP), password reset, invite acceptance, /me' },
      {
        name: 'User',
        description: 'Manage user profiles, business profiles, verify email and upload avatars',
      },
      {
        name: 'Admin',
        description:
          'Administrative operations: user management, RBAC roles, staff invites, content (questions/pillars/scoring), commerce (pricing/coupons/subscription plans/consultation tiers), reporting',
      },
      {
        name: 'Assessment',
        description:
          'Start a session, answer questions, submit for scoring. Phase 1 is public; Phase 2A and Phase 2B require auth.',
      },
      {
        name: 'Questions',
        description: 'Fetch the question set for Phase 1 or for an active Phase 2A / Phase 2B session.',
      },
      {
        name: 'Result',
        description:
          'Fetch a scored result or download its PDF. Phase 2A results are paywalled per-result; Phase 2B results are gated on the per-pillar unlock.',
      },
      {
        name: 'Payment',
        description:
          'Initialize and verify Paystack transactions. Public pricing snapshot lives here too. The webhook endpoint (server-to-server) is intentionally omitted from these docs.',
      },
      {
        name: 'Subscription',
        description:
          'Plan catalogue, subscribe/cancel, current subscription + usage meter, cheap quota probe.',
      },
      {
        name: 'Consultation',
        description:
          'Tier catalogue, booking (subscription-covered or paid), listing of my bookings, eligible results to attach.',
      },
      {
        name: 'Coupon',
        description: 'User-facing checkout validation. Admin coupon CRUD lives under the Admin tag.',
      },
    ],
  });
}
