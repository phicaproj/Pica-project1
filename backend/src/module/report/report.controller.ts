import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import { OK } from '../../service/shared/http';
import { reportFiltersQuery, reportSessionsQuery } from './report.types';
import {
  getReportBreakdownsService,
  getReportFunnelService,
  getReportKpisService,
  getReportProblemAreasService,
  getReportSessionsService,
} from './report.service';
import { streamReportExcelService } from './report.export.service';

export const getReportKpis = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersQuery.parse(req.query);
  const result = await getReportKpisService(filters);
  return res.status(OK).json(result);
});

export const getReportFunnel = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersQuery.parse(req.query);
  const result = await getReportFunnelService(filters);
  return res.status(OK).json(result);
});

export const getReportProblemAreas = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersQuery.parse(req.query);
  const result = await getReportProblemAreasService(filters);
  return res.status(OK).json(result);
});

export const getReportBreakdowns = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersQuery.parse(req.query);
  const result = await getReportBreakdownsService(filters);
  return res.status(OK).json(result);
});

export const getReportSessions = asyncHandler(async (req: Request, res: Response) => {
  const query = reportSessionsQuery.parse(req.query);
  const result = await getReportSessionsService(query);
  return res.status(OK).json(result);
});

export const exportReportExcel = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersQuery.parse(req.query);

  const today = new Date().toISOString().slice(0, 10);
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader('Content-Disposition', `attachment; filename="pica-report-${today}.xlsx"`);

  // Streams the workbook straight into the response; headers are already sent
  // by the time rows flow, so errors past this point can't become a JSON 500 —
  // they abort the download instead.
  await streamReportExcelService(filters, res);
});
