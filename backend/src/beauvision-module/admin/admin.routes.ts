import { Router } from 'express';
import * as AdminController from './admin.controller';
import {
  authenticate,
  hasPermission,
  superAdminOnly,
} from '../authentication/auth.middleware';

const adminRouter = Router();

// Public routes
adminRouter.post('/login', AdminController.loginAdmin);
adminRouter.post('/refresh-token', AdminController.refreshAdminToken);
adminRouter.post('/forgot-password', AdminController.forgotPassword);
adminRouter.post('/reset-password', AdminController.resetPassword);
adminRouter.post('/accept-invite', AdminController.acceptInvite);

// Protected routes
adminRouter.get('/', authenticate, hasPermission('read'), AdminController.getAdmins);

// Only a super admin can add, invite, disable, or delete another admin.
adminRouter.post('/register', authenticate, superAdminOnly, AdminController.createAdmin);
adminRouter.post('/invite', authenticate, superAdminOnly, AdminController.inviteAdmin);
adminRouter.post(
  '/:id/resend-invite',
  authenticate,
  superAdminOnly,
  AdminController.resendAdminInvite
);
adminRouter.patch(
  '/:id/access',
  authenticate,
  superAdminOnly,
  AdminController.updateAdminAccess
);
adminRouter.patch(
  '/:id/status',
  authenticate,
  superAdminOnly,
  AdminController.updateAdminStatus
);
adminRouter.delete('/:id', authenticate, superAdminOnly, AdminController.deleteAdmin);

adminRouter.get('/profile', authenticate, AdminController.getProfile);
adminRouter.patch('/profile', authenticate, AdminController.updateProfile);
adminRouter.patch('/change-password', authenticate, AdminController.changePassword);

export default adminRouter;
