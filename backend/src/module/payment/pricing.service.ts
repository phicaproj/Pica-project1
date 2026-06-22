import { Plan, Prisma } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import { getPhase2BDiscountConfig, getUsdToNgnRate } from '../settings/settings.service';
import type {
  CreatePricingInput,
  ListPricingQuery,
  ListPricingResponse,
  PricingDetailResponse,
  PricingRow,
  PublicPricingResponse,
  UpdatePricingInput,
} from './pricing.types';

const pricingSelect = {
  id: true,
  plan: true,
  pillarId: true,
  price: true,
  features: true,
  createdAt: true,
  updatedAt: true,
  pillar: {
    select: {
      code: true,
      name: true,
    },
  },
} as const;

type RawPricingRow = Prisma.PlanPriceGetPayload<{
  select: typeof pricingSelect;
}>;

// Catalogue prices are stored as USD major units after the
// 20260615150000_plan_prices_to_usd migration. Display conversion to NGN for
// Nigerian users happens on the FE using `usdToNgn` from the public pricing
// response; charge-time conversion happens in payment.service.
const toPricingRow = (row: RawPricingRow): PricingRow => ({
  id: row.id,
  plan: row.plan,
  pillarId: row.pillarId,
  pillarCode: row.pillar?.code ?? null,
  pillarName: row.pillar?.name ?? null,
  price: row.price.toNumber(),
  currency: 'USD',
  features: row.features,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
});

async function assertActivePillar(pillarId: string): Promise<void> {
  const pillar = await prisma.pillar.findUnique({
    where: { id: pillarId },
    select: { id: true, isActive: true },
  });

  if (!pillar || !pillar.isActive) {
    throw new AppError('Pillar not found', NOT_FOUND);
  }
}

async function assertNoConflictingPrice(params: {
  plan: Plan;
  pillarId: string | null;
  exceptId?: string;
}): Promise<void> {
  const existing = await prisma.planPrice.findFirst({
    where: {
      plan: params.plan,
      pillarId: params.pillarId,
      ...(params.exceptId ? { id: { not: params.exceptId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new AppError('A price already exists for this plan and pillar', CONFLICT);
  }
}

export async function resolvePlanPrice(params: {
  plan: Plan;
  pillarId?: string | null;
}): Promise<number> {
  const pillarId = params.plan === Plan.PHASE2B_PILLAR ? params.pillarId : null;

  if (params.plan === Plan.PHASE2B_PILLAR && !pillarId) {
    throw new AppError('PHASE2B_PILLAR pricing requires a pillarId', UNPROCESSABLE_CONTENT);
  }

  const price = await prisma.planPrice.findFirst({
    where: {
      plan: params.plan,
      pillarId: pillarId ?? null,
    },
    orderBy: { updatedAt: 'desc' },
    select: { price: true },
  });

  if (!price) {
    throw new AppError('Pricing has not been configured for this plan', UNPROCESSABLE_CONTENT);
  }

  return price.price.toNumber();
}

export type Phase2BBundleQuote = {
  // USD major units. base = sum of per-pillar prices; final = base − discount.
  basePriceUsd: number;
  discountUsd: number;
  finalPriceUsd: number;
  // The effective discount percentage applied (0–100), after the cap.
  discountPct: number;
  perPillar: { pillarId: string; price: number }[];
};

/**
 * Prices a Phase 2B multi-pillar bundle. Sums each pillar's configured
 * PlanPrice, then applies the admin-configured compound discount:
 *   discountPct = min(count - 1, maxPillars - 1) × pctPerPillar
 * capped at 100%. The percentage is applied only to the FIRST `maxPillars`
 * pillars (by selection order). Anything beyond the cap is added at full
 * price, so once the customer crosses the cap the dollar discount is
 * frozen — selecting a 6th or 7th pillar no longer grows the savings line.
 * A single-pillar bundle resolves to a 0% discount, i.e. the pillar's
 * plain price. Throws if any pillar has no configured price.
 */
export async function resolvePhase2BBundlePrice(
  pillarIds: string[]
): Promise<Phase2BBundleQuote> {
  if (pillarIds.length === 0) {
    throw new AppError('At least one pillar is required for a bundle', UNPROCESSABLE_CONTENT);
  }

  const perPillar = await Promise.all(
    pillarIds.map(async (pillarId) => ({
      pillarId,
      price: await resolvePlanPrice({ plan: Plan.PHASE2B_PILLAR, pillarId }),
    }))
  );

  const round2 = (n: number) => Math.round(n * 100) / 100;
  const basePriceUsd = round2(perPillar.reduce((sum, p) => sum + p.price, 0));

  const { pctPerPillar, maxPillars } = await getPhase2BDiscountConfig();
  // Apply the percentage only to the first `maxPillars` selected entries —
  // remaining pillars are added at full price. The discount amount plateaus
  // at the cap (5+ pillars → frozen $ savings) instead of growing with N.
  const discountedCount = Math.min(perPillar.length, maxPillars);
  const discountedBase = round2(
    perPillar.slice(0, discountedCount).reduce((sum, p) => sum + p.price, 0)
  );
  const discountPct = Math.min(100, Math.max(0, discountedCount - 1) * pctPerPillar);

  const discountUsd = round2((discountedBase * discountPct) / 100);
  const finalPriceUsd = round2(basePriceUsd - discountUsd);

  return { basePriceUsd, discountUsd, finalPriceUsd, discountPct, perPillar };
}

export async function listPricingService(
  query: ListPricingQuery = {}
): Promise<ListPricingResponse> {
  const prices = await prisma.planPrice.findMany({
    where: {
      ...(query.plan ? { plan: query.plan } : {}),
      ...(query.pillarId ? { pillarId: query.pillarId } : {}),
    },
    select: pricingSelect,
    orderBy: [{ plan: 'asc' }, { pillar: { displayOrder: 'asc' } }, { updatedAt: 'desc' }],
  });

  return {
    message: 'Pricing fetched successfully',
    prices: prices.map(toPricingRow),
  };
}

export async function getPublicPricingService(): Promise<PublicPricingResponse> {
  // Prices, the FX rate, and the section toggles are independent reads with
  // no ordering constraint — fetch them in parallel so the public pricing
  // endpoint doesn't pay three sequential round-trips.
  const [prices, usdToNgn, settings] = await Promise.all([
    prisma.planPrice.findMany({
      where: {
        OR: [{ plan: Plan.PHASE2A }, { plan: Plan.PHASE2B_PILLAR, pillar: { isActive: true } }],
      },
      select: pricingSelect,
      orderBy: [{ plan: 'asc' }, { pillar: { displayOrder: 'asc' } }, { updatedAt: 'desc' }],
    }),
    getUsdToNgnRate(),
    prisma.appSettings.findFirst({
      select: {
        payPerUseActive: true,
        subscriptionActive: true,
        phase2bDiscountPctPerPillar: true,
        phase2bDiscountMaxPillars: true,
      },
    }),
  ]);

  // Default to "both sections live" if the singleton row is somehow missing
  // — getOrCreateSettings runs everywhere else, but findFirst is best-effort
  // for read-only paths.
  const payPerUseActive = settings?.payPerUseActive ?? true;
  const subscriptionActive = settings?.subscriptionActive ?? true;

  const rows = prices.map(toPricingRow);

  // Section F — when pay-per-use is off we zero out the catalogue rows so
  // anonymous visitors never see a price for a deactivated section, even if
  // their cached FE hasn't yet picked up the new section flag.
  const phase2A = payPerUseActive ? rows.find((row) => row.plan === Plan.PHASE2A) ?? null : null;
  const phase2B = payPerUseActive
    ? rows.filter((row) => row.plan === Plan.PHASE2B_PILLAR)
    : [];

  return {
    message: 'Pricing fetched successfully',
    currency: 'USD',
    usdToNgn,
    sections: {
      payPerUse: payPerUseActive,
      subscription: subscriptionActive,
    },
    // BE-1 — the bundle discount knobs so the FE renders the savings ladder
    // and live total without hardcoding the schedule. Defaults match the
    // seeded AppSettings values when the row is missing.
    phase2bDiscount: {
      pctPerPillar: settings?.phase2bDiscountPctPerPillar ?? 5,
      maxPillars: settings?.phase2bDiscountMaxPillars ?? 5,
    },
    phase2A,
    phase2B,
  };
}

export async function createPricingService(
  input: CreatePricingInput
): Promise<PricingDetailResponse> {
  const pillarId = input.plan === Plan.PHASE2B_PILLAR ? (input.pillarId ?? null) : null;

  if (input.plan === Plan.PHASE2B_PILLAR && pillarId) {
    await assertActivePillar(pillarId);
  }

  await assertNoConflictingPrice({ plan: input.plan, pillarId });

  const created = await prisma.planPrice.create({
    data: {
      plan: input.plan,
      pillarId,
      price: new Prisma.Decimal(input.price),
      ...(input.features !== undefined ? { features: input.features } : {}),
    },
    select: pricingSelect,
  });

  return {
    message: 'Pricing created successfully',
    price: toPricingRow(created),
  };
}

export async function updatePricingService(
  id: string,
  input: UpdatePricingInput
): Promise<PricingDetailResponse> {
  const existing = await prisma.planPrice.findUnique({
    where: { id },
    select: { id: true, plan: true, pillarId: true },
  });

  if (!existing) {
    throw new AppError('Pricing row not found', NOT_FOUND);
  }

  const nextPillarId =
    existing.plan === Plan.PHASE2A
      ? null
      : input.pillarId !== undefined
        ? input.pillarId
        : existing.pillarId;

  if (existing.plan === Plan.PHASE2B_PILLAR && !nextPillarId) {
    throw new AppError('PHASE2B_PILLAR pricing requires pillarId', UNPROCESSABLE_CONTENT);
  }

  if (existing.plan === Plan.PHASE2B_PILLAR && nextPillarId !== existing.pillarId) {
    const checkedPillarId = nextPillarId as string;
    await assertActivePillar(checkedPillarId);
    await assertNoConflictingPrice({
      plan: existing.plan,
      pillarId: checkedPillarId,
      exceptId: id,
    });
  }

  const updated = await prisma.planPrice.update({
    where: { id },
    data: {
      ...(input.price !== undefined ? { price: new Prisma.Decimal(input.price) } : {}),
      ...(existing.plan === Plan.PHASE2B_PILLAR && input.pillarId !== undefined
        ? { pillarId: nextPillarId }
        : {}),
      ...(input.features !== undefined ? { features: input.features } : {}),
    },
    select: pricingSelect,
  });

  return {
    message: 'Pricing updated successfully',
    price: toPricingRow(updated),
  };
}

export async function deletePricingService(id: string): Promise<{ message: string }> {
  const existing = await prisma.planPrice.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new AppError('Pricing row not found', NOT_FOUND);
  }

  await prisma.planPrice.delete({ where: { id } });
  return { message: 'Pricing deleted successfully' };
}
