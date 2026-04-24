import jwt from 'jsonwebtoken';
import {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRE,
  JWT_REFRESH_EXPIRE,
  JWT_OTP_SECRET,
  JWT_OTP_EXPIRE,
} from '../../Config/env';
import AppError from './appError';
import { BAD_REQUEST } from './http';

export interface TokenPayload {
  id: string;
  role: 'User' | 'Admin';
}
export interface OtpTokenPayload {
  email: string;
  code: string;
}

export function generateAccessToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET as jwt.Secret, {
    expiresIn: JWT_ACCESS_EXPIRE as jwt.SignOptions['expiresIn'],
  });
}
export function generateOtpToken(payload: OtpTokenPayload) {
  return jwt.sign(payload, JWT_OTP_SECRET as jwt.Secret, {
    expiresIn: JWT_OTP_EXPIRE as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(payload: TokenPayload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET as jwt.Secret, {
    expiresIn: JWT_REFRESH_EXPIRE as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET as jwt.Secret) as TokenPayload;

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyOtpToken(token: string): OtpTokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_OTP_SECRET as jwt.Secret) as OtpTokenPayload;

    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET as jwt.Secret) as TokenPayload;

    return decoded;
  } catch (error) {
    throw new AppError('Invalid or expired refresh token', BAD_REQUEST);
  }
}
