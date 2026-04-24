import type { ErrorRequestHandler, Response } from 'express'
import { BAD_REQUEST, INTERNAL_SERVER_ERROR } from '../shared/http'
import AppError from '../shared/appError'
import { ZodError } from 'zod'

const handleZodError = (res: Response, error: ZodError) => {
	const message = error.issues
		.map((issue) => {
			const field = issue.path.length > 0 ? issue.path.join('.') : 'Request'
			return `${field}: ${issue.message}`
		})
		.join('; ')

	return res.status(BAD_REQUEST).json({
		message: message || 'Validation error',
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
