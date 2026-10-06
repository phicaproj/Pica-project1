import { z } from 'zod';

export const InitPaymentSchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
  email: z.string().email('Invalid email format').toLowerCase().trim(),
  name: z.string().min(2, 'Name is required').trim(),
});

export type IPaymentCreate = z.infer<typeof InitPaymentSchema>;
