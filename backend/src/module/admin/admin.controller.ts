import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import { OK } from '../../service/shared/http';
import { listUsersQuery, showUserQuery, userSubListQuery } from './admin.types';
import {
  getAllUsersService,
  getSessionDetailsService,
  getUserDetailsService,
  listUserPaymentsService,
  listUserSessionsService,
} from './admin.service';

export const listUsers = asyncHandler(async (req: Request, res: Response) => {
  const query = listUsersQuery.parse(req.query);
  const result = await getAllUsersService(query);
  return res.status(OK).json(result);
});

export const showUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showUserQuery.parse(req.params);
  const result = await getUserDetailsService(id);
  return res.status(OK).json(result);
});

export const listUserSessions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showUserQuery.parse(req.params);
  const query = userSubListQuery.parse(req.query);
  const result = await listUserSessionsService(id, query);
  return res.status(OK).json(result);
});

export const listUserPayments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showUserQuery.parse(req.params);
  const query = userSubListQuery.parse(req.query);
  const result = await listUserPaymentsService(id, query);
  return res.status(OK).json(result);
});

export const showSessionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showUserQuery.parse(req.params);
  const result = await getSessionDetailsService(id);
  return res.status(OK).json(result);
});
