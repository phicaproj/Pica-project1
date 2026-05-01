import { Router } from 'express';
import { authLimiter } from '../../service/shared/rateLimiter';
import {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyResetOtp,
} from './auth.controller';

const authRouter = Router();

authRouter.post('/register', authLimiter, register);
authRouter.post('/login', authLimiter, login);
authRouter.post('/forgot-password', authLimiter, forgotPassword);
authRouter.post('/verify-reset-otp', authLimiter, verifyResetOtp);
authRouter.post('/reset-password', authLimiter, resetPassword);

export default authRouter;
