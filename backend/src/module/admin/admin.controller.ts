import { Request, Response } from 'express';
import z from 'zod';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, CREATED, UNAUTHORIZED } from '../../service/shared/http';
import { logAudit } from '../../service/shared/audit.service';
import {
  listUsersQuery,
  showUserQuery,
  updateUserStatusSchema,
  userSubListQuery,
  createRoleSchema,
  updateRoleSchema,
  assignRoleSchema,
  inviteAdminSchema,
  updateAdminAccessSchema,
  updateAdminProfileSchema,
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
  inviteAdminService,
  resendAdminInviteService,
  updateAdminAccessService,
  getAdminProfileService,
  updateAdminProfileService,
  listAuditLogsService,
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
  const result = await updateUserStatusService(id, input, req.user?.id);
  
  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE_STATUS',
      entityType: 'User',
      entityId: id,
      field: 'status',
      newValue: input.status,
      ipAddress: req.ip,
    });
  }

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

  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'CREATE',
      entityType: 'AdminRole',
      entityId: result.id,
      field: 'name',
      newValue: result.name,
      ipAddress: req.ip,
    });
  }

  return res.status(CREATED).json({ message: 'Role created successfully', role: result });
});

export const updateRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  const input = updateRoleSchema.parse(req.body);
  const result = await updateRoleService(id, input);

  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE',
      entityType: 'AdminRole',
      entityId: id,
      field: 'role',
      ipAddress: req.ip,
    });
  }

  return res.status(OK).json({ message: 'Role updated successfully', role: result });
});

export const deleteRole = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: z.string().uuid() }).parse(req.params);
  await deleteRoleService(id);

  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'DELETE',
      entityType: 'AdminRole',
      entityId: id,
      field: 'role',
      ipAddress: req.ip,
    });
  }

  return res.status(OK).json({ message: 'Role deleted successfully' });
});

export const assignRoleToAdmin = asyncHandler(async (req: Request, res: Response) => {
  const { id: adminId } = showUserQuery.parse(req.params);
  const { adminRoleId } = assignRoleSchema.parse(req.body);
  const result = await assignRoleToAdminService(adminId, adminRoleId);

  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'ASSIGN_ROLE',
      entityType: 'User',
      entityId: adminId,
      field: 'adminRoleId',
      newValue: adminRoleId ?? 'null',
      ipAddress: req.ip,
    });
  }

  return res.status(OK).json({ message: 'Role assigned successfully', user: result });
});

// ── Admin Onboarding (invite staff) ─────────────────────────────────────────

export const inviteAdmin = asyncHandler(async (req: Request, res: Response) => {
  const input = inviteAdminSchema.parse(req.body);
  const result = await inviteAdminService(input);

  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'INVITE',
      entityType: 'User',
      entityId: result.admin.id,
      field: 'admin',
      ipAddress: req.ip,
    });
  }

  return res.status(CREATED).json(result);
});

// Resend an activation link to a pending (not-yet-activated) admin.
export const resendAdminInvite = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showUserQuery.parse(req.params);
  const result = await resendAdminInviteService(id);
  return res.status(OK).json(result);
});

export const updateAdminAccess = asyncHandler(async (req: Request, res: Response) => {
  const { id } = showUserQuery.parse(req.params);
  const input = updateAdminAccessSchema.parse(req.body);
  const result = await updateAdminAccessService(id, input);

  if (req.user?.id) {
    await logAudit({
      adminId: req.user.id,
      action: 'UPDATE_ACCESS',
      entityType: 'User',
      entityId: id,
      field: 'access',
      ipAddress: req.ip,
    });
  }

  return res.status(OK).json({ message: 'Admin access updated successfully', user: result });
});

// ── Admin self-service profile (personal info) ──────────────────────────────

export const getMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('Admin not authenticated', UNAUTHORIZED);
  }
  const result = await getAdminProfileService(req.user.id);
  return res.status(OK).json(result);
});

export const updateMyProfile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('Admin not authenticated', UNAUTHORIZED);
  }
  const input = updateAdminProfileSchema.parse(req.body);
  const result = await updateAdminProfileService(req.user.id, input, req.ip);
  return res.status(OK).json(result);
});

export const listAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const result = await listAuditLogsService();
  return res.status(OK).json(result);
});
