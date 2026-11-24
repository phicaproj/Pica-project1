import { z } from 'zod';

const booleanLike = z
  .union([z.boolean(), z.string()])
  .transform((val) => (typeof val === 'boolean' ? val : val === 'true'));

const optionalDate = z.preprocess(
  (val) => (val === '' || val === undefined ? null : val),
  z.coerce.date().nullable()
);

export const MediaTypeSchema = z.enum(['IMAGE', 'VIDEO']);

const optionalUrl = z.string().url('Must be a valid URL').optional();

export const CreateMediaSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  description: z.string().trim().max(1000).optional(),
  type: MediaTypeSchema,
  // A link may be supplied directly; the controller sets these from uploads.
  imageUrl: optionalUrl,
  videoUrl: optionalUrl,
  youtubeUrl: optionalUrl,
  eventDate: optionalDate,
  displayOrder: z.coerce.number().int().min(0).default(0),
  isPublished: booleanLike.default(false),
});

export const UpdateMediaSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').optional(),
    description: z.string().trim().max(1000).optional(),
    type: MediaTypeSchema.optional(),
    imageUrl: optionalUrl,
    videoUrl: optionalUrl,
    youtubeUrl: optionalUrl,
    eventDate: optionalDate.optional(),
    displayOrder: z.coerce.number().int().min(0).optional(),
    isPublished: booleanLike.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'at least one field must be provided',
  });

export type CreateMediaInput = z.infer<typeof CreateMediaSchema>;
export type UpdateMediaInput = z.infer<typeof UpdateMediaSchema>;
