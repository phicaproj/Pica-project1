import { Request, Response } from 'express';
import { BlogService } from './blog.service';
import { CREATED, OK, BAD_REQUEST, UNAUTHORIZED } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { CreateBlogSchema, UpdateBlogSchema } from './blog.types';
import { uploadObject, deleteObject, buildPublicUrl } from '../storage/beauvision.storage.service';
import AppError from '../../service/shared/appError';
import crypto from 'crypto';

function generateSlug(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') +
    '-' +
    crypto.randomBytes(3).toString('hex')
  );
}

export const createBlog = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }

  const parsed = CreateBlogSchema.parse(req.body);

  if (!req.file) {
    throw new AppError('Cover image is required', BAD_REQUEST);
  }

  const key = `blogs/${Date.now()}-${req.file.originalname}`;
  const upload = await uploadObject({
    key,
    body: req.file.buffer,
    contentType: req.file.mimetype,
  });

  const blog = await BlogService.createBlog({
    ...parsed,
    slug: generateSlug(parsed.title),
    coverImageUrl: upload.url,
    authorId: req.user.id,
  });

  res.status(CREATED).json({
    status: true,
    message: 'Blog created successfully',
    data: blog,
  });
});

export const getBlogs = catchErrors(async (req: Request, res: Response) => {
  const includeUnpublished = req.query.all === 'true';
  const blogs = await BlogService.getAllBlogs(includeUnpublished);
  res.status(OK).json({
    status: true,
    message: 'Blogs retrieved successfully',
    data: blogs,
  });
});

export const getBlogBySlug = catchErrors(async (req: Request, res: Response) => {
  const blog = await BlogService.getBlogBySlug(req.params.slug as string);
  res.status(OK).json({
    status: true,
    message: 'Blog retrieved successfully',
    data: blog,
  });
});

export const updateBlog = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }

  const parsed = UpdateBlogSchema.parse(req.body);
  const updateData: any = { ...parsed };

  // Generate new slug if title is updated
  if (parsed.title) {
    updateData.slug = generateSlug(parsed.title);
  }

  if (req.file) {
    // If there's an existing image, we ideally delete it but for simplicity just upload the new one
    const key = `blogs/${Date.now()}-${req.file.originalname}`;
    const upload = await uploadObject({
      key,
      body: req.file.buffer,
      contentType: req.file.mimetype,
    });
    updateData.coverImageUrl = upload.url;
  }

  const blog = await BlogService.updateBlog(req.params.id as string, updateData);
  res.status(OK).json({
    status: true,
    message: 'Blog updated successfully',
    data: blog,
  });
});

export const deleteBlog = catchErrors(async (req: Request, res: Response) => {
  if (!req.user?.id) {
    throw new AppError('User not authenticated', UNAUTHORIZED);
  }

  const result = await BlogService.deleteBlog(req.params.id as string);

  res.status(OK).json({
    status: true,
    message: result.message,
  });
});
