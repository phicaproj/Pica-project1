import express from 'express';
import { isAdmin, authenticate } from '../../service/middleware/authMiddleware';
import { listUsers, showUserById } from './admin.controller';

const adminRouter = express.Router();

// Admin users list — backs the admin Users table.
adminRouter.get('/users', authenticate, isAdmin, listUsers);
adminRouter.get('/users/:id', authenticate, isAdmin, showUserById);

export default adminRouter;
