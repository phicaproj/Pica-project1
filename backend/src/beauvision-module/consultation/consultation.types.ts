import { z } from 'zod';

export const ConsultationInitSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  email: z.string().trim().email('Invalid email'),
  phone: z.string().trim().min(7, 'A valid phone number is required'),
  company: z.string().trim().optional(),
  message: z.string().trim().max(2000, 'Message is too long').optional(),
});

export const UpdateConsultationPlanSchema = z.object({
  name: z.string().trim().min(1, 'Name cannot be empty').optional(),
  description: z.string().trim().optional(),
  amount: z.coerce.number().min(100, 'Amount must be at least 100').optional(),
  durationMinutes: z.coerce.number().int().min(5).max(240).optional(),
  isActive: z.boolean().optional(),
});

export type IConsultationInit = z.infer<typeof ConsultationInitSchema>;
export type IUpdateConsultationPlan = z.infer<typeof UpdateConsultationPlanSchema>;
