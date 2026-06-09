import { Router } from 'express';
import { authenticate } from '../../service/middleware/authMiddleware';
import { authLimiter } from '../../service/shared/rateLimiter';
import {
  acceptInvite,
  forgotPassword,
  login,
  loginAdmin,
  me,
  register,
  resetPassword,
  verifyAdminOTP,
  verifyResetOtp,
} from './auth.controller';

const authRouter = Router();

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.post('/admin/login', authLimiter, loginAdmin);
authRouter.post('/admin/verify-otp', authLimiter, verifyAdminOTP);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/verify-reset-otp', authLimiter, verifyResetOtp);
authRouter.post('/reset-password', authLimiter, resetPassword);
authRouter.post('/accept-invite', authLimiter, acceptInvite);
authRouter.get('/me', authenticate, me);

export default authRouter;
