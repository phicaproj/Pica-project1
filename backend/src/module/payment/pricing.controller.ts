import { Request, Response } from 'express';
import asyncHandler from '../../service/shared/catchErrors';
import { CREATED, OK } from '../../service/shared/http';
import {
  createPricingSchema,
  listPricingQuerySchema,
  pricingIdParamSchema,
  updatePricingSchema,
} from './pricing.types';
import {
  createPricingService,
  deletePricingService,
  getPublicPricingService,
  listPricingService,
  updatePricingService,
} from './pricing.service';

export const listPricing = asyncHandler(async (req: Request, res: Response) => {
  const query = listPricingQuerySchema.parse(req.query);
  const result = await listPricingService(query);
  return res.status(OK).json(result);
});

export const getPublicPricing = asyncHandler(async (_req: Request, res: Response) => {
  const result = await getPublicPricingService();
  return res.status(OK).json(result);
});

export const createPricing = asyncHandler(async (req: Request, res: Response) => {
  const input = createPricingSchema.parse(req.body);
  const result = await createPricingService(input);
  return res.status(CREATED).json(result);
});

export const updatePricing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = pricingIdParamSchema.parse(req.params);
  const input = updatePricingSchema.parse(req.body);
  const result = await updatePricingService(id, input);
  return res.status(OK).json(result);
});

export const deletePricing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = pricingIdParamSchema.parse(req.params);
  const result = await deletePricingService(id);
  return res.status(OK).json(result);
});
