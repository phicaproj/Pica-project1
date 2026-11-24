import { Request, Response } from 'express';
import { CREATED, OK } from '../../service/shared/http';
import catchErrors from '../../service/shared/catchErrors';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialSchema, UpdateTestimonialSchema } from './testimonial.types';
import { uploadObject } from '../storage/beauvision.storage.service';

async function uploadAvatarIfPresent(req: Request): Promise<string | undefined> {
  if (!req.file) return undefined;
  const key = `testimonials/${Date.now()}-${req.file.originalname}`;
  const upload = await uploadObject({
    key,
    body: req.file.buffer,
    contentType: req.file.mimetype,
  });
  return upload.url;
}

export const getTestimonials = catchErrors(async (req: Request, res: Response) => {
  // Only authenticated admins may include inactive items.
  const includeInactive = req.query.all === 'true' && Boolean(req.user);
  const testimonials = await TestimonialService.getAllTestimonials(includeInactive);
  res.status(OK).json({
    status: true,
    message: 'Testimonials retrieved successfully',
    data: testimonials,
  });
});

export const createTestimonial = catchErrors(async (req: Request, res: Response) => {
  const data = CreateTestimonialSchema.parse(req.body);
  const avatarUrl = await uploadAvatarIfPresent(req);
  if (avatarUrl) data.avatarUrl = avatarUrl;

  const testimonial = await TestimonialService.createTestimonial(data);
  res.status(CREATED).json({
    status: true,
    message: 'Testimonial created successfully',
    data: testimonial,
  });
});

export const updateTestimonial = catchErrors(async (req: Request, res: Response) => {
  const data = UpdateTestimonialSchema.parse(req.body);
  const avatarUrl = await uploadAvatarIfPresent(req);
  if (avatarUrl) data.avatarUrl = avatarUrl;

  const testimonial = await TestimonialService.updateTestimonial(
    req.params.id as string,
    data
  );
  res.status(OK).json({
    status: true,
    message: 'Testimonial updated successfully',
    data: testimonial,
  });
});

export const deleteTestimonial = catchErrors(async (req: Request, res: Response) => {
  const result = await TestimonialService.deleteTestimonial(req.params.id as string);
  res.status(OK).json({
    status: true,
    message: result.message,
  });
});
