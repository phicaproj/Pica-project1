import { z } from 'zod';

// Accept real booleans or "true"/"false" strings.
const booleanLike = z
  .union([z.boolean(), z.string()])
  .transform((val) => (typeof val === 'boolean' ? val : val === 'true'));

export const CreateFaqSchema = z.object({
  question: z.string().trim().min(1, 'Question is required'),
  answer: z.string().trim().min(1, 'Answer is required'),
  category: z.string().trim().max(60).optional(),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: booleanLike.default(true),
});

export const UpdateFaqSchema = z
  .object({
    question: z.string().trim().min(1, 'Question is required').optional(),
    answer: z.string().trim().min(1, 'Answer is required').optional(),
    category: z.string().trim().max(60).optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isActive: booleanLike.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type CreateFaqInput = z.infer<typeof CreateFaqSchema>;
export type UpdateFaqInput = z.infer<typeof UpdateFaqSchema>;
