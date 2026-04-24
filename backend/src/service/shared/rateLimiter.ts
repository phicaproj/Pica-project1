import rateLimit from 'express-rate-limit'

export const GlobalLimiter = rateLimit({
	windowMs: 10 * 60 * 1000,
	max: 5000,
})

export const authLimiter = rateLimit({
	windowMs: 5 * 60 * 1000,
	max: 20,
})
