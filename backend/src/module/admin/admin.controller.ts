import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import { OK } from '../../service/shared/http';
import { listUsersQuery, showUserQuery } from './admin.types';
import { getAllUsersService, getUserDetailsService } from './admin.service';

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
