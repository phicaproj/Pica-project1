import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../service/middleware/authMiddleware';
import { updateProfile, updateBusinessInfo, verifyEmail, uploadAvatar } from './user.controller';

const userRouter = Router();

// Multer memory buffer configuration with a strict 2MB guard
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

userRouter.patch('/profile', authenticate, updateProfile);
userRouter.patch('/business', authenticate, updateBusinessInfo);
userRouter.post('/verify-email', authenticate, verifyEmail);
userRouter.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);

export default userRouter;
