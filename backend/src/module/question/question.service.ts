import { BusinessSize, Phase, SessionStatus } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import {
  CONFLICT,
  FORBIDDEN,
  NOT_FOUND,
  UNPROCESSABLE_CONTENT,
} from '../../service/shared/http';
import type {
  AllPillarsResponse,
  Phase1QuestionsResponse,
  Phase2APillarResponse,
  Phase2AQuestionResponse,
  Phase2AQuestionsResponse,
  Phase2BQuestionsResponse,
  PillarResponse,
  QuestionResponse,
} from './question.types';

const questionSelect = {
  id: true,
  questionCode: true,
  questionText: true,
  displayOrder: true,
  options: {
    select: {
      id: true,
      optionLabel: true,
      optionText: true,
      displayOrder: true,
    },
    orderBy: {
      displayOrder: 'asc',
    },
  },
} as const;

type RawQuestion = {
  id: string;
  questionCode: string;
  questionText: string;
  displayOrder: number;
  options: Array<{
    id: string;
    optionLabel: string;
    optionText: string;
    displayOrder: number;
  }>;
};

function toQuestionResponse(question: RawQuestion): QuestionResponse {
  return {
    id: question.id,
    questionCode: question.questionCode,
    questionText: question.questionText,
    displayOrder: question.displayOrder,
    options: question.options,
  };
}

export async function getPhase1QuestionsService(
  businessSize: BusinessSize
): Promise<Phase1QuestionsResponse> {
  const pillars = await prisma.pillar.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      displayOrder: true,
      questions: {
        where: {
          businessSize,
          isPhase1Featured: true,
          isActive: true,
        },
        select: questionSelect,
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
    orderBy: {
      displayOrder: 'asc',
    },
  });

  if (pillars.length === 0) {
    throw new AppError('Phase 1 questions not found', NOT_FOUND);
  }

  const response: PillarResponse[] = pillars.map((pillar) => ({
    id: pillar.id,
    code: pillar.code,
    name: pillar.name,
    description: pillar.description,
    displayOrder: pillar.displayOrder,
    questions: pillar.questions.map(toQuestionResponse),
  }));

  return {
    message: 'Phase 1 questions fetched successfully',
    pillars: response,
  };
}

export async function getPhase2AQuestionsService(
  sessionId: string,
  authenticatedUserId: string
): Promise<Phase2AQuestionsResponse> {
  const session = await prisma.assessmentSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      userId: true,
      phase: true,
      status: true,
      businessSize: true,
      selectedQuestionIds: true,
    },
  });

  if (!session) {
    throw new AppError('Assessment session not found', NOT_FOUND);
  }

  if (session.userId !== authenticatedUserId) {
    throw new AppError('You are not authorized to access this session', FORBIDDEN);
  }

  if (session.phase !== Phase.PHASE2A) {
    throw new AppError('Session is not a Phase 2A session', CONFLICT);
  }

  if (session.status !== SessionStatus.IN_PROGRESS) {
    throw new AppError('Session is no longer editable', CONFLICT);
  }

  const snapshot = (session.selectedQuestionIds ?? []) as string[];
  if (!Array.isArray(snapshot) || snapshot.length === 0) {
    throw new AppError(
      'Phase 2A session has no question snapshot',
      UNPROCESSABLE_CONTENT
    );
  }

  const [pillars, answers] = await Promise.all([
    prisma.pillar.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        displayOrder: true,
        questions: {
          where: { id: { in: snapshot } },
          select: questionSelect,
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    }),
    prisma.sessionResponse.findMany({
      where: { sessionId, questionId: { in: snapshot } },
      select: { questionId: true, selectedOptionId: true },
    }),
  ]);

  const answerByQuestionId = new Map<string, string>();
  for (const answer of answers) {
    answerByQuestionId.set(answer.questionId, answer.selectedOptionId);
  }

  const response: Phase2APillarResponse[] = pillars.map((pillar) => ({
    id: pillar.id,
    code: pillar.code,
    name: pillar.name,
    description: pillar.description,
    displayOrder: pillar.displayOrder,
    questions: pillar.questions.map<Phase2AQuestionResponse>((question) => {
      const selectedOptionId = answerByQuestionId.get(question.id) ?? null;
      return {
        ...toQuestionResponse(question),
        answered: selectedOptionId !== null,
        selectedOptionId,
      };
    }),
  }));

  return {
    message: 'Phase 2A questions fetched successfully',
    sessionId: session.id,
    answeredCount: answers.length,
    totalCount: snapshot.length,
    pillars: response,
  };
}

/**
 * Returns every active PHASE2B question for a single pillar, ordered by
 * displayOrder. Phase 2B is per-pillar — a deep-dive session covers exactly
 * one pillar's question set, unlike Phase 2A which spans all pillars.
 *
 * Caller responsibility: authentication is enforced at the route layer;
 * ownership of the related Phase2BPillarUnlock is enforced inside
 * startPhase2BService when the user begins a session. This endpoint itself
 * is safe to expose to any authenticated user since the questions are not
 * confidential — only the answers and findings are.
 */
export async function getPhase2BQuestionsService(
  pillarId: string
): Promise<Phase2BQuestionsResponse> {
  const pillar = await prisma.pillar.findUnique({
    where: { id: pillarId },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      displayOrder: true,
      isActive: true,
    },
  });

  if (!pillar || !pillar.isActive) {
    throw new AppError('Pillar not found', NOT_FOUND);
  }

  const questions = await prisma.question.findMany({
    where: {
      pillarId: pillar.id,
      phase: Phase.PHASE2B,
      isActive: true,
    },
    select: questionSelect,
    orderBy: { displayOrder: 'asc' },
  });

  if (questions.length === 0) {
    throw new AppError(
      `No active Phase 2B questions configured for pillar ${pillar.name}.`,
      NOT_FOUND
    );
  }

  return {
    message: 'Phase 2B questions fetched successfully',
    pillar: {
      id: pillar.id,
      code: pillar.code,
      name: pillar.name,
      description: pillar.description,
      displayOrder: pillar.displayOrder,
    },
    questions: questions.map(toQuestionResponse),
  };
}

export async function getAllPillarsService(): Promise<AllPillarsResponse> {
  const pillars = await prisma.pillar.findMany({
    where: { isActive: true },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      displayOrder: true,
    },
    orderBy: { displayOrder: 'asc' },
  });

  return {
    message: 'Pillars fetched successfully',
    pillars,
  };
}
