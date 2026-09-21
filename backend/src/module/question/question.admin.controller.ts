import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import { CREATED, OK } from '../../service/shared/http';
import { logAudit } from '../../service/shared/audit.service';
import {
  addOptionSchema,
  createQuestionSchema,
  idParamSchema,
  listAdminQuestionsQuerySchema,
  savedPillarWeightsSchema,
  updateOptionSchema,
  updatePillarCopySchema,
  updateQuestionSchema,
  createScoreLabelSchema,
  updateScoreLabelSchema,
  bulkCreateQuestionSchema,
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
  updatePillarCopyService,
  updateQuestionService,
  listScoreLabelsService,
  createScoreLabelService,
  updateScoreLabelService,
  deleteScoreLabelService,
  bulkCreateQuestionService,
} from './question.admin.service';

export const listAdminPillars = asyncHandler(async (_req: Request, res: Response) => {
  const result = await listAdminPillarsService();
  return res.status(OK).json(result);
});

export const savePillarWeights = asyncHandler(async (req: Request, res: Response) => {
  const input = savedPillarWeightsSchema.parse(req.body);
  const result = await savePillarWeightsService(input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE',
      entityType: 'PillarWeights',
      field: 'weights',
      ipAddress: req.ip,
      details: 'Updated Pillar Weights',
    });
  }
  return res.status(OK).json(result);
});

export const updatePillarCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updatePillarCopySchema.parse(req.body);
  const result = await updatePillarCopyService(id, input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE',
      entityType: 'Pillar',
      entityId: id,
      field: 'copy',
      ipAddress: req.ip,
      details: 'Updated Pillar Copy for Pillar ID ' + id,
    });
  }
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
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'CREATE',
      entityType: 'Question',
      entityId: result.question.id,
      field: 'question',
      ipAddress: req.ip,
      details: 'Created Question ' + result.question.questionCode,
    });
  }
  return res.status(CREATED).json(result);
});

export const updateQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateQuestionSchema.parse(req.body);
  const result = await updateQuestionService(id, input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE',
      entityType: 'Question',
      entityId: id,
      field: 'question',
      ipAddress: req.ip,
      details: 'Updated Question ID ' + id,
    });
  }
  return res.status(OK).json(result);
});

export const deleteQuestion = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await deleteQuestionService(id);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'DELETE',
      entityType: 'Question',
      entityId: id,
      field: 'question',
      ipAddress: req.ip,
      details: 'Deleted Question ID ' + id,
    });
  }
  return res.status(OK).json(result);
});

export const addOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = addOptionSchema.parse(req.body);
  const result = await addOptionService(id, input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'ADD_OPTION',
      entityType: 'Question',
      entityId: id,
      field: 'option',
      ipAddress: req.ip,
      details: 'Added Option to Question ID ' + id,
    });
  }
  return res.status(CREATED).json(result);
});

export const updateOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateOptionSchema.parse(req.body);
  const result = await updateOptionService(id, input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE',
      entityType: 'Option',
      entityId: id,
      field: 'option',
      ipAddress: req.ip,
      details: 'Updated Option ID ' + id,
    });
  }
  return res.status(OK).json(result);
});

export const deleteOption = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await deleteOptionService(id);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'DELETE',
      entityType: 'Option',
      entityId: id,
      field: 'option',
      ipAddress: req.ip,
      details: 'Deleted Option ID ' + id,
    });
  }
  return res.status(OK).json(result);
});

export const listScoreLabels = asyncHandler(async (_req: Request, res: Response) => {
  const result = await listScoreLabelsService();
  return res.status(OK).json(result);
});

export const createScoreLabel = asyncHandler(async (req: Request, res: Response) => {
  const input = createScoreLabelSchema.parse(req.body);
  const result = await createScoreLabelService(input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'CREATE',
      entityType: 'ScoreLabel',
      entityId: result.scoreLabel.id,
      field: 'scoreLabel',
      ipAddress: req.ip,
      details: 'Created Score Label ' + result.scoreLabel.label,
    });
  }
  return res.status(CREATED).json(result);
});

export const updateScoreLabel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const input = updateScoreLabelSchema.parse(req.body);
  const result = await updateScoreLabelService(id, input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE',
      entityType: 'ScoreLabel',
      entityId: id,
      field: 'scoreLabel',
      ipAddress: req.ip,
      details: 'Updated Score Label ID ' + id,
    });
  }
  return res.status(OK).json(result);
});

export const deleteScoreLabel = asyncHandler(async (req: Request, res: Response) => {
  const { id } = idParamSchema.parse(req.params);
  const result = await deleteScoreLabelService(id);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'DELETE',
      entityType: 'ScoreLabel',
      entityId: id,
      field: 'scoreLabel',
      ipAddress: req.ip,
      details: 'Deleted Score Label ID ' + id,
    });
  }
  return res.status(OK).json(result);
});

export const bulkCreateQuestions = asyncHandler(async (req: Request, res: Response) => {
  const input = bulkCreateQuestionSchema.parse(req.body);
  const result = await bulkCreateQuestionService(input);
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'CREATE',
      entityType: 'Question',
      entityId: input.pillarId,
      field: 'bulkQuestions',
      ipAddress: req.ip,
      details: '',
    });
  }
  return res.status(CREATED).json(result);
});
