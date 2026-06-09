import { Prisma } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import type { ScoringSettingsResponse, UpdateScoringSettingsInput } from './scoring.types';

// Matches the id seeded by the scoring_settings migration; used only when the
// singleton row is missing (e.g. a fresh DB) so GET/PATCH can self-heal.
const SINGLETON_ID = '00000000-0000-4000-8000-0000000000a1';

type SettingsRow = {
  id: string;
  amberMin: Prisma.Decimal;
  greenMin: Prisma.Decimal;
  redLabel: string;
  redDescription: string;
  amberLabel: string;
  amberDescription: string;
  greenLabel: string;
  greenDescription: string;
  updatedAt: Date;
};

const toResponse = (message: string, row: SettingsRow): ScoringSettingsResponse => ({
  message,
  settings: {
    amberMin: Number(row.amberMin),
    greenMin: Number(row.greenMin),
    redLabel: row.redLabel,
    redDescription: row.redDescription,
    amberLabel: row.amberLabel,
    amberDescription: row.amberDescription,
    greenLabel: row.greenLabel,
    greenDescription: row.greenDescription,
    updatedAt: row.updatedAt.toISOString(),
  },
});

/** Returns the singleton row, creating it with defaults if it doesn't exist. */
async function getOrCreateSettings(): Promise<SettingsRow> {
  const existing = await prisma.scoringSettings.findFirst();
  if (existing) return existing;

  return prisma.scoringSettings.create({
    data: {
      id: SINGLETON_ID,
      amberMin: new Prisma.Decimal(50),
      greenMin: new Prisma.Decimal(80),
      phase2aQuestionLimit: 40,
      phase2bQuestionLimit: 30,
    },
  });
}

export async function getScoringSettingsService(): Promise<ScoringSettingsResponse> {
  const settings = await getOrCreateSettings();
  return toResponse('Scoring settings fetched successfully', settings);
}

export async function updateScoringSettingsService(
  input: UpdateScoringSettingsInput
): Promise<ScoringSettingsResponse> {
  const existing = await getOrCreateSettings();

  // Cross-field check on the MERGED values so patching a single cutoff is
  // still validated against the one already stored.
  const amberMin = input.amberMin ?? Number(existing.amberMin);
  const greenMin = input.greenMin ?? Number(existing.greenMin);
  if (amberMin >= greenMin) {
    throw new AppError(
      'amberMin must be less than greenMin (RED < AMBER < GREEN)',
      UNPROCESSABLE_CONTENT
    );
  }

  const updated = await prisma.scoringSettings.update({
    where: { id: existing.id },
    data: {
      ...(input.amberMin !== undefined
        ? { amberMin: new Prisma.Decimal(input.amberMin.toFixed(2)) }
        : {}),
      ...(input.greenMin !== undefined
        ? { greenMin: new Prisma.Decimal(input.greenMin.toFixed(2)) }
        : {}),
      ...(input.redLabel !== undefined ? { redLabel: input.redLabel } : {}),
      ...(input.redDescription !== undefined ? { redDescription: input.redDescription } : {}),
      ...(input.amberLabel !== undefined ? { amberLabel: input.amberLabel } : {}),
      ...(input.amberDescription !== undefined
        ? { amberDescription: input.amberDescription }
        : {}),
      ...(input.greenLabel !== undefined ? { greenLabel: input.greenLabel } : {}),
      ...(input.greenDescription !== undefined
        ? { greenDescription: input.greenDescription }
        : {}),
      ...(input.phase2aQuestionLimit !== undefined
        ? { phase2aQuestionLimit: input.phase2aQuestionLimit }
        : {}),
      ...(input.phase2bQuestionLimit !== undefined
        ? { phase2bQuestionLimit: input.phase2bQuestionLimit }
        : {}),
    },
  });

  return toResponse('Scoring settings updated successfully', updated);
}
