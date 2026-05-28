import z from 'zod';

export const updateProfileSchema = z.object({
  businessName: z.string().min(3).max(100).optional(),
  phone: z.string().regex(/^\+?\d{10,15}$/, 'Phone number must be 10–15 digits').optional(),
  email: z.string().email('Invalid email address').optional(),
});

export const updateBusinessInfoSchema = z.object({
  businessName: z.string().min(3).max(100).optional(),
  industry: z.string().min(2).max(100).optional(),
  country: z.string().min(1).max(100).optional(),
  state: z.string().min(1).max(100).optional().nullable(),
  operatingYears: z.string().min(1).max(20).optional(),
  staffSize: z.string().min(1).max(50).optional(),
  annualRevenue: z.string().min(2).max(100).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateBusinessInfoInput = z.infer<typeof updateBusinessInfoSchema>;
