import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import AppError from '../../service/shared/appError';
import { OK, UNAUTHORIZED } from '../../service/shared/http';
import { verifyWebhookSignature } from '../../service/shared/paystack.service';
import {
  initPaymentSchema,
  listPaymentsQuery,
  verifyPaymentParams,
  userPaymentHistoryQuery,
} from './payment.types';
import {
  handleWebhookService,
  initPaymentService,
  listPaymentsService,
  verifyPaymentService,
  myPaymentsHistoryService,
} from './payment.service';

export const initPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const input = initPaymentSchema.parse(req.body);
  const result = await initPaymentService(req.user.id, input);
  return res.status(OK).json(result);
});

export const verifyPayment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const { reference } = verifyPaymentParams.parse(req.params);
  const result = await verifyPaymentService(req.user.id, reference);
  return res.status(OK).json(result);
});

/**
 * Paystack webhook handler. Mounted with express.raw() upstream so
 * `req.body` is a Buffer — the HMAC must run against the raw bytes.
 */
export const handlePaymentWebhook = asyncHandler(async (req: Request, res: Response) => {
  const signature =
    typeof req.headers['x-paystack-signature'] === 'string'
      ? (req.headers['x-paystack-signature'] as string)
      : undefined;

  const rawBody: Buffer = Buffer.isBuffer(req.body)
    ? req.body
    : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));

  const signatureValid = verifyWebhookSignature(rawBody, signature);
  const parsedBody = JSON.parse(rawBody.toString('utf8'));

  const result = await handleWebhookService({
    signatureValid,
    rawBody: rawBody.toString('utf8'),
    parsedBody,
    signature,
  });

  return res.status(OK).json(result);
});

export const listPayments = asyncHandler(async (req: Request, res: Response) => {
  const query = listPaymentsQuery.parse(req.query);
  const result = await listPaymentsService(query);
  return res.status(OK).json(result);
});

export const myPaymentsHistory = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.id || req.user?.role !== 'USER') {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }
  const query = userPaymentHistoryQuery.parse(req.query);
  const result = await myPaymentsHistoryService(req.user.id, query);
  return res.status(OK).json(result);
});
