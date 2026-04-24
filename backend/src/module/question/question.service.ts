import { Phase } from '@prisma/client';
import prisma from '../../Config/db';
import AppError from '../../service/shared/appError';
import { NOT_FOUND } from '../../service/shared/http';
import type { Phase1QuestionsResponse, PillarResponse, QuestionResponse } from './question.types';

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

function mapQuestions(
  questions: Array<{
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
  }>
) {
  return questions.map<QuestionResponse>((question) => ({
    id: question.id,
    questionCode: question.questionCode,
    questionText: question.questionText,
    displayOrder: question.displayOrder,
    options: question.options,
  }));
}

export async function getPhase1QuestionsService(): Promise<Phase1QuestionsResponse> {
  const pillars = await prisma.pillar.findMany({
    where: {
      phase: Phase.PHASE1,
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
          phase: Phase.PHASE1,
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
    questions: mapQuestions(pillar.questions),
  }));

  return {
    message: 'Phase 1 questions fetched successfully',
    pillars: response,
  };
}
