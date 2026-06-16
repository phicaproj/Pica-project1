import { PaymentProvider, PaymentStatus, Plan, Prisma, SubscriptionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import {
  BAD_REQUEST,
  CONFLICT,
  NOT_FOUND,
} from '../../service/shared/http';
import { validateAndPriceCoupon } from '../coupon/coupon.service';
import {
  newPaymentReference,
  initializeSubscriptionTransaction,
  disablePaystackSubscription,
  createPaystackPlan,
  updatePaystackPlan,
  type PaystackCurrency,
} from '../../service/shared/paystack.service';
import { getUsdToNgnRate } from '../settings/settings.service';
import { sendSubscriptionCancelledEmail } from '../../service/shared/email.service';
import { APP_URL } from '../../Config/env';
import type {
  AdminListPlansResponse,
  AdminPlanResponse,
  CancelSubscriptionResponse,
  CreatePlanInput,
  ListPlansResponse,
  MySubscriptionPayload,
  MySubscriptionResponse,
  SubscribeResponse,
  SubscriptionPlanAdmin,
  SubscriptionPlanPublic,
  UpdatePlanInput,
} from './subscription.types';

// ──────────────────────────────────────────────────────────────────────────
// Shared mappers + small helpers
// ──────────────────────────────────────────────────────────────────────────

// Mirrors payment.service.resolveChargeCurrency — Nigerian users charge in
// NGN, everyone else in USD. Kept local because the only callers live in
// payment-shaped modules and the alias list must stay in sync.
const NIGERIA_ALIASES = new Set([
  'nigeria',
  'ng',
  'nga',
  'federal republic of nigeria',
]);
function resolveChargeCurrency(country: string | null | undefined): PaystackCurrency {
  if (!country) return 'USD';
  return NIGERIA_ALIASES.has(country.trim().toLowerCase()) ? 'NGN' : 'USD';
}

const round2 = (n: number) => Math.round(n * 100) / 100;

type PlanRow = {
  id: string;
  tier: number;
  name: string;
  description: string;
  priceUsd: Prisma.Decimal;
  phase2aPerMonth: number;
  phase2bPerMonth: number;
  consultationsPerMonth: number;
  features: string[];
  paystackPlanCodeUsd: string | null;
  paystackPlanCodeNgn: string | null;
  isActive: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

function toPublicPlan(row: PlanRow): SubscriptionPlanPublic {
  return {
    id: row.id,
    tier: row.tier,
    name: row.name,
    description: row.description,
    priceUsd: Number(row.priceUsd),
    phase2aPerMonth: row.phase2aPerMonth,
    phase2bPerMonth: row.phase2bPerMonth,
    consultationsPerMonth: row.consultationsPerMonth,
    features: row.features,
    displayOrder: row.displayOrder,
  };
}

function toAdminPlan(row: PlanRow): SubscriptionPlanAdmin {
  return {
    ...toPublicPlan(row),
    paystackPlanCodeUsd: row.paystackPlanCodeUsd,
    paystackPlanCodeNgn: row.paystackPlanCodeNgn,
    isActive: row.isActive,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

// Add exactly one month to `start`. Used as a local fallback when we don't
// yet know Paystack's authoritative period end (e.g. immediately after
// initialize, before subscription.create fires). The webhook handler will
// overwrite this with the real value once Paystack confirms.
function addOneMonth(start: Date): Date {
  const end = new Date(start);
  end.setUTCMonth(end.getUTCMonth() + 1);
  return end;
}

// ──────────────────────────────────────────────────────────────────────────
// USER — GET /api/subscription/plans
// ──────────────────────────────────────────────────────────────────────────

export async function listPlansService(): Promise<ListPlansResponse> {
  const [rows, usdToNgn, settings] = await Promise.all([
    prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ displayOrder: 'asc' }, { tier: 'asc' }],
    }),
    getUsdToNgnRate(),
    prisma.appSettings.findFirst({
      select: { payPerUseActive: true, subscriptionActive: true },
    }),
  ]);

  // Default "both live" if the singleton row is missing — best-effort for
  // public reads. The toggle invariant is enforced on write so this branch
  // is only hit on a freshly-truncated DB.
  const payPerUseActive = settings?.payPerUseActive ?? true;
  const subscriptionActive = settings?.subscriptionActive ?? true;

  // Section F — when the subscription section is off we zero out the plan
  // list so cached FE callers can never render the picker.
  const plans = subscriptionActive ? rows.map(toPublicPlan) : [];

  return {
    message: 'Plans fetched successfully',
    currency: 'USD',
    usdToNgn,
    sections: {
      payPerUse: payPerUseActive,
      subscription: subscriptionActive,
    },
    plans,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// USER — GET /api/subscription/me
// ──────────────────────────────────────────────────────────────────────────
//
// Returns the user's most recent ACTIVE/PAST_DUE subscription. CANCELLED and
// EXPIRED subscriptions don't surface here — the FE treats `null` as
// "user is on the free tier" and shows the plan picker.

export async function getMySubscriptionService(userId: string): Promise<MySubscriptionResponse> {
  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
    },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  if (!sub) {
    return { message: 'No active subscription', subscription: null };
  }

  // Usage for the current period. If the row doesn't exist yet (first
  // request in a new period), report zeros — the row is created lazily by
  // assertSubscriptionQuota on the first consumption.
  const usage = await prisma.subscriptionUsage.findUnique({
    where: {
      userSubscriptionId_periodStart: {
        userSubscriptionId: sub.id,
        periodStart: sub.currentPeriodStart,
      },
    },
  });

  const payload: MySubscriptionPayload = {
    id: sub.id,
    status: sub.status,
    plan: toPublicPlan(sub.plan),
    currency: sub.currency === 'NGN' ? 'NGN' : 'USD',
    currentPeriodStart: sub.currentPeriodStart.toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd.toISOString(),
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    card: sub.cardLast4
      ? {
          last4: sub.cardLast4,
          brand: sub.cardBrand,
          bank: sub.cardBank,
          expMonth: sub.cardExpMonth,
          expYear: sub.cardExpYear,
        }
      : null,
    usage: {
      phase2aUsed: usage?.phase2aUsed ?? 0,
      phase2bUsed: usage?.phase2bUsed ?? 0,
      consultationsUsed: usage?.consultationsUsed ?? 0,
    },
  };

  return { message: 'Subscription fetched successfully', subscription: payload };
}

// ──────────────────────────────────────────────────────────────────────────
// USER — POST /api/subscription/subscribe
// ──────────────────────────────────────────────────────────────────────────
//
// Initializes a Paystack transaction with the plan attached. Paystack creates
// the subscription on its side after the first successful charge; we wait for
// the subscription.create webhook (Slice 5 task #15) to persist the
// subscription_code + email_token. Until then we record an UNCLAIMED
// placeholder UserSubscription row with status PAST_DUE — the webhook flips
// it to ACTIVE once the first charge clears.
//
// Note: we DON'T create a UserSubscription row here. The placeholder approach
// gave races with the webhook (two paths creating the same row). Instead the
// webhook is the single creator, and we attach the user via metadata.

export async function subscribeService(
  userId: string,
  planId: string,
  options: { couponCode?: string } = {}
): Promise<SubscribeResponse> {
  const [user, plan] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, country: true, businessName: true },
    }),
    prisma.subscriptionPlan.findUnique({ where: { id: planId } }),
  ]);

  if (!user) throw new AppError('User not found', NOT_FOUND);
  if (!plan) throw new AppError('Plan not found', NOT_FOUND);
  if (!plan.isActive) {
    throw new AppError('This plan is no longer available', BAD_REQUEST);
  }

  // Block double-subscribe — if the user already has a live subscription we
  // make them cancel first. Lets us avoid the FE accidentally signing the
  // same user up twice if they spam the button.
  const existing = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
    },
    select: { id: true },
  });
  if (existing) {
    throw new AppError(
      'You already have an active subscription — cancel it before starting a new one.',
      CONFLICT
    );
  }

  const chargeCurrency = resolveChargeCurrency(user.country);
  const usdToNgn = chargeCurrency === 'NGN' ? await getUsdToNgnRate() : 1;
  const priceUsd = Number(plan.priceUsd);

  // Coupon math, like initPaymentService, runs in USD so a flat amountOff
  // means the same thing across NGN and USD users. We compute the discount
  // first, then convert the final charge into the wire currency.
  let chargeUsd = priceUsd;
  let appliedCouponCode: string | null = null;
  let discountUsd = 0;
  if (options.couponCode) {
    const pricing = await validateAndPriceCoupon(options.couponCode, user.id, priceUsd, {
      plan: Plan.SUBSCRIPTION,
      pillarId: null,
    });
    chargeUsd = pricing.finalAmount;
    appliedCouponCode = pricing.code;
    discountUsd = pricing.discountAmount;
  }

  const chargeAmount = round2(chargeCurrency === 'NGN' ? chargeUsd * usdToNgn : chargeUsd);
  const baseAmountWire = round2(chargeCurrency === 'NGN' ? priceUsd * usdToNgn : priceUsd);
  const discountAmountWire = round2(chargeCurrency === 'NGN' ? discountUsd * usdToNgn : discountUsd);

  const reference = newPaymentReference('SUB');

  // 100% waiver: a full-discount coupon leaves nothing to charge. Mirror the
  // pay-per-use free-coupon path — activate the subscription locally, record
  // a $0 Payment row for audit/analytics, skip Paystack entirely. No email
  // is sent for free settlements (see payment.service.ts comment).
  if (chargeAmount <= 0 && appliedCouponCode) {
    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          userId: user.id,
          plan: Plan.SUBSCRIPTION,
          provider: PaymentProvider.PAYSTACK,
          providerReference: reference,
          amount: new Prisma.Decimal(0),
          amountUsd: new Prisma.Decimal(0),
          appliedCouponCode,
          discountAmount: new Prisma.Decimal(discountAmountWire),
          currency: chargeCurrency,
          status: PaymentStatus.SUCCESS,
          paymentMethod: 'coupon',
          paidAt: now,
          customerEmail: user.email,
          customerBusinessName: user.businessName,
        },
      });
      // Bump the coupon's redemption counter — validateAndPriceCoupon only
      // checks; it doesn't decrement. Mirror payment.service's pattern.
      await tx.discount.update({
        where: { code: appliedCouponCode },
        data: { usedCount: { increment: 1 } },
      });
      // Create the subscription row directly. There is no Paystack
      // subscription code because we never hit Paystack — the row has no
      // recurring billing handle, which is fine for a 100%-off bootstrap
      // (the period is fixed; on expiry the user has to subscribe again).
      await tx.userSubscription.create({
        data: {
          userId: user.id,
          planId: plan.id,
          status: SubscriptionStatus.ACTIVE,
          currency: chargeCurrency,
          paystackSubscriptionCode: null,
          paystackCustomerCode: null,
          paystackEmailToken: null,
          currentPeriodStart: now,
          currentPeriodEnd: addOneMonth(now),
        },
      });
    });

    return {
      message: 'Subscription activated — coupon covered the full amount',
      free: true,
      authorizationUrl: null,
      accessCode: null,
      reference,
      amount: 0,
      baseAmount: baseAmountWire,
      discountAmount: discountAmountWire,
      currency: chargeCurrency,
      couponCode: appliedCouponCode,
    };
  }

  // Need a Paystack plan code in the wire currency. If the admin saved the
  // tier before USD/NGN was enabled, we lazily create it here so the first
  // user to subscribe doesn't get blocked. Errors propagate.
  let planCode = chargeCurrency === 'USD' ? plan.paystackPlanCodeUsd : plan.paystackPlanCodeNgn;
  if (!planCode) {
    const created = await createPaystackPlan({
      name: `PICA ${plan.name} (${chargeCurrency})`,
      amount: chargeAmount,
      currency: chargeCurrency,
      interval: 'monthly',
      description: plan.description,
    });
    planCode = created.plan_code;
    await prisma.subscriptionPlan.update({
      where: { id: plan.id },
      data:
        chargeCurrency === 'USD'
          ? { paystackPlanCodeUsd: planCode }
          : { paystackPlanCodeNgn: planCode },
    });
  }

  const paystackData = await initializeSubscriptionTransaction({
    email: user.email,
    planCode,
    amount: chargeAmount,
    currency: chargeCurrency,
    reference,
    metadata: {
      kind: 'subscription',
      userId: user.id,
      planId: plan.id,
      currency: chargeCurrency,
      // Coupon code flows through metadata so the webhook can persist it on
      // the first-charge Payment row for audit/redemption tracking.
      ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
    },
  });

  return {
    message: 'Subscription initialized — complete payment to activate',
    free: false,
    authorizationUrl: paystackData.authorization_url,
    accessCode: paystackData.access_code,
    reference: paystackData.reference,
    amount: chargeAmount,
    baseAmount: baseAmountWire,
    discountAmount: discountAmountWire,
    currency: chargeCurrency,
    couponCode: appliedCouponCode,
  };
}

// ──────────────────────────────────────────────────────────────────────────
// USER — POST /api/subscription/cancel
// ──────────────────────────────────────────────────────────────────────────
//
// Soft-cancel: we ask Paystack to stop billing and mark the row
// cancelAtPeriodEnd. The subscription stays ACTIVE locally until the period
// ends — users keep their quota through what they've already paid for.
// subscription.disable webhook eventually flips status to CANCELLED.

export async function cancelSubscriptionService(
  userId: string
): Promise<CancelSubscriptionResponse> {
  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
    },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: { select: { name: true } },
      user: { select: { email: true, businessName: true } },
    },
  });

  if (!sub) {
    throw new AppError('No active subscription to cancel', NOT_FOUND);
  }
  if (sub.cancelAtPeriodEnd) {
    throw new AppError('Subscription is already scheduled to cancel', CONFLICT);
  }

  // If we don't have the Paystack handles yet (subscription.create webhook
  // hasn't fired), we still mark our row — the webhook will see
  // cancelAtPeriodEnd and skip the activation path.
  if (sub.paystackSubscriptionCode && sub.paystackEmailToken) {
    await disablePaystackSubscription({
      subscriptionCode: sub.paystackSubscriptionCode,
      emailToken: sub.paystackEmailToken,
    });
  }

  const updated = await prisma.userSubscription.update({
    where: { id: sub.id },
    data: { cancelAtPeriodEnd: true },
    select: { currentPeriodEnd: true },
  });

  // Fire-and-forget: "you're cancelled, you'll keep access until X, come back".
  // Failures don't block the cancel response — the DB flip is the source of truth.
  void sendSubscriptionCancelledEmail({
    toEmail: sub.user.email,
    businessName: sub.user.businessName,
    planName: sub.plan.name,
    currentPeriodEnd: updated.currentPeriodEnd,
    resubscribeUrl: `${APP_URL}/dashboard/subscription`,
  }).catch((error) => {
    console.error('[subscription:cancel] email failed:', error);
  });

  return {
    message: 'Subscription will end at the current period',
    cancelAtPeriodEnd: true,
    currentPeriodEnd: updated.currentPeriodEnd.toISOString(),
  };
}

// ──────────────────────────────────────────────────────────────────────────
// ADMIN — tier CRUD
// ──────────────────────────────────────────────────────────────────────────
//
// Listing returns all tiers — active and inactive — because the admin uses
// the same screen to manage retired tiers. Public endpoint above filters.

export async function adminListPlansService(): Promise<AdminListPlansResponse> {
  const rows = await prisma.subscriptionPlan.findMany({
    orderBy: [{ displayOrder: 'asc' }, { tier: 'asc' }],
  });
  return {
    message: 'Plans fetched successfully',
    plans: rows.map(toAdminPlan),
  };
}

export async function adminCreatePlanService(
  input: CreatePlanInput
): Promise<AdminPlanResponse> {
  // Reject duplicate tier numbers — the FE displays tiers ordered by tier and
  // duplicates would shadow each other. We keep tier strictly positive.
  const existingTier = await prisma.subscriptionPlan.findFirst({
    where: { tier: input.tier },
    select: { id: true },
  });
  if (existingTier) {
    throw new AppError(`A plan with tier ${input.tier} already exists`, CONFLICT);
  }

  const created = await prisma.subscriptionPlan.create({
    data: {
      tier: input.tier,
      name: input.name,
      description: input.description,
      priceUsd: new Prisma.Decimal(input.priceUsd.toFixed(2)),
      phase2aPerMonth: input.phase2aPerMonth,
      phase2bPerMonth: input.phase2bPerMonth,
      consultationsPerMonth: input.consultationsPerMonth,
      features: input.features,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
    },
  });

  // Best-effort Paystack mirror in USD. We don't fail the admin save if
  // Paystack returns an error — the lazy path in subscribeService will
  // back-fill on first subscription instead. Log so the admin can diagnose.
  let paystackPlanCodeUsd: string | null = null;
  try {
    const result = await createPaystackPlan({
      name: `PICA ${input.name} (USD)`,
      amount: input.priceUsd,
      currency: 'USD',
      interval: 'monthly',
      description: input.description,
    });
    paystackPlanCodeUsd = result.plan_code;
  } catch (error) {
    console.warn(
      `[subscription:create] Paystack USD plan sync failed for ${created.id}:`,
      error
    );
  }

  const finalRow = paystackPlanCodeUsd
    ? await prisma.subscriptionPlan.update({
        where: { id: created.id },
        data: { paystackPlanCodeUsd },
      })
    : created;

  return {
    message: 'Plan created successfully',
    plan: toAdminPlan(finalRow),
  };
}

export async function adminUpdatePlanService(
  planId: string,
  input: UpdatePlanInput
): Promise<AdminPlanResponse> {
  const existing = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });
  if (!existing) {
    throw new AppError('Plan not found', NOT_FOUND);
  }

  const data: Prisma.SubscriptionPlanUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.priceUsd !== undefined) {
    data.priceUsd = new Prisma.Decimal(input.priceUsd.toFixed(2));
  }
  if (input.phase2aPerMonth !== undefined) data.phase2aPerMonth = input.phase2aPerMonth;
  if (input.phase2bPerMonth !== undefined) data.phase2bPerMonth = input.phase2bPerMonth;
  if (input.consultationsPerMonth !== undefined) {
    data.consultationsPerMonth = input.consultationsPerMonth;
  }
  if (input.features !== undefined) data.features = input.features;
  if (input.isActive !== undefined) data.isActive = input.isActive;
  if (input.displayOrder !== undefined) data.displayOrder = input.displayOrder;

  const updated = await prisma.subscriptionPlan.update({
    where: { id: planId },
    data,
  });

  // Best-effort Paystack sync. Currency is immutable on Paystack's side so we
  // can't change it — name / amount / description we can. If Paystack is
  // unhappy we still persist the local edit and warn.
  const priceChanged = input.priceUsd !== undefined && Number(existing.priceUsd) !== input.priceUsd;
  const nameOrDescChanged = input.name !== undefined || input.description !== undefined;

  if ((priceChanged || nameOrDescChanged) && existing.paystackPlanCodeUsd) {
    try {
      await updatePaystackPlan(existing.paystackPlanCodeUsd, {
        name: input.name !== undefined ? `PICA ${input.name} (USD)` : undefined,
        amount: input.priceUsd,
        description: input.description,
      });
    } catch (error) {
      console.warn(
        `[subscription:update] Paystack USD sync failed for ${planId}:`,
        error
      );
    }
  }
  if ((priceChanged || nameOrDescChanged) && existing.paystackPlanCodeNgn) {
    try {
      const usdToNgn = await getUsdToNgnRate();
      await updatePaystackPlan(existing.paystackPlanCodeNgn, {
        name: input.name !== undefined ? `PICA ${input.name} (NGN)` : undefined,
        amount:
          input.priceUsd !== undefined ? round2(input.priceUsd * usdToNgn) : undefined,
        description: input.description,
      });
    } catch (error) {
      console.warn(
        `[subscription:update] Paystack NGN sync failed for ${planId}:`,
        error
      );
    }
  }

  return {
    message: 'Plan updated successfully',
    plan: toAdminPlan(updated),
  };
}

export async function adminDeletePlanService(planId: string): Promise<{ message: string }> {
  // Soft-delete: flip isActive=false. Hard delete would orphan historical
  // UserSubscription rows. The FE public endpoint already filters by isActive.
  const existing = await prisma.subscriptionPlan.findUnique({
    where: { id: planId },
    select: { id: true, isActive: true },
  });
  if (!existing) {
    throw new AppError('Plan not found', NOT_FOUND);
  }
  if (!existing.isActive) {
    throw new AppError('Plan is already inactive', CONFLICT);
  }

  await prisma.subscriptionPlan.update({
    where: { id: planId },
    data: { isActive: false },
  });

  return { message: 'Plan deactivated successfully' };
}

// ──────────────────────────────────────────────────────────────────────────
// SHARED — webhook helpers (consumed by Slice 5 task #15)
// ──────────────────────────────────────────────────────────────────────────
//
// Exposed here so payment.service's webhook router can call into the
// subscription module when a charge / subscription event arrives. Keeping
// the persistence logic next to the rest of the subscription state.

/**
 * Card-on-file snapshot Paystack ships back in charge.success.data.authorization.
 * We persist only masked / non-PAN fields plus the `authorizationCode` that
 * Paystack uses as the reusable charge handle for renewals. Never the full
 * PAN, never the CVV.
 */
export type PaystackAuthorizationSnapshot = {
  authorization_code: string;
  last4?: string | null;
  card_type?: string | null;
  bank?: string | null;
  exp_month?: string | null;
  exp_year?: string | null;
};

/**
 * Activate (or reactivate) a subscription after a successful charge. Called
 * by the webhook handler when charge.success or subscription.create lands
 * with metadata.kind === 'subscription'. Idempotent — repeat calls with the
 * same subscription code just bump current_period_end.
 *
 * `authorization` is the masked card snapshot from Paystack. Passed on every
 * charge.success but only persisted on the first one (we keep the original
 * card; a re-auth on a new card would set a new authorizationCode and that
 * IS overwritten). Settings → Payments reads these fields back.
 */
export async function activateSubscriptionFromWebhook(input: {
  userId: string;
  planId: string;
  currency: 'USD' | 'NGN';
  paystackSubscriptionCode?: string | null;
  paystackCustomerCode?: string | null;
  paystackEmailToken?: string | null;
  /** Authoritative period start from Paystack, or `new Date()` as fallback. */
  periodStart: Date;
  /** Authoritative period end from Paystack, or +1 month as fallback. */
  periodEnd?: Date;
  authorization?: PaystackAuthorizationSnapshot | null;
}): Promise<void> {
  const periodEnd = input.periodEnd ?? addOneMonth(input.periodStart);
  const cardFields = input.authorization
    ? {
        cardLast4: input.authorization.last4 ?? null,
        cardBrand: input.authorization.card_type ?? null,
        cardBank: input.authorization.bank ?? null,
        cardExpMonth: input.authorization.exp_month ?? null,
        cardExpYear: input.authorization.exp_year ?? null,
        cardAuthorizationCode: input.authorization.authorization_code,
      }
    : {};

  // If we already have a row for this subscription code, this is a renewal —
  // extend the period and reset cancelAtPeriodEnd (renewals after a cancel
  // request shouldn't happen, but be defensive). Otherwise create fresh.
  if (input.paystackSubscriptionCode) {
    const existing = await prisma.userSubscription.findUnique({
      where: { paystackSubscriptionCode: input.paystackSubscriptionCode },
      select: { id: true },
    });
    if (existing) {
      await prisma.userSubscription.update({
        where: { id: existing.id },
        data: {
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: input.periodStart,
          currentPeriodEnd: periodEnd,
          paystackCustomerCode: input.paystackCustomerCode ?? undefined,
          paystackEmailToken: input.paystackEmailToken ?? undefined,
          ...cardFields,
        },
      });
      return;
    }
  }

  await prisma.userSubscription.create({
    data: {
      userId: input.userId,
      planId: input.planId,
      status: SubscriptionStatus.ACTIVE,
      currency: input.currency,
      paystackSubscriptionCode: input.paystackSubscriptionCode ?? null,
      paystackCustomerCode: input.paystackCustomerCode ?? null,
      paystackEmailToken: input.paystackEmailToken ?? null,
      currentPeriodStart: input.periodStart,
      currentPeriodEnd: periodEnd,
      ...cardFields,
    },
  });
}

/**
 * Flip status to CANCELLED for the matching subscription code. Idempotent.
 *
 * Hard period boundary: when subscription.disable fires we ALSO flip the row
 * to EXPIRED at currentPeriodEnd via the cron — that's what zeroes the user's
 * quota. CANCELLED means "user requested cancellation"; EXPIRED means
 * "period closed, quota dead". Both end the subscription; only EXPIRED ends
 * the user's access mid-month. CANCELLED users keep their quota through
 * currentPeriodEnd, then EXPIRED takes over.
 */
export async function markSubscriptionCancelled(
  paystackSubscriptionCode: string
): Promise<void> {
  await prisma.userSubscription.updateMany({
    where: { paystackSubscriptionCode },
    data: { status: SubscriptionStatus.CANCELLED, cancelAtPeriodEnd: true },
  });
}

/**
 * Sweep subscriptions whose period ended without a renewal. Called by the
 * period-end cron (Slice 6) and also on demand from getMySubscriptionService
 * via the assertSubscriptionQuota helper so even in dev without the cron the
 * status corrects itself on read. No quota carries over — a user with 3
 * unused 2A credits at expiry loses them and lands on pay-per-use.
 */
export async function expireLapsedSubscriptions(now: Date = new Date()): Promise<void> {
  await prisma.userSubscription.updateMany({
    where: {
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
      currentPeriodEnd: { lt: now },
      // If cancelAtPeriodEnd is true, this row is already on its way out and
      // we flip it to EXPIRED. If it's false, the renewal charge failed —
      // flip to EXPIRED rather than leaving it in limbo; webhook will create
      // a fresh row if the user resubscribes.
    },
    data: { status: SubscriptionStatus.EXPIRED },
  });
}

// ──────────────────────────────────────────────────────────────────────────
// QUOTA — assert + consume
// ──────────────────────────────────────────────────────────────────────────
//
// Used by Phase 2A start, Phase 2B start, and (future) consultation start.
// Contract is "should this action come out of the subscription bucket, or
// fall through to pay-per-use?" — never throw on no-quota. The caller decides
// what to do: if hasQuota=true, call consumeSubscriptionQuota inside the
// transaction that grants entitlement; if false, route the user through the
// existing one-off payment init.

export type SubscriptionQuotaKind = 'phase2a' | 'phase2b' | 'consultation';

export type QuotaVerdict =
  | {
      hasQuota: true;
      subscriptionId: string;
      periodStart: Date;
      remaining: number;
    }
  | { hasQuota: false; reason: 'no-subscription' | 'quota-exhausted' | 'expired' };

/**
 * Non-throwing. Read-only. Self-heals EXPIRED status on lapsed periods so the
 * verdict reflects current truth even without the cron.
 */
export async function assertSubscriptionQuota(
  userId: string,
  kind: SubscriptionQuotaKind
): Promise<QuotaVerdict> {
  // Self-heal: any subscription that's already past its period_end without a
  // renewal flips to EXPIRED right here. Cheap — updateMany is bounded by the
  // tiny number of subs a single user holds.
  await expireLapsedSubscriptions();

  const sub = await prisma.userSubscription.findFirst({
    where: {
      userId,
      status: { in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.PAST_DUE] },
    },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  if (!sub) return { hasQuota: false, reason: 'no-subscription' };

  // Period boundary defence-in-depth — if the self-heal above missed
  // (clock skew, etc.) treat anything past period_end as expired.
  if (sub.currentPeriodEnd.getTime() <= Date.now()) {
    return { hasQuota: false, reason: 'expired' };
  }

  const quotaForKind =
    kind === 'phase2a'
      ? sub.plan.phase2aPerMonth
      : kind === 'phase2b'
        ? sub.plan.phase2bPerMonth
        : sub.plan.consultationsPerMonth;

  const usage = await prisma.subscriptionUsage.findUnique({
    where: {
      userSubscriptionId_periodStart: {
        userSubscriptionId: sub.id,
        periodStart: sub.currentPeriodStart,
      },
    },
  });

  const usedForKind =
    kind === 'phase2a'
      ? (usage?.phase2aUsed ?? 0)
      : kind === 'phase2b'
        ? (usage?.phase2bUsed ?? 0)
        : (usage?.consultationsUsed ?? 0);

  if (usedForKind >= quotaForKind) {
    return { hasQuota: false, reason: 'quota-exhausted' };
  }

  return {
    hasQuota: true,
    subscriptionId: sub.id,
    periodStart: sub.currentPeriodStart,
    remaining: quotaForKind - usedForKind,
  };
}

/**
 * Decrement the relevant counter. Caller MUST have just received hasQuota=true
 * from assertSubscriptionQuota in the same request and run this inside the
 * transaction that grants the entitlement, so a transaction abort rolls back
 * both. The upsert handles the "first consumption of a period" case where the
 * SubscriptionUsage row doesn't exist yet.
 */
export async function consumeSubscriptionQuota(
  tx: Prisma.TransactionClient,
  input: {
    subscriptionId: string;
    periodStart: Date;
    periodEnd: Date;
    kind: SubscriptionQuotaKind;
  }
): Promise<void> {
  const incField =
    input.kind === 'phase2a'
      ? { phase2aUsed: { increment: 1 } }
      : input.kind === 'phase2b'
        ? { phase2bUsed: { increment: 1 } }
        : { consultationsUsed: { increment: 1 } };

  await tx.subscriptionUsage.upsert({
    where: {
      userSubscriptionId_periodStart: {
        userSubscriptionId: input.subscriptionId,
        periodStart: input.periodStart,
      },
    },
    create: {
      userSubscriptionId: input.subscriptionId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      phase2aUsed: input.kind === 'phase2a' ? 1 : 0,
      phase2bUsed: input.kind === 'phase2b' ? 1 : 0,
      consultationsUsed: input.kind === 'consultation' ? 1 : 0,
    },
    update: incField,
  });
}
