import { z } from 'zod';

export const CreateResourceSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  shortDescription: z.string().min(1, 'Short description is required'),
  price: z.number().min(0, 'Price must be positive'),
  fileFormat: z.string().min(1, 'File format is required'),
  coverImageUrl: z.string().url('Cover image must be a valid URL'),
  fileUrl: z.string().url('File URL must be a valid URL'),
  category: z.string().min(1, 'Category is required'),
  isPublished: z.boolean().optional(),
});

export const UpdateResourceSchema = CreateResourceSchema.partial();

export type IDigitalResourceCreate = z.infer<typeof CreateResourceSchema>;
