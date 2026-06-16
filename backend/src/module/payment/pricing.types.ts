import { z } from 'zod';
import type { Plan } from '@prisma/client';

const planSchema = z.enum(['PHASE2A', 'PHASE2B_PILLAR']);

export const pricingIdParamSchema = z.object({
  // plan_prices.id is a TEXT primary key. New rows default to UUIDs, but the
  // seed migration generated deterministic text IDs for existing rows, so the
  // route param must not reject non-RFC UUID row IDs before Prisma can look
  // them up.
  id: z.string({ error: 'id is required' }).trim().min(1, 'id is required').max(120),
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

// Catalogue rows are always USD post-Slice 2. The wire currency at charge
// time can still be NGN (for Nigerian users), but that's a payment.service
// concern — the pricing API serves the base currency only.
export type PricingRow = {
  id: string;
  plan: Plan;
  pillarId: string | null;
  pillarCode: string | null;
  pillarName: string | null;
  price: number;
  currency: 'USD';
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
  // The base currency the catalogue is priced in (always USD post-Slice 2).
  // The FE resolves the display currency from the user's country and uses
  // `usdToNgn` to convert when rendering NGN; the value here is the same rate
  // the BE will charge against.
  currency: 'USD';
  usdToNgn: number;
  // Section F — storefront on/off toggles. The FE branches on these so the
  // user never sees a deactivated section even briefly while it tries to
  // render an empty list. When a section is off the corresponding payload
  // field is zeroed/empty so legacy callers don't crash.
  sections: {
    payPerUse: boolean;
    subscription: boolean;
  };
  phase2A: PricingRow | null;
  phase2B: PricingRow[];
};
