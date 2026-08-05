import { BusinessSize, Phase, Prisma, RiskType } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND, UNPROCESSABLE_CONTENT } from '../../service/shared/http';
import type {
  AddOptionInput,
  AdminOptionResponse,
  AdminPillarListResponse,
  AdminQuestionDetailResponse,
  AdminQuestionListResponse,
  AdminQuestionResponse,
  CreateQuestionInput,
  ListAdminQuestionsQuery,
  SavePillarWeightsInput,
  UpdateOptionInput,
  UpdatePillarCopyInput,
  UpdateQuestionInput,
} from './question.types';

// Labels assigned to options in array order. A question may hold up to 6 options.
const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'] as const;

/**
 * Derives an option's riskType from its score, relative to the best score in the
 * same question:
 *   score === 0        → KNOCKOUT
 *   score === maxScore → NORMAL
 *   otherwise          → RISK
 * This matches the seed convention (10 NORMAL / 6,3 RISK / 0 KNOCKOUT) while
 * working for any score set the admin enters.
 */
const deriveRiskType = (score: number, maxScore: number, isKnockout: boolean): RiskType => {
  if (score === 0) return isKnockout ? RiskType.KNOCKOUT : RiskType.RISK;
  if (score === maxScore) return RiskType.NORMAL;
  return RiskType.RISK;
};

const adminQuestionSelect = {
  id: true,
  pillarId: true,
  questionCode: true,
  questionText: true,
  phase: true,
  businessSize: true,
  isPhase1Featured: true,
  hasKnockoutOption: true,
  isKnockout: true,
  showOnPhase1: true,
  isActive: true,
  displayOrder: true,
  pillar: { select: { code: true } },
  options: {
    select: {
      id: true,
      optionLabel: true,
      optionText: true,
      score: true,
      riskType: true,
      observation: true,
      recommendation: true,
      actionPlanDays: true,
      actionPlanItems: true,
      displayOrder: true,
    },
    orderBy: { displayOrder: 'asc' },
  },
} as const;

type RawAdminQuestion = Prisma.QuestionGetPayload<{ select: typeof adminQuestionSelect }>;

const toAdminQuestion = (question: RawAdminQuestion): AdminQuestionResponse => ({
  id: question.id,
  pillarId: question.pillarId,
  pillarCode: question.pillar.code,
  questionCode: question.questionCode,
  questionText: question.questionText,
  phase: question.phase,
  businessSize: question.businessSize,
  isPhase1Featured: question.isPhase1Featured,
  hasKnockoutOption: question.hasKnockoutOption,
  isKnockout: question.isKnockout,
  showOnPhase1: question.showOnPhase1,
  isActive: question.isActive,
  displayOrder: question.displayOrder,
  options: question.options.map(
    (option): AdminOptionResponse => ({
      id: option.id,
      optionLabel: option.optionLabel,
      optionText: option.optionText,
      score: option.score,
      riskType: option.riskType,
      observation: option.observation,
      recommendation: option.recommendation,
      actionPlanDays: option.actionPlanDays,
      actionPlanItems: option.actionPlanItems,
      displayOrder: option.displayOrder,
    })
  ),
});

/**
 * Computes the next "<pillarCode>-NNN" question code for a pillar by finding the
 * highest existing numeric suffix and incrementing. Runs inside the create
 * transaction so concurrent creates can't collide on the same sequence; the
 * unique constraint on questionCode is the final backstop.
 */
async function nextQuestionCode(
  tx: Prisma.TransactionClient,
  pillarId: string,
  pillarCode: string
): Promise<string> {
  const existing = await tx.question.findMany({
    where: { pillarId },
    select: { questionCode: true },
  });

  let maxSeq = 0;
  const prefix = `${pillarCode}-`;
  for (const { questionCode } of existing) {
    if (!questionCode.startsWith(prefix)) continue;
    const seq = Number.parseInt(questionCode.slice(prefix.length), 10);
    if (Number.isFinite(seq) && seq > maxSeq) maxSeq = seq;
  }

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`;
}

/**
 * Admin pillar list — unlike the public getAllPillarsService, this includes
 * weight, isActive (inactive pillars too), and question counts so the
 * scoring page can compute effective % shares and warn on pillars that
 * have no active questions.
 */
export async function listAdminPillarsService(): Promise<AdminPillarListResponse> {
  const pillars = await prisma.pillar.findMany({
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      weight: true,
      displayOrder: true,
      isActive: true,
      questions: { select: { isActive: true, phase: true, businessSize: true } },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return {
    message: 'Pillars fetched successfully',
    pillars: pillars.map((pillar) => {
      const active = pillar.questions.filter((q) => q.isActive);

      // Counts split by phase AND business size — this is what a real session
      // actually delivers per pillar. The legacy unfiltered activeQuestionCount
      // summed every phase × every business size (e.g. 16) which over-reported
      // both the Phase 2A and Phase 2B columns.
      const countBy = (phase: Phase, businessSize: BusinessSize) =>
        active.filter((q) => q.phase === phase && q.businessSize === businessSize).length;

      return {
        id: pillar.id,
        code: pillar.code,
        name: pillar.name,
        description: pillar.description,
        weight: Number(pillar.weight),
        displayOrder: pillar.displayOrder,
        isActive: pillar.isActive,
        activeQuestionCount: active.length,
        totalQuestionCount: pillar.questions.length,
        counts: {
          phase2a: {
            SMALL: countBy(Phase.PHASE2A, BusinessSize.SMALL),
            MEDIUM: countBy(Phase.PHASE2A, BusinessSize.MEDIUM),
          },
          phase2b: {
            SMALL: countBy(Phase.PHASE2B, BusinessSize.SMALL),
            MEDIUM: countBy(Phase.PHASE2B, BusinessSize.MEDIUM),
          },
        },
      };
    }),
  };
}

/**
 * Bulk weight save — the scoring page's single Save button. All weights are
 * validated against existing pillars and written in one transaction so the
 * save is atomic: either every pillar gets its new weight or none do.
 * Weight changes only affect future submissions (scoring reads Pillar.weight
 * at submit time and persists the computed result).
 */
export async function savePillarWeightsService(
  input: SavePillarWeightsInput
): Promise<AdminPillarListResponse> {
  await prisma.$transaction(async (tx) => {
    const pillars = await tx.pillar.findMany({
      where: { id: { in: input.weights.map((w) => w.pillarId) } },
      select: { id: true },
    });
    const knownIds = new Set(pillars.map((p) => p.id));
    const missing = input.weights.find((w) => !knownIds.has(w.pillarId));
    if (missing) {
      throw new AppError(`Pillar not found: ${missing.pillarId}`, NOT_FOUND);
    }

    await Promise.all(
      input.weights.map((w) =>
        tx.pillar.update({
          where: { id: w.pillarId },
          data: { weight: new Prisma.Decimal(w.weight.toFixed(2)) },
        })
      )
    );
  });

  const result = await listAdminPillarsService();
  return { ...result, message: 'Pillar weights saved successfully' };
}

/**
 * Edit a pillar's display copy (name / description). The description prints
 * under the pillar title on every pillar page of the report — it used to be a
 * hardcoded map in pdf.service.ts, so changing it needed a deploy.
 */
export async function updatePillarCopyService(
  pillarId: string,
  input: UpdatePillarCopyInput
): Promise<AdminPillarListResponse> {
  if (input.name === undefined && input.description === undefined) {
    throw new AppError('Provide a name or description to update', UNPROCESSABLE_CONTENT);
  }

  const pillar = await prisma.pillar.findUnique({
    where: { id: pillarId },
    select: { id: true },
  });
  if (!pillar) {
    throw new AppError(`Pillar not found: ${pillarId}`, NOT_FOUND);
  }

  await prisma.pillar.update({
    where: { id: pillarId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    },
  });

  const result = await listAdminPillarsService();
  return { ...result, message: 'Pillar copy saved successfully' };
}

export async function listAdminQuestionsService(
  query: ListAdminQuestionsQuery
): Promise<AdminQuestionListResponse> {
  const where: Prisma.QuestionWhereInput = {
    ...(query.includeInactive ? {} : { isActive: true }),
    ...(query.pillarId ? { pillarId: query.pillarId } : {}),
    ...(query.phase ? { phase: query.phase } : {}),
    ...(query.businessSize ? { businessSize: query.businessSize } : {}),
    ...(query.isKnockout !== undefined ? { isKnockout: query.isKnockout } : {}),
    ...(query.search
      ? {
          OR: [
            { questionText: { contains: query.search, mode: 'insensitive' } },
            { questionCode: { contains: query.search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, questions] = await Promise.all([
    prisma.question.count({ where }),
    prisma.question.findMany({
      where,
      select: adminQuestionSelect,
      orderBy: [{ pillar: { displayOrder: 'asc' } }, { displayOrder: 'asc' }],
    }),
  ]);

  return {
    message: 'Questions fetched successfully',
    total,
    questions: questions.map(toAdminQuestion),
  };
}

export async function getAdminQuestionService(
  questionId: string
): Promise<AdminQuestionDetailResponse> {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    select: adminQuestionSelect,
  });

  if (!question) throw new AppError('Question not found', NOT_FOUND);

  return {
    message: 'Question fetched successfully',
    question: toAdminQuestion(question),
  };
}

export async function createQuestionService(
  input: CreateQuestionInput
): Promise<AdminQuestionDetailResponse> {
  const maxScore = input.options.reduce((max, option) => Math.max(max, option.score), 0);
  const isKnockout = input.isKnockout ?? false;
  const hasKnockoutOption = isKnockout && input.options.some((option) => option.score === 0);

  const question = await prisma.$transaction(async (tx) => {
    const pillar = await tx.pillar.findUnique({
      where: { id: input.pillarId },
      select: { id: true, code: true, isActive: true },
    });
    if (!pillar) throw new AppError('Pillar not found', NOT_FOUND);

    // Next display order = append to the end of this pillar's questions.
    const last = await tx.question.findFirst({
      where: { pillarId: pillar.id },
      orderBy: { displayOrder: 'desc' },
      select: { displayOrder: true },
    });
    const displayOrder = (last?.displayOrder ?? 0) + 1;
    const questionCode = await nextQuestionCode(tx, pillar.id, pillar.code);

    return tx.question.create({
      data: {
        pillarId: pillar.id,
        questionCode,
        questionText: input.questionText,
        businessSize: input.businessSize,
        phase: input.phase,
        isPhase1Featured: input.isPhase1Featured,
        isKnockout,
        showOnPhase1: input.showOnPhase1 ?? false,
        hasKnockoutOption,
        displayOrder,
        options: {
          create: input.options.map((option, index) => ({
            optionLabel: OPTION_LABELS[index],
            optionText: option.optionText,
            score: option.score,
            riskType: deriveRiskType(option.score, maxScore, isKnockout),
            observation: option.observation,
            // Phase 2B options carry an action plan instead of a recommendation;
            // the column is non-null so it defaults to '' when omitted.
            recommendation: option.recommendation ?? '',
            actionPlanDays: option.actionPlanDays ?? null,
            actionPlanItems: option.actionPlanItems ?? [],
            displayOrder: index + 1,
          })),
        },
      },
      select: adminQuestionSelect,
    });
  });

  return {
    message: 'Question created successfully',
    question: toAdminQuestion(question),
  };
}

export async function updateQuestionService(
  questionId: string,
  input: UpdateQuestionInput
): Promise<AdminQuestionDetailResponse> {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, isKnockout: true, showOnPhase1: true, options: { select: { score: true } } },
  });
  if (!existing) throw new AppError('Question not found', NOT_FOUND);

  // Compute resolved states
  const nextIsKnockout = input.isKnockout !== undefined ? input.isKnockout : existing.isKnockout;
  const nextShowOnPhase1 = input.showOnPhase1 !== undefined ? input.showOnPhase1 : existing.showOnPhase1;

  // Validate guards
  if (nextShowOnPhase1 && !nextIsKnockout) {
    throw new AppError('showOnPhase1 can only be true if isKnockout is true', CONFLICT);
  }

  if (nextIsKnockout) {
    const zeroScoreCount = existing.options.filter((o) => o.score === 0).length;
    if (zeroScoreCount !== 1) {
      throw new AppError('A knockout question must have exactly one option with a score of 0', CONFLICT);
    }
  }

  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(input.questionText !== undefined ? { questionText: input.questionText } : {}),
      ...(input.phase !== undefined ? { phase: input.phase } : {}),
      ...(input.businessSize !== undefined ? { businessSize: input.businessSize } : {}),
      ...(input.isPhase1Featured !== undefined ? { isPhase1Featured: input.isPhase1Featured } : {}),
      ...(input.isKnockout !== undefined ? { isKnockout: input.isKnockout } : {}),
      ...(input.showOnPhase1 !== undefined ? { showOnPhase1: input.showOnPhase1 } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: adminQuestionSelect,
  });

  if (input.isKnockout !== undefined) {
    await prisma.$transaction(async (tx) => {
      await resyncOptionRiskTypes(tx, questionId);
    });
    // Re-fetch to get updated riskTypes
    const updatedQuestion = await prisma.question.findUniqueOrThrow({
      where: { id: questionId },
      select: adminQuestionSelect,
    });
    return {
      message: 'Question updated successfully',
      question: toAdminQuestion(updatedQuestion),
    };
  }

  return {
    message: 'Question updated successfully',
    question: toAdminQuestion(question),
  };
}

/**
 * Soft-delete: flips isActive to false so the question drops out of every
 * assessment (scoring filters isActive: true) and the default admin list, while
 * historical SessionResponses and reports stay intact. Restore by PATCHing
 * isActive back to true.
 */
export async function deleteQuestionService(
  questionId: string
): Promise<AdminQuestionDetailResponse> {
  const existing = await prisma.question.findUnique({
    where: { id: questionId },
    select: { id: true, isActive: true },
  });
  if (!existing) throw new AppError('Question not found', NOT_FOUND);

  const question = await prisma.question.update({
    where: { id: questionId },
    data: { isActive: false },
    select: adminQuestionSelect,
  });

  return {
    message: 'Question archived successfully',
    question: toAdminQuestion(question),
  };
}

// Re-derives riskType + hasKnockoutOption across a question's full option set
// after any option add/update/delete, since riskType is relative to the max score.
async function resyncOptionRiskTypes(
  tx: Prisma.TransactionClient,
  questionId: string
): Promise<void> {
  const question = await tx.question.findUnique({
    where: { id: questionId },
    select: { isKnockout: true },
  });
  const isKnockout = question?.isKnockout ?? false;

  const options = await tx.questionOption.findMany({
    where: { questionId },
    select: { id: true, score: true },
  });
  const maxScore = options.reduce((max, option) => Math.max(max, option.score), 0);

  await Promise.all(
    options.map((option) =>
      tx.questionOption.update({
        where: { id: option.id },
        data: { riskType: deriveRiskType(option.score, maxScore, isKnockout) },
      })
    )
  );

  await tx.question.update({
    where: { id: questionId },
    data: { hasKnockoutOption: isKnockout && options.some((option) => option.score === 0) },
  });
}

export async function addOptionService(
  questionId: string,
  input: AddOptionInput
): Promise<AdminQuestionDetailResponse> {
  const question = await prisma.$transaction(async (tx) => {
    const existing = await tx.question.findUnique({
      where: { id: questionId },
      select: { id: true, isKnockout: true, options: { select: { displayOrder: true, score: true } } },
    });
    if (!existing) throw new AppError('Question not found', NOT_FOUND);
    if (existing.options.length >= OPTION_LABELS.length) {
      throw new AppError(`A question can have at most ${OPTION_LABELS.length} options`, CONFLICT);
    }

    if (existing.isKnockout) {
      const currentZeros = existing.options.filter((o) => o.score === 0).length;
      const newIsZero = input.score === 0;
      const totalZeros = currentZeros + (newIsZero ? 1 : 0);
      if (totalZeros !== 1) {
        throw new AppError('A knockout question must have exactly one option with a score of 0', CONFLICT);
      }
    }

    const nextOrder =
      existing.options.reduce((max, option) => Math.max(max, option.displayOrder), 0) + 1;

    await tx.questionOption.create({
      data: {
        questionId,
        optionLabel: OPTION_LABELS[existing.options.length],
        optionText: input.optionText,
        score: input.score,
        riskType: deriveRiskType(input.score, input.score, existing.isKnockout), // resynced below
        observation: input.observation,
        recommendation: input.recommendation ?? '',
        actionPlanDays: input.actionPlanDays ?? null,
        actionPlanItems: input.actionPlanItems ?? [],
        displayOrder: nextOrder,
      },
    });

    await resyncOptionRiskTypes(tx, questionId);

    return tx.question.findUniqueOrThrow({
      where: { id: questionId },
      select: adminQuestionSelect,
    });
  });

  return {
    message: 'Option added successfully',
    question: toAdminQuestion(question),
  };
}

export async function updateOptionService(
  optionId: string,
  input: UpdateOptionInput
): Promise<AdminQuestionDetailResponse> {
  const question = await prisma.$transaction(async (tx) => {
    const option = await tx.questionOption.findUnique({
      where: { id: optionId },
      select: { id: true, questionId: true },
    });
    if (!option) throw new AppError('Option not found', NOT_FOUND);

    if (input.score !== undefined) {
      const parentQuestion = await tx.question.findUnique({
        where: { id: option.questionId },
        select: { isKnockout: true, options: { select: { id: true, score: true } } },
      });
      if (parentQuestion?.isKnockout) {
        const otherZeros = parentQuestion.options.filter((o) => o.id !== optionId && o.score === 0).length;
        const totalZeros = otherZeros + (input.score === 0 ? 1 : 0);
        if (totalZeros !== 1) {
          throw new AppError('A knockout question must have exactly one option with a score of 0', CONFLICT);
        }
      }
    }

    await tx.questionOption.update({
      where: { id: optionId },
      data: {
        ...(input.optionText !== undefined ? { optionText: input.optionText } : {}),
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.observation !== undefined ? { observation: input.observation } : {}),
        ...(input.recommendation !== undefined ? { recommendation: input.recommendation } : {}),
        ...(input.actionPlanDays !== undefined ? { actionPlanDays: input.actionPlanDays } : {}),
        ...(input.actionPlanItems !== undefined ? { actionPlanItems: input.actionPlanItems } : {}),
      },
    });

    // Score may have changed, so riskTypes for the whole question must be redrawn.
    if (input.score !== undefined) await resyncOptionRiskTypes(tx, option.questionId);

    return tx.question.findUniqueOrThrow({
      where: { id: option.questionId },
      select: adminQuestionSelect,
    });
  });

  return {
    message: 'Option updated successfully',
    question: toAdminQuestion(question),
  };
}

export async function deleteOptionService(optionId: string): Promise<AdminQuestionDetailResponse> {
  const question = await prisma.$transaction(async (tx) => {
    const option = await tx.questionOption.findUnique({
      where: { id: optionId },
      select: {
        id: true,
        questionId: true,
        score: true,
        _count: { select: { responses: true } },
      },
    });
    if (!option) throw new AppError('Option not found', NOT_FOUND);

    // A chosen option is referenced by SessionResponse rows; removing it would
    // orphan historical answers. Block the hard delete in that case.
    if (option._count.responses > 0) {
      throw new AppError(
        'This option has already been selected in assessments and cannot be deleted. Edit its text instead.',
        CONFLICT
      );
    }

    const remaining = await tx.questionOption.findMany({
      where: { questionId: option.questionId },
      select: { id: true, score: true },
    });
    if (remaining.length <= 2) {
      throw new AppError('A question must keep at least 2 options', CONFLICT);
    }

    const parentQuestion = await tx.question.findUnique({
      where: { id: option.questionId },
      select: { isKnockout: true },
    });
    if (parentQuestion?.isKnockout) {
      const remainingZeros = remaining.filter((o) => o.id !== optionId && o.score === 0).length;
      if (remainingZeros !== 1) {
        throw new AppError('A knockout question must have exactly one option with a score of 0', CONFLICT);
      }
    }

    await tx.questionOption.delete({ where: { id: optionId } });
    await resyncOptionRiskTypes(tx, option.questionId);

    return tx.question.findUniqueOrThrow({
      where: { id: option.questionId },
      select: adminQuestionSelect,
    });
  });

  return {
    message: 'Option deleted successfully',
    question: toAdminQuestion(question),
  };
}

export async function listScoreLabelsService() {
  const scoreLabels = await prisma.scoreLabel.findMany({
    orderBy: { minScore: 'asc' },
  });
  return {
    message: 'Score labels fetched successfully',
    scoreLabels,
  };
}

export async function createScoreLabelService(data: {
  minScore: number;
  maxScore: number;
  label: string;
  description: string;
}) {
  const scoreLabel = await prisma.scoreLabel.create({
    data,
  });
  return {
    message: 'Score label created successfully',
    scoreLabel,
  };
}

export async function updateScoreLabelService(
  id: string,
  data: {
    minScore?: number;
    maxScore?: number;
    label?: string;
    description?: string;
  }
) {
  const scoreLabel = await prisma.scoreLabel.update({
    where: { id },
    data,
  });
  return {
    message: 'Score label updated successfully',
    scoreLabel,
  };
}

export async function deleteScoreLabelService(id: string) {
  await prisma.scoreLabel.delete({
    where: { id },
  });
  return {
    message: 'Score label deleted successfully',
  };
}
