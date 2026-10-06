import z from 'zod';

export const CreateBlogSchema = z.object({
  title: z.string().min(3, 'Title is required').max(200),
  excerpt: z.string().min(10, 'Excerpt is required').max(500),
  content: z.string().min(10, 'Content is required'),
  isPublished: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true').optional(),
});

export const UpdateBlogSchema = CreateBlogSchema.partial();

export interface IBlogCreate {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  authorId: string;
  isPublished?: boolean;
}
