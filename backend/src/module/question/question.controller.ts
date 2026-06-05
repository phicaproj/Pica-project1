import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, UNAUTHORIZED } from '../../service/shared/http';
import {
  getPhase1QuestionsService,
  getPhase2AQuestionsService,
  getPhase2BQuestionsService,
  getAllPillarsService,
} from './question.service';
import { businessSizeQuerySchema, phase2aQuerySchema, phase2bQuerySchema } from './question.types';

export const getPhase1Questions = asyncHandler(async (req: Request, res: Response) => {
  const { businessSize } = businessSizeQuerySchema.parse(req.query);

  const result = await getPhase1QuestionsService(businessSize);

  return res.status(OK).json(result);
});

export const getPhase2AQuestions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('Authentication required', UNAUTHORIZED);
  }

  const { sessionId } = phase2aQuerySchema.parse(req.query);

  const result = await getPhase2AQuestionsService(sessionId, req.user.id);

  return res.status(OK).json(result);
});

export const getPhase2BQuestions = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('Authentication required', UNAUTHORIZED);
  }

  const { pillarId } = phase2bQuerySchema.parse(req.query);

  const result = await getPhase2BQuestionsService(pillarId);

  return res.status(OK).json(result);
});

export const getAllPillars = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('Authentication required', UNAUTHORIZED);
  }

  const result = await getAllPillarsService();

  return res.status(OK).json(result);
});
