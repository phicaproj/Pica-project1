import { Router } from 'express';
import { authenticate } from '../../service/middleware/authMiddleware';
import {
  getPhase1Questions,
  getPhase2AQuestions,
  getPhase2BQuestions,
  getAllPillars,
} from './question.controller';

const questionRouter = Router();

questionRouter.get('/phase1', getPhase1Questions);
questionRouter.get('/phase2a', authenticate, getPhase2AQuestions);
questionRouter.get('/phase2b', authenticate, getPhase2BQuestions);
questionRouter.get('/pillars', authenticate, getAllPillars);

export default questionRouter;
