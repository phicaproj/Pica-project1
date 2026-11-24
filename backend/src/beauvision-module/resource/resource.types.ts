import { z } from 'zod';

// The 6 standard digital-resource types shown in the admin dropdown.
export const RESOURCE_CATEGORIES = [
  'Toolkit',
  'Workbook',
  'Worksheet',
  'Guides',
  'Case Studies',
  'White Paper',
] as const;

export const ResourceCategorySchema = z.enum(RESOURCE_CATEGORIES);

export const PricingTypeSchema = z.enum(['free', 'paid']);

const optionalUrl = z.string().url('Must be a valid URL').optional();

export const CreateResourceSchema = z
  .object({
    title: z.string().min(1, 'Title is required'),
    shortDescription: z.string().min(1, 'Short description is required'),
    pricingType: PricingTypeSchema.default('paid'),
    // Required only for paid resources; validated in the refinement below.
    price: z.coerce.number().min(0, 'Price must be positive').optional(),
    // Derived from the uploaded file when one is present; optional for
    // link-only (e.g. Google Drive / YouTube) resources.
    fileFormat: z.string().min(1, 'File format is required').optional(),
    coverImageUrl: optionalUrl,
    // Direct download link (optional). The controller overwrites this with the
    // R2 URL when a file is uploaded.
    fileUrl: optionalUrl,
    // External long-form video link (Google Drive, etc.).
    videoUrl: optionalUrl,
    // YouTube embed link.
    youtubeUrl: optionalUrl,
    category: ResourceCategorySchema,
    isPublished: z
      .union([z.boolean(), z.string().transform((val) => val === 'true')])
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.pricingType === 'paid' && (data.price === undefined || data.price <= 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['price'],
        message: 'Price is required for paid resources',
      });
    }
  });

export const UpdateResourceSchema = z
  .object({
    title: z.string().min(1, 'Title is required').optional(),
    shortDescription: z.string().min(1, 'Short description is required').optional(),
    pricingType: PricingTypeSchema.optional(),
    price: z.coerce.number().min(0, 'Price must be positive').optional(),
    fileFormat: z.string().min(1, 'File format is required').optional(),
    coverImageUrl: optionalUrl,
    fileUrl: optionalUrl,
    videoUrl: optionalUrl,
    youtubeUrl: optionalUrl,
    category: ResourceCategorySchema.optional(),
    isPublished: z
      .union([z.boolean(), z.string().transform((val) => val === 'true')])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type IDigitalResourceCreate = z.infer<typeof CreateResourceSchema>;
export type IDigitalResourceUpdate = z.infer<typeof UpdateResourceSchema>;
