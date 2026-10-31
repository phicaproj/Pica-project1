import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { verifyAccessToken, type TokenPayload } from '../../service/shared/generateToken';
import { BeauvisionAdmin } from '../admin/admin.model';
import {
  BEAUVISION_PERMISSION_KEYS,
  type BeauvisionPermission,
} from '../admin/admin.types';

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

  if (!mongoose.Types.ObjectId.isValid(payload.id)) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  try {
    const admin = await BeauvisionAdmin.findById(payload.id).select(
      'role permissions status'
    );

    if (!admin) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }

    if (admin.status === 'DISABLED') {
      return res
        .status(403)
        .json({ message: 'Your account has been suspended. Contact support.' });
    }

    const isOwner = admin.role === 'OWNER';

    req.user = {
      ...payload,
      role: admin.role,
      adminRoleName: isOwner ? 'SUPER ADMIN' : admin.role,
      permissions: isOwner ? [...BEAUVISION_PERMISSION_KEYS] : admin.permissions || [],
    };
  } catch (err) {
    return res.status(500).json({ message: 'Could not verify account status' });
  }

  next();
};

export const hasPermission = (requiredPermission: BeauvisionPermission) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (req.user.role === 'OWNER') {
      return next();
    }

    const permissions = req.user.permissions || [];
    if (!permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: `Forbidden: You do not have the required permission (${requiredPermission})`,
      });
    }

    next();
  };
};

export const superAdminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  if (req.user.role !== 'OWNER') {
    return res.status(403).json({
      message: 'Forbidden: Only a super admin can perform this action',
    });
  }

  next();
};
