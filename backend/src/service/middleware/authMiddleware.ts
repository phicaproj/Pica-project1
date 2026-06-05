import { Request, Response, NextFunction } from 'express'
import {
	verifyAccessToken,
	verifyOtpToken,
	type TokenPayload,
} from '../shared/generateToken'

export interface OtpPayload {
	email: string
	code: string
}

declare module 'express-serve-static-core' {
	interface Request {
		user?: TokenPayload
		token?: OtpPayload
	}
}

export const authenticate = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization

	if (!authHeader?.startsWith('Bearer ')) {
		return res
			.status(401)
			.json({ message: 'Missing or malformed Authorization header' })
	}

	const token = authHeader.split(' ')[1]

	try {
		const payload = verifyAccessToken(token)
		req.user = payload
		next()
	} catch (err) {
		return res.status(401).json({ message: 'Invalid or expired token' })
	}
}

// Soft auth — populates req.user if a valid Bearer token is present, but does not
// reject anonymous requests. Used on routes shared between guest (Phase 1) and
// authenticated (Phase 2A) flows; the service layer enforces ownership where required.
export const softAuthenticate = (
	req: Request,
	_res: Response,
	next: NextFunction,
) => {
	const authHeader = req.headers.authorization
	if (!authHeader?.startsWith('Bearer ')) {
		return next()
	}
	const token = authHeader.split(' ')[1]
	try {
		req.user = verifyAccessToken(token)
	} catch {
		// silently ignore — the route is also reachable anonymously
	}
	return next()
}

// OTP auth
export const otpAuth = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization

	if (!authHeader?.startsWith('Bearer ')) {
		return res
			.status(401)
			.json({ message: 'Missing or malformed Authorization header' })
	}

	const token = authHeader.split(' ')[1]

	try {
		const payload = verifyOtpToken(token) as OtpPayload

		req.token = payload

		next()
	} catch (err) {
		return res.status(401).json({ message: 'Invalid or expired OTP token' })
	}
}
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
	if (req.user?.role !== 'ADMIN') {
		return res.status(403).json({ message: 'Admin privileges required' })
	}
	next()
}

export const isUser = (req: Request, res: Response, next: NextFunction) => {
	if (!req.user) {
		return res.status(401).json({ message: 'User not authenticated' })
	}
	next()
}
