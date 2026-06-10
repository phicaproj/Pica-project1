import { z } from 'zod';
import type { ColorBand, InsightRule, RiskType } from '@prisma/client';

// ── Per finding (1–2 per pillar) ──────────────────────────
export interface ScoringFinding {
  optionId: string;
  questionText: string;
  selectedLabel: string;
  observation: string;
  recommendation: string;
  riskType: RiskType;
  score: number;
}

// ── Per pillar ─────────────────────────────────────────────
export interface ScoringPillarPayload {
  pillarId: string;
  pillarName: string; // ← ADDED: human-readable name e.g. "Founder & Leadership"
  pillarCode: string; // ← ADDED: short code e.g. "FL"
  rawScore: number;
  maxPossibleScore: number;
  weightedScore: number;
  hasKnockout: boolean;
  colorBand: ColorBand;
  insightRuleApplied: InsightRule;
  /** Top 1–2 findings surfaced on the result page view. */
  findings: ScoringFinding[];
  /**
   * Every answered question's observation/recommendation for this pillar,
   * ordered KNOCKOUT → RISK → NORMAL. Used by the PDF report so each pillar
   * page is complete; the result page view continues to use `findings`.
   */
  allFindings: ScoringFinding[];
}

// ── Overall result ─────────────────────────────────────────
export interface ScoringResultPayload {
  totalScore: number;
  colorBand: ColorBand;
  hasAnyKnockout: boolean;
  knockoutQuestionIds: string[];
  pillarScores: ScoringPillarPayload[];
}

// ============================================================
// ADMIN — score interpretation settings (admin-only routes)
// ============================================================
//
// The singleton scoring_settings row: band cutoffs + display copy. Cutoffs
// must satisfy 0 < amberMin < greenMin <= 100; the cross-field check runs on
// the merged (existing + patch) values in the service so a partial PATCH of
// just one cutoff is still validated against the other.

const bandCutoff = z
  .number()
  .gt(0, 'cutoff must be greater than 0')
  .max(100, 'cutoff cannot exceed 100');

const bandLabel = z.string().trim().min(1, 'label is required').max(50);
const bandDescription = z.string().trim().min(1, 'description is required').max(200);

export const updateScoringSettingsSchema = z
  .object({
    amberMin: bandCutoff.optional(),
    greenMin: bandCutoff.optional(),
    redLabel: bandLabel.optional(),
    redDescription: bandDescription.optional(),
    amberLabel: bandLabel.optional(),
    amberDescription: bandDescription.optional(),
    greenLabel: bandLabel.optional(),
    greenDescription: bandDescription.optional(),
    phase2aQuestionLimit: z.number().int().min(1).max(200).optional(),
    phase2bQuestionLimit: z.number().int().min(1).max(200).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type UpdateScoringSettingsInput = z.infer<typeof updateScoringSettingsSchema>;

export type ScoringSettingsResponse = {
  message: string;
  settings: {
    amberMin: number;
    greenMin: number;
    redLabel: string;
    redDescription: string;
    amberLabel: string;
    amberDescription: string;
    greenLabel: string;
    greenDescription: string;
    updatedAt: string;
  };
};
