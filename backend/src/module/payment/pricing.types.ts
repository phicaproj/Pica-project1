import { z } from 'zod';
import type { Plan } from '@prisma/client';

const planSchema = z.enum(['PHASE2A', 'PHASE2B_PILLAR']);

export const pricingIdParamSchema = z.object({
  id: z.string({ error: 'id is required' }).uuid('id must be a valid UUID'),
});

export const listPricingQuerySchema = z.object({
  plan: planSchema.optional(),
  pillarId: z.string().uuid().optional(),
});

export const createPricingSchema = z
  .object({
    plan: planSchema,
    pillarId: z.string().uuid().optional().nullable(),
    price: z.coerce.number().positive('price must be greater than 0').max(10_000_000),
  })
  .superRefine((data, ctx) => {
    if (data.plan === 'PHASE2A' && data.pillarId) {
      ctx.addIssue({
        code: 'custom',
        path: ['pillarId'],
        message: 'PHASE2A pricing must not include pillarId',
      });
    }
    if (data.plan === 'PHASE2B_PILLAR' && !data.pillarId) {
      ctx.addIssue({
        code: 'custom',
        path: ['pillarId'],
        message: 'PHASE2B_PILLAR pricing requires pillarId',
      });
    }
  });

export const updatePricingSchema = z
  .object({
    price: z.coerce.number().positive('price must be greater than 0').max(10_000_000).optional(),
    pillarId: z.string().uuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type PricingIdParam = z.infer<typeof pricingIdParamSchema>;
export type ListPricingQuery = z.infer<typeof listPricingQuerySchema>;
export type CreatePricingInput = z.infer<typeof createPricingSchema>;
export type UpdatePricingInput = z.infer<typeof updatePricingSchema>;

export type PricingRow = {
  id: string;
  plan: Plan;
  pillarId: string | null;
  pillarCode: string | null;
  pillarName: string | null;
  price: number;
  currency: 'NGN';
  createdAt: Date;
  updatedAt: Date;
};

export type ListPricingResponse = {
  message: string;
  prices: PricingRow[];
};

export type PricingDetailResponse = {
  message: string;
  price: PricingRow;
};

export type PublicPricingResponse = {
  message: string;
  currency: 'NGN';
  phase2A: PricingRow | null;
  phase2B: PricingRow[];
};
