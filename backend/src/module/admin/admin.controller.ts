import { Request, Response } from 'express';
import z from 'zod';
import asyncHandler from '../../service/shared/catchErrors';
import { OK, CREATED } from '../../service/shared/http';
import {
  listUsersQuery,
  showUserQuery,
  updateUserStatusSchema,
  userSubListQuery,
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
} from './admin.types';
import {
  getAllUsersService,
  getSessionDetailsService,
  getUserDetailsService,
  listUserPaymentsService,
  listUserSessionsService,
  updateUserStatusService,
  listRolesService,
  createRoleService,
  updateRoleService,
  deleteRoleService,
  assignRoleToAdminService,
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

export const updateUserStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showUserQuery.parse(req.params);
  const input = updateUserStatusSchema.parse(req.body);
  const result = await updateUserStatusService(id, input);
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

// ── Admin Roles & Permissions Controllers ──────────────────────────────────────

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const result = await listRolesService();
  return res.status(OK).json({ message: 'Roles fetched successfully', roles: result });
});

export const createRole = asyncHandler(async (req: Request, res: Response) => {
  const input = createRoleSchema.parse(req.body);
  const result = await createRoleService(input);
  return res.status(CREATED).json({ message: 'Role created successfully', role: result });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const input = updateRoleSchema.parse(req.body);
  const result = await updateRoleService(id, input);
  return res.status(OK).json({ message: 'Role updated successfully', role: result });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  await deleteRoleService(id);
  return res.status(OK).json({ message: 'Role deleted successfully' });
});

export const assignRoleToAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id: adminId } = showUserQuery.parse(req.params);
  const { adminRoleId } = assignRoleSchema.parse(req.body);
  const result = await assignRoleToAdminService(adminId, adminRoleId);
  return res.status(OK).json({ message: 'Role assigned successfully', user: result });
});
