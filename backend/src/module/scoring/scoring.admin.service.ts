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
  orangeMin: Prisma.Decimal;
  amberMin: Prisma.Decimal;
  lightGreenMin: Prisma.Decimal;
  greenMin: Prisma.Decimal;
  redLabel: string;
  redDescription: string;
  orangeLabel: string;
  orangeDescription: string;
  amberLabel: string;
  amberDescription: string;
  lightGreenLabel: string;
  lightGreenDescription: string;
  greenLabel: string;
  greenDescription: string;
  phase2aQuestionLimit: number;
  phase2bQuestionLimit: number;
  updatedAt: Date;
};

const toResponse = (message: string, row: SettingsRow): ScoringSettingsResponse => ({
  message,
  settings: {
    orangeMin: Number(row.orangeMin),
    amberMin: Number(row.amberMin),
    lightGreenMin: Number(row.lightGreenMin),
    greenMin: Number(row.greenMin),
    redLabel: row.redLabel,
    redDescription: row.redDescription,
    orangeLabel: row.orangeLabel,
    orangeDescription: row.orangeDescription,
    amberLabel: row.amberLabel,
    amberDescription: row.amberDescription,
    lightGreenLabel: row.lightGreenLabel,
    lightGreenDescription: row.lightGreenDescription,
    greenLabel: row.greenLabel,
    greenDescription: row.greenDescription,
    phase2aQuestionLimit: row.phase2aQuestionLimit,
    phase2bQuestionLimit: row.phase2bQuestionLimit,
    updatedAt: row.updatedAt.toISOString(),
  },
});

/** Returns the singleton row, creating it with defaults if it doesn't exist. */
async function getOrCreateSettings(): Promise<SettingsRow> {
  const existing = await prisma.scoringSettings.findFirst();
  if (existing) return existing as unknown as SettingsRow;

  return prisma.scoringSettings.create({
    data: {
      id: SINGLETON_ID,
      orangeMin: new Prisma.Decimal(31),
      amberMin: new Prisma.Decimal(51),
      lightGreenMin: new Prisma.Decimal(71),
      greenMin: new Prisma.Decimal(91),
      phase2aQuestionLimit: 40,
      phase2bQuestionLimit: 30,
    },
  }) as unknown as Promise<SettingsRow>;
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
  const orangeMin = input.orangeMin ?? Number(existing.orangeMin);
  const amberMin = input.amberMin ?? Number(existing.amberMin);
  const lightGreenMin = input.lightGreenMin ?? Number(existing.lightGreenMin);
  const greenMin = input.greenMin ?? Number(existing.greenMin);
  if (orangeMin >= amberMin || amberMin >= lightGreenMin || lightGreenMin >= greenMin) {
    throw new AppError(
      'Cutoffs must satisfy RED < ORANGE < AMBER < LIGHT_GREEN < GREEN',
      UNPROCESSABLE_CONTENT
    );
  }

  const updated = await prisma.scoringSettings.update({
    where: { id: existing.id },
    data: {
      ...(input.orangeMin !== undefined
        ? { orangeMin: new Prisma.Decimal(input.orangeMin.toFixed(2)) }
        : {}),
      ...(input.amberMin !== undefined
        ? { amberMin: new Prisma.Decimal(input.amberMin.toFixed(2)) }
        : {}),
      ...(input.lightGreenMin !== undefined
        ? { lightGreenMin: new Prisma.Decimal(input.lightGreenMin.toFixed(2)) }
        : {}),
      ...(input.greenMin !== undefined
        ? { greenMin: new Prisma.Decimal(input.greenMin.toFixed(2)) }
        : {}),
      ...(input.redLabel !== undefined ? { redLabel: input.redLabel } : {}),
      ...(input.redDescription !== undefined ? { redDescription: input.redDescription } : {}),
      ...(input.orangeLabel !== undefined ? { orangeLabel: input.orangeLabel } : {}),
      ...(input.orangeDescription !== undefined ? { orangeDescription: input.orangeDescription } : {}),
      ...(input.amberLabel !== undefined ? { amberLabel: input.amberLabel } : {}),
      ...(input.amberDescription !== undefined ? { amberDescription: input.amberDescription } : {}),
      ...(input.lightGreenLabel !== undefined ? { lightGreenLabel: input.lightGreenLabel } : {}),
      ...(input.lightGreenDescription !== undefined ? { lightGreenDescription: input.lightGreenDescription } : {}),
      ...(input.greenLabel !== undefined ? { greenLabel: input.greenLabel } : {}),
      ...(input.greenDescription !== undefined ? { greenDescription: input.greenDescription } : {}),
      ...(input.phase2aQuestionLimit !== undefined
        ? { phase2aQuestionLimit: input.phase2aQuestionLimit }
        : {}),
      ...(input.phase2bQuestionLimit !== undefined
        ? { phase2bQuestionLimit: input.phase2bQuestionLimit }
        : {}),
    },
  });

  return toResponse('Scoring settings updated successfully', updated as unknown as SettingsRow);
}
