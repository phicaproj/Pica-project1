import { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';

export interface RequestContext {
  id: string;
  startTime: number;
}

declare global {
  namespace Express {
    interface Request {
      id: string;
      startTime: number;
    }
  }
}

export const requestContextMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const requestId = req.header('x-request-id') || crypto.randomUUID();

  req.id = requestId;
  req.startTime = Date.now();

  res.setHeader('x-request-id', requestId);

  next();
};
