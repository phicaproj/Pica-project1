import { Plan, Prisma } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
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

const toPricingRow = (row: RawPricingRow): PricingRow => ({
  id: row.id,
  plan: row.plan,
  pillarId: row.pillarId,
  pillarCode: row.pillar?.code ?? null,
  pillarName: row.pillar?.name ?? null,
  price: row.price.toNumber(),
  currency: 'NGN',
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
  const prices = await prisma.planPrice.findMany({
    where: {
      OR: [{ plan: Plan.PHASE2A }, { plan: Plan.PHASE2B_PILLAR, pillar: { isActive: true } }],
    },
    select: pricingSelect,
    orderBy: [{ plan: 'asc' }, { pillar: { displayOrder: 'asc' } }, { updatedAt: 'desc' }],
  });

  const rows = prices.map(toPricingRow);

  return {
    message: 'Pricing fetched successfully',
    currency: 'NGN',
    phase2A: rows.find((row) => row.plan === Plan.PHASE2A) ?? null,
    phase2B: rows.filter((row) => row.plan === Plan.PHASE2B_PILLAR),
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
