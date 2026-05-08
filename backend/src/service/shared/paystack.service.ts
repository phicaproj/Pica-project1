import crypto from 'crypto';
import { PAYSTACK_BASE_URL, PAYSTACK_SECRET_KEY } from '../../Config/env';
import AppError from './appError';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from './http';

/**
 * Thin Paystack HTTP wrapper. Two responsibilities:
 *   1. Initialize a transaction (server-side, returns auth URL + reference).
 *   2. Verify a transaction by reference (called from the FE callback AND the webhook).
 *
 * Paystack works in MINOR units (kobo) on the wire. We accept and return MAJOR
 * units (NGN) on this boundary so the rest of the codebase stays clean.
 */

export type PaystackInitInput = {
  email: string;
  /** Major units (e.g. 25000 NGN). Converted to kobo internally. */
  amount: number;
  /** Idempotency key — if reused, Paystack will reject. */
  reference: string;
  callbackUrl: string;
  /** Free-form key/value snapshot Paystack echoes back on verify. */
  metadata?: Record<string, unknown>;
};

export type PaystackInitData = {
  authorization_url: string;
  access_code: string;
  reference: string;
};

export type PaystackVerifyData = {
  status: 'success' | 'failed' | 'abandoned' | 'reversed' | string;
  reference: string;
  amount: number; // kobo
  currency: string;
  paid_at: string | null;
  channel: string | null; // "card" | "bank" | "ussd" | ...
  gateway_response: string | null;
  customer: { email: string };
  metadata: Record<string, unknown> | null;
};

const paystackHeaders = () => ({
  Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
});

export async function initializeTransaction(input: PaystackInitInput): Promise<PaystackInitData> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100), // NGN -> kobo
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: PaystackInitData;
  } | null;

  if (!response.ok || !body?.status || !body.data) {
    throw new AppError(
      body?.message ?? 'Failed to initialize Paystack transaction',
      response.status >= 400 && response.status < 500 ? BAD_REQUEST : INTERNAL_SERVER_ERROR
    );
  }

  return body.data;
}

export async function verifyTransaction(reference: string): Promise<PaystackVerifyData> {
  const response = await fetch(
    `${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`,
    {
      method: 'GET',
      headers: paystackHeaders(),
    }
  );

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: PaystackVerifyData;
  } | null;

  if (!response.ok || !body?.status || !body.data) {
    throw new AppError(
      body?.message ?? 'Failed to verify Paystack transaction',
      response.status >= 400 && response.status < 500 ? BAD_REQUEST : INTERNAL_SERVER_ERROR
    );
  }

  return body.data;
}

export function verifyWebhookSignature(rawBody: Buffer | string, signature: string | undefined) {
  if (!signature) return false;
  const computed = crypto.createHmac('sha512', PAYSTACK_SECRET_KEY).update(rawBody).digest('hex');
  // timingSafeEqual requires equal-length buffers
  const a = Buffer.from(computed, 'utf8');
  const b = Buffer.from(signature, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function newPaymentReference(prefix = 'PICA') {
  // 16 random hex chars (8 bytes) is plenty of entropy and short enough
  // to be human-friendly in the admin transaction page.
  return `${prefix}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}
