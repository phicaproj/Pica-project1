import type { ErrorRequestHandler, Response } from 'express'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../shared/http'
import AppError from '../shared/appError'
import { ZodError } from 'zod'

const handleZodError = (res: Response, error: ZodError) => {
	const issue = error.issues[0]
	const message = issue
		? `${issue.path.length > 0 ? issue.path.join('.') : 'Request'}: ${issue.message}`
		: 'Validation error'

	return res.status(BAD_REQUEST).json({
		message,
	})
}

const errorHandler: ErrorRequestHandler = (error, req, res, next) => {
	if (error instanceof ZodError) {
		return handleZodError(res, error)
	}

	if (error instanceof AppError) {
		return res.status(error.statusCode).json({
			message: error.message,
		})
	}

	if (error && typeof error === 'object' && 'name' in error) {
		const uploadError = error as { name: string; message?: string }

		if (uploadError.name === 'MulterError') {
			return res.status(BAD_REQUEST).json({
				message: uploadError.message || 'Upload failed',
			})
		}
	}

	return res.status(INTERNAL_SERVER_ERROR).json({
		message: 'Internal Server Error',
		error: error.message,
	})
}

export default errorHandler
