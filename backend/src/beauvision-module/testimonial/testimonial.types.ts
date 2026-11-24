import { z } from 'zod';

const booleanLike = z
  .union([z.boolean(), z.string()])
  .transform((val) => (typeof val === 'boolean' ? val : val === 'true'));

export const CreateTestimonialSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  role: z.string().trim().max(120).optional(),
  company: z.string().trim().max(120).optional(),
  quote: z.string().trim().min(1, 'Quote is required'),
  // Optional — a link may be supplied directly, otherwise the controller sets
  // this from an uploaded avatar.
  avatarUrl: z.string().url('Must be a valid URL').optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: booleanLike.default(true),
});

export const UpdateTestimonialSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').optional(),
    role: z.string().trim().max(120).optional(),
    company: z.string().trim().max(120).optional(),
    quote: z.string().trim().min(1, 'Quote is required').optional(),
    avatarUrl: z.string().url('Must be a valid URL').optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: booleanLike.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type CreateTestimonialInput = z.infer<typeof CreateTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof UpdateTestimonialSchema>;
