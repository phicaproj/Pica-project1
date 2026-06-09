import { Prisma, RiskType } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { CONFLICT, NOT_FOUND } from '../../service/shared/http';
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
const deriveRiskType = (score: number, maxScore: number): RiskType => {
  if (score === 0) return RiskType.KNOCKOUT;
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
      questions: { select: { isActive: true } },
    },
    orderBy: { displayOrder: 'asc' },
  });

  return {
    message: 'Pillars fetched successfully',
    pillars: pillars.map((pillar) => ({
      id: pillar.id,
      code: pillar.code,
      name: pillar.name,
      description: pillar.description,
      weight: Number(pillar.weight),
      displayOrder: pillar.displayOrder,
      isActive: pillar.isActive,
      activeQuestionCount: pillar.questions.filter((q) => q.isActive).length,
      totalQuestionCount: pillar.questions.length,
    })),
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

export async function listAdminQuestionsService(
  query: ListAdminQuestionsQuery
): Promise<AdminQuestionListResponse> {
  const where: Prisma.QuestionWhereInput = {
    ...(query.includeInactive ? {} : { isActive: true }),
    ...(query.pillarId ? { pillarId: query.pillarId } : {}),
    ...(query.phase ? { phase: query.phase } : {}),
    ...(query.businessSize ? { businessSize: query.businessSize } : {}),
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
  const hasKnockoutOption = input.options.some((option) => option.score === 0);

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
        hasKnockoutOption,
        displayOrder,
        options: {
          create: input.options.map((option, index) => ({
            optionLabel: OPTION_LABELS[index],
            optionText: option.optionText,
            score: option.score,
            riskType: deriveRiskType(option.score, maxScore),
            observation: option.observation,
            recommendation: option.recommendation,
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
    select: { id: true },
  });
  if (!existing) throw new AppError('Question not found', NOT_FOUND);

  const question = await prisma.question.update({
    where: { id: questionId },
    data: {
      ...(input.questionText !== undefined ? { questionText: input.questionText } : {}),
      ...(input.phase !== undefined ? { phase: input.phase } : {}),
      ...(input.businessSize !== undefined ? { businessSize: input.businessSize } : {}),
      ...(input.isPhase1Featured !== undefined ? { isPhase1Featured: input.isPhase1Featured } : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    },
    select: adminQuestionSelect,
  });

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
  const options = await tx.questionOption.findMany({
    where: { questionId },
    select: { id: true, score: true },
  });
  const maxScore = options.reduce((max, option) => Math.max(max, option.score), 0);

  await Promise.all(
    options.map((option) =>
      tx.questionOption.update({
        where: { id: option.id },
        data: { riskType: deriveRiskType(option.score, maxScore) },
      })
    )
  );

  await tx.question.update({
    where: { id: questionId },
    data: { hasKnockoutOption: options.some((option) => option.score === 0) },
  });
}

export async function addOptionService(
  questionId: string,
  input: AddOptionInput
): Promise<AdminQuestionDetailResponse> {
  const question = await prisma.$transaction(async (tx) => {
    const existing = await tx.question.findUnique({
      where: { id: questionId },
      select: { id: true, options: { select: { displayOrder: true } } },
    });
    if (!existing) throw new AppError('Question not found', NOT_FOUND);
    if (existing.options.length >= OPTION_LABELS.length) {
      throw new AppError(`A question can have at most ${OPTION_LABELS.length} options`, CONFLICT);
    }

    const nextOrder =
      existing.options.reduce((max, option) => Math.max(max, option.displayOrder), 0) + 1;

    await tx.questionOption.create({
      data: {
        questionId,
        optionLabel: OPTION_LABELS[existing.options.length],
        optionText: input.optionText,
        score: input.score,
        riskType: deriveRiskType(input.score, input.score), // resynced below
        observation: input.observation,
        recommendation: input.recommendation,
        displayOrder: nextOrder,
      },
    });

    await resyncOptionRiskTypes(tx, questionId);

    return tx.question.findUniqueOrThrow({ where: { id: questionId }, select: adminQuestionSelect });
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

    await tx.questionOption.update({
      where: { id: optionId },
      data: {
        ...(input.optionText !== undefined ? { optionText: input.optionText } : {}),
        ...(input.score !== undefined ? { score: input.score } : {}),
        ...(input.observation !== undefined ? { observation: input.observation } : {}),
        ...(input.recommendation !== undefined ? { recommendation: input.recommendation } : {}),
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

export async function deleteOptionService(
  optionId: string
): Promise<AdminQuestionDetailResponse> {
  const question = await prisma.$transaction(async (tx) => {
    const option = await tx.questionOption.findUnique({
      where: { id: optionId },
      select: {
        id: true,
        questionId: true,
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

    const remaining = await tx.questionOption.count({ where: { questionId: option.questionId } });
    if (remaining <= 2) {
      throw new AppError('A question must keep at least 2 options', CONFLICT);
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
