import { z } from 'zod';

const optionalEmail = z
  .union([z.string().trim().email('Invalid email'), z.literal('')])
  .optional();

// Accept real booleans or "true"/"false" strings without the z.coerce.boolean()
// trap (which turns the string "false" into true).
const booleanLike = z
  .union([z.boolean(), z.string()])
  .transform((val) => (typeof val === 'boolean' ? val : val === 'true'));

// Empty string / undefined become null so admin forms can clear the field.
const optionalDate = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.coerce.date().nullable()
);

export const CreateCouponSchema = z
  .object({
    // Optional — a unique code is generated when omitted.
    code: z
      .string()
      .trim()
      .min(4, 'code must be at least 4 characters')
      .max(32)
      .regex(/^[A-Za-z0-9-]+$/, 'code may only contain letters, numbers, and dashes')
      .optional(),
    description: z.string().trim().max(200).optional(),
    // Optional recipient — emailed the code on creation, but does not restrict who
    // can redeem it.
    email: optionalEmail,
    amountOff: z.coerce.number().min(0, 'amountOff cannot be negative').optional(),
    percentOff: z.coerce
      .number()
      .min(0, 'percentOff cannot be negative')
      .max(100, 'percentOff cannot exceed 100')
      .optional(),
    isActive: booleanLike.default(true),
    // Works whether or not an email is supplied — any buyer may redeem up to this
    // many times.
    maxUses: z.coerce
      .number()
      .int('maxUses must be a whole number')
      .min(1, 'maxUses must be at least 1')
      .max(100000, 'maxUses is too large')
      .default(1),
    expiresAt: optionalDate,
  })
  .refine((data) => data.amountOff !== undefined || data.percentOff !== undefined, {
    message: 'provide either amountOff or percentOff',
  })
  .refine((data) => !(data.amountOff && data.percentOff), {
    message: 'provide only one of amountOff or percentOff, not both',
  });

export const UpdateCouponSchema = z
  .object({
    description: z.string().trim().max(200).nullable().optional(),
    email: optionalEmail.nullable(),
    isActive: booleanLike.optional(),
    maxUses: z.coerce
      .number()
      .int('maxUses must be a whole number')
      .min(1, 'maxUses must be at least 1')
      .max(100000, 'maxUses is too large')
      .optional(),
    expiresAt: optionalDate.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export const ListCouponsQuerySchema = z.object({
  isActive: booleanLike.optional(),
});

// User-facing checkout validation. basePrice is the pre-discount total in major
// NGN units so the backend can quote the exact discount.
export const ValidateCouponSchema = z.object({
  code: z.string().trim().min(1, 'code is required'),
  basePrice: z.coerce.number().min(0, 'basePrice cannot be negative'),
});

export const CouponIdParamSchema = z.object({
  id: z.string().min(1, 'id is required'),
});

export type CreateCouponInput = z.infer<typeof CreateCouponSchema>;
export type UpdateCouponInput = z.infer<typeof UpdateCouponSchema>;
export type ListCouponsQuery = z.infer<typeof ListCouponsQuerySchema>;
export type ValidateCouponInput = z.infer<typeof ValidateCouponSchema>;

export type CouponResponse = {
  id: string;
  code: string;
  description: string | null;
  email: string | null;
  amountOff: number;
  percentOff: number;
  isActive: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  appliesTo: 'ALL';
  createdAt: Date;
  updatedAt: Date;
};

export type CouponPricing = {
  code: string;
  basePrice: number;
  discountAmount: number;
  finalAmount: number;
};
