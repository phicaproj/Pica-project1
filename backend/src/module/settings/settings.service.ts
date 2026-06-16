import { Prisma } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import type {
  AppSettingsPayload,
  AppSettingsResponse,
  UpdateAppSettingsInput,
} from './settings.types';

// Matches the id seeded by the app_settings migration. Used only when the
// singleton row is missing (e.g. on a fresh DB or after a manual truncate) so
// GET/PATCH can self-heal without an extra migration run.
const SINGLETON_ID = '00000000-0000-4000-8000-0000000000b1';

// Placeholder rate installed if the row is missing. Should not be relied on
// in production — the admin is expected to set the live rate via PATCH.
const DEFAULT_USD_TO_NGN = 1500;

type SettingsRow = {
  id: string;
  usdToNgn: Prisma.Decimal;
  payPerUseActive: boolean;
  subscriptionActive: boolean;
  updatedBy: string | null;
  updatedAt: Date;
};

const toPayload = (row: SettingsRow): AppSettingsPayload => ({
  usdToNgn: Number(row.usdToNgn),
  payPerUseActive: row.payPerUseActive,
  subscriptionActive: row.subscriptionActive,
  updatedBy: row.updatedBy,
  updatedAt: row.updatedAt.toISOString(),
});

const toResponse = (message: string, row: SettingsRow): AppSettingsResponse => ({
  message,
  settings: toPayload(row),
});

/** Returns the singleton row, creating it with the default rate if missing. */
async function getOrCreateSettings(): Promise<SettingsRow> {
  const existing = await prisma.appSettings.findFirst();
  if (existing) return existing;

  return prisma.appSettings.create({
    data: {
      id: SINGLETON_ID,
      usdToNgn: new Prisma.Decimal(DEFAULT_USD_TO_NGN),
    },
  });
}

/**
 * Cheap read used by callers that only need the rate (e.g. the public pricing
 * endpoint enriching its response). Returns a finite positive number; falls
 * back to the seeded default if the row is somehow missing.
 */
export async function getUsdToNgnRate(): Promise<number> {
  const settings = await getOrCreateSettings();
  return Number(settings.usdToNgn);
}

export async function getAppSettingsService(): Promise<AppSettingsResponse> {
  const settings = await getOrCreateSettings();
  return toResponse('App settings fetched successfully', settings);
}

export async function updateAppSettingsService(
  input: UpdateAppSettingsInput,
  updatedBy: string
): Promise<AppSettingsResponse> {
  const existing = await getOrCreateSettings();

  // Section F invariant — at least one storefront section must stay live.
  // We compute the effective post-patch values up front so the rejection is
  // synchronous and we never write a "both off" row.
  const nextPayPerUseActive =
    input.payPerUseActive ?? existing.payPerUseActive;
  const nextSubscriptionActive =
    input.subscriptionActive ?? existing.subscriptionActive;
  if (!nextPayPerUseActive && !nextSubscriptionActive) {
    throw new AppError(
      'At least one pricing section (pay-per-use or subscription) must stay active.',
      UNPROCESSABLE_CONTENT
    );
  }

  const updated = await prisma.appSettings.update({
    where: { id: existing.id },
    data: {
      ...(input.usdToNgn !== undefined
        ? { usdToNgn: new Prisma.Decimal(input.usdToNgn.toFixed(4)) }
        : {}),
      ...(input.payPerUseActive !== undefined
        ? { payPerUseActive: input.payPerUseActive }
        : {}),
      ...(input.subscriptionActive !== undefined
        ? { subscriptionActive: input.subscriptionActive }
        : {}),
      updatedBy,
    },
  });

  return toResponse('App settings updated successfully', updated);
}
