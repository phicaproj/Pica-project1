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
	if (req.user?.role !== 'Admin') {
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
