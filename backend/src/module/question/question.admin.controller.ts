import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import { CREATED, OK } from '../../service/shared/http';
import {
  addOptionSchema,
  createQuestionSchema,
  idParamSchema,
  listAdminQuestionsQuerySchema,
  savedPillarWeightsSchema,
  updateOptionSchema,
  updateQuestionSchema,
  createScoreLabelSchema,
  updateScoreLabelSchema,
} from './question.types';
import {
  addOptionService,
  createQuestionService,
  deleteOptionService,
  deleteQuestionService,
  getAdminQuestionService,
  listAdminPillarsService,
  listAdminQuestionsService,
  savePillarWeightsService,
  updateOptionService,
  updateQuestionService,
  listScoreLabelsService,
  createScoreLabelService,
  updateScoreLabelService,
  deleteScoreLabelService,
} from './question.admin.service';

export const listAdminPillars = asyncHandler(async (_req: Request, res: Response) => {
  const result = await listAdminPillarsService();
  return res.status(OK).json(result);
});

export const savePillarWeights = asyncHandler(async (req: Request, res: Response) => {
  const input = savedPillarWeightsSchema.parse(req.body);
  const result = await savePillarWeightsService(input);
  return res.status(OK).json(result);
});

export const listAdminQuestions = asyncHandler(async (req: Request, res: Response) => {
  const query = listAdminQuestionsQuerySchema.parse(req.query);
  const result = await listAdminQuestionsService(query);
  return res.status(OK).json(result);
});

export const getAdminQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await getAdminQuestionService(id);
  return res.status(OK).json(result);
});

export const createQuestion = asyncHandler(async (req: Request, res: Response) => {
  const input = createQuestionSchema.parse(req.body);
  const result = await createQuestionService(input);
  return res.status(CREATED).json(result);
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateQuestionSchema.parse(req.body);
  const result = await updateQuestionService(id, input);
  return res.status(OK).json(result);
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await deleteQuestionService(id);
  return res.status(OK).json(result);
});

export const addOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = addOptionSchema.parse(req.body);
  const result = await addOptionService(id, input);
  return res.status(CREATED).json(result);
});

export const updateOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateOptionSchema.parse(req.body);
  const result = await updateOptionService(id, input);
  return res.status(OK).json(result);
});

export const deleteOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await deleteOptionService(id);
  return res.status(OK).json(result);
});

export const listScoreLabels = asyncHandler(async (_req: Request, res: Response) => {
  const result = await listScoreLabelsService();
  return res.status(OK).json(result);
});

export const createScoreLabel = asyncHandler(async (req: Request, res: Response) => {
  const input = createScoreLabelSchema.parse(req.body);
  const result = await createScoreLabelService(input);
  return res.status(CREATED).json(result);
});

export const updateScoreLabel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateScoreLabelSchema.parse(req.body);
  const result = await updateScoreLabelService(id, input);
  return res.status(OK).json(result);
});

export const deleteScoreLabel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await deleteScoreLabelService(id);
  return res.status(OK).json(result);
});
