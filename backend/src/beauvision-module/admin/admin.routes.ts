import { Router } from 'express';
import * as AdminController from './admin.controller';
import { authenticate } from '../authentication/auth.middleware';

const adminRouter = Router();

// Public routes
adminRouter.post('/login', AdminController.loginAdmin);
adminRouter.post('/forgot-password', AdminController.forgotPassword);
adminRouter.post('/reset-password', AdminController.resetPassword);

// Protected routes
adminRouter.post('/register', authenticate, AdminController.createAdmin);
adminRouter.get('/', authenticate, AdminController.getAdmins);
adminRouter.delete('/:id', authenticate, AdminController.deleteAdmin);

adminRouter.get('/profile', authenticate, AdminController.getProfile);
adminRouter.patch('/profile', authenticate, AdminController.updateProfile);
adminRouter.patch('/change-password', authenticate, AdminController.changePassword);

export default adminRouter;
