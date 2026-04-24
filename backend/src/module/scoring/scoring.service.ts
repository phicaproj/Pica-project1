import { ColorBand, InsightRule, Phase, Prisma, RiskType, type PrismaClient } from '@prisma/client';
import type { ScoringFinding, ScoringPillarPayload, ScoringResultPayload } from './scoring.types';

type ScoringTx = Prisma.TransactionClient | PrismaClient;

type Phase1QuestionRecord = {
  id: string;
  pillarId: string;
  displayOrder: number;
  pillar: {
    weight: Prisma.Decimal;
  };
  options: Array<{
    score: number;
  }>;
};

type SessionResponseRecord = {
  questionId: string;
  scoreAtTime: number;
  riskTypeAtTime: RiskType;
  question: {
    id: string;
    questionText: string;
    pillarId: string;
    pillar: {
      id: string;
      weight: Prisma.Decimal;
    };
  };
  selectedOption: {
    id: string;
    optionLabel: string;
    optionText: string;
    score: number;
    riskType: RiskType;
    observation: string;
    recommendation: string;
  };
};

/**
 * Maps a 0–100 weighted score to a colour band.
 *   >= 80  → GREEN
 *   >= 50  → AMBER
 *   <  50  → RED
 */
const toColorBand = (score: number): ColorBand => {
  if (score >= 80) return ColorBand.GREEN;
  if (score >= 50) return ColorBand.AMBER;
  return ColorBand.RED;
};

/** Rounds a float to 2 decimal places and returns a plain number. */
const roundToTwo = (value: number): number => Number(value.toFixed(2));

/**
 * Determines which insight rule applies to a pillar based on
 * the risk types of the two responses.
 *
 * Priority: KNOCKOUT > BOTH_RISK > ONE_RISK > BOTH_NORMAL
 *
 * Note: riskCount includes KNOCKOUTs intentionally (a KNOCKOUT
 * is a superset of RISK), but knockoutCount is checked first so
 * it never falls through incorrectly to BOTH_RISK.
 */
const determineInsightRule = (responses: SessionResponseRecord[]): InsightRule => {
  const knockoutCount = responses.filter((r) => r.riskTypeAtTime === RiskType.KNOCKOUT).length;

  // Count responses that are either RISK or KNOCKOUT
  const riskCount = responses.filter(
    (r) => r.riskTypeAtTime === RiskType.RISK || r.riskTypeAtTime === RiskType.KNOCKOUT
  ).length;

  if (knockoutCount > 0) return InsightRule.KNOCKOUT;
  if (riskCount >= 2) return InsightRule.BOTH_RISK;
  if (riskCount === 1) return InsightRule.ONE_RISK;
  return InsightRule.BOTH_NORMAL;
};

/**
 * Selects which findings to surface to the user for a pillar.
 *
 * Step 1 — Reorder responses by priority: KNOCKOUT → RISK → NORMAL
 *           This guarantees the most critical finding is always first.
 *
 * Step 2 — Decide how many to take based on the insight rule:
 *   KNOCKOUT    → 1  (the knockout finding only — overrides everything)
 *   ONE_RISK    → 1  (the risk finding only — suppress the normal one)
 *   BOTH_NORMAL → 1  (the higher-scored normal only — one affirmation is enough)
 *   BOTH_RISK   → 2  (both risks are shown — user needs to know about each)
 *
 * Step 3 — Map to clean ScoringFinding objects for storage.
 */
const pickFindings = (responses: SessionResponseRecord[], rule: InsightRule): ScoringFinding[] => {
  // Step 1: reorder by priority
  const ordered = [
    ...responses.filter((r) => r.riskTypeAtTime === RiskType.KNOCKOUT),
    ...responses.filter((r) => r.riskTypeAtTime === RiskType.RISK),
    ...responses.filter((r) => r.riskTypeAtTime === RiskType.NORMAL),
  ];

  // Step 2: determine how many findings to surface
  // Only BOTH_RISK shows 2 findings — every other rule shows 1
  const takeCount = rule === InsightRule.BOTH_RISK ? 2 : 1;

  // Step 3: map to clean finding shape
  return ordered.slice(0, takeCount).map((response) => ({
    optionId: response.selectedOption.id,
    questionText: response.question.questionText,
    selectedLabel: response.selectedOption.optionLabel,
    observation: response.selectedOption.observation,
    recommendation: response.selectedOption.recommendation,
    riskType: response.riskTypeAtTime,
    score: response.scoreAtTime,
  }));
};

/**
 * Computes the full Phase 1 scoring result for a session.
 *
 * This function is intentionally backend-only — never expose
 * it via an HTTP route directly. Call it from assessment.service
 * inside a transaction after the session is submitted.
 *
 * Flow:
 *   1. Fetch all Phase 1 questions (with options + pillar weights)
 *   2. Fetch all session responses (with selected option details)
 *   3. Build lookup maps for O(1) access during scoring
 *   4. Loop through each pillar → compute score + findings
 *   5. Aggregate pillar scores into one overall result
 *   6. Return the full payload — caller is responsible for saving to DB
 */
export async function computePhase1Scoring(
  tx: ScoringTx,
  sessionId: string
): Promise<ScoringResultPayload> {
  // ── 1. Fetch questions and responses in parallel ────────
  const [phaseQuestions, responses] = await Promise.all([
    tx.question.findMany({
      where: {
        phase: Phase.PHASE1,
        isActive: true,
      },
      select: {
        id: true,
        pillarId: true,
        displayOrder: true,
        pillar: {
          select: {
            weight: true,
          },
        },
        options: {
          select: {
            score: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    }),
    tx.sessionResponse.findMany({
      where: { sessionId },
      select: {
        questionId: true,
        scoreAtTime: true,
        riskTypeAtTime: true,
        question: {
          select: {
            id: true,
            questionText: true,
            pillarId: true,
            pillar: {
              select: {
                id: true,
                weight: true,
              },
            },
          },
        },
        selectedOption: {
          select: {
            id: true,
            optionLabel: true,
            optionText: true,
            score: true,
            riskType: true,
            observation: true,
            recommendation: true,
          },
        },
      },
    }),
  ]);

  // ── 2. Build lookup maps from questions ─────────────────
  //
  // questionMaxScoreById  → { questionId: maxScore }
  //   Used to compute maxPossibleScore per pillar.
  //
  // pillarQuestions       → { pillarId: question[] }
  //   Used to iterate per-pillar during scoring loop.
  //
  // pillarWeightById      → { pillarId: weight }
  //   FIX: built here from phaseQuestions (not from responses)
  //   so all 7 pillars always have a weight entry regardless
  //   of how many responses exist.

  const questionMaxScoreById = new Map<string, number>();
  const pillarQuestions = new Map<string, Phase1QuestionRecord[]>();
  const pillarWeightById = new Map<string, number>();

  for (const question of phaseQuestions) {
    // Max score = highest scoring option for this question
    const maxScore = question.options.reduce((max, option) => Math.max(max, option.score), 0);
    questionMaxScoreById.set(question.id, maxScore);

    // Group questions by pillar
    const existing = pillarQuestions.get(question.pillarId) ?? [];
    existing.push(question);
    pillarQuestions.set(question.pillarId, existing);

    // Store pillar weight — only set once per pillar (all questions
    // in the same pillar share the same weight)
    if (!pillarWeightById.has(question.pillarId)) {
      pillarWeightById.set(question.pillarId, Number(question.pillar.weight));
    }
  }

  // ── 3. Build response lookup map ────────────────────────
  // { questionId: SessionResponseRecord }
  // O(1) access when matching responses to questions in the pillar loop

  const responsesByQuestionId = new Map<string, SessionResponseRecord>();
  for (const response of responses) {
    responsesByQuestionId.set(response.questionId, response as SessionResponseRecord);
  }

  // ── 4. Pre-compute totalWeight once before the pillar loop
  // FIX: moved outside the loop — this value never changes
  // across iterations so computing it 7 times was wasteful.

  const totalWeight = [...pillarWeightById.values()].reduce((sum, w) => sum + w, 0);
  const totalWeightSafe = totalWeight > 0 ? totalWeight : 1;

  // ── 5. Score each pillar ────────────────────────────────

  const pillarScores: ScoringPillarPayload[] = [];
  let totalScore = 0;
  const knockoutQuestionIds = new Set<string>();

  for (const [pillarId, questions] of pillarQuestions.entries()) {
    // Get the responses that belong to this pillar's questions
    const pillarResponses = questions
      .map((q) => responsesByQuestionId.get(q.id))
      .filter((r): r is SessionResponseRecord => Boolean(r));

    // Skip pillar entirely if no responses exist yet
    // (guards against partial sessions during testing)
    if (pillarResponses.length === 0) continue;

    // Raw score = sum of the user's selected option scores
    const rawScore = pillarResponses.reduce((sum, r) => sum + r.scoreAtTime, 0);

    // Max possible score = sum of highest option score per question
    const maxPossibleScore = questions.reduce(
      (sum, q) => sum + (questionMaxScoreById.get(q.id) ?? 0),
      0
    );

    // Weighted score = what % of the max did the user achieve (0–100)
    const weightedScore =
      maxPossibleScore > 0 ? roundToTwo((rawScore / maxPossibleScore) * 100) : 0;

    // Check if any response in this pillar was a knockout
    const hasKnockout = pillarResponses.some((r) => r.riskTypeAtTime === RiskType.KNOCKOUT);

    // Track all knockout question IDs for the overall result
    for (const r of pillarResponses) {
      if (r.riskTypeAtTime === RiskType.KNOCKOUT) {
        knockoutQuestionIds.add(r.questionId);
      }
    }

    // Determine which insight rule applies, then pick findings
    // FIX: rule is passed into pickFindings so it controls
    // how many findings are returned (1 or 2), not a blind slice(0,2)
    const insightRuleApplied = determineInsightRule(pillarResponses);
    const findings = pickFindings(pillarResponses, insightRuleApplied);
    const colorBand = toColorBand(weightedScore);

    // Contribute this pillar's weighted score to the overall total.
    // Each pillar is weighted proportionally to its share of totalWeight.
    const pillarWeight = pillarWeightById.get(pillarId) ?? 0;
    totalScore += weightedScore * (pillarWeight / totalWeightSafe);

    pillarScores.push({
      pillarId,
      rawScore,
      maxPossibleScore,
      weightedScore,
      hasKnockout,
      colorBand,
      insightRuleApplied,
      findings,
    });
  }

  // ── 6. Assemble and return overall result ───────────────

  const roundedTotalScore = roundToTwo(totalScore);

  return {
    totalScore: roundedTotalScore,
    colorBand: toColorBand(roundedTotalScore),
    hasAnyKnockout: knockoutQuestionIds.size > 0,
    knockoutQuestionIds: [...knockoutQuestionIds],
    pillarScores,
  };
}
