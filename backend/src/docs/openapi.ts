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
        '**Auth:** Most authenticated routes accept a JWT access token via `Authorization: Bearer <token>`. Obtain one from POST /api/auth/login.',
        '',
        '**Payment model (Phase 2A):** Per-result paywall. Each completed Phase 2A session produces a `SessionResult`. The result is unpaid until a Paystack payment SUCCESS is recorded for that specific session. Retaking the assessment generates a new unpaid result.',
      ].join('\n'),
    },
    servers: [{ url: '/', description: 'Same-origin (recommended)' }],
    tags: [
      { name: 'Auth', description: 'Registration, login, password reset, /me' },
      {
        name: 'User',
        description: 'Manage user profiles, business profiles, verify email and upload avatars',
      },
      {
        name: 'Admin',
        description: 'Administrative operations including listing and viewing user details',
      },
      {
        name: 'Assessment',
        description:
          'Start a session, answer questions, submit for scoring. Phase 1 is public; Phase 2A requires auth.',
      },
      {
        name: 'Questions',
        description: 'Fetch the question set for Phase 1 or for an active Phase 2A session.',
      },
      {
        name: 'Result',
        description:
          'Fetch a scored result or download its PDF. Phase 2A results are paywalled per-result.',
      },
      {
        name: 'Payment',
        description:
          'Initialize and verify Paystack transactions. The webhook endpoint (server-to-server) is intentionally omitted from these docs.',
      },
    ],
  });
}
