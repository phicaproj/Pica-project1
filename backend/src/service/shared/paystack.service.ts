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

// Paystack wire currency. NGN charges in kobo (×100); USD charges in cents
// (×100 — same multiplier, different ISO code). Account-level support for USD
// is a per-merchant Paystack setting (BE-0 in todo.md); if the account is
// NGN-only, USD inits will be rejected at the provider boundary.
export type PaystackCurrency = 'NGN' | 'USD';

export type PaystackInitInput = {
  email: string;
  /** Major units of `currency` (e.g. 25000 NGN, 30 USD). Converted internally. */
  amount: number;
  /** Defaults to NGN for backward compatibility with existing call sites. */
  currency?: PaystackCurrency;
  /** Idempotency key — if reused, Paystack will reject. */
  reference: string;
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
  const currency: PaystackCurrency = input.currency ?? 'NGN';
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: input.email,
      // Both NGN→kobo and USD→cents are ×100. Paystack rejects fractional
      // amounts, so round at the boundary.
      amount: Math.round(input.amount * 100),
      currency,
      reference: input.reference,
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

/* ───────────────────────────── Plans + Subscriptions ─────────────────────────
 * Recurring billing pieces. The flow is:
 *
 *   1. Admin creates/updates a SubscriptionPlan row — we mirror it as a
 *      Paystack Plan via createPaystackPlan() (one per currency, USD+NGN),
 *      and persist the returned plan_code on our row.
 *   2. User subscribes — we initialize a transaction with the plan code; the
 *      first charge is the first period, and Paystack auto-creates the
 *      subscription record (subscription.create webhook → we persist code).
 *   3. Subsequent renewals fire charge.success webhooks tied to the same
 *      subscription code; the webhook handler bumps current_period_end.
 *   4. Cancel — disablePaystackSubscription() flips Paystack-side; webhook
 *      subscription.disable → status='CANCELLED' locally.
 *
 * Paystack's price is in MINOR units. Interval is 'monthly' for our case.
 */

export type PaystackPlanInterval =
  | 'hourly'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'biannually'
  | 'annually';

export type PaystackPlanInput = {
  name: string;
  /** Major units (e.g. 40 USD, 60000 NGN). Converted to minor units internally. */
  amount: number;
  currency: PaystackCurrency;
  interval: PaystackPlanInterval;
  description?: string;
};

export type PaystackPlanData = {
  id: number;
  name: string;
  plan_code: string;
  description: string | null;
  amount: number; // minor units
  interval: string;
  currency: string;
};

export async function createPaystackPlan(input: PaystackPlanInput): Promise<PaystackPlanData> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/plan`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      name: input.name,
      amount: Math.round(input.amount * 100),
      interval: input.interval,
      currency: input.currency,
      description: input.description,
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: PaystackPlanData;
  } | null;

  if (!response.ok || !body?.status || !body.data) {
    throw new AppError(
      body?.message ?? 'Failed to create Paystack plan',
      response.status >= 400 && response.status < 500 ? BAD_REQUEST : INTERNAL_SERVER_ERROR
    );
  }

  return body.data;
}

/**
 * Paystack's plan update endpoint takes plan_code or numeric id as path param.
 * Only fields you pass get changed — pass undefined to leave a field alone.
 * Currency is immutable on Paystack's side; if it has to change, create a
 * fresh plan and swap the code on our row.
 */
export async function updatePaystackPlan(
  planCode: string,
  input: Partial<Omit<PaystackPlanInput, 'currency'>>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.amount !== undefined) payload.amount = Math.round(input.amount * 100);
  if (input.interval !== undefined) payload.interval = input.interval;
  if (input.description !== undefined) payload.description = input.description;

  const response = await fetch(
    `${PAYSTACK_BASE_URL}/plan/${encodeURIComponent(planCode)}`,
    {
      method: 'PUT',
      headers: paystackHeaders(),
      body: JSON.stringify(payload),
    }
  );

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
  } | null;

  if (!response.ok || !body?.status) {
    throw new AppError(
      body?.message ?? 'Failed to update Paystack plan',
      response.status >= 400 && response.status < 500 ? BAD_REQUEST : INTERNAL_SERVER_ERROR
    );
  }
}

export type PaystackSubscriptionInitInput = {
  email: string;
  planCode: string;
  /** Paystack debits this amount on the first charge; it must match the plan. */
  amount: number;
  currency: PaystackCurrency;
  reference: string;
  metadata?: Record<string, unknown>;
};

/**
 * "Create subscription" via Paystack is really "initialize a transaction with
 * a plan attached" — the first charge becomes the first period and Paystack
 * spawns the subscription record server-side. We rely on the
 * subscription.create webhook to learn the subscription_code afterwards.
 */
export async function initializeSubscriptionTransaction(
  input: PaystackSubscriptionInitInput
): Promise<PaystackInitData> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amount * 100),
      currency: input.currency,
      plan: input.planCode,
      reference: input.reference,
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
      body?.message ?? 'Failed to initialize Paystack subscription',
      response.status >= 400 && response.status < 500 ? BAD_REQUEST : INTERNAL_SERVER_ERROR
    );
  }

  return body.data;
}

/**
 * Cancel a subscription. Paystack requires BOTH the subscription code AND the
 * customer-specific email_token (returned alongside the subscription on
 * subscription.create). We persist both on UserSubscription.
 *
 * After this call Paystack stops billing; the subscription.disable webhook
 * arrives shortly after — the recurring webhook handler is what flips our
 * local status to CANCELLED.
 */
export async function disablePaystackSubscription(input: {
  subscriptionCode: string;
  emailToken: string;
}): Promise<void> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/subscription/disable`, {
    method: 'POST',
    headers: paystackHeaders(),
    body: JSON.stringify({
      code: input.subscriptionCode,
      token: input.emailToken,
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
  } | null;

  if (!response.ok || !body?.status) {
    throw new AppError(
      body?.message ?? 'Failed to disable Paystack subscription',
      response.status >= 400 && response.status < 500 ? BAD_REQUEST : INTERNAL_SERVER_ERROR
    );
  }
}
