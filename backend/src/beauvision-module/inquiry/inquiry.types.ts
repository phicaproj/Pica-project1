import { z } from "zod";

export const createInquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().email("Invalid email"),
  companyName: z.string().trim().optional(),
  serviceRequested: z.string().trim().min(1, "Service requested is required"),
  message: z.string().trim().optional(),
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum(["PENDING", "CONTACTED", "RESOLVED"]),
});

export type IServiceInquiryCreate = z.infer<typeof createInquirySchema>;
export type IServiceInquiryUpdateStatus = z.infer<typeof updateInquiryStatusSchema>;
