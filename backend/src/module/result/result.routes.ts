import { Router } from 'express';
import { authenticate, softAuthenticate } from '../../service/middleware/authMiddleware';
import {
  downloadResultPdf,
  getAllMyCompletedResults,
  getMyLatestCompletedResult,
  getResult,
} from './result.controller';

const resultRouter = Router();

// Must be declared before the /:sessionId catch-all.
resultRouter.get('/me/latest', authenticate, getMyLatestCompletedResult);
resultRouter.get('/me', authenticate, getAllMyCompletedResults);

// Soft auth — an unclaimed anonymous Phase-1 result stays open to anyone
// holding the sessionId, but once a session is claimed by a user the service
// enforces owner-only access (prevents cross-user session bleed).
resultRouter.get('/:sessionId', softAuthenticate, getResult);
// Soft auth — Phase 1 PDF download is open (anyone with the sessionId);
// Phase 2A download is gated inside the service on user ownership + payment.
resultRouter.get('/:sessionId/pdf', softAuthenticate, downloadResultPdf);

export default resultRouter;
