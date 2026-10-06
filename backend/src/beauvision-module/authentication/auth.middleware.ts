import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../../service/shared/generateToken';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  let payload: TokenPayload;
  try {
    payload = verifyAccessToken(token);
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  req.user = payload;
  next();
};
