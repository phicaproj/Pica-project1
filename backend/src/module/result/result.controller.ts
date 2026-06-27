import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { NOT_FOUND, OK, UNAUTHORIZED } from '../../service/shared/http';
import { assessmentSessionParams } from '../assessment/assessment.types';
import {
  downloadResultPdfService,
  getAllCompletedResultsForUserService,
  getLatestCompletedResultForUserService,
  getResultService,
} from './result.service';

export const getResult = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = assessmentSessionParams.parse(req.params);
  const result = await getResultService(sessionId);

  return res.status(OK).json(result);
});

export const getAllMyCompletedResults = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const results = await getAllCompletedResultsForUserService(req.user.id);
  return res.status(OK).json({ results });
});

export const getMyLatestCompletedResult = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const result = await getLatestCompletedResultForUserService(req.user.id);
  if (!result) {
    throw new AppError('No completed assessment found for this user', NOT_FOUND);
  }
  return res.status(OK).json(result);
});

export const downloadResultPdf = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = assessmentSessionParams.parse(req.params);
  const theme = req.query.theme === 'dark' ? 'dark' : 'light';
  const { pdfBuffer, filename } = await downloadResultPdfService(sessionId, req.user?.id, theme);

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length', pdfBuffer.length.toString());
  return res.status(OK).end(pdfBuffer);
});
