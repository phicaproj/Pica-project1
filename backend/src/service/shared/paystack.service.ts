import crypto from 'crypto';
import { PAYSTACK_BASE_URL, PAYSTACK_SECRET_KEY } from '../../Config/env';
import AppError from './appError';
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from './http';

// Thin Paystack HTTP wrapper. Two responsibilities:
export type PaystackCurrency = 'NGN' | 'USD';

export type PaystackInitInput = {
  email: string;

  amount: number;

  currency?: PaystackCurrency;

  reference: string;

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
  return `${prefix}-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;
}

// Recurring billing pieces. The flow is:
export type PaystackPlanInterval =
  'hourly' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'biannually' | 'annually';

export type PaystackPlanInput = {
  name: string;

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

// Paystack's plan update endpoint takes plan_code or numeric id as path param.
export async function updatePaystackPlan(
  planCode: string,
  input: Partial<Omit<PaystackPlanInput, 'currency'>>
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.amount !== undefined) payload.amount = Math.round(input.amount * 100);
  if (input.interval !== undefined) payload.interval = input.interval;
  if (input.description !== undefined) payload.description = input.description;

  const response = await fetch(`${PAYSTACK_BASE_URL}/plan/${encodeURIComponent(planCode)}`, {
    method: 'PUT',
    headers: paystackHeaders(),
    body: JSON.stringify(payload),
  });

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

  amount: number;
  currency: PaystackCurrency;
  reference: string;
  metadata?: Record<string, unknown>;
};

// "Create subscription" via Paystack is really "initialize a transaction with
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

// A subscription as Paystack returns it inside the customer fetch payload.
export type PaystackCustomerSubscription = {
  subscription_code: string;
  email_token: string;
  status: string; // "active" | "non-renewing" | "cancelled" | "attention" | ...
  plan?: { plan_code?: string } | null;
};

// Fetch a customer by email (or customer code) and return the subscriptions
export async function fetchPaystackCustomerSubscriptions(
  emailOrCode: string
): Promise<PaystackCustomerSubscription[]> {
  const response = await fetch(`${PAYSTACK_BASE_URL}/customer/${encodeURIComponent(emailOrCode)}`, {
    method: 'GET',
    headers: paystackHeaders(),
  });

  const body = (await response.json().catch(() => null)) as {
    status?: boolean;
    message?: string;
    data?: { subscriptions?: PaystackCustomerSubscription[] };
  } | null;

  if (!response.ok || !body?.status || !body.data) {
    throw new AppError(
      body?.message ?? 'Failed to fetch Paystack customer',
      response.status >= 400 && response.status < 500 ? BAD_REQUEST : INTERNAL_SERVER_ERROR
    );
  }

  return body.data.subscriptions ?? [];
}

// Cancel a subscription. Paystack requires BOTH the subscription code AND the
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
