import { Router } from 'express';
import { authenticate, softAuthenticate } from '../../service/middleware/authMiddleware';
import {
  answerAssessment,
  getMyPhase2BPillars,
  startAssessment,
  startPhase2A,
  startPhase2B,
  submitAssessment,
  getSessionResponses,
} from './assessment.controller';

const assessmentRouter = Router();

assessmentRouter.post('/start', startAssessment);
assessmentRouter.post('/phase2a/start', authenticate, startPhase2A);
assessmentRouter.post('/phase2b/start', authenticate, startPhase2B);
assessmentRouter.get('/phase2b/me', authenticate, getMyPhase2BPillars);
assessmentRouter.post('/:sessionId/answer', softAuthenticate, answerAssessment);
assessmentRouter.post('/:sessionId/submit', softAuthenticate, submitAssessment);
assessmentRouter.get('/:sessionId/responses', authenticate, getSessionResponses);

export default assessmentRouter;
