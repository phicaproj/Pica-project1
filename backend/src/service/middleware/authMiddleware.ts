import { Request, Response, NextFunction } from 'express';
import { UserStatus } from '@prisma/client';
import prisma from '../../Config/db';
import {
  verifyAccessToken,
  verifyOtpToken,
  type OtpTokenPayload,
  type TokenPayload,
} from '../shared/generateToken';

declare module 'express-serve-static-core' {
  interface Request {
    user?: TokenPayload;
    token?: OtpTokenPayload;
  }
}

/**
 * Loads the account's current status from the DB. JWTs are stateless — a
 * token stays cryptographically valid until it expires — so suspension is
 * enforced here, on every authenticated request: the moment an admin flips a
 * user to DISABLED, their next request is rejected even if their token is
 * still live. Returns null when the account no longer exists.
 */
async function getAccountStatus(userId: string): Promise<UserStatus | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  return user?.status ?? null;
}

async function getAccountStatusAndPermissions(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      status: true,
      permissions: true,
      department: true,
      adminRole: {
        select: {
          name: true,
          permissions: true,
        },
      },
    },
  });
  return user;
}

/**
 * Resolves an admin's effective access. Per-person fields on the User are the
 * source of truth; the legacy adminRole relation is only a fallback for admins
 * onboarded before per-person permissions existed. An admin is "super" when
 * their department is SUPER ADMIN (new model) or their legacy role is named
 * SUPER ADMIN.
 */
export function resolveAdminAccess(dbUser: {
  permissions?: string[] | null;
  department?: string | null;
  adminRole?: { name: string; permissions: string[] } | null;
}): { isSuper: boolean; permissions: string[]; label: string | undefined } {
  const isSuper = dbUser.department === 'SUPER ADMIN' || dbUser.adminRole?.name === 'SUPER ADMIN';
  const permissions =
    dbUser.permissions && dbUser.permissions.length > 0
      ? dbUser.permissions
      : dbUser.adminRole?.permissions || [];
  const label = isSuper
    ? 'SUPER ADMIN'
    : (dbUser.department ?? dbUser.adminRole?.name ?? undefined);
  return { isSuper, permissions, label };
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

  try {
    const dbUser = await getAccountStatusAndPermissions(payload.id);
    if (dbUser === null) {
      return res.status(401).json({ message: 'Account no longer exists' });
    }
    if (dbUser.status === UserStatus.DISABLED) {
      return res.status(403).json({ message: 'Your account has been suspended. Contact support.' });
    }

    const access = resolveAdminAccess(dbUser);
    req.user = {
      ...payload,
      adminRoleName: access.label,
      permissions: access.permissions,
    };
  } catch (err) {
    return res.status(500).json({ message: 'Could not verify account status' });
  }

  next();
};

export const hasPermission = (requiredPermission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Admin privileges required' });
    }

    if (req.user.adminRoleName === 'SUPER ADMIN') {
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

// Soft auth — populates req.user if a valid Bearer token is present, but does not
// reject anonymous requests. Used on routes shared between guest (Phase 1) and
// authenticated (Phase 2A) flows; the service layer enforces ownership where required.
// A DISABLED account is treated as anonymous: the token is ignored.
export const softAuthenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = verifyAccessToken(token);
    const status = await getAccountStatus(payload.id);
    if (status === UserStatus.ACTIVE) {
      req.user = payload;
    }
  } catch {
    // silently ignore — the route is also reachable anonymously
  }
  return next();
};

// OTP auth
export const otpAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyOtpToken(token);

    req.token = payload;

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired OTP token' });
  }
};
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin privileges required' });
  }
  next();
};

export const isUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  next();
};
