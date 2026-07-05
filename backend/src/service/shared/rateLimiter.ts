import rateLimit from 'express-rate-limit';

export const GlobalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 500, // lowered from 5000 (L-2)
  message: { message: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: { message: 'Too many authentication attempts, please try again later.' },
});

export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60, // H-1
  message: { message: 'Too many webhook delivery requests, please try again later.' },
});

export const assessmentStartLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // M-3
  message: { message: 'Too many assessment start attempts, please try again later.' },
});

export const paymentInitLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5, // M-4
  message: { message: 'Too many payment initialization requests, please try again later.' },
});
